/**
 * Serialized flow deployment for a single API process.
 * The engine keeps its previous subscriptions on a rejected deploy; if a
 * validated graph cannot be activated, restore the previously saved graph.
 * Multi-process coordination requires a separate distributed lock/version.
 */
export function createFlowHandlers({ validateGraph, flows, engine, io, getGraph, setGraph, logger = console }) {
  if (typeof validateGraph !== 'function' || typeof getGraph !== 'function' ||
      typeof setGraph !== 'function' || typeof flows?.updateOne !== 'function' ||
      typeof engine?.deploy !== 'function' || typeof io?.emit !== 'function') {
    throw new TypeError('Flow handler dependencies are missing');
  }

  let queue = Promise.resolve();
  const save = (req, res) => {
    const job = queue.then(async () => {
      const next = req.body?.graph;
      let stats;
      try { stats = validateGraph(next); }
      catch (error) { return res.status(400).json({ error: error.message }); }

      const previous = getGraph();
      try {
        await flows.updateOne(
          { name: 'active' },
          { $set: { graph: next, updatedAt: new Date() } },
          { upsert: true }
        );
      } catch (error) {
        logger.error('Flow persistence failed:', error);
        return res.status(503).json({ error: 'Unable to save flow' });
      }

      try { engine.deploy(next); }
      catch (error) {
        logger.error('Flow activation failed:', error);
        try {
          await flows.updateOne(
            { name: 'active' },
            { $set: { graph: previous, updatedAt: new Date() } },
            { upsert: true }
          );
        } catch (rollbackError) {
          logger.error('Flow rollback failed; inspect persisted graph manually:', rollbackError);
        }
        return res.status(503).json({ error: 'Unable to activate flow; check server logs' });
      }

      setGraph(next);
      try { io.emit('flow:updated', stats); }
      catch (error) { logger.error('Flow notification failed:', error); }
      return res.json({
        ok: true,
        nodeCount: stats.nodeCount,
        edgeCount: stats.edgeCount,
        pathCount: stats.paths.length
      });
    });
    // Keep subsequent saves runnable even if a previous request fails.
    queue = job.catch(error => logger.error('Unexpected flow save error:', error));
    return job;
  };

  return {
    get: (_req, res) => res.json({ graph: getGraph() }),
    save
  };
}
