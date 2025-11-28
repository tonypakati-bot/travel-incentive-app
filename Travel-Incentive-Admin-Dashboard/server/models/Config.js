import mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({
  categoryEvents: [{ type: String }],
  icons: [{ type: String }]
}, { timestamps: true });

export default mongoose.models.Config || mongoose.model('Config', ConfigSchema);
