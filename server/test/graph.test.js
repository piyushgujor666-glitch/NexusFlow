import test from 'node:test';
import assert from 'node:assert/strict';
import { exampleGraph, validateGraph } from '../src/graph.js';

const clone = () => structuredClone(exampleGraph);
const fails = (graph, pattern) => assert.throws(() => validateGraph(graph), pattern);

test('valid graph survives JSON serialization', () => {
  const graph = JSON.parse(JSON.stringify(exampleGraph));
  assert.equal(validateGraph(graph).paths.length, 1);
});
test('returns correct source-to-alert node order', () => {
  assert.deepEqual(validateGraph(clone()).paths[0].map(node => node.id), ['sensor', 'avg', 'limit', 'alarm']);
});
test('allows fan-out into independent alert paths', () => {
  const graph = clone();
  graph.nodes.push({ id: 'alarm-2', type: 'alert', data: { message: 'Second alert' } });
  graph.edges.push({ id: 'e4', source: 'limit', target: 'alarm-2' });
  assert.equal(validateGraph(graph).paths.length, 2);
});
test('rejects cycles', () => {
  const graph = clone();
  graph.edges.push({ id: 'bad', source: 'limit', target: 'avg' });
  fails(graph, /input|cycle/i);
});
test('rejects unknown edge targets', () => {
  const graph = clone();
  graph.edges.push({ source: 'unknown', target: 'alarm' });
  fails(graph, /Invalid edge/);
});
test('rejects invalid threshold', () => {
  const graph = clone();
  graph.nodes.find(n => n.id === 'limit').data.limit = 'not-a-number';
  fails(graph, /threshold/i);
});
test('rejects NaN thresholds and string windows', () => {
  const threshold = clone();
  threshold.nodes.find(n => n.id === 'limit').data.limit = NaN;
  fails(threshold, /threshold/i);
  const average = clone();
  average.nodes.find(n => n.id === 'avg').data.window = '5';
  fails(average, /average window/i);
});
test('rejects duplicate connections', () => {
  const graph = clone();
  graph.edges.push({ id: 'e4', source: 'sensor', target: 'avg' });
  fails(graph, /Duplicate edge/);
});
test('rejects disconnected sources', () => {
  const graph = clone();
  graph.nodes.push({ id: 'orphan', type: 'source', data: { sensor: 'orphan-1' } });
  fails(graph, /must lead to an alert/i);
});
test('rejects processors with no destination', () => {
  const graph = clone();
  graph.edges.pop();
  fails(graph, /must lead to an alert/i);
});
test('rejects malicious or malformed sensor identifiers', () => {
  const graph = clone();
  graph.nodes[0].data.sensor = '$gt';
  fails(graph, /sensor ID/);
});
test('rejects duplicate node identifiers', () => {
  const graph = clone();
  graph.nodes[1].id = 'sensor';
  fails(graph, /Invalid node/);
});
test('rejects missing graphs', () => {
  fails(null, /Expected nodes/);
});
