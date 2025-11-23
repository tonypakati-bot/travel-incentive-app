import React, { useState } from 'react';
import { SearchIcon, PencilIcon, TrashIcon } from './icons';
import ConfirmModal from './ConfirmModal';
import UsefulInformationModal, { UsefulInfoData } from './UsefulInformationModal';

export type UsefulInfoEntry = {
    id: string;
    destinationName: string;
    country: string;
    dateAdded: string;
    fullData: UsefulInfoData;
};

export const initialInformations: UsefulInfoEntry[] = [
    { 
        id: '2',
        destinationName: 'Ibiza', 
        country: 'Spagna', 
        dateAdded: '15 Mag, 2026',
        fullData: {
            destinationName: 'Ibiza',
            country: 'Spagna',
            documents: 'Passport or valid ID card required for EU citizens.',
            timeZone: 'GMT+2 (same as Italy during summer).',
            currency: 'Euro (€).',
            language: 'Spanish and Catalan. English and Italian are widely spoken.',
            climate: 'Mediterranean climate, hot summers and mild winters.',
            vaccinationsHealth: 'No specific vaccinations required. European Health Insurance Card (EHIC) is recommended.'
        }
    },
    { 
        id: '3',
        destinationName: 'Mykonos', 
        country: 'Grecia', 
        dateAdded: '01 Dic, 2025',
        fullData: {
            destinationName: 'Mykonos',
            country: 'Grecia',
            documents: 'Passport or valid ID card required for EU citizens.',
            timeZone: 'GMT+3 (1 hour ahead of Italy).',
            currency: 'Euro (€).',
            language: 'Greek. English is widely spoken in tourist areas.',
            climate: 'Mediterranean climate, known for being windy (Meltemi).',
            vaccinationsHealth: 'No specific vaccinations required. European Health Insurance Card (EHIC) is recommended.'
        }
    },
      { 
          id: '1', 
        destinationName: 'Abu Dhabi', 
        country: 'Emirati Arabi Uniti', 
        dateAdded: '22 Lug, 2026',
        fullData: {
            destinationName: "Abu Dhabi",
            country: "Emirati Arabi Uniti",
            documents: "Entry into the Emirates only requires a passport with a minimum validity of 6 months. No visa is needed for EU citizens for stays up to 90 days.",
            timeZone: "The time difference is GMT+3, which is 3 hours ahead of Italian time (2 hours when daylight saving time is in effect).",
            currency: "The Emirati Dirham (AED) is worth approximately €0.25. Major credit cards are accepted everywhere.",
            language: "The official language is Arabic. English is understood and widely spoken in tourist areas.",
            climate: "The climate in the United Arab Emirates is subtropical and arid. Rain is rare. The best time to visit is from October to April when temperatures are milder.",
            vaccinationsHealth: "No mandatory vaccinations are required. Medicines are readily available in numerous pharmacies.",
        }
    },
];

interface UsefulInformationsProps {
    informations: UsefulInfoEntry[];
    setInformations: React.Dispatch<React.SetStateAction<UsefulInfoEntry[]>>;
}

