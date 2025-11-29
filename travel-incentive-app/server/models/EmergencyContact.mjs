import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  departureGroup: String,
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  email: String,
  targetAirports: [String], // Aeroporti per cui mostrare il contatto (opzionale)
  availability: String,
  languages: [String],
  services: [String]
}, {
  timestamps: true
});

export default mongoose.model('EmergencyContact', emergencyContactSchema);