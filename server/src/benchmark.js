// Measure real end-to-end HTTP writes; target is not guaranteed.
const base=process.env.API_URL||'http://localhost:4000',total=Number(process.env.COUNT||20000),batch=Math.max(1,Math.min(5000,Number(process.env.BATCH||1000)));
if(!Number.isInteger(total)||total<1||total>1000000)throw Error('Invalid COUNT');
const start=performance.now();let inserted=0;
for(let offset=0;offset<total;offset+=batch){
 const readings=Array.from({length:Math.min(batch,total-offset)},(_,i)=>({sensor:'benchmark-1',value:(i+offset)%100}));
 const response=await fetch(base+'/api/telemetry/batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({readings})});
 const body=await response.json();if(!response.ok)throw Error(JSON.stringify(body));inserted+=body.inserted;
}
const seconds=(performance.now()-start)/1000;
console.log(JSON.stringify({inserted,seconds:+seconds.toFixed(3),writesPerSecond:Math.round(inserted/seconds),target:5000,passed:inserted/seconds>=5000},null,2));
