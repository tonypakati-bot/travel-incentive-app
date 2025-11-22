import React from 'react';

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
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium mb-1">{label}</label>
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
    </div>
  );
};

export default DocumentDropdown;
