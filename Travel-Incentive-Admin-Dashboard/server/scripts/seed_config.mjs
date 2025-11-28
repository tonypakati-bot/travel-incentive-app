import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Config from '../models/Config.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

const DEFAULT = ["Activity","Hotel","Meeting","Restaurant","Travel"];

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URI);
  let cfg = await Config.findOne();
  if (cfg) {
    cfg.categoryEvents = DEFAULT;
    await cfg.save();
    console.log('Updated existing config');
  } else {
    cfg = await Config.create({ categoryEvents: DEFAULT });
    console.log('Created config', cfg._id.toString());
  }
  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => { console.error(err); process.exit(1); });
