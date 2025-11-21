import React, { useState } from 'react';
import { ChevronDownIcon } from './icons';

interface CreateCommunicationProps {
    onCancel: () => void;
    onSave: () => void;
    initialType?: 'information' | 'alert';
}

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
        rows={6}
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`}
    />
);

const Select: React.FC<{ children: React.ReactNode, defaultValue?: string | number}> = ({ children, defaultValue }) => (
    <div className="relative">
        <select defaultValue={defaultValue} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
            {children}
        </select>
        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
    </div>
);

const CreateCommunication: React.FC<CreateCommunicationProps> = ({ onCancel, onSave, initialType }) => {
    const [communicationType, setCommunicationType] = useState<'information' | 'alert'>(initialType || 'information');

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Create New Communication</h1>
                <p className="text-gray-500 mt-1">Compose a new message to send to participants.</p>
            </header>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                  <div className="space-y-6">
                      <FormField label="Tipo di Comunicazione" required>
                            <div className="flex items-center space-x-6 pt-1">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="comm-type" 
                                        value="information"
                                        checked={communicationType === 'information'}
                                        onChange={() => setCommunicationType('information')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Information</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="comm-type" 
                                        value="alert" 
                                        checked={communicationType === 'alert'}
                                        onChange={() => setCommunicationType('alert')}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Alert</span>
                                </label>
                            </div>
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Seleziona Viaggio" required>
                                <Select defaultValue="">
                                    <option value="" disabled>-- Seleziona un viaggio --</option>
                                    <option>Trip to Ibiza</option>
                                    <option>Sales Kick-off Dubai</option>
                                    <option>Team Retreat Mykonos</option>
                                </Select>
                            </FormField>
                            <FormField label="Seleziona Gruppo" required>
                                <Select defaultValue="all">
                                    <option value="all">Tutti i gruppi</option>
                                    <option>Milano</option>
                                    <option>Roma</option>
                                    <option>Venezia</option>
                                    <option>Vip</option>
                                </Select>
                            </FormField>
                        </div>

                        <FormField label="Titolo" required>
                            <Input placeholder="e.g. Flight Delay Information" />
                        </FormField>
                        <FormField label="Messaggio" required>
                            <Textarea placeholder="Write your message here..." />
                        </FormField>
                  </div>
              </div>
            </div>

            <footer className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center space-x-4">
                <button 
                    onClick={onCancel}
                    className="bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                </button>
                <button 
                    onClick={onSave}
                    className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Send Communication
                </button>
            </footer>
        </div>
    );
};

export default CreateCommunication;