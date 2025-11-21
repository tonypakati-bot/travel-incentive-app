#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Participant from '../models/Participant.js';
import Trip from '../models/Trip.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-admin';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  // Find distinct trip strings
  const trips = await Participant.distinct('trip');
  console.log('Found trip strings:', trips.length);

  const actions = [];
  for (const tripName of trips) {
    if (!tripName) continue;
    const existing = await Trip.findOne({ name: tripName.trim() });
    if (existing) {
      actions.push({ tripName, tripId: existing._id.toString(), action: 'use-existing' });
      continue;
    }
    if (!dryRun) {
      const created = await Trip.create({ clientName: 'Imported', name: tripName.trim(), startDate: new Date(), endDate: new Date(), status: 'draft' });
      actions.push({ tripName, tripId: created._id.toString(), action: 'created' });
    } else {
      actions.push({ tripName, tripId: null, action: 'would-create' });
    }
  }

  console.log('Actions planned:', actions.length);
  if (!dryRun) {
    for (const a of actions.filter(x => x.action === 'created' || x.action === 'use-existing')) {
      await Participant.updateMany({ trip: a.tripName }, { $set: { tripId: new mongoose.Types.ObjectId(a.tripId) } });
      console.log('Patched participants for', a.tripName);
    }
  } else {
    console.table(actions.slice(0, 50));
  }

  await mongoose.disconnect();
  console.log('Done');
}

migrate().catch(err => { console.error(err); process.exit(1); });
