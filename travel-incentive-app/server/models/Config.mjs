import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  emergencyContactsType: [String],
  // Altri campi di configurazione possono essere aggiunti qui
});

const Config = mongoose.model('Config', configSchema, 'config');

export default Config;