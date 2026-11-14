import { panel, emptyMessage } from '../core/ui.js';
export function environmentView() {
  return `<div class="star-grid">${['Radiation dose', 'Cabin CO₂', 'Cabin temperature'].map(label => panel(label, '<p class="star-value">—</p>' + emptyMessage('No instrument connected.'))).join('')}</div>${panel('Integration boundary', '<p>Environmental measurements require a source, timestamp, unit and quality indicator. This initial release does not infer exposure from personal symptoms or public space-weather feeds.</p>')}`;
}
