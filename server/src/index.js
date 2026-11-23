import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import {Server} from 'socket.io';
import {openDatabase} from './db.js';
import {RuleEngine} from './engine.js';
import {exampleGraph,validateGraph} from './graph.js';
import {createFlowHandlers} from './flow-deployment.js';
import {normalizeReading,normalizeBatch} from './telemetry.js';
import {createIngestionHandlers} from './ingestion.js';
import {getTelemetryAudit} from './telemetry-audit.js';
import {createRecentTelemetryHandler} from './recent-telemetry.js';
const port=Number(process.env.PORT||4000),origin=process.env.CLIENT_ORIGIN||'http://localhost:5173';
const {client,db}=await openDatabase(process.env.MONGO_URI||'mongodb://127.0.0.1:27017',process.env.DB_NAME||'nexusflow');
const app=express();app.use(cors({origin}));app.use(express.json({limit:'3mb'}));
const server=http.createServer(app),io=new Server(server,{cors:{origin}});
const engine=new RuleEngine(async alert=>{try{const result=await db.collection('alerts').insertOne(alert);io.emit('alert',{...alert,id:String(result.insertedId)})}catch(e){console.error('Alert error',e)}});
let graph=exampleGraph;
const stored=await db.collection('flows').findOne({name:'active'});
if(stored?.graph){try{validateGraph(stored.graph);graph=stored.graph}catch(e){console.warn('Invalid saved graph',e.message)}}
engine.deploy(graph);
app.get('/api/health',async(_req,res)=>{try{await db.command({ping:1});res.json({ok:true,database:'connected'})}catch{res.status(503).json({ok:false})}});
const flowHandlers=createFlowHandlers({validateGraph,flows:db.collection('flows'),engine,io,getGraph:()=>graph,setGraph:next=>{graph=next}});
app.get('/api/flow',flowHandlers.get);
app.post('/api/flow',flowHandlers.save);
const ingestion=createIngestionHandlers({normalizeReading,normalizeBatch,collection:db.collection('telemetry'),engine,io});
app.post('/api/telemetry',ingestion.single);
app.post('/api/telemetry/batch',ingestion.batch);
app.get('/api/telemetry/recent',createRecentTelemetryHandler({collection:db.collection('telemetry')}));
app.get('/api/telemetry/audit',async(_req,res)=>{
 try {res.json(await getTelemetryAudit(db))}
 catch(error){console.error('Telemetry audit failed:',error);res.status(503).json({error:'Telemetry storage audit unavailable'})}
});
app.get('/api/alerts',async(_req,res)=>{res.json(await db.collection('alerts').find().sort({at:-1}).limit(30).toArray())});
let timer;
app.post('/api/simulation/start',(_req,res)=>{if(!timer)timer=setInterval(async()=>{const p=normalizeReading({sensor:'turbine-1',value:Math.round((65+Math.random()*40)*10)/10});try{await db.collection('telemetry').insertOne(p);engine.ingest(p);io.emit('telemetry',p)}catch(e){console.error('Simulation failed',e.message)}},800);res.json({ok:true,simulating:true})});
app.post('/api/simulation/stop',(_req,res)=>{clearInterval(timer);timer=undefined;res.json({ok:true,simulating:false})});
server.listen(port,()=>console.log('NexusFlow API http://localhost:'+port));
async function shutdown(){clearInterval(timer);engine.close();io.close();server.close();await client.close();process.exit(0)}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
