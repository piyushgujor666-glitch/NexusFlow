# NexusFlow — Infotact MID Review

NexusFlow is an Advanced MERN Stack Engineering prototype for visual IoT telemetry and rule evaluation. It uses React Flow for no-code graphs, Node/Express for ingestion, MongoDB native Time-Series storage, RxJS for rule streams, and Socket.IO for live updates.

## What is implemented

- React Flow source, moving average, threshold, and alert nodes
- JSON import/export with client-side validation and backend graph validation
- Time-Series collection verification at startup and telemetry normalization
- Batch and individual ingestion APIs, real-time alerts, and sensor simulation
- Storage-audit endpoint reporting MongoDB collection metrics
- Concurrent HTTP ingestion benchmark (no throughput result is claimed without running it)
- Automated unit tests; GitHub Actions CI configuration

## Prerequisites

- Node.js 22
- MongoDB server with native Time-Series support (MongoDB 6+ recommended)
- npm and two terminal windows
- Default ports: API 4000, Vite UI 5173

## Run

1. Start MongoDB locally or prepare a MongoDB connection URI.
2. Start the API:

   ```bash
   cd server
   cp .env.example .env
   npm install
   npm test
   npm run dev
   ```

3. In a separate terminal, start the frontend:

   ```bash
   cd client
   npm install
   npm test
   npm run build
   npm run dev
   ```

4. Open http://localhost:5173 and try the graph editor. Deploy a valid rule, start the simulator, and inspect live readings and alerts.

On Windows PowerShell, replace `cp` with `Copy-Item`.

## Verify the MID-review requirements

- MongoDB Time-Series configuration: `db.getCollectionInfos({name:'telemetry'})` in `mongosh`
- API health: `GET http://localhost:4000/api/health`
- Saved graph: `GET http://localhost:4000/api/flow`
- Telemetry storage audit: `GET http://localhost:4000/api/telemetry/audit`
- Frontend graph JSON serialization: use **Export JSON**, **Import JSON**, then **Deploy graph**
- Real ingestion benchmark: after API and MongoDB are running, execute `cd server && npm run benchmark`. Environment variables `COUNT`, `BATCH`, and `CONCURRENCY` tune the workload. Record observed writes/sec, not the 5,000 writes/sec target as if already achieved.

The project's `.github/workflows/ci.yml` defines backend tests, frontend tests and a Vite production build for GitHub Actions. A committed workflow does **not** itself prove a passing run; review the [Actions tab](https://github.com/piyushgujor666-glitch/NexusFlow/actions).

## Review progress

See [the daily development log](docs/DAILY_PROGRESS.md), [MID-review checklist](docs/INFOTACT_CHECKLIST.md) and [weekly write-up drafts](docs/WEEKLY_WRITEUPS.md). MID-review requirements include genuine commits on 10 different dates, 2 weekly write-up submissions, JSON graph serialization and evidence of 5,000 telemetry writes/sec with storage metrics.

**Unverified:** Production deployment, a live MongoDB throughput measurement, Infotact portal sync, and weekly write-up submissions. Do not claim those as completed before collecting evidence.
