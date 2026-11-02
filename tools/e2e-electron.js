'use strict';
// E2E real: 2 clientes Electron (perfiles separados) + servidor. Ejecutar con electron.exe:  electron tools/e2e-electron.js
const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('node:path'), os = require('node:os'), fs = require('node:fs');
process.env.EPICKAST_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'epickast-e2e-'));
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-features', 'MediaFoundationVideoCapture,MediaFoundationD3D11VideoCapture');
const { httpServer } = require('../server/server.js');
const PORT = 7799;
const log = []; const ok = (name, cond, extra = '') => { const line = `${cond ? '✔' : '✘'} ${name}${extra ? ' — ' + extra : ''}`; console.log(line); log.push(line); if (!cond) process.exitCode = 1; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pending = null;
ipcMain.handle('sources:list', async () => (await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 16, height: 9 } })).map((s) => ({ id: s.id, name: s.name, thumb: s.thumbnail.toDataURL(), screen: true })));
ipcMain.handle('sources:select', (e, id, audio) => { pending = { id, audio }; });
ipcMain.handle('app:metrics', () => []); ipcMain.handle('app:flash', () => {});

function mk(part) {
  const win = new BrowserWindow({ width: 1000, height: 700, show: false, webPreferences: { preload: path.join(__dirname, '../app/preload.js'), partition: part, contextIsolation: true, sandbox: true, backgroundThrottling: false } });
  const ses = win.webContents.session;
  ses.setPermissionRequestHandler((wc, p, cb) => cb(true)); ses.setPermissionCheckHandler(() => true);
  ses.setDisplayMediaRequestHandler(async (req, cb) => { const s = (await desktopCapturer.getSources({ types: ['screen'] })).find((x) => x.id === pending?.id); cb(s ? { video: s } : {}); }, { useSystemPicker: false });
  win.webContents.on('console-message', (e) => { const m = e.message || ''; if (/rror|Refused|Failed/.test(m)) log.push(`   [${part}] console: ${m.slice(0, 200)}`); });
  return win;
}
const ev = (w, code) => w.webContents.executeJavaScript(code, true);
async function until(w, expr, ms = 15000, label = expr) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await ev(w, expr)) return true; } catch {} await sleep(150); } log.push(`   timeout: ${label}`); return false; }

