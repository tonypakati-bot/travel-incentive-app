import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons';

interface TermsDocument {
  id?: string;
  title: string;
  trip: string | null;
  content: string;
}

interface TermsModalProps {
  documentToEdit: TermsDocument | null;
  onClose: () => void;
  onSave: (document: Omit<TermsDocument, 'id' | 'content'> & { id?: string, content: string }) => void;
  globalDocExists: boolean;
}

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

const Toolbar: React.FC<{ editorRef: React.RefObject<HTMLDivElement> }> = ({ editorRef }) => {
    const applyFormat = (command: string, value: string | null = null) => {
        if (editorRef.current) editorRef.current.focus();
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
        onSave({ id: documentToEdit?.id, title, trip, content });
    };

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

export default TermsModal;
