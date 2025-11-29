/**
 * FILE DI DOCUMENTAZIONE - DATI MOCK
 *
 * Questo file contiene dati di esempio (mock data) utilizzati per:
 * - Documentare la struttura dei dati dell'applicazione
 * - Fornire riferimenti per lo sviluppo futuro
 * - Alimentare gli script di importazione nel database
 *
 * ⚠️  IMPORTANTE: Questo file NON viene più utilizzato nel codice dell'applicazione.
 * Tutti i dati vengono ora recuperati dinamicamente dal database MongoDB
 * tramite le API del backend Express.js.
 *
 * Per modificare i dati visualizzati nell'app, utilizzare:
 * - Il pannello admin per aggiornamenti in tempo reale
 * - Gli script di importazione per popolamento iniziale del database
 */

import { TripData, TravelInfo, Profile, AgendaDay, EventDetails, RegistrationFormConfig, Flight, EmergencyContact, Announcement, ConditionalFormField, Photo } from '../types';

const loremIpsum = `
  <h3 class="text-lg font-bold mb-2">Introduzione</h3>
  <p class="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh.</p>
  <p class="mb-4">Praesent sapien massa, convallis a, pellentesque nec, egestas non, nisi. Mauris sit amet eros. Donec et nibh maximus, congue est eu, mattis nunc. Praesent ut quam quis quam venenatis fringilla. Morbi vestibulum id tellus commodo mattis. Aliquam erat volutpat. Aenean accumsan id mi nec semper. Quisque pulvinar, elit ut condimentum dictum, nisi purus egestas turpis, vitae ullamcorper est est ut orci. Cras vel dolor ut magna elementum vulputate. Quisque ut odio et arcu blandit vehicula. Curabitur vitae velit in neque dictum blandit. Duis vulputate, mi in lobortis consectetur, felis diam ornare justo, quis rhoncus sem justo eget elit. Sed vel leo eget ex facilisis tincidunt. In hac habitasse platea dictumst.</p>
  <h3 class="text-lg font-bold mb-2 mt-6">Dettagli Sezione</h3>
  <p class="mb-4">Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices. Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui. Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim. Curabitur sit amet mauris.</p>
  <p class="mb-4">Morbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. Proin sodales libero eget ante. Nulla quam. Aenean laoreet. Vestibulum nisi lectus, commodo ac, facilisis ac, ultricies eu, pede. Ut orci risus, accumsan porttitor, cursus quis, aliquet eget, justo. Sed pretium blandit orci. Ut eu diam at pede suscipit sodales. Aenean</p>
`;

// --- USER PROFILE ---
export const userProfile: Profile = {
  _id: 'user-mario-rossi',
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'mario.rossi@example.com',
  groupName: 'Team Italia',
  role: 'admin',
  birthDate: '1980-01-01',
  nationality: 'Italiana',
  mobilePhone: '+39 333 1234567',
  imageUrl: 'https://i.pravatar.cc/150?u=mario-rossi',
};


// --- TRIP DATA ---
const eventDetails: EventDetails = {
  title: 'Abu Dhabi Incentive 2025',
  subtitle: 'Abu Dhabi, UAE | 6-10 Novembre 2025',
  brandImageUrl: 'https://i.imgur.com/8Qz5a2C.png',
  backgroundImageUrl: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?q=80&w=2070',
  registrationDeadline: '30 Settembre 2025',
  departureGroup: ['Milano Malpensa', 'Roma Fiumicino', 'Venezia'],
  allowCompanion: false,
  allowBusiness: false,
};

const announcements: Announcement[] = [
  {
    id: 1,
    title: 'Codice di abbigliamento',
    content: 'Per la visita alla Grande Moschea è richiesto un abbigliamento consono. Per la serata nel deserto si consiglia un abbigliamento comodo e una giacca leggera.',
  },
];

