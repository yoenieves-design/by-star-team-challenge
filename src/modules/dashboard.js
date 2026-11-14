import { fields } from '../config.js';
import { sortedRecords, evaluate } from '../core/model.js';
import { escapeHTML, panel, emptyMessage } from '../core/ui.js';
export function dashboardView(state) {
  const record = sortedRecords(state).at(-1);
  const notices = evaluate(state);
  return `<div class="star-hero"><p class="star-eyebrow">PERSONAL MISSION HEALTH</p><h2>Your daily perspective.</h2><p>Observe changes. Understand the context. Track your next step.</p></div><div class="star-grid">${fields.map(field => panel(field.label, `<p class="star-value">${record?.[field.key] ?? '—'}</p><p class="star-muted">${escapeHTML(field.unit)}</p>`)).join('')}</div>${panel('Needs your attention', notices.length ? `<ul>${notices.map(item => `<li><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.action)}</p></li>`).join('')}</ul>` : emptyMessage('No demo rules triggered. This is not a clinical assessment.'))}${panel('Data freshness', emptyMessage(record ? `Latest observation: ${record.date}. Source: ${record.source}. Saved: ${record.updatedAt}.` : 'No observations available. Start with Daily log or load the fictional scenario in Profile & mission.'))}`;
}
