import { sortedRecords, evaluate } from '../core/model.js';
import { escapeHTML, panel } from '../core/ui.js';
export function reportView(state) {
  const records = sortedRecords(state);
  return panel('Mission health summary', `<dl><dt>Astronaut</dt><dd>${escapeHTML(state.profile.name)}</dd><dt>Mission</dt><dd>${escapeHTML(state.profile.mission)}</dd><dt>Observations</dt><dd>${records.length}</dd><dt>Period</dt><dd>${records[0]?.date ?? '—'} to ${records.at(-1)?.date ?? '—'}</dd><dt>Current review items</dt><dd>${evaluate(state).length}</dd></dl><p>Export includes fictional observations, notes, profile and follow-up status from this browser.</p><button data-command="export">Download JSON report</button> <button class="star-secondary" data-command="print">Print summary</button>`);
}
