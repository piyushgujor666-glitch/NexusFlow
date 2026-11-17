import { MongoClient } from 'mongodb';
import { ensureTelemetryCollection } from './time-series.js';

export async function openDatabase(uri, name) {
 const client = new MongoClient(uri, { maxPoolSize: 30 });
 try {
  await client.connect();
  const db = client.db(name);
  await ensureTelemetryCollection(db);
  await db.collection('telemetry').createIndex({ 'metadata.sensor': 1, timestamp: -1 });
  await db.collection('alerts').createIndex({ at: -1 });
  return { client, db };
 } catch (error) {
  await client.close();
  throw error;
 }
}
