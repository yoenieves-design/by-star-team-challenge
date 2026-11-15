# BY STAR · Mission Health

BY STAR is an English-language prototype for monitoring crew health on a long-duration mission. Six fictional astronauts work across a spacecraft, a lander and a construction site on the lunar far side. The replay opens during their return to the habitat with an environmental alert, a missing wrist signal and a separate crew concern.

The demo has three pages. **Health** shows current telemetry, trends, the crew and their breathing environments. **Assist** guides checks and records handoffs. **Profiles** holds crew assignments, equipment, the mission schedule and project sources.

| Start here | What it covers |
| --- | --- |
| [Cloudflare Pages deployment](docs/CLOUDFLARE-PAGES.md) | Review the demo from `fear-free`, publish the approved version from `main`, and connect the submission URL. |
| [WordPress installation](docs/WORDPRESS-SETUP.md) | Upload the compiled files, activate the shared PHP snippet and add the three shortcodes. |
| [Demonstration script](docs/ROADMAP.md) | Reproduce the incident, exercise the crew handoff and advance the simulated mission. |
| [Product brief](docs/PRODUCT-BRIEF.md) | Design rationale, use of NASA evidence and proposed onboard operation. |
| [Architecture](docs/ARCHITECTURE.md) | Source layout, telemetry contract and separation between replay, rules and presentation. |
| [Verification](docs/VERIFICATION.md) | Automated coverage and WordPress acceptance steps. |

## Run locally

Use Node.js 22.18 or newer.

```sh
npm ci
npm run build
npm run preview
```

Open [the local preview](http://127.0.0.1:4173). The production bundle and public data are in `dist/`. For source development with live reload, run `npm run dev`. The PHP snippet is in [wordpress/snippets/by-star-loader.php](wordpress/snippets/by-star-loader.php).

After building, run `pwsh -File scripts/package-wordpress.ps1` to create the WordPress ZIP in `release/`.

## Data provenance

Personal and atmosphere readings in the lunar replay are synthetic JSON packets. The **Sources & data** section includes a separately labeled historical sample from the NASA Open Science Data Repository RadLab API. Its 16 readings come from ISS instruments and do not enter the lunar scenario or its rules. Lunar imagery is credited to NASA's Scientific Visualization Studio. See [third-party notices](dist/THIRD-PARTY-NOTICES.txt).

Version 0.2.0 replaces the earlier daily form with a crew-centered replay. The prototype represents data availability, explanation and follow-up. The lunar identities, values and procedures are fictional.
