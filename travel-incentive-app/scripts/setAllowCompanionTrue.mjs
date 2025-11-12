import { MongoClient } from 'mongodb';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';

async function run(){
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const trips = db.collection('trips');
  const res = await trips.updateMany({}, { $set: { 'eventDetails.allowCompanion': true } });
  console.log('Modified count', res.modifiedCount);
  const docs = await trips.find({}).toArray();
  for(const d of docs){
    console.log('---');
    console.log(JSON.stringify({ _id: d._id, eventDetails: d.eventDetails }, null, 2));
  }
  await client.close();
}

run().catch(err=>{ console.error(err); process.exit(1); });
