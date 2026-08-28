import React, { useState, useRef, useEffect } from 'react';
import { ProjectState } from './types/project';
import { Header } from './components/Header/Header';
import { SettingsSidebar } from './components/Sidebar/SettingsSidebar';
import { CanvasPreview } from './components/Canvas/CanvasPreview';
import { Timeline } from './components/Timeline/Timeline';
import { InspectorPanel } from './components/Panels/InspectorPanel';
import { GRADIENT_PRESETS } from './models/devices';
import { SpeedTimeline } from './models/speedTimeline';
import { exportVideo } from './services/exportService';

const initialProject: ProjectState = {
  videoURL: null,
  displayName: null,
  videoNaturalWidth: 0,
  videoNaturalHeight: 0,
  videoDuration: 0,
  currentSeconds: 0,
  isPlaying: false,
  isMuted: true,

  scale: 0.85,
  offset: { width: 0, height: 0 },
  background: { type: 'gradient', gradient: GRADIENT_PRESETS[0] },
  canvasAspect: 'square',
  shadow: {
    enabled: true,
    colorHex: '#000000',
    radius: 28,
    offsetY: 14,
    offsetX: 0,
    opacity: 0.35,
  },
  transform3D: {
    enabled: false,
    rotateX: 10,
    rotateY: -15,
    rotateZ: 2,
    perspective: 1000,
    autoDrift: false,
  },

  deviceModelID: 'iphone-17-pro',
  deviceColorID: 'cosmic-orange',

  bareCornerRadius: 0.15,
  bareBezelWidth: 0.025,
  bareBezelHex: '#000000',

  animations: [],
  tapEvents: [],
  speedSegments: [],
  overlays: [],
  audioTracks: [],
  selectedEvent: null,

  trimStartTime: 0,
  trimEndTime: 0,
  clipTimelineStart: 0,

  isExporting: false,
  exportProgress: 0,
  exportType: null,
};

