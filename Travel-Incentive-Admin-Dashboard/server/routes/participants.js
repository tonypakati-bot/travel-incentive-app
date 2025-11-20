import express from 'express';
import Participant from '../models/Participant.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const participants = await Participant.find();
  res.json(participants);
});

router.post('/', async (req, res) => {
  const payload = { ...req.body };
  delete payload._id;
  delete payload.id;
  const created = await Participant.create(payload);
  res.status(201).json(created);
});

router.put('/:id', async (req, res) => {
  const payload = { ...req.body };
  delete payload._id;
  delete payload.id;
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
