import 'dotenv/config';
import { connectDB } from '../config/database.mjs';
import PrivacyPolicy from '../models/PrivacyPolicy.mjs';

await connectDB();

const policies = [
  {
    title: 'Global Privacy Policy',
    content: '<p>Default global privacy policy for all trips.</p>',
    tripId: null,
    visible: true
  },
  {
    title: 'Privacy Policy - Sales Kick-off Dubai',
    content: '<p>Specific privacy details for Sales Kick-off Dubai.</p>',
    tripId: 'Sales Kick-off Dubai',
    visible: true
  }
];

async function run() {
  for (const p of policies) {
    const exists = await PrivacyPolicy.findOne({ title: p.title }).lean();
    if (exists) {
      console.log('Policy exists:', p.title);
      continue;
    }
    const created = await PrivacyPolicy.create(p);
    console.log('Created policy:', created.title, created._id);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
