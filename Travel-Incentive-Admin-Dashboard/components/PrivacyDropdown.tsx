import React, { useState, useEffect } from 'react';
import { PrivacyModal } from './PrivacyPolicy';
import { fetchPrivacyOptions } from '../services/documents';

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

const PrivacyDropdown: React.FC<Props> = ({ id, label, value = '', options, onChange, disabled = false, testId }) => {
  const [creating, setCreating] = useState(false);
  const canOpenModal = () => {
    if (disabled) return false;
    try {
      const el = document.getElementById(id);
      if (!el) return true;
      const wrapper = el.closest && el.closest('.relative.pointer-events-none') || el.closest('[data-disabled]');
      if (wrapper) return false;
      const attrDisabled = el.getAttribute && (el.getAttribute('disabled') !== null || el.getAttribute('aria-disabled') === 'true');
      if (attrDisabled) return false;
    } catch (e) {}
    return true;
  };
  const [optionsState, setOptionsState] = useState<Option[]>(options || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPrivacyOptions().then(res => {
      if (!mounted) return;
      if (res && res.length) setOptionsState(res);
      setLoading(false);
    }).catch(() => { setLoading(false); });

    if (!testId) return;
    if (!((import.meta as any).env && (import.meta as any).env.DEV)) return;
    const w = window as any;
    w.__E2E_openPrivacyCreator = w.__E2E_openPrivacyCreator || {};
    w.__E2E_openPrivacyCreator[testId] = () => { if (canOpenModal()) setCreating(true); else { /* privacy create prevented: section disabled */ } };
    return () => {
      try { delete w.__E2E_openPrivacyCreator[testId]; } catch (e) {}
    };
  }, [testId]);

  useEffect(() => {
    let mounted = true;
    const handler = async () => {
      // privacy documents:changed - refreshing options
      setLoading(true);
      try {
        const res = await fetchPrivacyOptions();
        if (mounted && res && res.length) setOptionsState(res);
      } catch (e) { /* privacy fetch error */ }
      setLoading(false);
    };
    window.addEventListener('documents:changed', handler as EventListener);
    return () => { mounted = false; window.removeEventListener('documents:changed', handler as EventListener); };
  }, []);

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
          {optionsState.map(o => <option key={o.value} data-testid={`${testId}-option-${o.value}`} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex flex-col ml-2">
          <button data-testid={`${testId}-create`} type="button" onClick={() => { if (canOpenModal()) setCreating(true); }} disabled={disabled} className="text-sm text-green-600 hover:underline">Crea nuovo</button>
          <button data-testid={`${testId}-remove`} type="button" onClick={() => onChange('')} disabled={disabled || !value} className="text-sm text-red-600 hover:underline">Rimuovi</button>
        </div>
      </div>
      <PrivacyModal open={creating} documentToEdit={null as any} onClose={() => setCreating(false)} onSave={(d) => {
        // onSave receives doc-like object; synthesize option
        setCreating(false);
        const opt = { value: String((d as any).id || Date.now()), label: (d as any).title || 'Privacy' };
        onChange(opt.value);
      }} globalDocExists={false} />
    </div>
  );
};

export default PrivacyDropdown;
