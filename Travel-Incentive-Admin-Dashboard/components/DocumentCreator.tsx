import React, { useState } from 'react';
import { createDocument } from '../services/documents';

type Props = { onCreated: (opt:{ value:string; label:string })=>void; onCancel?: ()=>void };

const DocumentCreator: React.FC<Props> = ({ onCreated, onCancel }) => {
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

  const handleCreate = async () => {
    if (!title.trim()) return setError('Titolo richiesto');
    setSaving(true);
    setError(null);
    const res = await createDocument({ title: title.trim(), content, usefulInfo: {
      destinationName, country, documents: documentsField, timeZone, currency, language, climate, vaccinationsHealth
    }});
    setSaving(false);
    if (!res) return setError('Errore durante la creazione');
    onCreated(res);
  };

  return (
    <div className="p-4 border rounded bg-white">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Destination Name (opz.)</label>
        <input value={destinationName} onChange={e=>setDestinationName(e.target.value)} className="p-2 border rounded" />
        <label className="text-sm font-medium">Country (opz.)</label>
        <input value={country} onChange={e=>setCountry(e.target.value)} className="p-2 border rounded" />
        <label className="text-sm font-medium">Titolo</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="p-2 border rounded" />
        <label className="text-sm font-medium">Contenuto (opz.)</label>
        <textarea value={content} onChange={e=>setContent(e.target.value)} className="p-2 border rounded" rows={4} />
        <label className="text-sm font-medium">Documents (opz.)</label>
        <textarea value={documentsField} onChange={e=>setDocumentsField(e.target.value)} className="p-2 border rounded" rows={2} />
        <label className="text-sm font-medium">Time Zone (opz.)</label>
        <input value={timeZone} onChange={e=>setTimeZone(e.target.value)} className="p-2 border rounded" />
        <label className="text-sm font-medium">Currency (opz.)</label>
        <input value={currency} onChange={e=>setCurrency(e.target.value)} className="p-2 border rounded" />
        <label className="text-sm font-medium">Language (opz.)</label>
        <input value={language} onChange={e=>setLanguage(e.target.value)} className="p-2 border rounded" />
        <label className="text-sm font-medium">Climate (opz.)</label>
        <input value={climate} onChange={e=>setClimate(e.target.value)} className="p-2 border rounded" />
        <label className="text-sm font-medium">Vaccinations & Health (opz.)</label>
        <textarea value={vaccinationsHealth} onChange={e=>setVaccinationsHealth(e.target.value)} className="p-2 border rounded" rows={2} />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button onClick={handleCreate} disabled={saving} className="bg-blue-600 text-white px-3 py-1 rounded">{saving ? 'Creazione...' : 'Crea documento'}</button>
          <button onClick={onCancel} className="px-3 py-1 border rounded">Annulla</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCreator;
