# BY STAR product brief

BY STAR helps a crew member understand a change in health telemetry, check it in context and record the next action. The concept addresses long-duration exploration where support from Earth may be intermittent and a crew member may have to act while tired, uncomfortable or working in a different environment.

The demonstration follows six crew members on the fictional SELENE-06 lunar construction mission. Two leave the descent cabin, work in suits, re-enter through the airlock and recover inside the habitat. Their breathing environment changes as they move. A simulated air monitor shows a change in cabin CO₂, a wrist monitor becomes stale and a crew member reports dizziness. BY STAR preserves each observation and its source. The crew can investigate the shared environmental incident and the individual concern without inferring a cause from their timing.

| Surface | What the demonstration shows |
| --- | --- |
| Health | A selected crew member and six-person overview, latest reliable body and air readings, trends, link state, shared alerts and the next scheduled check. |
| Assist | Steps with source and equipment context, a symptom or device concern report, pause and resume, a crew handoff and a log of who completed each action. |
| Profiles | Preloaded identities, assigned instruments, illustrative preflight references, zones, equipment, the planned schedule and project sources. |

The interface pairs written status labels with icons and color. A simplified presentation enlarges text and reduces visual density. A keyboard and touch path remains available for every workflow. Browser speech can read the current pulse or a procedure step on request.

The proposal uses the same observation format for simulated packets and a future approved telemetry adapter. In operational use, continuous collection and the health record would live on a local mission service. Vessel, suit and habitat data would be provided by authorized read-only telemetry feeds. A linked device could propose a crew identity and require confirmation on a shared display. Low-bandwidth or unavailable Earth communications would remain distinct from the availability of local support.

The same incident and handoff workflow could support a future review involving several crew members, including possible infection or shared environmental exposure. Any operational health procedures, clinical decisions, exposure assessment and access to crew data require mission-specific authority and validation. The demo uses fictional procedures to show the flow of evidence and actions.

## Use of NASA material

NASA's crew interface guidance informs the use of contrast and redundant status cues. NASA's EVA and environmental documentation informs the separation of activity, location and breathing environment. Mission links model the role of relays where direct communications are unavailable. The sources are linked in the application. [Crew interfaces](https://www.nasa.gov/reference/10-0-crew-interfaces-vol-2/), [EVA risks](https://www.nasa.gov/reference/risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva/), [Lunar communications relays](https://www.nasa.gov/goddard/esc/lcrns/).

The [historical sample](../public/data/radlab-iss-sample.json) preserves 16 absorbed dose-rate records returned by RadLab for DosTel1 and DosTel2 on the ISS from the April 1, 2022 query window. The source timestamps and values are preserved in the file. It demonstrates traceable instrument data separately from the synthetic story. The replay has no real patient data. [NASA RadLab API documentation](https://visualization.osdr.nasa.gov/radlab/gui/data-api/).
