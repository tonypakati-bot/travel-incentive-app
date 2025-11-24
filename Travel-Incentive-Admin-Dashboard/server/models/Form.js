import mongoose from 'mongoose';

const FieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: false });

const SectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  fields: { type: [FieldSchema], default: [] },
}, { _id: false });

const FormSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, index: true, sparse: true },
  description: { type: String, default: '' },
  sections: { type: [SectionSchema], default: [] },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  visible: { type: Boolean, default: true },
  author: { type: String, default: '' },
}, { timestamps: true });

const Form = mongoose.model('Form', FormSchema);
export default Form;
