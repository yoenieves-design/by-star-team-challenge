import { html } from 'lit-html';
import { elapsed, type ViewModel } from '../view-model.ts';
import { icon } from './icons.ts';

export function replayControls(vm: ViewModel) {
  const { scenario, snapshot } = vm;
  const active = scenario.milestones.findLast(item => item.atS <= snapshot.atS);
  const ended = snapshot.atS >= scenario.durationS;
  const playLabel = vm.playing ? 'Pause replay' : 'Play replay';
  return html`<section class="bs-replay" aria-label="Scenario playback">
    <div class="bs-replay-controls">
      <button type="button" class="bs-button bs-button-primary bs-icon-button" data-action="play" aria-label=${playLabel} title=${playLabel} ?disabled=${ended || vm.state.saving}>
        ${icon(vm.playing ? 'pause' : 'play', 19)}
      </button>
      <div class="bs-replay-label">
        <strong>${scenario.title}</strong>
        <span>${active?.label ?? 'Waiting for first event'}</span>
      </div>
    </div>
    <div class="bs-replay-position">
      <progress aria-label="Replay progress" value=${snapshot.atS} max=${scenario.durationS}></progress>
      <span>${elapsed(snapshot.atS)} / ${elapsed(scenario.durationS)}</span>
    </div>
    <div class="bs-inline bs-wrap bs-replay-actions">
      <select aria-label="Playback speed" data-select="speed" .value=${String(vm.session.speed)} ?disabled=${vm.state.saving}>
        <option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option>
      </select>
      <button type="button" class="bs-button bs-button-line" data-action="next-event" ?disabled=${!vm.nextEvent || vm.state.saving} title=${vm.nextEvent?.label || 'Replay complete'}>${icon('next', 16)} Next event</button>
      <button type="button" class="bs-button bs-button-plain bs-icon-button" data-action="restart" aria-label="Restart replay" title="Restart replay" ?disabled=${vm.state.saving}>${icon('restart', 17)}</button>
    </div>
  </section>`;
}
