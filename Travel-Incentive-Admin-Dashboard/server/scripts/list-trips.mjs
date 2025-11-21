#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/Trip.js';

dotenv.config({ path: './.env' });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

async function run() {
  await mongoose.connect(MONGO_URI);
  const trips = await Trip.find({}).sort({ createdAt: -1 }).limit(20).lean();
  console.log('Recent trips:');
  trips.forEach(t => console.log({ id: t._id.toString(), name: t.name, clientName: t.clientName, startDate: t.startDate, endDate: t.endDate, status: t.status }));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
