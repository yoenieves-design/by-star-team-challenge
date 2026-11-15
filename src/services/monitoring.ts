import { deviceReadings, latestReading, subjectKey } from '../domain/metrics.ts';
import type { Alert, Mission, Reading, Snapshot } from '../domain/types.ts';

export function concernAlert(id: string, crewId: string, category: string, atS: number, zoneId?: string): Alert {
  return {
    id, kind: 'concern', title: 'Crew concern reported', detail: category,
    priority: 'support', atS, crewIds: [crewId], zoneId, evidence: [],
    procedureId: 'crew-review', reason: 'Crew report',
  };
}

function usable(reading: Reading): reading is Reading & { value: number } {
  return reading.quality === 'good' && reading.value !== null;
}

function airChanges(mission: Mission, snapshot: Snapshot) {
  const alerts: Alert[] = [];
  const rule = mission.rules;
  for (const zone of mission.zones) {
    const crewIds = Object.keys(snapshot.context).filter(id => snapshot.context[id].breathingZoneId === zone.id);
    if (!crewIds.length) continue;
    const subject = { type: 'zone' as const, id: zone.id };
    const current = latestReading(snapshot, mission.devices, subject, 'carbon_dioxide');
    if (current.status !== 'fresh' || !usable(current.reading)) continue;
    const latest = current.reading;
    const earlier = snapshot.readings.get(subjectKey(subject, 'carbon_dioxide'))?.find(item =>
      usable(item) && item.measuredAtS >= latest.measuredAtS - rule.co2WindowS && item.measuredAtS < latest.measuredAtS);
    if (!earlier || !usable(earlier) || latest.value - earlier.value < rule.co2RiseKpa) continue;
    alerts.push({
      id: 'air-' + zone.id, kind: 'environment', title: 'Cabin CO₂ change needs review',
      detail: 'The air monitor recorded a rise in the ' + zone.name.toLowerCase() + '. Review the readings and assign a follow-up.',
      priority: 'review', atS: snapshot.atS, crewIds, zoneId: zone.id, evidence: [earlier, latest],
      procedureId: 'air-review',
      reason: rule.version + ' change rule: a rise of at least ' + rule.co2RiseKpa.toFixed(2) + ' kPa within ' + rule.co2WindowS + ' simulation seconds.',
    });
  }
  return alerts;
}

function sensorChanges(mission: Mission, snapshot: Snapshot) {
  if (!snapshot.links.local) return [];
  const alerts: Alert[] = [];
  for (const device of mission.devices) {
    const affected = deviceReadings(snapshot, device).filter(({ current }) =>
      current.status !== 'fresh' && (current.reading || snapshot.atS > device.maxAgeS));
    if (!affected.length) continue;

    const subject = device.subject;
    const crewId = subject.type === 'crew' ? subject.id : device.assignedCrewId;
    const zoneId = subject.type === 'zone' ? subject.id : snapshot.context[subject.id].zoneId;
    const crewIds = crewId ? [crewId] : Object.keys(snapshot.context).filter(id => snapshot.context[id].breathingZoneId === zoneId);
    // Preserve the IDs used by existing wrist monitor follow-ups.
    const wrist = subject.type === 'crew' && device.id === 'wrist-' + subject.id;
    alerts.push({
      id: wrist ? 'signal-' + subject.id : 'device-signal-' + device.id,
      kind: 'sensor', deviceId: device.id, title: wrist ? 'Wrist monitor needs a check' : 'Sensor needs a check',
      detail: `Review ${affected.length} of ${device.metrics.length} readings from ${device.name}.`,
      priority: 'review', atS: snapshot.atS, crewIds, zoneId,
      evidence: affected.flatMap(({ current }) => current.reading ? [current.reading] : []),
      procedureId: 'sensor-check', reason: 'The device has missing, expired or degraded readings.',
    });
  }
  return alerts;
}

function personalChanges(mission: Mission, snapshot: Snapshot) {
  const alerts: Alert[] = [];
  for (const person of mission.crew) {
    const subject = { type: 'crew' as const, id: person.id };
    const context = snapshot.context[person.id];
    const current = latestReading(snapshot, mission.devices, subject, 'heart_rate');
    if (!context.resting || current.status !== 'fresh') continue;
    const history = snapshot.readings.get(subjectKey(subject, 'heart_rate')) || [];
    const pair = history.slice(-2).filter(usable);
    const limit = person.reference.restingHeartRate + mission.rules.restingPulseDeltaBpm;
    if (pair.length !== 2 || pair[0].measuredAtS === pair[1].measuredAtS || pair[1].measuredAtS - pair[0].measuredAtS > 18
      || pair.some(item => !item.context?.resting || item.context.zoneId !== context.zoneId || item.value < limit)) continue;
    alerts.push({
      id: 'pulse-' + person.id, kind: 'personal', title: 'Resting heart rate changed',
      detail: 'Two recent resting readings differ from ' + person.name + '’s fictional reference.',
      priority: 'review', atS: snapshot.atS, crewIds: [person.id], zoneId: context.zoneId,
      evidence: pair, procedureId: 'crew-review',
      reason: mission.rules.version + ' change rule: two comparable readings at least ' + mission.rules.restingPulseDeltaBpm + ' bpm above the fictional reference.',
    });
  }
  return alerts;
}

export function detectAlerts(mission: Mission, snapshot: Snapshot) {
  return [...airChanges(mission, snapshot), ...sensorChanges(mission, snapshot), ...personalChanges(mission, snapshot)];
}
