const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Maya Pro Studio',
    backgroundColor: '#090a0f',
    icon: path.join(__dirname, 'public/app/icon_512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// IPC Handler: Download YouTube Audio via yt-dlp
ipcMain.handle('download-youtube-audio', async (event, url) => {
  return new Promise((resolve, reject) => {
    try {
      const tempDir = path.join(app.getPath('temp'), 'maya_audio');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputFileTemplate = path.join(tempDir, `audio_${Date.now()}.%(ext)s`);

      // Spawn yt-dlp with audio extraction
      const yt = spawn('yt-dlp', [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputFileTemplate,
        url
      ]);

      let outputData = '';
      let errorData = '';

      yt.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      yt.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      yt.on('close', (code) => {
        if (code === 0) {
          // Find generated mp3 file
          const files = fs.readdirSync(tempDir);
          const recentFile = files
            .filter(f => f.endsWith('.mp3'))
            .sort((a, b) => fs.statSync(path.join(tempDir, b)).mtimeMs - fs.statSync(path.join(tempDir, a)).mtimeMs)[0];

          if (recentFile) {
            const filePath = path.join(tempDir, recentFile);
            const fileBuffer = fs.readFileSync(filePath);
            const base64Audio = `data:audio/mp3;base64,${fileBuffer.toString('base64')}`;
            resolve({ success: true, audioDataUrl: base64Audio, fileName: recentFile });
          } else {
            reject(new Error('Audio file was not found after conversion.'));
          }
        } else {
          reject(new Error(`yt-dlp exited with code ${code}: ${errorData || outputData}`));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
