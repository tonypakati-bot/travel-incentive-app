import React from 'react';
import DocumentDropdown from './DocumentDropdown';

type Props = { values?: Record<string,string>; onChange: (k:string,v:string)=>void; disabled?: boolean };

const SectionDocumentsCard: React.FC<Props> = ({ values = {}, onChange, disabled = true }) => {
  const docs = [
    { key: 'usefulInformations', label: 'Useful Informations' },
    { key: 'privacyPolicy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms & Conditions' },
    { key: 'registrationForm', label: 'Form di Registrazione' },
  ];

  // placeholder options; real options should be fetched and passed down
  const placeholderOptions = [
    { value: 'doc-1', label: 'Documento 1' },
    { value: 'doc-2', label: 'Documento 2' }
  ];

  return (
    <div className={`p-6 bg-white rounded-lg border`} aria-labelledby="section-documents-title">
      <h3 id="section-documents-title" className="font-bold">Sezione 3 — Documenti</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {docs.map(d => (
          <DocumentDropdown
            key={d.key}
            id={`doc-${d.key}`}
            label={d.label}
            value={values[d.key] || ''}
            options={placeholderOptions}
            onChange={(v) => onChange(d.key, v)}
            disabled={disabled}
            testId={`doc-selector-${d.key}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SectionDocumentsCard;
