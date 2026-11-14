import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import {Server} from 'socket.io';
import {openDatabase} from './db.js';
import {RuleEngine} from './engine.js';
import {exampleGraph,validateGraph} from './graph.js';
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
app.get('/api/flow',(_req,res)=>res.json({graph}));
app.post('/api/flow',async(req,res)=>{try{const stats=validateGraph(req.body.graph);await db.collection('flows').updateOne({name:'active'},{$set:{graph:req.body.graph,updatedAt:new Date()}},{upsert:true});engine.deploy(req.body.graph);graph=req.body.graph;io.emit('flow:updated',stats);res.json({ok:true,nodeCount:stats.nodeCount,edgeCount:stats.edgeCount,pathCount:stats.paths.length})}catch(e){res.status(400).json({error:e.message})}});
function point(raw){
 if(typeof raw?.sensor!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(raw.sensor)||typeof raw.value!=='number'||!Number.isFinite(raw.value))throw Error('Reading needs valid sensor and numeric value');
 const timestamp=raw.timestamp?new Date(raw.timestamp):new Date();if(Number.isNaN(+timestamp))throw Error('Invalid timestamp');return{metadata:{sensor:raw.sensor},value:raw.value,timestamp}
}
app.post('/api/telemetry',async(req,res)=>{try{const p=point(req.body);await db.collection('telemetry').insertOne(p);engine.ingest(p);io.emit('telemetry',p);res.status(201).json({ok:true})}catch(e){res.status(400).json({error:e.message})}});
app.post('/api/telemetry/batch',async(req,res)=>{try{if(!Array.isArray(req.body.readings)||req.body.readings.length<1||req.body.readings.length>5000)throw Error('Provide 1–5000 readings');const points=req.body.readings.map(point);await db.collection('telemetry').insertMany(points,{ordered:false});for(const p of points)engine.ingest(p);io.emit('telemetry',points.at(-1));res.status(201).json({ok:true,inserted:points.length})}catch(e){res.status(400).json({error:e.message})}});
app.get('/api/telemetry/recent',async(req,res)=>{try{const sensor=typeof req.query.sensor==='string'?req.query.sensor:'turbine-1';if(!/^[a-zA-Z0-9_-]{1,64}$/.test(sensor))throw Error('Invalid sensor');const pts=await db.collection('telemetry').find({'metadata.sensor':sensor}).sort({timestamp:-1}).limit(100).toArray();res.json(pts.reverse())}catch(e){res.status(400).json({error:e.message})}});
app.get('/api/alerts',async(_req,res)=>{res.json(await db.collection('alerts').find().sort({at:-1}).limit(30).toArray())});
let timer;
app.post('/api/simulation/start',(_req,res)=>{if(!timer)timer=setInterval(async()=>{const p=point({sensor:'turbine-1',value:Math.round((65+Math.random()*40)*10)/10});try{await db.collection('telemetry').insertOne(p);engine.ingest(p);io.emit('telemetry',p)}catch(e){console.error('Simulation failed',e.message)}},800);res.json({ok:true,simulating:true})});
app.post('/api/simulation/stop',(_req,res)=>{clearInterval(timer);timer=undefined;res.json({ok:true,simulating:false})});
server.listen(port,()=>console.log('NexusFlow API http://localhost:'+port));
async function shutdown(){clearInterval(timer);engine.close();io.close();server.close();await client.close();process.exit(0)}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
