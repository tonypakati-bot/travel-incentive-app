import React from 'react';
import { AgendaIcon, UsersIcon, CheckIcon } from './icons';

const ICON_OPTIONS: Array<{ key: string; label: string; icon: React.FC<{className?:string}> }> = [
  { key: 'calendar', label: 'Calendar', icon: AgendaIcon },
  { key: 'users', label: 'Users', icon: UsersIcon },
  { key: 'check', label: 'Check', icon: CheckIcon }
];

const IconSelect: React.FC<{ value?: string; onChange?: (v:string)=>void }> = ({ value, onChange }) => {
  return (
    <select value={value || ''} onChange={(e)=> onChange && onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg">
      <option value="">-- Seleziona Icona --</option>
      {ICON_OPTIONS.map(opt => (
        <option key={opt.key} value={opt.key}>{opt.label}</option>
      ))}
    </select>
  );
};

export default IconSelect;
