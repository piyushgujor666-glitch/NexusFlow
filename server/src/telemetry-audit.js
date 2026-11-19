/**
 * Collect measured storage evidence for the Infotact MID review.
 * Results are from MongoDB's current collStats response, never estimates.
 */
export async function getTelemetryAudit(db) {
  const existing = await db.listCollections({ name: 'telemetry' }).toArray();
  const collection = existing.find(item => item.name === 'telemetry');
  if (!collection || collection.type !== 'timeseries' ||
      collection.options?.timeseries?.timeField !== 'timestamp' ||
      collection.options?.timeseries?.metaField !== 'metadata') {
    throw new Error('Expected a verified native MongoDB time-series telemetry collection');
  }
  const stats = await db.command({ collStats: 'telemetry', scale: 1 });
  const count = stats.count;
  const sizeBytes = stats.size;
  const storageBytes = stats.storageSize;
  const indexBytes = stats.totalIndexSize;
  for (const [key, value] of Object.entries({ count, sizeBytes, storageBytes, indexBytes })) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error('MongoDB collStats is missing a valid ' + key + ' measurement');
    }
  }
  return {
    collection: 'telemetry', type: 'timeseries',
    timeField: 'timestamp', metaField: 'metadata',
    count, sizeBytes, storageBytes, indexBytes,
    // Storage footprint includes collection allocation, not necessarily physical disk consumption.
    allocatedBytesPerReading: count === 0 ? null : +(storageBytes / count).toFixed(2),
    measuredAt: new Date().toISOString(),
    note: 'MongoDB collStats allocation figures; not a measured writes/sec benchmark.'
  };
}
