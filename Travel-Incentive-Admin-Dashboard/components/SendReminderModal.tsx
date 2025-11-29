import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';

interface SendReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (subject: string, body: string) => void;
    participantCount: number;
}

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
        {...props}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition read-only:bg-gray-100 read-only:cursor-not-allowed"
    />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea 
        {...props}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition read-only:bg-gray-100 read-only:cursor-not-allowed"
    />
);

// Constants moved outside the component to prevent re-creation on every render
const tripName = "Trip to Ibiza";
const registrationDeadline = "31 Luglio, 2026";
const supportContact = "il nostro team di supporto";
const supportContactDetails = "support@example.com";
const organizingTeam = "Il Team Organizzativo";
const companyName = "IncentiveTravel";

const defaultSubject = `🔔 ULTIMO PROMEMORIA: Completa la tua Registrazione al ${tripName} – Scadenza ${registrationDeadline}`;
const defaultBody = `Ciao [Nome del Destinatario],

Ti scriviamo come cortese sollecito per ricordarti di completare la tua registrazione per il ${tripName}.

La tua scheda di adesione non è ancora stata finalizzata. Ti preghiamo di farlo entro e non oltre la data di scadenza perentoria del ${registrationDeadline} per assicurarti il tuo posto.

Per completare la tua iscrizione, segui questo link:

[LINK ALLA SCHEDA DI ADESIONE]

Perché è Importante agire Ora:
La compilazione tempestiva della scheda è cruciale per poter procedere con le prenotazioni logistiche fondamentali, quali:

Biglietteria Aerea: Emissione del tuo biglietto.
Alloggi: Prenotazione definitiva della tua sistemazione.
Esperienze: Conferma della tua partecipazione alle attività esclusive in programma.

Dopo la scadenza del ${registrationDeadline}, purtroppo non saremo più in grado di garantire la tua partecipazione a causa delle tempistiche di prenotazione richieste dai fornitori.

Se hai già inviato la scheda, ti preghiamo di ignorare questo messaggio. Se invece stai riscontrando problemi tecnici, rispondi a questa email o contatta ${supportContact} al ${supportContactDetails}.

Non vediamo l'ora di averti a bordo!

Cordiali saluti,

${organizingTeam}
${companyName}`;


const SendReminderModal: React.FC<SendReminderModalProps> = ({ isOpen, onClose, onSend, participantCount }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState(defaultBody);

    useEffect(() => {
        if (isOpen) {
            setIsEditing(false);
            setSubject(defaultSubject);
            setBody(defaultBody);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Invia Reminder</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-6">
                        Stai per inviare una mail di promemoria a <span className="font-bold">{participantCount}</span> partecipante/i. {isEditing ? 'Modifica il testo qui sotto.' : 'Controlla il testo qui sotto o clicca "Modifica" per personalizzarlo.'}
                    </p>
                    <div className="space-y-4">
                        <FormField label="Oggetto">
                            <Input value={subject} onChange={e => setSubject(e.target.value)} readOnly={!isEditing} />
                        </FormField>
                        <FormField label="Corpo della Mail">
                            <Textarea value={body} onChange={e => setBody(e.target.value)} rows={18} readOnly={!isEditing} />
                        </FormField>
                    </div>
                </div>

                <footer className="flex justify-end items-center space-x-4 p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Annulla
                    </button>
                    {isEditing ? (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Fine
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Modifica
                        </button>
                    )}
                    <button
                        onClick={() => onSend(subject, body)}
                        className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Invia Reminder
                    </button>
                </footer>
            </div>
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeInScale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                .animate-fade-in-scale {
                    animation: fadeInScale 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SendReminderModal;