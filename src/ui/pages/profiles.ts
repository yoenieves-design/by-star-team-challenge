import { html } from 'lit-html';
import { deviceReadings, metrics } from '../../domain/metrics.ts';
import { bodyTelemetry } from '../components/body-telemetry.ts';
import { avatar, deviceReadingTag, tag, workTag } from '../components/common.ts';
import { icon } from '../components/icons.ts';
import { sensorsPanel } from '../components/sensors.ts';
import { bodyReadings, breathingReadings, telemetryReadings } from '../components/telemetry-readings.ts';
import { clock, currentPerson, personName, sensorsHref, zoneName, type ViewModel } from '../view-model.ts';

function crewOverview(vm: ViewModel) {
  const crew = vm.mission.crew;
  const fullyCurrent = crew.filter(person => {
    const air = breathingReadings(vm, vm.snapshot.context[person.id].breathingZoneId);
    return [...bodyReadings(vm, person), ...air].every(({ current }) => current.status === 'fresh');
  }).length;
  const alerts = vm.work.filter(item => item.alert && item.progress.status !== 'complete');
  return html`<section aria-labelledby="bs-crew-overview">
    <div class="bs-card-heading bs-wrap">
      <div><h2 id="bs-crew-overview">Crew overview</h2><p>Select a body marker to see its source and measurement time.</p></div>
      <div class="bs-inline bs-wrap">
        ${tag(fullyCurrent + ' of ' + crew.length + ' crew with all readings current', 'muted', 'sensor')}
        ${tag(alerts.length + ' open ' + (alerts.length === 1 ? 'alert' : 'alerts'), alerts.length ? 'amber' : 'muted')}
      </div>
    </div>
    <div class="bs-crew-telemetry-grid">
      ${crew.map(person => {
        const context = vm.snapshot.context[person.id];
        const alertCount = alerts.filter(item => item.crewIds.includes(person.id)).length;
        return html`<article class="bs-card bs-profile-card bs-crew-telemetry-card" aria-label=${person.name}>
          <div class="bs-card-heading">
            <div><h3>${person.name}</h3><p>${person.role}</p></div>
            ${avatar(person)}
          </div>
          <div class="bs-crew-signal">
            <div><strong>${zoneName(vm, context.zoneId)}</strong>
              <p>${context.activity}</p>
              ${alertCount ? tag(alertCount + ' open ' + (alertCount === 1 ? 'alert' : 'alerts'), 'amber', 'warning') : ''}
            </div>
          </div>
          ${bodyTelemetry(vm, person, true)}
          ${breathingPanel(vm, context.breathingZoneId)}
          <button class="bs-button bs-button-line" data-action="open-crew-profile" data-crew=${person.id}
            aria-label=${'View profile for ' + person.name} ?disabled=${vm.state.saving}>View profile</button>
        </article>`;
      })}
    </div>
  </section>`;
}

function breathingPanel(vm: ViewModel, zoneId: string) {
  return html`<div class="bs-crew-breathing">
    <h4>Breathing environment</h4>
    <p>${zoneName(vm, zoneId)}</p>
    ${telemetryReadings(vm, breathingReadings(vm, zoneId), true)}
  </div>`;
}

function crewProfile(vm: ViewModel) {
  const person = currentPerson(vm);
  const context = vm.snapshot.context[person.id];
  const devices = vm.mission.devices.filter(device =>
    (device.subject.type === 'crew' && device.subject.id === person.id)
    || device.assignedCrewId === person.id);
  return html`<div class="bs-profile-grid">
    <section class="bs-card bs-profile-card">
      <div class="bs-profile-identity">${avatar(person, true)}<div><h2 id="bs-profile-name" tabindex="-1">${person.name}</h2><p>${person.role}</p></div></div>
      <dl class="bs-definition-list">
        <div><dt>Mission</dt><dd>${vm.mission.code}</dd></div>
        <div><dt>Current location</dt><dd>${zoneName(vm, context.zoneId)}</dd></div>
        <div><dt>Breathing environment</dt><dd>${zoneName(vm, context.breathingZoneId)}</dd></div>
        <div><dt>Current activity</dt><dd>${context.activity}</dd></div>
        <div><dt>Assigned buddy</dt><dd>${personName(vm, person.buddyId)}</dd></div>
      </dl>
    </section>
    <section class="bs-card bs-profile-card">
      <div class="bs-card-heading"><div><h2>Personal reference</h2><p>Fictional preflight record</p></div>
        <span class="bs-card-icon">${icon('heart', 22)}</span></div>
      <p>Resting heart rate</p>
      <strong class="bs-metric-value">${person.reference.restingHeartRate}<span class="bs-unit"> bpm</span></strong>
      <p>${person.reference.basis}. Used for the illustration of comparable resting observations.</p>
    </section>
    <section class="bs-card bs-profile-card bs-full">
      <div class="bs-card-heading">
        <div><h2>Telemetry snapshot</h2><p>Select a body marker to see its source and measurement time.</p></div>
        <span class="bs-card-icon">${icon('sensor', 22)}</span>
      </div>
      <div class="bs-body-air-grid">
        ${bodyTelemetry(vm, person)}
        ${breathingPanel(vm, context.breathingZoneId)}
      </div>
    </section>
    <section class="bs-card bs-profile-card bs-full">
      <div class="bs-card-heading bs-wrap"><div><h2>Assigned equipment</h2><p>Configured sources and latest signal</p></div>
        <a class="bs-button bs-button-line" href=${sensorsHref(vm)}>View sensors ${icon('arrow', 16)}</a>
      </div>
      ${devices.map(device => html`<div class="bs-device-row">${icon('sensor', 22)}
        <div><strong>${device.name}</strong><p>${device.metrics.map(metric => metrics[metric].label).join(' · ')}</p></div>
        ${deviceReadingTag(deviceReadings(vm.snapshot, device))}
      </div>`)}
    </section>
  </div>`;
}

