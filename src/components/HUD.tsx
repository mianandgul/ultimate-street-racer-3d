import React, { useEffect, useState, useCallback } from 'react';
import { Camera, Volume2, VolumeX, Pause, ArrowLeft, ArrowRight } from 'lucide-react';
import { CameraViewMode, ControlInputs } from '../types/game';

interface HUDProps {
  speedKmH: number;
  nitroPercent: number;
  score: number;
  coins: number;
  distance: number;
  comboText: string | null;
  cameraMode: CameraViewMode;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSwitchCamera: () => void;
  onPause: () => void;
  setControls: (setter: (prev: ControlInputs) => ControlInputs) => void;
}

export const HUD: React.FC<HUDProps> = ({
  speedKmH,
  nitroPercent,
  score,
  coins,
  distance,
  comboText,
  cameraMode,
  soundEnabled,
  onToggleSound,
  onSwitchCamera,
  onPause,
  setControls,
}) => {
  const [activeSteer, setActiveSteer] = useState<'left' | 'right' | null>(null);

  // Compute calculated gear based on speed
  const gear = speedKmH < 120 ? '4' : speedKmH < 180 ? '5' : speedKmH < 240 ? '6' : '7';

  // Release all steering inputs reliably
  const releaseSteering = useCallback(() => {
    setActiveSteer(null);
    setControls((prev) => {
      if (!prev.steerLeft && !prev.steerRight) return prev;
      return { ...prev, steerLeft: false, steerRight: false };
    });
  }, [setControls]);

  // Start steering left
  const startSteerLeft = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      setActiveSteer('left');
      setControls((prev) => ({ ...prev, steerLeft: true, steerRight: false }));
    },
    [setControls]
  );

  // Start steering right
  const startSteerRight = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      setActiveSteer('right');
      setControls((prev) => ({ ...prev, steerRight: true, steerLeft: false }));
    },
    [setControls]
  );

  // Global safety listeners: prevent buttons from getting stuck if finger slides off screen
  useEffect(() => {
    const handleGlobalRelease = () => {
      releaseSteering();
    };

    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('touchcancel', handleGlobalRelease);
    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);

    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
    };
  }, [releaseSteering]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 pb-4 sm:pb-6 z-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full">
        {/* Score, Distance & Coins Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Score Badge */}
          <div className="bg-slate-900/95 border border-cyan-400/60 rounded-2xl px-3.5 sm:px-4 py-1.5 shadow-xl text-left">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-black block">SCORE</span>
            <span className="text-xl sm:text-2xl font-black text-white tracking-wide font-mono">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Distance Badge */}
          <div className="bg-slate-900/95 border border-slate-700 rounded-2xl px-3 sm:px-3.5 py-1.5 shadow-xl text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">DISTANCE</span>
            <span className="text-sm sm:text-base font-bold text-slate-100 font-mono">
              {distance} <span className="text-xs text-slate-400">m</span>
            </span>
          </div>

          {/* Coins Badge */}
          <div className="bg-slate-900/95 border border-amber-400/70 rounded-2xl px-3 sm:px-3.5 py-1.5 shadow-xl flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-black text-xs shadow">
              ★
            </span>
            <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
              {coins}
            </span>
          </div>
        </div>

        {/* Top Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-md"
          >
            {soundEnabled ? <Volume2 size={18} className="text-cyan-400" /> : <VolumeX size={18} className="text-slate-400" />}
          </button>

          <button
            onClick={onSwitchCamera}
            aria-label="Switch Camera View"
            className="px-2.5 h-10 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 flex items-center gap-1.5 hover:bg-slate-800 active:scale-95 transition-all shadow-md text-xs font-bold uppercase tracking-wide"
          >
            <Camera size={16} className="text-cyan-400" />
            <span className="hidden sm:inline">{cameraMode}</span>
          </button>

          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-md"
          >
            <Pause size={18} className="text-amber-400" />
          </button>
        </div>
      </div>

      {/* Center Dynamic Combo & Near Miss Banner */}
      <div className="flex flex-col items-center justify-center pointer-events-none min-h-[50px]">
        {comboText && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-red-500 text-slate-950 font-black text-base sm:text-2xl px-6 py-2 rounded-2xl shadow-2xl border-2 border-yellow-200 tracking-wider animate-bounce">
            {comboText}
          </div>
        )}
      </div>

      {/* Bottom Area: Speedometer & Large Left/Right Steering Buttons */}
      <div className="flex flex-col gap-2.5 w-full max-w-4xl mx-auto">
        {/* Speedometer & Auto-Cruising Banner */}
        <div className="flex items-center justify-between w-full px-1">
          {/* Speedometer Display */}
          <div className="bg-slate-900/95 border border-cyan-400/60 rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-3">
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight block leading-none">
                {speedKmH}
              </span>
              <span className="text-[10px] uppercase font-black text-cyan-400 tracking-widest">
                KM / H
              </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700" />
            <div className="text-center pr-1">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">AUTO DRIVE</span>
              <span className="text-sm font-black text-emerald-400 font-mono leading-none">GEAR {gear}</span>
            </div>
          </div>

          {/* Desktop Keyboard Hints */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-400">
            <span><strong className="text-cyan-300">A / ◄</strong>: Steer Left</span>
            <span>•</span>
            <span><strong className="text-cyan-300">D / ►</strong>: Steer Right</span>
          </div>

          {/* Active Nitro Boost Indicator (Refills from canisters / near misses) */}
          {nitroPercent > 5 && (
            <div className="bg-slate-900/95 border border-blue-400/60 rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="text-left">
                <span className="text-[9px] text-cyan-400 font-black tracking-wider block">BOOST POWER</span>
                <span className="text-xs font-mono font-bold text-white">{nitroPercent}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Large, Responsive Left & Right Touch Steering Buttons */}
        <div className="pointer-events-auto grid grid-cols-2 gap-3 sm:gap-6 w-full pt-1 px-1">
          {/* Large Left Steer Button */}
          <button
            onPointerDown={startSteerLeft}
            onPointerUp={releaseSteering}
            onPointerCancel={releaseSteering}
            onPointerLeave={releaseSteering}
            onTouchStart={startSteerLeft}
            onTouchEnd={releaseSteering}
            onTouchCancel={releaseSteering}
            onMouseDown={startSteerLeft}
            onMouseUp={releaseSteering}
            onMouseLeave={releaseSteering}
            aria-label="Steer Left"
            className={`w-full h-20 sm:h-24 rounded-3xl border-2 flex items-center justify-center gap-2.5 shadow-2xl transition-all active:scale-95 touch-none select-none ${
              activeSteer === 'left'
                ? 'bg-cyan-500 border-white text-slate-950 scale-95 shadow-cyan-500/50'
                : 'bg-slate-900/95 border-cyan-400/80 text-cyan-300 hover:border-cyan-300 hover:bg-slate-850'
            }`}
          >
            <ArrowLeft size={36} className="shrink-0 stroke-[2.5]" />
            <span className="font-black text-lg sm:text-xl tracking-wider uppercase font-mono">
              STEER LEFT
            </span>
          </button>

          {/* Large Right Steer Button */}
          <button
            onPointerDown={startSteerRight}
            onPointerUp={releaseSteering}
            onPointerCancel={releaseSteering}
            onPointerLeave={releaseSteering}
            onTouchStart={startSteerRight}
            onTouchEnd={releaseSteering}
            onTouchCancel={releaseSteering}
            onMouseDown={startSteerRight}
            onMouseUp={releaseSteering}
            onMouseLeave={releaseSteering}
            aria-label="Steer Right"
            className={`w-full h-20 sm:h-24 rounded-3xl border-2 flex items-center justify-center gap-2.5 shadow-2xl transition-all active:scale-95 touch-none select-none ${
              activeSteer === 'right'
                ? 'bg-cyan-500 border-white text-slate-950 scale-95 shadow-cyan-500/50'
                : 'bg-slate-900/95 border-cyan-400/80 text-cyan-300 hover:border-cyan-300 hover:bg-slate-850'
            }`}
          >
            <span className="font-black text-lg sm:text-xl tracking-wider uppercase font-mono">
              STEER RIGHT
            </span>
            <ArrowRight size={36} className="shrink-0 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