const agenda: AgendaDay[] = [
  {
    day: 1,
    title: 'Italia / Abu Dhabi',
    date: 'Giovedì 6 Novembre 2025',
    items: [
      {
        id: 101, category: 'Travel', icon: 'flight_takeoff', time: 'Mattina',
        title: 'Partenza per Abu Dhabi', 
        description: 'Ritrovo degli Ospiti BEVERAGE NETWORK agli aeroporti di Milano Malpensa e Roma Fiumicino, incontro con le assistenti aeroportuali e disbrigo delle pratiche d\'imbarco. Partenza con voli di linea Etihad.',
      },
      {
        id: 102, category: 'Hotel', icon: 'hotel', time: 'Serata',
        title: 'Arrivo e Check-in', 
        description: 'Arrivo all\'aeroporto di Abu Dhabi, incontro con le guide locali parlanti italiano e trasferimento in Hotel. Arrivo all\'hotel Emirates Palace, check-in, assegnazione delle camere riservate e pernottamento.',
        image: {
          urls: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070'],
          caption: 'Emirates Palace Hotel',
          details: [
            { icon: 'location_on', text: 'West Corniche Road - Abu Dhabi' },
          ]
        }
      },
    ]
  },
  {
    day: 2,
    title: 'Abu Dhabi',
    date: 'Venerdì 7 Novembre 2025',
    items: [
       {
        id: 200, icon: 'breakfast_dining', time: 'Mattina',
        title: 'Prima Colazione',
        description: 'Prima colazione in hotel.',
       },
       {
        id: 201, category: 'Activity', icon: 'beach_access', time: 'Mattina',
        title: 'Relax al Resort', 
        description: 'Mattinata dedicata al relax al Resort.',
       },
       {
        id: 202, category: 'Restaurant', icon: 'lunch_dining', time: 'Pranzo',
        title: 'Pranzo in Hotel', 
        description: 'Pranzo in uno dei ristoranti del resort.',
       },
       {
        id: 203, category: 'Activity', icon: 'museum', time: 'Pomeriggio',
        title: 'Visita di Abu Dhabi', 
        description: 'Visita della Grande Moschea dello Sceicco Zayed e del magnifico Museo Louvre.',
        longDescription: 'Abu Dhabi è una delle nazioni più giovani al mondo, nata però da un passato antichissimo. Meno di un secolo fa era una stazione di pesca e raccolta di perle, oggi è una città lussureggiante con grattacieli di vetro da Guinness dei Primati, grandi viali alberati e lunghissime spiagge pubbliche. Tutto è fuori misura: c\'è la torre più storta del mondo, il tappeto fatto a mano più grande del mondo, il parco di divertimenti più esteso del mondo. Qui si vedono sfrecciare Ferrari, Lamborghini e Rolls Royce con la frequenza con cui si incontrano le utilitarie a Milano e ci si imbatte in hotel che valgono 3 miliardi di dollari (l\'Emirates Palace ha una cupola dorata più grande di quella della Cattedrale di St.Paul a Londra).',
        image: {
          urls: [
            'https://images.unsplash.com/photo-1595017013938-c6144883c408?q=80&w=2070',
            'https://images.unsplash.com/photo-1632868114441-325cd0b171a7?q=80&w=1932'
          ],
          caption: 'Grande Moschea Sheikh Zayed & Louvre Abu Dhabi',
        },
       },
       {
        id: 204, category: 'Restaurant', icon: 'restaurant', time: 'Serata',
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
        id: 300, icon: 'breakfast_dining', time: 'Mattina',
        title: 'Prima Colazione', description: 'Prima colazione in hotel.',
       },
       {
        id: 301, category: 'Meeting', icon: 'mic', time: 'Mattina',
        title: 'MEETING BEVERAGE NETWORK', 
        description: 'Mattinata dedicata al MEETING BEVERAGE NETWORK Soci, Birra Castello e Fornitori.',
       },
       {
        id: 302, category: 'Restaurant', icon: 'lunch_dining', time: 'Pranzo',
        title: 'Pranzo al Ristorante Vendôme', 
        description: 'Pranzo in hotel al Ristorante Vendôme.',
       },
       {
        id: 303, category: 'Activity', icon: 'surfing', time: 'Pomeriggio',
        title: 'Dune Bashing nel Deserto', 
        description: 'Nel pomeriggio partenza per il deserto, dove si vivrà l’esperienza del Dune Bashing.',
        longDescription: 'Il Dune Bashing nel deserto di Abu Dhabi è un modo fantastico per esplorare la grande distesa desertica, grazie alle sue alte dune e alle sue imponenti vallate di sabbia, cavalcando a bordo delle jeep le dune quasi come su di un rollercoaster.',
        image: {
          urls: ['https://images.unsplash.com/photo-1522201949576-d3a89cde9943?q=80&w=2070'],
          caption: 'Safari nel deserto',
        }
       },
        {
        id: 304, category: 'Restaurant', icon: 'celebration', time: 'Serata',
        title: 'Cocktail Campari e Cena nel Deserto', 
        description: 'Al tramonto, il suggestivo Cocktail Campari nel deserto seguito da una Cena sotto le stelle.',
        }
    ]
  },
  {
      day: 4,
      title: 'Abu Dhabi',
      date: 'Domenica 9 Novembre 2025',
      items: [
        {
          id: 400, icon: 'breakfast_dining', time: 'Mattina',
          title: 'Prima Colazione', description: 'Prima colazione in hotel.',
        },
        {
          id: 401, category: 'Activity', icon: 'spa', time: 'Intera Giornata',
          title: 'Relax o Visite Individuali', 
          description: 'Intera giornata a disposizione per il relax o per visite individuali.',
        },
        {
          id: 402, category: 'Restaurant', icon: 'lunch_dining', time: 'Pranzo',
          title: 'Pranzo al Ristorante Sand & Koal', 
          description: 'Pranzo in Hotel al Ristorante Sand & Koal.',
           image: {
            urls: ['https://images.unsplash.com/photo-1559394611-5a5857fe554d?q=80&w=1974'],
            caption: 'Sand & Koal Restaurant'
          }
        },
        {
          id: 403, category: 'Restaurant', icon: 'nightlife', time: 'Cena',
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
          id: 501, icon: 'breakfast_dining', time: 'Mattina',
          title: 'Prima Colazione', 
          description: 'Prima colazione a buffet al resort.',
        },
        {
          id: 502, category: 'Hotel', icon: 'logout', time: 'Mattina',
          title: 'Check-out dall\'Hotel',
          description: 'Rilascio delle camere e saldo degli extra personali.'
        },
        {
          id: 504, category: 'Travel', icon: 'flight_takeoff', time: 'Tarda Mattinata',
          title: 'Trasferimento e Partenza per l\'Italia', 
          description: 'Trasferimento all\'aeroporto di Abu Dhabi in tempo utile al disbrigo delle pratiche d\'imbarco e partenza con voli di linea Etihad alla volta di Milano Malpensa e Roma Fiumicino. Arrivo in Italia in serata.',
        },
      ]
  }
];

