# BY STAR · Project submission material

This document provides English text for the project submission and a short demonstration script. The description reflects the implemented browser prototype. Complete the team-specific fields at the end before publishing.

## Project title

BY STAR — Mission Health

## Short summary

BY STAR helps astronauts understand health observations and record the next action when support from Earth is limited. Its interactive lunar-mission demo combines personal sensors, breathing-environment readings, exercise equipment, clinical reports and crew self-reports. Each observation retains its source, timing and quality. Guided reviews, explicit outcomes and acknowledged handoffs keep unresolved work visible. NASA evidence informs the design, while clearly labeled synthetic data makes the scenarios reproducible and safe to explore publicly.

## Detailed project description

Long-duration exploration places more responsibility on the crew to notice changes, assess their information and coordinate the next step. A number on a dashboard can be difficult to interpret without knowing its source, age, activity context or relationship to the surrounding environment. BY STAR explores how a small health-monitoring interface can bring that context into a recorded review.

The demonstration follows six fictional astronauts on SELENE-06, a lunar far-side construction mission. Two crew members work outside, return through an airlock and recover in a habitat. The app tracks their physical location separately from their breathing environment. A cabin CO₂ change, a returning astronaut’s dizziness report and an outdated wrist signal can appear together while retaining separate evidence and an unconfirmed relationship.

Four pages support the workflow. **Health** shows crew and personal observations, interactive body markers, trends, scheduled checks and clinical results. A short check-in adds perceived rest, fatigue and concerns that sensors cannot directly report. **Assist** explains what to inspect, preserves the observations that opened a review and records each action. A crew member can pause, assign support, confirm receipt and record whether information was verified, could not be verified or needs further review. Completing the steps does not erase a continuing data issue or a pending handoff.

**Exercise** follows a fictional orbital cycling session inspired by documented ISS equipment. Machine power and cadence share a timeline with independently sourced chest heart rate. Signal quality, units and sample times remain explicit. A three-minute excerpt represents part of a fictional 25-minute plan. The crew can report perceived effort, preserve a partial or completed excerpt as an immutable record, inspect missing-data coverage and review the workout in Assist. A dated inertial body-mass record is kept separate from exercise telemetry and body-composition assessment.

**Profiles** holds crew assignments, equipment, the mission schedule and sources. Its Sensors view lets a crew member inspect incoming observations and distinguish an outdated measurement from a late-arriving packet. The clinical scenario uses a separate report lifecycle: an incorrect specimen identifier holds a urine report, and a later correction preserves the prior revision. The assigned medical profile reviews only the current accepted report.

An in-app guide explains the controls and routines. A separate guided case preserves the visitor’s original session. Accessible controls combine text, icons and color, provide chart tables and offer a simplified presentation. Optional voice input supports three explicit read/navigation commands; spoken readings and instructions remain available where the browser supports them.

The prototype demonstrates a future onboard workflow through a reproducible public simulation. Operational deployment would require authorized device interfaces, private medical storage, mission-specific procedures, validated clinical rules and real communication delivery. BY STAR’s current contribution is a transparent path from observation to context, review and follow-up.

## What is distinctive

BY STAR treats three questions as separate: **Can this observation be used now? What context does it belong to? What did the crew do about it?** A fresh signal does not establish normal health, and a completed checklist does not establish that a condition has resolved.

The same principle connects several different inputs. Continuous sensors have freshness and quality states. Clinical reports have order/specimen validation and correction histories. Exercise records capture the evidence actually available at the time they were saved, with data gaps visible beside summaries. Crew reports preserve information that no instrument supplied.

The proposed value is practical continuity under interrupted communication: retain evidence, present a concise next action, assign responsibility and show whether support was acknowledged. The prototype makes those distinctions visible and testable without claiming a new diagnostic algorithm or flight certification.

## How it works

1. Versioned JSON defines the mission, six crew profiles, devices, planned procedures, clinical orders and exercise session.
2. Deterministic synthetic streams provide body, environmental and exercise-machine packets. The shared replay clock reveals only packets received by the selected time.
3. Validation checks identifiers, units, chronology and supported values. Duplicate deliveries are handled; delayed samples retain their original measurement times.
4. Monitoring rules detect illustrative changes or missing data and attach evidence to review items. The rules consider location, breathing zone and activity; a resting comparison requires comparable observations.
5. Crew actions append a dated history. Review outcome, source condition and support receipt remain separate. Reopening preserves previous actions.
6. IndexedDB stores the local fictional session and exercise records. JSON downloads preserve review or workout evidence for inspection. These downloads and support controls perform no external message delivery.

