import { html } from 'lit-html';
import type { VoiceState } from '../../adapters/voice.ts';
import { icon } from './icons.ts';

/** The final command is confirmed on screen before a query or navigation runs. */
export function voiceControls(state: VoiceState) {
  const listening = state.phase === 'listening';
  return html`<details class="bs-details bs-voice-controls">
    <summary>${icon('volume', 17)} Voice controls</summary>
    <p>Speak in English after selecting <strong>Talk to BY STAR</strong>. Your browser may send audio to its speech service and require an internet connection.</p>
    <p>Try <strong>“Read my heart rate”</strong>, <strong>“Show my next check”</strong> or <strong>“Open Sensors”</strong>.</p>
    <div class="bs-inline bs-wrap">
      <button type="button" class="bs-button bs-button-line" data-action="voice-start" ?disabled=${!state.available || listening}>
        ${icon('volume', 17)} Talk to BY STAR
      </button>
      ${listening ? html`<button type="button" class="bs-button bs-button-line" data-action="voice-stop">Stop listening</button>` : ''}
      ${state.command ? html`<button type="button" class="bs-button bs-button-primary" data-action="voice-confirm">Run command</button>` : ''}
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">
      ${state.transcript ? html`<p><strong>Heard</strong> “${state.transcript}”</p>` : ''}
      <p>${state.available ? state.message : 'Voice input is unavailable in this browser. All actions remain available through the on-screen controls.'}</p>
    </div>
    <p class="bs-muted">Voice queries do not change a health record or send a support request. Readings use browser speech when available.</p>
  </details>`;
}
