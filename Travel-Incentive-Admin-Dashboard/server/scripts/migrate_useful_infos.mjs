import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Document from '../models/Document.js';
import UsefulInfo from '../models/UsefulInfo.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to Mongo for migration');

  const docs = await Document.find({ 'usefulInfo.destinationName': { $exists: true } }).lean();
  for (const d of docs) {
    try {
      const title = d.title || d.usefulInfo?.destinationName || 'Untitled';
      const exists = await UsefulInfo.findOne({ title, 'usefulInfo.destinationName': d.usefulInfo?.destinationName }).lean();
      if (exists) {
        console.log('Skipping existing', title);
        continue;
      }
      const payload = {
        title,
        slug: d.slug || title.toLowerCase().replace(/\s+/g, '-'),
        content: d.content || '',
        usefulInfo: d.usefulInfo || {},
        visible: d.visible !== undefined ? d.visible : true,
        author: d.author || ''
      };
      const created = await UsefulInfo.create(payload);
      console.log('Created useful info', created._id.toString());
    } catch (err) {
      console.error('Error migrating', d._id, err);
    }
  }

  console.log('Migration complete');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
