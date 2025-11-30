import mongoose from 'mongoose';

const PrivacyPolicySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  tripId: { type: String, default: null },
  visible: { type: Boolean, default: true },
  createdBy: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('PrivacyPolicy', PrivacyPolicySchema);
