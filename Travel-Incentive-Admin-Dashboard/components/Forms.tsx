
import React from 'react';
import { SearchIcon, PencilIcon, TrashIcon } from './icons';
import ConfirmModal from './ConfirmModal';

export type Form = {
    id: string | number;
    name: string;
    trip: string;
    responses: string;
};

interface FormsProps {
    onCreateForm: () => void;
    onEditForm?: (id: string | number) => void;
    onDeleteForm?: (id: string | number) => void;
    onCloneForm?: (id: string | number) => void;
    forms: Form[];
}

const Forms: React.FC<FormsProps> = ({ onCreateForm, onEditForm, onDeleteForm, onCloneForm, forms }) => {
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [pendingDeleteId, setPendingDeleteId] = React.useState<string | number | null>(null);
    const [selectedIds, setSelectedIds] = React.useState<Array<string | number>>([]);

    const toggleSelect = (id: string | number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const clearSelection = () => setSelectedIds([]);

    const openConfirm = (id: string | number) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (pendingDeleteId !== null) {
            onDeleteForm && onDeleteForm(pendingDeleteId);
        }
        setConfirmOpen(false);
        setPendingDeleteId(null);
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setPendingDeleteId(null);
    };

    return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Forms</h1>
        <p className="text-gray-500 mt-1">Create and manage forms to collect information from participants.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search forms..."
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
            </div>
            <div className="flex items-center space-x-3">
                {selectedIds.length > 0 && (
                    <button
                        onClick={() => { if (onCloneForm) onCloneForm(selectedIds[0]); clearSelection(); }}
                        className="bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                        Clona Form
                    </button>
                )}
                <button 
                    onClick={onCreateForm}
                    className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Create New Form
                </button>
            </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-4">
                            <span className="sr-only">Select</span>
                        </th>
                        <th scope="col" className="px-6 py-4">Form Name</th>
                        <th scope="col" className="px-6 py-4">Trip</th>
                        <th scope="col" className="px-6 py-4">Registrations</th>
                        <th scope="col" className="px-6 py-4">Status</th>
                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {forms.map((form, index) => (
                        <tr key={`${form.id}-${index}`} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                            <td className="px-4 py-4">
                                <input type="checkbox" checked={selectedIds.includes(form.id)} onChange={() => toggleSelect(form.id)} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                            </td>
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900">
                                <div className="text-gray-900 font-semibold">{(form as any).name}</div>
                                <div className="text-sm text-gray-500 mt-1">{(form as any).description || ''}</div>
                            </th>
                            <td className="px-6 py-4">{form.trip}</td>
                            <td className="px-6 py-4">{form.responses}</td>
                            <td className="px-6 py-4">
                                {(() => {
                                    const st = ((form as any).status || '').toString().toLowerCase();
                                    if (st === 'published' || st === 'publish') {
                                        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">Published</span>;
                                    }
                                    if (st === 'draft' || st === 'drafts') {
                                        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">Draft</span>;
                                    }
                                    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-50 text-gray-600">—</span>;
                                })()}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end space-x-3">
                                    <button
                                        onClick={() => onEditForm && onEditForm(form.id)}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100"
                                        aria-label="Edit form"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                        onClick={() => openConfirm(form.id)}
                                        className="p-1.5 text-red-500 hover:text-red-700 rounded-md transition-colors hover:bg-red-100"
                                        aria-label="Delete form"
                                    >
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
      <ConfirmModal open={confirmOpen} title="Conferma eliminazione" message="Sei sicuro di voler eliminare questo form? Questa azione è irreversibile." confirmLabel="Elimina" cancelLabel="Annulla" variant="danger" onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
    </div>
  );
};

export default Forms;