function missionProfile(vm: ViewModel) {
  const tasks = vm.work.filter(item => item.task);
  return html`<div class="bs-profile-grid">
    <section class="bs-card bs-profile-card">
      <div class="bs-card-heading"><div><h2>${vm.mission.name}</h2><p>${vm.mission.location}</p></div>
        <span class="bs-card-icon">${icon('moon', 22)}</span></div>
      <dl class="bs-definition-list">
        <div><dt>Designation</dt><dd>${vm.mission.code}</dd></div>
        <div><dt>Crew size</dt><dd>${vm.mission.crew.length}</dd></div>
        <div><dt>Replay starts</dt><dd>${clock(vm.mission, 0)} UTC · Day ${vm.mission.missionDay}</dd></div>
        <div><dt>Earth relay</dt><dd>${vm.snapshot.links.earth ? 'Available' : 'Unavailable'}</dd></div>
      </dl>
    </section>
    <section class="bs-card bs-profile-card">
      <div class="bs-card-heading"><div><h2>Mission events</h2><p>Replay checkpoints</p></div></div>
      <ol class="bs-history">${vm.scenario.milestones.map(item => html`<li>
        <time>${clock(vm.mission, item.atS, false)} UTC</time>
        <span>${item.label}</span>${item.atS <= vm.snapshot.atS ? tag('Passed', 'green', 'check') : tag('Upcoming')}
      </li>`)}</ol>
    </section>
    <section class="bs-card bs-profile-card bs-full">
      <div class="bs-card-heading"><div><h2>Mission health plan</h2><p>Pre-assigned checks with separate execution status</p></div></div>
      <div class="bs-table-wrap"><table>
        <caption>Schedule · mission clock in UTC</caption>
        <thead><tr><th scope="col">Check</th><th scope="col">Assigned to</th><th scope="col">Opens</th><th scope="col">Due</th><th scope="col">Status</th></tr></thead>
        <tbody>${tasks.map(item => html`<tr><th scope="row">
          ${item.available || item.progress.status !== 'new' ? html`<a href=${vm.href('assist', item.id)}>${item.title}</a>` : item.title}
        </th><td>${personName(vm, item.task!.crewId)}</td>
          <td>${clock(vm.mission, item.task!.opensAtS)}</td><td>${clock(vm.mission, item.task!.dueAtS)}</td>
          <td>${!item.available && item.progress.status === 'new'
            ? tag(vm.snapshot.atS < item.task!.opensAtS ? 'Upcoming' : 'Outside activity window') : workTag(item.progress.status)}</td>
        </tr>`)}</tbody>
      </table></div>
    </section>
    <section class="bs-card bs-profile-card bs-full">
      <div class="bs-card-heading"><div><h2>Environments and equipment</h2><p>Resource assignments by zone</p></div></div>
      <div class="bs-zone-grid">${vm.mission.zones.map(zone => html`<article class="bs-zone"><p>${zone.kind}</p>
        <h3>${zone.name}</h3><ul>${zone.equipment.map(item => html`<li>${item}</li>`)}</ul>
      </article>`)}</div>
    </section>
    ${missionReferences(vm)}
  </div>`;
}

function missionReferences(vm: ViewModel) {
  return html`<section class="bs-card bs-profile-card bs-full" aria-labelledby="bs-mission-references">
    <div class="bs-card-heading bs-wrap"><div><h2 id="bs-mission-references">NASA data &amp; references</h2><p>NASA OSDR RadLab · International Space Station</p></div>
      ${tag('Historical data', 'green', 'info')}</div>
    <p>Sixteen absorbed dose-rate observations from DosTel1 and DosTel2 on April 1, 2022.
      The file records instrument measurements in µGy/h. The lunar replay uses its own synthetic readings.</p>
    <a class="bs-button bs-button-line" href=${vm.asset('data/radlab-iss-sample.json')} target="_blank" rel="noopener noreferrer">View sample JSON ${icon('external', 16)}</a>
    <a class="bs-button bs-button-line" href="https://visualization.osdr.nasa.gov/radlab/gui/data-api/" target="_blank" rel="noopener noreferrer">RadLab API ${icon('external', 16)}</a>
    <details class="bs-details"><summary>Design and science references</summary>
      <ul class="bs-source-list">${vm.mission.sources.map(source => html`<li>
        <a href=${source.url} target="_blank" rel="noopener noreferrer">${source.title} ${icon('external', 15)}</a>
        <p>${source.description}</p>
      </li>`)}</ul>
    </details>
  </section>`;
}

export function profilesPage(vm: ViewModel) {
  const active = vm.state.profileTab;
  const tabs = [{ id: 'overview', label: 'Crew overview' }, { id: 'crew', label: 'Crew member' }, { id: 'mission', label: 'Mission & schedule' }, { id: 'sensors', label: 'Sensors' }];
  const pages = { overview: crewOverview, crew: crewProfile, mission: missionProfile, sensors: sensorsPanel };
  return html`<div class="bs-page-heading">
    <p class="bs-overline">${icon('users', 17)} ${vm.mission.code}</p>
    <h1>Profiles</h1><p>Review crew telemetry, assignments and planned health checks.</p>
  </div>
  <div class="bs-segments bs-profile-tabs" role="group" aria-label="Profile sections">
    ${tabs.map(tab => html`<button type="button" data-action="profile-tab" data-tab=${tab.id}
      aria-pressed=${active === tab.id}>${tab.label}</button>`)}
  </div>
  ${pages[active](vm)}`;
}
