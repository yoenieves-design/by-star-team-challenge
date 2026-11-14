import { evaluate } from '../core/model.js';
import { escapeHTML, panel, emptyMessage } from '../core/ui.js';
export function actionsView(state) {
  const notices = evaluate(state);
  return panel('Explainable review queue', `<p>Illustrative rules only. Completing a follow-up does not resolve a health condition.</p>${notices.length ? notices.map(item => `<article class="star-notice"><span class="star-tag">${item.kind === 'missing' ? 'Data needed' : 'Review'}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detail)}</p><p>${escapeHTML(item.action)}</p>${item.id === 'missing' ? '' : `<label class="star-check"><input type="checkbox" data-action-id="${escapeHTML(item.id)}" ${state.completed[item.id] ? 'checked' : ''}> Follow-up recorded</label>`}</article>`).join('') : emptyMessage('No demo rules triggered for the latest entry.')}`);
}
