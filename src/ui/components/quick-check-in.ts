import { html } from 'lit-html';
import { keyed } from 'lit-html/directives/keyed.js';
import { clock, concerns, currentPerson, type ViewModel } from '../view-model.ts';

/** Self-reports remain separate from measurements and never imply a diagnosis. */
export function quickCheckIn(vm: ViewModel) {
  const person = currentPerson(vm);
  const latest = vm.session.activity.findLast(event => event.type === 'check-in'
    && event.actorId === person.id && event.atS <= vm.snapshot.atS);
  return html`<section class="bs-card bs-check-in" aria-labelledby="bs-check-in-title">
    <div class="bs-card-heading"><div><h2 id="bs-check-in-title" tabindex="-1">Quick check-in</h2>
      <p>How are you feeling, ${person.name.split(' ')[0]}?</p></div></div>
    ${latest?.type === 'check-in' ? html`<div class="bs-check-in-record">
      <strong>Crew-reported · ${clock(vm.mission, latest.atS)} UTC</strong>
      <p>Rest: ${latest.sleep} · Fatigue: ${latest.fatigue}<br>Concern: ${latest.concern}</p>
      ${latest.concern !== 'None' ? html`<a href=${vm.href('assist', latest.targetId)}>Open reported concern</a>` : ''}
    </div>` : html`<p class="bs-muted">Record rest, tiredness and any concern alongside your sensor readings.</p>`}
    ${keyed(person.id, html`<details class="bs-details"><summary>${latest ? 'Record another check-in' : 'Record a check-in'}</summary>
      <form data-form="check-in" class="bs-check-in-form" data-crew=${person.id}>
        <label>Rest since your last sleep period
          <select name="sleep" required><option value="" disabled selected>Choose rest quality</option>
            <option value="rested">Rested</option><option value="mixed">Partly rested</option><option value="poor">Poorly rested</option></select>
        </label>
        <label>Current fatigue
          <select name="fatigue" required><option value="" disabled selected>Choose fatigue level</option>
            <option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select>
        </label>
        <label>Concern to report
          <select name="concern" required><option value="" disabled selected>Choose a response</option>
            <option value="None">No concern to report</option>${concerns.map(value => html`<option value=${value}>${value}</option>`)}
          </select>
        </label>
        <label>If there is a concern, when did it begin?
          <select name="onset"><option value="unsure">Unsure / not applicable</option><option value="now">Just now</option><option value="earlier">Earlier</option></select>
        </label>
        <button type="submit" class="bs-button bs-button-primary" ?disabled=${vm.state.saving}>Save check-in</button>
        <p class="bs-muted">Responses are saved to this fictional crew profile. A reported concern opens its own review in Assist.</p>
      </form>
    </details>`)}
  </section>`;
}
