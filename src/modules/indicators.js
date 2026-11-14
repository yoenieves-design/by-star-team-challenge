import { fields } from '../config.js';
import { sortedRecords } from '../core/model.js';
import { escapeHTML, panel, emptyMessage } from '../core/ui.js';
export function indicatorsView(state) {
  const records = sortedRecords(state);
  if (!records.length) return panel('Observation history', emptyMessage('No data yet. Add a daily log to start your history.'));
  return panel('Sleep trend · last 14 records', `<p>Bar lengths show hours; missing values remain unmeasured.</p><div class="star-trend">${records.slice(-14).map(record => `<div class="star-trend-row"><span>${record.date}</span><meter min="0" max="24" value="${record.sleep ?? 0}" aria-label="${record.date}: ${record.sleep ?? 'unmeasured'} hours"></meter><span>${record.sleep ?? '—'} h</span></div>`).join('')}</div>`) + panel('All observations', `<div class="star-table-wrap"><table><caption>Demo observations; — means no measurement.</caption><thead><tr><th scope="col">Date</th>${fields.map(field => `<th scope="col">${escapeHTML(field.label)} (${escapeHTML(field.unit)})</th>`).join('')}<th scope="col">Source</th></tr></thead><tbody>${records.slice().reverse().map(record => `<tr><th scope="row">${record.date}</th>${fields.map(field => `<td>${record[field.key] ?? '—'}</td>`).join('')}<td>${escapeHTML(record.source)}</td></tr>`).join('')}</tbody></table></div>`);
}
