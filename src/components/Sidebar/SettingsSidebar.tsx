import React from 'react';
import { 
  Smartphone, 
  Layers, 
  Crop, 
  Sliders,
  Palette,
  Compass,
  Sparkles
} from 'lucide-react';
import { ProjectState } from '../../types/project';
import { DEVICE_MODELS, CANVAS_ASPECTS, GRADIENT_PRESETS, SOLID_PRESETS } from '../../models/devices';
import { CanvasAspectRatioType } from '../../types/models';

interface SettingsSidebarProps {
  project: ProjectState;
  onChange: (updater: Partial<ProjectState>) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ project, onChange }) => {
  const currentModel = DEVICE_MODELS.find(m => m.id === project.deviceModelID) || DEVICE_MODELS[2];

  return (
    <aside className="w-80 border-r border-slate-800/80 bg-dark-900/60 backdrop-blur overflow-y-auto flex flex-col select-none text-xs p-4 space-y-6">
      {/* 1. Canvas Aspect Ratio */}
      <section className="space-y-2.5">
        <div className="flex items-center space-x-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          <Crop className="w-3.5 h-3.5 text-brand-400" />
          <span>Canvas Aspect</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 bg-dark-950/80 p-1 rounded-xl border border-slate-800/80">
          {(Object.keys(CANVAS_ASPECTS) as CanvasAspectRatioType[]).map((key) => {
            const aspect = CANVAS_ASPECTS[key];
            const isSelected = project.canvasAspect === key;
            return (
              <button
                key={key}
                onClick={() => onChange({ canvasAspect: key })}
                className={`py-1.5 px-1 rounded-lg text-center font-medium transition flex flex-col items-center justify-center space-y-0.5 ${
                  isSelected 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className="font-bold text-[11px]">{aspect.shortLabel}</span>
                <span className="text-[8px] opacity-75 truncate max-w-full">{aspect.displayName.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Device Model & Color */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          <Smartphone className="w-3.5 h-3.5 text-brand-400" />
          <span>Device Frame</span>
        </div>

        {/* Model Picker */}
        <div className="grid grid-cols-2 gap-1.5">
          {DEVICE_MODELS.map((model) => {
            const isSelected = project.deviceModelID === model.id;
            return (
              <button
                key={model.id}
                onClick={() => {
                  onChange({
                    deviceModelID: model.id,
                    deviceColorID: model.defaultColor.id,
                  });
                }}
                className={`px-3 py-2 rounded-xl text-left border font-medium transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-sm'
                    : 'bg-dark-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="truncate">{model.displayName}</span>
              </button>
            );
          })}
        </div>

        {/* Color Variants (if physical) */}
        {currentModel.kind === 'physical' && currentModel.colors.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-slate-400 text-[11px]">Finish / Color</span>
            <div className="flex items-center space-x-2">
              {currentModel.colors.map((c) => {
                const isSelected = project.deviceColorID === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onChange({ deviceColorID: c.id })}
                    title={c.name}
                    className={`w-7 h-7 rounded-full transition relative flex items-center justify-center p-0.5 border ${
                      isSelected
                        ? 'border-brand-400 scale-110 shadow-md shadow-brand-500/20'
                        : 'border-slate-700/60 hover:scale-105'
                    }`}
                  >
                    <div 
                      className="w-full h-full rounded-full shadow-inner"
                      style={{ backgroundColor: c.swatchHex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Generic Bezel Controls */}
        {currentModel.kind === 'generic' && (
          <div className="space-y-3 p-3 rounded-xl bg-dark-950/80 border border-slate-800/80">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Bezel Width</span>
                <span className="font-mono text-slate-300">{(project.bareBezelWidth * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.08"
                step="0.005"
                value={project.bareBezelWidth}
                onChange={(e) => onChange({ bareBezelWidth: parseFloat(e.target.value) })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Corner Radius</span>
                <span className="font-mono text-slate-300">{(project.bareCornerRadius * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={project.bareCornerRadius}
                onChange={(e) => onChange({ bareCornerRadius: parseFloat(e.target.value) })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </section>

      {/* 3. 3D Perspective & Gyro Tilt */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <Compass className="w-3.5 h-3.5 text-brand-400" />
            <span>3D Tilt & Angle</span>
          </div>
          <button
            onClick={() => onChange({
              transform3D: { ...project.transform3D, enabled: !project.transform3D.enabled }
            })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
              project.transform3D.enabled
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-dark-950 text-slate-500 border-slate-800'
            }`}
          >
            {project.transform3D.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {project.transform3D.enabled && (
          <div className="space-y-3 p-3 rounded-xl bg-dark-950/80 border border-slate-800/80 animate-in fade-in">
            {/* Quick 3D Presets */}
            <div className="grid grid-cols-3 gap-1 pb-1 border-b border-slate-800/60">
              <button
                onClick={() => onChange({
                  transform3D: { ...project.transform3D, rotateX: 12, rotateY: -18, rotateZ: 4 }
                })}
                className="py-1 rounded-lg bg-dark-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium"
              >
                Isometric Left
              </button>
              <button
                onClick={() => onChange({
                  transform3D: { ...project.transform3D, rotateX: 12, rotateY: 18, rotateZ: -4 }
                })}
                className="py-1 rounded-lg bg-dark-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium"
              >
                Isometric Right
              </button>
              <button
                onClick={() => onChange({
                  transform3D: { ...project.transform3D, rotateX: 0, rotateY: 0, rotateZ: 0 }
                })}
                className="py-1 rounded-lg bg-dark-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium"
              >
                Flat / Reset
              </button>
            </div>

            {/* Pitch */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Pitch (Rotate X)</span>
                <span className="font-mono text-slate-300">{project.transform3D.rotateX}°</span>
              </div>
              <input
                type="range"
                min="-35"
                max="35"
                step="1"
                value={project.transform3D.rotateX}
                onChange={(e) => onChange({
                  transform3D: { ...project.transform3D, rotateX: parseInt(e.target.value) }
                })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            {/* Yaw */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Yaw (Rotate Y)</span>
                <span className="font-mono text-slate-300">{project.transform3D.rotateY}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={project.transform3D.rotateY}
                onChange={(e) => onChange({
                  transform3D: { ...project.transform3D, rotateY: parseInt(e.target.value) }
                })}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            {/* Cinematic Auto Drift */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 text-[11px]">Cinematic Parallax Drift</span>
              <input
                type="checkbox"
                checked={project.transform3D.autoDrift}
                onChange={(e) => onChange({
                  transform3D: { ...project.transform3D, autoDrift: e.target.checked }
                })}
                className="accent-brand-500 cursor-pointer w-4 h-4 rounded"
              />
            </div>
          </div>
        )}
      </section>

      {/* 4. Background Settings */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          <Palette className="w-3.5 h-3.5 text-brand-400" />
          <span>Background</span>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-dark-950/80 p-1 rounded-xl border border-slate-800/80">
          {(['gradient', 'solid', 'videoBlur', 'none'] as const).map((mode) => {
            const isSelected = project.background.type === mode;
            const labels: Record<string, string> = {
              gradient: 'Gradient',
              solid: 'Solid',
              videoBlur: 'Blur',
              none: 'Alpha',
            };
            return (
              <button
                key={mode}
                onClick={() => {
                  if (mode === 'gradient') {
                    onChange({ background: { type: 'gradient', gradient: GRADIENT_PRESETS[0] } });
                  } else if (mode === 'solid') {
                    onChange({ background: { type: 'solid', hex: SOLID_PRESETS[0] } });
                  } else if (mode === 'videoBlur') {
                    onChange({ background: { type: 'videoBlur' } });
                  } else {
                    onChange({ background: { type: 'none' } });
                  }
                }}
                className={`py-1.5 rounded-lg text-center font-medium transition ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {/* Gradient Presets */}
        {project.background.type === 'gradient' && (
          <div className="grid grid-cols-4 gap-2 pt-1">
            {GRADIENT_PRESETS.map((grad, i) => {
              const isSelected = project.background.gradient?.startHex === grad.startHex &&
                                 project.background.gradient?.endHex === grad.endHex;
              return (
                <button
                  key={i}
                  onClick={() => onChange({ background: { type: 'gradient', gradient: grad } })}
                  className={`h-10 rounded-xl transition border overflow-hidden relative shadow-sm ${
                    isSelected ? 'border-brand-400 ring-2 ring-brand-500/40 scale-105' : 'border-slate-700/60 hover:scale-102'
                  }`}
                  style={{
                    background: `linear-gradient(${grad.angleDegrees}deg, ${grad.startHex}, ${grad.endHex})`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Solid Presets */}
        {project.background.type === 'solid' && (
          <div className="grid grid-cols-5 gap-2 pt-1">
            {SOLID_PRESETS.map((hex, i) => {
              const isSelected = project.background.hex === hex;
              return (
                <button
                  key={i}
                  onClick={() => onChange({ background: { type: 'solid', hex } })}
                  className={`h-8 rounded-xl transition border shadow-inner ${
                    isSelected ? 'border-brand-400 ring-2 ring-brand-500/40 scale-105' : 'border-slate-700/60 hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Canvas Position & Scale */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          <Sliders className="w-3.5 h-3.5 text-brand-400" />
          <span>Scale & Framing</span>
        </div>

        <div className="space-y-3 p-3 rounded-xl bg-dark-950/80 border border-slate-800/80">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Device Scale</span>
              <span className="font-mono text-slate-300">{(project.scale * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.5"
              step="0.01"
              value={project.scale}
              onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Drop Shadow Opacity</span>
              <span className="font-mono text-slate-300">{(project.shadow.opacity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={project.shadow.opacity}
              onChange={(e) => onChange({ 
                shadow: { ...project.shadow, opacity: parseFloat(e.target.value) } 
              })}
              className="w-full accent-brand-500 cursor-pointer"
            />
          </div>
        </div>
      </section>
    </aside>
  );
};
