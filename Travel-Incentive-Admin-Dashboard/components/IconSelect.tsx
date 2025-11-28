import React from 'react';

type Option = { key: string; label?: string };

const DEFAULT_OPTIONS: Option[] = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'users', label: 'Users' },
  { key: 'check', label: 'Check' }
];

const IconSelect: React.FC<{ value?: string; onChange?: (v:string)=>void; options?: string[] }> = ({ value, onChange, options }) => {
  const opts: Option[] = (Array.isArray(options) && options.length) ? options.map(s => ({ key: s, label: s })) : DEFAULT_OPTIONS;
  return (
    <select value={value || ''} onChange={(e)=> onChange && onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg">
      <option value="">-- Seleziona Icona --</option>
      {opts.map(opt => (
        <option key={opt.key} value={opt.key}>{opt.label || opt.key}</option>
      ))}
    </select>
  );
};

export default IconSelect;
