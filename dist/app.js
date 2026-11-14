(() => {
'use strict';
// Source: src/config.js
/** Shared navigation and demonstration-only rules. No clinical thresholds. */
const pages = [
  ['dashboard', 'My status', 'star_dashboard'],
  ['daily-log', 'Daily log', 'star_daily_log'],
  ['indicators', 'Indicators', 'star_indicators'],
  ['actions', 'Alerts & actions', 'star_actions'],
  ['environment', 'Environment', 'star_environment'],
  ['wellbeing', 'Wellbeing plan', 'star_wellbeing'],
  ['report', 'Health report', 'star_report'],
  ['profile', 'Profile & mission', 'star_profile'],
];
const fields = [
  { key: 'sleep', label: 'Sleep', unit: 'hours', min: 0, max: 24, step: 0.1 },
  { key: 'fatigue', label: 'Fatigue', unit: '1 low – 5 high', min: 1, max: 5, step: 1 },
  { key: 'mood', label: 'Mood', unit: '1 low – 5 high', min: 1, max: 5, step: 1 },
  { key: 'exercise', label: 'Exercise', unit: 'minutes', min: 0, max: 1440, step: 1 },
  { key: 'pulse', label: 'Resting heart rate', unit: 'bpm', min: 20, max: 250, step: 1 },
];
const ruleVersion = 'demo-1';

// Source: src/core/model.js

/** Use local calendar dates for daily records, avoiding UTC day shifts. */
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function validateRecord(record) {
  if (!validDate(record.date) || record.date > today()) throw new Error('Choose a valid date that is not in the future.');
  for (const field of fields) {
    const value = record[field.key];
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < field.min || value > field.max || (field.step === 1 && !Number.isInteger(value)))) {
      throw new Error(`${field.label} must be between ${field.min} and ${field.max}${field.step === 1 ? ' in whole numbers' : ''}.`);
    }
  }
  if (typeof record.notes !== 'string' || record.notes.length > 1000) throw new Error('Notes must contain at most 1,000 characters.');
  if (!fields.some(field => record[field.key] !== null) && !record.notes.trim()) throw new Error('Enter at least one indicator or note.');
  return record;
}
function emptyState() {
  return { version: 1, profile: { name: 'Demo astronaut', mission: 'Exploration mission', start: today() }, records: [], completed: {} };
}
/** Generate a reproducible fictional week relative to the local current date. */
function sampleState() {
  const state = emptyState();
  for (let index = 6; index >= 0; index--) {
    const day = new Date(`${today()}T12:00:00`);
    day.setDate(day.getDate() - index);
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    state.records.push({ date, sleep: index < 2 ? 5.5 : 7.5, fatigue: index < 2 ? 4 : 2, mood: 3, exercise: 45, pulse: 64, notes: '', source: 'synthetic', updatedAt: new Date().toISOString() });
  }
  state.profile.start = state.records[0].date;
  return state;
}
function sortedRecords(state) { return [...state.records].sort((a, b) => a.date.localeCompare(b.date)); }
/** Explainable demonstration rules, deliberately not diagnostic. */
function evaluate(state) {
  const latest = sortedRecords(state).at(-1);
  if (!latest) return [{ id: 'missing', title: 'No observations yet', detail: 'Add a daily log to begin reviewing changes.', action: 'Create a daily log.', kind: 'missing' }];
  const notices = [];
  const add = (key, title, detail, action, kind = 'review') => notices.push({ id: `${latest.date}:${latest.updatedAt}:${ruleVersion}:${key}`, title, detail, action, kind });
  if (latest.date !== today()) add('stale', 'Latest record is not from today', `Last observation: ${latest.date}.`, 'Record today’s observations.', 'missing');
  if (latest.sleep === null || latest.fatigue === null) add('incomplete', 'Sleep or fatigue data missing', 'The demonstration rules cannot evaluate both indicators.', 'Complete the missing observations.', 'missing');
  if (latest.sleep !== null && latest.sleep < 6) add('sleep', 'Sleep entry flagged for review', `${latest.sleep} hours is below the illustrative 6-hour demo setting.`, 'Check the entry and review your planned rest period.');
  if (latest.fatigue !== null && latest.fatigue >= 4) add('fatigue', 'Fatigue entry flagged for review', `Reported fatigue: ${latest.fatigue}/5; demo setting: 4 or higher.`, 'Check the entry and note relevant context for review.');
  return notices;
}

