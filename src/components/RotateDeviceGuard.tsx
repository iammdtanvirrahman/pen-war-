import React, { useEffect, useState } from 'react';
import { sound } from '../audio/sound';

interface RotateDeviceGuardProps {
  active: boolean;
}

export const RotateDeviceGuard: React.FC<RotateDeviceGuardProps> = ({ active }) => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isPortraitNow = window.innerWidth < window.innerHeight;
      setIsPortrait(isPortraitNow);
      // Reset dismissed state when player rotates back to landscape then portrait
      if (!isPortraitNow) {
        setDismissed(false);
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

  const handleRequestLandscape = async () => {
    sound.haptic(20);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch {
      // Orientation lock not permitted or rejected, user will manually rotate
    }
  };

  // Only show when a match is active, screen is in portrait, and user hasn't explicitly dismissed
  if (!active || !isPortrait || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#050505]/95 backdrop-blur-md text-white font-['Geist_Mono',monospace] select-none animate-in fade-in duration-300">
      {/* Tactical scanline layer */}
      <div className="tactical-layer" />

      <div className="relative z-10 max-w-sm w-full p-6 sm:p-8 bg-[#080808] border border-[#ff0044]/60 shadow-[0_24px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(255,0,68,0.3)] text-center">
        {/* Monospace telemetry tag */}
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#ff0044] mb-4">
          // ROTATE_TO_LANDSCAPE
        </div>

        {/* Animated Rotating Phone Graphic */}
        <div className="my-6 flex items-center justify-center h-28">
          <div className="relative w-16 h-28 border-2 border-white/80 rounded-2xl flex items-center justify-center animate-[rotatePhone_2.5s_infinite_ease-in-out] shadow-[0_0_20px_rgba(255,0,68,0.4)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff0044] absolute top-2" />
            <div className="text-xl">🔄</div>
            <div className="w-6 h-1 rounded-full bg-white/40 absolute bottom-2" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="font-['Oswald',sans-serif] text-3xl font-bold uppercase tracking-tight text-white m-0 mb-2">
          Rotate Your Device
        </h2>

        {/* Explanation */}
        <p className="text-xs sm:text-sm text-white/60 leading-relaxed m-0 mb-6">
          Turn your phone into <strong className="text-white">landscape mode</strong> for the best widescreen 3D tabletop duel experience and precision flicking.
        </p>

        {/* Action Button: Auto rotate / Fullscreen */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRequestLandscape}
            className="w-full py-3 px-4 bg-[#ff0044] hover:brightness-110 active:scale-[0.98] text-white font-['Oswald',sans-serif] font-bold text-base uppercase tracking-tight shadow-[0_4px_16px_rgba(255,0,68,0.4)] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Lock Landscape</span>
            <span className="font-['Space_Mono',monospace] text-xs">➔</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.haptic(10);
              setDismissed(true);
            }}
            className="w-full py-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            Continue in Portrait Anyway
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rotatePhone {
          0%, 15% {
            transform: rotate(0deg) scale(1);
          }
          45%, 70% {
            transform: rotate(90deg) scale(1.05);
            border-color: #ff0044;
          }
          85%, 100% {
            transform: rotate(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
