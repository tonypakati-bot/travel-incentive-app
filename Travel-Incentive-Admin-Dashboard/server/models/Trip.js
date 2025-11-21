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
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
}, { timestamps: true });

TripSchema.index({ name: 1, startDate: 1 }, { unique: true, partialFilterExpression: { name: { $exists: true } } });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
