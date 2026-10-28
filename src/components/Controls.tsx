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
          // Orientation lock might not be supported
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
      className="fixed z-30 pointer-events-none select-none max-w-[calc(100vw-20px)]"
      style={{
        top: 'max(8px, env(safe-area-inset-top))',
        left: 'max(10px, env(safe-area-inset-left))',
      }}
    >
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-[#0f0f14f2] border border-white/15 shadow-2xl pointer-events-auto backdrop-blur-md">
        {/* Recenter View [R] */}
        <button
          type="button"
          onClick={onRecenter}
          title="Recenter camera behind active shooter pen [R]"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-[#f5f5f7] text-xs font-semibold transition"
        >
          <span>🎯</span>
          <span className="hidden md:inline">Recenter</span>
          <span className="hidden lg:inline text-[10px] text-white/40 font-mono">R</span>
        </button>

        {/* Top View Toggle [V] */}
        {onTopView && (
          <button
            type="button"
            onClick={onTopView}
            title="Toggle overhead bird's-eye view of the table [V]"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-semibold transition active:scale-95 ${
              isTopView
                ? 'border-[#38bdf8] bg-[#38bdf8]/20 text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.35)] ring-1 ring-[#38bdf8]/50'
                : 'border-white/10 bg-white/5 hover:bg-white/10 text-[#f5f5f7]'
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
            <span className="hidden md:inline">Top view</span>
            <span className="hidden lg:inline text-[10px] opacity-60 font-mono">V</span>
          </button>
        )}

        {/* Sound Toggle [M] */}
        <button
          type="button"
          onClick={toggleSound}
          title="Mute or Unmute audio [M]"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-[#f5f5f7] text-xs font-semibold transition"
        >
          <span>{muted ? '🔇' : '🔊'}</span>
          <span className="hidden xl:inline">{muted ? 'Off' : 'On'}</span>
        </button>

        {/* Rotate / Forced Landscape Toggle */}
        {onToggleForceLandscape && (
          <button
            type="button"
            onClick={onToggleForceLandscape}
            title="Rotate / Force Landscape view"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-[#f5f5f7] text-xs font-semibold transition sm:hidden"
          >
            <span>🔄</span>
          </button>
        )}

        {/* Fullscreen Toggle [F] */}
        {hasFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 text-[#f5f5f7] text-xs font-semibold transition"
          >
            <span>⛶</span>
          </button>
        )}

        {/* Menu / Pause [Esc] */}
        <button
          type="button"
          onClick={onOpenMenu}
          title="Open Pause & Settings Menu [Esc]"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#dc3545]/40 bg-[#dc3545]/20 hover:bg-[#dc3545]/30 text-white text-xs font-bold transition active:scale-95"
        >
          <span>⏸</span>
          <span className="hidden sm:inline">Menu</span>
          <span className="hidden md:inline text-[10px] text-white/60 font-mono">Esc</span>
        </button>
      </div>
    </div>
  );
};