export const tripData: TripData = {
  eventDetails,
  agenda,
  announcements,
};


// --- TRAVEL INFO ---
const outboundFlights: Flight[] = [
  {
    id: 'fl_mxp_out', airline: 'Etihad Airways', flightNumber: 'EY 82', departureGroup: 'Milano Malpensa',
    departure: { airport: 'Milano Malpensa', code: 'MXP', time: '09:55', date: '06 Novembre 2025' },
    arrival: { airport: 'Abu Dhabi', code: 'AUH', time: '19:00', date: '06 Novembre 2025' },
    duration: '06h05',
  },
  {
    id: 'fl_fco_out', airline: 'Etihad Airways', flightNumber: 'EY 86', departureGroup: 'Roma Fiumicino',
    departure: { airport: 'Roma Fiumicino', code: 'FCO', time: '09:55', date: '06 Novembre 2025' },
    arrival: { airport: 'Abu Dhabi', code: 'AUH', time: '19:00', date: '06 Novembre 2025' },
    duration: '06h05',
  },
  {
    id: 'fl_vce_fco_out', airline: 'ITA Airways', flightNumber: 'AZ1460', departureGroup: 'Venezia',
    departure: { airport: 'Venezia', code: 'VCE', time: '06:15', date: '06 Novembre 2025' },
    arrival: { airport: 'Roma Fiumicino', code: 'FCO', time: '07:25', date: '06 Novembre 2025' },
    duration: '01h10',
  },
  {
    id: 'fl_vce_conn_out', airline: 'Etihad Airways', flightNumber: 'EY 86', departureGroup: 'Venezia',
    departure: { airport: 'Roma Fiumicino', code: 'FCO', time: '09:55', date: '06 Novembre 2025' },
    arrival: { airport: 'Abu Dhabi', code: 'AUH', time: '19:00', date: '06 Novembre 2025' },
    duration: '06h05',
  },
];

