import React, { useState, useEffect } from 'react';
import Section1Card from './Section1Card';
import SectionDocumentsCard from './SectionDocumentsCard';
import SectionSettingsCard from './SectionSettingsCard';
import SectionEmergencyContacts from './SectionEmergencyContacts';
import { ChevronDownIcon, CheckIcon, TrashIcon, PlusIcon } from './icons';
import { FormField, Input, Textarea } from './CreateForm';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import IconSelect from './IconSelect';

interface CreateTripProps {
  onCancel: () => void;
  onSave: () => void;
  isEditing?: boolean;
}

const Section: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode; isOpen: boolean; onClick: () => void; disabled?: boolean; disabledMessage?: string }> = ({ title, children, actions, isOpen, onClick, disabled, disabledMessage }) => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full flex justify-between items-start p-6 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      aria-expanded={isOpen}
    >
      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {disabled && disabledMessage ? (
          <div className="mt-1 text-sm text-red-600" aria-hidden>
            {disabledMessage}
          </div>
        ) : null}
      </div>
      <div className="flex items-center space-x-4">
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </div>
    <div className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="p-6 pt-0">{children}</div>
    </div>
  </div>
);

// DisabledOverlay removed: banner now shown in Section header so content remains visible.

const SECTION = { INFO: 1, SETTINGS: 2, DOCUMENTS: 3, FLIGHTS: 4, EMERGENCY_CONTACTS: 5, AGENDA: 6, PARTICIPANTS: 7 } as const;

