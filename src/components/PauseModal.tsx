import React from 'react';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-none flex items-center justify-center p-4 z-40 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
        <h3 className="text-2xl font-black text-white tracking-wider uppercase">GAME PAUSED</h3>
        <p className="text-xs text-slate-400">Take a breather or adjust your racing settings.</p>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Play size={18} className="fill-slate-950" />
            <span>RESUME RACE</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm uppercase tracking-wider hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} className="text-amber-400" />
            <span>RESTART</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm uppercase tracking-wider hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Settings size={16} className="text-cyan-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={onQuitToMenu}
            className="w-full py-3 px-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 font-bold text-sm uppercase tracking-wider hover:bg-red-950/40 hover:border-red-500/40 hover:text-red-300 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
          >
            <Home size={16} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
