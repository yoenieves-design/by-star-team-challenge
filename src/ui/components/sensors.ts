import { html } from 'lit-html';
import { deviceReadings } from '../../domain/metrics.ts';
import type { Device } from '../../domain/types.ts';
import { isWorkPending } from '../../services/follow-up.ts';
import { clock, personName, zoneName, type ViewModel } from '../view-model.ts';
import { deviceReadingTag, localLinkTag, tag } from './common.ts';
import { icon } from './icons.ts';
import { replayControls } from './replay-controls.ts';
import { telemetryReadings } from './telemetry-readings.ts';
import { exerciseSummary } from './exercise-summary.ts';

function sensorCard(vm: ViewModel, device: Device, readings: ReturnType<typeof deviceReadings>) {
  const packet = vm.snapshot.latestPackets.get(device.id);
  const newest = Math.max(...readings.map(({ current }) => current.reading?.measuredAtS ?? -1));
  const subject = device.subject.type === 'crew' ? personName(vm, device.subject.id) : zoneName(vm, device.subject.id);
  const alert = vm.work.findLast(item => item.alert?.kind === 'sensor' && item.alert.deviceId === device.id);

  return html`<article class="bs-card bs-sensor-card" aria-label=${device.name}>
    <div class="bs-card-heading bs-wrap">
      <div><h4>${device.name}</h4><p>${subject} · <code>${device.id}</code></p></div>
      ${deviceReadingTag(readings)}
    </div>
    ${packet ? html`<dl class="bs-sensor-times">
      <div><dt>Last packet received</dt><dd>${clock(vm.mission, packet.receivedAtS)} UTC</dd></div>
      <div><dt>Newest reading measured</dt><dd>${clock(vm.mission, newest)} UTC</dd></div>
    </dl>` : html`<p class="bs-muted">No packet received yet.</p>`}
    ${telemetryReadings(vm, readings, true)}
    ${alert ? html`<a class="bs-sensor-alert" href=${vm.href('assist', alert.id)}>
      ${isWorkPending(alert) ? 'Review sensor alert' : 'View completed review'} ${icon('arrow', 15)}
    </a>` : ''}
  </article>`;
}

export function sensorsPanel(vm: ViewModel) {
  const devices = vm.mission.devices.map(device => ({ device, readings: deviceReadings(vm.snapshot, device) }));
  const current = devices.filter(({ readings }) => readings.every(({ current }) => current.status === 'fresh')).length;
  const gaps = devices.length - current;
  const groups = [
    { label: 'Wearables', devices: devices.filter(({ device }) => device.subject.type === 'crew') },
    { label: 'Cabin and suit monitors', devices: devices.filter(({ device }) => device.subject.type === 'zone') },
  ];

  return html`<section class="bs-sensors" aria-labelledby="bs-sensors-title">
    <div class="bs-card-heading bs-wrap">
      <div><h2 id="bs-sensors-title">Sensors</h2><p>Simulated device packets</p></div>
      <div class="bs-inline bs-wrap">
        ${tag(current + ' of ' + devices.length + ' devices with current readings', gaps ? 'muted' : 'green', 'sensor')}
        ${gaps ? tag(gaps + ' with reading issues', 'amber', 'warning') : ''}
        ${localLinkTag(vm.snapshot.links.local)}
      </div>
    </div>
    ${replayControls(vm)}
    <details class="bs-details bs-connection-details">
      <summary>Proposed onboard connections</summary>
      <p>Wearables could use Bluetooth to reach a local gateway. Approved onboard networks could carry data over Wi-Fi or mission-specific links. Suit and cabin equipment would share telemetry through read-only mission interfaces.</p>
      <p>The replay buffers packets during a local link interruption and preserves their measurement times. An onboard system could use an independent link or backup monitor where mission hardware supports it.</p>
    </details>
    ${exerciseSummary(vm, true)}
    ${groups.filter(group => group.devices.length).map(group => html`<div class="bs-sensor-group">
      <h3>${group.label}</h3>
      <div class="bs-sensor-grid">
        ${group.devices.map(({ device, readings }) => sensorCard(vm, device, readings))}
      </div>
    </div>`)}
  </section>`;
}
