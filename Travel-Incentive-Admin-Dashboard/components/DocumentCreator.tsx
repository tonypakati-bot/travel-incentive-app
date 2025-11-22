import React, { useState } from 'react';
import { XIcon } from './icons';
import { createDocument } from '../services/documents';
import { useToast } from './ToastContext';

type Props = { open: boolean; onCreated: (opt:{ value:string; label:string })=>void; onClose: ()=>void };

const DocumentCreator: React.FC<Props> = ({ open, onCreated, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [country, setCountry] = useState('');
  const [documentsField, setDocumentsField] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [currency, setCurrency] = useState('');
  const [language, setLanguage] = useState('');
  const [climate, setClimate] = useState('');
  const [vaccinationsHealth, setVaccinationsHealth] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  if (!open) return null;

  const handleCreate = async () => {
    if (!title.trim()) return setError('Titolo richiesto');
    setSaving(true);
    setError(null);
    const res = await createDocument({ title: title.trim(), content, usefulInfo: {
      destinationName, country, documents: documentsField, timeZone, currency, language, climate, vaccinationsHealth
    }});
    setSaving(false);
    if (!res) return setError('Errore durante la creazione');
    // show toast then close
    toast.push('Documento creato con successo', 'success');
    setTimeout(() => onCreated(res), 250);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Create New Document</h3>
          <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-600" /></button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Destination Name</label>
            <input data-testid="doc-creator-destinationName" value={destinationName} onChange={e=>setDestinationName(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Country</label>
            <input data-testid="doc-creator-country" value={country} onChange={e=>setCountry(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Title</label>
            <input data-testid="doc-creator-title" value={title} onChange={e=>setTitle(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Content</label>
            <textarea data-testid="doc-creator-content" value={content} onChange={e=>setContent(e.target.value)} className="mt-1 p-2 border rounded w-full" rows={4} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Documents</label>
            <textarea data-testid="doc-creator-documents" value={documentsField} onChange={e=>setDocumentsField(e.target.value)} className="mt-1 p-2 border rounded w-full" rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Time Zone</label>
            <input data-testid="doc-creator-timeZone" value={timeZone} onChange={e=>setTimeZone(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Currency</label>
            <input data-testid="doc-creator-currency" value={currency} onChange={e=>setCurrency(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Language</label>
            <input data-testid="doc-creator-language" value={language} onChange={e=>setLanguage(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <label className="text-sm font-medium">Climate</label>
            <input data-testid="doc-creator-climate" value={climate} onChange={e=>setClimate(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Vaccinations & Health</label>
            <textarea data-testid="doc-creator-vaccinations" value={vaccinationsHealth} onChange={e=>setVaccinationsHealth(e.target.value)} className="mt-1 p-2 border rounded w-full" rows={2} />
          </div>
        </div>
        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        <footer className="flex justify-end gap-3 mt-4">
          <button data-testid="doc-creator-cancel" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button data-testid="doc-creator-create" onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Creating...' : 'Create'}</button>
        </footer>
      </div>
    </div>
  );
};

export default DocumentCreator;
