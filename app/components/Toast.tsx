'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_KEYFRAMES = `
@keyframes toastSlideIn {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes toastSlideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(120%); opacity: 0; }
}
@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}
`;

const typeConfig: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: '✓', color: '#00ff88', bg: 'rgba(0,255,136,.08)', border: 'rgba(0,255,136,.3)' },
  error:   { icon: '✕', color: '#ff3c3c', bg: 'rgba(255,60,60,.08)',  border: 'rgba(255,60,60,.3)' },
  info:    { icon: 'ℹ', color: '#0066ff', bg: 'rgba(0,102,255,.08)', border: 'rgba(0,102,255,.3)' },
  warning: { icon: '⚠', color: '#ffaa00', bg: 'rgba(255,170,0,.08)', border: 'rgba(255,170,0,.3)' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const cfg = typeConfig[toast.type];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderRadius: 12,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,.4), 0 0 20px ${cfg.bg}`,
        animation: toast.exiting ? 'toastSlideOut .3s ease forwards' : 'toastSlideIn .4s cubic-bezier(.16,1,.3,1) both',
        fontFamily: "'Courier New', monospace",
        position: 'relative', overflow: 'hidden',
        maxWidth: 400, width: '100%',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: cfg.border, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 900, color: cfg.color,
        flexShrink: 0,
      }}>{cfg.icon}</div>
      <div style={{ flex: 1, fontSize: 13, color: '#e8e8e8', lineHeight: 1.5 }}>{toast.message}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none', border: 'none', color: '#555',
          cursor: 'pointer', fontSize: 16, padding: '0 4px',
          lineHeight: 1, flexShrink: 0,
        }}
      >×</button>
      {/* progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        background: cfg.color, opacity: 0.4,
        animation: 'toastProgress 4s linear forwards',
      }} />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <style dangerouslySetInnerHTML={{ __html: TOAST_KEYFRAMES }} />
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: toasts.length > 0 ? 'auto' : 'none',
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
