import React from 'react';
import { RotateCcw, Wrench, Home, Trophy, Gauge, Zap } from 'lucide-react';
import { RaceSummary } from '../types/game';

interface GameOverModalProps {
  summary: RaceSummary;
  onRestart: () => void;
  onOpenGarage: () => void;
  onQuitToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  onRestart,
  onOpenGarage,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-none flex items-center justify-center p-4 z-40 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4 text-center">
        {/* Crash Header */}
        <div>
          <span className="text-xs font-black tracking-widest text-red-400 uppercase bg-red-950/60 px-3 py-1 rounded-full border border-red-500/40">
            TOTALED IN TRAFFIC
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-wider mt-1 drop-shadow">
            CRASHED!
          </h3>
        </div>

        {/* New High Score Announcement */}
        {summary.isNewHighScore && (
          <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/80 rounded-2xl p-2.5 flex items-center justify-center gap-2 text-amber-300 font-black text-sm tracking-wide shadow-lg">
            <Trophy size={18} className="text-amber-400 animate-bounce" />
            <span>NEW ALL-TIME HIGH SCORE!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left pt-1">
          {/* Final Score */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">FINAL SCORE</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {summary.score.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">DISTANCE</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
              {summary.distance.toLocaleString()} <span className="text-xs text-slate-400">m</span>
            </span>
          </div>

          {/* Coins Earned */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">COINS EARNED</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 font-black text-[10px]">
                ★
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">
                +{summary.coinsEarned}
              </span>
            </div>
          </div>

          {/* Peak Speed */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">TOP SPEED</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Gauge size={14} className="text-cyan-400" />
              <span className="text-lg sm:text-xl font-black text-white font-mono">
                {summary.maxSpeed} <span className="text-xs text-slate-400">km/h</span>
              </span>
            </div>
          </div>
        </div>

        {/* Near Misses Badge */}
        {summary.nearMisses > 0 && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs text-slate-300">
            <Zap size={13} className="text-yellow-400 fill-yellow-400" />
            <span>Near Misses Overtaken: </span>
            <strong className="text-amber-400 font-mono">{summary.nearMisses}</strong>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onRestart}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-slate-950 font-black text-base uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 border border-cyan-300"
          >
            <RotateCcw size={20} className="stroke-[2.5]" />
            <span>RACE AGAIN</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenGarage}
              className="py-3 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Wrench size={15} className="text-cyan-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={onQuitToMenu}
              className="py-3 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Home size={15} />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
