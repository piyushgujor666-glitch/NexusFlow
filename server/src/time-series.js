/** Verify the MongoDB telemetry collection uses native time-series storage. */
export async function ensureTelemetryCollection(db) {
  const collections = await db.listCollections({ name: 'telemetry' }).toArray();
  if (collections.length > 1) throw new Error('Unexpected duplicate telemetry collections');
  if (collections.length === 0) {
    try {
      await db.createCollection('telemetry', {
        timeseries: { timeField: 'timestamp', metaField: 'metadata', granularity: 'seconds' }
      });
    } catch (error) {
      // Only treat a namespace collision as a concurrent-creation race.
      if (error?.code !== 48 && error?.codeName !== 'NamespaceExists') throw error;
    }
  }
  const current = await db.listCollections({ name: 'telemetry' }).toArray();
  const telemetry = current.find(collection => collection.name === 'telemetry');
  if (!telemetry || telemetry.type !== 'timeseries' ||
      telemetry.options?.timeseries?.timeField !== 'timestamp' ||
      telemetry.options?.timeseries?.metaField !== 'metadata') {
    throw new Error('telemetry must be a native MongoDB time-series collection with timestamp and metadata fields');
  }
  return {
    name: telemetry.name,
    type: telemetry.type,
    timeField: telemetry.options.timeseries.timeField,
    metaField: telemetry.options.timeseries.metaField
  };
}
