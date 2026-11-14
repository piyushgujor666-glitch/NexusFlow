# Infotact NexusFlow MID review checklist

## Portal (verify these in your Infotact account)
- [ ] Select NexusFlow project (the screenshot showed this completed).
- [ ] Connect GitHub repository `piyushgujor666-glitch/NexusFlow` with branch `main`.
- [ ] Reach 10 **different real commit days**, not simply 10 commits.
- [ ] Submit Week 1 and Week 2 actual write-ups.

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
