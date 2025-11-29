import mongoose from 'mongoose';
import Document from '../models/Document.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

const seed = [
  {
    title: 'Ibiza - Useful Information',
    usefulInfo: {
      destinationName: 'Ibiza',
      country: 'Spagna',
      documents: 'Passport or valid ID card required for EU citizens.',
      timeZone: 'GMT+2 (same as Italy during summer).',
      currency: 'Euro (€).',
      language: 'Spanish and Catalan. English and Italian are widely spoken.',
      climate: 'Mediterranean climate, hot summers and mild winters.',
      vaccinationsHealth: 'No specific vaccinations required. European Health Insurance Card (EHIC) is recommended.'
    },
    content: 'Useful information for Ibiza',
  },
  {
    title: 'Mykonos - Useful Information',
    usefulInfo: {
      destinationName: 'Mykonos',
      country: 'Grecia',
      documents: 'Passport or valid ID card required for EU citizens.',
      timeZone: 'GMT+3 (1 hour ahead of Italy).',
      currency: 'Euro (€).',
      language: 'Greek. English is widely spoken in tourist areas.',
      climate: 'Mediterranean climate, known for being windy (Meltemi).',
      vaccinationsHealth: 'No specific vaccinations required. European Health Insurance Card (EHIC) is recommended.'
    },
    content: 'Useful information for Mykonos',
  },
  {
    title: 'Abu Dhabi - Useful Information',
    usefulInfo: {
      destinationName: 'Abu Dhabi',
      country: 'Emirati Arabi Uniti',
      documents: 'Entry into the Emirates only requires a passport with a minimum validity of 6 months. No visa is needed for EU citizens for stays up to 90 days.',
      timeZone: "The time difference is GMT+3, which is 3 hours ahead of Italian time (2 hours when daylight saving time is in effect).",
      currency: 'The Emirati Dirham (AED) is worth approximately €0.25. Major credit cards are accepted everywhere.',
      language: 'The official language is Arabic. English is understood and widely spoken in tourist areas.',
      climate: 'The climate in the United Arab Emirates is subtropical and arid. Rain is rare. The best time to visit is from October to April when temperatures are milder.',
      vaccinationsHealth: 'No mandatory vaccinations are required. Medicines are readily available in numerous pharmacies.'
    },
    content: 'Useful information for Abu Dhabi',
  }
];

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to', MONGO_URI);
    for (const item of seed) {
      const exists = await Document.findOne({ title: item.title }).lean();
      if (exists) {
        console.log('SKIP exists:', item.title);
        continue;
      }
      const created = await Document.create({ title: item.title, content: item.content, usefulInfo: item.usefulInfo, visible: true });
      console.log('CREATED:', created._id.toString(), item.title);
    }
    console.log('Seed complete');
  } catch (err) {
    console.error('Seed error', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
