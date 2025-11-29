import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/Trip.js';

dotenv.config();
const MONGO = process.env.MONGO_URI || process.env.MONGOURL || 'mongodb://localhost:27017/travel-db';
const id = process.argv[2];
async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const docs = [
    { documentId: '69238a36806c20ba85a5e969', category: 'Useful Informations' },
    { documentId: '692419d6806c20ba85a5e9fe', category: 'Terms & Conditions' },
    { documentId: '69222e7523a338f9e8269d0d', category: 'Privacy Policy' },
    { documentId: '692489103f2ab69645c8a11e', category: 'Form di Registrazione' }
  ];
  const updated = await Trip.findByIdAndUpdate(id, { $set: { documents: docs } }, { new: true, runValidators: true });
  console.log('updated?', !!updated);
  console.log(JSON.stringify(updated, null, 2));
  await mongoose.disconnect();
}
if (!id) { console.error('usage'); process.exit(2); }
run().catch(e=>{ console.error(e); process.exit(1); });
