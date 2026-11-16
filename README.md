# BY STAR · Mission Health

**Understand the reading. Check the context. Record the next action.**

BY STAR is an English-language astronaut health-monitoring prototype by team **by-star** for the NASA Space Apps health-monitoring challenge. It follows six fictional crew members on SELENE-06, a lunar far-side construction mission, and shows how personal sensors, breathing-environment data, exercise equipment, clinical reports and crew observations can support a traceable medical review.

**[Open the live demo](https://by-star-team-challenge.pages.dev/)** · **[Seven-slide presentation (PDF)](https://by-star-team-challenge.pages.dev/presentation/by-star-project-demo.pdf)** · **[Project description](docs/PROJECT-SUBMISSION.md)** · **[Demonstration walkthrough](docs/ROADMAP.md)**

The public demo uses synthetic crew records and illustrative procedures. Its purpose is to demonstrate monitoring and follow-up; it does not diagnose, prescribe treatment or grant medical clearance. NASA references inform the design, and a separate historical NASA dataset demonstrates source provenance.

## Explore the demo

The app opens on **Health**, paused at **01:48** in a four-minute scenario. Select **Play replay** to advance the mission clock, or **Next event** to inspect a checkpoint. A running replay keeps its position across navigation. **Restart replay** returns to the beginning and asks before clearing saved work.

For a guided introduction, choose **App guide → Explore the post-EVA case**. This creates a separate practice session with Maya selected. Follow its five stages through sensor verification, the clinical report and a handoff to Noah. **Return to my replay** restores access to the original session.

| Page | What to try |
| --- | --- |
| **Health** | Select one of six crew profiles, inspect the interactive body markers, compare activity-aware trends and review the breathing environment. Record rest, fatigue and a concern in **Quick check-in**. Open **My health → Clinical checks** for dated lab reports. |
| **Assist** | Inspect the evidence, start a guided check, record an explicit outcome and request support from an assigned crew member. Switch to that profile to confirm receipt. Reopen a review or download its evidence as JSON. |
| **Exercise** | Open Yoe’s orbital cycling session. Compare machine power and cadence with independently sourced chest heart rate, inspect a signal interruption, and save an early-stop or excerpt-complete record. The three-minute excerpt represents part of a fictional 25-minute plan. |
| **Profiles** | Compare the crew, inspect individual equipment assignments, check **Sensors**, review the mission schedule and open **NASA data & references**. |

The **App guide** is available on every page. Status text and icons accompany color. Keyboard controls, text tables for charts, responsive layouts and **Simplified view** support different viewing needs. Optional browser speech reads instructions and readings. **Voice controls** accepts three English commands after explicit activation and on-screen confirmation: **Read my heart rate**, **Show my next check**, and **Open Sensors**.

## What the prototype demonstrates

- **Source-aware monitoring.** Measurement time, reception time, device identity, units and quality remain attached to observations. Old or degraded measurements are visibly distinguished from current data.
- **Context before interpretation.** Physical location, breathing zone and activity are separate. A resting heart-rate comparison requires a current sample with comparable resting context.
- **Review with an outcome.** Completing procedural steps, resolving a signal issue and acknowledging support are separate states. Unresolved work remains visible; reopening preserves its history.
- **Episodic clinical results.** A specimen mismatch holds Maya’s first urine report. A later corrected revision retains its lineage. The current accepted report is reviewed by the assigned medical profile.
- **Exercise evidence.** Machine workload and physiological response use independent sources and units. Saved workout revisions preserve the evidence and coverage available when recorded.
- **Local continuity.** IndexedDB retains the fictional session, actions and records. The scenario distinguishes a local telemetry interruption from loss of Earth relay.

## Data and scientific basis

| Input | Implemented variables | Provenance |
| --- | --- | --- |
| Personal telemetry | Heart rate in bpm, skin temperature in °C, movement in counts/min | Synthetic wrist-monitor packets. Yoe’s heart rate comes from a separately registered chest sensor; his wrist supplies skin temperature and movement. |
| Breathing environment | Oxygen fraction in %, CO₂ partial pressure in kPa, total pressure in kPa | Synthetic cabin, habitat, rover and suit-monitor packets. |
| Crew and mission context | Identity, location, activity, breathing zone, planned checks, link state, rest, fatigue and reported concerns | Fictional mission configuration, scripted context and crew-entered records. |
| Clinical results | Urine specific gravity, specimen/order IDs, instrument quality, timestamps and revisions | Synthetic post-EVA urinalysis reports for Alex and Maya. |
| Exercise | Cycle power in W, cadence in rpm, timing, perceived effort, source coverage and heart-rate sample statistics | Dedicated synthetic machine stream and independently identified body observations. |
| Body mass | Dated mass in kg, instrument, inertial measurement method and reception time | One synthetic measurement; no body-composition estimate is inferred. |
| Historical radiation reference | 16 absorbed dose-rate measurements in µGy/h from DosTel1 and DosTel2 on the ISS, April 1, 2022 | Real historical data from [NASA OSDR RadLab](https://visualization.osdr.nasa.gov/radlab/gui/data-api/). The [included sample](public/data/radlab-iss-sample.json) preserves the query and original measurements, kept separate from the lunar replay and its rules. |

NASA’s [Earth-Independent Medical Operations concept](https://ntrs.nasa.gov/citations/20250000009) informs the integration of onboard information for crew review. [NASA-STD-3001 crew-interface guidance](https://www.nasa.gov/reference/10-0-crew-interfaces-vol-2/) informs visible data status, units and redundant status cues. These are design references; the prototype has not been certified against a NASA standard.

The clinical scenario is grounded in NASA’s documented [medical evaluations around ISS EVA, §6.5.1](https://www.nasa.gov/wp-content/uploads/2024/09/ochmo-std-100-1a-rev-a-signed.pdf#page=52). Exercise references include [CEVIS, T2 and ARED](https://www.nasa.gov/general/astronaut-exercise/) and [inertial mass measurement](https://www.nasa.gov/image-article/astronaut-shannon-walker-works-columbus-laboratory-module/). T2 and ARED are reference entries in this demo; only the cycle has a simulated machine stream.

Detailed contracts and source references are in [Clinical data](docs/CLINICAL-DATA.md), [Exercise data](docs/EXERCISE-DATA.md) and the [Product brief](docs/PRODUCT-BRIEF.md).

## How playback works

The JSON streams are generated deterministically before deployment. **Play** advances the clock and reveals packets at their recorded reception times. Personal and exercise samples are generally spaced six simulated seconds apart; environmental samples are spaced eight. The scenario includes a wrist outage, an exercise-machine outage, delayed delivery and a retransmission.

The replay validates inputs, removes duplicates and preserves late samples without replacing newer observations. Monitoring rules derive review items from the evidence. User actions change the follow-up record; they do not change scripted physiological values or control equipment. All comparison and recovery thresholds are illustrative demo rules, not NASA clinical limits.

Replay position, profile selection, check-ins, follow-up actions and workout records are stored in IndexedDB in the visitor's browser. They persist across navigation on the same site and browser; the app does not upload them to a shared medical database. The guided case uses a separate session. Clearing site storage removes the saved local records, and downloaded review or workout JSON files remain on the visitor's device.

## Run locally

Use **Node.js 24.13.0**, as pinned in [.node-version](.node-version). The package supports Node.js 22.18 or newer.

```sh
npm ci
npm run build:pages
npm run preview
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). For development with live reload, run `npm run dev`.

| Command | Purpose |
| --- | --- |
| `npm run fixtures` | Regenerate deterministic body, environmental and exercise streams. This overwrites the generated fixture files. |
| `npm run typecheck` | Compile JSON validators and check TypeScript. |
| `npm test` | Run unit tests for data validation, replay, monitoring, follow-up, clinical, exercise and voice behavior. |
| `npm run build:pages` | Run type checking and unit tests, then build the static site into `dist/`. |
| `npm run test:browser` | Run Playwright workflow and automated accessibility checks against the built preview. |

Before the browser suite, run `npm run build` and `npx playwright install chromium`. Set the environment variable `BY_STAR_BROWSER_CHANNEL=msedge` to use an installed Microsoft Edge browser instead. See [Verification](docs/VERIFICATION.md) for tested flows and environment details. [GitHub Actions](.github/workflows/verify.yml) also checks regenerated fixtures and bundle syntax.

## Architecture and deployment

The application uses **TypeScript, Lit templates, Vite, Ajv, IndexedDB and the optional Web Speech API**. **Cloudflare Pages serves the static build and JSON files.** This release requires no Cloudflare Worker, application server, database service, API key or login.

```text
src/domain/        Data types and metric definitions
src/services/      Validation, replay, monitoring, records and follow-up
src/adapters/      JSON loading, local persistence and optional speech
src/app/           Application composition and event handling
src/ui/            Four pages, shared components and scoped styles
public/data/       Mission, clinical/exercise plans and NASA reference sample
public/simulation/ Scenario timeline and generated telemetry packets
schemas/           JSON Schema contracts
tests/             Unit and browser coverage
scripts/           Fixture generation, validators and static-site packaging
docs/              Architecture, data contracts and submission material
```

The build generates `dist/` locally and in Cloudflare Pages. This output is ignored by Git; the repository contains the source, fixtures and build instructions needed to reproduce it. Edit source files and rebuild rather than editing generated files. See [Architecture](docs/ARCHITECTURE.md) and [Cloudflare Pages setup](docs/CLOUDFLARE-PAGES.md) for build settings and the production/preview branch workflow.

## Prototype boundaries

The crew identities, mission, live-looking sensor values, clinical reports, exercise plan and procedures are fictional. Profile selection demonstrates role behavior and provides no authentication or medical privacy boundary. Support requests and acknowledgments are saved locally; the app sends no external crew messages. Browser speech recognition may require the browser vendor’s internet service. A simulated Earth-link outage does not establish offline web-app capability.

Operational use would require authenticated device gateways, a continuously running onboard service, protected records, validated mission procedures, authorized clinical review and verified message delivery. Radiation-dose assessment, infection diagnosis, blood/stool testing, autonomous treatment and automatic exercise adjustment are outside this implementation.

## Project material and attribution

- [Submission-ready project description](docs/PROJECT-SUBMISSION.md)
- [Seven-slide Project Demo PDF](https://by-star-team-challenge.pages.dev/presentation/by-star-project-demo.pdf) and [presentation content summary](docs/PRESENTATION-OUTLINE.md)
- [Product brief and design rationale](docs/PRODUCT-BRIEF.md)
- [Guided demonstration and exercise walkthrough](docs/ROADMAP.md)
- [NASA historical sample and original API query](public/data/radlab-iss-sample.json)
- [Third-party attribution](THIRD-PARTY-NOTICES.md) and [bundled licenses](https://by-star-team-challenge.pages.dev/THIRD-PARTY-NOTICES.txt)

OpenAI Codex assisted with implementation, documentation drafting and test development. Scientific claims are supported by the cited primary sources. Packaged lunar imagery is credited to [NASA’s Scientific Visualization Studio](https://svs.gsfc.nasa.gov/11747/); the Inter font and bundled libraries retain their individual licenses. NASA references do not imply endorsement.

The original project code is available under the [MIT License](LICENSE). Third-party materials retain their applicable licenses and attribution requirements.
