import { html, svg } from 'lit-html';
import { keyed } from 'lit-html/directives/keyed.js';
import type { ExerciseSnapshot } from '../../domain/exercise.ts';
import type { ReadingState } from '../../domain/types.ts';
import { latestReading, metrics } from '../../domain/metrics.ts';
import { exerciseReviewId, exerciseSignalId, exerciseSnapshot } from '../../services/exercise.ts';
import { isWorkPending } from '../../services/follow-up.ts';
import { readingLabels, readingTag, tag } from '../components/common.ts';
import { icon } from '../components/icons.ts';
import { replayControls } from '../components/replay-controls.ts';
import { clock, currentPerson, elapsed, personName, sensorsHref, zoneName, type ViewModel } from '../view-model.ts';
import '../styles/exercise.css';

type DisplayReading = {
  status: ReadingState['status'];
  reading?: { value: number | null; unit: string; measuredAtS: number; receivedAtS: number };
};
type PlotPoint = { atS: number; value: number | null; quality: string; source: string };

const phaseLabels = { scheduled: 'Scheduled', warmup: 'Warm-up', steady: 'Steady cycling', cooldown: 'Cool-down', complete: 'Excerpt ended' };
const outcomeLabels = { 'excerpt-complete': 'Excerpt completed', 'stopped-early': 'Stopped early' };

