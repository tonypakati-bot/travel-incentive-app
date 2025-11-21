import mongoose from 'mongoose';
import { MONGODB_URI } from '../config/database.mjs';

async function dump() {
  try {
    await mongoose.connect(MONGODB_URI, { family: 4 });
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));

    for (const col of cols) {
      console.log('\n----', col.name, '----');
      const docs = await db.collection(col.name).find({}).limit(3).toArray();
      console.log(JSON.stringify(docs, null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed to dump collections:', err);
    process.exit(1);
  }
}

// Run immediately (ESM entry)
dump();
