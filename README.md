# BY STAR · Mission Health

Modular English-language WordPress prototype for an astronaut health-monitoring challenge.
Branch: `fear-free`. Version: `0.1.0`.

The initial release demonstrates collecting observations, reviewing transparent demo rules,
and recording follow-up. Use fictional data only: browser storage is not a private health-record system.

## Start here

1. Read [WordPress setup](docs/WORDPRESS-SETUP.md).
2. Copy the generated [PHP snippet](wordpress/snippets/by-star-app.php) into WordPress.
3. Create the eight pages and insert their shortcodes.
4. Open **Profile & mission**, load the fictional week, and explore the demo.

## Development

Node.js 20 or newer. No npm dependencies or installation step required.

```sh
npm test
npm run build
npm run preview
```

Preview: http://127.0.0.1:4173. Stop the server with Ctrl+C.
Edit `src/`, then rebuild. Commit the generated snippet and `dist/` with the source.
The PHP file can also be installed as a plugin, but never enable both installation methods.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/config.js` | Page registry, fields and rule version |
| `src/core/` | Data validation, demo rules, storage and UI helpers |
| `src/modules/` | One view per WordPress page |
| `src/app.js` | Shared shell and event handling |
| `src/styles.css` | Scoped design system and responsive layout |
| `scripts/` | Dependency-free build and preview server |
| `wordpress/snippets/` | Generated copy-and-paste PHP artifact |
| `dist/` | Standalone preview built from the same sources |
| `tests/` | Data, rule, persistence and escaping checks |
| `workers/` | Deferred Cloudflare boundary and implementation criteria |
| `docs/` | Setup, architecture, roadmap and verification |

## Release scope

Working: daily observations, date-based editing, local persistence, sleep trend/history,
explainable alerts, daily checklist, profile editing, JSON export and printable summary.
Environment explicitly shows unconnected sensors; it does not fabricate readings.

Not implemented: authenticated health storage, device integrations, clinical assessment,
cross-device synchronization, offline page caching, or a deployed Cloudflare service.

See [architecture](docs/ARCHITECTURE.md), [roadmap](docs/ROADMAP.md), and
[verification checklist](docs/VERIFICATION.md).
