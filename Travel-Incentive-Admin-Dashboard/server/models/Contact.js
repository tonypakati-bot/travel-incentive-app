import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  email: { type: String },
  phone: { type: String },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
