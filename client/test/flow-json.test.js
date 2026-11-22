import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeFlow, parseFlow } from '../src/flow-json.js';

const nodes=[
 {id:'sensor',type:'source',position:{x:0,y:20},data:{label:'Sensor',sensor:'turbine-1'},selected:true},
 {id:'alert',type:'alert',position:{x:150,y:20},data:{label:'Alert',message:'High temp'},dragging:false}
];
const edges=[{id:'e1',source:'sensor',target:'alert',animated:true,selected:true}];

test('round-trip preserves graph and strips transient React Flow fields',()=>{
 const serialized=serializeFlow(nodes,edges);
 const graph=parseFlow(serialized);
 assert.equal(graph.nodes.length,2);assert.equal(graph.edges.length,1);
 assert.equal(graph.nodes[0].data.sensor,'turbine-1');
 assert.equal(graph.nodes[0].selected,undefined);
 assert.equal(graph.edges[0].selected,undefined);
 assert.equal(graph.edges[0].animated,true);
});
test('JSON export can be parsed independently',()=>{
 const graph=JSON.parse(serializeFlow(nodes,edges));
 assert.deepEqual(Object.keys(graph).sort(),['edges','nodes']);
});
test('invalid JSON reports a readable error',()=>{
 assert.throws(()=>parseFlow('{oops'),/invalid JSON/);
});
test('rejects malformed node coordinates',()=>{
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.nodes[0].position.x='offscreen';
 assert.throws(()=>parseFlow(JSON.stringify(graph)),/invalid or duplicate node/);
});
test('rejects duplicate node IDs',()=>{
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.nodes[1].id='sensor';
 assert.throws(()=>parseFlow(JSON.stringify(graph)),/duplicate node/);
});
test('rejects edges to unknown nodes',()=>{
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.edges[0].target='missing';
 assert.throws(()=>parseFlow(JSON.stringify(graph)),/invalid connection/);
});
test('rejects duplicate connections',()=>{
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.edges.push({...graph.edges[0],id:'e2'});
 assert.throws(()=>parseFlow(JSON.stringify(graph)),/duplicate connections/);
});
test('rejects overly large graph files',()=>{
 assert.throws(()=>parseFlow(' '.repeat(100001)),/100 KB/);
});
test('rejects unknown node types',()=>{
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.nodes[0].type='unsafe';
 assert.throws(()=>parseFlow(JSON.stringify(graph)),/invalid or duplicate node/);
});

test('export rejects invalid graphs instead of producing unusable downloads',()=>{
 assert.throws(()=>serializeFlow([{...nodes[0],position:{x:Infinity,y:0}},nodes[1]],edges),/invalid or duplicate node/);
});
test('export rejects duplicate connections',()=>{
 assert.throws(()=>serializeFlow(nodes,[...edges,{...edges[0],id:'second'}]),/duplicate connections/);
});


test('rejects duplicate React Flow edge IDs even when connections differ', () => {
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.nodes.push({id:'other',type:'alert',position:{x:300,y:20},data:{label:'Other'}});
 graph.edges.push({id:'e1',source:'sensor',target:'other'});
 assert.throws(()=>parseFlow(JSON.stringify(graph)),/duplicate edge IDs/);
});

test('missing edge IDs avoid collision with explicit IDs elsewhere in graph', () => {
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.nodes.push({id:'other',type:'alert',position:{x:300,y:20},data:{label:'Other'}});
 graph.edges=[{source:'sensor',target:'alert'},{id:'e-1',source:'sensor',target:'other'}];
 const imported=parseFlow(JSON.stringify(graph));
 assert.deepEqual(imported.edges.map(edge=>edge.id),['e-2','e-1']);
});

test('multiple missing edge IDs get unique stable identifiers', () => {
 const graph=JSON.parse(serializeFlow(nodes,edges));
 graph.nodes.push({id:'other',type:'alert',position:{x:300,y:20},data:{label:'Other'}});
 graph.edges=[{source:'sensor',target:'alert'},{source:'sensor',target:'other'}];
 const imported=parseFlow(JSON.stringify(graph));
 assert.deepEqual(imported.edges.map(edge=>edge.id),['e-1','e-2']);
});
