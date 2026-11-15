# BY STAR product brief

BY STAR helps a crew member understand a change in health telemetry, check it in context and record the next action. The concept addresses long-duration exploration where support from Earth may be intermittent and a crew member may have to act while tired, uncomfortable or working in a different environment.

The demonstration follows six crew members on the fictional SELENE-06 lunar construction mission. Two leave the descent cabin, work in suits, re-enter through the airlock and recover inside the habitat. Their breathing environment changes as they move. A simulated air monitor shows a change in cabin CO₂, a wrist monitor becomes stale and a crew member reports dizziness. BY STAR preserves each observation and its source. The crew can investigate the shared environmental incident and the individual concern without inferring a cause from their timing.

| Surface | What the demonstration shows |
| --- | --- |
| Health | A selected crew member and six-person overview, an interactive body map, breathing-zone readings, trends, link state, shared alerts and the next scheduled check. |
| Assist | Steps with source and equipment context, a symptom or device concern report, pause and resume, a crew handoff and a log of who completed each action. |
| Profiles | Crew body maps, assigned instruments, illustrative preflight references, live replay of sensor packets, the planned schedule and project sources. |

The App guide is available from every page, with instructions for checking evidence, completing routines and asking for help. The interface pairs written status labels with icons and color. A simplified presentation enlarges text and reduces visual density. Browser speech can read the current pulse or a procedure step on request.

## What the demo measures

| Input | Variables in the replay | Operational precedent |
| --- | --- | --- |
| Crew wrist monitor | Heart rate (bpm), skin temperature (°C), and movement (counts/min) | ISS wearable studies monitor heart activity, temperature and motion using several types of devices. The body map locates the indicator or equipment while the source remains traceable to the wrist monitor. [NASA wearable research](https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/) |
| Cabin, habitat, rover or suit monitor | Oxygen fraction (%), carbon dioxide partial pressure (kPa), and total pressure (kPa) | NASA monitors atmospheric constituents on the ISS. Suit requirements also identify oxygen partial pressure; BY STAR displays oxygen fraction in the simulated breathing zone. [ISS Major Constituent Analyzer](https://ntrs.nasa.gov/citations/20120010634) · [NASA spacesuit standard](https://www.nasa.gov/reference/11-0-spacesuits-vol-2/) |
| Mission and crew input | Crew identity, location, breathing zone, activity, link availability, assigned checks and reported concerns | NASA's Earth-Independent Medical Operations concept brings crew reports and onboard reference, wearable and environmental data together for the crew medical officer. [NASA EIMO concept](https://ntrs.nasa.gov/citations/20250000009) |

The replay shows the path from a reading to a crew decision. A late packet retains its sample time, a signal alert names the affected device, and a crew member can verify the evidence, request a handoff and record follow-up. The crew can still inspect the replay and follow the prepared guide during a simulated Earth relay interruption.

The proposal uses the same observation format for simulated packets and a future approved telemetry adapter. In operational use, continuous collection and the health record would live on a local mission service. Vessel, suit and habitat data would be provided by authorized read-only telemetry feeds. A linked device could propose a crew identity and require confirmation on a shared display. Low-bandwidth or unavailable Earth communications would remain distinct from the availability of local support.

The same incident and handoff workflow could support a future review involving several crew members, including possible infection or shared environmental exposure. Any operational health procedures, clinical decisions, exposure assessment and access to crew data require mission-specific authority and validation. The demo uses fictional procedures to show the flow of evidence and actions.

## Use of NASA material

NASA-STD-3001 Volume 2 informs the visible stale or missing data labels (V2 10020), status text and symbols alongside color (V2 10045), and units displayed with values (V2 10046). The project uses these sections as prototype design references. NASA's EVA and environmental documentation informs the separation of activity, location and breathing environment. Mission links model the role of relays where direct communications are unavailable. [Crew interfaces](https://www.nasa.gov/reference/10-0-crew-interfaces-vol-2/) · [EVA risks](https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/) · [Lunar communications relays](https://www.nasa.gov/goddard/esc/lcrns/).

The [historical sample](../public/data/radlab-iss-sample.json) preserves 16 absorbed dose-rate records returned by RadLab for DosTel1 and DosTel2 on the ISS from the April 1, 2022 query window. The source timestamps and values are preserved in the file. It demonstrates traceable instrument data separately from the synthetic story. The replay has no real patient data. [NASA RadLab API documentation](https://visualization.osdr.nasa.gov/radlab/gui/data-api/).

## Proposed clinical checks

Start with a synthetic post-EVA urine test in SELENE-06. NASA documents urinalysis as part of the ISS medical evaluation around EVA. A NASA medical report also documents a portable blood analyzer in the ISS vascular contingency kit. NASA research operations support fecal sample collection for studies. The diagnostic equipment and consumables available to BY STAR would depend on the mission and vehicle. [NASA astronaut medical evaluation, section 6.5.1](https://www.nasa.gov/wp-content/uploads/2024/09/ochmo-std-100-1a-rev-a-signed.pdf#page=52) · [NASA ISS contingency kit report](https://ntrs.nasa.gov/citations/20250001074) · [NASA research sample collection](https://www.nasa.gov/hrp/research-operations-integration/sample-collection-and-portable-systems-and-blood-collection-data/) · [NASA-STD-3001 Volume 1, V1 3004](https://www.nasa.gov/reference/3-0-health-and-medical-care/).

Show the planned check in **Next health task**, the report in **Health → My health**, and the review in **Assist**. A mission-approved routine or an order authorized by the responsible medical officer starts the workflow. BY STAR presents the linked procedure, tracks when a result is expected, and records the officer's review. In the demo, replay one report received in good order and one held because the sample ID does not match the assigned order.

Use a versioned JSON feed for individual lab reports. Each record carries the crew, order, specimen and report identifiers, report revision and status, test code, instrument or method, results and units, quality indicators, and collection, reporting and reception times. The importer checks the IDs and units, handles duplicate deliveries and records corrections with their history. A pending report is a task status. A completed report remains a dated observation. The structure can map to HL7 FHIR diagnostic reports and their linked observations for a future integration. [HL7 FHIR DiagnosticReport](https://hl7.org/fhir/R4/diagnosticreport.html).

## Voice and crew communications

**In the demo today**, **Listen to current reading** reads the active crew member's pulse when available and **Listen** reads a procedure step. **Request support** and **Confirm receipt** record a simulated handoff in the browser.

**Proposed interaction.** Add push-to-talk for read and navigation commands such as **Read my heart rate**, **Show my next check** and **Open Sensors**. Display what the system heard and keep the same touch and keyboard controls. Have the crew member confirm requests that change a record or notify someone. [NASA human systems research on voice control](https://ntrs.nasa.gov/citations/20210022146) · [NASA-STD-3001 Volume 2, crew interfaces](https://www.nasa.gov/reference/10-0-crew-interfaces-vol-2/).

**Proposed delivery.** An onboard service would route messages to the assigned crew member, queue them during a link interruption, and distinguish delivery from acknowledgment. A shared alert can say that a review is pending. Clinical details belong in an authorized private view. The public replay uses fictional records. [NASA-STD-3001 Volume 1, medical operations](https://www.nasa.gov/reference/6-0-medical-operations/).
