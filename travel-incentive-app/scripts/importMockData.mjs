import mongoose from 'mongoose';
import { connectDB } from '../server/config/database.mjs';
import Event from '../server/models/Event.mjs';
import Flight from '../server/models/Flight.mjs';
import Photo from '../server/models/Photo.mjs';
import EmergencyContact from '../server/models/EmergencyContact.mjs';

// Importa i dati mock direttamente dagli oggetti
const tripData = {
  eventDetails: {
    title: 'Abu Dhabi Incentive 2025',
    subtitle: 'Abu Dhabi, UAE | 6-10 Novembre 2025',
    brandImageUrl: 'https://i.imgur.com/8Qz5a2C.png',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=2070',
    registrationDeadline: '2025-09-30',
  },
  agenda: [
    {
      day: 1,
      title: "Italia / Abu Dhabi",
      date: "Giovedì 6 Novembre 2025",
      items: [
        {
          id: 101,
          category: "Travel",
          icon: "flight_takeoff",
          time: "Mattina",
          title: "Partenza per Abu Dhabi",
          description: "Ritrovo degli Ospiti BEVERAGE NETWORK agli aeroporti di Milano Malpensa, Roma Fiumicino e Venezia, incontro con le assistenti aeroportuali e disbrigo delle pratiche d'imbarco. Partenza con voli di linea Etihad ed ITA Airways."
        },
        {
          id: 102,
          category: "Hotel",
          icon: "hotel",
          time: "Serata",
          title: "Arrivo e Check-in",
          description: "Arrivo all'aeroporto di Abu Dhabi, incontro con le guide locali parlanti italiano e trasferimento in Hotel. Arrivo all'hotel Emirates Palace, check-in, assegnazione delle camere riservate e pernottamento.",
          image: {
            urls: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070"],
            caption: "Emirates Palace Hotel",
            details: [
              { icon: "location_on", text: "West Corniche Road - Abu Dhabi" }
            ]
          }
        }
      ]
    },
    {
      day: 2,
      title: "Abu Dhabi City Tour",
      date: "Venerdì 7 Novembre 2025",
      items: [
        {
          id: 201,
          category: "Meal",
          icon: "restaurant",
          time: "07:30 - 10:30",
          title: "Colazione in Hotel",
          description: "Colazione a buffet presso il ristorante principale dell'Emirates Palace."
        },
        {
          id: 202,
          category: "Activity",
          icon: "mosque",
          time: "10:30 - 12:30",
          title: "Visita Grande Moschea",
          description: "Visita guidata della maestosa Grande Moschea Sheikh Zayed, uno dei luoghi di culto più grandi al mondo e capolavoro architettonico.",
          image: {
            urls: ["https://images.unsplash.com/photo-1512632578888-169bbbc64f33"],
            caption: "Grande Moschea Sheikh Zayed",
            details: [
              { icon: "schedule", text: "Durata: 2 ore" },
              { icon: "info", text: "Dress code richiesto" }
            ]
          }
        },
        {
          id: 203,
          category: "Meal",
          icon: "restaurant",
          time: "13:00 - 14:30",
          title: "Pranzo in ristorante locale",
          description: "Pranzo in ristorante tipico con cucina emiratina e internazionale."
        },
        {
          id: 204,
          category: "Activity",
          icon: "directions_car",
          time: "15:00 - 18:00",
          title: "Tour della città",
          description: "Visita panoramica della città con soste fotografiche ai punti di maggiore interesse: Corniche, Emirates Palace (esterno), Heritage Village."
        },
        {
          id: 205,
          category: "Activity",
          icon: "directions_boat",
          time: "19:00 - 22:00",
          title: "Cena in Dhow Cruise",
          description: "Cena a bordo di un dhow tradizionale navigando nelle acque calme che circondano Abu Dhabi, con vista sullo spettacolare skyline illuminato.",
          image: {
            urls: ["https://images.unsplash.com/photo-1512632578888-169bbbc64f33"],
            caption: "Dhow Cruise Abu Dhabi",
            details: [
              { icon: "directions_boat", text: "Imbarco: Marina Mall" }
            ]
          }
        }
      ]
    },
    {
      day: 3,
      title: "Desert Safari",
      date: "Sabato 8 Novembre 2025",
      items: [
        {
          id: 301,
          category: "Meal",
          icon: "restaurant",
          time: "07:30 - 10:00",
          title: "Colazione in Hotel",
          description: "Colazione a buffet presso il ristorante principale."
        },
        {
          id: 302,
          category: "Activity",
          icon: "terrain",
          time: "15:00 - 22:00",
          title: "Desert Safari con cena BBQ",
          description: "Partenza in 4x4 per un'emozionante avventura nel deserto. Dune bashing, tramonto sulle dune, cena BBQ in campo tendato con spettacoli tradizionali.",
          image: {
            urls: ["https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3"],
            caption: "Desert Safari",
            details: [
              { icon: "schedule", text: "Durata: 7 ore" },
              { icon: "directions_car", text: "Veicoli: Land Cruiser 4x4" }
            ]
          }
        }
      ]
    },
    {
      day: 4,
      title: "Ferrari World & Yas Marina",
      date: "Domenica 9 Novembre 2025",
      items: [
        {
          id: 401,
          category: "Meal",
          icon: "restaurant",
          time: "07:30 - 09:30",
          title: "Colazione in Hotel",
          description: "Colazione a buffet presso il ristorante principale."
        },
        {
          id: 402,
          category: "Activity",
          icon: "sports_motorsports",
          time: "10:00 - 17:00",
          title: "Ferrari World Abu Dhabi",
          description: "Giornata dedicata al divertimento nel parco tematico Ferrari World, con la montagna russa più veloce al mondo e numerose attrazioni a tema Ferrari.",
          image: {
            urls: ["https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3"],
            caption: "Ferrari World Abu Dhabi",
            details: [
              { icon: "location_on", text: "Yas Island" }
            ]
          }
        },
        {
          id: 403,
          category: "Activity",
          icon: "directions_car",
          time: "17:30 - 19:00",
          title: "Yas Marina Circuit Tour",
          description: "Visita guidata del circuito di Formula 1 di Yas Marina, con accesso ai box e alla sala di controllo."
        },
        {
          id: 404,
          category: "Meal",
          icon: "restaurant",
          time: "20:00 - 22:30",
          title: "Cena di Gala",
          description: "Cena di gala di arrivederci presso la terrazza panoramica dell'Emirates Palace con vista sulla città illuminata.",
          image: {
            urls: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
            caption: "Emirates Palace Terrace",
            details: [
              { icon: "restaurant", text: "Dress code: Elegante" }
            ]
          }
        }
      ]
    },
    {
      day: 5,
      title: "Abu Dhabi / Italia",
      date: "Lunedì 10 Novembre 2025",
      items: [
        {
          id: 501,
          category: "Meal",
          icon: "restaurant",
          time: "07:30 - 09:30",
          title: "Colazione in Hotel",
          description: "Prima colazione a buffet in hotel."
        },
        {
          id: 502,
          category: "Hotel",
          icon: "logout",
          time: "10:00 - 11:00",
          title: "Check-out",
          description: "Disbrigo delle formalità di check-out e tempo libero a disposizione."
        },
        {
          id: 503,
          category: "Travel",
          icon: "flight_takeoff",
          time: "Pomeriggio",
          title: "Partenza per l'Italia",
          description: "Trasferimento in aeroporto e partenza con voli di linea Etihad ed ITA Airways per le rispettive destinazioni."
        }
      ]
    }
  ]
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
  },
  {
    id: 'fl_vce_fco_out',
    airline: 'ITA Airways',
    flightNumber: 'AZ1460',
    departureGroup: 'Venezia',
    departure: { airport: 'Venezia', code: 'VCE', time: '06:15', date: '06 Novembre 2025' },
    arrival: { airport: 'Roma Fiumicino', code: 'FCO', time: '07:25', date: '06 Novembre 2025' },
    duration: '01h10'
  },
  {
    id: 'fl_vce_conn_out',
    airline: 'Etihad Airways',
    flightNumber: 'EY 86',
    departureGroup: 'Venezia',
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
  },
  {
    id: 'fl_vce_conn_ret',
    airline: 'Etihad Airways',
    flightNumber: 'EY 83',
    departureGroup: 'Venezia',
    departure: { airport: 'Abu Dhabi', code: 'AUH', time: '14:25', date: '10 Novembre 2025' },
    arrival: { airport: 'Roma Fiumicino', code: 'FCO', time: '17:55', date: '10 Novembre 2025' },
    duration: '06h30'
  },
  {
    id: 'fl_fco_vce_ret',
    airline: 'ITA Airways',
    flightNumber: 'AZ1473',
    departureGroup: 'Venezia',
    departure: { airport: 'Roma Fiumicino', code: 'FCO', time: '21:40', date: '10 Novembre 2025' },
    arrival: { airport: 'Venezia', code: 'VCE', time: '22:45', date: '10 Novembre 2025' },
    duration: '01h05'
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
    // Connessione al database utilizzando la configurazione esistente
    await connectDB();
    console.log('Connected to MongoDB');

    // 1. Crea l'evento
    const event = new Event({
      title: tripData.eventDetails.title,
      subtitle: tripData.eventDetails.subtitle,
      brandImageUrl: tripData.eventDetails.brandImageUrl,
      backgroundImageUrl: tripData.eventDetails.backgroundImageUrl,
      registrationDeadline: new Date(tripData.eventDetails.registrationDeadline),
      agenda: tripData.agenda,
    });
    await event.save();
    console.log('Event created successfully');

    // 2. Cancella tutti i voli esistenti per questo evento
    await Flight.deleteMany({ eventId: event._id });
    console.log('Existing flights deleted');

    // 3. Crea i voli di andata
    for (const flight of outboundFlights) {
      try {
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
        console.log(`Created outbound flight ${flight.flightNumber} for ${flight.departureGroup}`);
      } catch (error) {
        console.error(`Error creating outbound flight ${flight.flightNumber}:`, error);
      }
    }
    console.log('All outbound flights created successfully');

    // 4. Crea i voli di ritorno
    for (const flight of returnFlights) {
      try {
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
        console.log(`Created return flight ${flight.flightNumber} for ${flight.departureGroup}`);
      } catch (error) {
        console.error(`Error creating return flight ${flight.flightNumber}:`, error);
      }
    }
    console.log('All return flights created successfully');

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
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
}

importMockData();
