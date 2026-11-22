import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlowHandlers } from '../src/flow-deployment.js';

const graph = id => ({ nodes: [{ id, type: 'source' }, { id: 'alert', type: 'alert' }], edges: [{ source: id, target: 'alert' }] });
function setup({ failWrite = false, failDeploy = false, failRollback = false, failSocket = false } = {}) {
  const calls = [], errors = [];
  let active = graph('initial');
  let persisted = active;
  let writeCount = 0;
  const deps = {
    validateGraph(next) {
      if (!next?.nodes?.length || !next.edges) throw Error('Invalid graph');
      return { nodeCount: next.nodes.length, edgeCount: next.edges.length, paths: [next.nodes] };
    },
    flows: { async updateOne(_filter, update, opts) {
      assert.equal(opts.upsert, true);
      calls.push(['persist', update.$set.graph.nodes[0].id]);
      if ((failWrite && writeCount === 0) || (failRollback && writeCount > 0)) {
        writeCount++;
        throw Error('MongoDB unavailable');
      }
      writeCount++;
      persisted = update.$set.graph;
    } },
    engine: { deploy(next) { calls.push(['deploy', next.nodes[0].id]); if (failDeploy) throw Error('RxJS compiler unavailable'); } },
    io: { emit(event) { calls.push(['socket', event]); if (failSocket) throw Error('Socket unavailable'); } },
    getGraph: () => active,
    setGraph: next => { active = next; calls.push(['activate', next.nodes[0].id]); },
    logger: { error(...args) { errors.push(args); } }
  };
  const handlers = createFlowHandlers(deps);
  function response() { return { statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } }; }
  return { handlers, response, calls, errors, getActive: () => active, getStored: () => persisted };
}

test('saves a valid graph before deployment and announces once', async () => {
  const s = setup(), res = s.response();
  await s.handlers.save({ body: { graph: graph('new') } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true, nodeCount: 2, edgeCount: 1, pathCount: 1 });
  assert.deepEqual(s.calls.map(c => c[0]), ['persist', 'deploy', 'activate', 'socket']);
  assert.equal(s.getStored().nodes[0].id, 'new');
});
test('invalid input is 400 and changes nothing', async () => {
  const s = setup(), res = s.response();
  await s.handlers.save({ body: { graph: null } }, res);
  assert.equal(res.statusCode, 400); assert.equal(s.calls.length, 0);
  assert.equal(s.getActive().nodes[0].id, 'initial');
});
test('database failures are 503 without activating new rules', async () => {
  const s = setup({ failWrite: true }), res = s.response();
  await s.handlers.save({ body: { graph: graph('new') } }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(s.calls.map(c => c[0]), ['persist']);
  assert.equal(s.getStored().nodes[0].id, 'initial');
});
test('deploy failures restore previous stored graph and active state', async () => {
  const s = setup({ failDeploy: true }), res = s.response();
  await s.handlers.save({ body: { graph: graph('new') } }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(s.calls.map(c => c[0]), ['persist', 'deploy', 'persist']);
  assert.equal(s.getStored().nodes[0].id, 'initial');
  assert.equal(s.getActive().nodes[0].id, 'initial');
});
test('failed rollback is logged and does not falsely report success', async () => {
  const s = setup({ failDeploy: true, failRollback: true }), res = s.response();
  await s.handlers.save({ body: { graph: graph('new') } }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(s.getActive().nodes[0].id, 'initial');
  assert.equal(s.getStored().nodes[0].id, 'new');
  assert.match(s.errors.at(-1)[0], /rollback failed/i);
});
test('websocket notification failure does not turn a saved flow into an error', async () => {
  const s = setup({ failSocket: true }), res = s.response();
  await s.handlers.save({ body: { graph: graph('new') } }, res);
  assert.equal(res.statusCode, 200); assert.equal(s.getActive().nodes[0].id, 'new');
  assert.equal(s.errors.length, 1);
});
test('GET returns the currently active, committed graph', async () => {
  const s = setup(), res = s.response();
  s.handlers.get({}, res);
  assert.equal(res.body.graph.nodes[0].id, 'initial');
  await s.handlers.save({ body: { graph: graph('new') } }, s.response());
  s.handlers.get({}, res);
  assert.equal(res.body.graph.nodes[0].id, 'new');
});
test('concurrent saves are serialized in request order', async () => {
  const s = setup();
  let release;
  const firstPersist = new Promise(resolve => { release = resolve; });
  let count = 0;
  // Add an intentionally delayed database write by wrapping the first instance's save function.
  const active = { graph: graph('initial') }, calls = [];
  const handlers = createFlowHandlers({
    validateGraph: g => ({ nodeCount: g.nodes.length, edgeCount: 1, paths: [g.nodes] }),
    flows: { async updateOne(_f, update) { const id = update.$set.graph.nodes[0].id; calls.push('persist:'+id); if (++count === 1) await firstPersist; } },
    engine: { deploy: g => calls.push('deploy:'+g.nodes[0].id) },
    io: { emit: () => {} },
    getGraph: () => active.graph,
    setGraph: g => { active.graph = g; }
  });
  const a = s.response(), b = s.response();
  const pa = handlers.save({ body: { graph: graph('first') } }, a);
  const pb = handlers.save({ body: { graph: graph('second') } }, b);
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(calls, ['persist:first']);
  assert.equal(active.graph.nodes[0].id, 'initial');
  release(); await Promise.all([pa, pb]);
  assert.deepEqual(calls, ['persist:first', 'deploy:first', 'persist:second', 'deploy:second']);
  assert.equal(active.graph.nodes[0].id, 'second');
  assert.equal(a.statusCode, 200); assert.equal(b.statusCode, 200);
});
test('requires all deployment dependencies', () => {
  assert.throws(() => createFlowHandlers({}), /dependencies/);
});
