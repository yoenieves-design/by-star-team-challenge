import assert from 'node:assert/strict';
import test from 'node:test';
import type { FollowUpEvent, Mission, Packet, ReplayData, Scenario } from '../../src/domain/types.ts';
import { appendFollowUp, isWorkPending, listWork, progressFor, type WorkItem } from '../../src/services/follow-up.ts';
import { conditionForAlert } from '../../src/services/monitoring.ts';
import { createReplay } from '../../src/services/replay.ts';
import { newSession } from '../../src/services/session.ts';

function setup(): ReplayData {
  const context = { zoneId: 'habitat', breathingZoneId: 'habitat', phase: 'routine' as const, activity: 'Seated rest', resting: true };
  const mission: Mission = {
    schemaVersion: 1, code: 'TEST', name: 'Lifecycle test', location: 'Habitat', missionDay: 1, startUtc: '2026-01-01T00:00:00Z',
    crew: ['alex', 'noah'].map(id => ({ id, name: id, role: id === 'noah' ? 'Crew medical officer' : 'Crew', tone: 'fern',
      buddyId: id === 'alex' ? 'noah' : 'alex', reference: { restingHeartRate: 60, basis: 'Synthetic test reference' } })),
    zones: [{ id: 'habitat', name: 'Habitat', kind: 'Habitat', equipment: [] }],
    devices: [{ id: 'wrist-alex', name: 'Test wrist', subject: { type: 'crew', id: 'alex' }, metrics: ['heart_rate'], maxAgeS: 6 }],
    tasks: [], sources: [], rules: { version: 'Demo test', co2RiseKpa: 0.1, co2WindowS: 5, restingPulseDeltaBpm: 20 },
    procedures: ['sensor-check', 'crew-review', 'air-review'].map(id => ({ id, version: 'Test', title: 'Review', purpose: 'Test review',
      requiredEquipment: [], sourceIds: [], steps: [{ title: 'Check', instruction: 'Review source.' }, { title: 'Record', instruction: 'Record outcome.' }] })),
  };
  const scenario: Scenario = { schemaVersion: 1, id: 'lifecycle-test', title: 'Lifecycle', durationS: 40, briefingAtS: 8,
    defaultCrewId: 'alex', initialContext: { alex: context, noah: context }, milestones: [], events: [] };
  return { mission, scenario, packets: [pulse(0)] };
}

function pulse(atS: number): Packet {
  return { schemaVersion: 1, id: 'pulse-' + atS, sequence: atS, deviceId: 'wrist-alex', subject: { type: 'crew', id: 'alex' },
    measuredAtS: atS, receivedAtS: atS, origin: 'synthetic', measurements: [{ metric: 'heart_rate', value: 60, unit: 'bpm', quality: 'good' }] };
}

test('Review outcomes preserve unresolved work and reopening keeps its history', () => {
  const data = setup();
  const snapshot = createReplay(data).snapshot(8);
  let session = newSession(data.scenario);
  const targetId = 'signal-alex';
  const apply = (event: FollowUpEvent) => { session = appendFollowUp(session, event, data.mission, snapshot); };
  const work = () => listWork(data.mission, snapshot, session).find(item => item.id === targetId)!;
  apply({ type: 'open', targetId });
  apply({ type: 'step', targetId, step: 0 });
  assert.throws(() => apply({ type: 'step', targetId, step: 1 }), /outcome/);
  apply({ type: 'outcome', targetId, outcome: 'unable-to-verify' });
  apply({ type: 'step', targetId, step: 1 });
  assert.equal(work().progress.status, 'complete');
  assert.equal(isWorkPending(work()), true);
  assert.throws(() => apply({ type: 'outcome', targetId, outcome: 'verified' }), /Reopen/);
  const previousEvents = work().progress.log.length;
  apply({ type: 'reopen', targetId });
  assert.equal(work().progress.status, 'in-progress');
  assert.equal(work().progress.step, 0);
  assert.equal(work().progress.outcome, undefined);
  assert.equal(work().progress.log.length, previousEvents + 1);
  apply({ type: 'step', targetId, step: 0 });
  apply({ type: 'outcome', targetId, outcome: 'verified' });
  apply({ type: 'step', targetId, step: 1 });
  assert.equal(isWorkPending(work()), true, 'Verifying the review cannot erase the active sensor issue');
});

test('Sensor recovery creates a distinct recurrent episode only after two new samples', () => {
  const data = setup();
  const replay = createReplay({ ...data, packets: [pulse(0), pulse(10), pulse(12), pulse(30), pulse(32)] });
  const first = replay.snapshot(8).alerts.find(alert => alert.id === 'signal-alex')!;
  assert.equal(first.conditionEndedAtS, undefined, 'A snapshot must not expose future recovery');
  const recovered = replay.snapshot(12).alerts.find(alert => alert.id === 'signal-alex')!;
  assert.equal(recovered.conditionEndedAtS, 12);
  const episodes = replay.snapshot(20).alerts.filter(alert => alert.kind === 'sensor');
  assert.deepEqual(episodes.map(alert => alert.id), ['signal-alex', 'signal-alex-episode-19']);
  assert.equal(conditionForAlert(data.mission, replay.snapshot(20), episodes[0]).status, 'no-longer-detected');
  assert.equal(conditionForAlert(data.mission, replay.snapshot(20), episodes[1]).status, 'active');
  const briefRecovery = createReplay({ ...data, packets: [pulse(0), pulse(10)] });
  assert.equal(briefRecovery.snapshot(20).alerts.filter(alert => alert.kind === 'sensor').length, 1,
    'One isolated packet must not split a continuing connection issue into multiple incidents');
});

