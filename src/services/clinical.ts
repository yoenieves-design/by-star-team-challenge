import type { ClinicalData, ClinicalInstrument, ClinicalObservation, ClinicalOrder, ClinicalReport, ImportedClinicalReport } from '../domain/clinical.ts';
import type { Mission, Procedure, Scenario, Session, Snapshot } from '../domain/types.ts';
import { progressFor, type WorkItem } from './follow-up.ts';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function id(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

function offset(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function revision(value: unknown): value is number {
  return offset(value) && value > 0;
}

function isOrder(value: unknown): value is ClinicalOrder {
  return record(value) && id(value.id) && id(value.crewId) && id(value.reviewerId) && id(value.specimenId)
    && value.specimen === 'urine' && value.testCode === 'urinalysis' && value.authorization === 'mission-plan'
    && offset(value.requestedAtS) && offset(value.dueAtS) && value.dueAtS >= value.requestedAtS;
}

function isInstrument(value: unknown): value is ClinicalInstrument {
  return record(value) && id(value.id) && id(value.zoneId) && typeof value.label === 'string'
    && value.label.trim().length > 0 && value.label.length <= 100 && value.method === 'urine-strip-reader';
}

function isObservation(value: unknown): value is ClinicalObservation {
  return record(value) && value.code === 'specific-gravity' && typeof value.value === 'number'
    && Number.isFinite(value.value) && value.unit === '1';
}

function isReport(value: unknown): value is ClinicalReport {
  return record(value) && id(value.id) && id(value.orderId) && id(value.crewId) && id(value.specimenId)
    && revision(value.revision) && (value.supersedesRevision === undefined || revision(value.supersedesRevision))
    && value.testCode === 'urinalysis' && id(value.instrumentId) && value.method === 'urine-strip-reader'
    && offset(value.collectedAtS) && offset(value.reportedAtS) && offset(value.receivedAtS)
    && value.collectedAtS <= value.reportedAtS && value.reportedAtS <= value.receivedAtS
    && (value.quality === 'passed' || value.quality === 'failed')
    && Array.isArray(value.observations) && value.observations.every(isObservation)
    && value.observations.length <= 1 && (value.quality === 'failed' || value.observations.length === 1);
}

function invalid(detail: string): never {
  throw new Error('Invalid clinical results feed. ' + detail);
}

export function clinicalReviewId(report: ClinicalReport) {
  return `clinical-${report.id}-v${report.revision}`;
}

function sameReport(first: ClinicalReport, second: ClinicalReport) {
  // Compare defined fields so retransmissions may reorder JSON properties.
  return first.orderId === second.orderId && first.crewId === second.crewId && first.specimenId === second.specimenId
    && first.instrumentId === second.instrumentId && first.method === second.method && first.testCode === second.testCode
    && first.collectedAtS === second.collectedAtS && first.reportedAtS === second.reportedAtS
    && first.quality === second.quality
    && first.supersedesRevision === second.supersedesRevision && first.observations.length === second.observations.length
    && first.observations.every((entry, index) => entry.code === second.observations[index].code
      && entry.value === second.observations[index].value && entry.unit === second.observations[index].unit);
}

function disposition(report: ClinicalReport, order: ClinicalOrder): ImportedClinicalReport {
  if (report.crewId !== order.crewId) return { ...report, status: 'held', reason: 'crew-mismatch' };
  if (report.specimenId !== order.specimenId) return { ...report, status: 'held', reason: 'specimen-mismatch' };
  if (report.quality === 'failed') return { ...report, status: 'held', reason: 'quality-failed' };
  return { ...report, status: 'accepted' };
}

export function validateClinicalData(input: unknown, mission: Mission, scenario: Scenario): ClinicalData {
  if (!record(input) || input.schemaVersion !== 1 || input.origin !== 'synthetic'
    || !Array.isArray(input.instruments) || !input.instruments.every(isInstrument)
    || !Array.isArray(input.orders) || !input.orders.every(isOrder)
    || !Array.isArray(input.reports) || !input.reports.every(isReport)) {
    return invalid('The schema version, instrument, order or report fields are unsupported.');
  }

  const instruments = new Map<string, ClinicalInstrument>();
  for (const instrument of input.instruments) {
    if (instruments.has(instrument.id) || !mission.zones.some(zone => zone.id === instrument.zoneId)) {
      return invalid(`Check the instrument registration for ${instrument.id}.`);
    }
    instruments.set(instrument.id, instrument);
  }

  const crew = new Map(mission.crew.map(person => [person.id, person]));
  const orders = new Map<string, ClinicalOrder>();
  const orderedSpecimens = new Set<string>();
  for (const order of input.orders) {
    if (orders.has(order.id) || orderedSpecimens.has(order.specimenId) || !crew.has(order.crewId)
      || !crew.has(order.reviewerId) || order.dueAtS > scenario.durationS) {
      return invalid(`Check the order, specimen or assigned clinician for ${order.id}.`);
    }
    orders.set(order.id, order);
    orderedSpecimens.add(order.specimenId);
  }

  const revisionKeys = new Map<string, ImportedClinicalReport>();
  const latestByOrder = new Map<string, ClinicalReport>();
  for (const report of [...input.reports].sort((a, b) => a.receivedAtS - b.receivedAtS)) {
    const order = orders.get(report.orderId);
    const instrument = instruments.get(report.instrumentId);
    if (!order || !crew.has(report.crewId) || instrument?.method !== report.method || report.testCode !== order.testCode
      || report.collectedAtS < order.requestedAtS || report.receivedAtS > scenario.durationS) {
      return invalid(`Check the report source, identity or timestamps for ${report.id}.`);
    }
    const key = clinicalReviewId(report);
    const duplicate = revisionKeys.get(key);
    if (duplicate) {
      if (!sameReport(duplicate, report)) return invalid(`Conflicting copies of ${report.id} revision ${report.revision}.`);
      continue;
    }
    const previous = latestByOrder.get(order.id);
    const hasLineage = previous ? report.id === previous.id && report.revision === previous.revision + 1
      && report.supersedesRevision === previous.revision && report.receivedAtS > previous.receivedAtS
      : report.revision === 1 && report.supersedesRevision === undefined;
    if (!hasLineage) return invalid(`Invalid correction history for ${report.id}.`);
    revisionKeys.set(key, disposition(report, order));
    latestByOrder.set(order.id, report);
  }

  return { schemaVersion: 1, origin: 'synthetic', instruments: [...instruments.values()], orders: [...orders.values()], reports: [...revisionKeys.values()] };
}

export async function loadClinicalData(base: URL, mission: Mission, scenario: Scenario): Promise<ClinicalData> {
  const response = await fetch(new URL('data/clinical-results.json', base), { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Clinical results returned HTTP ' + response.status + '.');
  return validateClinicalData(await response.json(), mission, scenario);
}

export function clinicalReportsFor(data: ClinicalData, orderId: string, atS: number) {
  return data.reports.filter(report => report.orderId === orderId && report.receivedAtS <= atS);
}

const review: Procedure = {
  id: 'clinical-result-review', version: 'Demo 1', title: 'Review the clinical result',
  purpose: 'Record the crew medical officer’s review of the imported report.',
  requiredEquipment: [], sourceIds: ['medical-operations', 'medical-evaluations'],
  steps: [
    { title: 'Verify the report', instruction: 'Use Clinical report to verify the crew and specimen identifiers, source, timestamps and quality.' },
    { title: 'Record the review', instruction: 'Choose the outcome of this report review. Any medical decision follows the approved mission procedure.' },
  ],
};

export function clinicalWork(_mission: Mission, snapshot: Snapshot, session: Session, data: ClinicalData): WorkItem[] {
  return data.orders.flatMap(order => {
    const received = clinicalReportsFor(data, order.id, snapshot.atS);
    const currentReport = received.at(-1);
    return received.map(report => {
      const id = clinicalReviewId(report);
      const ready = report === currentReport && report.status === 'accepted';
      return {
        id, title: 'Post-EVA urinalysis', detail: `Clinical report · Revision ${report.revision}`,
        crewIds: [order.crewId], procedure: review, clinical: true, requiredReviewerId: order.reviewerId,
        progress: progressFor(session.activity.filter(event => event.targetId === id && event.atS <= snapshot.atS), review.steps.length),
        available: ready,
      };
    });
  });
}
