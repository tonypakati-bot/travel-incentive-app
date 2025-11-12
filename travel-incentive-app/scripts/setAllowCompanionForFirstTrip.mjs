import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const trips = db.collection('trips');
    const doc = await trips.findOne({});
    if (!doc) {
      console.log('No trip doc found');
      return;
    }
    const res = await trips.updateOne({ _id: doc._id }, { $set: { 'eventDetails.allowCompanion': false } });
    console.log('Updated', doc._id.toString(), 'modifiedCount=', res.modifiedCount);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
