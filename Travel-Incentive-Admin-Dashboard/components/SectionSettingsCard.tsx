import React from 'react';

type Props = {
  values?: {
    groups?: string[];
    addAccompany?: boolean;
    businessFlights?: boolean;
    imageUrl?: string;
    logoUrl?: string;
  };
  onChange: (k: string, v: any) => void;
  disabled?: boolean;
};

const SectionSettingsCard: React.FC<Props> = ({ values = {}, onChange, disabled = true }) => {
  return (
    <div className={`p-6 bg-white rounded-lg border ${disabled ? 'opacity-60 pointer-events-none' : ''}`} aria-labelledby="section-settings-title">
      <h3 id="section-settings-title" className="font-bold">Sezione 2 — Impostazioni</h3>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">Gruppi</label>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {(values.groups || []).map(g => (
              <span key={g} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{g}</span>
            ))}
            <button type="button" className="text-sm text-blue-600" onClick={() => onChange('groups', [...(values.groups||[]), 'Nuovo Gruppo'])}>+ Aggiungi Gruppo</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Aggiungi accompagnatore</label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center"><input type="radio" name="accomp" checked={!!values.addAccompany} onChange={() => onChange('addAccompany', true)} /> <span className="ml-2">Sì</span></label>
              <label className="inline-flex items-center"><input type="radio" name="accomp" checked={!values.addAccompany} onChange={() => onChange('addAccompany', false)} /> <span className="ml-2">No</span></label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Voli Business</label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center"><input type="radio" name="business" checked={!!values.businessFlights} onChange={() => onChange('businessFlights', true)} /> <span className="ml-2">Sì</span></label>
              <label className="inline-flex items-center"><input type="radio" name="business" checked={!values.businessFlights} onChange={() => onChange('businessFlights', false)} /> <span className="ml-2">No</span></label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Immagine del Viaggio</span>
            <input data-testid="trip-image-url" value={values.imageUrl || ''} onChange={e => onChange('imageUrl', e.target.value)} placeholder="Incolla l'URL dell'immagine" className="mt-1 p-2 border rounded" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Logo del Viaggio</span>
            <input data-testid="trip-logo-url" value={values.logoUrl || ''} onChange={e => onChange('logoUrl', e.target.value)} placeholder="Incolla l'URL dell'immagine" className="mt-1 p-2 border rounded" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SectionSettingsCard;
