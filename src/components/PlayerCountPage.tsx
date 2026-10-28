import React from 'react';
import { MatchFormat } from '../types/game';
import { sound } from '../audio/sound';

interface PlayerCountPageProps {
  format: MatchFormat;
  selectedCount: number;
  onSelectCount: (count: number) => void;
  onBack: () => void;
}

export const PlayerCountPage: React.FC<PlayerCountPageProps> = ({
  format,
  selectedCount,
  onSelectCount,
  onBack,
}) => {
  const isSingle = format === 'single';

  const singleOptions = [
    { count: 2, label: '2 Players', tag: '1v1 Classic Duel', desc: 'Direct face-to-face showdown across the tabletop.' },
    { count: 3, label: '3 Players', tag: 'Triangle Crossfire', desc: 'Three combatants positioned in a tight perimeter.' },
    { count: 4, label: '4 Players', tag: 'Quadrant Carnage', desc: 'Four pens in four corners. Fast-paced elimination.' },
    { count: 5, label: '5 Players', tag: 'Pentagon Rumble', desc: 'Five-way battle of angles and tactical rebounds.' },
    { count: 6, label: '6 Players', tag: 'Maximum Chaos', desc: 'Six pens circling the arena bench. Pure mayhem.' },
  ];

  const teamOptions = [
    { count: 2, label: '2 vs 2', tag: '4 Pens Total', desc: 'Two players on Red Squad, two players on Blue Squad.' },
    { count: 3, label: '3 vs 3', tag: '6 Pens Total', desc: 'Three pens per squad in an epic tactical team war.' },
  ];

  const options = isSingle ? singleOptions : teamOptions;

  const handleChoose = (count: number) => {
    sound.haptic(20);
    sound.click();
    onSelectCount(count);
  };

  const handleBack = () => {
    sound.haptic(10);
    sound.click();
    onBack();
  };

  return (
    <div className="fixed inset-0 z-40 h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-[#050505] text-[#ffffff] font-['Geist_Mono',monospace] select-none pointer-events-auto">
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
          <span>Format Select</span>
        </button>

        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#ff0044] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0044] animate-pulse" />
          <span>STEP 02 // COMBATANTS</span>
        </div>
      </header>

      {/* Main Options Grid */}
      <main
        className="flex-1 min-h-0 flex flex-col justify-center items-center px-4 sm:px-8 py-3 max-w-4xl mx-auto w-full z-10 text-center overflow-y-auto"
        style={{
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <div className="mb-4 sm:mb-6 shrink-0">
          <h1 className="font-['Oswald',sans-serif] text-3xl sm:text-5xl uppercase tracking-tight text-white m-0">
            {isSingle ? 'Select Player Count' : 'Select Squad Size'}
          </h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1 uppercase tracking-wider">
            {isSingle
              ? 'Choose 2, 3, 4, 5, or 6 combatants for the Free-For-All arena'
              : 'Select the number of pens deployed per team'}
          </p>
        </div>

        {/* Options list */}
        <div className={`grid gap-3 w-full max-w-3xl ${isSingle ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 max-w-xl'}`}>
          {options.map((opt) => {
            const isSelected = selectedCount === opt.count;
            return (
              <button
                key={opt.count}
                type="button"
                onClick={() => handleChoose(opt.count)}
                className={`group relative p-3.5 sm:p-5 flex flex-col items-center justify-between border transition-all duration-200 active:scale-[0.97] cursor-pointer text-center ${
                  isSelected
                    ? 'bg-[#ff0044]/20 border-[#ff0044] shadow-[0_0_24px_rgba(255,0,68,0.4)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/15 hover:border-white/40'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/50 group-hover:text-white/80">
                  {opt.tag}
                </div>

                <div className="my-2 sm:my-3">
                  <div className="font-['Oswald',sans-serif] text-3xl sm:text-4xl uppercase text-white font-bold group-hover:text-[#ff0044] transition-colors">
                    {opt.label}
                  </div>
                </div>

                <div className="text-[10px] text-white/40 leading-tight line-clamp-2">
                  {opt.desc}
                </div>

                <div className={`mt-3 text-[10px] font-bold uppercase tracking-wider py-1 px-2 w-full border ${
                  isSelected
                    ? 'bg-[#ff0044] text-white border-[#ff0044]'
                    : 'bg-transparent text-white/60 border-white/20 group-hover:border-white/50 group-hover:text-white'
                }`}>
                  {isSelected ? 'Selected ✓' : 'Select'}
                </div>
              </button>
            );
          })}
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
        <span>Combatant Capacity: 2 to 6 Players</span>
        <span className="text-[#ff0044] font-bold">NEXT: ROSTER ARMORY</span>
      </footer>
    </div>
  );
};
