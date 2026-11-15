export interface ClinicalOrder {
  id: string;
  crewId: string;
  reviewerId: string;
  specimenId: string;
  specimen: 'urine';
  testCode: 'urinalysis';
  authorization: 'mission-plan';
  requestedAtS: number;
  dueAtS: number;
}

export interface ClinicalObservation {
  code: 'specific-gravity';
  value: number;
  unit: '1';
}

export interface ClinicalInstrument {
  id: string;
  label: string;
  zoneId: string;
  method: 'urine-strip-reader';
}

export interface ClinicalReport {
  id: string;
  revision: number;
  supersedesRevision?: number;
  orderId: string;
  crewId: string;
  specimenId: string;
  testCode: 'urinalysis';
  instrumentId: string;
  method: 'urine-strip-reader';
  collectedAtS: number;
  reportedAtS: number;
  receivedAtS: number;
  quality: 'passed' | 'failed';
  observations: ClinicalObservation[];
}

export type ImportedClinicalReport = ClinicalReport & (
  { status: 'accepted' } |
  { status: 'held'; reason: 'crew-mismatch' | 'specimen-mismatch' | 'quality-failed' }
);

export interface ClinicalData {
  schemaVersion: 1;
  origin: 'synthetic';
  instruments: ClinicalInstrument[];
  orders: ClinicalOrder[];
  reports: ImportedClinicalReport[];
}
