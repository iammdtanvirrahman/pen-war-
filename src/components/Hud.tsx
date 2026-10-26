import React from 'react';
import { GameMode, MatchState, PlayerCustomization } from '../types/game';

interface HudProps {
  active: boolean;
  state: MatchState;
  turn: number;
  aliveCounts: [number, number];
  totalPens: number;
  mode: GameMode;
  player1: PlayerCustomization;
  player2: PlayerCustomization;
}

export const Hud: React.FC<HudProps> = ({
  active,
  state,
  turn,
  aliveCounts,
  totalPens,
  mode,
  player1,
  player2,
}) => {
  if (!active) return null;

  const getPlayerName = (p: number) => {
    if (mode === 'practice') return 'Free Practice';
    if (mode === 'ai') return p === 0 ? 'You' : 'AI';
    return p === 0 ? player1.name || 'Player 1' : player2.name || 'Player 2';
  };

  const isAiTurn = mode === 'ai' && turn === 1;

  let turnText = '';
  if (mode === 'practice') {
    turnText = 'Practice Mode · Flick any pen freely';
  } else if (state === 'aim') {
    turnText = isAiTurn
      ? 'AI is lining up a shot…'
      : mode === 'ai'
      ? 'Your turn'
      : `${getPlayerName(turn)}'s turn`;
  } else if (state === 'moving') {
    turnText = 'Pens sliding…';
  } else if (state === 'over') {
    turnText = 'Match over';
  }

  const p0Active = active && state !== 'over' && turn === 0;
  const p1Active = active && state !== 'over' && turn === 1;

  return (
    <div
      className="fixed z-20 top-2 sm:top-3 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between gap-2 pointer-events-none text-xs"
      style={{
        top: 'max(8px, env(safe-area-inset-top))',
        left: 'max(10px, env(safe-area-inset-left))',
        right: 'max(10px, env(safe-area-inset-right))',
      }}
    >
      {/* Player 1 (Red / You) */}
      <div
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b0b0dd9] border backdrop-blur-md transition-all duration-300 ${
          p0Active ? 'scale-105' : 'opacity-85 border-white/10'
        }`}
        style={
          p0Active
            ? {
                borderColor: player1.color,
                boxShadow: `0 0 16px ${player1.color}88, inset 0 0 10px ${player1.color}22`,
              }
            : undefined
        }
      >
        <span
          className="w-2.5 h-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: player1.color }}
        />
        <span className="font-bold tracking-tight" style={{ color: player1.color }}>
          {getPlayerName(0)}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalPens }).map((_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < aliveCounts[0]
                  ? ''
                  : 'bg-transparent border border-white/30 opacity-30'
              }`}
              style={{
                backgroundColor: i < aliveCounts[0] ? player1.color : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      {/* Center Turn Label */}
      <div
        className="flex items-center justify-center px-4 py-1.5 rounded-full bg-[#0b0b0dd9] border backdrop-blur-md text-[#f5f5f7] max-w-[46vw] truncate text-center font-semibold shadow-md transition-all duration-300"
        style={{
          borderColor: (turn === 0 ? player1.color : player2.color) + '66',
          boxShadow: `0 0 14px ${(turn === 0 ? player1.color : player2.color)}26`,
        }}
      >
        {turnText}
      </div>

      {/* Player 2 (Blue / AI) */}
      {mode !== 'practice' && (
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0b0b0dd9] border backdrop-blur-md transition-all duration-300 ${
            p1Active ? 'scale-105' : 'opacity-85 border-white/10'
          }`}
          style={
            p1Active
              ? {
                  borderColor: player2.color,
                  boxShadow: `0 0 16px ${player2.color}88, inset 0 0 10px ${player2.color}22`,
                }
              : undefined
          }
        >
          <div className="flex gap-1">
            {Array.from({ length: totalPens }).map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < aliveCounts[1]
                    ? ''
                    : 'bg-transparent border border-white/30 opacity-30'
                }`}
                style={{
                  backgroundColor: i < aliveCounts[1] ? player2.color : 'transparent',
                }}
              />
            ))}
          </div>
          <span className="font-bold tracking-tight" style={{ color: player2.color }}>
            {getPlayerName(1)}
          </span>
          <span
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: player2.color }}
          />
        </div>
      )}
    </div>
  );
};
