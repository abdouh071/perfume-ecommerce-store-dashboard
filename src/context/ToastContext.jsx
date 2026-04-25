import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-up glass-card px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-[400px] border border-white/30"
            style={{
              animation: 'slideUp 0.4s cubic-bezier(0.2, 1, 0.3, 1)',
            }}
          >
            <span className={`material-symbols-outlined text-xl ${
              toast.type === 'success' ? 'text-green-600' : 
              toast.type === 'error' ? 'text-red-500' : 
              'text-secondary'
            }`}>
              {toast.type === 'success' ? 'check_circle' : 
               toast.type === 'error' ? 'error' : 
               'info'}
            </span>
            <p className="text-sm font-body font-medium text-on-surface flex-1">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
