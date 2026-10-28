import React, { useState } from 'react';
import { GameMode, MatchState, PlayerConfig, PlayerCustomization } from '../types/game';
import { sound } from '../audio/sound';

interface HudProps {
  active: boolean;
  state: MatchState;
  turn: number;
  aliveCounts: [number, number];
  totalPens: number;
  mode: GameMode;
  player1: PlayerCustomization;
  player2: PlayerCustomization;
  players?: PlayerConfig[];
  playerCount?: number;
  isTopView?: boolean;
  onRecenter?: () => void;
  onTopView?: () => void;
  onOpenMenu?: () => void;
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
  players,
  playerCount = 2,
  isTopView = false,
  onRecenter,
  onTopView,
  onOpenMenu,
}) => {
  const [muted, setMuted] = useState(sound.muted);

  if (!active) return null;

  const toggleSound = () => {
    const isMuted = sound.toggleMute();
    setMuted(isMuted);
  };

  const isMulti = players && playerCount > 2;
  const activePlayers = isMulti ? players.slice(0, playerCount) : null;

  const getPlayerName = (p: number) => {
    if (players && players[p]) return players[p].name || `Player ${p + 1}`;
    if (mode === 'practice') return 'Free Practice';
    if (mode === 'ai') return p === 0 ? player1.name || 'You' : 'AI';
    return p === 0 ? player1.name || 'Player 1' : player2.name || 'Player 2';
  };

  const p0Active = active && state !== 'over' && turn === 0;
  const p1Active = active && state !== 'over' && turn === 1;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 pointer-events-none select-none w-full font-['Geist_Mono',monospace]"
      style={{
        paddingTop: 'max(6px, env(safe-area-inset-top))',
        paddingLeft: 'max(8px, env(safe-area-inset-left))',
        paddingRight: 'max(8px, env(safe-area-inset-right))',
      }}
    >
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 max-w-5xl mx-auto w-full">
        {/* Left Cluster: Pause Menu & Sound Toggle */}
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
          {onOpenMenu && (
            <button
              type="button"
              onClick={() => {
                sound.haptic(20);
                onOpenMenu();
              }}
              title="Pause & System Menu"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#050505]/90 border border-[#ff0044]/50 hover:bg-[#ff0044]/15 hover:border-[#ff0044] active:scale-95 text-[#ff0044] text-xs font-['Space_Mono',monospace] font-bold tracking-wider transition shadow-[0_4px_16px_rgba(255,0,68,0.2)] backdrop-blur-md cursor-pointer"
            >
              <span>⏸</span>
              <span className="hidden sm:inline">MENU</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            title="Toggle Audio"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-[#050505]/90 border border-white/20 hover:border-[#ff0044]/60 active:scale-95 text-white text-xs font-['Space_Mono',monospace] transition shadow-md backdrop-blur-md cursor-pointer"
          >
            <span>{muted ? '🔇' : '🔊'}</span>
          </button>
        </div>

        {/* Center: Player pods where ONLY the active turn's name glows */}
        <div className="min-w-0 flex items-center justify-center gap-1.5 sm:gap-4 flex-1 overflow-x-auto no-scrollbar py-0.5">
          {isMulti && activePlayers ? (
            activePlayers.map((p, idx) => {
              const isTurn = active && state !== 'over' && turn === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#050505]/90 border transition-all duration-300 shrink-0 ${
                    isTurn
                      ? 'border-[#ff0044] bg-[#ff0044]/15 shadow-[0_0_18px_rgba(255,0,68,0.45)]'
                      : 'border-white/10 opacity-50 shadow-none'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 transition-transform ${
                      isTurn ? 'scale-125 shadow-[0_0_8px_currentColor] animate-pulse' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: p.color, color: p.color }}
                  />
                  <span
                    className={`font-['Space_Mono',monospace] text-[11px] sm:text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                      isTurn ? 'text-white' : 'text-white/40'
                    }`}
                    style={
                      isTurn
                        ? {
                            textShadow: `0 0 10px #ff0044, 0 0 20px #ff0044, 0 0 30px rgba(255,0,68,0.8)`,
                          }
                        : undefined
                    }
                  >
                    {p.name || `P${idx + 1}`}
                  </span>
                </div>
              );
            })
          ) : (
            <>
              {/* Part 1: Player 1 */}
              <div
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[#050505]/90 border transition-all duration-300 shrink-0 ${
                  p0Active
                    ? 'border-[#ff0044] bg-[#ff0044]/15 shadow-[0_0_20px_rgba(255,0,68,0.45)]'
                    : 'border-white/10 opacity-50 shadow-none'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-transform ${
                    p0Active ? 'scale-125 shadow-[0_0_8px_#ff0044] animate-pulse' : 'opacity-40'
                  }`}
                  style={{ backgroundColor: player1.color || '#ff0044' }}
                />
                <span
                  className={`font-['Space_Mono',monospace] text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 ${
                    p0Active ? 'text-white' : 'text-white/40'
                  }`}
                  style={
                    p0Active
                      ? {
                          textShadow: `0 0 10px #ff0044, 0 0 20px #ff0044, 0 0 30px rgba(255,0,68,0.8)`,
                        }
                      : undefined
                  }
                >
                  {getPlayerName(0)}
                </span>

                {/* Multi-pen Pips */}
                {totalPens > 1 && (
                  <div className="flex items-center gap-1 ml-1">
                    {Array.from({ length: totalPens }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i < aliveCounts[0] ? 'shadow-[0_0_6px_currentColor]' : 'border border-white/20 opacity-20'
                        }`}
                        style={{
                          backgroundColor: i < aliveCounts[0] ? player1.color : 'transparent',
                          color: player1.color,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Part 2: Player 2 */}
              {mode !== 'practice' && (
                <div
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[#050505]/90 border transition-all duration-300 shrink-0 ${
                    p1Active
                      ? 'border-[#ff0044] bg-[#ff0044]/15 shadow-[0_0_20px_rgba(255,0,68,0.45)]'
                      : 'border-white/10 opacity-50 shadow-none'
                  }`}
                >
                  {/* Multi-pen Pips */}
                  {totalPens > 1 && (
                    <div className="flex items-center gap-1 mr-1">
                      {Array.from({ length: totalPens }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i < aliveCounts[1] ? 'shadow-[0_0_6px_currentColor]' : 'border border-white/20 opacity-20'
                          }`}
                          style={{
                            backgroundColor: i < aliveCounts[1] ? player2.color : 'transparent',
                            color: player2.color,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <span
                    className={`font-['Space_Mono',monospace] text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-300 ${
                      p1Active ? 'text-white' : 'text-white/40'
                    }`}
                    style={
                      p1Active
                        ? {
                            textShadow: `0 0 10px #ff0044, 0 0 20px #ff0044, 0 0 30px rgba(255,0,68,0.8)`,
                          }
                        : undefined
                    }
                  >
                    {getPlayerName(1)}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 transition-transform ${
                      p1Active ? 'scale-125 shadow-[0_0_8px_#ff0044] animate-pulse' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: player2.color || '#ff0044' }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Cluster: Recenter & Top View Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
          {onTopView && (
            <button
              type="button"
              onClick={() => {
                sound.haptic(15);
                onTopView();
              }}
              title="Toggle Top View Camera"
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 border text-xs font-['Space_Mono',monospace] font-bold transition active:scale-95 shadow-md backdrop-blur-md cursor-pointer ${
                isTopView
                  ? 'border-[#ff0044] bg-[#ff0044]/25 text-[#ff0044] ring-1 ring-[#ff0044]/50 shadow-[0_0_14px_rgba(255,0,68,0.4)]'
                  : 'border-white/20 bg-[#050505]/90 hover:border-[#ff0044]/60 text-white'
              }`}
            >
              <span className="text-sm">📐</span>
              <span className="hidden md:inline">TOP</span>
            </button>
          )}

          {onRecenter && (
            <button
              type="button"
              onClick={() => {
                sound.haptic(15);
                onRecenter();
              }}
              title="Recenter Camera Behind Active Pen"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-[#050505]/90 border border-white/20 hover:border-[#ff0044]/60 active:scale-95 text-white text-xs font-['Space_Mono',monospace] font-bold transition shadow-md backdrop-blur-md cursor-pointer"
            >
              <span className="text-sm">🎯</span>
              <span className="hidden md:inline">RECENTER</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
