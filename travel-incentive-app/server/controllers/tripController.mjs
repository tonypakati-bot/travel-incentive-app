// Restituisce la registrazione dell'utente loggato
export const getUserRegistration = async (req, res) => {
  try {
    const eventId = new mongoose.Types.ObjectId(process.env.DEFAULT_EVENT_ID || '000000000000000000000000');
    const registration = await Registration.findOne({ userId: req.user.id, eventId });
    if (!registration) {
      return res.status(404).json({ message: 'Nessuna registrazione trovata' });
    }
    res.json(registration);
  } catch (err) {
    console.error('Errore getUserRegistration:', err);
    res.status(500).json({ message: 'Errore nel recupero della registrazione', error: err.message });
  }
};
import Trip from '../models/Trip.mjs';
import TravelInfo from '../models/TravelInfo.mjs';
import Registration from '../models/Registration.mjs';
import mongoose from 'mongoose';

// Get Trip Data
export const getTripData = async (req, res) => {
  try {
    console.log('getTripData called');
    const tripData = await Trip.findOne();
    console.log('Trip data found:', !!tripData);
    res.json(tripData);
  } catch (err) {
    console.error('Error in getTripData:', err);
    res.status(500).send('Server Error');
  }
};

// Get Travel Info
export const getTravelInfo = async (req, res) => {
  try {
    const travelInfo = await TravelInfo.findOne();
    res.json(travelInfo);
  } catch (err) {
    // Log full error (message + stack) to console so developer can see root cause
    try {
      console.error('updateTripData error:', err);
      // also persist to a server errors log for post-mortem
      try {
        const fs = await import('fs');
        const { resolve } = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = resolve(__filename, '..');
        const out = JSON.stringify({ timestamp: new Date().toISOString(), error: { message: err.message, stack: err.stack } }) + '\n';
        fs.appendFileSync(resolve(__dirname, '..', 'logs', 'server_errors.log'), out, { encoding: 'utf8' });
      } catch (e) {
        console.error('Failed to write server_errors.log', e);
      }
    } catch (e) {
      console.error('Failed to log error in updateTripData', e);
    }

    // Return helpful info in development mode, otherwise generic message
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ message: 'Server Error', error: err.message, stack: err.stack });
    }
    return res.status(500).send('Server Error');
  }
};

