import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invite from './models/Invite.js';
import Participant from './models/Participant.js';

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
