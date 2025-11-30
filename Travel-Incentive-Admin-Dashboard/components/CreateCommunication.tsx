import React, { useEffect, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { ChevronDownIcon } from './icons';

interface CreateCommunicationProps {
    onCancel: () => void;
    onSave: () => void;
    initialType?: 'information' | 'alert';
    initialData?: any | null; // if provided, component operates in edit mode
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

const CreateCommunication: React.FC<CreateCommunicationProps> = ({ onCancel, onSave, initialType, initialData }) => {
    const [communicationType, setCommunicationType] = useState<'information' | 'alert'>(initialType || 'information');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [trips, setTrips] = useState<Array<any>>([]);
    const [selectedTripId, setSelectedTripId] = useState<string>('');
    const [groups, setGroups] = useState<Array<string>>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [title, setTitle] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
    const [modalMessage, setModalMessage] = useState('');
    const [modalVariant, setModalVariant] = useState<'success'|'danger'|'info'>('info');

    useEffect(() => {
        // fetch trips from server
        let mounted = true;
        fetch('/api/trips')
          .then(r => r.json())
          .then(data => {
              if (!mounted) return;
              // trips route may return array or { items }
              const list = Array.isArray(data) ? data : (data.items || data.trips || []);
              setTrips(list || []);
          }).catch(err => console.error('Failed to fetch trips', err));
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!selectedTripId) {
            setGroups([]);
            setSelectedGroup('all');
            return;
        }
        // find trip and populate groups
        const t = trips.find(tr => String(tr._id || tr.id || tr._id) === String(selectedTripId));
        const gs = (t && t.settings && Array.isArray(t.settings.groups)) ? t.settings.groups : [];
        // keep groups exactly as provided by DB (don't inject 'all') and always allow selecting 'all' in the UI
        setGroups(gs || []);
        // If we are editing an existing communication, preserve the originally selected group
        if (editingId) {
            // do not override selectedGroup when editing
            return;
        }
        // Force select to 'all' when user selects a trip (preferred behavior)
        setSelectedGroup('all');
    }, [selectedTripId, trips, editingId]);

    // prefill when initialData provided
    useEffect(() => {
        if (!initialType && !initialData) return;
        if (initialData) {
            setEditingId(initialData._id || initialData.id || null);
            setCommunicationType(initialData.type || initialType || 'information');
            setSelectedTripId(initialData.tripId || initialData.trip || '');
            setSelectedGroup(initialData.group || 'all');
            setTitle(initialData.title || '');
            setMessage(initialData.message || '');
        } else if (initialType) {
            setCommunicationType(initialType);
        }
    }, [initialType, initialData]);

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Nuova Comunicazione</h1>
                <p className="text-gray-500 mt-1">Componi un nuovo messaggio da inviare ai partecipanti.</p>
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
                                <div className="relative">
                                    <select value={selectedTripId} onChange={e => setSelectedTripId(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
                                        <option value="" disabled>-- Seleziona un viaggio --</option>
                                        {trips.map(t => (
                                            <option key={String(t._id || t.id)} value={String(t._id || t.id)}>{t.name || t.title || t.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                </div>
                            </FormField>
                            <FormField label="Seleziona Gruppo" required>
                                <div className="relative">
                                        <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
                                            <option value="all">Tutti i gruppi</option>
                                            {groups.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                </div>
                            </FormField>
                        </div>

                        <FormField label="Titolo" required>
                            <Input placeholder="es. Ritardo volo" value={title} onChange={e => setTitle(e.target.value)} />
                        </FormField>
                        <FormField label="Messaggio" required>
                            <Textarea placeholder="Scrivi qui il tuo messaggio..." value={message} onChange={e => setMessage(e.target.value)} />
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
                    onClick={async () => {
                            if (!selectedTripId || !title || !message) {
                                setModalTitle('Compila i campi obbligatori');
                                setModalMessage('Compila i campi obbligatori');
                                setModalVariant('info');
                                setModalOpen(true);
                            return;
                        }
                        setLoading(true);
                        try {
                            let res;
                            if (editingId) {
                                res = await fetch(`/api/communications/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: selectedTripId, group: selectedGroup, type: communicationType, title, message }) });
                            } else {
                                res = await fetch('/api/communications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: selectedTripId, group: selectedGroup, type: communicationType, title, message }) });
                            }
                            if (!res.ok) {
                                const err = await res.json().catch(()=>({ error: 'unknown' }));
                                setModalTitle('Salvataggio fallito');
                                setModalMessage('Salvataggio fallito: ' + (err && err.error ? err.error : res.statusText));
                                setModalVariant('danger');
                                setModalOpen(true);
                            } else {
                                const data = await res.json();
                                setModalTitle('Salvato');
                                setModalMessage('Comunicazione salvata con successo');
                                setModalVariant('success');
                                setModalOpen(true);
                                // notify parent to refresh
                                try { window.dispatchEvent(new CustomEvent('communications:refresh')); } catch (e) {}
                                // optionally reset fields
                                setTitle(''); setMessage(''); setSelectedTripId(''); setSelectedGroup('all');
                            }
                        } catch (e) {
                            console.error(e);
                            setModalTitle('Errore di rete');
                            setModalMessage('Errore di rete durante il salvataggio');
                            setModalVariant('danger');
                            setModalOpen(true);
                        } finally { setLoading(false); }
                    }}
                    className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    {loading ? 'Saving...' : 'Save'}
                </button>
            </footer>
                <ConfirmModal open={modalOpen} title={modalTitle} message={modalMessage} confirmLabel="Ok" cancelLabel="" onConfirm={() => { setModalOpen(false); if (modalVariant === 'success') { try { onSave(); } catch(e){} } }} onCancel={() => setModalOpen(false)} variant={modalVariant} />
        </div>
    );
};

export default CreateCommunication;