// Update Trip Data
export const updateTripData = async (req, res) => {
  try {
    console.log('updateTripData called - incoming eventDetails:', JSON.stringify(req.body && req.body.eventDetails ? { allowCompanion: req.body.eventDetails.allowCompanion, allowBusiness: req.body.eventDetails.allowBusiness, departureGroup: req.body.eventDetails.departureGroup } : req.body.eventDetails));

    const incoming = req.body || {};
    // If there's no existing trip, create or replace with incoming
    const existing = await Trip.findOne();
    if (!existing) {
      const created = await Trip.findOneAndUpdate({}, incoming, { new: true, upsert: true });
      return res.json(created);
    }

    // Merge eventDetails defensively to avoid losing fields when client sends partial object
    if (incoming.eventDetails && typeof incoming.eventDetails === 'object') {
      const existingEvent = existing.eventDetails ? (existing.eventDetails.toObject ? existing.eventDetails.toObject() : existing.eventDetails) : {};
      const mergedEvent = { ...existingEvent };
      // Copy incoming keys but skip null values (they should not delete existing data)
      Object.keys(incoming.eventDetails).forEach((k) => {
        const v = incoming.eventDetails[k];
        if (v === null || typeof v === 'undefined') return; // ignore null/undefined to avoid accidental deletion
        // Handle specific typed fields
        if (k === 'departureGroup') {
          if (Array.isArray(v)) mergedEvent.departureGroup = v;
          else if (typeof v === 'string' && v.trim()) mergedEvent.departureGroup = [v.trim()];
          return;
        }
        if (k === 'allowCompanion' || k === 'allowBusiness') {
          if (typeof v === 'boolean') mergedEvent[k] = v; // only accept boolean values
          return;
        }
        // default shallow copy for other fields
        mergedEvent[k] = v;
      });
      // ensure boolean flags exist and default to false if missing
      if (typeof mergedEvent.allowCompanion === 'undefined') mergedEvent.allowCompanion = false;
      if (typeof mergedEvent.allowBusiness === 'undefined') mergedEvent.allowBusiness = false;
      existing.eventDetails = mergedEvent;
    }

      // Special merge for agenda: merge days and items defensively (preserve existing values unless explicitly overwritten)
      if (Array.isArray(incoming.agenda)) {
          const existing = await Trip.findOne();
        if (!existing) {
          const created = await Trip.findOneAndUpdate({}, incoming, { new: true, upsert: true });
          return res.json(created);
        }
          // Backup existing document before applying potentially destructive changes
          try {
            const raw = await Trip.collection.findOne({});
            await mongoose.connection.db.collection('trips_backups').insertOne({ backupAt: new Date(), doc: raw });
          } catch (e) {
            console.error('Failed to write trip backup:', e);
          }

        const existingAgenda = (existing.agenda || []).map(d => (d.toObject ? d.toObject() : d));
        const mergedAgenda = incoming.agenda.map((incDay, di) => {
          const dayNum = typeof incDay.day !== 'undefined' ? incDay.day : (di + 1);
          const foundDay = existingAgenda.find(d => d.day === dayNum) || {};
          const mergedDay = { ...foundDay };
          // merge top-level day fields
          if (typeof incDay.title !== 'undefined') mergedDay.title = incDay.title;
          if (typeof incDay.date !== 'undefined') mergedDay.date = incDay.date;

          // merge items
          const existingItems = (foundDay.items || []).map(i => (i.toObject ? i.toObject() : i));
          if (Array.isArray(incDay.items)) {
            // Start from existing items and merge incoming items into them by id.
            // Items without an id are treated as NEW and inserted at the incoming position (splice),
            // preserving existing items and their details.
            const mergedItems = existingItems.slice();
            let insertPos = 0;
            for (let ii = 0; ii < incDay.items.length; ii++) {
              const incItem = incDay.items[ii];
              const hasId = incItem && typeof incItem.id !== 'undefined';
              if (hasId) {
                const idx = mergedItems.findIndex(it => it.id === incItem.id);
                const base = idx !== -1 ? mergedItems[idx] : {};
                const result = { ...base };
                if (incItem && typeof incItem === 'object') {
                  Object.keys(incItem).forEach((k) => {
                    const v = incItem[k];
                    if (v === null || typeof v === 'undefined') return;
                    if (k === 'note' && typeof v === 'object') {
                      result.note = result.note || {};
                      Object.keys(v).forEach((nk) => {
                        const nv = v[nk];
                        if (nv === null || typeof nv === 'undefined') return;
                        result.note[nk] = nv;
                      });
                      return;
                    }
                    if (k === 'details' && Array.isArray(v)) {
                      const existingDetails = Array.isArray(result.details) ? result.details : [];
                      const merged = [...existingDetails];
                      v.forEach((newD) => {
                        const exists = merged.some((m) => JSON.stringify(m) === JSON.stringify(newD));
                        if (!exists) merged.push(newD);
                      });
                      result.details = merged;
                      return;
                    }
                    result[k] = v;
                  });
                }
                if (idx === -1) {
                  // not found: insert at current logical position
                  mergedItems.splice(insertPos, 0, result);
                  insertPos++;
                } else {
                  // replace existing
                  mergedItems[idx] = result;
                  // set insertPos just after replaced index to maintain order
                  insertPos = idx + 1;
                }
              } else {
                // No id: attempt heuristic match by title+time to find an existing item to merge with
                let matchedIndex = -1;
                if (incItem && incItem.title) {
                  const title = String(incItem.title).toLowerCase();
                  const timeVal = incItem.time ? String(incItem.time).toLowerCase() : '';
                  matchedIndex = mergedItems.findIndex((it) => {
                    if (!it) return false;
                    const itTitle = it.title ? String(it.title).toLowerCase() : '';
                    const itTime = it.time ? String(it.time).toLowerCase() : '';
                    return itTitle === title && itTime === timeVal;
                  });
                }
                if (matchedIndex !== -1) {
                  // merge into matched item
                  const base = mergedItems[matchedIndex] || {};
                  const result = { ...base };
                  if (incItem && typeof incItem === 'object') {
                    Object.keys(incItem).forEach((k) => {
                      const v = incItem[k];
                      if (v === null || typeof v === 'undefined') return;
                      if (k === 'note' && typeof v === 'object') {
                        result.note = result.note || {};
                        Object.keys(v).forEach((nk) => {
                          const nv = v[nk];
                          if (nv === null || typeof nv === 'undefined') return;
                          result.note[nk] = nv;
                        });
                        return;
                      }
                      if (k === 'details' && Array.isArray(v)) {
                        const existingDetails = Array.isArray(result.details) ? result.details : [];
                        const merged = [...existingDetails];
                        v.forEach((newD) => {
                          const exists = merged.some((m) => JSON.stringify(m) === JSON.stringify(newD));
                          if (!exists) merged.push(newD);
                        });
                        result.details = merged;
                        return;
                      }
                      result[k] = v;
                    });
                  }
                  mergedItems[matchedIndex] = result;
                  insertPos = matchedIndex + 1;
                } else {
                  // truly new: insert at current logical position
                  mergedItems.splice(insertPos, 0, incItem);
                  insertPos++;
                }
              }
            }
            mergedDay.items = mergedItems;
          } else {
            mergedDay.items = existingItems;
          }
          return mergedDay;
        });

        // Before applying mergedAgenda, detect any deletion of details[] to avoid accidental data loss.
        // If found, reject the update and return a 400 with diagnostics.
        try {
          const deletions = [];
          for (let di = 0; di < mergedAgenda.length; di++) {
            const newDay = mergedAgenda[di] || {};
            const dayNum = typeof newDay.day !== 'undefined' ? newDay.day : (di + 1);
            const oldDay = existingAgenda.find(d => d.day === dayNum) || {};
            const newItems = Array.isArray(newDay.items) ? newDay.items : [];
            const oldItems = Array.isArray(oldDay.items) ? oldDay.items : [];
            for (let ii = 0; ii < newItems.length; ii++) {
              const newIt = newItems[ii] || {};
              let oldIt = null;
              if (typeof newIt.id !== 'undefined') {
                oldIt = oldItems.find(it => it.id === newIt.id);
              }
              if (!oldIt) {
                // fallback: try match by title+time
                if (newIt && newIt.title) {
                  const title = String(newIt.title).toLowerCase();
                  const timeVal = newIt.time ? String(newIt.time).toLowerCase() : '';
                  oldIt = oldItems.find((it) => {
                    if (!it) return false;
                    const itTitle = it.title ? String(it.title).toLowerCase() : '';
                    const itTime = it.time ? String(it.time).toLowerCase() : '';
                    return itTitle === title && itTime === timeVal;
                  }) || null;
                }
              }
              const oldDetailsLen = oldIt && Array.isArray(oldIt.details) ? oldIt.details.length : 0;
              const newDetailsLen = Array.isArray(newIt.details) ? newIt.details.length : 0;
              if (oldDetailsLen > newDetailsLen) {
                deletions.push({ day: dayNum, idx: ii, id: newIt.id || (oldIt && oldIt.id), oldDetailsLen, newDetailsLen });
              }
            }
          }
          if (deletions.length > 0) {
            console.warn('Aborting agenda save because it would remove details on items:', deletions);
            return res.status(400).json({ message: 'Invalid agenda update: would remove existing details on some items', deletions });
          }
        } catch (e) { console.error('Error during pre-save deletion check', e); }

        // Debug logging: compare existing vs merged for details/note
        try {
          for (let di = 0; di < mergedAgenda.length; di++) {
            const newDay = mergedAgenda[di] || {};
            const oldDay = existingAgenda[di] || {};
            const newItems = Array.isArray(newDay.items) ? newDay.items : [];
            const oldItems = Array.isArray(oldDay.items) ? oldDay.items : [];
            for (let ii = 0; ii < newItems.length; ii++) {
              const newIt = newItems[ii] || {};
              const oldIt = oldItems[ii] || {};
              const oldDetailsLen = Array.isArray(oldIt.details) ? oldIt.details.length : 0;
              const newDetailsLen = Array.isArray(newIt.details) ? newIt.details.length : 0;
              if (oldDetailsLen !== newDetailsLen) {
                console.log(`Agenda merge change day=${di} itemIdx=${ii} id=${newIt.id || oldIt.id} details: ${oldDetailsLen} -> ${newDetailsLen}`);
              }
              const oldHasNote = !!oldIt.note;
              const newHasNote = !!newIt.note;
              if (oldHasNote !== newHasNote) {
                console.log(`Agenda merge note presence change day=${di} itemIdx=${ii} id=${newIt.id || oldIt.id} note: ${oldHasNote} -> ${newHasNote}`);
              }
            }
          }
        } catch (e) { console.error('Error during merge-diff logging', e); }
        // No runtime normalization: DB has been migrated to canonical details objects.

        existing.agenda = mergedAgenda;
        await existing.save();
        const refreshed = await Trip.findById(existing._id);
        return res.json(refreshed);
      }

    // Merge other top-level fields (shallow) but skip null/undefined to avoid accidental deletion
    Object.keys(incoming).forEach((key) => {
      if (key === 'eventDetails') return;
      const v = incoming[key];
      if (v === null || typeof v === 'undefined') return;
      existing[key] = v;
    });

    await existing.save();
    // Post-save: ensure boolean flags are present in the persisted document
  const ensure = {};
    if (typeof existing.eventDetails?.allowCompanion === 'undefined') ensure['eventDetails.allowCompanion'] = false;
    if (typeof existing.eventDetails?.allowBusiness === 'undefined') ensure['eventDetails.allowBusiness'] = false;
    if (Object.keys(ensure).length > 0) {
      await Trip.updateOne({ _id: existing._id }, { $set: ensure });
      // refresh existing
      const refreshed = await Trip.findById(existing._id);
      return res.json(refreshed);
    }
    res.json(existing);
  } catch (err) {
    // Log full error (message + stack) to console and persist to server_errors.log for post-mortem
    try {
      console.error('updateTripData error:', err);
      // also persist to a server errors log for post-mortem
      try {
        const fs = await import('fs');
        const { resolve } = await import('path');
        const { fileURLToPath } = await import('url');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = resolve(__filename, '..');
        const out = JSON.stringify({ timestamp: new Date().toISOString(), error: { message: err.message, stack: err.stack } }) + '\n';
        fs.appendFileSync(resolve(__dirname, '..', 'logs', 'server_errors.log'), out, { encoding: 'utf8' });
      } catch (e) {
        console.error('Failed to write server_errors.log', e);
      }
    } catch (e) {
      console.error('Failed to log error in updateTripData', e);
    }

    // Return helpful info in development mode, otherwise generic message
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({ message: 'Server Error', error: err.message, stack: err.stack });
    }
    return res.status(500).send('Server Error');
  }
};

