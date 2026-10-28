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
      className="fixed z-30 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#050505]/75 border border-[#ff0044]/25 rounded-md text-[10px] sm:text-xs text-white/90 font-['Space_Mono',monospace] font-medium max-w-[min(300px,84vw)] text-center pointer-events-none transition-all duration-150 animate-in fade-in slide-in-from-top-1"
      style={{
        top: 'calc(max(8px, env(safe-area-inset-top)) + 50px)',
      }}
    >
      {message}
    </div>
  );
};
