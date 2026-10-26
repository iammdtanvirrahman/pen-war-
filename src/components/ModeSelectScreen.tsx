import React from 'react';
import { GameMode } from '../types/game';

interface ModeSelectScreenProps {
  onSelectMode: (mode: GameMode) => void;
  assetsReady: boolean;
  statusText: string;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({
  onSelectMode,
  assetsReady,
  statusText,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#080808b0] via-[#080808cc] to-[#080808f0] backdrop-blur-[6px] animate-in fade-in duration-300">
      <div className="max-w-[480px] w-full text-center">
        {/* Top Tagline */}
        <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full border border-[#dc3545]/40 bg-[#dc3545]/10 text-[#ff9aa4] text-[10px] font-bold tracking-[0.16em] uppercase">
          Tabletop Physics Duel
        </div>

        {/* Title Lockup */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white m-0 drop-shadow-xl">
          PEN <span className="bg-gradient-to-r from-[#dc3545] to-[#f87171] bg-clip-text text-transparent">FIGHTER</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#b8b8c0] mt-2 mb-7 max-w-sm mx-auto leading-relaxed">
          Flick authentic pens across the wooden table with real physics. Knock opponent pens off the edge to win!
        </p>

        {/* Mode Cards */}
        <div className="space-y-3 text-left">
          {/* Local Play */}
          <button
            type="button"
            disabled={!assetsReady}
            onClick={() => onSelectMode('friend')}
            className="w-full group p-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/15 hover:border-white/30 text-white transition-all duration-200 active:scale-[0.98] shadow-lg flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ff4d5e] to-[#bd2638] flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                ⚔️
              </div>
              <div>
                <div className="font-bold text-base text-white flex items-center gap-2">
                  Local Play
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff4d5e]/20 text-[#ff9aa4] border border-[#ff4d5e]/30 font-semibold">
                    Pass & Play
                  </span>
                </div>
                <div className="text-xs text-[#a1a1aa] mt-0.5">
                  Play with friends on this device · Single duel or Team battle
                </div>
              </div>
            </div>
            <span className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all text-lg font-bold pr-1">
              ➔
            </span>
          </button>

          {/* AI Battle */}
          <button
            type="button"
            disabled={!assetsReady}
            onClick={() => onSelectMode('ai')}
            className="w-full group p-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/15 hover:border-white/30 text-white transition-all duration-200 active:scale-[0.98] shadow-lg flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#4cc9f0] to-[#0284c7] flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
                🤖
              </div>
              <div>
                <div className="font-bold text-base text-white flex items-center gap-2">
                  AI Battle
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4cc9f0]/20 text-[#7dd3fc] border border-[#4cc9f0]/30 font-semibold">
                    vs Computer
                  </span>
                </div>
                <div className="text-xs text-[#a1a1aa] mt-0.5">
                  Challenge intelligent computer opponents with adjustable skill
                </div>
              </div>
            </div>
            <span className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all text-lg font-bold pr-1">
              ➔
            </span>
          </button>

          {/* Target Practice */}
          <button
            type="button"
            disabled={!assetsReady}
            onClick={() => onSelectMode('practice')}
            className="w-full group p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5 border border-white/10 hover:border-white/20 text-white transition-all duration-200 active:scale-[0.98] shadow-md flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                🎯
              </div>
              <div>
                <div className="font-bold text-base text-white/90">
                  Target Practice
                </div>
                <div className="text-xs text-[#a1a1aa] mt-0.5">
                  Free shoot mode to master power, slingshot aiming and spin
                </div>
              </div>
            </div>
            <span className="text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all text-lg font-bold pr-1">
              ➔
            </span>
          </button>
        </div>

        {/* Loading / Ready Status */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#a1a1aa]">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              assetsReady ? 'bg-[#22c55e]' : 'bg-[#f59e0b] animate-ping'
            }`}
          />
          <span>{statusText}</span>
        </div>
      </div>
    </div>
  );
};
