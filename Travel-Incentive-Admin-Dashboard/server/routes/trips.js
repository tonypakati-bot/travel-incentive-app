import express from 'express';
import Trip from '../models/Trip.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { clientName, name, subtitle, description, startDate, endDate, status='draft', settings } = req.body;
    if (!clientName || !name || !startDate || !endDate) return res.status(400).json({ error: 'Missing required fields' });

    const key = { name: name.trim(), startDate: new Date(startDate) };
    let trip = await Trip.findOne(key);
    if (trip) {
      if (trip.status !== 'published') {
        trip.subtitle = subtitle ?? trip.subtitle;
        trip.description = description ?? trip.description;
        trip.settings = { ...(trip.settings || {}), ...(settings || {}) };
        trip.endDate = new Date(endDate);
        trip.clientName = clientName;
        await trip.save();
      }
      return res.json({ tripId: trip._id, ...trip.toObject() });
    }

    trip = await Trip.create({ clientName, name, subtitle, description, startDate: new Date(startDate), endDate: new Date(endDate), status, settings });
    return res.status(201).json({ tripId: trip._id, ...trip.toObject() });
  } catch (err) {
    if (err.code === 11000) {
      const trip = await Trip.findOne({ name: req.body.name.trim(), startDate: new Date(req.body.startDate) });
      if (trip) return res.json({ tripId: trip._id, ...trip.toObject() });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json(trip);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
