import type { Mission, Session, Snapshot } from '../domain/types.ts';
import { latestReading, metricIds, metrics } from '../domain/metrics.ts';
import type { WorkItem } from './follow-up.ts';
import type { ClinicalData } from '../domain/clinical.ts';
import { clinicalReviewId } from './clinical.ts';
import type { ExerciseData } from '../domain/exercise.ts';
import { exerciseReviewId, exerciseSignalId } from './exercise.ts';

/** Portable, dated evidence for local handoff. Exporting does not send a message. */
export function createReviewSummary(mission: Mission, snapshot: Snapshot, session: Session, work: WorkItem, clinical?: ClinicalData | null, exercise?: ExerciseData | null) {
  const utc = (seconds: number) => new Date(Date.parse(mission.startUtc) + seconds * 1000).toISOString();
  const crew = work.crewIds.map(id => ({
    id, name: mission.crew.find(person => person.id === id)?.name,
    context: snapshot.context[id],
    observations: metricIds.map(metric => {
      const subject = metrics[metric].subjectType === 'crew'
        ? { type: 'crew' as const, id } : { type: 'zone' as const, id: snapshot.context[id].breathingZoneId };
      const current = latestReading(snapshot, mission.devices, subject, metric);
      return { metric, availability: current.status, observation: current.reading ?? null };
    }),
    checkIns: session.activity.filter(event => event.type === 'check-in' && event.actorId === id && event.atS <= snapshot.atS),
  }));
  const report = clinical?.reports.find(item => clinicalReviewId(item) === work.id && item.receivedAtS <= snapshot.atS);
  const currentReport = report ? clinical!.reports.findLast(item => item.orderId === report.orderId && item.receivedAtS <= snapshot.atS) : undefined;
  const clinicalEvidence = report ? {
    report, reviewAvailable: work.available, superseded: currentReport !== report,
    currentReport: currentReport ? { id: currentReport.id, revision: currentReport.revision } : null,
    order: clinical!.orders.find(item => item.id === report.orderId),
    instrument: clinical!.instruments.find(item => item.id === report.instrumentId),
    priorRevisions: clinical!.reports.filter(item => item.id === report.id && item.revision < report.revision && item.receivedAtS <= snapshot.atS),
  } : null;
  const workoutRecord = session.exerciseRecords?.find(item => exerciseReviewId(item) === work.id && item.savedAtS <= snapshot.atS);
  const concern = session.activity.find(event => event.type === 'report' && event.targetId === work.id && event.atS <= snapshot.atS);
  const exerciseId = workoutRecord?.sessionId ?? (concern?.type === 'report' ? concern.exerciseSessionId : undefined);
  const exercisePlan = exercise?.sessions.find(item => item.id === exerciseId || exerciseSignalId(item) === work.id);
  const exerciseEvidence = exercisePlan && exercise ? {
    record: workoutRecord ?? null, plan: exercisePlan,
    equipment: exercise.equipment.find(item => item.id === exercisePlan.equipmentId),
    machinePackets: exercise.packets.filter(item => item.sessionId === exercisePlan.id && item.receivedAtS <= snapshot.atS),
  } : null;
  return {
    schemaVersion: 1, origin: 'synthetic', mission: mission.code,
    snapshotUtc: utc(snapshot.atS), missionStartUtc: mission.startUtc,
    exportedBy: session.crewId, workId: work.id, title: work.title, reason: work.detail,
    procedure: { id: work.procedure.id, version: work.procedure.version },
    workflowStatus: work.progress.status, reviewOutcome: work.progress.outcome ?? 'not-recorded',
    condition: work.condition ?? null, assigneeId: work.progress.assigneeId ?? null,
    receipt: work.progress.receipt, links: snapshot.links,
    originalEvidence: work.alert?.evidence ?? [], clinicalEvidence, exerciseEvidence, crew,
    actions: work.progress.log.map(event => ({ ...event, recordedUtc: utc(event.atS) })),
    note: 'Local fictional demo export. A completed review records actions; clinical interpretation belongs to the mission medical officer.',
  };
}
