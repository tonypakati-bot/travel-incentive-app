import express from 'express';
import Trip from '../models/Trip.js';
import Contact from '../models/Contact.js';

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
    const payload = { ...(req.body || {}) };

    if (Array.isArray(payload.emergencyContacts)) {
      // fetch current trip to validate groups
      const currentTrip = await Trip.findById(req.params.id).lean();
      const allowedGroups = (currentTrip && currentTrip.settings && Array.isArray(currentTrip.settings.groups)) ? currentTrip.settings.groups : [];

      const cleaned = [];
      for (const ec of payload.emergencyContacts) {
        if (!ec) continue;
        if (!ec.contactId && !ec.contactName) continue;

        const denorm = { group: ec.group };

        if (ec.contactId) {
          try {
            const contact = await Contact.findById(ec.contactId).lean();
            if (!contact) continue; // invalid contactId
            denorm.contactId = contact._id;
            denorm.contactName = contact.name;
            denorm.contactCategory = contact.category;
          } catch (e) {
            continue; // invalid id format
          }
        } else {
          denorm.contactName = ec.contactName;
          denorm.contactCategory = ec.contactCategory;
        }

        if (denorm.group && allowedGroups.length && !allowedGroups.includes(denorm.group)) {
          continue;
        }

        denorm.addedAt = ec.addedAt ? new Date(ec.addedAt) : new Date();
        cleaned.push(denorm);
      }

      payload.emergencyContacts = cleaned;
    }

      // handle flights array if provided: validate minimal shape and normalize
      if (Array.isArray(payload.flights)) {
        const cleanedFlights = [];
        for (const f of payload.flights) {
          if (!f || !f.direction) continue;
          const dir = String(f.direction);
          if (dir !== 'andata' && dir !== 'ritorno') continue;
          cleanedFlights.push({
            direction: dir,
            title: f.title || undefined,
            notes: f.notes || undefined,
            group: f.group || undefined,
            airline: f.airline || undefined,
            flightNumber: f.flightNumber || undefined,
            from: f.from || undefined,
            to: f.to || undefined,
            date: f.date || undefined,
            timeDeparture: f.timeDeparture || undefined,
            timeArrival: f.timeArrival || undefined
          });
        }
        payload.flights = cleanedFlights;
      }

      // flightsMeta: accept object if provided
      if (payload.flightsMeta && typeof payload.flightsMeta === 'object') {
        payload.flightsMeta = {
          andataTitle: payload.flightsMeta.andataTitle || undefined,
          andataNotes: payload.flightsMeta.andataNotes || undefined,
          ritornoTitle: payload.flightsMeta.ritornoTitle || undefined,
          ritornoNotes: payload.flightsMeta.ritornoNotes || undefined
        };
      }

      // agenda: validate shape and normalize
      if (Array.isArray(payload.agenda)) {
        const cleanedAgenda = [];
        for (const day of payload.agenda) {
          if (!day) continue;
          const dday = { day: typeof day.day === 'number' ? day.day : undefined, title: day.title || undefined, date: day.date || undefined };
          dday.items = [];
          if (Array.isArray(day.items)) {
            for (const it of day.items) {
              if (!it) continue;
              dday.items.push({
                category: it.category || undefined,
                time: it.time || undefined,
                title: it.title || undefined,
                description: it.description || undefined,
                targetAirports: Array.isArray(it.targetAirports) ? it.targetAirports.map(String) : undefined,
                details: Array.isArray(it.details) ? it.details : undefined
              });
            }
          }
          cleanedAgenda.push(dday);
        }
        payload.agenda = cleanedAgenda;
      }

    const trip = await Trip.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json(trip);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json(trip);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Flights CRUD endpoints (atomic operations on Trip.flights array)
// Create: POST /api/trips/:tripId/flights
// List:   GET  /api/trips/:tripId/flights
// Get:    GET  /api/trips/:tripId/flights/:flightId
// Update: PUT  /api/trips/:tripId/flights/:flightId
// Delete: DELETE /api/trips/:tripId/flights/:flightId

