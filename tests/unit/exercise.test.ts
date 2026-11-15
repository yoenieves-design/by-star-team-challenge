import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ExercisePacket, ExercisePlan } from '../../src/domain/exercise.ts';
import type { Mission, Packet, Quality, Scenario } from '../../src/domain/types.ts';
import { exerciseReviewId, exerciseSignalId, exerciseSnapshot, exerciseWork, saveExerciseRecord, validateExerciseData } from '../../src/services/exercise.ts';
import { createReplay } from '../../src/services/replay.ts';
import { newSession } from '../../src/services/session.ts';

function fixture<T>(path: string): T {
  return JSON.parse(readFileSync(new URL('../../public/' + path, import.meta.url), 'utf8')) as T;
}

const mission = fixture<Mission>('data/mission.json');
const scenario = fixture<Scenario>('simulation/eva-return.json');
const plan = fixture<ExercisePlan>('data/exercise-plan.json');
const stream = fixture<ExercisePacket[]>('simulation/streams/exercise.json');
const data = validateExerciseData(plan, stream, mission, scenario);
const assigned = data.sessions[0];
const session = { ...newSession(scenario), crewId: 'yoe' };

function pulse(atS: number, value: number | null, quality: Quality = 'good', receivedAtS = atS + 1): Packet {
  return {
    schemaVersion: 1, id: 'test-pulse-' + atS, sequence: atS, deviceId: 'chest-yoe', subject: { type: 'crew', id: 'yoe' },
    measuredAtS: atS, receivedAtS, origin: 'synthetic', measurements: [{ metric: 'heart_rate', value, unit: 'bpm', quality }],
  };
}

const replay = createReplay({ mission, scenario, packets: [
  pulse(24, 200), pulse(30, 100), pulse(36, 155, 'degraded'), pulse(42, null, 'unavailable'),
  pulse(48, 180, 'good', 70), pulse(54, 122), pulse(102, 130), pulse(108, 126), pulse(150, 132, 'good', 154), pulse(210, 110),
] });

test('The exercise plan and machine channels follow the same replay time as body observations', () => {
  const view = (atS: number) => exerciseSnapshot(data, replay.snapshot(atS), 'yoe')!;
  assert.equal(exerciseSnapshot(data, replay.snapshot(108), 'alex'), null);
  assert.equal(view(19).phase, 'scheduled');
  assert.equal(view(20).bodyMass, undefined);
  assert.equal(view(21).bodyMass?.value, 78.4);
  assert.equal(view(30).phase, 'warmup');
  assert.equal(view(30).machine.power.status, 'unavailable');
  assert.equal(view(31).machine.power.reading?.unit, 'W');
  assert.equal(view(60).phase, 'steady');
  assert.equal(view(108).machine.cadence.status, 'stale');
  assert.equal(view(108).machine.cadence.reading?.measuredAtS, 84);
  assert.equal(view(108).body.heartRate.status, 'fresh');
  assert.equal(view(108).body.heartRate.reading?.deviceId, 'chest-yoe');
  assert.equal(view(108).body.heartRate.reading?.measuredAtS, 102);
  assert.equal(view(115).machine.power.reading?.measuredAtS, 114);
  assert.equal(view(153).phase, 'cooldown');
  assert.ok(view(153).machineSeries.every(item => item.receivedAtS < 154));
  assert.equal(view(154).machine.power.reading?.measuredAtS, 150);
  assert.equal(view(154).machine.power.reading?.receivedAtS, 154);
  assert.equal(view(210).phase, 'complete');
});

test('The cycle signal opens once and differentiates recovery from a local link interruption', () => {
  const signal = (atS: number) => exerciseWork(mission, replay.snapshot(atS), session, data)
    .find(item => item.id === exerciseSignalId(assigned));
  assert.equal(signal(96), undefined);
  assert.equal(signal(97)?.condition?.status, 'active');
  assert.equal(signal(115)?.condition?.status, 'no-longer-detected');
  assert.equal(signal(150)?.condition?.status, 'unknown');
  assert.equal(signal(154)?.condition?.status, 'no-longer-detected');
  assert.equal(signal(180)?.alert?.atS, 97);
  assert.equal(signal(180)?.alert?.deviceId, 'cevis-orbiter');
});

