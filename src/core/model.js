import { fields, ruleVersion } from '../config.js';

/** Use local calendar dates for daily records, avoiding UTC day shifts. */
export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validateRecord(record) {
  if (!validDate(record.date) || record.date > today()) throw new Error('Choose a valid date that is not in the future.');
  for (const field of fields) {
    const value = record[field.key];
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < field.min || value > field.max || (field.step === 1 && !Number.isInteger(value)))) {
      throw new Error(`${field.label} must be between ${field.min} and ${field.max}${field.step === 1 ? ' in whole numbers' : ''}.`);
    }
  }
  if (typeof record.notes !== 'string' || record.notes.length > 1000) throw new Error('Notes must contain at most 1,000 characters.');
  if (!fields.some(field => record[field.key] !== null) && !record.notes.trim()) throw new Error('Enter at least one indicator or note.');
  return record;
}
export function emptyState() {
  return { version: 1, profile: { name: 'Demo astronaut', mission: 'Exploration mission', start: today() }, records: [], completed: {} };
}
/** Generate a reproducible fictional week relative to the local current date. */
export function sampleState() {
  const state = emptyState();
  for (let index = 6; index >= 0; index--) {
    const day = new Date(`${today()}T12:00:00`);
    day.setDate(day.getDate() - index);
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    state.records.push({ date, sleep: index < 2 ? 5.5 : 7.5, fatigue: index < 2 ? 4 : 2, mood: 3, exercise: 45, pulse: 64, notes: '', source: 'synthetic', updatedAt: new Date().toISOString() });
  }
  state.profile.start = state.records[0].date;
  return state;
}
export function sortedRecords(state) { return [...state.records].sort((a, b) => a.date.localeCompare(b.date)); }
/** Explainable demonstration rules, deliberately not diagnostic. */
export function evaluate(state) {
  const latest = sortedRecords(state).at(-1);
  if (!latest) return [{ id: 'missing', title: 'No observations yet', detail: 'Add a daily log to begin reviewing changes.', action: 'Create a daily log.', kind: 'missing' }];
  const notices = [];
  const add = (key, title, detail, action, kind = 'review') => notices.push({ id: `${latest.date}:${latest.updatedAt}:${ruleVersion}:${key}`, title, detail, action, kind });
  if (latest.date !== today()) add('stale', 'Latest record is not from today', `Last observation: ${latest.date}.`, 'Record today’s observations.', 'missing');
  if (latest.sleep === null || latest.fatigue === null) add('incomplete', 'Sleep or fatigue data missing', 'The demonstration rules cannot evaluate both indicators.', 'Complete the missing observations.', 'missing');
  if (latest.sleep !== null && latest.sleep < 6) add('sleep', 'Sleep entry flagged for review', `${latest.sleep} hours is below the illustrative 6-hour demo setting.`, 'Check the entry and review your planned rest period.');
  if (latest.fatigue !== null && latest.fatigue >= 4) add('fatigue', 'Fatigue entry flagged for review', `Reported fatigue: ${latest.fatigue}/5; demo setting: 4 or higher.`, 'Check the entry and note relevant context for review.');
  return notices;
}
