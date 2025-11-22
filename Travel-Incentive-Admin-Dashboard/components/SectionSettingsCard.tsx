import React, { useState } from 'react';
import TagInput from './TagInput';
import ToggleSwitch from './ToggleSwitch';

type Props = {
  values?: {
    groups?: string[];
    addAccompany?: boolean;
    businessFlights?: boolean;
    imageUrl?: string;
    logoUrl?: string;
  };
  onChange: (k: string, v: any) => void;
  onSave?: () => Promise<void> | void;
  disabled?: boolean;
};

const SectionSettingsCard: React.FC<Props> = ({ values = {}, onChange, onSave, disabled = true }) => {
  const [imagePreview, setImagePreview] = useState(values.imageUrl || '');
  const [logoPreview, setLogoPreview] = useState(values.logoUrl || '');

  const handleImageUrl = (v: string) => { onChange('imageUrl', v); setImagePreview(v); };
  const handleLogoUrl = (v: string) => { onChange('logoUrl', v); setLogoPreview(v); };
  return (
    <div data-disabled={disabled ? 'true' : 'false'} className={`p-6 bg-white rounded-lg border ${disabled ? 'opacity-60 pointer-events-none' : ''}`} aria-labelledby="section-settings-title">
      <h3 id="section-settings-title" className="font-bold">Sezione 2 — Impostazioni</h3>
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">Gruppi</label>
          <div className="mt-2">
            <TagInput testid="trip-groups-input" value={values.groups || []} onChange={(items) => onChange('groups', items)} placeholder="Aggiungi gruppo" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Aggiungi accompagnatore</label>
            <div className="mt-2">
              <ToggleSwitch testid="trip-add-accompany-toggle" checked={!!values.addAccompany} onChange={(v) => onChange('addAccompany', v)} label={values.addAccompany ? 'Sì' : 'No'} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Voli Business</label>
            <div className="mt-2">
              <ToggleSwitch testid="trip-business-flights-toggle" checked={!!values.businessFlights} onChange={(v) => onChange('businessFlights', v)} label={values.businessFlights ? 'Sì' : 'No'} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Immagine del Viaggio</span>
            <input data-testid="trip-image-url" value={values.imageUrl || ''} onChange={e => handleImageUrl(e.target.value)} placeholder="Incolla l'URL dell'immagine" className="mt-1 p-2 border rounded" />
            {imagePreview ? <img data-testid="trip-image-preview" src={imagePreview} alt="preview" className="mt-2 w-40 h-24 object-cover rounded" /> : null}
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Logo del Viaggio</span>
            <input data-testid="trip-logo-url" value={values.logoUrl || ''} onChange={e => handleLogoUrl(e.target.value)} placeholder="Incolla l'URL dell'immagine" className="mt-1 p-2 border rounded" />
            {logoPreview ? <img data-testid="trip-logo-preview" src={logoPreview} alt="preview" className="mt-2 w-24 h-24 object-contain rounded" /> : null}
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          {onSave ? (
            <button data-testid="save-section-2" onClick={onSave} disabled={disabled} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">Salva bozza</button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Expose a dev-only hook to programmatically trigger section 2 save from E2E tests
if ((import.meta as any).env && (import.meta as any).env.DEV) {
  try {
    const w = (window as any);
    if (w) {
      w.__E2E_saveSection2 = async () => {
        // This hook will be a no-op here; actual onSave comes from parent at runtime.
        // Tests should call the onSave by simulating click on `[data-testid="save-section-2"]`.
        return { ok: false, reason: 'no-op' };
      };
    }
  } catch (e) {}
}

export default SectionSettingsCard;
