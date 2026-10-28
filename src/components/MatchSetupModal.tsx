import React, { useState } from 'react';
import { AiLevel, GameSettings, MatchFormat, PenModelType, PlayerCustomization } from '../types/game';
import { COLOR_PALETTE_P1, COLOR_PALETTE_P2, PEN_MODELS } from '../game/constants';
import { sound } from '../audio/sound';

interface MatchSetupModalProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onStartMatch: () => void;
  onResumeMatch?: () => void;
  onBackToModes: () => void;
  canResume: boolean;
  assetsReady: boolean;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  settings,
  onSettingsChange,
  onStartMatch,
  onResumeMatch,
  onBackToModes,
  canResume,
  assetsReady,
}) => {
  const [activeTab, setActiveTab] = useState<'format' | 'pens'>('format');
  const [activePlayerSide, setActivePlayerSide] = useState<0 | 1>(0);

  const setFormat = (format: MatchFormat) => {
    sound.haptic(15);
    const pens = format === 'single' ? 1 : Math.max(2, settings.pens === 1 ? 2 : settings.pens);
    onSettingsChange({ ...settings, format, pens });
  };

  const setTeamPens = (pens: number) => {
    sound.haptic(15);
    onSettingsChange({
      ...settings,
      format: 'team',
      pens,
    });
  };

  const setOpponentType = (type: 'human' | 'ai') => {
    sound.haptic(15);
    if (type === 'human') {
      onSettingsChange({
        ...settings,
        mode: 'friend',
        player2: {
          ...settings.player2,
          name: 'Player 2',
        },
      });
    } else {
      onSettingsChange({
        ...settings,
        mode: 'ai',
        player2: {
          ...settings.player2,
          name: 'Computer AI',
        },
      });
    }
  };

  const setLevel = (level: AiLevel) => {
    sound.haptic(15);
    onSettingsChange({ ...settings, level });
  };

  const updatePlayerCustom = (playerIdx: 0 | 1, updates: Partial<PlayerCustomization>) => {
    sound.haptic(10);
    if (playerIdx === 0) {
      onSettingsChange({
        ...settings,
        player1: { ...settings.player1, ...updates },
      });
    } else {
      onSettingsChange({
        ...settings,
        player2: { ...settings.player2, ...updates },
      });
    }
  };

  const openArmoryForPlayer = (playerIdx: 0 | 1) => {
    sound.haptic(15);
    setActivePlayerSide(playerIdx);
    setActiveTab('pens');
  };

  const isAiOpponent = settings.mode === 'ai';
  const isSingle = settings.format === 'single';

  const p1Model = PEN_MODELS.find((m) => m.id === settings.player1.model) || PEN_MODELS[0];
  const p2Model = PEN_MODELS.find((m) => m.id === settings.player2.model) || PEN_MODELS[0];

  const currentPlayerCustom = activePlayerSide === 0 ? settings.player1 : settings.player2;
  const currentPalette = activePlayerSide === 0 ? COLOR_PALETTE_P1 : COLOR_PALETTE_P2;

  return (
    <div className="w-[min(540px,calc(100vw-24px))] max-h-[calc(100vh-28px)] flex flex-col bg-[#050505] border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(255,0,68,0.18)] text-white overflow-hidden animate-in fade-in duration-200 font-['Geist_Mono',monospace]">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#080808]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToModes}
            className="w-8 h-8 bg-transparent hover:bg-white/10 border border-white/20 flex items-center justify-center text-xs text-white font-['Space_Mono',monospace] transition cursor-pointer"
            title="Return to Mode Select"
          >
            ←
          </button>
          <div>
            <div className="font-['Space_Mono',monospace] text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff0044]">
              // {isSingle ? 'SINGLE DUEL (1v1)' : `TEAM BATTLE (${settings.pens}v${settings.pens})`}
            </div>
            <h2 className="font-['Oswald',sans-serif] text-xl sm:text-2xl font-bold uppercase tracking-tight text-white m-0">
              Match Setup
            </h2>
          </div>
        </div>

        {/* Top Tab Navigator */}
        <div className="flex items-center bg-[#050505] p-1 border border-white/15 font-['Space_Mono',monospace] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('format')}
            className={`px-3 py-1.5 transition cursor-pointer ${
              activeTab === 'format'
                ? 'bg-[#ff0044] text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            01 Rules & Players
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pens')}
            className={`px-3 py-1.5 transition cursor-pointer ${
              activeTab === 'pens'
                ? 'bg-[#ff0044] text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            02 Pen Armory
          </button>
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
        {activeTab === 'format' ? (
          <>
            {/* 1. Duel Format Selection */}
            <div>
              <label className="font-['Space_Mono',monospace] text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] block mb-2">
                Match Duel Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('single')}
                  className={`p-3.5 border text-left transition-all cursor-pointer ${
                    isSingle
                      ? 'bg-[#ff0044]/10 border-[#ff0044] ring-1 ring-[#ff0044]/40 shadow-sm'
                      : 'bg-[#080808] border-white/10 hover:border-white/30 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-['Space_Mono',monospace] text-[10px] text-[#ff0044] font-bold tracking-wider">
                      FORMAT_01
                    </span>
                    {isSingle && (
                      <span className="w-2 h-2 bg-[#ff0044] rounded-full shadow-[0_0_8px_#ff0044]" />
                    )}
                  </div>
                  <div className="font-['Oswald',sans-serif] text-base font-bold uppercase tracking-tight text-white">
                    Single Duel
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    1 vs 1 · Direct classic tabletop showdown
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('team')}
                  className={`p-3.5 border text-left transition-all cursor-pointer ${
                    !isSingle
                      ? 'bg-[#ff0044]/10 border-[#ff0044] ring-1 ring-[#ff0044]/40 shadow-sm'
                      : 'bg-[#080808] border-white/10 hover:border-white/30 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-['Space_Mono',monospace] text-[10px] text-[#ff0044] font-bold tracking-wider">
                      FORMAT_02
                    </span>
                    {!isSingle && (
                      <span className="w-2 h-2 bg-[#ff0044] rounded-full shadow-[0_0_8px_#ff0044]" />
                    )}
                  </div>
                  <div className="font-['Oswald',sans-serif] text-base font-bold uppercase tracking-tight text-white">
                    Team Battle
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    Squad Clash · Multi-pen tactical battle
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Team Battle Squad Size - ONLY shown during Team Battle! (In Single Duel, 1v1 is fixed and hidden) */}
            {!isSingle && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-['Space_Mono',monospace] text-[10px] font-bold text-white/50 uppercase tracking-[0.15em]">
                    Team Squad Size (Pens per Team)
                  </label>
                  <span className="font-['Space_Mono',monospace] text-[10px] text-[#ff0044] font-bold">
                    {settings.pens * 2} PENS ON TABLE
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTeamPens(n)}
                      className={`py-3 px-2 text-center border font-['Space_Mono',monospace] transition-all cursor-pointer ${
                        settings.pens === n
                          ? 'bg-[#ff0044] text-white border-[#ff0044] font-bold shadow-sm'
                          : 'bg-[#080808] border-white/10 text-white/80 hover:border-white/30'
                      }`}
                    >
                      <div className="text-sm font-bold">{n} vs {n}</div>
                      <div className="text-[9px] opacity-70 tracking-tight mt-0.5">
                        {n} Pens per Side
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Opponent System: Choose Human (Local 2P) or Computer AI */}
            {settings.mode !== 'practice' && (
              <div>
                <label className="font-['Space_Mono',monospace] text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] block mb-2">
                  Opponent System (Player 2)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpponentType('human')}
                    className={`p-3 border text-left transition-all cursor-pointer flex items-center justify-between ${
                      !isAiOpponent
                        ? 'border-[#ff0044] bg-[#ff0044]/10 ring-1 ring-[#ff0044]/40 text-white'
                        : 'border-white/10 bg-[#080808] hover:border-white/30 text-white/70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm">👤 Human Player</div>
                      <div className="text-[10px] text-white/50 mt-0.5">Local 2P Pass & Play</div>
                    </div>
                    {!isAiOpponent && (
                      <span className="w-2 h-2 rounded-full bg-[#ff0044] shadow-[0_0_8px_#ff0044]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpponentType('ai')}
                    className={`p-3 border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isAiOpponent
                        ? 'border-[#ff0044] bg-[#ff0044]/10 ring-1 ring-[#ff0044]/40 text-white'
                        : 'border-white/10 bg-[#080808] hover:border-white/30 text-white/70'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm">🤖 Computer AI</div>
                      <div className="text-[10px] text-white/50 mt-0.5">Algorithmic Opponent</div>
                    </div>
                    {isAiOpponent && (
                      <span className="w-2 h-2 rounded-full bg-[#ff0044] shadow-[0_0_8px_#ff0044]" />
                    )}
                  </button>
                </div>

                {/* AI Skill Level if Computer AI is selected */}
                {isAiOpponent && (
                  <div className="mt-2.5 animate-in fade-in duration-200">
                    <label className="font-['Space_Mono',monospace] text-[9px] font-bold text-white/40 uppercase tracking-[0.15em] block mb-1.5">
                      AI Difficulty Skill Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as AiLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setLevel(lvl)}
                          className={`py-2 border font-['Space_Mono',monospace] text-xs font-bold uppercase transition-all cursor-pointer ${
                            settings.level === lvl
                              ? 'bg-[#ff0044] text-white border-[#ff0044] shadow-sm'
                              : 'bg-[#080808] border-white/10 text-white/70 hover:border-white/30'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Player Pens & Loadouts Summary Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-['Space_Mono',monospace] text-[10px] font-bold text-white/50 uppercase tracking-[0.15em]">
                  Loaded Pens & Colors
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('pens')}
                  className="font-['Space_Mono',monospace] text-[10px] text-[#ff0044] hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Configure In Armory ➔
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Player 1 Card */}
                <div
                  onClick={() => openArmoryForPlayer(0)}
                  className="p-3 bg-[#080808] border border-white/15 hover:border-[#ff0044]/60 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm"
                      style={{ backgroundColor: settings.player1.color }}
                    />
                    <div>
                      <div className="text-[10px] font-bold uppercase text-white/50">
                        Player 1 (You)
                      </div>
                      <div className="text-xs font-bold text-white">
                        {p1Model.name}
                      </div>
                    </div>
                  </div>
                  <span className="font-['Space_Mono',monospace] text-xs text-[#ff0044]">
                    Edit ➔
                  </span>
                </div>

                {/* Player 2 Card */}
                {settings.mode !== 'practice' && (
                  <div
                    onClick={() => openArmoryForPlayer(1)}
                    className="p-3 bg-[#080808] border border-white/15 hover:border-[#ff0044]/60 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-sm"
                        style={{ backgroundColor: settings.player2.color }}
                      />
                      <div>
                        <div className="text-[10px] font-bold uppercase text-white/50">
                          {isAiOpponent ? 'Player 2 (AI)' : 'Player 2 (Human)'}
                        </div>
                        <div className="text-xs font-bold text-white">
                          {p2Model.name}
                        </div>
                      </div>
                    </div>
                    <span className="font-['Space_Mono',monospace] text-xs text-[#ff0044]">
                      Edit ➔
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Pen Armory Tab: Select Pen Model & Color for Each Player */}
            {/* Player Switcher Tabs */}
            <div className="flex bg-[#050505] p-1 border border-white/15 font-['Space_Mono',monospace] text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActivePlayerSide(0)}
                className={`flex-1 py-2 transition flex items-center justify-center gap-2 cursor-pointer ${
                  activePlayerSide === 0
                    ? 'bg-[#ff0044] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: settings.player1.color }}
                />
                <span>Player 1 (You)</span>
              </button>

              {settings.mode !== 'practice' && (
                <button
                  type="button"
                  onClick={() => setActivePlayerSide(1)}
                  className={`flex-1 py-2 transition flex items-center justify-center gap-2 cursor-pointer ${
                    activePlayerSide === 1
                      ? 'bg-[#ff0044] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: settings.player2.color }}
                  />
                  <span>{isAiOpponent ? 'Player 2 (AI)' : 'Player 2 (Human)'}</span>
                </button>
              )}
            </div>

            {/* Choose Pen Model */}
            <div>
              <label className="font-['Space_Mono',monospace] text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] block mb-2">
                Select 3D Pen Model ({activePlayerSide === 0 ? 'Player 1' : isAiOpponent ? 'AI' : 'Player 2'})
              </label>
              <div className="space-y-2">
                {PEN_MODELS.map((model) => {
                  const isSelected = currentPlayerCustom.model === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() =>
                        updatePlayerCustom(activePlayerSide, {
                          model: model.id as PenModelType,
                        })
                      }
                      className={`w-full p-3 border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#ff0044] bg-[#ff0044]/10 shadow-sm ring-1 ring-[#ff0044]/40'
                          : 'border-white/10 bg-[#080808] hover:border-white/30 text-white/80'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-['Oswald',sans-serif] text-sm uppercase tracking-tight text-white">
                            {model.name}
                          </span>
                          <span className="font-['Space_Mono',monospace] text-[9px] px-2 py-0.5 border border-white/15 text-[#ff0044] uppercase tracking-wider">
                            {model.subtitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/50 mt-1 leading-snug">
                          {model.description}
                        </div>
                        {/* Specs ratings */}
                        <div className="flex items-center gap-4 mt-2 font-['Space_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wider">
                          <span>SPD: <strong className="text-[#ff0044]">{Math.round(model.speedFactor * 100)}%</strong></span>
                          <span>SPN: <strong className="text-[#ff0044]">{Math.round(model.spinFactor * 100)}%</strong></span>
                          <span>WT: <strong className="text-[#ff0044]">{(model.weight * 1000).toFixed(0)}G</strong></span>
                        </div>
                      </div>
                      <div className="text-lg pl-2 font-['Space_Mono',monospace] text-[#ff0044]">
                        {isSelected ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Swatch Picker */}
            <div>
              <label className="font-['Space_Mono',monospace] text-[10px] font-bold text-white/50 uppercase tracking-[0.15em] block mb-2">
                Team Barrel Accent Color
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {currentPalette.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    title={col.name}
                    onClick={() =>
                      updatePlayerCustom(activePlayerSide, { color: col.hex })
                    }
                    className={`w-9 h-9 border transition-all flex items-center justify-center cursor-pointer ${
                      currentPlayerCustom.color === col.hex
                        ? 'border-white scale-110 shadow-lg ring-2 ring-[#ff0044]'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.hex }}
                  >
                    {currentPlayerCustom.color === col.hex && (
                      <span className="text-white text-xs font-black drop-shadow font-['Space_Mono',monospace]">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-[#080808]/90 flex items-center gap-3 shrink-0">
        {activeTab === 'format' ? (
          <button
            type="button"
            onClick={() => setActiveTab('pens')}
            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-['Space_Mono',monospace] font-bold text-xs uppercase tracking-wider transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Choose Pens & Colors</span>
            <span>➔</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('format')}
            className="py-3 px-4 border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 font-['Space_Mono',monospace] text-xs uppercase tracking-wider transition cursor-pointer"
          >
            ← Back to Rules
          </button>
        )}

        <button
          type="button"
          disabled={!assetsReady}
          onClick={() => {
            sound.haptic(25);
            onStartMatch();
          }}
          className="flex-1 py-3.5 px-5 bg-[#ff0044] hover:brightness-110 active:scale-[0.98] text-white font-['Oswald',sans-serif] font-bold text-base uppercase tracking-tight shadow-[0_4px_20px_rgba(255,0,68,0.4)] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span>Start Match</span>
          <span className="font-['Space_Mono',monospace] text-xs">➔</span>
        </button>

        {canResume && onResumeMatch && (
          <button
            type="button"
            onClick={onResumeMatch}
            className="py-3 px-4 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-['Space_Mono',monospace] text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
};
