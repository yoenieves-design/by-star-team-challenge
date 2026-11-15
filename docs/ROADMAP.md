# Demonstration and follow-on work

Open **App guide → Explore the post-EVA case**. This starts a separate practice replay at 01:48 (06:41:48 UTC), with Maya selected shortly after the return to the habitat. The five stages guide visitors through the inputs, clinical report and crew handoff. **Return to my replay** restores access to the original saved session. The default Health replay remains available for independent exploration.

## Guided case

| Action | Expected result |
| --- | --- |
| Meet the returning crew | Maya's concern and old wrist samples are separate pieces of evidence. Body markers expose measurement quality and time. |
| Verify the input | Profiles → Sensors shows the wrist source, individual channels and measured versus received times. Local-link availability is separate from the Earth relay. |
| Inspect the clinical check | Health → My health → Clinical checks shows Maya's held report. Advance the replay past 06:42:46 UTC to see the corrected accepted revision and retained history. |
| Review and request support | Assist opens Maya's reported concern. Start the review, assign Noah and request support. Choose a Review outcome before completing the procedure. |
| Confirm the handoff | Select Noah, open Assigned to me and confirm receipt when the local link is available. Review summary shows the outcome, current condition and remaining work. |

The stages explain where to go; they do not perform medical actions or automatically mark a procedure complete. Replay time can be paused while inspecting a report or completing a review.

## Additional checks to demonstrate

| Action | Expected result |
| --- | --- |
| Select Alex, then Samira in Health | Body readings follow the selected person. The breathing environment changes from habitat to rover. |
| Open a body marker and inspect its trend | Signal state and review need are distinct. A resting comparison appears only with suitable current context. Activity and review markers explain changes in the trend window. |
| Save a Quick check-in with a concern | The response is labeled Crew-reported with its time. A separate Assist concern carries the stated category, rest, fatigue and onset. |
| Open a post-EVA check-in in Next health task | The routine requires a check-in for its assigned crew member during the activity window before that step can be confirmed. |
| Complete a sensor review with Unable to verify | The steps are recorded, and follow-up remains pending. Start another review retains the earlier actions. |
| Complete a review while support receipt is pending | The requested handoff stays visible to the assigned recipient until receipt is confirmed. |
| Inspect Alex's accepted clinical report as Alex, then as Noah | The report is visible to both fictional profiles; the assigned medical reviewer can perform the clinical review. This demonstrates role behavior in a public demo. |
| Open Review summary and Download review JSON | The local file preserves dated evidence, review outcome, actions and current context. No external message is sent. |
| Open Voice controls | Activate the microphone, speak one of the three supported English queries, inspect Heard and choose Run command. If the browser cannot provide recognition, use the ordinary controls. |
| Restart an independent replay and advance through early checkpoints | The selected crew member moves from the descent cabin to the suit breathing loop, airlock and habitat. Restart asks before clearing recorded work. |
| Open Profiles → Mission & schedule → NASA data & references | The historical ISS radiation sample has its own source and dates, separate from synthetic mission readings. |

## Exercise demonstration

Open **Exercise → Open Yoe’s session**. At the initial 01:48 replay time, the cycle signal is stale while the independent chest heart-rate source is current. Inspect the measured and received times, then use **Review reading issue** to record the equipment check in Assist. The core body, environment and exercise feeds share the mission clock.

Select perceived effort and **Stopped early**, then **Save workout record** to preserve a partial observation. Advance with **Next event** to 03:30 (06:43:30 UTC), select **Excerpt completed**, and save a new revision. Earlier records remain inspectable. Review the saved evidence in Assist or download its JSON. **Report discomfort** pauses the replay and opens a concern tied to the active profile and exercise session. See [EXERCISE-DATA.md](EXERCISE-DATA.md) for source variables and NASA evidence.

## Follow-on work

Operational integration would require device authentication, continuous onboard processing, authenticated roles, protected medical records, mission-approved clinical procedures, and communication delivery across real endpoints. A flight-ready voice interface would need validation for noise, recognition accuracy, accessibility and offline operation on the selected hardware. Additional clinical tests would require their own instruments, specimen contracts, authorized orders and review procedures.

The final project submission narrative, repository cleanup and README packaging remain a separate closeout task. Keep the in-app guide synchronized whenever a crew-facing label, workflow or input changes.
