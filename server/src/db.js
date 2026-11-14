import { MongoClient } from 'mongodb';
export async function openDatabase(uri, name) {
 const client = new MongoClient(uri,{maxPoolSize:30});
 await client.connect();
 const db=client.db(name);
 const existing=await db.listCollections({name:'telemetry'}).toArray();
 if (!existing.length) await db.createCollection('telemetry',{timeseries:{timeField:'timestamp',metaField:'metadata',granularity:'seconds'}});
 await db.collection('telemetry').createIndex({'metadata.sensor':1,timestamp:-1});
 await db.collection('alerts').createIndex({at:-1});
 return {client,db};
}
