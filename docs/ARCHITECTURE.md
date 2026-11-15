# Architecture

The TypeScript app runs in the browser. A small WordPress adapter provides page routes and enqueues the generated JavaScript and CSS. The standalone preview loads the same assets and data.

| Path | Responsibility |
| --- | --- |
| `src/domain/` | Crew, zones, devices, observations, alerts, tasks and procedure types. Metric definitions name units and presentation precision. |
| `src/services/` | Telemetry normalization, replay, monitoring, task applicability and follow-up state. These functions do not depend on the DOM. |
| `src/adapters/` | Fetching and validating JSON, IndexedDB persistence and optional browser speech. |
| `src/app/` | Compose adapters and services, handle commands and share a single snapshot with the UI. |
| `src/ui/` | Three page views, charts, shared controls and scoped styles. Lit templates update readings without replacing the surrounding controls. |
| `public/data/` | Versioned mission configuration, episodic clinical reports and a separate historical reference dataset. |
| `public/simulation/` | Scenario timeline and packet streams, emitted by a replaceable source. |
| `schemas/` | JSON Schema contracts. Ajv compiles runtime validators at build time. |
| `wordpress/snippets/` | Copyable PHP adapter for Code Snippets. |
| `dist/` | Published static output. Edit the source and build again to update it. |

## Telemetry flow

**JSON packets → validation → normalized readings → replay snapshot → monitoring → UI and Assist**

A version 1 packet supplies an ID, device sequence, assigned crew member or zone, measurement and reception offsets, and a list of metrics with units and quality. Positions are seconds from the fictional UTC start in `public/data/mission.json`. The adapter checks the JSON contracts before the services read them. The normalizer rejects mismatched device assignments and units and removes retransmissions by packet ID or device plus sequence. Valid late readings add to history. Current readings use the newest measured timestamp available at the replay position and expire by the device's age limit.

The scenario timeline supplies observed location and activity. A person's physical location and breathing zone can differ during a transition. The planned schedule stays in mission configuration. An upcoming task opens when both its time and required phase apply. A guide retains its progress when its phase changes; resuming or recording another step requires the activity window to apply again. A recovery routine can require a saved check-in from its subject, recorded after the routine opens.

## Monitoring and follow-up

The environmental rule compares good readings from an occupied breathing environment and preserves the two records that opened the review. It groups the incident by zone. The sensor rule opens a review per device when a channel is stale, degraded or missing beyond its startup window. A local link interruption suppresses new device alerts while individual reading status still reflects the data available. **Profiles → Sensors** uses the same device rules and shows packet reception time and newest measurement time separately. The resting pulse rule considers only comparable resting observations. The numeric settings in the mission file illustrate the logic and carry a demo version.

The replay records source episodes independently of the human review. Two new usable observations confirm illustrative recovery; a later recurrence creates a new episode ID. The first episode retains its existing ID for saved-session compatibility. Environmental and pulse recovery use a lower comparison boundary to avoid repeated episodes from tiny oscillations. These are synthetic event-handling rules, not clinical thresholds. Snapshots exclude future recovery times.

Follow-up is an append-only list within a replay. Acknowledgement, assignment, recorded support requests, receipt, step completion, check-ins, outcomes and reopening are separate events. An explicit outcome is required at the final step. Old saved completions remain readable with an unspecified outcome. `isWorkPending` combines the workflow, outcome, current condition and pending receipt. Reopening preserves history and an existing support request. A recipient confirms the handoff while the local link is available. The authority in the prototype is the selected fictional crew member. A real deployment would derive that identity and its permissions from the mission's access system.

## Clinical input and review export

`src/domain/clinical.ts` defines episodic orders, instruments and reports. `src/services/clinical.ts` loads and validates the separate versioned JSON feed, deduplicates reports and verifies correction lineage. Report readiness is distinct from a continuous sensor's freshness. Held and superseded reports remain inspectable; only the latest accepted revision can advance through the assigned medical officer's review. Additional work items reuse the existing follow-up log and validation service. A clinical-feed failure leaves telemetry available with a visible unavailable message. See [CLINICAL-DATA.md](CLINICAL-DATA.md).

`src/services/review-summary.ts` produces a dated local JSON export containing the original observations, current data availability, crew-reported context, review outcome and history. A clinical export also includes the order, instrument, selected report, earlier received revisions and its supersession status. Exporting does not transmit a notification or an Earth message.

## Playback and persistence

The browser stores the replay position, speed, active crew member, view preference and follow-up events in IndexedDB. A saved wall-clock anchor advances a running replay between navigations. Packet timestamps stay fixed and the view reconstructs missed scripted events on return. A paused replay stays at the saved position. When IndexedDB is unavailable, the demo explains that its temporary session resets on navigation.

The optional walkthrough creates a unique session namespace and carries its identifier through all three routes. Its progress and actions do not replace the original session. Voice input uses an optional browser recognition adapter, starts only on explicit activation, accepts three read/navigation commands and requires confirmation. Recognition may require the browser vendor's network service. Voice output and all manual controls remain separate from record mutations.

The onboard proposal would receive telemetry through authorized read-only gateways for personal devices, suit systems and habitat systems. A local mission service would run continuously, maintain history, deliver assignments and keep procedures available during loss of Earth relay. The browser replay illustrates those flows while open. Deployment on WordPress uses static assets and does not require a Worker.

## Updating data and procedures

- Edit `public/data/mission.json` to change crew assignments, equipment, rules or guidance.
- Edit `public/data/clinical-results.json` for the synthetic laboratory order/report stream and preserve correction lineage.
- Edit `public/simulation/eva-return.json` for locations, activities, link events and checkpoints.
- Run `npm run fixtures` to regenerate the packet streams after adjusting `scripts/create-telemetry.mjs`. This command overwrites the generated sample streams.
- Run `npm test` and `npm run build` to validate and package the result.

The historical RadLab sample is available separately in Profiles. Synthetic telemetry and clinical reports enter through separate adapters and services; historical radiation records do not trigger this scenario's health rules.
