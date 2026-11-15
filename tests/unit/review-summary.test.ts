import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ReplayData } from '../../src/domain/types.ts';
import { validateClinicalData, clinicalWork } from '../../src/services/clinical.ts';
import { createReplay } from '../../src/services/replay.ts';
import { newSession } from '../../src/services/session.ts';
import { createReviewSummary } from '../../src/services/review-summary.ts';

const fixture = (path: string) => JSON.parse(readFileSync(new URL('../../public/' + path, import.meta.url), 'utf8'));
const data: ReplayData = { mission: fixture('data/mission.json'), scenario: fixture('simulation/eva-return.json'),
  packets: [...fixture('simulation/streams/personal.json'), ...fixture('simulation/streams/environment.json')] };

test('Review exports preserve historical report status without exposing future corrections', () => {
  const clinical = validateClinicalData(fixture('data/clinical-results.json'), data.mission, data.scenario);
  const replay = createReplay(data);
  const session = newSession(data.scenario);
  const before = replay.snapshot(108);
  const after = replay.snapshot(166);
  const workAt = (snapshot: typeof before) => clinicalWork(data.mission, snapshot, session, clinical).find(item => item.id === 'clinical-maya-urine-v1')!;
  const first = createReviewSummary(data.mission, before, session, workAt(before), clinical);
  assert.equal(first.clinicalEvidence?.superseded, false);
  assert.equal(first.clinicalEvidence?.currentReport?.revision, 1);
  assert.equal(first.clinicalEvidence?.report.status, 'held');
  const historical = createReviewSummary(data.mission, after, session, workAt(after), clinical);
  assert.equal(historical.clinicalEvidence?.superseded, true);
  assert.equal(historical.clinicalEvidence?.reviewAvailable, false);
  assert.equal(historical.clinicalEvidence?.currentReport?.revision, 2);
  assert.equal(historical.clinicalEvidence?.report.revision, 1);
  assert.equal(historical.origin, 'synthetic');
});