export const App: React.FC = () => {
  const [project, setProject] = useState<ProjectState>(initialProject);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProject = (updater: Partial<ProjectState>) => {
    setProject(prev => ({ ...prev, ...updater }));
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    updateProject({
      videoURL: url,
      displayName: file.name,
      isPlaying: false,
      currentSeconds: 0,
    });
  };

  const handleSaveProject = () => {
    const dataToSave = {
      ...project,
      videoURL: null,
      isPlaying: false,
      isExporting: false,
    };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.displayName?.replace(/\.[^/.]+$/, "") || "Project"}.mayaproj`;
    a.click();
  };

  const handleLoadProject = (loadedData: any) => {
    setProject(prev => ({
      ...prev,
      ...loadedData,
      videoURL: prev.videoURL,
    }));
  };

  // Video metadata loading
  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    updateProject({
      videoNaturalWidth: video.videoWidth,
      videoNaturalHeight: video.videoHeight,
      videoDuration: video.duration,
      trimStartTime: 0,
      trimEndTime: video.duration,
    });
  };

  // Video time update sync
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || project.isExporting) return;

    const speedTimeline = new SpeedTimeline(
      project.trimStartTime,
      project.trimEndTime,
      project.speedSegments
    );

    const sourceTime = video.currentTime;
    if (sourceTime >= project.trimEndTime) {
      video.currentTime = project.trimStartTime;
      if (audioRef.current) audioRef.current.currentTime = 0;
      updateProject({ currentSeconds: 0 });
    } else {
      const timelineOffset = speedTimeline.outputOffset(sourceTime);
      updateProject({ currentSeconds: timelineOffset });
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      if (audio && project.audioTracks.length > 0) audio.play();
      updateProject({ isPlaying: true });
    } else {
      video.pause();
      if (audio) audio.pause();
      updateProject({ isPlaying: false });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    updateProject({ isMuted: video.muted });
  };

  const seekTimeline = (targetTimelineSeconds: number) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    const speedTimeline = new SpeedTimeline(
      project.trimStartTime,
      project.trimEndTime,
      project.speedSegments
    );

    const sourceTime = speedTimeline.sourceTime(targetTimelineSeconds);
    video.currentTime = sourceTime;
    if (audio) audio.currentTime = targetTimelineSeconds;
    updateProject({ currentSeconds: targetTimelineSeconds });
  };

  const handleExport = async (transparent: boolean) => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    updateProject({
      isExporting: true,
      exportProgress: 0,
      exportType: transparent ? 'transparent' : 'background',
      isPlaying: false,
    });
    video.pause();
    if (audio) audio.pause();

    try {
      const blob = await exportVideo(
        project,
        {
          transparent,
          onProgress: (p) => updateProject({ exportProgress: p }),
        },
        video
      );

      const ext = transparent ? 'webm' : 'mp4';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Maya-${project.displayName?.replace(/\.[^/.]+$/, "") || "video"}.${ext}`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err}`);
    } finally {
      updateProject({
        isExporting: false,
        exportProgress: 0,
        exportType: null,
      });
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (project.selectedEvent) {
          if (project.selectedEvent.type === 'zoom') {
            updateProject({
              animations: project.animations.filter(a => a.id !== project.selectedEvent?.id),
              selectedEvent: null,
            });
          } else if (project.selectedEvent.type === 'tap') {
            updateProject({
              tapEvents: project.tapEvents.filter(t => t.id !== project.selectedEvent?.id),
              selectedEvent: null,
            });
          } else if (project.selectedEvent.type === 'overlay') {
            updateProject({
              overlays: project.overlays.filter(o => o.id !== project.selectedEvent?.id),
              selectedEvent: null,
            });
          } else if (project.selectedEvent.type === 'audio') {
            updateProject({
              audioTracks: project.audioTracks.filter(a => a.id !== project.selectedEvent?.id),
              selectedEvent: null,
            });
          } else if (project.selectedEvent.type === 'speed') {
            updateProject({
              speedSegments: project.speedSegments.filter(s => s.id !== project.selectedEvent?.id),
              selectedEvent: null,
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  // Audio track playback sync
  const activeAudio = project.audioTracks?.[0];

  return (
    <div className="w-screen h-screen flex flex-col bg-dark-950 text-slate-100 overflow-hidden font-sans">
      {/* Hidden File Input & Video / Audio Elements */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
      />
      {project.videoURL && (
        <video
          ref={videoRef}
          src={project.videoURL}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          playsInline
          muted={project.isMuted}
          className="hidden"
        />
      )}
      {activeAudio && (
        <audio
          ref={audioRef}
          src={activeAudio.url}
          volume={activeAudio.volume}
          className="hidden"
        />
      )}

      {/* Export Progress Modal */}
      {project.isExporting && (
        <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="w-96 p-6 rounded-3xl bg-dark-900 border border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 mx-auto flex items-center justify-center animate-pulse">
              <span className="font-bold text-lg">{Math.round(project.exportProgress * 100)}%</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-100">Rendering Video...</h3>
              <p className="text-xs text-slate-400">
                Compositing frames, 3D angles, audio, zooms, and tap animations at full resolution
              </p>
            </div>
            <div className="w-full bg-dark-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-brand-500 h-full transition-all duration-100"
                style={{ width: `${project.exportProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main App Layout */}
      <Header
        project={project}
        onOpenFile={handleOpenFile}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onExport={handleExport}
      />

      <div className="flex-1 flex overflow-hidden">
        <SettingsSidebar
          project={project}
          onChange={updateProject}
        />

        <CanvasPreview
          project={project}
          videoRef={videoRef}
          onOffsetChange={(offset) => updateProject({ offset })}
          onOpenFile={handleOpenFile}
        />

        <InspectorPanel
          project={project}
          onChange={updateProject}
        />
      </div>

      <Timeline
        project={project}
        videoRef={videoRef}
        audioRef={audioRef}
        onSeek={seekTimeline}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
        onChange={updateProject}
      />
    </div>
  );
};
export default App;