const CreateTrip: React.FC<CreateTripProps> = ({ onCancel, onSave, isEditing = false }) => {
  const [openSections, setOpenSections] = useState<number[]>([SECTION.INFO]);
  const [activeFlightTab, setActiveFlightTab] = useState<'andata' | 'ritorno'>('andata');
  type Flight = {
    id?: string;
    direction: 'andata' | 'ritorno';
    title?: string;
    notes?: string;
    group?: string;
    airline?: string;
    flightNumber?: string;
    from?: string;
    to?: string;
    date?: string;
    timeDeparture?: string;
    timeArrival?: string;
  };
  type AgendaItem = {
    id?: string | number;
    category?: string;
    time?: string;
    title?: string;
    description?: string;
    targetAirports?: string[];
    images?: string[];
    details?: Array<any>;
    icon?: string;
    longDescription?: string;
    imageCaption?: string;
  };
  type AgendaDay = {
    day?: number;
    title?: string;
    date?: string;
    items: AgendaItem[];
  };
  const [agenda, setAgenda] = useState<AgendaDay[]>([]);
  const [eventCategories, setEventCategories] = useState<string[]>(['Activity','Hotel','Meeting','Restaurant','Travel']);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);

  // per-event image handlers
  const addImageToEvent = (dayIndex:number, itemIndex:number, url: string) => {
    setAgenda(prev => prev.map((d,di)=> {
      if (di !== dayIndex) return d;
      const items = (d.items||[]).map((it,ii)=> ii===itemIndex ? ({ ...(it||{}), images: [...((it.images||[])) , url] }) : it);
      return { ...d, items };
    }));
  };

  const removeImageFromEvent = (dayIndex:number, itemIndex:number, imageIndex:number) => {
    setAgenda(prev => prev.map((d,di)=> {
      if (di !== dayIndex) return d;
      const items = (d.items||[]).map((it,ii)=> {
        if (ii!==itemIndex) return it;
        return { ...it, images: (it.images||[]).filter((_,i)=>i!==imageIndex) };
      });
      return { ...d, items };
    }));
  };

  // per-event details handlers
  const addEventDetail = (dayIndex:number, itemIndex:number) => {
    const id = `det-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    setAgenda(prev => prev.map((d,di)=> {
      if (di !== dayIndex) return d;
      const items = (d.items||[]).map((it,ii)=> ii===itemIndex ? ({ ...(it||{}), details: [...((it.details||[])), { id, type: 'Address', value: '' }] }) : it);
      return { ...d, items };
    }));
  };

  const removeEventDetail = (dayIndex:number, itemIndex:number, detailId:string) => {
    setAgenda(prev => prev.map((d,di)=> {
      if (di !== dayIndex) return d;
      const items = (d.items||[]).map((it,ii)=> {
        if (ii!==itemIndex) return it;
        return { ...it, details: (it.details||[]).filter((dt:any)=> dt.id !== detailId) };
      });
      return { ...d, items };
    }));
  };

  const updateEventDetail = (dayIndex:number, itemIndex:number, detailId:string, patch: Partial<{ type:string; value:string }>) => {
    setAgenda(prev => prev.map((d,di)=> {
      if (di !== dayIndex) return d;
      const items = (d.items||[]).map((it,ii)=> {
        if (ii!==itemIndex) return it;
        return { ...it, details: (it.details||[]).map((dt:any)=> dt.id===detailId ? { ...dt, ...patch } : dt) };
      });
      return { ...d, items };
    }));
  };
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightsMeta, setFlightsMeta] = useState<{ andataTitle?: string; andataNotes?: string; ritornoTitle?: string; ritornoNotes?: string }>({});
  const [tripDraft, setTripDraft] = useState<{ tripId?: string; name?: string; startDate?: string; endDate?: string }>({});
  const [docValues, setDocValues] = useState<Record<string,string>>({});
  const [settingsValues, setSettingsValues] = useState<any>({});
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ group?: string; contactId?: string }>>([]);
  const [savingSection2, setSavingSection2] = useState(false);
  const [savingSection3, setSavingSection3] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedTripName, setSavedTripName] = useState<string | undefined>(undefined);
  const toast = useToast();

  // keep local flights in sync with tripDraft when loaded
  useEffect(() => {
    try {
      const t: any = tripDraft || {};
      if (Array.isArray(t.flights)) setFlights((t.flights as any[]).map(f => ({ ...(f||{}), id: f._id || f.id })) as Flight[]);
      if (t.flightsMeta) setFlightsMeta(t.flightsMeta || {});
      if (Array.isArray(t.agenda)) {
        // ensure items arrays exist and normalize ids
        const normalized = (t.agenda as any[]).map((d:any, idx:number) => ({ day: d.day ?? (idx+1), title: d.title, date: d.date, items: Array.isArray(d.items) ? d.items.map((it:any)=> ({ ...(it||{}), id: it._id || it.id })) : [] }));
        setAgenda(normalized as AgendaDay[]);
      }
    } catch (e) {}
  }, [tripDraft]);

  const addFlight = (direction: 'andata' | 'ritorno') => {
    // optimistic local id for immediate UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const newFlight = { id: tempId, direction, title: '', notes: '' } as Flight;
    setFlights(prev => [...prev, newFlight]);
    // persist to server if trip exists
    (async () => {
      if (!tripDraft || !(tripDraft as any).tripId) return;
      try {
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/flights`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ direction }) });
        if (!res.ok) {
          const txt = await res.text(); throw new Error(txt || `HTTP ${res.status}`);
        }
        const created = await res.json();
        // replace temp id with server _id
        setFlights(prev => prev.map(f => f.id === tempId ? ({ ...(created||{}), id: created._id || created.id }) as Flight : f));
      } catch (err) {
        console.error('Failed creating flight', err);
        // rollback optimistic
        setFlights(prev => prev.filter(f => f.id !== tempId));
        try { toast.showToast('Errore creando volo', 'error'); } catch(e){}
      }
    })();
  };

  const updateFlight = (index: number, patch: Partial<Flight>) => {
    setFlights(prev => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    // persist change if server id present
    (async () => {
      const flight = flights[index];
      const flightId = flight && (flight.id || (flight as any)._id);
      if (!flightId || !tripDraft || !(tripDraft as any).tripId) return;
      try {
        const body: any = {};
        const allowed = ['direction','title','notes','group','airline','flightNumber','from','to','date','timeDeparture','timeArrival'];
        for (const k of allowed) if ((patch as any)[k] !== undefined) body[k] = (patch as any)[k];
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/flights/${flightId}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) { const txt = await res.text(); throw new Error(txt || `HTTP ${res.status}`); }
        const updated = await res.json();
        // sync local state with server response
        setFlights(prev => prev.map((f, i) => (i === index ? ({ ...(updated||{}), id: updated._id || updated.id }) as Flight : f)));
      } catch (err) {
        console.error('Failed updating flight', err);
        try { toast.showToast('Errore aggiornando volo', 'error'); } catch(e){}
      }
    })();
  };

  const removeFlight = (index: number) => {
    const flight = flights[index];
    const flightId = flight && (flight.id || (flight as any)._id);
    // optimistic remove
    setFlights(prev => prev.filter((_, i) => i !== index));
    if (!flightId || !tripDraft || !(tripDraft as any).tripId) return;
    (async () => {
      try {
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/flights/${flightId}`, { method: 'DELETE' });
        if (!res.ok) { const txt = await res.text(); throw new Error(txt || `HTTP ${res.status}`); }
        // server returns updated flights array; sync if provided
        const json = await res.json().catch(()=>null);
        if (json && Array.isArray(json.flights)) setFlights(json.flights.map((f:any)=>({ ...(f||{}), id: f._id })) as Flight[]);
      } catch (err) {
        console.error('Failed deleting flight', err);
        try { toast.showToast('Errore eliminando volo', 'error'); } catch(e){}
        // on error, re-fetch trip flights to resync local state
        try {
          const res2 = await fetch(`/api/trips/${(tripDraft as any).tripId}`);
          if (res2.ok) {
            const tjson = await res2.json();
            if (Array.isArray(tjson.flights)) setFlights(tjson.flights.map((f:any)=>({ ...(f||{}), id: f._id })) as Flight[]);
          }
        } catch (e) {}
      }
    })();
  };

  const saveFlights = async () => {
    if (!tripDraft || !(tripDraft as any).tripId) return;
    try {
      const payload: any = { flights, flightsMeta };
      const res = await fetch(`/api/trips/${(tripDraft as any).tripId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const normalized = { ...(json || {}), tripId: (json && (json.tripId || json._id || (tripDraft as any).tripId)) };
      setTripDraft((prev: any) => ({ ...(prev || {}), ...normalized }));
      if (Array.isArray(json.flights)) setFlights(json.flights as Flight[]);
      try { toast.showToast('Voli salvati', 'success'); } catch (e) {}
    } catch (err) {
      console.error(err);
      try { toast.showToast('Errore durante il salvataggio dei voli', 'error'); } catch (e) {}
    }
  };

  const addAgendaDay = () => {
    const next = (agenda.length ? Math.max(...agenda.map(a=>a.day ?? 0)) + 1 : 1);
    const newDay = { day: next, title: `Giorno ${next}`, date: '', items: [] } as AgendaDay;
    // optimistic update
    setAgenda(prev => [...prev, newDay]);
    (async () => {
      if (!tripDraft || !(tripDraft as any).tripId) return;
      try {
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/agenda`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newDay) });
        if (!res.ok) throw new Error('Failed create day');
        const created = await res.json();
        // replace last optimistic day with server version (if server returns an agenda day)
        if (created && created.day !== undefined) {
          setAgenda(prev => prev.map(d => d.day === newDay.day ? ({ ...(created || {}), items: Array.isArray(created.items) ? created.items : [] } as AgendaDay) : d));
        }
      } catch (err) {
        // rollback on error
        setAgenda(prev => prev.filter(d => d !== newDay));
        try { toast.showToast('Errore creando giorno agenda', 'error'); } catch(e){}
      }
    })();
  };

  const removeAgendaDay = (index:number) => {
    const dayToRemove = agenda[index];
    // optimistic remove
    setAgenda(prev => prev.filter((_,i)=>i!==index));
    (async () => {
      if (!tripDraft || !(tripDraft as any).tripId) return;
      try {
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/agenda/${index}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed delete day');
      } catch (err) {
        // rollback by re-inserting day at same position
        setAgenda(prev => {
          const copy = prev.slice();
          copy.splice(index, 0, dayToRemove);
          return copy;
        });
        try { toast.showToast('Errore eliminando giorno', 'error'); } catch(e){}
      }
    })();
  };

  const addAgendaItem = (dayIndex:number) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const newItem: AgendaItem = { id: tempId, time:'', title:'', description:'', category: '' };
    setAgenda(prev => prev.map((d,i)=> i===dayIndex ? ({ ...(d||{}), items: [...(d.items||[]), newItem] }) : d));
    // optimistic create item on server
    (async () => {
      if (!tripDraft || !(tripDraft as any).tripId) return;
      try {
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/agenda/${dayIndex}/items`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(newItem) });
        if (!res.ok) throw new Error('Failed create item');
        const created = await res.json();
        // replace temp id with server id
        setAgenda(prev => prev.map((d,i)=> {
          if (i!==dayIndex) return d;
          const items = (d.items||[]).map(it => it.id === tempId ? ({ ...(created||{}), id: created._id || created.id }) as AgendaItem : it);
          return { ...d, items };
        }));
      } catch (err) {
        // rollback
        setAgenda(prev => prev.map((d,i)=> i===dayIndex ? ({ ...d, items: (d.items||[]).filter(it=> it.id !== tempId) }) : d));
        try { toast.showToast('Errore creando evento', 'error'); } catch(e){}
      }
    })();
  };

  const removeAgendaItem = (dayIndex:number, itemIndex:number) => {
    const itemToRemove = agenda[dayIndex] && agenda[dayIndex].items ? agenda[dayIndex].items[itemIndex] : null;
    // optimistic remove
    setAgenda(prev => prev.map((d,i)=> i===dayIndex ? ({ ...(d||{}), items: (d.items||[]).filter((_,j)=>j!==itemIndex) }) : d));
    (async () => {
      if (!tripDraft || !(tripDraft as any).tripId || !itemToRemove) return;
      const itemId = (itemToRemove as any).id;
      try {
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/agenda/${dayIndex}/items/${itemId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed delete item');
      } catch (err) {
        // rollback: re-insert item
        setAgenda(prev => prev.map((d,i)=> {
          if (i!==dayIndex) return d;
          const items = (d.items||[]).slice();
          items.splice(itemIndex, 0, itemToRemove);
          return { ...d, items };
        }));
        try { toast.showToast('Errore eliminando evento', 'error'); } catch(e){}
      }
    })();
  };

  const updateAgendaDay = (index:number, patch: Partial<AgendaDay>) => {
    setAgenda(prev => prev.map((d,i)=> i===index ? ({ ...d, ...patch }) : d));
  };

  const updateAgendaItem = (dayIndex:number, itemIndex:number, patch: Partial<AgendaItem>) => {
    const prevItem = agenda[dayIndex] && agenda[dayIndex].items ? agenda[dayIndex].items[itemIndex] : null;
    setAgenda(prev => prev.map((d,i)=> {
      if (i!==dayIndex) return d;
      const items = (d.items||[]).map((it,j)=> j===itemIndex ? ({ ...it, ...patch }) : it);
      return { ...d, items };
    }));
    // optimistic update on server
    (async () => {
      if (!tripDraft || !(tripDraft as any).tripId || !prevItem) return;
      const itemId = (prevItem as any).id;
      try {
        const body: any = {};
        const allowed = ['time','title','description','category','icon','longDescription','imageCaption','images','details','targetAirports'];
        for (const k of allowed) if ((patch as any)[k] !== undefined) body[k] = (patch as any)[k];
        const res = await fetch(`/api/trips/${(tripDraft as any).tripId}/agenda/${dayIndex}/items/${itemId}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Failed update item');
        const updated = await res.json();
        setAgenda(prev => prev.map((d,i)=> {
          if (i!==dayIndex) return d;
          const items = (d.items||[]).map((it,j)=> j===itemIndex ? ({ ...(updated||{}), id: updated._id || updated.id }) as AgendaItem : it);
          return { ...d, items };
        }));
      } catch (err) {
        // rollback to previous item
        setAgenda(prev => prev.map((d,i)=> {
          if (i!==dayIndex) return d;
          const items = (d.items||[]).map((it,j)=> j===itemIndex ? prevItem : it);
          return { ...d, items };
        }));
        try { toast.showToast('Errore aggiornando evento', 'error'); } catch(e){}
      }
    })();
  };

  const saveAgenda = async () => {
    if (!tripDraft || !(tripDraft as any).tripId) return;
    try {
      const payload:any = { agenda };
      const res = await fetch(`/api/trips/${(tripDraft as any).tripId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const txt = await res.text(); throw new Error(txt || `HTTP ${res.status}`); }
      const json = await res.json();
      if (Array.isArray(json.agenda)) {
        const normalized = json.agenda.map((d:any)=> ({ ...(d||{}), items: Array.isArray(d.items) ? d.items.map((it:any)=> ({ ...(it||{}), id: it._id || it.id })) : [] }));
        setAgenda(normalized as AgendaDay[]);
      }
      setTripDraft((prev:any)=> ({ ...(prev||{}), ...(json||{}) }));
      try { toast.showToast('Agenda salvata', 'success'); } catch(e){}
    } catch (err) {
      console.error('Errore salvando agenda', err);
      try { toast.showToast('Errore durante il salvataggio dell\'agenda', 'error'); } catch(e){}
    }
  };

  useEffect(() => {
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    try {
      (window as any).__E2E_setTripDraft = (trip: any) => {
        setTripDraft(trip);
        if (trip && trip.name) setSavedTripName(trip.name);
      };
      // if the test injected a trip before React mounted, pick it up
      if ((window as any).__E2E_injectedTrip) {
        const t = (window as any).__E2E_injectedTrip;
        setTripDraft(t);
        if (t && t.name) setSavedTripName(t.name);
      }
    } catch (e) {
      // ignore in non-test environments
    }
  }, []);

  // load config for event categories
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const json = await res.json();
        if (json && Array.isArray(json.categoryEvents) && json.categoryEvents.length) setEventCategories(json.categoryEvents);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  // Expose dev hook to programmatically set selected document and trigger final save
  useEffect(() => {
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    try {
      (window as any).__E2E_selectDocumentAndSave = async (docId: string) => {
        try {
          if (!docId) return { ok: false, reason: 'no-doc' };
          // set selected doc in state
          setDocValues((prev) => ({ ...(prev||{}), usefulInformations: docId }));
          // trigger final save via backend PATCH
          const id = tripDraft && ((tripDraft as any).tripId || (tripDraft as any)._id || (tripDraft as any).id);
          if (!id) return { ok: false, reason: 'no-trip' };
          const payload: any = { selectedDocument: docId };
          if (Object.keys(settingsValues||{}).length) payload.settings = settingsValues;
          const res = await fetch(`/api/trips/${id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) {
            const txt = await res.text(); throw new Error(txt || `HTTP ${res.status}`);
          }
          const json = await res.json();
          setTripDraft((prev:any)=> ({ ...(prev||{}), ...(json||{}) }));
          try { toast.showToast('Viaggio aggiornato', 'success'); } catch(e){}
          return { ok: true, trip: json };
        } catch (e) { return { ok: false, reason: e && e.message }; }
      };
    } catch (e) {}
    return () => { try { delete (window as any).__E2E_selectDocumentAndSave; } catch(e){} };
  }, [tripDraft, settingsValues]);

  // Expose a dev-only hook to allow tests to programmatically trigger Section 2 save
  useEffect(() => {
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    try {
      const w = (window as any) || {};
      w.__E2E_saveSection2 = async (overrideSettings?: any) => {
        if (!tripDraft || !(tripDraft as any).tripId) return { ok: false, reason: 'no-trip' };
        // allow passing settings directly to avoid React state race
        const payload = { settings: overrideSettings !== undefined ? overrideSettings : settingsValues };
        try {
          const res = await fetch(`/api/trips/${tripDraft.tripId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `HTTP ${res.status}`);
          }
          const json = await res.json();
          const normalized = { ...(json || {}), tripId: (json && (json.tripId || json._id || tripDraft.tripId)) };
          setTripDraft((prev:any)=> ({ ...(prev||{}), ...normalized }));
          try { toast.showToast('Impostazioni salvate', 'success'); } catch(e) {}
          return { ok: true, trip: normalized };
        } catch (err) {
          try { toast.showToast('Errore durante il salvataggio', 'error'); } catch(e) {}
          return { ok: false, reason: err && err.message };
        }
      };
      return () => { try { delete (window as any).__E2E_saveSection2; } catch(e){} };
    } catch (e) {}
  }, [tripDraft, settingsValues]);

  // Expose a dev-only hook to allow tests to programmatically trigger Section 3 save
  useEffect(() => {
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    try {
      const w = (window as any) || {};
      w.__E2E_saveSection3 = async () => {
        console.debug('[E2E] __E2E_saveSection3 called', { tripDraft, docValues, settingsValues });
        if (!tripDraft || !(tripDraft as any).tripId) return { ok: false, reason: 'no-trip' };
        try {
          const docsArray = Object.entries((docValues||{})).map(([key, val]) => ({ id: val, category: (key === 'usefulInformations' ? 'Useful Informations' : key === 'privacyPolicy' ? 'Privacy Policy' : key === 'terms' ? 'Terms & Conditions' : key === 'registrationForm' ? 'Form di Registrazione' : key) })).filter(d => d.id);
          const payload: any = { documents: docsArray };
          if (Object.keys(settingsValues || {}).length) payload.settings = settingsValues;
          console.debug('[E2E] __E2E_saveSection3 payload', payload);
          const res = await fetch(`/api/trips/${tripDraft.tripId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) {
            const txt = await res.text();
            console.debug('[E2E] __E2E_saveSection3 response-not-ok', { status: res.status, text: txt });
            throw new Error(txt || `HTTP ${res.status}`);
          }
          const json = await res.json();
          console.debug('[E2E] __E2E_saveSection3 response-json', json);
          const normalized = { ...(json || {}), tripId: (json && (json.tripId || json._id || tripDraft.tripId)) };
          setTripDraft((prev:any) => ({ ...(prev||{}), ...normalized }));
          try { toast.showToast('Documenti salvati', 'success'); } catch(e){}
          return { ok: true, trip: normalized };
        } catch (err) {
          console.error(err);
          try { toast.showToast('Errore durante il salvataggio dei documenti', 'error'); } catch(e){}
          return { ok: false, reason: err && err.message };
        }
      };
      return () => { try { delete (window as any).__E2E_saveSection3; } catch(e){} };
    } catch (e) {}
  }, [tripDraft, docValues, settingsValues]);

  // expose setter for Section 2 values for E2E tests
  useEffect(() => {
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    try {
      const w = (window as any) || {};
      w.__E2E_setSection2Values = (values: any) => {
        try {
          setSettingsValues((prev:any) => ({ ...(prev||{}), ...(values||{}) }));
          return { ok: true };
        } catch (e) { return { ok: false, reason: e && e.message }; }
      };
      return () => { try { delete (window as any).__E2E_setSection2Values; } catch(e){} };
    } catch (e) {}
  }, []);

  const handleToggleSection = (index: number) => {
    // Allow opening any section, but guide the user to Section 1 if trip isn't saved yet
    if (index !== SECTION.INFO && !(tripDraft && (tripDraft as any).tripId)) {
      setOpenSections(prev => prev.includes(SECTION.INFO) ? prev : [...prev, SECTION.INFO]);
    }
    setOpenSections(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{isEditing ? 'Modifica Viaggio' : 'Crea Nuovo Viaggio'}</h1>
        <p className="text-gray-500 mt-1">Compila le sezioni per creare o modificare il viaggio.</p>
      </header>

      <div className="space-y-4">
        <Section title="Sezione 1: Informazioni Base del Viaggio" isOpen={openSections.includes(SECTION.INFO)} onClick={() => handleToggleSection(SECTION.INFO)}>
          <Section1Card
            initial={{ clientName: (tripDraft as any).clientName, name: tripDraft.name, subtitle: (tripDraft as any).subtitle, description: (tripDraft as any).description, startDate: tripDraft.startDate, endDate: tripDraft.endDate }}
            settings={settingsValues}
            onSaved={(trip) => {
              setTripDraft(trip);
              setSavedTripName(trip.name);
              setShowSavedModal(true);
              setOpenSections(prev => prev.includes(SECTION.SETTINGS) ? prev : [...prev, SECTION.SETTINGS]);
              // Auto-close the saved modal after a short delay so users can continue editing without
              // having to manually confirm. This keeps the informative modal but avoids blocking UX.
              setTimeout(() => {
                setShowSavedModal(false);
                // ensure Section 2 is open/focused
                setOpenSections(prev => prev.includes(SECTION.SETTINGS) ? prev : [...prev, SECTION.SETTINGS]);
                setTimeout(() => {
                  const el = document.querySelector('[data-testid="trip-image-url"]') as HTMLInputElement | null;
                  if (el) el.focus();
                }, 120);
              }, 700);
              try { toast.showToast('Bozza salvata con successo', 'success'); } catch (e) {}
            }}
          />
        </Section>

        <Section title="Sezione 2: Impostazioni" isOpen={openSections.includes(SECTION.SETTINGS)} onClick={() => handleToggleSection(SECTION.SETTINGS)} disabled={!tripDraft.tripId} disabledMessage={"Questa sezione è disattivata fino al salvataggio della Sezione 1."}>
          <div className={`relative ${!tripDraft.tripId ? 'pointer-events-none opacity-80' : ''}`}>
            <SectionSettingsCard
              values={settingsValues}
              onChange={(k,v)=>setSettingsValues((prev:any)=>({...prev,[k]:v}))}
              disabled={!tripDraft.tripId}
              onSave={async () => {
                if (!tripDraft.tripId) return;
                setSavingSection2(true);
                try {
                  const res = await fetch(`/api/trips/${tripDraft.tripId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ settings: settingsValues }) });
                  if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(txt || `HTTP ${res.status}`);
                  }
                  const json = await res.json();
                  try { toast.showToast('Impostazioni salvate', 'success'); } catch(e) {}
                  const normalized = { ...(json || {}), tripId: (json && (json.tripId || json._id || tripDraft.tripId)) };
                  setTripDraft((prev:any)=> ({ ...(prev||{}), ...normalized }));
                } catch (err) {
                  console.error(err);
                  try { toast.showToast('Errore durante il salvataggio', 'error'); } catch(e) {}
                } finally { setSavingSection2(false); }
              }}
            />
          </div>
        </Section>

        <Section title="Sezione 3: Documenti" isOpen={openSections.includes(SECTION.DOCUMENTS)} onClick={() => handleToggleSection(SECTION.DOCUMENTS)} disabled={!tripDraft.tripId} disabledMessage={"I Documenti sono bloccati fino al salvataggio della Sezione 1."}>
          <div className={`relative ${!tripDraft.tripId ? 'pointer-events-none opacity-80' : ''}`}>
            <SectionDocumentsCard values={docValues} onChange={(k,v)=>setDocValues(prev=>({...prev,[k]:v}))} disabled={!tripDraft.tripId} />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                data-testid="save-section-3"
                onClick={async () => {
                  console.debug('[E2E] Save Documents button clicked', { tripDraft, docValues, settingsValues });
                  if (!tripDraft || !(tripDraft as any).tripId) return;
                  setSavingSection3(true);
                  try {
                    const docsArray = Object.entries(docValues || {}).map(([key, val]) => ({ id: val, category: (key === 'usefulInformations' ? 'Useful Informations' : key === 'privacyPolicy' ? 'Privacy Policy' : key === 'terms' ? 'Terms & Conditions' : key === 'registrationForm' ? 'Form di Registrazione' : key) })).filter(d => d.id);
                    const payload: any = { documents: docsArray };
                    // also include settings if present to avoid clobbering
                    if (Object.keys(settingsValues || {}).length) payload.settings = settingsValues;
                    console.debug('[E2E] Save Documents payload', payload);
                    const res = await fetch(`/api/trips/${tripDraft.tripId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!res.ok) {
                      const txt = await res.text();
                      console.debug('[E2E] Save Documents response-not-ok', { status: res.status, text: txt });
                      throw new Error(txt || `HTTP ${res.status}`);
                    }
                    const json = await res.json();
                    console.debug('[E2E] Save Documents response-json', json);
                    const normalized = { ...(json || {}), tripId: (json && (json.tripId || json._id || tripDraft.tripId)) };
                    setTripDraft((prev:any) => ({ ...(prev||{}), ...normalized }));
                    try { toast.showToast('Documenti salvati', 'success'); } catch(e){}
                  } catch (err) {
                    console.error(err);
                    try { toast.showToast('Errore durante il salvataggio dei documenti', 'error'); } catch(e){}
                  } finally {
                    setSavingSection3(false);
                  }
                }}
                disabled={!tripDraft.tripId || savingSection3}
                className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {savingSection3 ? 'Salvando...' : 'Salva Documenti'}
              </button>
            </div>
          </div>
        </Section>

        <Section title="Sezione 4: Dettagli Voli e Trasporti" isOpen={openSections.includes(SECTION.FLIGHTS)} onClick={()=>handleToggleSection(SECTION.FLIGHTS)} disabled={!tripDraft.tripId} disabledMessage={"Dettagli voli disattivati fino al salvataggio della Sezione 1."}>
          <div className={`relative ${!tripDraft.tripId ? 'pointer-events-none opacity-80' : ''}`}>
          <div>
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveFlightTab('andata')}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeFlightTab === 'andata'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Voli di Andata
                    </button>
                    <button
                      onClick={() => setActiveFlightTab('ritorno')}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeFlightTab === 'ritorno'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Voli di Ritorno
                    </button>
                  </nav>
                </div>
                <div className="pt-6">
                  {activeFlightTab === 'andata' ? (
                    <div>
                      <FormField label="Titolo (Voli di Andata)" className="mb-6">
                        <Input value={flightsMeta.andataTitle || ''} onChange={(e) => setFlightsMeta(prev => ({ ...(prev||{}), andataTitle: e.target.value }))} placeholder="Titolo sezione (opzionale)" />
                      </FormField>
                      <FormField label="Note Importanti (Voli di Andata)" className="mb-6">
                        <Textarea rows={2} placeholder="Note generali per i voli di andata" value={flightsMeta.andataNotes || ''} onChange={(e) => setFlightsMeta(prev => ({ ...(prev||{}), andataNotes: e.target.value }))} />
                      </FormField>
                      <div className="space-y-4">
                        {flights.map((f, i) => ({ f, i })).filter(p => p.f.direction === 'andata').map(({ f, i: idx }) => (
                          <div key={(f && (f.id || (f as any)._id)) || idx} className="relative p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                              <FormField label="Gruppo Partenza">
                                <div className="relative">
                                  <select value={f.group || ''} onChange={(e) => updateFlight(idx, { group: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
                                    <option value="" disabled>-- Seleziona Gruppo --</option>
                                    {(settingsValues && settingsValues.groups ? settingsValues.groups : []).map((group: string) => (
                                      <option key={group} value={group}>{group}</option>
                                    ))}
                                  </select>
                                  <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                </div>
                              </FormField>
                              <FormField label="Compagnia Aerea">
                                <Input value={f.airline || ''} onChange={(e) => updateFlight(idx, { airline: e.target.value })} placeholder="e.g. Etihad Airways" />
                              </FormField>
                              <FormField label="Numero Volo">
                                <Input value={f.flightNumber || ''} onChange={(e) => updateFlight(idx, { flightNumber: e.target.value })} placeholder="e.g. EY 82" />
                              </FormField>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
                              <FormField label="Aeroporto Partenza">
                                <Input value={f.from || ''} onChange={(e) => updateFlight(idx, { from: e.target.value })} placeholder="e.g. Malpensa" />
                              </FormField>
                              <FormField label="Aeroporto Arrivo">
                                <Input value={f.to || ''} onChange={(e) => updateFlight(idx, { to: e.target.value })} placeholder="e.g. Abu Dhabi" />
                              </FormField>
                              <FormField label="Data Partenza">
                                <Input type="date" value={f.date || ''} onChange={(e) => updateFlight(idx, { date: e.target.value })} placeholder="gg/mm/aaaa" />
                              </FormField>
                              <FormField label="Ora Partenza">
                                <Input type="time" value={f.timeDeparture || ''} onChange={(e) => updateFlight(idx, { timeDeparture: e.target.value })} placeholder="--:--" />
                              </FormField>
                              <FormField label="Ora Arrivo">
                                <Input type="time" value={f.timeArrival || ''} onChange={(e) => updateFlight(idx, { timeArrival: e.target.value })} placeholder="--:--" />
                              </FormField>
                            </div>
                            <div className="absolute top-3 right-3">
                              <button onClick={() => removeFlight(idx)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center space-x-3">
                         <button onClick={() => addFlight('andata')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                          <PlusIcon className="w-4 h-4 mr-1" /> Aggiungi Volo di Andata
                        </button>
                        <button onClick={saveFlights} className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Salva Voli</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FormField label="Titolo (Voli di Ritorno)" className="mb-6">
                        <Input value={flightsMeta.ritornoTitle || ''} onChange={(e) => setFlightsMeta(prev => ({ ...(prev||{}), ritornoTitle: e.target.value }))} placeholder="Titolo sezione (opzionale)" />
                      </FormField>
                      <FormField label="Note Importanti (Voli di Ritorno)" className="mb-6">
                        <Textarea rows={2} placeholder="Note generali per i voli di ritorno" value={flightsMeta.ritornoNotes || ''} onChange={(e) => setFlightsMeta(prev => ({ ...(prev||{}), ritornoNotes: e.target.value }))} />
                      </FormField>
                      <div className="space-y-4">
                        {flights.map((f, i) => ({ f, i })).filter(p => p.f.direction === 'ritorno').map(({ f, i: idx }) => (
                          <div key={(f && (f.id || (f as any)._id)) || idx} className="relative p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <FormField label="Gruppo">
                                      <div className="relative">
                                        <select value={f.group || ''} onChange={(e) => updateFlight(idx, { group: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
                                          <option value="" disabled>-- Seleziona Gruppo --</option>
                                          {(settingsValues && settingsValues.groups ? settingsValues.groups : []).map((group: string) => (
                                            <option key={group} value={group}>{group}</option>
                                          ))}
                                        </select>
                                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                                      </div>
                                    </FormField>
                                    <FormField label="Compagnia Aerea">
                                      <Input value={f.airline || ''} onChange={(e) => updateFlight(idx, { airline: e.target.value })} placeholder="e.g. Etihad Airways" />
                                    </FormField>
                                    <FormField label="Numero Volo">
                                      <Input value={f.flightNumber || ''} onChange={(e) => updateFlight(idx, { flightNumber: e.target.value })} placeholder="e.g. EY 83" />
                                    </FormField>
                                  </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
                              <FormField label="Aeroporto Partenza">
                                <Input value={f.from || ''} onChange={(e) => updateFlight(idx, { from: e.target.value })} placeholder="e.g. Abu Dhabi" />
                              </FormField>
                              <FormField label="Aeroporto Arrivo">
                                <Input value={f.to || ''} onChange={(e) => updateFlight(idx, { to: e.target.value })} placeholder="e.g. Malpensa" />
                              </FormField>
                              <FormField label="Data Partenza">
                                <Input type="date" value={f.date || ''} onChange={(e) => updateFlight(idx, { date: e.target.value })} placeholder="gg/mm/aaaa" />
                              </FormField>
                              <FormField label="Ora Partenza">
                                <Input type="time" value={f.timeDeparture || ''} onChange={(e) => updateFlight(idx, { timeDeparture: e.target.value })} placeholder="--:--" />
                              </FormField>
                              <FormField label="Ora Arrivo">
                                <Input type="time" value={f.timeArrival || ''} onChange={(e) => updateFlight(idx, { timeArrival: e.target.value })} placeholder="--:--" />
                              </FormField>
                            </div>
                            <div className="absolute top-3 right-3">
                              <button onClick={() => removeFlight(idx)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                       <div className="mt-4 flex items-center space-x-3">
                        <button onClick={() => addFlight('ritorno')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                          <PlusIcon className="w-4 h-4 mr-1" /> Aggiungi Volo di Ritorno
                        </button>
                        <button onClick={saveFlights} className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Salva Voli</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </Section>

        <Section title="Sezione 5: Contatti di Emergenza e Sicurezza" isOpen={openSections.includes(SECTION.EMERGENCY_CONTACTS)} onClick={()=>handleToggleSection(SECTION.EMERGENCY_CONTACTS)} disabled={!tripDraft.tripId} disabledMessage={"Contatti di emergenza disattivati fino al salvataggio della Sezione 1."}>
          <div className={`relative ${!tripDraft.tripId ? 'pointer-events-none opacity-80' : ''}`}>
            <div className="p-4">
              <SectionEmergencyContacts
                groups={(settingsValues && settingsValues.groups) || []}
                initial={emergencyContacts}
                disabled={!tripDraft.tripId}
                onChange={(items)=>setEmergencyContacts(items)}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  data-testid="save-section-5"
                  onClick={async ()=>{
                    if (!tripDraft || !(tripDraft as any).tripId) return;
                    try {
                      const payload: any = { emergencyContacts: emergencyContacts.filter(Boolean) };
                      // include settings to avoid clobber
                      if (Object.keys(settingsValues || {}).length) payload.settings = settingsValues;
                      const res = await fetch(`/api/trips/${tripDraft.tripId}`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
                      if (!res.ok) { const txt = await res.text(); throw new Error(txt || `HTTP ${res.status}`); }
                      const json = await res.json();
                      const normalized = { ...(json || {}), tripId: (json && (json.tripId || json._id || tripDraft.tripId)) };
                      setTripDraft((prev:any)=> ({ ...(prev||{}), ...normalized }));
                      try { toast.showToast('Contatti di emergenza salvati', 'success'); } catch(e){}
                    } catch (err) { console.error(err); try { toast.showToast('Errore durante il salvataggio contatti', 'error'); } catch(e){} }
                  }}
                  disabled={!tripDraft.tripId}
                  className="bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >Salva Contatti</button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Sezione 6: Agenda e Eventi" isOpen={openSections.includes(SECTION.AGENDA)} onClick={()=>handleToggleSection(SECTION.AGENDA)} disabled={!tripDraft.tripId} disabledMessage={"Agenda disattivata fino al salvataggio della Sezione 1."}>
          <div className={`p-4 border border-gray-200 rounded-lg space-y-4 ${!tripDraft.tripId ? 'pointer-events-none opacity-80' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Giorno</label>
                <select value={activeDayIndex} onChange={(e)=> setActiveDayIndex(Number(e.target.value))} className="px-2 py-1 border rounded">
                  {agenda.length ? agenda.map((d,idx)=> <option key={idx} value={idx}>Giorno {d.day ?? idx+1}</option>) : <option value={0}>Giorno 1</option>}
                </select>
              </div>
              <div>
                <button onClick={saveAgenda} className="bg-white border border-gray-300 text-gray-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 mr-2">Salva Agenda</button>
                <button onClick={addAgendaDay} className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center transition-colors"><PlusIcon className="w-4 h-4 mr-1" /> Aggiungi Giorno</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <FormField label="Giorno" className="md:col-span-1"><Input value={agenda.length ? String(agenda[activeDayIndex]?.day ?? (activeDayIndex+1)) : '1'} readOnly className="!bg-gray-100" /></FormField>
              <FormField label="Data" className="md:col-span-2"><Input placeholder="mm/dd/yyyy" value={agenda.length ? (agenda[activeDayIndex]?.date || '') : ''} onChange={(e)=> updateAgendaDay(activeDayIndex, { date: e.target.value })} /></FormField>
              <FormField label="Titolo del Giorno" className="md:col-span-3"><Input placeholder="Arrivo e Check-in" value={agenda.length ? (agenda[activeDayIndex]?.title || '') : ''} onChange={(e)=> updateAgendaDay(activeDayIndex, { title: e.target.value })} /></FormField>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-800 mb-4">Eventi</h4>
              <div className="space-y-3">
                {(!agenda[activeDayIndex] || (agenda[activeDayIndex].items || []).length === 0) ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="text-sm text-gray-500">Nessun evento per questo giorno.</div>
                  </div>
                ) : null}

                {(agenda[activeDayIndex]?.items || []).map((item, idx) => (
                  <div key={String(item.id || idx)} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField label="Orario">
                        <Input value={item.time || '--:--'} onChange={(e)=> updateAgendaItem(activeDayIndex, idx, { time: e.target.value })} />
                      </FormField>
                      <FormField label="Titolo Evento">
                        <Input value={item.title || ''} onChange={(e)=> updateAgendaItem(activeDayIndex, idx, { title: e.target.value })} />
                      </FormField>
                      <FormField label="Categoria">
                        <div className="relative">
                          <select value={item.category || ''} onChange={(e)=> updateAgendaItem(activeDayIndex, idx, { category: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none pr-8">
                            <option value="" disabled>-- Seleziona Categoria --</option>
                            {(eventCategories || []).map((c:string)=> <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                        </div>
                      </FormField>
                      <FormField label="Icona">
                        <IconSelect value={(item as any).icon || ''} onChange={(v)=> updateAgendaItem(activeDayIndex, idx, { icon: v })} />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <FormField label="Descrizione">
                        <Textarea rows={2} placeholder="Breve descrizione dell'evento (visibile nell'elenco principale)." value={item.description || ''} onChange={(e)=> updateAgendaItem(activeDayIndex, idx, { description: e.target.value })} />
                      </FormField>
                      <FormField label="Descrizione Lunga">
                        <Textarea rows={4} placeholder="Descrizione dettagliata: include informazioni utili, dress code, menù, etc." value={(item as any).longDescription || ''} onChange={(e)=> updateAgendaItem(activeDayIndex, idx, { longDescription: e.target.value })} />
                      </FormField>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <FormField label="Immagini Evento">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Incolla l'URL dell'immagine</label>
                          <div className="relative flex items-center">
                            <input type="text" className="pr-12 w-full p-2 border rounded" placeholder="https://..." id={`image-input-${activeDayIndex}-${idx}`} />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-medium text-gray-500 pointer-events-none">URL</span>
                          </div>
                          <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors mt-3" onClick={() => {
                            const el = document.getElementById(`image-input-${activeDayIndex}-${idx}`) as HTMLInputElement | null;
                            if (el && el.value) { addImageToEvent(activeDayIndex, idx, el.value); el.value = ''; }
                          }}>
                            <PlusIcon className="w-4 h-4 mr-1" /> Aggiungi Immagine
                          </button>

                          <div className="mt-3 space-y-2">
                            {(((item as any).images)||[]).map((url:string, ui:number) => (
                              <div key={ui} className="flex items-center justify-between border p-2 rounded">
                                <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 truncate">{url}</a>
                                <button onClick={() => removeImageFromEvent(activeDayIndex, idx, ui)} className="p-1 text-red-600">Rimuovi</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </FormField>

                      <FormField label="Caption Immagini" className="mt-4">
                        <Input placeholder="e.g. Grande Moschea Sheikh Zayed & Louvre Abu Dhabi" value={(item as any).imageCaption || ''} onChange={(e)=> updateAgendaItem(activeDayIndex, idx, { imageCaption: e.target.value })} />
                      </FormField>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="block text-sm font-medium text-gray-700 mb-3">Dettagli Aggiuntivi</h4>
                      <div className="space-y-3">
                        {(((item as any).details)||[]).map((detail:any) => (
                          <div key={detail.id} className="flex items-center space-x-3">
                            <div>
                              <select value={detail.type} onChange={(e)=> updateEventDetail(activeDayIndex, idx, detail.id, { type: e.target.value })} className="px-2 py-1 border border-gray-300 rounded">
                                <option>Address</option>
                                <option>Dress Code</option>
                                <option>Contact</option>
                                <option>Other</option>
                              </select>
                            </div>
                            <Input className="flex-grow" value={detail.value} onChange={(e)=> updateEventDetail(activeDayIndex, idx, detail.id, { value: e.target.value })} placeholder="Aggiungi un dettaglio..." />
                            <button onClick={()=> removeEventDetail(activeDayIndex, idx, detail.id)} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors hover:bg-gray-100"><TrashIcon className="w-5 h-5"/></button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={()=> addEventDetail(activeDayIndex, idx)} className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center transition-colors">
                        <PlusIcon className="w-4 h-4 mr-1" /> Aggiungi Dettaglio
                      </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <FormField label="Note Speciali (visibili solo agli admin)">
                        <Textarea defaultValue="Contattare il ristorante per confermare le opzioni vegetariane." />
                      </FormField>
                    </div>
                  </div>
                ))}

              </div>

              <div className="mt-4">
                <button onClick={() => addAgendaItem(activeDayIndex)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors">
                  <PlusIcon className="w-4 h-4 mr-1" /> Aggiungi Evento
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Sezione 7: Gestione Partecipanti" isOpen={openSections.includes(SECTION.PARTICIPANTS)} onClick={()=>handleToggleSection(SECTION.PARTICIPANTS)} actions={<button className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 flex items-center px-3 py-1.5 rounded-lg transition-colors"><CheckIcon className="w-4 h-4 mr-1.5" /> Importa da Google Sheets</button>} disabled={!tripDraft.tripId} disabledMessage={"Gestione partecipanti disattivata fino al salvataggio della Sezione 1."}>
          <div className={`relative ${!tripDraft.tripId ? 'pointer-events-none opacity-80' : ''}`}>
            {tripDraft.tripId ? (
              <div className="p-4 flex items-center justify-between">
                <div>Gestisci i partecipanti per questo viaggio.</div>
                <a href={`/manage-participants?tripId=${tripDraft.tripId}`} className="text-white bg-blue-600 px-3 py-2 rounded font-semibold">Apri Manage Participants</a>
              </div>
            ) : (
              <div className="p-4">Partecipanti (placeholder)</div>
            )}
          </div>
        </Section>
      </div>

      <footer className="mt-8 pt-6 border-t border-gray-200 flex justify-end items-center space-x-4">
        <button onClick={onCancel} className="bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors">Annulla</button>
        <button type="button" onClick={() => {}} className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Salva Bozza</button>
        <button onClick={onSave} className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">{isEditing ? 'Aggiorna' : 'Salva e Pubblica'}</button>
      </footer>
      <ConfirmModal
        open={showSavedModal}
        variant="success"
        title={savedTripName ? `Viaggio "${savedTripName}" creato` : 'Viaggio creato'}
        message={"La bozza è stata salvata con successo. Puoi procedere con la compilazione delle altre sezioni."}
        confirmLabel="Procedi"
        cancelLabel="Chiudi"
        onConfirm={() => {
          setShowSavedModal(false);
          setOpenSections(prev => prev.includes(2) ? prev : [...prev, 2]);
          // focus the first input in Section 2 (image URL) after a tick
          setTimeout(() => {
            const el = document.querySelector('[data-testid="trip-image-url"]') as HTMLInputElement | null;
            if (el) el.focus();
          }, 120);
        }}
        onCancel={() => setShowSavedModal(false)}
      />
    </div>
  );
};

export default CreateTrip;
