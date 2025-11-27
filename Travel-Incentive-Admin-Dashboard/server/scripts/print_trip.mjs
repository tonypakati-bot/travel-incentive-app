import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/Trip.js';

dotenv.config();
const MONGO = process.env.MONGO_URI || process.env.MONGOURL || 'mongodb://localhost:27017/travel-db';
const id = process.argv[2];
if (!id) {
  console.error('Usage: node print_trip.mjs <tripId>');
  process.exit(2);
}

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const t = await Trip.findById(id).lean();
  console.log(JSON.stringify(t, null, 2));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
