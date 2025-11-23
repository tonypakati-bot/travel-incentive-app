import express from 'express';
import TermsDocument from '../models/TermsDocument.js';

const router = express.Router();

// GET /api/terms-documents
router.get('/', async (req, res) => {
  try {
    const docs = await TermsDocument.find({}).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching terms documents' });
  }
});

// POST /api/terms-documents
router.post('/', async (req, res) => {
  try {
    const { title, content, trip, visible, author } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const created = await TermsDocument.create({ title, content: content || '', trip: trip || null, visible: visible !== undefined ? visible : true, author: author || '' });
    res.status(201).json({ id: created._id, title: created.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating terms document' });
  }
});

// GET /api/terms-documents/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await TermsDocument.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// PATCH /api/terms-documents/:id
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const p = await TermsDocument.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// DELETE /api/terms-documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const p = await TermsDocument.findByIdAndDelete(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

export default router;
