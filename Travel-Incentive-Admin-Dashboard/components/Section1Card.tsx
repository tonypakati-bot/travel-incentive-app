import React, { useState, useEffect } from 'react';

type Props = { initial?: { clientName?:string; name?:string; startDate?:string; endDate?:string; subtitle?:string; description?:string }; settings?: any; onSaved: (trip: { tripId:string; clientName?:string; name:string; startDate?:string; endDate?:string; subtitle?:string; description?:string }) => void };

const Section1Card: React.FC<Props> = ({ initial = {}, settings, onSaved }) => {
  const [clientName, setClientName] = useState(initial.clientName || '');
  const [name, setName] = useState(initial.name || '');
  const [subtitle, setSubtitle] = useState(initial.subtitle || '');
  const [description, setDescription] = useState(initial.description || '');
  const [startDate, setStartDate] = useState(initial.startDate || '');
  const [endDate, setEndDate] = useState(initial.endDate || '');
  const [saving, setSaving] = useState(false);
  // Require client, name, subtitle, and valid date range
  const valid = clientName.trim().length > 0 && name.trim().length >= 3 && subtitle.trim().length > 0 && startDate && endDate && startDate <= endDate;

  const saveDraft = async () => {
    if (!valid) return null;
    setSaving(true);
    try {
      const payload: any = { clientName, name, subtitle, description, startDate, endDate, status: 'draft' };
      // DEV E2E: payload is prepared for save
      if (settings) payload.settings = settings;
      const res = await fetch('/api/trips', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json();
      // normalize id shape
      const normalized = { ...(json || {}), tripId: (json && (json.tripId || json._id)) };
      onSaved(normalized as any);
      return normalized;
    } catch (err) {
      console.error(err);
      alert('Errore salvataggio bozza');
      return null;
    } finally { setSaving(false); }
  };

  // Expose E2E helpers for tests to validate and trigger save
  useEffect(() => {
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    const w = (window as any) || {};
    try {
      w.__E2E_isSection1Valid = () => Boolean(valid);
      w.__E2E_saveSection1 = async () => {
        if (!valid) return { ok: false, reason: 'invalid' };
        try {
          const trip = await saveDraft();
          if (!trip) return { ok: false, reason: 'save_failed' };
          return { ok: true, trip };
        } catch (e) {
          return { ok: false, reason: e && e.message };
        }
      };
      // allow tests to set fields directly into React state to avoid DOM-only writes
      w.__E2E_setSection1Fields = (fields: { clientName?:string; name?:string; subtitle?:string; description?:string; startDate?:string; endDate?:string }) => {
        try {
          if (fields.clientName !== undefined) setClientName(fields.clientName);
          if (fields.name !== undefined) setName(fields.name);
          if (fields.subtitle !== undefined) setSubtitle(fields.subtitle);
          if (fields.description !== undefined) setDescription(fields.description);
          if (fields.startDate !== undefined) setStartDate(fields.startDate);
          if (fields.endDate !== undefined) setEndDate(fields.endDate);
          return { ok: true };
        } catch (e) { return { ok: false, reason: e && e.message }; }
      };
    } catch (e) {
      // ignore
    }
    return () => {
      try { delete (window as any).__E2E_isSection1Valid; delete (window as any).__E2E_saveSection1; } catch (e) {}
    };
  }, [valid, clientName, name, subtitle, description, startDate, endDate, settings]);

  return (
    <div className="p-6 bg-white rounded-lg border" aria-labelledby="section1-title">
      <h3 id="section1-title" className="font-bold">Sezione 1 — Informazioni Viaggio</h3>
      <div className="grid grid-cols-1 gap-4 mt-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium">Nome Cliente *</span>
          <input data-testid="trip-client" value={clientName} onChange={e=>setClientName(e.target.value)} className="mt-1 p-2 border rounded" placeholder="Nome Cliente (e.g. Azienda S.p.A.)" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium">Nome del Viaggio *</span>
          <input data-testid="trip-name" value={name} onChange={e=>setName(e.target.value)} className="mt-1 p-2 border rounded" placeholder="Inserisci il nome del viaggio" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium">Sottotitolo del Viaggio *</span>
          <input data-testid="trip-subtitle" value={subtitle} onChange={e=>setSubtitle(e.target.value)} className="mt-1 p-2 border rounded" placeholder="Sottotitolo del viaggio" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium">Descrizione</span>
          <textarea data-testid="trip-description" value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 p-2 border rounded" placeholder="Descrizione del viaggio" rows={3} />
        </label>
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 mt-1">
          <label className="flex flex-col sm:flex-1 sm:max-w-[220px]">
            <span className="text-sm font-medium">Data di Inizio *</span>
            <input data-testid="trip-start-date" type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </label>
          <label className="flex flex-col sm:flex-1 sm:max-w-[220px]">
            <span className="text-sm font-medium">Data di Fine *</span>
            <input data-testid="trip-end-date" type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button data-testid="save-section-1" onClick={saveDraft} disabled={!valid || saving} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {saving ? 'Salvataggio...' : 'Salva bozza'}
        </button>
        <button data-testid="reset-section-1" onClick={() => { setName(initial.name||''); setStartDate(initial.startDate||''); setEndDate(initial.endDate||''); }} className="px-3 py-2 rounded border">
          Annulla
        </button>
        {!valid && <div className="text-sm text-red-600" data-testid="section1-error">Controlla i campi obbligatori</div>}
      </div>
    </div>
  );
};

export default Section1Card;
