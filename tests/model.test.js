import test from 'node:test';
import assert from 'node:assert/strict';
import { today, validDate, validateRecord, emptyState, sampleState, evaluate } from '../src/core/model.js';
import { readState, saveState } from '../src/core/storage.js';
import { escapeHTML } from '../src/core/ui.js';
const observation = () => ({ date: today(), sleep: null, fatigue: null, mood: null, exercise: null, pulse: null, notes: 'Demo context', source: 'manual-demo', updatedAt: new Date().toISOString() });
test('Missing data never produces a healthy assessment', () => {
  assert.equal(evaluate(emptyState())[0].kind, 'missing');
  const state = emptyState(); state.records.push(observation());
  assert.ok(evaluate(state).some(item => item.kind === 'missing'));
});
test('Numeric bounds, fractions, invalid dates and empty logs are rejected', () => {
  assert.equal(validDate('2026-02-30'), false);
  for (const patch of [{ sleep: -1 }, { pulse: NaN }, { mood: 1.5 }, { notes: '' }, { date: '2999-01-01' }]) assert.throws(() => validateRecord({ ...observation(), ...patch }));
  assert.doesNotThrow(() => validateRecord({ ...observation(), sleep: 0 }));
});
test('Rule boundaries and historical freshness remain explicit', () => {
  const state = emptyState(); state.records.push({ ...observation(), sleep: 6, fatigue: 3 });
  assert.deepEqual(evaluate(state), []);
  state.records[0].sleep = 5.9;
  assert.match(evaluate(state)[0].detail, /illustrative/);
  state.records[0].date = '2020-01-01';
  assert.ok(evaluate(state).some(item => item.title.includes('not from today')));
});
test('Synthetic scenario persists and damaged storage does not silently reset', () => {
  let value = null;
  const storage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  saveState(storage, sampleState());
  assert.equal(readState(storage).records.length, 7);
  assert.equal(evaluate(readState(storage)).length, 2);
  value = '{broken'; assert.throws(() => readState(storage));
  assert.throws(() => saveState({ setItem: () => { throw new Error('Quota exceeded'); } }, emptyState()));
});
test('User content cannot create HTML elements or attributes', () => {
  assert.equal(escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});