Play reproduces the same scripted measurements each time. User decisions change the review history, not the recorded physiology. This allows reviewers to repeat the same data-quality and coordination problems and compare the outcomes of their actions.

## Inputs represented in the prototype

| Category | Variables and records |
| --- | --- |
| Body sensors | Heart rate in bpm; skin temperature in °C; wrist movement in counts/min. Yoe’s chest source is separately identified. |
| Environment | Oxygen fraction in %, CO₂ partial pressure in kPa and total pressure in kPa for cabin, habitat, rover or suit breathing environments. |
| Mission context | Crew identity, location, breathing zone, activity, phase, device assignments, local/Earth link states and routine opening/due times. |
| Crew observations | Perceived rest, fatigue, concern category, approximate onset, review outcomes and support acknowledgments. |
| Clinical input | Synthetic urine specific gravity, order and specimen IDs, method, instrument, quality and collection/report/reception times, with held and corrected revisions. |
| Exercise | Machine power in W, cadence in rpm, timing, perceived effort, early-stop/completed-excerpt reports, source coverage and heart-rate sample statistics. |
| Body mass | One dated kg measurement with a fictional inertial instrument and method. No muscle-mass or body-composition result is inferred. |
| Historical reference | Sixteen NASA RadLab ISS absorbed dose-rate observations in µGy/h, preserved with their source metadata and original timestamps. |

## NASA data and resources used

The live-looking lunar mission data is synthetic. The real NASA dataset included in the repository is the **16-record historical RadLab sample** from DosTel1 and DosTel2 on the ISS on April 1, 2022. It is shown separately in **Profiles → Mission & schedule → NASA data & references**. It does not supply fictional astronaut measurements, trigger the demo’s alerts or estimate lunar radiation exposure. The [sample file](../public/data/radlab-iss-sample.json) preserves the original API query and values; the [RadLab API documentation](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) identifies the source interface.

