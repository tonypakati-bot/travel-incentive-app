#!/usr/bin/env node
import mongoose from 'mongoose';
import Trip from '../models/Trip.js';

import fs from 'fs';
import path from 'path';

let MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-admin';
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const data = fs.readFileSync(envPath, 'utf8');
  for (const line of data.split(/\r?\n/)) {
    const m = line.match(/^\s*MONGO_URI\s*=\s*(.*)\s*$/);
    if (m) {
      MONGO_URI = m[1];
      break;
    }
  }
}
const id = process.argv[2];
if (!id) {
  console.error('Usage: node tools/check-trip.js <tripId>');
  process.exit(2);
}

(async function() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: 'travel' });
    console.log('[check-trip] connected to', MONGO_URI);
    const trip = await Trip.findById(id).lean();
    if (!trip) {
      console.log('[check-trip] not found', id);
      process.exit(0);
    }
    console.log(JSON.stringify(trip, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('[check-trip] error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
