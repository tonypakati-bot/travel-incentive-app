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
    console.log('[Toast] showToast', { message, type, id });
    setToasts(prev => [t, ...prev]);
    // expose last toast for headless tests / dev debugging only in development
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        // @ts-ignore
        window.__LAST_TOAST = t;
      }
    } catch (e) {}
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {toasts.map(t => {
          const bgColor = t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#1f2937';
          const textColor = '#ffffff';
          const boxStyle: React.CSSProperties = {
            backgroundColor: bgColor,
            color: textColor,
            padding: '12px 16px',
            borderRadius: 8,
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            maxWidth: 320,
            fontSize: 14,
          };
          return (
            <div key={t.id} style={boxStyle} className={`max-w-xs w-full px-4 py-3 rounded shadow-lg text-sm`}>
              {t.message}
            </div>
          );
        })}
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
