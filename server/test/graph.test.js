import test from 'node:test';import assert from 'node:assert/strict';
import {exampleGraph,validateGraph} from '../src/graph.js';
test('valid graph survives JSON serialization',()=>{const graph=JSON.parse(JSON.stringify(exampleGraph));assert.equal(validateGraph(graph).paths.length,1)});
test('rejects cycle',()=>{const graph=structuredClone(exampleGraph);graph.edges.push({id:'bad',source:'limit',target:'avg'});assert.throws(()=>validateGraph(graph))});
test('rejects unknown edge',()=>{const graph=structuredClone(exampleGraph);graph.edges.push({source:'unknown',target:'alarm'});assert.throws(()=>validateGraph(graph),/Invalid edge/)});
test('rejects invalid threshold',()=>{const graph=structuredClone(exampleGraph);graph.nodes.find(n=>n.id==='limit').data.limit='bad';assert.throws(()=>validateGraph(graph),/threshold/i)});
