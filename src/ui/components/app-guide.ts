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
        <a class="bs-button bs-button-line" href=${missionScheduleHref(vm)}>Open mission schedule</a>`,
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
          <li>For a handoff, choose an <strong>Assigned crew member</strong> and select <strong>Request support</strong>. The assigned crew member can use <strong>Confirm receipt</strong> from their active profile while the local link is available.</li>
          <li>On the final step, select <strong>Complete follow-up</strong>. If the step requires a handoff, choose the assigned crew member first. Reopen the item to see <strong>Follow-up history</strong>.</li>
        </ol>`,
    },
    {
      title: 'Use replay and accessibility controls', glyph: 'play', content: html`
        <ul>
          <li>In <strong>Health</strong> or <strong>Sensors</strong>, use <strong>Play replay</strong>, <strong>Pause replay</strong> and <strong>Playback speed</strong> to control the mission clock. <strong>Next event</strong> jumps to a checkpoint and pauses.</li>
          <li><strong>Restart replay</strong> starts over and clears recorded follow-up for this replay. Cancel the confirmation to keep your work.</li>
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
      ${topics.map(({ title, glyph, content }) => html`<details class="bs-guide-topic" name="bs-guide-topics">
        <summary>${icon(glyph, 19)} <span>${title}</span></summary>
        <div class="bs-guide-topic-content">${content}</div>
      </details>`)}
    </div>
  </dialog>`;
}
