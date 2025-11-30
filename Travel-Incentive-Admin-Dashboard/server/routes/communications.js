import express from 'express';
import mongoose from 'mongoose';
import Communication from '../models/Communication.js';
import Trip from '../models/Trip.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Communication.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ items, total: items.length });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const { tripId, group='all', type='information', title, message, createdBy } = body;
    if (!tripId || !title || !message) return res.status(400).json({ error: 'Missing required fields' });
    // validate tripId
    if (!mongoose.Types.ObjectId.isValid(String(tripId))) return res.status(400).json({ error: 'Invalid tripId' });
    const trip = await Trip.findById(tripId).lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const comm = await Communication.create({ tripId, tripName: trip.name, group, type, title, message, createdBy, sentAt: new Date() });
    return res.status(201).json(comm);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Invalid id' });
    const body = req.body || {};
    const allowed = ['group','type','title','message','sentAt'];
    const set = {};
    for (const k of allowed) if (k in body) set[k] = body[k];
    if (Object.keys(set).length === 0) return res.status(400).json({ error: 'No updatable fields provided' });
    const updated = await Communication.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Invalid id' });
    const deleted = await Communication.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    return res.json({ deletedId: deleted._id });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

export default router;
