import React, { useEffect, useState } from 'react';
import DocumentDropdown from './DocumentDropdown';
import { fetchDocumentOptions, DocOption } from '../services/documents';

type Props = { values?: Record<string,string>; onChange: (k:string,v:string)=>void; disabled?: boolean };

const SectionDocumentsCard: React.FC<Props> = ({ values = {}, onChange, disabled = true }) => {
  const docs = [
    { key: 'usefulInformations', label: 'Useful Informations' },
    { key: 'privacyPolicy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms & Conditions' },
    { key: 'registrationForm', label: 'Form di Registrazione' },
  ];

  // placeholder options; real options will be fetched
  const placeholderOptions: DocOption[] = [
    { value: 'doc-1', label: 'Documento 1' },
    { value: 'doc-2', label: 'Documento 2' }
  ];

  const [options, setOptions] = useState<DocOption[]>(placeholderOptions);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDocumentOptions().then(res => {
      if (!mounted) return;
      if (res && res.length) setOptions(res);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { mounted = false };
  }, []);

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
            options={options}
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
