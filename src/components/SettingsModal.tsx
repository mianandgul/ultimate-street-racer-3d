import React from 'react';
import { X, Volume2, VolumeX, Music, Monitor, Sun } from 'lucide-react';
import { GameSettings } from '../types/game';
import { EnvironmentTheme } from '../game/environment';

interface SettingsModalProps {
  settings: GameSettings;
  currentTheme: EnvironmentTheme;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onSelectTheme: (theme: EnvironmentTheme) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  currentTheme,
  onUpdateSettings,
  onSelectTheme,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-none flex items-center justify-center p-4 z-40 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white tracking-wider uppercase">GAME SETTINGS</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Audio Section */}
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">AUDIO & SOUND</span>

          {/* Sound Effects Toggle & Slider */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                {settings.soundEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} className="text-slate-500" />}
                Sound Effects (Engine, Crash, NOS)
              </span>
              <button
                onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                  settings.soundEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
            {settings.soundEnabled && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            )}
          </div>

          {/* Synthwave Music Toggle & Slider */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Music size={16} className={settings.musicEnabled ? 'text-amber-400' : 'text-slate-500'} />
                Synthwave Racing Soundtrack
              </span>
              <button
                onClick={() => onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled })}
                className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${
                  settings.musicEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
            {settings.musicEnabled && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Graphics Performance Section */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Monitor size={14} /> GRAPHICS PRESET (PERFORMANCE)
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => onUpdateSettings({ ...settings, graphicsQuality: q })}
                className={`py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  settings.graphicsQuality === q
                    ? 'bg-cyan-600/30 border-cyan-400 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {q === 'low' ? 'Low (Fast)' : q === 'medium' ? 'Medium' : 'High (HD)'}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400">
            *Low mode optimizes resolution and disables shadow passes for smooth 60fps on Android phones.
          </span>
        </div>

        {/* Atmosphere / Time of Day */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sun size={14} /> HIGHWAY ATMOSPHERE
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cyber_night', label: 'Cyber Night' },
              { id: 'sunset', label: 'Sunset Dusk' },
              { id: 'daylight', label: 'Daylight' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => onSelectTheme(theme.id as EnvironmentTheme)}
                className={`py-2 px-1 rounded-xl text-xs font-black uppercase tracking-wider border transition-all text-center ${
                  currentTheme === theme.id
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg"
        >
          SAVE & CLOSE
        </button>
      </div>
    </div>
  );
};
