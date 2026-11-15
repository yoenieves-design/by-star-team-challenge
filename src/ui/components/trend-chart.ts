import { html, svg } from 'lit-html';
import { metricIds, metrics, numberLabel, subjectKey } from '../../domain/metrics.ts';
import type { Metric, Reading, Subject } from '../../domain/types.ts';
import { clock, type ViewModel } from '../view-model.ts';

type Point = Reading & { value: number };
type ChartEvent = { atS: number; kind: 'activity' | 'review'; label: string };

function contextEvents(vm: ViewModel, crewId: string, zoneId: string, metric: Metric, from: number, to: number): ChartEvent[] {
  const personal = metrics[metric].subjectType === 'crew';
  const activity: ChartEvent[] = personal ? vm.scenario.events.flatMap(event => event.type === 'context' && event.crewId === crewId
    ? [{ atS: event.atS, kind: 'activity' as const, label: event.context.activity }] : []) : [];
  const reviews: ChartEvent[] = vm.work.flatMap(item => {
    const alert = item.alert;
    if (!alert || (personal ? !alert.crewIds.includes(crewId) : alert.zoneId !== zoneId)) return [];
    const relevant = alert.evidence.some(reading => reading.metric === metric)
      || alert.kind === 'personal' && metric === 'heart_rate'
      || alert.kind === 'sensor' && vm.mission.devices.some(device => device.id === alert.deviceId && device.metrics.includes(metric));
    return relevant ? [{ atS: alert.atS, kind: 'review' as const, label: 'Review opened · ' + alert.title }] : [];
  });
  // Bound the marker count so a long incident history does not obscure the trend.
  return [...activity, ...reviews].filter(event => event.atS >= from && event.atS <= to)
    .sort((a, b) => a.atS - b.atS).slice(-5);
}

function groups(readings: Reading[], maxAgeS: number) {
  const segments: Point[][] = [];
  let active: Point[] = [];
  for (const reading of readings) {
    if (reading.value === null || reading.quality !== 'good') {
      active = [];
      continue;
    }
    if (!active.length || reading.measuredAtS - active.at(-1)!.measuredAtS > maxAgeS) {
      active = [];
      segments.push(active);
    }
    active.push({ ...reading, value: reading.value });
  }
  return segments;
}

function plot(vm: ViewModel, readings: Reading[], metric: Metric, from: number, to: number, events: ChartEvent[]) {
  const device = vm.mission.devices.find(item => item.id === readings.at(-1)?.deviceId);
  const segments = groups(readings, device?.maxAgeS || 18);
  const values = segments.flat().map(point => point.value);
  if (!values.length) return html`<p class="bs-chart-empty">Waiting for a reliable reading in this window.</p>`;

  const plotLeft = 53;
  const plotRight = 627;
  const top = 20;
  const bottom = 137;
  const variation = Math.max(...values) - Math.min(...values);
  const min = Math.max(0, Math.min(...values) - Math.max(variation * 0.16, metric === 'carbon_dioxide' ? 0.02 : 1));
  const max = Math.max(...values) + Math.max(variation * 0.16, metric === 'carbon_dioxide' ? 0.02 : 1);
  const x = (atS: number) => plotLeft + ((atS - from) / Math.max(1, to - from)) * (plotRight - plotLeft);
  const y = (value: number) => bottom - (value - min) / (max - min) * (bottom - top);
  const ticks = [max, (max + min) / 2, min];
  const label = metrics[metric].label + ' trend in ' + metrics[metric].unit;

  return svg`<svg class="bs-chart-svg" viewBox="0 0 650 168" role="img" aria-label=${label} preserveAspectRatio="xMidYMid meet">
    ${ticks.map(value => svg`<g><line class="bs-chart-grid" x1=${plotLeft} x2=${plotRight} y1=${y(value)} y2=${y(value)}/>
      <text x="6" y=${y(value) + 4}>${numberLabel(value, metric)}</text></g>`)}
    ${[from, Math.round((from + to) / 2), to].map((at, index) => svg`<text x=${index === 0 ? plotLeft : index === 2 ? plotRight : (plotLeft + plotRight) / 2}
      y="160" text-anchor=${['start', 'middle', 'end'][index]}>${clock(vm.mission, at)}</text>`)}
    ${segments.map(segment => {
      const points = segment.map(point => x(point.measuredAtS) + ',' + y(point.value));
      const start = x(segment[0].measuredAtS);
      const end = x(segment.at(-1)!.measuredAtS);
      const last = segment.at(-1)!;
      return svg`<g>
        <polygon class="bs-chart-fill" points=${[start + ',' + bottom, ...points, end + ',' + bottom].join(' ')}/>
        <polyline class="bs-chart-series" points=${points.join(' ')}/>
        <circle class="bs-chart-point" cx=${end} cy=${y(last.value)} r="4"/>
      </g>`;
    })}
    ${events.map(event => svg`<g>
      <title>${clock(vm.mission, event.atS)} UTC · ${event.label}</title>
      <line class="bs-chart-event-line" data-kind=${event.kind} x1=${x(event.atS)} x2=${x(event.atS)} y1=${top} y2=${bottom}/>
      <path d=${`M${x(event.atS) - 3} ${top}h6l-3 5z`} fill=${event.kind === 'review' ? '#8a5a18' : '#647b70'}/>
    </g>`)}
  </svg>`;
}

