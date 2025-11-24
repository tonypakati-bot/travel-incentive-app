import React, { useState } from 'react';
import { createForm } from '../services/forms';
import { ChevronDownIcon, TrashIcon, GripVerticalIcon, PencilIcon } from './icons';
import CustomizeFieldsModal from './CustomizeFieldsModal';

interface CreateFormProps {
    onCancel: () => void;
    onSave: () => void;
}

type Section = {
    id: string;
    title: string;
};

const ALL_SECTIONS: Section[] = [
    { id: 'dati-partecipante', title: 'Dati Partecipante' },
    { id: 'logistica', title: 'Logistica' },
    { id: 'accompagnatore', title: 'Accompagnatore' },
    { id: 'consensi', title: 'Consensi' },
    { id: 'fatturazione', title: 'Fatturazione' },
];

const FormField: React.FC<{ label: string; required?: boolean; children: React.ReactNode; className?: string }> = ({ label, required, children, className }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
        {...props}
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`}
    />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea 
        {...props}
        rows={2}
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`}
    />
);

const Select: React.FC<{ children: React.ReactNode, value?: string | number, onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void}> = ({ children, value, onChange }) => (
    <div className="relative">
        <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
            {children}
        </select>
        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
    </div>
);

const CreateForm: React.FC<CreateFormProps> = ({ onCancel, onSave }) => {
    const initialActiveSections: Section[] = [
        { id: 'dati-partecipante', title: 'Dati Partecipante' },
        { id: 'logistica', title: 'Logistica' },
        { id: 'accompagnatore', title: 'Accompagnatore' },
        { id: 'fatturazione', title: 'Fatturazione' },
    ];

    const [activeSections, setActiveSections] = useState<Section[]>(initialActiveSections);
    const [availableSections, setAvailableSections] = useState<Section[]>(() => 
        ALL_SECTIONS.filter(s => !initialActiveSections.some(as => as.id === s.id))
    );
    const [title, setTitle] = useState<string>('Dietary Restrictions & Allergies');
    const [description, setDescription] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [sectionFieldsMap, setSectionFieldsMap] = useState<Record<string, any[]>>(() => ({}));

    const dragItem = React.useRef<any>(null);
    const dragOverItem = React.useRef<any>(null);

    const handleOpenModal = (section: Section) => {
        setEditingSection(section);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSection(null);
    };

    const handleSaveFields = (sectionId: string, updatedFields: any[]) => {
        console.log('Saving fields for', sectionId, updatedFields);
        // persist fields to local map
        setSectionFieldsMap(prev => ({ ...prev, [sectionId]: updatedFields.map((f, idx) => ({ ...f, order: idx })) }));
        handleCloseModal();
    };


    const handleDragStart = (e: React.DragEvent, item: Section, source: 'available' | 'active', index: number | null) => {
        dragItem.current = { item, source, index };
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const draggedItemData = dragItem.current;
        const dropTargetIndex = dragOverItem.current;

        if (!draggedItemData) return;

        const { item: draggedItem, source: dragSource, index: dragIndex } = draggedItemData;

        // Case 1: Dragging from Available to Active sections
        if (dragSource === 'available') {
            if (activeSections.some(s => s.id === draggedItem.id)) return;

            const newActiveSections = [...activeSections];
            if (dropTargetIndex !== null && dropTargetIndex !== undefined) {
                newActiveSections.splice(dropTargetIndex, 0, draggedItem);
            } else {
                newActiveSections.push(draggedItem);
            }
            
            setActiveSections(newActiveSections);
            setAvailableSections(prev => prev.filter(s => s.id !== draggedItem.id));
        }
        // Case 2: Reordering within Active sections
        else if (dragSource === 'active') {
            if (dragIndex === null || dropTargetIndex === null || dragIndex === dropTargetIndex) {
                 dragItem.current = null;
                 dragOverItem.current = null;
                 return;
            }

            const newActiveSections = [...activeSections];
            const [movedItem] = newActiveSections.splice(dragIndex, 1);
            newActiveSections.splice(dropTargetIndex, 0, movedItem);
            setActiveSections(newActiveSections);
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };

    const removeSection = (sectionId: string) => {
        const sectionToRemove = activeSections.find(s => s.id === sectionId);
        if (sectionToRemove) {
            setActiveSections(prev => prev.filter(s => s.id !== sectionId));
            const newAvailable = [...availableSections, {id: sectionToRemove.id, title: sectionToRemove.title}];
            newAvailable.sort((a,b) => ALL_SECTIONS.findIndex(s => s.id === a.id) - ALL_SECTIONS.findIndex(s => s.id === b.id));
            setAvailableSections(newAvailable);
        }
    };

    return (
        <>
        {isModalOpen && editingSection && (
            <CustomizeFieldsModal 
                section={editingSection} 
                onClose={handleCloseModal} 
                onSave={handleSaveFields} 
                initialFields={sectionFieldsMap[editingSection.id]}
            />
        )}
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Create New Form</h1>
                <p className="text-gray-500 mt-1">Design a form to collect information from participants.</p>
            </header>

            <div className="max-w-7xl mx-auto">
              <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
                 <FormField label="Form Title" required>
                    <Input placeholder="e.g., Dietary Restrictions & Allergies" value={title} onChange={(e) => setTitle(e.target.value)} />
                </FormField>
                <FormField label="Form Description">
                    <Textarea placeholder="Provide a brief description or instructions for this form." value={description} onChange={(e) => setDescription(e.target.value)} />
                </FormField>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Available Sections */}
                <div className="md:col-span-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Sezioni Disponibili</h2>
                    <div className="space-y-3">
                        {availableSections.map(section => (
                            <div
                                key={section.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, section, 'available', null)}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center cursor-grab active:cursor-grabbing"
                            >
                                <GripVerticalIcon className="w-5 h-5 text-gray-400 mr-3" />
                                <span className="font-medium text-gray-700">{section.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Preview */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Anteprima Form del Viaggio</h2>
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="p-6 border-2 border-dashed border-gray-300 rounded-lg min-h-[300px] space-y-4 bg-gray-50/50"
                    >
                        {activeSections.map((section, index) => (
                            <div 
                                key={section.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, section, 'active', index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragOver={(e) => e.preventDefault()}
                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <GripVerticalIcon className="w-5 h-5 text-gray-400 mr-3 cursor-grab active:cursor-grabbing" />
                                        <span className="font-bold text-gray-800">{section.title}</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button type="button" onClick={() => removeSection(section.id)} className="text-gray-500 hover:text-red-600">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 pl-8">
                                    <button
                                      onClick={() => handleOpenModal(section)}
                                      className="flex items-center text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        Modifica Campi
                                    </button>
                                </div>
                            </div>
                        ))}
                         {activeSections.length === 0 && (
                            <div className="flex items-center justify-center h-full pointer-events-none">
                                <p className="text-gray-500">Trascina le sezioni qui</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>

            <footer className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center space-x-4">
                <button 
                    onClick={async () => {
                        // Save Draft
                        const payload = { title, description, sections: activeSections.map((s, idx) => ({ id: s.id, title: s.title, order: idx, fields: (sectionFieldsMap[s.id] || []) })), status: 'draft' };
                        try {
                            const created = await createForm(payload);
                            if (created) {
                                try { window.dispatchEvent(new CustomEvent('forms:changed', { detail: { created } })); } catch (e) {}
                                // Optionally show toast
                            }
                        } catch (err) { console.error('Failed saving draft', err); }
                        onCancel();
                    }}
                    className="bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors">
                    Save Draft
                </button>
                <button 
                    onClick={async () => {
                        // Publish Form
                        const payload = { title, description, sections: activeSections.map((s, idx) => ({ id: s.id, title: s.title, order: idx, fields: (sectionFieldsMap[s.id] || []) })), status: 'published' };
                        try {
                            const created = await createForm(payload);
                            if (created) {
                                try { window.dispatchEvent(new CustomEvent('forms:changed', { detail: { created } })); } catch (e) {}
                            }
                        } catch (err) { console.error('Failed publishing form', err); }
                        onSave();
                    }}
                    className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Publish Form
                </button>
            </footer>
        </div>
        </>
    );
};

export default CreateForm;