const returnFlights: Flight[] = [
  {
    id: 'fl_mxp_ret', airline: 'Etihad Airways', flightNumber: 'EY 79', departureGroup: 'Milano Malpensa',
    departure: { airport: 'Abu Dhabi', code: 'AUH', time: '14:25', date: '10 Novembre 2025' },
    arrival: { airport: 'Milano Malpensa', code: 'MXP', time: '18:20', date: '10 Novembre 2025' },
    duration: '06h55',
  },
  {
    id: 'fl_fco_ret', airline: 'Etihad Airways', flightNumber: 'EY 83', departureGroup: 'Roma Fiumicino',
    departure: { airport: 'Abu Dhabi', code: 'AUH', time: '14:25', date: '10 Novembre 2025' },
    arrival: { airport: 'Roma Fiumicino', code: 'FCO', time: '17:55', date: '10 Novembre 2025' },
    duration: '06h30',
  },
  {
    id: 'fl_vce_conn_ret', airline: 'Etihad Airways', flightNumber: 'EY 83', departureGroup: 'Venezia',
    departure: { airport: 'Abu Dhabi', code: 'AUH', time: '14:25', date: '10 Novembre 2025' },
    arrival: { airport: 'Roma Fiumicino', code: 'FCO', time: '17:55', date: '10 Novembre 2025' },
    duration: '06h30',
  },
  {
    id: 'fl_fco_vce_ret', airline: 'ITA Airways', flightNumber: 'AZ1473', departureGroup: 'Venezia',
    departure: { airport: 'Roma Fiumicino', code: 'FCO', time: '21:40', date: '10 Novembre 2025' },
    arrival: { airport: 'Venezia', code: 'VCE', time: '22:45', date: '10 Novembre 2025' },
    duration: '01h05',
  },
];

const emergencyContacts: EmergencyContact[] = [
  { id: 'ec1', departureGroup: '', name: 'Assistenza Viaggio 24/7', phone: '+39 02 123456', type: 'Supporto H24', email: 'supporto@viaggi.it' },
  { id: 'ec2', departureGroup: '', name: 'Ambulanza', phone: '998', type: 'Emergenza Medica (UAE)' },
  { id: 'ec3', departureGroup: '', name: 'Polizia', phone: '999', type: 'Emergenza Generale (UAE)' },
];

export const travelInfo: TravelInfo = {
  welcomeBannerImageUrl: 'https://images.unsplash.com/photo-1570211139413-586833a69363?q=80&w=2000',
  outboundFlightInfo: { title: 'Informazioni Volo di Andata', content: 'Si prega di arrivare in aeroporto almeno 3 ore prima della partenza del volo. I banchi check-in chiudono 60 minuti prima del decollo.' },
  returnFlightInfo: { title: 'Informazioni Volo di Ritorno', content: 'Il trasferimento per l\'aeroporto partirà dall\'hotel 4 ore prima dell\'orario di partenza del volo.' },
  outboundFlights,
  returnFlights,
  emergencyContacts,
};


