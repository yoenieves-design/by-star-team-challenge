import { html } from 'lit-html';
import type { Page, ViewModel } from '../view-model.ts';

export const walkthroughSteps: { title: string; instruction: string; page: Page; work?: string; profile?: string }[] = [
  { title: 'Meet the returning crew', instruction: 'Maya has reported dizziness after EVA. Select a body marker and inspect its sample time. Notice that her wrist data needs verification.', page: 'health' },
  { title: 'Verify the input', instruction: 'Find Maya’s wrist monitor. Compare the measured time with the last packet received. Local communications and the Earth relay have separate status.', page: 'profiles', profile: 'sensors' },
  { title: 'Inspect the clinical check', instruction: 'Open Clinical checks for Maya. The first report is held because its specimen does not match the order. Use the replay to reach the correction at 06:42:46 UTC; an accepted report still requires medical review.', page: 'health' },
  { title: 'Review and request support', instruction: 'Open the reported concern. Review the steps, choose Noah as Assigned crew member and Request support. Record a review outcome before completing the steps.', page: 'assist', work: 'scenario-report-maya-104' },
  { title: 'Confirm the handoff', instruction: 'Select Noah in Active crew member, open Assigned to me and confirm receipt. Review summary preserves the evidence and any work still pending. You can continue exploring this separate replay.', page: 'assist', work: 'scenario-report-maya-104' },
];

export function walkthrough(vm: ViewModel) {
  if (!vm.guided) return '';
  const step = walkthroughSteps[vm.tourStep];
  return html`<section class="bs-walkthrough" aria-labelledby="bs-walkthrough-title">
    <div><p class="bs-overline">Post-EVA walkthrough · ${vm.tourStep + 1} of ${walkthroughSteps.length}</p>
      <h2 id="bs-walkthrough-title">${step.title}</h2><p>${step.instruction}</p>
      <small>Separate practice replay. Your original session is preserved.</small></div>
    <div class="bs-inline bs-wrap">
      ${vm.tourStep > 0 ? html`<button type="button" class="bs-button bs-button-line" data-action="tour-step" data-step=${vm.tourStep - 1}>Previous step</button>` : ''}
      ${vm.tourStep < walkthroughSteps.length - 1 ? html`<button type="button" class="bs-button bs-button-primary" data-action="tour-step" data-step=${vm.tourStep + 1}>Next walkthrough step</button>` : ''}
      <button type="button" class="bs-button bs-button-plain" data-action="exit-tour">Return to my replay</button>
    </div>
  </section>`;
}
