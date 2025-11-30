import React, { useEffect, useState } from 'react';
import { SearchIcon, PencilIcon, TrashIcon } from './icons';
import ConfirmModal from './ConfirmModal';

type Communication = {
        _id: string;
        title: string;
        type: string;
        tripName?: string;
        group?: string;
        sentAt?: string;
        createdAt?: string;
};

interface CommunicationsProps {
    onCreateCommunication: (initialType?: 'information' | 'alert') => void;
}

const getTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    switch (t) {
        case 'information':
            return 'bg-blue-100 text-blue-800';
        case 'alert':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) { return iso; }
};

const Communications: React.FC<CommunicationsProps> = ({ onCreateCommunication }) => {
    const [communications, setCommunications] = useState<Communication[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const refresh = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/communications');
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data.items || []);
            setCommunications(items);
        } catch (e) {
            console.error('Failed to load communications', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        if (mounted) refresh();
        const handler = () => refresh();
        try { window.addEventListener('communications:refresh', handler); } catch (e) {}
        return () => { mounted = false; try { window.removeEventListener('communications:refresh', handler); } catch (e) {} };
    }, []);

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/communications/${deleteId}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(()=>({ error: 'unknown' }));
                // fallback to alert for errors
                alert('Delete failed: ' + (err.error || res.statusText));
            } else {
                setConfirmOpen(false);
                setDeleteId(null);
                await refresh();
            }
        } catch (e) { console.error(e); alert('Network error'); }
    };

    return (
        <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Comunicazioni</h1>
        <p className="text-gray-500 mt-1">Invia informazioni e alert ai partecipanti del viaggio.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                type="text" 
                placeholder="Cerca comunicazioni..."
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
            </div>
            <button 
                onClick={() => onCreateCommunication()}
                className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Nuova Comunicazione
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4">Title</th>
                        <th scope="col" className="px-6 py-4">Type</th>
                        <th scope="col" className="px-6 py-4">Trip</th>
                        <th scope="col" className="px-6 py-4">Audience</th>
                        <th scope="col" className="px-6 py-4">Date Sent</th>
                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : communications.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No communications found</td></tr>
                    ) : (
                      communications.map((comm) => (
                        <tr key={comm._id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                {comm.title}
                            </th>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getTypeBadge(comm.type)}`}>
                                    {String(comm.type || '').charAt(0).toUpperCase() + String(comm.type || '').slice(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4">{comm.tripName || '-'}</td>
                            <td className="px-6 py-4">{comm.group === 'all' ? 'Tutti i gruppi' : (comm.group || '-')}</td>
                            <td className="px-6 py-4">{formatDate(comm.sentAt || comm.createdAt)}</td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end space-x-3">
                                    <button onClick={() => onCreateCommunication(comm)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100" aria-label="Edit communication">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setDeleteId(comm._id); setConfirmOpen(true); }} className="p-1.5 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100" aria-label="Delete communication">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                      ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
                                <ConfirmModal open={confirmOpen} title="Conferma eliminazione" message="Sei sicuro di voler eliminare questa comunicazione?" confirmLabel="Elimina" cancelLabel="Annulla" onConfirm={confirmDelete} onCancel={() => { setConfirmOpen(false); setDeleteId(null); }} variant="danger" />
        </div>
    );
};

export default Communications;