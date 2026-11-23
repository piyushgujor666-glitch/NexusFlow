/** Read recent sensor points without disguising database outages as client errors. */
export function createRecentTelemetryHandler({ collection, logger = console }) {
  if (!collection || typeof collection.find !== 'function') throw new TypeError('Telemetry collection is required');
  return async function recent(req, res) {
    const query = req.query ?? {};
    // Absent sensor means the default; malformed supplied values are rejected.
    // Express may parse repeated or bracketed query parameters as arrays/objects.
    const sensor = Object.prototype.hasOwnProperty.call(query, 'sensor') ? query.sensor : 'turbine-1';
    if (typeof sensor !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(sensor)) {
      return res.status(400).json({ error: 'Invalid sensor' });
    }
    try {
      const points = await collection.find({ 'metadata.sensor': sensor })
        .sort({ timestamp: -1 }).limit(100).toArray();
      return res.json(points.reverse());
    } catch (error) {
      logger.error('Recent telemetry query failed:', error);
      return res.status(503).json({ error: 'Telemetry storage unavailable' });
    }
  };
}
