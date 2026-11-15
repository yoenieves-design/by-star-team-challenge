import { render } from 'lit-html';
import { loadDemoData } from '../adapters/demo-data.ts';
import { openSessionStore } from '../adapters/session-store.ts';
import { speak, stopSpeech } from '../adapters/voice.ts';
import { isMetric, latestReading, numberLabel } from '../domain/metrics.ts';
import type { FollowUpEvent, Session } from '../domain/types.ts';
import { appendFollowUp, listWork } from '../services/follow-up.ts';
import { createReplay } from '../services/replay.ts';
import { isPlaying, newSession, position, stopAt } from '../services/session.ts';
import { isPage, loadingPage, shell } from '../ui/shell.ts';
import { clock, concerns, currentPerson, type Page, type ViewModel, type ViewState } from '../ui/view-model.ts';
import '../ui/styles/app.css';

function routes(root: HTMLElement) {
  const search = new URLSearchParams(location.search);
  const pageOption = root.dataset.preview === 'true' ? search.get('page') : root.dataset.page;
  const page: Page = isPage(pageOption) ? pageOption : 'health';
  const assetBase = new URL(root.dataset.assetBase || './', location.href);
  const links: Partial<Record<Page, string>> = JSON.parse(root.dataset.links || '{}');
  function href(target: Page, workId?: string) {
    const url = new URL(links[target] || '?page=' + target, location.href);
    if (workId) url.searchParams.set('by_star_work', workId);
    return url.href;
  }
  return { page, assetBase, href, search };
}

