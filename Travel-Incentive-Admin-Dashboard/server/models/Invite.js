import mongoose from 'mongoose';

const InviteSchema = new mongoose.Schema({
  tripName: String,
  sender: String,
  subject: String,
  body: String,
  status: { type: String, default: 'Draft' },
  lastModified: { type: Date, default: Date.now }
});

export default mongoose.model('Invite', InviteSchema);
