import test from 'node:test';
import assert from 'node:assert/strict';
import {captureStorageAudit,summarizeStorageChange} from '../src/benchmark-storage.js';
const audit=(count,sizeBytes=100,storageBytes=4096,indexBytes=1024)=>({type:'timeseries',collection:'telemetry',count,sizeBytes,storageBytes,indexBytes});
test('captures verified MongoDB time-series metrics',async()=>{
 const value=await captureStorageAudit('http://localhost:4000',async url=>{
  assert.equal(url,'http://localhost:4000/api/telemetry/audit');
  return {ok:true,json:async()=>audit(10)};
 });
 assert.deepEqual(value,{count:10,sizeBytes:100,storageBytes:4096,indexBytes:1024});
});
test('rejects HTTP errors and invalid audit metrics',async()=>{
 await assert.rejects(captureStorageAudit('http://localhost',async()=>({ok:false,status:503})),/503/);
 await assert.rejects(captureStorageAudit('http://localhost',async()=>({ok:true,json:async()=>({...audit(10),storageBytes:-1})})),/storageBytes/);
 await assert.rejects(captureStorageAudit('http://localhost',async()=>({ok:true,json:async()=>({...audit(10),type:'collection'})})),/time-series/);
});
test('summarizes measured deltas and allows concurrent external writes',()=>{
 const result=summarizeStorageChange(audit(100),audit(115,900,8192,2048),10);
 assert.equal(result.deltaCount,15);
 assert.equal(result.logicalBytesDelta,800);
 assert.equal(result.allocatedBytesDelta,4096);
 assert.equal(result.indexBytesDelta,1024);
});
test('rejects inconsistent insert counts and invalid insert arguments',()=>{
 assert.throws(()=>summarizeStorageChange(audit(100),audit(105),10),/smaller/);
 assert.throws(()=>summarizeStorageChange(audit(100),audit(105),0),/Invalid benchmark/);
});
