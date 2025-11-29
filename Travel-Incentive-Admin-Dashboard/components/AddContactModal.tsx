import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { XIcon } from './icons';

export type ContactCategory = 'Tour Leader' | 'Assistenza Aeroportuale' | 'Assistenza Hotel' | 'Coordinatore';
export type Contact = {
    id: string | number;
    firstName?: string;
    lastName?: string;
    category: ContactCategory;
    phone: string;
    email: string;
    notes: string;
};
export type ContactData = Omit<Contact, 'id'>;

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contact: ContactData, id?: number) => void;
    contactToEdit: Contact | null;
}

const categories: ContactCategory[] = ['Tour Leader', 'Assistenza Aeroportuale', 'Assistenza Hotel', 'Coordinatore'];

const defaultContact: ContactData = {
    firstName: '',
    lastName: '',
    category: 'Tour Leader',
    phone: '',
    email: '',
    notes: ''
};

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => ( <input {...props} className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`} /> );
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => ( <textarea {...props} rows={3} className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`} /> );
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => ( <select {...props} className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`} /> );

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onSave, contactToEdit }) => {
    const [formData, setFormData] = useState<ContactData>(defaultContact);

    useEffect(() => {
        if (isOpen) {
            if (contactToEdit) {
                // map legacy `name` into first/last
                const nameVal = (contactToEdit as any).name;
                if (nameVal && !('firstName' in contactToEdit)) {
                    const parts = String(nameVal).trim().split(/\s+/);
                    const last = parts.length > 1 ? parts.pop() as string : '';
                    const first = parts.join(' ');
                    setFormData({ ...(contactToEdit as any), firstName: first, lastName: last });
                } else {
                    setFormData(contactToEdit as any);
                }
            } else {
                setFormData(defaultContact);
            }
        }
    }, [contactToEdit, isOpen]);

    // Call hooks unconditionally to preserve hook order across renders
    const toast = useToast();

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    

    const handleSaveClick = () => {
        // basic validation
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRe.test(formData.email)) {
            try { toast && toast.showToast('Email non valida', 'error'); } catch (e) {}
            return;
        }
        if (formData.phone && formData.phone.replace(/\D/g,'').length < 6) {
            try { toast && toast.showToast('Numero di telefono non valido', 'error'); } catch (e) {}
            return;
        }
        onSave(formData, contactToEdit ? (Number(contactToEdit.id) as any) : undefined);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{contactToEdit ? 'Edit Contact' : 'Add New Contact'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Nome">
                            <Input name="firstName" value={(formData as any).firstName || ''} onChange={handleChange} placeholder="e.g. Mario" />
                        </FormField>
                        <FormField label="Cognome">
                            <Input name="lastName" value={(formData as any).lastName || ''} onChange={handleChange} placeholder="e.g. Rossi" />
                        </FormField>
                    </div>
                    <FormField label="Categoria">
                        <Select name="category" value={formData.category} onChange={handleChange}>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </Select>
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Telefono">
                            <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+39 123 456789" />
                        </FormField>
                        <FormField label="Email">
                            <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="m.rossi@example.com" />
                        </FormField>
                    </div>
                    <FormField label="Note">
                        <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Referente h24, etc." />
                    </FormField>
                </div>

                <footer className="flex justify-end items-center space-x-4 p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <button onClick={onClose} className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSaveClick} className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Save Contact
                    </button>
                </footer>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeInScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; } .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }`}</style>
        </div>
    );
};

export default AddContactModal;