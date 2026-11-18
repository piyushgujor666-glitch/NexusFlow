# NexusFlow daily development log

This document records verified repository work and remaining MID-review evidence. Commit day eligibility is determined by Infotact, not by this file.

## Day 1 — 14 November 2026 (IST)
- Created the initial full-stack scaffold in GitHub.
- Added MongoDB Time-Series initialization, Express ingestion API, RxJS rule engine, React Flow graph editor, live Socket.IO telemetry, benchmark script, and review documentation.
- GitHub commits were made on this date. Frontend build and real MongoDB benchmark were not verified.

## Day 2 — 15 November 2026 (IST)
- Hardened `server/src/graph.js` to validate graph IDs, sensor IDs, strict numeric parameters, duplicate connections, disconnected sensors, dead-end processors, cycles, and source-to-alert paths.
- Expanded `server/test/graph.test.js` to 13 automated cases, including multi-alert fan-out and JSON serialization.
- Ran `npm test` with Node.js 22 locally: **13 tests passed, 0 failed**.
- GitHub commits:
  - [Rule compiler validation](https://github.com/piyushgujor666-glitch/NexusFlow/commit/e8c1ec86151a5322ede8958dfe6c08f8da6ef385)
  - [Regression tests](https://github.com/piyushgujor666-glitch/NexusFlow/commit/472405125ae11368b210ade2ba34a4af3beb5bb9)

## MID-review requirements still pending
1. Connect the `NexusFlow` repository and `main` branch in the Infotact portal and verify that it counts activity.
2. Submit Week 1 and Week 2 write-ups with actual screenshots and observations.
3. Collect real MongoDB time-series and telemetry ingestion screenshots.
4. Run and record the requested 5,000 writes/sec ingestion audit; no result has been claimed yet.
5. Complete the remaining distinct days of meaningful GitHub development.

Run the graph tests with `cd server && npm install && npm test`.

### Additional work — 15 November 2026, evening
- Extracted `normalizeReading` and `normalizeBatch` into `server/src/telemetry.js` for consistent input validation.
- Updated API and simulator to use shared normalization; batch input is validated in full before database insertion is attempted.
- Added eight new telemetry unit test cases, including malformed sensor IDs, invalid timestamps, non-finite values and batch limits.
- Verified all three updated files are present in the GitHub `main` branch. **The eight new tests have not yet been executed against a local checkout**; run `cd server && npm test` before claiming they pass.
- Commits: [validation module](https://github.com/piyushgujor666-glitch/NexusFlow/commit/1885c6908177e92c5374d5693c1ad7df0778d2cc), [API integration](https://github.com/piyushgujor666-glitch/NexusFlow/commit/b485f98a16f2c43e155ea981d726562d22d36136), [regression tests](https://github.com/piyushgujor666-glitch/NexusFlow/commit/978882c5128324598e1f8b860e1e17c2157232b0).
- These changes were made on the already-counted 15 November development day; they do **not** add a third distinct commit day.


## Day 3 — 16 November 2026 (IST)
- Reworked ingestion benchmarking to exercise the real Express HTTP endpoint through configurable concurrent clients.
- Added input bounds for COUNT (up to 1,000,000), BATCH (up to 5,000), and CONCURRENCY (up to 32), plus API health checking and insert-count verification.
- Added benchmark results for wall-clock writes/sec and batch latency p50, p95, and maximum. Nonpassing throughput sets a nonzero exit code to avoid presenting a missed target as success.
- Added five automated benchmark regression tests and ran the equivalent tests locally using Node.js 22: **5 passed, 0 failed**. A full repository integration test run was not performed.
- Real MongoDB throughput: **not measured**; 5,000 writes/sec target remains unverified.
- Example measured workload (run with MongoDB and API started): `cd server && CONCURRENCY=4 BATCH=1000 COUNT=20000 npm run benchmark` (PowerShell: `$env:CONCURRENCY=4; $env:BATCH=1000; $env:COUNT=20000; npm run benchmark`).
- Commits: [concurrent benchmark runner](https://github.com/piyushgujor666-glitch/NexusFlow/commit/f538d4bea21c893cfe67849796b1237b302858ef), [CLI integration](https://github.com/piyushgujor666-glitch/NexusFlow/commit/b065f84157175e8b943f71ff07c7cd8210195121), [benchmark regression tests](https://github.com/piyushgujor666-glitch/NexusFlow/commit/3158f5c9fde0014941298b5459f55d31c418af22).
- Portal tracking and the two weekly write-up submissions must still be confirmed by the user in Infotact.


### Additional Day 3 work — 16 November 2026, evening (IST)
- Hardened the RxJS rule compiler against malformed stream points, synchronous and asynchronous alert callback failures, and repeated shutdown calls.
- Rejected deployment after closure and preserved existing active subscriptions when graph validation fails.
- Added six focused RxJS engine tests for moving averages, sensor filtering, redeployment, failure isolation, and lifecycle handling.
- **Verification:** committed files were read back from GitHub. The RxJS tests were **not executed** because the isolated test environment lacked the `rxjs` dependency and its installation timed out. Run `cd server && npm ci` (or `npm install` if no lockfile) followed by `npm test` in an environment with package access.
- Commits: [engine reliability](https://github.com/piyushgujor666-glitch/NexusFlow/commit/f86eb5fdb50f662ca492fb56ace2062d488114d3), [engine regression tests](https://github.com/piyushgujor666-glitch/NexusFlow/commit/ac78428657a75450cf7a487f2e870087dd681c8d).
- All changes remain on the already-counted 16 November development day; distinct GitHub commit days remain **3 of 10**. Infotact portal synchronization and weekly write-up submissions remain unverified.


## Day 4 — 17 November 2026 (IST)
- Added `server/src/time-series.js` to validate native MongoDB time-series configuration, not merely a matching collection name.
- Updated `server/src/db.js` to reject incompatible `telemetry` collections on startup and close MongoDB connections when initialization fails.
- Handled the MongoDB namespace-exists race by re-reading and verifying the resulting collection.
- Added seven focused tests in `server/test/time-series.test.js` covering creation, reuse, wrong collection type, wrong metadata field, creation errors and concurrent creation races.
- **Verification:** the focused tests were run against the new local source with Node.js: **7 passed, 0 failed**. The full backend test suite and live MongoDB integration were not run.
- **Still pending:** actual MongoDB time-series screenshot, 5,000 writes/sec ingestion audit, and two real Infotact weekly write-up submissions. Portal syncing has not been verified.
- Commits: [time-series verification](https://github.com/piyushgujor666-glitch/NexusFlow/commit/dcdcd7534835b58215ea6f992f585c4e64293dee), [database startup safeguard](https://github.com/piyushgujor666-glitch/NexusFlow/commit/e53ee6be797769bb5ca982fd3ef0715eb98880d6), [test coverage](https://github.com/piyushgujor666-glitch/NexusFlow/commit/c33930a469614b63a01ebbaf9063c74dc2eb6319).
- Verify MongoDB locally by starting it, running the backend, then executing `db.getCollectionInfos({name:'telemetry'})` in `mongosh`.


### Additional Day 4 work — 17 November 2026, evening (IST)
- Updated the React frontend telemetry socket handler to support both individual and array event payloads, filter non-finite readings and retain the latest 70 samples. The initial recent-readings API response is now checked before updating chart state.
- Expanded `docs/WEEKLY_WRITEUPS.md` into two evidence-aware draft summaries, with concrete implemented modules, known limitations, reproducible verification steps and explicit unverified submission status.
- **Verification:** the changed frontend and documentation files were read back from GitHub after commit. A production frontend build and live Socket.IO integration were **not executed**, so runtime UI correctness remains unverified.
- Commits: [telemetry UI payload handling](https://github.com/piyushgujor666-glitch/NexusFlow/commit/5af5ec7cc3cdfe4168c444a22c4fa6cd22099dd6), [weekly write-up drafts](https://github.com/piyushgujor666-glitch/NexusFlow/commit/6952b6e90f1fa9b5f83d1abbf5929ca239d97663).
- **Distinct GitHub commit days remain 4/10** (November 14–17); no additional day is claimed for this evening's work. Infotact submission, MongoDB throughput and both weekly write-up uploads remain unverified.


## Day 5 — 18 November 2026 (IST)
- Implemented browser graph export as downloadable `nexusflow-graph.json` and import from a local JSON file in the React Flow editor.
- Added `client/src/flow-json.js`: portable JSON with node types, canvas coordinates, configuration and edge relationships; strips temporary React Flow runtime fields and rejects oversized or malformed snapshots.
- Imported graphs are not automatically deployed; the user must explicitly click **Deploy graph**, where backend validation remains authoritative.
- Added nine client-side pure Node serialization regression tests (round-tripping, malformed data, duplicate nodes and edges, unknown nodes and file size), and styled the import control.
- **Verification:** files committed to and re-read from GitHub. Test execution and a production browser build are not yet verified; this environment could not access GitHub via local git to check out the full source. Run `cd client && npm install && node --test test/flow-json.test.js && npm run build` on a connected machine.
- Real MongoDB 5,000 writes/sec throughput, Infotact recognition and both weekly write-up submissions remain unverified.
- Commits: [JSON serialization](https://github.com/piyushgujor666-glitch/NexusFlow/commit/038958ec438fb8f9e4ee5fe15ef152650391bf5b), [editor controls](https://github.com/piyushgujor666-glitch/NexusFlow/commit/1a872dfaf866ada79c7bd55fc6d8325ca001e61f), [nine test cases](https://github.com/piyushgujor666-glitch/NexusFlow/commit/076567a1c0ba20510d8d4cc234a473b77848e1fc), [styling](https://github.com/piyushgujor666-glitch/NexusFlow/commit/70e2f40f3219f4ca9c544cbe80205e626496d14e).

### Additional Day 5 work — 18 November 2026, evening (IST)
- Found a mismatch: the graph exporter could previously generate JSON that the importer rejected (for example duplicate connections, invalid coordinates or oversized snapshots).
- The exporter now runs the same parser validation before offering a download, preventing unusable snapshots.
- Added two regression cases for invalid exports and exposed the client tests through `npm test` in `client/package.json` (11 serialization test cases total).
- **Verification:** GitHub files were updated. Local GitHub checkout remains blocked because `github.com` DNS resolution failed in the runner; the 11 tests and frontend build were **not run**. Execute `cd client && npm install && npm test && npm run build` with network access.
- Commits: [export validation](https://github.com/piyushgujor666-glitch/NexusFlow/commit/611166c4ff44306dd98dc3ac58cbf23423971144), [regression tests](https://github.com/piyushgujor666-glitch/NexusFlow/commit/9f6b6e35166addbaccc0366b2c1f9a01e6c7346f), [test script](https://github.com/piyushgujor666-glitch/NexusFlow/commit/e1640c4aa78778b10de48e722c74e67f07610555).
- Still **5 distinct commit days of 10** (November 14–18); same-day commits do not add a sixth. Week 1 and Week 2 write-ups exist as drafts but neither Infotact submission is verified. No live MongoDB throughput result is available.
