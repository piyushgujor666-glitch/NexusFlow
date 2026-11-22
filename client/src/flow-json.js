/**
 * Portable JSON snapshots for the visual rule canvas.
 * Keep runtime-only React Flow values out of exported JSON.
 * The server remains responsible for full graph validation on deployment.
 */
const NODE_TYPES = new Set(['source', 'average', 'threshold', 'alert']);

export function serializeFlow(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) throw new Error('Expected node and edge arrays');
  const graph = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: { x: node.position?.x, y: node.position?.y },
      data: { ...node.data }
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
      ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {})
    }))
  };
  const json = JSON.stringify(graph, null, 2);
  // Export must be accepted by the matching importer, including size and shape limits.
  parseFlow(json);
  return json;
}

export function parseFlow(text) {
  if (typeof text !== 'string' || text.length > 100_000) throw new Error('Graph JSON must be text under 100 KB');
  let graph;
  try { graph = JSON.parse(text); }
  catch { throw new Error('Graph contains invalid JSON'); }
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error('Graph JSON must contain nodes and edges arrays');
  }
  if (graph.nodes.length < 2 || graph.nodes.length > 100 || graph.edges.length > 200) {
    throw new Error('Graph size outside supported limits');
  }

  const ids = new Set();
  const nodes = graph.nodes.map(node => {
    if (!node || typeof node.id !== 'string' || !node.id || ids.has(node.id) ||
        !NODE_TYPES.has(node.type) ||
        !Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y) ||
        !node.data || typeof node.data !== 'object' || Array.isArray(node.data)) {
      throw new Error('Graph contains an invalid or duplicate node');
    }
    ids.add(node.id);
    const data = { ...node.data };
    // Do not permit type or identifiers to be overwritten by arbitrary runtime data.
    return { id: node.id, type: node.type, position: { x: node.position.x, y: node.position.y }, data };
  });
  const connections = new Set();
  const edgeIds = new Set();
  // Reserve explicit IDs before generating fallbacks, so missing IDs cannot
  // collide with later React Flow edges carrying their own IDs.
  for (const edge of graph.edges) {
    if (typeof edge?.id === 'string' && edge.id.length > 0) {
      if (edgeIds.has(edge.id)) throw new Error('Graph contains duplicate edge IDs');
      edgeIds.add(edge.id);
    }
  }
  let fallback = 0;
  const edges = graph.edges.map(edge => {
    if (!edge || typeof edge.source !== 'string' || typeof edge.target !== 'string' ||
        !ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target) {
      throw new Error('Graph contains an invalid connection');
    }
    const key = JSON.stringify([edge.source, edge.target]);
    if (connections.has(key)) throw new Error('Graph contains duplicate connections');
    connections.add(key);
    let id = edge.id;
    if (typeof id !== 'string' || !id) {
      do { id = 'e-' + (++fallback); } while (edgeIds.has(id));
      edgeIds.add(id);
    }
    return {
      id,
      source: edge.source,
      target: edge.target,
      ...(typeof edge.sourceHandle === 'string' ? { sourceHandle: edge.sourceHandle } : {}),
      ...(typeof edge.targetHandle === 'string' ? { targetHandle: edge.targetHandle } : {}),
      animated: true
    };
  });
  return { nodes, edges };
}
