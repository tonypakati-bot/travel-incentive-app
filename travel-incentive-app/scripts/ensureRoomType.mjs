import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const trips = db.collection('trips');
    const res = await trips.updateMany({ $or: [ { 'eventDetails.roomType': { $exists: false } }, { 'eventDetails.roomType': null } ] }, { $set: { 'eventDetails.roomType': [] } });
    console.log('roomType updated count:', res.modifiedCount);
    const docs = await trips.find({}).toArray();
    for (const d of docs) {
      console.log('---');
      console.log(JSON.stringify({ _id: d._id, roomType: d.eventDetails?.roomType }, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
