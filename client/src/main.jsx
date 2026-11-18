import React,{useCallback,useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import ReactFlow,{Background,Controls,MiniMap,addEdge,useNodesState,useEdgesState,Handle,Position}from'@xyflow/react';
import '@xyflow/react/dist/style.css';
import{io}from'socket.io-client';
import{LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer}from'recharts';
import './style.css';
import { serializeFlow, parseFlow } from './flow-json.js';
const API=import.meta.env.VITE_API_URL||'http://localhost:4000';
function Node({data,type}){return <div className={'node '+type}>{type!=='source'&&<Handle type="target" position={Position.Left}/>}<b>{data.label||type}</b><small>{type==='source'?data.sensor:type==='average'?'Window: '+data.window:type==='threshold'?data.operator+' '+data.limit:data.message}</small>{type!=='alert'&&<Handle type="source" position={Position.Right}/>}</div>}
const nodeTypes={source:p=><Node {...p} type="source"/>,average:p=><Node {...p} type="average"/>,threshold:p=><Node {...p} type="threshold"/>,alert:p=><Node {...p} type="alert"/>};
function App(){
 const[nodes,setNodes,onNodesChange]=useNodesState([]),[edges,setEdges,onEdgesChange]=useEdgesState([]),[points,setPoints]=useState([]),[alerts,setAlerts]=useState([]),[status,setStatus]=useState('Loading'),[sim,setSim]=useState(false),[message,setMessage]=useState('');
 const onConnect=useCallback(conn=>setEdges(e=>addEdge({...conn,animated:true},e)),[setEdges]);
 useEffect(()=>{
  fetch(API+'/api/flow').then(r=>r.json()).then(({graph})=>{setNodes(graph.nodes);setEdges(graph.edges);setStatus('Connected')}).catch(()=>setStatus('API offline'));
  fetch(API+'/api/telemetry/recent').then(r=>{if(!r.ok)throw Error('Telemetry unavailable');return r.json()}).then(data=>{if(Array.isArray(data))setPoints(data)}).catch(()=>{});
  fetch(API+'/api/alerts').then(r=>r.json()).then(setAlerts).catch(()=>{});
  const socket=io(API);socket.on('telemetry',p=>setPoints(old=>[...old,...(Array.isArray(p)?p:[p])].filter(item=>item&&typeof item.value==='number'&&Number.isFinite(item.value)).slice(-70)));socket.on('alert',a=>setAlerts(old=>[a,...old].slice(0,30)));
  return()=>socket.disconnect();
 },[setNodes,setEdges]);
 function exportGraph() {
  try {
   const json=serializeFlow(nodes,edges);
   const blob=new Blob([json],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');link.href=url;link.download='nexusflow-graph.json';link.click();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   setMessage('Exported graph JSON ('+nodes.length+' nodes, '+edges.length+' connections)');
  }catch(error){setMessage('Export failed: '+error.message)}
 }
 async function importGraph(event){
  const file=event.target.files?.[0];event.target.value='';
  if(!file)return;
  try{
   if(file.size>100000)throw Error('File exceeds 100 KB limit');
   const next=parseFlow(await file.text());
   setNodes(next.nodes);setEdges(next.edges);
   setMessage('Imported '+next.nodes.length+' nodes. Click Deploy graph to validate on the server.');
  }catch(error){setMessage('Import failed: '+error.message)}
 }
 async function save(){try{const res=await fetch(API+'/api/flow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({graph:{nodes,edges}})});const data=await res.json();if(!res.ok)throw Error(data.error);setMessage('Deployed '+data.nodeCount+' nodes and '+data.pathCount+' rule paths')}catch(e){setMessage(e.message)}}
 async function simulate(){try{const res=await fetch(API+'/api/simulation/'+(sim?'stop':'start'),{method:'POST'});if(!res.ok)throw Error('Simulator request failed');setSim(!sim)}catch(e){setMessage(e.message)}}
 function add(type){const id=type+'-'+Date.now();const data={source:{label:'Sensor',sensor:'turbine-1'},average:{label:'Moving Average',window:5},threshold:{label:'Threshold',operator:'>',limit:80},alert:{label:'Alert',message:'Anomaly detected'}}[type];setNodes(old=>[...old,{id,type,position:{x:100+old.length*110,y:100+old.length*55},data}])}
 function editNode(id){const node=nodes.find(n=>n.id===id);if(!node)return;const key={source:'sensor',average:'window',threshold:'limit',alert:'message'}[node.type];const value=window.prompt('Set '+key,node.data[key]);if(value===null)return;setNodes(old=>old.map(n=>n.id===id?{...n,data:{...n.data,[key]:['window','limit'].includes(key)?Number(value):value}}:n))}
 return <main><header><div className="logo"><strong>◈ NEXUSFLOW</strong><span> / MID Review Console</span></div><span className="pill">● {status}</span></header><section className="hero"><div><p className="eyebrow">INFOTACT SOLUTIONS · ADVANCED MERN</p><h1>Visual IoT Rule Engine</h1><p>Design live sensor pipelines, evaluate custom rules, and monitor IoT data in real time.</p></div><div className="actions"><button onClick={simulate}>{sim?'■ Stop simulator':'▶ Start simulator'}</button><button className="primary" onClick={save}>Deploy graph</button></div></section><section className="stats"><article><span>Graph nodes</span><b>{nodes.length}</b></article><article><span>Connections</span><b>{edges.length}</b></article><article><span>Live readings</span><b>{points.length}</b></article><article><span>Recent alerts</span><b>{alerts.length}</b></article></section><div className="workspace"><section className="panel canvas"><div className="panelhead"><div><h2>Rule builder</h2><p>Drag nodes, connect handles, double-click to edit values</p></div><div className="tools"><button onClick={exportGraph}>↓ Export JSON</button><label className="importbutton">↑ Import JSON<input type="file" accept=".json,application/json" onChange={importGraph} hidden/></label>{['source','average','threshold','alert'].map(t=><button key={t} onClick={()=>add(t)}>+ {t}</button>)}</div></div><div className="flow"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDoubleClick={(_,n)=>editNode(n.id)} fitView><Background color="#dbe8f5"/><Controls/><MiniMap/></ReactFlow></div>{message&&<div className="notice">{message}</div>}</section><section className="panel telemetry"><div className="panelhead"><div><h2>Live telemetry</h2><p>Turbine sensor feed · recent samples</p></div></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={points.slice(-35).map((p,i)=>({index:i,value:p.value}))}><XAxis dataKey="index"/><YAxis domain={['auto','auto']}/><Tooltip/><Line type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={3} dot={false}/></LineChart></ResponsiveContainer></div><h3>Triggered alerts</h3><div className="alerts">{alerts.length?alerts.slice(0,8).map((a,i)=><div key={a.id||i}>⚠ {a.message||'Threshold triggered'} <small>{new Date(a.at||Date.now()).toLocaleTimeString()}</small></div>):<p>No alerts yet. Start the simulator and wait for an anomaly.</p>}</div></section></div><footer>MongoDB Time-Series · Express · React Flow · RxJS · Socket.IO</footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
