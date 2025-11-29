import mongoose from 'mongoose';

const UsefulInfoSchema = new mongoose.Schema({
  destinationName: { type: String, default: '' },
  country: { type: String, default: '' },
  documents: { type: String, default: '' },
  timeZone: { type: String, default: '' },
  currency: { type: String, default: '' },
  language: { type: String, default: '' },
  climate: { type: String, default: '' },
  vaccinationsHealth: { type: String, default: '' },
}, { _id: false });

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  content: { type: String, default: '' },
  usefulInfo: { type: UsefulInfoSchema, default: {} },
  visible: { type: Boolean, default: true },
  author: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);
