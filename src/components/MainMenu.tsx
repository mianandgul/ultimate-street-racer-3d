import React from 'react';
import { Play, Wrench, Settings, HelpCircle, Trophy, Zap, Compass } from 'lucide-react';
import { PlayerCarSave } from '../types/game';
import { CARS_CATALOG } from '../game/gameState';

interface MainMenuProps {
  saveData: PlayerCarSave;
  onStartRace: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenInstructions: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onStartRace,
  onOpenGarage,
  onOpenSettings,
  onOpenInstructions,
}) => {
  const selectedCar = CARS_CATALOG.find((c) => c.id === saveData.selectedCarId) || CARS_CATALOG[0];

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-8 z-20">
      {/* Top Bar: Stats & Currency */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Coins Badge */}
        <div className="bg-slate-900/90 border border-amber-500/50 rounded-2xl px-4 py-2 shadow-2xl flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-inner">
            ★
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {saveData.coins.toLocaleString()}
          </span>
          <span className="text-xs text-amber-400/80 font-bold uppercase tracking-wider">COINS</span>
        </div>

        {/* Selected Car Badge */}
        <button
          onClick={onOpenGarage}
          className="bg-slate-900/90 border border-cyan-500/50 rounded-2xl px-4 py-2 shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-2.5 text-left active:scale-95"
        >
          <div
            className="w-4 h-4 rounded-full border border-white/50"
            style={{ backgroundColor: saveData.colors[selectedCar.id] || '#ef4444' }}
          />
          <div>
            <span className="text-[10px] text-cyan-400 uppercase font-black tracking-wider block">ACTIVE CAR</span>
            <span className="text-sm font-bold text-white">{selectedCar.name}</span>
          </div>
        </button>
      </div>

      {/* Hero Title & Records */}
      <div className="flex flex-col items-center justify-center text-center pointer-events-none my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-black tracking-widest uppercase mb-3">
          <Zap size={13} className="text-yellow-400 fill-yellow-400" />
          REAL-TIME 3D ARCADE RACER
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 tracking-tight drop-shadow-2xl">
          ULTIMATE STREET
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400">
            RACER 3D
          </span>
        </h1>

        {/* High Score & Records Banner */}
        <div className="flex items-center gap-4 sm:gap-8 mt-5 bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-2.5 shadow-2xl">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">BEST SCORE</span>
              <span className="text-lg font-black text-white font-mono">{saveData.highScore.toLocaleString()}</span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-2">
            <Compass size={18} className="text-cyan-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MAX DISTANCE</span>
              <span className="text-lg font-black text-white font-mono">{saveData.bestDistance.toLocaleString()} m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Menu Navigation */}
      <div className="w-full max-w-md mx-auto pointer-events-auto flex flex-col gap-3">
        <button
          onClick={onStartRace}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-slate-950 font-black text-lg tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3 border border-cyan-300"
        >
          <Play size={24} className="fill-slate-950" />
          <span>START RACE</span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onOpenGarage}
            className="py-3 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-lg"
          >
            <Wrench size={18} className="text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">GARAGE</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="py-3 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-lg"
          >
            <Settings size={18} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">SETTINGS</span>
          </button>

          <button
            onClick={onOpenInstructions}
            className="py-3 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-lg"
          >
            <HelpCircle size={18} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">HOW TO PLAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
