import React, { useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Hand, 
  Gauge, 
  Type,
  Music,
  Trash2,
  Scissors
} from 'lucide-react';
import { ProjectState } from '../../types/project';
import { SpeedTimeline } from '../../models/speedTimeline';
import { ZoomSegment, TapEvent, SpeedSegment, TextOverlay, AudioTrack } from '../../types/models';
import { soundManager } from '../../services/audioService';
import { AudioImportModal } from './AudioImportModal';

interface TimelineProps {
  project: ProjectState;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onChange: (updater: Partial<ProjectState>) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  onSeek,
  onTogglePlay,
  onToggleMute,
  onChange,
}) => {
  const tracksRef = useRef<HTMLDivElement>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const speedTimeline = new SpeedTimeline(
    project.trimStartTime,
    project.trimEndTime,
    project.speedSegments
  );

  const totalDuration = speedTimeline.duration || project.videoDuration || 10;
  const playheadPercent = totalDuration > 0 ? (project.currentSeconds / totalDuration) * 100 : 0;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tracksRef.current || totalDuration <= 0) return;
    const rect = tracksRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = fraction * totalDuration;
    onSeek(targetSeconds);
  };

  const addZoom = () => {
    soundManager.playWhoosh();
    const sourceTime = speedTimeline.sourceTime(project.currentSeconds);
    const newZoom: ZoomSegment = {
      id: crypto.randomUUID(),
      startTime: sourceTime,
      duration: 2.0,
      scale: 1.35,
      focus: 'center',
      transitionIn: 0.45,
      transitionOut: 0.45,
      curve: 'spring',
    };
    onChange({
      animations: [...project.animations, newZoom],
      selectedEvent: { type: 'zoom', id: newZoom.id },
    });
  };

  const addTap = () => {
    soundManager.playTapClick();
    const sourceTime = speedTimeline.sourceTime(project.currentSeconds);
    const newTap: TapEvent = {
      id: crypto.randomUUID(),
      startTime: sourceTime,
      duration: 0.65,
      position: { x: 0.5, y: 0.5 },
      style: 'ripple',
      diameterFraction: 0.18,
      colorHex: '#6466FA',
      playSound: true,
    };
    onChange({
      tapEvents: [...project.tapEvents, newTap],
      selectedEvent: { type: 'tap', id: newTap.id },
    });
  };

  const addOverlay = () => {
    const sourceTime = speedTimeline.sourceTime(project.currentSeconds);
    const newOverlay: TextOverlay = {
      id: crypto.randomUUID(),
      startTime: sourceTime,
      duration: 2.5,
      text: 'Feature Highlight 🚀',
      position: { x: 0.5, y: 0.82 },
      style: 'pill',
      bgColor: '#6466FA',
      textColor: '#ffffff',
      fontSize: 22,
    };
    onChange({
      overlays: [...(project.overlays || []), newOverlay],
      selectedEvent: { type: 'overlay', id: newOverlay.id },
    });
  };

  const addSpeed = () => {
    const sourceTime = speedTimeline.sourceTime(project.currentSeconds);
    const newSpeed: SpeedSegment = {
      id: crypto.randomUUID(),
      startTime: sourceTime,
      duration: 2.0,
      rate: 2.0,
    };
    onChange({
      speedSegments: [...project.speedSegments, newSpeed],
      selectedEvent: { type: 'speed', id: newSpeed.id },
    });
  };

  const handleAudioImported = (audioData: { url: string; name: string }) => {
    const newAudio: AudioTrack = {
      id: crypto.randomUUID(),
      url: audioData.url,
      name: audioData.name,
      volume: 0.8,
      startTime: 0,
      duration: totalDuration,
      isMuted: false,
    };
    onChange({
      audioTracks: [...(project.audioTracks || []), newAudio],
      selectedEvent: { type: 'audio', id: newAudio.id },
    });
  };

  const removeSelected = () => {
    if (!project.selectedEvent) return;
    if (project.selectedEvent.type === 'zoom') {
      onChange({
        animations: project.animations.filter(a => a.id !== project.selectedEvent?.id),
        selectedEvent: null,
      });
    } else if (project.selectedEvent.type === 'tap') {
      onChange({
        tapEvents: project.tapEvents.filter(t => t.id !== project.selectedEvent?.id),
        selectedEvent: null,
      });
    } else if (project.selectedEvent.type === 'overlay') {
      onChange({
        overlays: project.overlays.filter(o => o.id !== project.selectedEvent?.id),
        selectedEvent: null,
      });
    } else if (project.selectedEvent.type === 'audio') {
      onChange({
        audioTracks: (project.audioTracks || []).filter(a => a.id !== project.selectedEvent?.id),
        selectedEvent: null,
      });
    } else if (project.selectedEvent.type === 'speed') {
      onChange({
        speedSegments: project.speedSegments.filter(s => s.id !== project.selectedEvent?.id),
        selectedEvent: null,
      });
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="h-80 border-t border-slate-800/80 bg-dark-950 flex flex-col select-none">
      <AudioImportModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onAudioImported={handleAudioImported}
      />

      {/* Toolbar */}
      <div className="h-10 border-b border-slate-800/60 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onTogglePlay}
            className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition shadow-sm"
          >
            {project.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            onClick={onToggleMute}
            className="w-7 h-7 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-center transition"
          >
            {project.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <span className="font-mono text-slate-300 text-xs">
            {formatTime(project.currentSeconds)} <span className="text-slate-600">/</span> {formatTime(totalDuration)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAudioModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition"
          >
            <Music className="w-3 h-3" />
            <span>Add Audio (YT/MP3)</span>
          </button>

          <button
            onClick={addZoom}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
          >
            <Sparkles className="w-3 h-3 text-brand-400" />
            <span>Add Zoom</span>
          </button>

          <button
            onClick={addTap}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
          >
            <Hand className="w-3 h-3 text-pink-400" />
            <span>Add Tap</span>
          </button>

          <button
            onClick={addOverlay}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
          >
            <Type className="w-3 h-3 text-emerald-400" />
            <span>Add Callout</span>
          </button>

          <button
            onClick={addSpeed}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition"
          >
            <Gauge className="w-3 h-3 text-amber-400" />
            <span>Add Speed</span>
          </button>

          {project.selectedEvent && (
            <button
              onClick={removeSelected}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition ml-2"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Tracks Area */}
      <div className="flex-1 flex overflow-x-auto p-3">
        {/* Track Headers */}
        <div className="w-24 pr-3 flex flex-col justify-around text-[11px] font-medium text-slate-400 border-r border-slate-800/80 select-none">
          <div className="flex items-center space-x-1.5 text-indigo-400">
            <Music className="w-3 h-3" />
            <span>Audio</span>
          </div>
          <div className="flex items-center space-x-1.5 text-brand-400">
            <Sparkles className="w-3 h-3" />
            <span>Zooms</span>
          </div>
          <div className="flex items-center space-x-1.5 text-pink-400">
            <Hand className="w-3 h-3" />
            <span>Taps</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Type className="w-3 h-3" />
            <span>Callouts</span>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-400">
            <Gauge className="w-3 h-3" />
            <span>Speed</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300">
            <Scissors className="w-3 h-3" />
            <span>Video</span>
          </div>
        </div>

        {/* Tracks Content */}
        <div 
          ref={tracksRef}
          onClick={handleTrackClick}
          className="flex-1 relative ml-3 bg-dark-900/60 rounded-xl border border-slate-800/80 overflow-hidden flex flex-col justify-around py-1 cursor-pointer"
        >
          {/* Playhead Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-brand-500 z-20 pointer-events-none"
            style={{ left: `${playheadPercent}%` }}
          >
            <div className="w-3 h-3 -ml-[5px] bg-brand-500 rounded-full shadow-lg shadow-brand-500/50" />
          </div>

          {/* Audio Track */}
          <div className="h-6 w-full relative bg-dark-950/40 rounded-lg mx-1 border border-slate-800/40">
            {(project.audioTracks || []).map((audio) => {
              const isSelected = project.selectedEvent?.type === 'audio' && project.selectedEvent.id === audio.id;
              return (
                <div
                  key={audio.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ selectedEvent: { type: 'audio', id: audio.id } });
                  }}
                  className={`absolute top-0.5 bottom-0.5 left-0 right-0 rounded-md px-2 flex items-center text-[10px] font-semibold text-indigo-200 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/80 border-indigo-300 shadow-md ring-2 ring-indigo-500/50'
                      : 'bg-indigo-700/40 border-indigo-500/40 hover:bg-indigo-600/60'
                  }`}
                >
                  <Music className="w-3 h-3 mr-1.5" />
                  <span className="truncate">{audio.name} ({Math.round(audio.volume * 100)}% vol)</span>
                </div>
              );
            })}
          </div>

          {/* Zoom Track */}
          <div className="h-6 w-full relative bg-dark-950/40 rounded-lg mx-1 border border-slate-800/40">
            {project.animations.map((zoom) => {
              const startTimeline = speedTimeline.outputOffset(zoom.startTime);
              const leftPct = (startTimeline / totalDuration) * 100;
              const widthPct = (zoom.duration / totalDuration) * 100;
              const isSelected = project.selectedEvent?.type === 'zoom' && project.selectedEvent.id === zoom.id;

              return (
                <div
                  key={zoom.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ selectedEvent: { type: 'zoom', id: zoom.id } });
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center text-[10px] font-semibold text-brand-200 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-brand-600/80 border-brand-300 shadow-md ring-2 ring-brand-500/50'
                      : 'bg-brand-700/40 border-brand-500/40 hover:bg-brand-600/60'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${Math.max(2, widthPct)}%` }}
                >
                  <span className="truncate">{zoom.scale.toFixed(2)}x ({zoom.focus})</span>
                </div>
              );
            })}
          </div>

          {/* Tap Track */}
          <div className="h-6 w-full relative bg-dark-950/40 rounded-lg mx-1 border border-slate-800/40">
            {project.tapEvents.map((tap) => {
              const startTimeline = speedTimeline.outputOffset(tap.startTime);
              const leftPct = (startTimeline / totalDuration) * 100;
              const widthPct = (tap.duration / totalDuration) * 100;
              const isSelected = project.selectedEvent?.type === 'tap' && project.selectedEvent.id === tap.id;

              return (
                <div
                  key={tap.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ selectedEvent: { type: 'tap', id: tap.id } });
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center text-[10px] font-semibold text-pink-200 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-pink-600/80 border-pink-300 shadow-md ring-2 ring-pink-500/50'
                      : 'bg-pink-700/40 border-pink-500/40 hover:bg-pink-600/60'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${Math.max(2, widthPct)}%` }}
                >
                  <span className="truncate">{tap.style}</span>
                </div>
              );
            })}
          </div>

          {/* Callouts Track */}
          <div className="h-6 w-full relative bg-dark-950/40 rounded-lg mx-1 border border-slate-800/40">
            {(project.overlays || []).map((o) => {
              const startTimeline = speedTimeline.outputOffset(o.startTime);
              const leftPct = (startTimeline / totalDuration) * 100;
              const widthPct = (o.duration / totalDuration) * 100;
              const isSelected = project.selectedEvent?.type === 'overlay' && project.selectedEvent.id === o.id;

              return (
                <div
                  key={o.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ selectedEvent: { type: 'overlay', id: o.id } });
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center text-[10px] font-semibold text-emerald-200 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/80 border-emerald-300 shadow-md ring-2 ring-emerald-500/50'
                      : 'bg-emerald-700/40 border-emerald-500/40 hover:bg-emerald-600/60'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${Math.max(2, widthPct)}%` }}
                >
                  <span className="truncate">{o.text}</span>
                </div>
              );
            })}
          </div>

          {/* Speed Track */}
          <div className="h-6 w-full relative bg-dark-950/40 rounded-lg mx-1 border border-slate-800/40">
            {project.speedSegments.map((speed) => {
              const startTimeline = speedTimeline.outputOffset(speed.startTime);
              const leftPct = (startTimeline / totalDuration) * 100;
              const widthPct = (speed.duration / totalDuration) * 100;
              const isSelected = project.selectedEvent?.type === 'speed' && project.selectedEvent.id === speed.id;

              return (
                <div
                  key={speed.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ selectedEvent: { type: 'speed', id: speed.id } });
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded-md px-2 flex items-center text-[10px] font-semibold text-amber-200 border transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600/80 border-amber-300 shadow-md ring-2 ring-amber-500/50'
                      : 'bg-amber-700/40 border-amber-500/40 hover:bg-amber-600/60'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${Math.max(2, widthPct)}%` }}
                >
                  <span className="truncate">{speed.rate}x</span>
                </div>
              );
            })}
          </div>

          {/* Video Base Track */}
          <div className="h-7 w-full relative bg-slate-900/80 rounded-lg mx-1 border border-slate-800/80 flex items-center px-3 overflow-hidden">
            <div className="text-[11px] font-medium text-slate-400 truncate">
              {project.displayName || 'Drop video to begin'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
