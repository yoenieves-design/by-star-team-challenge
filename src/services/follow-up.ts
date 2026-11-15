import type { Alert, FollowUpEvent, Mission, OperatorEvent, Procedure, Session, Snapshot, Task } from '../domain/types.ts';
import { concernAlert } from './monitoring.ts';

export type Progress = {
  status: 'new' | 'acknowledged' | 'in-progress' | 'paused' | 'complete';
  step: number;
  assigneeId?: string;
  receipt: 'none' | 'requested' | 'confirmed';
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

export function listWork(mission: Mission, snapshot: Snapshot, session: Session): WorkItem[] {
  const log = session.activity.filter(event => event.atS <= snapshot.atS);
  const reports = log.filter(event => event.type === 'report').map(event =>
    concernAlert(event.targetId, event.actorId, event.category, event.atS, event.zoneId));
  function withProcedure(id: string, procedureId: string) {
    const procedure = mission.procedures.find(item => item.id === procedureId)!;
    return { procedure, progress: progressFor(log.filter(event => event.targetId === id), procedure.steps.length) };
  }
  const alerts = [...snapshot.alerts, ...reports].map(alert => ({
    id: alert.id, title: alert.title, detail: alert.detail, crewIds: alert.crewIds, available: true, alert,
    ...withProcedure(alert.id, alert.procedureId),
  }));
  const tasks = mission.tasks.map(task => {
    const id = 'task-' + task.id;
    const phase = snapshot.context[task.crewId].phase;
    const available = task.opensAtS <= snapshot.atS && (!task.phase || task.phase === phase);
    return { id, title: task.title, detail: task.reason, crewIds: [task.crewId], available, task, ...withProcedure(id, task.procedureId) };
  });
  return [...alerts, ...tasks];
}

export function appendFollowUp(session: Session, event: FollowUpEvent, mission: Mission, snapshot: Snapshot): Session {
  if (event.type === 'report') {
    if (session.activity.some(item => item.targetId === event.targetId)) return session;
    const report = { ...event, atS: snapshot.atS, actorId: session.crewId, zoneId: snapshot.context[session.crewId].zoneId };
    return { ...session, activity: [...session.activity, report] };
  }
  const item = listWork(mission, snapshot, session).find(work => work.id === event.targetId);
  if (!item) throw new Error('That follow-up is not available in this replay.');
  const progress = item.progress;
  if (progress.status === 'complete' && event.type !== 'receipt') throw new Error('This follow-up is already complete.');

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
      const equipment = mission.zones.find(zone => zone.id === snapshot.context[session.crewId].zoneId)?.equipment ?? [];
      if (item.procedure.requiredEquipment.some(tool => !equipment.includes(tool))) throw new Error('Required equipment is unavailable at this location.');
      if (item.procedure.steps[event.step].requiresAssignee && !progress.assigneeId) throw new Error('Assign the handoff before confirming this step.');
      break;
    }
    case 'pause':
      if (progress.status !== 'in-progress') return session;
      break;
    case 'resume':
      if (progress.status !== 'paused') return session;
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
