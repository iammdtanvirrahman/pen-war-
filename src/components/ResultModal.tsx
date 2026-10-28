import React, { useEffect } from 'react';
import { GameMode, PlayerConfig, PlayerCustomization } from '../types/game';
import { sound } from '../audio/sound';

interface ResultModalProps {
  winner: number; // 0, 1, 2... or -1 (draw)
  remainingPens: number;
  totalPens: number;
  mode: GameMode;
  player1: PlayerCustomization;
  player2: PlayerCustomization;
  players?: PlayerConfig[];
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  winner,
  remainingPens,
  totalPens,
  mode,
  player1,
  player2,
  players,
  onPlayAgain,
  onChangeSettings,
}) => {
  // Listen for Enter or Space to play again
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onPlayAgain();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayAgain]);

  let headline = '';
  let subtext = '';
  let winnerColor = '#ffffff';
  let badgeText = 'Match Concluded';
  let isDraw = false;

  if (winner < 0) {
    headline = 'Match Draw!';
    subtext = 'All pens fell over the table edge into the void.';
    badgeText = 'Draw';
    isDraw = true;
  } else if (players && players[winner]) {
    const winPlayer = players[winner];
    headline = `${winPlayer.name || `Player ${winner + 1}`} Wins!`;
    subtext = `${winPlayer.name || `Player ${winner + 1}`} eliminated all rival pens in the arena!`;
    winnerColor = winPlayer.color || '#ff0044';
    badgeText = `${winPlayer.name || `Player ${winner + 1}`} Champion`;
  } else if (mode === 'ai') {
    if (winner === 0) {
      headline = 'Victory!';
      subtext = `Outstanding shooting! You knocked all AI pens off the table with ${remainingPens} of ${totalPens} pens standing.`;
      winnerColor = player1.color;
      badgeText = 'You Won!';
    } else {
      headline = 'AI Defeat!';
      subtext = 'The computer eliminated your squad. Calibrate your slingshot angles and fight back!';
      winnerColor = player2.color;
      badgeText = 'Computer Won';
    }
  } else {
    const winnerName = winner === 0 ? player1.name || 'Player 1' : player2.name || 'Player 2';
    headline = `${winnerName} Wins!`;
    subtext = `Dominant tabletop victory with ${remainingPens} of ${totalPens} ${
      remainingPens === 1 ? 'pen' : 'pens'
    } remaining on the bench.`;
    winnerColor = winner === 0 ? player1.color : player2.color;
    badgeText = `${winnerName} Champion`;
  }

  return (
    <div className="w-[min(480px,calc(100vw-24px))] max-h-[calc(100vh-28px)] overflow-y-auto p-6 sm:p-8 bg-[#050505] border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(255,0,68,0.2)] text-center animate-in fade-in duration-200 text-white select-none font-['Geist_Mono',monospace]">
      {/* Top Victory Badge */}
      <div
        className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 border font-['Space_Mono',monospace] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase"
        style={{
          borderColor: isDraw ? '#ffffff40' : winnerColor + '80',
          backgroundColor: isDraw ? '#ffffff10' : winnerColor + '20',
          color: isDraw ? '#ffffff' : winnerColor,
        }}
      >
        <span>{isDraw ? '// DRAW' : '// VICTORY'}</span>
        <span>[{badgeText}]</span>
      </div>

      <h1
        className="font-['Oswald',sans-serif] text-4xl sm:text-5xl font-bold uppercase tracking-tight m-0 mb-2 drop-shadow-md"
        style={{ color: isDraw ? '#ffffff' : winnerColor }}
      >
        {headline}
      </h1>

      <p className="text-xs sm:text-sm text-white/60 leading-relaxed m-0 mb-6 max-w-sm mx-auto">
        {subtext}
      </p>

      {/* Match Stats Summary Pod */}
      <div className="grid grid-cols-2 gap-2.5 mb-6 text-left">
        <div className="p-3 bg-[#080808] border border-white/10 font-['Space_Mono',monospace]">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
            SURVIVING_PENS
          </div>
          <div className="text-base font-bold text-white tabular-nums mt-0.5">
            {remainingPens} <span className="text-xs text-white/40 font-normal">/ {totalPens}</span>
          </div>
        </div>

        <div className="p-3 bg-[#080808] border border-white/10 font-['Space_Mono',monospace]">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
            DUEL_FORMAT
          </div>
          <div className="text-base font-bold text-white uppercase mt-0.5">
            {totalPens === 1 ? '1v1 Duel' : `${totalPens}v${totalPens} Team`}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => {
            sound.haptic(25);
            onPlayAgain();
          }}
          className="w-full py-3.5 px-4 bg-[#ff0044] hover:brightness-110 active:scale-[0.98] text-white font-['Oswald',sans-serif] font-bold text-base uppercase tracking-tight shadow-[0_4px_20px_rgba(255,0,68,0.4)] transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Rematch // Play Again</span>
          <span className="font-['Space_Mono',monospace] text-xs">➔</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.haptic(15);
            onChangeSettings();
          }}
          className="w-full py-2.5 px-4 border border-white/15 bg-white/5 hover:bg-white/10 text-white font-['Space_Mono',monospace] text-xs uppercase tracking-wider active:scale-[0.98] transition cursor-pointer"
        >
          Change Mode & Armory
        </button>
      </div>
    </div>
  );
};
