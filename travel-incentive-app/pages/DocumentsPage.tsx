
import React, { useState } from 'react';
import { TravelInfo, Flight, UserDocument } from '../types';

interface DocumentsPageProps {
  travelInfo: TravelInfo;
  downloadableDocs: string[];
  userRegistration: { [key: string]: any } | null;
  userDocuments: UserDocument[];
}

interface BoardingPassCardProps {
    flight: Flight;
    disabled?: boolean;
}

const BoardingPassCard: React.FC<BoardingPassCardProps> = ({ flight, disabled = false }) => {
    const buttonClasses = disabled
        ? "w-full bg-gray-300 text-gray-500 font-bold py-3 px-4 rounded-lg flex items-center justify-center cursor-not-allowed"
        : "w-full bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 transition-colors duration-200 flex items-center justify-center";
    
    return (
        <div className="bg-white rounded-xl shadow p-5 mb-4 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-semibold text-gray-500">{flight.departure.date}</p>
                    <h3 className="font-bold text-lg text-gray-800">{flight.airline} - {flight.flightNumber}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-sky-500">flight_takeoff</span>
                </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-700 mb-5">
                <div className="text-left w-2/5">
                    <p className="font-bold text-xl text-blue-600">{flight.departure.code}</p>
                    <p className="text-xs text-gray-500 truncate">{flight.departure.airport}</p>
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
                    <p className="font-bold text-xl text-blue-600">{flight.arrival.code}</p>
                    <p className="text-xs text-gray-500 truncate">{flight.arrival.airport}</p>
                </div>
            </div>
            
            <button className={buttonClasses} disabled={disabled}>
                <span className="material-symbols-outlined mr-2">download</span>
                Scarica Boarding Pass
            </button>
        </div>
    );
};

const DocumentsPage: React.FC<DocumentsPageProps> = ({ 
  travelInfo, 
  downloadableDocs, 
  userRegistration, 
  userDocuments
}) => {
  // Filtra i voli in base all'aeroporto di partenza dell'utente
  const userDepartureAirport = userRegistration?.form_data?.departureAirport;
  
  const filteredOutboundFlights = travelInfo.outboundFlights.filter(flight => 
    !userDepartureAirport || flight.departureGroup === userDepartureAirport
  );
  
  const filteredReturnFlights = travelInfo.returnFlights.filter(flight => 
    !userDepartureAirport || flight.departureGroup === userDepartureAirport
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto">
        {/* Boarding Passes Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-[#1A2C47] mb-4">Carte d'Imbarco</h2>
          {filteredOutboundFlights.map(flight => (
            <BoardingPassCard 
                key={flight.id} 
                flight={flight}
                disabled={!downloadableDocs.includes(flight.flightNumber)}
            />
          ))}
          {filteredReturnFlights.map(flight => (
            <BoardingPassCard 
                key={flight.id} 
                flight={flight}
                disabled={!downloadableDocs.includes(flight.flightNumber)}
            />
          ))}
        </section>

        {/* Personal Boarding Passes Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-[#1A2C47] mb-4">Le Mie Carte d'Imbarco</h2>
          
          {/* Documents List */}
          <div className="space-y-4">
            {userDocuments.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-200">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">flight_takeoff</span>
                <p className="text-gray-500">Nessuna carta d'imbarco disponibile</p>
                <p className="text-sm text-gray-400 mt-1">Le carte d'imbarco saranno disponibili a breve</p>
              </div>
            ) : (
              userDocuments.map((document) => (
                <div key={document._id} className="bg-white rounded-xl shadow p-5 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="material-symbols-outlined text-red-500 mr-2">picture_as_pdf</span>
                        <h4 className="font-bold text-gray-800 truncate">{document.originalName}</h4>
                      </div>
                      
                      {document.description && (
                        <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                      )}
                      
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>Dimensione: {formatFileSize(document.size)}</span>
                        <span>Caricato: {formatDate(document.uploadedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <a
                        href={`/api${document.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Scarica carta d'imbarco"
                      >
                        <span className="material-symbols-outlined">download</span>
                      </a>
                      
                      <a
                        href={`/api${document.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Visualizza carta d'imbarco"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DocumentsPage;
