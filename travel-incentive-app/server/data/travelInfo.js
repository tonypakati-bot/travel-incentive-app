const travelInfo = {
  welcomeBannerImageUrl: 'https://images.unsplash.com/photo-1570211139413-586833a69363?q=80&w=2000',
  outboundFlightInfo: {
    title: 'Informazioni Volo di Andata',
    content: 'Si prega di arrivare in aeroporto almeno 3 ore prima della partenza del volo.'
  },
  returnFlightInfo: {
    title: 'Informazioni Volo di Ritorno',
    content: 'Il trasferimento per l\'aeroporto partirà dall\'hotel 4 ore prima dell\'orario di partenza del volo.'
  },
  outboundFlights: [],
  returnFlights: [],
  emergencyContacts: [
    {
      id: 'ec1',
      departureGroup: '',
      name: 'Assistenza Viaggio 24/7',
      phone: '+39 02 123456',
      type: 'Supporto H24',
      email: 'supporto@viaggi.it'
    }
  ]
};

module.exports = travelInfo;