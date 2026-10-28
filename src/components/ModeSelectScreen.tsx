import React, { useState } from 'react';
import { GameMode } from '../types/game';
import { sound } from '../audio/sound';

interface ModeSelectScreenProps {
  onSelectMode: (mode: GameMode) => void;
  onQuickStart: () => void;
  assetsReady: boolean;
  statusText: string;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({
  onSelectMode,
  onQuickStart,
  assetsReady,
  statusText,
}) => {
  const [muted, setMuted] = useState(sound.muted);

  const toggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
  };

  const handleSelectMode = (mode: GameMode) => {
    sound.haptic(20);
    onSelectMode(mode);
  };

  const handleQuickStart = () => {
    sound.haptic(25);
    onQuickStart();
  };

  return (
    <div className="fixed inset-0 z-40 h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-[#050505] text-[#ffffff] font-['Geist_Mono',monospace] select-none pointer-events-auto">
      {/* Tactical HUD Background */}
      <div className="tactical-layer" />

      {/* Slim Header - Extra verbose telemetry text removed for mobile fit */}
      <header
        className="px-4 sm:px-8 py-2.5 sm:py-3.5 flex justify-between items-center z-10 shrink-0 border-b border-white/[0.08]"
        style={{
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#ff0044] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0044] animate-pulse" />
          <span>PF_CORE // v0814</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {assetsReady ? 'READY' : 'LOADING...'}
          </span>
          <button
            type="button"
            onClick={toggleSound}
            className="bg-transparent text-[#ff0044] border border-[#ff0044]/60 hover:bg-[#ff0044]/15 active:scale-95 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider cursor-pointer transition"
          >
            {muted ? 'Audio: Off' : 'Audio: On'}
          </button>
        </div>
      </header>

      {/* Main Content - Scaled to fit 100% in viewport without scrolling */}
      <main
        className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 landscape:grid-cols-2 gap-4 sm:gap-8 lg:gap-14 px-4 sm:px-8 md:px-12 py-3 sm:py-6 items-center max-w-6xl mx-auto w-full z-10"
        style={{
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        {/* Compact Title Group - Extra paragraph and status blocks removed */}
        <div className="relative flex flex-col justify-center items-start text-left">
          <h1 className="font-['Oswald',sans-serif] text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] leading-[0.85] tracking-[-0.04em] uppercase m-0">
            <span className="block bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
              PEN
            </span>
            <span className="block text-[#ff0044] drop-shadow-[0_0_24px_rgba(255,0,68,0.45)]">
              FIGHT
            </span>
          </h1>

          <div className="mt-2 text-[10px] sm:text-xs text-white/50 uppercase tracking-[0.15em]">
            3D Tabletop Flick Combat
          </div>

          {statusText && (
            <div className="mt-1 font-['Space_Mono',monospace] text-[9px] text-[#ff0044]/80 tracking-wider">
              {statusText}
            </div>
          )}
        </div>

        {/* Compact Menu System - Fits Android viewports with zero overflow */}
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
          {/* [01] Quick Duel */}
          <button
            type="button"
            disabled={!assetsReady}
            onClick={handleQuickStart}
            className="group w-full bg-[#ff0044] border border-[#ff0044] text-white py-2.5 sm:py-3.5 px-4 sm:px-5 flex justify-between items-center transition-all duration-200 hover:brightness-110 active:scale-[0.99] text-left cursor-pointer shadow-[0_4px_16px_rgba(255,0,68,0.35)] disabled:opacity-40"
          >
            <div>
              <div className="text-sm sm:text-base font-bold uppercase tracking-[0.05em] leading-tight">
                Quick Duel
              </div>
              <div className="text-[10px] text-white/80 hidden xs:block sm:block">
                Instant 1v1 Tabletop Match
              </div>
            </div>
            <span className="font-['Space_Mono',monospace] text-xs font-bold opacity-70 ml-2">
              [01]
            </span>
          </button>

          {/* [02] Local PVP */}
          <button
            type="button"
            disabled={!assetsReady}
            onClick={() => handleSelectMode('friend')}
            className="group w-full bg-white/[0.03] border border-white/[0.1] hover:border-[#ff0044] hover:bg-[#ff0044]/[0.08] text-white py-2.5 sm:py-3.5 px-4 sm:px-5 flex justify-between items-center transition-all duration-200 active:scale-[0.99] text-left cursor-pointer disabled:opacity-40"
          >
            <div>
              <div className="text-sm sm:text-base font-bold uppercase tracking-[0.05em] leading-tight">
                Local PVP
              </div>
              <div className="text-[10px] text-white/40 hidden xs:block sm:block">
                2-Player Pass & Play
              </div>
            </div>
            <span className="font-['Space_Mono',monospace] text-xs font-bold opacity-30 ml-2 group-hover:text-[#ff0044] group-hover:opacity-100">
              [02]
            </span>
          </button>

          {/* [03] Neural AI */}
          <button
            type="button"
            disabled={!assetsReady}
            onClick={() => handleSelectMode('ai')}
            className="group w-full bg-white/[0.03] border border-white/[0.1] hover:border-[#ff0044] hover:bg-[#ff0044]/[0.08] text-white py-2.5 sm:py-3.5 px-4 sm:px-5 flex justify-between items-center transition-all duration-200 active:scale-[0.99] text-left cursor-pointer disabled:opacity-40"
          >
            <div>
              <div className="text-sm sm:text-base font-bold uppercase tracking-[0.05em] leading-tight">
                Neural AI
              </div>
              <div className="text-[10px] text-white/40 hidden xs:block sm:block">
                Duel Computer AI
              </div>
            </div>
            <span className="font-['Space_Mono',monospace] text-xs font-bold opacity-30 ml-2 group-hover:text-[#ff0044] group-hover:opacity-100">
              [03]
            </span>
          </button>

          {/* [04] Trickshot Sandbox */}
          <button
            type="button"
            disabled={!assetsReady}
            onClick={() => handleSelectMode('practice')}
            className="group w-full bg-white/[0.03] border border-white/[0.1] hover:border-[#ff0044] hover:bg-[#ff0044]/[0.08] text-white py-2.5 sm:py-3.5 px-4 sm:px-5 flex justify-between items-center transition-all duration-200 active:scale-[0.99] text-left cursor-pointer disabled:opacity-40"
          >
            <div>
              <div className="text-sm sm:text-base font-bold uppercase tracking-[0.05em] leading-tight">
                Trickshot Sandbox
              </div>
              <div className="text-[10px] text-white/40 hidden xs:block sm:block">
                Solo Free Practice Arena
              </div>
            </div>
            <span className="font-['Space_Mono',monospace] text-xs font-bold opacity-30 ml-2 group-hover:text-[#ff0044] group-hover:opacity-100">
              [04]
            </span>
          </button>
        </div>
      </main>

      {/* Slim Compact Footer */}
      <footer
        className="px-4 sm:px-8 py-2 sm:py-3 flex justify-between items-center border-t border-white/[0.08] z-10 shrink-0 text-[9px] sm:text-[10px] tracking-wider text-white/40 uppercase"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <span>Pull Back to Aim · Release to Flick</span>
        <span className="text-[#ff0044] font-bold">READY</span>
      </footer>
    </div>
  );
};
