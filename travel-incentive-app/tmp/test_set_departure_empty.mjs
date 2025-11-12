import { MongoClient } from 'mongodb';
import fs from 'fs';
import { join } from 'path';

// read .env manually to avoid external deps
const envPath = join(process.cwd(), '.env');
let uri = 'mongodb://localhost:27017/travel-incentive';
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/^\s*MONGODB_URI\s*=\s*(.+)\s*$/m);
  if (m) uri = m[1].trim();
}

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
  } catch (e) {
    console.error('Failed to connect to MongoDB at', uri, e.message || e);
    process.exit(1);
  }
  const db = client.db();
  // list collections to inspect where emergencyContacts might be stored
  const collections = await db.listCollections().toArray();
  console.log('Collections in DB:', collections.map(c => c.name));
  let doc = null;
  let collName = null;
  for (const c of collections) {
    const name = c.name;
    const collection = db.collection(name);
    const count = await collection.countDocuments();
    console.log(`- ${name}: ${count} docs`);
    const maybe = await collection.findOne({ emergencyContacts: { $exists: true } });
    if (maybe) {
      doc = maybe;
      collName = name;
      break;
    }
  }
  if (!doc) {
    console.error('No document with emergencyContacts found in any collection');
    await client.close();
    process.exit(1);
  }
  const coll = db.collection(collName);
  console.log('Before - emergencyContacts:');
  console.log(JSON.stringify(doc.emergencyContacts, null, 2));

  // set departureGroup "" for id ec1
  const updated = (doc.emergencyContacts || []).map((c) => {
    if (c.id === 'ec1') {
      return { ...c, departureGroup: '' };
    }
    return c;
  });

  await coll.updateOne({ _id: doc._id }, { $set: { emergencyContacts: updated } });

  const after = await coll.findOne({ _id: doc._id });
  console.log('After - emergencyContacts:');
  console.log(JSON.stringify(after.emergencyContacts, null, 2));

  await client.close();
}

run().catch((e) => { console.error(e); process.exit(1); });
