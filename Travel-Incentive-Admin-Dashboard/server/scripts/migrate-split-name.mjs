import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run') || argv.includes('-n');
const removeName = argv.includes('--remove-name') || argv.includes('-r');
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('Please set MONGO_URI or MONGODB_URI');
  process.exit(1);
}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

function splitName(name) {
  if (!name || typeof name !== 'string') return { firstName: '', lastName: '' };
  const tokens = name.trim().split(/\s+/);
  if (tokens.length === 0) return { firstName: '', lastName: '' };
  if (tokens.length === 1) return { firstName: tokens[0], lastName: '' };
  const lastName = tokens.pop();
  return { firstName: tokens.join(' '), lastName };
}

async function run() {
  try {
    await client.connect();
    const db = client.db();
    console.log('Connected to', db.databaseName);

    // Update participants collection
    const participants = db.collection('participants');
    const cursor = participants.find({ $or: [{ firstName: { $exists: false } }, { lastName: { $exists: false } }] });
    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) break;
      if (doc.firstName && doc.lastName) continue; // already set
      const { firstName, lastName } = splitName(doc.name || '');
      const update = {};
      if (firstName) update.firstName = firstName;
      if (lastName) update.lastName = lastName;
      if (Object.keys(update).length > 0) {
        if (dryRun) {
          console.log('[dry-run] would update participant', String(doc._id), 'with', update);
        } else {
          await participants.updateOne({ _id: doc._id }, { $set: update });
          console.log('updated participant', String(doc._id), 'with', update);
        }
        count++;
      }
    }
    console.log(dryRun ? 'Participants that would be updated:' : 'Participants updated:', count);

    // Optionally remove legacy `name` field from documents that appear migrated
    if (removeName) {
      let removed = 0;
      const removeCursor = participants.find({ name: { $exists: true }, $or: [{ firstName: { $exists: true } }, { lastName: { $exists: true } }] });
      while (await removeCursor.hasNext()) {
        const doc = await removeCursor.next();
        if (!doc) break;
        // Only remove `name` if at least firstName or lastName is set
        if (doc.firstName || doc.lastName) {
          if (dryRun) {
            console.log('[dry-run] would unset name for participant', String(doc._id));
          } else {
            await participants.updateOne({ _id: doc._id }, { $unset: { name: '' } });
            console.log('unset name for participant', String(doc._id));
          }
          removed++;
        }
      }
      console.log(dryRun ? 'Participants that would have name unset:' : 'Participants with name unset:', removed);
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(2);
  } finally {
    await client.close();
  }
}

run();