// Source: src/core/storage.js
/** Browser storage is for fictional demo data only; it is not an authenticated vault. */
const storageKey = 'by-star:demo:v1';
function readState(storage) {
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
function saveState(storage, state) { storage.setItem(storageKey, JSON.stringify(state)); }

// Source: src/core/ui.js
/** Escape every interpolated user value before inserting HTML. */
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function panel(title, body) { return `<section class="star-card"><h2>${escapeHTML(title)}</h2>${body}</section>`; }
function emptyMessage(message) { return `<p class="star-muted">${escapeHTML(message)}</p>`; }
function downloadJSON(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Source: src/modules/dashboard.js
function dashboardView(state) {
  const record = sortedRecords(state).at(-1);
  const notices = evaluate(state);
  return `<div class="star-hero"><p class="star-eyebrow">PERSONAL MISSION HEALTH</p><h2>Your daily perspective.</h2><p>Observe changes. Understand the context. Track your next step.</p></div><div class="star-grid">${fields.map(field => panel(field.label, `<p class="star-value">${record?.[field.key] ?? '—'}</p><p class="star-muted">${escapeHTML(field.unit)}</p>`)).join('')}</div>${panel('Needs your attention', notices.length ? `<ul>${notices.map(item => `<li><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.action)}</p></li>`).join('')}</ul>` : emptyMessage('No demo rules triggered. This is not a clinical assessment.'))}${panel('Data freshness', emptyMessage(record ? `Latest observation: ${record.date}. Source: ${record.source}. Saved: ${record.updatedAt}.` : 'No observations available. Start with Daily log or load the fictional scenario in Profile & mission.'))}`;
}

// Source: src/modules/daily-log.js
function dailyLogView(state) {
  const record = state.records.find(item => item.date === today());
  return panel('Daily check-in', `<p>Optional fields may remain blank. Blank means unknown, not zero. Saving a date replaces its previous entry.</p><form data-form="daily"><label>Observation date<input name="date" type="date" value="${today()}" max="${today()}" required></label><div class="star-grid">${fields.map(field => `<label>${escapeHTML(field.label)} <span class="star-muted">(${escapeHTML(field.unit)})</span><input name="${field.key}" type="number" min="${field.min}" max="${field.max}" step="${field.step}" value="${record?.[field.key] ?? ''}"></label>`).join('')}</div><label>Symptoms and context<textarea name="notes" maxlength="1000" rows="4" placeholder="Fictional observations only">${escapeHTML(record?.notes ?? '')}</textarea></label><button type="submit">Save demo observation</button></form>`);
}

// Source: src/modules/indicators.js
function indicatorsView(state) {
  const records = sortedRecords(state);
  if (!records.length) return panel('Observation history', emptyMessage('No data yet. Add a daily log to start your history.'));
  return panel('Sleep trend · last 14 records', `<p>Bar lengths show hours; missing values remain unmeasured.</p><div class="star-trend">${records.slice(-14).map(record => `<div class="star-trend-row"><span>${record.date}</span><meter min="0" max="24" value="${record.sleep ?? 0}" aria-label="${record.date}: ${record.sleep ?? 'unmeasured'} hours"></meter><span>${record.sleep ?? '—'} h</span></div>`).join('')}</div>`) + panel('All observations', `<div class="star-table-wrap"><table><caption>Demo observations; — means no measurement.</caption><thead><tr><th scope="col">Date</th>${fields.map(field => `<th scope="col">${escapeHTML(field.label)} (${escapeHTML(field.unit)})</th>`).join('')}<th scope="col">Source</th></tr></thead><tbody>${records.slice().reverse().map(record => `<tr><th scope="row">${record.date}</th>${fields.map(field => `<td>${record[field.key] ?? '—'}</td>`).join('')}<td>${escapeHTML(record.source)}</td></tr>`).join('')}</tbody></table></div>`);
}

// Source: src/modules/actions.js
function actionsView(state) {
  const notices = evaluate(state);
  return panel('Explainable review queue', `<p>Illustrative rules only. Completing a follow-up does not resolve a health condition.</p>${notices.length ? notices.map(item => `<article class="star-notice"><span class="star-tag">${item.kind === 'missing' ? 'Data needed' : 'Review'}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detail)}</p><p>${escapeHTML(item.action)}</p>${item.id === 'missing' ? '' : `<label class="star-check"><input type="checkbox" data-action-id="${escapeHTML(item.id)}" ${state.completed[item.id] ? 'checked' : ''}> Follow-up recorded</label>`}</article>`).join('') : emptyMessage('No demo rules triggered for the latest entry.')}`);
}

