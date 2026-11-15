import { render } from 'lit-html';
import { loadDemoData } from '../adapters/demo-data.ts';
import { openSessionStore } from '../adapters/session-store.ts';
import { createVoiceController, initialVoiceState, speak, stopSpeech } from '../adapters/voice.ts';
import { loadClinicalData, clinicalWork } from '../services/clinical.ts';
import type { ClinicalData } from '../domain/clinical.ts';
import type { ExerciseData } from '../domain/exercise.ts';
import { loadExerciseData, exerciseWork, saveExerciseRecord } from '../services/exercise.ts';
import { createReviewSummary } from '../services/review-summary.ts';
import { isMetric, latestReading, numberLabel } from '../domain/metrics.ts';
import type { FollowUpEvent, Session } from '../domain/types.ts';
import { appendFollowUp, isWorkPending, listWork } from '../services/follow-up.ts';
import { createReplay } from '../services/replay.ts';
import { isPlaying, newSession, position, stopAt } from '../services/session.ts';
import { isPage, loadingPage, shell } from '../ui/shell.ts';
import { clock, concerns, currentPerson, sensorsHref, type Page, type ViewModel, type ViewState } from '../ui/view-model.ts';
import { walkthroughSteps } from '../ui/components/walkthrough.ts';
import '../ui/styles/app.css';

