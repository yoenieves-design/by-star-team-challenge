import type { Mission, Packet, Scenario } from '../domain/types.ts';

interface Validator<T> {
  (input: unknown): input is T;
  errors?: { instancePath: string; message?: string }[] | null;
}

export const validateMission: Validator<Mission>;
export const validateScenario: Validator<Scenario>;
export const validatePackets: Validator<Packet[]>;
