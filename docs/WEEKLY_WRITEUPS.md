# NexusFlow weekly write-ups — working drafts

These drafts are templates. Replace placeholders with truthful work performed and results before submitting them to Infotact.

## Week 1 — MongoDB Time-Series & React Flow Canvas
**Objective:** Build the MERN foundation for IoT telemetry and node-based visual pipelines.

**Work available in repository:** `server/src/db.js` defines a MongoDB time-series collection with timestamp and sensor metadata. `server/src/index.js` implements Express ingestion endpoints. `client/src/main.jsx` defines the React Flow canvas, custom nodes and draggable connections.

**Evidence to add:** [Screenshots of locally running app, GET /api/health, time-series collection confirmation].  
**Issues and resolution:** [Describe genuine setup/bug issues].  
**Testing:** [Record actual local test results].  
**Next step:** Implement and verify the visual graph JSON compiler.

## Week 2 — RxJS Logic Compiler & Visual Node Library
**Objective:** Convert JSON graphs to reactive rules and demonstrate graph serialization.

**Work available in repository:** `server/src/graph.js` validates edges, node types, acyclicity and complete rule paths. `server/src/engine.js` composes RxJS source filters, moving averages, threshold comparisons and alert actions. The frontend has source, average, threshold and alert nodes, plus a graph deploy button.

**Evidence to add:** [Paste serialized graph response; screenshot successful rule deploy; screenshot live alert].  
**Issues and resolution:** [Describe actual problems encountered].  
**Testing:** Four graph validation tests passed in the local source copy on November 14, 2026; rerun against the committed repository before submission.  
**Benchmark:** [Actual reads/sec or writes/sec, date and hardware].  
**Next step:** Achieve and document the MID review benchmark and polish.

## Mid-Review demonstration checklist
- Visual editor with 4 nodes and 3 edges
- Saved graph JSON verified from API
- MongoDB Time-Series verified via `db.getCollectionInfos({name:'telemetry'})`
- Real measured ingestion throughput vs target 5,000 writes/sec
- Two verified weekly write-ups and genuine GitHub day-by-day commit record
