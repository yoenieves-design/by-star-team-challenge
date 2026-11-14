import { today } from '../core/model.js';
import { escapeHTML, panel } from '../core/ui.js';
export function wellbeingView(state) {
  return panel('Today’s personal checklist', `<p>A demonstration checklist, not a prescribed treatment plan. Completion resets each calendar day.</p>${['Complete daily check-in', 'Review planned rest period', 'Review assigned exercise plan', 'Record questions for mission support'].map((label, index) => { const id = `plan:${today()}:${index}`; return `<label class="star-check"><input type="checkbox" data-action-id="${id}" ${state.completed[id] ? 'checked' : ''}>${escapeHTML(label)}</label>`; }).join('')}`);
}
