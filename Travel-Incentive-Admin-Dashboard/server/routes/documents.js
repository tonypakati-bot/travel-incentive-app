import express from 'express';
import Document from '../models/Document.js';

const router = express.Router();

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const docs = await Document.find({}).sort({ createdAt: -1 }).lean();
    // map to lightweight options
    const options = docs.map(d => ({ id: d._id, title: d.title, value: d._id, label: d.title }));
    res.json(options);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// POST /api/documents
router.post('/', async (req, res) => {
  try {
    const { title, content, usefulInfo, visible, author } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const created = await Document.create({ title, slug, content: content || '', usefulInfo: usefulInfo || {}, visible: visible !== undefined ? visible : true, author: author || '' });
    res.status(201).json({ id: created._id, title: created.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating document' });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const d = await Document.findById(req.params.id).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json(d);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// PATCH /api/documents/:id
router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const d = await Document.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json(d);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const d = await Document.findByIdAndDelete(req.params.id).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

export default router;
