import React, { useState, useEffect } from 'react';
import DocumentCreator from './DocumentCreator';
import { PrivacyModal } from './PrivacyPolicy';
import TermsModal from './TermsModal';
import UsefulInformationModal from './UsefulInformationModal';
import { createPrivacyPolicy, createTermsDocument, createUsefulInfo } from '../services/documents';

type Option = { value: string; label: string };
type Props = {
  id: string;
  label: string;
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  testId?: string;
};

export const DocumentDropdown: React.FC<Props> = ({ id, label, value = '', options, onChange, disabled = false, testId }) => {
  const [creating, setCreating] = useState(false);
  const [creatingPrivacy, setCreatingPrivacy] = useState(false);
  useEffect(() => {
    if (!testId) return;
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    const w = window as any;
    w.__E2E_openDocCreator = w.__E2E_openDocCreator || {};
    w.__E2E_openDocCreator[testId] = () => setCreating(true);
    return () => {
      try {
        delete w.__E2E_openDocCreator[testId];
      } catch (e) {
        /* ignore */
      }
    };
  }, [testId]);
  const handleCreated = (opt:{value:string;label:string}) => {
    setCreating(false);
    onChange(opt.value);
  };
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <select
        id={id}
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label={label}
        className={`mt-1 p-2 border rounded ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
        <option data-testid={`${testId}-option-empty`} value="">-- Seleziona --</option>
        {options.map(o => <option key={o.value} data-testid={`${testId}-option-${o.value}`} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex flex-col ml-2">
          <button data-testid={`${testId}-create`} type="button" onClick={() => {
              if (id === 'doc-privacyPolicy') setCreatingPrivacy(true);
              else setCreating(true);
            }} disabled={disabled} className="text-sm text-green-600 hover:underline">Crea nuovo</button>
          <button data-testid={`${testId}-remove`} type="button" onClick={() => onChange('')} disabled={disabled || !value} className="text-sm text-red-600 hover:underline">Rimuovi</button>
        </div>
      </div>
      {id === 'doc-privacyPolicy' ? (
        <PrivacyModal
          isOpen={creatingPrivacy}
          documentToEdit={null}
          onClose={() => setCreatingPrivacy(false)}
          onSave={async (doc) => {
            // doc contains { id?, title, trip: null, content }
            try {
              const created = await createPrivacyPolicy({ title: doc.title, content: doc.content, trip: null });
              if (created) {
                try { (window as any).__E2E_lastCreatePrivacyResult = created; } catch (e) {}
                try { window.dispatchEvent(new CustomEvent('documents:changed', { detail: { created } })); } catch (e) { /* ignore */ }
                setCreatingPrivacy(false);
                onChange(String(created.value));
              } else {
                console.error('createPrivacyPolicy returned null');
                alert('Errore durante la creazione della privacy policy. Controlla la console per dettagli.');
              }
            } catch (err) {
              console.error('Error creating privacy policy', err);
              alert('Errore durante la creazione della privacy policy. Controlla la console per dettagli.');
            }
          }}
          globalDocExists={false}
        />
      ) : id === 'doc-terms' ? (
        creating ? (
          <TermsModal
            documentToEdit={null}
            onClose={() => setCreating(false)}
            onSave={async (doc) => {
            try {
              const created = await createTermsDocument({ title: doc.title, content: doc.content, trip: doc.trip });
              if (created) {
                try { window.dispatchEvent(new CustomEvent('documents:changed', { detail: { created } })); } catch (e) {}
                setCreating(false);
                onChange(String(created.value ?? created.id ?? created._id ?? ''));
              } else {
                console.error('createTermsDocument returned null');
                alert('Errore durante la creazione del documento Terms. Controlla la console.');
              }
            } catch (err) {
              console.error('Error creating terms document', err);
              alert('Errore durante la creazione del documento Terms. Controlla la console.');
            }
            }}
            globalDocExists={false}
          />
        ) : null
      ) : id === 'doc-usefulInformations' ? (
        creating ? (
          <UsefulInformationModal
            isOpen={creating}
            infoToEdit={null}
            onClose={() => setCreating(false)}
            onSave={async (data) => {
              try {
                const titleFallback = (data.destinationName && String(data.destinationName).trim()) || (data.country && String(data.country).trim()) || (data.documents && String(data.documents).split('\n')[0].slice(0, 60)) || 'Untitled Useful Information';
                const payload = { title: titleFallback, usefulInfo: data, content: '' };
                const created = await createUsefulInfo(payload);
                if (created) {
                  try { window.dispatchEvent(new CustomEvent('documents:changed', { detail: { created } })); } catch (e) {}
                  setCreating(false);
                  onChange(String(created.value ?? created.id ?? created._id ?? ''));
                } else {
                  console.error('createUsefulInfo returned null');
                  alert('Errore durante la creazione della Useful Information. Controlla la console.');
                }
              } catch (err) {
                console.error('Error creating useful information', err);
                alert('Errore durante la creazione della Useful Information. Controlla la console.');
              }
            }}
          />
        ) : null
      ) : (
        <DocumentCreator open={creating} onCreated={(opt) => {
          setCreating(false);
          try { window.dispatchEvent(new CustomEvent('documents:changed')); } catch (e) { /* ignore */ }
          onChange(opt.value);
        }} onClose={() => setCreating(false)} />
      )}
    </div>
  );
};

export default DocumentDropdown;
