import test from 'node:test';
import assert from 'node:assert/strict';
import { benchmarkOptions, runBenchmark } from '../src/benchmark-runner.js';

test('rejects invalid benchmark bounds',()=>{
 for(const [key,value] of [['COUNT','0'],['COUNT','3.5'],['BATCH','5001'],['CONCURRENCY','0'],['CONCURRENCY','33']]){
  assert.throws(()=>benchmarkOptions({[key]:value}),new RegExp(key));
 }
});
test('accepts valid options and normalizes URL',()=>{
 assert.deepEqual(benchmarkOptions({COUNT:'11',BATCH:'5',CONCURRENCY:'2',API_URL:'https://example.test/'}),
 {total:11,batch:5,concurrency:2,requestTimeoutMs:30000,base:'https://example.test'});
});
test('handles partial final batch and reports throughput',async()=>{
 const sizes=[];let time=0;
 const request=async(url,init)=>{
  if(url.endsWith('/api/health'))return{ok:true};
  const count=JSON.parse(init.body).readings.length;
  sizes.push(count);time+=10;
  return{ok:true,json:async()=>({inserted:count})};
 };
 const result=await runBenchmark({total:11,batch:5,concurrency:2,base:'http://localhost'},{request,clock:()=>time});
 assert.deepEqual(sizes.sort((a,b)=>a-b),[1,5,5]);
 assert.equal(result.inserted,11);assert.equal(result.batches,3);
 assert.equal(result.targetWritesPerSecond,5000);
 assert.ok(result.latencyMs.p95>=0);
});
test('rejects inaccurate inserted count',async()=>{
 const request=async(url)=>url.endsWith('/api/health')?{ok:true}:{ok:true,json:async()=>({inserted:1})};
 await assert.rejects(()=>runBenchmark({total:3,batch:3,concurrency:1,base:'http://localhost'},{request}),/expected 3 inserts/);
});
test('requires healthy API before starting timing',async()=>{
 await assert.rejects(()=>runBenchmark({total:1,batch:1,concurrency:1,base:'http://localhost'},{request:async()=>({ok:false,status:503})}),/health check failed/);
});

test('rejects unsafe request timeout settings',()=>{
 for (const value of ['0','999','300001','abc','1.5']) {
  assert.throws(()=>benchmarkOptions({REQUEST_TIMEOUT_MS:value}),/REQUEST_TIMEOUT_MS/);
 }
});
test('passes a timeout signal to health and ingestion requests',async()=>{
 const calls=[];let now=0;
 const request=async(url,options)=>{
  calls.push({url,signal:options.signal});
  if(url.endsWith('/api/health'))return {ok:true};
  now+=10;
  return {ok:true,json:async()=>({inserted:2})};
 };
 const result=await runBenchmark({total:2,batch:2,concurrency:1,base:'http://localhost',requestTimeoutMs:2500},{
  request,clock:()=>now,timeoutSignal:ms=>({timeoutMs:ms})
 });
 assert.equal(result.inserted,2);
 assert.equal(calls.length,2);
 assert.deepEqual(calls.map(c=>c.signal),[{timeoutMs:2500},{timeoutMs:2500}]);
});
