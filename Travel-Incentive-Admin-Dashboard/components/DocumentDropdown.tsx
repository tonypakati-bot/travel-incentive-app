import React, { useState, useEffect } from 'react';
import DocumentCreator from './DocumentCreator';

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
  useEffect(() => {
    if (!testId) return;
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
          <button data-testid={`${testId}-create`} type="button" onClick={() => setCreating(true)} disabled={disabled} className="text-sm text-green-600 hover:underline">Crea nuovo</button>
          <button data-testid={`${testId}-remove`} type="button" onClick={() => onChange('')} disabled={disabled || !value} className="text-sm text-red-600 hover:underline">Rimuovi</button>
        </div>
      </div>
      <DocumentCreator open={creating} onCreated={(opt) => {
        setCreating(false);
        onChange(opt.value);
      }} onClose={() => setCreating(false)} />
    </div>
  );
};

export default DocumentDropdown;
