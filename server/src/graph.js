export const exampleGraph = {
  nodes: [
    { id: 'sensor', type: 'source', position: { x: 40, y: 130 }, data: { label: 'Turbine Sensor', sensor: 'turbine-1' } },
    { id: 'avg', type: 'average', position: { x: 290, y: 130 }, data: { label: 'Moving Average', window: 5 } },
    { id: 'limit', type: 'threshold', position: { x: 540, y: 130 }, data: { label: 'Threshold', operator: '>', limit: 80 } },
    { id: 'alarm', type: 'alert', position: { x: 790, y: 130 }, data: { label: 'Alert', message: 'Temperature anomaly' } }
  ],
  edges: [
    { id: 'e1', source: 'sensor', target: 'avg' },
    { id: 'e2', source: 'avg', target: 'limit' },
    { id: 'e3', source: 'limit', target: 'alarm' }
  ]
};

const SENSOR_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const NODE_TYPES = new Set(['source', 'average', 'threshold', 'alert']);
const OPERATORS = new Set(['>', '>=', '<', '<=']);

/**
 * Validate a saved React Flow graph before turning it into running rules.
 * Every node must be part of a complete source-to-alert path; disconnected
 * sources, dead-end processors and cycles are rejected rather than silently
 * deployed. Limits also bound the number of RxJS subscriptions generated.
 */
export function validateGraph(graph) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error('Expected nodes and edges arrays');
  }
  if (graph.nodes.length < 2 || graph.nodes.length > 100 || graph.edges.length > 200) {
    throw new Error('Graph exceeds size limits');
  }

  const byId = new Map();
  const incoming = new Map();
  const outgoing = new Map();
  for (const node of graph.nodes) {
    if (typeof node?.id !== 'string' || !node.id || node.id.length > 128 || byId.has(node.id) || !NODE_TYPES.has(node.type)) {
      throw new Error('Invalid node id or type');
    }
    if (node.type === 'source' && !SENSOR_PATTERN.test(node.data?.sensor ?? '')) {
      throw new Error('Source requires a valid sensor ID');
    }
    if (node.type === 'average' && (!Number.isInteger(node.data?.window) || node.data.window < 1 || node.data.window > 1000)) {
      throw new Error('Invalid average window');
    }
    if (node.type === 'threshold' && (!Number.isFinite(node.data?.limit) || !OPERATORS.has(node.data?.operator))) {
      throw new Error('Invalid threshold');
    }
    byId.set(node.id, node);
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }

  const seenConnections = new Set();
  for (const edge of graph.edges) {
    if (!byId.has(edge?.source) || !byId.has(edge?.target) || edge.source === edge.target || byId.get(edge.source).type === 'alert' || byId.get(edge.target).type === 'source') {
      throw new Error('Invalid edge');
    }
    const key = JSON.stringify([edge.source, edge.target]);
    if (seenConnections.has(key)) throw new Error('Duplicate edge');
    seenConnections.add(key);
    outgoing.get(edge.source).push(edge.target);
    incoming.set(edge.target, incoming.get(edge.target) + 1);
  }

  for (const node of graph.nodes) {
    if (node.type !== 'source' && incoming.get(node.id) !== 1) {
      throw new Error('Every processor needs exactly one input');
    }
    if (node.type !== 'alert' && outgoing.get(node.id).length === 0) {
      throw new Error('Sources and processors must lead to an alert');
    }
  }

  const degree = new Map(incoming);
  const queue = graph.nodes.filter(node => degree.get(node.id) === 0).map(node => node.id);
  let visited = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const id = queue[cursor];
    visited++;
    for (const target of outgoing.get(id)) {
      degree.set(target, degree.get(target) - 1);
      if (degree.get(target) === 0) queue.push(target);
    }
  }
  if (visited !== graph.nodes.length) throw new Error('Graph contains cycle');

  const paths = [];
  const visitedOnValidPaths = new Set();
  const walk = (id, path) => {
    const node = byId.get(id);
    const next = [...path, node];
    if (node.type === 'alert') {
      for (const part of next) visitedOnValidPaths.add(part.id);
      paths.push(next);
      if (paths.length > 100) throw new Error('Graph exceeds 100 executable paths');
      return;
    }
    for (const target of outgoing.get(id)) walk(target, next);
  };
  for (const node of graph.nodes.filter(n => n.type === 'source')) walk(node.id, []);
  if (paths.length === 0 || visitedOnValidPaths.size !== graph.nodes.length) {
    throw new Error('All nodes must belong to source-to-alert paths');
  }
  return { paths, nodeCount: graph.nodes.length, edgeCount: graph.edges.length };
}
