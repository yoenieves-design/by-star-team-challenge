import { html } from 'lit-html';
import { exerciseReviewId, exerciseSignalId, exerciseSnapshot } from '../../services/exercise.ts';
import { clock, personName, zoneName, type ViewModel } from '../view-model.ts';
import { readingTag, tag } from './common.ts';

/** A shared entry keeps the workout connected to Health, equipment and mission planning. */
export function exerciseSummary(vm: ViewModel, allCrew = false) {
  if (!vm.exercise) return vm.exerciseError
    ? html`<section class="bs-card"><h3>Exercise monitoring</h3><p>${vm.exerciseError}</p><a href=${vm.href('exercise')}>Open Exercise</a></section>` : '';
  const plans = vm.exercise.sessions.filter(plan => allCrew || plan.crewId === vm.session.crewId);
  if (!plans.length) return '';
  return html`<section class="bs-card" aria-label="Exercise monitoring">
    <h3>Exercise monitoring</h3>
    ${plans.map(plan => {
      const current = exerciseSnapshot(vm.exercise!, vm.snapshot, plan.crewId)!;
      const review = vm.work.find(item => item.id === exerciseSignalId(plan));
      const saved = vm.session.exerciseRecords?.findLast(record => record.sessionId === plan.id && record.savedAtS <= vm.snapshot.atS);
      return html`<div class="bs-details"><strong>${personName(vm, plan.crewId)} · ${current.equipment.name}</strong>
        <p>${zoneName(vm, plan.zoneId)} · ${clock(vm.mission, plan.startAtS)}–${clock(vm.mission, plan.endAtS)} UTC</p>
        <p>${tag(current.phase === 'complete' ? 'Excerpt ended' : current.phase === 'scheduled' ? 'Scheduled' : 'Exercise in progress', 'muted')}
          ${current.phase !== 'scheduled' && current.phase !== 'complete' ? readingTag(current.machine.power.status) : ''}</p>
        ${current.phase !== 'scheduled' && current.phase !== 'complete' ? html`<p>Power: ${current.machine.power.status === 'fresh' ? current.machine.power.reading!.value + ' W' : 'No current value'} · Cadence: ${current.machine.cadence.status === 'fresh' ? current.machine.cadence.reading!.value + ' rpm' : 'No current value'}</p>` : ''}
        <p>${saved ? 'Workout record saved · revision ' + saved.revision : 'No workout record saved.'} 3-minute demonstration excerpt of a ${plan.plannedDurationMin}-minute illustrative plan.</p>
        ${review ? html`<p><a href=${vm.href('assist', review.id)}>Review equipment signal</a></p>` : ''}
      </div>`;
    })}
    <a class="bs-button bs-button-line" href=${vm.href('exercise')}>Open Exercise</a>
  </section>`;
}

export function exerciseEvidence(vm: ViewModel, workId: string) {
  const record = vm.session.exerciseRecords?.find(item => exerciseReviewId(item) === workId && item.savedAtS <= vm.snapshot.atS);
  const plan = vm.exercise?.sessions.find(item => exerciseSignalId(item) === workId);
  if (record) return html`<details class="bs-details" open><summary>Saved workout evidence</summary>
    <p>${personName(vm, record.crewId)} · ${record.equipmentId} · revision ${record.revision}.</p>
    <p>Observed ${clock(vm.mission, record.startedAtS)}–${clock(vm.mission, record.endedAtS)} UTC. Saved ${clock(vm.mission, record.savedAtS)} UTC.</p>
    <p>Outcome: ${record.outcome === 'excerpt-complete' ? 'Excerpt completed' : 'Stopped early'} · Crew-reported effort: ${record.effort}.</p>
    <p>Usable machine coverage: ${record.summary.machineCoverage}% · Usable heart-rate coverage: ${record.summary.heartRateCoverage}%.</p>
    <p>Heart rate over usable samples: mean ${record.summary.meanHeartRate ?? '—'} bpm · maximum ${record.summary.maxHeartRate ?? '—'} bpm.</p>
    <p>These statistics describe the received excerpt. Missing or delayed data can affect coverage; they are not a fitness score or daily exercise completion.</p>
    <button type="button" class="bs-button bs-button-line" data-action="export-exercise" data-record=${record.id}>Download workout JSON</button>
    <a href=${vm.href('exercise')}>Open Exercise</a>
  </details>`;
  if (plan && vm.exercise) {
    const view = exerciseSnapshot(vm.exercise, vm.snapshot, plan.crewId)!;
    const reading = view.machine.power.reading;
    return html`<details class="bs-details" open><summary>Exercise equipment evidence</summary>
      <p>${view.equipment.name} · <code>${plan.equipmentId}</code> · ${personName(vm, plan.crewId)}.</p>
      <p>${view.phase === 'complete' ? 'State at the end of the excerpt' : 'Current machine sample'}: ${readingTag(view.machine.power.status)}</p>
      ${reading ? html`<p>Measured ${clock(vm.mission, reading.measuredAtS)} UTC · received ${clock(vm.mission, reading.receivedAtS)} UTC · quality ${reading.quality}.</p>` : ''}
      <p>Power and cadence come from the machine. Heart rate comes from an independent body sensor.</p>
      <a href=${vm.href('exercise')}>Open Exercise to inspect the stream</a>
    </details>`;
  }
  return '';
}
