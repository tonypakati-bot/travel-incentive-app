import React, { useState } from 'react';
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

const Section: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode; isOpen: boolean; onClick: () => void; }> = ({ title, children, actions, isOpen, onClick }) => (
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
      className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      aria-expanded={isOpen}
    >
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
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

const CreateTrip: React.FC<CreateTripProps> = ({ onCancel, onSave, isEditing = false }) => {
  const [openSections, setOpenSections] = useState<number[]>([1]);
  const [tripDraft, setTripDraft] = useState<{ tripId?: string; name?: string; startDate?: string; endDate?: string }>({});
  const [docValues, setDocValues] = useState<Record<string,string>>({});
  const [settingsValues, setSettingsValues] = useState<any>({});
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedTripName, setSavedTripName] = useState<string | undefined>(undefined);
  const toast = useToast();

  const handleToggleSection = (index: number) => {
    // Prevent opening other sections until Section 1 is saved (tripDraft.tripId exists)
    if (index !== 1 && !(tripDraft && (tripDraft as any).tripId)) {
      // open Section 1 to guide the user
      setOpenSections(prev => prev.includes(1) ? prev : [...prev, 1]);
      return;
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
        <Section title="Sezione 1: Informazioni Base del Viaggio" isOpen={openSections.includes(1)} onClick={() => handleToggleSection(1)}>
          <Section1Card
            initial={{ clientName: (tripDraft as any).clientName, name: tripDraft.name, subtitle: (tripDraft as any).subtitle, description: (tripDraft as any).description, startDate: tripDraft.startDate, endDate: tripDraft.endDate }}
            settings={settingsValues}
            onSaved={(trip) => {
              setTripDraft(trip);
              setSavedTripName(trip.name);
              setShowSavedModal(true);
              setOpenSections(prev => prev.includes(2) ? prev : [...prev, 2]);
              try { toast.showToast('Bozza salvata con successo', 'success'); } catch (e) {}
            }}
          />
        </Section>

        <Section title="Sezione 2: Impostazioni" isOpen={openSections.includes(2)} onClick={() => handleToggleSection(2)}>
          {!tripDraft.tripId ? (
            <div className="p-4 text-sm text-gray-600">Per modificare le Impostazioni salva prima la <strong>Sezione 1</strong> (Nome/Data) per creare il viaggio.</div>
          ) : (
            <SectionSettingsCard values={settingsValues} onChange={(k,v)=>setSettingsValues((prev:any)=>({...prev,[k]:v}))} disabled={!tripDraft.tripId} />
          )}
        </Section>

        <Section title="Sezione 3: Documenti" isOpen={openSections.includes(3)} onClick={() => handleToggleSection(3)}>
          {!tripDraft.tripId ? (
            <div className="p-4 text-sm text-gray-600">Salva prima la <strong>Sezione 1</strong> per accedere ai Documenti.</div>
          ) : (
            <SectionDocumentsCard values={docValues} onChange={(k,v)=>setDocValues(prev=>({...prev,[k]:v}))} disabled={!tripDraft.tripId} />
          )}
        </Section>

        <Section title="Sezione 3: Dettagli Voli e Trasporti" isOpen={openSections.includes(3)} onClick={()=>handleToggleSection(3)}>
          <div className="p-4">Dettagli voli (placeholder)</div>
        </Section>

        <Section title="Sezione 4: Agenda e Eventi" isOpen={openSections.includes(4)} onClick={()=>handleToggleSection(4)}>
          <div className="p-4">Agenda (placeholder)</div>
        </Section>

        <Section title="Sezione 5: Gestione Partecipanti" isOpen={openSections.includes(5)} onClick={()=>handleToggleSection(5)} actions={<button className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 flex items-center px-3 py-1.5 rounded-lg transition-colors"><CheckIcon className="w-4 h-4 mr-1.5" /> Importa da Google Sheets</button>}>
          {tripDraft.tripId ? (
            <div className="p-4 flex items-center justify-between">
              <div>Gestisci i partecipanti per questo viaggio.</div>
              <a href={`/manage-participants?tripId=${tripDraft.tripId}`} className="text-white bg-blue-600 px-3 py-2 rounded font-semibold">Apri Manage Participants</a>
            </div>
          ) : (
            <div className="p-4">Partecipanti (placeholder)</div>
          )}
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
