import { html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { metrics } from '../../domain/metrics.ts';
import type { WorkItem } from '../../services/follow-up.ts';
import { alertLabels, avatar, localLinkTag, measurementDetail, measurementValue, readingTag, tag, workTag } from '../components/common.ts';
import { bodyTelemetry } from '../components/body-telemetry.ts';
import { icon } from '../components/icons.ts';
import { replayControls } from '../components/replay-controls.ts';
import { bodyReadings, breathingReadings } from '../components/telemetry-readings.ts';
import { trendChart } from '../components/trend-chart.ts';
import { clock, currentPerson, missionScheduleHref, personName, sensorsHref, zoneName, type ViewModel } from '../view-model.ts';

function healthHeading(vm: ViewModel) {
  const { mission, snapshot } = vm;
  return html`<div class="bs-health-heading">
    <div>
      <p class="bs-overline">${icon('moon', 16)} Day ${mission.missionDay} · ${mission.location}</p>
      <h1>Crew health</h1>
    </div>
    <div class="bs-inline bs-wrap">
      ${localLinkTag(snapshot.links.local)}
      ${tag(snapshot.links.earth ? 'Earth relay available' : 'Earth relay unavailable', snapshot.links.earth ? 'green' : 'amber', 'link')}
    </div>
  </div>`;
}

function crewCards(vm: ViewModel) {
  return html`<div class="bs-crew-grid" aria-label="Select a crew member">
    ${repeat(vm.mission.crew, person => person.id, person => {
      const selected = vm.session.crewId === person.id;
      const context = vm.snapshot.context[person.id];
      const readings = bodyReadings(vm, person);
      const current = readings.filter(({ current }) => current.status === 'fresh').length;
      const open = vm.work.filter(work => work.alert && work.crewIds.includes(person.id) && work.progress.status !== 'complete').length;
      return html`<button type="button" class="bs-crew-card" data-action="select-crew" data-crew=${person.id}
        aria-pressed=${selected ? 'true' : 'false'} ?disabled=${vm.state.saving}>
        <span class="bs-crew-card-top">${avatar(person)}
          <span><strong>${person.name}</strong><small>${person.role}</small></span>
        </span>
        <span class="bs-crew-location">${icon('map', 15)} ${zoneName(vm, context.zoneId)}</span>
        <span class="bs-crew-state">
          ${tag(current + '/' + readings.length + ' body readings current', current === readings.length ? 'green' : 'amber',
            current === readings.length ? 'check' : 'warning')}
          ${open ? tag(open === 1 ? '1 open review' : open + ' open reviews', 'amber', 'warning') : ''}
        </span>
      </button>`;
    })}
  </div>`;
}

function environment(vm: ViewModel, zoneId: string) {
  return html`<section class="bs-card bs-environment" aria-labelledby="bs-environment-title">
    <div class="bs-card-heading">
      <div><h2 id="bs-environment-title">Breathing environment</h2>
        <p>${icon('map', 15)} ${zoneName(vm, zoneId)}</p></div>
      <span class="bs-card-icon">${icon('wind', 22)}</span>
    </div>
    <dl class="bs-environment-readings">
      ${breathingReadings(vm, zoneId).map(({ metric, current }) => html`<div><dt>${metrics[metric].label}</dt><dd>
          ${current.status === 'fresh' ? html`<strong class="bs-environment-value">${measurementValue(current, metric)}</strong>` : readingTag(current.status)}
          <small>${measurementDetail(vm, current)}</small>
        </dd></div>`)}
    </dl>
  </section>`;
}

function nextTask(vm: ViewModel) {
  const tasks = vm.work.filter(item => item.task && item.crewIds.includes(vm.session.crewId));
  const pending = tasks.filter(task => task.progress.status !== 'complete' && (task.available || task.progress.status !== 'new'))
    .sort((a, b) => a.task!.dueAtS - b.task!.dueAtS);
  const next = pending.find(task => task.progress.status !== 'new') ?? pending[0];
  const completed = tasks.filter(task => task.progress.status === 'complete').length;
  return html`<section class="bs-card bs-task-card" aria-labelledby="bs-next-task">
    <div class="bs-card-heading"><div><h2 id="bs-next-task">Next health task</h2><p>Assigned mission routine</p></div>
      <span class="bs-card-icon">${icon('calendar', 21)}</span>
    </div>
    ${next ? html`<strong>${next.title}</strong><p>${next.detail}</p>
      <p class="bs-task-time bs-wrap">${icon('clock', 16)} ${vm.snapshot.atS > next.task!.dueAtS ? 'Past due' : 'Due'} · ${clock(vm.mission, next.task!.dueAtS)} UTC
        ${next.progress.status !== 'new' ? workTag(next.progress.status) : ''}</p>
      <a class="bs-button bs-button-line" href=${vm.href('assist', next.id)}>${next.progress.status === 'new' ? 'Open check-in' : 'Continue check-in'} ${icon('arrow', 16)}</a>`
      : html`<p>No check available for the current activity.</p>`}
    ${tasks.length ? html`<div class="bs-routine"><span>Scheduled checks</span><strong>${completed} of ${tasks.length} complete</strong>
      <progress value=${completed} max=${tasks.length} aria-label="Routine tasks completed"></progress></div>` : ''}
    <a class="bs-button bs-button-plain bs-schedule-link" href=${missionScheduleHref(vm)}>View mission schedule ${icon('arrow', 15)}</a>
  </section>`;
}

function alertsList(vm: ViewModel, alerts: WorkItem[], openCount: number) {
  return html`<section class="bs-card bs-alert-list" aria-labelledby="bs-alerts-title">
    <div class="bs-card-heading bs-wrap"><div><h2 id="bs-alerts-title">Alerts &amp; follow-up</h2>
      <p>${openCount} open · ${alerts.length - openCount} completed</p></div>
      <a class="bs-button bs-button-line" href=${sensorsHref(vm)}>${icon('sensor', 16)} View sensors</a>
    </div>
    ${alerts.length ? repeat(alerts, item => item.id, item => {
      const alert = item.alert!;
      const concern = alert.kind === 'concern';
      const device = vm.mission.devices.find(item => item.id === alert.deviceId);
      const context = concern ? personName(vm, item.crewIds[0]) : device?.name ?? alertLabels[alert.kind];
      return html`<a href=${vm.href('assist', item.id)} class="bs-alert-row">
        ${icon(alert.kind === 'sensor' ? 'sensor' : alert.kind === 'environment' ? 'wind' : 'assist', 18)}
        <span><strong>${concern ? item.detail : item.title}</strong><small>${context} · ${clock(vm.mission, alert.atS)} UTC</small></span>
        ${workTag(item.progress.status)}
      </a>`;
    }) : html`<p>No alerts have been recorded for this view.</p>`}
  </section>`;
}

export function healthPage(vm: ViewModel) {
  const person = currentPerson(vm);
  const context = vm.snapshot.context[person.id];
  const personal = vm.state.healthMode === 'personal';
  const related = vm.work.filter(item => item.alert && (!personal || item.crewIds.includes(person.id)))
    .sort((a, b) => Number(a.progress.status === 'complete') - Number(b.progress.status === 'complete')
      || b.alert!.atS - a.alert!.atS);
  const open = related.filter(item => item.progress.status !== 'complete');
  const lead = open.find(item => item.alert?.kind === 'environment') ?? open[0];
  const leadContext = lead?.crewIds.length ? lead.crewIds.length + (lead.crewIds.length === 1 ? ' crew member' : ' crew members')
    : zoneName(vm, lead?.alert?.zoneId);

  return html`
    ${healthHeading(vm)}
    ${lead ? html`<section class="bs-incident" aria-labelledby="bs-incident-title">
      <span class="bs-incident-icon">${icon('warning', 23)}</span>
      <div>
        <p class="bs-incident-meta">${alertLabels[lead.alert!.kind]} · ${leadContext} · ${workTag(lead.progress.status)}</p>
        <h2 id="bs-incident-title">${lead.title}</h2>
        <p>${lead.detail}</p>
      </div>
      <a class="bs-button bs-button-warning" href=${vm.href('assist', lead.id)}>
        ${lead.progress.status === 'in-progress' || lead.progress.status === 'paused' ? 'Continue review' : 'Review incident'} ${icon('arrow', 16)}
      </a>
    </section>` : ''}
    ${replayControls(vm)}
    <div class="bs-section-heading bs-wrap">
      <div><h2>${personal ? 'My health' : 'Crew overview'}</h2><p>${personal ? 'Current readings and follow-up for ' + person.name + '.' : 'Select a crew member to view their readings and surroundings.'}</p></div>
      <div class="bs-segments" role="group" aria-label="Health view">
        <button type="button" data-action="health-mode" data-mode="crew" aria-pressed=${!personal}>Crew overview</button>
        <button type="button" data-action="health-mode" data-mode="personal" aria-pressed=${personal}>My health</button>
      </div>
    </div>
    <div class="bs-dashboard-grid">
      <div class="bs-column">
        ${personal ? '' : crewCards(vm)}
        <section class="bs-person-heading" aria-labelledby="bs-telemetry-title">
          ${avatar(person)}
          <div><h2 id="bs-telemetry-title">${person.name}</h2><p>${zoneName(vm, context.zoneId)} · ${context.activity}</p></div>
        </section>
        <section class="bs-card" aria-label="Body readings">${bodyTelemetry(vm, person)}</section>
        ${vm.session.simple ? '' : trendChart(vm, person.id, context.breathingZoneId)}
      </div>
      <div class="bs-column">
        ${alertsList(vm, related, open.length)}
        ${environment(vm, context.breathingZoneId)}
        ${nextTask(vm)}
      </div>
    </div>
  `;
}
