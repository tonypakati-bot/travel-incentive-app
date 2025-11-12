const mongoose = require('mongoose');
const Event = require('../server/models/Event');
const Flight = require('../server/models/Flight');
const Photo = require('../server/models/Photo');
const EmergencyContact = require('../server/models/EmergencyContact');

// Importa i dati mock direttamente dagli oggetti
const tripData = {
  eventDetails: {
    title: 'Abu Dhabi Incentive 2025',
    subtitle: 'Abu Dhabi, UAE | 6-10 Novembre 2025',
    brandImageUrl: 'https://i.imgur.com/8Qz5a2C.png',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=2070',
    registrationDeadline: '30 Settembre 2025'
  },
  agenda: require('../data/agenda.json')
};

const outboundFlights = [
  {
    id: 'fl_mxp_out',
    airline: 'Etihad Airways',
    flightNumber: 'EY 82',
    departureGroup: 'Milano Malpensa',
    departure: { airport: 'Milano Malpensa', code: 'MXP', time: '09:55', date: '06 Novembre 2025' },
    arrival: { airport: 'Abu Dhabi', code: 'AUH', time: '19:00', date: '06 Novembre 2025' },
    duration: '06h05'
  },
  {
    id: 'fl_fco_out',
    airline: 'Etihad Airways',
    flightNumber: 'EY 86',
    departureGroup: 'Roma Fiumicino',
    departure: { airport: 'Roma Fiumicino', code: 'FCO', time: '09:55', date: '06 Novembre 2025' },
    arrival: { airport: 'Abu Dhabi', code: 'AUH', time: '19:00', date: '06 Novembre 2025' },
    duration: '06h05'
  }
];

const returnFlights = [
  {
    id: 'fl_mxp_ret',
    airline: 'Etihad Airways',
    flightNumber: 'EY 79',
    departureGroup: 'Milano Malpensa',
    departure: { airport: 'Abu Dhabi', code: 'AUH', time: '14:25', date: '10 Novembre 2025' },
    arrival: { airport: 'Milano Malpensa', code: 'MXP', time: '18:20', date: '10 Novembre 2025' },
    duration: '06h55'
  },
  {
    id: 'fl_fco_ret',
    airline: 'Etihad Airways',
    flightNumber: 'EY 83',
    departureGroup: 'Roma Fiumicino',
    departure: { airport: 'Abu Dhabi', code: 'AUH', time: '14:25', date: '10 Novembre 2025' },
    arrival: { airport: 'Roma Fiumicino', code: 'FCO', time: '17:55', date: '10 Novembre 2025' },
    duration: '06h30'
  }
];

const emergencyContacts = [
  { id: 'ec1', departureGroup: '', name: 'Assistenza Viaggio 24/7', phone: '+39 02 123456', type: 'Supporto H24', email: 'supporto@viaggi.it' },
  { id: 'ec2', departureGroup: '', name: 'Ambulanza', phone: '998', type: 'Emergenza Medica (UAE)' },
  { id: 'ec3', departureGroup: '', name: 'Polizia', phone: '999', type: 'Emergenza Generale (UAE)' }
];

const galleryPhotos = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=400',
    userId: 'user-laura-bianchi',
    userName: 'Laura Bianchi',
    userImageUrl: 'https://i.pravatar.cc/150?u=laura-bianchi',
    caption: 'Il nostro incredibile hotel!',
    day: 1,
    timestamp: '2025-11-06T20:30:00Z',
    likes: 15
  }
];

async function importMockData() {
  try {
    // Connessione al database
    await mongoose.connect('mongodb://localhost:27017/travel-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // 1. Crea l'evento
    const event = new Event({
      title: eventDetails.title,
      subtitle: eventDetails.subtitle,
      brandImageUrl: eventDetails.brandImageUrl,
      backgroundImageUrl: eventDetails.backgroundImageUrl,
      registrationDeadline: new Date(eventDetails.registrationDeadline),
      agenda: agenda,
    });
    await event.save();
    console.log('Event created successfully');

    // 2. Crea i voli di andata
    for (const flight of outboundFlights) {
      const newFlight = new Flight({
        eventId: event._id,
        direction: 'outbound',
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departureGroup: flight.departureGroup,
        departure: {
          airport: flight.departure.airport,
          code: flight.departure.code,
          time: flight.departure.time,
          date: new Date(flight.departure.date)
        },
        arrival: {
          airport: flight.arrival.airport,
          code: flight.arrival.code,
          time: flight.arrival.time,
          date: new Date(flight.arrival.date)
        },
        duration: flight.duration
      });
      await newFlight.save();
    }
    console.log('Outbound flights created successfully');

    // 3. Crea i voli di ritorno
    for (const flight of returnFlights) {
      const newFlight = new Flight({
        eventId: event._id,
        direction: 'return',
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departureGroup: flight.departureGroup,
        departure: {
          airport: flight.departure.airport,
          code: flight.departure.code,
          time: flight.departure.time,
          date: new Date(flight.departure.date)
        },
        arrival: {
          airport: flight.arrival.airport,
          code: flight.arrival.code,
          time: flight.arrival.time,
          date: new Date(flight.arrival.date)
        },
        duration: flight.duration
      });
      await newFlight.save();
    }
    console.log('Return flights created successfully');

    // 4. Crea i contatti di emergenza
    for (const contact of emergencyContacts) {
      const newContact = new EmergencyContact({
        eventId: event._id,
        departureGroup: contact.departureGroup || '',
        name: contact.name,
        phone: contact.phone,
        type: contact.type,
        email: contact.email
      });
      await newContact.save();
    }
    console.log('Emergency contacts created successfully');

    // 5. Crea le foto
    for (const photo of galleryPhotos) {
      const newPhoto = new Photo({
        eventId: event._id,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        userId: photo.userId,
        userName: photo.userName,
        userImageUrl: photo.userImageUrl,
        caption: photo.caption,
        day: photo.day,
        timestamp: new Date(photo.timestamp),
        likes: photo.likes
      });
      await newPhoto.save();
    }
    console.log('Photos created successfully');

    console.log('All mock data imported successfully');
  } catch (error) {
    console.error('Error importing mock data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

importMockData();
