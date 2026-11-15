import type { ExerciseRecord } from './exercise.ts';

export type Metric = 'heart_rate' | 'skin_temperature' | 'activity' | 'oxygen' | 'carbon_dioxide' | 'pressure';
export type Quality = 'good' | 'degraded' | 'unavailable';
export type Subject = { type: 'crew' | 'zone'; id: string };
export type Link = 'local' | 'earth';
export type Phase = 'preparation' | 'eva' | 'return' | 'recovery' | 'routine' | 'exercise';

export interface Device {
  id: string;
  name: string;
  subject: Subject;
  assignedCrewId?: string;
  metrics: Metric[];
  maxAgeS: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  tone: string;
  buddyId: string;
  reference: { restingHeartRate: number; basis: string };
}

export interface CrewContext {
  zoneId: string;
  breathingZoneId: string;
  phase: Phase;
  activity: string;
  resting: boolean;
}

export interface Zone {
  id: string;
  name: string;
  kind: string;
  equipment: string[];
}

export interface Measurement {
  metric: Metric;
  value: number | null;
  unit: string;
  quality: Quality;
}

export interface Packet {
  schemaVersion: 1;
  id: string;
  sequence: number;
  deviceId: string;
  subject: Subject;
  measuredAtS: number;
  receivedAtS: number;
  origin: 'synthetic';
  measurements: Measurement[];
}

export type Reading = Measurement & Omit<Packet, 'measurements'> & { context?: CrewContext };

export interface Procedure {
  id: string;
  version: string;
  title: string;
  purpose: string;
  requiredEquipment: string[];
  steps: { title: string; instruction: string; requiresAssignee?: boolean; requiresCheckIn?: boolean }[];
  sourceIds: string[];
}

export interface Task {
  id: string;
  title: string;
  reason: string;
  crewId: string;
  opensAtS: number;
  dueAtS: number;
  phase?: Phase;
  procedureId: string;
}

export interface Mission {
  schemaVersion: 1;
  code: string;
  name: string;
  location: string;
  missionDay: number;
  startUtc: string;
  crew: CrewMember[];
  zones: Zone[];
  devices: Device[];
  tasks: Task[];
  procedures: Procedure[];
  rules: {
    version: string;
    co2RiseKpa: number;
    co2WindowS: number;
    restingPulseDeltaBpm: number;
  };
  sources: { id: string; title: string; description: string; url: string }[];
}

export type ScenarioEvent =
  | { type: 'context'; atS: number; crewId: string; context: CrewContext }
  | { type: 'link'; atS: number; link: Link; available: boolean }
  | { type: 'concern'; atS: number; crewId: string; category: string };

export interface Scenario {
  schemaVersion: 1;
  id: string;
  title: string;
  durationS: number;
  briefingAtS: number;
  defaultCrewId: string;
  initialContext: Record<string, CrewContext>;
  milestones: { atS: number; label: string }[];
  events: ScenarioEvent[];
}

export interface ReplayData {
  mission: Mission;
  scenario: Scenario;
  packets: Packet[];
}

export type ReadingState =
  | { status: 'fresh' | 'stale' | 'degraded' | 'unavailable'; reading: Reading }
  | { status: 'unavailable'; reading?: undefined };

export interface Alert {
  id: string;
  kind: 'environment' | 'sensor' | 'personal' | 'concern';
  title: string;
  detail: string;
  priority: 'review' | 'support';
  atS: number;
  crewIds: string[];
  zoneId?: string;
  deviceId?: string;
  evidence: Reading[];
  procedureId: string;
  reason: string;
  /** Stable rule key; later occurrences retain their own incident identifier. */
  episodeKey?: string;
  /** Time when new, usable observations confirmed that this episode ended. */
  conditionEndedAtS?: number;
}

export type ReviewOutcome = 'verified' | 'unable-to-verify' | 'further-review';

export interface AlertCondition {
  status: 'active' | 'no-longer-detected' | 'unknown' | 'reported';
  label: string;
  detail: string;
}

export interface Snapshot {
  atS: number;
  context: Record<string, CrewContext>;
  links: Record<Link, boolean>;
  readings: Map<string, Reading[]>;
  latestPackets: Map<string, Packet>;
  alerts: Alert[];
}

export type FollowUpEvent =
  | { type: 'acknowledge'; targetId: string }
  | { type: 'assign'; targetId: string; assigneeId: string }
  | { type: 'open'; targetId: string }
  | { type: 'step'; targetId: string; step: number }
  | { type: 'outcome'; targetId: string; outcome: ReviewOutcome }
  | { type: 'reopen'; targetId: string }
  | { type: 'pause' | 'resume' | 'request-support' | 'receipt'; targetId: string }
  | { type: 'report'; targetId: string; category: string; exerciseSessionId?: string }
  | { type: 'check-in'; targetId: string; sleep: 'rested' | 'mixed' | 'poor'; fatigue: 'low' | 'moderate' | 'high';
      concern: string; onset: 'now' | 'earlier' | 'unsure' };

export type OperatorEvent = FollowUpEvent & { atS: number; actorId: string; zoneId?: string };

export interface Session {
  version: 1;
  scenarioId: string;
  anchorS: number;
  playingSince: number | null;
  speed: 1 | 2 | 4 | 8;
  crewId: string;
  simple: boolean;
  activity: OperatorEvent[];
  /** Saved workout observations are independent of the procedural review log. */
  exerciseRecords?: ExerciseRecord[];
}
