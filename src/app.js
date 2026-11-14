import { pages, fields, ruleVersion } from './config.js';
import { today, validDate, validateRecord, emptyState, sampleState } from './core/model.js';
import { readState, saveState } from './core/storage.js';
import { escapeHTML, downloadJSON } from './core/ui.js';
import { dashboardView } from './modules/dashboard.js';
import { dailyLogView } from './modules/daily-log.js';
import { indicatorsView } from './modules/indicators.js';
import { actionsView } from './modules/actions.js';
import { environmentView } from './modules/environment.js';
import { wellbeingView } from './modules/wellbeing.js';
import { reportView } from './modules/report.js';
import { profileView } from './modules/profile.js';

/** Each shortcode mounts its own shell; persistence is shared across same-origin pages. */
export function mount(root) {
  const views = { dashboard: dashboardView, 'daily-log': dailyLogView, indicators: indicatorsView, actions: actionsView, environment: environmentView, wellbeing: wellbeingView, report: reportView, profile: profileView };
  const preview = root.hasAttribute('data-preview');
  let page = preview ? location.hash.slice(1) || 'dashboard' : root.dataset.page;
  if (!views[page]) page = 'dashboard';
  let state;
  try { state = readState(localStorage); } catch (error) { root.textContent = `Demo storage unavailable: ${error.message}`; return; }
  const links = preview ? {} : JSON.parse(root.dataset.links || '{}');
  function notify(message, error = false) {
    const status = root.querySelector('[role="status"]');
    status.textContent = message;
    status.classList.toggle('star-error', error);
  }
  function render() {
    root.innerHTML = `<div class="star-layout"><aside class="star-sidebar"><a class="star-brand" href="${escapeHTML(preview ? '#dashboard' : links.dashboard || '#')}"><span class="star-logo">✦</span> BY STAR<span class="star-brand-sub">MISSION HEALTH</span></a><nav aria-label="Mission health">${pages.map(([key, label]) => `<a href="${escapeHTML(preview ? '#' + key : links[key] || '#')}" ${key === page ? 'aria-current="page"' : ''}>${escapeHTML(label)}</a>`).join('')}</nav><p class="star-sidebar-note">Built for awareness.<br>Designed for autonomy.</p></aside><main class="star-main"><header class="star-topbar"><span>${escapeHTML(state.profile.mission)} · ${escapeHTML(state.profile.name)}</span><span data-connection>${navigator.onLine ? 'Online' : 'Offline'} · browser-local demo</span></header><p class="star-demo">DEMONSTRATION · Fictional data only · Not a clinical assessment</p><h1>${pages.find(item => item[0] === page)[1]}</h1><p role="status" aria-live="polite"></p><div class="star-content">${views[page](state)}</div><footer>BY STAR TEAM · Prototype v0.1 · Rules ${ruleVersion}</footer></main></div>`;
  }
  /** Commit to storage before updating the UI; failed writes never report success. */
  function commit(next, message) {
    saveState(localStorage, next); state = next; render(); notify(message);
  }
  root.addEventListener('submit', event => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    try {
      const data = new FormData(form);
      const next = structuredClone(state);
      if (form.dataset.form === 'daily') {
        const record = { date: data.get('date'), notes: data.get('notes').trim(), source: 'manual-demo', updatedAt: new Date().toISOString() };
        for (const field of fields) record[field.key] = data.get(field.key) === '' ? null : Number(data.get(field.key));
        validateRecord(record);
        next.records = next.records.filter(item => item.date !== record.date).concat(record);
      } else {
        const profile = { name: data.get('name').trim(), mission: data.get('mission').trim(), start: data.get('start') };
        if (!profile.name || !profile.mission || profile.name.length > 80 || profile.mission.length > 80 || !validDate(profile.start)) throw new Error('Enter a name, mission and valid start date.');
        next.profile = profile;
      }
      commit(next, 'Saved in this browser.');
    } catch (error) { notify(error.message, true); }
  });
  root.addEventListener('change', event => {
    const input = event.target;
    if (input.name === 'date' && input.closest('[data-form="daily"]')) {
      const record = state.records.find(item => item.date === input.value);
      for (const key of [...fields.map(field => field.key), 'notes']) input.form.elements[key].value = record?.[key] ?? '';
    }
    if (!input.dataset.actionId) return;
    try {
      const next = structuredClone(state);
      if (input.checked) next.completed[input.dataset.actionId] = new Date().toISOString();
      else delete next.completed[input.dataset.actionId];
      saveState(localStorage, next); state = next; notify('Follow-up status saved.');
    } catch (error) { input.checked = !input.checked; notify(error.message, true); }
  });
  root.addEventListener('click', event => {
    const command = event.target.closest('[data-command]')?.dataset.command;
    try {
      if (command === 'export') downloadJSON({ ...state, exportedAt: new Date().toISOString(), ruleVersion, purpose: 'Fictional demonstration only' }, `by-star-demo-${today()}.json`);
      if (command === 'print') window.print();
      if (command === 'sample' && window.confirm('Replace this browser’s demo data with a fictional week?')) commit(sampleState(), 'Fictional scenario loaded.');
      if (command === 'reset' && window.confirm('Clear all BY STAR demo data in this browser?')) commit(emptyState(), 'Demo data cleared.');
    } catch (error) { notify(error.message, true); }
  });
  if (preview) window.addEventListener('hashchange', () => { page = views[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard'; render(); });
  window.addEventListener('storage', () => { try { state = readState(localStorage); render(); } catch (error) { notify(error.message, true); } });
  for (const event of ['online', 'offline']) window.addEventListener(event, () => { root.querySelector('[data-connection]').textContent = `${navigator.onLine ? 'Online' : 'Offline'} · browser-local demo`; });
  render();
}
if (typeof document !== 'undefined') document.querySelectorAll('.star-app').forEach(mount);
