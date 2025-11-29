import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  id: Number,
  title: String,
  content: String,
  icon: String,
  type: String,
  priority: String,
  targetAirports: [String], // Aeroporti per cui mostrare l'annuncio (opzionale)
  action: {
    page: String,
    label: String
  }
});

const eventDetailsSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  brandImageUrl: String,
  backgroundImageUrl: String,
  registrationDeadline: String,
  startDate: String,
  endDate: String,
  duration: {
    days: Number,
    nights: Number
  },
  overview: {
    description: String,
    highlights: [String]
  },
  departureGroup: [String],
  allowCompanion: Boolean,
  allowBusiness: Boolean,
  roomType: [String],
  destination: {
    name: String,
    country: String,
    description: String,
    images: [{
      url: String,
      caption: String
    }]
  }
});

const agendaItemSchema = new mongoose.Schema({
  id: Number,
  category: String,
  icon: String,
  time: String,
  title: String,
  description: String,
  longDescription: String,
  targetAirports: [String], // Aeroporti per cui mostrare l'item dell'agenda (opzionale)
  image: {
    urls: [String],
    caption: String,
    details: [{
      icon: String,
      text: String
    }]
  }
});

const agendaDaySchema = new mongoose.Schema({
  day: Number,
  title: String,
  date: String,
  items: [agendaItemSchema]
});

const restaurantSchema = new mongoose.Schema({
  name: String,
  type: String,
  openingHours: String
});

const hotelSchema = new mongoose.Schema({
  id: String,
  name: String,
  address: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  rating: Number,
  checkIn: String,
  checkOut: String,
  amenities: [String],
  description: String,
  images: [{
    url: String,
    caption: String
  }],
  restaurants: [restaurantSchema],
  services: [{
    name: String,
    availability: String,
    description: String
  }]
});

const pointOfInterestSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  image: String,
  visitInfo: {
    openingHours: String,
    dressCode: String,
    admissionFee: String,
    location: String,
    events: [String]
  }
});

const usefulInfoSchema = new mongoose.Schema({
  emergency_numbers: {
    police: String,
    ambulance: String,
    fire: String
  },
  time_zone: String,
  currency: {
    code: String,
    name: String,
    exchange_rate: String
  },
  language: {
    main: String,
    tourism: String
  }
});

const locationDetailsSchema = new mongoose.Schema({
  country: String,
  city: String,
  weatherInfo: {
    temperature: {
      average: {
        min: Number,
        max: Number
      },
      unit: String
    },
    description: String,
    recommendations: [String]
  },
  hotels: [hotelSchema],
  points_of_interest: [pointOfInterestSchema],
  useful_info: usefulInfoSchema
});

const tripSchema = new mongoose.Schema({
  eventDetails: eventDetailsSchema,
  agenda: [agendaDaySchema],
  announcements: [announcementSchema],
  locationDetails: locationDetailsSchema
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;