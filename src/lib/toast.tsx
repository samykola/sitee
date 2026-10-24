'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
type Toast = { id: string; message: string; type: ToastType };

const ToastCtx = createContext<{ toast: (msg: string, type?: ToastType) => void }>({
  toast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  };

  const borders = {
    success: 'border-l-4 border-l-green-400',
    error: 'border-l-4 border-l-red-400',
    info: 'border-l-4 border-l-blue-400',
    warning: 'border-l-4 border-l-yellow-400',
  };

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id}
            className={`card px-4 py-3 flex items-start gap-3 shadow-xl animate-in slide-in-from-right ${borders[t.type]}`}>
            <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
            <p className="text-sm text-neutral-200 flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-neutral-500 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
