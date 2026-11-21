import test from 'node:test';
import assert from 'node:assert/strict';
import { createIngestionHandlers } from '../src/ingestion.js';

function setup({ failDatabase = false, throwRule = false, throwBroadcast = false } = {}) {
  const writes = [], evaluated = [], emitted = [], errors = [];
  const collection = {
    async insertOne(point) { if (failDatabase) throw Error('DB unavailable'); writes.push([point]); },
    async insertMany(points, options) { if (failDatabase) throw Error('DB unavailable'); assert.deepEqual(options, {ordered:false}); writes.push(points); }
  };
  const deps = {
    normalizeReading(raw) {
      if (typeof raw?.value !== 'number' || typeof raw.sensor !== 'string') throw Error('Invalid reading');
      return {metadata:{sensor:raw.sensor},value:raw.value,timestamp:new Date('2026-11-21T00:00:00Z')};
    },
    normalizeBatch(raw) {
      if (!Array.isArray(raw) || raw.length === 0 || raw.length > 5000) throw Error('Invalid batch');
      return raw.map(r => deps.normalizeReading(r));
    },
    collection,
    engine: { ingest(p) { evaluated.push(p); if (throwRule) throw Error('Rule failure'); } },
    io: { emit(name, value) { if (throwBroadcast) throw Error('Socket disconnected'); emitted.push({name,value}); } },
    logger: { error(...args) { errors.push(args); } }
  };
  function response() {return {statusCode:200, status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};}
  return { handlers:createIngestionHandlers(deps), writes,evaluated,emitted,errors,response };
}

test('valid single reading writes before triggering rules and WebSocket',async()=>{
 const s=setup(),res=s.response();
 await s.handlers.single({body:{sensor:'turbine-1',value:80}},res);
 assert.equal(res.statusCode,201);assert.deepEqual(res.body,{ok:true});
 assert.equal(s.writes.length,1);assert.equal(s.evaluated.length,1);
 assert.equal(s.emitted[0].name,'telemetry');assert.equal(s.emitted[0].value.value,80);
});
test('bad single reading is a 400 and makes no writes',async()=>{
 const s=setup(),res=s.response();await s.handlers.single({body:{sensor:'a',value:'80'}},res);
 assert.equal(res.statusCode,400);assert.deepEqual([s.writes.length,s.evaluated.length,s.emitted.length],[0,0,0]);
});
test('valid batch processes all readings but caps WebSocket payload at 70',async()=>{
 const s=setup(),res=s.response();const readings=Array.from({length:500},(_,i)=>({sensor:'a',value:i}));
 await s.handlers.batch({body:{readings}},res);
 assert.equal(res.statusCode,201);assert.equal(res.body.inserted,500);assert.equal(s.writes[0].length,500);
 assert.equal(s.evaluated.length,500);assert.equal(s.emitted[0].value.length,70);
 assert.equal(s.emitted[0].value[0].value,430);assert.equal(s.emitted[0].value.at(-1).value,499);
});
test('invalid batch rejected before attempting persistence',async()=>{
 const s=setup(),res=s.response();await s.handlers.batch({body:{readings:[{sensor:'ok',value:1},{sensor:'bad',value:'oops'}]}},res);
 assert.equal(res.statusCode,400);assert.equal(s.writes.length,0);assert.equal(s.emitted.length,0);
});
test('storage failures are 503, not 400; no false alert or broadcast',async()=>{
 const s=setup({failDatabase:true}),a=s.response(),b=s.response();
 await s.handlers.single({body:{sensor:'a',value:2}},a);
 await s.handlers.batch({body:{readings:[{sensor:'a',value:2}]}},b);
 assert.equal(a.statusCode,503);assert.equal(b.statusCode,503);
 assert.equal(s.evaluated.length,0);assert.equal(s.emitted.length,0);assert.equal(s.errors.length,2);
});
test('rule and socket failures do not turn a successful write into HTTP failure',async()=>{
 const s=setup({throwRule:true,throwBroadcast:true}),res=s.response();
 await s.handlers.single({body:{sensor:'a',value:3}},res);
 assert.equal(res.statusCode,201);assert.equal(s.writes.length,1);assert.equal(s.errors.length,2);
});
test('missing dependencies are reported on startup',()=>{
 assert.throws(()=>createIngestionHandlers({}),/dependencies/);
});
