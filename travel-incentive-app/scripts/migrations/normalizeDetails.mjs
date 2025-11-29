#!/usr/bin/env node
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';

// Usage:
// node normalizeDetails.mjs --dry-run
// node normalizeDetails.mjs --apply

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const dryRun = !apply;

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB || 'travel-incentive';

function normalizeEntry(e){
  // If already in canonical form {type, value}
  if(e && typeof e === 'object' && ('type' in e) && ('value' in e)) return e;
  // If string
  if(typeof e === 'string') return { type: 'Text', value: e };
  // If array -> flatten and join
  if(Array.isArray(e)){
    // attempt to normalize first element
    const flat = e.flat(Infinity).map(x => typeof x === 'object' && x !== null ? (x.value || JSON.stringify(x)) : String(x));
    return { type: 'Text', value: flat.join(' | ') };
  }
  // If object but missing fields, try to map common shapes
  if(e && typeof e === 'object'){
    const keys = Object.keys(e);
    if(keys.includes('text') && keys.includes('icon')) return { type: 'Text', value: e.text };
    if(keys.length===1){
      const v = e[keys[0]];
      return { type: keys[0], value: typeof v==='string'?v:JSON.stringify(v) };
    }
    // fallback
    return { type: 'Object', value: JSON.stringify(e) };
  }
  // else
  return { type: 'Unknown', value: String(e) };
}

(async ()=>{
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const trips = db.collection('trips');

  console.log('Migration normalizeDetails', dryRun? '(dry-run)':'(apply)');

  const cursor = trips.find({ 'agenda.items.details': { $exists: true, $ne: [] } });
  let total = 0;
  let toUpdate = [];
  while(await cursor.hasNext()){
    const doc = await cursor.next();
    let changed = false;
    const agenda = doc.agenda || [];
    for(let dayIdx=0; dayIdx<agenda.length; dayIdx++){
      const day = agenda[dayIdx];
      const items = day.items || [];
      for(let itemIdx=0; itemIdx<items.length; itemIdx++){
        const item = items[itemIdx];
        if(!item || !item.details) continue;
        const newDetails = item.details.map(d => normalizeEntry(d));
        // detect if any element differs structurally (string vs object) or values differ
        if(JSON.stringify(newDetails) !== JSON.stringify(item.details)){
          changed = true;
          // store the path for update
          toUpdate.push({ _id: doc._id.toString(), day: day.day, itemId: item.id, old: item.details, new: newDetails });
          // apply in-memory change if apply mode
          if(!dryRun){
            item.details = newDetails;
          }
        }
      }
    }
    if(!dryRun && changed){
      // commit the whole agenda back
      await trips.updateOne({ _id: doc._id }, { $set: { agenda: doc.agenda } });
      total++;
      console.log('Updated doc', doc._id.toString());
    }
  }

  console.log('Found', toUpdate.length, 'items to change across', new Set(toUpdate.map(x=>x._id)).size, 'trips');
  if(dryRun){
    // write a report file
    fs.writeFileSync('tmp/normalizeDetails.report.json', JSON.stringify(toUpdate, null, 2));
    console.log('Wrote tmp/normalizeDetails.report.json');
  } else {
    console.log('Applied changes to', total, 'documents');
  }

  await client.close();
})();
