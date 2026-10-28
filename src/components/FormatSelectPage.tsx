import React from 'react';
import { MatchFormat } from '../types/game';
import { sound } from '../audio/sound';

interface FormatSelectPageProps {
  onSelectFormat: (format: MatchFormat) => void;
  onBack: () => void;
}

export const FormatSelectPage: React.FC<FormatSelectPageProps> = ({
  onSelectFormat,
  onBack,
}) => {
  const handleSelect = (format: MatchFormat) => {
    sound.haptic(20);
    sound.click();
    onSelectFormat(format);
  };

  const handleBack = () => {
    sound.haptic(10);
    sound.click();
    onBack();
  };

  return (
    <div className="fixed inset-0 z-40 h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-[#050505] text-[#ffffff] font-['Geist_Mono',monospace] select-none pointer-events-auto">
      {/* Tactical HUD Grid */}
      <div className="tactical-layer" />

      {/* Header */}
      <header
        className="px-4 sm:px-8 py-2.5 sm:py-3.5 flex justify-between items-center z-10 shrink-0 border-b border-white/[0.08]"
        style={{
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="bg-transparent text-white/70 hover:text-white border border-white/20 hover:border-[#ff0044] px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
        >
          <span>←</span>
          <span>Title Screen</span>
        </button>

        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#ff0044] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0044] animate-pulse" />
          <span>STEP 01 // FORMAT</span>
        </div>
      </header>

      {/* Main Selection Body */}
      <main
        className="flex-1 min-h-0 flex flex-col justify-center items-center px-4 sm:px-8 py-3 max-w-4xl mx-auto w-full z-10 text-center"
        style={{
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <div className="mb-4 sm:mb-6">
          <h1 className="font-['Oswald',sans-serif] text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight text-white m-0">
            Select Combat Format
          </h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1 uppercase tracking-wider">
            Choose between individual free-for-all or squad tactical clash
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl">
          {/* Format 1: Single Duel */}
          <button
            type="button"
            onClick={() => handleSelect('single')}
            className="group relative bg-white/[0.03] hover:bg-[#ff0044]/[0.08] border border-white/15 hover:border-[#ff0044] p-5 sm:p-7 flex flex-col items-start text-left transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(255,0,68,0.25)]"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[10px] font-bold text-[#ff0044] tracking-[0.2em] uppercase">
                [01] FREE-FOR-ALL
              </span>
              <span className="text-[10px] bg-[#ff0044]/20 border border-[#ff0044]/40 text-[#ff0044] px-2 py-0.5 uppercase font-bold">
                2 - 6 Players
              </span>
            </div>

            <h2 className="font-['Oswald',sans-serif] text-2xl sm:text-3xl uppercase text-white m-0 group-hover:text-[#ff0044] transition-colors">
              Single Duel
            </h2>

            <p className="text-white/50 text-xs mt-2 leading-relaxed font-sans">
              Every combatant for themselves. Select 2, 3, 4, 5, or 6 players. Flick, ricochet, and be the last pen remaining on the table.
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-between text-[11px] font-bold uppercase text-white/70 group-hover:text-white">
              <span>Configure Players</span>
              <span className="text-[#ff0044]">Select →</span>
            </div>
          </button>

          {/* Format 2: Team Battle */}
          <button
            type="button"
            onClick={() => handleSelect('team')}
            className="group relative bg-white/[0.03] hover:bg-[#ff0044]/[0.08] border border-white/15 hover:border-[#ff0044] p-5 sm:p-7 flex flex-col items-start text-left transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(255,0,68,0.25)]"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-[10px] font-bold text-[#4cc9f0] tracking-[0.2em] uppercase">
                [02] SQUAD TACTICS
              </span>
              <span className="text-[10px] bg-[#4cc9f0]/20 border border-[#4cc9f0]/40 text-[#4cc9f0] px-2 py-0.5 uppercase font-bold">
                Red vs Blue
              </span>
            </div>

            <h2 className="font-['Oswald',sans-serif] text-2xl sm:text-3xl uppercase text-white m-0 group-hover:text-[#4cc9f0] transition-colors">
              Team Battle
            </h2>

            <p className="text-white/50 text-xs mt-2 leading-relaxed font-sans">
              Classic team showdown. Coordinate multi-pen tactics to eliminate the opposing team's pens from the arena bench.
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 w-full flex items-center justify-between text-[11px] font-bold uppercase text-white/70 group-hover:text-white">
              <span>Squad Formations</span>
              <span className="text-[#4cc9f0]">Select →</span>
            </div>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-8 py-2 sm:py-3 flex justify-between items-center border-t border-white/[0.08] z-10 shrink-0 text-[9px] sm:text-[10px] tracking-wider text-white/40 uppercase"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <span>Tactical Match Formation</span>
        <span className="text-[#ff0044] font-bold">PF // ARENA</span>
      </footer>
    </div>
  );
};
