import express from 'express';
import Participant from '../models/Participant.js';
const router = express.Router();

import mongoose from 'mongoose';

router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Invalid id' });
  next();
});

router.get('/', async (req, res) => {
  const participants = await Participant.find();
  res.json(participants);
});

router.post('/', async (req, res) => {
  const payload = { ...req.body };
  delete payload._id;
  delete payload.id;
  console.debug('[participants] create payload received:', JSON.stringify(payload));
  // Backwards-compat: if client provided `name` but not firstName/lastName, split it
  if (!payload.firstName && !payload.lastName) {
    // Try common alternatives
    const candidate = payload.name || payload.fullName || payload.displayName || payload.nome || payload['Nome Cognome'] || '';
    if (candidate) {
      const tokens = String(candidate).trim().split(/\s+/);
      payload.lastName = tokens.length > 1 ? tokens.pop() : '';
      payload.firstName = tokens.join(' ');
    }
  }
  // Validation: require both firstName and lastName
  if (!payload.firstName || !payload.lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required' });
  }
  const created = await Participant.create(payload);
  res.status(201).json(created);
});

router.put('/:id', async (req, res) => {
  const payload = { ...req.body };
  delete payload._id;
  delete payload.id;
  // Backwards-compat split
  if (!payload.firstName && !payload.lastName) {
    const candidate = payload.name || payload.fullName || payload.displayName || payload.nome || payload['Nome Cognome'] || '';
    if (candidate) {
      const tokens = String(candidate).trim().split(/\s+/);
      payload.lastName = tokens.length > 1 ? tokens.pop() : '';
      payload.firstName = tokens.join(' ');
    }
  }
  // Validation: require both firstName and lastName
  if (!payload.firstName || !payload.lastName) {
    return res.status(400).json({ error: 'firstName and lastName are required' });
  }
  const updated = await Participant.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await Participant.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// Bulk update status by tripName
router.post('/update-status', async (req, res) => {
  const { tripName, status } = req.body;
  if (!tripName || !status) return res.status(400).json({ error: 'Missing params' });
  try {
    const result = await Participant.updateMany({ trip: tripName }, { $set: { status } });
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('update-status error', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;
