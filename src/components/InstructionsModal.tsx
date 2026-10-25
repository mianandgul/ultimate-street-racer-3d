import React from 'react';
import { X, Smartphone, Keyboard, Zap, Award, Flame, Navigation } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-none flex items-center justify-center p-4 z-40 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white tracking-wider uppercase">HOW TO PLAY & CONTROLS</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Automatic Forward Driving Notice */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 flex items-start gap-2.5">
          <Navigation size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-200 leading-relaxed">
            <strong className="text-white block font-bold text-sm mb-0.5">Automatic Forward Driving</strong>
            Your sports car continuously cruises forward at full racing velocity automatically! No gas or brake button is needed—focus on steering to collect coins and avoid obstacles.
          </p>
        </div>

        {/* Mobile Touch Controls */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Smartphone size={15} /> MOBILE & ANDROID TOUCH CONTROLS
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
              <span className="font-bold text-cyan-300 flex items-center gap-1">
                ◀ Hold STEER LEFT
              </span>
              <span className="text-[11px] text-slate-300">
                Moves car smoothly into left lanes. Release to stop steering immediately.
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
              <span className="font-bold text-cyan-300 flex items-center gap-1">
                Hold STEER RIGHT ▶
              </span>
              <span className="text-[11px] text-slate-300">
                Moves car smoothly into right lanes. Release to stop steering immediately.
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Keyboard size={15} /> DESKTOP KEYBOARD CONTROLS
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-slate-300">Steer Left</span>
              <span className="font-mono font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">A or ◄</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-slate-300">Steer Right</span>
              <span className="font-mono font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">D or ►</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-slate-300">Change Camera</span>
              <span className="font-mono font-bold text-yellow-300 bg-slate-800 px-2 py-0.5 rounded">C</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
              <span className="text-slate-300">Pause / Menu</span>
              <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">Esc / P</span>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Award size={15} /> RACING PRO TIPS
          </span>
          <div className="flex flex-col gap-2 text-xs text-slate-300">
            <div className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <Zap size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Near Misses:</strong> Overtake AI traffic cars closely at high speed (&gt;140 km/h) without touching them to trigger <strong>+150 bonus points</strong>!
              </span>
            </div>

            <div className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <Flame size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Collect Coins & Tanks:</strong> Grab spinning gold stars on the road to buy the <strong>Viper X</strong>, <strong>Phantom Hypercar</strong>, and <strong>Cyber Turbo</strong> in the garage, and upgrade their performance!
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg"
        >
          GOT IT, LET'S RACE!
        </button>
      </div>
    </div>
  );
};
