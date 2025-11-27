import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';
const API_BASE = process.env.API_BASE || '/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function run() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const users = db.collection('users');
  const user = await users.findOne();
  if (!user) {
    console.error('No user found in DB to generate token');
    process.exit(1);
  }
  const token = jwt.sign({ user: { id: user._id.toString() } }, JWT_SECRET, { expiresIn: '1h' });
  console.log('Using user id:', user._id.toString());

  // Get current trip
  let res = await fetch(`${API_BASE}/trip`, { headers: { Authorization: `Bearer ${token}` } });
  let trip = await res.json();
  console.log('Before update, allowCompanion:', trip.eventDetails?.allowCompanion);

  // Prepare payload: toggle allowCompanion to true
  const payload = { ...trip, eventDetails: { ...trip.eventDetails, allowCompanion: true } };

  res = await fetch(`${API_BASE}/trip`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const updated = await res.json();
  console.log('Update response eventDetails.allowCompanion:', updated.eventDetails?.allowCompanion);

  // Re-fetch trip
  res = await fetch(`${API_BASE}/trip`, { headers: { Authorization: `Bearer ${token}` } });
  trip = await res.json();
  console.log('After update, allowCompanion:', trip.eventDetails?.allowCompanion);

  await client.close();
}

run().catch(err => { console.error(err); process.exit(1); });
