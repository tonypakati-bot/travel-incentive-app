import React, { useState, useRef, useEffect, useMemo } from 'react';
import ConfirmModal from './ConfirmModal';
import DOMPurify from 'dompurify';
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from './icons';

// Type definition
export type PrivacyDocument = {
    id: number | string;
    title: string;
    trip: string | null; // null for global
    content: string;
};

// (Removed hard-coded initial documents — UI should load them from the server)

// tripsForSelect removed: privacy modal now creates global documents only

// --- Shared UI Components ---

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

// --- Modal Component ---

interface PrivacyModalProps {
    documentToEdit: PrivacyDocument | null;
    onClose: () => void;
    onSave: (document: Omit<PrivacyDocument, 'id' | 'content'> & { id?: number | string, content: string }) => void;
    globalDocExists: boolean;
    isOpen: boolean;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, documentToEdit, onClose, onSave, globalDocExists }) => {
    const [title, setTitle] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (documentToEdit) {
            setTitle(documentToEdit.title);
        } else {
            const isGlobalPossible = !globalDocExists;
            const initialTitle = isGlobalPossible ? 'Global Privacy Policy' : `Privacy Policy`;
            setTitle(initialTitle);
        }
    }, [documentToEdit, globalDocExists, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.focus();
                    // place caret at the end
                    const sel = window.getSelection();
                    if (sel && editorRef.current?.lastChild) {
                        const range = document.createRange();
                        range.selectNodeContents(editorRef.current);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            }, 50);
        }
    }, [isOpen]);


    const handleSave = () => {
        if (!title.trim()) {
            alert('Il titolo non può essere vuoto.');
            return;
        }
        const raw = editorRef.current?.innerHTML || '';
        const clean = DOMPurify.sanitize(raw, {
            ALLOWED_TAGS: ['a','p','br','strong','b','em','i','u','ul','ol','li','img'],
            ALLOWED_ATTR: ['href','target','rel','src','alt']
        });
        onSave({
            id: documentToEdit?.id,
            title: title.trim(),
            trip: null,
            content: clean
        });
    };
    

    const commonEditorClasses = `w-full p-4 text-gray-800 leading-relaxed 
        [&_p]:mb-4 [&_a]:text-blue-600 [&_a:hover]:underline
        [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8`;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{documentToEdit ? 'Modifica Documento Privacy' : 'Crea Nuovo Documento Privacy'}</h2>
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
                        {/* Removed trip select - all privacy documents are global from this modal */}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
                        <Toolbar editorRef={editorRef} />
                        <div
                            ref={editorRef}
                            contentEditable={true}
                            role="textbox"
                            aria-multiline="true"
                            aria-label="Contenuto privacy"
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

// --- Main Component ---

interface PrivacyPolicyProps {
    documents: PrivacyDocument[];
    setDocuments: React.Dispatch<React.SetStateAction<PrivacyDocument[]>>;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ documents, setDocuments }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<PrivacyDocument | null>(null);

    const globalDocExists = useMemo(() => documents.some(d => d.trip === null), [documents]);

    const handleCreateNew = () => {
        setEditingDocument(null);
        setIsModalOpen(true);
    };

    const handleEdit = (doc: PrivacyDocument) => {
        setEditingDocument(doc);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number | string) => {
        // Open confirm modal before deleting (handled via state below)
        openConfirm(id);
    };

    // Confirm modal state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<number | string | null>(null);

    const openConfirm = (id: number | string) => {
        setToDeleteId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!toDeleteId) return;
        try {
            const res = await fetch(`/api/privacy-policies/${toDeleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setDocuments(docs => docs.filter(d => d.id !== toDeleteId));
        } catch (err) {
            console.error(err);
            alert('Errore durante l\'eliminazione del documento');
        } finally {
            setConfirmOpen(false);
            setToDeleteId(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setToDeleteId(null);
    };

    const handleSave = async (docData: Omit<PrivacyDocument, 'id' | 'content'> & { id?: number | string, content: string }) => {
        try {
            if (docData.id) {
                // Update existing on server
                const res = await fetch(`/api/privacy-policies/${docData.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: docData.title, content: docData.content, trip: docData.trip }),
                });
                if (!res.ok) throw new Error('Failed to update policy');
                const updated = await res.json();
                setDocuments(docs => docs.map(d => (d.id === docData.id ? { ...d, ...updated } : d)));
            } else {
                // Create new on server
                const res = await fetch('/api/privacy-policies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: docData.title, content: docData.content, trip: null }),
                });
                if (!res.ok) throw new Error('Failed to create policy');
                const created = await res.json();
                const newDoc: PrivacyDocument = { ...docData, id: created.id };
                setDocuments(docs => [...docs, newDoc]);
            }
            setIsModalOpen(false);
            setEditingDocument(null);
        } catch (err) {
            console.error(err);
            alert('Errore durante il salvataggio del documento. Controlla la console.');
        }
    };

    return (
    <>
        <PrivacyModal 
            isOpen={isModalOpen}
            documentToEdit={editingDocument}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            globalDocExists={globalDocExists}
        />
        <ConfirmModal
            open={confirmOpen}
            title="Conferma eliminazione"
            message="Sei sicuro di voler eliminare questo documento? Questa azione non può essere annullata."
            confirmLabel="Elimina"
            cancelLabel="Annulla"
            variant="danger"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
        />
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Privacy Policy</h1>
                    <p className="text-gray-500 mt-1">Gestisci le privacy policy globali e specifiche per viaggio.</p>
                </div>
                <button 
                    onClick={handleCreateNew}
                    className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Crea Nuovo Documento
                </button>
            </div>
            <div className="space-y-4">
                {documents.map((doc, idx) => (
                    <div key={doc.id || `privacy-${idx}`} className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{doc.title}</h2>
                            <p className={`text-sm ${doc.trip ? 'text-gray-500' : 'text-blue-600 font-medium'}`}>
                                {doc.trip ? `Specifico per: ${doc.trip}` : null}
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
                            <button 
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100"
                                aria-label="Elimina documento"
                                title="Elimina documento"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
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

export default PrivacyPolicy;