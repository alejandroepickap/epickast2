'use strict';
const $ = (id) => document.getElementById(id);
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}

const DEFAULTS = {
  server: 'ws://127.0.0.1:7777', mic: '', cam: '', spk: '',
  camPreset: '720p30', screenPreset: '1080p30', screenAudio: false,
  hwPrefer: true, stats: false, noise: 'high', micGain: 1, voiceGate: 0.024, audioKbps: 96,
  accent: '#7c5cff', ringVol: 0.6, dnd: false, autoPip: true,
  keyMute: 'Alt+M', keyDeaf: 'Alt+D', stageHeight: 54, hideNoVideo: true,
};
const settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('epickast.settings') || '{}') };
const saveSettings = () => localStorage.setItem('epickast.settings', JSON.stringify(settings));
const userVols = JSON.parse(localStorage.getItem('epickast.volumes') || '{}'); // userId -> 0..2 (1 = 100%)
const getUserVol = (uid) => (userVols[uid] !== undefined ? Number(userVols[uid]) : 1);
const setUserVol = (uid, v) => { userVols[uid] = Math.round(v * 100) / 100; localStorage.setItem('epickast.volumes', JSON.stringify(userVols)); };
function applyAccent() { document.documentElement.style.setProperty('--ac', settings.accent); }
function applyStageHeight() { document.documentElement.style.setProperty('--stage-h', `${Math.max(24, Math.min(92, Number(settings.stageHeight) || 54))}vh`); }
function applyShortcuts() { window.epic.setShortcuts?.({ mute: settings.keyMute || '', deaf: settings.keyDeaf || '' }).catch(() => {}); }
applyAccent();
applyStageHeight();
applyShortcuts();

const S = {
  ws: null, seq: 0, pend: new Map(), me: null, token: localStorage.getItem('epickast.token') || '', ice: [],
  friends: { friends: [], incoming: [], outgoing: [] }, servers: [], sdata: new Map(),
  view: { kind: 'home', sid: null }, chan: null, chanType: null, chanName: '',
  rooms: new Map(), unread: new Set(), call: null, callKey: null, callLabel: '',
  oldest: null, loadingOld: false, statTimer: null, pingTimer: null, incoming: null, outgoing: null, cleanup: [],
  mini: false, appVer: '1.2.0', srvRelease: null, typingTimer: null, lastTypingSent: 0,
  replyTo: null, vrec: null, focusTile: null, dockOpen: false,
};

window.epic.version?.().then((v) => { if (v) S.appVer = v; }).catch(() => {});
window.epic.onMiniChanged?.((val) => {
  S.mini = !!val;
  document.body.classList.toggle('mini-mode', S.mini);
  updateDock();
});
window.epic.onShortcut?.((act) => {
  if (!S.call) return;
  if (act === 'mute') {
    $('bMute')?.click();
    ringer.beep(S.call.muted ? [420, 310] : [520, 680], 0.06, 0.09);
  } else if (act === 'deaf') {
    $('bDeaf')?.click();
    ringer.beep(S.call.deaf ? [360, 260] : [540, 720], 0.06, 0.09);
  }
});

// ---------- avatares ----------
const PALETTE = ['#7c5cff', '#ff5d8f', '#ff9f43', '#2ed573', '#1e90ff', '#e056fd', '#00d2d3', '#ffa502'];
const colorFor = (u) => u?.color || PALETTE[(u?.id || 0) % PALETTE.length];
const avCache = new Map(); const avWait = new Set();
function avatar(u, size = 32, online) {
  const el = h('div', { class: 'avatar', style: `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px;background-color:${colorFor(u)}`, 'data-uid': u?.id ?? 0, 'data-av': u?.av || 0 }, (u?.name || '?')[0].toUpperCase());
  if (online !== undefined) el.append(h('span', { class: 'st' + (online ? ' on' : '') }));
  paintAvatar(el); return el;
}
function paintAvatar(el) {
  const id = el.dataset.uid, av = Number(el.dataset.av); if (!av) return;
  const k = `${id}:${av}`, url = avCache.get(k);
  if (url) { el.style.backgroundImage = `url(${url})`; el.classList.add('img'); return; }
  if (avWait.has(k) || !S.ws) return; avWait.add(k);
  rpc('profile.avatar', { id: Number(id) }).then((r) => {
    if (!r.avatar) return;
    if (avCache.size > 300) avCache.delete(avCache.keys().next().value);
    avCache.set(k, r.avatar);
    document.querySelectorAll(`.avatar[data-uid="${id}"]`).forEach((n) => { if (Number(n.dataset.av) === av) paintAvatar(n); });
  }).catch(() => {}).finally(() => avWait.delete(k));
}

// ---------- sonidos de llamada y sala ----------
const ringer = {
  ctx: null, timer: null,
  beep(freqs, dur = 0.09, gain = 0.12) {
    if (settings.dnd) return;
    try {
      const c = (this.ctx = this.ctx || new AudioContext()); const now = c.currentTime;
      freqs.forEach((f, idx) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t0 = now + idx * (dur + 0.02);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
        g.gain.linearRampToValueAtTime(0, t0 + dur);
        o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.01);
      });
    } catch {}
  },
  start(kind) {
    this.stop(); if (kind === 'in' && settings.dnd) return;
    const play = () => {
      try {
        const c = (this.ctx = this.ctx || new AudioContext()); const now = c.currentTime;
        const vol = Math.max(0, Math.min(1, settings.ringVol)) * (kind === 'in' ? 0.35 : 0.16);
        const tone = (f, t, d) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, now + t); g.gain.linearRampToValueAtTime(vol, now + t + 0.02); g.gain.setValueAtTime(vol, now + t + d - 0.04); g.gain.linearRampToValueAtTime(0, now + t + d); o.connect(g).connect(c.destination); o.start(now + t); o.stop(now + t + d + 0.02); };
        if (kind === 'in') { tone(660, 0, 0.18); tone(880, 0.22, 0.18); tone(660, 0.62, 0.18); tone(880, 0.84, 0.18); } else { tone(440, 0, 0.45); tone(480, 0, 0.45); }
      } catch {}
    };
    play(); this.timer = setInterval(play, kind === 'in' ? 2200 : 3200);
  },
  stop() { clearInterval(this.timer); this.timer = null; },
};

// ---------- red ----------
function toast(msg) { const t = h('div', null, msg); $('toast').append(t); setTimeout(() => t.remove(), 4200); }
function connect(url) {
  return new Promise((res, rej) => {
    let ws; try { ws = new WebSocket(url); } catch { return rej(new Error('URL de servidor inválida')); }
    let opened = false;
    ws.onopen = () => { opened = true; S.ws = ws; res(ws); };
    ws.onerror = () => { if (!opened) rej(new Error('No se pudo conectar al servidor')); };
    ws.onmessage = onMsg;
    ws.onclose = () => { if (S.ws === ws) { S.ws = null; if (S.me) scheduleReconnect(); } };
  });
}
function rpc(t, d = {}) {
  return new Promise((res, rej) => {
    if (!S.ws || S.ws.readyState !== 1) return rej(new Error('Sin conexión'));
    const i = ++S.seq; S.pend.set(i, { res, rej });
    S.ws.send(JSON.stringify({ ...d, t, i }));
    setTimeout(() => { if (S.pend.delete(i)) rej(new Error('Tiempo agotado')); }, 15000);
  });
}
const sendRaw = (t, d) => { if (S.ws?.readyState === 1) S.ws.send(JSON.stringify({ ...d, t })); };
const safe = (p) => p.catch((e) => { toast(e.message); throw e; });

let retry = 0;
function scheduleReconnect() {
  leaveCall(true); clearIncoming(); toast('Conexión perdida, reintentando…');
  const go = async () => {
    try {
      await connect(settings.server);
      const r = await rpc('resume', { token: S.token });
      S.me = r.user; S.ice = r.ice; retry = 0; toast('Reconectado'); await bootstrap();
    } catch (e) { retry = Math.min(retry + 1, 6); setTimeout(go, 1000 * 2 ** retry); }
  };
  setTimeout(go, 1500);
}

function onMsg(ev) {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  if (m.r) { const p = S.pend.get(m.r); if (p) { S.pend.delete(m.r); m.ok ? p.res(m.data) : p.rej(new Error(m.error)); } return; }
  switch (m.t) {
    case 'presence': {
      for (const f of S.friends.friends) if (f.id === m.id) f.online = m.online;
      for (const sd of S.sdata.values()) for (const mem of sd.members) if (mem.id === m.id) mem.online = m.online;
      renderSide(); renderMembers(); renderHome(); break;
    }
    case 'friends.changed': loadFriends(); break;
    case 'servers.changed': loadServers(); break;
    case 'server.changed': if (S.sdata.has(m.id) || S.view.sid === m.id) refreshServer(m.id); break;
    case 'msg': onChatMsg(m); break;
    case 'msg.pinned': onMsgPinned(m); break;
    case 'typing': onTyping(m); break;
    case 'voice.room': S.rooms.set(m.key, m.users); if (!m.users.length) S.rooms.delete(m.key); renderSide(); break;
    case 'voice.joined': S.call?.addPeer(m.user); ringer.beep([520, 680]); break;
    case 'voice.left': S.call?.removePeer(m.userId); ringer.beep([600, 420]); break;
    case 'voice.peerstate': { const p = S.call?.peers.get(m.userId); if (p) { p.state = m.state; renderStage(); } break; }
    case 'voice.kicked': leaveCall(true); toast('Te uniste desde otro dispositivo'); break;
    case 'rtc.signal': S.call?.handleSignal(m.from, m.data); break;
    case 'call.incoming': showIncoming(m); break;
    case 'call.stop': onCallStop(m); break;
    case 'profile.changed': onProfile(m.profile); break;
  }
}