// --- REGISTRATION FORM CONFIG ---
export const registrationFormConfig: RegistrationFormConfig = [
    {
      id: 'participantData',
      title: 'Dati Partecipante',
      fields: [
        { id: 'companyName', name: 'companyName', label: 'Ragione Sociale', type: 'text', required: true },
        { id: 'firstName', name: 'firstName', label: 'Nome', type: 'text', required: true },
        { id: 'lastName', name: 'lastName', label: 'Cognome', type: 'text', required: true },
        { id: 'birthDate', name: 'birthDate', label: 'Data di Nascita', type: 'date', required: true },
        { id: 'nationality', name: 'nationality', label: 'Nazionalità', type: 'text', required: true },
        { id: 'mobilePhone', name: 'mobilePhone', label: 'N. Tel. Cellulare', type: 'tel', required: true },
        { id: 'email', name: 'email', label: 'E-mail', type: 'email', required: true },
        {
          id: 'passportInRenewal',
          name: 'passportInRenewal',
          label: '',
          type: 'checkbox',
          checkboxLabel: 'Passaporto in fase di rinnovo',
          required: false,
        },
        {
          id: 'passportNumber',
          name: 'passportNumber',
          label: 'N. Passaporto',
          type: 'text',
          required: true,
        },
        { id: 'passportIssueDate', name: 'passportIssueDate', label: 'Data di Emissione (Passaporto)', type: 'date', required: true },
        { 
          id: 'passportExpiryDate', 
          name: 'passportExpiryDate', 
          label: 'Data di Scadenza (Passaporto)', 
          type: 'date', 
          required: true,
        },
        { 
          id: 'foodRequirements', 
          name: 'foodRequirements', 
          label: 'Esigenze Alimentari', 
          type: 'text', 
          required: false,
          note: 'Es. eventuali allergie, dieta vegetariana, vegana, gluten free ecc'
        },
      ]
    },
    {
      id: 'logistics',
      title: 'Logistica',
      fields: [
        {
          id: 'roomType',
          name: 'roomType',
          label: 'Tipologia Camera',
          type: 'select',
          required: true,
          options: ['Matrimoniale', 'Doppia Letti separati', 'Doppia uso singola']
        },
        {
          id: 'departureAirport',
          name: 'departureAirport',
          label: "Selezionare l'Aeroporto di Partenza",
          type: 'select',
          required: true,
          options: ['Milano Malpensa', 'Roma Fiumicino', 'Venezia'],
          note: "I voli diretti sono previsti da Milano e Roma. La partenza da Venezia potrebbe comportare uno scalo e un supplemento di costo."
        },
        {
          id: 'businessClass',
          name: 'businessClass',
          label: 'Indicare se si desidera viaggiare in Business',
          type: 'select',
          required: true,
          options: ['Sì (con supplemento)', 'No']
        }
      ]
    },
    {
      id: 'companion',
      title: 'Accompagnatore (Opzionale)',
      fields: [
        {
          id: 'hasCompanion',
          name: 'hasCompanion',
          label: 'Selezionare per inserire i dati dell\'accompagnatore.',
          type: 'checkbox',
          checkboxLabel: 'Sì, verrò accompagnato/a.',
          controlsFields: [
            { id: 'companionFirstName', name: 'companionFirstName', label: 'Nome Accompagnatore', type: 'text', required: true },
            { id: 'companionLastName', name: 'companionLastName', label: 'Cognome Accompagnatore', type: 'text', required: true },
            { id: 'companionBirthDate', name: 'companionBirthDate', label: 'Data di Nascita Accompagnatore', type: 'date', required: true },
            { id: 'companionNationality', name: 'companionNationality', label: 'Nazionalità Accompagnatore', type: 'text', required: true },
            {
              id: 'companionPassportInRenewal',
              name: 'companionPassportInRenewal',
              label: '',
              type: 'checkbox',
              checkboxLabel: 'Passaporto in fase di rinnovo',
              required: false,
            },
            {
              id: 'companionPassportNumber',
              name: 'companionPassportNumber',
              label: 'N. Passaporto Accompagnatore',
              type: 'text',
              required: true,
            },
            { id: 'companionPassportIssueDate', name: 'companionPassportIssueDate', label: 'Data di Emissione (Passaporto) Accompagnatore', type: 'date', required: true },
            { 
              id: 'companionPassportExpiryDate', 
              name: 'companionPassportExpiryDate', 
              label: 'Data di Scadenza (Passaporto) Accompagnatore', 
              type: 'date', 
              required: true,
            },
            { 
              id: 'companionFoodRequirements', 
              name: 'companionFoodRequirements', 
              label: 'Esigenze Alimentari Accompagnatore', 
              type: 'text', 
              required: false,
              note: 'Es. eventuali allergie, dieta vegetariana, vegana, gluten free ecc'
            },
            {
              id: 'companionMeeting',
              name: 'companionMeeting',
              label: 'Meeting Beverage Network (per Accompagnatore)',
              type: 'radio',
              required: true,
              options: ['Sì, partecipo', 'No, non partecipo'],
              note: 'Campo richiesto solo per l\'eventuale accompagnatore'
            }
          ]
        } as ConditionalFormField
      ]
    },
    {
      id: 'consents',
      title: 'Consensi',
      fields: [
        {
          id: 'dataProcessingConsent',
          name: 'dataProcessingConsent',
          label: 'Consenso Trattamento Dati Personali (Partecipante)',
          type: 'radio',
          required: true,
          options: ['Acconsento', 'Non Acconsento'],
          note: 'Per procedere, è necessario prendere visione dell\'[Informativa sulla Privacy](privacy).'
        },
        {
          id: 'consentCompanion',
          name: 'dataProcessingConsentCompanion',
          label: 'Consenso Trattamento Dati Personali (Accompagnatore)',
          type: 'radio',
          required: false,
          options: ['Acconsento', 'Non Acconsento'],
          note: 'Per procedere, è necessario prendere visione dell\'[Informativa sulla Privacy](privacy).'
        },
        {
          id: 'penaltiesAcknowledgement',
          name: 'penaltiesAcknowledgement',
          label: 'Presa Visione di Penali, Rimborsi e Assicurazioni',
          type: 'radio',
          required: true,
          options: ['Sì', 'No'],
          note: 'Per procedere, è necessario prendere visione dei [Termini e Condizioni](terms).'
        }
      ]
    },
    {
      id: 'billing',
      title: 'Fatturazione',
      fields: [
        { id: 'billingName', name: 'billingName', label: 'Intestatario Fattura', type: 'text', required: true },
        { id: 'billingAddress', name: 'billingAddress', label: 'Indirizzo di Fatturazione', type: 'text', required: true },
        { id: 'billingVat', name: 'billingVat', label: 'Partita IVA', type: 'text', required: true },
        { id: 'billingSdi', name: 'billingSdi', label: 'Codice SDI', type: 'text', required: true },
      ]
    }
];