router.get('/:tripId/flights', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).lean();
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json({ flights: trip.flights || [] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.get('/:tripId/flights/:flightId', async (req, res) => {
  try {
    const { tripId, flightId } = req.params;
    if (!tripId || !flightId) return res.status(400).json({ error: 'Missing ids' });
    const trip = await Trip.findById(tripId).lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const flight = (trip.flights || []).find(f => String(f._id) === String(flightId));
    if (!flight) return res.status(404).json({ error: 'Flight not found' });
    return res.json(flight);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/:tripId/flights', async (req, res) => {
  try {
    const { tripId } = req.params;
    const body = req.body || {};
    if (!tripId) return res.status(400).json({ error: 'Missing tripId' });
    const direction = body.direction && String(body.direction);
    if (!direction || (direction !== 'andata' && direction !== 'ritorno')) return res.status(400).json({ error: 'Invalid or missing direction' });

    const flightObj = {
      direction,
      title: body.title || undefined,
      notes: body.notes || undefined,
      group: body.group || undefined,
      airline: body.airline || undefined,
      flightNumber: body.flightNumber || undefined,
      from: body.from || undefined,
      to: body.to || undefined,
      date: body.date || undefined,
      timeDeparture: body.timeDeparture || undefined,
      timeArrival: body.timeArrival || undefined
    };

    const updated = await Trip.findByIdAndUpdate(tripId, { $push: { flights: flightObj } }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    const created = (updated.flights && updated.flights.length) ? updated.flights[updated.flights.length - 1] : null;
    return res.status(201).json(created || updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.put('/:tripId/flights/:flightId', async (req, res) => {
  try {
    const { tripId, flightId } = req.params;
    if (!tripId || !flightId) return res.status(400).json({ error: 'Missing ids' });
    const body = req.body || {};
    // only allow a whitelist of fields to be set
    const allowed = ['direction','title','notes','group','airline','flightNumber','from','to','date','timeDeparture','timeArrival'];
    const setObj = {};
    for (const k of allowed) if (k in body) setObj[`flights.$[f].${k}`] = body[k];
    if (Object.keys(setObj).length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    const resUpdate = await Trip.updateOne({ _id: tripId }, { $set: setObj }, { arrayFilters: [{ 'f._id': flightId }], runValidators: true });
    if (resUpdate.matchedCount === 0 && resUpdate.modifiedCount === 0) {
      // check existence
      const trip = await Trip.findById(tripId).lean();
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
      const flight = (trip.flights || []).find(f => String(f._id) === String(flightId));
      if (!flight) return res.status(404).json({ error: 'Flight not found' });
    }
    // return updated flight
    const tripAfter = await Trip.findById(tripId).lean();
    const updatedFlight = (tripAfter.flights || []).find(f => String(f._id) === String(flightId));
    return res.json(updatedFlight);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:tripId/flights/:flightId', async (req, res) => {
  try {
    const { tripId, flightId } = req.params;
    if (!tripId || !flightId) return res.status(400).json({ error: 'Missing ids' });
    const updated = await Trip.findByIdAndUpdate(tripId, { $pull: { flights: { _id: flightId } } }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    return res.json({ flights: updated.flights || [] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

// --- Agenda CRUD endpoints (atomic operations on Trip.agenda)
// Add day: POST /api/trips/:tripId/agenda
// Add item to day: POST /api/trips/:tripId/agenda/:dayIndex/items
// List agenda: GET /api/trips/:tripId/agenda
// Get single item: GET /api/trips/:tripId/agenda/:dayIndex/items/:itemIndex
// Update item: PUT /api/trips/:tripId/agenda/:dayIndex/items/:itemIndex
// Delete item: DELETE /api/trips/:tripId/agenda/:dayIndex/items/:itemIndex
// Delete day: DELETE /api/trips/:tripId/agenda/:dayIndex

router.get('/:tripId/agenda', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).lean();
    if (!trip) return res.status(404).json({ error: 'Not found' });
    return res.json({ agenda: trip.agenda || [] });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/:tripId/agenda', async (req, res) => {
  try {
    const { tripId } = req.params;
    const body = req.body || {};
    // create a new day; accept optional day, title, date
    const dayObj = { day: body.day || undefined, title: body.title || undefined, date: body.date || undefined, items: Array.isArray(body.items) ? body.items : [] };
    const updated = await Trip.findByIdAndUpdate(tripId, { $push: { agenda: dayObj } }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    const created = (updated.agenda && updated.agenda.length) ? updated.agenda[updated.agenda.length - 1] : null;
    return res.status(201).json(created || updated);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:tripId/agenda/:dayIndex', async (req, res) => {
  try {
    const { tripId, dayIndex } = req.params;
    const idx = Number(dayIndex);
    if (Number.isNaN(idx)) return res.status(400).json({ error: 'Invalid dayIndex' });
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!Array.isArray(trip.agenda) || idx < 0 || idx >= trip.agenda.length) return res.status(404).json({ error: 'Day not found' });
    trip.agenda.splice(idx, 1);
    await trip.save();
    return res.json({ agenda: trip.agenda });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.post('/:tripId/agenda/:dayIndex/items', async (req, res) => {
  try {
    const { tripId, dayIndex } = req.params;
    const idx = Number(dayIndex);
    const body = req.body || {};
    const item = {
      time: body.time || undefined,
      category: body.category || undefined,
      title: body.title || undefined,
      description: body.description || undefined,
      longDescription: body.longDescription || undefined,
      images: Array.isArray(body.images) ? body.images : [],
      imageCaption: body.imageCaption || undefined,
      details: Array.isArray(body.details) ? body.details : []
    };
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!Array.isArray(trip.agenda)) trip.agenda = [];
    if (idx < 0 || idx > trip.agenda.length) return res.status(400).json({ error: 'Invalid dayIndex' });
    // if exact position exists, push into its items; else if idx === length, create new day
    if (idx === trip.agenda.length) {
      trip.agenda.push({ day: idx+1, title: undefined, date: undefined, items: [item] });
    } else {
      if (!Array.isArray(trip.agenda[idx].items)) trip.agenda[idx].items = [];
      trip.agenda[idx].items.push(item);
    }
    await trip.save();
    const created = (trip.agenda[idx] && trip.agenda[idx].items.length) ? trip.agenda[idx].items[trip.agenda[idx].items.length-1] : null;
    return res.status(201).json(created || trip);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.get('/:tripId/agenda/:dayIndex/items/:itemIndex', async (req, res) => {
  try {
    const { tripId, dayIndex, itemIndex } = req.params;
    const di = Number(dayIndex), ii = Number(itemIndex);
    if (Number.isNaN(di) || Number.isNaN(ii)) return res.status(400).json({ error: 'Invalid indexes' });
    const trip = await Trip.findById(tripId).lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!Array.isArray(trip.agenda) || di < 0 || di >= trip.agenda.length) return res.status(404).json({ error: 'Day not found' });
    const day = trip.agenda[di];
    if (!Array.isArray(day.items) || ii < 0 || ii >= day.items.length) return res.status(404).json({ error: 'Item not found' });
    return res.json(day.items[ii]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.put('/:tripId/agenda/:dayIndex/items/:itemIndex', async (req, res) => {
  try {
    const { tripId, dayIndex, itemIndex } = req.params;
    const di = Number(dayIndex), ii = Number(itemIndex);
    const body = req.body || {};
    if (Number.isNaN(di) || Number.isNaN(ii)) return res.status(400).json({ error: 'Invalid indexes' });
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!Array.isArray(trip.agenda) || di < 0 || di >= trip.agenda.length) return res.status(404).json({ error: 'Day not found' });
    const day = trip.agenda[di];
    if (!Array.isArray(day.items) || ii < 0 || ii >= day.items.length) return res.status(404).json({ error: 'Item not found' });
    const allowed = ['time','category','title','description','longDescription','images','imageCaption','details'];
    for (const k of allowed) if (k in body) day.items[ii][k] = body[k];
    await trip.save();
    return res.json(day.items[ii]);
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:tripId/agenda/:dayIndex/items/:itemIndex', async (req, res) => {
  try {
    const { tripId, dayIndex, itemIndex } = req.params;
    const di = Number(dayIndex), ii = Number(itemIndex);
    if (Number.isNaN(di) || Number.isNaN(ii)) return res.status(400).json({ error: 'Invalid indexes' });
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!Array.isArray(trip.agenda) || di < 0 || di >= trip.agenda.length) return res.status(404).json({ error: 'Day not found' });
    const day = trip.agenda[di];
    if (!Array.isArray(day.items) || ii < 0 || ii >= day.items.length) return res.status(404).json({ error: 'Item not found' });
    day.items.splice(ii,1);
    await trip.save();
    return res.json({ agenda: trip.agenda });
  } catch (err) { console.error(err); return res.status(500).json({ error: 'Server error' }); }
});

export default router;
