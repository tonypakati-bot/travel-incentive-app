import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from './icons';
import ConfirmModal from './ConfirmModal';
import { fetchTermsDocuments, createTermsDocument, updateTermsDocument, deleteTermsDocument } from '../services/documents';

const termsText = `PENALI, RIMBORSI E ASSICURAZIONI

PENALI
Dal 19 Luglio alla data partenza in caso di cancellazione la penale applicata sarà pari al 100% della quota.

RIMBORSI
Nessun rimborso verrà riconosciuto per mancata presentazione alla partenza, per interruzione del viaggio iniziato qualsiasi ne sia il motivo o la ragione, per mancanza o per irregolarità dei documenti personali, come nessuna responsabilità compete a SaraRosso Incentive per le situazioni sopracitate.

Assicurazione viaggio medico/bagaglio Nobis inclusa:
Massimale bagaglio di  € 1.500,00;
Massimale di € 50.000,00 per spese mediche, farmaceutiche ed ospedaliere

POLIZZA FACOLTATIVA SPESE MEDICHE E ANNULLAMENTO

Puoi stipulare la polizza più adatta alle tue esigenze contattando: emissioni@clikki.it

Usufruendo dello sconto riservato. Ricordiamo che un'eventuale polizza annullamento va stipulata almeno 30 giorni prima della partenza (prego notare che l’evento che impedisce la partecipazione al viaggio deve essere imprevedibile, documentabile, non conosciuto al momento della prenotazione e non dipendente dalla volontà dell’assicurato).`;

const tripSpecificText = `TERMINI SPECIFICI PER IL VIAGGIO A IBIZA

CLAUSOLA METEO
In caso di condizioni meteorologiche avverse che impediscano le attività in barca, verranno proposte attività alternative a terra di pari valore. Non sono previsti rimborsi monetari.

ASSICURAZIONE AGGIUNTIVA
È fortemente consigliata la stipula di un'assicurazione aggiuntiva per la copertura di attività sportive acquatiche. L'organizzazione non si assume responsabilità per incidenti derivanti da tali attività.`;


// Type definition for a document
export type TermsDocument = {
    id: string;
    title: string;
    trip: string | null; // null for global
    content: string;
};

// Function to convert plain text to structured HTML with clickable email
const createInitialHtml = (text: string): string => {
    const textWithLink = text.replace(
        /emissioni@clikki\.it/g,
        '<a href="mailto:emissioni@clikki.it">emissioni@clikki.it</a>'
    );
    // Use paragraphs for blocks separated by double newlines
    return textWithLink.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('');
};


export const initialDocuments: TermsDocument[] = [
    {
        id: '1',
        title: 'Termini e Condizioni',
        trip: null,
        content: createInitialHtml(termsText),
    },
    {
        id: '2',
        title: 'Termini e Condizioni',
        trip: 'Trip to Ibiza',
        content: createInitialHtml(tripSpecificText),
    },
];

const tripsForSelect = ['Trip to Ibiza', 'Sales Kick-off Dubai', 'Team Retreat Mykonos'];

const FormatButton: React.FC<{ command: string, title: string, children: React.ReactNode, applyFormat: (command: string) => void }> = ({ command, title, children, applyFormat }) => (
    <button 
        type="button" 
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyFormat(command)} 
        className="p-2 rounded hover:bg-gray-200" 
        title={title}
    >
        {children}
    </button>
);


// --- Rich Text Editor Toolbar ---
const Toolbar: React.FC<{ editorRef: React.RefObject<HTMLDivElement> }> = ({ editorRef }) => {
    const applyFormat = (command: string, value: string | null = null) => {
        if(editorRef.current) editorRef.current.focus();
        document.execCommand(command, false, value);
    };

    return (
        <div className="flex items-center space-x-1 p-2 bg-gray-100 border border-b-0 border-gray-300 rounded-t-lg text-gray-700">
            <FormatButton command="bold" title="Bold" applyFormat={applyFormat}><strong className="font-bold w-5 text-center">B</strong></FormatButton>
            <FormatButton command="italic" title="Italic" applyFormat={applyFormat}><em className="italic w-5 text-center">I</em></FormatButton>
            <FormatButton command="underline" title="Underline" applyFormat={applyFormat}><u className="underline w-5 text-center">U</u></FormatButton>
            <span className="w-px h-5 bg-gray-300 mx-2"></span>
            <FormatButton command="insertUnorderedList" title="Bulleted List" applyFormat={applyFormat}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
            </FormatButton>
             <FormatButton command="insertOrderedList" title="Numbered List" applyFormat={applyFormat}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 00-1 1v1.333H5.333a1 1 0 100 1.334h3.667v1.333H5.333a1 1 0 100 1.334h3.667v1.333H5.333a1 1 0 100 1.334H9V16a1 1 0 102 0v-1.333h3.667a1 1 0 100-1.334h-3.667v-1.333h3.667a1 1 0 100-1.334h-3.667V8.667h3.667a1 1 0 100-1.334H11V4a1 1 0 00-1-1z" clipRule="evenodd" fillRule="evenodd"></path></svg>
            </FormatButton>
        </div>
    );
};


// --- Create/Edit Modal Component ---
interface TermsModalProps {
    documentToEdit: TermsDocument | null;
    onClose: () => void;
    onSave: (document: Omit<TermsDocument, 'id' | 'content'> & { id?: string, content: string }) => void;
    globalDocExists: boolean;
}

