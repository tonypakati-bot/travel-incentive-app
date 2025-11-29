import express from 'express';
import Form from '../models/Form.js';

const router = express.Router();

import mongoose from 'mongoose';

router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Invalid id' });
  next();
});

// List forms (supports ?page & ?limit)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Form.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Form.countDocuments(),
    ]);
    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error('Error listing forms', err);
    return res.status(500).json({ error: 'Failed to list forms' });
  }
});

// Get form by id
router.get('/:id', async (req, res) => {
  try {
    const f = await Form.findById(req.params.id).lean();
    if (!f) return res.status(404).json({ error: 'Not found' });
    return res.json(f);
  } catch (err) {
    console.error('Error getting form', err);
    return res.status(500).json({ error: 'Failed to get form' });
  }
});

// Create form
router.post('/', async (req, res) => {
  try {
    const { title, description, sections, status, visible, author, slug } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const doc = await Form.create({ title: title.trim(), description: description || '', sections: sections || [], status: status || 'draft', visible: !!visible, author: author || '', slug: slug || undefined });
    return res.status(201).json(doc);
  } catch (err) {
    console.error('Error creating form', err);
    return res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form
router.patch('/:id', async (req, res) => {
  try {
    const payload = req.body || {};
    const updated = await Form.findByIdAndUpdate(req.params.id, payload, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (err) {
    console.error('Error updating form', err);
    return res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Form.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting form', err);
    return res.status(500).json({ error: 'Failed to delete form' });
  }
});

export default router;
