/** Capture measured MongoDB collection footprint around an HTTP benchmark. */
export async function captureStorageAudit(base, request = fetch, { requestTimeoutMs = 30000, timeoutSignal = ms => AbortSignal.timeout(ms) } = {}) {
 if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs < 1000 || requestTimeoutMs > 300000) {
  throw new Error('Invalid storage audit request timeout');
 }
 const response = await request(base + '/api/telemetry/audit', { signal: timeoutSignal(requestTimeoutMs) });
 if (!response.ok) throw new Error('Storage audit unavailable: HTTP ' + response.status);
 const audit = await response.json();
 for (const key of ['count', 'sizeBytes', 'storageBytes', 'indexBytes']) {
  if (typeof audit?.[key] !== 'number' || !Number.isFinite(audit[key]) || audit[key] < 0) {
   throw new Error('Storage audit missing valid ' + key);
  }
 }
 if (audit.type !== 'timeseries' || audit.collection !== 'telemetry') {
  throw new Error('Storage audit did not verify telemetry time-series');
 }
 return {count:audit.count,sizeBytes:audit.sizeBytes,storageBytes:audit.storageBytes,indexBytes:audit.indexBytes};
}

export function summarizeStorageChange(before, after, inserted) {
 if (!Number.isSafeInteger(inserted) || inserted < 1) throw new Error('Invalid benchmark insert count');
 const deltaCount = after.count - before.count;
 if (deltaCount < inserted) throw new Error('Storage count delta smaller than acknowledged inserts');
 return {
  before, after, deltaCount,
  logicalBytesDelta:after.sizeBytes-before.sizeBytes,
  allocatedBytesDelta:after.storageBytes-before.storageBytes,
  indexBytesDelta:after.indexBytes-before.indexBytes,
  note:'MongoDB collStats allocation deltas, not physical disk consumption. Concurrent external writes may contribute to these deltas.'
 };
}