app.whenReady().then(async () => {
  await new Promise((r) => httpServer.listen(PORT, '127.0.0.1', r));
  const A = mk('a'), B = mk('b');
  await Promise.all([A, B].map((w) => w.loadFile(path.join(__dirname, '../app/index.html'))));
  const reg = (w, user) => ev(w, `(()=>{document.getElementById('lgServer').value='ws://127.0.0.1:${PORT}';document.getElementById('lgUser').value='${user}';document.getElementById('lgPass').value='clave123';document.querySelector('[data-mode=register]').click();})()`);
  await reg(A, 'alice'); await reg(B, 'bobby');
  ok('login A y B', await until(A, 'S.me&&S.me.name==="alice"') && await until(B, 'S.me&&S.me.name==="bobby"'));

  // amistad
  await ev(A, `rpc('friends.add',{name:'bobby'})`);
  await until(B, 'S.friends.incoming.length===1');
  const aId = await ev(B, 'S.friends.incoming[0].id'); await ev(B, `rpc('friends.accept',{id:${aId}})`);
  ok('amistad', await until(A, 'S.friends.friends.length===1') && await until(B, 'S.friends.friends.length===1'));

  // avatar + color
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
  await ev(A, `rpc('profile.set',{color:'#ff5d8f',bio:'hola',avatar:'${png}'})`);
  ok('perfil visible para el amigo', await until(B, 'S.friends.friends[0].color==="#ff5d8f"&&S.friends.friends[0].av>0'));
  ok('avatar se pinta', await until(B, 'document.querySelector(".avatar.img")!==null', 6000));

  // llamada: A llama, B ve overlay y contesta
  const dm = await ev(A, 'S.friends.friends[0].dm');
  await ev(A, `openChannel('${dm}','dm','bobby').then(()=>joinCall('${dm}','bobby'))`);
  ok('A ve "Llamando…"', await until(A, '!!S.outgoing&&!document.getElementById("callOverlay").classList.contains("hidden")'));
  ok('B recibe llamada entrante con overlay', await until(B, '!!S.incoming&&!document.getElementById("callOverlay").classList.contains("hidden")&&document.querySelector(".callcard .btn-call")!==null'));
  ok('B ve nombre del que llama', (await ev(B, 'document.querySelector(".callcard h2").textContent')) === 'alice');
  await ev(B, 'answerIncoming()');
  ok('overlays se cierran al contestar', await until(A, '!S.outgoing&&document.getElementById("callOverlay").classList.contains("hidden")') && await until(B, '!S.incoming&&document.getElementById("callOverlay").classList.contains("hidden")'));
  ok('conexión WebRTC A↔B', await until(A, '[...S.call.peers.values()].every(p=>p.pc.connectionState==="connected")&&S.call.peers.size===1', 20000) && await until(B, '[...S.call.peers.values()].every(p=>p.pc.connectionState==="connected")&&S.call.peers.size===1', 20000));

  // supresión de ruido
  ok('RNNoise activo en A', (await ev(A, 'S.call.noiseMode')) === 'high', await ev(A, 'S.call.noiseMode'));
  ok('audio llega a B', await until(B, '[...S.call.peers.values()][0].streams.size>0&&[...S.call.peers.values()][0].streams.values().next().value.getAudioTracks().length>0'));
  // audio fluyendo (bytes recibidos)
  await sleep(2500);
  const aud = await ev(B, `(async()=>{const p=[...S.call.peers.values()][0];const r=await p.pc.getStats();let b=0;r.forEach(x=>{if(x.type==='inbound-rtp'&&x.kind==='audio')b+=x.bytesReceived});return b})()`);
  ok('bytes de audio recibidos', aud > 1000, aud + ' B');

  // cámara
  await ev(A, 'S.call.setCamera(true).then(()=>pushState())');
  ok('B ve video de cámara', await until(B, '(()=>{const v=document.querySelector("[data-tile^=p] video:not(.noVideo)");return v&&v.videoWidth>0})()', 15000));
  await sleep(2500);
  const sa = await ev(A, `S.call.stats().then(m=>[...m.values()].join(' | '))`); const sb = await ev(B, `S.call.stats().then(m=>[...m.values()].join(' | '))`);
  log.push(`   stats A: ${sa.replace(/\n/g, ' · ')}`); log.push(`   stats B: ${sb.replace(/\n/g, ' · ')}`);

  // pantalla
  const src = await ev(A, 'window.epic.listSources().then(s=>s[0]&&s[0].id)');
  let scr = false; try { await ev(A, `S.call.startScreen('${src}').then(()=>pushState())`); scr = await until(B, '[...S.call.peers.values()][0].streams.size>=2', 15000); } catch (e) { log.push('   screen error ' + e.message); }
  ok('pantalla compartida llega a B', scr);

  // colgar y rechazo
  await ev(B, 'leaveCall(false)'); await ev(A, 'leaveCall(false)'); await sleep(500);
  await ev(B, `openChannel('${dm}','dm','alice').then(()=>joinCall('${dm}','alice'))`);
  await until(A, '!!S.incoming');
  await ev(A, 'declineIncoming()');
  ok('rechazo avisa al que llama', await until(B, '!S.outgoing&&!S.call', 8000));

  console.log('\n' + log.join('\n'));
  app.exit(process.exitCode || 0);
}).catch((e) => { console.error('E2E error', e); app.exit(2); });
setTimeout(() => { console.log('\n' + log.join('\n') + '\nTIMEOUT global'); app.exit(3); }, 120000);
