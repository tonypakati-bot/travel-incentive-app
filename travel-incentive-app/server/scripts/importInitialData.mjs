import { connectDB } from '../config/database.mjs';
import Trip from '../models/Trip.mjs';
import TravelInfo from '../models/TravelInfo.mjs';

const tripData = {
  eventDetails: {
    title: 'Abu Dhabi Incentive 2025',
    subtitle: 'Abu Dhabi, UAE | 6-10 Novembre 2025',
    brandImageUrl: 'https://i.imgur.com/8Qz5a2C.png',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=2070',
    registrationDeadline: '30 Settembre 2025',
    duration: {
      days: 5,
      nights: 4
    },
    overview: {
      description: "Un esclusivo viaggio incentive nel cuore degli Emirati Arabi Uniti. Cinque giorni di esperienze uniche tra modernità e tradizione, dal lusso dell'Emirates Palace alle emozioni del deserto.",
      highlights: [
        'Soggiorno nel prestigioso Emirates Palace',
        'Visita della Grande Moschea Sheikh Zayed',
        'Esplorazione del Museo Louvre Abu Dhabi',
        'Safari nel deserto con cena sotto le stelle',
        'Cena di gala allo Yas Marina Circuit'
      ]
    },
    destination: {
      name: 'Abu Dhabi',
      country: 'Emirati Arabi Uniti',
      description: 'Capitale degli Emirati Arabi Uniti, Abu Dhabi è una città che unisce tradizione e innovazione.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2070',
          caption: 'Skyline di Abu Dhabi'
        },
        {
          url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070',
          caption: 'Emirates Palace'
        }
      ]
    }
  },
  agenda: [
    {
      day: 1,
      title: 'Italia / Abu Dhabi',
      date: 'Giovedì 6 Novembre 2025',
      items: [
        {
          id: 101,
          category: 'Travel',
          icon: 'flight_takeoff',
          time: 'Mattina',
          title: 'Partenza per Abu Dhabi',
          description: 'Ritrovo degli Ospiti BEVERAGE NETWORK agli aeroporti di Milano Malpensa e Roma Fiumicino, incontro con le assistenti aeroportuali e disbrigo delle pratiche d\'imbarco. Partenza con voli di linea Etihad.'
        },
        {
          id: 102,
          category: 'Hotel',
          icon: 'hotel',
          time: 'Serata',
          title: 'Arrivo e Check-in',
          description: 'Arrivo all\'aeroporto di Abu Dhabi, incontro con le guide locali parlanti italiano e trasferimento in Hotel. Arrivo all\'hotel Emirates Palace, check-in, assegnazione delle camere riservate e pernottamento.',
          image: {
            urls: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070'],
            caption: 'Emirates Palace Hotel',
            details: [
              { icon: 'location_on', text: 'West Corniche Road - Abu Dhabi' }
            ]
          }
        }
      ]
    },
    {
      day: 2,
      title: 'Abu Dhabi',
      date: 'Venerdì 7 Novembre 2025',
      items: [
        {
          id: 200,
          icon: 'breakfast_dining',
          time: 'Mattina',
          title: 'Prima Colazione',
          description: 'Prima colazione in hotel.'
        },
        {
          id: 201,
          category: 'Activity',
          icon: 'beach_access',
          time: 'Mattina',
          title: 'Relax al Resort',
          description: 'Mattinata dedicata al relax al Resort.'
        },
        {
          id: 202,
          category: 'Restaurant',
          icon: 'lunch_dining',
          time: 'Pranzo',
          title: 'Pranzo in Hotel',
          description: 'Pranzo in uno dei ristoranti del resort.'
        },
        {
          id: 203,
          category: 'Activity',
          icon: 'museum',
          time: 'Pomeriggio',
          title: 'Visita di Abu Dhabi',
          description: 'Visita della Grande Moschea dello Sceicco Zayed e del magnifico Museo Louvre.',
          longDescription: 'Abu Dhabi è una delle nazioni più giovani al mondo, nata però da un passato antichissimo. Meno di un secolo fa era una stazione di pesca e raccolta di perle, oggi è una città lussureggiante con grattacieli di vetro da Guinness dei Primati, grandi viali alberati e lunghissime spiagge pubbliche. Tutto è fuori misura: c\'è la torre più storta del mondo, il tappeto fatto a mano più grande del mondo, il parco di divertimenti più esteso del mondo. Qui si vedono sfrecciare Ferrari, Lamborghini e Rolls Royce con la frequenza con cui si incontrano le utilitarie a Milano e ci si imbatte in hotel che valgono 3 miliardi di dollari (l\'Emirates Palace ha una cupola dorata più grande di quella della Cattedrale di St.Paul a Londra).',
          image: {
            urls: [
              'https://images.unsplash.com/photo-1595017013938-c6144883c408?q=80&w=2070',
              'https://images.unsplash.com/photo-1632868114441-325cd0b171a7?q=80&w=1932'
            ],
            caption: 'Grande Moschea Sheikh Zayed & Louvre Abu Dhabi'
          }
        },
        {
          id: 204,
          category: 'Restaurant',
          icon: 'restaurant',
          time: 'Serata',
          title: 'Cocktail Campari e Cena allo Yas Marina Circuit',
          description: 'In serata Cocktail Campari e Cena a Yas Island presso lo Yas Marina Circuit al Royal Lounge.',
          image: {
            urls: ['https://images.unsplash.com/photo-1629528915128-17c37a0d4a94?q=80&w=2070'],
            caption: 'Royal Lounge - Yas Marina Circuit'
          }
        }
      ]
    },
    {
      day: 3,
      title: 'il Deserto',
      date: 'Sabato 8 Novembre 2025',
      items: [
        {
          id: 300,
          icon: 'breakfast_dining',
          time: 'Mattina',
          title: 'Prima Colazione',
          description: 'Prima colazione in hotel.'
        },
        {
          id: 301,
          category: 'Meeting',
          icon: 'mic',
          time: 'Mattina',
          title: 'MEETING BEVERAGE NETWORK',
          description: 'Mattinata dedicata al MEETING BEVERAGE NETWORK Soci, Birra Castello e Fornitori.'
        },
        {
          id: 302,
          category: 'Restaurant',
          icon: 'lunch_dining',
          time: 'Pranzo',
          title: 'Pranzo al Ristorante Vendôme',
          description: 'Pranzo in hotel al Ristorante Vendôme.'
        },
        {
          id: 303,
          category: 'Activity',
          icon: 'surfing',
          time: 'Pomeriggio',
          title: 'Dune Bashing nel Deserto',
          description: "Nel pomeriggio partenza per il deserto, dove si vivrà l'esperienza del Dune Bashing.",
          longDescription: "Il Dune Bashing nel deserto di Abu Dhabi è un modo fantastico per esplorare la grande distesa desertica, grazie alle sue alte dune e alle sue imponenti vallate di sabbia, cavalcando a bordo delle jeep le dune quasi come su di un rollercoaster.",
          image: {
            urls: ['https://images.unsplash.com/photo-1522201949576-d3a89cde9943?q=80&w=2070'],
            caption: 'Safari nel deserto'
          }
        },
        {
          id: 304,
          category: 'Restaurant',
          icon: 'celebration',
          time: 'Serata',
          title: 'Cocktail Campari e Cena nel Deserto',
          description: 'Al tramonto, il suggestivo Cocktail Campari nel deserto seguito da una Cena sotto le stelle.'
        }
      ]
    },
    {
      day: 4,
      title: 'Abu Dhabi',
      date: 'Domenica 9 Novembre 2025',
      items: [
        {
          id: 400,
          icon: 'breakfast_dining',
          time: 'Mattina',
          title: 'Prima Colazione',
          description: 'Prima colazione in hotel.'
        },
        {
          id: 401,
          category: 'Activity',
          icon: 'spa',
          time: 'Intera Giornata',
          title: 'Relax o Visite Individuali',
          description: 'Intera giornata a disposizione per il relax o per visite individuali.'
        },
        {
          id: 402,
          category: 'Restaurant',
          icon: 'lunch_dining',
          time: 'Pranzo',
          title: 'Pranzo al Ristorante Sand & Koal',
          description: 'Pranzo in Hotel al Ristorante Sand & Koal.',
          image: {
            urls: ['https://images.unsplash.com/photo-1559394611-5a5857fe554d?q=80&w=1974'],
            caption: 'Sand & Koal Restaurant'
          }
        },
        {
          id: 403,
          category: 'Restaurant',
          icon: 'nightlife',
          time: 'Cena',
          title: 'Cena di Arrivederci',
          description: 'Cena di arrivederci al Cafè del Mar Beach Club, il più bel beach club di Abu Dhabi, situato su Yas Bay.',
          image: {
            urls: ['https://images.unsplash.com/photo-1601042879364-85a4848f87e9?q=80&w=2070'],
            caption: 'Cafè del Mar Beach Club'
          }
        }
      ]
    },
    {
      day: 5,
      title: 'Abu Dhabi / Italia',
      date: 'Lunedì 10 Novembre 2025',
      items: [
        {
          id: 501,
          icon: 'breakfast_dining',
          time: 'Mattina',
          title: 'Prima Colazione',
          description: 'Prima colazione a buffet al resort.'
        },
        {
          id: 502,
          category: 'Hotel',
          icon: 'logout',
          time: 'Mattina',
          title: 'Check-out dall\'Hotel',
          description: 'Rilascio delle camere e saldo degli extra personali.'
        },
        {
          id: 504,
          category: 'Travel',
          icon: 'flight_takeoff',
          time: 'Tarda Mattinata',
          title: 'Trasferimento e Partenza per l\'Italia',
          description: 'Trasferimento all\'aeroporto di Abu Dhabi in tempo utile al disbrigo delle pratiche d\'imbarco e partenza con voli di linea Etihad alla volta di Milano Malpensa e Roma Fiumicino. Arrivo in Italia in serata.'
        }
      ]
    }
  ],
  announcements: [
    {
      id: 1,
      title: 'Codice di abbigliamento',
      content: 'Per la visita alla Grande Moschea è richiesto un abbigliamento consono. Per la serata nel deserto si consiglia un abbigliamento comodo e una giacca leggera.',
      icon: 'checkroom',
      type: 'info',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Registrazione Online',
      content: 'Si ricorda che la registrazione online deve essere completata entro il 30 Settembre 2025. Per assistenza contattare support@beveragenetwork.it',
      icon: 'app_registration',
      type: 'reminder',
      priority: 'high'
    },
    {
      id: 3,
      title: 'Download App Viaggio',
      content: 'Scarica l\'app del viaggio per accedere a tutte le informazioni in tempo reale e ricevere aggiornamenti importanti.',
      icon: 'system_update',
      type: 'info',
      priority: 'medium'
    },
    {
      id: 4,
      title: 'Clima ad Abu Dhabi',
      content: 'A Novembre il clima è ideale con temperature medie tra 22°C e 30°C. Si consiglia di portare protezione solare e occhiali da sole.',
      icon: 'wb_sunny',
      type: 'info',
      priority: 'medium'
    }
  ],
  locationDetails: {
    country: 'UAE',
    city: 'Abu Dhabi',
    weatherInfo: {
      temperature: {
        average: {
          min: 22,
          max: 30
        },
        unit: 'C'
      },
      description: 'Clima secco e soleggiato con bassa probabilità di precipitazioni',
      recommendations: [
        'Protezione solare alta',
        'Cappello o bandana',
        'Occhiali da sole',
        'Indumenti leggeri e traspiranti'
      ]
    },
    hotels: [
      {
        id: 'ep_auh',
        name: 'Emirates Palace',
        address: 'West Corniche Road - Abu Dhabi',
        location: {
          latitude: 24.4615,
          longitude: 54.3166
        },
        rating: 5,
        checkIn: '15:00',
        checkOut: '12:00',
        amenities: [
          'Spa di lusso',
          'Piscine private',
          'Spiaggia privata',
          'Ristoranti gourmet',
          'Bar e lounge',
          'Centro fitness',
          'Servizio in camera 24/7'
        ],
        description: 'Lussuoso hotel 5 stelle con architettura araba, spa e ristoranti raffinati. Una delle strutture più iconiche di Abu Dhabi.',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070',
            caption: 'Facciata Emirates Palace'
          },
          {
            url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2025',
            caption: 'Lobby'
          },
          {
            url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070',
            caption: 'Camera Deluxe'
          }
        ],
        restaurants: [
          {
            name: 'Vendôme',
            type: 'International Buffet',
            openingHours: '06:30 - 23:00'
          },
          {
            name: 'Sand & Koal',
            type: 'Asian & BBQ',
            openingHours: '12:00 - 23:00'
          },
          {
            name: 'Le Café',
            type: 'Café & Light meals',
            openingHours: '08:00 - 22:00'
          }
        ],
        services: [
          {
            name: 'Concierge',
            availability: '24/7',
            description: 'Servizio concierge multilingue'
          },
          {
            name: 'Room Service',
            availability: '24/7',
            description: 'Servizio in camera completo'
          },
          {
            name: 'Spa',
            availability: '09:00 - 21:00',
            description: 'Trattamenti di lusso e massaggi'
          }
        ]
      }
    ],
    points_of_interest: [
      {
        id: 'poi_mosque',
        name: 'Grande Moschea Sheikh Zayed',
        description: 'La più grande moschea degli Emirati Arabi Uniti, un capolavoro architettonico in marmo bianco.',
        image: 'https://images.unsplash.com/photo-1595017013938-c6144883c408?q=80&w=2070',
        visitInfo: {
          openingHours: '09:00 - 22:00',
          dressCode: 'Abbigliamento modesto richiesto. Disponibili abaya gratuite per le donne.',
          admissionFee: 'Gratuito'
        }
      },
      {
        id: 'poi_louvre',
        name: 'Louvre Abu Dhabi',
        description: 'Il primo museo universale nel mondo arabo, progettato dall\'architetto Jean Nouvel.',
        image: 'https://images.unsplash.com/photo-1632868114441-325cd0b171a7?q=80&w=1932',
        visitInfo: {
          openingHours: '10:00 - 20:00',
          admissionFee: 'Incluso nel pacchetto'
        }
      },
      {
        id: 'poi_yas',
        name: 'Yas Marina Circuit',
        description: 'Circuito di Formula 1 che ospita il Gran Premio di Abu Dhabi.',
        image: 'https://images.unsplash.com/photo-1629528915128-17c37a0d4a94?q=80&w=2070',
        visitInfo: {
          location: 'Yas Island',
          events: ['Cena di gala al Royal Lounge']
        }
      }
    ],
    useful_info: {
      emergency_numbers: {
        police: '999',
        ambulance: '998',
        fire: '997'
      },
      time_zone: 'GMT+4',
      currency: {
        code: 'AED',
        name: 'Dirham Emirati',
        exchange_rate: 'Circa 1 EUR = 4 AED'
      },
      language: {
        main: 'Arabo',
        tourism: 'Inglese ampiamente parlato'
      }
    }
  }
};

