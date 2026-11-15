import type { Device, Metric, Reading, ReadingState, Snapshot, Subject } from './types.ts';

export const metrics: Record<Metric, { label: string; unit: string; digits: number; subjectType: Subject['type']; explanation: string }> = {
  heart_rate: { label: 'Heart rate', unit: 'bpm', digits: 0, subjectType: 'crew', explanation: 'Compare similar activities and check signal quality before interpreting a change.' },
  skin_temperature: { label: 'Skin temperature', unit: '°C', digits: 1, subjectType: 'crew', explanation: 'A contact sensor reads skin temperature. The reading can vary with the suit, activity and surrounding air.' },
  activity: { label: 'Movement', unit: 'counts/min', digits: 0, subjectType: 'crew', explanation: 'Movement counts are an estimate from the wrist monitor.' },
  oxygen: { label: 'Oxygen fraction', unit: '%', digits: 1, subjectType: 'zone', explanation: 'Oxygen fraction in the selected breathing environment. Read it alongside total pressure.' },
  carbon_dioxide: { label: 'CO₂ partial pressure', unit: 'kPa', digits: 2, subjectType: 'zone', explanation: 'Partial pressure measured by the air monitor in this zone.' },
  pressure: { label: 'Total pressure', unit: 'kPa', digits: 1, subjectType: 'zone', explanation: 'Total pressure in the selected breathing environment.' },
};

export const metricIds = Object.keys(metrics) as Metric[];

export function isMetric(value: string): value is Metric {
  return Object.hasOwn(metrics, value);
}
export function subjectKey(subject: Subject, metric: Metric) {
  return subject.type + ':' + subject.id + ':' + metric;
}

export function numberLabel(value: number, metric: Metric) {
  return value.toFixed(metrics[metric].digits);
}

export function stateFor(reading: Reading | undefined, device: Device | undefined, atS: number): ReadingState {
  if (!reading || !device) return { status: 'unavailable' };
  if (atS - reading.measuredAtS > device.maxAgeS) return { status: 'stale', reading };
  if (reading.quality === 'unavailable') return { status: 'unavailable', reading };
  if (reading.quality === 'degraded') return { status: 'degraded', reading };
  return { status: 'fresh', reading };
}

export function latestReading(snapshot: Snapshot, devices: Device[], subject: Subject, metric: Metric) {
  const reading = snapshot.readings.get(subjectKey(subject, metric))?.at(-1);
  return stateFor(reading, devices.find(device => device.id === reading?.deviceId), snapshot.atS);
}

export function deviceReadings(snapshot: Snapshot, device: Device) {
  return device.metrics.map(metric => {
    const reading = snapshot.readings.get(subjectKey(device.subject, metric))?.findLast(item => item.deviceId === device.id);
    return { metric, current: stateFor(reading, device, snapshot.atS) };
  });
}
