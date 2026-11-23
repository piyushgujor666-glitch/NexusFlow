import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecentTelemetryHandler } from '../src/recent-telemetry.js';

function response() {
  return {
    statusCode: 200, body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('defaults to turbine-1 and returns oldest to newest within latest 100', async () => {
  const calls = [];
  const collection = { find(filter) {
    calls.push(['find', filter]);
    return { sort(order) {
      calls.push(['sort', order]);
      return { limit(n) {
        calls.push(['limit', n]);
        return { async toArray() { return [{ timestamp: 3 }, { timestamp: 2 }]; } };
      } };
    } };
  } };
  const res = response();
  await createRecentTelemetryHandler({ collection })({ query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, [{ timestamp: 2 }, { timestamp: 3 }]);
  assert.deepEqual(calls, [
    ['find', { 'metadata.sensor': 'turbine-1' }],
    ['sort', { timestamp: -1 }],
    ['limit', 100]
  ]);
});

test('rejects invalid sensor before accessing MongoDB', async () => {
  let queried = false;
  const handler = createRecentTelemetryHandler({ collection: { find() { queried = true; } } });
  const res = response();
  await handler({ query: { sensor: '$where' } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(queried, false);
});

test('reports database outages as 503 rather than invalid requests', async () => {
  const logged = [];
  const handler = createRecentTelemetryHandler({
    collection: { find() { throw Error('database offline'); } },
    logger: { error(...args) { logged.push(args); } }
  });
  const res = response();
  await handler({ query: { sensor: 'valid-1' } }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: 'Telemetry storage unavailable' });
  assert.equal(logged.length, 1);
});

test('handles asynchronous MongoDB cursor failures', async () => {
  const handler = createRecentTelemetryHandler({
    collection: { find() { return { sort() { return { limit() { return {
      async toArray() { throw Error('cursor timeout'); }
    }; } }; } }; } },
    logger: { error() {} }
  });
  const res = response();
  await handler({ query: {} }, res);
  assert.equal(res.statusCode, 503);
});
