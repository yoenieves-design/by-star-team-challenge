import type { Alert, Link, ReplayData, Snapshot } from '../domain/types.ts';
import { concernAlert, detectAlerts } from './monitoring.ts';
import { normalizeTelemetry } from './telemetry.ts';

export function createReplay(data: ReplayData) {
  const { mission, scenario } = data;
  const telemetry = normalizeTelemetry(data);
  const recorded = new Map<string, Alert>();
  const linkEvents = scenario.events.filter(event => event.type === 'link').sort((a, b) => a.atS - b.atS);

  function snapshot(atS: number): Snapshot {
    const time = Math.max(0, Math.min(scenario.durationS, Math.floor(atS)));
    const links: Record<Link, boolean> = { local: true, earth: true };
    for (const event of linkEvents) {
      if (event.atS > time) break;
      links[event.link] = event.available;
    }
    const readings: Snapshot['readings'] = new Map();
    for (const [key, values] of telemetry.histories) {
      readings.set(key, values.filter(item => item.receivedAtS <= time));
    }
    const latestPackets: Snapshot['latestPackets'] = new Map();
    for (const [deviceId, packets] of telemetry.packetsByDevice) {
      const packet = packets.findLast(item => item.receivedAtS <= time);
      if (packet) latestPackets.set(deviceId, packet);
    }
    return {
      atS: time, context: telemetry.contextAt(time), links, readings, latestPackets,
      alerts: [...recorded.values()].filter(item => item.atS <= time).sort((a, b) => a.atS - b.atS),
    };
  }

  // Replay at arrivals, expiry boundaries and context changes. Results do not depend on playback speed.
  const times = new Set([0, ...telemetry.refreshTimes, ...scenario.events.map(event => event.atS)]);
  // A silent device still needs a startup deadline even if it never sends a packet.
  for (const device of mission.devices) times.add(device.maxAgeS + 1);
  for (const atS of [...times].filter(time => time <= scenario.durationS).sort((a, b) => a - b)) {
    const frame = snapshot(atS);
    for (const alert of detectAlerts(mission, frame)) {
      if (!recorded.has(alert.id)) recorded.set(alert.id, alert);
    }
    for (const event of scenario.events) {
      if (event.type !== 'concern' || event.atS !== atS) continue;
      const id = 'scenario-report-' + event.crewId + '-' + event.atS;
      recorded.set(id, concernAlert(id, event.crewId, event.category, atS, frame.context[event.crewId].zoneId));
    }
  }
  return { snapshot, duplicateCount: telemetry.duplicateCount, rejectedCount: telemetry.rejectedCount };
}
