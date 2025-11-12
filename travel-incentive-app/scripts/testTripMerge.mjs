import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const trips = db.collection('trips');
    const before = await trips.findOne({});
    console.log('Before eventDetails:', JSON.stringify(before.eventDetails, null, 2));
    // Simulate client partial payload
    const payload = { eventDetails: { title: 'Updated Title via Partial Save', allowBusiness: true } };
    // Emulate server merge: fetch existing, merge eventDetails
    const existing = await trips.findOne({});
    const existingEvent = existing.eventDetails || {};
    const mergedEvent = { ...existingEvent, ...payload.eventDetails };
    await trips.updateOne({ _id: existing._id }, { $set: { 'eventDetails': mergedEvent } });
    const after = await trips.findOne({});
    console.log('After eventDetails:', JSON.stringify(after.eventDetails, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
