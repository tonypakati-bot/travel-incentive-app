import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/Trip.js';
import Document from '../models/Document.js';

dotenv.config();

const MONGO = process.env.MONGO_URI || process.env.MONGOURL || 'mongodb://localhost:27017/travel';

const CATEGORY_ORDER = [
  'Useful Informations',
  'Privacy Policy',
  'Terms & Conditions',
  'Form di Registrazione'
];

async function resolveId(candidate) {
  if (!candidate) return null;
  if (mongoose.Types.ObjectId.isValid(String(candidate))) return String(candidate);
  const doc = await Document.findOne({ slug: String(candidate) }).lean();
  if (doc) return String(doc._id);
  return null;
}

async function run() {
  console.log('Connecting to', MONGO);
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected.');

  const trips = await Trip.find({}).lean();
  console.log('Found trips:', trips.length);

  let updated = 0;
  for (const t of trips) {
    const docs = t.documents || [];
    if (!Array.isArray(docs) || docs.length === 0) continue;
    // detect already migrated (array of objects with documentId)
    const first = docs[0];
    if (first && typeof first === 'object' && (first.documentId || first.document_id || first.document)) {
      // assume already migrated
      continue;
    }

    const newDocs = [];
    for (let i = 0; i < docs.length; i++) {
      const v = docs[i];
      const resolved = await resolveId(v);
      if (!resolved) continue;
      const category = CATEGORY_ORDER[i] || '';
      newDocs.push({ documentId: resolved, category });
    }

    if (newDocs.length) {
      await Trip.updateOne({ _id: t._id }, { $set: { documents: newDocs } });
      updated++;
      console.log(`Updated trip ${t._id} -> ${newDocs.length} documents`);
    }
  }

  console.log('Done. Trips updated:', updated);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
