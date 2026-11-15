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
