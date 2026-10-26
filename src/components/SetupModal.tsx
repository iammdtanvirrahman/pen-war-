import React from 'react';
import { AiLevel, GameMode, GameSettings } from '../types/game';

interface SetupModalProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onStartMatch: () => void;
  onResumeMatch?: () => void;
  canResume: boolean;
  assetsReady: boolean;
  statusText: string;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  settings,
  onSettingsChange,
  onStartMatch,
  onResumeMatch,
  canResume,
  assetsReady,
  statusText,
}) => {
  const setMode = (mode: GameMode) => {
    onSettingsChange({ ...settings, mode });
  };

  const setLevel = (level: AiLevel) => {
    onSettingsChange({ ...settings, level });
  };

  const setPens = (pens: number) => {
    onSettingsChange({ ...settings, pens });
  };

  return (
    <div className="w-[min(460px,calc(100vw-28px))] max-h-[calc(100vh-28px)] overflow-y-auto p-6 sm:p-7 rounded-[22px] bg-gradient-to-br from-[#19191d] to-[#101013] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.7),0_0_50px_rgba(220,53,69,0.08)]">
      {/* Badge */}
      <div className="inline-flex mb-2.5 px-2.5 py-1 rounded-full border border-[#dc3545]/40 bg-[#dc3545]/10 text-[#ff9aa4] text-[9px] font-bold tracking-[0.14em]">
        A QUICK TABLETOP DUEL
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/95 to-[#ff9aa4] bg-clip-text text-transparent m-0 mb-2">
        Pen Fighter
      </h1>

      <p className="text-sm text-[#b8b8c0] leading-relaxed m-0">
        Flick your pens across the bench and knock the other player's pens off the edge. The last player with a pen on the table wins.
      </p>

      {/* Opponent Selection */}
      <div className="mt-5">
        <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block">
          Opponent
        </label>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setMode('friend')}
            className={`flex-1 min-h-[42px] px-2 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
              settings.mode === 'friend'
                ? 'bg-[#f5f5f7] text-[#111] font-semibold border-[#f5f5f7] shadow-md'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Friend on this device
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex-1 min-h-[42px] px-2 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
              settings.mode === 'ai'
                ? 'bg-[#f5f5f7] text-[#111] font-semibold border-[#f5f5f7] shadow-md'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            Computer
          </button>
        </div>
      </div>

      {/* Computer Level (if Computer selected) */}
      {settings.mode === 'ai' && (
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block">
            Computer level
          </label>
          <div className="flex gap-2 mt-2">
            {(['easy', 'medium', 'hard'] as AiLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-xl text-xs capitalize font-medium transition-all duration-200 border ${
                  settings.level === lvl
                    ? 'bg-[#f5f5f7] text-[#111] font-semibold border-[#f5f5f7] shadow-md'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pens per side */}
      <div className="mt-5">
        <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block">
          Match format · pens per side
        </label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPens(n)}
              className={`flex-1 min-h-[40px] px-2 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
                settings.pens === n
                  ? 'bg-[#f5f5f7] text-[#111] font-semibold border-[#f5f5f7] shadow-md'
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {n} vs {n}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 sm:p-3.5 border-l-2 border-[#dc3545] rounded-r-xl bg-white/5 text-xs text-[#c7c7ce] leading-relaxed">
        Each side controls all its pens and takes turns shooting one pen at a time. Touch one of your glowing pens, pull back like a slingshot, then let go. Where you touch the pen decides how it spins. A landscape screen works best.
      </div>

      {/* Actions */}
      <button
        type="button"
        disabled={!assetsReady}
        onClick={onStartMatch}
        className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#dc3545] to-[#bd2638] text-white font-bold text-sm sm:text-base shadow-[0_7px_22px_rgba(220,53,69,0.35)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Start match
      </button>

      {canResume && onResumeMatch && (
        <button
          type="button"
          onClick={onResumeMatch}
          className="w-full mt-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium active:scale-[0.98] transition"
        >
          Back to match
        </button>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2 mt-4 text-xs text-[#a1a1aa]">
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            assetsReady ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'
          }`}
        />
        <span>{statusText}</span>
      </div>
    </div>
  );
};