// Source: src/modules/environment.js
function environmentView() {
  return `<div class="star-grid">${['Radiation dose', 'Cabin CO₂', 'Cabin temperature'].map(label => panel(label, '<p class="star-value">—</p>' + emptyMessage('No instrument connected.'))).join('')}</div>${panel('Integration boundary', '<p>Environmental measurements require a source, timestamp, unit and quality indicator. This initial release does not infer exposure from personal symptoms or public space-weather feeds.</p>')}`;
}

// Source: src/modules/wellbeing.js
function wellbeingView(state) {
  return panel('Today’s personal checklist', `<p>A demonstration checklist, not a prescribed treatment plan. Completion resets each calendar day.</p>${['Complete daily check-in', 'Review planned rest period', 'Review assigned exercise plan', 'Record questions for mission support'].map((label, index) => { const id = `plan:${today()}:${index}`; return `<label class="star-check"><input type="checkbox" data-action-id="${id}" ${state.completed[id] ? 'checked' : ''}>${escapeHTML(label)}</label>`; }).join('')}`);
}

// Source: src/modules/report.js
function reportView(state) {
  const records = sortedRecords(state);
  return panel('Mission health summary', `<dl><dt>Astronaut</dt><dd>${escapeHTML(state.profile.name)}</dd><dt>Mission</dt><dd>${escapeHTML(state.profile.mission)}</dd><dt>Observations</dt><dd>${records.length}</dd><dt>Period</dt><dd>${records[0]?.date ?? '—'} to ${records.at(-1)?.date ?? '—'}</dd><dt>Current review items</dt><dd>${evaluate(state).length}</dd></dl><p>Export includes fictional observations, notes, profile and follow-up status from this browser.</p><button data-command="export">Download JSON report</button> <button class="star-secondary" data-command="print">Print summary</button>`);
}

// Source: src/modules/profile.js
function profileView(state) {
  return panel('Profile & mission', `<form data-form="profile"><label>Demo astronaut name<input name="name" maxlength="80" required value="${escapeHTML(state.profile.name)}"></label><label>Mission name<input name="mission" maxlength="80" required value="${escapeHTML(state.profile.mission)}"></label><label>Mission start<input type="date" name="start" required value="${escapeHTML(state.profile.start)}"></label><button type="submit">Save profile</button></form>`) + panel('Demo data controls', '<p>Records stay in this browser and are shared by anyone using this browser profile on this site. Do not enter real health information. Export before replacing data.</p><div class="star-button-row"><button data-command="sample">Load fictional week</button><button class="star-secondary" data-command="export">Export demo data</button><button class="star-danger" data-command="reset">Clear demo data</button></div>');
}

// Source: src/app.js

/** Each shortcode mounts its own shell; persistence is shared across same-origin pages. */
function mount(root) {
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

})();