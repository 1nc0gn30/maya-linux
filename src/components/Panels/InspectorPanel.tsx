import React from 'react';
import { ProjectState } from '../../types/project';
import { Sparkles, Hand, Gauge, Type, Music, X } from 'lucide-react';
import { ZoomFocus, AnimationCurve, TapStyle, BadgeStyle } from '../../types/models';

interface InspectorPanelProps {
  project: ProjectState;
  onChange: (updater: Partial<ProjectState>) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ project, onChange }) => {
  if (!project.selectedEvent) return null;

  const close = () => onChange({ selectedEvent: null });

  if (project.selectedEvent.type === 'audio') {
    const audio = project.audioTracks?.find(a => a.id === project.selectedEvent?.id);
    if (!audio) return null;

    const update = (partial: Partial<typeof audio>) => {
      onChange({
        audioTracks: (project.audioTracks || []).map(a => (a.id === audio.id ? { ...a, ...partial } : a)),
      });
    };

    return (
      <div className="w-72 border-l border-slate-800/80 bg-dark-900/80 backdrop-blur p-4 select-none text-xs space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-semibold text-indigo-400">
            <Music className="w-4 h-4" />
            <span>Audio Track</span>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 text-[11px]">Track Name</span>
          <p className="font-mono text-slate-200 text-xs truncate bg-dark-950 p-2 rounded-xl border border-slate-800">
            {audio.name}
          </p>
        </div>

        {/* Volume */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Volume</span>
            <span className="font-mono text-slate-200">{Math.round(audio.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audio.volume}
            onChange={(e) => update({ volume: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>
    );
  }

  if (project.selectedEvent.type === 'zoom') {
    const zoom = project.animations.find(a => a.id === project.selectedEvent?.id);
    if (!zoom) return null;

    const update = (partial: Partial<typeof zoom>) => {
      onChange({
        animations: project.animations.map(a => (a.id === zoom.id ? { ...a, ...partial } : a)),
      });
    };

    return (
      <div className="w-72 border-l border-slate-800/80 bg-dark-900/80 backdrop-blur p-4 select-none text-xs space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-semibold text-brand-400">
            <Sparkles className="w-4 h-4" />
            <span>Zoom Settings</span>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scale */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Zoom Scale</span>
            <span className="font-mono text-slate-200">{zoom.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="1.05"
            max="2.5"
            step="0.05"
            value={zoom.scale}
            onChange={(e) => update({ scale: parseFloat(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>

        {/* Focus */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px]">Focus Anchor</span>
          <div className="grid grid-cols-3 gap-1 bg-dark-950 p-1 rounded-xl border border-slate-800">
            {(['top', 'center', 'bottom'] as ZoomFocus[]).map((f) => (
              <button
                key={f}
                onClick={() => update({ focus: f })}
                className={`py-1 rounded-lg capitalize font-medium transition ${
                  zoom.focus === f ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Curve */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px]">Animation Curve</span>
          <div className="grid grid-cols-2 gap-1.5">
            {(['spring', 'bouncy', 'smooth', 'snappy', 'gentle', 'linear'] as AnimationCurve[]).map((c) => (
              <button
                key={c}
                onClick={() => update({ curve: c })}
                className={`py-1.5 px-2 rounded-xl capitalize font-medium text-left border transition ${
                  zoom.curve === c 
                    ? 'bg-brand-500/20 border-brand-400 text-brand-300' 
                    : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Duration</span>
            <span className="font-mono text-slate-200">{zoom.duration.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.1"
            value={zoom.duration}
            onChange={(e) => update({ duration: parseFloat(e.target.value) })}
            className="w-full accent-brand-500 cursor-pointer"
          />
        </div>
      </div>
    );
  }

  if (project.selectedEvent.type === 'tap') {
    const tap = project.tapEvents.find(t => t.id === project.selectedEvent?.id);
    if (!tap) return null;

    const update = (partial: Partial<typeof tap>) => {
      onChange({
        tapEvents: project.tapEvents.map(t => (t.id === tap.id ? { ...t, ...partial } : t)),
      });
    };

    return (
      <div className="w-72 border-l border-slate-800/80 bg-dark-900/80 backdrop-blur p-4 select-none text-xs space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-semibold text-pink-400">
            <Hand className="w-4 h-4" />
            <span>Tap Feedback</span>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Style */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px]">Animation Style</span>
          <div className="grid grid-cols-3 gap-1 bg-dark-950 p-1 rounded-xl border border-slate-800">
            {(['ripple', 'pulse', 'ring'] as TapStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => update({ style: s })}
                className={`py-1 rounded-lg capitalize font-medium transition ${
                  tap.style === s ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* SFX Click */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-dark-950 border border-slate-800">
          <span className="text-slate-300 text-[11px]">Play Click Sound</span>
          <input
            type="checkbox"
            checked={tap.playSound}
            onChange={(e) => update({ playSound: e.target.checked })}
            className="accent-pink-500 w-4 h-4 cursor-pointer"
          />
        </div>

        {/* Size */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Feedback Size</span>
            <span className="font-mono text-slate-200">{(tap.diameterFraction * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.08"
            max="0.36"
            step="0.01"
            value={tap.diameterFraction}
            onChange={(e) => update({ diameterFraction: parseFloat(e.target.value) })}
            className="w-full accent-pink-500 cursor-pointer"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Duration</span>
            <span className="font-mono text-slate-200">{tap.duration.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="1.5"
            step="0.05"
            value={tap.duration}
            onChange={(e) => update({ duration: parseFloat(e.target.value) })}
            className="w-full accent-pink-500 cursor-pointer"
          />
        </div>
      </div>
    );
  }

  if (project.selectedEvent.type === 'overlay') {
    const overlay = project.overlays?.find(o => o.id === project.selectedEvent?.id);
    if (!overlay) return null;

    const update = (partial: Partial<typeof overlay>) => {
      onChange({
        overlays: project.overlays.map(o => (o.id === overlay.id ? { ...o, ...partial } : o)),
      });
    };

    return (
      <div className="w-72 border-l border-slate-800/80 bg-dark-900/80 backdrop-blur p-4 select-none text-xs space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-semibold text-emerald-400">
            <Type className="w-4 h-4" />
            <span>Badge & Text Callout</span>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Input */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px]">Callout Text</span>
          <input
            type="text"
            value={overlay.text}
            onChange={(e) => update({ text: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-800 text-white font-medium focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Style */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px]">Badge Style</span>
          <div className="grid grid-cols-3 gap-1 bg-dark-950 p-1 rounded-xl border border-slate-800">
            {(['pill', 'frosted', 'neon'] as BadgeStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => update({ style: s })}
                className={`py-1 rounded-lg capitalize font-medium transition ${
                  overlay.style === s ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Font Size</span>
            <span className="font-mono text-slate-200">{overlay.fontSize}px</span>
          </div>
          <input
            type="range"
            min="14"
            max="36"
            step="1"
            value={overlay.fontSize}
            onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Duration</span>
            <span className="font-mono text-slate-200">{overlay.duration.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="8.0"
            step="0.25"
            value={overlay.duration}
            onChange={(e) => update({ duration: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>
    );
  }

  if (project.selectedEvent.type === 'speed') {
    const speed = project.speedSegments.find(s => s.id === project.selectedEvent?.id);
    if (!speed) return null;

    const update = (partial: Partial<typeof speed>) => {
      onChange({
        speedSegments: project.speedSegments.map(s => (s.id === speed.id ? { ...s, ...partial } : s)),
      });
    };

    return (
      <div className="w-72 border-l border-slate-800/80 bg-dark-900/80 backdrop-blur p-4 select-none text-xs space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-semibold text-amber-400">
            <Gauge className="w-4 h-4" />
            <span>Speed Segment</span>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rate Presets */}
        <div className="space-y-1.5">
          <span className="text-slate-400 text-[11px]">Speed Rate</span>
          <div className="grid grid-cols-4 gap-1.5">
            {[0.25, 0.5, 1.5, 2.0, 3.0, 4.0].map((rate) => (
              <button
                key={rate}
                onClick={() => update({ rate })}
                className={`py-1.5 rounded-xl font-mono font-medium transition border ${
                  speed.rate === rate
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Duration</span>
            <span className="font-mono text-slate-200">{speed.duration.toFixed(2)}s</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="10.0"
            step="0.25"
            value={speed.duration}
            onChange={(e) => update({ duration: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>
    );
  }

  return null;
};
