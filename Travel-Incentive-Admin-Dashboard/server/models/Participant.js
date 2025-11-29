import mongoose from 'mongoose';

const ParticipantSchema = new mongoose.Schema({
  // Separate name fields to support Nome / Cognome. Keep legacy `name` for compatibility.
  firstName: String,
  lastName: String,
  name: String,
  email: String,
  trip: String,
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  group: String,
  status: { type: String, default: 'To Invite' }
});

export default mongoose.model('Participant', ParticipantSchema);
