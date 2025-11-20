import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { XIcon } from './icons';

export type ParticipantStatus = 'Registered' | 'Invited' | 'To Invite';
export type Participant = {
    id?: string | number;
    _id?: string;
    name: string;
    email: string;
    trip: string;
    group: string;
    status: ParticipantStatus;
};

interface ParticipantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (p: Participant) => Promise<any> | void;
    participantToEdit: Participant | null;
    defaultTrip?: string;
    existingParticipants?: Participant[];
}

const defaultParticipant: Participant = {
    name: '',
    email: '',
    trip: '',
    group: '',
    status: 'To Invite'
};

const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string; required?: boolean }> = ({ label, children, className, required }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-600">*</span>}
        </label>
        {children}
    </div>
);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => ( <input {...props} className={`w-full px-3 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''} ${'aria-invalid' in props && (props as any)['aria-invalid'] === 'true' ? 'border-red-500' : 'border-gray-300'}`} /> );
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => ( <select {...props} className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`} /> );

const ParticipantModal: React.FC<ParticipantModalProps> = ({ isOpen, onClose, onSave, participantToEdit, defaultTrip }) => {
    const [formData, setFormData] = useState<Participant>(defaultParticipant);
    const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            if (participantToEdit) {
                setFormData(participantToEdit);
            } else {
                setFormData({ ...defaultParticipant, trip: defaultTrip ?? '' });
            }
        }
    }, [participantToEdit, isOpen, defaultTrip]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async () => {
        // Ensure trip is set from defaultTrip when provided
        const final = { ...formData } as Participant;
        if ((!final.trip || final.trip.length === 0) && defaultTrip) final.trip = defaultTrip;

        // normalize and trim inputs before validation
        final.name = (final.name || '').toString().trim();
        final.email = (final.email || '').toString().trim();
        final.trip = (final.trip || '').toString().trim();
        final.group = (final.group || '').toString().trim();

        // basic client-side validation
        const errors: Record<string,string> = {};
        if (!final.name || final.name.length < 2) errors.name = 'Name is required (min 2 chars)';
        if (!final.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(final.email)) errors.email = 'Valid email is required';
        if (!final.trip || final.trip.length === 0) errors.trip = 'Trip is required';

        setFieldErrors(errors);
        setSubmitError(null);
        if (Object.keys(errors).length > 0) return;

        // duplicate email check (case-insensitive) among existing participants for the same trip
        try {
            const ex = (existingParticipants || []).filter(p => String(p.trip || '') === String(final.trip || ''));
            const dup = ex.find(p => (p.email || '').toLowerCase() === (final.email || '').toLowerCase() && String(p.id ?? p._id) !== String(final.id ?? final._id));
            if (dup) {
                const msg = 'Email già presente per questo viaggio';
                setFieldErrors(prev => ({ ...prev, email: msg }));
                try { toast.showToast(msg, 'error'); } catch (e) {}
                return;
            }
        } catch (e) {
            // ignore duplicate check errors
        }

        try {
            setIsSaving(true);
            const res = onSave(final);
            if (res && typeof (res as Promise<any>).then === 'function') {
                await (res as Promise<any>);
            }
            // close modal only after successful save
            toast.showToast('Partecipante salvato', 'success');
            onClose();
        } catch (err) {
            setSubmitError('Errore durante il salvataggio. Riprovare.');
            try { toast.showToast('Errore salvataggio partecipante', 'error'); } catch (e) {}
            console.error('ParticipantModal save error', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                <header className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{participantToEdit ? 'Modifica partecipante' : 'Aggiungi partecipante'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    {Object.keys(fieldErrors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                            Correggi i seguenti errori:
                            <ul className="mt-1 list-disc list-inside">
                                {Object.entries(fieldErrors).map(([k,v]) => (<li key={k}>{v}</li>))}
                            </ul>
                        </div>
                    )}
                    <FormField label="Name" required>
                        <Input data-testid={process.env.NODE_ENV === 'development' ? 'participant-name' : undefined} name="name" value={formData.name} onChange={handleChange} placeholder="es. Marco Rossi" disabled={isSaving} aria-invalid={fieldErrors.name ? 'true' : 'false'} required aria-required />
                        {fieldErrors.name && <div className="text-xs text-red-600 mt-1">{fieldErrors.name}</div>}
                    </FormField>
                    <FormField label="Email" required>
                        <Input data-testid={process.env.NODE_ENV === 'development' ? 'participant-email' : undefined} name="email" value={formData.email} onChange={handleChange} placeholder="m.rossi@example.com" disabled={isSaving} aria-invalid={fieldErrors.email ? 'true' : 'false'} required aria-required />
                        {fieldErrors.email && <div className="text-xs text-red-600 mt-1">{fieldErrors.email}</div>}
                    </FormField>
                    {/* Hide Trip field when defaultTrip is provided (we're inside a selected trip) */}
                    {!defaultTrip && (
                        <FormField label="Viaggio" required>
                            <Input data-testid={process.env.NODE_ENV === 'development' ? 'participant-trip' : undefined} name="trip" value={formData.trip} onChange={handleChange} placeholder="Nome del viaggio" disabled={isSaving} aria-invalid={fieldErrors.trip ? 'true' : 'false'} required aria-required />
                            {fieldErrors.trip && <div className="text-xs text-red-600 mt-1">{fieldErrors.trip}</div>}
                        </FormField>
                    )}
                    <FormField label="Group">
                        <Input data-testid={process.env.NODE_ENV === 'development' ? 'participant-group' : undefined} name="group" value={formData.group} onChange={handleChange} placeholder="Nome del gruppo" disabled={isSaving} aria-invalid={fieldErrors.group ? 'true' : 'false'} />
                        {fieldErrors.group && <div className="text-xs text-red-600 mt-1">{fieldErrors.group}</div>}
                    </FormField>
                    <FormField label="Status">
                        <Select data-testid={process.env.NODE_ENV === 'development' ? 'participant-status' : undefined} name="status" value={formData.status} onChange={handleChange}>
                            <option value="Registered">Registrato</option>
                            <option value="Invited">Invitato</option>
                            <option value="To Invite">Da invitare</option>
                        </Select>
                    </FormField>
                </div>

                <footer className="flex justify-end items-center space-x-4 p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                    <button onClick={onClose} className="bg-white border border-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        Annulla
                    </button>
                    <div className="flex items-center">
                        {submitError && <div className="text-sm text-red-600 mr-4">{submitError}</div>}
                        <button data-testid={process.env.NODE_ENV === 'development' ? 'participant-save' : undefined} onClick={handleSaveClick} disabled={isSaving} className={`bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'} transition-colors`}>
                            {isSaving ? 'Salvataggio...' : 'Salva partecipante'}
                        </button>
                    </div>
                </footer>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeInScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } } .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; } .animate-fade-in-scale { animation: fadeInScale 0.2s ease-out forwards; }`}</style>
        </div>
    );
};

export default ParticipantModal;