const travelInfo = {
  welcomeBannerImageUrl: 'https://images.unsplash.com/photo-1570211139413-586833a69363?q=80&w=2000',
  outboundFlightInfo: {
    title: 'Informazioni Volo di Andata',
    content: 'Si prega di arrivare in aeroporto almeno 3 ore prima della partenza del volo. I banchi check-in chiudono 60 minuti prima del decollo.'
  },
  returnFlightInfo: {
    title: 'Informazioni Volo di Ritorno',
    content: 'Il trasferimento per l\'aeroporto partirà dall\'hotel 4 ore prima dell\'orario di partenza del volo.'
  },
  outboundFlights: [
    {
      id: 'fl_mxp_out',
      airline: 'Etihad Airways',
      flightNumber: 'EY 82',
      departureGroup: 'Milano Malpensa',
      departure: {
        airport: 'Milano Malpensa',
        code: 'MXP',
        time: '09:55',
        date: '06 Novembre 2025'
      },
      arrival: {
        airport: 'Abu Dhabi',
        code: 'AUH',
        time: '19:00',
        date: '06 Novembre 2025'
      },
      duration: '06h05'
    },
    {
      id: 'fl_fco_out',
      airline: 'Etihad Airways',
      flightNumber: 'EY 86',
      departureGroup: 'Roma Fiumicino',
      departure: {
        airport: 'Roma Fiumicino',
        code: 'FCO',
        time: '09:55',
        date: '06 Novembre 2025'
      },
      arrival: {
        airport: 'Abu Dhabi',
        code: 'AUH',
        time: '19:00',
        date: '06 Novembre 2025'
      },
      duration: '06h05'
    },
    {
      id: 'fl_vce_fco_out',
      airline: 'ITA Airways',
      flightNumber: 'AZ1460',
      departureGroup: 'Venezia',
      departure: {
        airport: 'Venezia',
        code: 'VCE',
        time: '06:15',
        date: '06 Novembre 2025'
      },
      arrival: {
        airport: 'Roma Fiumicino',
        code: 'FCO',
        time: '07:25',
        date: '06 Novembre 2025'
      },
      duration: '01h10'
    },
    {
      id: 'fl_vce_conn_out',
      airline: 'Etihad Airways',
      flightNumber: 'EY 86',
      departureGroup: 'Venezia',
      departure: {
        airport: 'Roma Fiumicino',
        code: 'FCO',
        time: '09:55',
        date: '06 Novembre 2025'
      },
      arrival: {
        airport: 'Abu Dhabi',
        code: 'AUH',
        time: '19:00',
        date: '06 Novembre 2025'
      },
      duration: '06h05'
    }
  ],
  returnFlights: [
    {
      id: 'fl_mxp_ret',
      airline: 'Etihad Airways',
      flightNumber: 'EY 79',
      departureGroup: 'Milano Malpensa',
      departure: {
        airport: 'Abu Dhabi',
        code: 'AUH',
        time: '14:25',
        date: '10 Novembre 2025'
      },
      arrival: {
        airport: 'Milano Malpensa',
        code: 'MXP',
        time: '18:20',
        date: '10 Novembre 2025'
      },
      duration: '06h55'
    },
    {
      id: 'fl_fco_ret',
      airline: 'Etihad Airways',
      flightNumber: 'EY 83',
      departureGroup: 'Roma Fiumicino',
      departure: {
        airport: 'Abu Dhabi',
        code: 'AUH',
        time: '14:25',
        date: '10 Novembre 2025'
      },
      arrival: {
        airport: 'Roma Fiumicino',
        code: 'FCO',
        time: '17:55',
        date: '10 Novembre 2025'
      },
      duration: '06h30'
    },
    {
      id: 'fl_vce_conn_ret',
      airline: 'Etihad Airways',
      flightNumber: 'EY 83',
      departureGroup: 'Venezia',
      departure: {
        airport: 'Abu Dhabi',
        code: 'AUH',
        time: '14:25',
        date: '10 Novembre 2025'
      },
      arrival: {
        airport: 'Roma Fiumicino',
        code: 'FCO',
        time: '17:55',
        date: '10 Novembre 2025'
      },
      duration: '06h30'
    },
    {
      id: 'fl_fco_vce_ret',
      airline: 'ITA Airways',
      flightNumber: 'AZ1473',
      departureGroup: 'Venezia',
      departure: {
        airport: 'Roma Fiumicino',
        code: 'FCO',
        time: '21:40',
        date: '10 Novembre 2025'
      },
      arrival: {
        airport: 'Venezia',
        code: 'VCE',
        time: '22:45',
        date: '10 Novembre 2025'
      },
      duration: '01h05'
    }
  ],
  emergencyContacts: [
    {
      departureGroup: '',
      id: 'ec1',
      name: 'Assistenza Viaggio 24/7',
      phone: '+39 02 123456',
      type: 'Supporto H24',
      email: 'supporto@viaggi.it',
      availability: '24/7',
      languages: ['Italiano', 'English'],
      services: [
        'Assistenza medica',
        'Smarrimento documenti',
        'Problemi con voli',
        'Emergenze generali'
      ]
    },
    {
      departureGroup: '',
      id: 'ec2',
      name: 'Ambulanza',
      phone: '998',
      type: 'Emergenza Medica (UAE)',
      availability: '24/7',
      response_time: 'Immediato',
      notes: 'Servizio ambulanza pubblico degli Emirati Arabi Uniti'
    },
    {
      departureGroup: '',
      id: 'ec3',
      name: 'Polizia',
      phone: '999',
      type: 'Emergenza Generale (UAE)',
      availability: '24/7',
      response_time: 'Immediato',
      languages: ['Arabic', 'English']
    },
    {
      departureGroup: '',
      id: 'ec4',
      name: 'Emirates Palace - Concierge',
      phone: '+971 2 690 9000',
      type: 'Assistenza Hotel',
      email: 'concierge@emiratespalace.ae',
      availability: '24/7',
      languages: ['Arabic', 'English', 'Italiano'],
      services: [
        'Informazioni generali',
        'Prenotazioni ristoranti',
        'Servizi in camera',
        'Assistenza ospiti'
      ]
    },
    {
      departureGroup: '',
      id: 'ec5',
      name: 'Responsabile Gruppo',
      phone: '+39 333 1234567',
      type: 'Coordinamento',
      email: 'coordinator@beveragenetwork.it',
      availability: 'Durante il viaggio',
      languages: ['Italiano', 'English']
    }
  ],
  registration: {
    deadline: '2025-09-30T23:59:59Z',
    status: 'open',
    config: {
      formPath: '/registration',
      successRedirect: '/profile',
      requiredDocuments: [
        'Passaporto valido',
        'Foto formato tessera',
        'Certificato di vaccinazione (se richiesto)'
      ]
    }
  }
};

async function importData() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Clear existing data
    await Trip.deleteMany({});
    await TravelInfo.deleteMany({});
    console.log('Cleared existing data');

    // Import new data
    const trip = new Trip(tripData);
    await trip.save();
    console.log('Trip data imported successfully');

    const travel = new TravelInfo(travelInfo);
    await travel.save();
    console.log('Travel info imported successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData();