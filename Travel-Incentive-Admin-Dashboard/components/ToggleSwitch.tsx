import React from 'react';

type Props = { checked: boolean; onChange: (v: boolean) => void; label?: string; testid?: string };

const ToggleSwitch: React.FC<Props> = ({ checked, onChange, label, testid }) => {
  return (
    <div className="flex items-center space-x-3">
      <div role="switch" aria-checked={checked} data-testid={testid} onClick={() => onChange(!checked)} className={`w-11 h-6 flex items-center bg-${checked ? 'green-600' : 'gray-300'} rounded-full p-1 cursor-pointer transition-colors`}>
        <div className={`bg-white w-4 h-4 rounded-full shadow transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      {label && <div className="text-sm">{label}</div>}
    </div>
  );
};

export default ToggleSwitch;
