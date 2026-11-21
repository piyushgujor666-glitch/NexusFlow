/**
 * HTTP telemetry handlers with explicit validation/storage error boundaries.
 * Persist first; only committed readings are sent through rules and sockets.
 * A failed MongoDB bulkWrite may still be partially applied by MongoDB;
 * callers must not blindly retry without an idempotency scheme.
 */
export function createIngestionHandlers({ normalizeReading, normalizeBatch, collection, engine, io, logger = console }) {
  if (![normalizeReading, normalizeBatch].every(fn => typeof fn === 'function') ||
      !collection || !engine || !io) {
    throw new TypeError('Telemetry handler dependencies are missing');
  }

  async function persist(points, batch, res) {
    try {
      if (batch) await collection.insertMany(points, { ordered: false });
      else await collection.insertOne(points[0]);
    } catch (error) {
      logger.error('Telemetry persistence failed:', error);
      return res.status(503).json({ error: 'Telemetry storage unavailable or write failed' });
    }

    for (const point of points) {
      try { engine.ingest(point); }
      catch (error) { logger.error('Telemetry rule evaluation failed:', error); }
    }
    try {
      // The live dashboard only needs a short, recent window per batch.
      io.emit('telemetry', batch ? points.slice(-70) : points[0]);
    } catch (error) {
      logger.error('Telemetry broadcast failed:', error);
    }
    return res.status(201).json(batch ? { ok: true, inserted: points.length } : { ok: true });
  }

  async function single(req, res) {
    let point;
    try { point = normalizeReading(req.body); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    return persist([point], false, res);
  }

  async function batch(req, res) {
    let points;
    try { points = normalizeBatch(req.body?.readings); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    return persist(points, true, res);
  }

  return { single, batch };
}