test('Saving an exercise excerpt preserves source evidence and computes pulse statistics from reliable samples only', () => {
  assert.throws(() => saveExerciseRecord({ ...session, crewId: 'alex' }, data, replay.snapshot(110), 'stopped-early', 'moderate'), /no exercise excerpt/);
  assert.throws(() => saveExerciseRecord(session, data, replay.snapshot(29), 'stopped-early', 'moderate'), /no exercise excerpt/);
  assert.throws(() => saveExerciseRecord(session, data, replay.snapshot(110), 'excerpt-complete', 'moderate'), /matches the excerpt time/);
  const partial = saveExerciseRecord(session, data, replay.snapshot(110), 'stopped-early', 'moderate');
  const first = partial.exerciseRecords![0];
  assert.equal(first.revision, 1);
  assert.equal(first.endedAtS, 110);
  assert.equal(first.summary.expectedSamples, 14);
  assert.equal(first.summary.machineSamples, 10);
  assert.equal(first.summary.heartRateSamples, 4);
  assert.equal(first.summary.meanHeartRate, 120);
  assert.equal(first.summary.maxHeartRate, 130);
  assert.ok(first.heartRateSamples.some(item => item.quality === 'degraded'));
  assert.ok(first.heartRateSamples.some(item => item.quality === 'unavailable' && item.value === null));
  assert.ok(first.heartRateSamples.every(item => item.measuredAtS >= 30 && item.receivedAtS <= 110));
  assert.ok(first.machinePackets.every(item => item.measuredAtS >= 30 && item.receivedAtS <= 110));
  assert.throws(() => saveExerciseRecord(partial, data, replay.snapshot(110), 'stopped-early', 'moderate'), /already covers/);
  const completed = saveExerciseRecord(partial, data, replay.snapshot(211), 'excerpt-complete', 'hard');
  assert.equal(completed.exerciseRecords![0], first);
  const full = completed.exerciseRecords![1];
  assert.equal(full.revision, 2);
  assert.equal(full.endedAtS, 210);
  assert.equal(full.savedAtS, 211);
  assert.ok(exerciseWork(mission, replay.snapshot(211), completed, data).some(item => item.id === exerciseReviewId(full)));
});

test('Exercise import deduplicates retransmissions and rejects invalid units, attribution and conflicting copies', () => {
  const first = stream[0];
  const duplicate = { ...first, id: first.id + '-again', receivedAtS: first.receivedAtS + 5 };
  const imported = validateExerciseData(plan, [...stream, duplicate], mission, scenario);
  assert.equal(imported.packets.length, stream.length);
  assert.equal(imported.packets[0].receivedAtS, first.receivedAtS);
  assert.throws(() => validateExerciseData(plan, [...stream, { ...duplicate, power: { ...duplicate.power, value: 999 } }], mission, scenario), /Conflicting deliveries/);
  assert.throws(() => validateExerciseData(plan, [{ ...first, power: { ...first.power, unit: 'kW' } }], mission, scenario), /fields are unsupported/);
  assert.throws(() => validateExerciseData(plan, [{ ...first, crewId: 'alex' }], mission, scenario), /assigned source/);
  assert.throws(() => validateExerciseData(plan, [{ ...first, equipmentId: 't2-reference' }], mission, scenario), /assigned source/);
  const wrongHeartRate = { ...plan, sessions: [{ ...assigned, heartRateDeviceIds: ['wrist-alex'] }] };
  assert.throws(() => validateExerciseData(wrongHeartRate, stream, mission, scenario), /registered sources/);
});
