# Infotact NexusFlow MID review checklist

## Portal (verify these in your Infotact account)
- [ ] Select NexusFlow project (the screenshot showed this completed).
- [ ] Connect GitHub repository `piyushgujor666-glitch/NexusFlow` with branch `main`.
- [ ] Confirm that Infotact's portal recognizes **10 separate GitHub commit dates** and the linked `main` branch.
- [ ] Submit Week 1 and Week 2 actual write-ups.

## Verified GitHub evidence — 23 November 2026 (IST)
- [x] Reviewed 86 repository commits and confirmed activity on **10 distinct IST calendar dates**, November 14 through November 23, 2026. GitHub activity has reached the requested 10-day count, **not** proof of Infotact acceptance.
- [x] Verified today's [recent-telemetry handler](../server/src/recent-telemetry.js) and [nine test cases](../server/test/recent-telemetry.test.js) + [input regression tests](../server/test/recent-telemetry-inputs.test.js): 9 passed locally using Node.js 22.16.0 with mock database dependencies.
- [ ] Check the [GitHub Actions run](https://github.com/piyushgujor666-glitch/NexusFlow/actions) for complete backend tests and frontend build. The GitHub connector returned no CI status evidence.
- [ ] Capture a live MongoDB collection configuration, working React Flow UI, successful POST/GET flow, simulator and live alert, and measured throughput output.

## Technical evidence (per project PDF)
- [x] Express ingestion endpoint is implemented in source.
- [x] MongoDB native Time-Series collection setup is implemented in source.
- [x] React Flow graph canvas and node library are implemented in source.
- [x] Saved graph validation/JSON serialization is implemented in source.
- [x] RxJS runtime rule pipelines are implemented in source.
- [x] Automated graph-validation tests included.
- [ ] Run backend with reachable MongoDB and capture screenshot.
- [ ] Run React frontend and capture browser screenshot.
- [ ] Verify deployed graph JSON via `GET /api/flow`.
- [ ] Run `npm run benchmark` to measure actual throughput toward 5,000 writes/sec.
- [ ] Record achieved writes/sec and memory measurements honestly.

## Reproducible steps
1. `cd server && npm install && npm run dev` (MongoDB must be running).
2. `cd client && npm install && npm run dev` in another terminal.
3. Open http://localhost:5173 and click Deploy graph, Start simulator.
4. Run `cd server && npm test`.
5. Run `cd server && npm run benchmark`; save the measured output.
6. Complete the two write-ups based on observed work, then manually submit them in Infotact.

Automatic submission is **not** implemented or verified. The portal controls its own eligibility status.
