import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-30 left-1/2 -translate-x-1/2 px-3.5 py-2 rounded-xl bg-[#111114ee] border border-white/10 text-xs sm:text-sm text-[#f5f5f7] max-w-[min(420px,90vw)] text-center shadow-lg backdrop-blur-md pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-top-1"
      style={{
        top: 'calc(max(8px, env(safe-area-inset-top)) + 46px)',
      }}
    >
      {message}
    </div>
  );
};
