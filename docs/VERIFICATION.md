# Verification

The November 15, 2026 exercise round passed TypeScript validation and 30 unit tests. All 17 browser cases passed using Microsoft Edge, with the exercise flow and expanded route checks rerun after correcting test expectations. The browser cases include automated accessibility checks and a simulated speech-recognition service. Desktop and 390 px mobile exercise layouts were also inspected visually. Microphone accuracy and browser speech-service availability require testing on the visitor's device.

The November 15 release review reran `npm run build:pages` and the complete 17-case browser suite successfully. The `main` documentation and license commit `b66d789` also passed GitHub Actions and Cloudflare Pages deployment. SHA-256 comparisons confirmed that the public production JavaScript, CSS, project license and bundled notices matched `dist/`. The closeout changes did not alter the application bundle. These checks verify the prototype's implemented behavior and deployment; they do not establish clinical validity.

With the lockfile dependencies installed, run:

```sh
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
php -l wordpress/snippets/by-star-loader.php
```

Set `BY_STAR_BROWSER_CHANNEL=msedge` in the shell to use installed Microsoft Edge for browser tests. The browser suite starts the production preview and checks the same compiled files intended for WordPress.

The unit suites cover telemetry schema compatibility, device attribution, time ordering, duplicate packets, missing measurements, breathing-zone grouping, planned task applicability and crew handoff transitions. Follow-up regressions cover explicit outcomes, incomplete evidence, reopening, check-ins and later alert episodes. Clinical-feed tests cover specimen matching, accepted and held reports, duplicates, correction lineage and invalid inputs. Voice tests use a fake recognition service to check the command allowlist, explicit activation and cancellation of late results.

The browser suite exercises all four pages, persistence across navigation, controls on a narrow viewport and automated accessibility checks. The GitHub workflow verifies build reproducibility and checks PHP syntax. Automated recognition tests do not establish microphone quality or the availability of a browser vendor's speech service.

When a crew-facing label, workflow or data source changes, update the corresponding App guide topic and follow its steps in the production preview. Check that measurement status and the links to Sensors, Assist and the mission schedule match the guide.

## Review-round acceptance checks

| Flow | Evidence to inspect |
| --- | --- |
| Final review step | Complete follow-up requires an explicit outcome. Unable to verify and Further review needed preserve pending work after the steps finish. |
| Continuing or recurring condition | Current condition is independent of completion. A later incident after confirmed signal recovery receives its own episode and preserves prior evidence. |
| Resting comparison | Check a resting profile and a returning EVA profile. The reference difference appears only when current usable samples match the resting context. |
| Crew self-report | Save each required field, verify actor and timestamp, and confirm that a concern creates an Assist item. A post-EVA routine cannot skip its required check-in. |
| Clinical feed | At 06:41:48 UTC, Alex is accepted and Maya is held for a specimen mismatch. At 06:42:46 UTC, Maya's accepted correction appears and the held report remains in revision history. |
| Clinical reviewer | A held or superseded report cannot be completed. Only the assigned simulated medical profile can record the accepted report's review. |
| Exercise synchronization | Yoe's cycle becomes stale while the chest pulse remains current at 01:48. Machine W/rpm and body bpm retain independent source IDs and timestamps. Exercise context prevents a resting-pulse comparison. |
| Workout records | Save a partial record, review it in Assist, advance to 03:30 and save completion as a new revision. Reload and inspect both immutable records and JSON coverage. Reporting discomfort opens the correct crew concern and pauses the replay. |
| Exercise feed failure | An unavailable exercise JSON stream reports the missing input while core body and environmental monitoring remain available. |
| Assigned work and receipt | Assign another crew member, request support, select that profile and confirm receipt. Check pending receipt behavior during a local-link interruption. |
| Review export | Download JSON and inspect mission, work ID, original evidence, current observations, result, history and UTC timing. Confirm the export performs no external delivery. |
| Voice | With supported hardware, allow microphone access, recognize one of the three commands, inspect the transcript and confirm it. Test cancel, denied permission and a phrase outside the allowlist. Screen controls remain available. |
| Separate walkthrough | Record work in the normal session, start the guided case, navigate its five stages and return. The original work remains intact. |
| Accessibility | Use keyboard controls for the guide, outcome choices, body markers and check-in. Review a 390 px viewport and simplified view with open details and long records. |

Use the [clinical data contract](CLINICAL-DATA.md) when changing the episodic report fixtures. Keep its version and the importer behavior aligned. See the [demonstration sequence](ROADMAP.md) for the intended crew-facing walkthrough.

On the deployed WordPress theme, confirm that all four child pages load the same asset version, the in-app links point to the correct URLs and the workflow persists through navigation. Review the narrow layout and expanded text on the target device. [Installation and manual walkthrough](WORDPRESS-SETUP.md).
