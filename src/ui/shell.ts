import { html } from 'lit-html';
import { avatar, tag } from './components/common.ts';
import { icon } from './components/icons.ts';
import { assistPage } from './pages/assist.ts';
import { healthPage } from './pages/health.ts';
import { profilesPage } from './pages/profiles.ts';
import { clock, currentPerson, pageNames, type Page, type ViewModel } from './view-model.ts';

const views = { health: healthPage, assist: assistPage, profiles: profilesPage };
const navigation = [
  { page: 'health', icon: 'activity' },
  { page: 'assist', icon: 'assist' },
  { page: 'profiles', icon: 'users' },
] as const;

export function shell(vm: ViewModel) {
  const person = currentPerson(vm);
  return html`<div class="bs-shell ${vm.session.simple ? 'bs-simple' : ''}">
    <a class="bs-skip" href="#bs-content">Skip to mission content</a>
    <aside class="bs-sidebar">
      <a class="bs-brand" href=${vm.href('health')}>
        <span class="bs-brand-icon">${icon('star', 25)}</span>
        <span><strong>BY STAR</strong><small>Mission health</small></span>
      </a>
      <nav aria-label="Mission health pages">
        ${navigation.map(item => html`<a href=${vm.href(item.page)} aria-current=${vm.page === item.page ? 'page' : 'false'}>
          ${icon(item.icon, 20)} <span>${pageNames[item.page]}</span>
        </a>`)}
      </nav>
      <div class="bs-sidebar-bottom">
        <div class="bs-sidebar-mission"><span>${icon('moon', 15)} Lunar mission</span><strong>${vm.mission.code}</strong>
          <small>Day ${vm.mission.missionDay} · ${vm.mission.location}</small></div>
        <a class="bs-button bs-button-line bs-help" href=${vm.href('assist', 'report')}>${icon('help', 19)} I need help</a>
      </div>
    </aside>
    <div class="bs-main">
      <header class="bs-topbar">
        <div class="bs-topbar-location"><span>${vm.mission.code}</span>${icon('chevron', 13)}<strong>${pageNames[vm.page]}</strong></div>
        <div class="bs-topbar-controls">
          ${tag('Simulation', 'muted', 'info')}
          <span class="bs-topbar-clock">${clock(vm.mission, vm.snapshot.atS)} UTC</span>
          <button type="button" class="bs-button bs-button-plain bs-simple-toggle" data-action="simple"
            aria-pressed=${vm.session.simple} title="Simplified view" ?disabled=${vm.state.saving}>
            ${icon('simple', 19)} <span>Simplified view</span>
          </button>
          <label class="bs-crew-menu">
            ${avatar(person)}
            <select aria-label="Active crew member" data-select="crew" ?disabled=${vm.state.saving}>
              ${vm.mission.crew.map(member => html`<option value=${member.id} ?selected=${member.id === person.id}>${member.name}</option>`)}
            </select>
          </label>
        </div>
      </header>
      <div id="bs-content" class="bs-content" role="region" aria-label="Mission content" tabindex="-1">
        <p class="bs-visually-hidden" role="status">${vm.state.notice}</p>
        ${vm.state.error ? html`<p class="bs-error-note" role="alert">${vm.state.error}</p>` : ''}
        ${!vm.persistent ? html`<p class="bs-warning-note">${icon('info', 18)} Browser storage is unavailable. Progress will reset on navigation.</p>` : ''}
        ${views[vm.page](vm)}
        <footer class="bs-footer"><span>BY STAR · Fictional mission simulation</span>
          <span>Moon imagery: NASA Scientific Visualization Studio</span></footer>
      </div>
    </div>
  </div>`;
}

export function loadingPage(message: string, error = false) {
  return html`<div class="bs-load">
    <span class="bs-brand-icon">${icon('star', 28)}</span>
    <h1>BY STAR</h1>
    <p role=${error ? 'alert' : 'status'}>${message}</p>
    ${error ? html`<button type="button" class="bs-button bs-button-primary" data-action="reload">Reload demo</button>` : ''}
  </div>`;
}

export function isPage(value: string | null | undefined): value is Page {
  return value === 'health' || value === 'assist' || value === 'profiles';
}