export const privacyPolicy = {
    title: 'Informativa sulla Privacy',
    content: loremIpsum,
};

export const termsAndConditions = {
    title: 'Termini e Condizioni',
    content: loremIpsum,
};

// --- GALLERY PHOTOS ---
export const galleryPhotos: Photo[] = [
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
    likes: 15,
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1595017013938-c6144883c408?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595017013938-c6144883c408?q=80&w=400',
    userId: 'user-giuseppe-verdi',
    userName: 'Giuseppe Verdi',
    userImageUrl: 'https://i.pravatar.cc/150?u=giuseppe-verdi',
    caption: 'La Grande Moschea è mozzafiato.',
    day: 2,
    timestamp: '2025-11-07T16:15:00Z',
    likes: 28,
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1632868114441-325cd0b171a7?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1632868114441-325cd0b171a7?q=80&w=400',
    userId: 'user-mario-rossi',
    userName: 'Mario Rossi',
    userImageUrl: 'https://i.pravatar.cc/150?u=mario-rossi',
    caption: 'Arte e architettura al Louvre di Abu Dhabi.',
    day: 2,
    timestamp: '2025-11-07T18:05:00Z',
    likes: 42,
  },
   {
    id: 4,
    url: 'https://images.unsplash.com/photo-1522201949576-d3a89cde9943?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522201949576-d3a89cde9943?q=80&w=400',
    userId: 'user-anna-neri',
    userName: 'Anna Neri',
    userImageUrl: 'https://i.pravatar.cc/150?u=anna-neri',
    caption: 'Che avventura nel deserto!',
    day: 3,
    timestamp: '2025-11-08T17:20:00Z',
    likes: 56,
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1542355833-31e7f0b35539?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542355833-31e7f0b35539?q=80&w=400',
    userId: 'user-laura-bianchi',
    userName: 'Laura Bianchi',
    userImageUrl: 'https://i.pravatar.cc/150?u=laura-bianchi',
    caption: 'Tramonto magico tra le dune.',
    day: 3,
    timestamp: '2025-11-08T18:45:00Z',
    likes: 72,
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1601042879364-85a4848f87e9?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601042879364-85a4848f87e9?q=80&w=400',
    userId: 'user-giuseppe-verdi',
    userName: 'Giuseppe Verdi',
    userImageUrl: 'https://i.pravatar.cc/150?u=giuseppe-verdi',
    caption: 'Cena di arrivederci spettacolare!',
    day: 4,
    timestamp: '2025-11-09T21:00:00Z',
    likes: 33,
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1629528915128-17c37a0d4a94?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1629528915128-17c37a0d4a94?q=80&w=400',
    userId: 'user-mario-rossi',
    userName: 'Mario Rossi',
    userImageUrl: 'https://i.pravatar.cc/150?u=mario-rossi',
    caption: 'Yas Marina Circuit di sera.',
    day: 2,
    timestamp: '2025-11-07T20:50:00Z',
    likes: 19,
  },
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400',
    userId: 'user-anna-neri',
    userName: 'Anna Neri',
    userImageUrl: 'https://i.pravatar.cc/150?u=anna-neri',
    caption: 'La vista dalla nostra camera.',
    day: 1,
    timestamp: '2025-11-06T22:00:00Z',
    likes: 61,
  }
];