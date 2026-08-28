import React, { useRef } from 'react';
import { Download, Sparkles, FolderOpen, Video, Save, FileUp } from 'lucide-react';
import { ProjectState } from '../../types/project';

interface HeaderProps {
  project: ProjectState;
  onOpenFile: () => void;
  onSaveProject: () => void;
  onLoadProject: (projectData: any) => void;
  onExport: (transparent: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onOpenFile,
  onSaveProject,
  onLoadProject,
  onExport,
}) => {
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onLoadProject(json);
      } catch (err) {
        alert('Invalid .mayaproj file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-dark-950/80 backdrop-blur px-4 flex items-center justify-between select-none z-30">
      <input
        type="file"
        ref={projectInputRef}
        onChange={handleProjectFile}
        accept=".mayaproj,application/json"
        className="hidden"
      />

      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 p-[1px] shadow-lg shadow-brand-500/20">
          <div className="w-full h-full rounded-[11px] bg-dark-950 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-tight text-white">Maya</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Studio Pro
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate max-w-[240px]">
            {project.displayName || 'No video selected'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenFile}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition shadow-sm active:scale-95"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Open Video</span>
        </button>

        <button
          onClick={onSaveProject}
          title="Save project (.mayaproj)"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 hover:border-slate-700 transition active:scale-95"
        >
          <Save className="w-3.5 h-3.5 text-brand-400" />
          <span>Save Project</span>
        </button>

        <button
          onClick={() => projectInputRef.current?.click()}
          title="Load saved project (.mayaproj)"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-dark-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 hover:border-slate-700 transition active:scale-95"
        >
          <FileUp className="w-3.5 h-3.5 text-slate-400" />
          <span>Open Project</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          disabled={!project.videoURL || project.isExporting}
          onClick={() => onExport(false)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium text-white transition shadow-lg shadow-brand-600/30 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export MP4</span>
        </button>

        <button
          disabled={!project.videoURL || project.isExporting}
          onClick={() => onExport(true)}
          title="Export with transparent background (HEVC/WebM Alpha)"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-40 disabled:pointer-events-none text-xs font-medium text-slate-300 border border-slate-700/60 transition active:scale-95"
        >
          <Video className="w-3.5 h-3.5 text-brand-400" />
          <span>Export Alpha</span>
        </button>
      </div>
    </header>
  );
};
