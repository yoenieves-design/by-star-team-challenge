/** Escape every interpolated user value before inserting HTML. */
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
export function panel(title, body) { return `<section class="star-card"><h2>${escapeHTML(title)}</h2>${body}</section>`; }
export function emptyMessage(message) { return `<p class="star-muted">${escapeHTML(message)}</p>`; }
export function downloadJSON(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
