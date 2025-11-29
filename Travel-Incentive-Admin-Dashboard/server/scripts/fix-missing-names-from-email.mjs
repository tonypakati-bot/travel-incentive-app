import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('Please set MONGO_URI or MONGODB_URI');
  process.exit(1);
}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

function parseNameFromEmail(email) {
  if (!email || typeof email !== 'string') return { firstName: '', lastName: '' };
  const local = email.split('@')[0];
  // replace non-letter characters with a single space
  const cleaned = local.replace(/[+%\s]+/g, ' ').replace(/[^\w\.\-\s]/g, '').replace(/[\.\-_]+/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    const first = tokens[0];
    const last = tokens.slice(1).join(' ');
    return { firstName: capitalize(first), lastName: capitalize(last) };
  }
  if (tokens.length === 1) {
    const single = tokens[0];
    // try to split camelCase (MarcoRossi) into Marco Rossi
    const splitCamel = single.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s+/).filter(Boolean);
    if (splitCamel.length >= 2) {
      return { firstName: capitalize(splitCamel[0]), lastName: capitalize(splitCamel.slice(1).join(' ')) };
    }
    // as fallback, treat as firstName
    return { firstName: capitalize(single), lastName: '' };
  }
  return { firstName: '', lastName: '' };
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

async function run() {
  try {
    await client.connect();
    const db = client.db();
    console.log('Connected to', db.databaseName);

    const participants = db.collection('participants');
    const cursor = participants.find({ $or: [ { firstName: { $exists: false } }, { firstName: '' }, { lastName: { $exists: false } }, { lastName: '' } ], email: { $exists: true, $ne: '' } });
    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) break;
      const email = doc.email || '';
      const { firstName, lastName } = parseNameFromEmail(email);
      if (!firstName && !lastName) continue;
      const update = {};
      if (firstName) update.firstName = firstName;
      if (lastName) update.lastName = lastName;
      if (Object.keys(update).length > 0) {
        await participants.updateOne({ _id: doc._id }, { $set: update });
        console.log('Updated', String(doc._id), '->', update, 'from email', email);
        count++;
      }
    }

    console.log('Done. Documents updated:', count);
    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(2);
  } finally {
    await client.close();
  }
}

run();
