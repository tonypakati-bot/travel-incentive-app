import express from 'express';
import Contact from '../models/Contact.js';
import Trip from '../models/Trip.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ name: 1 }).lean();
    return res.json(contacts.map(c => ({ id: c._id, name: c.name, category: c.category, email: c.email || '', phone: c.phone || '', notes: c.notes || '' })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).lean();
    if (!contact) return res.status(404).json({ error: 'Not found' });
    return res.json({ id: contact._id, name: contact.name, category: contact.category, email: contact.email || '', phone: contact.phone || '', notes: contact.notes || '' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, name, category, email, phone, notes } = req.body;
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    if (!fullName) return res.status(400).json({ error: 'Missing name' });
    const contact = await Contact.create({ name: fullName, category, email, phone, notes });
    return res.status(201).json({ id: contact._id, name: contact.name, category: contact.category, email: contact.email, phone: contact.phone, notes: contact.notes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...(req.body || {}) };
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    // normalize name if firstName/lastName provided
    if (updates.firstName || updates.lastName) {
      contact.name = `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
    }
    if (updates.name) contact.name = updates.name;
    if (updates.category !== undefined) contact.category = updates.category;
    if (updates.email !== undefined) contact.email = updates.email;
    if (updates.phone !== undefined) contact.phone = updates.phone;
    if (updates.notes !== undefined) contact.notes = updates.notes;
    await contact.save();
    // propagate denormalized fields into any Trip.emergencyContacts entries
    try {
      const propRes = await Trip.updateMany(
        { 'emergencyContacts.contactId': contact._id },
        {
          $set: {
            'emergencyContacts.$[elem].contactName': contact.name,
            'emergencyContacts.$[elem].contactCategory': contact.category
          }
        },
        { arrayFilters: [{ 'elem.contactId': contact._id }] }
      );
      console.log('Contact propagation result:', propRes);
    } catch (e) {
      console.error('Failed to propagate contact update to trips', e);
    }

    return res.json({ id: contact._id, name: contact.name, category: contact.category, email: contact.email, phone: contact.phone, notes: contact.notes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
