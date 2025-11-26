import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../models/Contact.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected for migration');
  const res = await Contact.updateMany({ notes: { $exists: false } }, { $set: { notes: '' } });
  console.log('Migration result', res);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
