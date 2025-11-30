import React, { useState } from 'react';
import { createForm, updateForm } from '../services/forms';
import { ChevronDownIcon, TrashIcon, GripVerticalIcon, PencilIcon } from './icons';
import CustomizeFieldsModal, { Field, sectionFieldsData } from './CustomizeFieldsModal';
import { useToast } from '../contexts/ToastContext';

interface CreateFormProps {
    onCancel: () => void;
    onSave?: (saved?: any) => void;
    isEditing?: boolean;
    initialData?: any;
    onDelete?: (id: string | number) => void;
    asPage?: boolean;
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

export const FormField: React.FC<{ label: string; required?: boolean; children: React.ReactNode; className?: string }> = ({ label, required, children, className }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input 
        ref={ref}
        {...props}
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`}
    />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => (
    <textarea 
        ref={ref}
        {...props}
        rows={2}
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`}
    />
));
Textarea.displayName = 'Textarea';

const Select: React.FC<{ children: React.ReactNode, value?: string | number, onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void}> = ({ children, value, onChange }) => (
    <div className="relative">
        <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
            {children}
        </select>
        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
    </div>
);

import ModalPortal from './ModalPortal';

const CreateForm: React.FC<CreateFormProps> = ({ onCancel, onSave, isEditing = false, initialData, asPage = false }) => {
    const initialActiveSections: Section[] = [];

    const [activeSections, setActiveSections] = useState<Section[]>(() => initialActiveSections);
    const [availableSections, setAvailableSections] = useState<Section[]>(() => 
        ALL_SECTIONS.filter(s => !initialActiveSections.some(as => as.id === s.id))
    );
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [errors, setErrors] = useState<{ title?: string }>({});
    const toast = useToast();
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [sectionFieldsMap, setSectionFieldsMap] = useState<Record<string, Field[]>>(() => {
        return Object.keys(sectionFieldsData).reduce((acc, key) => {
            acc[key] = sectionFieldsData[key].map((f, idx) => ({ ...f, order: idx }));
            return acc;
        }, {} as Record<string, Field[]>);
    });

    // If initialData provided (editing), hydrate local state
    React.useEffect(() => {
        if (initialData) {
            const data = initialData;
            setTitle(data.title || data.name || '');
            setDescription(data.description || data.desc || '');
            if (Array.isArray(data.sections)) {
                setActiveSections(data.sections.map((s: any) => ({ id: s.id, title: s.title })));
                const map: Record<string, Field[]> = {};
                data.sections.forEach((s: any) => {
                    map[s.id] = Array.isArray(s.fields) ? s.fields.map((f: any, idx: number) => ({ ...f, order: idx })) : (sectionFieldsMap[s.id] || []);
                });
                setSectionFieldsMap(prev => ({ ...prev, ...map }));
                // Ensure availableSections does not contain sections that are active in the loaded form
                const activeIds = new Set(data.sections.map((s: any) => s.id));
                setAvailableSections(ALL_SECTIONS.filter((s) => !activeIds.has(s.id)));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData]);

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

    const handleSaveFields = (sectionId: string, updatedFields: Field[]) => {
        console.log('Saving fields for', sectionId, updatedFields);
        setSectionFieldsMap(prev => ({ ...prev, [sectionId]: updatedFields.map((f, idx) => ({ ...f, order: idx })) }));
        handleCloseModal();
    };

    const titleRef = React.useRef<HTMLInputElement | null>(null);

    const validate = () => {
        const nextErrors: { title?: string } = {};
        if (!title || title.trim() === '') nextErrors.title = 'Il titolo del form è obbligatorio.';
        else if (title.length > 200) nextErrors.title = 'Il titolo non può superare 200 caratteri.';
        setErrors(nextErrors);
        if (nextErrors.title) {
            // focus title input
            setTimeout(() => titleRef.current && titleRef.current.focus(), 0);
        }
        return Object.keys(nextErrors).length === 0;
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

        const mainContent = (
            <div className="bg-white rounded-2xl shadow-lg overflow-auto">
                <div className="p-8">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Create New Form</h1>
                        <p className="text-gray-500 mt-1">Design a form to collect information from participants.</p>
                    </header>

                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
                            <FormField label="Form Title" required>
                                <Input ref={titleRef} placeholder="e.g., Dietary Restrictions & Allergies" value={title} onChange={(e) => setTitle(e.target.value)} />
                                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                            </FormField>
                            <FormField label="Form Description">
                                <Textarea placeholder="Provide a brief description or instructions for this form." value={description} onChange={(e) => setDescription(e.target.value)} />
                            </FormField>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-1">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Sezioni Disponibili</h2>
                                <div className="space-y-3">
                                    {availableSections.map(section => (
                                        <div key={section.id} draggable onDragStart={(e) => handleDragStart(e, section, 'available', null)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center cursor-grab active:cursor-grabbing">
                                            <GripVerticalIcon className="w-5 h-5 text-gray-400 mr-3" />
                                            <span className="font-medium text-gray-700">{section.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Anteprima Form del Viaggio</h2>
                                    <button type="button" onClick={() => { setActiveSections(ALL_SECTIONS.map(s => ({ id: s.id, title: s.title }))); setAvailableSections([]); }} className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md font-semibold">Aggiungi tutte le sezioni</button>
                                </div>

                                <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="p-6 border-2 border-dashed border-gray-300 rounded-lg min-h-[300px] space-y-4 bg-gray-50/50">
                                    {activeSections.map((section, index) => (
                                        <div key={section.id} draggable onDragStart={(e) => handleDragStart(e, section, 'active', index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragOver={(e) => e.preventDefault()} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <GripVerticalIcon className="w-5 h-5 text-gray-400 mr-3 cursor-grab active:cursor-grabbing" />
                                                    <span className="font-bold text-gray-800">{section.title}</span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <button type="button" onClick={() => removeSection(section.id)} className="text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                            <div className="mt-4 pl-8">
                                                <button onClick={() => handleOpenModal(section)} className="flex items-center text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"><PencilIcon className="w-4 h-4 mr-2" />Modifica Campi</button>
                                            </div>
                                        </div>
                                    ))}
                                    {activeSections.length === 0 && (<div className="flex items-center justify-center h-full pointer-events-none"><p className="text-gray-500">Trascina le sezioni qui</p></div>)}
                                </div>
                            </div>
                        </div>

                        <footer className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center space-x-4">
                            {isEditing && (<button onClick={() => onCancel()} className="bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors">Annulla</button>)}
                            <button onClick={async () => { if (!validate()) return; setIsSaving(true); const payload = { title, description, sections: activeSections.map((s, idx) => ({ id: s.id, title: s.title, order: idx, fields: (sectionFieldsMap[s.id] || []) })), status: 'draft' }; try { if (isEditing && initialData && (initialData._id || initialData.id)) { const id = String(initialData._id ?? initialData.id); const updated = await updateForm(id, payload); if (updated) { try { window.dispatchEvent(new CustomEvent('forms:changed', { detail: { updated } })); } catch (e) {} try { toast.showToast('Bozza aggiornata.', 'success'); } catch(e){} onSave && onSave(updated); } } else { const created = await createForm(payload); if (created) { try { window.dispatchEvent(new CustomEvent('forms:changed', { detail: { created } })); } catch (e) {} try { toast.showToast('Bozza salvata.', 'success'); } catch(e){} onSave && onSave(created); } } } catch (err) { console.error('Failed saving draft', err); try { toast.showToast('Salvataggio bozza fallito.', 'error'); } catch(e){} } setIsSaving(false); }} disabled={isSaving} className={`bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>{isSaving ? 'Saving…' : 'Save Draft'}</button>
                            <button onClick={async () => { if (!validate()) return; setIsSaving(true); const payload = { title, description, sections: activeSections.map((s, idx) => ({ id: s.id, title: s.title, order: idx, fields: (sectionFieldsMap[s.id] || []) })), status: 'published' }; try { if (isEditing && initialData && (initialData._id || initialData.id)) { const id = String(initialData._id ?? initialData.id); const updated = await updateForm(id, payload); if (updated) { try { window.dispatchEvent(new CustomEvent('forms:changed', { detail: { updated } })); } catch (e) {} try { toast.showToast('Form aggiornato.', 'success'); } catch(e){} onSave && onSave(updated); } } else { const created = await createForm(payload); if (created) { try { window.dispatchEvent(new CustomEvent('forms:changed', { detail: { created } })); } catch (e) {} try { toast.showToast('Form pubblicato.', 'success'); } catch(e){} onSave && onSave(created); } } } catch (err) { console.error('Failed publishing form', err); try { toast.showToast('Publish fallito.', 'error'); } catch(e){} } setIsSaving(false); }} disabled={isSaving} className={`bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}>{isSaving ? 'Publishing…' : 'Publish Form'}</button>
                        </footer>
                    </div>
                </div>
            </div>
        );

        if (asPage) {
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
                    <div className="p-8 max-w-7xl mx-auto">
                        {mainContent}
                    </div>
                </>
            );
        }

        return (
            <ModalPortal>
                {isModalOpen && editingSection && (
                    <CustomizeFieldsModal 
                        section={editingSection} 
                        onClose={handleCloseModal} 
                        onSave={handleSaveFields} 
                        initialFields={sectionFieldsMap[editingSection.id]}
                    />
                )}

                <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-auto p-4">
                    <div className="relative w-full max-w-5xl">
                        <div className="fixed inset-0 bg-black opacity-40" onClick={() => onCancel()} />
                        <div className="z-10">
                            {mainContent}
                        </div>
                    </div>
                </div>
            </ModalPortal>
        );
};

export default CreateForm;