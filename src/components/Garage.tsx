import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, Zap, Gauge, Flame, ShieldAlert, Award, Play } from 'lucide-react';
import { CARS_CATALOG, COLOR_PALETTE, GameStorage } from '../game/gameState';
import { PlayerCarSave } from '../types/game';

interface GarageProps {
  saveData: PlayerCarSave;
  onUpdateSave: (newSave: PlayerCarSave) => void;
  onSelectCar: (carId: string, colorHex: string) => void;
  onStartRace: () => void;
  onBackToMenu: () => void;
}

export const Garage: React.FC<GarageProps> = ({
  saveData,
  onUpdateSave,
  onSelectCar,
  onStartRace,
  onBackToMenu,
}) => {
  const [activeCarId, setActiveCarId] = useState(saveData.selectedCarId);
  const activeCar = CARS_CATALOG.find((c) => c.id === activeCarId) || CARS_CATALOG[0];

  const isUnlocked = saveData.unlockedCars.includes(activeCarId);
  const isSelected = saveData.selectedCarId === activeCarId;
  const currentColor = saveData.colors[activeCarId] || '#ef4444';
  const currentUpgrades = saveData.upgrades[activeCarId] || { speed: 0, accel: 0, handling: 0, nitro: 0 };

  const effectiveStats = GameStorage.calculateEffectiveStats(activeCarId, activeCar, currentUpgrades);

  const handleSelectCar = (id: string) => {
    setActiveCarId(id);
    const carColor = saveData.colors[id] || '#ef4444';
    onSelectCar(id, carColor);
  };

  const handleUnlockCar = () => {
    if (saveData.coins < activeCar.price) return;
    const updatedSave: PlayerCarSave = {
      ...saveData,
      coins: saveData.coins - activeCar.price,
      unlockedCars: [...saveData.unlockedCars, activeCar.id],
      selectedCarId: activeCar.id,
    };
    onUpdateSave(updatedSave);
    onSelectCar(activeCar.id, currentColor);
  };

  const handleSetEquipped = () => {
    const updatedSave: PlayerCarSave = {
      ...saveData,
      selectedCarId: activeCar.id,
    };
    onUpdateSave(updatedSave);
    onSelectCar(activeCar.id, currentColor);
  };

  const handleChangeColor = (hex: string) => {
    const updatedSave: PlayerCarSave = {
      ...saveData,
      colors: {
        ...saveData.colors,
        [activeCarId]: hex,
      },
    };
    onUpdateSave(updatedSave);
    onSelectCar(activeCarId, hex);
  };

  const handleUpgrade = (type: 'speed' | 'accel' | 'handling' | 'nitro') => {
    const currentLvl = currentUpgrades[type] || 0;
    if (currentLvl >= 5) return;
    const cost = GameStorage.getUpgradeCost(currentLvl);
    if (saveData.coins < cost) return;

    const newUpgrades = {
      ...currentUpgrades,
      [type]: currentLvl + 1,
    };

    const updatedSave: PlayerCarSave = {
      ...saveData,
      coins: saveData.coins - cost,
      upgrades: {
        ...saveData.upgrades,
        [activeCarId]: newUpgrades,
      },
    };

    onUpdateSave(updatedSave);
    onSelectCar(activeCarId, currentColor);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 active:scale-95 transition-all shadow-md font-bold text-sm"
        >
          <ArrowLeft size={18} />
          <span>BACK</span>
        </button>

        {/* Coins Balance */}
        <div className="bg-slate-900/90 border border-amber-500/50 rounded-xl px-4 py-1.5 shadow-lg flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-inner">
            ★
          </span>
          <span className="text-xl font-black text-amber-300 font-mono">
            {saveData.coins.toLocaleString()}
          </span>
          <span className="text-xs text-amber-400/80 font-bold uppercase tracking-wider">COINS</span>
        </div>
      </div>

      {/* Center 3D Car Title Badge */}
      <div className="flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/30">
          {activeCar.category}
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-wider mt-1 drop-shadow-md">
          {activeCar.name}
        </h2>
      </div>

      {/* Bottom Dock: Controls, Upgrades & Car Selector */}
      <div className="w-full max-w-4xl mx-auto pointer-events-auto bg-slate-950/95 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col gap-3.5 max-h-[65vh] sm:max-h-none overflow-y-auto">
        {/* Car Selection Tabs */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {CARS_CATALOG.map((car) => {
            const unlocked = saveData.unlockedCars.includes(car.id);
            const active = car.id === activeCarId;
            return (
              <button
                key={car.id}
                onClick={() => handleSelectCar(car.id)}
                className={`py-2 px-1 sm:px-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                  active
                    ? 'bg-gradient-to-t from-cyan-600/40 to-cyan-500/20 border-2 border-cyan-400 text-white shadow-lg'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  {!unlocked && <Lock size={12} className="text-amber-400" />}
                  <span className="text-xs sm:text-sm font-black truncate">{car.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {unlocked ? (saveData.selectedCarId === car.id ? 'EQUIPPED' : 'OWNED') : `${car.price} ★`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stats & Customization Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
          {/* Left: Performance Stats & Upgrades */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              PERFORMANCE & TUNING
            </span>

            {/* Stat Row 1: Top Speed */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <Gauge size={13} className="text-cyan-400" /> Top Speed
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{effectiveStats.topSpeed} km/h</span>
                {isUnlocked && (
                  <button
                    disabled={currentUpgrades.speed >= 5 || saveData.coins < GameStorage.getUpgradeCost(currentUpgrades.speed)}
                    onClick={() => handleUpgrade('speed')}
                    className="px-2 py-0.5 rounded bg-cyan-600/30 border border-cyan-500/50 hover:bg-cyan-600/50 text-[10px] font-bold text-cyan-300 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {currentUpgrades.speed >= 5 ? 'MAX' : `+8 (${GameStorage.getUpgradeCost(currentUpgrades.speed)}★)`}
                  </button>
                )}
              </div>
            </div>

            {/* Stat Row 2: Acceleration */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <Flame size={13} className="text-amber-400" /> Acceleration
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{effectiveStats.acceleration}%</span>
                {isUnlocked && (
                  <button
                    disabled={currentUpgrades.accel >= 5 || saveData.coins < GameStorage.getUpgradeCost(currentUpgrades.accel)}
                    onClick={() => handleUpgrade('accel')}
                    className="px-2 py-0.5 rounded bg-amber-600/30 border border-amber-500/50 hover:bg-amber-600/50 text-[10px] font-bold text-amber-300 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {currentUpgrades.accel >= 5 ? 'MAX' : `+5% (${GameStorage.getUpgradeCost(currentUpgrades.accel)}★)`}
                  </button>
                )}
              </div>
            </div>

            {/* Stat Row 3: Handling */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <ShieldAlert size={13} className="text-emerald-400" /> Handling
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{effectiveStats.handling}%</span>
                {isUnlocked && (
                  <button
                    disabled={currentUpgrades.handling >= 5 || saveData.coins < GameStorage.getUpgradeCost(currentUpgrades.handling)}
                    onClick={() => handleUpgrade('handling')}
                    className="px-2 py-0.5 rounded bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/50 text-[10px] font-bold text-emerald-300 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {currentUpgrades.handling >= 5 ? 'MAX' : `+4% (${GameStorage.getUpgradeCost(currentUpgrades.handling)}★)`}
                  </button>
                )}
              </div>
            </div>

            {/* Stat Row 4: Nitro Capacity */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <Zap size={13} className="text-blue-400" /> Nitro Boost
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{effectiveStats.nitroCapacity.toFixed(1)}s</span>
                {isUnlocked && (
                  <button
                    disabled={currentUpgrades.nitro >= 5 || saveData.coins < GameStorage.getUpgradeCost(currentUpgrades.nitro)}
                    onClick={() => handleUpgrade('nitro')}
                    className="px-2 py-0.5 rounded bg-blue-600/30 border border-blue-500/50 hover:bg-blue-600/50 text-[10px] font-bold text-blue-300 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {currentUpgrades.nitro >= 5 ? 'MAX' : `+0.5s (${GameStorage.getUpgradeCost(currentUpgrades.nitro)}★)`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Paint Customizer & Action Button */}
          <div className="flex flex-col justify-between gap-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                CUSTOM AUTOMOTIVE PAINT
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PALETTE.map((color) => {
                  const isCurrent = currentColor.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      key={color.hex}
                      onClick={() => handleChangeColor(color.hex)}
                      title={color.name}
                      aria-label={`Select color ${color.name}`}
                      className={`w-7 h-7 rounded-full transition-transform active:scale-95 flex items-center justify-center border-2 ${
                        isCurrent ? 'border-white scale-110 shadow-lg' : 'border-slate-800'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isCurrent && <Check size={14} className="text-slate-900 drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Button: Unlock / Equip / Race */}
            <div className="flex items-center gap-2 pt-1">
              {!isUnlocked ? (
                <button
                  disabled={saveData.coins < activeCar.price}
                  onClick={handleUnlockCar}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all shadow-xl disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  <Award size={18} />
                  <span>UNLOCK FOR {activeCar.price} ★</span>
                </button>
              ) : isSelected ? (
                <button
                  onClick={onStartRace}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Play size={18} className="fill-slate-950" />
                  <span>RACE WITH {activeCar.name}</span>
                </button>
              ) : (
                <button
                  onClick={handleSetEquipped}
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 text-white font-black text-sm tracking-wider uppercase hover:bg-cyan-500 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  <span>SELECT & EQUIP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
