import { validateMission, validatePackets, validateScenario } from './validators.generated.js';
import type { CrewContext, Mission, ReplayData, Scenario } from '../domain/types.ts';

async function readJson(base: URL, file: string): Promise<unknown> {
  const response = await fetch(new URL(file, base), { credentials: 'same-origin' });
  if (!response.ok) throw new Error(file + ' returned HTTP ' + response.status + '.');
  try {
    return await response.json();
  } catch {
    throw new Error(file + ' is not valid JSON.');
  }
}

function requireUnique(items: { id: string }[], label: string) {
  const ids = new Set(items.map(item => item.id));
  if (ids.size !== items.length) throw new Error(label + ' has duplicate identifiers.');
  return ids;
}

export function checkConfiguration(mission: Mission, scenario: Scenario) {
  const crew = requireUnique(mission.crew, 'Crew data');
  const zones = requireUnique(mission.zones, 'Zone data');
  const procedures = requireUnique(mission.procedures, 'Procedure data');
  const sources = requireUnique(mission.sources, 'Source data');
  requireUnique(mission.devices, 'Device data');
  requireUnique(mission.tasks, 'Schedule');
  const withinTimeline = (seconds: number) => seconds >= 0 && seconds <= scenario.durationS;
  const validContext = (context: CrewContext | undefined) =>
    context && zones.has(context.zoneId) && zones.has(context.breathingZoneId);

  if (!Number.isFinite(Date.parse(mission.startUtc)) || !withinTimeline(scenario.briefingAtS)
    || !crew.has(scenario.defaultCrewId)) throw new Error('Mission start or briefing is invalid.');

  if (Object.keys(scenario.initialContext).some(id => !crew.has(id))
    || mission.crew.some(person => !validContext(scenario.initialContext[person.id]) || !crew.has(person.buddyId))) {
    throw new Error('Each crew member needs a verified buddy and initial location.');
  }
  if (mission.devices.some(device => !(device.subject.type === 'crew' ? crew : zones).has(device.subject.id)
    || (device.assignedCrewId && !crew.has(device.assignedCrewId)))) {
    throw new Error('A device is assigned to an unknown crew member or zone.');
  }
  if (mission.tasks.some(task => !crew.has(task.crewId) || !procedures.has(task.procedureId)
    || !withinTimeline(task.opensAtS) || task.dueAtS < task.opensAtS)) throw new Error('A scheduled task is invalid.');
  if (mission.procedures.some(procedure => procedure.sourceIds.some(id => !sources.has(id)))
    || ['air-review', 'sensor-check', 'crew-review'].some(id => !procedures.has(id))) {
    throw new Error('A required procedure or source is missing.');
  }
  if (scenario.events.some(event => !withinTimeline(event.atS)
    || ('crewId' in event && !crew.has(event.crewId))
    || (event.type === 'context' && !validContext(event.context)))) throw new Error('A scenario event has an invalid subject, time or zone.');
  if (scenario.milestones.some((milestone, index, items) => !withinTimeline(milestone.atS)
    || (index > 0 && milestone.atS <= items[index - 1].atS))) throw new Error('Replay milestones must be in time order.');
}

export async function loadDemoData(base: URL): Promise<ReplayData> {
  const [mission, scenario, personal, environment] = await Promise.all([
    readJson(base, 'data/mission.json'),
    readJson(base, 'simulation/eva-return.json'),
    readJson(base, 'simulation/streams/personal.json'),
    readJson(base, 'simulation/streams/environment.json'),
  ]);
  if (!validateMission(mission)) throw new Error('Invalid mission data at ' + (validateMission.errors?.[0]?.instancePath || '/'));
  if (!validateScenario(scenario)) throw new Error('Invalid scenario at ' + (validateScenario.errors?.[0]?.instancePath || '/'));
  if (!validatePackets(personal) || !validatePackets(environment)) {
    throw new Error('Invalid telemetry packet at ' + (validatePackets.errors?.[0]?.instancePath || '/'));
  }
  checkConfiguration(mission, scenario);
  return { mission, scenario, packets: [...personal, ...environment] };
}
