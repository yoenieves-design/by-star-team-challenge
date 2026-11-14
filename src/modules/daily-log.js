import { fields } from '../config.js';
import { today } from '../core/model.js';
import { escapeHTML, panel } from '../core/ui.js';
export function dailyLogView(state) {
  const record = state.records.find(item => item.date === today());
  return panel('Daily check-in', `<p>Optional fields may remain blank. Blank means unknown, not zero. Saving a date replaces its previous entry.</p><form data-form="daily"><label>Observation date<input name="date" type="date" value="${today()}" max="${today()}" required></label><div class="star-grid">${fields.map(field => `<label>${escapeHTML(field.label)} <span class="star-muted">(${escapeHTML(field.unit)})</span><input name="${field.key}" type="number" min="${field.min}" max="${field.max}" step="${field.step}" value="${record?.[field.key] ?? ''}"></label>`).join('')}</div><label>Symptoms and context<textarea name="notes" maxlength="1000" rows="4" placeholder="Fictional observations only">${escapeHTML(record?.notes ?? '')}</textarea></label><button type="submit">Save demo observation</button></form>`);
}
