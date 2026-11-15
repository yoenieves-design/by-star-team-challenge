import { html } from 'lit-html';
import { missionScheduleHref, sensorsHref, type ViewModel } from '../view-model.ts';
import { readingLabels } from './common.ts';
import { icon } from './icons.ts';
import '../styles/app-guide.css';

function openGuide(event: Event) {
  const button = event.currentTarget as HTMLButtonElement;
  const dialog = button.closest('.bs-shell')?.querySelector<HTMLDialogElement>('#bs-app-guide');
  if (!dialog || dialog.open) return;
  // The modal restores the previously focused control when it closes.
  button.focus({ preventScroll: true });
  dialog.showModal();
}

export function appGuideButton() {
  return html`<button type="button" class="bs-button bs-button-plain bs-guide-trigger" aria-haspopup="dialog"
    aria-controls="bs-app-guide" @click=${openGuide}>${icon('book', 18)} App guide</button>`;
}

export function appGuide(vm: ViewModel) {
  const topics = [
    {
      title: 'Check crew health', glyph: 'activity', content: html`
        <ol>
          <li>Confirm the <strong>Active crew member</strong> in the header. In <strong>Health</strong>, use a crew card to switch people or select <strong>My health</strong> to focus on the active profile.</li>
          <li>Choose a marker or its reading label on the body view to inspect the source and measurement time. In <strong>Indicator trend</strong>, select an indicator and time range, then compare similar activities.</li>
          <li>Check <strong>Breathing environment</strong> for oxygen fraction, CO₂ partial pressure and total pressure. A crew member’s breathing zone can differ from their physical location, such as when using a suit.</li>
          <li>Open an item in <strong>Alerts &amp; follow-up</strong> to see the evidence and the next action.</li>
        </ol>
        <p><strong>Signal current</strong> means the sample is recent and usable. <strong>Review requested</strong> means follow-up remains pending. Both can appear together. The heart rate reference is a fictional preflight seated reading; the app shows a difference only when the current sample and activity support a resting comparison.</p>
        <p><strong>Context markers</strong> on the trend identify activity changes and review openings. Open <strong>View readings as a table</strong> to inspect the values, quality and activity at measurement time.</p>
        <p><strong>Profiles → Crew overview</strong> gives you a side-by-side view. Open an individual profile to see assigned equipment and its preflight reference.</p>
        <a class="bs-button bs-button-line" href=${vm.href('health')}>Open Health</a>`,
    },
    {
      title: 'Verify a reading or sensor', glyph: 'sensor', content: html`
        <ol>
          <li>Check the crew member or zone, the indicator, the unit and the source. In <strong>Profiles → Sensors</strong>, compare the device name and ID with the assignment.</li>
          <li>Compare <strong>Newest reading measured</strong> with <strong>Last packet received</strong> and the mission clock, all in UTC. A device can deliver a buffered sample after the original measurement.</li>
          <li>Use the text beside each reading to decide whether BY STAR can display a current value.</li>
        </ol>
        <dl class="bs-guide-statuses">
          <div><dt>${readingLabels.fresh}</dt><dd>The sample meets the demo’s age and quality checks.</dd></div>
          <div><dt>${readingLabels.stale}</dt><dd>The sample is older than the device’s freshness limit.</dd></div>
          <div><dt>${readingLabels.degraded}</dt><dd>The device reported reduced sample quality.</dd></div>
          <div><dt>${readingLabels.unavailable}</dt><dd>The app has no usable observation for this indicator.</dd></div>
        </dl>
        <p>A dash indicates there is no current value to display. A signal label describes data availability and quality. Use <strong>Review sensor alert</strong> to record follow-up for that device.</p>
        <p>Check the <strong>Local link</strong> if several devices stop updating. The <strong>Earth relay</strong> status describes a separate connection. The scenario uses simulated packets. Historical NASA RadLab observations are in <strong>Mission &amp; schedule → NASA data &amp; references</strong>.</p>
        <a class="bs-button bs-button-line" href=${sensorsHref(vm)}>Open Sensors</a>`,
    },
    {
      title: 'Follow mission routines', glyph: 'calendar', content: html`
        <ol>
          <li>From <strong>Health → Next health task</strong>, open or continue the check-in for the active crew member.</li>
          <li>In <strong>Profiles → Mission &amp; schedule</strong>, find the assignment, opening time, due time and status. <strong>Upcoming</strong> checks open later. <strong>Outside activity window</strong> means the crew member’s current phase does not match the check.</li>
          <li><strong>Due</strong> is the planned deadline. <strong>Past due</strong> shows that the mission clock has passed it. Record each step in <strong>Assist</strong> and use <strong>Complete follow-up</strong> to mark the check <strong>Complete</strong>.</li>
        </ol>
        <p>Choose a <strong>Review outcome</strong> before the final step. The post-EVA check-in also needs a <strong>Quick check-in</strong> recorded for the crew member during that routine. Follow the link to Health, save the response and return to the check.</p>
        <a class="bs-button bs-button-line" href=${missionScheduleHref(vm)}>Open mission schedule</a>`,
    },
    {
      title: 'Record how you feel', glyph: 'heart', content: html`
        <ol>
          <li>Confirm the active crew member, then find <strong>Quick check-in</strong> in <strong>Health</strong>.</li>
          <li>Select <strong>Record a check-in</strong>. Choose how rested you feel, your current fatigue and whether you have a concern. If there is a concern, record when it began.</li>
          <li>Select <strong>Save check-in</strong>. Your response appears with a <strong>Crew-reported</strong> label and its time.</li>
          <li>A concern opens its own review in <strong>Assist</strong>. Use <strong>Open reported concern</strong> to continue. Select <strong>Record another check-in</strong> when you need to add a later response.</li>
        </ol>
        <p>Your response adds information about your experience alongside the sensor readings. A previous response remains in the review record. Each entry belongs to the active crew profile at the time it was saved.</p>
        <a class="bs-button bs-button-line" href=${vm.href('health')}>Open Health</a>`,
    },
    {
      title: 'Check a clinical result', glyph: 'assist', content: html`
        <ol>
          <li>In <strong>Health → My health → Clinical checks</strong>, find the planned post-EVA urinalysis. <strong>View clinical checks</strong> under <strong>Next health task</strong> opens the same section.</li>
          <li><strong>Planned</strong> means the mission routine has not opened. <strong>Awaiting result</strong> means a report has not arrived. Once a report arrives, open <strong>Report details</strong> and compare the crew member, order and specimen IDs.</li>
          <li>Check the instrument and method, specimen collection time, report issue time, reception time and instrument quality check. The demo shows one illustrative result: urine specific gravity, which is unitless.</li>
          <li><strong>Report held</strong> identifies a mismatch or failed technical check. Use <strong>Inspect held report</strong> to see the reason. A held report cannot be completed as a medical review.</li>
          <li><strong>Ready for medical review</strong> means the technical checks passed. Select <strong>View review</strong> in Assist. For this demonstration, select <strong>Noah Chen</strong>, the assigned crew medical officer, as the active profile to record the review.</li>
          <li>After a correction arrives, <strong>Report details and revision history</strong> preserves the earlier report and identifies the replacement. Review the current accepted revision.</li>
        </ol>
        <p>An accepted report still needs clinical interpretation. A dated result remains part of the record as the mission clock advances. The app’s planned orders and results are fictional; it does not prescribe tests. Profile selection simulates the reviewer role, and all demonstration records are publicly viewable.</p>`,
    },
    {
      title: 'Report a concern', glyph: 'assist', content: html`
        <ol>
          <li>Confirm the active crew member, then select <strong>I need help</strong> or <strong>Assist → Report a concern</strong>.</li>
          <li>Choose the closest category. BY STAR records the concern against the active profile and its current zone and opens a simulated crew review.</li>
          <li>Open <strong>Evidence and timing</strong> to confirm what was recorded. Start the guided review or request support for the item through <strong>Crew handoff</strong>.</li>
        </ol>
        <p>Reports and support requests are recorded in the demo browser. For an actual medical concern, use your mission’s approved medical procedures and communication channels.</p>
        <a class="bs-button bs-button-line" href=${vm.href('assist', 'report')}>Open concern report</a>`,
    },
    {
      title: 'Resume, hand off, or close a review', glyph: 'check', content: html`
        <ol>
          <li>Open the item in <strong>Assist</strong>. <strong>Acknowledge alert</strong> records that you saw it. Use <strong>Start guided check</strong> to begin.</li>
          <li>Read the instruction and check for missing equipment. Use <strong>Done · next step</strong> after performing a step. If you need to stop, choose <strong>I can’t do this now</strong>, then use <strong>Resume check</strong> when ready.</li>
          <li>For a handoff, choose an <strong>Assigned crew member</strong> and select <strong>Request support</strong>. The recipient can find the item in <strong>Assist → Assigned to me</strong> and use <strong>Confirm receipt</strong> while the local link is available. A shortcut in Health also shows assigned work.</li>
          <li>On the final step, choose a <strong>Review outcome</strong>: <strong>Verified</strong>, <strong>Unable to verify</strong> or <strong>Further review needed</strong>. If the step requires a handoff, choose the assigned crew member first. Then select <strong>Complete follow-up</strong>.</li>
          <li>Read the <strong>Current condition</strong> and any <strong>Follow-up pending</strong> notice. A completed workflow records the actions taken. An unresolved outcome, uncertain data or a continuing condition can still need attention.</li>
          <li>Use <strong>Start another review</strong> when a completed item needs another check. The earlier actions remain in <strong>Follow-up history</strong>.</li>
        </ol>
        <p><strong>Verified</strong> records what you established during the review. Clinical clearance remains a separate medical decision. A recovered sensor signal can become current before the human review is complete. A new failure after a confirmed recovery opens a separate episode.</p>
        <p>In <strong>Review summary</strong>, inspect the outcome, current condition, assigned reviewer and receipt. <strong>Download review JSON</strong> saves a dated fictional record on this device with the evidence and action history.</p>
        <p>Support requests and receipts are simulated in this browser. A recorded request or a downloaded summary does not send a message to the crew or Earth.</p>`,
    },
    {
      title: 'Use voice and audio', glyph: 'volume', content: html`
        <ol>
          <li>Open <strong>Voice controls</strong> and read the microphone notice. Depending on the browser, speech recognition may send audio to its service and require internet access.</li>
          <li>Select <strong>Talk to BY STAR</strong> and allow microphone access if requested. Say <strong>“Read my heart rate”</strong>, <strong>“Show my next check”</strong> or <strong>“Open Sensors”</strong>.</li>
          <li>Check the <strong>Heard</strong> transcript, then select <strong>Run command</strong>. The heart rate query uses the active crew member. The other commands open the scheduled check or Sensors.</li>
          <li>Use <strong>Stop listening</strong> to cancel. The app also stops after a short listening period. If input is unavailable or the command is not recognized, use the usual screen controls.</li>
        </ol>
        <p>When browser speech is available, <strong>Listen to current reading</strong> reads the current pulse and its measurement time, and <strong>Listen</strong> reads an Assist step. <strong>Stop audio</strong> stops the instruction playback. Choose a suitable listening environment before playing personal information aloud.</p>
        <p>Voice queries are limited to these read and navigation commands. Record a review outcome or request support using the visible controls. Speech support depends on the browser and device.</p>`,
    },
    {
      title: 'Use replay and accessibility controls', glyph: 'play', content: html`
        <ul>
          <li>In <strong>Health</strong> or <strong>Sensors</strong>, use <strong>Play replay</strong>, <strong>Pause replay</strong> and <strong>Playback speed</strong> to control the mission clock. <strong>Next event</strong> jumps to a checkpoint and pauses.</li>
          <li><strong>Restart replay</strong> starts over and clears recorded follow-up for this replay. Cancel the confirmation to keep your work.</li>
          <li><strong>Explore the post-EVA case</strong> starts a separate practice replay with five guided stages. Use <strong>Next walkthrough step</strong> or <strong>Previous step</strong> to navigate and <strong>Return to my replay</strong> to return to your original saved session.</li>
          <li><strong>Simplified view</strong> removes the trend chart and enlarges the interface. When browser speech is available, use <strong>Listen to current reading</strong> for heart rate or <strong>Listen</strong> for the current <strong>Assist</strong> instruction.</li>
          <li>Use Tab to move between controls, Enter or Space to activate buttons, and Escape to close this guide.</li>
        </ul>`,
    },
  ] as const;

  return html`<dialog id="bs-app-guide" class="bs-app-guide" aria-labelledby="bs-app-guide-title">
    <header class="bs-guide-header">
      <h2 id="bs-app-guide-title" tabindex="-1" autofocus>App guide</h2>
      <form method="dialog"><button type="submit" class="bs-button bs-button-line">Close guide</button></form>
    </header>
    <div class="bs-guide-body">
      <p>Use BY STAR to inspect a reading, record how you feel and follow a review through to its next action. Confirm the active crew member before recording any information.</p>
      <p><button type="button" class="bs-button bs-button-line" data-action="start-tour">${icon('play', 17)} Explore the post-EVA case</button></p>
      ${topics.map(({ title, glyph, content }) => html`<details class="bs-guide-topic" name="bs-guide-topics">
        <summary>${icon(glyph, 19)} <span>${title}</span></summary>
        <div class="bs-guide-topic-content">${content}</div>
      </details>`)}
    </div>
  </dialog>`;
}
