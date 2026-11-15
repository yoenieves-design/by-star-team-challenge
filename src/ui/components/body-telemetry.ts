import { html } from 'lit-html';
import { canSpeak } from '../../adapters/voice.ts';
import { metrics, numberLabel } from '../../domain/metrics.ts';
import type { CrewMember, ReadingState } from '../../domain/types.ts';
import { isWorkPending } from '../../services/follow-up.ts';
import type { ViewModel } from '../view-model.ts';
import { measurementDetail, measurementValue, readingLabels, tag } from './common.ts';
import { icon, type Icon } from './icons.ts';
import { bodyReadings } from './telemetry-readings.ts';
import '../styles/body-telemetry.css';

const markerIcons = { heart_rate: 'heart', skin_temperature: 'sensor', activity: 'activity' } as const;
const statusIcons: Record<ReadingState['status'], Icon> = {
  fresh: 'check', stale: 'clock', degraded: 'warning', unavailable: 'help',
};

export function bodyTelemetry(vm: ViewModel, person: CrewMember, compact = false) {
  const readings = bodyReadings(vm, person);
  const context = vm.snapshot.context[person.id];
  const group = 'bs-body-reading-' + person.id;
  const pending = vm.work.filter(item => item.crewIds.includes(person.id) && isWorkPending(item));
  return html`<fieldset class="bs-body-telemetry ${compact ? 'bs-body-telemetry-compact' : ''}">
    <legend class="bs-visually-hidden">Body readings for ${person.name}</legend>
    <div class="bs-body-layout">
      <div class="bs-body-figure">
        <svg class="bs-body-silhouette" viewBox="0 0 120 195" aria-hidden="true" focusable="false">
          <circle cx="59" cy="21" r="13" />
          <path d="M51 40h16l2 6 10 3c6 2 10 7 13 14l13 40c1 4-1 7-5 8s-7-1-9-5L80 77l-2 26 6 78c0 5-3 8-7 8h-5c-4 0-7-3-7-7l-6-58-6 58c0 4-3 7-7 7h-5c-4 0-7-3-7-8l6-78-2-26-11 29c-2 4-5 6-9 5s-6-4-5-8l13-40c3-7 7-12 13-14l10-3z" />
        </svg>
        ${readings.map(({ metric, current }) => html`<label class="bs-body-marker" data-metric=${metric} data-status=${current.status}>
          <input type="radio" name=${group} id=${group + '-' + metric} ?checked=${metric === 'heart_rate'}
            aria-label=${metrics[metric].label} aria-describedby=${group + '-' + metric + '-value'}>
          <span class="bs-body-marker-icon">${icon(markerIcons[metric], 17)}</span>
          <span class="bs-body-marker-status">${icon(statusIcons[current.status], 12)}</span>
        </label>`)}
      </div>
      <div class="bs-body-values">
        ${readings.map(({ metric, current }) => html`<div class="bs-body-row" data-metric=${metric}>
          <label class="bs-body-reading" for=${group + '-' + metric}>
            <span>${metrics[metric].label}</span>
            <strong id=${group + '-' + metric + '-value'} data-status=${current.status}>
              ${current.status === 'fresh' ? measurementValue(current, metric) : readingLabels[current.status]}
            </strong>
          </label>
          <div class="bs-body-detail">
            <div class="bs-inline bs-wrap bs-body-statuses">
              ${tag(current.status === 'fresh' ? 'Signal current' : readingLabels[current.status], current.status === 'fresh' ? 'green' : 'amber', statusIcons[current.status])}
              ${pending.some(item => item.alert?.kind === 'personal' && metric === 'heart_rate'
                || item.alert?.kind === 'sensor' && item.alert.deviceId === current.reading?.deviceId)
                ? tag('Review requested', 'amber', 'warning') : ''}
            </div>
            <p>${measurementDetail(vm, current)}</p>
            ${metric === 'heart_rate' ? html`<p class="bs-body-reference">
              <strong>Personal reference</strong> ${person.reference.restingHeartRate} bpm · fictional preflight seated reading.
              ${!compact ? html`<br>Current activity: ${context.activity}. ${context.resting && current.status === 'fresh'
                && current.reading.value !== null && current.reading.context?.resting && current.reading.context.zoneId === context.zoneId
                ? html`Resting difference: ${current.reading.value >= person.reference.restingHeartRate ? '+' : ''}${numberLabel(current.reading.value - person.reference.restingHeartRate, 'heart_rate')} bpm.`
                : 'Comparison waits for a current reading in a comparable resting context.'}` : ''}
            </p>` : ''}
            ${compact ? '' : html`<p>${metrics[metric].explanation}</p>`}
            ${!compact && metric === 'heart_rate' && person.id === vm.session.crewId && canSpeak() ? html`
              <button type="button" class="bs-button bs-button-plain" data-action="listen-pulse">
                ${icon('volume', 17)} Listen to current reading
              </button>` : ''}
          </div>
        </div>`)}
      </div>
    </div>
    ${!compact ? html`<p class="bs-body-key">Signal status describes the measurement. A review request describes follow-up that is still needed.</p>` : ''}
  </fieldset>`;
}
