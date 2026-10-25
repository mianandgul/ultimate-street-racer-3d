/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraViewMode, ControlInputs, GameScreen, GameSettings, PlayerCarSave, RaceSummary } from './types/game';
import { RacingEngine } from './game/engine';
import { CARS_CATALOG, GameStorage } from './game/gameState';
import { sound } from './game/audio';
import { EnvironmentTheme } from './game/environment';

import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { HUD } from './components/HUD';
import { CountdownOverlay } from './components/CountdownOverlay';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { InstructionsModal } from './components/InstructionsModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RacingEngine | null>(null);

  // App & Screen State
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [saveData, setSaveData] = useState<PlayerCarSave>(() => GameStorage.loadSave());
  const [settings, setSettings] = useState<GameSettings>(() => GameStorage.loadSettings());
  const [environmentTheme, setEnvironmentTheme] = useState<EnvironmentTheme>('cyber_night');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // Active Race HUD Stats
  const [stats, setStats] = useState({
    speedKmH: 0,
    nitroPercent: 100,
    score: 0,
    coins: 0,
    distance: 0,
    comboText: null as string | null,
  });

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gameOverSummary, setGameOverSummary] = useState<RaceSummary | null>(null);

  // Stats update callback from engine
  const handleStatsUpdate = useCallback(
    (newStats: {
      speedKmH: number;
      nitroPercent: number;
      score: number;
      coins: number;
      distance: number;
      comboText: string | null;
    }) => {
      setStats(newStats);
    },
    []
  );

  // Game over callback from engine
  const handleGameOver = useCallback((summary: RaceSummary) => {
    setGameOverSummary(summary);
    setScreen('gameover');
    setSaveData(GameStorage.loadSave());
  }, []);

  // Initialize Three.js Engine once
  useEffect(() => {
    if (!containerRef.current) return;

    const currentSave = GameStorage.loadSave();
    const currentSettings = GameStorage.loadSettings();

    const engine = new RacingEngine(
      containerRef.current,
      {
        onStatsUpdate: handleStatsUpdate,
        onGameOver: handleGameOver,
      },
      currentSettings
    );

    engineRef.current = engine;

    // Set initial car
    const selectedCar = CARS_CATALOG.find((c) => c.id === currentSave.selectedCarId) || CARS_CATALOG[0];
    const initialColor = currentSave.colors[selectedCar.id] || '#ef4444';
    const upgrades = currentSave.upgrades[selectedCar.id];
    engine.setCar(selectedCar.id, initialColor, selectedCar, upgrades);

    // Initial garage showroom presentation
    engine.enterGarageMode();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleStatsUpdate, handleGameOver]);

  // Unlock Web Audio on first gesture
  useEffect(() => {
    const unlockAudio = () => {
      sound.resume();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      // Unlock sound if needed
      sound.resume();

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (screen === 'playing') {
          engineRef.current.pauseRace();
          setScreen('paused');
        } else if (screen === 'paused') {
          engineRef.current.resumeRace();
          setScreen('playing');
        }
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        if (screen === 'playing') {
          handleSwitchCamera();
        }
        return;
      }

      // Driving keys: pure Left and Right steering
      const inputs = engineRef.current.inputs;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputs.steerLeft = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputs.steerRight = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const inputs = engineRef.current.inputs;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputs.steerLeft = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputs.steerRight = false;
      }
    };

    const onWindowBlur = () => {
      if (!engineRef.current) return;
      engineRef.current.inputs.steerLeft = false;
      engineRef.current.inputs.steerRight = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [screen]);

  // Controls helper for HUD touch buttons
  const setControls = useCallback((setter: (prev: ControlInputs) => ControlInputs) => {
    if (!engineRef.current) return;
    engineRef.current.inputs = setter(engineRef.current.inputs);
  }, []);

  // Screen Actions
  const handleStartRace = () => {
    if (!engineRef.current) return;
    setScreen('countdown');
  };

  const handleCountdownComplete = () => {
    if (!engineRef.current) return;
    engineRef.current.startRace();
    setScreen('playing');
  };

  const handleOpenGarage = () => {
    if (!engineRef.current) return;
    engineRef.current.enterGarageMode();
    setScreen('garage');
  };

  const handleBackToMenu = () => {
    if (!engineRef.current) return;
    engineRef.current.enterGarageMode();
    setScreen('menu');
  };

  const handleSelectCarInGarage = (carId: string, colorHex: string) => {
    if (!engineRef.current) return;
    const car = CARS_CATALOG.find((c) => c.id === carId) || CARS_CATALOG[0];
    const up = saveData.upgrades[carId];
    engineRef.current.setCar(carId, colorHex, car, up);
  };

  const handleUpdateSave = (newSave: PlayerCarSave) => {
    setSaveData(newSave);
    GameStorage.save(newSave);
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    GameStorage.saveSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.setSettings(newSettings);
    }
  };

  const handleSelectTheme = (theme: EnvironmentTheme) => {
    setEnvironmentTheme(theme);
    if (engineRef.current) {
      engineRef.current.setEnvironmentTheme(theme);
    }
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    handleUpdateSettings(updated);
  };

  const handleSwitchCamera = () => {
    const nextMode: CameraViewMode =
      cameraMode === 'chase' ? 'hood' : cameraMode === 'hood' ? 'far' : 'chase';
    setCameraMode(nextMode);
    if (engineRef.current) {
      engineRef.current.setCameraMode(nextMode);
    }
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    engineRef.current.pauseRace();
    setScreen('paused');
  };

  const handleResume = () => {
    if (!engineRef.current) return;
    engineRef.current.resumeRace();
    setScreen('playing');
  };

  const handleRestartRace = () => {
    if (!engineRef.current) return;
    setScreen('countdown');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Main Menu Screen */}
      {screen === 'menu' && (
        <MainMenu
          saveData={saveData}
          onStartRace={handleStartRace}
          onOpenGarage={handleOpenGarage}
          onOpenSettings={() => setShowSettings(true)}
          onOpenInstructions={() => setShowInstructions(true)}
        />
      )}

      {/* Garage / Showroom Screen */}
      {screen === 'garage' && (
        <Garage
          saveData={saveData}
          onUpdateSave={handleUpdateSave}
          onSelectCar={handleSelectCarInGarage}
          onStartRace={handleStartRace}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {/* Countdown 3, 2, 1, GO! */}
      {screen === 'countdown' && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      {/* Playing Race HUD */}
      {(screen === 'playing' || screen === 'countdown') && (
        <HUD
          speedKmH={stats.speedKmH}
          nitroPercent={stats.nitroPercent}
          score={stats.score}
          coins={stats.coins}
          distance={stats.distance}
          comboText={stats.comboText}
          cameraMode={cameraMode}
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
          onSwitchCamera={handleSwitchCamera}
          onPause={handlePause}
          setControls={setControls}
        />
      )}

      {/* Paused Screen Modal */}
      {screen === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartRace}
          onOpenSettings={() => setShowSettings(true)}
          onQuitToMenu={handleBackToMenu}
        />
      )}

      {/* Game Over Screen Modal */}
      {screen === 'gameover' && gameOverSummary && (
        <GameOverModal
          summary={gameOverSummary}
          onRestart={handleRestartRace}
          onOpenGarage={handleOpenGarage}
          onQuitToMenu={handleBackToMenu}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          currentTheme={environmentTheme}
          onUpdateSettings={handleUpdateSettings}
          onSelectTheme={handleSelectTheme}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Instructions / How To Play Modal */}
      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}
    </div>
  );
}