function onTyping(m) {
  if (m.channel !== S.chan) return;
  const bar = $('typingBar');
  bar.textContent = `✍️ ${m.name} está escribiendo…`;
  bar.classList.remove('hidden');
  clearTimeout(S.typingTimer);
  S.typingTimer = setTimeout(() => bar.classList.add('hidden'), 3200);
}

function onProfile(p) {
  if (p.id === S.me.id) Object.assign(S.me, p);
  for (const f of [...S.friends.friends, ...S.friends.incoming, ...S.friends.outgoing]) if (f.id === p.id) { f.color = p.color; f.av = p.av; }
  for (const sd of S.sdata.values()) for (const mem of sd.members) if (mem.id === p.id) { mem.color = p.color; mem.av = p.av; }
  render(); renderCallOverlay();
}

// ---------- login y actualizaciones ----------
function normUrl(u) { u = (u || '').trim(); if (!u) return DEFAULTS.server; if (!/^wss?:\/\//i.test(u)) u = 'ws://' + u; if (!/:\d+/.test(u.replace(/^wss?:\/\//i, '')) && u.startsWith('ws://')) u += ':7777'; return u; }
function httpBase() { return settings.server.replace(/^ws/i, 'http').replace(/\/+$/, ''); }
$('lgServer').value = settings.server; $('lgUser').value = localStorage.getItem('epickast.user') || '';
$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); $('lgError').textContent = '';
  const mode = e.submitter?.dataset.mode || 'login';
  settings.server = normUrl($('lgServer').value); saveSettings();
  try {
    if (S.ws) { S.ws.onclose = null; S.ws.close(); S.ws = null; }
    await connect(settings.server);
    const r = await rpc(mode, { name: $('lgUser').value, password: $('lgPass').value });
    S.me = r.user; S.token = r.token; S.ice = r.ice;
    localStorage.setItem('epickast.token', r.token); localStorage.setItem('epickast.user', r.user.name);
    $('lgPass').value = ''; await bootstrap();
  } catch (err) { $('lgError').textContent = err.message; }
});
async function autoLogin() {
  if (!S.token) return;
  try { await connect(settings.server); const r = await rpc('resume', { token: S.token }); S.me = r.user; S.ice = r.ice; await bootstrap(); }
  catch { if (S.ws) { S.ws.onclose = null; S.ws.close(); S.ws = null; } }
}
async function bootstrap() {
  $('login').classList.add('hidden'); $('main').classList.remove('hidden');
  await Promise.all([loadFriends(), loadServers(), checkServerUpdate()]);
  if (S.view.kind === 'server') await refreshServer(S.view.sid);
  render();
}
async function checkServerUpdate() {
  try {
    const info = await rpc('app.version');
    S.srvRelease = info;
    const bar = $('updateBar');
    if (info?.version && info.version !== S.appVer && info.downloadPath) {
      const url = httpBase() + info.downloadPath;
      bar.replaceChildren(
        h('span', null, `✨ Nueva versión de EpicKast disponible (${info.version})`),
        h('button', { onclick: () => window.epic.openExternal?.(url) }, '⬇ Descargar actualización')
      );
      bar.classList.remove('hidden');
    } else {
      bar.classList.add('hidden');
    }
  } catch {}
}

// ---------- datos ----------
async function loadFriends() { try { S.friends = await rpc('friends.list'); } catch {} renderSide(); renderHome(); renderCallOverlay(); }
async function loadServers() {
  try { S.servers = await rpc('servers.list'); } catch { return; }
  if (S.view.kind === 'server' && !S.servers.some((s) => s.id === S.view.sid)) goHome();
  renderRail(); renderSide();
}
async function refreshServer(id) {
  try { S.sdata.set(id, await rpc('server.get', { id })); } catch { S.sdata.delete(id); if (S.view.sid === id) goHome(); return; }
  for (const c of S.sdata.get(id).channels) if (c.room) { if (c.room.length) S.rooms.set(c.key, c.room); else S.rooms.delete(c.key); }
  if (S.view.sid === id) { renderSide(); renderMembers(); }
}

// ---------- navegación ----------
function goHome() { S.view = { kind: 'home', sid: null }; S.chan = null; render(); }
async function openServer(id) {
  S.view = { kind: 'server', sid: id };
  if (!S.sdata.has(id)) await refreshServer(id);
  const sd = S.sdata.get(id); const first = sd?.channels.find((c) => c.type === 'text');
  S.chan = null; render();
  if (first) openChannel(first.key, 'text', first.name);
}
async function openChannel(key, type, name) {
  S.chan = key; S.chanType = type; S.chanName = name; S.unread.delete(key); S.oldest = null;
  clearReply();
  $('typingBar').classList.add('hidden');
  render(); $('msgs').replaceChildren();
  if (type === 'voice') return;
  try { const hist = await rpc('msg.history', { channel: key }); if (S.chan !== key) return; hist.forEach((m) => addMsg(m, false)); S.oldest = hist[0]?.id ?? null; $('msgs').scrollTop = 1e9; } catch (e) { toast(e.message); }
  $('msgInput').focus();
}
$('msgs').addEventListener('scroll', async () => {
  const box = $('msgs');
  if (box.scrollTop > 40 || !S.oldest || S.loadingOld || !S.chan) return;
  S.loadingOld = true;
  try {
    const hist = await rpc('msg.history', { channel: S.chan, before: S.oldest });
    if (hist.length) { const prev = box.scrollHeight; const frag = document.createDocumentFragment(); hist.forEach((m) => frag.append(msgEl(m))); box.prepend(frag); box.scrollTop = box.scrollHeight - prev; S.oldest = hist[0].id; } else S.oldest = null;
  } catch {} S.loadingOld = false;
});

// ---------- mensajes, notas de voz, respuestas y archivos ----------
const fmtTime = (ts) => new Date(ts).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
const fmtSize = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);
const isImgMime = (mime, name = '') => /^image\/(png|jpeg|webp|gif|bmp)$/i.test(mime || '') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(name);
const isAudioMime = (mime, name = '') => /^audio\//i.test(mime || '') || /\.(webm|ogg|mp3|wav|m4a)$/i.test(name);
const fileUrl = (id, dl = false) => `${httpBase()}/files/${id}${dl ? '?dl=1' : ''}`;

