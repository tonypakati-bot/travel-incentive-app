import React, { useState, useRef, useEffect } from 'react';

type Props = {
  value?: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  testid?: string;
};

const slug = (s: string) => s.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();

const TagInput: React.FC<Props> = ({ value = [], onChange, placeholder = 'Aggiungi gruppo', testid }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInput('');
  }, [value.length]);

  const add = (v?: string) => {
    const t = (v ?? input).trim();
    if (!t) return;
    const exists = value.some(x => (x || '').toString().trim().toLowerCase() === t.toLowerCase());
    if (exists) { setInput(''); return; }
    onChange([...value, t]);
    setInput('');
  };

  const remove = (v: string) => onChange(value.filter(x => x !== v));

  return (
    <div className="flex flex-col" data-testid={testid}>
      <div className="flex items-center gap-2 flex-wrap">
        {value.map(v => (
          <span key={v} data-testid={`trip-group-${slug(v)}`} className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm">
            <span className="mr-2">{v}</span>
            <button data-testid={`trip-group-remove-${slug(v)}`} onClick={() => remove(v)} className="text-xs text-gray-500 hover:text-gray-700">×</button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input data-testid={testid ? `${testid}-input` : 'trip-groups-input-input'} ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} className="p-2 border rounded flex-1" />
        <button data-testid={testid ? `${testid}-add` : 'trip-groups-add'} onClick={()=>add()} className="px-3 py-2 bg-blue-600 text-white rounded">Aggiungi</button>
      </div>
    </div>
  );
};

export default TagInput;
