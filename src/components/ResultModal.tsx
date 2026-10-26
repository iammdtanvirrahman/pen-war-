import React from 'react';
import { GameMode, PlayerCustomization } from '../types/game';

interface ResultModalProps {
  winner: number; // 0, 1, or -1 (draw)
  remainingPens: number;
  mode: GameMode;
  player1: PlayerCustomization;
  player2: PlayerCustomization;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  winner,
  remainingPens,
  mode,
  player1,
  player2,
  onPlayAgain,
  onChangeSettings,
}) => {
  let title = '';
  let subtitle = '';
  let winnerColor = '#ffffff';

  if (winner < 0) {
    title = 'Draw!';
    subtitle = 'Both sides lost their last pen over the edge.';
  } else if (mode === 'ai') {
    title = winner === 0 ? 'Victory!' : 'AI Wins!';
    subtitle =
      winner === 0
        ? `Incredible flicking! ${remainingPens} ${remainingPens === 1 ? 'pen' : 'pens'} remained on the table.`
        : `The AI knocked your pens off. Try another round!`;
    winnerColor = winner === 0 ? player1.color : player2.color;
  } else {
    const winnerName = winner === 0 ? player1.name || 'Player 1' : player2.name || 'Player 2';
    title = `${winnerName} Wins!`;
    subtitle = `${remainingPens} ${remainingPens === 1 ? 'pen' : 'pens'} left standing on the bench.`;
    winnerColor = winner === 0 ? player1.color : player2.color;
  }

  return (
    <div className="w-[min(460px,calc(100vw-28px))] max-h-[calc(100vh-28px)] overflow-y-auto p-6 sm:p-7 rounded-[24px] bg-gradient-to-br from-[#19191d] to-[#101013] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_50px_rgba(220,53,69,0.15)] text-center animate-in fade-in duration-300">
      <div className="inline-flex mb-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-[10px] font-bold tracking-[0.14em] uppercase text-white/70">
        Match Concluded
      </div>

      <h1
        className="text-3xl sm:text-4xl font-black tracking-tight m-0 mb-2 drop-shadow"
        style={{ color: winnerColor }}
      >
        {title}
      </h1>

      <p className="text-sm text-[#b8b8c0] leading-relaxed m-0 mb-6">
        {subtitle}
      </p>

      <button
        type="button"
        onClick={onPlayAgain}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#dc3545] to-[#bd2638] text-white font-bold text-sm sm:text-base shadow-[0_7px_22px_rgba(220,53,69,0.35)] hover:brightness-110 active:scale-[0.98] transition-all"
      >
        Play Again (Rematch)
      </button>

      <button
        type="button"
        onClick={onChangeSettings}
        className="w-full mt-2.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium active:scale-[0.98] transition"
      >
        Choose Different Mode & Pens
      </button>
    </div>
  );
};
