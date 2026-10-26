import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { Hud } from './components/Hud';
import { PowerGauge } from './components/PowerGauge';
import { Controls } from './components/Controls';
import { ModeSelectScreen } from './components/ModeSelectScreen';
import { MatchSetupModal } from './components/MatchSetupModal';
import { ResultModal } from './components/ResultModal';
import { LandscapeGuard } from './components/LandscapeGuard';
import { Toast } from './components/Toast';
import { GameMode, GameSettings, MatchState, PowerUIState } from './types/game';
import { DEFAULT_PLAYER_1, DEFAULT_PLAYER_2 } from './game/constants';
import { sound } from './audio/sound';

export const App: React.FC = () => {
  const canvasRef = useRef<GameCanvasHandle>(null);

  const [settings, setSettings] = useState<GameSettings>({
    mode: 'friend',
    format: 'single',
    level: 'medium',
    pens: 1,
    player1: { ...DEFAULT_PLAYER_1 },
    player2: { ...DEFAULT_PLAYER_2 },
  });

  const [active, setActive] = useState(false);
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [turn, setTurn] = useState(0);
  const [aliveCounts, setAliveCounts] = useState<[number, number]>([1, 1]);

  // Modal navigation: 'mode_select' (Initial screen) -> 'setup' (Single/Team, Pens, etc.) -> 'none' (In-game) -> 'result'
  const [modal, setModal] = useState<'mode_select' | 'setup' | 'result' | 'none'>('mode_select');

  const [winner, setWinner] = useState<number>(-1);
  const [remainingPens, setRemainingPens] = useState(0);
  const [powerState, setPowerState] = useState<PowerUIState>({
    visible: false,
    power: 0,
    spinComment: '',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [assetsReady, setAssetsReady] = useState(false);
  const [statusText, setStatusText] = useState('Loading 3D assets…');
  const [isForcedLandscape, setIsForcedLandscape] = useState(false);
  const [isTopView, setIsTopView] = useState(false);

  // Proactively attempt landscape lock on mount
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (screen.orientation && (screen.orientation as any).lock) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {
      // Ignore if not permitted without user gesture
    }
  }, []);

  const triggerLandscapeLock = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (screen.orientation && (screen.orientation as any).lock) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (screen.orientation as any).lock('landscape');
      }
    } catch {
      // Fallback
    }
  };

  const showToast = useCallback((msg: string, dur = 2000) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current !== null) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, dur);
  }, []);

  const handleStatusChange = useCallback((status: string, ready: boolean) => {
    setStatusText(status);
    setAssetsReady(ready);
  }, []);

  const handleGameStateChange = useCallback((state: MatchState, newTurn: number, counts: [number, number]) => {
    setMatchState(state);
    setTurn(newTurn);
    setAliveCounts(counts);
  }, []);

  const handlePowerChange = useCallback((newPower: PowerUIState) => {
    setPowerState(newPower);
  }, []);

  const handleMatchFinish = useCallback((win: number, remaining: number) => {
    setWinner(win);
    setRemainingPens(remaining);
    setModal('result');
    canvasRef.current?.engine?.setAutoRotate(true);
  }, []);

  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    const engine = canvasRef.current?.engine;
    if (engine) {
      engine.updatePreviewPieces(newSettings);
    }
  };

  const handleSelectMode = (selectedMode: GameMode) => {
    sound.ensureAudio();
    triggerLandscapeLock();
    const newSettings: GameSettings = {
      ...settings,
      mode: selectedMode,
      format: selectedMode === 'practice' ? 'single' : settings.format,
      player2: {
        ...settings.player2,
        name: selectedMode === 'ai' ? 'Computer AI' : 'Player 2',
      },
    };
    setSettings(newSettings);
    canvasRef.current?.engine?.updatePreviewPieces(newSettings);
    setModal('setup');
  };

  const startMatch = () => {
    sound.ensureAudio();
    triggerLandscapeLock();
    const engine = canvasRef.current?.engine;
    if (!engine || !assetsReady) return;
    engine.startMatch(settings);
    setActive(true);
    setModal('none');
  };

  const resumeMatch = () => {
    const engine = canvasRef.current?.engine;
    if (engine) {
      engine.setAutoRotate(false);
    }
    setModal('none');
  };

  const openMenu = () => {
    const engine = canvasRef.current?.engine;
    if (engine) {
      engine.hideAim();
      engine.setAutoRotate(true);
    }
    setModal(matchState === 'over' ? 'result' : 'setup');
  };

  const recenterView = () => {
    canvasRef.current?.engine?.recenterView();
    setIsTopView(false);
  };

  const handleTopView = () => {
    const isTop = canvasRef.current?.engine?.toggleTopView() ?? false;
    setIsTopView(isTop);
  };

  const toggleForceLandscape = () => {
    setIsForcedLandscape((prev) => !prev);
    setTimeout(() => {
      canvasRef.current?.engine?.resize();
    }, 100);
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-[#080808] ${
        isForcedLandscape ? 'force-landscape-view' : ''
      }`}
    >
      {/* Landscape Orientation Protector */}
      <LandscapeGuard
        onForceLandscapeToggle={setIsForcedLandscape}
        isForced={isForcedLandscape}
      />

      {/* 3D Scene Canvas */}
      <GameCanvas
        ref={canvasRef}
        callbacks={{
          onStatusChange: handleStatusChange,
          onGameStateChange: handleGameStateChange,
          onPowerChange: handlePowerChange,
          onToast: showToast,
          onMatchFinish: handleMatchFinish,
        }}
      />

      {/* Top Game HUD */}
      <Hud
        active={active && modal === 'none'}
        state={matchState}
        turn={turn}
        aliveCounts={aliveCounts}
        totalPens={settings.pens}
        mode={settings.mode}
        player1={settings.player1}
        player2={settings.player2}
      />

      {/* Slingshot Power Bar */}
      <PowerGauge powerState={powerState} />

      {/* Floating Notifications */}
      <Toast message={toastMessage} />

      {/* Bottom Floating Controls Bar */}
      {modal === 'none' && (
        <Controls
          onRecenter={recenterView}
          onTopView={handleTopView}
          isTopView={isTopView}
          onOpenMenu={openMenu}
          isForcedLandscape={isForcedLandscape}
          onToggleForceLandscape={toggleForceLandscape}
        />
      )}

      {/* STEP 0: Mode Select Title Screen on Game Open */}
      {modal === 'mode_select' && (
        <ModeSelectScreen
          onSelectMode={handleSelectMode}
          assetsReady={assetsReady}
          statusText={statusText}
        />
      )}

      {/* STEP 1 & 2: Match Setup (Single/Team & Choose Pens) */}
      {modal === 'setup' && (
        <div className="fixed inset-0 z-40 grid place-items-center p-4 bg-[radial-gradient(ellipse_at_50%_20%,rgba(121,43,54,0.3),transparent_65%),rgba(8,8,8,0.85)] backdrop-blur-md">
          <MatchSetupModal
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onStartMatch={startMatch}
            onResumeMatch={resumeMatch}
            onBackToModes={() => setModal('mode_select')}
            canResume={active && matchState !== 'over'}
            assetsReady={assetsReady}
          />
        </div>
      )}

      {/* Victory / Defeat / Draw Screen */}
      {modal === 'result' && (
        <div className="fixed inset-0 z-40 grid place-items-center p-4 bg-[radial-gradient(ellipse_at_50%_20%,rgba(121,43,54,0.3),transparent_65%),rgba(8,8,8,0.85)] backdrop-blur-md">
          <ResultModal
            winner={winner}
            remainingPens={remainingPens}
            mode={settings.mode}
            player1={settings.player1}
            player2={settings.player2}
            onPlayAgain={startMatch}
            onChangeSettings={() => setModal('setup')}
          />
        </div>
      )}
    </div>
  );
};
