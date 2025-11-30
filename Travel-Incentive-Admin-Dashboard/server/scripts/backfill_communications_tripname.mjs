#!/usr/bin/env node
/*
 Backfill script: synchronize Communications.tripName with Trip.name

 Usage:
  - Dry run (no DB writes):
      MONGO_URI='mongodb://localhost:27017/travel-db' node server/scripts/backfill_communications_tripname.mjs --dry-run

  - Run for real (will update documents):
      MONGO_URI='mongodb://localhost:27017/travel-db' node server/scripts/backfill_communications_tripname.mjs

 This script is safe to run multiple times; it overwrites `tripName` on communications for each trip.
*/

import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Communication from '../models/Communication.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/travel-db';
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-n');

async function main() {
  console.log(`Connecting to MongoDB: ${MONGO_URI}`);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).catch(err => { console.error('Mongo connect error', err); process.exit(2); });

  try {
    const trips = await Trip.find({}).lean().exec();
    console.log(`Found ${trips.length} trips.`);

    let totalCommsMatched = 0;
    let totalCommsModified = 0;

    for (const trip of trips) {
      const tripId = trip && (trip._id || trip.tripId);
      const name = trip && (trip.name || trip.tripName || trip.title || null);
      if (!tripId) continue;
      if (!name) {
        console.log(`Trip ${String(tripId)} has no name — skipping`);
        continue;
      }

      const filter = { tripId: String(tripId) };
      const matched = await Communication.countDocuments(filter).catch(err => { console.error('countDocuments error', err); return 0; });
      totalCommsMatched += matched;
      if (!matched) {
        console.log(`Trip ${String(tripId)} (${name}): 0 communications`);
        continue;
      }

      if (dryRun) {
        console.log(`DRY RUN: Trip ${String(tripId)} (${name}): ${matched} communications would be updated.`);
        continue;
      }

      const res = await Communication.updateMany(filter, { $set: { tripName: String(name) } });
      // Mongoose 6 returns { acknowledged, matchedCount, modifiedCount }
      const matchedCount = res.matchedCount ?? res.n ?? 0;
      const modifiedCount = res.modifiedCount ?? res.nModified ?? 0;
      totalCommsModified += modifiedCount;
      console.log(`Trip ${String(tripId)} (${name}): matched=${matchedCount}, modified=${modifiedCount}`);
    }

    if (dryRun) {
      console.log(`DRY RUN complete — communications that would be affected: ${totalCommsMatched}`);
    } else {
      console.log(`Backfill complete — total communications matched: ${totalCommsMatched}, total modified: ${totalCommsModified}`);
    }

  } catch (err) {
    console.error('Error during backfill', err);
  } finally {
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(0);
  }
}

main();
