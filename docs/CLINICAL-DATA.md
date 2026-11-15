# Clinical reports in the replay

BY STAR adds a fictional post-EVA urinalysis for Alex Morgan and Maya Torres. The mission plan authorizes the orders and assigns Noah Chen, the crew medical officer, to record the review. NASA's astronaut medical evaluation standard describes urinalysis around EVA in the ISS example schedule. NASA-STD-3001 Volume 1 calls for mission medical capability based on risks, crew needs, clinical guidance and vehicle constraints. The replay illustrates provenance and review workflow with synthetic values. [NASA astronaut medical evaluation, §6.5.1](https://www.nasa.gov/wp-content/uploads/2024/09/ochmo-std-100-1a-rev-a-signed.pdf#page=52) · [NASA-STD-3001 Volume 1, V1 3004](https://www.nasa.gov/reference/3-0-health-and-medical-care/)

## Version 1 JSON feed

[`public/data/clinical-results.json`](../public/data/clinical-results.json) packages clinical orders and reports independently of periodic sensor telemetry. `requestedAtS`, `dueAtS`, `collectedAtS`, `reportedAtS` and `receivedAtS` are integer offsets from the mission UTC start. An order can be planned or awaiting a result. A report becomes visible on its reception time and remains a dated record.

| Fields | Purpose |
| --- | --- |
| `schemaVersion`, `origin` | Validation dispatch and a synthetic-data marker. |
| `instruments` | Identifier, display name, mission zone and analysis method for each configured instrument. |
| `orders` | Order ID, crew ID, reviewer ID, expected specimen ID, test, authorization and timing. |
| `reports` | Order, person and specimen identifiers, report ID and revision, instrument and method, result observations, instrument quality check, and collection, issue and reception times. |
| `observations` | Version 1 supports numeric urine specific gravity. The unit code `1` is displayed as unitless. |

The importer checks field types, order and instrument references, units and chronology. Identical retransmissions preserve the earliest reception time. A conflicting report revision fails validation. A correction keeps the report ID, increments its revision and identifies the preceding revision. Every received revision remains inspectable. A mismatched specimen or crew identifier or a failed instrument check produces a held report and excludes its values from the review display. Accepted reports can be reviewed by the assigned profile. An accepted import establishes data integrity for the replay. The officer's review records an outcome in the existing follow-up history.

A real integration would use authorized access and confidential medical storage. Crew profiles and medical records in this public replay are fictional. NASA describes private medical communication and allows store-and-forward modes for delayed links. [NASA-STD-3001 Volume 1, §6.2](https://www.nasa.gov/reference/6-0-medical-operations/)

## Demonstration checkpoints

1. Open **Health → My health → Clinical checks** at the standard briefing. Alex has a received report ready for review. Open its details and compare the recorded specimen, instrument and receipt time to the order.
2. Select Maya. Her first revision is held because its specimen ID differs from the order. Inspect both IDs without using the held observation as a medical reading.
3. Let the replay advance to 02:46. Maya's corrected revision becomes available. Use **Report details and revision history** to inspect the original and correction. Open **Assist** and switch to Noah to record the review.
