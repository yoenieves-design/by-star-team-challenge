# Architecture

The TypeScript app runs in the browser. A small WordPress adapter provides page routes and enqueues the generated JavaScript and CSS. The standalone preview loads the same assets and data.

| Path | Responsibility |
| --- | --- |
| `src/domain/` | Crew, zones, devices, observations, alerts, tasks and procedure types. Metric definitions name units and presentation precision. |
| `src/services/` | Telemetry normalization, replay, monitoring, task applicability and follow-up state. These functions do not depend on the DOM. |
| `src/adapters/` | Fetching and validating JSON, IndexedDB persistence and optional browser speech. |
| `src/app/` | Compose adapters and services, handle commands and share a single snapshot with the UI. |
| `src/ui/` | Three page views, charts, shared controls and scoped styles. Lit templates update readings without replacing the surrounding controls. |
| `public/data/` | Versioned mission configuration and a separate historical reference dataset. |
| `public/simulation/` | Scenario timeline and packet streams, emitted by a replaceable source. |
| `schemas/` | JSON Schema contracts. Ajv compiles runtime validators at build time. |
| `wordpress/snippets/` | Copyable PHP adapter for Code Snippets. |
| `dist/` | Published static output. Edit the source and build again to update it. |

## Telemetry flow

**JSON packets → validation → normalized readings → replay snapshot → monitoring → UI and Assist**

A version 1 packet supplies an ID, device sequence, assigned crew member or zone, measurement and reception offsets, and a list of metrics with units and quality. Positions are seconds from the fictional UTC start in `public/data/mission.json`. The adapter checks the JSON contracts before the services read them. The normalizer rejects mismatched device assignments and units and removes retransmissions by packet ID or device plus sequence. Valid late readings add to history. Current readings use the newest measured timestamp available at the replay position and expire by the device's age limit.

The scenario timeline supplies observed location and activity. A person's physical location and breathing zone can differ during a transition. The planned schedule stays in mission configuration. An upcoming task opens when both its time and required phase apply. The demo keeps a guide already in progress available for explicit continuation.

## Monitoring and follow-up

The environmental rule compares good readings from an occupied breathing environment and preserves the two records that opened the review. It produces one review item for that zone in the replay. The sensor rule opens a review per device when a channel is stale, degraded or missing beyond its startup window. A local link interruption suppresses new device alerts while individual reading status still reflects the data available. **Profiles → Sensors** uses the same device rules and shows packet reception time and newest measurement time separately. The resting pulse rule considers only comparable resting observations. The numeric settings in the mission file illustrate the logic and carry a demo version.

Follow-up is an append-only list within a replay. Acknowledgement, assignment, recorded support requests, receipt and step completion are separate events. A recipient confirms the handoff while the local link is available. The authority in the prototype is the selected fictional crew member. A real deployment would derive that identity and its permissions from the mission's access system.

## Playback and persistence

The browser stores the replay position, speed, active crew member, view preference and follow-up events in IndexedDB. A saved wall-clock anchor advances a running replay between navigations. Packet timestamps stay fixed and the view reconstructs missed scripted events on return. A paused replay stays at the saved position. When IndexedDB is unavailable, the demo explains that its temporary session resets on navigation.

The onboard proposal would receive telemetry through authorized read-only gateways for personal devices, suit systems and habitat systems. A local mission service would run continuously, maintain history, deliver assignments and keep procedures available during loss of Earth relay. The browser replay illustrates those flows while open. Deployment on WordPress uses static assets and does not require a Worker.

## Updating data and procedures

- Edit `public/data/mission.json` to change crew assignments, equipment, rules or guidance.
- Edit `public/simulation/eva-return.json` for locations, activities, link events and checkpoints.
- Run `npm run fixtures` to regenerate the packet streams after adjusting `scripts/create-telemetry.mjs`. This command overwrites the generated sample streams.
- Run `npm test` and `npm run build` to validate and package the result.

The historical RadLab sample is available separately in Profiles. The replay loader reads only the synthetic streams specified in its adapter.
