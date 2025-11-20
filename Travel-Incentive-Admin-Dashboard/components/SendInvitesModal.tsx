import React, { useState, useEffect } from 'react';
import { XIcon, InformationCircleIcon } from './icons';

interface SendInvitesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (emailBody: string) => void;
    tripName: string;
    inviteeCount: number;
    initialBody?: string;
}

const defaultEmailPreviewText = `OGGETTO: INVITO RISERVATO E PERSONALE

Bergamo, 12 Giugno 2025

Oggetto: Meeting Beverage Network 2025
 
Caro Enrico,

Come nostra consuetudine e tradizione siamo pronti per il meeting autunnale. Un momento molto importante durante il quale la grande famiglia Beverage Network si ritrova ed insieme incontra i suoi partner industriali più rilevanti.  

Per questo motivo e con grande entusiasmo ho il piacere di invitarTi al meeting che si terrà dal 6 al 10 Novembre 2025 ad Abu Dhabi, la perla scintillante del Golfo, dove si incontrano lusso e tradizione, passato e futuro.

Mi auguro di poter trascorrere insieme questo periodo in un clima ed un'atmosfera serena ispirati dall’energia innovativa della Capitale degli Emirati. Come di consueto alterneremo relax e convivialità ad importanti spazi dedicati al nostro lavoro.

Parteciperanno anche quest'anno i nostri partner industriali più rilevanti.  

L'invito è strettamente personale e non cedibile. Ricordo che per un eventuale accompagnatore abbiamo previsto un contributo sulla quota di partecipazione. 

La quota sarà diversa per eventuali ulteriori partecipanti o aggregati esterni non operativi in azienda. Per questo dovrà essere richiesto oltre che il preventivo anche la disponibilità alla sede Beverage Network che vi informerà dettagliatamente in base alla capienza.  

In allegato troverai tutte le necessarie informazioni per soci, affiliati ed accompagnatori.  La scheda di adesione on-line (necessaria per ogni partecipante) dovrà essere compilata tassativamente cliccando al seguente link entro e non oltre il 18 Luglio 2025.  

[LINK ALLA SCHEDA DI ADESIONE]

Nell’attesa di incontrarTi in questo importante appuntamento, l'occasione mi è gradita per porgere a titolo personale, dell’intero consiglio di amministrazione e dei nostri più stretti collaboratori il più cordiale Arrivederci nell'oasi di bellezza ed innovazione nel cuore del deserto: Abu Dhabi!

 
Beverage Network 

Società Consortile a responsabilità limitata
Il Presidente
Antonio Portaccio`;

const SendInvitesModal: React.FC<SendInvitesModalProps> = ({ isOpen, onClose, onSend, tripName, inviteeCount, initialBody }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [emailContent, setEmailContent] = useState(initialBody || defaultEmailPreviewText);
    const [isSending, setIsSending] = useState(false);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsEditing(false);
            setEmailContent(initialBody || defaultEmailPreviewText);
        }
    }, [isOpen, initialBody]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Conferma Invio Inviti</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <p className="text-gray-600 mb-4">
                        Stai per inviare <span className="font-bold text-gray-800">{inviteeCount}</span> inviti per il viaggio <span className="font-bold text-gray-800">"{tripName}"</span>.
                    </p>
                    <p className="text-gray-600 mb-6">
                        Vuoi procedere?
                    </p>
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-start">
                        <InformationCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                            Una volta inviati, i partecipanti riceveranno una mail con il link per la registrazione. Questa azione non può essere annullata.
                        </p>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Anteprima Email</h3>
                        <textarea
                            value={emailContent}
                            onChange={(e) => setEmailContent(e.target.value)}
                            rows={15}
                            readOnly={!isEditing}
                            className="w-full p-4 font-sans text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition read-only:bg-gray-100 read-only:cursor-not-allowed"
                            aria-label="Email content"
                        />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <input id="saveTemplate" type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} className="h-4 w-4" />
                        <label htmlFor="saveTemplate" className="text-sm text-gray-700">Salva come template per questo viaggio</label>
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
                            disabled={isSending}
                            className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Fine
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={isSending}
                            className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Modifica
                        </button>
                    )}
                    <button
                        onClick={async () => {
                            if (isSending) return;
                            setIsSending(true);
                            try {
                                await onSend(emailContent, saveAsTemplate);
                            } catch (e) {
                                // swallow, parent shows errors
                            } finally {
                                setIsSending(false);
                            }
                        }}
                        disabled={isSending}
                        className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                        {isSending ? 'Invio in corso...' : 'Conferma e Invia'}
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

export default SendInvitesModal;