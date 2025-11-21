#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../server/models/Trip.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-admin';

async function run() {
  await mongoose.connect(MONGO_URI);
  const trips = await Trip.find({}).sort({ createdAt: -1 }).limit(10).lean();
  console.log('Recent trips:\n', trips.map(t => ({ id: t._id, name: t.name, clientName: t.clientName, startDate: t.startDate, endDate: t.endDate, status: t.status })));
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
