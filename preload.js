const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  downloadYouTubeAudio: (url) => ipcRenderer.invoke('download-youtube-audio', url),
});
