import React, { useState } from 'react';
import { AiLevel, GameMode, GameSettings, MatchFormat, PenModelType, PlayerCustomization } from '../types/game';
import { COLOR_PALETTE_P1, COLOR_PALETTE_P2, PEN_MODELS } from '../game/constants';

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
  // Wizard steps: 'format' -> 'pen_choose'
  const [step, setStep] = useState<'format' | 'pen_choose'>('format');
  const [activePlayerTab, setActivePlayerTab] = useState<0 | 1>(0);

  const setFormat = (format: MatchFormat) => {
    const pens = format === 'single' ? 1 : Math.max(2, settings.pens);
    onSettingsChange({ ...settings, format, pens });
  };

  const setPens = (pens: number) => {
    onSettingsChange({
      ...settings,
      pens,
      format: pens === 1 ? 'single' : 'team',
    });
  };

  const setLevel = (level: AiLevel) => {
    onSettingsChange({ ...settings, level });
  };

  const updatePlayerCustom = (playerIdx: 0 | 1, updates: Partial<PlayerCustomization>) => {
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

  const modeTitle =
    settings.mode === 'friend'
      ? 'Local Play'
      : settings.mode === 'ai'
      ? 'AI Battle'
      : 'Target Practice';

  return (
    <div className="w-[min(500px,calc(100vw-28px))] max-h-[calc(100vh-28px)] overflow-y-auto p-5 sm:p-7 rounded-[24px] bg-gradient-to-br from-[#19191d] via-[#141417] to-[#101013] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.8),0_0_50px_rgba(220,53,69,0.1)] text-white">
      {/* Top Breadcrumb & Step Switcher */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <button
          type="button"
          onClick={step === 'pen_choose' ? () => setStep('format') : onBackToModes}
          className="text-xs font-semibold text-[#a1a1aa] hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <span>←</span> {step === 'pen_choose' ? 'Back to Format' : 'Change Mode'}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setStep('format')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              step === 'format'
                ? 'bg-[#dc3545] text-white'
                : 'text-white/60 hover:text-white bg-white/5'
            }`}
          >
            1. Format & Team
          </button>
          <span className="text-white/30">/</span>
          <button
            type="button"
            onClick={() => setStep('pen_choose')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              step === 'pen_choose'
                ? 'bg-[#dc3545] text-white'
                : 'text-white/60 hover:text-white bg-white/5'
            }`}
          >
            2. Choose Pens
          </button>
        </div>
      </div>

      {/* STEP 1: Format & Players */}
      {step === 'format' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-[#ff9aa4] uppercase">
              {modeTitle} Match Setup
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight text-white">
              Choose Duel Format
            </h2>
            <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
              Select whether you want a quick 1-on-1 duel or a tactical team clash with multiple pens.
            </p>
          </div>

          {/* Single vs Team Mode Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block">
              Match Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('single')}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  settings.format === 'single'
                    ? 'bg-gradient-to-br from-white/15 to-white/5 border-white/40 shadow-md ring-1 ring-white/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">🎯</span>
                  {settings.format === 'single' && (
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Single Duel</div>
                  <div className="text-[11px] text-[#a1a1aa] mt-0.5">
                    1 vs 1 · Pure classic tabletop pen duel
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('team')}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  settings.format === 'team'
                    ? 'bg-gradient-to-br from-white/15 to-white/5 border-white/40 shadow-md ring-1 ring-white/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">👥</span>
                  {settings.format === 'team' && (
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Team Battle</div>
                  <div className="text-[11px] text-[#a1a1aa] mt-0.5">
                    Multi-Pen Duel · Alternate shot strategy
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Number of Pens / Player Count */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block">
              Player Number · Pens per Side
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPens(n)}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                    settings.pens === n
                      ? 'bg-[#f5f5f7] text-[#111] border-[#f5f5f7] shadow-md'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  {n} vs {n}
                  <span className="block text-[10px] font-normal opacity-70">
                    {n === 1 ? 'Single' : `${n * 2} Pens`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty (if Computer mode) */}
          {settings.mode === 'ai' && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block">
                Computer AI Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as AiLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      settings.level === lvl
                        ? 'bg-[#f5f5f7] text-[#111] border-[#f5f5f7] shadow-md'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => setStep('pen_choose')}
            className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-[#dc3545] to-[#bd2638] text-white font-bold text-sm sm:text-base shadow-[0_7px_22px_rgba(220,53,69,0.35)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Choose Pens</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* STEP 2: Choose Pens & Customization */}
      {step === 'pen_choose' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-[#ff9aa4] uppercase">
              Pen Armory
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight text-white">
              Choose & Customize Pens
            </h2>
            <p className="text-xs text-[#a1a1aa] mt-1 leading-relaxed">
              Select your authentic 3D pen models from assets. Pen body glow is disabled for realistic tabletop physics.
            </p>
          </div>

          {/* Player Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setActivePlayerTab(0)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activePlayerTab === 0
                  ? 'bg-[#ff4d5e] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/40"
                style={{ backgroundColor: settings.player1.color }}
              />
              <span>{settings.mode === 'ai' ? 'Your Pen' : 'Player 1 (Red)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlayerTab(1)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activePlayerTab === 1
                  ? 'bg-[#4cc9f0] text-[#0f172a] shadow-md font-extrabold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/40"
                style={{ backgroundColor: settings.player2.color }}
              />
              <span>{settings.mode === 'ai' ? "AI's Pen" : 'Player 2 (Blue)'}</span>
            </button>
          </div>

          {/* Active Player Customization Panel */}
          {(() => {
            const currentCustom = activePlayerTab === 0 ? settings.player1 : settings.player2;
            const palette = activePlayerTab === 0 ? COLOR_PALETTE_P1 : COLOR_PALETTE_P2;

            return (
              <div className="space-y-3.5">
                {/* Pen Model Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block mb-2">
                    Pen Model (Asset & Styles)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PEN_MODELS.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() =>
                          updatePlayerCustom(activePlayerTab, { model: model.id as PenModelType })
                        }
                        className={`p-3 rounded-xl border text-left transition-all ${
                          currentCustom.model === model.id
                            ? 'bg-white/15 border-white/40 ring-1 ring-white/30 shadow-md'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">
                            {model.name}
                          </span>
                          {model.source === 'asset' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#4ade80] font-semibold border border-[#22c55e]/30">
                              GLB Asset
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/60 mt-1 font-medium">
                          {model.subtitle}
                        </div>
                        <div className="text-[10px] text-[#a1a1aa] mt-1 line-clamp-2 leading-tight">
                          {model.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pen Finish & Color Palette */}
                <div>
                  <label className="text-[11px] font-semibold text-[#aaaab4] uppercase tracking-wider block mb-2">
                    Pen Body Finish & Team Color
                  </label>
                  <div className="flex items-center gap-2.5">
                    {palette.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() =>
                          updatePlayerCustom(activePlayerTab, { color: color.hex })
                        }
                        title={color.name}
                        className={`relative w-8 h-8 rounded-full transition-transform active:scale-90 border-2 ${
                          currentCustom.color === color.hex
                            ? 'scale-110 border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                            : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {currentCustom.color === color.hex && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white drop-shadow font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action CTAs */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={!assetsReady}
              onClick={onStartMatch}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#dc3545] to-[#bd2638] text-white font-bold text-sm sm:text-base shadow-[0_7px_22px_rgba(220,53,69,0.35)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              Start Match Now!
            </button>

            {canResume && onResumeMatch && (
              <button
                type="button"
                onClick={onResumeMatch}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium transition active:scale-[0.98]"
              >
                Back to Match
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