function datedTime(vm: ViewModel, atS: number) {
  return new Date(Date.parse(vm.mission.startUtc) + atS * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

function liveMetric(vm: ViewModel, label: string, state: DisplayReading, source: string) {
  const reading = state.reading;
  return html`<section class="bs-exercise-metric" aria-label=${label}>
    <h3>${label}</h3>
    <div class="bs-exercise-value">${state.status === 'fresh' && reading?.value !== null && reading?.value !== undefined
      ? html`${reading.value}<small> ${reading.unit}</small>` : html`<span aria-label=${readingLabels[state.status]}>—</span>`}</div>
    ${readingTag(state.status)}
    <p>${source}${reading ? html`<br>Measured ${clock(vm.mission, reading.measuredAtS)} UTC<br>Received ${clock(vm.mission, reading.receivedAtS)} UTC` : html`<br>Awaiting a source packet.`}</p>
    ${state.status !== 'fresh' && reading ? html`<details><summary>Last received sample</summary>
      <p>${reading.value === null ? 'No numeric value' : reading.value + ' ' + reading.unit}. ${readingLabels[state.status]}.</p>
    </details>` : ''}
  </section>`;
}

/** A shared time axis with separate value panels preserves each unit and source. */
function signalPlot(vm: ViewModel, exercise: ExerciseSnapshot, title: string, unit: string,
  points: PlotPoint[], maxGapS: number, kind: 'machine' | 'pulse') {
  const { startAtS, endAtS } = exercise.session;
  const delivered = points.filter(point => point.atS >= startAtS && point.atS <= Math.min(vm.snapshot.atS, endAtS));
  const segments: PlotPoint[][] = [];
  let segment: PlotPoint[] = [];
  for (const point of delivered) {
    if (point.quality !== 'good' || point.value === null) { segment = []; continue; }
    const previous = segment.at(-1);
    if (!previous || point.atS - previous.atS > maxGapS || previous.source !== point.source) {
      segment = [];
      segments.push(segment);
    }
    segment.push(point);
  }
  const values = segments.flat().map(point => point.value!);
  const low = kind === 'machine' ? 0 : Math.max(0, Math.floor((Math.min(...values, 60) - 5) / 10) * 10);
  const high = Math.max(low + 20, Math.ceil((Math.max(...values, kind === 'machine' ? 100 : 100) + 10) / 20) * 20);
  const x = (atS: number) => 42 + (atS - startAtS) / (endAtS - startAtS) * 500;
  const y = (value: number) => 95 - (value - low) / (high - low) * 78;
  const cursor = Math.max(startAtS, Math.min(endAtS, vm.snapshot.atS));
  return html`<figure class="bs-exercise-chart" data-kind=${kind}>
    <figcaption><strong>${title} · ${unit}</strong><span>Measured time · UTC</span></figcaption>
    ${values.length ? svg`<svg viewBox="0 0 560 123" role="img" aria-label=${title + ' during the exercise excerpt, in ' + unit}>
      ${[low, (low + high) / 2, high].map(value => svg`<g>
        <line class="bs-exercise-chart-grid" x1="42" x2="542" y1=${y(value)} y2=${y(value)}/>
        <text x="2" y=${y(value) + 4}>${Math.round(value)}</text></g>`)}
      ${segments.map(part => svg`<g>
        <polyline class="bs-exercise-chart-line" points=${part.map(point => x(point.atS) + ',' + y(point.value!)).join(' ')}/>
        ${part.map(point => svg`<circle cx=${x(point.atS)} cy=${y(point.value!)} r="2.3" fill=${kind === 'machine' ? '#244b3d' : '#885f47'}>
          <title>${clock(vm.mission, point.atS)} UTC · ${point.value} ${unit} · ${point.source}</title></circle>`)}
      </g>`)}
      <line class="bs-exercise-chart-now" x1=${x(cursor)} x2=${x(cursor)} y1="17" y2="95"/>
      ${[startAtS, (startAtS + endAtS) / 2, endAtS].map((atS, index) => svg`<text x=${x(atS)} y="116" text-anchor=${['start', 'middle', 'end'][index]}>${clock(vm.mission, atS)}</text>`)}
    </svg>` : html`<p class="bs-exercise-note">No usable samples have arrived for this excerpt.</p>`}
  </figure>`;
}

function plan(vm: ViewModel, exercise: ExerciseSnapshot) {
  const session = exercise.session;
  const phases = [
    { key: 'warmup', title: 'Warm-up', from: session.startAtS, to: session.warmupEndsAtS },
    { key: 'steady', title: 'Steady cycling', from: session.warmupEndsAtS, to: session.steadyEndsAtS },
    { key: 'cooldown', title: 'Cool-down', from: session.steadyEndsAtS, to: session.endAtS },
  ];
  const progress = Math.max(0, Math.min(session.endAtS - session.startAtS, vm.snapshot.atS - session.startAtS));
  return html`<section class="bs-card" aria-labelledby="bs-exercise-plan-title">
    <div class="bs-card-heading bs-wrap"><div><h2 id="bs-exercise-plan-title">Assigned exercise plan</h2>
      <p>${personName(vm, session.crewId)} · ${zoneName(vm, session.zoneId)}</p></div>${tag(phaseLabels[exercise.phase], 'muted', 'clock')}</div>
    <p><strong>${exercise.equipment.name}</strong> · ${session.plannedDurationMin}-minute illustrative mission session</p>
    <p class="bs-exercise-note">3-minute demonstration excerpt. These phases illustrate monitoring; they do not prescribe training intensity or grant exercise clearance.</p>
    <ol class="bs-exercise-plan">${phases.map(phase => html`<li aria-current=${exercise.phase === phase.key ? 'step' : 'false'}>
      <strong>${phase.title}</strong><small>${clock(vm.mission, phase.from)}–${clock(vm.mission, phase.to)} UTC</small>
      <span>${exercise.phase === phase.key ? 'Current phase' : vm.snapshot.atS >= phase.to ? 'Elapsed' : 'Upcoming'}</span>
    </li>`)}</ol>
    <div class="bs-exercise-progress"><progress aria-label="Exercise excerpt progress" value=${progress} max=${session.endAtS - session.startAtS}></progress>
      <span>${elapsed(progress)} / ${elapsed(session.endAtS - session.startAtS)}</span></div>
  </section>`;
}

function telemetry(vm: ViewModel, exercise: ExerciseSnapshot) {
  const heart = exercise.body.heartRate;
  const heartSource = exercise.body.sources.find(source => source.device.id === heart.reading?.deviceId)?.device;
  const signalWork = vm.work.find(item => item.id === exerciseSignalId(exercise.session));
  const machinePoints = exercise.machineSeries.map(packet => ({ atS: packet.measuredAtS, value: packet.power.value,
    quality: packet.quality, source: packet.equipmentId }));
  const pulsePoints = exercise.body.series.map(reading => ({ atS: reading.measuredAtS, value: reading.value,
    quality: reading.quality, source: reading.deviceId }));
  const pulseMaxAge = Math.min(...exercise.body.sources.map(source => source.device.maxAgeS));
  return html`<section class="bs-card" aria-labelledby="bs-exercise-telemetry-title">
    <div class="bs-card-heading bs-wrap"><div><h2 id="bs-exercise-telemetry-title">Exercise telemetry</h2>
      <p>${exercise.phase === 'complete' ? 'Recorded signals at the end of the excerpt' : 'Machine workload and independently sourced heart rate'}</p></div>${tag('Simulated packets', 'muted', 'sensor')}</div>
    ${signalWork && isWorkPending(signalWork) ? html`<p class="bs-warning-note">${icon('warning', 16)} An exercise data source needs review.
      <a href=${vm.href('assist', signalWork.id)}>Review reading issue</a></p>` : ''}
    <div class="bs-exercise-metrics">
      ${liveMetric(vm, 'Power', exercise.machine.power, exercise.equipment.name)}
      ${liveMetric(vm, 'Cadence', exercise.machine.cadence, exercise.equipment.name)}
      ${liveMetric(vm, 'Heart rate', heart, heartSource?.name ?? 'No heart-rate source available')}
    </div>
    <details class="bs-details"><summary>Heart-rate sources</summary>
      <div class="bs-exercise-sources">${exercise.body.sources.map(source => html`<div class="bs-exercise-source">
        <div class="bs-inline bs-wrap"><strong>${source.device.name}</strong>${readingTag(source.current.status)}
          ${heartSource?.id === source.device.id ? tag('Selected source', 'muted') : ''}</div>
        <p>${source.device.id}${source.current.reading ? ' · Measured ' + clock(vm.mission, source.current.reading.measuredAtS) + ' UTC' : ' · No packet received'}</p>
      </div>`)}</div>
      <p class="bs-exercise-note">Each sensor keeps its own identity and quality. A selected wrist sample remains labeled as wrist data.</p>
      <a href=${sensorsHref(vm)}>Inspect body sensors</a>
    </details>
    ${vm.session.simple ? '' : html`<div class="bs-exercise-charts">
      ${signalPlot(vm, exercise, 'Machine power', 'W', machinePoints, exercise.equipment.maxAgeS ?? sessionMaxGap(exercise), 'machine')}
      ${signalPlot(vm, exercise, 'Heart rate', 'bpm', pulsePoints, Number.isFinite(pulseMaxAge) ? pulseMaxAge : sessionMaxGap(exercise), 'pulse')}
    </div><p class="bs-exercise-note">Panels share the same clock. Gaps mark missing or unusable samples; a source change starts a new line. Values describe observations, not safe training zones.</p>`}
    <details class="bs-details"><summary>View delivered machine samples</summary>
      <div class="bs-table-wrap"><table><caption>Exercise machine packets · measured and received UTC</caption>
        <thead><tr><th scope="col">Measured</th><th scope="col">Received</th><th scope="col">Power · W</th><th scope="col">Cadence · rpm</th><th scope="col">Quality</th></tr></thead>
        <tbody>${[...exercise.machineSeries].reverse().map(packet => html`<tr><td>${clock(vm.mission, packet.measuredAtS)}</td>
          <td>${clock(vm.mission, packet.receivedAtS)}</td><td>${packet.power.value ?? '—'}</td><td>${packet.cadence.value ?? '—'}</td><td>${packet.quality}</td></tr>`)}</tbody>
      </table></div>
    </details>
  </section>`;
}

function sessionMaxGap(exercise: ExerciseSnapshot) { return exercise.session.samplePeriodS * 2; }

function surroundings(vm: ViewModel, exercise: ExerciseSnapshot) {
  const crewId = exercise.session.crewId;
  const context = vm.snapshot.context[crewId];
  const indicatorIds = ['skin_temperature', 'activity', 'oxygen', 'carbon_dioxide', 'pressure'] as const;
  return html`<section class="bs-card" aria-labelledby="bs-exercise-context-title">
    <div class="bs-card-heading"><div><h2 id="bs-exercise-context-title">Body &amp; surroundings</h2><p>${zoneName(vm, context.breathingZoneId)}</p></div></div>
    <dl class="bs-exercise-context">${indicatorIds.map(metric => {
      const definition = metrics[metric];
      const subject = definition.subjectType === 'crew' ? { type: 'crew' as const, id: crewId } : { type: 'zone' as const, id: context.breathingZoneId };
      const current = latestReading(vm.snapshot, vm.mission.devices, subject, metric);
      const source = vm.mission.devices.find(device => device.id === current.reading?.deviceId);
      return html`<div><dt>${definition.label}</dt><dd>${current.status === 'fresh' && current.reading.value !== null
        ? current.reading.value.toFixed(definition.digits) + ' ' + definition.unit : readingLabels[current.status]}
        <small>${source?.name ?? 'Awaiting source'}${current.reading ? html`<br>${clock(vm.mission, current.reading.measuredAtS)} UTC` : ''}</small></dd></div>`;
    })}</dl>
    <p class="bs-exercise-note">Skin temperature is a surface reading. Movement counts come from the wrist monitor. The breathing environment is measured separately.</p>
  </section>`;
}

function massRecord(vm: ViewModel, exercise: ExerciseSnapshot) {
  const mass = exercise.bodyMass;
  return html`<section class="bs-card" aria-labelledby="bs-exercise-mass-title">
    <div class="bs-card-heading"><div><h2 id="bs-exercise-mass-title">Body mass record</h2><p>Dated measurement</p></div></div>
    ${mass ? html`<div class="bs-exercise-value">${mass.value}<small> ${mass.unit}</small></div>
      <p>${datedTime(vm, mass.measuredAtS)}</p><p class="bs-exercise-note">${mass.instrumentName} · ${mass.instrumentId}.<br>Method: inertial measurement · Record ${mass.id}.<br>Received ${datedTime(vm, mass.receivedAtS)}.</p>`
      : html`<p>No body-mass record has been received for this crew member.</p>`}
    <details class="bs-details"><summary>How mass is measured in microgravity</summary>
      <p>NASA’s SLAMMD uses a known force and the resulting acceleration to determine mass, following <strong>F = ma</strong>. The demo uses a fictional dated record.</p>
      <p class="bs-exercise-note">Total body mass does not measure muscle mass, bone density or body composition. Those assessments need separate instruments and records.</p>
      <a href="https://www.nasa.gov/image-article/astronaut-shannon-walker-works-columbus-laboratory-module/" target="_blank" rel="noopener noreferrer">NASA · Mass measurement in microgravity</a>
    </details>
  </section>`;
}

function workoutRecord(vm: ViewModel, exercise: ExerciseSnapshot) {
  const session = exercise.session;
  const records = (vm.session.exerciseRecords ?? []).filter(record => record.sessionId === session.id && record.savedAtS <= vm.snapshot.atS);
  const started = vm.snapshot.atS >= session.startAtS;
  const finished = vm.snapshot.atS >= session.endAtS;
  const latest = records.at(-1);
  const canSave = started && latest?.outcome !== 'excerpt-complete'
    && (!latest || latest.endedAtS < Math.min(vm.snapshot.atS, session.endAtS));
  return html`<section class="bs-card" aria-labelledby="bs-exercise-record-title">
    <div class="bs-card-heading"><div><h2 id="bs-exercise-record-title">Record this workout</h2><p>Keep perceived effort with the received evidence</p></div></div>
    ${keyed(session.id + ':' + finished, html`<form class="bs-exercise-form" data-form="exercise-record" data-session=${session.id} data-crew=${session.crewId}>
      <label>Perceived effort<select name="effort" required ?disabled=${!canSave || vm.state.saving}>
        <option value="" disabled selected>Choose perceived effort</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="hard">Hard</option></select></label>
      <label>Session outcome<select name="outcome" required ?disabled=${!canSave || vm.state.saving}>
        <option value="" disabled selected>Choose session outcome</option><option value="excerpt-complete" ?disabled=${!finished}>Excerpt completed</option>
        <option value="stopped-early" ?disabled=${finished}>Stopped early</option></select></label>
      <button type="submit" class="bs-button bs-button-primary" ?disabled=${!canSave || vm.state.saving}>Save workout record</button>
    </form>`)}
    ${latest && !canSave ? html`<p class="bs-positive-note">${latest.outcome === 'excerpt-complete' ? 'This excerpt has a saved completion record.' : 'A record covers the current replay time. Advance the replay to capture a later observation.'}</p>` : ''}
    <p class="bs-exercise-note">${finished ? 'Record completion of the demonstration excerpt, not the full planned session.' : 'Completion becomes available when the excerpt ends. You can record an early stop after it starts.'} Saving records your report and available samples; it does not control the exercise machine.</p>
    <button type="button" class="bs-button bs-button-line" data-action="exercise-report" data-session=${session.id} data-crew=${session.crewId} ?disabled=${vm.state.saving}>${icon('assist', 16)} Report discomfort</button>
    <p class="bs-exercise-note">Opens a crew concern in Assist and pauses this replay. Use the mission’s approved procedures for an actual medical concern.</p>
    ${records.length ? [...records].reverse().map(record => {
      const work = vm.work.find(item => item.id === exerciseReviewId(record));
      return html`<article class="bs-exercise-record">
        <div class="bs-inline bs-wrap"><strong>${outcomeLabels[record.outcome]} · Revision ${record.revision}</strong>
          ${tag(work && !isWorkPending(work) ? 'Review recorded' : 'Review pending', work && !isWorkPending(work) ? 'green' : 'muted')}</div>
        <p>Saved ${clock(vm.mission, record.savedAtS)} UTC · Effort: ${record.effort}<br>
          Recorded interval: ${clock(vm.mission, record.startedAtS)}–${clock(vm.mission, record.endedAtS)} UTC</p>
        <p>Usable coverage · Machine ${record.summary.machineCoverage.toFixed(0)}% · Heart rate ${record.summary.heartRateCoverage.toFixed(0)}%.<br>
          Heart rate from usable samples · Mean ${record.summary.meanHeartRate === null ? '—' : Math.round(record.summary.meanHeartRate)} bpm · Peak ${record.summary.maxHeartRate ?? '—'} bpm.</p>
        <div class="bs-inline bs-wrap"><a class="bs-button bs-button-line" href=${vm.href('assist', exerciseReviewId(record))}>Review in Assist</a>
          <button class="bs-button bs-button-plain" type="button" data-action="export-exercise" data-record=${record.id}>Download workout JSON</button></div>
      </article>`;
    }) : html`<p class="bs-exercise-note">No workout record saved for this excerpt yet.</p>`}
  </section>`;
}

function equipmentCatalogue(vm: ViewModel) {
  const data = vm.exercise!;
  return html`<section class="bs-card" aria-labelledby="bs-exercise-equipment-title">
    <div class="bs-card-heading"><div><h2 id="bs-exercise-equipment-title">Exercise equipment</h2><p>ISS precedents inform the fictional mission equipment</p></div></div>
    <div class="bs-exercise-catalogue">${data.equipment.map(equipment => {
      const live = data.sessions.some(session => session.equipmentId === equipment.id);
      return html`<article class="bs-exercise-equipment">${tag(live ? 'Live replay' : 'Reference only', 'muted', live ? 'play' : 'book')}
        <h3>${equipment.name}</h3><p>${equipment.description}</p>
        <a href=${equipment.sourceUrl} target="_blank" rel="noopener noreferrer">NASA equipment reference ${icon('external', 14)}</a>
      </article>`;
    })}</div>
    <p class="bs-exercise-note">The cycle excerpt carries machine power and cadence. Treadmill and resistance equipment are included as references; no automatic telemetry is claimed for them in this demo.</p>
  </section>`;
}

export function exercisePage(vm: ViewModel) {
  const person = currentPerson(vm);
  const data = vm.exercise;
  const exercise = data ? exerciseSnapshot(data, vm.snapshot, person.id) : null;
  const availablePlan = data?.sessions[0];
  return html`<div class="bs-exercise">
    <header class="bs-exercise-header"><div><p class="bs-overline">${icon('activity', 17)} Mission routine</p>
      <h1>Exercise</h1><p>Follow the plan, verify the inputs and record how the session felt.</p></div>${tag('Simulation', 'muted', 'info')}</header>
    ${!data ? html`<section class="bs-card"><h2>Exercise feed unavailable</h2><p>${vm.exerciseError || 'No exercise data could be loaded.'}</p></section>`
      : !exercise ? html`<section class="bs-card bs-exercise-empty"><h2>No exercise excerpt assigned to ${person.name}</h2>
        <p>The cycle demonstration follows ${personName(vm, availablePlan?.crewId)} in the orbital cabin. The active crew profile determines whose observations are shown.</p>
        ${availablePlan ? html`<button type="button" class="bs-button bs-button-primary" data-action="open-exercise-crew" data-crew=${availablePlan.crewId} ?disabled=${vm.state.saving}>Open Yoe’s session ${icon('arrow', 16)}</button>` : ''}
      </section>` : html`${replayControls(vm)}
        <div class="bs-exercise-grid"><div class="bs-exercise-column">${plan(vm, exercise)}${telemetry(vm, exercise)}</div>
          <div class="bs-exercise-column">${surroundings(vm, exercise)}${massRecord(vm, exercise)}${workoutRecord(vm, exercise)}</div></div>`}
    ${data ? equipmentCatalogue(vm) : ''}
  </div>`;
}