// Update Travel Info
export const updateTravelInfo = async (req, res) => {
  try {
    const incoming = req.body || {};

    console.log('DBG updateTravelInfo - incoming.emergencyContacts:', JSON.stringify(incoming.emergencyContacts, null, 2));

    // If incoming contains emergencyContacts, do a safe merge by loading the document
    if (Array.isArray(incoming.emergencyContacts)) {
      const existing = await TravelInfo.findOne();
      if (!existing) {
        // no existing doc: create new with incoming merged
        const created = await TravelInfo.findOneAndUpdate({}, incoming, { new: true, upsert: true });
        console.log('DBG updateTravelInfo - created.emergencyContacts:', JSON.stringify(created.emergencyContacts, null, 2));
        return res.json(created);
      }

      const existingContacts = (existing.emergencyContacts || []).map(c => (c.toObject ? c.toObject() : c));
      const merged = incoming.emergencyContacts.map((inc) => {
        if (inc && inc.id) {
          const found = existingContacts.find((e) => e.id === inc.id);
          if (found) {
            // Merge defensively: do not overwrite existing values with null/undefined/empty-string
            const result = { ...found };
            Object.keys(inc).forEach((k) => {
              const v = inc[k];
              // skip null or undefined
              if (v === null || typeof v === 'undefined') return;
              // accetta stringa vuota: sovrascrive il valore precedente
              result[k] = v;
            });
            return result;
          }
        }
        return inc;
      });

      console.log('DBG updateTravelInfo - incoming.emergencyContacts:', JSON.stringify(incoming.emergencyContacts, null, 2));
      console.log('DBG updateTravelInfo - merged.emergencyContacts:', JSON.stringify(merged, null, 2));

      // apply merged contacts and other incoming top-level fields to existing doc
      existing.emergencyContacts = merged;
      // copy other top-level fields except _id and emergencyContacts
      Object.keys(incoming).forEach((k) => {
        if (k === 'emergencyContacts' || k === '_id') return;
        existing[k] = incoming[k];
      });

      const saved = await existing.save();
      console.log('DBG updateTravelInfo - saved.emergencyContacts:', JSON.stringify(saved.emergencyContacts, null, 2));
      try {
        const raw = await TravelInfo.collection.findOne({});
        console.log('DBG updateTravelInfo - raw collection doc:', JSON.stringify(raw, null, 2));
      } catch (e) {
        console.error('DBG updateTravelInfo - failed to read raw collection doc', e);
      }
      return res.json(saved);
    }

    // fallback: no emergencyContacts present, do a regular upsert
    const travelInfo = await TravelInfo.findOneAndUpdate({}, incoming, {
      new: true,
      upsert: true
    });
    return res.json(travelInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Add Announcement
export const addAnnouncement = async (req, res) => {
  try {
    const trip = await Trip.findOne();
    trip.announcements.unshift(req.body);
    await trip.save();
    res.json(trip.announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Submit registration
export const submitRegistration = async (req, res) => {
  try {
    const { outboundFlightId, returnFlightId, form_data, groupName } = req.body;

    // Log the request for debugging
    console.log('Registration request:', {
      userId: req.user.id,
      outboundFlightId,
      returnFlightId,
      groupName,
      form_data
    });

    // Aggiorna i dati dello user loggato
    const User = (await import('../models/User.mjs')).default;
    const userUpdate = {};
    if (form_data.firstName) userUpdate.firstName = form_data.firstName;
    if (form_data.lastName) userUpdate.lastName = form_data.lastName;
    if (form_data.email) userUpdate.email = form_data.email;
    if (form_data.mobilePhone) userUpdate.mobilePhone = form_data.mobilePhone;
    await User.findByIdAndUpdate(req.user.id, userUpdate, { new: true });

    // Cerca registrazione esistente
  const eventId = new mongoose.Types.ObjectId(process.env.DEFAULT_EVENT_ID || '000000000000000000000000');
  let registration = await Registration.findOne({ userId: req.user.id, eventId });
    if (registration) {
      // Aggiorna la registrazione esistente
      registration.outboundFlightId = outboundFlightId;
      registration.returnFlightId = returnFlightId;
      registration.groupName = groupName;
      registration.form_data = form_data;
      registration.status = 'pending';
      registration.submittedAt = new Date();
      await registration.save();
      res.json(registration);
    } else {
      // Crea nuova registrazione
      registration = new Registration({
        userId: req.user.id,
        outboundFlightId: outboundFlightId,
        returnFlightId: returnFlightId,
        groupName,
        form_data,
        status: 'pending',
        submittedAt: new Date(),
        eventId
      });
      // Validate registration before saving
      const validationError = registration.validateSync();
      if (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({
          message: 'Invalid registration data',
          errors: Object.keys(validationError.errors).reduce((acc, key) => {
            acc[key] = validationError.errors[key].message;
            return acc;
          }, {})
        });
      }
      const savedRegistration = await registration.save();
      res.json(savedRegistration);
    }

  } catch (err) {
    console.error('Registration error:', err);
    if (err instanceof Error) {
      console.error('Full error:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
        errors: err.errors
      });
    }
    res.status(500).json({
      message: 'Error saving registration',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      validation: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : undefined
    });
  }
};

// Delete Announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const trip = await Trip.findOne();
    trip.announcements = trip.announcements.filter(
      ann => ann.id.toString() !== req.params.id
    );
    await trip.save();
    res.json(trip.announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Count Registrations for Admin
export const countRegistrations = async (req, res) => {
  try {
    const eventId = new mongoose.Types.ObjectId(process.env.DEFAULT_EVENT_ID || '000000000000000000000000');
    const count = await Registration.countDocuments({ eventId });
    res.json({ count });
  } catch (err) {
    console.error('Error counting registrations:', err);
    res.status(500).json({ message: 'Errore nel conteggio delle registrazioni', error: err.message });
  }
};

// Count Users for Admin
export const countUsers = async (req, res) => {
  try {
    const User = (await import('../models/User.mjs')).default;
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error counting users:', err);
    res.status(500).json({ message: 'Errore nel conteggio degli utenti', error: err.message });
  }
};

// Get All Registrations for Admin
export const getAllRegistrations = async (req, res) => {
  try {
    console.log('getAllRegistrations called');
    const eventId = new mongoose.Types.ObjectId(process.env.DEFAULT_EVENT_ID || '000000000000000000000000');
    console.log('Event ID:', eventId);
    const registrations = await Registration.find({ eventId }).populate('userId', 'firstName lastName email');
    console.log('Found registrations:', registrations.length);
    res.json(registrations);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ message: 'Errore nel recupero delle registrazioni', error: err.message });
  }
};

// Get Config
export const getConfig = async (req, res) => {
  try {
    const config = await mongoose.connection.db.collection('config').findOne({});
    res.json(config);
  } catch (err) {
    console.error('Error in getConfig:', err);
    res.status(500).json({ message: 'Errore nel recupero della config', error: err.message });
  }
};