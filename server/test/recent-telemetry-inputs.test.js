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
function stubCollection() {
  const queries = [];
  const collection = { find(query) {
    queries.push(query);
    return { sort() { return { limit() { return { toArray: async () => [] }; } }; } };
  } };
  return { collection, queries };
}

test('missing sensor parameter uses the documented default', async () => {
  const s = stubCollection(), res = response();
  await createRecentTelemetryHandler({collection: s.collection})({query: {}}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(s.queries, [{'metadata.sensor':'turbine-1'}]);
});
test('valid supplied sensor is used as-is', async () => {
  const s = stubCollection(), res = response();
  await createRecentTelemetryHandler({collection: s.collection})({query:{sensor:'pump_2'}}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(s.queries, [{'metadata.sensor':'pump_2'}]);
});
test('repeated and object sensor parameters are rejected, never defaulted', async () => {
  const s = stubCollection();
  const handler = createRecentTelemetryHandler({collection:s.collection});
  for (const sensor of [['pump','turbine-1'], {id:'pump'}, ['pump']]) {
    const res = response();
    await handler({query:{sensor}},res);
    assert.equal(res.statusCode,400);
    assert.deepEqual(res.body,{error:'Invalid sensor'});
  }
  assert.equal(s.queries.length,0);
});
test('null, numeric, empty, and unsafe supplied sensors are rejected', async () => {
  const s=stubCollection(); const handler=createRecentTelemetryHandler({collection:s.collection});
  for(const sensor of [null,0,'','$where','bad sensor','x'.repeat(65)]) {
    const res=response(); await handler({query:{sensor}},res);
    assert.equal(res.statusCode,400);
  }
  assert.equal(s.queries.length,0);
});
test('missing req.query does not crash and still defaults correctly', async () => {
  const s=stubCollection(),res=response();
  await createRecentTelemetryHandler({collection:s.collection})({},res);
  assert.equal(res.statusCode,200);
  assert.deepEqual(s.queries,[{'metadata.sensor':'turbine-1'}]);
});