async function mount(root: HTMLElement) {
  // Remove the shortcode's fallback only after the application script runs.
  root.replaceChildren();
  render(loadingPage('Loading the mission replay…'), root);
  let configuration;
  let replayData;
  try {
    configuration = routes(root);
    replayData = await loadDemoData(configuration.assetBase);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'The required files could not be loaded.';
    render(loadingPage('Could not load the mission replay. ' + reason, true), root);
    root.querySelector('[data-action=reload]')?.addEventListener('click', () => location.reload());
    return;
  }
  const { mission, scenario } = replayData;
  const replay = createReplay(replayData);
  const { page, href, search, assetBase } = configuration;
  const asset = (path: string) => new URL(path, assetBase).href;
  const store = await openSessionStore(assetBase.href, newSession(scenario), mission.crew.map(person => person.id));
  let session = await store.load();
  const workParam = search.get('by_star_work');
  const profileSection = search.get('by_star_profile');
  const state: ViewState = {
    healthMode: 'crew', profileTab: profileSection === 'sensors' || profileSection === 'mission' ? profileSection : 'crew',
    trendMetric: 'heart_rate', trendWindow: 'recent',
    workId: workParam === 'report' ? null : workParam, reportOpen: workParam === 'report',
    error: '', notice: '', saving: false,
  };
  let view: ViewModel;

  function paint(force = false) {
    const now = Date.now();
    const at = Math.floor(position(session, scenario, now));
    if (!force && view?.snapshot.atS === at) return;
    const snapshot = replay.snapshot(at);
    view = {
      page, mission, scenario, session, snapshot, state, work: listWork(mission, snapshot, session),
      playing: isPlaying(session, scenario, now), persistent: store.persistent, href, asset,
      nextEvent: scenario.milestones.find(item => item.atS > at),
    };
    render(shell(view), root);
  }

  function focus(selector: string) {
    root.querySelector<HTMLElement>(selector)?.focus();
  }

  async function update(change: (current: Session, now: number) => Session, notice: string, onSave?: () => void) {
    if (state.saving) return;
    const focused = document.activeElement;
    state.error = '';
    state.saving = true;
    // Make mutating controls unavailable before IndexedDB begins the transaction.
    paint(true);
    try {
      session = await store.update(current => change(current, Date.now()));
      state.notice = notice;
      onSave?.();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Could not save the change.';
      session = await store.load().catch(() => session);
    } finally {
      state.saving = false;
      paint(true);
      if (document.activeElement === document.body && focused instanceof HTMLElement && focused.isConnected) {
        focused.focus({ preventScroll: true });
      }
    }
  }

  async function record(event: FollowUpEvent, notice: string, nextFocus?: string) {
    await update(
      (current, now) => appendFollowUp(current, event, mission, replay.snapshot(position(current, scenario, now))),
      notice,
      () => {
        state.workId = event.targetId;
        state.reportOpen = false;
        if (nextFocus) requestAnimationFrame(() => focus(nextFocus));
      },
    );
  }

  async function selectCrew(crewId: string, onSave?: () => void) {
    if (!mission.crew.some(member => member.id === crewId)) return;
    stopSpeech();
    await update(current => ({ ...current, crewId }), 'Active crew member updated.', onSave);
  }

  root.addEventListener('click', async event => {
    const button = (event.target instanceof Element ? event.target : null)?.closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    const command = button.dataset.action;
    const targetId = button.dataset.work ?? '';
    switch (command) {
      case 'play':
        await update((current, now) => {
          const at = position(current, scenario, now);
          return { ...current, anchorS: at, playingSince: isPlaying(current, scenario, now) ? null : now };
        }, view.playing ? 'Replay paused.' : 'Replay playing.');
        break;
      case 'next-event':
        await update((current, now) => {
          const next = scenario.milestones.find(item => item.atS > Math.floor(position(current, scenario, now)));
          return next ? stopAt(current, next.atS) : current;
        }, 'Moved to the next replay event.');
        break;
      case 'restart':
        if (session.activity.length && !window.confirm('Restart the replay and clear its recorded follow-up?')) return;
        stopSpeech();
        await update(current => ({ ...newSession(scenario, 0), simple: current.simple, speed: current.speed }),
          'Replay restarted.', () => { state.workId = null; });
        break;
      case 'select-crew':
        await selectCrew(button.dataset.crew ?? '');
        break;
      case 'open-crew-profile':
        await selectCrew(button.dataset.crew ?? '', () => {
          state.profileTab = 'crew';
          requestAnimationFrame(() => focus('#bs-profile-name'));
        });
        break;
      case 'health-mode':
        state.healthMode = button.dataset.mode === 'personal' ? 'personal' : 'crew';
        paint(true);
        break;
      case 'profile-tab': {
        const tab = button.dataset.tab;
        state.profileTab = tab === 'overview' || tab === 'mission' || tab === 'sensors' ? tab : 'crew';
        paint(true);
        break;
      }
      case 'simple':
        await update(current => ({ ...current, simple: !current.simple }), 'View preference updated.');
        break;
      case 'report-form':
        stopSpeech();
        state.reportOpen = true;
        paint(true);
        focus('#bs-report-title');
        break;
      case 'select-work':
        stopSpeech();
        state.workId = targetId;
        state.reportOpen = false;
        paint(true);
        focus('#bs-work-title');
        break;
      case 'report': {
        const category = button.dataset.category ?? '';
        if (!concerns.includes(category)) return;
        await record({ type: 'report', targetId: 'report-' + crypto.randomUUID(), category }, 'Crew concern recorded.', '#bs-work-title');
        break;
      }
      case 'acknowledge':
        await record({ type: 'acknowledge', targetId }, 'Alert acknowledged.', '#bs-work-title');
        break;
      case 'open':
      case 'resume':
      case 'pause':
        stopSpeech();
        await record({ type: command, targetId }, command === 'pause' ? 'Check paused.' : 'Check in progress.', '#bs-step-title');
        break;
      case 'step': {
        stopSpeech();
        const step = Number(button.dataset.step);
        const total = view.work.find(item => item.id === targetId)?.procedure.steps.length;
        const isFinal = step + 1 === total;
        await record({ type: 'step', targetId, step }, isFinal ? '' : 'Step recorded.', isFinal ? '#bs-work-complete' : '#bs-step-title');
        break;
      }
      case 'request-support':
      case 'receipt':
        await record({ type: command, targetId }, command === 'receipt' ? 'Receipt confirmed.' : 'Support request recorded.', '#bs-handoff-title');
        break;
      case 'listen': {
        const work = view.work.find(item => item.id === targetId);
        if (!work) break;
        const step = work.procedure.steps[work.progress.step];
        if (step) speak(step.title + '. ' + step.instruction);
        break;
      }
      case 'listen-pulse': {
        const person = currentPerson(view);
        const pulse = latestReading(view.snapshot, mission.devices, { type: 'crew', id: person.id }, 'heart_rate');
        if (pulse.status !== 'fresh' || pulse.reading.value === null) speak('A current heart rate reading is unavailable for ' + person.name + '.');
        else speak(person.name + ': ' + numberLabel(pulse.reading.value, 'heart_rate') + ' beats per minute. Measured at '
          + clock(mission, pulse.reading.measuredAtS) + ' UTC. Simulated reading.');
        break;
      }
      case 'stop-reading':
        stopSpeech();
        break;
    }
  });

  root.addEventListener('change', async event => {
    const field = event.target;
    if (!(field instanceof HTMLSelectElement)) return;
    switch (field.dataset.select) {
      case 'crew':
        await selectCrew(field.value);
        break;
      case 'speed': {
        const speed = Number(field.value);
        if (speed !== 1 && speed !== 2 && speed !== 4 && speed !== 8) return;
        await update((current, now) => ({
          ...current, anchorS: position(current, scenario, now), speed,
          playingSince: isPlaying(current, scenario, now) ? now : null,
        }), 'Playback speed updated.');
        break;
      }
      case 'trend-metric':
        if (isMetric(field.value)) {
          state.trendMetric = field.value;
          paint(true);
        }
        break;
      case 'trend-window':
        state.trendWindow = field.value === 'full' ? 'full' : 'recent';
        paint(true);
        break;
      case 'assignee':
        await record({ type: 'assign', targetId: field.dataset.work ?? '', assigneeId: field.value }, 'Crew handoff assigned.');
        break;
    }
  });

  store.subscribe(async () => {
    try {
      session = await store.load();
      paint(true);
    } catch {
      state.error = 'The replay could not read the saved progress.';
      paint(true);
    }
  });
  window.addEventListener('pagehide', stopSpeech);
  window.addEventListener('pageshow', async event => {
    if (!event.persisted) return;
    session = await store.load().catch(() => session);
    paint(true);
  });
  window.setInterval(paint, 250);
  paint(true);
}

function boot() {
  const root = document.querySelector<HTMLElement>('.bs-app[data-page]');
  if (root) void mount(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
