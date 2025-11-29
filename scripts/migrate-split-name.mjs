#!/usr/bin/env node
import { MongoClient } from 'mongodb';

// Usage: MONGO_URI="mongodb://localhost:27017/dbname" node migrate-split-name.mjs
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('Please set MONGO_URI environment variable.');
  process.exit(1);
}

function splitName(name) {
  if (!name) return { firstName: '', lastName: '' };
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const last = parts.pop();
  const first = parts.join(' ');
  return { firstName: first, lastName: last };
}

async function migrateCollection(db, colName, fields = ['name']){
  const col = db.collection(colName);
  const cursor = col.find({ $or: fields.map(f => ({ [f]: { $exists: true, $ne: null, $ne: '' } })) });
  let count = 0;
  while (await cursor.hasNext()){
    const doc = await cursor.next();
    let updated = {};
    for (const f of fields){
      if (doc[f]){
        const { firstName, lastName } = splitName(doc[f]);
        if (!doc.firstName && firstName) updated.firstName = firstName;
        if (!doc.lastName && lastName) updated.lastName = lastName;
      }
    }
    if (Object.keys(updated).length > 0){
      await col.updateOne({ _id: doc._id }, { $set: updated });
      count++;
    }
  }
  console.log(`Migrated ${count} docs in ${colName}`);
}

async function main(){
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db();
  try {
    // collections to migrate - adjust as your schema
    await migrateCollection(db, 'contacts', ['name']);
    await migrateCollection(db, 'participants', ['name']);
    await migrateCollection(db, 'users', ['name']);
    // For trips/emergencyContacts: if embedded arrays exist
    const trips = db.collection('trips');
    if (await trips.countDocuments() > 0) {
      const cursor = trips.find({ 'emergencyContacts.name': { $exists: true } });
      let updatedTrips = 0;
      while (await cursor.hasNext()){
        const t = await cursor.next();
        let modified = false;
        const em = (t.emergencyContacts || []).map(ec => {
          if (ec && ec.name && (!ec.firstName || !ec.lastName)){
            const { firstName, lastName } = splitName(ec.name);
            modified = true;
            return { ...ec, firstName, lastName };
          }
          return ec;
        });
        if (modified){
          await trips.updateOne({ _id: t._id }, { $set: { emergencyContacts: em } });
          updatedTrips++;
        }
      }
      console.log(`Updated ${updatedTrips} trip docs with emergencyContacts`);
    }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
