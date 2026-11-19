import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReading, normalizeBatch } from '../src/telemetry.js';

const clock = () => new Date('2026-11-15T12:00:00.000Z');
test('normalizes a valid reading and supplies a timestamp', () => {
  assert.deepEqual(normalizeReading({ sensor: 'turbine-1', value: 80 }, clock), {
    metadata: { sensor: 'turbine-1' }, value: 80, timestamp: clock()
  });
});
test('preserves a valid ISO timestamp', () => {
  const reading = normalizeReading({ sensor: 'a_1', value: 0, timestamp: '2026-11-15T10:00:00Z' }, clock);
  assert.equal(reading.timestamp.toISOString(), '2026-11-15T10:00:00.000Z');
});
test('rejects invalid sensor IDs', () => {
  for (const sensor of ['', '$where', 'a b', 'x'.repeat(65), 123]) {
    assert.throws(() => normalizeReading({ sensor, value: 2 }, clock), /sensor ID/);
  }
});
test('rejects nonfinite or nonnumeric values', () => {
  for (const value of [NaN, Infinity, -Infinity, '5', null]) {
    assert.throws(() => normalizeReading({ sensor: 'valid', value }, clock), /finite numeric/);
  }
});
test('rejects malformed timestamps', () => {
  for (const timestamp of ['', 'not-a-date', 1234, {}, false]) {
    assert.throws(() => normalizeReading({ sensor: 'valid', value: 1, timestamp }, clock), /timestamp/i);
  }
});
test('rejects missing and oversized batches', () => {
  for (const readings of [null, [], new Array(5001).fill({ sensor: 'ok', value: 1 })]) {
    assert.throws(() => normalizeBatch(readings, clock), /1–5000/);
  }
});
test('validates the entire batch before writing any points', () => {
  assert.throws(() => normalizeBatch([{ sensor: 'ok', value: 1 }, { sensor: 'bad sensor', value: 2 }], clock), /sensor ID/);
});
test('normalizes all readings in a valid batch', () => {
  assert.equal(normalizeBatch([{ sensor: 'a', value: 1 }, { sensor: 'b', value: 2 }], clock).length, 2);
});

test('requires timezone-qualified ISO timestamps to avoid locale-dependent parsing', () => {
 for (const timestamp of ['2026-11-19', '2026-11-19T10:00:00', '11/19/2026', '2026-11-19 10:00:00Z']) {
  assert.throws(() => normalizeReading({sensor:'turbine-1',value:1,timestamp}, clock), /ISO 8601/);
 }
});
test('accepts explicit timezone offsets and fractional seconds', () => {
 const a=normalizeReading({sensor:'turbine-1',value:1,timestamp:'2026-11-19T10:30:00+05:30'},clock);
 assert.equal(a.timestamp.toISOString(),'2026-11-19T05:00:00.000Z');
 const b=normalizeReading({sensor:'turbine-1',value:1,timestamp:'2026-11-19T05:00:00.125Z'},clock);
 assert.equal(b.timestamp.toISOString(),'2026-11-19T05:00:00.125Z');
});
test('rejects impossible calendar timestamps', () => {
 assert.throws(() => normalizeReading({sensor:'turbine-1',value:1,timestamp:'2026-13-19T05:00:00Z'},clock), /Invalid timestamp/);
});
