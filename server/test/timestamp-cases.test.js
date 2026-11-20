import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReading, normalizeBatch } from '../src/telemetry.js';

const reading = timestamp => normalizeReading({sensor:'turbine-1',value:80,timestamp});
test('accepts UTC fractional milliseconds and numeric offsets', () => {
 assert.equal(reading('2026-11-20T08:00:00.125Z').timestamp.toISOString(),'2026-11-20T08:00:00.125Z');
 assert.equal(reading('2026-11-20T13:30:00+05:30').timestamp.toISOString(),'2026-11-20T08:00:00.000Z');
});
test('accepts valid leap day', () => {
 assert.equal(reading('2024-02-29T23:30:00Z').timestamp.toISOString(),'2024-02-29T23:30:00.000Z');
});
test('rejects impossible calendar days and times', () => {
 for (const timestamp of ['2025-02-29T10:00:00Z','2026-02-30T10:00:00Z','2026-04-31T10:00:00Z','2026-11-20T24:00:00Z','2026-11-20T10:60:00Z','2026-11-20T10:00:60Z','2026-11-20T10:00:00+25:00']) {
  assert.throws(()=>reading(timestamp),/Invalid timestamp/,timestamp);
 }
});
test('rejects malformed fractional seconds or missing timezone',()=>{
 for(const timestamp of ['2026-11-20T08:00:00.1234Z','2026-11-20T08:00:00.12','2026-11-20T08:00:00\\123Z']){
  assert.throws(()=>reading(timestamp),/ISO 8601/,timestamp);
 }
});
test('normalizes full batches and rejects bad readings',()=>{
 assert.equal(normalizeBatch([{sensor:'a',value:1},{sensor:'b',value:2}]).length,2);
 assert.throws(()=>normalizeBatch([{sensor:'ok',value:1},{sensor:'bad space',value:2}]),/sensor ID/);
});
