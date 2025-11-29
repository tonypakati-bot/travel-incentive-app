import React, { useEffect, useState, useRef } from 'react';

type ContactOption = { id: string; name: string; category?: string };

type Props = {
  groups?: string[];
  disabled?: boolean;
  initial?: Array<{ group?: string; contactId?: string }>;
  onChange?: (items: Array<{ group?: string; contactId?: string }>) => void;
};

const SectionEmergencyContacts: React.FC<Props> = ({ groups = [], disabled = false, initial = [], onChange }) => {
  // ensure initial contactIds are strings to match contact option `id` values
  const [rows, setRows] = useState(() => (initial || []).map(it => ({ ...(it||{}), contactId: it && it.contactId ? String(it.contactId) : it && it.contactId ? it.contactId : '' })));
  const skipNotifyRef = useRef(false);
  const mountedRef = useRef(false);
  const [contacts, setContacts] = useState<ContactOption[]>([]);

  useEffect(() => {
    // Try to fetch contacts from API; fallback to empty list
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/contacts');
        if (!res.ok) throw new Error('no-contacts');
        const json = await res.json();
        if (!mounted) return;
        const mapped = (json || []).map((c: any) => ({ id: String(c.id || c._id || c.contactId || ''), name: c.name || c.fullName || c.displayName || c.firstName, category: c.category || c.role || c.type }));
        try { /* fetched contacts: { raw: json, mapped } */ } catch (e) {}
        setContacts(mapped.sort((a,b)=> (a.name||'').toLowerCase() > (b.name||'').toLowerCase() ? 1 : -1));
      } catch (e) {
        // ignore; leave contacts empty
        setContacts([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

    useEffect(() => {
      // Skip notifying parent when rows were updated as a result of syncing `initial`.
      if (skipNotifyRef.current) {
        skipNotifyRef.current = false;
        return;
      }
      // avoid calling onChange during initial mount if `initial` was used to seed rows
      if (!mountedRef.current) {
        mountedRef.current = true;
        return;
      }
      if (onChange) onChange(rows);
    }, [rows]);

    useEffect(() => {
      // Coerce incoming initial contactIds to strings to match fetched contact ids
      try {
        const normalized = (initial || []).map(it => ({ ...(it || {}), contactId: it && it.contactId ? String(it.contactId) : '' }));
        try { /* sync initial -> normalized */ } catch (e) {}
        // shallow equality check to avoid unnecessary state updates that can trigger a loop
        const eq = (a: any[], b: any[]) => {
          if (a === b) return true;
          if (!Array.isArray(a) || !Array.isArray(b)) return false;
          if (a.length !== b.length) return false;
          for (let i = 0; i < a.length; i++) {
            const ai = a[i] || {};
            const bi = b[i] || {};
            if ((ai.contactId || '') !== (bi.contactId || '') || (ai.group || '') !== (bi.group || '')) return false;
          }
          return true;
        };
        if (!eq(normalized, rows)) {
          skipNotifyRef.current = true;
          setRows(normalized);
        }
      } catch (e) {
        if (!Array.isArray(initial) || initial.length === 0) setRows([]);
        else setRows(initial || []);
      }
    }, [initial]);

  const addRow = () => setRows(prev => ([...prev, { group: '', contactId: '' }]));
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, data: Partial<{ group?: string; contactId?: string }>) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...data } : r));

  useEffect(() => {
    try { /* rows changed */ } catch (e) {}
  }, [rows]);

  return (
    <div className={`p-6 bg-white rounded-lg border ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <h3 className="font-bold">Sezione 5: Contatti di Emergenza e Sicurezza</h3>
      <div className="mt-4 space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border rounded">
            {groups && groups.length ? (
              <label className="flex-1">
                <div className="text-sm font-medium">Gruppo Partenza</div>
                <select value={r.group || ''} onChange={(e)=>updateRow(i,{ group: e.target.value || undefined })} className="mt-1 w-full p-2 border rounded">
                  <option value="">-- Seleziona Gruppo --</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
            ) : null}

            <label className="flex-1">
              <div className="text-sm font-medium">Seleziona Contatto</div>
              <select value={r.contactId || ''} onChange={(e)=>updateRow(i,{ contactId: e.target.value || undefined })} className="mt-1 w-full p-2 border rounded">
                <option value="">-- Seleziona Contatto --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{`${c.name}${c.category ? ` (${c.category})` : ''}`}</option>)}
              </select>
            </label>

            <button type="button" onClick={()=>removeRow(i)} aria-label="Rimuovi contatto" className="text-red-600 px-2 py-1">🗑️</button>
          </div>
        ))}

        <div>
          <button type="button" onClick={addRow} className="text-blue-600 bg-blue-50 px-3 py-2 rounded">+ Aggiungi Contatto</button>
        </div>
      </div>
    </div>
  );
};

export default SectionEmergencyContacts;
