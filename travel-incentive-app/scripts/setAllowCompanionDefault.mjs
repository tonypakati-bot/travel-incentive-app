import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const trips = db.collection('trips');
    const res = await trips.updateMany({ 'eventDetails.allowCompanion': { $exists: false } }, { $set: { 'eventDetails.allowCompanion': false } });
    console.log('Updated count:', res.modifiedCount);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
