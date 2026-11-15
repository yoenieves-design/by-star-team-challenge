import { html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';
import { metrics, numberLabel, latestReading } from '../../domain/metrics.ts';
import type { WorkItem } from '../../services/follow-up.ts';
import { canSpeak } from '../../adapters/voice.ts';
import { alertLabels, readingTag, workTag } from '../components/common.ts';
import { icon } from '../components/icons.ts';
import { clock, concerns, currentPerson, personName, zoneName, type ViewModel } from '../view-model.ts';

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
  const groups = [{ work: alerts, label: 'Crew alerts' }, { work: tasks, label: 'My scheduled checks' }];
  return html`<aside class="bs-card bs-assist-queue" aria-label="Assist queue">
    <div class="bs-card-heading"><div><h2>Follow-up queue</h2><p>Choose an alert or scheduled check.</p></div></div>
    <button type="button" data-action="report-form" class="bs-button bs-button-line" aria-pressed=${vm.state.reportOpen}>${icon('assist', 17)} Report a concern</button>
    ${groups.map(({ work, label }) => html`<h3>${label}</h3>
      ${work.length ? repeat(work, item => item.id, item => html`<button type="button" class="bs-queue-item" data-action="select-work"
        data-work=${item.id} aria-pressed=${selected?.id === item.id && !vm.state.reportOpen}>
        <span><strong>${item.title}</strong>
          <small>${item.alert?.zoneId ? zoneName(vm, item.alert.zoneId) : item.crewIds.map(id => personName(vm, id)).join(', ')}</small>
        </span>${workTag(item.progress.status)}
      </button>`) : html`<p class="bs-muted">No items in this view.</p>`}`)}
  </aside>`;
}

function evidence(vm: ViewModel, item: WorkItem) {
  const alert = item.alert;
  if (!alert) return '';
  const nearby = alert.kind === 'environment' ? vm.work.filter(candidate => candidate.alert?.kind === 'concern'
    && candidate.alert.zoneId === alert.zoneId && Math.abs(candidate.alert.atS - alert.atS) <= vm.mission.rules.co2WindowS) : [];
  return html`<details class="bs-details bs-evidence">
    <summary>Evidence and timing</summary>
    <p><strong>Recorded</strong> ${clock(vm.mission, alert.atS)} UTC · ${alertLabels[alert.kind]}</p>
    <p><strong>Related crew</strong> ${item.crewIds.map(id => personName(vm, id)).join(', ')}</p>
    <p>${alert.reason}</p>
    ${alert.evidence.length ? html`<div class="bs-table-wrap"><table>
      <caption>Observations attached when the alert opened</caption>
      <thead><tr><th scope="col">Indicator</th><th scope="col">Reading</th><th scope="col">Measured UTC</th><th scope="col">Source</th><th scope="col">Quality</th></tr></thead>
      <tbody>${alert.evidence.map(reading => html`<tr><th scope="row">${metrics[reading.metric].label}</th>
        <td>${reading.value === null ? '—' : numberLabel(reading.value, reading.metric) + ' ' + reading.unit}</td>
        <td>${clock(vm.mission, reading.measuredAtS)}</td><td>${reading.deviceId}</td><td>${reading.quality}</td>
      </tr>`)}</tbody>
    </table></div>` : ''}
    ${alert.kind === 'sensor' ? html`<p>Current wrist signal ${readingTag(latestReading(vm.snapshot, vm.mission.devices, { type: 'crew', id: alert.crewIds[0] }, 'heart_rate').status)}</p>` : ''}
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
  const assignFirst = !!step?.requiresAssignee && !progress.assigneeId;

  return html`<section class="bs-card bs-assist-work" aria-labelledby="bs-work-title">
    <div class="bs-card-heading">
      <div><p>${item.alert ? alertLabels[item.alert.kind] : 'Scheduled check'} · ${item.crewIds.map(id => personName(vm, id)).join(', ')}</p>
        <h2 id="bs-work-title" tabindex="-1">${item.title}</h2></div>
      ${workTag(progress.status)}
    </div>
    <p>${item.detail}</p>
    ${evidence(vm, item)}
    <div class="bs-procedure">
      <p class="bs-procedure-label">${icon('book', 17)} ${guide.version} procedure</p>
      <h3>${guide.title}</h3>
      <p>${guide.purpose}</p>
      ${missing.length ? html`<p class="bs-warning-note">${icon('warning', 17)} Equipment unavailable in ${zone.name}: ${missing.join(', ')}.</p>` : ''}
      ${progress.status === 'complete' ? html`<p class="bs-positive-note">${icon('check', 18)} Follow-up recorded as complete.</p>` : ''}
      ${!started ? html`<div class="bs-inline bs-wrap">
        <button type="button" class="bs-button bs-button-primary" data-action="open" data-work=${item.id}
          ?disabled=${!item.available || vm.state.saving}>Start guided check ${icon('arrow', 16)}</button>
        ${progress.status === 'new' && item.alert ? action(vm, 'acknowledge', 'Acknowledge alert', item.id) : ''}
        ${!item.available ? html`<p class="bs-muted">Outside the planned activity window.</p>` : ''}
      </div>` : ''}
      ${active && step ? html`<div class="bs-step">
        <div class="bs-step-counter"><span>Step ${progress.step + 1} of ${guide.steps.length}</span>
          <progress aria-label="Procedure progress" value=${progress.step} max=${guide.steps.length}></progress></div>
        <h4 id="bs-step-title" tabindex="-1">${step.title}</h4>
        <p>${step.instruction}</p>
        ${assignFirst ? html`<p class="bs-muted">Select an assigned crew member in Crew handoff to continue.</p>` : ''}
        <div class="bs-inline bs-wrap">
          ${progress.status === 'paused' ? action(vm, 'resume', 'Resume check', item.id, true) : html`
            <button type="button" class="bs-button bs-button-primary" data-action="step" data-work=${item.id} data-step=${progress.step}
              ?disabled=${!!missing.length || assignFirst || vm.state.saving}>${progress.step + 1 === guide.steps.length ? 'Complete follow-up' : 'Done · next step'} ${icon('arrow', 16)}</button>
            ${action(vm, 'pause', 'I can’t do this now', item.id)}`}
          ${canSpeak() ? html`<button type="button" class="bs-button bs-button-plain" data-action="listen" data-work=${item.id}>${icon('volume', 18)} Listen</button>
            <button type="button" class="bs-button bs-button-plain" data-action="stop-reading">Stop audio</button>` : ''}
        </div>
        ${progress.status === 'paused' ? html`<p class="bs-muted">Progress saved. Use the handoff below to assign support.</p>` : ''}
      </div>` : ''}
      <details class="bs-details"><summary>Procedure sources</summary>
        <ul>${vm.mission.sources.filter(source => guide.sourceIds.includes(source.id)).map(source =>
          html`<li><a href=${source.url} target="_blank" rel="noopener noreferrer">${source.title} ${icon('external', 15)}</a></li>`)}</ul>
        <p>These references inform the demo workflow. The steps above are fictional mission content.</p>
      </details>
    </div>
    ${handoff(vm, item)}
    ${progress.log.length ? html`<details class="bs-details"><summary>Follow-up history</summary>
      <ol class="bs-history">${progress.log.map(event => html`<li><time>${clock(vm.mission, event.atS)} UTC</time>
        <span>${personName(vm, event.actorId)} · ${event.type === 'step' ? 'Step ' + (event.step + 1) + ' recorded'
      : event.type === 'assign' ? 'Assigned ' + personName(vm, event.assigneeId) : event.type.replaceAll('-', ' ')}</span></li>`)}</ol>
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
