import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureTelemetryCollection } from '../src/time-series.js';

const configured = () => ({name:'telemetry',type:'timeseries',options:{timeseries:{timeField:'timestamp',metaField:'metadata',granularity:'seconds'}}});
function mockDatabase(initial = [], createError = null) {
  let collections = [...initial], creations = [];
  return {
    creations,
    listCollections: () => ({ toArray: async () => [...collections] }),
    createCollection: async (name, options) => {
      creations.push({name,options});
      if (createError) throw createError;
      collections = [configured()];
    }
  };
}
test('creates a native time-series collection with expected options',async()=>{
  const db=mockDatabase();
  assert.deepEqual(await ensureTelemetryCollection(db),{name:'telemetry',type:'timeseries',timeField:'timestamp',metaField:'metadata'});
  assert.deepEqual(db.creations[0],{name:'telemetry',options:{timeseries:{timeField:'timestamp',metaField:'metadata',granularity:'seconds'}}});
});
test('accepts and does not recreate a correct existing collection',async()=>{
  const db=mockDatabase([configured()]);
  await ensureTelemetryCollection(db);
  assert.equal(db.creations.length,0);
});
test('rejects a regular MongoDB collection',async()=>{
  await assert.rejects(ensureTelemetryCollection(mockDatabase([{name:'telemetry',type:'collection',options:{}}])),/native MongoDB time-series/);
});
test('rejects an existing collection with the wrong metadata field',async()=>{
  const wrong=configured();wrong.options.timeseries.metaField='other';
  await assert.rejects(ensureTelemetryCollection(mockDatabase([wrong])),/timestamp and metadata/);
});
test('does not mask ordinary creation errors',async()=>{
  await assert.rejects(ensureTelemetryCollection(mockDatabase([],Object.assign(new Error('Unauthorized'),{code:13}))),/Unauthorized/);
});
test('checks the winner after a namespace creation race',async()=>{
  let calls=0;
  const db={listCollections:()=>({toArray:async()=>++calls===1?[]:[configured()]}),createCollection:async()=>{throw Object.assign(new Error('exists'),{code:48})}};
  assert.equal((await ensureTelemetryCollection(db)).type,'timeseries');
});
test('fails when a namespace race creates an ordinary collection',async()=>{
  let calls=0;
  const db={listCollections:()=>({toArray:async()=>++calls===1?[]:[{name:'telemetry',type:'collection',options:{}}]}),createCollection:async()=>{throw Object.assign(new Error('exists'),{code:48})}};
  await assert.rejects(ensureTelemetryCollection(db),/native MongoDB time-series/);
});
