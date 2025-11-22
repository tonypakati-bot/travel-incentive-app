import React, { useState, useEffect } from 'react';
import Section1Card from './Section1Card';
import SectionDocumentsCard from './SectionDocumentsCard';
import SectionSettingsCard from './SectionSettingsCard';
import { ChevronDownIcon, CheckIcon } from './icons';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../contexts/ToastContext';

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

const SECTION = { INFO: 1, SETTINGS: 2, DOCUMENTS: 3, FLIGHTS: 4, AGENDA: 5, PARTICIPANTS: 6 } as const;

const CreateTrip: React.FC<CreateTripProps> = ({ onCancel, onSave, isEditing = false }) => {
  const [openSections, setOpenSections] = useState<number[]>([SECTION.INFO]);
  const [tripDraft, setTripDraft] = useState<{ tripId?: string; name?: string; startDate?: string; endDate?: string }>({});
  const [docValues, setDocValues] = useState<Record<string,string>>({});
  const [settingsValues, setSettingsValues] = useState<any>({});
  const [savingSection2, setSavingSection2] = useState(false);
  const [savingSection3, setSavingSection3] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedTripName, setSavedTripName] = useState<string | undefined>(undefined);
  const toast = useToast();

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
          const docsArray = Object.values((docValues||{})).filter(Boolean);
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
                    const docsArray = Object.values(docValues || {}).filter(Boolean);
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
            <div className="p-4">Dettagli voli (placeholder)</div>
          </div>
        </Section>

        <Section title="Sezione 5: Agenda e Eventi" isOpen={openSections.includes(SECTION.AGENDA)} onClick={()=>handleToggleSection(SECTION.AGENDA)} disabled={!tripDraft.tripId} disabledMessage={"Agenda disattivata fino al salvataggio della Sezione 1."}>
          <div className={`relative ${!tripDraft.tripId ? 'pointer-events-none opacity-80' : ''}`}>
            <div className="p-4">Agenda (placeholder)</div>
          </div>
        </Section>

        <Section title="Sezione 6: Gestione Partecipanti" isOpen={openSections.includes(SECTION.PARTICIPANTS)} onClick={()=>handleToggleSection(SECTION.PARTICIPANTS)} actions={<button className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 flex items-center px-3 py-1.5 rounded-lg transition-colors"><CheckIcon className="w-4 h-4 mr-1.5" /> Importa da Google Sheets</button>} disabled={!tripDraft.tripId} disabledMessage={"Gestione partecipanti disattivata fino al salvataggio della Sezione 1."}>
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
