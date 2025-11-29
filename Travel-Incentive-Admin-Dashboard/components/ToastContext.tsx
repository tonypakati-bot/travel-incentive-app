import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastView, { ToastItem } from './Toast';

type Context = { push: (message: string, type?: ToastItem['type'], ttl?: number) => void };
const ToastContext = createContext<Context | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, type: ToastItem['type']='info', ttl = 2500) => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2,8);
    const item: ToastItem = { id, message, type };
    setItems(prev => [...prev, item]);
    setTimeout(() => setItems(prev => prev.filter(p => p.id !== id)), ttl);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <ToastView items={items} />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
