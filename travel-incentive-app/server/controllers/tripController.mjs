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
    console.error(err.message);
    res.status(500).send('Server Error');
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
    console.error(err.message);
    res.status(500).send('Server Error');
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