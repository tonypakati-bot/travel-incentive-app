import mongoose from 'mongoose';

const travelInfoSchema = new mongoose.Schema({
  welcomeBannerImageUrl: String,
  outboundFlightInfo: {
    title: String,
    content: String
  },
  returnFlightInfo: {
    title: String,
    content: String
  },
  outboundFlights: [{
    id: String,
    airline: String,
    flightNumber: String,
    departureGroup: String,
    departure: {
      airport: String,
      code: String,
      time: String,
      date: String
    },
    arrival: {
      airport: String,
      code: String,
      time: String,
      date: String
    },
    duration: String
  }],
  returnFlights: [{
    id: String,
    airline: String,
    flightNumber: String,
    departureGroup: String,
    departure: {
      airport: String,
      code: String,
      time: String,
      date: String
    },
    arrival: {
      airport: String,
      code: String,
      time: String,
      date: String
    },
    duration: String
  }],
  emergencyContacts: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    type: { type: String, required: true },
    email: String,
    departureGroup: String, // Gruppo di partenza associato al contatto
    availability: String,
    languages: [String],
    services: [String],
    targetAirports: [String], // Aeroporti per cui mostrare il contatto (opzionale)
    response_time: String,
    notes: String
  }],
  registration: {
    deadline: { type: String, required: true },
    status: { type: String, required: true },
    config: {
      formPath: String,
      successRedirect: String,
      requiredDocuments: [String]
    }
  }
});

const TravelInfo = mongoose.model('TravelInfo', travelInfoSchema);
export default TravelInfo;