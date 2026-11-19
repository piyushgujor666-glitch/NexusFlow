import test from 'node:test';
import assert from 'node:assert/strict';
import { getTelemetryAudit } from '../src/telemetry-audit.js';
const meta = { name: 'telemetry', type: 'timeseries', options: { timeseries: { timeField: 'timestamp', metaField: 'metadata' } } };
function fakeDb(collections = [meta], stats = { count: 100, size: 6000, storageSize: 8192, totalIndexSize: 2048 }) {
  return {
    listCollections: () => ({ toArray: async () => collections }),
    command: async request => {
      assert.deepEqual(request, { collStats: 'telemetry', scale: 1 });
      return stats;
    }
  };
}
test('reports observed storage and computes bytes per reading', async () => {
  const report = await getTelemetryAudit(fakeDb());
  assert.equal(report.count, 100);
  assert.equal(report.allocatedBytesPerReading, 81.92);
  assert.equal(report.indexBytes, 2048);
  assert.equal(report.type, 'timeseries');
  assert.match(report.measuredAt, /^\d{4}-\d{2}-\d{2}T/);
});
test('reports null allocation per reading for an empty collection', async () => {
  const stats = { count: 0, size: 0, storageSize: 4096, totalIndexSize: 1024 };
  const result = await getTelemetryAudit(fakeDb([meta], stats));
  assert.equal(result.allocatedBytesPerReading, null);
});
test('rejects normal collections', async () => {
  await assert.rejects(getTelemetryAudit(fakeDb([{ ...meta, type: 'collection' }])), /native MongoDB time-series/);
});
test('rejects invalid time-series configuration', async () => {
  await assert.rejects(getTelemetryAudit(fakeDb([{ ...meta, options: { timeseries: { timeField: 'createdAt', metaField: 'metadata' } } }])), /native MongoDB time-series/);
});
test('rejects missing or corrupt database statistics', async () => {
  await assert.rejects(getTelemetryAudit(fakeDb([meta], { count: 1, size: 100, storageSize: -1, totalIndexSize: 1 })), /valid storageBytes/);
  await assert.rejects(getTelemetryAudit(fakeDb([meta], { count: 1, size: 100, storageSize: 1024 })), /valid indexBytes/);
});
test('propagates MongoDB command errors instead of fabricating metrics', async () => {
  const db = fakeDb();
  db.command = async () => { throw new Error('database unavailable'); };
  await assert.rejects(getTelemetryAudit(db), /database unavailable/);
});
