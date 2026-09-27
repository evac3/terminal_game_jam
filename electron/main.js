import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set by scripts/dev.js while developing; unset in the packaged app.
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

const COLORS = { background: '#0b0f0b' };

function isAppUrl(url) {
  return DEV_SERVER_URL ? url.startsWith(DEV_SERVER_URL) : url.startsWith('file://');
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 640,
    title: 'Terminal',
    backgroundColor: COLORS.background,
    webPreferences: { contextIsolation: true, sandbox: true },
  });

  // Mini game windows are opened by the page with window.open (see useTerminal.js).
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAppUrl(url)) return { action: 'deny' };
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 480,
        height: 640,
        backgroundColor: COLORS.background,
        autoHideMenuBar: true,
      },
    };
  });

  // Closing the terminal quits the game, including any open mini game windows.
  win.on('closed', () => app.quit());

  if (DEV_SERVER_URL) win.loadURL(DEV_SERVER_URL);
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(createMainWindow);
