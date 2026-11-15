import { metrics, subjectKey } from '../domain/metrics.ts';
import type { CrewContext, Packet, Reading, ReplayData } from '../domain/types.ts';

export function createContextLookup({ scenario }: ReplayData) {
  const changes = scenario.events.filter(event => event.type === 'context').sort((a, b) => a.atS - b.atS);
  return (atS: number) => {
    const context: Record<string, CrewContext> = { ...scenario.initialContext };
    for (const event of changes) {
      if (event.atS > atS) break;
      context[event.crewId] = event.context;
    }
    return context;
  };
}

function matchesDevice(packet: Packet, data: ReplayData) {
  const device = data.mission.devices.find(item => item.id === packet.deviceId);
  if (!device || device.subject.type !== packet.subject.type || device.subject.id !== packet.subject.id
    || packet.receivedAtS < packet.measuredAtS || packet.receivedAtS > data.scenario.durationS) return false;
  const distinct = new Set(packet.measurements.map(item => item.metric));
  return distinct.size === packet.measurements.length && packet.measurements.every(item =>
    device.metrics.includes(item.metric) && metrics[item.metric].unit === item.unit
    && (item.value === null ? item.quality === 'unavailable' : Number.isFinite(item.value) && item.quality !== 'unavailable'));
}

export function normalizeTelemetry(data: ReplayData) {
  const contextAt = createContextLookup(data);
  const histories = new Map<string, Reading[]>();
  const packetsByDevice = new Map<string, Packet[]>();
  const ids = new Set<string>();
  const sequences = new Set<string>();
  const refreshTimes = new Set<number>();
  let duplicateCount = 0;
  let rejectedCount = 0;

  const arrivals = [...data.packets].sort((a, b) => a.receivedAtS - b.receivedAtS);
  for (const packet of arrivals) {
    const sequenceKey = packet.deviceId + ':' + packet.sequence;
    if (!matchesDevice(packet, data)) {
      rejectedCount += 1;
      continue;
    }
    if (ids.has(packet.id) || sequences.has(sequenceKey)) {
      duplicateCount += 1;
      continue;
    }
    ids.add(packet.id);
    sequences.add(sequenceKey);
    const devicePackets = packetsByDevice.get(packet.deviceId) ?? [];
    devicePackets.push(packet);
    packetsByDevice.set(packet.deviceId, devicePackets);
    const { measurements, ...envelope } = packet;
    const context = packet.subject.type === 'crew' ? contextAt(packet.measuredAtS)[packet.subject.id] : undefined;
    for (const item of measurements) {
      const key = subjectKey(packet.subject, item.metric);
      const series = histories.get(key) || [];
      series.push({ ...envelope, ...item, context });
      histories.set(key, series);
    }
    const device = data.mission.devices.find(item => item.id === packet.deviceId)!;
    refreshTimes.add(packet.receivedAtS);
    refreshTimes.add(packet.measuredAtS + device.maxAgeS + 1);
  }

  // Latest means newest measurement, even when an older packet arrives later.
  for (const series of histories.values()) {
    series.sort((a, b) => a.measuredAtS - b.measuredAtS || a.receivedAtS - b.receivedAtS || a.sequence - b.sequence);
  }
  return { contextAt, histories, packetsByDevice, refreshTimes, duplicateCount, rejectedCount };
}
