import React, { useState } from 'react';
import { Video, Upload, Music, Loader2, X } from 'lucide-react';

interface AudioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioImported: (audio: { url: string; name: string }) => void;
}

export const AudioImportModal: React.FC<AudioImportModalProps> = ({
  isOpen,
  onClose,
  onAudioImported,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('youtube');
  const [ytUrl, setYtUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onAudioImported({
      url,
      name: file.name,
    });
    onClose();
  };

  const handleYoutubeDownload = async () => {
    if (!ytUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      if ((window as any).electronAPI?.downloadYouTubeAudio) {
        const result = await (window as any).electronAPI.downloadYouTubeAudio(ytUrl);
        if (result.success) {
          onAudioImported({
            url: result.audioDataUrl,
            name: `YouTube - ${ytUrl.slice(0, 24)}...`,
          });
          onClose();
        }
      } else {
        throw new Error('yt-dlp is available in the desktop AppImage application.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download audio from YouTube');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-[460px] bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2 text-brand-400 font-semibold">
            <Music className="w-5 h-5" />
            <span>Add Background Audio</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-dark-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'youtube' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>YouTube URL (yt-dlp)</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
              activeTab === 'upload' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload MP3 / Audio</span>
          </button>
        </div>

        {activeTab === 'youtube' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">YouTube Video URL</label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dark-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {error}
              </p>
            )}

            <button
              disabled={loading || !ytUrl.trim()}
              onClick={handleYoutubeDownload}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-xs font-semibold text-white transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting MP3 via yt-dlp...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Download & Add to Timeline</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <label className="block p-8 border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-dark-950/60 rounded-2xl cursor-pointer group transition">
              <Upload className="w-8 h-8 text-brand-400 mx-auto mb-2 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold text-slate-200 block">Choose Audio File</span>
              <span className="text-[10px] text-slate-500">MP3, WAV, AAC, OGG supported</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