test('An elevated environmental plateau stays active after the rising window ends', () => {
  const data = setup();
  data.mission.devices = [{ id: 'air', name: 'Air monitor', subject: { type: 'zone', id: 'habitat' }, metrics: ['carbon_dioxide'], maxAgeS: 6 }];
  const values = [[0, 0.4], [2, 0.6], [4, 0.6], [6, 0.6], [8, 0.6], [10, 0.6], [12, 0.43], [14, 0.42], [16, 0.58]];
  data.packets = values.map(([atS, value]) => ({ ...pulse(atS), id: 'air-' + atS, deviceId: 'air', subject: { type: 'zone', id: 'habitat' },
    measurements: [{ metric: 'carbon_dioxide', value, unit: 'kPa', quality: 'good' }] }));
  const replay = createReplay(data);
  const plateau = replay.snapshot(10);
  const alert = plateau.alerts.find(item => item.kind === 'environment')!;
  assert.equal(conditionForAlert(data.mission, plateau, alert).status, 'active');
  const partialRecovery = replay.snapshot(12);
  assert.equal(conditionForAlert(data.mission, partialRecovery, partialRecovery.alerts.find(item => item.id === alert.id)!).status, 'unknown');
  assert.deepEqual(replay.snapshot(16).alerts.filter(item => item.kind === 'environment').map(item => item.id),
    ['air-habitat', 'air-habitat-episode-16']);
});

test('Resting comparisons wait for new observations after an activity transition', () => {
  const data = setup();
  data.scenario.events = [
    { type: 'context', atS: 5, crewId: 'alex', context: { ...data.scenario.initialContext.alex, activity: 'Working', resting: false } },
    { type: 'context', atS: 9, crewId: 'alex', context: data.scenario.initialContext.alex },
  ];
  data.packets = [[0, 60], [2, 90], [4, 90], [6, 120], [8, 120], [10, 60], [12, 60], [14, 90], [16, 90]]
    .map(([atS, value]) => ({ ...pulse(atS), measurements: [{ metric: 'heart_rate', value, unit: 'bpm', quality: 'good' }] }));
  const replay = createReplay(data);
  const earlier = replay.snapshot(9);
  const alert = earlier.alerts.find(item => item.id === 'pulse-alex')!;
  assert.equal(conditionForAlert(data.mission, earlier, alert).status, 'unknown', 'An earlier working sample cannot be used as a resting confirmation');
  const recovered = replay.snapshot(12);
  assert.equal(conditionForAlert(data.mission, recovered, recovered.alerts.find(item => item.id === alert.id)!).status, 'no-longer-detected');
  assert.deepEqual(replay.snapshot(16).alerts.filter(item => item.kind === 'personal').map(item => item.id),
    ['pulse-alex', 'pulse-alex-episode-16']);
});

test('Check-ins retain self-reported context and only an explicit concern creates a review', () => {
  const data = setup();
  const snapshot = createReplay(data).snapshot(8);
  let session = newSession(data.scenario);
  const check = { type: 'check-in' as const, targetId: 'checkin-1', sleep: 'poor' as const, fatigue: 'high' as const, concern: 'None', onset: 'unsure' as const };
  session = appendFollowUp(session, check, data.mission, snapshot);
  assert.equal(session.activity.at(-1)?.actorId, 'alex');
  assert.equal(session.activity.at(-1)?.atS, 8);
  assert.equal(session.activity.at(-1)?.zoneId, 'habitat');
  assert.equal(listWork(data.mission, snapshot, session).some(item => item.id === check.targetId), false);
  session = appendFollowUp(session, { ...check, targetId: 'checkin-2', concern: 'Vision or balance concern', onset: 'now' }, data.mission, snapshot);
  const report = listWork(data.mission, snapshot, session).find(item => item.id === 'checkin-2')!;
  assert.equal(report.detail, 'Vision or balance concern');
  assert.match(report.alert!.reason, /sleep poor, fatigue high, onset now/);
  assert.equal(report.condition?.status, 'reported');
  const before = session.activity.length;
  session = appendFollowUp(session, { ...check, targetId: 'checkin-2' }, data.mission, snapshot);
  assert.equal(session.activity.length, before, 'Repeated delivery of one check-in is idempotent');
});