const TermsModal: React.FC<TermsModalProps> = ({ documentToEdit, onClose, onSave, globalDocExists }) => {
    const [title, setTitle] = useState('');
    const [trip, setTrip] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (documentToEdit) {
            setTitle(documentToEdit.title);
            setTrip(documentToEdit.trip);
        } else {
            const isGlobalPossible = !globalDocExists;
            const initialTrip = isGlobalPossible ? null : (tripsForSelect[0] || null);
            const initialTitle = isGlobalPossible ? 'Termini e Condizioni' : 'Termini e Condizioni';

            setTitle(initialTitle);
            setTrip(initialTrip);
        }
    }, [documentToEdit, globalDocExists]);

    const handleSave = () => {
        const content = editorRef.current?.innerHTML || '';
        onSave({
            id: documentToEdit?.id,
            title,
            trip,
            content
        });
    };
    
    const isEditingGlobal = documentToEdit?.trip === null;

    const commonEditorClasses = `w-full p-4 text-gray-800 leading-relaxed 
        [&_p]:mb-4 [&_a]:text-blue-600 [&_a:hover]:underline
        [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8`;
    
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{documentToEdit ? 'Modifica Documento' : 'Crea Nuovo Documento'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Documento</label>
                           <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        {/* 'Viaggio Associato' field intentionally removed per request */}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
                        <Toolbar editorRef={editorRef} />
                        <div
                            ref={editorRef}
                            contentEditable={true}
                            dangerouslySetInnerHTML={{ __html: documentToEdit?.content || '' }}
                            className={`${commonEditorClasses} border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white min-h-[250px]`}
                        />
                    </div>
                </div>

                <footer className="flex justify-end items-center space-x-4 p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <button onClick={onClose} className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Annulla
                    </button>
                    <button onClick={handleSave} className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Salva Documento
                    </button>
                </footer>
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};


// --- Main Page Component ---
interface TermsConditionsProps {
    documents: TermsDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<TermsDocument[]>>;
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ documents, setDocuments }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<TermsDocument | null>(null);
    const [loading, setLoading] = useState(false);
    
    const globalDocExists = useMemo(() => documents.some(d => d.trip === null), [documents]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            const items = await fetchTermsDocuments();
            if (!mounted) return;
            // map server objects to TermsDocument with id as string
            const mapped = items.map((it: any, i: number) => ({ id: String(it._id ?? it.id ?? `terms-${i}`), title: it.title ?? (it.label ?? ''), trip: it.trip ?? null, content: it.content ?? '' }));
            // dedupe by id preserving order
            const seen = new Set<string>();
            const deduped = mapped.filter(m => {
                if (seen.has(m.id)) return false;
                seen.add(m.id);
                return true;
            });
            setDocuments(deduped as TermsDocument[]);
            setLoading(false);
        };
        load();
        return () => { mounted = false; };
    }, [setDocuments]);

    const handleCreateNew = () => {
        setEditingDocument(null);
        setIsModalOpen(true);
    };

    const handleEdit = (doc: TermsDocument) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setToDeleteId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (toDeleteId !== null) {
            // call API
            const ok = await deleteTermsDocument(toDeleteId);
            if (ok) {
                setDocuments(docs => docs.filter(d => d.id !== toDeleteId));
            }
        }
        setConfirmOpen(false);
        setToDeleteId(null);
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setToDeleteId(null);
    };

    const handleSave = async (docData: Omit<TermsDocument, 'id' | 'content'> & { id?: string, content: string }) => {
        if (docData.id) {
            // Update existing document via API
            const updated = await updateTermsDocument(docData.id, { title: docData.title, trip: docData.trip, content: docData.content });
            if (updated) {
                setDocuments(docs => docs.map(d => d.id === docData.id ? { ...d, title: updated.title ?? docData.title, trip: updated.trip ?? docData.trip, content: updated.content ?? docData.content } : d));
            }
        } else {
            // Create new document via API
            const created = await createTermsDocument({ title: docData.title, content: docData.content, trip: docData.trip });
            if (created) {
                // fetch the created full object to get content and trip
                const all = await fetchTermsDocuments();
                const mapped = all.map((it: any) => ({ id: it._id ?? it.id ?? '', title: it.title ?? '', trip: it.trip ?? null, content: it.content ?? '' }));
                setDocuments(mapped as TermsDocument[]);
            }
        }
        setIsModalOpen(false);
        setEditingDocument(null);
    };

    return (
    <>
        {isModalOpen && (
            <TermsModal 
                documentToEdit={editingDocument}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                globalDocExists={globalDocExists}
            />
        )}
        <ConfirmModal
            open={confirmOpen}
            title="Conferma eliminazione"
            message="Sei sicuro di voler eliminare questo documento? Questa azione è irreversibile."
            confirmLabel="Elimina"
            cancelLabel="Annulla"
            variant="danger"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
        />
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Terms & Conditions</h1>
                    <p className="text-gray-500 mt-1">Manage global and trip-specific terms and conditions.</p>
                </div>
                <button 
                    onClick={handleCreateNew}
                    className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create New Document
                </button>
            </div>
            <div className="space-y-4">
                {documents.map((doc, idx) => (
                    <div key={doc.id || `terms-${idx}`} className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{doc.title}</h2>
                            <p className={`text-sm ${doc.trip ? 'text-gray-500' : 'text-blue-600 font-medium'}`}>
                                {doc.trip ? `Specifico per: ${doc.trip}` : 'Documento Globale'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                             <button 
                                onClick={() => handleEdit(doc)}
                                className="p-2 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100"
                                aria-label="Edit document"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            {doc.trip !== null && ( // Prevent deleting the global document
                                <button 
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-2 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100"
                                    aria-label="Delete document"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                 {documents.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                        <h3 className="text-xl font-medium text-gray-700">Nessun documento trovato.</h3>
                        <p className="text-gray-500 mt-2">Inizia creando un nuovo documento.</p>
                    </div>
                )}
            </div>
        </div>
    </>
    );
};

export default TermsConditions;