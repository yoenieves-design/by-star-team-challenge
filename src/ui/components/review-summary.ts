import { html } from 'lit-html';
import type { WorkItem } from '../../services/follow-up.ts';
import { clock, personName, type ViewModel } from '../view-model.ts';

export const outcomeLabels = {
  verified: 'Verified', 'unable-to-verify': 'Unable to verify', 'further-review': 'Further review needed',
} as const;

export function reviewSummary(vm: ViewModel, item: WorkItem) {
  const progress = item.progress;
  return html`<details class="bs-details bs-review-summary"><summary>Review summary</summary>
    <dl class="bs-definition-list">
      <div><dt>Snapshot time</dt><dd>${clock(vm.mission, vm.snapshot.atS)} UTC</dd></div>
      <div><dt>Review outcome</dt><dd>${progress.outcome ? outcomeLabels[progress.outcome] : 'Not recorded'}</dd></div>
      <div><dt>Current condition</dt><dd>${item.condition?.label ?? 'Requires human review'}</dd></div>
      <div><dt>Assigned reviewer</dt><dd>${personName(vm, progress.assigneeId)}</dd></div>
      <div><dt>Support receipt</dt><dd>${progress.receipt}</dd></div>
    </dl>
    <p>Includes the original evidence, current observations, crew check-ins and the action history. Times are preserved in UTC.</p>
    <button type="button" class="bs-button bs-button-line" data-action="export-review" data-work=${item.id}>Download review JSON</button>
    <p class="bs-muted">Downloads a fictional record to this device. It does not transmit a medical message.</p>
  </details>`;
}
