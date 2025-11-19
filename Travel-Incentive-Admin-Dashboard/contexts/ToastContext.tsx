import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
type ToastType = 'success' | 'error' | 'info';
type Toast = { id: string; type: ToastType; message: string };

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', durationMs = 4000) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const t: Toast = { id, type, message };
    setToasts(prev => [t, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-xs w-full px-4 py-3 rounded shadow-lg text-sm ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastContext;