export function trendChart(vm: ViewModel, crewId: string, zoneId: string) {
  const metric = vm.state.trendMetric;
  const subjectType = metrics[metric].subjectType;
  const subject: Subject = { type: subjectType, id: subjectType === 'zone' ? zoneId : crewId };
  const to = vm.snapshot.atS;
  const from = vm.state.trendWindow === 'recent' ? Math.max(0, to - 60) : 0;
  const readings = (vm.snapshot.readings.get(subjectKey(subject, metric)) ?? []).filter(item => item.measuredAtS >= from);
  const events = contextEvents(vm, crewId, zoneId, metric, from, to);
  let startingContext = vm.scenario.initialContext[crewId];
  for (const event of vm.scenario.events.filter(event => event.atS <= from).sort((a, b) => a.atS - b.atS)) {
    if (event.type === 'context' && event.crewId === crewId) startingContext = event.context;
  }
  return html`<section class="bs-card bs-chart-card" aria-labelledby="bs-trend-title">
    <div class="bs-card-heading bs-wrap">
      <div><h3 id="bs-trend-title">Indicator trend</h3><p>Measured time · UTC</p></div>
      <div class="bs-inline bs-wrap">
        <select aria-label="Trend indicator" data-select="trend-metric" .value=${metric}>
          ${metricIds.map(id => html`<option value=${id}>${metrics[id].label}</option>`)}
        </select>
        <select aria-label="Trend time range" data-select="trend-window" .value=${vm.state.trendWindow}>
          <option value="recent">Last 60 seconds</option>
          <option value="full">Full replay</option>
        </select>
      </div>
    </div>
    <figure>
      ${plot(vm, readings, metric, from, to, events)}
      <figcaption>${metrics[metric].explanation} Gaps indicate missing or unreliable data.</figcaption>
    </figure>
    ${subjectType === 'crew' ? html`<p class="bs-muted">Activity at window start: ${startingContext.activity}.</p>` : ''}
    ${events.length ? html`<details class="bs-details" open>
      <summary>Context markers · latest ${events.length}</summary>
      <ol class="bs-chart-events">${events.map(event => html`<li>
        <time>${clock(vm.mission, event.atS)} UTC</time><span>${event.label}</span>
      </li>`)}</ol>
    </details>` : ''}
    ${readings.length ? html`<details class="bs-details">
      <summary>View readings as a table</summary>
      <div class="bs-table-wrap"><table>
        <caption>${metrics[metric].label} · ${metrics[metric].unit}</caption>
        <thead><tr><th scope="col">Measured UTC</th><th scope="col">Value</th><th scope="col">Quality</th>${subjectType === 'crew' ? html`<th scope="col">Activity when measured</th>` : ''}</tr></thead>
        <tbody>${[...readings].reverse().map(item => html`<tr><td>${clock(vm.mission, item.measuredAtS)}</td>
          <td>${item.value === null ? '—' : numberLabel(item.value, metric)}</td><td>${item.quality}</td>
          ${subjectType === 'crew' ? html`<td>${item.context?.activity ?? 'Context unavailable'}</td>` : ''}</tr>`)}</tbody>
      </table></div>
    </details>` : ''}
  </section>`;
}