| Primary source | How it informed the prototype |
| --- | --- |
| [NASA Earth-Independent Medical Operations concept](https://ntrs.nasa.gov/citations/20250000009) | Integration of onboard information and support for crew medical review when Earth assistance is constrained. |
| [NASA-STD-3001, Volume 2, Crew Interfaces](https://www.nasa.gov/reference/10-0-crew-interfaces-vol-2/) | Visible stale/missing data, clear units and status cues that accompany color. These are design references rather than a claim of compliance. |
| [NASA-STD-3001, Volume 1, Medical Operations](https://www.nasa.gov/reference/6-0-medical-operations/) | Mission planning, medical roles, health routines and the need for private medical communication in an operational system. |
| [ISS Major Constituent Analyzer](https://ntrs.nasa.gov/citations/20120010634) | Separate representation of atmospheric constituents and pressure. |
| [NASA wearable technology research](https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/) | Examples of personal measurements during activity and rest; this does not imply every demo sensor is standard flight equipment. |
| [NASA astronaut medical evaluation, §6.5.1](https://www.nasa.gov/wp-content/uploads/2024/09/ochmo-std-100-1a-rev-a-signed.pdf#page=52) | The post-EVA urinalysis scenario is grounded in a documented ISS medical evaluation example. The instrument and values in BY STAR are fictional. |
| [NASA Astronaut Exercise](https://www.nasa.gov/general/astronaut-exercise/) and [exercise-monitoring evidence, PDF page 55](https://ntrs.nasa.gov/api/citations/20220019338/downloads/Evidence%20report%20aerobic%20and%20muscle_FINAL%209-21-22%20Pubpress%20accepted_v2.pdf#page=55) | CEVIS-inspired cycling variables and distinct T2/ARED equipment references. Only the cycle supplies simulated machine packets in this release. |
| [NASA SLAMMD mass measurement](https://www.nasa.gov/image-article/astronaut-shannon-walker-works-columbus-laboratory-module/) | A known force and measured acceleration can establish mass in microgravity; the dated kg record remains separate from body composition. |
| [NASA lunar communications relays](https://www.nasa.gov/goddard/esc/lcrns/) | Separation of Earth relay availability from local telemetry and crew support. |

Packaged lunar imagery is credited to [NASA’s Scientific Visualization Studio](https://svs.gsfc.nasa.gov/11747/). Additional source details appear in the [Product brief](PRODUCT-BRIEF.md), [Clinical data contract](CLINICAL-DATA.md) and [Exercise data contract](EXERCISE-DATA.md).

## Technology and accessibility

The app is written in TypeScript, uses Lit templates for rendering, Vite for builds and Ajv for JSON Schema validation. Pure domain services handle replay, monitoring and follow-up. IndexedDB stores the fictional browser session. Cloudflare Pages hosts static HTML, JavaScript, CSS and JSON; no Cloudflare Worker or backend service is required. An optional WordPress shortcode adapter loads the same compiled application.

The interface provides keyboard navigation, visible focus, text and icons alongside color, readable labels with units, chart tables, a responsive layout and a simplified presentation. Automated accessibility tests support verification, but do not establish universal usability or formal certification. Voice uses the browser’s optional Web Speech API and may depend on the vendor’s internet service. Every supported voice action has an on-screen control.

## Intended users and future deployment

The primary intended user is a crew member reviewing a change or completing a mission health routine. The crew medical officer can inspect source evidence, review clinical reports and acknowledge assigned follow-up. Mission planners would configure authorized equipment, routines and procedures before flight.

Future implementation would connect authorized read-only device gateways to an onboard service that operates continuously, protects medical information and delivers messages to actual recipients. It would require authentication, clinical validation and mission-specific authorization. The same broad approach could be investigated for remote teams on Earth, but this prototype has not been evaluated for terrestrial clinical use.

## Implemented scope and limits

The demo implements interactive monitoring, source-quality checks, context-aware comparisons, self-reports, procedural reviews, handoffs, clinical revision handling, exercise records, local export, a guided case and optional voice controls. Its automated tests cover those workflows and data contracts.

All crew identities and medical values are fictional. Profile selection demonstrates roles without authenticating a user. The app has no autonomous diagnosis, prescription, clinical clearance, personal radiation-dose assessment, infection model, live hardware connection or external message delivery. Blood and stool tests are not implemented. The cycle excerpt does not change machine settings or automatically adjust training. A simulated link outage illustrates workflow behavior; it does not demonstrate a fully offline web application.

OpenAI Codex assisted with coding, documentation drafting and automated test development. AI-produced material is not used as scientific evidence; the project cites the relevant primary sources separately.

The original project code is released under the [MIT License](../LICENSE). NASA materials, the Inter font and bundled dependencies retain their applicable attribution and licensing terms, documented in [third-party notices](../THIRD-PARTY-NOTICES.md).

The [data behavior and repository audit](DATA-AND-SECURITY.md) explains bundled public data, local browser storage, exports and the scope of the credential review.

## Suggested demonstration script

1. **Opening:** “BY STAR helps a crew member understand whether a reading is usable, what context it belongs to, and what follow-up remains.” Open Health and select Maya.
2. **Verify the evidence:** Inspect the wrist sample’s time and source. Show the separate breathing environment and open the cabin incident in Assist.
3. **Record a decision:** Start the review, request support from Noah and select an explicit outcome. Switch to Noah to confirm receipt. Show that an unresolved issue remains pending.
4. **Clinical integrity:** Open Maya’s Clinical checks. Show the held specimen mismatch, advance to the correction at 02:46, and inspect both revisions. Switch to Noah for the assigned review.
5. **Exercise continuity:** Open Exercise and Yoe’s session. Show machine W/rpm beside chest bpm, the data gap and the dated mass record. Save or inspect a workout record and its source coverage.
6. **Close:** Open the historical NASA sample and explain that these real ISS records are separate from the synthetic mission. Show the guide or a JSON export as time allows.

Use the current submission portal’s time and format limits when recording a presentation. The complete [walkthrough](ROADMAP.md) can also be followed without a video.

## Links and team fields to complete

| Field | Value |
| --- | --- |
| Public demo | https://by-star-team-challenge.pages.dev/ |
| Source repository | https://github.com/yoenieves-design/by-star-team-challenge |
| Project name | BY STAR · Mission Health |
| Team name | by-star |
| Registered challenge and project page | **Copy the exact title and URL from the submission portal.** |
| Team members and contributions | **Enter the actual participants and their contributions.** |
| Local event / location | **Enter the registered event information, if requested.** |
| Presentation or video | **Add the final public link, if required.** |
| Original code license | MIT; see the [LICENSE](../LICENSE) and [third-party notices](../THIRD-PARTY-NOTICES.md). |

The team-specific fields marked above are intentionally incomplete. They are not claims about participants, competition eligibility, submission status or a deadline. No project submission has been made by preparing this document.
