import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';

async function run() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    console.log('Connected to', MONGO_URL);
    const db = client.db(DB_NAME);
    const trips = db.collection('trips');

    const cursor = trips.find({});
    let updated = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const id = doc._id;
      const gather = (arr) => (Array.isArray(arr) ? arr.map(f => f && f.departureGroup).filter(Boolean) : []);
      const outbound = gather(doc.outboundFlights || doc.eventDetails?.outboundFlights || doc.outboundFlights);
      const ret = gather(doc.returnFlights || doc.eventDetails?.returnFlights || doc.returnFlights);
      const all = Array.from(new Set([...(outbound || []), ...(ret || [])]));
      // skip if result matches existing array (shallow equality)
      const existing = (doc.eventDetails && doc.eventDetails.departureGroup) || doc.eventDetails?.departureGroup;
      const same = Array.isArray(existing) && existing.length === all.length && existing.every((v, i) => v === all[i]);
      if (!same) {
        const res = await trips.updateOne({ _id: id }, { $set: { 'eventDetails.departureGroup': all } });
        if (res.modifiedCount && res.modifiedCount > 0) updated++;
        console.log('Updated', id.toString(), '->', all);
      } else {
        console.log('No change for', id.toString());
      }
    }
    console.log('Migration complete. Documents updated:', updated);
  } catch (err) {
    console.error('Migration error', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
