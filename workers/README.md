# Cloudflare decision: deferred

No Worker is required or deployed in version 0.1. The small demo rules run locally and contain
no secrets. This directory documents the boundary rather than exposing an unused public API.

Consider a Worker when adding an external sensor/API integration, scheduled ingestion,
server-side aggregation, or an independently versioned calculation service.

Proposed future flow:

1. The browser authenticates with WordPress.
2. A WordPress REST endpoint checks identity, ownership and request validity.
3. WordPress calls the Worker server-to-server with a narrowly scoped credential.
4. The Worker validates inputs, runs a versioned calculation and returns the result and provenance.
5. WordPress stores authorized records and returns only the requesting user's data.

Keep credentials in server configuration and Worker secrets, never shortcodes or frontend JS.
Authenticate requests; CORS alone is not authentication. Define schema limits, timeouts, rate limits,
error handling and retention before deployment. Avoid duplicating health data across databases.
If offline autonomy becomes essential, keep versioned local rules and design explicit sync conflicts.

Do not deploy a Worker merely to calculate an average or a demonstration threshold.
