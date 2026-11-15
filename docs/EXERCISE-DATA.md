# Exercise data and scientific basis

BY STAR's exercise demonstration uses fictional SELENE-06 equipment inspired by documented ISS exercise and measurement systems. The ISS references establish what kinds of measurements are meaningful. They do not establish that those exact instruments are installed on a lunar orbiter or approve the synthetic exercise plan.

## Implemented scenario

**Exercise** is the fourth application page. It follows Yoe's fictional orbital cycling session, synchronized with the existing 240-second mission replay. The session from 30 to 210 seconds is a three-minute excerpt of a planned 25-minute exercise period. Finishing the excerpt records that part of the demonstration; it does not claim completion of the full prescribed duration.

| Replay interval | Demonstration phase |
| --- | --- |
| 30–60 s | Warm-up |
| 60–150 s | Steady cycling |
| 150–210 s | Cool-down |

The page uses the shared replay clock and active crew identity. Its machine readings come from the exercise packet stream. Heart rate comes from the registered body sensors in the normal telemetry feed, with the selected source visible. ARED and T2 appear as equipment references; this scenario has no live resistance or treadmill session.

## Files and input contract

| File | Responsibility |
| --- | --- |
| `public/data/exercise-plan.json` | Version 1 synthetic equipment inventory, assigned session plan and dated body-mass samples. |
| `public/simulation/streams/exercise.json` | Synthetic cycle packets carrying machine workload and cadence. |
| `src/domain/exercise.ts` | Types for the equipment, sessions, observations and recorded exercise evidence. |
| `src/services/exercise.ts` | Input validation, packet selection, session state, source coverage and record generation. |
| `Session.exerciseRecords` | Optional append-only exercise record revisions within the saved replay. |

The plan declares `schemaVersion: 1` and synthetic origin, with `equipment`, `sessions` and `bodyMassSamples`. The implemented session is `yoe-cevis-replay`, assigned to Yoe in `orbiter`. Its planned duration is 25 minutes, with the shorter replay window declared separately.

Exercise machine packets preserve IDs, measured and received offsets, quality, and explicit measurement units. Power uses `{ value, unit: "W" }`; cadence uses `{ value, unit: "rpm" }`. All offsets refer to the mission's fixed UTC start. The display admits a sample only after it has arrived and selects by measurement time, so a late packet retains its original timing. Valid historical packets remain inspectable even when they can no longer supply a current value.

The machine normally samples every six simulated seconds. Its demonstration freshness limit is 12 seconds. Measurements from 90 through 108 seconds are omitted, and the next sample is measured at 114 and received at 115 seconds. A separate local-link interruption from 134 to 154 seconds buffers later samples. The interface shows stale or unavailable readings during a gap; it does not invent replacement values.

The current exercise heart rate uses the registered `chest-yoe` source. Yoe's `wrist-yoe` device supplies skin temperature and movement only. The service permits multiple explicitly registered heart-rate sources in future plans, but this fixture does not simulate a backup pulse sensor. The device ID remains attached to the displayed and recorded observation; no pulse value is inferred from cycle handles or cadence.

## Exercise record and follow-up

Saving a session record captures the selected crew member's declared effort, completion state and the received source evidence at that replay time. Effort is crew-reported as light, moderate or hard. An entry before the end of the excerpt records an early stop; an entry at or after 210 seconds can record the excerpt as complete. Earlier partial records remain in history when a later record is saved.

Record evidence includes machine packets and available heart-rate observations, source identities, timestamps and coverage information. Statistics use eligible received observations; unavailable intervals must remain visible beside those summaries. They do not estimate the missing samples or infer performance across unobserved time. The record is a snapshot and does not acquire future evidence when the replay advances.

An exercise review reuses Assist's existing outcome, assignment, receipt and export flow. Reporting discomfort opens a crew concern. A recorded effort or completed excerpt does not issue medical clearance or change the machine settings. All records remain local to this fictional replay.

The exercise machine has one persistent signal-review item per excerpt, opened when an observation first becomes stale or unusable while the local link is available. Its current condition changes as usable samples return; a local-link interruption makes it unknown. Body-sensor incidents continue using the core monitor's separate episode handling. When the excerpt ends, the exercise panel labels its final signals as recorded excerpt data rather than ongoing live measurements. Body and cabin context remain current in their own panel.

