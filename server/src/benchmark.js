import { benchmarkOptions, runBenchmark } from './benchmark-runner.js';

try {
 const options=benchmarkOptions();
 console.log('Measuring actual HTTP ingestion; MongoDB and API must be running.');
 console.log('Workload: '+options.total+' readings, batch '+options.batch+', concurrency '+options.concurrency);
 const report=await runBenchmark(options);
 console.log(JSON.stringify(report,null,2));
 if(!report.targetMet) process.exitCode=2;
} catch(error) {
 console.error('Benchmark failed: '+error.message);
 process.exitCode=1;
}
