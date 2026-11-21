/** Benchmark real HTTP ingestion and report latency percentiles. */
export function benchmarkOptions(env = process.env) {
 const total = Number(env.COUNT ?? 20000), batch = Number(env.BATCH ?? 1000), concurrency = Number(env.CONCURRENCY ?? 4);
 const requestTimeoutMs = Number(env.REQUEST_TIMEOUT_MS ?? 30000);
 for (const [key,value,max] of [['COUNT',total,1000000],['BATCH',batch,5000],['CONCURRENCY',concurrency,32]]) {
  if (!Number.isSafeInteger(value) || value < 1 || value > max) throw Error(key+' must be an integer between 1 and '+max);
 }
 if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs < 1000 || requestTimeoutMs > 300000) throw Error('REQUEST_TIMEOUT_MS must be an integer between 1000 and 300000');
 const url=new URL(env.API_URL ?? 'http://localhost:4000');
 if (!['http:','https:'].includes(url.protocol)) throw Error('API_URL must use HTTP(S)');
 return {total,batch,concurrency,requestTimeoutMs,base:url.toString().replace(/\/$/,'')};
}
export async function runBenchmark({total,batch,concurrency,base,requestTimeoutMs=30000},{request=fetch,clock=()=>performance.now(),timeoutSignal=ms=>AbortSignal.timeout(ms)}={}) {
 const health=await request(base+'/api/health',{signal:timeoutSignal(requestTimeoutMs)});
 if(!health.ok) throw Error('API health check failed: HTTP '+health.status);
 const started=clock();let nextOffset=0,inserted=0,batches=0;const latencies=[];
 const worker=async()=>{
  while(nextOffset<total){
   const offset=nextOffset,count=Math.min(batch,total-offset);nextOffset+=count;
   const readings=Array.from({length:count},(_,i)=>({sensor:'benchmark-1',value:(offset+i)%100}));
   const began=clock();
   const response=await request(base+'/api/telemetry/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({readings}),signal:timeoutSignal(requestTimeoutMs)});
   if(!response.ok)throw Error('Batch at offset '+offset+' failed: HTTP '+response.status);
   const body=await response.json();
   if(body.inserted!==count)throw Error('Batch at offset '+offset+': expected '+count+' inserts, received '+body.inserted);
   latencies.push(clock()-began);inserted+=body.inserted;batches++;
  }
 };
 await Promise.all(Array.from({length:Math.min(concurrency,Math.ceil(total/batch))},worker));
 const seconds=(clock()-started)/1000;
 if(seconds<=0 || inserted!==total)throw Error('Invalid benchmark timing or insert count');
 const ordered=[...latencies].sort((a,b)=>a-b);
 const percentile=p=>ordered[Math.min(ordered.length-1,Math.ceil(ordered.length*p)-1)];
 const rate=inserted/seconds;
 return {inserted,batches,batchSize:batch,concurrency,seconds:+seconds.toFixed(3),writesPerSecond:Math.round(rate),
  latencyMs:{p50:+percentile(.5).toFixed(2),p95:+percentile(.95).toFixed(2),max:+ordered.at(-1).toFixed(2)},
  targetWritesPerSecond:5000,targetMet:rate>=5000};
}
