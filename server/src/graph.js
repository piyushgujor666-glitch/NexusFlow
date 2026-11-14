export const exampleGraph={nodes:[
{id:'sensor',type:'source',position:{x:40,y:130},data:{label:'Turbine Sensor',sensor:'turbine-1'}},
{id:'avg',type:'average',position:{x:290,y:130},data:{label:'Moving Average',window:5}},
{id:'limit',type:'threshold',position:{x:540,y:130},data:{label:'Threshold',operator:'>',limit:80}},
{id:'alarm',type:'alert',position:{x:790,y:130},data:{label:'Alert',message:'Temperature anomaly'}}
],edges:[{id:'e1',source:'sensor',target:'avg'},{id:'e2',source:'avg',target:'limit'},{id:'e3',source:'limit',target:'alarm'}]};
export function validateGraph(graph){
 if(!graph||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges))throw Error('Expected nodes and edges arrays');
 if(graph.nodes.length<2||graph.nodes.length>100||graph.edges.length>200)throw Error('Graph exceeds size limits');
 const allowed=new Set(['source','average','threshold','alert']),byId=new Map(),incoming=new Map(),outgoing=new Map();
 for(const n of graph.nodes){
  if(!n?.id||typeof n.id!=='string'||byId.has(n.id)||!allowed.has(n.type))throw Error('Invalid node id or type');
  if(n.type==='source'&&(!n.data?.sensor||typeof n.data.sensor!=='string'))throw Error('Source requires sensor');
  if(n.type==='average'&&(!Number.isInteger(Number(n.data?.window))||Number(n.data.window)<1||Number(n.data.window)>1000))throw Error('Invalid average window');
  if(n.type==='threshold'&&(!Number.isFinite(Number(n.data?.limit))||!['>','>=','<','<='].includes(n.data?.operator)))throw Error('Invalid threshold');
  byId.set(n.id,n);incoming.set(n.id,0);outgoing.set(n.id,[]);
 }
 for(const e of graph.edges){
  if(!byId.has(e.source)||!byId.has(e.target)||e.source===e.target||byId.get(e.source).type==='alert'||byId.get(e.target).type==='source')throw Error('Invalid edge');
  outgoing.get(e.source).push(e.target);incoming.set(e.target,incoming.get(e.target)+1);
 }
 for(const n of graph.nodes)if(n.type!=='source'&&incoming.get(n.id)!==1)throw Error('Every processor needs exactly one input');
 const degrees=new Map(incoming),queue=graph.nodes.filter(n=>!degrees.get(n.id)).map(n=>n.id);let visited=0;
 while(queue.length){const id=queue.shift();visited++;for(const to of outgoing.get(id)){degrees.set(to,degrees.get(to)-1);if(!degrees.get(to))queue.push(to)}}
 if(visited!==graph.nodes.length)throw Error('Graph contains cycle');
 const paths=[];const walk=(id,path)=>{const n=byId.get(id);const next=[...path,n];if(n.type==='alert'){paths.push(next);return}for(const to of outgoing.get(id))walk(to,next)};
 for(const n of graph.nodes.filter(n=>n.type==='source'))walk(n.id,[]);
 if(!paths.length||paths.length>100)throw Error('Graph requires 1–100 source-to-alert paths');
 return {paths,nodeCount:graph.nodes.length,edgeCount:graph.edges.length};
}
