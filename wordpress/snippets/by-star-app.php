<?php
/**
 * BY STAR Mission Health v0.1.0 — generated WordPress snippet.
 * Paste without the opening PHP tag into a PHP snippet; run everywhere.
 * Alternatively install this file as a plugin. Never enable both methods.
 * Plugin Name: BY STAR Mission Health Demo
 * Description: Modular browser-local health monitoring demonstration.
 * Version: 0.1.0
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! class_exists( 'By_Star_Mission_Health_V1' ) ) {
final class By_Star_Mission_Health_V1 {
    private static $used = false;
    public static function pages() {
        return array(
        'dashboard' => array( 'label' => 'My status', 'shortcode' => 'star_dashboard' ),
        'daily-log' => array( 'label' => 'Daily log', 'shortcode' => 'star_daily_log' ),
        'indicators' => array( 'label' => 'Indicators', 'shortcode' => 'star_indicators' ),
        'actions' => array( 'label' => 'Alerts & actions', 'shortcode' => 'star_actions' ),
        'environment' => array( 'label' => 'Environment', 'shortcode' => 'star_environment' ),
        'wellbeing' => array( 'label' => 'Wellbeing plan', 'shortcode' => 'star_wellbeing' ),
        'report' => array( 'label' => 'Health report', 'shortcode' => 'star_report' ),
        'profile' => array( 'label' => 'Profile & mission', 'shortcode' => 'star_profile' ),
        );
    }
    public static function register() {
        foreach ( self::pages() as $key => $definition ) {
            add_shortcode( $definition['shortcode'], function () use ( $key ) {
                self::$used = true;
                $links = array();
                foreach ( self::pages() as $slug => $page ) {
                    $links[$slug] = home_url( '/mission-health/' . $slug . '/' );
                }
                // Override URL mapping in a separate snippet when using different slugs.
                $links = apply_filters( 'by_star_page_urls', $links );
                return '<div class="star-app" data-page="' . esc_attr( $key ) . '" data-links="' . esc_attr( wp_json_encode( $links ) ) . '"><p>Loading mission health demo… JavaScript is required.</p></div>';
            } );
        }
    }
    public static function assets() {
        if ( ! self::$used ) { return; }
        // One shared asset payload per request, even with multiple shortcodes.
        echo <<<'BY_STAR_CSS'
<style id="by-star-styles">
/* All selectors are scoped to protect the surrounding WordPress theme. */
.star-app{--star-bg:#0c1423;--star-panel:#142136;--star-line:#2a3c54;--star-text:#edf4ff;--star-muted:#b0c1d6;--star-accent:#78ead6;color:var(--star-text);background:var(--star-bg);font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;border-radius:16px;overflow:hidden;width:100%;text-align:left;color-scheme:dark}
.star-app *{box-sizing:border-box}.star-app h1,.star-app h2,.star-app h3,.star-app p{color:inherit;margin:0 0 16px}.star-app h1{font-size:clamp(28px,4vw,40px);line-height:1.2;letter-spacing:-1px}.star-app h2{font-size:20px;line-height:1.35}.star-app h3{font-size:18px}.star-app a{color:var(--star-accent);text-decoration:none}.star-app a:focus-visible,.star-app button:focus-visible,.star-app input:focus-visible,.star-app textarea:focus-visible{outline:3px solid #fff;outline-offset:4px}.star-layout{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:780px}.star-sidebar{padding:32px 20px;border-right:1px solid var(--star-line);background:#0e192b}.star-brand{display:block;font-size:23px;font-weight:800;letter-spacing:2px;margin-bottom:40px}.star-logo{font-size:30px;margin-right:10px}.star-brand-sub{display:block;color:var(--star-muted);font-size:10px;letter-spacing:3px;margin-left:43px}.star-sidebar nav{display:grid;gap:8px}.star-sidebar nav a{padding:11px 14px;color:var(--star-muted);border-radius:8px;font-size:14px}.star-sidebar nav a:hover{background:#1b3044}.star-sidebar nav a[aria-current]{color:var(--star-accent);background:#173638;border-left:3px solid var(--star-accent)}.star-app .star-sidebar-note{font-size:12px;color:var(--star-muted);margin-top:48px}.star-main{min-width:0;padding:24px 32px}.star-topbar{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;color:var(--star-muted);font-size:12px;border-bottom:1px solid var(--star-line);padding-bottom:20px;margin-bottom:24px}.star-app .star-demo{font-size:11px;color:#efcf92;letter-spacing:1px}.star-hero{background:linear-gradient(120deg,#173b45,#182840);border:1px solid #30515b;padding:28px;border-radius:12px;margin-bottom:24px}.star-app .star-hero h2{font-size:30px;letter-spacing:-.7px}.star-app .star-eyebrow{font-size:11px;letter-spacing:2px;color:var(--star-accent)}.star-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}.star-card{padding:24px;background:var(--star-panel);border:1px solid var(--star-line);border-radius:12px;margin-bottom:20px;min-width:0}.star-card h2{font-weight:600}.star-app .star-value{font-size:36px;line-height:1.2;margin:18px 0 8px;font-weight:650}.star-app .star-muted{color:var(--star-muted);font-size:13px}.star-app label{display:block;color:var(--star-text);font-size:14px;margin-bottom:18px}.star-app input:not([type=checkbox]),.star-app textarea{display:block;width:100%;background:#0b1727;border:1px solid #52677e;border-radius:6px;color:var(--star-text);padding:11px 12px;font:inherit;margin-top:8px}.star-app textarea{resize:vertical}.star-app button{border:1px solid transparent;background:var(--star-accent);color:#09251f;font:600 14px/1.4 system-ui;padding:12px 18px;border-radius:7px;cursor:pointer;min-height:44px}.star-app button:hover{filter:brightness(1.1)}.star-app .star-secondary{background:#253b52;color:#fff;border-color:#59718b}.star-app .star-danger{background:#522b35;color:#ffdae0;border-color:#9b5e70}.star-button-row{display:flex;gap:12px;flex-wrap:wrap}.star-app .star-check{display:flex;align-items:center;gap:12px;padding:12px 0}.star-check input{width:20px;height:20px;accent-color:var(--star-accent)}.star-notice{border-top:1px solid var(--star-line);padding:22px 0}.star-tag{display:inline-block;padding:3px 9px;background:#4b3e24;color:#ffe1a2;border-radius:5px;font-size:12px;margin-bottom:12px}.star-table-wrap{overflow:auto}.star-app table{border-collapse:collapse;width:100%;font-size:13px;color:var(--star-text)}.star-app th,.star-app td{padding:12px;text-align:left;border-bottom:1px solid var(--star-line);white-space:nowrap}.star-app caption{color:var(--star-muted);text-align:left;padding-bottom:12px}.star-trend-row{display:grid;grid-template-columns:100px minmax(60px,1fr) 55px;align-items:center;gap:12px;font-size:12px;margin-bottom:12px}.star-app meter{width:100%;height:16px;accent-color:var(--star-accent)}.star-app dt{color:var(--star-muted);font-size:13px}.star-app dd{margin:0 0 16px}.star-app footer{color:var(--star-muted);font-size:11px;margin-top:32px}.star-app [role=status]:empty{display:none}.star-app [role=status]{color:var(--star-accent)}.star-app .star-error{color:#ffb9bd}
@media(max-width:760px){.star-layout{grid-template-columns:1fr}.star-sidebar{padding:20px;border-right:0;border-bottom:1px solid var(--star-line)}.star-brand{margin-bottom:20px}.star-sidebar nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}.star-sidebar nav a{font-size:13px}.star-sidebar-note{display:none}.star-main{padding:24px 18px}.star-card{padding:20px}.star-topbar{font-size:11px}.star-app .star-hero h2{font-size:25px}}
@media print{.star-sidebar,.star-topbar,.star-app button{display:none!important}.star-layout{display:block;min-height:0}.star-app,.star-card{background:white;color:black;border-color:#ccc}.star-app .star-muted,.star-app dt,.star-app footer{color:#333}.star-main{padding:0}}

</style>
BY_STAR_CSS;
        echo <<<'BY_STAR_JS'
<script id="by-star-app">
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
</script>
BY_STAR_JS;
    }
}
add_action( 'init', array( 'By_Star_Mission_Health_V1', 'register' ) );
add_action( 'wp_footer', array( 'By_Star_Mission_Health_V1', 'assets' ), 30 );
}
