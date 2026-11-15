import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { checkConfiguration } from '../../src/adapters/demo-data.ts';
import { validateMission, validatePackets, validateScenario } from '../../src/adapters/validators.generated.js';
import { latestReading, subjectKey } from '../../src/domain/metrics.ts';
import type { FollowUpEvent, ReplayData } from '../../src/domain/types.ts';
import { appendFollowUp, listWork } from '../../src/services/follow-up.ts';
import { createReplay } from '../../src/services/replay.ts';
import { isPlaying, newSession, position } from '../../src/services/session.ts';

function fixture(path: string): unknown {
  return JSON.parse(readFileSync(new URL('../../public/' + path, import.meta.url), 'utf8'));
}

const mission = fixture('data/mission.json');
const scenario = fixture('simulation/eva-return.json');
const personal = fixture('simulation/streams/personal.json');
const environment = fixture('simulation/streams/environment.json');
assert.ok(validateMission(mission), JSON.stringify(validateMission.errors));
assert.ok(validateScenario(scenario), JSON.stringify(validateScenario.errors));
assert.ok(validatePackets(personal), JSON.stringify(validatePackets.errors));
assert.ok(validatePackets(environment), JSON.stringify(validatePackets.errors));
checkConfiguration(mission, scenario);
const data: ReplayData = { mission, scenario, packets: [...personal, ...environment] };
const replay = createReplay(data);

test('The published fixtures match the contracts and discard the known duplicate', () => {
  assert.equal(replay.duplicateCount, 1);
  assert.equal(replay.rejectedCount, 0);
  assert.equal(validatePackets([{ ...personal[0], origin: 'live' }]), false);
  assert.throws(() => checkConfiguration(mission, { ...scenario, defaultCrewId: 'missing' }), /briefing/);
});

test('A packet cannot write someone else’s data or use an incompatible unit', () => {
  const wrongCrew = { ...personal[0], subject: { type: 'crew' as const, id: 'maya' } };
  const wrongUnit = { ...personal[0], measurements: [{ ...personal[0].measurements[0], unit: 'kPa' }] };
  const invalid = createReplay({ ...data, packets: [wrongCrew, wrongUnit] });
  assert.equal(invalid.rejectedCount, 2);
  assert.equal(invalid.snapshot(108).readings.size, 0);
});

test('Crew location and breathing zone remain distinct at the airlock', () => {
  assert.equal(replay.snapshot(25).context.alex.breathingZoneId, 'lander');
  assert.equal(replay.snapshot(46).context.alex.breathingZoneId, 'suit-alex');
  assert.equal(replay.snapshot(80).context.alex.zoneId, 'airlock');
  assert.equal(replay.snapshot(80).context.alex.breathingZoneId, 'suit-alex');
  assert.equal(replay.snapshot(108).context.alex.breathingZoneId, 'habitat');
  assert.equal(replay.snapshot(46).alerts.some(item => item.kind === 'personal'), false, 'Working readings must not trigger a resting rule');
});

test('Delayed packets update history without replacing a newer measurement', () => {
  const maya = { type: 'crew' as const, id: 'maya' };
  const lost = latestReading(replay.snapshot(108), mission.devices, maya, 'heart_rate');
  assert.equal(lost.status, 'stale');
  assert.equal(lost.reading?.measuredAtS, 78);
  const snapshot = replay.snapshot(158);
  const current = latestReading(snapshot, mission.devices, maya, 'heart_rate');
  assert.equal(current.status, 'fresh');
  assert.equal(current.reading?.measuredAtS, 156);
  assert.equal(snapshot.latestPackets.get('wrist-maya')?.measuredAtS, 84);
  assert.equal(snapshot.latestPackets.get('wrist-maya')?.receivedAtS, 158);
  assert.ok(snapshot.readings.get(subjectKey(maya, 'heart_rate'))?.some(item => item.measuredAtS === 84 && item.receivedAtS === 158));
});

