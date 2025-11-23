import express from 'express';
import PrivacyPolicy from '../models/PrivacyPolicy.js';

const router = express.Router();

// GET /api/privacy-policies
router.get('/', async (req, res) => {
  try {
    const policies = await PrivacyPolicy.find({}).sort({ createdAt: -1 }).lean();
    res.json(policies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching privacy policies' });
  }
});

// POST /api/privacy-policies
router.post('/', async (req, res) => {
  try {
    const { title, content, trip, visible, author } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const created = await PrivacyPolicy.create({ title, content: content || '', trip: trip || null, visible: visible !== undefined ? visible : true, author: author || '' });
    res.status(201).json({ id: created._id, title: created.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating privacy policy' });
  }
});

// GET /api/privacy-policies/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await PrivacyPolicy.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// PATCH /api/privacy-policies/:id
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const p = await PrivacyPolicy.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// DELETE /api/privacy-policies/:id
router.delete('/:id', async (req, res) => {
  try {
    const p = await PrivacyPolicy.findByIdAndDelete(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

export default router;
