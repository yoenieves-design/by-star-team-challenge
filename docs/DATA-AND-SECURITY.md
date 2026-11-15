# Data behavior and repository audit

## Will the demo always use these data?

The published application includes a fixed, reproducible fictional mission. Loading the current release reads its bundled JSON files. It does not request live astronaut observations or continuously download new NASA data.

**Play** advances the mission clock and exposes packets when their `receivedAtS` time is reached. Each packet retains its `measuredAtS` time. The same clock drives crew locations, exercise phases, link interruptions and the reports available to review. Speed changes affect playback time, not the recorded measurements. Missing intervals and late packets are deliberate parts of the scenario.

The default replay opens paused at 108 seconds of a 240-second scenario. **Restart replay** returns to zero and clears the follow-up and workout records for that replay after confirmation; it does not generate new values. New scenarios or values require editing the source fixtures/generators, rebuilding and publishing an update. A future authorized sensor adapter would replace the simulated source while preserving identities, units, timestamps and quality checks.

| Data | Source and behavior |
| --- | --- |
| Crew, zones, devices, procedures and reference values | Fictional configuration in `public/data/mission.json`. |
| Body observations | 270 deterministic packets in `public/simulation/streams/personal.json`. |
| Environmental observations | 180 deterministic packets in `public/simulation/streams/environment.json`. |
| Exercise machine observations | 27 deterministic packets in `public/simulation/streams/exercise.json`. |
| Clinical orders and results | Fictional episodic reports in `public/data/clinical-results.json`, including a held report and corrected revision. |
| Exercise plan and dated body mass | Fictional assignments and observations in `public/data/exercise-plan.json`. |
| NASA RadLab sample | 16 historical ISS measurements preserved in a separate JSON file. This reference does not trigger the lunar scenario's monitoring rules. |

## What is saved when someone uses it?

IndexedDB in the visitor's browser stores the replay position, speed, active profile, simplified-view preference, check-ins, follow-up actions and workout records. Those entries survive refreshes and navigation on the same site in the same browser. They are not uploaded to a central database, shared with the project author or synchronized across devices. Other tabs can receive local update notifications.

Storage is scoped to the site and replay namespace. A different browser, private session, cleared site storage or a different domain can start a separate session. The guided case uses a separate namespace so it does not overwrite the visitor's original replay. If browser storage is unavailable, the app explains that its temporary progress resets on navigation.

Downloads create local JSON files. The simulated support request and receipt do not send an external crew message. Optional browser speech recognition starts only on user activation and may use the browser vendor's network service; this is explained in the App guide. Hosting providers can operate their own ordinary request logs independently of the app's local record storage.

## Credentials and the public build

The application needs no API token, Cloudflare account key, GitHub password, patient credential or server secret. Cloudflare Pages serves static assets. Git integration authorization is managed by GitHub and Cloudflare outside the repository.

The browser can read every JavaScript, CSS, JSON and media asset published in `dist/`; those assets must remain suitable for public access. Deployment on the current `pages.dev` address does not require distributing Cloudflare credentials. Public project names, repository URLs and NASA URLs are identifiers, not authentication secrets.

`.gitignore` excludes `.env`, `.env.*`, `.dev.vars`, `.dev.vars.*` and `.wrangler/`. An example environment file is permitted by the existing exception but must contain placeholders only. Ignoring a file does not remove a secret that was already committed; a genuine exposed credential would require revocation and a separate history review.

## Audit scope and result

The November 15, 2026 review examined the application checkpoint `54484d731df6633a54c295c53dfea875aa3b1045`: 102 tracked files, 11 locally reachable/reflog commits, 234 unique historical blobs and 13 unreferenced blobs. Checks covered private-key signatures, common GitHub/Cloudflare and other token formats, credentials in URLs, bearer strings, sensitive assignments and credential/configuration filenames.

No unexplained credential candidate was found. The 28 pattern matches were a fragment of a NASA risk-page URL repeated across paths/history and an older local blob. No tracked private environment file or key material was found. The body, environment and exercise generators were also executed in memory and matched the public and built streams byte for byte.

This is a bounded local review, not a guarantee that every possible secret format is detectable. It does not inspect Cloudflare/GitHub account secrets, remote environment settings, browser credentials, unrelated directories or private account activity. Later changes require another review before publication.

## Sharing the source

Original code and documentation are covered by the [MIT license](../LICENSE), explicitly authorized by the project owner during closeout. Keep the [third-party notices](../THIRD-PARTY-NOTICES.md), upstream license texts and NASA credits with redistributions. The public repository and GitHub source ZIP provide the implementation; the deployed URL provides the runnable demonstration.
