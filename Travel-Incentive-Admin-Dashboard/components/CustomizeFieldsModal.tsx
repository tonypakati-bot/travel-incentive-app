import React, { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { XIcon, PlusIcon, GripVerticalIcon } from './icons';

type Section = {
    id: string;
    title: string;
};

export type Field = {
    id: string;
    name: string;
    enabled: boolean;
    required: boolean;
};

interface CustomizeFieldsModalProps {
    section: Section;
    onClose: () => void;
    onSave: (sectionId: string, fields: Field[]) => void;
    initialFields?: Field[];
}

export const sectionFieldsData: Record<string, Field[]> = {
    'dati-partecipante': [
        { id: 'ragione-sociale', name: 'Ragione Sociale', enabled: true, required: true },
        { id: 'nome', name: 'Nome', enabled: true, required: true },
        { id: 'cognome', name: 'Cognome', enabled: true, required: true },
        { id: 'data-di-nascita', name: 'Data di Nascita', enabled: true, required: true },
        { id: 'nazionalita', name: 'Nazionalità', enabled: true, required: true },
        { id: 'n-tel-cellulare', name: 'N. Tel. Cellulare', enabled: true, required: true },
        { id: 'email', name: 'E-mail', enabled: true, required: true },
        { id: 'passaporto', name: 'Passaporto', enabled: true, required: true },
        { id: 'esigenze-alimentari', name: 'Esigenze Alimentari', enabled: true, required: false },
        // + possibility to add new fields via UI
    ],
    'logistica': [
        { id: 'tipologia-camera', name: 'Tipologia Camera', enabled: true, required: true },
        { id: 'aeroporto-di-partenza', name: 'Aeroporto di Partenza', enabled: true, required: true },
        { id: 'viaggio-in-business', name: 'Viaggio in Business', enabled: true, required: true },
    ],
    'consensi': [
        { id: 'informativa-sulla-privacy', name: 'Informativa sulla Privacy', enabled: true, required: true },
        { id: 'termini-e-condizioni', name: 'Termini e Condizioni', enabled: true, required: true },
    ],
    'accompagnatore': [
        { id: 'nome-accompagnatore', name: 'Nome', enabled: true, required: true },
        { id: 'cognome-accompagnatore', name: 'Cognome', enabled: true, required: true },
        { id: 'data-di-nascita-accompagnatore', name: 'Data di Nascita', enabled: true, required: true },
        { id: 'nazionalita-accompagnatore', name: 'Nazionalità', enabled: true, required: true },
        { id: 'passaporto-accompagnatore', name: 'Passaporto', enabled: true, required: true },
        { id: 'esigenze-alimentari-accompagnatore', name: 'Esigenze Alimentari', enabled: true, required: false },
        { id: 'partecipazione-meeting', name: 'Partecipazione Meeting', enabled: true, required: false },
    ],
    'fatturazione': [
        { id: 'intestatario-fattura', name: 'Intestatario Fattura', enabled: true, required: true },
        { id: 'indirizzo-di-fatturazione', name: 'Indirizzo di Fatturazione', enabled: true, required: true },
        { id: 'partita-iva', name: 'Partita IVA', enabled: true, required: true },
        { id: 'codice-sdi', name: 'Codice SDI', enabled: true, required: true },
    ],
};

const CustomizeFieldsModal: React.FC<CustomizeFieldsModalProps> = ({ section, onClose, onSave, initialFields }) => {
    const defaultFields = (section && sectionFieldsData[section.id]) ? sectionFieldsData[section.id] : [];
    const [fields, setFields] = useState<Field[]>(() => (initialFields && initialFields.length ? initialFields : defaultFields));

    // update local fields if initialFields prop changes
    React.useEffect(() => {
        if (initialFields && initialFields.length) {
            setFields(initialFields);
        } else {
            setFields(defaultFields);
        }
    }, [initialFields, section?.id]);
    const [newFieldName, setNewFieldName] = useState('');
    const toast = (() => {
        try {
            return useToast();
        } catch (e) {
            return null;
        }
    })();

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleToggle = (id: string, type: 'enabled' | 'required') => {
        setFields(prevFields =>
            prevFields.map(field => {
                if (field.id === id) {
                    const updatedField = { ...field, [type]: !field[type] };
                    // If disabling a field, it cannot be required
                    if (type === 'enabled' && !updatedField.enabled) {
                        updatedField.required = false;
                    }
                    return updatedField;
                }
                return field;
            })
        );
    };

    const handleAddNewField = () => {
        if (newFieldName.trim() === '') return;
        const newField: Field = {
            id: `${newFieldName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: newFieldName.trim(),
            enabled: true,
            required: false,
        };
        setFields([...fields, newField]);
        setNewFieldName('');
        try { toast && toast.showToast('Campo aggiunto', 'success'); } catch (e) {}
    };

    const handleSave = () => {
        try { onSave(section.id, fields); try { toast && toast.showToast('Campi salvati', 'success'); } catch(e){} } catch (e) { try { toast && toast.showToast('Errore salvataggio campi', 'error'); } catch(e){} }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        const dragIndex = dragItem.current;
        const dropIndex = dragOverItem.current;

        if (dragIndex === dropIndex) {
            handleDragEnd();
            return;
        }

        const newFields = [...fields];
        const [movedItem] = newFields.splice(dragIndex, 1);
        newFields.splice(dropIndex, 0, movedItem);
        
        setFields(newFields);
        handleDragEnd();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Personalizza Campi: {section.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 px-4 pb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CAMPO</span>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider justify-self-end">OBBLIGATORIO</span>
                    </div>

                    <div 
                        className="space-y-1 max-h-[40vh] overflow-y-auto pr-2"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {fields.map((field, index) => (
                            <div 
                                key={field.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                                <div className="flex items-center">
                                    <div className="cursor-grab active:cursor-grabbing text-gray-400 group-hover:text-gray-600">
                                        <GripVerticalIcon className="w-5 h-5 mr-3" />
                                    </div>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={field.enabled}
                                            onChange={() => handleToggle(field.id, 'enabled')}
                                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className={`ml-3 text-sm font-medium ${field.enabled ? 'text-gray-800' : 'text-gray-400'}`}>{field.name}</span>
                                    </label>
                                </div>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        disabled={!field.enabled}
                                        onChange={() => handleToggle(field.id, 'required')}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                    />
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                         <div className="flex items-center space-x-3">
                            <input
                                type="text"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                placeholder="Aggiungi nuovo campo"
                                className="flex-grow w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddNewField()}
                            />
                            <button
                                onClick={handleAddNewField}
                                className="bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                            >
                                <PlusIcon className="w-5 h-5 mr-1.5" /> Aggiungi
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="flex justify-end items-center space-x-4 p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Annulla
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Salva Campi
                    </button>
                </footer>
            </div>
            <style>{`
                @keyframes fadeInScale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale {
                    animation: fadeInScale 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default CustomizeFieldsModal;