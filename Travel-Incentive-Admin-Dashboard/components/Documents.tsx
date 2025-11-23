import React, { useEffect, useState } from 'react';
import DocumentCreator from './DocumentCreator';
import ConfirmModal from './ConfirmModal';
import { fetchDocumentOptions, getDocumentById, deleteDocument } from '../services/documents';

type DocRow = { id: string; title: string; value?: string; label?: string };

const Documents: React.FC = () => {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const opts = await fetchDocumentOptions();
      if (opts && opts.length) setDocs(opts.map(o => ({ id: o.value, title: o.label, value: o.value, label: o.label })));
    } catch (e) { console.error('Failed to load documents', e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (id: string) => { setToDeleteId(id); setConfirmOpen(true); };
  const handleConfirmDelete = async () => {
    if (!toDeleteId) return setConfirmOpen(false);
    try {
      const ok = await deleteDocument(toDeleteId);
      if (ok) {
        setDocs(prev => prev.filter(d => d.id !== toDeleteId));
        try { window.dispatchEvent(new CustomEvent('documents:changed', { detail: { action: 'delete', id: toDeleteId } })); } catch (e) {}
      } else {
        alert('Errore durante l\'eliminazione');
      }
    } catch (e) { console.error('Delete failed', e); alert('Errore durante l\'eliminazione'); }
    setConfirmOpen(false);
    setToDeleteId(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
          <p className="text-gray-500 mt-1">Manage and view trip-related documents.</p>
        </div>
        <div>
          <button onClick={() => setCreating(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Create Document</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">
          {loading ? <div>Loading...</div> : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.title}</td>
                    <td className="px-4 py-3">{d.id}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button onClick={async () => {
                          const full = await getDocumentById(d.id);
                          try { (window as any).__E2E_lastOpenDoc = full || null; } catch (e) {}
                          setCreating(true);
                        }} className="text-gray-600 hover:text-gray-800 px-2 py-1 rounded">Edit</button>
                        <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800 px-2 py-1 rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <DocumentCreator open={creating} onCreated={(opt) => { setCreating(false); load(); try { window.dispatchEvent(new CustomEvent('documents:changed', { detail: { action: 'create', doc: opt } })); } catch (e) {} }} onClose={() => setCreating(false)} />

      <ConfirmModal open={confirmOpen} title="Conferma eliminazione" message="Sei sicuro di voler eliminare questo documento?" confirmLabel="Elimina" cancelLabel="Annulla" variant="danger" onConfirm={handleConfirmDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
};

export default Documents;