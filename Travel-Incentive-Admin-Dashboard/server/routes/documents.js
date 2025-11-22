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

export default router;
