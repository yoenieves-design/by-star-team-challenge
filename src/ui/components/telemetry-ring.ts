import { html } from 'lit-html';
import { latestReading, metrics } from '../../domain/metrics.ts';
import type { CrewMember, Metric, ReadingState, Subject } from '../../domain/types.ts';
import type { ViewModel } from '../view-model.ts';
import { measurementDetail, measurementValue, readingLabels, readingTag } from './common.ts';

const bodyMetrics: Metric[] = ['heart_rate', 'skin_temperature', 'activity'];
const airMetrics: Metric[] = ['oxygen', 'carbon_dioxide', 'pressure'];

export function crewTelemetry(vm: ViewModel, person: CrewMember) {
  const body: Subject = { type: 'crew', id: person.id };
  const air: Subject = { type: 'zone', id: vm.snapshot.context[person.id].breathingZoneId };
  const read = (metric: Metric, subject: Subject) => ({
    metric, current: latestReading(vm.snapshot, vm.mission.devices, subject, metric),
  });
  return [
    ...bodyMetrics.map(metric => read(metric, body)),
    ...airMetrics.map(metric => read(metric, air)),
  ];
}

type Telemetry = ReturnType<typeof crewTelemetry>;

const colors: Record<ReadingState['status'], string> = {
  fresh: 'var(--bs-signal-current)',
  stale: 'var(--bs-signal-stale)',
  degraded: 'var(--bs-signal-degraded)',
  unavailable: 'var(--bs-signal-unavailable)',
};

export function telemetryRing(readings: Telemetry) {
  const sweep = 360 / readings.length;
  const segments = readings.map(({ current }, index) => {
    const start = index * sweep;
    const end = start + sweep;
    return colors[current.status] + ' ' + start + 'deg ' + (end - 5) + 'deg, transparent ' + (end - 5) + 'deg ' + end + 'deg';
  });
  const fresh = readings.filter(({ current }) => current.status === 'fresh').length;
  return html`<div class="bs-telemetry-ring" style=${'--bs-ring-segments: ' + segments.join(', ')}>
    <span><strong>${fresh}/${readings.length}</strong><small>current</small></span>
  </div>`;
}

export function telemetryReadings(vm: ViewModel, readings: Telemetry, compact = false) {
  return html`<dl class="bs-telemetry-readings ${compact ? 'bs-telemetry-compact' : ''}">
    ${readings.map(({ metric, current }) => html`<div>
      <dt><span class="bs-signal-dot" data-status=${current.status} aria-hidden="true"></span>${metrics[metric].label}</dt>
      <dd>
        ${current.status === 'fresh' ? measurementValue(current, metric)
          : compact ? html`<span class="bs-muted">${readingLabels[current.status]}</span>` : readingTag(current.status)}
        ${compact ? '' : html`<small>${measurementDetail(vm, current)}</small>`}
      </dd>
    </div>`)}
  </dl>`;
}
