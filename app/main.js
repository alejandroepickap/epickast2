'use strict';
const { app, BrowserWindow, ipcMain, desktopCapturer, session, shell, Menu, screen, globalShortcut, safeStorage, clipboard, Tray } = require('electron');
const { execFile } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const http = require('node:http');

function downloadFile(url, destPath, onProgress, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Demasiadas redirecciones'));
    const isHttps = /^https:/i.test(url);
    const client = isHttps ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'EpicKast-Updater' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!/^https?:\/\//i.test(redirectUrl)) {
          const parsed = new URL(url);
          redirectUrl = new URL(redirectUrl, parsed.origin).href;
        }
        res.resume();
        return downloadFile(redirectUrl, destPath, onProgress, maxRedirects - 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Error de descarga HTTP ${res.statusCode}`));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;
      const fileStream = fs.createWriteStream(destPath);
      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (total > 0 && onProgress) {
          onProgress(Math.round((downloaded / total) * 100), downloaded, total);
        }
      });
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => resolve(destPath));
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
    req.on('error', reject);
  });
}

// Catálogo ligero de procesos (inspirado en DESKTOP_PROCESS_POLLING_PERF de discord_utils.node hallado con REA)
const KNOWN_GAMES = {
  'valorant-win64-shipping.exe': 'VALORANT', 'valorant.exe': 'VALORANT',
  'cs2.exe': 'Counter-Strike 2', 'csgo.exe': 'CS:GO',
  'league of legends.exe': 'League of Legends', 'leagueclientux.exe': 'League of Legends (Lobby)',
  'fortniteclient-win64-shipping.exe': 'Fortnite',
  'minecraft.windows.exe': 'Minecraft', 'javaw.exe': 'Minecraft (Java)', 'minecraft.exe': 'Minecraft',
  'robloxplayerbeta.exe': 'Roblox',
  'gta5.exe': 'Grand Theft Auto V', 'fivem.exe': 'FiveM (GTA RP)',
  'r5apex.exe': 'Apex Legends',
  'overwatch.exe': 'Overwatch 2',
  'rocketleague.exe': 'Rocket League',
  'dota2.exe': 'Dota 2',
  'eldenring.exe': 'Elden Ring',
  'helldivers2.exe': 'HELLDIVERS 2',
  'palworld-win64-shipping.exe': 'Palworld',
  'baldursgate3.exe': "Baldur's Gate 3", 'bg3.exe': "Baldur's Gate 3", 'bg3_dx11.exe': "Baldur's Gate 3",
  'cyberpunk2077.exe': 'Cyberpunk 2077',
  'tslgame.exe': 'PUBG: Battlegrounds',
  'cod.exe': 'Call of Duty', 'modernwarfare.exe': 'Call of Duty',
  'rainbowsix.exe': 'Rainbow Six Siege',
  'deadbydaylight-win64-shipping.exe': 'Dead by Daylight',
  'genshinimpact.exe': 'Genshin Impact', 'starrail.exe': 'Honkai: Star Rail', 'zenlesszonezero.exe': 'Zenless Zone Zero',
  'osu!.exe': 'osu!',
  'terraria.exe': 'Terraria',
  'stardew valley.exe': 'Stardew Valley',
  'among us.exe': 'Among Us',
  'lethal company.exe': 'Lethal Company',
  'phasmophobia.exe': 'Phasmophobia',
  'rustclient.exe': 'Rust',
  'arkascended.exe': 'ARK: Survival Ascended', 'shootergame.exe': 'ARK: Survival Evolved',
  'destiny2.exe': 'Destiny 2',
  'warframe.x64.exe': 'Warframe',
  'pathofexile_x64.exe': 'Path of Exile', 'pathofexilesteam.exe': 'Path of Exile',
  'diablo iv.exe': 'Diablo IV',
  'wow.exe': 'World of Warcraft',
  'fc24.exe': 'EA SPORTS FC 24', 'fc25.exe': 'EA SPORTS FC 25',
  'forzahorizon5.exe': 'Forza Horizon 5',
  'left4dead2.exe': 'Left 4 Dead 2',
  'GarrysMod.exe': "Garry's Mod", 'hl2.exe': 'Source Engine Game',
  'hollow_knight.exe': 'Hollow Knight',
  'hades.exe': 'Hades', 'hades2.exe': 'Hades II',
  'factorio.exe': 'Factorio',
  'satisfactory.exe': 'Satisfactory', 'factorygame-win64-shipping.exe': 'Satisfactory',
  'valheim.exe': 'Valheim',
  'projectzomboid64.exe': 'Project Zomboid',
  'vrchat.exe': 'VRChat',
  'brawlhalla.exe': 'Brawlhalla',
  'balatro.exe': 'Balatro',
  'blender.exe': 'Blender 3D',
  'orca-slicer.exe': 'OrcaSlicer 3D', 'prusa-slicer.exe': 'PrusaSlicer 3D', 'ultimaker-cura.exe': 'UltiMaker Cura 3D',
  'bambu-studio.exe': 'Bambu Studio 3D', 'solidworks.exe': 'SolidWorks CAD', 'fusion360.exe': 'Autodesk Fusion 360',
};

app.setAppUserModelId('com.epickap.epickast');

const configPath = path.join(app.getPath('userData'), 'epickast-config.json');
function readConfig() {
  try {
    if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {}
  return {};
}
function writeConfig(data) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

const appConfig = readConfig();
if (appConfig.disableGpu) {
  // Deshabilitar aceleración por hardware (estilo Discord) para resolver pantallas negras en captura
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
} else {
  // Rendimiento acelerado por GPU
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
}
// NOTA: Se retira 'enable-zero-copy' porque provoca pantallas negras al capturar ventanas de apps DirectX/GPU
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,MediaRouter,Translate,HardwareMediaKeyHandling,AutofillServerCommunication');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=192 --lite-mode');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100');

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
let tray = null;
let isQuitting = false;
let overlayWin = null;
let isOverlayVisible = false;
let pendingSource = null;
let savedBounds = null;
let isMiniMode = false;

function createOverlayWindow() {
  if (overlayWin && !overlayWin.isDestroyed()) return overlayWin;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  overlayWin = new BrowserWindow({
    width: 200, height: 280,
    x: width - 220, y: 50,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  overlayWin.loadFile(path.join(__dirname, 'overlay.html'));
  overlayWin.on('closed', () => { overlayWin = null; isOverlayVisible = false; });
  return overlayWin;
}

function toggleOverlay(enable) {
  if (enable === undefined) enable = !isOverlayVisible;
  isOverlayVisible = !!enable;
  if (isOverlayVisible) {
    const ow = createOverlayWindow();
    ow.showInactive();
  } else if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.hide();
  }
  if (win && !win.isDestroyed()) {
    win.webContents.send('overlay:status-changed', isOverlayVisible);
  }
  return isOverlayVisible;
}

function setMiniMode(enable) {
  if (!win || win.isDestroyed()) return false;
  enable = !!enable;
  if (enable && !isMiniMode) {
    if (win.isMaximized()) win.unmaximize();
    savedBounds = win.getBounds();
    const area = screen.getDisplayMatching(savedBounds).workArea;
    const w = 380, h = 250;
    win.setMinimumSize(220, 140);
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
    width: 1200, height: 770, minWidth: 820, minHeight: 520, frame: false,
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

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
      return false;
    }
  });

  win.webContents.on('context-menu', (e, params) => {
    const template = [];

    if (params.linkURL) {
      template.push(
        { label: '🔗 Abrir enlace en navegador', click: () => shell.openExternal(params.linkURL) },
        { label: '📋 Copiar dirección del enlace', click: () => clipboard.writeText(params.linkURL) },
        { type: 'separator' }
      );
    }

    if (params.hasImageContents && params.srcURL) {
      template.push(
        { label: '🖼️ Copiar imagen', click: () => win.webContents.copyImageAt(params.x, params.y) },
        { type: 'separator' }
      );
    }

    if (params.isEditable) {
      template.push(
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { type: 'separator' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      );
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      template.push(
        { role: 'copy', label: '📋 Copiar selección' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      );
    }

    if (template.length > 0) {
      const menu = Menu.buildFromTemplate(template);
      menu.popup({ window: win });
    }
  });
}

function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, 'icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('EpicKast');

  const showApp = () => {
    if (win) {
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir EpicKast',
      click: showApp,
    },
    { type: 'separator' },
    {
      label: 'Silenciar micrófono',
      click: () => {
        if (win && !win.isDestroyed()) win.webContents.send('shortcut:trigger', 'mute');
      },
    },
    {
      label: 'Ensordecer / Silenciar audio',
      click: () => {
        if (win && !win.isDestroyed()) win.webContents.send('shortcut:trigger', 'deaf');
      },
    },
    { type: 'separator' },
    {
      label: 'Salir de EpicKast',
      click: () => {
        isQuitting = true;
        app.quit();
        process.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', showApp);
  tray.on('click', showApp);
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
      cb(sel.audio ? { video: s, audio: 'loopback' } : { video: s });
    } catch { cb({}); }
  }, { useSystemPicker: false });

  ipcMain.handle('sources:list', async () => {
    const srcs = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 }, fetchWindowIcons: false });
    return srcs.map((s) => ({ id: s.id, name: s.name, thumb: s.thumbnail.toDataURL(), screen: s.id.startsWith('screen:') }));
  });
  ipcMain.handle('sources:select', (e, id, audio) => { pendingSource = { id: String(id), audio: !!audio }; });
  ipcMain.handle('app:metrics', () => app.getAppMetrics().map((m) => ({ type: m.type, cpu: m.cpu.percentCPUUsage, mem: m.memory.workingSetSize })));
  ipcMain.handle('app:flash', () => { if (win && !win.isFocused()) win.flashFrame(true); });
  ipcMain.handle('config:get', () => readConfig());
  ipcMain.handle('config:set', (e, patch) => {
    const cur = readConfig();
    const next = { ...cur, ...patch };
    writeConfig(next);
    return next;
  });
  ipcMain.handle('app:relaunch', () => {
    app.relaunch();
    app.exit(0);
  });
    ipcMain.handle('window:minimize', () => win?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.handle('window:close', () => win?.close());
  ipcMain.handle('window:mini', (e, enable) => setMiniMode(enable === undefined ? !isMiniMode : enable));
  ipcMain.handle('overlay:toggle', (e, enable) => toggleOverlay(enable));
  ipcMain.handle('overlay:update', (e, data) => {
    if (overlayWin && !overlayWin.isDestroyed() && isOverlayVisible) {
      overlayWin.webContents.send('overlay:data', data);
    }
  });
  
  ipcMain.handle('app:uninstall', async () => {
    try {
      const { spawn } = require('child_process');
      const localAppDir = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
      const uninstallerPath = path.join(localAppDir, 'Programs', 'epickast', 'Uninstall EpicKast.exe');
      
      if (fs.existsSync(uninstallerPath)) {
        isQuitting = true;
        const child = spawn('cmd.exe', ['/c', 'start', '""', uninstallerPath], {
          detached: true,
          stdio: 'ignore',
          windowsHide: false
        });
        child.unref();
        setTimeout(() => app.quit(), 200);
        return { ok: true };
      } else {
        throw new Error('No se encontró el desinstalador oficial en ' + uninstallerPath);
      }
    } catch (err) {
      console.error('Error al lanzar desinstalador:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:openExternal', (e, url) => { if (/^https?:\/\//i.test(String(url))) shell.openExternal(String(url)); });
  
  ipcMain.handle('app:download-asar-update', async (e, url) => {
    try {
      if (!url || typeof url !== 'string') throw new Error('URL de ASAR inválida');
      const tempAsar = path.join(app.getPath('temp'), 'epickast-update.asar');
      if (fs.existsSync(tempAsar)) {
        try { fs.unlinkSync(tempAsar); } catch {}
      }
      await downloadFile(url, tempAsar, (pct, cur, tot) => {
        try {
          if (e?.sender && !e.sender.isDestroyed()) {
            e.sender.send('app:update-progress', { percent: pct, current: cur, total: tot, asar: true });
          } else if (win && !win.isDestroyed()) {
            win.webContents.send('app:update-progress', { percent: pct, current: cur, total: tot, asar: true });
          }
        } catch {}
      });
      // Verificar tamaño
      const stat = fs.statSync(tempAsar);
      if (stat.size < 500000) throw new Error('El paquete ASAR descargado está incompleto');

      const appDir = path.dirname(app.getAppPath());
      const pendingAsar = path.join(appDir, 'app.asar.pending');
      fs.copyFileSync(tempAsar, pendingAsar);
      console.log('ASAR pendiente copiado a:', pendingAsar);
      return { ok: true, size: stat.size };
    } catch (err) {
      console.error('Error al descargar ASAR update:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('app:apply-asar-update', async () => {
    try {
      const appDir = path.dirname(app.getAppPath());
      const installDir = path.dirname(appDir);
      const targetExe = path.join(installDir, 'EpicKast.exe');
      const pendingAsar = path.join(appDir, 'app.asar.pending');
      const targetAsar = path.join(appDir, 'app.asar');

      if (!fs.existsSync(pendingAsar)) {
        throw new Error('No hay actualización pendiente lista');
      }

      const applyCmd = path.join(app.getPath('temp'), 'epickast-apply-asar.cmd');
      const cmdContent = [
        '@echo off',
        'setlocal enabledelayedexpansion',
        'set /a tries=0',
        ':wait_close',
        'set /a tries+=1',
        'tasklist /fi "imagename eq EpicKast.exe" 2>nul | find /i "EpicKast.exe" >nul',
        'if not errorlevel 1 (',
        '    if !tries! leq 15 (',
        '        timeout /t 1 /nobreak >nul',
        '        goto wait_close',
        '    ) else (',
        '        taskkill /f /im "EpicKast.exe" >nul 2>&1',
        '        timeout /t 1 /nobreak >nul',
        '    )',
        ')',
        'move /y "' + pendingAsar + '" "' + targetAsar + '" >nul 2>&1',
        'timeout /t 1 /nobreak >nul',
        'if exist "' + targetExe + '" (',
        '    start "" "' + targetExe + '"',
        ') else (',
        '    start "" "' + process.execPath + '"',
        ')',
        'del "%~f0" >nul 2>&1',
        'exit'
      ].join('\r\n');

      fs.writeFileSync(applyCmd, cmdContent, 'utf8');
      isQuitting = true;

      const { spawn } = require('child_process');
      const child = spawn('cmd.exe', ['/c', 'start', '""', '/min', applyCmd], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false
      });
      child.unref();

      setTimeout(() => {
        app.quit();
      }, 250);
      return { ok: true };
    } catch (err) {
      console.error('Error al aplicar ASAR update:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('app:download-and-install', async (e, url) => {
    try {
      if (!url || typeof url !== 'string') throw new Error('URL inválida');
      const tempExe = path.join(app.getPath('temp'), 'EpicKast-Update.exe');
      if (fs.existsSync(tempExe)) {
        try { fs.unlinkSync(tempExe); } catch {}
      }
      await downloadFile(url, tempExe, (pct, cur, tot) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('app:update-progress', { percent: pct, current: cur, total: tot });
        }
      });
      if (win && !win.isDestroyed()) {
        win.webContents.send('app:update-progress', { percent: 100, installing: true });
      }

      // Generar script desacoplado de Windows (inmune a la terminación del proceso Electron)
      const localAppDir = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
      const targetDir = path.join(localAppDir, 'Programs', 'epickast');
      const targetApp = path.join(targetDir, 'EpicKast.exe');
      const logFile = path.join(localAppDir, 'epickast-update.log');
      const updaterCmd = path.join(app.getPath('temp'), 'epickast-updater.cmd');

      const cmdLines = [
        '@echo off',
        'chcp 65001 >nul',
        'setlocal enabledelayedexpansion',
        'set "LOGFILE=' + logFile + '"',
        'echo ========================================================== >> "%LOGFILE%"',
        'echo [%date% %time%] INICIANDO ACTUALIZACION DESACOPLADA DE EPICKAST >> "%LOGFILE%"',
        'echo [%date% %time%] Instalador descargado: "' + tempExe + '" >> "%LOGFILE%"',
        'echo [%date% %time%] Destino instalado: "' + targetApp + '" >> "%LOGFILE%"',
        '',
        ':: 1. Esperar activamente a que todos los procesos de EpicKast se cierren',
        'echo [%date% %time%] Esperando cierre de procesos EpicKast... >> "%LOGFILE%"',
        'set /a tries=0',
        ':wait_close',
        'set /a tries+=1',
        'tasklist /fi "imagename eq EpicKast.exe" 2>nul | find /i "EpicKast.exe" >nul',
        'if not errorlevel 1 (',
        '    if !tries! leq 25 (',
        '        timeout /t 1 /nobreak >nul',
        '        goto wait_close',
        '    ) else (',
        '        echo [%date% %time%] Forzando cierre tras espera maxima... >> "%LOGFILE%"',
        '        taskkill /f /im "EpicKast.exe" >nul 2>&1',
        '        timeout /t 2 /nobreak >nul',
        '    )',
        ')',
        'echo [%date% %time%] Proceso principal cerrado con exito. >> "%LOGFILE%"',
        '',
        ':: 2. Desbloquear archivo descargado de Windows Mark-of-the-Web',
        'echo [%date% %time%] Desbloqueando archivo del instalador... >> "%LOGFILE%"',
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -LiteralPath \'' + tempExe.replace(/\\/g, '\\\\') + '\' -ErrorAction SilentlyContinue" >> "%LOGFILE%" 2>&1',
        '',
        ':: 3. Ejecutar instalador NSIS silencioso y esperar termino',
        'echo [%date% %time%] Ejecutando instalador silencioso (/S)... >> "%LOGFILE%"',
        'start "" /wait "' + tempExe + '" /S',
        'echo [%date% %time%] Instalador finalizado. Codigo de salida: %errorlevel% >> "%LOGFILE%"',
        '',
        ':: 4. Esperar liberacion de archivos del sistema',
        'timeout /t 2 /nobreak >nul',
        '',
        ':: 5. Actualizar accesos directos en Escritorio (normal y OneDrive)',
        'echo [%date% %time%] Actualizando accesos directos de escritorio... >> "%LOGFILE%"',
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "' +
          'try { ' +
          '  $wsh = New-Object -ComObject WScript.Shell; ' +
          '  $dirs = @([Environment]::GetFolderPath(\'Desktop\'), [Environment]::GetFolderPath(\'CommonDesktopDirectory\'), \"$env:USERPROFILE\\OneDrive\\Escritorio\", \"$env:USERPROFILE\\OneDrive\\Desktop\"); ' +
          '  $target = \'' + targetApp.replace(/\\/g, '\\\\') + '\'; ' +
          '  foreach ($d in $dirs) { ' +
          '    if ($d -and (Test-Path $d)) { ' +
          '      $lnk = Join-Path $d \'EpicKast.lnk\'; ' +
          '      if (Test-Path $lnk) { ' +
          '        $s = $wsh.CreateShortcut($lnk); ' +
          '        $s.TargetPath = $target; ' +
          '        $s.WorkingDirectory = Split-Path $target; ' +
          '        $s.IconLocation = \"$target,0\"; ' +
          '        $s.Save(); ' +
          '      } ' +
          '    } ' +
          '  } ' +
          '} catch {}' +
        '" >> "%LOGFILE%" 2>&1',
        '',
        ':: 6. Relanzar aplicacion actualizada',
        'echo [%date% %time%] Relanzando EpicKast desde "' + targetApp + '"... >> "%LOGFILE%"',
        'if exist "' + targetApp + '" (',
        '    start "" "' + targetApp + '"',
        '    echo [%date% %time%] EpicKast relanzado con exito. >> "%LOGFILE%"',
        ') else (',
        '    echo [%date% %time%] ERROR: No se encontro el destino instalado "' + targetApp + '" >> "%LOGFILE%"',
        ')',
        'echo [%date% %time%] ACTUALIZACION COMPLETADA CON EXITO. >> "%LOGFILE%"',
        'echo ========================================================== >> "%LOGFILE%"',
        'del "%~f0" >nul 2>&1',
        'exit'
      ].join('\r\n');

      fs.writeFileSync(updaterCmd, cmdLines, 'utf8');
      isQuitting = true;

      // Lanzar proceso completamente desacoplado con cmd start (rompe el Job Object de Electron)
      const { spawn } = require('child_process');
      const child = spawn('cmd.exe', ['/c', 'start', '""', '/min', updaterCmd], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false
      });
      child.unref();

      // Cerrar Electron limpiamente
      setTimeout(() => {
        app.quit();
      }, 350);
      return { ok: true };
    } catch (err) {
      console.error('Error al descargar e instalar actualización:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('app:getUpdateLog', () => {
    try {
      const localAppDir = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
      const logFile = path.join(localAppDir, 'epickast-update.log');
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split(/\r?\n/).filter(Boolean);
        return lines.slice(-30).join('\n');
      }
      return 'No hay registros de actualización previos.';
    } catch (e) {
      return 'Error al leer el archivo de registro: ' + e.message;
    }
  });
  ipcMain.handle('game:detect', () => new Promise((resolve) => {
    execFile('tasklist.exe', ['/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 4000, maxBuffer: 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      const lines = stdout.split(/\r?\n/);
      for (const line of lines) {
        const m = /^"([^"]+)"/.exec(line);
        if (!m) continue;
        const exe = m[1].toLowerCase();
        if (KNOWN_GAMES[exe]) return resolve({ name: KNOWN_GAMES[exe], exe: m[1] });
      }
      resolve(null);
    });
  }));
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
  createTray();
  app.on('second-instance', () => {
    if (win) {
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
});
app.on('before-quit', () => { isQuitting = true; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
