import PrivacyPolicy from '../models/PrivacyPolicy.mjs';

export const listPrivacyPolicies = async (req, res) => {
  try {
    const docs = await PrivacyPolicy.find({}).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    console.error('Error listing privacy policies', err);
    res.status(500).json({ error: 'error' });
  }
};

export const createPrivacyPolicy = async (req, res) => {
  try {
    const { title, content, tripId, visible } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const created = await PrivacyPolicy.create({ title, content: content || '', tripId: tripId ?? null, visible: visible !== undefined ? visible : true });
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating privacy policy', err);
    res.status(500).json({ error: 'error' });
  }
};

export const getPrivacyPolicy = async (req, res) => {
  try {
    const d = await PrivacyPolicy.findById(req.params.id).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json(d);
  } catch (err) {
    console.error('Error reading privacy policy', err);
    res.status(500).json({ error: 'error' });
  }
};

export const updatePrivacyPolicy = async (req, res) => {
  try {
    const updates = req.body;
    const d = await PrivacyPolicy.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json(d);
  } catch (err) {
    console.error('Error updating privacy policy', err);
    res.status(500).json({ error: 'error' });
  }
};

export const deletePrivacyPolicy = async (req, res) => {
  try {
    const d = await PrivacyPolicy.findByIdAndDelete(req.params.id).lean();
    if (!d) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting privacy policy', err);
    res.status(500).json({ error: 'error' });
  }
};
