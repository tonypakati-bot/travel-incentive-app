import React from 'react';

export type ToastItem = { id: string; message: string; type?: 'info'|'success'|'error' };

const ToastView: React.FC<{ items: ToastItem[] }> = ({ items }) => {
  if (!items || !items.length) return null;
  return (
    <div className="fixed right-4 bottom-6 z-60 flex flex-col gap-2">
      {items.map(it => (
        <div key={it.id} className={`px-4 py-2 rounded shadow ${it.type==='error' ? 'bg-red-600 text-white' : it.type==='success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>
          {it.message}
        </div>
      ))}
    </div>
  );
};

export default ToastView;
