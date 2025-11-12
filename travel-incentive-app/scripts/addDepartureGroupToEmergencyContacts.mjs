import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';
const COLLECTION = 'travelinfos';

async function run() {
  const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    console.log('Connected to', MONGO_URI);
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    // Find docs where emergencyContacts exists and at least one contact lacks departureGroup
    const cursor = col.find({ emergencyContacts: { $exists: true, $type: 'array' } });
    let total = 0;
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      total++;
      const em = doc.emergencyContacts || [];
      let changed = false;
      const newEm = em.map((c) => {
        if (!c || typeof c !== 'object') return c;
        if (!Object.prototype.hasOwnProperty.call(c, 'departureGroup')) {
          changed = true;
          return { ...c, departureGroup: '' };
        }
        return c;
      });

      if (changed) {
        const res = await col.updateOne({ _id: doc._id }, { $set: { emergencyContacts: newEm } });
        console.log(`Updated doc ${doc._id} => modifiedCount=${res.modifiedCount}`);
        updated += res.modifiedCount || 0;
      }
    }

    console.log(`Scanned ${total} documents. Updated ${updated} documents.`);
  } catch (err) {
    console.error('Migration failed', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
