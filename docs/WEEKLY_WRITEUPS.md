# NexusFlow MID review — two weekly write-up drafts

**Status:** Drafts only. These are repository-backed technical summaries, **not** evidence of Infotact portal submission. Add real screenshots, test logs, reviewer comments and dates before submitting. Do not present unrun tests or benchmarks as passing.

## Week 1 — MERN foundation, React Flow and MongoDB Time-Series

**Objective:** Establish the IoT telemetry platform and a graph-based rule editor.

**Implementation:** The Express API in `server/src/index.js` provides telemetry ingestion, recent readings, flow retrieval/deployment, alerts and simulator endpoints. `server/src/telemetry.js` validates numeric values, sensor IDs and timestamps, including batch requests. `server/src/db.js` creates indexes and uses `server/src/time-series.js` to check the collection's native time-series type and field configuration. `client/src/main.jsx` implements a four-type React Flow node canvas (source, average, threshold, alert), editable nodes, connection handles and live telemetry visualization.

**Engineering issue and resolution:** An existing regular MongoDB collection called `telemetry` could previously pass startup checks and invalidate the time-series demonstration. Added explicit schema checks and connection cleanup on failure. Seven focused schema tests were reported passing locally on 17 November; no live MongoDB instance has yet been used to verify the integration.

**Evidence to collect:** Screenshot of the running React Flow editor, a successful `GET /api/health`, the `mongosh` result of `db.getCollectionInfos({name:'telemetry'})`, and a screenshot of real telemetry stored in MongoDB. Record exact environment and dates.

**Outcome:** Implementation committed to GitHub; deployment and screenshots remain unverified.

## Week 2 — JSON graph validation, RxJS rules and benchmarking

**Objective:** Serialize a visual graph into executable streaming rules and measure ingestion throughput.

**Implementation:** `server/src/graph.js` validates graph shape, node parameters, connections, cycles and source-to-alert paths. `server/src/engine.js` compiles validated paths into RxJS sensor filters, moving averages, threshold checks and alert callbacks. `server/src/benchmark-runner.js` supports configurable concurrent HTTP batches, checks insert counts and reports p50/p95/max batch latency plus writes per second.

**Engineering issue and resolution:** Invalid graphs and malformed telemetry can cause unsafe rule deployment. Added stricter graph checks and error isolation in the RxJS engine. The frontend telemetry socket handler was also updated on 17 November to tolerate single-point or array payloads and ignore invalid values.

**Testing and limitations:** Thirteen graph tests were reported passing locally on 15 November. Five benchmark regression tests were reported passing locally on 16 November. Six RxJS tests were added but were **not executed** due to unavailable `rxjs` dependency in the test environment. No real 5,000-writes/sec MongoDB benchmark has been recorded. These test reports are partial, not a complete integration verification.

**Evidence to collect:** Saved JSON from `GET /api/flow`, successful `POST /api/flow` response, a screenshot of a live alert, output from `npm test`, and actual benchmark output with system specifications. Do not invent benchmark numbers.

**Outcome:** Rule compiler and benchmark harness committed; real throughput, end-to-end UI behavior and submission remain unverified.

## Reproducible MID review verification

1. Start MongoDB and the backend with documented environment variables; run `cd server && npm install && npm test`.
2. Check `GET http://localhost:4000/api/health` and `GET http://localhost:4000/api/flow`; save response screenshots.
3. In `mongosh`, run `db.getCollectionInfos({name:'telemetry'})` against the `nexusflow` database; confirm `type: 'timeseries'` and expected field names.
4. Start the frontend, deploy a valid graph, enable the simulator and capture the telemetry/alert UI.
5. With the backend and MongoDB running, execute `cd server && COUNT=20000 BATCH=1000 CONCURRENCY=4 npm run benchmark` on macOS/Linux, or set the corresponding `$env:` variables in PowerShell. Record hardware, duration, throughput, latency and any failures.
6. Upload the two truthful weekly write-ups and supporting screenshots to Infotact. Verify portal acceptance and repository linking manually.

## GitHub activity requirement

As of 22 November 2026, repository history shows commits on **nine distinct India-local calendar days**: November 14–22 inclusive. This is **9/10** distinct GitHub development days, subject to Infotact's independent acceptance. The two weekly write-ups remain drafts; **neither portal submission is verified**. Do not manufacture or backdate commits to fill the requirement.


## Additional technical evidence through 22 November 2026

**Graph deployment safety:** Flow validation now runs before MongoDB persistence. The backend queues concurrent graph deployments within one API process and restores the previously stored graph if RxJS rule activation fails. The API reports invalid graphs as HTTP 400 and persistence/activation errors as HTTP 503. Nine focused mock-based graph-deployment tests passed on Node.js 22.16.0 on 22 November, and their committed Git blob hashes were verified. See [implementation](../server/src/flow-deployment.js) and [tests](../server/test/flow-deployment.test.js).

**Time-series ingestion and benchmark:** Timestamp validation handles timezone-qualified ISO date-times, calendar validity and fractional seconds. Ingestion routes distinguish malformed readings from database failures. The HTTP benchmark has pre/post storage-audit hooks and request deadlines. These are *implemented verification features*, **not measured proof** of 5,000 writes/second or minimal storage overhead.

**Review evidence outstanding:** Run the complete GitHub Actions pipeline, demonstrate live MongoDB Time-Series ingestion, capture real benchmark output with hardware details, and collect a screenshot of successful graph export/import and alert execution. Manual Infotact submission of Week 1 and Week 2 write-ups and proof of portal acceptance remain outstanding.

**Known limitation:** Flow deployments are serialized only within one Node.js process; multiple API replicas need cross-process coordination. A MongoDB rollback failure is logged and may require manually reconciling persisted and in-memory graph state.
