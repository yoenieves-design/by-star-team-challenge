import type { Alert, AlertCondition, FollowUpEvent, Mission, OperatorEvent, Procedure, ReviewOutcome, Session, Snapshot, Task } from '../domain/types.ts';
import { concernAlert, conditionForAlert } from './monitoring.ts';

export type Progress = {
  status: 'new' | 'acknowledged' | 'in-progress' | 'paused' | 'complete';
  step: number;
  assigneeId?: string;
  receipt: 'none' | 'requested' | 'confirmed';
  outcome?: ReviewOutcome;
  log: OperatorEvent[];
};

export interface WorkItem {
  id: string;
  title: string;
  detail: string;
  crewIds: string[];
  procedure: Procedure;
  progress: Progress;
  available: boolean;
  alert?: Alert;
  task?: Task;
  condition?: AlertCondition;
  clinical?: boolean;
  requiredReviewerId?: string;
}

/** Review completion and the current monitoring condition are separate facts. */
export function isWorkPending(item: WorkItem): boolean {
  return item.progress.status !== 'complete' || item.progress.outcome !== 'verified'
    || item.progress.receipt === 'requested'
    || item.condition?.status === 'active' || item.condition?.status === 'unknown';
}

export function progressFor(log: OperatorEvent[], steps: number): Progress {
  const progress: Progress = { status: 'new', step: 0, receipt: 'none', log };
  for (const event of log) {
    switch (event.type) {
      case 'acknowledge':
        if (progress.status === 'new') progress.status = 'acknowledged';
        break;
      case 'assign':
        if (progress.assigneeId !== event.assigneeId) progress.receipt = 'none';
        progress.assigneeId = event.assigneeId;
        break;
      case 'open':
      case 'resume':
        progress.status = 'in-progress';
        break;
      case 'step':
        progress.step = event.step + 1;
        progress.status = progress.step === steps ? 'complete' : 'in-progress';
        break;
      case 'outcome':
        progress.outcome = event.outcome;
        break;
      case 'reopen':
        progress.status = 'in-progress';
        progress.step = 0;
        progress.outcome = undefined;
        break;
      case 'pause':
        progress.status = 'paused';
        break;
      case 'request-support':
        progress.receipt = 'requested';
        break;
      case 'receipt':
        progress.receipt = 'confirmed';
        break;
    }
  }
  return progress;
}

export function listWork(mission: Mission, snapshot: Snapshot, session: Session, additionalWork: WorkItem[] = []): WorkItem[] {
  const log = session.activity.filter(event => event.atS <= snapshot.atS);
  const reports = log.flatMap(event => {
    if (event.type === 'report') return [concernAlert(event.targetId, event.actorId, event.category, event.atS, event.zoneId)];
    if (event.type !== 'check-in' || event.concern === 'None') return [];
    const alert = concernAlert(event.targetId, event.actorId, event.concern, event.atS, event.zoneId);
    alert.reason = 'Crew check-in: sleep ' + event.sleep + ', fatigue ' + event.fatigue + ', onset ' + event.onset + '. Self-reported context.';
    return [alert];
  });
  function withProcedure(id: string, procedureId: string) {
    const procedure = mission.procedures.find(item => item.id === procedureId)!;
    return { procedure, progress: progressFor(log.filter(event => event.targetId === id), procedure.steps.length) };
  }
  const alerts = [...snapshot.alerts, ...reports].map(alert => ({
    id: alert.id, title: alert.title, detail: alert.detail, crewIds: alert.crewIds, available: true, alert,
    condition: conditionForAlert(mission, snapshot, alert),
    ...withProcedure(alert.id, alert.procedureId),
  }));
  const tasks = mission.tasks.map(task => {
    const id = 'task-' + task.id;
    const phase = snapshot.context[task.crewId].phase;
    const available = task.opensAtS <= snapshot.atS && (!task.phase || task.phase === phase);
    return { id, title: task.title, detail: task.reason, crewIds: [task.crewId], available, task, ...withProcedure(id, task.procedureId) };
  });
  const base = [...alerts, ...tasks];
  const ids = new Set(base.map(item => item.id));
  return [...base, ...additionalWork.filter(item => !ids.has(item.id)).map(item => ({
    ...item, progress: progressFor(log.filter(event => event.targetId === item.id), item.procedure.steps.length),
  }))];
}

