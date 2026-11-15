import { html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { deviceReadings, metrics, numberLabel } from '../../domain/metrics.ts';
import { isWorkPending, type WorkItem } from '../../services/follow-up.ts';
import { clinicalEvidence } from '../components/clinical-checks.ts';
import { exerciseEvidence } from '../components/exercise-summary.ts';
import { outcomeLabels, reviewSummary } from '../components/review-summary.ts';
import { canSpeak } from '../../adapters/voice.ts';
import { alertLabels, deviceReadingTag, tag, workTag } from '../components/common.ts';
import { icon } from '../components/icons.ts';
import { checkInHref, clock, concerns, currentPerson, personName, sensorsHref, zoneName, type ViewModel } from '../view-model.ts';

function reportForm(vm: ViewModel) {
  const person = currentPerson(vm);
  return html`<section class="bs-card bs-assist-work" aria-labelledby="bs-report-title">
    <div class="bs-card-heading"><div><h2 id="bs-report-title" tabindex="-1">Report a concern</h2>
      <p>For ${person.name} · ${zoneName(vm, vm.snapshot.context[person.id].zoneId)}</p></div>
      <span class="bs-card-icon">${icon('assist', 23)}</span>
    </div>
    <p>Choose the closest option to open a simulated crew review.</p>
    <div class="bs-report-options">
      ${concerns.map(category => html`<button type="button" class="bs-button bs-button-line" data-action="report"
        data-category=${category} ?disabled=${vm.state.saving}>${category} ${icon('arrow', 17)}</button>`)}
    </div>
  </section>`;
}

function queue(vm: ViewModel, selected: WorkItem | undefined) {
  const alerts = vm.work.filter(item => item.alert);
  const tasks = vm.work.filter(item => item.task && item.crewIds.includes(vm.session.crewId)
    && (item.available || item.progress.status !== 'new'));
  const assigned = vm.work.filter(item => item.progress.assigneeId === vm.session.crewId
    && (isWorkPending(item) || item.progress.receipt === 'requested'));
  const clinical = vm.work.filter(item => item.clinical && (item.crewIds.includes(vm.session.crewId) || item.requiredReviewerId === vm.session.crewId));
  const exercise = vm.work.filter(item => item.exercise && !item.alert && item.crewIds.includes(vm.session.crewId));
  const groups = [{ work: assigned, label: 'Assigned to me' }, { work: alerts, label: 'Crew alerts' },
    { work: tasks, label: 'My scheduled checks' }, { work: clinical, label: 'Clinical reports' }, { work: exercise, label: 'Exercise records' }];
  return html`<aside class="bs-card bs-assist-queue" aria-label="Assist queue">
    <div class="bs-card-heading"><div><h2>Follow-up queue</h2><p>Choose an alert or scheduled check.</p></div></div>
    <button type="button" data-action="report-form" class="bs-button bs-button-line" aria-pressed=${vm.state.reportOpen}
      ?disabled=${vm.state.saving}>${icon('assist', 17)} Report a concern</button>
    ${groups.map(({ work, label }) => html`<h3>${label}</h3>
      ${work.length ? repeat(work, item => item.id, item => html`<button type="button" class="bs-queue-item" data-action="select-work"
        data-work=${item.id} aria-pressed=${selected?.id === item.id && !vm.state.reportOpen} ?disabled=${vm.state.saving}>
        <span><strong>${item.alert?.kind === 'concern' ? item.detail : item.title}</strong>
          <small>${item.alert?.zoneId && item.alert.kind !== 'concern' ? zoneName(vm, item.alert.zoneId) : item.crewIds.map(id => personName(vm, id)).join(', ')}</small>
        </span>${item.progress.receipt === 'requested' && item.progress.assigneeId === vm.session.crewId
          ? tag(vm.snapshot.links.local ? 'Receipt pending' : 'Local link interrupted', 'amber')
          : item.progress.status === 'complete' && isWorkPending(item) ? tag('Follow-up pending', 'amber') : workTag(item.progress.status)}
      </button>`) : html`<p class="bs-muted">No items in this view.</p>`}`)}
  </aside>`;
}

function evidence(vm: ViewModel, item: WorkItem) {
  const alert = item.alert;
  if (!alert) return '';
  const device = vm.mission.devices.find(item => item.id === alert.deviceId);
  const nearby = alert.kind === 'environment' ? vm.work.filter(candidate => candidate.alert?.kind === 'concern'
    && candidate.alert.zoneId === alert.zoneId && Math.abs(candidate.alert.atS - alert.atS) <= vm.mission.rules.co2WindowS) : [];
  return html`<details class="bs-details bs-evidence">
    <summary>Evidence and timing</summary>
    <p><strong>Recorded</strong> ${clock(vm.mission, alert.atS)} UTC · ${alertLabels[alert.kind]}</p>
    ${item.crewIds.length ? html`<p><strong>Related crew</strong> ${item.crewIds.map(id => personName(vm, id)).join(', ')}</p>` : ''}
    ${device ? html`<p class="bs-inline bs-wrap"><strong>${device.name}</strong> ${deviceReadingTag(deviceReadings(vm.snapshot, device))}
      <a href=${sensorsHref(vm)}>View sensors</a></p>` : ''}
    <p>${alert.reason}</p>
    ${vm.session.activity.filter(event => event.type === 'check-in' && event.targetId === item.id && event.atS <= vm.snapshot.atS)
      .map(event => event.type === 'check-in' ? html`<p><strong>Crew-reported check-in</strong> · Rest: ${event.sleep} · Fatigue: ${event.fatigue} · Concern began: ${event.onset}.</p>` : '')}
    ${alert.evidence.length ? html`<div class="bs-table-wrap"><table>
      <caption>Observations attached when the alert opened</caption>
      <thead><tr><th scope="col">Indicator</th><th scope="col">Reading</th><th scope="col">Measured UTC</th><th scope="col">Received UTC</th><th scope="col">Source</th><th scope="col">Quality</th></tr></thead>
      <tbody>${alert.evidence.map(reading => html`<tr><th scope="row">${metrics[reading.metric].label}</th>
        <td>${reading.value === null ? '—' : numberLabel(reading.value, reading.metric) + ' ' + reading.unit}</td>
        <td>${clock(vm.mission, reading.measuredAtS)}</td><td>${clock(vm.mission, reading.receivedAtS)}</td><td>${reading.deviceId}</td><td>${reading.quality}</td>
      </tr>`)}</tbody>
    </table></div>` : ''}
    ${nearby.length ? html`<p><strong>Other reports from this zone</strong> ${nearby.map(report => report.detail).join('. ')}. The cause is unconfirmed.</p>` : ''}
    <p class="bs-muted">Simulated observations</p>
  </details>`;
}

function action(vm: ViewModel, kind: string, label: string, workId: string, prominent = false) {
  return html`<button type="button" class="bs-button ${prominent ? 'bs-button-primary' : 'bs-button-line'}"
    data-action=${kind} data-work=${workId} ?disabled=${vm.state.saving}>${label}</button>`;
}

function handoff(vm: ViewModel, item: WorkItem) {
  const progress = item.progress;
  const receipt = {
    none: 'No support request recorded.',
    requested: vm.snapshot.links.local ? 'Request recorded · awaiting receipt.' : 'Request recorded locally · link interrupted.',
    confirmed: 'Receipt confirmed by ' + personName(vm, progress.assigneeId) + '.',
  }[progress.receipt];
  const canAcknowledge = progress.receipt === 'requested' && vm.session.crewId === progress.assigneeId && vm.snapshot.links.local;
  const complete = progress.status === 'complete';
  if (complete && !progress.assigneeId && progress.receipt === 'none') return '';
  return html`<section class="bs-handoff" aria-labelledby="bs-handoff-title">
    <h3 id="bs-handoff-title" tabindex="-1">Crew handoff</h3>
    <div class="bs-inline bs-wrap">
      ${complete ? html`<p>Assigned to ${personName(vm, progress.assigneeId)}</p>` : html`
        <div class="bs-inline-label">
          <label for="bs-assignee">Assigned crew member</label>
          <select id="bs-assignee" data-select="assignee" data-work=${item.id} ?disabled=${vm.state.saving}>
            <option value="" ?selected=${!progress.assigneeId} disabled>Choose crew member</option>
            ${vm.mission.crew.map(person => html`<option value=${person.id} ?selected=${person.id === progress.assigneeId}>${person.name}</option>`)}
          </select>
        </div>`}
      ${!complete && progress.assigneeId && progress.receipt === 'none' ? action(vm, 'request-support', 'Request support', item.id) : ''}
      ${canAcknowledge ? action(vm, 'receipt', 'Confirm receipt', item.id, true) : ''}
    </div>
    <p>${receipt}</p>
  </section>`;
}

function procedure(vm: ViewModel, item: WorkItem) {
  const guide = item.procedure;
  const progress = item.progress;
  const step = guide.steps[progress.step];
  const zone = vm.mission.zones.find(item => item.id === vm.snapshot.context[vm.session.crewId].zoneId)!;
  const missing = guide.requiredEquipment.filter(tool => !zone.equipment.includes(tool));
  const active = progress.status === 'in-progress' || progress.status === 'paused';
  const started = active || progress.status === 'complete';
  const finalStep = progress.step + 1 === guide.steps.length;
  const assignFirst = !!step?.requiresAssignee && !progress.assigneeId;
  const restricted = !!item.requiredReviewerId && item.requiredReviewerId !== vm.session.crewId;
  const needsCheckIn = !!step?.requiresCheckIn && !vm.session.activity.some(event => event.type === 'check-in'
    && item.crewIds.includes(event.actorId) && event.atS >= (item.task?.opensAtS ?? 0) && event.atS <= vm.snapshot.atS);
  const handoffInStep = active && !!step && (progress.status === 'paused' || step.requiresAssignee || (finalStep && !!item.alert));
  const subject = item.crewIds.length ? item.crewIds.map(id => personName(vm, id)).join(', ') : zoneName(vm, item.alert?.zoneId);

  return html`<section class="bs-card bs-assist-work" aria-labelledby="bs-work-title">
    <div class="bs-card-heading">
      <div><p>${item.alert ? alertLabels[item.alert.kind] : item.clinical ? 'Clinical report' : item.exercise ? 'Exercise record' : 'Scheduled check'} · ${subject}</p>
        <h2 id="bs-work-title" tabindex="-1">${item.title}</h2></div>
      ${workTag(progress.status)}
    </div>
    <p>${item.detail}</p>
    ${evidence(vm, item)}
    ${item.clinical && vm.clinical ? clinicalEvidence(vm, item.id, vm.clinical) : ''}
    ${item.exercise ? exerciseEvidence(vm, item.id) : ''}
    ${item.condition ? html`<div class="bs-condition"><strong>${item.condition.label}</strong><p>${item.condition.detail}</p></div>` : ''}
    ${restricted ? html`<p class="bs-warning-note">Review is assigned to ${personName(vm, item.requiredReviewerId)}. Switch to that active crew profile to record the clinical review. Profile selection simulates a role in this public demo.</p>` : ''}
    <div class="bs-procedure">
      <p class="bs-procedure-label">${icon('book', 17)} ${guide.version} procedure</p>
      <h3>${guide.title}</h3>
      <p>${guide.purpose}</p>
      ${missing.length ? html`<p class="bs-warning-note">${icon('warning', 17)} Equipment unavailable in ${zone.name}: ${missing.join(', ')}.</p>` : ''}
      ${active && !item.available ? html`<p class="bs-warning-note">${item.clinical ? 'This report is held or superseded.' : 'Outside the planned activity window. Progress is preserved; check the mission schedule before continuing.'}</p>` : ''}
      ${progress.status === 'complete' ? html`<div class="bs-inline bs-wrap bs-positive-note">
        <p id="bs-work-complete" tabindex="-1">${icon('check', 18)} Follow-up recorded as complete.</p>
        <p>Outcome: ${progress.outcome ? outcomeLabels[progress.outcome] : 'Not recorded in this earlier review'}.</p>
        ${isWorkPending(item) ? html`<p>Further follow-up remains pending. Review the current condition and assigned support.</p>` : ''}
        ${item.available && !restricted ? action(vm, 'reopen', 'Start another review', item.id) : ''}
        <a href=${vm.href('health')}>Back to Health</a>
      </div>` : ''}
      ${!started ? html`<div class="bs-inline bs-wrap">
        <button type="button" class="bs-button bs-button-primary" data-action="open" data-work=${item.id}
          ?disabled=${!item.available || restricted || vm.state.saving}>Start guided check ${icon('arrow', 16)}</button>
        ${progress.status === 'new' && item.alert ? action(vm, 'acknowledge', 'Acknowledge alert', item.id) : ''}
        ${!item.available ? html`<p class="bs-muted">${item.clinical ? 'This report is held or superseded. Inspect the report history and request a corrected source report.' : 'Outside the planned activity window.'}</p>` : ''}
      </div>` : ''}
      ${active && step ? html`<div class="bs-step">
        <div class="bs-step-counter"><span>Step ${progress.step + 1} of ${guide.steps.length}</span>
          <progress aria-label="Procedure progress" value=${progress.step} max=${guide.steps.length}></progress></div>
        <h4 id="bs-step-title" tabindex="-1">${step.title}</h4>
        <p>${step.instruction}</p>
        ${item.procedure.id === 'recovery-check' && progress.step === 1 ? html`<p><a href=${checkInHref(vm)}>Open Health to record a Quick check-in</a>. The response remains available in Review summary.</p>` : ''}
        ${needsCheckIn ? html`<p class="bs-warning-note">A check-in for the returning crew member is needed before this step can be recorded.</p>` : ''}
        ${assignFirst ? html`<p class="bs-muted">Choose a crew member to unlock this step.</p>` : ''}
        ${progress.status === 'paused' ? html`<p class="bs-muted">Progress saved. You can assign support before resuming.</p>` : ''}
        ${handoffInStep ? handoff(vm, item) : ''}
        ${finalStep && progress.status !== 'paused' ? html`<fieldset class="bs-review-outcome" ?disabled=${restricted || vm.state.saving}>
          <legend>Review outcome</legend>
          ${Object.entries(outcomeLabels).map(([value, label]) => html`<label><input type="radio" name="review-outcome" value=${value}
            data-select="outcome" data-work=${item.id} .checked=${progress.outcome === value}>${label}</label>`)}
          <p class="bs-muted">Record what you could establish. Verified means the review was performed; clinical clearance remains a separate decision.</p>
        </fieldset>` : ''}
        <div class="bs-inline bs-wrap">
          ${progress.status === 'paused' ? html`<button type="button" class="bs-button bs-button-primary" data-action="resume" data-work=${item.id}
            ?disabled=${!item.available || restricted || vm.state.saving}>Resume check</button>` : html`
            <button type="button" class="bs-button bs-button-primary" data-action="step" data-work=${item.id} data-step=${progress.step}
              ?disabled=${!item.available || !!missing.length || assignFirst || restricted || needsCheckIn || (finalStep && !progress.outcome) || vm.state.saving}>${finalStep ? 'Complete follow-up' : 'Done · next step'} ${icon(finalStep ? 'check' : 'arrow', 16)}</button>
            ${action(vm, 'pause', 'I can’t do this now', item.id)}`}
          ${canSpeak() ? html`<button type="button" class="bs-button bs-button-plain" data-action="listen" data-work=${item.id}>${icon('volume', 18)} Listen</button>
            <button type="button" class="bs-button bs-button-plain" data-action="stop-reading">Stop audio</button>` : ''}
        </div>
      </div>` : ''}
      <details class="bs-details"><summary>Procedure sources</summary>
        <ul>${vm.mission.sources.filter(source => guide.sourceIds.includes(source.id)).map(source =>
          html`<li><a href=${source.url} target="_blank" rel="noopener noreferrer">${source.title} ${icon('external', 15)}</a></li>`)}</ul>
        <p>These references inform the demo workflow. The steps above are fictional mission content.</p>
      </details>
    </div>
    ${handoffInStep ? '' : handoff(vm, item)}
    ${reviewSummary(vm, item)}
    ${progress.log.length ? html`<details class="bs-details"><summary>Follow-up history</summary>
      <ol class="bs-history">${progress.log.map(event => html`<li><time>${clock(vm.mission, event.atS)} UTC</time>
        <span>${personName(vm, event.actorId)} · ${event.type === 'step' ? 'Step ' + (event.step + 1) + ' recorded'
      : event.type === 'assign' ? 'Assigned ' + personName(vm, event.assigneeId)
      : event.type === 'outcome' ? outcomeLabels[event.outcome]
      : event.type === 'reopen' ? 'Started another review' : event.type.replaceAll('-', ' ')}</span></li>`)}</ol>
    </details>` : ''}
  </section>`;
}

export function assistPage(vm: ViewModel) {
  const fallback = vm.work.find(item => item.alert?.kind === 'environment' && item.progress.status !== 'complete')
    ?? vm.work.find(item => item.available && item.crewIds.includes(vm.session.crewId));
  const active = vm.work.find(item => item.id === vm.state.workId) ?? fallback;
  return html`<div class="bs-page-heading">
    <p class="bs-overline">${icon('assist', 17)} ${vm.mission.code}</p>
    <h1>Assist</h1>
    <p>Review an alert, complete a scheduled check or ask the crew for help.</p>
  </div>
  <div class="bs-assist-grid">
    ${queue(vm, active)}
    ${vm.state.reportOpen || !active ? reportForm(vm) : procedure(vm, active)}
  </div>`;
}
