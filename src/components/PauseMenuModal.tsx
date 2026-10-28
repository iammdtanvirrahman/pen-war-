import React from 'react';
import { GameSettings } from '../types/game';
import { sound } from '../audio/sound';

interface PauseMenuModalProps {
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onChangeSetup?: () => void;
  onQuitToTitle: () => void;
  isTopView?: boolean;
  onToggleTopView?: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  settings,
  onResume,
  onRestart,
  onQuitToTitle,
}) => {
  const modeName =
    settings.mode === 'friend'
      ? 'Local 2-Player'
      : settings.mode === 'ai'
      ? `AI (${settings.level.toUpperCase()})`
      : 'Target Practice';

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 font-['Geist_Mono',monospace]">
      <div className="w-[min(380px,calc(100vw-28px))] p-6 sm:p-7 bg-[#050505] border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(255,0,68,0.25)] text-white text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff0044] animate-ping" />
            <h2 className="font-['Oswald',sans-serif] text-2xl font-bold uppercase tracking-tight text-white m-0">
              PAUSED
            </h2>
          </div>
          <span className="font-['Space_Mono',monospace] text-[10px] font-bold px-2 py-0.5 border border-white/15 bg-white/5 text-[#ff0044] uppercase tracking-wider">
            {modeName}
          </span>
        </div>

        {/* Clean Actions: Resume, Restart, Main Menu */}
        <div className="space-y-3">
          {/* Resume */}
          <button
            type="button"
            onClick={() => {
              sound.haptic(20);
              onResume();
            }}
            className="w-full py-3.5 px-4 bg-[#ff0044] hover:brightness-110 active:scale-[0.98] text-white font-['Oswald',sans-serif] font-bold text-lg uppercase tracking-wide shadow-[0_4px_16px_rgba(255,0,68,0.4)] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Resume</span>
            <span className="font-['Space_Mono',monospace] text-xs">➔</span>
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={() => {
              sound.haptic(20);
              onRestart();
            }}
            className="w-full py-3 px-4 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white font-['Space_Mono',monospace] text-xs sm:text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Restart</span>
          </button>

          {/* Main Menu */}
          <button
            type="button"
            onClick={() => {
              sound.haptic(15);
              onQuitToTitle();
            }}
            className="w-full py-3 px-4 border border-white/15 bg-transparent hover:bg-white/5 hover:border-white/30 text-white/60 hover:text-white font-['Space_Mono',monospace] text-xs sm:text-sm font-bold uppercase tracking-wider active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