function setReply(m) {
  S.replyTo = { id: m.id, name: m.name, text: m.text || (m.fileName ? `📎 ${m.fileName}` : 'Archivo adjunto') };
  const bar = $('replyBar');
  bar.replaceChildren(
    h('span', { style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, '↩ Respondiendo a ', h('b', null, S.replyTo.name), ': ', S.replyTo.text.slice(0, 70)),
    h('button', { type: 'button', onclick: clearReply, title: 'Cancelar respuesta' }, '✕')
  );
  bar.classList.remove('hidden');
  $('msgInput').focus();
}
function clearReply() {
  S.replyTo = null;
  const bar = $('replyBar');
  if (bar) { bar.classList.add('hidden'); bar.replaceChildren(); }
}

function jumpToMsg(id) {
  const el = document.querySelector(`[data-mid="${id}"]`);
  if (!el) return toast('El mensaje original es más antiguo (desplázate hacia arriba)');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('flash-msg');
  void el.offsetWidth;
  el.classList.add('flash-msg');
}

function openImageLightbox(url, name, dlUrl) {
  modal(name || 'Imagen',
    h('div', { style: 'display:grid;place-items:center;background:#090a0e;border-radius:12px;padding:8px;max-height:68vh;overflow:auto' },
      h('img', { src: url, style: 'max-width:100%;max-height:64vh;object-fit:contain;border-radius:8px' })
    ),
    h('div', { class: 'row' },
      h('button', { class: 'primary', onclick: () => window.epic.openExternal?.(dlUrl || url) }, '⬇ Descargar original')
    )
  );
}

function attachmentEl(m) {
  if (!m.fileId) return null;
  const url = fileUrl(m.fileId, false);
  const dl = fileUrl(m.fileId, true);
  if (isImgMime(m.fileMime, m.fileName)) {
    return h('img', {
      class: 'att-img',
      src: url,
      alt: m.fileName || 'imagen',
      loading: 'lazy',
      title: `${m.fileName || 'Imagen'} (${fmtSize(m.fileSize || 0)}) — Clic para ampliar`,
      onclick: () => openImageLightbox(url, m.fileName, dl),
    });
  }
  if (isAudioMime(m.fileMime, m.fileName)) {
    return h('div', { class: 'att-aud' },
      h('span', { style: 'font-size:18px' }, '🎙️'),
      h('audio', { controls: true, preload: 'metadata', src: url }),
      h('span', { class: 'fs' }, fmtSize(m.fileSize || 0))
    );
  }
  return h('div', { class: 'att-doc' },
    h('span', { style: 'font-size:22px' }, '📄'),
    h('div', { style: 'min-width:0' },
      h('div', { class: 'fn', title: m.fileName }, m.fileName || 'documento'),
      h('div', { class: 'fs' }, fmtSize(m.fileSize || 0))
    ),
    h('button', { class: 'primary', style: 'padding:5px 10px;font-size:12px', onclick: () => window.epic.openExternal?.(dl) }, '⬇ Descargar')
  );
}

const msgEl = (m) => h('div', { class: 'm', 'data-mid': m.id },
  avatar({ id: m.userId, name: m.name, color: m.color, av: m.av }, 36),
  h('div', { class: 'mb' },
    m.replyId ? h('div', { class: 'quote', onclick: () => jumpToMsg(m.replyId), title: 'Ir al mensaje original' },
      h('b', null, `↩ ${m.replyName || 'Mensaje'}:`),
      h('span', null, m.replyText || '📎 Archivo adjunto')
    ) : null,
    h('div', { class: 'mhead' },
      h('b', null, m.name),
      h('i', null, fmtTime(m.ts)),
      m.pinned ? h('span', { class: 'pin-tag' }, '📌 Fijado') : null
    ),
    m.text ? h('div', { class: 'tx' }, m.text) : null,
    attachmentEl(m)
  ),
  h('div', { class: 'macts' },
    h('button', { title: 'Responder a este mensaje', onclick: () => setReply(m) }, '↩'),
    h('button', { title: 'Fijar / Desfijar mensaje', onclick: () => rpc('msg.pin', { id: m.id }).catch((e) => toast(e.message)) }, '📌')
  )
);

function onMsgPinned(m) {
  if (m.channel !== S.chan) return;
  const el = document.querySelector(`[data-mid="${m.id}"] .mhead`);
  if (!el) return;
  const existing = el.querySelector('.pin-tag');
  if (m.pinned && !existing) el.append(h('span', { class: 'pin-tag' }, '📌 Fijado'));
  else if (!m.pinned && existing) existing.remove();
}

function addMsg(m, stick = true) {
  const box = $('msgs'); const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.append(msgEl(m));
  while (box.childElementCount > 300) box.firstElementChild.remove();
  if (stick && near) box.scrollTop = 1e9;
}
function onChatMsg(m) {
  if (m.channel === S.chan) {
    $('typingBar').classList.add('hidden');
    addMsg(m.msg);
  } else if (m.msg.userId !== S.me.id) {
    S.unread.add(m.channel); renderSide(); renderRail();
    const preview = m.msg.text || (m.msg.fileName ? `📎 ${m.msg.fileName}` : 'Nuevo mensaje');
    if (m.channel[0] === 'd' && !settings.dnd) { toast(`${m.msg.name}: ${preview.slice(0, 60)}`); window.epic.flash(); }
  }
}

async function uploadFiles(fileList) {
  if (!S.chan || S.chanType === 'voice') return toast('Abre un chat de texto o mensaje directo primero');
  const files = [...(fileList || [])];
  if (!files.length) return;
  const caption = $('msgInput').value.trim();
  const replyId = S.replyTo?.id || '';
  $('msgInput').value = '';
  clearReply();
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.size > 25 * 1024 * 1024) { toast(`"${f.name}" supera los 25 MB`); continue; }
    toast(`Subiendo "${f.name}" (${fmtSize(f.size)})…`);
    try {
      const qs = new URLSearchParams({
        channel: S.chan,
        name: f.name || 'archivo',
        mime: f.type || 'application/octet-stream',
        text: i === 0 ? caption : '',
        replyTo: i === 0 && replyId ? String(replyId) : '',
      });
      const res = await fetch(`${httpBase()}/upload?${qs}`, {
        method: 'POST',
        headers: { 'x-token': S.token },
        body: f,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al subir archivo');
    } catch (e) {
      toast(e.message || 'No se pudo subir el archivo');
    }
  }
}

// ---------- Notas de Voz rápidas (estilo Telegram) ----------
$('bVoiceNote').addEventListener('click', async () => {
  if (!S.chan || S.chanType === 'voice') return toast('Abre un chat de texto o mensaje directo primero');
  const btn = $('bVoiceNote');
  if (S.vrec) {
    S.vrec.stop();
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: settings.mic ? { ideal: settings.mic } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch {
    return toast('No se pudo abrir el micrófono para grabar la nota de voz');
  }
  const chunks = [];
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 64000 });
  const t0 = Date.now();
  const tick = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    btn.textContent = `⏹ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 250);
  btn.classList.add('rec');
  btn.textContent = '⏹ 0:00';
  rec.ondataavailable = (ev) => { if (ev.data?.size > 0) chunks.push(ev.data); };
  rec.onstop = () => {
    clearInterval(tick);
    stream.getTracks().forEach((t) => t.stop());
    btn.classList.remove('rec');
    btn.textContent = '🎙️';
    S.vrec = null;
    if (!chunks.length || Date.now() - t0 < 400) return;
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const file = new File([blob], `Nota-de-voz-${new Date().toTimeString().slice(0, 8).replace(/:/g, '-')}.webm`, { type: 'audio/webm' });
    uploadFiles([file]);
  };
  S.vrec = rec;
  rec.start();
});

$('bAttach').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', (e) => { uploadFiles(e.target.files); e.target.value = ''; });
$('msgInput').addEventListener('input', () => {
  if (!S.chan || S.chanType === 'voice') return;
  const now = Date.now();
  if (now - S.lastTypingSent > 2200) { S.lastTypingSent = now; sendRaw('msg.typing', { channel: S.chan }); }
});
$('msgInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.replyTo) clearReply();
});
$('msgInput').addEventListener('paste', (e) => {
  const files = e.clipboardData?.files;
  if (files && files.length > 0) { e.preventDefault(); uploadFiles(files); }
});
$('center').addEventListener('dragover', (e) => {
  if (!S.chan || S.chanType === 'voice') return;
  e.preventDefault(); $('center').classList.add('dragover');
});
$('center').addEventListener('dragleave', (e) => {
  if (e.target === $('center')) $('center').classList.remove('dragover');
});
$('center').addEventListener('drop', (e) => {
  e.preventDefault(); $('center').classList.remove('dragover');
  if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files);
});
$('composer').addEventListener('submit', (e) => {
  e.preventDefault(); const t = $('msgInput').value.trim();
  if (!t || !S.chan || S.chanType === 'voice') return;
  const replyTo = S.replyTo?.id || undefined;
  $('msgInput').value = '';
  clearReply();
  rpc('msg.send', { channel: S.chan, text: t, replyTo }).catch((er) => toast(er.message));
});

// ---------- Mensajes Fijados (estilo Slack / Linear) ----------
async function modalPins() {
  if (!S.chan) return;
  let pins = [];
  try { pins = await rpc('msg.pins', { channel: S.chan }); } catch (e) { return toast(e.message); }
  const body = h('div', { class: 'gal-list' });
  const draw = () => {
    body.replaceChildren();
    if (!pins.length) {
      body.append(h('div', { class: 'hint', style: 'padding:18px 0;text-align:center' }, 'No hay mensajes fijados en este canal. Pasa el cursor sobre cualquier mensaje y pulsa 📌 para fijarlo.'));
      return;
    }
    for (const m of pins) {
      body.append(
        h('div', { class: 'item', style: 'background:var(--bg3);align-items:flex-start;gap:10px' },
          h('div', { style: 'min-width:0;flex:1', onclick: () => { closeModal(); jumpToMsg(m.id); } },
            h('div', { style: 'display:flex;gap:8px;align-items:baseline' },
              h('b', { style: 'color:var(--tx)' }, m.name),
              h('span', { class: 'hint' }, fmtTime(m.ts))
            ),
            m.text ? h('div', { style: 'color:var(--tx);margin-top:3px;white-space:pre-wrap;word-break:break-word' }, m.text) : null,
            m.fileName ? h('div', { class: 'hint', style: 'margin-top:3px' }, `📎 ${m.fileName}`) : null
          ),
          h('button', { title: 'Desfijar', onclick: async () => {
            await rpc('msg.pin', { id: m.id }).catch(() => {});
            pins = pins.filter((x) => x.id !== m.id);
            draw();
          } }, '✕')
        )
      );
    }
  };
  draw();
  modal(`📌 Mensajes fijados · ${S.chanName}`, body);
}

// ---------- Galería de Imágenes y Documentos ----------
async function modalGallery() {
  if (!S.chan) return;
  let items = [];
  try { items = await rpc('files.list', { channel: S.chan }); } catch (e) { return toast(e.message); }
  const imgs = items.filter((f) => isImgMime(f.mime, f.name));
  const docs = items.filter((f) => !isImgMime(f.mime, f.name));
  let tab = imgs.length || !docs.length ? 'img' : 'doc';
  const body = h('div');
  const bImg = h('button', { onclick: () => { tab = 'img'; draw(); } }, `🖼️ Imágenes (${imgs.length})`);
  const bDoc = h('button', { onclick: () => { tab = 'doc'; draw(); } }, `📄 Documentos y Audios (${docs.length})`);
  const search = h('input', { placeholder: 'Buscar por nombre o usuario…', oninput: () => draw() });

  function draw() {
    bImg.className = tab === 'img' ? 'primary' : '';
    bDoc.className = tab === 'doc' ? 'primary' : '';
    const q = search.value.trim().toLowerCase();
    body.replaceChildren();
    if (tab === 'img') {
      const list = imgs.filter((f) => !q || f.name.toLowerCase().includes(q) || f.userName.toLowerCase().includes(q));
      if (!list.length) { body.append(h('div', { class: 'hint', style: 'padding:18px 0;text-align:center' }, 'No hay imágenes en este canal')); return; }
      body.append(h('div', { class: 'gal-grid' }, list.map((f) =>
        h('div', { class: 'gal-card', onclick: () => openImageLightbox(fileUrl(f.id, false), f.name, fileUrl(f.id, true)) },
          h('img', { src: fileUrl(f.id, false), loading: 'lazy', alt: f.name }),
          h('div', { class: 'meta', title: `${f.name} · por ${f.userName}` }, `${f.userName} · ${fmtSize(f.size)}`)
        )
      )));
    } else {
      const list = docs.filter((f) => !q || f.name.toLowerCase().includes(q) || f.userName.toLowerCase().includes(q));
      if (!list.length) { body.append(h('div', { class: 'hint', style: 'padding:18px 0;text-align:center' }, 'No hay documentos en este canal')); return; }
      body.append(h('div', { class: 'gal-list' }, list.map((f) =>
        h('div', { class: 'item', style: 'background:var(--bg3);cursor:default' },
          h('div', { style: 'min-width:0' },
            h('div', { style: 'font-weight:600;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, `${isAudioMime(f.mime, f.name) ? '🎙️' : '📄'} ${f.name}`),
            h('div', { class: 'hint' }, `${fmtSize(f.size)} · enviado por ${f.userName} · ${fmtTime(f.ts)}`)
          ),
          h('button', { class: 'primary', onclick: () => window.epic.openExternal?.(fileUrl(f.id, true)) }, '⬇ Descargar')
        )
      )));
    }
  }
  draw();
  modal(`Galería de archivos · ${S.chanName}`, h('div', { class: 'gal-tabs' }, bImg, bDoc), search, body);
}

// ---------- render ----------
function render() { renderRail(); renderSide(); renderMembers(); renderCenter(); renderHome(); renderStage(); renderMe(); }
function renderMe() {
  const bar = $('meBar'); if (!S.me) return; bar.replaceChildren(
    h('div', { class: 'who', title: 'Editar perfil', onclick: modalProfile }, avatar(S.me, 34, true), h('div', { style: 'min-width:0' }, h('b', null, S.me.name), h('small', null, S.me.bio || 'Editar perfil'))),
    h('button', { title: 'Ajustes', onclick: modalSettings }, '⚙️'));
}
function renderRail() {
  const r = $('rail'); r.replaceChildren();
  const dmUnread = [...S.unread].some((k) => k[0] === 'd');
  r.append(h('div', { class: 'ico' + (S.view.kind === 'home' ? ' sel' : ''), title: 'Inicio / Amigos', onclick: goHome }, dmUnread ? '🔴' : h('img', { src: 'logo.svg', alt: 'EK' })));
  for (const s of S.servers) r.append(h('div', { class: 'ico' + (S.view.sid === s.id ? ' sel' : ''), title: s.name, onclick: () => openServer(s.id) }, s.name.slice(0, 2).toUpperCase()));
  r.append(h('div', { class: 'ico', title: 'Crear o unirse a un servidor', onclick: modalServer }, '+'));
}
function userItem(u, onclick, extra) {
  return h('div', { class: 'item' + (S.chan === u.dm ? ' sel' : ''), onclick }, h('span', { class: 'l' }, avatar(u, 28, u.online), h('span', { class: 'nm' }, u.name, S.unread.has(u.dm) ? ' ●' : '')), extra);
}
function renderSide() {
  const L = $('sideList'); L.replaceChildren();
  if (S.view.kind === 'home') {
    $('sideTitle').replaceChildren(h('span', null, 'Mensajes directos'));
    for (const f of S.friends.friends) {
      L.append(userItem(f, () => openChannel(f.dm, 'dm', f.name), h('button', { class: 'btn-call', title: `Llamar a ${f.name}`, style: 'padding:3px 8px', onclick: (e) => { e.stopPropagation(); openChannel(f.dm, 'dm', f.name); joinCall(f.dm, f.name); } }, '📞')));
      const room = S.rooms.get(f.dm); if (room?.length) L.append(h('div', { class: 'sub' }, `🔊 en llamada (${room.length})`));
    }
    if (!S.friends.friends.length) L.append(h('div', { class: 'item' }, 'Aún no tienes amigos'));
    return;
  }
  const sd = S.sdata.get(S.view.sid); if (!sd) return;
  $('sideTitle').replaceChildren(h('span', null, sd.name), h('button', { onclick: modalServerManage, title: 'Administrar' }, '⋯'));
  for (const type of ['text', 'voice']) {
    L.append(h('div', { class: 'sect' }, type === 'text' ? 'Canales de texto' : 'Canales de voz',
      sd.owner === S.me.id ? h('button', { title: 'Crear canal', onclick: () => modalChannel(sd.id, type) }, '+') : null));
    for (const c of sd.channels.filter((x) => x.type === type)) {
      const sel = S.chan === c.key;
      L.append(h('div', { class: 'item' + (sel ? ' sel' : ''), onclick: () => (type === 'voice' ? joinCall(c.key, c.name) : openChannel(c.key, 'text', c.name)) },
        h('span', null, (type === 'text' ? '# ' : '🔊 ') + c.name, S.unread.has(c.key) ? ' ●' : '')));
      if (type === 'voice') for (const u of S.rooms.get(c.key) || []) L.append(h('div', { class: 'sub' }, avatar(u, 18), (u.state?.screen ? '🖥️ ' : u.state?.cam ? '📷 ' : '') + u.name + (u.state?.muted ? ' 🔇' : '')));
    }
  }
}
function renderMembers() {
  const M = $('members'); M.replaceChildren();
  if (S.view.kind !== 'server') return;
  const sd = S.sdata.get(S.view.sid); if (!sd) return;
  M.append(h('div', { class: 'sect' }, `Miembros — ${sd.members.length}`));
  for (const m of [...sd.members].sort((a, b) => b.online - a.online)) M.append(h('div', { class: 'item' }, h('span', { class: 'l' }, avatar(m, 28, m.online), h('span', { class: 'nm' }, m.name, m.id === sd.owner ? ' 👑' : ''))));
}
function renderCenter() {
  const dm = S.chan && S.chan[0] === 'd';
  const showChat = !!S.chan && S.chanType !== 'voice';
  const rightBtns = h('div', { style: 'display:flex;gap:8px;align-items:center' },
    showChat ? h('button', { title: 'Ver mensajes fijados en este canal', onclick: modalPins }, '📌 Fijados') : null,
    showChat ? h('button', { title: 'Ver galería de imágenes y documentos enviados', onclick: modalGallery }, '🖼️ Galería') : null,
    dm ? h('button', { class: 'btn-call', title: 'Iniciar una llamada de voz/video', onclick: () => joinCall(S.chan, S.chanName) }, '📞 Llamar') : null
  );
  $('chTitle').replaceChildren(
    h('span', null, S.chan ? (S.chanType === 'text' ? '# ' : dm ? '@ ' : '') + S.chanName : S.view.kind === 'home' ? 'Amigos' : ''),
    rightBtns
  );
  $('msgs').classList.toggle('hidden', !showChat); $('composer').classList.toggle('hidden', !showChat);
  $('home').classList.toggle('hidden', showChat || S.view.kind !== 'home');
}
function renderHome() {
  const H = $('home'); if (H.classList.contains('hidden') && S.view.kind !== 'home') return;
  H.replaceChildren();
  const inp = h('input', { placeholder: 'Nombre de usuario del amigo' });
  H.append(h('h3', null, 'Agregar amigo'), h('div', { class: 'row' }, inp, h('button', { class: 'primary', onclick: () => { if (inp.value.trim()) safe(rpc('friends.add', { name: inp.value })).then(() => { inp.value = ''; toast('Solicitud enviada'); }); } }, 'Enviar')));
  if (S.friends.incoming.length) H.append(h('h3', null, 'Solicitudes recibidas'));
  for (const u of S.friends.incoming) H.append(h('div', { class: 'item' }, h('span', { class: 'l' }, avatar(u, 32), u.name), h('span', null, h('button', { class: 'primary', onclick: () => rpc('friends.accept', { id: u.id }) }, 'Aceptar'), ' ', h('button', { onclick: () => rpc('friends.remove', { id: u.id }) }, 'Rechazar'))));
  if (S.friends.outgoing.length) H.append(h('h3', null, 'Pendientes'));
  for (const u of S.friends.outgoing) H.append(h('div', { class: 'item' }, h('span', { class: 'l' }, avatar(u, 32), u.name), h('button', { onclick: () => rpc('friends.remove', { id: u.id }) }, 'Cancelar')));
  H.append(h('h3', null, `Amigos — ${S.friends.friends.length}`));
  for (const u of S.friends.friends) H.append(h('div', { class: 'item' }, h('span', { class: 'l' }, avatar(u, 36, u.online), h('span', { class: 'nm' }, u.name, h('div', { class: 'hint' }, u.online ? 'En línea' : 'Desconectado'))),
    h('span', { class: 'row' }, h('button', { class: 'btn-msg', onclick: () => openChannel(u.dm, 'dm', u.name) }, '💬 Mensaje'), h('button', { class: 'btn-call', onclick: () => { openChannel(u.dm, 'dm', u.name); joinCall(u.dm, u.name); } }, '📞 Llamar'), h('button', { title: 'Eliminar amigo', onclick: () => confirm(`¿Eliminar a ${u.name}?`) && rpc('friends.remove', { id: u.id }) }, '✕'))));
}

// ---------- modales ----------
function modal(title, ...body) {
  const m = $('modal'); m.replaceChildren(h('div', { class: 'panel' }, h('h3', null, title), ...body, h('button', { onclick: closeModal }, 'Cerrar')));
  m.classList.remove('hidden'); m.onclick = (e) => { if (e.target === m) closeModal(); };
}
function closeModal() { S.cleanup.splice(0).forEach((f) => { try { f(); } catch {} }); $('modal').classList.add('hidden'); $('modal').replaceChildren(); }
function modalServer() {
  const name = h('input', { placeholder: 'Nombre del servidor' }); const code = h('input', { placeholder: 'Código de invitación' });
  modal('Servidores', h('label', null, 'Crear un servidor', name), h('button', { class: 'primary', onclick: async () => { const r = await safe(rpc('server.create', { name: name.value })); closeModal(); await loadServers(); openServer(r.id); } }, 'Crear'),
    h('label', null, 'Unirse con invitación', code), h('button', { class: 'primary', onclick: async () => { const r = await safe(rpc('server.join', { code: code.value })); closeModal(); await loadServers(); openServer(r.id); } }, 'Unirse'));
}
function modalChannel(sid, type) {
  const name = h('input', { placeholder: 'nombre-del-canal' });
  modal(type === 'text' ? 'Nuevo canal de texto' : 'Nuevo canal de voz', name, h('button', { class: 'primary', onclick: async () => { await safe(rpc('channel.create', { serverId: sid, name: name.value, type })); closeModal(); } }, 'Crear'));
}
function modalServerManage() {
  const sd = S.sdata.get(S.view.sid); if (!sd) return; const own = sd.owner === S.me.id; const parts = [];
  if (own) {
    parts.push(h('label', null, 'Código de invitación (compártelo con tus amigos)', h('input', { value: sd.invite || '', readonly: true, onclick: (e) => { e.target.select(); navigator.clipboard?.writeText(e.target.value); toast('Copiado'); } })));
    parts.push(h('button', { onclick: () => rpc('server.newinvite', { id: sd.id }).then(closeModal) }, 'Generar nueva invitación'));
    parts.push(h('div', { class: 'sect' }, 'Canales'));
    for (const c of sd.channels) parts.push(h('div', { class: 'item' }, (c.type === 'text' ? '# ' : '🔊 ') + c.name, h('button', { onclick: () => confirm(`¿Eliminar ${c.name}?`) && rpc('channel.delete', { id: c.id }).then(closeModal) }, '✕')));
    parts.push(h('div', { class: 'sect' }, 'Miembros'));
    for (const m of sd.members) if (m.id !== S.me.id) parts.push(h('div', { class: 'item' }, h('span', { class: 'l' }, avatar(m, 24), m.name), h('button', { onclick: () => confirm(`¿Expulsar a ${m.name}?`) && rpc('server.kick', { id: sd.id, userId: m.id }).then(closeModal) }, 'Expulsar')));
    parts.push(h('button', { class: 'danger', onclick: () => confirm('¿Eliminar el servidor y sus mensajes?') && rpc('server.delete', { id: sd.id }).then(closeModal) }, 'Eliminar servidor'));
  } else parts.push(h('button', { class: 'danger', onclick: () => rpc('server.leave', { id: sd.id }).then(closeModal) }, 'Salir del servidor'));
  modal(sd.name, ...parts);
}

// ---- perfil / personalización (carga de imagen corregida con FileReader + compresión automática) ----
function modalProfile() {
  const me = S.me; let color = colorFor(me); let avatarData;
  const ini = (me.name || '?')[0].toUpperCase();
  const pv = h('div', { class: 'avatar', style: `width:96px;height:96px;font-size:42px;background-color:${color}` }, ini);
  const showImg = (url) => { pv.style.backgroundImage = url ? `url(${url})` : ''; pv.classList.toggle('img', !!url); };
  if (me.av && avCache.get(`${me.id}:${me.av}`)) showImg(avCache.get(`${me.id}:${me.av}`));
  const file = h('input', { type: 'file', accept: 'image/*', class: 'hidden', onchange: () => {
    const f = file.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
        const s = Math.min(img.width, img.height);
        x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
        let out = c.toDataURL('image/webp', 0.82);
        if (out.length > 58000) out = c.toDataURL('image/webp', 0.62);
        if (out.length > 58000) out = c.toDataURL('image/jpeg', 0.65);
        avatarData = out;
        showImg(avatarData);
      };
      img.onerror = () => toast('Formato de imagen no compatible');
      img.src = reader.result;
    };
    reader.onerror = () => toast('No se pudo leer el archivo');
    reader.readAsDataURL(f);
  } });
  const sws = h('div', { class: 'swatches' }, PALETTE.map((c) => h('div', { class: 'sw' + (c === color ? ' sel' : ''), style: `background:${c}`, onclick: (e) => { color = c; pv.style.backgroundColor = c; sws.querySelectorAll('.sw').forEach((n) => n.classList.remove('sel')); e.target.classList.add('sel'); } })));
  const bio = h('input', { value: me.bio || '', maxlength: 120, placeholder: 'Estado o frase (opcional)' });
  modal('Mi perfil', h('div', { class: 'prof' }, pv, h('div', { style: 'display:flex;flex-direction:column;gap:6px' }, h('button', { onclick: () => file.click() }, '📷 Subir foto'), h('button', { onclick: () => { avatarData = ''; showImg(null); } }, 'Quitar foto'), file)),
    h('label', null, 'Color del avatar', sws), h('label', null, 'Estado', bio),
    h('button', { class: 'primary', onclick: async () => { await safe(rpc('profile.set', { color, bio: bio.value, avatar: avatarData })); closeModal(); toast('Perfil actualizado'); } }, 'Guardar'));
}

async function modalSettings() {
  let devs = []; try { devs = await navigator.mediaDevices.enumerateDevices(); } catch {}
  const sel = (kind, key) => { const s = h('select', { onchange: () => { settings[key] = s.value; saveSettings(); } }, h('option', { value: '' }, 'Predeterminado'), devs.filter((d) => d.kind === kind).map((d, i) => h('option', { value: d.deviceId, selected: settings[key] === d.deviceId }, d.label || `Dispositivo ${i + 1}`))); return s; };
  const preset = (key, obj) => { const s = h('select', { onchange: () => { settings[key] = s.value; saveSettings(); S.call?.retune(); } }, Object.keys(obj).map((k) => h('option', { value: k, selected: settings[key] === k }, k))); return s; };
  const chk = (key, text, after) => h('label', { style: 'flex-direction:row;align-items:center;gap:8px;color:var(--tx)' }, h('input', { type: 'checkbox', style: 'width:auto', checked: !!settings[key], onchange: (e) => { settings[key] = e.target.checked; saveSettings(); after?.(); } }), text);
  const noiseSel = h('select', { onchange: () => { settings.noise = noiseSel.value; saveSettings(); if (mic) startTest(); else hint.textContent = 'Se aplicará en la próxima llamada.'; } },
    [['high', 'Alta — RNNoise + Filtro 115 Hz + Anti-Respiración (recomendada)'], ['std', 'Estándar — Chromium'], ['off', 'Desactivada']].map(([v, t]) => h('option', { value: v, selected: settings.noise === v }, t)));
  const audioQSel = h('select', { onchange: () => { settings.audioKbps = Number(audioQSel.value); saveSettings(); S.call?.peers.forEach((p) => p.senders.mic && S.call.tuneAudio(p.senders.mic)); } },
    [[64, 'Voz Clara (64 kbps)'], [96, 'Voz HD (96 kbps — recomendada)'], [128, 'Estudio / Música (128 kbps)']].map(([v, t]) => h('option', { value: v, selected: Number(settings.audioKbps) === v }, t)));
  const micGainLbl = h('span', null, `${Math.round((settings.micGain || 1) * 100)}%`);
  const micGainInput = h('input', { type: 'range', min: 0.5, max: 2, step: 0.05, value: settings.micGain || 1, oninput: () => {
    settings.micGain = Number(micGainInput.value); saveSettings();
    micGainLbl.textContent = `${Math.round(settings.micGain * 100)}%`;
    S.call?.mic?.setGain?.(settings.micGain);
    mic?.setGain?.(settings.micGain);
  } });
  const gatePct = (v) => (v <= 0.002 ? 'Desactivada (0%)' : `${Math.round((v / 0.06) * 100)}%`);
  const gateLbl = h('span', null, gatePct(settings.voiceGate ?? 0.024));
  const gateInput = h('input', { type: 'range', min: 0, max: 0.06, step: 0.002, value: settings.voiceGate ?? 0.024, oninput: () => {
    settings.voiceGate = Number(gateInput.value); saveSettings();
    gateLbl.textContent = gatePct(settings.voiceGate);
    S.call?.mic?.setGate?.(settings.voiceGate);
    mic?.setGate?.(settings.voiceGate);
  } });
  const hint = h('div', { class: 'hint' }, 'Incluye filtro paso-alto (115 Hz), recorte nasal (180 Hz), RNNoise y puerta de voz anti-respiración para silenciar suspiros y aire entre palabras.');
  let mic = null, raf = 0; const bar = h('div'); const meter = h('div', { class: 'meter' }, bar);
  const mon = h('input', { type: 'checkbox', style: 'width:auto', onchange: () => mic?.monitor(mon.checked) });
  const testBtn = h('button', { onclick: () => (mic ? stopTest() : startTest()) }, '🎙 Probar micrófono');
  const stopTest = () => { cancelAnimationFrame(raf); mic?.dispose(); mic = null; bar.style.width = '0'; testBtn.textContent = '🎙 Probar micrófono'; mon.checked = false; };
  const startTest = async () => {
    stopTest();
    try { mic = await createMic(settings); } catch { return toast('No se pudo abrir el micrófono'); }
    mic.monitor(true); mon.checked = true;
    testBtn.textContent = '⏹ Detener prueba'; hint.textContent = `Supresión activa: ${{ high: 'RNNoise + Puerta Anti-Respiración', std: 'estándar', off: 'ninguna' }[mic.mode]}. Respira suave para comprobar que la puerta de voz lo silencia.`;
    const loop = () => { bar.style.width = Math.min(100, Math.round(mic.level() * 180)) + '%'; raf = requestAnimationFrame(loop); }; loop();
  };
  S.cleanup.push(stopTest);
  const swA = h('div', { class: 'swatches' }, PALETTE.map((c) => h('div', { class: 'sw' + (c === settings.accent ? ' sel' : ''), style: `background:${c}`, onclick: (e) => { settings.accent = c; saveSettings(); applyAccent(); swA.querySelectorAll('.sw').forEach((n) => n.classList.remove('sel')); e.target.classList.add('sel'); } })));
  const vol = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: settings.ringVol, onchange: () => { settings.ringVol = Number(vol.value); saveSettings(); ringer.start('in'); setTimeout(() => ringer.stop(), 1200); } });
  const dlLink = httpBase() + '/download/latest';
  modal(`Ajustes · EpicKast v${S.appVer}`,
    h('label', null, 'Micrófono', sel('audioinput', 'mic')),
    h('label', null, h('span', null, 'Volumen de tu micrófono: ', micGainLbl), micGainInput),
    h('label', null, h('span', null, '🌬️ Filtro Anti-Respiración (Puerta de Voz): ', gateLbl), gateInput),
    h('label', null, 'Calidad de audio en llamada', audioQSel),
    h('label', null, 'Supresión de ruido', noiseSel), hint,
    h('div', { class: 'row' }, testBtn), meter,
    h('label', { style: 'flex-direction:row;align-items:center;gap:8px;color:var(--tx)' }, mon, 'Escuchar mi propia voz durante la prueba'),
    h('label', null, 'Cámara', sel('videoinput', 'cam')),
    h('label', null, 'Altavoces', sel('audiooutput', 'spk')),
    h('label', null, 'Calidad de cámara', preset('camPreset', CAM_PRESETS)),
    h('label', null, 'Calidad de pantalla', preset('screenPreset', SCREEN_PRESETS)),
    chk('screenAudio', 'Compartir audio del sistema (usa audífonos para evitar eco)'),
    chk('hwPrefer', 'Preferir H.264 por hardware (reiniciar llamada para aplicar)'),
    chk('stats', 'Mostrar estadísticas (CPU/RAM, codificador HW/CPU)', updateStatTimer),
    h('label', null, '⌨️ Atajo global para Silenciar / Activar micro (incluso jugando)',
      h('input', { value: settings.keyMute || 'Alt+M', placeholder: 'Ej. Alt+M o CommandOrControl+Shift+M', onchange: (e) => { settings.keyMute = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de micrófono actualizado'); } })),
    h('label', null, '⌨️ Atajo global para Silenciar audio (Deafen)',
      h('input', { value: settings.keyDeaf || 'Alt+D', placeholder: 'Ej. Alt+D', onchange: (e) => { settings.keyDeaf = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de audio actualizado'); } })),
    h('label', null, 'Color de acento', swA),
    h('label', null, 'Volumen del timbre', vol),
    chk('dnd', 'No molestar (sin timbre ni avisos de mensajes)'),
    h('label', null, '📦 Enlace de descarga/actualización para tus amigos (clic para copiar)',
      h('input', { value: dlLink, readonly: true, onclick: (e) => { e.target.select(); navigator.clipboard?.writeText(dlLink); toast('Enlace de descarga copiado'); } })),
    h('label', null, 'Servidor', h('input', { value: settings.server, onchange: (e) => { settings.server = normUrl(e.target.value); saveSettings(); toast('Se aplicará al volver a iniciar sesión'); } })),
    h('button', { class: 'danger', onclick: () => { localStorage.removeItem('epickast.token'); location.reload(); } }, 'Cerrar sesión'));
}

// ---------- llamadas entrantes / salientes ----------
const friendByDm = (key) => S.friends.friends.find((f) => f.dm === key);
function showIncoming(m) {
  if (S.callKey === m.key) return;
  S.incoming = { key: m.key, from: m.from }; ringer.start('in'); renderCallOverlay();
  if (!settings.dnd) { window.epic.flash(); if (!document.hasFocus()) try { new Notification(`${m.from.name} te está llamando`, { body: 'Abre EpicKast para contestar', silent: true }); } catch {} }
}
function clearIncoming() { S.incoming = null; if (!S.outgoing) ringer.stop(); renderCallOverlay(); }
function clearOutgoing() { S.outgoing = null; if (!S.incoming) ringer.stop(); renderCallOverlay(); }
function onCallStop(m) {
  if (S.incoming?.key === m.key) {
    const who = S.incoming.from.name; clearIncoming();
    if (m.reason === 'missed') toast(`Llamada perdida de ${who}`); else if (m.reason === 'cancelled') toast(`${who} canceló la llamada`);
  }
  if (S.outgoing?.key === m.key) {
    const who = S.outgoing.name; clearOutgoing();
    if (m.reason === 'declined') { toast(`${who} rechazó la llamada`); leaveCall(false); }
    else if (m.reason === 'missed') { toast(`${who} no contestó`); leaveCall(false); }
  }
}
async function answerIncoming() {
  const inc = S.incoming; if (!inc) return; clearIncoming();
  S.view = { kind: 'home', sid: null }; await openChannel(inc.key, 'dm', inc.from.name);
  joinCall(inc.key, inc.from.name);
}
function declineIncoming() { const inc = S.incoming; if (!inc) return; sendRaw('call.decline', { key: inc.key }); clearIncoming(); }
function renderCallOverlay() {
  const o = $('callOverlay');
  const info = S.incoming ? { u: S.incoming.from } : S.outgoing ? { u: friendByDm(S.outgoing.key) || { id: 0, name: S.outgoing.name } } : null;
  if (!info) { o.classList.add('hidden'); o.replaceChildren(); return; }
  o.classList.remove('hidden');
  if (S.incoming) {
    o.replaceChildren(h('div', { class: 'callcard' }, h('div', { class: 'pulse' }, avatar(info.u, 110)), h('h2', null, info.u.name), h('p', null, 'te está llamando…'),
      S.callKey ? h('p', { class: 'hint' }, 'Si contestas, saldrás de tu llamada actual') : null,
      h('div', { class: 'btns' }, h('button', { class: 'big btn-call', onclick: answerIncoming }, h('i', null, '📞'), 'Contestar'), h('button', { class: 'big btn-bad', onclick: declineIncoming }, h('i', null, '📵'), 'Rechazar'))));
  } else {
    o.replaceChildren(h('div', { class: 'callcard' }, h('div', { class: 'pulse' }, avatar(info.u, 110)), h('h2', null, info.u.name), h('p', null, 'Llamando…'),
      h('div', { class: 'btns' }, h('button', { class: 'big btn-bad', onclick: () => leaveCall(false) }, h('i', null, '📵'), 'Cancelar'))));
  }
}

// ---------- llamada ----------
async function joinCall(key, label) {
  if (S.callKey === key) return;
  if (S.incoming?.key === key) clearIncoming();
  leaveCall(false);
  const call = new Call({
    send: sendRaw,
    myId: S.me.id,
    settings,
    ice: S.ice,
    onChange: renderStage,
    onSpeaking: (id, v, lv = 0) => {
      const k = id === 'me' ? 'me' : `p${id}`;
      document.querySelector(`[data-tile="${k}"]`)?.classList.toggle('speaking', v);
      if (id === 'me') $('micLive').style.width = v ? Math.min(100, Math.round(lv * 180)) + '%' : '0%';
    },
  });
  call.onScreenEnded = () => pushState();
  call.onCamEnded = () => { updateDock(); pushState(); toast('La cámara está ocupada por otra app (ej. Discord) o se desconectó'); };
  try {
    await call.start();
    const r = await rpc('voice.join', { key });
    call.ice = r.ice; S.call = call; S.callKey = key; S.callLabel = label;
    r.peers.forEach((p) => call.addPeer(p));
    if (r.offline) { toast(`${label} no está conectado ahora`); S.call = call; leaveCall(false); return; }
    if (r.ringing) { S.outgoing = { key, name: label }; ringer.start('out'); } else ringer.beep([480, 640]);
  } catch (e) { call.close(); toast(e.name === 'NotAllowedError' || e.name === 'NotFoundError' ? 'No se pudo acceder al micrófono' : e.message); return; }
  $('voiceDock').classList.remove('hidden'); $('stageWrap').classList.remove('hidden');
  updateDock(); renderStage(); updateStatTimer(); updatePingTimer(); pushState(); renderCallOverlay();
}
function leaveCall(silent) {
  if (S.mini) window.epic.toggleMini?.(false);
  if (document.pictureInPictureElement) document.exitPictureInPicture?.().catch(() => {});
  if (S.outgoing) { S.outgoing = null; if (!S.incoming) ringer.stop(); renderCallOverlay(); }
  if (!S.call) return;
  if (!silent) { sendRaw('voice.leave', {}); ringer.beep([520, 360]); }
  S.call.close(); S.call = null; S.callKey = null; S.focusTile = null;
  $('micLive').style.width = '0%';
  $('voiceDock').classList.add('hidden'); $('stageWrap').classList.add('hidden'); $('meetMenu')?.classList.add('hidden');
  tiles.forEach((t) => { t.boostCtx?.close().catch(() => {}); t.el.remove(); });
  tiles.clear(); updateStatTimer(); updatePingTimer();
}
function pushState() { const c = S.call; if (c) sendRaw('voice.state', { muted: c.muted, deaf: c.deaf, cam: !!c.camTrack, screen: c.screenStream?.id || null }); }
function updateDock() {
  const c = S.call; if (!c) return;
  const ns = c.noiseMode === 'high' ? ' · 🔇 RNNoise' : '';
  if (!settings.stats) $('voiceInfo').textContent = `🔊 ${S.callLabel}${ns}`;
  const setQ = (id, cls, ico) => {
    const el = $(id); if (!el) return;
    el.className = 'qbtn' + (id === 'bLeave' ? ' hang' : '') + (cls ? ' ' + cls : '');
    const i = el.querySelector('i'); if (i && ico) i.textContent = ico;
  };
  const setD = (id, cls, txt) => {
    const el = $(id); if (!el) return;
    el.className = 'dockbtn' + (cls ? ' ' + cls : '');
    const sp = el.querySelector('span'); if (sp) sp.textContent = txt;
  };
  const setM = (id, cls, ico) => {
    const el = $(id); if (!el) return;
    el.className = 'mbtn' + (cls ? ' ' + cls : '');
    if (ico) el.textContent = ico;
  };
  setQ('bMute', c.muted ? 'off' : '', c.muted ? '🔇' : '🎤');
  setQ('bDeaf', c.deaf ? 'off' : '', '🎧');
  setQ('bDockMore', S.dockOpen ? 'on' : '', S.dockOpen ? '▾' : '▴');
  $('dockDrawer')?.classList.toggle('hidden', !S.dockOpen);
  setD('bLoop', c.mic?.monitoring ? 'on' : '', c.mic?.monitoring ? 'Oyéndome' : 'Oírme');
  setD('bCam', c.camTrack ? 'on' : '', c.camTrack ? 'Cámara ON' : 'Cámara');
  setD('bScreen', c.screenStream ? 'on' : '', c.screenStream ? 'Pantalla ON' : 'Pantalla');
  setD('bMini', S.mini ? 'on' : '', S.mini ? 'Expandir' : 'Flotante');

  setM('mMute', c.muted ? 'off' : '', c.muted ? '🔇' : '🎤');
  setM('mDeaf', c.deaf ? 'off' : '', '🎧');
  setM('mCam', c.camTrack ? 'on' : '', '📷');
  setM('mScreen', c.screenStream ? 'on' : '', '🖥️');
  setM('mHideNoVid', settings.hideNoVideo ? 'on' : '', '👁️');
  const sh = Math.round(Number(settings.stageHeight) || 54);
  [['mSizeSm', 32], ['mSizeMd', 52], ['mSizeLg', 76], ['mSizeXl', 92]].forEach(([id, v]) => {
    $(id)?.classList.toggle('on', Math.abs(sh - v) <= 5);
  });
}
$('bMute').onclick = () => { const c = S.call; if (!c) return; if (c.deaf) c.deaf = false; c.setMuted(!c.muted); updateDock(); renderStage(); pushState(); };
$('bDeaf').onclick = () => { const c = S.call; if (!c) return; c.deaf = !c.deaf; c.setMuted(c.deaf); updateDock(); renderStage(); pushState(); };
$('bDockMore').onclick = () => { S.dockOpen = !S.dockOpen; updateDock(); };
$('bLoop').onclick = () => {
  const c = S.call; if (!c?.mic) return;
  const next = !c.mic.monitoring;
  c.setSelfMonitor(next);
  if (next) toast('👂 Escuchando tu propio micrófono (desactívalo para no oírte doble)');
  updateDock();
};
$('bCam').onclick = async () => { try { await S.call?.setCamera(!S.call.camTrack); } catch (e) { toast('No se pudo abrir la cámara'); } updateDock(); renderStage(); pushState(); };
$('bMini').onclick = () => window.epic.toggleMini?.();
$('bLeave').onclick = () => leaveCall(false);
$('bScreen').onclick = async () => {
  const c = S.call; if (!c) return;
  if (c.screenStream) { await c.stopScreen(); updateDock(); renderStage(); pushState(); return; }
  let srcs = []; try { srcs = await window.epic.listSources(); } catch (e) { return toast('No se pudieron listar las pantallas'); }
  const grid = h('div', { class: 'srcs' }, srcs.map((s) => h('div', { class: 'src', onclick: async () => {
    closeModal();
    try { await c.startScreen(s.id); } catch (e) { return toast('No se pudo compartir la pantalla'); }
    updateDock(); renderStage(); pushState();
  } }, h('img', { src: s.thumb }), h('span', null, (s.screen ? '🖥️ ' : '🪟 ') + s.name))));
  modal('¿Qué quieres compartir?', grid);
};

// Controles de la barra flotante estilo Google Meet
$('mMute').onclick = () => $('bMute').click();
$('mDeaf').onclick = () => $('bDeaf').click();
$('mCam').onclick = () => $('bCam').click();
$('mScreen').onclick = () => $('bScreen').click();
$('mLeave').onclick = () => $('bLeave').click();
$('mHideNoVid').onclick = () => {
  settings.hideNoVideo = !settings.hideNoVideo;
  saveSettings();
  toast(settings.hideNoVideo ? '👁️ Ocultando cuadros sin cámara cuando hay video activo' : '👁️ Mostrando todos los participantes en el escenario');
  renderStage();
};
function setStagePreset(vh) {
  settings.stageHeight = vh;
  saveSettings();
  applyStageHeight();
  updateDock();
}
$('mSizeSm').onclick = () => setStagePreset(32);
$('mSizeMd').onclick = () => setStagePreset(52);
$('mSizeLg').onclick = () => setStagePreset(76);
$('mSizeXl').onclick = () => setStagePreset(92);

$('mMore').onclick = (e) => {
  e.stopPropagation();
  const menu = $('meetMenu');
  if (!menu.classList.contains('hidden')) { menu.classList.add('hidden'); return; }
  const c = S.call;
  const gLbl = h('b', null, `${Math.round(((settings.voiceGate ?? 0.024) / 0.06) * 100)}%`);
  const gRng = h('input', { type: 'range', min: 0, max: 0.06, step: 0.002, value: settings.voiceGate ?? 0.024, oninput: () => {
    settings.voiceGate = Number(gRng.value);
    saveSettings();
    gLbl.textContent = `${Math.round((settings.voiceGate / 0.06) * 100)}%`;
    c?.mic?.setGate?.(settings.voiceGate);
  } });
  menu.replaceChildren(
    h('div', { style: 'font-size:11px;color:var(--mu);display:flex;justify-content:space-between' }, '🌬️ Filtro Anti-Respiración', gLbl),
    gRng,
    h('button', { class: c?.mic?.monitoring ? 'on' : '', onclick: () => { $('bLoop').click(); menu.classList.add('hidden'); } }, '👂 Escuchar mi voz (Oírme)', h('span', null, c?.mic?.monitoring ? 'ON' : 'OFF')),
    h('button', { class: S.mini ? 'on' : '', onclick: () => { $('bMini').click(); menu.classList.add('hidden'); } }, '📌 Ventana flotante', h('span', null, S.mini ? 'ON' : 'OFF')),
    h('button', { class: settings.stats ? 'on' : '', onclick: () => { settings.stats = !settings.stats; saveSettings(); updateStatTimer(); menu.classList.add('hidden'); } }, '📊 Estadísticas HW/Ping', h('span', null, settings.stats ? 'ON' : 'OFF'))
  );
  menu.classList.remove('hidden');
};
document.addEventListener('click', (e) => {
  const menu = $('meetMenu');
  if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && e.target !== $('mMore')) menu.classList.add('hidden');
});

// Tirador arrastrable para modificar el tamaño del escenario de cámaras/transmisiones
$('stageResizer').addEventListener('mousedown', (e) => {
  e.preventDefault();
  const onMove = (ev) => {
    const rect = $('center').getBoundingClientRect();
    const px = Math.max(170, Math.min(rect.height - 90, ev.clientY - rect.top - 50));
    const vh = Math.round((px / window.innerHeight) * 100);
    settings.stageHeight = Math.max(24, Math.min(92, vh));
    applyStageHeight();
    updateDock();
  };
  const onUp = () => {
    saveSettings();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

// ---------- Tiles de video, Enfoque estilo Google Meet y volumen individual (0% a 200%) ----------
const tiles = new Map();
function applyTileVolume(t) {
  if (!t.uid) return;
  const vol = S.call?.deaf ? 0 : getUserVol(t.uid);
  t.video.volume = Math.max(0, Math.min(1, vol));
  if (vol > 1.01 && t.video.srcObject && t.video.srcObject.getAudioTracks().length > 0) {
    if (!t.boostCtx || t.boostStream !== t.video.srcObject) {
      t.boostCtx?.close().catch(() => {});
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(t.video.srcObject);
      const gain = ctx.createGain();
      src.connect(gain); gain.connect(ctx.destination);
      t.boostCtx = ctx; t.boostGain = gain; t.boostStream = t.video.srcObject; t._boostSrc = src;
    }
    t.boostGain.gain.setTargetAtTime(vol - 1, t.boostCtx.currentTime, 0.015);
    if (t.boostCtx.state === 'suspended') t.boostCtx.resume().catch(() => {});
  } else if (t.boostGain) {
    t.boostGain.gain.setTargetAtTime(0, t.boostCtx.currentTime, 0.015);
  }
}

function toggleFocusTile(key) {
  S.focusTile = S.focusTile === key ? null : key;
  renderStage();
}

function tile(key, label, user, withVol = false) {
  let t = tiles.get(key);
  if (!t) {
    const video = h('video', { autoplay: true, playsinline: true, onclick: () => toggleFocusTile(key), title: 'Clic para enfocar / ampliar esta cámara o transmisión' });
    const nm = h('div', { class: 'nm' }); const av = h('div', { class: 'av' }, avatar(user, 72)); const stat = h('div', { class: 'stat' });
    const pinBtn = h('button', { title: 'Enfocar / ampliar esta cámara en el escenario (estilo Google Meet)', onclick: (e) => { e.stopPropagation(); toggleFocusTile(key); } }, '📌 Enfocar');
    const fitBtn = h('button', { title: 'Alternar entre ver imagen completa o rellenar cuadro (Zoom)', onclick: (e) => { e.stopPropagation(); el.classList.toggle('cover'); fitBtn.classList.toggle('on', el.classList.contains('cover')); } }, '🔍');
    const pip = h('button', { title: 'Ventana sobre ventana (Picture-in-Picture)', onclick: (e) => { e.stopPropagation(); (document.pictureInPictureElement === video ? document.exitPictureInPicture() : video.requestPictureInPicture?.()).catch(() => {}); } }, '🖼️ PiP');
    const fs = h('button', { title: 'Pantalla completa', onclick: (e) => { e.stopPropagation(); video.requestFullscreen?.(); } }, '⛶');
    const tbtns = h('div', { class: 'tbtns' }, pinBtn, fitBtn, pip, fs);
    let volWrap = null;
    if (withVol && user?.id) {
      const cur = getUserVol(user.id);
      const vTxt = h('span', null, `${Math.round(cur * 100)}%`);
      const vRng = h('input', { type: 'range', min: 0, max: 2, step: 0.05, value: cur, title: 'Volumen de este usuario (0% a 200%)', oninput: () => {
        const val = Number(vRng.value);
        setUserVol(user.id, val);
        vTxt.textContent = `${Math.round(val * 100)}%`;
        applyTileVolume(t);
      } });
      volWrap = h('div', { class: 'vol-wrap' }, '🔊', vRng, vTxt);
    }
    const el = h('div', { class: 'tile', 'data-tile': key }, video, av, nm, stat, volWrap, tbtns);
    $('stage').append(el); t = { el, video, nm, av, stat, tbtns, pinBtn, uid: withVol ? user?.id : 0, hasVideo: false, avKey: `${user?.id}:${user?.av}:${user?.color}` }; tiles.set(key, t);
  }
  const k = `${user?.id}:${user?.av}:${user?.color}`;
  if (t.avKey !== k) { t.avKey = k; t.av.replaceChildren(avatar(user, 72)); }
  t.nm.textContent = label; return t;
}
function setStream(t, stream, hasVideo, muted) {
  const vCount = stream ? stream.getVideoTracks().length : 0;
  const aCount = stream ? stream.getAudioTracks().length : 0;
  if (t.video.srcObject !== stream || t.vCount !== vCount || t.aCount !== aCount) {
    t.video.srcObject = stream;
    t.vCount = vCount;
    t.aCount = aCount;
    if (stream) t.video.play?.().catch(() => {});
  }
  t.hasVideo = !!hasVideo;
  t.video.muted = muted || !!S.call?.deaf;
  if (!muted) applyTileVolume(t);
  t.video.classList.toggle('noVideo', !hasVideo);
  t.av.style.display = hasVideo ? 'none' : '';
  t.tbtns.style.display = hasVideo ? '' : 'none';
  if (settings.spk && t.video.setSinkId && t.sink !== settings.spk) { t.sink = settings.spk; t.video.setSinkId(settings.spk).catch(() => {}); }
}
function renderStage() {
  const c = S.call; if (!c) return;
  if (S.outgoing && c.peers.size > 0) clearOutgoing();
  const keep = new Set();
  const me = tile('me', 'Tú' + (c.muted ? ' 🔇' : ''), S.me, false); keep.add('me'); setStream(me, c.main, !!c.camTrack, true);
  if (c.screenStream) { const t = tile('me-screen', 'Tu pantalla', S.me, false); keep.add('me-screen'); setStream(t, new MediaStream(c.screenStream.getVideoTracks()), true, true); }
  for (const p of c.peers.values()) {
    const user = { id: p.id, name: p.name, color: p.user?.color, av: p.user?.av };
    const friend = friendByDm(S.callKey)?.id === p.id ? friendByDm(S.callKey) : null; if (friend) { user.color = friend.color; user.av = friend.av; }
    const label = p.name + (p.state?.muted ? ' 🔇' : '');
    const k = 'p' + p.id; keep.add(k);
    setStream(tile(k, label, user, true), p.streams.get(p.mainId) || null, !!p.state?.cam, false);
    for (const [sid, st] of p.streams) {
      if (sid === p.mainId) continue; const sk = `p${p.id}-${sid}`; keep.add(sk);
      setStream(tile(sk, p.name + ' — pantalla', user, true), st, st.getVideoTracks().length > 0, false);
    }
  }
  for (const [k, t] of tiles) if (!keep.has(k)) { t.boostCtx?.close().catch(() => {}); t.el.remove(); tiles.delete(k); }
  if (S.focusTile && !tiles.has(S.focusTile)) S.focusTile = null;

  // Enfoque inteligente estilo Google Meet:
  // 1) Si algún participante tiene cámara o pantalla activa y settings.hideNoVideo está activo,
  //    ocultamos los cuadros vacíos sin cámara (como "Tú" sin cámara) para que el video aproveche toda la pantalla.
  const videoKeys = [...tiles.entries()].filter(([, t]) => t.hasVideo).map(([k]) => k);
  const anyVideo = videoKeys.length > 0;
  let visibleCount = 0;
  for (const [k, t] of tiles) {
    const hide = anyVideo && settings.hideNoVideo && !t.hasVideo && S.focusTile !== k;
    t.el.classList.toggle('hide-tile', hide);
    if (!hide) visibleCount++;
  }
  // 2) Si el usuario enfocó un tile (📌) o solo hay 1 video activo con más tiles visibles, activamos Spotlight
  const autoFocusKey = S.focusTile || (videoKeys.length === 1 ? videoKeys[0] : null);
  const stg = $('stage');
  const isSpotlight = !!autoFocusKey && tiles.has(autoFocusKey);
  stg.classList.toggle('spotlight', isSpotlight);
  stg.classList.toggle('solo', isSpotlight && visibleCount <= 1);
  for (const [k, t] of tiles) {
    const foc = isSpotlight && k === autoFocusKey;
    t.el.classList.toggle('focused', foc);
    if (t.pinBtn) {
      t.pinBtn.classList.toggle('on', S.focusTile === k);
      t.pinBtn.textContent = S.focusTile === k ? '📌 Enfocado' : '📌 Enfocar';
    }
  }
  updateDock();
}
function updateStatTimer() {
  clearInterval(S.statTimer); S.statTimer = null;
  tiles.forEach((t) => { t.stat.textContent = ''; });
  if (!settings.stats || !S.call) return;
  S.statTimer = setInterval(async () => {
    if (!S.call) return;
    const m = await window.epic.metrics().catch(() => []); const cpu = m.reduce((a, x) => a + x.cpu, 0); const mem = m.reduce((a, x) => a + x.mem, 0) / 1024;
    $('voiceInfo').textContent = `🔊 ${S.callLabel} · CPU ${cpu.toFixed(0)}% · RAM ${(mem / 1024).toFixed(0)} MB`;
    const st = await S.call.stats();
    for (const [id, txt] of st) { const t = tiles.get('p' + id); if (t) t.stat.textContent = txt; }
  }, 2000);
}
function updatePingTimer() {
  clearInterval(S.pingTimer); S.pingTimer = null;
  const b = $('pingBadge');
  if (!S.call) { if (b) b.textContent = '🟢 Conectando…'; return; }
  const tick = async () => {
    if (!S.call || !b) return;
    const info = await S.call.pingSummary().catch(() => null);
    if (!info) {
      b.textContent = S.call.peers.size ? '🟢 En línea' : '🟢 Sala lista';
      b.title = 'Semáforo de señal en vivo';
      return;
    }
    const { rtt, loss } = info;
    const sem = rtt < 90 && loss < 2 ? '🟢' : rtt < 180 && loss < 6 ? '🟡' : '🔴';
    b.textContent = `${sem} ${rtt} ms${loss > 0 ? ` · ${loss}% pérd.` : ''}`;
    b.title = `Latencia P2P: ${rtt} ms · Pérdida de paquetes: ${loss}%`;
  };
  tick();
  S.pingTimer = setInterval(tick, 2500);
}

autoLogin();
