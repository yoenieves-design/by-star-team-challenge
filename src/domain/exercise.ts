import type { Device, Quality, Reading, ReadingState } from './types.ts';

export type ExerciseMachineMetric = 'power' | 'cadence';
export type ExercisePhase = 'scheduled' | 'warmup' | 'steady' | 'cooldown' | 'complete';
export type ExerciseOutcome = 'excerpt-complete' | 'stopped-early';
export type ExerciseEffort = 'light' | 'moderate' | 'hard';

export interface ExerciseEquipment {
  id: string;
  name: string;
  kind: 'cycle' | 'treadmill' | 'resistance';
  description: string;
  sourceUrl: string;
  maxAgeS?: number;
}

export interface ExerciseSession {
  id: string;
  crewId: string;
  equipmentId: string;
  zoneId: string;
  plannedDurationMin: number;
  startAtS: number;
  warmupEndsAtS: number;
  steadyEndsAtS: number;
  endAtS: number;
  samplePeriodS: number;
  heartRateDeviceIds: string[];
}

export interface ExerciseBodyMass {
  id: string;
  crewId: string;
  instrumentId: string;
  instrumentName: string;
  value: number;
  unit: 'kg';
  method: 'inertial-measurement';
  measuredAtS: number;
  receivedAtS: number;
  origin: 'synthetic';
}

export interface ExercisePacket {
  schemaVersion: 1;
  id: string;
  sequence: number;
  crewId: string;
  sessionId: string;
  equipmentId: string;
  measuredAtS: number;
  receivedAtS: number;
  origin: 'synthetic';
  quality: Quality;
  power: { value: number | null; unit: 'W' };
  cadence: { value: number | null; unit: 'rpm' };
}

export interface ExercisePlan {
  schemaVersion: 1;
  origin: 'synthetic';
  equipment: ExerciseEquipment[];
  sessions: ExerciseSession[];
  bodyMassSamples: ExerciseBodyMass[];
}

export interface ExerciseData extends ExercisePlan {
  packets: ExercisePacket[];
  pulseDevices: Device[];
  machineIncidents: Record<string, number>;
}

export interface ExerciseMachineReading {
  value: number | null;
  unit: 'W' | 'rpm';
  measuredAtS: number;
  receivedAtS: number;
  quality: Quality;
  packetId: string;
}

export interface ExerciseMachineState {
  status: ReadingState['status'];
  reading?: ExerciseMachineReading;
}

export interface ExerciseSnapshot {
  session: ExerciseSession;
  equipment: ExerciseEquipment;
  phase: ExercisePhase;
  machine: Record<ExerciseMachineMetric, ExerciseMachineState>;
  machineSeries: ExercisePacket[];
  body: {
    heartRate: ReadingState;
    sources: { device: Device; current: ReadingState }[];
    series: Reading[];
  };
  bodyMass?: ExerciseBodyMass;
}

export interface ExerciseRecord {
  id: string;
  revision: number;
  sessionId: string;
  crewId: string;
  equipmentId: string;
  zoneId: string;
  startedAtS: number;
  endedAtS: number;
  savedAtS: number;
  outcome: ExerciseOutcome;
  effort: ExerciseEffort;
  machinePackets: ExercisePacket[];
  heartRateSamples: Reading[];
  bodyMass?: ExerciseBodyMass;
  summary: {
    machineSamples: number;
    heartRateSamples: number;
    expectedSamples: number;
    machineCoverage: number;
    heartRateCoverage: number;
    meanHeartRate: number | null;
    maxHeartRate: number | null;
  };
}
