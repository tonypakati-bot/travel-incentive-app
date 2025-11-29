import { MongoClient } from 'mongodb';

// Simple migration: set eventDetails.departureGroup to an example array if missing
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    console.log('Connected to', MONGO_URL);
    const db = client.db(DB_NAME);
    const trips = db.collection('trips');

    const cursor = trips.find({ $or: [ { 'eventDetails.departureGroup': { $exists: false } }, { 'eventDetails.departureGroup': null } ] });
    let updated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const id = doc._id;
      const sample = ['Milano Malpensa', 'Roma Fiumicino', 'Venezia'];
      const res = await trips.updateOne({ _id: id }, { $set: { 'eventDetails.departureGroup': sample } });
      if (res.modifiedCount && res.modifiedCount > 0) updated++;
      console.log('Updated', id.toString(), 'modifiedCount=', res.modifiedCount);
    }
    console.log('Migration complete. Documents updated:', updated);
  } catch (err) {
    console.error('Migration error', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

// execute
run();
