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
      className="fixed z-30 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#050505]/95 border border-[#ff0044]/60 text-xs sm:text-sm text-white font-['Space_Mono',monospace] font-bold max-w-[min(420px,90vw)] text-center shadow-[0_4px_20px_rgba(255,0,68,0.25)] backdrop-blur-md pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-top-1"
      style={{
        top: 'calc(max(8px, env(safe-area-inset-top)) + 50px)',
      }}
    >
      <span className="text-[#ff0044] mr-1.5">//</span>
      {message}
    </div>
  );
};
