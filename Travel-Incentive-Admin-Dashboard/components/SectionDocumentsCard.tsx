import React, { useEffect, useState } from 'react';
import DocumentDropdown from './DocumentDropdown';
import { fetchDocumentOptions, fetchPrivacyPolicyOptions, fetchTermsDocuments, DocOption } from '../services/documents';
import { fetchFormOptions } from '../services/forms';

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
  const [usefulOptions, setUsefulOptions] = useState<DocOption[]>([]);
  const [privacyOptions, setPrivacyOptions] = useState<DocOption[]>([]);
  const [termsOptions, setTermsOptions] = useState<DocOption[]>([]);
  const [formOptions, setFormOptions] = useState<DocOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // initial fetch form options
    fetchFormOptions().then(res => {
      if (!mounted) return;
      if (res && res.length) setFormOptions(res.map((it: any) => ({ value: it.value, label: it.label })));
    }).catch(() => {});
    // fetch generic document options (fallback)
    fetchDocumentOptions().then(res => {
      if (!mounted) return;
      if (res && res.length) {
        setOptions(res);
        setUsefulOptions(res); // prefer useful-informations shape for the Useful Informations select
      }
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });

    // fetch privacy-specific options
    fetchPrivacyPolicyOptions().then(res => {
      if (!mounted) return;
      if (res && res.length) setPrivacyOptions(res);
    }).catch(() => {});

    // fetch terms-specific options
    fetchTermsDocuments().then(res => {
      if (!mounted) return;
      if (res && Array.isArray(res) && res.length) {
        // map server objects to DocOption shape if necessary
        setTermsOptions(res.map((it: any) => ({ value: it._id ?? it.id ?? it.value ?? '', label: it.title ?? it.label ?? it.name ?? it.filename ?? '' })));
      }
    }).catch(() => {});

    // also listen for global documents changed events to refresh options
    const handler = async (ev?: Event) => {
      try { /* handler triggered - event detail available in (ev as any)?.detail */ } catch (e) {}
      setLoading(true);
      try {
        const [dRes, pRes, tRes] = await Promise.all([fetchDocumentOptions(), fetchPrivacyPolicyOptions(), fetchTermsDocuments()]);
        // refresh results: { dRes, pRes, tRes }
        if (mounted && dRes && dRes.length) {
          setOptions(dRes);
          setUsefulOptions(dRes);
        }
        if (mounted && pRes && pRes.length) setPrivacyOptions(pRes);
        if (mounted && tRes && Array.isArray(tRes) && tRes.length) {
          setTermsOptions(tRes.map((it: any) => ({ value: it._id ?? it.id ?? it.value ?? '', label: it.title ?? it.label ?? it.name ?? it.filename ?? '' })));
        }
        // refresh forms options too
        try {
          const fRes = await fetchFormOptions();
          if (mounted && fRes && fRes.length) setFormOptions(fRes.map((it: any) => ({ value: it.value, label: it.label })));
        } catch (e) { /* ignore fetch errors during refresh */ }
      } catch (e) { /* ignore fetch errors during refresh */ }
      setLoading(false);
    };
    window.addEventListener('documents:changed', handler as EventListener);
    // also listen for form changes so registration form select updates
    const formsHandler = async (ev?: Event) => {
      try {
        const fRes = await fetchFormOptions();
        if (mounted && fRes && fRes.length) setFormOptions(fRes.map((it: any) => ({ value: it.value, label: it.label })));
      } catch (e) { /* ignore forms fetch errors */ }
    };
    window.addEventListener('forms:changed', formsHandler as EventListener);
    return () => { mounted = false; window.removeEventListener('documents:changed', handler as EventListener); window.removeEventListener('forms:changed', formsHandler as EventListener); };
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
            options={d.key === 'privacyPolicy' ? privacyOptions : (d.key === 'terms' ? termsOptions : (d.key === 'registrationForm' ? formOptions : (d.key === 'usefulInformations' ? usefulOptions : options)))}
            onChange={(v) => onChange(d.key, v)}
            disabled={disabled}
            testId={`doc-selector-${d.key}`}
            showActions={false}
          />
        ))}
      </div>
    </div>
  );
};

export default SectionDocumentsCard;
