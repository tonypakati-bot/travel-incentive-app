import mongoose from 'mongoose';

const CommunicationSchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  tripName: { type: String },
  group: { type: String, default: 'all' },
  type: { type: String, enum: ['information','alert'], default: 'information' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date },
  createdBy: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.models.Communication || mongoose.model('Communication', CommunicationSchema);