const UsefulInformations: React.FC<UsefulInformationsProps> = ({ informations, setInformations }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
    const [editingInfoData, setEditingInfoData] = useState<UsefulInfoData | null>(null);
    
    const infoToEdit = editingInfoData;

    const handleOpenCreateModal = () => {
        setEditingInfoId(null);
        setEditingInfoData(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = async (info: UsefulInfoEntry) => {
        setEditingInfoId(info.id);
        setEditingInfoData(null);
        setIsModalOpen(true); // open immediately to show spinner or placeholder if modal supports it

        try {
            const res = await fetch(`http://localhost:5001/api/useful-informations/${info.id}`);
            if (!res.ok) throw new Error(`Failed to fetch useful info ${info.id}`);
            const full = await res.json();
            // server returns object with usefulInfo field
            setEditingInfoData(full.usefulInfo || null);
        } catch (err) {
            console.error('Failed to load full useful info for editing', err);
            // leave editingInfoData as null so modal can handle empty state
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingInfoId(null);
        setEditingInfoData(null);
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toDeleteId, setToDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setToDeleteId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (toDeleteId === null) return;
        try {
            const res = await fetch(`http://localhost:5001/api/useful-informations/${toDeleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setInformations(prev => prev.filter(info => info.id !== toDeleteId));
        } catch (err) {
            console.error('Failed to delete useful info', err);
            // Optionally show user-facing error
        } finally {
            setConfirmOpen(false);
            setToDeleteId(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setToDeleteId(null);
    };

    const handleSaveInfo = async (data: UsefulInfoData) => {
        // If editing, send PATCH, otherwise POST
        if (editingInfoId !== null) {
            try {
                const res = await fetch(`http://localhost:5001/api/useful-informations/${editingInfoId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usefulInfo: data, title: data.destinationName, content: '' }),
                });
                if (!res.ok) throw new Error('Update failed');
                const updated = await res.json();
                // Map server returned object to UsefulInfoEntry
                setInformations(prev => prev.map(info => info.id === editingInfoId
                    ? {
                        id: String(updated._id || updated.id || editingInfoId),
                        destinationName: updated.usefulInfo?.destinationName || data.destinationName,
                        country: updated.usefulInfo?.country || data.country,
                        dateAdded: prev.find(p => p.id === editingInfoId)?.dateAdded || new Date().toLocaleDateString('it-IT'),
                        fullData: updated.usefulInfo || data,
                    }
                    : info
                ));
            } catch (err) {
                console.error('Failed to update useful info', err);
            } finally {
                handleCloseModal();
            }
        } else {
            try {
                const titleFallback = (data.destinationName && data.destinationName.trim()) || (data.country && data.country.trim()) || (data.documents && String(data.documents).split('\n')[0].slice(0, 60)) || 'Untitled Useful Information';
                const payload = { title: titleFallback, usefulInfo: data, content: '' };
                console.debug('Creating useful info with payload:', payload);

                const res = await fetch('http://localhost:5001/api/useful-informations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error('Create failed');
                const created = await res.json();
                const newInfo: UsefulInfoEntry = {
                    id: String(created._id || created.id || Date.now()),
                    destinationName: created.usefulInfo?.destinationName || data.destinationName,
                    country: created.usefulInfo?.country || data.country,
                    dateAdded: new Date(created.createdAt || Date.now()).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', ''),
                    fullData: created.usefulInfo || data,
                };
                setInformations(prev => [newInfo, ...prev]);
            } catch (err) {
                console.error('Failed to create useful info', err);
            } finally {
                handleCloseModal();
            }
        }
    };

    return (
        <>
            <div className="p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Useful Informations</h1>
                    <p className="text-gray-500 mt-1">Manage useful travel information for participants.</p>
                </header>
                
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                            type="text" 
                            placeholder="Search information..."
                            className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        <button 
                            onClick={handleOpenCreateModal}
                            className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            Create New Useful Information
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Destination Name</th>
                                    <th scope="col" className="px-6 py-4">Country</th>
                                    <th scope="col" className="px-6 py-4">Date Added</th>
                                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {informations.map((info) => (
                                    <tr key={info.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {info.destinationName}
                                        </th>
                                        <td className="px-6 py-4">{info.country}</td>
                                        <td className="px-6 py-4">{info.dateAdded}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-3">
                                                <button onClick={() => handleOpenEditModal(info)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100" aria-label="Edit information">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(info.id)} className="p-1.5 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100" aria-label="Delete information">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <UsefulInformationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveInfo}
                infoToEdit={infoToEdit}
            />
            <ConfirmModal
                open={confirmOpen}
                title="Conferma eliminazione"
                message="Sei sicuro di voler eliminare questa informazione? Questa azione è irreversibile."
                confirmLabel="Elimina"
                cancelLabel="Annulla"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </>
    );
};

export default UsefulInformations;