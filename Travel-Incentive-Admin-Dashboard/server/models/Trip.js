import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  name: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['draft','published'], default: 'draft' },
  settings: {
    groups: [{ type: String }],
    addAccompany: { type: Boolean, default: false },
    businessFlights: { type: Boolean, default: false },
    imageUrl: { type: String },
    logoUrl: { type: String }
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  emergencyContacts: [{
    group: { type: String },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    contactName: { type: String },
    contactCategory: { type: String },
    addedAt: { type: Date, default: () => new Date() }
  }]
  ,
  flights: [{
    direction: { type: String, enum: ['andata','ritorno'], required: true },
    title: { type: String },
    notes: { type: String },
    group: { type: String },
    airline: { type: String },
    flightNumber: { type: String },
    from: { type: String },
    to: { type: String },
    date: { type: String },
    timeDeparture: { type: String },
    timeArrival: { type: String }
  }],
  flightsMeta: {
    andataTitle: { type: String },
    andataNotes: { type: String },
    ritornoTitle: { type: String },
    ritornoNotes: { type: String }
  }
  ,
  // Agenda: array of days, each day has items
  agenda: [{
    day: { type: Number },
    title: { type: String },
    date: { type: String },
    items: [{
      category: { type: String },
      time: { type: String },
      title: { type: String },
      description: { type: String },
      targetAirports: [{ type: String }],
      // details can be arbitrary structured data, accept mixed to avoid cast errors
      details: [{ type: mongoose.Schema.Types.Mixed }]
    }]
  }]
}, { timestamps: true });

TripSchema.index({ name: 1, startDate: 1 }, { unique: true, partialFilterExpression: { name: { $exists: true } } });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
