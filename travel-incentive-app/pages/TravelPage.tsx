import React from 'react';
import { TravelInfo, Flight, InfoBoxContent } from '../types';
import useAuth from '../hooks/useAuth';

interface TravelPageProps {
  travelInfo: TravelInfo;
  userRegistration?: {[key: string]: any} | null;
}

const FlightCard: React.FC<{ flight: Flight }> = ({ flight }) => (
    <div className="bg-white rounded-xl shadow p-6 mb-4 border border-gray-200">
        <div className="text-center mb-4">
            <p className="text-sm font-semibold text-gray-800">
                {flight.departure.date}
            </p>
        </div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">{flight.airline}</h3>
            <span className="text-sm font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{flight.flightNumber}</span>
        </div>
        <div className="flex justify-between items-center">
            <div className="text-left w-2/5">
                <p className="text-2xl font-bold text-blue-600">{flight.departure.code}</p>
                <p className="text-sm text-gray-500 truncate">{flight.departure.airport}</p>
                <p className="text-sm text-gray-700">{flight.departure.time}</p>
            </div>

            <div className="text-center flex-grow mx-2">
                <div className="relative">
                    <div className="absolute w-full top-1/2 -translate-y-1/2 border-t border-dashed border-gray-300"></div>
                    <div className="relative inline-block bg-white px-2">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-sky-500">flight</span>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{flight.duration}</p>
            </div>
            
            <div className="text-right w-2/5">
                <p className="text-2xl font-bold text-blue-600">{flight.arrival.code}</p>
                <p className="text-sm text-gray-500 truncate">{flight.arrival.airport}</p>
                 <p className="text-sm text-gray-700">{flight.arrival.time}</p>
            </div>
        </div>
    </div>
);

const InfoBox: React.FC<{ info: InfoBoxContent }> = ({ info }) => (
    <div className="bg-sky-100 rounded-xl p-5 flex items-start space-x-4 mb-4">
        <span className="material-symbols-outlined text-sky-600 mt-1">info</span>
        <div>
            <h4 className="font-bold text-gray-900 text-base">{info.title}</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
                {info.content}
            </p>
        </div>
    </div>
);

const TravelPage: React.FC<TravelPageProps> = ({ travelInfo, userRegistration }) => {
  const { outboundFlights, returnFlights } = travelInfo;
  const { user } = useAuth();
  const firstName = user ? user.firstName : 'Viaggiatore';

  // Filtra i voli basandosi sulla registrazione dell'utente
  const getUserFlights = (allFlights: Flight[], direction: 'outbound' | 'return') => {
    if (!userRegistration) return allFlights; // Se non registrato, mostra tutti
    
    // Per utenti registrati, mostra tutti i voli del loro gruppo di partenza
    const userDepartureAirport = userRegistration.form_data?.departureAirport;
    if (userDepartureAirport) {
      return allFlights.filter(flight => flight.departureGroup === userDepartureAirport);
    }
    
    return allFlights;
  };

  const userOutboundFlights = getUserFlights(outboundFlights, 'outbound');
  const userReturnFlights = getUserFlights(returnFlights, 'return');

  const groupFlights = (flights: Flight[]): Record<string, Flight[]> => {
    if (!flights) return {};
    return flights.reduce((acc, flight) => {
      const groupKey = flight.departureGroup || 'Generale';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(flight);
      return acc;
    }, {} as Record<string, Flight[]>);
  };

  const groupedOutboundFlights = groupFlights(userOutboundFlights);
  const groupedReturnFlights = groupFlights(userReturnFlights);
  const outboundGroups = Object.keys(groupedOutboundFlights);
  const returnGroups = Object.keys(groupedReturnFlights);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      
      {/* User Registration Status */}
      {userRegistration && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-green-600 mr-3">check_circle</span>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Registrazione Completata</h3>
              <p className="text-green-700">
                Hai selezionato l'aeroporto di partenza: <strong>{userRegistration.form_data?.departureAirport || 'N/A'}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Outbound Flights Section */}
      {userOutboundFlights && userOutboundFlights.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A2C47] mb-4">
            {userRegistration ? `I Tuoi Voli di Andata da ${userRegistration.form_data?.departureAirport}` : "Voli di Andata Disponibili"}
          </h2>
          <InfoBox info={travelInfo.outboundFlightInfo} />
          {outboundGroups.map(groupName => (
            <div key={groupName} className="mt-6">
              {groupedOutboundFlights[groupName].map(flight => <FlightCard key={flight.id} flight={flight} />)}
            </div>
          ))}
        </section>
      )}

      {/* Return Flights Section */}
      {userReturnFlights && userReturnFlights.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-[#1A2C47] mb-4">
            {userRegistration ? `I Tuoi Voli di Ritorno per ${userRegistration.form_data?.departureAirport}` : "Voli di Ritorno Disponibili"}
          </h2>
          <InfoBox info={travelInfo.returnFlightInfo} />
           {returnGroups.map(groupName => (
            <div key={groupName} className="mt-6">
              {groupedReturnFlights[groupName].map(flight => <FlightCard key={flight.id} flight={flight} />)}
            </div>
          ))}
        </section>
      )}
      
      {/* Emergency Contacts Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-[#1A2C47] mb-4">Contatti Utili</h2>
        <div className="space-y-3">
          {travelInfo.emergencyContacts
            .filter(contact => {
              // Mostra il contatto se:
              // 1. Non ha targetAirports (contatto generale)
              // 2. O ha l'aeroporto di partenza dell'utente nei targetAirports
              const userAirport = userRegistration?.form_data?.departureAirport;
              return !contact.targetAirports ||
                     contact.targetAirports.length === 0 ||
                     (userAirport && contact.targetAirports.includes(userAirport));
            })
            .map(contact => {
            const displayName = (contact.firstName || contact.lastName)
              ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
              : contact.name || '';
            return (
            <div key={contact.id} className="bg-white rounded-xl shadow p-4 border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-base text-gray-900">{displayName}</p>
                  <p className="text-sm text-gray-500">{contact.type}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} aria-label={`Call ${displayName}`} className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 hover:bg-sky-200 transition-colors duration-200">
                    <span className="material-symbols-outlined text-sky-600">call</span>
                  </a>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </section>
    </div>
  );
};

export default TravelPage;