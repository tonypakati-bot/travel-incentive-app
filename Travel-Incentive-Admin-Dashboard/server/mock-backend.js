import express from 'express';
import bodyParser from 'body-parser';
import { randomUUID } from 'crypto';

const app = express();
app.use(bodyParser.json());
// Simple CORS middleware so the frontend (different localhost port) can call this mock
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Provide a few minimal read endpoints used by the frontend to avoid 404s during dev
app.get('/api/invites', (req, res) => res.json([]));
app.get('/api/participants', (req, res) => res.json([]));
app.get('/api/forms', (req, res) => res.json([]));
app.get('/api/privacy-policies', (req, res) => res.json([]));
app.get('/api/terms-documents', (req, res) => res.json([]));
app.get('/api/contacts', (req, res) => res.json([]));
app.get('/api/useful-informations/summary', (req, res) => res.json({}));

const trips = new Map();

app.post('/api/trips', (req, res) => {
  const id = req.body.tripId || `trip-${Date.now()}`;
  const trip = { ...(req.body||{}), tripId: id, flights: [] };
  trips.set(String(id), trip);
  res.json(trip);
});

app.get('/api/trips/:id', (req, res) => {
  const t = trips.get(req.params.id) || null;
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json(t);
});

app.patch('/api/trips/:id', (req, res) => {
  const existing = trips.get(req.params.id) || {};
  const merged = { ...(existing||{}), ...(req.body||{}) };
  // normalize flights if provided
  if (Array.isArray(req.body.flights)) merged.flights = req.body.flights.map(f => ({ ...(f||{}), id: f.id || f._id || `f-${Date.now()}-${Math.random().toString(36).slice(2,6)}` }));
  trips.set(req.params.id, merged);
  res.json(merged);
});

app.post('/api/trips/:id/flights', (req, res) => {
  const t = trips.get(req.params.id) || { tripId: req.params.id, flights: [] };
  const id = req.body.id || randomUUID();
  const flight = { ...(req.body||{}), id };
  t.flights = (t.flights||[]).concat([flight]);
  trips.set(req.params.id, t);
  res.json({ ...flight, _id: id });
});

app.delete('/api/trips/:id/flights/:flightId', (req, res) => {
  const t = trips.get(req.params.id) || null;
  if (!t) return res.status(404).json({ error: 'not found' });
  t.flights = (t.flights||[]).filter(f => String(f.id) !== req.params.flightId && String(f._id) !== req.params.flightId);
  trips.set(req.params.id, t);
  res.json({ ok: true, flights: t.flights });
});

const port = process.env.PORT || 5001;
app.listen(port, () => console.log('Mock backend listening on', port));
