import React, { useState } from 'react';
import { AiLevel, GameSettings, PenModelType, PlayerConfig } from '../types/game';
import { ALL_PLAYER_COLORS, PEN_MODELS } from '../game/constants';
import { sound } from '../audio/sound';
import { PenPreview3D } from './PenPreview3D';

interface PlayerRosterPageProps {
  settings: GameSettings;
  onUpdatePlayer: (idx: number, updates: Partial<PlayerConfig>) => void;
  onStartMatch: () => void;
  onBack: () => void;
  assetsReady: boolean;
}

export const PlayerRosterPage: React.FC<PlayerRosterPageProps> = ({
  settings,
  onUpdatePlayer,
  onStartMatch,
  onBack,
  assetsReady,
}) => {
  const [selectedPlayerIdx, setSelectedPlayerIdx] = useState(0);

  const players = settings.players.slice(0, settings.playerCount);
  const currentPlayer = players[selectedPlayerIdx] || players[0];

  const handleSelectTab = (idx: number) => {
    sound.haptic(15);
    sound.click();
    setSelectedPlayerIdx(idx);
  };

  const handleToggleIsAi = (isAi: boolean) => {
    sound.haptic(20);
    sound.click();
    onUpdatePlayer(selectedPlayerIdx, { isAi });
  };

  const handleSetAiLevel = (aiLevel: AiLevel) => {
    sound.haptic(15);
    sound.click();
    onUpdatePlayer(selectedPlayerIdx, { aiLevel });
  };

  const handleSelectPenModel = (model: PenModelType) => {
    sound.haptic(20);
    sound.click();
    onUpdatePlayer(selectedPlayerIdx, { model });
  };

  const handleSelectColor = (color: string) => {
    sound.haptic(15);
    sound.click();
    onUpdatePlayer(selectedPlayerIdx, { color });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePlayer(selectedPlayerIdx, { name: e.target.value });
  };

  const handleLaunch = () => {
    sound.haptic(30);
    sound.click();
    onStartMatch();
  };

  const selectedModelOption = PEN_MODELS.find((m) => m.id === currentPlayer?.model) || PEN_MODELS[0];

  return (
    <div className="fixed inset-0 z-40 h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-[#050505] text-[#ffffff] font-['Geist_Mono',monospace] select-none pointer-events-auto">
      <div className="tactical-layer" />

      {/* Top Header */}
      <header
        className="px-4 sm:px-8 py-2 sm:py-3 flex justify-between items-center z-10 shrink-0 border-b border-white/[0.08]"
        style={{
          paddingTop: 'max(8px, env(safe-area-inset-top))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="bg-transparent text-white/70 hover:text-white border border-white/20 hover:border-[#ff0044] px-2.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>←</span>
          <span>Player Count</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#ff0044] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff0044] animate-pulse" />
            <span>STEP 03 // ROSTER & ARMORY</span>
          </div>
          <span className="text-[10px] text-white/40 uppercase hidden sm:inline">
            ({settings.playerCount} Combatants)
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className="flex-1 min-h-0 flex flex-col px-3 sm:px-8 py-2 max-w-5xl mx-auto w-full z-10 overflow-hidden"
        style={{
          paddingLeft: 'max(12px, env(safe-area-inset-left))',
          paddingRight: 'max(12px, env(safe-area-inset-right))',
        }}
      >
        {/* Player Switcher Tabs */}
        <div className="shrink-0 mb-3">
          <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1.5">
            Select Combatant To Configure:
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {players.map((p, idx) => {
              const isSelected = selectedPlayerIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTab(idx)}
                  className={`shrink-0 px-3 py-1.5 border transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#ff0044]/20 border-[#ff0044] shadow-[0_0_15px_rgba(255,0,68,0.3)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/15'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="text-left">
                    <div className="text-[11px] font-bold uppercase tracking-tight text-white leading-none">
                      {p.name || `P${idx + 1}`}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-white/50 leading-tight">
                      {p.isAi ? '🤖 AI' : '👤 Human'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Player Details Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 flex-1 min-h-0">
          {/* Left Column: Player Identity & Operator Type (Human vs AI) */}
          <div className="lg:col-span-5 flex flex-col gap-2 bg-white/[0.02] border border-white/10 p-2.5 sm:p-3 min-h-0">
            {/* Player Name and Color Header */}
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#ff0044] mb-1">
                Combatant #{selectedPlayerIdx + 1}
              </div>
              <input
                type="text"
                value={currentPlayer?.name || ''}
                onChange={handleNameChange}
                maxLength={16}
                placeholder={`Player ${selectedPlayerIdx + 1}`}
                className="w-full bg-[#0d0d0d] border border-white/20 focus:border-[#ff0044] text-white px-3 py-1.5 text-sm font-bold uppercase tracking-wider outline-none transition"
              />
            </div>

            {/* Operator Selection: Human vs AI */}
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1.5 flex justify-between">
                <span>Control Mode</span>
                <span className="text-[#ff0044] font-bold">{currentPlayer?.isAi ? 'AI Bot' : 'Human Pass & Play'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleIsAi(false)}
                  className={`py-2 px-3 border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !currentPlayer?.isAi
                      ? 'bg-[#ff0044] border-[#ff0044] text-white shadow-[0_0_16px_rgba(255,0,68,0.4)]'
                      : 'bg-white/[0.03] border-white/15 text-white/60 hover:text-white'
                  }`}
                >
                  <span>👤 Human</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleIsAi(true)}
                  className={`py-2 px-3 border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    currentPlayer?.isAi
                      ? 'bg-[#ff0044] border-[#ff0044] text-white shadow-[0_0_16px_rgba(255,0,68,0.4)]'
                      : 'bg-white/[0.03] border-white/15 text-white/60 hover:text-white'
                  }`}
                >
                  <span>🤖 AI Bot</span>
                </button>
              </div>

              {/* If AI is selected: Difficulty Level */}
              {currentPlayer?.isAi && (
                <div className="mt-2.5 p-2 bg-[#0c0c0c] border border-white/10">
                  <div className="text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1.5">
                    AI Difficulty Tier:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['easy', 'medium', 'hard'] as AiLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleSetAiLevel(level)}
                        className={`py-1 text-[10px] font-bold uppercase border transition cursor-pointer ${
                          currentPlayer?.aiLevel === level
                            ? 'bg-[#ff0044]/30 border-[#ff0044] text-[#ff0044]'
                            : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Color Swatch Selector */}
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1.5">
                Pen Accent & Table Halo
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_PLAYER_COLORS.map((hex) => {
                  const isColorSelected = currentPlayer?.color === hex;
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleSelectColor(hex)}
                      className={`w-7 h-7 rounded-sm border-2 transition-transform cursor-pointer ${
                        isColorSelected
                          ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  );
                })}
              </div>
            </div>

            {/* Active Pen Preview Spec Card */}
            <div className="mt-auto pt-2 border-t border-white/10">
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">
                Equipped 3D Pen
              </div>
              <div className="font-['Oswald',sans-serif] text-base text-white uppercase font-bold">
                {selectedModelOption.name}
              </div>
              <div className="text-[10px] text-white/50 font-sans mt-0.5 line-clamp-2">
                {selectedModelOption.description}
              </div>
            </div>
          </div>

          {/* Right Column: Pen Model Armory with LOADED ASSET IMAGES */}
          <div className="lg:col-span-7 flex flex-col bg-white/[0.02] border border-white/10 p-2.5 sm:p-3 min-h-0 overflow-hidden">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#ff0044] mb-1.5 flex items-center justify-between">
              <span>PEN ARMORY (SELECT WITH ASSET PREVIEW)</span>
              <span className="text-white/40 font-normal">4 MODELS LOADED</span>
            </div>

            {/* 4 Pen Model Visual Cards with LOADED IMAGE ASSETS */}
            <div className="grid grid-cols-2 gap-2">
              {PEN_MODELS.map((m) => {
                const isSelected = currentPlayer?.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectPenModel(m.id)}
                    className={`group relative p-2 border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer min-w-0 ${
                      isSelected
                        ? 'bg-[#ff0044]/15 border-[#ff0044] shadow-[0_0_20px_rgba(255,0,68,0.3)]'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/15 hover:border-white/40'
                    }`}
                  >
                    {/* Top Label & Source */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase text-white group-hover:text-[#ff0044] transition-colors">
                        {m.name}
                      </span>
                      <span className={`text-[8px] px-1 py-0.5 font-bold uppercase ${
                        isSelected ? 'bg-[#ff0044] text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        {isSelected ? 'ACTIVE' : m.subtitle}
                      </span>
                    </div>

                    {/* LOADED PEN ASSET PREVIEW IMAGE */}
                    <div className="w-full h-16 sm:h-20 my-1 bg-[#080808] border border-white/10 flex items-center justify-center p-1 overflow-hidden relative group-hover:border-[#ff0044]/50 transition-colors">
                      <PenPreview3D model={m.id} color={currentPlayer?.color || '#ff4d5e'} />
                    </div>

                    {/* Stat Bars: Speed, Weight, Spin */}
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10 text-[8px] uppercase text-white/60">
                      <div>
                        <div className="text-[7px] text-white/40">Speed</div>
                        <div className="font-bold text-white">{(m.speedFactor * 10).toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-[7px] text-white/40">Weight</div>
                        <div className="font-bold text-white">{(m.weight * 1000).toFixed(0)}g</div>
                      </div>
                      <div>
                        <div className="text-[7px] text-white/40">Spin</div>
                        <div className="font-bold text-white">{(m.spinFactor * 10).toFixed(1)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Launch Bar */}
      <footer
        className="px-4 sm:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-white/[0.08] z-10 shrink-0 bg-[#060606]"
        style={{
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        <div className="text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>
            {settings.playerCount} Combatants Ready ·{' '}
            {players.filter((p) => !p.isAi).length} Human, {players.filter((p) => p.isAi).length} AI
          </span>
        </div>

        <button
          type="button"
          disabled={!assetsReady}
          onClick={handleLaunch}
          className="w-full sm:w-auto bg-[#ff0044] hover:bg-[#ff0044]/90 active:scale-95 text-white font-['Oswald',sans-serif] px-8 py-2.5 text-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(255,0,68,0.45)] transition-all disabled:opacity-40"
        >
          <span>⚔ Start Tabletop Match</span>
          <span>→</span>
        </button>
      </footer>
    </div>
  );
};
