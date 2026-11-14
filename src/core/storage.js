import { emptyState, validateRecord, validDate } from './model.js';
/** Browser storage is for fictional demo data only; it is not an authenticated vault. */
export const storageKey = 'by-star:demo:v1';
export function readState(storage) {
  const raw = storage.getItem(storageKey);
  if (!raw) return emptyState();
  const state = JSON.parse(raw);
  if (state.version !== 1 || !Array.isArray(state.records) || !state.profile || !state.completed || typeof state.completed !== 'object' || Array.isArray(state.completed)) throw new Error('Unsupported or damaged demo data. Export or clear this browser’s site storage before continuing.');
  if (typeof state.profile.name !== 'string' || state.profile.name.length > 80 || typeof state.profile.mission !== 'string' || state.profile.mission.length > 80 || !validDate(state.profile.start)) throw new Error('Invalid profile data.');
  const dates = new Set();
  for (const record of state.records) {
    validateRecord(record);
    if (dates.has(record.date) || !['synthetic', 'manual-demo'].includes(record.source) || typeof record.updatedAt !== 'string' || Number.isNaN(Date.parse(record.updatedAt))) throw new Error('Invalid observation metadata.');
    dates.add(record.date);
  }
  return state;
}
export function saveState(storage, state) { storage.setItem(storageKey, JSON.stringify(state)); }
