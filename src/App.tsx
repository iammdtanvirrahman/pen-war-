import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { Hud } from './components/Hud';
import { ModeSelectScreen } from './components/ModeSelectScreen';
import { FormatSelectPage } from './components/FormatSelectPage';
import { PlayerCountPage } from './components/PlayerCountPage';
import { PlayerRosterPage } from './components/PlayerRosterPage';
import { PauseMenuModal } from './components/PauseMenuModal';
import { ResultModal } from './components/ResultModal';
import { Toast } from './components/Toast';
import { RotateDeviceGuard } from './components/RotateDeviceGuard';
import { GameMode, GameSettings, MatchFormat, MatchState, PlayerConfig } from './types/game';
import { DEFAULT_PLAYER_1, DEFAULT_PLAYER_2, DEFAULT_PLAYERS } from './game/constants';
import { sound } from './audio/sound';

type NavigationScreen =
  | 'mode_select'
  | 'setup_format'
  | 'setup_count'
  | 'setup_roster'
  | 'pause'
  | 'result'
  | 'none';

export const App: React.FC = () => {
  const canvasRef = useRef<GameCanvasHandle>(null);

  const [settings, setSettings] = useState<GameSettings>({
    mode: 'friend',
    format: 'single',
    level: 'medium',
    pens: 1,
    playerCount: 2,
    players: DEFAULT_PLAYERS.map((p) => ({ ...p })),
    player1: { ...DEFAULT_PLAYER_1 },
    player2: { ...DEFAULT_PLAYER_2 },
  });

  const [active, setActive] = useState(false);
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [turn, setTurn] = useState(0);
  const [aliveCounts, setAliveCounts] = useState<[number, number]>([1, 1]);

  // Independent Screen Navigation
  const [screen, setScreen] = useState<NavigationScreen>('mode_select');

  const [winner, setWinner] = useState<number>(-1);
  const [remainingPens, setRemainingPens] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [assetsReady, setAssetsReady] = useState(false);
  const [statusText, setStatusText] = useState('Loading 3D assets…');
  const [isTopView, setIsTopView] = useState(false);

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

  const handleMatchFinish = useCallback((win: number, remaining: number) => {
    setWinner(win);
    setRemainingPens(remaining);
    setScreen('result');
    canvasRef.current?.engine?.setAutoRotate(true);
  }, []);

  const handleUpdatePlayer = (idx: number, updates: Partial<PlayerConfig>) => {
    const updatedPlayers = [...settings.players];
    if (updatedPlayers[idx]) {
      updatedPlayers[idx] = { ...updatedPlayers[idx], ...updates };
    }
    const newSettings: GameSettings = {
      ...settings,
      players: updatedPlayers,
      player1: idx === 0 ? { ...settings.player1, ...updates } : settings.player1,
      player2: idx === 1 ? { ...settings.player2, ...updates } : settings.player2,
    };
    setSettings(newSettings);
    canvasRef.current?.engine?.updatePreviewPieces(newSettings);
  };

  const handleSelectMode = (selectedMode: GameMode) => {
    sound.ensureAudio();
    if (selectedMode === 'practice') {
      // Direct start practice match
      const newSettings: GameSettings = {
        ...settings,
        mode: 'practice',
        format: 'single',
        playerCount: 1,
      };
      setSettings(newSettings);
      startMatchWithSettings(newSettings);
      return;
    }

    const updatedPlayers = settings.players.map((p, i) => ({
      ...p,
      isAi: selectedMode === 'ai' ? i > 0 : false,
      name: selectedMode === 'ai' && i > 0 ? `AI Bot ${i}` : p.name,
    }));

    const newSettings: GameSettings = {
      ...settings,
      mode: selectedMode,
      players: updatedPlayers,
    };
    setSettings(newSettings);
    canvasRef.current?.engine?.updatePreviewPieces(newSettings);
    // Navigate to Independent Format Selection Page
    setScreen('setup_format');
  };

  const handleSelectFormat = (format: MatchFormat) => {
    const pens = format === 'single' ? 1 : Math.max(2, settings.pens);
    const newSettings: GameSettings = {
      ...settings,
      format,
      pens,
    };
    setSettings(newSettings);
    canvasRef.current?.engine?.updatePreviewPieces(newSettings);
    // Navigate to Independent Player Count Page
    setScreen('setup_count');
  };

  const handleSelectCount = (count: number) => {
    let newSettings: GameSettings;
    if (settings.format === 'single') {
      newSettings = {
        ...settings,
        playerCount: count,
        pens: 1,
      };
    } else {
      newSettings = {
        ...settings,
        pens: count,
        playerCount: 2,
      };
    }
    setSettings(newSettings);
    canvasRef.current?.engine?.updatePreviewPieces(newSettings);
    // Navigate to Independent Player Roster & Armory Page
    setScreen('setup_roster');
  };

  const startMatchWithSettings = (activeSettings: GameSettings) => {
    sound.ensureAudio();
    const engine = canvasRef.current?.engine;
    if (!engine || !assetsReady) return;

    try {
      if (window.screen?.orientation && 'lock' in window.screen.orientation) {
        (window.screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {
      // Ignore if not supported
    }

    setIsTopView(false);
    engine.startMatch(activeSettings);
    setActive(true);
    setScreen('none');
  };

  const startMatch = () => {
    startMatchWithSettings(settings);
  };

  const resumeMatch = () => {
    const engine = canvasRef.current?.engine;
    if (engine) {
      engine.setAutoRotate(false);
    }
    setScreen('none');
  };

  const openMenu = () => {
    const engine = canvasRef.current?.engine;
    if (engine) {
      engine.hideAim();
    }
    if (active && matchState !== 'over') {
      setScreen('pause');
    } else {
      setScreen('setup_roster');
    }
  };

  const recenterView = () => {
    canvasRef.current?.engine?.recenterView();
    setIsTopView(false);
  };

  const handleTopView = () => {
    const isTop = canvasRef.current?.engine?.toggleTopView() ?? false;
    setIsTopView(isTop);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Escape') {
        e.preventDefault();
        if (screen === 'none' && active) {
          openMenu();
        } else if (screen === 'pause') {
          resumeMatch();
        }
      } else if (e.code === 'KeyV' && screen === 'none' && active) {
        e.preventDefault();
        handleTopView();
      } else if (e.code === 'KeyR' && screen === 'none' && active) {
        e.preventDefault();
        recenterView();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        sound.toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, active]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#080808]">
      {/* 3D Scene WebGL Canvas */}
      <GameCanvas
        ref={canvasRef}
        callbacks={{
          onStatusChange: handleStatusChange,
          onGameStateChange: handleGameStateChange,
          onToast: showToast,
          onMatchFinish: handleMatchFinish,
        }}
      />

      {/* Unified Non-Overlapping Top Bar (Scoreboard + Menu + Camera Controls) */}
      <Hud
        active={active && screen === 'none'}
        state={matchState}
        turn={turn}
        aliveCounts={aliveCounts}
        totalPens={settings.pens}
        mode={settings.mode}
        player1={settings.player1}
        player2={settings.player2}
        players={settings.players}
        playerCount={settings.format === 'single' ? settings.playerCount : 2}
        isTopView={isTopView}
        onRecenter={recenterView}
        onTopView={handleTopView}
        onOpenMenu={openMenu}
      />

      {/* Floating Notifications */}
      <Toast message={toastMessage} />

      {/* Landscape Rotation Guard for Android & Mobile in Active Play */}
      <RotateDeviceGuard active={active && screen === 'none'} />

      {/* 1. Title Screen / Mode Selector on Game Open */}
      {screen === 'mode_select' && (
        <ModeSelectScreen
          onSelectMode={handleSelectMode}
          onQuickStart={startMatch}
          assetsReady={assetsReady}
          statusText={statusText}
        />
      )}

      {/* 2. Independent Step 01: Combat Format Selection Page */}
      {screen === 'setup_format' && (
        <FormatSelectPage
          onSelectFormat={handleSelectFormat}
          onBack={() => setScreen('mode_select')}
        />
      )}

      {/* 3. Independent Step 02: Player Number Selection Page (2, 3, 4, 5, 6) */}
      {screen === 'setup_count' && (
        <PlayerCountPage
          format={settings.format}
          selectedCount={settings.format === 'single' ? settings.playerCount : settings.pens}
          onSelectCount={handleSelectCount}
          onBack={() => setScreen('setup_format')}
        />
      )}

      {/* 4. Independent Step 03: Player Roster & Loaded Pen Armory Page */}
      {screen === 'setup_roster' && (
        <PlayerRosterPage
          settings={settings}
          onUpdatePlayer={handleUpdatePlayer}
          onStartMatch={startMatch}
          onBack={() => setScreen('setup_count')}
          assetsReady={assetsReady}
        />
      )}

      {/* Pause & Settings Overlay */}
      {screen === 'pause' && (
        <PauseMenuModal
          settings={settings}
          onResume={resumeMatch}
          onRestart={startMatch}
          onChangeSetup={() => setScreen('setup_roster')}
          onQuitToTitle={() => {
            setActive(false);
            setScreen('mode_select');
            canvasRef.current?.engine?.setAutoRotate(true);
          }}
          isTopView={isTopView}
          onToggleTopView={handleTopView}
        />
      )}

      {/* Match Concluded Victory / Defeat Screen */}
      {screen === 'result' && (
        <div className="fixed inset-0 z-40 grid place-items-center p-4 bg-black/80 animate-in fade-in duration-200">
          <ResultModal
            winner={winner}
            remainingPens={remainingPens}
            totalPens={settings.pens}
            mode={settings.mode}
            player1={settings.player1}
            player2={settings.player2}
            players={settings.players}
            onPlayAgain={startMatch}
            onChangeSettings={() => setScreen('setup_roster')}
          />
        </div>
      )}
    </div>
  );
};
