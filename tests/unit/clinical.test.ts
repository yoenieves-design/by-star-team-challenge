import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ClinicalReport } from '../../src/domain/clinical.ts';
import type { Mission, Scenario } from '../../src/domain/types.ts';
import { clinicalReportsFor, clinicalWork, validateClinicalData } from '../../src/services/clinical.ts';
import { createReplay } from '../../src/services/replay.ts';
import { newSession } from '../../src/services/session.ts';

function fixture<T>(path: string): T {
  return JSON.parse(readFileSync(new URL('../../public/' + path, import.meta.url), 'utf8')) as T;
}

const mission = fixture<Mission>('data/mission.json');
const scenario = fixture<Scenario>('simulation/eva-return.json');
const input = fixture<{ reports: ClinicalReport[] }>('data/clinical-results.json');
const data = validateClinicalData(input, mission, scenario);
const replay = createReplay({ mission, scenario, packets: [] });

test('Clinical reports become inspectable at receipt and a held report cannot open a review', () => {
  const at = (atS: number) => clinicalWork(mission, replay.snapshot(atS), newSession(scenario), data);
  assert.equal(data.orders[0].requestedAtS, 88);
  assert.deepEqual(at(105), []);
  assert.deepEqual(at(106).map(({ id, available }) => ({ id, available })), [{ id: 'clinical-maya-urine-v1', available: false }]);
  const held = clinicalReportsFor(data, 'maya-post-eva-urine', 108).at(-1);
  assert.equal(held?.status, 'held');
  assert.equal(held?.status === 'held' && held.reason, 'specimen-mismatch');
  const accepted = at(108).find(item => item.id === 'clinical-alex-urine-v1');
  assert.equal(accepted?.available, true);
  assert.equal(accepted?.requiredReviewerId, 'noah');
  assert.deepEqual(accepted?.crewIds, ['alex']);
});

test('A corrected report preserves the original and becomes the only reviewable revision', () => {
  const visible = clinicalReportsFor(data, 'maya-post-eva-urine', 166);
  assert.deepEqual(visible.map(({ status, revision }) => ({ status, revision })), [
    { status: 'held', revision: 1 }, { status: 'accepted', revision: 2 },
  ]);
  const mayaWork = clinicalWork(mission, replay.snapshot(166), newSession(scenario), data).filter(item => item.crewIds.includes('maya'));
  assert.deepEqual(mayaWork.map(item => item.available), [false, true]);
  assert.equal(visible.at(-1)?.supersedesRevision, 1);
});

test('Repeated deliveries retain the first receipt and reject conflicting report revisions', () => {
  const retransmitted = { ...input.reports[0], receivedAtS: 170 };
  const imported = validateClinicalData({ ...input, reports: [...input.reports, retransmitted] }, mission, scenario);
  assert.equal(imported.reports.length, 3);
  assert.equal(imported.reports[0].receivedAtS, 106);
  assert.throws(() => validateClinicalData({ ...input, reports: [...input.reports, { ...retransmitted, quality: 'failed' }] }, mission, scenario), /Conflicting copies/);
  assert.throws(() => validateClinicalData({ ...input, reports: input.reports.filter(item => item !== input.reports[0]) }, mission, scenario), /correction history/);
});

test('Clinical import rejects unexpected analyte units, unknown instruments and impossible timestamps', () => {
  const source = input.reports[0];
  const faults = [
    { ...source, observations: [{ ...source.observations[0], unit: 'mg/dL' }] },
    { ...source, instrumentId: 'unknown-reader' },
    { ...source, receivedAtS: 95 },
  ];
  for (const changed of faults) {
    assert.throws(() => validateClinicalData({ ...input, reports: [changed, ...input.reports.slice(1)] }, mission, scenario), /Invalid clinical results feed/);
  }
});