test('Missing and degraded sensor channels create device-specific alerts', () => {
  const modified = createReplay({ ...data, packets: data.packets
    .filter(packet => packet.deviceId !== 'suit-air-alex')
    .map(packet => packet.deviceId === 'air-rover' && packet.measuredAtS === 16 ? {
      ...packet, measurements: packet.measurements.map(item => item.metric === 'pressure' ? { ...item, quality: 'degraded' } : item),
    } : packet),
  });
  const alerts = (atS: number) => modified.snapshot(atS).alerts.filter(item => item.kind === 'sensor');
  assert.equal(alerts(16).length, 0);
  const roverFault = alerts(17)[0];
  assert.equal(roverFault.deviceId, 'air-rover');
  assert.deepEqual(roverFault.crewIds, ['samira']);
  assert.deepEqual(roverFault.evidence.map(item => item.metric), ['pressure']);
  assert.equal(alerts(24).length, 1);
  const silentSuit = alerts(25).find(item => item.deviceId === 'suit-air-alex');
  assert.equal(silentSuit?.atS, 25);
  assert.deepEqual(silentSuit?.evidence, []);
  assert.deepEqual(replay.snapshot(153).alerts.filter(item => item.kind === 'sensor').map(item => item.id), ['signal-maya']);
});

test('The incident is grouped by breathing zone and a crew report stays separate', () => {
  assert.equal(replay.snapshot(90).alerts.filter(item => item.kind === 'environment').length, 0);
  const snapshot = replay.snapshot(108);
  const air = snapshot.alerts.filter(item => item.kind === 'environment');
  assert.equal(air.length, 1);
  assert.deepEqual([...air[0].crewIds].sort(), ['alex', 'maya', 'noah']);
  assert.equal(air[0].evidence.length, 2);
  assert.equal(snapshot.alerts.filter(item => item.kind === 'concern').length, 1);
  assert.equal(replay.snapshot(140).links.local, false);
  assert.equal(replay.snapshot(157).links.local, true);
  assert.equal(replay.snapshot(157).links.earth, false);
  assert.equal(replay.snapshot(174).links.earth, true);
});

test('Playback time is bounded and resumes from a saved anchor', () => {
  const session = { ...newSession(scenario), speed: 4 as const, playingSince: 1000 };
  assert.equal(position(session, scenario, 6000), 128);
  assert.equal(position(session, scenario, 601000), scenario.durationS);
  assert.equal(isPlaying(session, scenario, 601000), false);
});

test('A handoff retains ownership, progress and confirmation across events', () => {
  let session = newSession(scenario);
  const apply = (event: FollowUpEvent, atS = 108) => {
    session = appendFollowUp(session, event, mission, replay.snapshot(atS));
  };
  const targetId = 'air-habitat';
  const work = (atS = 108) => listWork(mission, replay.snapshot(atS), session).find(item => item.id === targetId)!;
  apply({ type: 'acknowledge', targetId });
  assert.equal(work().progress.status, 'acknowledged');
  apply({ type: 'open', targetId });
  apply({ type: 'step', targetId, step: 0 });
  apply({ type: 'pause', targetId });
  assert.equal(work().progress.status, 'paused');
  apply({ type: 'resume', targetId });
  apply({ type: 'step', targetId, step: 1 });
  assert.throws(() => apply({ type: 'step', targetId, step: 2 }), /Assign/);
  apply({ type: 'assign', targetId, assigneeId: 'noah' });
  apply({ type: 'request-support', targetId }, 140);
  assert.throws(() => apply({ type: 'receipt', targetId }, 155), /assigned crew member/);
  session = { ...session, crewId: 'noah' };
  assert.throws(() => apply({ type: 'receipt', targetId }, 140), /local link/);
  apply({ type: 'receipt', targetId }, 155);
  apply({ type: 'outcome', targetId, outcome: 'verified' }, 155);
  apply({ type: 'step', targetId, step: 2 }, 155);
  assert.equal(work(155).progress.status, 'complete');
  assert.equal(work(155).progress.receipt, 'confirmed');
  assert.equal(work(155).progress.assigneeId, 'noah');
});

test('Plan windows use the observed phase, and a manual concern captures its zone', () => {
  const session = newSession(scenario);
  const earlier = listWork(mission, replay.snapshot(76), session);
  assert.equal(earlier.find(item => item.id === 'task-alex-recovery')?.available, false);
  assert.throws(() => appendFollowUp(session, { type: 'open', targetId: 'task-alex-recovery' }, mission, replay.snapshot(76)), /activity window/);
  const sampled = replay.snapshot(84);
  const report = appendFollowUp(session, { type: 'report', targetId: 'report-001', category: 'Feeling unwell' }, mission, sampled);
  const later = listWork(mission, replay.snapshot(108), report);
  assert.equal(later.find(item => item.id === 'report-001')?.alert?.zoneId, 'airlock');
  assert.equal(later.find(item => item.id === 'task-alex-recovery')?.available, true);
});
