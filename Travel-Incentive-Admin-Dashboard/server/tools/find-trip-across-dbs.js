#!/usr/bin/env node
import mongoose from 'mongoose';

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('Usage: node tools/find-trip-across-dbs.js <id1> [id2] ...');
  process.exit(2);
}

const candidates = [
  'mongodb://localhost:27017/travel-db',
  'mongodb://127.0.0.1:27017/travel-admin',
  'mongodb://127.0.0.1:27017/travel',
];

(async function() {
  for (const uri of candidates) {
    try {
      const dbName = uri.split('/').pop();
      const conn = await mongoose.createConnection(uri, { dbName }).asPromise();
      console.log('\n[try db] connected to', uri, 'dbName=', dbName);
      const Trip = conn.model('Trip', new mongoose.Schema({}, { strict: false }));
      for (const id of ids) {
        try {
          const res = await Trip.findById(id).lean();
          console.log('  id', id, res ? 'FOUND' : 'not found');
          if (res) console.log(JSON.stringify(res, null, 2).slice(0, 1000));
        } catch (err) {
          console.error('  id', id, 'error', err && err.message ? err.message : err);
        }
      }
      await conn.close();
    } catch (err) {
      console.error('[try db] connect failed', uri, err && err.message ? err.message : err);
    }
  }
})();