export function appendFollowUp(session: Session, event: FollowUpEvent, mission: Mission, snapshot: Snapshot,
  additionalWork: WorkItem[] = []): Session {
  if (event.type === 'report' || event.type === 'check-in') {
    if (session.activity.some(item => item.targetId === event.targetId)) return session;
    if (!event.targetId.trim()) throw new Error('This report needs a record identifier.');
    if (event.type === 'check-in' && (!['rested', 'mixed', 'poor'].includes(event.sleep)
      || !['low', 'moderate', 'high'].includes(event.fatigue) || !['now', 'earlier', 'unsure'].includes(event.onset)
      || !['None', 'Feeling unwell', 'Vision or balance concern', 'Pain or injury', 'Device concern', 'Other concern'].includes(event.concern))) {
      throw new Error('Choose the check-in options before saving.');
    }
    const report = { ...event, atS: snapshot.atS, actorId: session.crewId, zoneId: snapshot.context[session.crewId].zoneId };
    return { ...session, activity: [...session.activity, report] };
  }
  const item = listWork(mission, snapshot, session, additionalWork).find(work => work.id === event.targetId);
  if (!item) throw new Error('That follow-up is not available in this replay.');
  const progress = item.progress;
  if (progress.status === 'complete' && event.type !== 'receipt' && event.type !== 'reopen') throw new Error('Reopen this review before changing its result.');
  const reviewAction = ['open', 'resume', 'step', 'outcome', 'reopen'].includes(event.type);
  if (item.requiredReviewerId && reviewAction && item.requiredReviewerId !== session.crewId) {
    throw new Error('The assigned medical reviewer must review this report from their crew profile.');
  }
  if (item.clinical && reviewAction && !item.available) throw new Error('This clinical report is not ready for review.');

  switch (event.type) {
    case 'acknowledge':
      if (progress.status !== 'new') return session;
      break;
    case 'assign':
      if (!mission.crew.some(person => person.id === event.assigneeId)) throw new Error('Select a crew member for the handoff.');
      if (progress.assigneeId === event.assigneeId) return session;
      break;
    case 'open':
      if (!item.available) throw new Error('This task is outside its planned activity window.');
      if (progress.status === 'in-progress') return session;
      if (progress.status === 'paused') throw new Error('Resume the paused procedure.');
      break;
    case 'step': {
      if (progress.status !== 'in-progress' || event.step !== progress.step || event.step >= item.procedure.steps.length) {
        throw new Error('The procedure has changed. Review the current step.');
      }
      if (item.task && !item.available) throw new Error('This task is outside its planned activity window. Review the current mission plan.');
      const equipment = mission.zones.find(zone => zone.id === snapshot.context[session.crewId].zoneId)?.equipment ?? [];
      if (item.procedure.requiredEquipment.some(tool => !equipment.includes(tool))) throw new Error('Required equipment is unavailable at this location.');
      if (item.procedure.steps[event.step].requiresAssignee && !progress.assigneeId) throw new Error('Assign the handoff before confirming this step.');
      if (item.procedure.steps[event.step].requiresCheckIn) {
        const crewId = item.task?.crewId ?? item.crewIds[0];
        const opensAtS = item.task?.opensAtS ?? 0;
        const recorded = session.activity.some(entry => entry.type === 'check-in' && entry.actorId === crewId
          && entry.atS >= opensAtS && entry.atS <= snapshot.atS);
        if (!recorded) throw new Error('Record a check-in for the assigned crew member before confirming this step.');
      }
      if (event.step === item.procedure.steps.length - 1 && !progress.outcome) throw new Error('Record a review outcome before completing the follow-up.');
      break;
    }
    case 'outcome':
      if (progress.status !== 'in-progress') throw new Error('Start or resume this review before recording its outcome.');
      if (!['verified', 'unable-to-verify', 'further-review'].includes(event.outcome)) throw new Error('Select a review outcome.');
      break;
    case 'reopen':
      if (progress.status !== 'complete') throw new Error('Only a completed review can be reopened.');
      if (!item.available) throw new Error('This task is outside its planned activity window.');
      break;
    case 'pause':
      if (progress.status !== 'in-progress') return session;
      break;
    case 'resume':
      if (progress.status !== 'paused') return session;
      if (item.task && !item.available) throw new Error('This task is outside its planned activity window. Review the current mission plan.');
      break;
    case 'request-support':
      if (!progress.assigneeId) throw new Error('Assign someone before requesting support.');
      if (progress.receipt !== 'none') return session;
      break;
    case 'receipt':
      if (!snapshot.links.local || progress.receipt !== 'requested' || progress.assigneeId !== session.crewId) {
        throw new Error('Only the assigned crew member can confirm receipt while the local link is available.');
      }
      break;
  }
  return { ...session, activity: [...session.activity, { ...event, atS: snapshot.atS, actorId: session.crewId }] };
}
