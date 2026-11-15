import { stateFor, subjectKey } from '../domain/metrics.ts';
import type {
  ExerciseBodyMass, ExerciseData, ExerciseEffort, ExerciseEquipment, ExerciseMachineMetric, ExerciseMachineState,
  ExerciseOutcome, ExercisePacket, ExercisePhase, ExerciseRecord, ExerciseSession, ExerciseSnapshot,
} from '../domain/exercise.ts';
import type { Alert, Mission, Procedure, Reading, ReadingState, Scenario, ScenarioEvent, Session, Snapshot } from '../domain/types.ts';
import { progressFor, type WorkItem } from './follow-up.ts';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function id(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function seconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isEquipment(value: unknown): value is ExerciseEquipment {
  if (!record(value) || !id(value.id) || !text(value.name) || !text(value.description) || !text(value.sourceUrl)
    || !['cycle', 'treadmill', 'resistance'].some(kind => value.kind === kind)
    || (value.maxAgeS !== undefined && !(seconds(value.maxAgeS) && value.maxAgeS > 0))) return false;
  try {
    return new URL(value.sourceUrl).protocol === 'https:';
  } catch {
    return false;
  }
}

function isSession(value: unknown): value is ExerciseSession {
  return record(value) && id(value.id) && id(value.crewId) && id(value.equipmentId) && id(value.zoneId)
    && nonnegative(value.plannedDurationMin) && value.plannedDurationMin > 0
    && seconds(value.startAtS) && seconds(value.warmupEndsAtS) && seconds(value.steadyEndsAtS) && seconds(value.endAtS)
    && value.startAtS < value.warmupEndsAtS && value.warmupEndsAtS < value.steadyEndsAtS && value.steadyEndsAtS < value.endAtS
    && value.endAtS - value.startAtS < value.plannedDurationMin * 60
    && seconds(value.samplePeriodS) && value.samplePeriodS > 0 && value.samplePeriodS <= value.endAtS - value.startAtS
    && Array.isArray(value.heartRateDeviceIds) && value.heartRateDeviceIds.length > 0 && value.heartRateDeviceIds.every(id);
}

function isBodyMass(value: unknown): value is ExerciseBodyMass {
  return record(value) && id(value.id) && id(value.crewId) && nonnegative(value.value) && value.value > 0
    && id(value.instrumentId) && text(value.instrumentName)
    && value.unit === 'kg' && value.method === 'inertial-measurement' && value.origin === 'synthetic'
    && seconds(value.measuredAtS) && seconds(value.receivedAtS) && value.measuredAtS <= value.receivedAtS;
}

function isPacket(value: unknown): value is ExercisePacket {
  return record(value) && value.schemaVersion === 1 && value.origin === 'synthetic' && id(value.id)
    && seconds(value.sequence) && value.sequence > 0 && id(value.crewId) && id(value.sessionId) && id(value.equipmentId)
    && seconds(value.measuredAtS) && seconds(value.receivedAtS) && value.measuredAtS <= value.receivedAtS
    && record(value.power) && value.power.unit === 'W' && record(value.cadence) && value.cadence.unit === 'rpm'
    && (value.quality === 'unavailable' ? value.power.value === null && value.cadence.value === null
      : (value.quality === 'good' || value.quality === 'degraded') && nonnegative(value.power.value) && nonnegative(value.cadence.value));
}

function invalidExercise(detail: string): never {
  throw new Error('Invalid exercise data. ' + detail);
}

function samePacket(first: ExercisePacket, second: ExercisePacket) {
  // A retransmission can have a different reception time and transport ID.
  return first.sessionId === second.sessionId && first.equipmentId === second.equipmentId && first.crewId === second.crewId
    && first.sequence === second.sequence && first.measuredAtS === second.measuredAtS && first.quality === second.quality
    && first.power.value === second.power.value && first.cadence.value === second.cadence.value;
}

function machineState(packet: ExercisePacket | undefined, metric: ExerciseMachineMetric, maxAgeS: number, atS: number): ExerciseMachineState {
  if (!packet) return { status: 'unavailable' };
  const { measuredAtS, receivedAtS, quality, id: packetId } = packet;
  const reading = { ...packet[metric], measuredAtS, receivedAtS, quality, packetId };
  if (atS - measuredAtS > maxAgeS) return { status: 'stale', reading };
  return { status: quality === 'good' ? 'fresh' : quality, reading };
}

function firstMachineIncident(session: ExerciseSession, packets: ExercisePacket[], maxAgeS: number, scenario: Scenario) {
  const linkEvents = scenario.events.filter((event): event is Extract<ScenarioEvent, { type: 'link' }> =>
    event.type === 'link' && event.link === 'local').sort((a, b) => a.atS - b.atS);
  const candidates = new Set([session.startAtS + maxAgeS + 1, ...linkEvents.map(event => event.atS)]);
  for (const sample of packets) {
    candidates.add(sample.receivedAtS);
    candidates.add(sample.measuredAtS + maxAgeS + 1);
  }
  return [...candidates].sort((a, b) => a - b).find(atS => {
    if (atS > session.endAtS || atS < session.startAtS || linkEvents.findLast(event => event.atS <= atS)?.available === false) return false;
    const latest = packets.findLast(packet => packet.receivedAtS <= atS);
    return latest ? machineState(latest, 'power', maxAgeS, atS).status !== 'fresh' : atS > session.startAtS + maxAgeS;
  });
}

export function validateExerciseData(plan: unknown, stream: unknown, mission: Mission, scenario: Scenario): ExerciseData {
  if (!record(plan) || plan.schemaVersion !== 1 || plan.origin !== 'synthetic'
    || !Array.isArray(plan.equipment) || !plan.equipment.every(isEquipment)
    || !Array.isArray(plan.sessions) || !plan.sessions.every(isSession)
    || !Array.isArray(plan.bodyMassSamples) || !plan.bodyMassSamples.every(isBodyMass)
    || !Array.isArray(stream) || !stream.every(isPacket)) return invalidExercise('The plan or telemetry fields are unsupported.');

  const equipment = new Map<string, ExerciseEquipment>();
  for (const device of plan.equipment) {
    if (equipment.has(device.id)) return invalidExercise(`Check equipment ID ${device.id}.`);
    equipment.set(device.id, device);
  }

  const people = new Set(mission.crew.map(person => person.id));
  const zones = new Set(mission.zones.map(zone => zone.id));
  const pulseDevices = mission.devices.filter(device => device.subject.type === 'crew' && device.metrics.includes('heart_rate'));
  const sessions = new Map<string, ExerciseSession>();
  for (const session of plan.sessions) {
    const device = equipment.get(session.equipmentId);
    const overlaps = [...sessions.values()].some(other => (other.crewId === session.crewId || other.equipmentId === session.equipmentId)
      && session.startAtS <= other.endAtS && other.startAtS <= session.endAtS);
    if (sessions.has(session.id) || overlaps || !people.has(session.crewId) || !zones.has(session.zoneId)
      || session.endAtS > scenario.durationS || device?.kind !== 'cycle' || device.maxAgeS === undefined
      || new Set(session.heartRateDeviceIds).size !== session.heartRateDeviceIds.length
      || session.heartRateDeviceIds.some(id => !pulseDevices.some(sensor => sensor.id === id && sensor.subject.id === session.crewId))) {
      return invalidExercise(`Check the schedule, crew or registered sources for ${session.id}.`);
    }
    sessions.set(session.id, session);
  }

  const massIds = new Set<string>();
  for (const sample of plan.bodyMassSamples) {
    if (massIds.has(sample.id) || !people.has(sample.crewId) || sample.receivedAtS > scenario.durationS) {
      return invalidExercise(`Check the body mass sample ${sample.id}.`);
    }
    massIds.add(sample.id);
  }

  const sequenceKeys = new Map<string, ExercisePacket>();
  const packetIds = new Map<string, ExercisePacket>();
  for (const packet of [...stream].sort((a, b) => a.receivedAtS - b.receivedAtS)) {
    const session = sessions.get(packet.sessionId);
    if (!session || session.crewId !== packet.crewId || session.equipmentId !== packet.equipmentId
      || packet.measuredAtS > session.endAtS || packet.receivedAtS > scenario.durationS
      || packet.measuredAtS !== session.startAtS + (packet.sequence - 1) * session.samplePeriodS) {
      return invalidExercise(`Check the assigned source or measurement time for ${packet.id}.`);
    }
    const key = `${packet.sessionId}:${packet.sequence}`;
    const oldId = packetIds.get(packet.id);
    if (oldId && !samePacket(oldId, packet)) return invalidExercise(`Conflicting deliveries for ${packet.id}.`);
    const earlier = sequenceKeys.get(key) ?? oldId;
    if (earlier) {
      if (!samePacket(earlier, packet)) return invalidExercise(`Conflicting deliveries for ${packet.id}.`);
      packetIds.set(packet.id, earlier);
      continue;
    }
    sequenceKeys.set(key, packet);
    packetIds.set(packet.id, packet);
  }

  const packets = [...sequenceKeys.values()].sort((a, b) => a.measuredAtS - b.measuredAtS);
  const machineIncidents: Record<string, number> = Object.create(null);
  for (const session of sessions.values()) {
    const at = firstMachineIncident(session, packets.filter(packet => packet.sessionId === session.id),
      equipment.get(session.equipmentId)!.maxAgeS!, scenario);
    if (at !== undefined) machineIncidents[session.id] = at;
  }
  return { schemaVersion: 1, origin: 'synthetic', equipment: [...equipment.values()], sessions: [...sessions.values()],
    bodyMassSamples: plan.bodyMassSamples, packets, pulseDevices, machineIncidents };
}

export async function loadExerciseData(base: URL, mission: Mission, scenario: Scenario): Promise<ExerciseData> {
  async function read(path: string): Promise<unknown> {
    const response = await fetch(new URL(path, base), { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}.`);
    return response.json();
  }
  const [plan, packets] = await Promise.all([read('data/exercise-plan.json'), read('simulation/streams/exercise.json')]);
  return validateExerciseData(plan, packets, mission, scenario);
}

function exercisePhase(session: ExerciseSession, atS: number): ExercisePhase {
  if (atS < session.startAtS) return 'scheduled';
  if (atS < session.warmupEndsAtS) return 'warmup';
  if (atS < session.steadyEndsAtS) return 'steady';
  if (atS < session.endAtS) return 'cooldown';
  return 'complete';
}

function exerciseHeartHistory(snapshot: Snapshot, session: ExerciseSession) {
  const atS = Math.min(snapshot.atS, session.endAtS);
  const observations = snapshot.readings.get(subjectKey({ type: 'crew', id: session.crewId }, 'heart_rate')) ?? [];
  return observations.filter(item => session.heartRateDeviceIds.includes(item.deviceId) && item.measuredAtS >= session.startAtS
    && item.measuredAtS <= atS && item.receivedAtS <= snapshot.atS);
}

function bodySource(data: ExerciseData, snapshot: Snapshot, session: ExerciseSession) {
  const atS = Math.min(snapshot.atS, session.endAtS);
  const observations = exerciseHeartHistory(snapshot, session);
  const histories = session.heartRateDeviceIds.map(id => {
    const device = data.pulseDevices.find(item => item.id === id)!;
    const readings = observations.filter(item => item.deviceId === id);
    return { device, readings, current: stateFor(readings.at(-1), device, atS) };
  });
  const bestByTime = new Map<number, Reading>();
  for (const { device, readings } of histories) {
    for (const reading of readings) {
      const previous = bestByTime.get(reading.measuredAtS);
      const reliable = stateFor(reading, device, reading.receivedAtS).status === 'fresh';
      if (!previous || (reliable && stateFor(previous, data.pulseDevices.find(item => item.id === previous.deviceId), previous.receivedAtS).status !== 'fresh')) {
        bestByTime.set(reading.measuredAtS, reading);
      }
    }
  }
  const sources = histories.map(({ device, current }) => ({ device, current }));
  const heartRate: ReadingState = sources.find(entry => entry.current.status === 'fresh')?.current
    ?? sources.find(entry => entry.current.reading)?.current ?? { status: 'unavailable' };
  return { heartRate, sources, series: [...bestByTime.values()].sort((a, b) => a.measuredAtS - b.measuredAtS) };
}

function snapshotForExercise(data: ExerciseData, core: Snapshot, session: ExerciseSession): ExerciseSnapshot {
  const equipment = data.equipment.find(item => item.id === session.equipmentId)!;
  const atS = Math.min(core.atS, session.endAtS);
  const machineSeries = data.packets.filter(packet => packet.sessionId === session.id && packet.receivedAtS <= core.atS);
  const latest = machineSeries.at(-1);
  const bodyMass = data.bodyMassSamples.filter(sample => sample.crewId === session.crewId && sample.receivedAtS <= core.atS)
    .sort((a, b) => b.measuredAtS - a.measuredAtS || b.receivedAtS - a.receivedAtS)[0];
  return { session, equipment, phase: exercisePhase(session, core.atS), machineSeries, bodyMass,
    machine: { power: machineState(latest, 'power', equipment.maxAgeS!, atS), cadence: machineState(latest, 'cadence', equipment.maxAgeS!, atS) },
    body: bodySource(data, core, session),
  };
}

export function exerciseSnapshot(data: ExerciseData, coreSnapshot: Snapshot, crewId: string): ExerciseSnapshot | null {
  const assigned = data.sessions.filter(session => session.crewId === crewId).sort((a, b) => a.startAtS - b.startAtS);
  const session = assigned.findLast(candidate => candidate.startAtS <= coreSnapshot.atS) ?? assigned[0];
  return session ? snapshotForExercise(data, coreSnapshot, session) : null;
}

export function exerciseReviewId(record: ExerciseRecord) {
  return 'exercise-review-' + record.id;
}

export function exerciseSignalId(session: ExerciseSession) {
  return 'exercise-signal-' + session.id;
}

export function saveExerciseRecord(currentSession: Session, data: ExerciseData, snapshot: Snapshot,
  outcome: ExerciseOutcome, effort: ExerciseEffort): Session {
  if (!['excerpt-complete', 'stopped-early'].includes(outcome) || !['light', 'moderate', 'hard'].includes(effort)) {
    throw new Error('Select the exercise outcome and perceived effort.');
  }
  const view = exerciseSnapshot(data, snapshot, currentSession.crewId);
  if (!view || view.phase === 'scheduled') throw new Error('The active crew member has no exercise excerpt in progress.');
  const { session } = view;
  if ((view.phase === 'complete') !== (outcome === 'excerpt-complete')) {
    throw new Error('Choose the outcome that matches the excerpt time.');
  }

  const records = currentSession.exerciseRecords ?? [];
  const endAtS = Math.min(snapshot.atS, session.endAtS);
  const prior = records.findLast(item => item.sessionId === session.id && item.crewId === currentSession.crewId);
  if (prior && (prior.outcome === 'excerpt-complete' || prior.endedAtS >= endAtS)) {
    throw new Error('A record already covers this point in the exercise excerpt.');
  }

  const machinePackets = view.machineSeries.filter(item => item.measuredAtS <= endAtS);
  const reliableMachine = machinePackets.filter(packet => machineState(packet, 'power', view.equipment.maxAgeS!, packet.receivedAtS).status === 'fresh');
  const heartRateSamples = exerciseHeartHistory(snapshot, session);
  const reliableHeartRate = view.body.series.filter((reading): reading is Reading & { value: number } => reading.value !== null
    && stateFor(reading, data.pulseDevices.find(device => device.id === reading.deviceId), reading.receivedAtS).status === 'fresh');
  const expectedSamples = Math.floor((endAtS - session.startAtS) / session.samplePeriodS) + 1;
  const coverage = (samples: { measuredAtS: number }[]) => {
    const slots = new Set(samples.map(item => Math.floor((item.measuredAtS - session.startAtS) / session.samplePeriodS)));
    return Math.round(100 * slots.size / expectedSamples);
  };
  const values = reliableHeartRate.map(item => item.value);
  const revision = (prior?.revision ?? 0) + 1;
  const saved: ExerciseRecord = {
    id: `${session.id}-r${revision}`, revision, sessionId: session.id, crewId: session.crewId,
    equipmentId: session.equipmentId, zoneId: session.zoneId, startedAtS: session.startAtS, endedAtS: endAtS,
    savedAtS: snapshot.atS, outcome, effort, machinePackets, heartRateSamples, bodyMass: view.bodyMass,
    summary: { machineSamples: reliableMachine.length, heartRateSamples: values.length, expectedSamples,
      machineCoverage: coverage(reliableMachine), heartRateCoverage: coverage(reliableHeartRate),
      meanHeartRate: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null,
      maxHeartRate: values.length ? Math.max(...values) : null,
    },
  };
  return { ...currentSession, exerciseRecords: [...records, saved] };
}

const signalReview: Procedure = {
  id: 'exercise-machine-signal-review', version: 'Demo 1', title: 'Verify the exercise equipment stream',
  purpose: 'Record whether the cycle’s power and cadence data can be verified.',
  requiredEquipment: [], sourceIds: ['exercise', 'exercise-monitoring'],
  steps: [
    { title: 'Inspect the equipment signal', instruction: 'Open Exercise and verify the equipment name, last sample time and reception time for power and cadence.' },
    { title: 'Record the signal review', instruction: 'Choose the review outcome. Keep gaps in the record when data cannot be verified.' },
  ],
};

const excerptReview: Procedure = {
  id: 'exercise-record-review', version: 'Demo 1', title: 'Review the saved exercise excerpt',
  purpose: 'Check the recorded session outcome and the available exercise evidence.',
  requiredEquipment: [], sourceIds: ['exercise', 'exercise-monitoring', 'exercise-heart-rate'],
  steps: [
    { title: 'Inspect the saved excerpt', instruction: 'Verify the workout outcome, independently logged effort and the coverage of the equipment and body streams.' },
    { title: 'Record the excerpt review', instruction: 'Record what can be verified and whether further review is needed.' },
  ],
};

export function exerciseWork(mission: Mission, snapshot: Snapshot, session: Session, data: ExerciseData): WorkItem[] {
  const result: WorkItem[] = [];
  const progress = (id: string, procedure: Procedure) => progressFor(session.activity.filter(event => event.targetId === id && event.atS <= snapshot.atS), procedure.steps.length);
  for (const plan of data.sessions) {
    const atS = data.machineIncidents[plan.id];
    if (atS === undefined || atS > snapshot.atS) continue;
    const view = snapshotForExercise(data, snapshot, plan);
    const id = exerciseSignalId(plan);
    const title = 'Exercise equipment signal needs a check';
    const detail = `Review power and cadence from the cycle assigned to ${mission.crew.find(person => person.id === plan.crewId)?.name ?? plan.crewId}.`;
    const current = view.machine.power.status === 'fresh';
    const alert: Alert = { id, kind: 'sensor', title, detail, priority: 'review', atS, crewIds: [plan.crewId], zoneId: plan.zoneId, deviceId: plan.equipmentId,
      evidence: [], procedureId: signalReview.id, reason: 'No current reliable equipment sample while the local link was available.' };
    result.push({ id, title, detail, crewIds: alert.crewIds, alert, procedure: signalReview, available: true, exercise: true,
      progress: progress(id, signalReview), condition: snapshot.links.local ? (current
        ? { status: 'no-longer-detected', label: 'Machine data received', detail: 'The power and cadence stream has a current sample in the excerpt.' }
        : { status: 'active', label: 'Machine readings unavailable', detail: 'Power and cadence cannot currently be verified.' })
        : { status: 'unknown', label: 'Local link interrupted', detail: 'Current equipment availability cannot be verified while the local link is down.' },
    });
  }

  for (const record of session.exerciseRecords ?? []) {
    if (record.savedAtS > snapshot.atS) continue;
    const id = exerciseReviewId(record);
    const detail = record.outcome === 'stopped-early' ? 'The excerpt was saved before the scheduled end.'
      : record.summary.machineCoverage < 100 || record.summary.heartRateCoverage < 100
        ? 'The saved excerpt includes gaps in equipment or heart-rate coverage.' : 'The saved excerpt is ready for review.';
    result.push({ id, title: 'Saved exercise excerpt needs review', detail, crewIds: [record.crewId], procedure: excerptReview,
      progress: progress(id, excerptReview), available: true, exercise: true,
    });
  }
  return result;
}
