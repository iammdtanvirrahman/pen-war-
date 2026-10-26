import React, { useState } from 'react';
import { sound } from '../audio/sound';

interface ControlsProps {
  onRecenter: () => void;
  onTopView?: () => void;
  isTopView?: boolean;
  onOpenMenu: () => void;
  isForcedLandscape?: boolean;
  onToggleForceLandscape?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  onRecenter,
  onTopView,
  isTopView = false,
  onOpenMenu,
  isForcedLandscape,
  onToggleForceLandscape,
}) => {
  const [muted, setMuted] = useState(sound.muted);

  const toggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (screen.orientation as any)?.lock('landscape');
        } catch {
          // Orientation lock might not be supported or allowed
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not permitted
    }
  };

  const hasFullscreen = typeof document !== 'undefined' && 'requestFullscreen' in document.documentElement;

  return (
    <div
      className="fixed z-20 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 pointer-events-none"
      style={{
        bottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <button
        onClick={onRecenter}
        title="Recenter camera behind active player"
        className="pointer-events-auto border border-white/10 bg-[#0b0b0dcc] hover:bg-white/10 active:scale-95 text-[#f5f5f7] rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-md transition shadow-md"
      >
        Recenter
      </button>

      {onTopView && (
        <button
          onClick={onTopView}
          title="Switch to top view of the table"
          className={`pointer-events-auto border bg-[#0b0b0dcc] hover:bg-white/10 active:scale-95 text-[#f5f5f7] rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-md transition shadow-md flex items-center gap-1.5 ${
            isTopView
              ? 'border-[#38bdf8] text-[#38bdf8] shadow-[0_0_14px_rgba(56,189,248,0.4)] ring-1 ring-[#38bdf8]/40'
              : 'border-white/10'
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="12" x="3" y="6" rx="2" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <span>Top view</span>
        </button>
      )}

      <button
        onClick={toggleSound}
        className="pointer-events-auto border border-white/10 bg-[#0b0b0dcc] hover:bg-white/10 active:scale-95 text-[#f5f5f7] rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-md transition shadow-md"
      >
        Sound: {muted ? 'off' : 'on'}
      </button>

      {onToggleForceLandscape && (
        <button
          onClick={onToggleForceLandscape}
          title="Toggle Landscape Orientation"
          className="pointer-events-auto border border-white/10 bg-[#0b0b0dcc] hover:bg-white/10 active:scale-95 text-[#f5f5f7] rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-md transition shadow-md flex items-center gap-1.5"
        >
          <span>🔄</span>
          <span>{isForcedLandscape ? 'Portrait' : 'Landscape'}</span>
        </button>
      )}

      {hasFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="pointer-events-auto border border-white/10 bg-[#0b0b0dcc] hover:bg-white/10 active:scale-95 text-[#f5f5f7] rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-md transition shadow-md hidden sm:block"
        >
          Fullscreen
        </button>
      )}

      <button
        onClick={onOpenMenu}
        className="pointer-events-auto border border-white/10 bg-[#0b0b0dcc] hover:bg-white/10 active:scale-95 text-[#f5f5f7] rounded-full px-3.5 py-2 text-xs font-medium backdrop-blur-md transition shadow-md"
      >
        Menu
      </button>
    </div>
  );
};
