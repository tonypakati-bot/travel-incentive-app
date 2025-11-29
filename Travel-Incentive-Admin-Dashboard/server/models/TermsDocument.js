import mongoose from 'mongoose';

const TermsDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  trip: { type: String, default: null }, // null for global
  content: { type: String, default: '' },
  visible: { type: Boolean, default: true },
  author: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('TermsDocument', TermsDocumentSchema);
