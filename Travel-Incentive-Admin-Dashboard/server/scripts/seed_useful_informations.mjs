import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Document from '../models/Document.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

const items = [
  { 
    title: 'Ibiza',
    usefulInfo: {
      destinationName: 'Ibiza',
      country: 'Spagna',
      documents: 'Passport or valid ID card required for EU citizens.',
      timeZone: 'GMT+2 (same as Italy during summer).',
      currency: 'Euro (€).',
      language: 'Spanish and Catalan. English and Italian are widely spoken.',
      climate: 'Mediterranean climate, hot summers and mild winters.',
      vaccinationsHealth: 'No specific vaccinations required. European Health Insurance Card (EHIC) is recommended.'
    }
  },
  { 
    title: 'Mykonos',
    usefulInfo: {
      destinationName: 'Mykonos',
      country: 'Grecia',
      documents: 'Passport or valid ID card required for EU citizens.',
      timeZone: 'GMT+3 (1 hour ahead of Italy).',
      currency: 'Euro (€).',
      language: 'Greek. English is widely spoken in tourist areas.',
      climate: 'Mediterranean climate, known for being windy (Meltemi).',
      vaccinationsHealth: 'No specific vaccinations required. European Health Insurance Card (EHIC) is recommended.'
    }
  },
  { 
    title: 'Abu Dhabi',
    usefulInfo: {
      destinationName: 'Abu Dhabi',
      country: 'Emirati Arabi Uniti',
      documents: 'Entry into the Emirates only requires a passport with a minimum validity of 6 months. No visa is needed for EU citizens for stays up to 90 days.',
      timeZone: 'The time difference is GMT+3, which is 3 hours ahead of Italian time (2 hours when daylight saving time is in effect).',
      currency: 'The Emirati Dirham (AED) is worth approximately €0.25. Major credit cards are accepted everywhere.',
      language: 'The official language is Arabic. English is understood and widely spoken in tourist areas.',
      climate: 'The climate in the United Arab Emirates is subtropical and arid. Rain is rare. The best time to visit is from October to April when temperatures are milder.',
      vaccinationsHealth: 'No mandatory vaccinations are required. Medicines are readily available in numerous pharmacies.'
    }
  }
];

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for seeding useful informations');

  for (const item of items) {
    try {
      const filter = { title: item.title, 'usefulInfo.destinationName': item.usefulInfo.destinationName };
      const existing = await Document.findOne(filter).lean();
      if (existing) {
        console.log(`Updating existing: ${item.title}`);
        await Document.findByIdAndUpdate(existing._id, { $set: { usefulInfo: item.usefulInfo, content: '' } });
      } else {
        console.log(`Creating: ${item.title}`);
        await Document.create({ title: item.title, slug: item.title.toLowerCase().replace(/\s+/g, '-'), usefulInfo: item.usefulInfo, content: '', visible: true });
      }
    } catch (err) {
      console.error('Error seeding item', item.title, err);
    }
  }

  console.log('Seeding done');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
