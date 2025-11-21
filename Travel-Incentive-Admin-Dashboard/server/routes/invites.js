import express from 'express';
import Invite from '../models/Invite.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const invites = await Invite.find().sort({ lastModified: -1 });
  res.json(invites);
});

router.post('/', async (req, res) => {
  const payload = { ...req.body };
  delete payload._id;
  delete payload.id;
  const created = await Invite.create(payload);
  res.status(201).json(created);
});

router.put('/:id', async (req, res) => {
  const payload = { ...req.body };
  delete payload._id;
  delete payload.id;
  const updated = await Invite.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await Invite.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

export default router;
