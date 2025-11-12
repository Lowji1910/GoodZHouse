import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = (message, variant = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    if (duration > 0) setTimeout(() => setToasts((prev) => prev.filter(t => t.id !== id)), duration);
  };

  const value = useMemo(() => ({ notify }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1080 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast show mb-2 border-0`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className={`toast-body text-white bg-${mapVariant(t.variant)}`}>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function mapVariant(v) {
  switch (String(v)) {
    case 'success': return 'success';
    case 'warning': return 'warning';
    case 'danger':
    case 'error': return 'danger';
    default: return 'primary';
  }
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
