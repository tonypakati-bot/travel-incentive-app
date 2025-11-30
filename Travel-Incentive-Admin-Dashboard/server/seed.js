import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invite from './models/Invite.js';
import Participant from './models/Participant.js';
import Trip from './models/Trip.js';
import Communication from './models/Communication.js';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-admin';

const invites = [
  { tripName: 'Sales Kick-off Dubai', sender: 'Team Eventi', subject: 'Invito Esclusivo: Sales Kick-off 2026', body: 'Gentile Collega,\n\nSiamo lieti di invitarti al Sales Kick-off 2026...', status: 'Ready' },
  { tripName: 'Trip to Ibiza', sender: 'HR Department', subject: 'Your Ticket to Ibiza!', body: 'Hola!\n\nGet ready for an amazing trip to Ibiza...', status: 'Draft' }
];

const participants = [
  { firstName: 'Marco', lastName: 'Gialli', name: 'Marco Gialli', email: 'm.gialli@example.com', trip: 'Sales Kick-off Dubai', group: 'Milano', status: 'To Invite' },
  { firstName: 'Paolo', lastName: 'Verdi', name: 'Paolo Verdi', email: 'p.verdi@example.com', trip: 'Sales Kick-off Dubai', group: 'VIP', status: 'Invited' },
  { firstName: 'Luca', lastName: 'Azzurri', name: 'Luca Azzurri', email: 'l.azzurri@example.com', trip: 'Team Retreat Mykonos', group: 'Tutti', status: 'Registered' }
];

const contacts = [
  { name: 'Mario Rossi', category: 'Tour Leader', email: 'm.rossi@example.com', phone: '+390123456' },
  { name: 'Laura Verdi', category: 'Assistenza Aeroportuale', email: 'l.verdi@example.com', phone: '+390987654' },
  { name: 'Giuseppe Bianchi', category: 'Assistenza Hotel', email: 'g.bianchi@example.com', phone: '+390333222' }
];

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Mongo for seeding');
  await Invite.deleteMany({});
  await Participant.deleteMany({});
  await Invite.insertMany(invites);
  await Participant.insertMany(participants);
  // ensure trips exist and have settings.groups for testing
  try {
    const trips = await Trip.find({}).lean();
    if (!trips || trips.length === 0) {
      // create sample trips
      await Trip.create({ clientName: 'ACME', name: 'Sales Kick-off Dubai', startDate: new Date(), endDate: new Date(Date.now()+1000*60*60*24*3), status: 'published', settings: { groups: ['Milano','Roma'] } });
      await Trip.create({ clientName: 'ACME', name: 'Trip to Ibiza', startDate: new Date(), endDate: new Date(Date.now()+1000*60*60*24*2), status: 'published', settings: { groups: ['VIP','Tutti'] } });
      await Trip.create({ clientName: 'ACME', name: 'Team Retreat Mykonos', startDate: new Date(), endDate: new Date(Date.now()+1000*60*60*24*5), status: 'published', settings: { groups: ['Milano','Venezia'] } });
      console.log('Seeded sample trips');
    } else {
      // ensure groups key exists
      for (const t of trips) {
        if (!t.settings || !Array.isArray(t.settings.groups) || t.settings.groups.length === 0) {
          await Trip.findByIdAndUpdate(t._id, { $set: { 'settings.groups': ['All'] } });
        }
      }
    }
    // seed a sample communication
    await Communication.deleteMany({});
    const someTrip = await Trip.findOne({}).lean();
    if (someTrip) {
      await Communication.create({ tripId: someTrip._id, tripName: someTrip.name, group: 'all', type: 'information', title: 'Welcome', message: 'Benvenuti al viaggio!', createdBy: 'seed' });
      console.log('Seeded sample communication');
    }
  } catch (e) {
    console.warn('Trip/Communication seeding skipped', e.message);
  }
  // seed contacts if model exists
  try {
    const Contact = (await import('./models/Contact.js')).default;
    await Contact.deleteMany({});
    await Contact.insertMany(contacts);
    console.log('Seeded contacts');
  } catch (e) {
    console.warn('Contact model not available for seeding', e.message);
  }
  console.log('Seed complete');
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
