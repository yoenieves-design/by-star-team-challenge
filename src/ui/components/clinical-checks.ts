import { html } from 'lit-html';
import type { ClinicalData, ClinicalOrder, ImportedClinicalReport } from '../../domain/clinical.ts';
import { clinicalReportsFor, clinicalReviewId } from '../../services/clinical.ts';
import { isWorkPending } from '../../services/follow-up.ts';
import { clock, currentPerson, personName, zoneName, type ViewModel } from '../view-model.ts';
import { tag } from './common.ts';
import { icon } from './icons.ts';

const holdReasons = {
  'specimen-mismatch': 'The report specimen ID does not match the ordered specimen.',
  'crew-mismatch': 'The report crew ID does not match the person on the order.',
  'quality-failed': 'The instrument reported a failed quality check.',
};

function clinicalStatus(vm: ViewModel, order: ClinicalOrder, report: ImportedClinicalReport | undefined) {
  if (report?.status === 'held') return tag('Report held', 'amber', 'warning');
  if (report) {
    const work = vm.work.find(item => item.id === clinicalReviewId(report));
    if (work?.progress.status !== 'complete') return tag('Ready for medical review', 'muted', 'assist');
    return isWorkPending(work) ? tag('Follow-up pending', 'amber', 'warning') : tag('Review recorded', 'green', 'check');
  }
  return vm.snapshot.atS < order.requestedAtS ? tag('Planned', 'muted', 'calendar') : tag('Awaiting result', 'muted', 'clock');
}

function reportDetails(vm: ViewModel, data: ClinicalData, order: ClinicalOrder, report: ImportedClinicalReport, superseded = false) {
  const instrument = data.instruments.find(item => item.id === report.instrumentId)!;
  return html`${superseded ? html`<p>${tag('Superseded report', 'muted')}</p>` : ''}
    ${report.status === 'held' ? html`<p class="bs-warning-note"><strong>Report held.</strong> ${holdReasons[report.reason]}</p>` : ''}
    <dl class="bs-definition-list">
      <div><dt>Order</dt><dd>${order.id} · Mission plan</dd></div>
      <div><dt>Crew member</dt><dd>${personName(vm, order.crewId)}</dd></div>
      <div><dt>Assigned reviewer</dt><dd>${personName(vm, order.reviewerId)}</dd></div>
      <div><dt>Specimen</dt><dd>Urine · ${order.specimenId}</dd></div>
      ${report.specimenId !== order.specimenId ? html`<div><dt>Specimen ID on report</dt><dd>${report.specimenId}</dd></div>` : ''}
      <div><dt>Report</dt><dd>${report.id} · Revision ${report.revision}</dd></div>
      ${report.supersedesRevision ? html`<div><dt>Correction</dt><dd>Supersedes revision ${report.supersedesRevision}</dd></div>` : ''}
      <div><dt>Instrument</dt><dd>${instrument.label} · ${zoneName(vm, instrument.zoneId)}<br>${instrument.id}</dd></div>
      <div><dt>Method</dt><dd>Urine strip reader</dd></div>
      <div><dt>Specimen collected</dt><dd>${clock(vm.mission, report.collectedAtS)} UTC</dd></div>
      <div><dt>Report issued</dt><dd>${clock(vm.mission, report.reportedAtS)} UTC</dd></div>
      <div><dt>Report received</dt><dd>${clock(vm.mission, report.receivedAtS)} UTC</dd></div>
      <div><dt>Instrument quality check</dt><dd>${report.quality === 'passed' ? 'Passed' : 'Failed'}</dd></div>
      ${report.status === 'accepted' ? report.observations.map(entry => html`<div>
        <dt>Urine specific gravity</dt><dd>${entry.value} <small>(unitless)</small></dd>
      </div>`) : ''}
    </dl>`;
}

export function clinicalEvidence(vm: ViewModel, workId: string, data: ClinicalData) {
  const report = data.reports.find(item => item.receivedAtS <= vm.snapshot.atS && clinicalReviewId(item) === workId);
  if (!report) return '';
  const order = data.orders.find(item => item.id === report.orderId)!;
  const superseded = clinicalReportsFor(data, order.id, vm.snapshot.atS).at(-1) !== report;
  return html`<details class="bs-details bs-evidence" open>
    <summary>Clinical report</summary>
    <p>Simulated record.</p>
    ${reportDetails(vm, data, order, report, superseded)}
  </details>`;
}

export function clinicalChecks(vm: ViewModel, data: ClinicalData) {
  const person = currentPerson(vm);
  const orders = data.orders.filter(order => order.crewId === person.id);
  return html`<section class="bs-card" aria-labelledby="bs-clinical-checks-title">
    <div class="bs-card-heading">
      <div><h2 id="bs-clinical-checks-title" tabindex="-1">Clinical checks</h2><p>Simulated medical records for ${person.name}</p></div>
      <span class="bs-card-icon">${icon('assist', 22)}</span>
    </div>
    ${orders.length ? orders.map(order => {
      const reports = clinicalReportsFor(data, order.id, vm.snapshot.atS);
      const report = reports.at(-1);
      return html`<div class="bs-card-heading bs-wrap">
        <div><h3>Post-EVA urinalysis</h3><p>${vm.snapshot.atS < order.requestedAtS ? 'Scheduled for ' : 'Ordered '}${clock(vm.mission, order.requestedAtS)} UTC</p></div>
        ${clinicalStatus(vm, order, report)}
      </div>
      ${report ? html`<p class="bs-muted">Report received ${clock(vm.mission, report.receivedAtS)} UTC · Assigned to ${personName(vm, order.reviewerId)}</p>
        ${report.status === 'held' ? html`<p>${holdReasons[report.reason]}</p>` : ''}
        <a class="bs-button bs-button-line" href=${vm.href('assist', clinicalReviewId(report))}>
          ${report.status === 'held' ? 'Inspect held report' : 'View review'} ${icon('arrow', 16)}
        </a>
        <details class="bs-details"><summary>${reports.length > 1 ? 'Report details and revision history' : 'Report details'}</summary>
          ${[...reports].reverse().map(item => reportDetails(vm, data, order, item, item !== report))}
        </details>` : html`<p class="bs-muted">Result due ${clock(vm.mission, order.dueAtS)} UTC · Reviewer ${personName(vm, order.reviewerId)}</p>`}`;
    }) : html`<p>No clinical checks are planned for this crew member.</p>`}
  </section>`;
}

export function clinicalNextTask(vm: ViewModel, data: ClinicalData) {
  const order = data.orders.find(item => item.crewId === vm.session.crewId);
  if (!order) return '';
  const report = clinicalReportsFor(data, order.id, vm.snapshot.atS).at(-1);
  return html`<div class="bs-routine"><span><strong>Post-EVA urinalysis</strong><br>Result due ${clock(vm.mission, order.dueAtS)} UTC</span>${clinicalStatus(vm, order, report)}</div>
    <button class="bs-button bs-button-plain bs-schedule-link" type="button" data-action="open-clinical-checks">
      View clinical checks ${icon('arrow', 15)}
    </button>`;
}