test('External clinical work uses the shared log and requires the assigned reviewer and a ready report', () => {
  const data = setup();
  const snapshot = createReplay(data).snapshot(8);
  let session = newSession(data.scenario);
  const report: WorkItem = { id: 'clinical-report-1', title: 'Report', detail: 'Synthetic report', crewIds: ['alex'],
    procedure: data.mission.procedures[0], progress: progressFor([], 2), available: true, clinical: true, requiredReviewerId: 'noah' };
  const apply = (event: FollowUpEvent, extra = report) => { session = appendFollowUp(session, event, data.mission, snapshot, [extra]); };
  const targetId = report.id;
  assert.throws(() => apply({ type: 'open', targetId }), /medical reviewer/);
  session = { ...session, crewId: 'noah' };
  assert.throws(() => apply({ type: 'open', targetId }, { ...report, available: false }), /not ready/);
  apply({ type: 'open', targetId });
  apply({ type: 'step', targetId, step: 0 });
  apply({ type: 'outcome', targetId, outcome: 'verified' });
  apply({ type: 'step', targetId, step: 1 });
  const work = listWork(data.mission, snapshot, session, [report]).find(item => item.id === targetId)!;
  assert.equal(work.progress.status, 'complete');
  assert.equal(isWorkPending(work), false);
  assert.ok(work.progress.log.every(event => event.actorId === 'noah'));
});

test('Legacy saved completion is retained with an unspecified outcome', () => {
  const progress = progressFor([{ type: 'step', targetId: 'legacy', step: 1, actorId: 'alex', atS: 3 }], 2);
  assert.equal(progress.status, 'complete');
  assert.equal(progress.outcome, undefined);
});

test('A routine requires a current check-in from its subject and respects a changed mission phase', () => {
  const data = setup();
  data.mission.procedures[0].steps[0].requiresCheckIn = true;
  data.mission.tasks = [{ id: 'check', title: 'Recovery check', reason: 'Routine', crewId: 'alex', opensAtS: 5, dueAtS: 20,
    phase: 'routine', procedureId: 'sensor-check' }];
  data.scenario.events = [{ type: 'context', atS: 9, crewId: 'alex',
    context: { ...data.scenario.initialContext.alex, phase: 'eva', resting: false, activity: 'Exterior work' } }];
  const replay = createReplay(data);
  let session = newSession(data.scenario);
  const check = { type: 'check-in' as const, targetId: 'too-early', sleep: 'rested' as const, fatigue: 'low' as const,
    concern: 'None', onset: 'unsure' as const };
  session = appendFollowUp(session, check, data.mission, replay.snapshot(2));
  session = appendFollowUp({ ...session, crewId: 'noah' }, { ...check, targetId: 'wrong-crew' }, data.mission, replay.snapshot(6));
  session = { ...session, crewId: 'alex' };
  const targetId = 'task-check';
  session = appendFollowUp(session, { type: 'open', targetId }, data.mission, replay.snapshot(8));
  const step = { type: 'step' as const, targetId, step: 0 };
  assert.throws(() => appendFollowUp(session, step, data.mission, replay.snapshot(8)), /check-in/);
  session = appendFollowUp(session, { ...check, targetId: 'current-check' }, data.mission, replay.snapshot(8));
  session = appendFollowUp(session, step, data.mission, replay.snapshot(8));
  session = appendFollowUp(session, { type: 'outcome', targetId, outcome: 'verified' }, data.mission, replay.snapshot(8));
  assert.throws(() => appendFollowUp(session, { ...step, step: 1 }, data.mission, replay.snapshot(10)), /activity window/);
  session = appendFollowUp(session, { type: 'pause', targetId }, data.mission, replay.snapshot(10));
  assert.throws(() => appendFollowUp(session, { type: 'resume', targetId }, data.mission, replay.snapshot(10)), /activity window/);
});

test('A support request remains pending after completion and reopening preserves the request', () => {
  const data = setup();
  const snapshot = createReplay(data).snapshot(8);
  let session = newSession(data.scenario);
  const targetId = 'reported-concern';
  const apply = (event: FollowUpEvent) => { session = appendFollowUp(session, event, data.mission, snapshot); };
  const work = () => listWork(data.mission, snapshot, session).find(item => item.id === targetId)!;
  apply({ type: 'report', targetId, category: 'Feeling unwell' });
  apply({ type: 'open', targetId });
  apply({ type: 'assign', targetId, assigneeId: 'noah' });
  apply({ type: 'request-support', targetId });
  apply({ type: 'step', targetId, step: 0 });
  apply({ type: 'outcome', targetId, outcome: 'verified' });
  apply({ type: 'step', targetId, step: 1 });
  assert.equal(work().progress.status, 'complete');
  assert.equal(isWorkPending(work()), true);
  apply({ type: 'reopen', targetId });
  assert.equal(work().progress.receipt, 'requested');
  session = { ...session, crewId: 'noah' };
  apply({ type: 'receipt', targetId });
  apply({ type: 'step', targetId, step: 0 });
  apply({ type: 'outcome', targetId, outcome: 'verified' });
  apply({ type: 'step', targetId, step: 1 });
  assert.equal(isWorkPending(work()), false);
});