function routes(root: HTMLElement) {
  const search = new URLSearchParams(location.search);
  const pageOption = root.dataset.preview === 'true' ? search.get('page') : root.dataset.page;
  const page: Page = isPage(pageOption) ? pageOption : 'health';
  const assetBase = new URL(root.dataset.assetBase || './', location.href);
  const links: Partial<Record<Page, string>> = JSON.parse(root.dataset.links || '{}');
  const demoId = /^case-[a-f0-9-]{36}$/.test(search.get('by_star_demo') ?? '') ? search.get('by_star_demo')! : '';
  const tourStep = Math.max(0, Math.min(walkthroughSteps.length - 1, Math.floor(Number(search.get('by_star_stage')) || 0)));
  function href(target: Page, workId?: string) {
    const url = new URL(links[target] || '?page=' + target, location.href);
    if (workId) url.searchParams.set('by_star_work', workId);
    if (demoId) {
      url.searchParams.set('by_star_demo', demoId);
      url.searchParams.set('by_star_stage', String(tourStep));
    }
    return url.href;
  }
  return { page, assetBase, href, search, demoId, tourStep };
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
  const { page, href, search, assetBase, demoId, tourStep } = configuration;
  const asset = (path: string) => new URL(path, assetBase).href;
  let clinical: ClinicalData | null = null;
  let clinicalError = '';
  try { clinical = await loadClinicalData(assetBase, mission, scenario); }
  catch (error) { clinicalError = 'Clinical feed unavailable. ' + (error instanceof Error ? error.message : 'Try reloading the demo.'); }
  let exercise: ExerciseData | null = null;
  let exerciseError = '';
  try { exercise = await loadExerciseData(assetBase, mission, scenario); }
  catch (error) { exerciseError = 'Exercise feed unavailable. ' + (error instanceof Error ? error.message : 'Try reloading the demo.'); }
  const initial = newSession(scenario);
  if (demoId) initial.crewId = 'maya';
  const store = await openSessionStore(assetBase.href + (demoId ? ':' + demoId : ''), initial, mission.crew.map(person => person.id));
  let session = await store.load();
  const workParam = search.get('by_star_work');
  const profileSection = search.get('by_star_profile');
  const state: ViewState = {
    healthMode: search.get('by_star_health') === 'personal' || demoId ? 'personal' : 'crew', profileTab: profileSection === 'sensors' || profileSection === 'mission' ? profileSection : 'crew',
    trendMetric: 'heart_rate', trendWindow: 'recent',
    workId: workParam === 'report' ? null : workParam, reportOpen: workParam === 'report',
    error: '', notice: '', saving: false, voice: initialVoiceState(),
  };
  let view: ViewModel;
  const extraWork = (current: Session, snapshot: ReturnType<typeof replay.snapshot>) => [
    ...(clinical ? clinicalWork(mission, snapshot, current, clinical) : []),
    ...(exercise ? exerciseWork(mission, snapshot, current, exercise) : []),
  ];

  function paint(force = false) {
    const now = Date.now();
    const at = Math.floor(position(session, scenario, now));
    if (!force && view?.snapshot.atS === at) return;
    const snapshot = replay.snapshot(at);
    view = {
      page, mission, scenario, session, snapshot, state, work: listWork(mission, snapshot, session, extraWork(session, snapshot)),
      playing: isPlaying(session, scenario, now), persistent: store.persistent, href, asset,
      clinical, clinicalError, exercise, exerciseError, guided: !!demoId, tourStep,
      nextEvent: scenario.milestones.find(item => item.atS > at),
    };
    render(shell(view), root);
  }
  const voice = createVoiceController(value => { state.voice = value; if (view) paint(true); });

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
      (current, now) => {
        const snapshot = replay.snapshot(position(current, scenario, now));
        return appendFollowUp(current, event, mission, snapshot, extraWork(current, snapshot));
      },
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
    voice.stop();
    await update(current => ({ ...current, crewId }), 'Active crew member updated.', onSave);
  }

  root.addEventListener('click', async event => {
    const button = (event.target instanceof Element ? event.target : null)?.closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    const command = button.dataset.action;
    const targetId = button.dataset.work ?? '';
    switch (command) {
      case 'start-tour': {
        const url = new URL(href('health'));
        url.searchParams.set('by_star_demo', 'case-' + crypto.randomUUID());
        url.searchParams.set('by_star_stage', '0');
        location.assign(url.href);
        break;
      }
      case 'tour-step': {
        const index = Number(button.dataset.step);
        const step = walkthroughSteps[index];
        if (!step || !demoId) break;
        const url = new URL(href(step.page, step.work));
        url.searchParams.set('by_star_stage', String(index));
        if (step.profile) url.searchParams.set('by_star_profile', step.profile);
        location.assign(url.href);
        break;
      }
      case 'exit-tour': {
        const url = new URL(href('health'));
        url.searchParams.delete('by_star_demo');
        url.searchParams.delete('by_star_stage');
        location.assign(url.href);
        break;
      }
      case 'voice-start': voice.start(); break;
      case 'voice-stop': voice.stop(); break;
      case 'voice-confirm': {
        if (state.voice.command === 'open-sensors') location.assign(sensorsHref(view));
        else if (state.voice.command === 'show-next-check') {
          const next = view.work.filter(item => item.task && item.crewIds.includes(session.crewId)
            && item.available && isWorkPending(item)).sort((a, b) => a.task!.dueAtS - b.task!.dueAtS)[0];
          if (next) location.assign(href('assist', next.id));
          else { state.voice = { ...state.voice, message: 'No scheduled check is available for this crew member at this replay time.', command: null }; paint(true); }
        } else if (state.voice.command === 'read-heart-rate') {
          readPulse();
          state.voice = { ...state.voice, command: null };
          paint(true);
        }
        break;
      }
      case 'open-clinical-checks':
        state.healthMode = 'personal';
        paint(true);
        focus('#bs-clinical-checks-title');
        root.querySelector('#bs-clinical-checks-title')?.scrollIntoView({ block: 'center' });
        break;
      case 'export-review': {
        const work = view.work.find(item => item.id === targetId);
        if (!work) break;
        const result = createReviewSummary(mission, view.snapshot, session, work, clinical, exercise);
        const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'by-star-' + work.id.replace(/[^a-z0-9-]/gi, '-') + '.json';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        break;
      }
      case 'export-exercise': {
        const result = session.exerciseRecords?.find(item => item.id === button.dataset.record && item.savedAtS <= view.snapshot.atS);
        if (!result) break;
        const content = {
          schemaVersion: 1, origin: 'synthetic', mission: mission.code, missionStartUtc: mission.startUtc,
          record: result, plan: exercise?.sessions.find(item => item.id === result.sessionId),
          equipment: exercise?.equipment.find(item => item.id === result.equipmentId),
          note: 'Saved observation of a fictional exercise excerpt. Incomplete coverage is retained; this is not a completed daily prescription.',
        };
        const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'by-star-workout-' + result.id.replace(/[^a-z0-9-]/gi, '-') + '.json';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        break;
      }
      case 'open-exercise-crew':
        await selectCrew(button.dataset.crew ?? '');
        break;
      case 'exercise-report': {
        if (!exercise?.sessions.some(item => item.id === button.dataset.session && item.crewId === session.crewId)) break;
        const targetId = 'report-' + crypto.randomUUID();
        await update((current, now) => {
          const snapshot = replay.snapshot(position(current, scenario, now));
          return appendFollowUp(stopAt(current, snapshot.atS), {
            type: 'report', targetId, category: 'Discomfort during exercise', exerciseSessionId: button.dataset.session,
          }, mission, snapshot, extraWork(current, snapshot));
        }, 'Exercise concern recorded. Replay paused for review.', () => location.assign(href('assist', targetId)));
        break;
      }
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
        if ((session.activity.length || session.exerciseRecords?.length) && !window.confirm('Restart the replay and clear its recorded follow-up and workouts?')) return;
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
      case 'reopen':
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
        readPulse();
        break;
      }
      case 'stop-reading':
        stopSpeech();
        break;
    }
  });

  function readPulse() {
    const person = currentPerson(view);
    const pulse = latestReading(view.snapshot, mission.devices, { type: 'crew', id: person.id }, 'heart_rate');
    const message = pulse.status !== 'fresh' || pulse.reading.value === null
      ? 'A current heart rate reading is unavailable for ' + person.name + '.'
      : person.name + ': ' + numberLabel(pulse.reading.value, 'heart_rate') + ' beats per minute. Measured at '
        + clock(mission, pulse.reading.measuredAtS) + ' UTC. Simulated reading.';
    speak(message);
    state.notice = message;
    state.voice = { ...state.voice, message };
    paint(true);
  }

  root.addEventListener('submit', async event => {
    const form = event.target;
    if (form instanceof HTMLFormElement && form.dataset.form === 'exercise-record') {
      event.preventDefault();
      if (!exercise || form.dataset.crew !== session.crewId || !form.reportValidity()) return;
      const data = new FormData(form);
      const outcome = data.get('outcome');
      const effort = data.get('effort');
      if ((outcome !== 'excerpt-complete' && outcome !== 'stopped-early')
        || (effort !== 'light' && effort !== 'moderate' && effort !== 'hard')) return;
      const source = exercise;
      await update((current, now) => {
        const snapshot = replay.snapshot(position(current, scenario, now));
        return saveExerciseRecord(stopAt(current, snapshot.atS), source, snapshot, outcome, effort);
      }, 'Workout record saved. Replay paused; review is available in Assist.');
      return;
    }
    if (!(form instanceof HTMLFormElement) || form.dataset.form !== 'check-in') return;
    event.preventDefault();
    if (form.dataset.crew !== session.crewId || !form.reportValidity()) return;
    const data = new FormData(form);
    const sleep = data.get('sleep');
    const fatigue = data.get('fatigue');
    const concern = String(data.get('concern'));
    const onset = data.get('onset');
    if ((sleep !== 'rested' && sleep !== 'mixed' && sleep !== 'poor')
      || (fatigue !== 'low' && fatigue !== 'moderate' && fatigue !== 'high')
      || (onset !== 'now' && onset !== 'earlier' && onset !== 'unsure') || (concern !== 'None' && !concerns.includes(concern))) return;
    const targetId = 'checkin-' + crypto.randomUUID();
    await record({ type: 'check-in', targetId, sleep, fatigue, concern, onset }, 'Check-in saved. ' + (concern === 'None' ? 'No concern reported.' : 'Concern ready for review in Assist.'));
    if (!state.error) form.reset();
  });

  root.addEventListener('change', async event => {
    const field = event.target;
    if (field instanceof HTMLInputElement && field.dataset.select === 'outcome') {
      const outcome = field.value;
      if (outcome === 'verified' || outcome === 'unable-to-verify' || outcome === 'further-review') {
        await record({ type: 'outcome', targetId: field.dataset.work ?? '', outcome }, 'Review outcome saved.');
      }
      return;
    }
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
  window.addEventListener('pagehide', () => { stopSpeech(); voice.stop(); });
  window.addEventListener('pageshow', async event => {
    if (!event.persisted) return;
    session = await store.load().catch(() => session);
    paint(true);
  });
  window.setInterval(paint, 250);
  paint(true);
  if (page === 'health' && search.get('by_star_checkin') === '1') {
    requestAnimationFrame(() => focus('#bs-check-in-title'));
  }
}

function boot() {
  const root = document.querySelector<HTMLElement>('.bs-app[data-page]');
  if (root) void mount(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
