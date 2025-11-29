import express from 'express';
import Document from '../models/Document.js';
import UsefulInfo from '../models/UsefulInfo.js';

const router = express.Router();

// GET /api/useful-informations
router.get('/', async (req, res) => {
  try {
    // support pagination and search
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '20', 10));
    const q = req.query.q ? String(req.query.q).trim() : null;
    const filter = { 'usefulInfo.destinationName': { $exists: true } };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { 'usefulInfo.destinationName': { $regex: q, $options: 'i' } },
      ];
    }
    const total = await UsefulInfo.countDocuments(filter);
    const docs = await UsefulInfo.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    res.json({ items: docs, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching useful informations' });
  }
});

// GET /api/useful-informations/summary
router.get('/summary', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '50', 10));
    const q = req.query.q ? String(req.query.q).trim() : null;
    const filter = { 'usefulInfo.destinationName': { $exists: true } };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { 'usefulInfo.destinationName': { $regex: q, $options: 'i' } },
      ];
    }
    const total = await UsefulInfo.countDocuments(filter);
    const docs = await UsefulInfo.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('_id title createdAt').lean();
    const mapped = docs.map(d => ({ id: d._id, title: d.title, createdAt: d.createdAt }));
    res.json({ items: mapped, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching summary' });
  }
});

// POST /api/useful-informations
router.post('/', async (req, res) => {
  try {
    const { title, usefulInfo, content, visible, author } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const created = await UsefulInfo.create({ title, slug, content: content || '', usefulInfo: usefulInfo || {}, visible: visible !== undefined ? visible : true, author: author || '' });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating useful information' });
  }
});

// GET /api/useful-informations/:id (only ObjectId-like ids)
router.get('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const d = await UsefulInfo.findById(req.params.id).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json(d);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// PATCH /api/useful-informations/:id (only ObjectId-like ids)
router.patch('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const updates = req.body;
    const d = await UsefulInfo.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json(d);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

// DELETE /api/useful-informations/:id (only ObjectId-like ids)
router.delete('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const d = await UsefulInfo.findByIdAndDelete(req.params.id).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error' });
  }
});

export default router;

