import React from 'react';
import { EmergencyContact } from '../types';

interface ContactPageProps {
  emergencyContacts: EmergencyContact[];
  userRegistration: { [key: string]: any } | null;
}

const ContactPage: React.FC<ContactPageProps> = ({ emergencyContacts, userRegistration }) => {
  // Filtra contatti in base all'aeroporto di partenza dell'utente
  const userDepartureAirport = userRegistration?.form_data?.departureAirport;
  const filteredContacts = emergencyContacts.filter(contact => {
    // Se il contatto ha targetAirports specificati, controlla se l'utente ha selezionato uno di questi aeroporti
    if (contact.targetAirports && contact.targetAirports.length > 0) {
      return userDepartureAirport && contact.targetAirports.includes(userDepartureAirport);
    }
    // Altrimenti mostra il contatto a tutti
    return true;
  });
  return (
    <div className="p-4 bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="space-y-4">
          {filteredContacts.map(contact => {
            const displayName = (contact.firstName || contact.lastName)
              ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
              : contact.name || '';
            return (
              <div key={contact.id} className="block bg-white rounded-xl shadow-sm p-4 border border-gray-200/80">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-base text-gray-800">{displayName}</p>
                    <p className="text-sm text-gray-500">{contact.type}</p>
                    {contact.availability && (
                      <p className="text-xs text-gray-400 mt-1">{contact.availability}</p>
                    )}
                    {contact.languages && contact.languages.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Lingue: {contact.languages.join(', ')}
                      </p>
                    )}
                    {contact.services && contact.services.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Servizi: {contact.services.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} aria-label={`Call ${displayName}`} className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 hover:bg-sky-200 transition-colors duration-200">
                      <span className="material-symbols-outlined text-sky-600">call</span>
                    </a>
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} aria-label={`Email ${displayName}`} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors duration-200">
                        <span className="material-symbols-outlined text-gray-600">mail</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;