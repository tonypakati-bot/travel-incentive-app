import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';

export type UsefulInfoData = {
    destinationName: string;
    country: string;
    documents: string;
    timeZone: string;
    currency: string;
    language: string;
    climate: string;
    vaccinationsHealth: string;
};

interface UsefulInformationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (info: UsefulInfoData) => void;
    infoToEdit: UsefulInfoData | null;
}

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
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
        rows={3}
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`}
    />
);

const defaultInfo: UsefulInfoData = {
    destinationName: "",
    country: "",
    documents: "",
    timeZone: "",
    currency: "",
    language: "",
    climate: "",
    vaccinationsHealth: "",
};

const UsefulInformationModal: React.FC<UsefulInformationModalProps> = ({ isOpen, onClose, onSave, infoToEdit }) => {
    const [formData, setFormData] = useState<UsefulInfoData>(defaultInfo);

    useEffect(() => {
        if (isOpen) {
            if (infoToEdit) {
                setFormData({ ...defaultInfo, ...infoToEdit });
            } else {
                setFormData(defaultInfo);
            }
        }
    }, [infoToEdit, isOpen]);
    
    if (!isOpen) return null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = () => {
        onSave(formData);
    };

    const isSaveDisabled = !formData.destinationName || !String(formData.destinationName).trim();

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{infoToEdit ? 'Edit Useful Information' : 'Create New Useful Information'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Destination Name">
                                <Input name="destinationName" value={formData.destinationName} onChange={handleChange} />
                                {isSaveDisabled && (
                                    <p className="text-xs text-red-500 mt-1">Please provide a destination name before saving.</p>
                                )}
                            </FormField>
                        <FormField label="Country">
                            <Input name="country" value={formData.country} onChange={handleChange} />
                        </FormField>
                    </div>
                    <FormField label="Documents">
                        <Textarea name="documents" value={formData.documents} onChange={handleChange} />
                    </FormField>
                    <FormField label="Time Zone">
                        <Textarea name="timeZone" value={formData.timeZone} onChange={handleChange} />
                    </FormField>
                    <FormField label="Currency">
                        <Textarea name="currency" value={formData.currency} onChange={handleChange} />
                    </FormField>
                    <FormField label="Language">
                        <Textarea name="language" value={formData.language} onChange={handleChange} />
                    </FormField>
                    <FormField label="Climate">
                        <Textarea name="climate" value={formData.climate} onChange={handleChange} />
                    </FormField>
                    <FormField label="Vaccinations & Health">
                        <Textarea name="vaccinationsHealth" value={formData.vaccinationsHealth} onChange={handleChange} />
                    </FormField>
                </div>

                <footer className="flex justify-end items-center space-x-4 p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaveDisabled}
                        className={`bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors ${isSaveDisabled ? 'opacity-60 cursor-not-allowed hover:bg-blue-600' : 'hover:bg-blue-700'}`}>
                        Save
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

export default UsefulInformationModal;