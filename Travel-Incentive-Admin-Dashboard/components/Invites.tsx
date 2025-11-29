import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import { ChevronDownIcon, SearchIcon, PencilIcon, TrashIcon, PlusIcon } from './icons';

export interface Invite {
    id?: string | number;
    _id?: string;
    tripName: string;
    sender: string;
    subject: string;
    body: string;
    status: 'Draft' | 'Ready' | 'Sent';
    lastModified: string;
}

export const initialInvites: Invite[] = [
    { 
        id: 1, 
        tripName: 'Sales Kick-off Dubai', 
        sender: 'Team Eventi', 
        subject: 'Invito Esclusivo: Sales Kick-off 2026', 
        body: `Gentile Collega,\n\nSiamo lieti di invitarti al Sales Kick-off 2026 che si terrà a Dubai.\n\nPer favore conferma la tua presenza compilando il form.\n\nCordiali saluti,\nTeam Eventi`,
        status: 'Ready', 
        lastModified: '15 Ott, 2025' 
    },
    { 
        id: 2, 
        tripName: 'Trip to Ibiza', 
        sender: 'HR Department', 
        subject: 'Your Ticket to Ibiza!', 
        body: `Hola!\n\nGet ready for an amazing trip to Ibiza. We have planned exciting activities for the team.\n\nPlease register using the link below.\n\nBest,\nHR Team`,
        status: 'Draft', 
        lastModified: '20 Set, 2025' 
    },
];

const mockTrips = [
    { id: 'IBZ2026', name: 'Trip to Ibiza' },
    { id: 'DXB2026', name: 'Sales Kick-off Dubai' },
    { id: 'MYK2025', name: 'Team Retreat Mykonos' },
    { id: 'ASP2025', name: 'Ski Trip to Aspen' },
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
        className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${props.className || ''}`}
    />
);

const Select: React.FC<{ children: React.ReactNode, value?: string | number, onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ children, value, onChange }) => (
    <div className="relative">
        <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
            {children}
        </select>
        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
    </div>
);

interface InvitesProps {
    invites?: Invite[];
    onSave?: (invite: Invite) => void;
    onDelete?: (id: string | number) => void;
}

const Invites: React.FC<InvitesProps> = ({ invites = initialInvites, onSave, onDelete }) => {
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [currentId, setCurrentId] = useState<string | number | null>(null);
    const [formData, setFormData] = useState<{
        tripName: string;
        sender: string;
        subject: string;
        body: string;
    }>({ tripName: '', sender: '', subject: '', body: '' });

    const handleCreateNew = () => {
        setFormData({ tripName: '', sender: '', subject: '', body: '' });
        setCurrentId(null);
        setView('create');
    };

    const handleEdit = (invite: Invite) => {
        setFormData({
            tripName: invite.tripName,
            sender: invite.sender,
            subject: invite.subject,
            body: invite.body
        });
        setCurrentId(invite.id);
        setView('edit');
    };

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<string | number | null>(null);
    const toast = useToast();

    const handleDeleteAction = (id: string | number) => {
        setToDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleSaveAction = () => {
        if (!formData.tripName || !formData.sender || !formData.subject || !formData.body) {
            console.log('[Invites] validation failed - empty fields');
            toast.showToast('Compila tutti i campi obbligatori.', 'error');
            return;
        }

        const now = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const inviteToSave: Invite = {
            id: currentId || String(Date.now()),
            ...formData,
            status: 'Draft', // Logic could be expanded to manage status
            lastModified: now
        };

        if (onSave) onSave(inviteToSave);
            setView('list');
            // show a success toast when template is saved
            try {
                toast.showToast('Template salvato con successo.', 'success');
            } catch (e) { console.error('Toast error', e); }
    };

    const filteredInvites = invites.filter(i => 
        i.tripName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Ready': return 'bg-green-100 text-green-800';
            case 'Sent': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (view === 'list') {
        return (
            <div className="p-8 animate-fade-in">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Invites</h1>
                    <p className="text-gray-500 mt-1">Manage email invitation templates for your trips.</p>
                </header>

                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        <button 
                            data-testid={process.env.NODE_ENV === 'development' ? 'create-invite' : undefined}
                            onClick={handleCreateNew}
                            className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Create New Invite
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-4">Trip Name</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Sender</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Modified</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvites.map(invite => (
                                <tr key={String(invite.id ?? invite._id ?? '')} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{invite.tripName}</td>
                                    <td className="px-6 py-4">{invite.subject}</td>
                                    <td className="px-6 py-4">{invite.sender}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(invite.status)}`}>
                                            {invite.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{invite.lastModified}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button data-testid={process.env.NODE_ENV === 'development' ? `edit-invite-${invite.id}` : undefined} onClick={() => handleEdit(invite)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteAction(invite.id ?? invite._id ?? '')} className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-100">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvites.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No invites found. Create a new one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <ConfirmModal
                    open={isConfirmOpen}
                    title="Eliminare template"
                    message={`Sei sicuro di voler eliminare questo template?`}
                    confirmLabel="Elimina"
                    cancelLabel="Annulla"
                    onCancel={() => { setIsConfirmOpen(false); setToDeleteId(null); }}
                    onConfirm={() => {
                        if (toDeleteId !== null && onDelete) onDelete(toDeleteId);
                        setIsConfirmOpen(false);
                        setToDeleteId(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-8 animate-fade-in">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{view === 'create' ? 'Create Template' : 'Edit Template'}</h1>
                    <p className="text-gray-500 mt-1">Design your email invitation.</p>
                </div>
                <button 
                    data-testid={process.env.NODE_ENV === 'development' ? 'back-to-list' : undefined}
                    onClick={() => setView('list')}
                    className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Back to List
                </button>
            </header>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-sm">
                    <div className="space-y-6">
                        <FormField label="Seleziona Viaggio" required>
                            <Select 
                                value={formData.tripName} 
                                onChange={(e) => setFormData({...formData, tripName: e.target.value})}
                            >
                                <option value="" disabled>-- Seleziona un viaggio --</option>
                                {mockTrips.map(trip => (
                                    <option key={trip.id} value={trip.name}>{trip.name}</option>
                                ))}
                            </Select>
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Mittente" required>
                                <Input 
                                    placeholder="e.g. Team Eventi" 
                                    value={formData.sender}
                                    onChange={(e) => setFormData({...formData, sender: e.target.value})}
                                />
                            </FormField>
                            <FormField label="Oggetto" required>
                                <Input 
                                    placeholder="e.g. Invito Esclusivo: Sales Kick-off 2026" 
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                />
                            </FormField>
                        </div>

                        <FormField label="Corpo della mail" required>
                            <Textarea 
                                rows={12} 
                                placeholder="Scrivi qui il contenuto dell'invito..." 
                                value={formData.body}
                                onChange={(e) => setFormData({...formData, body: e.target.value})}
                            />
                            <div className="mt-2 flex items-center text-xs text-gray-500 space-x-2">
                                <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">[NOME_PARTECIPANTE]</span>
                                <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">[LINK_REGISTRAZIONE]</span>
                                <span>verranno sostituiti automaticamente.</span>
                            </div>
                        </FormField>
                    </div>
                </div>
            </div>

            <footer className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center space-x-4">
                 <button 
                    className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    Invia Test
                </button>
                <button 
                    data-testid={process.env.NODE_ENV === 'development' ? 'save-invite' : undefined}
                    onClick={handleSaveAction}
                    className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Salva Template
                </button>
            </footer>
        </div>
    );
};

export default Invites;