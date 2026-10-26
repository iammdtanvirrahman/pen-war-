import React, { useState, useEffect } from 'react';

interface LandscapeGuardProps {
  onForceLandscapeToggle: (forced: boolean) => void;
  isForced: boolean;
}

export const LandscapeGuard: React.FC<LandscapeGuardProps> = ({
  onForceLandscapeToggle,
  isForced,
}) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) {
        setDismissed(false); // Reset dismissal once in landscape
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const attemptLandscapeLock = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (screen.orientation && (screen.orientation as any).lock) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (screen.orientation as any).lock('landscape');
      }
    } catch {
      // If native lock fails, apply forced CSS landscape
      onForceLandscapeToggle(true);
    }
  };

  if (!isPortrait || dismissed || isForced) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#080808f2] backdrop-blur-md text-white text-center animate-in fade-in duration-300">
      <div className="max-w-xs w-full flex flex-col items-center">
        {/* Animated Rotating Device Icon */}
        <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-[#38bdf8]/10 animate-pulse border border-[#38bdf8]/30" />
          <svg
            className="w-12 h-12 text-[#38bdf8] animate-[spin_4s_ease-in-out_infinite]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="20" x="5" y="2" rx="2" />
            <path d="M12 18h.01" />
          </svg>
        </div>

        {/* Badge */}
        <div className="inline-flex mb-2 px-2.5 py-0.5 rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#7dd3fc] text-[10px] font-bold tracking-wider uppercase">
          Landscape Recommended
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-black text-white m-0 tracking-tight">
          Rotate to Landscape
        </h2>
        <p className="text-xs text-[#a1a1aa] mt-2 mb-6 leading-relaxed">
          Pen Fighter is designed for wide landscape screens to view the full tabletop and calculate bank shots.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            onClick={attemptLandscapeLock}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7] text-white text-sm font-bold shadow-[0_4px_16px_rgba(2,132,199,0.35)] active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>Switch to Landscape</span>
          </button>

          <button
            type="button"
            onClick={() => onForceLandscapeToggle(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-semibold active:scale-[0.98] transition"
          >
            Force Sideways View
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-white/50 hover:text-white/80 py-1 transition-colors"
          >
            Continue in Portrait
          </button>
        </div>
      </div>
    </div>
  );
};
