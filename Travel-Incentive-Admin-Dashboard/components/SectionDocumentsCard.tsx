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
    }).catch(e => { console.debug('[E2E] initial fetchFormOptions error', e); });
    // fetch generic document options (fallback)
    fetchDocumentOptions().then(res => {
      console.debug('[E2E] initial fetchDocumentOptions', res);
      if (!mounted) return;
      if (res && res.length) {
        setOptions(res);
        setUsefulOptions(res); // prefer useful-informations shape for the Useful Informations select
      }
    }).catch((e) => { console.debug('[E2E] initial fetchDocumentOptions error', e); }).finally(() => { if (mounted) setLoading(false); });

    // fetch privacy-specific options
    fetchPrivacyPolicyOptions().then(res => {
      if (!mounted) return;
      if (res && res.length) setPrivacyOptions(res);
    }).catch(e => { console.debug('[E2E] initial fetchPrivacyPolicyOptions error', e); });

    // fetch terms-specific options
    fetchTermsDocuments().then(res => {
      if (!mounted) return;
      if (res && Array.isArray(res) && res.length) {
        // map server objects to DocOption shape if necessary
        setTermsOptions(res.map((it: any) => ({ value: it._id ?? it.id ?? it.value ?? '', label: it.title ?? it.label ?? it.name ?? it.filename ?? '' })));
      }
    }).catch(e => { console.debug('[E2E] initial fetchTermsDocuments error', e); });

    // also listen for global documents changed events to refresh options
    const handler = async (ev?: Event) => {
      try { console.debug('[E2E] documents:changed handler triggered - event detail', (ev as any)?.detail); } catch (e) {}
      console.debug('[E2E] documents:changed handler triggered - refreshing options');
      setLoading(true);
      try {
        const [dRes, pRes, tRes] = await Promise.all([fetchDocumentOptions(), fetchPrivacyPolicyOptions(), fetchTermsDocuments()]);
        console.debug('[E2E] documents:changed fetch results', { dRes, pRes, tRes });
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
        } catch (e) { console.debug('[E2E] documents:changed fetchFormOptions error', e); }
      } catch (e) { console.debug('[E2E] documents:changed fetch error', e); }
      setLoading(false);
    };
    window.addEventListener('documents:changed', handler as EventListener);
    // also listen for form changes so registration form select updates
    const formsHandler = async (ev?: Event) => {
      try {
        const fRes = await fetchFormOptions();
        if (mounted && fRes && fRes.length) setFormOptions(fRes.map((it: any) => ({ value: it.value, label: it.label })));
      } catch (e) { console.debug('[E2E] forms:changed handler error', e); }
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
          />
        ))}
      </div>
    </div>
  );
};

export default SectionDocumentsCard;