Coverage counts the scheduled six-second sample slots represented by usable observations received before the record was saved. A sample received after its source freshness limit remains in raw history but does not count as usable live coverage. Missing values are not replaced with zero, and the mean and maximum pulse are sample statistics rather than time-weighted estimates across the whole workout. A completed record is immutable; it does not add packets received afterward. The current fixture has no autonomous intensity adjustment or exercise-machine control.

## Dated body-mass input

The sample inventory includes a synthetic 78.4 kg total-body-mass observation measured at replay second 20 and received at second 21, with an inertial-measurement method. It is a dated observation with an instrument source. Its interpretation remains separate from the current exercise session and continuous body telemetry.

## NASA equipment precedents

| ISS equipment | Documented purpose and recorded information | Prototype interpretation |
| --- | --- | --- |
| Cycle Ergometer with Vibration Isolation and Stabilization System (CEVIS) | Aerobic cycling with recorded workload, pedaling speed, heart rate and duration. | Keep machine workload in watts and cadence in revolutions per minute. Identify the body sensor that supplies heart rate. |
| Second-generation treadmill (T2) | Walking/running speed, subject loading, heart rate and duration; NASA also documents ground-reaction and impact measurements. | A treadmill adapter would preserve speed and load as different measurements with explicit units and source metadata. |
| Advanced Resistive Exercise Device (ARED) | Resistance exercise identified by exercise type, sets, repetitions and load settings. | A resistance adapter must distinguish an instrument reading from a crew-entered set or repetition record. |

NASA describes ARED, T2 and CEVIS as ISS countermeasure equipment, with CEVIS displaying cycling speed, heart rate, elapsed time and prescription details. [NASA · Astronaut Exercise](https://www.nasa.gov/general/astronaut-exercise/). The modality-specific variables above follow NASA's exercise-monitoring description in its aerobic and muscle evidence report. [NASA · Evidence Report, exercise monitoring, PDF page 55](https://ntrs.nasa.gov/api/citations/20220019338/downloads/Evidence%20report%20aerobic%20and%20muscle_FINAL%209-21-22%20Pubpress%20accepted_v2.pdf#page=55).

CEVIS cadence is expressed in rpm and workload in W in the illustrated technical brief. The reported examples describe study observations; they are not universal workout targets. [NASA · Exercise Overview, page 11](https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-031-exercise-overview.pdf#page=11).

## Heart rate source and communication

NASA describes chest-strap heart-rate measurements and wireless reception in its MOBILE-HR report, including an investigation comparing Bluetooth with magnetic-pulse transmission. This is a precedent for separately sourced physiological data; it does not establish that every exercise instrument uses the same sensor or radio protocol. [NASA · ISS Daily Summary, September 8, 2015](https://www.nasa.gov/blogs/stationreport/2015/09/08/iss-daily-summary-report-09-8-15/).

An integration must preserve both the exercise machine ID and the physiological sensor ID. BY STAR should never relabel a wrist observation as a chest-strap observation, infer a finger sensor from the presence of a handle, or assume an independent connection makes another channel reliable. The source's identity, sample time and quality belong with each measurement.

NASA's 2018 exercise operations interview also describes a period when ARED loads, sets and repetitions were tracked manually after an instrumentation failure. This illustrates why a device record must identify how an observation was obtained. [NASA · The Zero-G Workout](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/the-zero-g-workout/).

## Body mass and body composition

NASA's Space Linear Acceleration Mass Measurement Device (SLAMMD) applies a known force and uses the resulting acceleration to calculate mass in microgravity. A dated body-mass observation can therefore be represented in kilograms without treating an Earth weight scale as an orbital instrument. [NASA · SLAMMD in the Columbus laboratory](https://www.nasa.gov/image-article/astronaut-shannon-walker-works-columbus-laboratory-module/).

A mass observation describes total body mass. It does not measure muscle mass, bone density or body composition. NASA's evidence report describes separate pre/postflight DXA body-composition assessments and strength testing. Those measurements would require separate sources and contracts. [NASA · Evidence Report, PDF page 41](https://ntrs.nasa.gov/api/citations/20220019338/downloads/Evidence%20report%20aerobic%20and%20muscle_FINAL%209-21-22%20Pubpress%20accepted_v2.pdf#page=41).

The demonstration preserves the acquisition time and method of a body-mass record. It does not interpolate that record into a continuous signal or derive a muscle-loss estimate from a change in total mass.

## Interpretation boundaries

Exercise telemetry provides context for a health review. BY STAR does not prescribe training, issue exercise clearance, calculate a universal heart-rate zone, diagnose deconditioning or remotely control exercise equipment. The mission plan, clinical authorization and specialist assessment would govern operational training.
