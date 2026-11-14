# Architecture and boundaries

## Initial decision

Use WordPress for page delivery and a shared generated shortcode snippet for the demo application.
Use pure JavaScript for the small, transparent demonstration calculations. No Cloudflare deployment
is needed for this release. All interface copy, source comments and documentation are in English.

```text
WordPress page + shortcode
         |
Shared shell / module view / scoped CSS
         |
Pure validation and rule functions
         |
Browser storage adapter (fictional data only)
```

Module views return markup; the shell handles events and persistence. Escape user strings at the
HTML boundary. Native form validation is backed by explicit model validation. Writes complete
before success is shown. Storage failures are visible and corrupt data is never silently replaced.
This separation allows replacing browser persistence with an authenticated repository later.

## Data contract

- State: `version`, `profile`, `records`, `completed`.
- Profile: fictional `name`, `mission`, local-calendar mission `start`.
- Record: local calendar `date`, nullable numeric `sleep`, `fatigue`, `mood`, `exercise`, `pulse`,
  free-text `notes`, `source` (`synthetic` or `manual-demo`), UTC `updatedAt`.
- One record per day; saving that date replaces it. Null means unmeasured. Zero is a value.
- Completed actions map stable action IDs to UTC completion timestamps. Rule IDs include the
  observation update timestamp and rule version so editing an observation requires fresh review.
- Plan checklist IDs contain the local calendar date.

Numeric bounds are input plausibility constraints, not normal ranges or treatment guidance.
Sleep below 6 hours and fatigue of 4 or 5 are **illustrative demonstration rules**, not NASA rules.
No clinical diagnosis, immune score, bone-loss estimate or overall health score is produced.
Missing and stale data are explicitly distinguished from an untriggered rule.

## Design system

Dark navy surfaces, mint interaction accents, warm review markers, text labels for every status,
visible focus rings, responsive navigation, native form controls and a scrollable observation table.
CSS is scoped under `.star-app` to reduce theme collisions. No external fonts, trackers or CDNs.

## Storage and offline limitations

Local storage is origin-scoped, unencrypted application data accessible to scripts on the site.
It is not isolated by WordPress user. It must contain fictional records only.
Loaded-page interactions can continue offline, but opening another WordPress page still requires
network access. The online indicator reflects the browser's connectivity flag, not a server health
check. No service worker, sync queue, conflict handling or multi-device persistence is implemented.
Concurrent tabs use last-write-wins; this is acceptable only for the demonstration.

## Future server boundary

Before real records: authenticate users, authorize ownership on every request, validate on the
server, add nonce/CSRF protection where applicable, define retention and deletion, protect backups,
and audit sensitive operations. WordPress REST endpoints are the first candidate; add Workers only
when integrations or independent server execution justify the operational complexity.

## Scientific context

The interface covers observations relevant to mission health awareness, not all spaceflight risks.
Environment remains an explicit integration placeholder until actual instrument data is available.

- [NASA hazards](https://www.nasa.gov/hrp/hazards/)
- [NASA human system risks](https://www.nasa.gov/hhp/human-system-risks/)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
