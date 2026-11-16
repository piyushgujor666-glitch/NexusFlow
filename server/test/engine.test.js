import test from 'node:test';
import assert from 'node:assert/strict';
import { RuleEngine } from '../src/engine.js';
import { exampleGraph } from '../src/graph.js';

const reading=(value,sensor='turbine-1')=>({metadata:{sensor},value,timestamp:new Date('2026-11-16T12:00:00Z')});

test('compiles source-average-threshold-alert and emits correct alert',()=>{
 const alerts=[],engine=new RuleEngine(alert=>alerts.push(alert));
 assert.equal(engine.deploy(structuredClone(exampleGraph)).deployedPaths,1);
 for(const value of [70,80,90,100,110])engine.ingest(reading(value));
 assert.equal(alerts.length,2);
 assert.equal(alerts[0].evaluatedValue,85);
 assert.equal(alerts[1].evaluatedValue,90);
 assert.equal(alerts[0].nodeId,'alarm');
 engine.close();
});
test('ignores other sensors and malformed readings',()=>{
 const alerts=[],engine=new RuleEngine(alert=>alerts.push(alert));
 engine.deploy(structuredClone(exampleGraph));
 engine.ingest(reading(200,'another-sensor'));
 engine.ingest({metadata:{sensor:'turbine-1'},value:NaN});
 engine.ingest(null);
 engine.ingest(reading(100));
 assert.equal(alerts.length,1);
 assert.equal(alerts[0].evaluatedValue,100);
 engine.close();
});
test('failed redeployment preserves live rules',()=>{
 const alerts=[],engine=new RuleEngine(alert=>alerts.push(alert));
 engine.deploy(structuredClone(exampleGraph));
 const bad=structuredClone(exampleGraph);
 bad.nodes.find(n=>n.id==='avg').data.window=0;
 assert.throws(()=>engine.deploy(bad),/window/);
 engine.ingest(reading(100));
 assert.equal(alerts.length,1);
 engine.close();
});
test('redeployment resets moving average and replaces subscriptions',()=>{
 const alerts=[],engine=new RuleEngine(alert=>alerts.push(alert));
 engine.deploy(structuredClone(exampleGraph));
 engine.ingest(reading(10));
 engine.deploy(structuredClone(exampleGraph));
 engine.ingest(reading(100));
 assert.equal(alerts.length,1);
 assert.equal(alerts[0].evaluatedValue,100);
 engine.close();
});
test('synchronous callback failures do not stop later alerts',()=>{
 let count=0;
 const engine=new RuleEngine(()=>{count++;throw Error('test callback error')});
 const graph=structuredClone(exampleGraph);
 graph.nodes.find(n=>n.id==='avg').data.window=1;
 engine.deploy(graph);
 engine.ingest(reading(100));engine.ingest(reading(110));
 assert.equal(count,2);
 engine.close();
});
test('closed engine rejects deployments and readings; close is idempotent',()=>{
 const engine=new RuleEngine(()=>{});
 engine.close();engine.close();
 assert.throws(()=>engine.deploy(exampleGraph),/closed/);
 assert.throws(()=>engine.ingest(reading(1)),/closed/);
});
