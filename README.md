# NexusFlow — Infotact MID Review

Visual IoT telemetry and rule-engine prototype based on the Infotact Advanced MERN Stack Engineering Project 1 syllabus.

## MID review targets

- Week 1: MongoDB Time-Series collection and Express ingestion endpoint; React Flow canvas.
- Week 2: graph JSON validation and RxJS-based rule compilation; visual source, transform and alert nodes.
- MID review: demonstrate valid graph serialization and measure actual ingestion writes/sec (target: 5,000/sec, **not yet verified**).

## Project structure
- `server/` Express, MongoDB Time-Series and RxJS rule engine.
- `client/` React and React Flow interface.
- `docs/` MID review evidence and write-up checklist.

## Running locally
Requires Node.js 20+ and MongoDB 6+. See the individual package scripts. Backend: `cd server && npm install && npm run dev`. Frontend: `cd client && npm install && npm run dev`.

**Status:** Initial development, not yet deployed. Do not claim Infotact submission, test pass, or throughput target without verification.
