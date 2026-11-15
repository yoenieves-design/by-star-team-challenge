import { html } from 'lit-html';
import type { Alert, CrewMember, Metric, ReadingState } from '../../domain/types.ts';
import { metrics, numberLabel } from '../../domain/metrics.ts';
import type { Progress } from '../../services/follow-up.ts';
import { clock, type ViewModel } from '../view-model.ts';
import { icon, type Icon } from './icons.ts';

export function avatar(person: CrewMember, large = false) {
  const initials = person.name.split(' ').map(word => word[0]).slice(0, 2).join('');
  return html`<span class="bs-avatar ${large ? 'bs-avatar-large' : ''}" data-tone=${person.tone} aria-hidden="true">${initials}</span>`;
}

export function tag(label: string, tone = 'muted', glyph?: Icon) {
  return html`<span class="bs-tag" data-tone=${tone}>${glyph ? icon(glyph, 14) : ''}${label}</span>`;
}

export const readingLabels = {
  fresh: 'Current reading',
  stale: 'Reading out of date',
  degraded: 'Signal degraded',
  unavailable: 'Data unavailable',
};

export function readingTag(status: ReadingState['status']) {
  if (status === 'fresh') return tag(readingLabels.fresh, 'green', 'check');
  return tag(readingLabels[status], status === 'degraded' ? 'amber' : 'muted', status === 'degraded' ? 'warning' : 'clock');
}

export function deviceReadingTag(readings: { current: ReadingState }[]) {
  const status = readings[0].current.status;
  if (readings.every(({ current }) => current.status === status)) return readingTag(status);
  const fresh = readings.filter(({ current }) => current.status === 'fresh').length;
  return tag(fresh + ' of ' + readings.length + ' readings current', 'amber', 'warning');
}

export function localLinkTag(available: boolean) {
  return tag(available ? 'Local link available' : 'Local link interrupted', available ? 'green' : 'amber', 'signal');
}

export function workTag(status: Progress['status']) {
  const labels = {
    new: 'New', acknowledged: 'Acknowledged', 'in-progress': 'In progress',
    paused: 'Paused', complete: 'Complete',
  };
  return tag(labels[status], status === 'complete' ? 'green' : status === 'new' ? 'amber' : 'muted');
}

export const alertLabels: Record<Alert['kind'], string> = {
  environment: 'Environment', sensor: 'Sensor', personal: 'Personal reading', concern: 'Crew report',
};

export function measurementValue(current: ReadingState, metric: Metric) {
  if (current.status !== 'fresh' || current.reading.value === null) return html`<span aria-label=${readingLabels[current.status]}>—</span>`;
  return html`${numberLabel(current.reading.value, metric)}<span class="bs-unit"> ${metrics[metric].unit}</span>`;
}

export function measurementDetail(vm: ViewModel, current: ReadingState) {
  const reading = current.reading;
  if (!reading) return 'No packet received';
  const device = vm.mission.devices.find(item => item.id === reading.deviceId);
  return (device?.name ?? reading.deviceId) + ' · ' + clock(vm.mission, reading.measuredAtS) + ' UTC';
}
