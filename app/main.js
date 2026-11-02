'use strict';
const { app, BrowserWindow, ipcMain, desktopCapturer, session, shell, Menu, screen, globalShortcut, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

app.setAppUserModelId('com.epickap.epickast');

// ---- Rendimiento (derivado de los hallazgos de REA sobre el cliente de Discord) ----
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,MediaRouter,Translate,HardwareMediaKeyHandling,AutofillServerCommunication');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192 --lite-mode');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100');

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
let pendingSource = null;
let savedBounds = null;
let isMiniMode = false;

function setMiniMode(enable) {
  if (!win || win.isDestroyed()) return false;
  enable = !!enable;
  if (enable && !isMiniMode) {
    if (win.isMaximized()) win.unmaximize();
    savedBounds = win.getBounds();
    const area = screen.getDisplayMatching(savedBounds).workArea;
    const w = 380, h = 250;
    win.setMinimumSize(300, 200);
    win.setBounds({ x: area.x + area.width - w - 20, y: area.y + area.height - h - 20, width: w, height: h });
    win.setAlwaysOnTop(true, 'screen-saver');
    isMiniMode = true;
  } else if (!enable && isMiniMode) {
    win.setAlwaysOnTop(false);
    win.setMinimumSize(820, 520);
    if (savedBounds) win.setBounds(savedBounds);
    isMiniMode = false;
  }
  win.webContents.send('window:mini-changed', isMiniMode);
  return isMiniMode;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200, height: 770, minWidth: 820, minHeight: 520,
    backgroundColor: '#0e1015', title: 'EpicKast', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, sandbox: true, nodeIntegration: false,
      spellcheck: false, devTools: !app.isPackaged, backgroundThrottling: false,
    },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

app.whenReady().then(() => {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, perm, cb) => cb(['media', 'display-capture', 'notifications', 'fullscreen', 'clipboard-sanitized-write'].includes(perm)));
  ses.setPermissionCheckHandler((wc, perm) => ['media', 'notifications', 'fullscreen'].includes(perm));

  ses.setDisplayMediaRequestHandler(async (req, cb) => {
    const sel = pendingSource; pendingSource = null;
    if (!sel) return cb({});
    try {
      const srcs = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 0, height: 0 } });
      const s = srcs.find((x) => x.id === sel.id);
      if (!s) return cb({});
      cb(sel.audio && s.id.startsWith('screen:') ? { video: s, audio: 'loopback' } : { video: s });
    } catch { cb({}); }
  }, { useSystemPicker: false });

  ipcMain.handle('sources:list', async () => {
    const srcs = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 }, fetchWindowIcons: false });
    return srcs.map((s) => ({ id: s.id, name: s.name, thumb: s.thumbnail.toDataURL(), screen: s.id.startsWith('screen:') }));
  });
  ipcMain.handle('sources:select', (e, id, audio) => { pendingSource = { id: String(id), audio: !!audio }; });
  ipcMain.handle('app:metrics', () => app.getAppMetrics().map((m) => ({ type: m.type, cpu: m.cpu.percentCPUUsage, mem: m.memory.workingSetSize })));
  ipcMain.handle('app:flash', () => { if (win && !win.isFocused()) win.flashFrame(true); });
  ipcMain.handle('window:mini', (e, enable) => setMiniMode(enable === undefined ? !isMiniMode : enable));
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:openExternal', (e, url) => { if (/^https?:\/\//i.test(String(url))) shell.openExternal(String(url)); });
  const authFile = path.join(app.getPath('userData'), 'epickast-auth.json');
  ipcMain.handle('auth:load', () => {
    try {
      if (!fs.existsSync(authFile)) return null;
      const raw = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      if (raw?.enc && safeStorage.isEncryptionAvailable()) {
        raw.pass = safeStorage.decryptString(Buffer.from(raw.enc, 'base64'));
        delete raw.enc;
      }
      return raw;
    } catch { return null; }
  });
  ipcMain.handle('auth:save', (e, data) => {
    try {
      if (!data) { if (fs.existsSync(authFile)) fs.unlinkSync(authFile); return true; }
      const out = { ...data };
      if (out.pass && safeStorage.isEncryptionAvailable()) {
        out.enc = safeStorage.encryptString(String(out.pass)).toString('base64');
        delete out.pass;
      }
      fs.writeFileSync(authFile, JSON.stringify(out), 'utf8');
      return true;
    } catch { return false; }
  });
  ipcMain.handle('shortcuts:set', (e, cfg) => {
    try {
      globalShortcut.unregisterAll();
      if (cfg?.mute) globalShortcut.register(String(cfg.mute), () => win && !win.isDestroyed() && win.webContents.send('shortcut:trigger', 'mute'));
      if (cfg?.deaf) globalShortcut.register(String(cfg.deaf), () => win && !win.isDestroyed() && win.webContents.send('shortcut:trigger', 'deaf'));
      return true;
    } catch { return false; }
  });

  createWindow();
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
});
app.on('window-all-closed', () => app.quit());
