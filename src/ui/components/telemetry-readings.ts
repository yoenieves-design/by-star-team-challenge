import { html } from 'lit-html';
import { latestReading, metrics } from '../../domain/metrics.ts';
import type { CrewMember, Metric, ReadingState } from '../../domain/types.ts';
import type { ViewModel } from '../view-model.ts';
import { measurementDetail, measurementValue, readingLabels, readingTag } from './common.ts';

const bodyMetrics = ['heart_rate', 'skin_temperature', 'activity'] as const;
const airMetrics = ['oxygen', 'carbon_dioxide', 'pressure'] as const;

export function bodyReadings(vm: ViewModel, person: CrewMember) {
  const subject = { type: 'crew' as const, id: person.id };
  return bodyMetrics.map(metric => ({ metric, current: latestReading(vm.snapshot, vm.mission.devices, subject, metric) }));
}

export function breathingReadings(vm: ViewModel, zoneId: string) {
  const subject = { type: 'zone' as const, id: zoneId };
  return airMetrics.map(metric => ({ metric, current: latestReading(vm.snapshot, vm.mission.devices, subject, metric) }));
}

export function telemetryReadings(vm: ViewModel, readings: { metric: Metric; current: ReadingState }[], compact = false) {
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
