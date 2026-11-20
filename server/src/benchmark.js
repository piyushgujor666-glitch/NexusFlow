import { benchmarkOptions, runBenchmark } from './benchmark-runner.js';
import { captureStorageAudit, summarizeStorageChange } from './benchmark-storage.js';

try {
 const options=benchmarkOptions();
 console.log('Measuring actual HTTP ingestion; MongoDB and API must be running.');
 console.log('Workload: '+options.total+' readings, batch '+options.batch+', concurrency '+options.concurrency);
 // Fail before inserting anything if the evidence endpoint is unavailable.
 const before=await captureStorageAudit(options.base);
 const report=await runBenchmark(options);
 const after=await captureStorageAudit(options.base);
 const storage=summarizeStorageChange(before,after,report.inserted);
 console.log(JSON.stringify({benchmark:report,storage},null,2));
 if(!report.targetMet) process.exitCode=2;
} catch(error) {
 console.error('Benchmark failed or storage evidence incomplete: '+error.message);
 process.exitCode=1;
}
