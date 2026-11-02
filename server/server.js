'use strict';
/**
 * EpicKast server: cuentas, amigos, servidores/canales, mensajes y señalización WebRTC.
 * Un solo WebSocket JSON por cliente. Sin telemetría. SQLite integrado de Node (node:sqlite).
 */
const http = require('node:http');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 7777;
const DATA = process.env.EPICKAST_DATA || path.join(__dirname, 'data');
const UPLOADS = path.join(DATA, 'uploads');
const MAX_ROOM = Number(process.env.EPICKAST_MAX_ROOM) || 8; // malla P2P: cada par extra cuesta una codificación de video
const MAX_UPLOAD = 25 * 1024 * 1024; // 25 MB por archivo
fs.mkdirSync(UPLOADS, { recursive: true });

const db = new DatabaseSync(path.join(DATA, 'epickast.db'));
db.exec(`
PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA synchronous=NORMAL;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT UNIQUE COLLATE NOCASE, salt TEXT, hash TEXT, created INTEGER);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, created INTEGER);
CREATE TABLE IF NOT EXISTS friends(a INTEGER, b INTEGER, status TEXT, PRIMARY KEY(a,b));
CREATE TABLE IF NOT EXISTS servers(id INTEGER PRIMARY KEY, name TEXT, owner INTEGER, invite TEXT UNIQUE, created INTEGER);
CREATE TABLE IF NOT EXISTS members(server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(server_id,user_id));
CREATE TABLE IF NOT EXISTS channels(id INTEGER PRIMARY KEY, server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE, name TEXT, type TEXT);
CREATE TABLE IF NOT EXISTS files(id INTEGER PRIMARY KEY, channel TEXT, user_id INTEGER, name TEXT, mime TEXT, size INTEGER, disk TEXT, ts INTEGER);
CREATE INDEX IF NOT EXISTS file_ch ON files(channel,id);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, channel TEXT, user_id INTEGER, text TEXT, ts INTEGER, file_id INTEGER);
CREATE INDEX IF NOT EXISTS msg_ch ON messages(channel,id);
`);
for (const col of ['avatar TEXT', 'color TEXT', 'bio TEXT', 'av INTEGER DEFAULT 0']) { try { db.exec('ALTER TABLE users ADD COLUMN ' + col); } catch {} }
for (const col of ['file_id INTEGER', 'reply_to INTEGER', 'pinned INTEGER DEFAULT 0']) { try { db.exec('ALTER TABLE messages ADD COLUMN ' + col); } catch {} }
const stmts = new Map();
const sql = (s) => { let p = stmts.get(s); if (!p) { p = db.prepare(s); stmts.set(s, p); } return p; };
const get = (s, ...a) => sql(s).get(...a);
const all = (s, ...a) => sql(s).all(...a);
const run = (s, ...a) => sql(s).run(...a);

// ---------- utilidades ----------
const conns = new Map();            // userId -> Set<ws>
const rooms = new Map();            // roomKey -> Map<userId, {ws,name,state}>
const fail = (m) => { const e = new Error(m); e.user = true; throw e; };
const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const toUser = (id, o) => { const s = conns.get(id); if (s) for (const w of s) send(w, o); };
const toUsers = (ids, o) => { for (const id of new Set(ids)) toUser(id, o); };
const isOnline = (id) => (conns.get(id)?.size || 0) > 0;
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const newToken = () => crypto.randomBytes(24).toString('hex');
const clean = (s, n) => String(s ?? '').trim().slice(0, n);
const memberIds = (sid) => all('SELECT user_id u FROM members WHERE server_id=?', sid).map((r) => r.u);
const friendIds = (uid) => all(`SELECT CASE WHEN a=? THEN b ELSE a END f FROM friends WHERE status='accepted' AND (a=? OR b=?)`, uid, uid, uid).map((r) => r.f);
const areFriends = (a, b) => !!get(`SELECT 1 x FROM friends WHERE status='accepted' AND ((a=? AND b=?) OR (a=? AND b=?))`, a, b, b, a);
const dmKey = (a, b) => `d${Math.min(a, b)}_${Math.max(a, b)}`;

/** Devuelve { audience:[userId], voice:boolean } o lanza error si uid no tiene acceso. */
function authorize(key, uid) {
  key = String(key || '');
  if (key[0] === 'c') {
    const ch = get('SELECT c.id,c.server_id s,c.type t FROM channels c WHERE c.id=?', Number(key.slice(1)));
    if (!ch) fail('Canal inexistente');
    if (!get('SELECT 1 x FROM members WHERE server_id=? AND user_id=?', ch.s, uid)) fail('No eres miembro');
    return { audience: memberIds(ch.s), type: ch.t, serverId: ch.s };
  }
  const m = /^d(\d+)_(\d+)$/.exec(key);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    if (uid !== a && uid !== b) fail('Sin acceso');
    if (!areFriends(a, b)) fail('Solo entre amigos');
    return { audience: [a, b], type: 'dm' };
  }
  return fail('Canal inválido');
}

function presenceAudience(uid) {
  const s = all('SELECT DISTINCT m2.user_id u FROM members m1 JOIN members m2 ON m1.server_id=m2.server_id WHERE m1.user_id=?', uid).map((r) => r.u);
  return [...s, ...friendIds(uid)];
}

const selfView = (id) => get('SELECT id,name,color,bio,CASE WHEN avatar IS NULL THEN 0 ELSE av END av FROM users WHERE id=?', id);
const profileOf = (id) => get('SELECT color,av FROM users WHERE id=?', id) || {};
function roomUsers(key) {
  const r = rooms.get(key);
  return r ? [...r.entries()].map(([id, v]) => ({ id, name: v.name, state: v.state, ...profileOf(id) })) : [];
}

// ---- llamadas entrantes (solo DMs): timbre de 45 s hasta contestar / rechazar / cancelar ----
const rings = new Map(); // key -> { from, to, timer }
function stopRing(key, reason) {
  const r = rings.get(key); if (!r) return;
  clearTimeout(r.timer); rings.delete(key);
  toUser(r.to, { t: 'call.stop', key, reason });
  toUser(r.from, { t: 'call.stop', key, reason });
}
function broadcastRoom(key) {
  let aud;
  try { aud = authorize(key, [...(rooms.get(key)?.keys() || [])][0] ?? -1).audience; } catch { aud = [...(rooms.get(key)?.keys() || [])]; }
  toUsers(aud, { t: 'voice.room', key, users: roomUsers(key) });
}
function leaveRoom(ws) {
  const key = ws.room; if (!key) return;
  ws.room = null;
  if (rings.get(key)?.from === ws.user.id) stopRing(key, 'cancelled');
  const r = rooms.get(key);
  if (r && r.get(ws.user.id)?.ws === ws) {
    r.delete(ws.user.id);
    for (const [, v] of r) send(v.ws, { t: 'voice.left', key, userId: ws.user.id });
    let aud = [ws.user.id, ...r.keys()];
    try { aud = authorize(key, ws.user.id).audience; } catch {}
    if (!r.size) rooms.delete(key);
    toUsers(aud, { t: 'voice.room', key, users: roomUsers(key) });
  }
}

// ---------- API ----------
const iceServers = () => {
  const l = [{ urls: process.env.EPICKAST_STUN || 'stun:stun.l.google.com:19302' }];
  if (process.env.EPICKAST_TURN_URL) l.push({ urls: process.env.EPICKAST_TURN_URL, username: process.env.EPICKAST_TURN_USER, credential: process.env.EPICKAST_TURN_PASS });
  return l;
};
const serverView = (sid, uid) => {
  const s = get('SELECT id,name,owner,invite FROM servers WHERE id=?', sid);
  if (!s) fail('Servidor inexistente');
  if (!get('SELECT 1 x FROM members WHERE server_id=? AND user_id=?', sid, uid)) fail('No eres miembro');
  const channels = all('SELECT id,name,type FROM channels WHERE server_id=? ORDER BY id', sid).map((c) => ({ ...c, key: 'c' + c.id, room: c.type === 'voice' ? roomUsers('c' + c.id) : undefined }));
  const members = all('SELECT u.id,u.name,u.color,CASE WHEN u.avatar IS NULL THEN 0 ELSE u.av END av FROM members m JOIN users u ON u.id=m.user_id WHERE m.server_id=? ORDER BY u.name', sid).map((m) => ({ ...m, online: isOnline(m.id) }));
  return { id: s.id, name: s.name, owner: s.owner, invite: s.owner === uid ? s.invite : undefined, channels, members };
};
const friendsView = (uid) => {
  const rows = all(`SELECT f.a,f.b,f.status,u.id uid,u.name,u.color,CASE WHEN u.avatar IS NULL THEN 0 ELSE u.av END av FROM friends f JOIN users u ON u.id=CASE WHEN f.a=? THEN f.b ELSE f.a END WHERE f.a=? OR f.b=?`, uid, uid, uid);
  const out = { friends: [], incoming: [], outgoing: [] };
  for (const r of rows) {
    const u = { id: r.uid, name: r.name, color: r.color, av: r.av, online: isOnline(r.uid), dm: dmKey(uid, r.uid) };
    if (r.status === 'accepted') out.friends.push(u); else if (r.b === uid) out.incoming.push(u); else out.outgoing.push(u);
  }
  return out;
};
const notifyServer = (sid) => toUsers(memberIds(sid), { t: 'server.changed', id: sid });
const notifyFriends = (...ids) => ids.forEach((i) => toUser(i, { t: 'friends.changed' }));
const newInvite = () => crypto.randomBytes(5).toString('hex');

const H = {
  'servers.list': (ws) => all('SELECT s.id,s.name FROM servers s JOIN members m ON m.server_id=s.id WHERE m.user_id=? ORDER BY s.id', ws.user.id),
  'friends.list': (ws) => friendsView(ws.user.id),
  'friends.add': (ws, d) => {
    const u = get('SELECT id FROM users WHERE name=?', clean(d.name, 24));
    if (!u) fail('Usuario no encontrado');
    if (u.id === ws.user.id) fail('No puedes agregarte a ti mismo');
    const ex = get('SELECT a,b,status FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)', ws.user.id, u.id, u.id, ws.user.id);
    if (ex) {
      if (ex.status === 'pending' && ex.a === u.id) run(`UPDATE friends SET status='accepted' WHERE a=? AND b=?`, ex.a, ex.b);
      else fail('Ya existe una solicitud o amistad');
    } else run(`INSERT INTO friends VALUES(?,?, 'pending')`, ws.user.id, u.id);
    notifyFriends(ws.user.id, u.id);
  },
  'friends.accept': (ws, d) => {
    const r = run(`UPDATE friends SET status='accepted' WHERE a=? AND b=? AND status='pending'`, Number(d.id), ws.user.id);
    if (!r.changes) fail('Solicitud no encontrada');
    notifyFriends(ws.user.id, Number(d.id));
  },
  'friends.remove': (ws, d) => {
    run('DELETE FROM friends WHERE (a=? AND b=?) OR (a=? AND b=?)', ws.user.id, Number(d.id), Number(d.id), ws.user.id);
    notifyFriends(ws.user.id, Number(d.id));
  },
  'server.create': (ws, d) => {
    const name = clean(d.name, 40); if (name.length < 2) fail('Nombre muy corto');
    const id = Number(run('INSERT INTO servers(name,owner,invite,created) VALUES(?,?,?,?)', name, ws.user.id, newInvite(), Date.now()).lastInsertRowid);
    run('INSERT INTO members VALUES(?,?)', id, ws.user.id);
    run(`INSERT INTO channels(server_id,name,type) VALUES(?, 'general','text')`, id);
    run(`INSERT INTO channels(server_id,name,type) VALUES(?, 'Sala de voz','voice')`, id);
    toUser(ws.user.id, { t: 'servers.changed' });
    return { id };
  },
  'server.get': (ws, d) => serverView(Number(d.id), ws.user.id),
  'server.join': (ws, d) => {
    const s = get('SELECT id FROM servers WHERE invite=?', clean(d.code, 32).toLowerCase());
    if (!s) fail('Invitación inválida');
    run('INSERT OR IGNORE INTO members VALUES(?,?)', s.id, ws.user.id);
    toUser(ws.user.id, { t: 'servers.changed' }); notifyServer(s.id);
    return { id: s.id };
  },
  'server.leave': (ws, d) => {
    const s = get('SELECT owner FROM servers WHERE id=?', Number(d.id));
    if (s?.owner === ws.user.id) fail('El dueño debe eliminar el servidor');
    run('DELETE FROM members WHERE server_id=? AND user_id=?', Number(d.id), ws.user.id);
    toUser(ws.user.id, { t: 'servers.changed' }); notifyServer(Number(d.id));
  },
  'server.delete': (ws, d) => {
    const id = Number(d.id);
    const s = get('SELECT owner FROM servers WHERE id=?', id);
    if (!s || s.owner !== ws.user.id) fail('Solo el dueño puede eliminarlo');
    const m = memberIds(id);
    for (const c of all('SELECT id FROM channels WHERE server_id=?', id)) run('DELETE FROM messages WHERE channel=?', 'c' + c.id);
    run('DELETE FROM servers WHERE id=?', id);
    toUsers(m, { t: 'servers.changed' });
  },
  'server.kick': (ws, d) => {
    const id = Number(d.id);
    const s = get('SELECT owner FROM servers WHERE id=?', id);
    if (!s || s.owner !== ws.user.id) fail('Solo el dueño puede expulsar');
    if (Number(d.userId) === ws.user.id) fail('No puedes expulsarte');
    run('DELETE FROM members WHERE server_id=? AND user_id=?', id, Number(d.userId));
    toUser(Number(d.userId), { t: 'servers.changed' }); notifyServer(id);
  },
  'server.newinvite': (ws, d) => {
    const s = get('SELECT owner FROM servers WHERE id=?', Number(d.id));
    if (!s || s.owner !== ws.user.id) fail('Solo el dueño');
    run('UPDATE servers SET invite=? WHERE id=?', newInvite(), Number(d.id)); notifyServer(Number(d.id));
  },
  'channel.create': (ws, d) => {
    const s = get('SELECT owner FROM servers WHERE id=?', Number(d.serverId));
    if (!s || s.owner !== ws.user.id) fail('Solo el dueño puede crear canales');
    const type = d.type === 'voice' ? 'voice' : 'text';
    const name = clean(d.name, 32).replace(/\s+/g, type === 'text' ? '-' : ' ').toLowerCase(); if (!name) fail('Nombre vacío');
    if (all('SELECT 1 FROM channels WHERE server_id=?', Number(d.serverId)).length >= 50) fail('Límite de canales');
    run('INSERT INTO channels(server_id,name,type) VALUES(?,?,?)', Number(d.serverId), name, type);
    notifyServer(Number(d.serverId));
  },
  'channel.delete': (ws, d) => {
    const c = get('SELECT c.server_id s, s.owner o FROM channels c JOIN servers s ON s.id=c.server_id WHERE c.id=?', Number(d.id));
    if (!c || c.o !== ws.user.id) fail('Solo el dueño');
    run('DELETE FROM messages WHERE channel=?', 'c' + Number(d.id)); run('DELETE FROM channels WHERE id=?', Number(d.id));
    notifyServer(c.s);
  },
  'dm.open': (ws, d) => { const o = Number(d.userId); if (!areFriends(ws.user.id, o)) fail('Solo amigos'); return { key: dmKey(ws.user.id, o) }; },
  'msg.send': (ws, d) => {
    const a = authorize(d.channel, ws.user.id);
    if (a.type === 'voice') fail('Canal de voz');
    const text = clean(d.text, 2000); if (!text) return;
    let replyTo = null, replyName = null, replyText = null;
    if (d.replyTo) {
      const rm = get('SELECT m.id,m.text,f.name fname,u.name uname FROM messages m JOIN users u ON u.id=m.user_id LEFT JOIN files f ON f.id=m.file_id WHERE m.id=? AND m.channel=?', Number(d.replyTo), d.channel);
      if (rm) { replyTo = rm.id; replyName = rm.uname; replyText = rm.text || (rm.fname ? `📎 ${rm.fname}` : ''); }
    }
    const ts = Date.now();
    const id = Number(run('INSERT INTO messages(channel,user_id,text,ts,reply_to) VALUES(?,?,?,?,?)', d.channel, ws.user.id, text, ts, replyTo).lastInsertRowid);
    toUsers(a.audience, { t: 'msg', channel: d.channel, msg: { id, userId: ws.user.id, name: ws.user.name, text, ts, replyId: replyTo, replyName, replyText, pinned: false, ...profileOf(ws.user.id) } });
    return { id };
  },
  'msg.history': (ws, d) => {
    authorize(d.channel, ws.user.id);
    const before = Number(d.before) || Number.MAX_SAFE_INTEGER;
    return all(`SELECT m.id,m.user_id userId,u.name,u.color,CASE WHEN u.avatar IS NULL THEN 0 ELSE u.av END av,m.text,m.ts,m.pinned,
      f.id fileId,f.name fileName,f.mime fileMime,f.size fileSize,
      rm.id replyId,ru.name replyName,COALESCE(NULLIF(rm.text,''), CASE WHEN rf.name IS NOT NULL THEN '📎 '||rf.name ELSE '' END) replyText
      FROM messages m JOIN users u ON u.id=m.user_id LEFT JOIN files f ON f.id=m.file_id
      LEFT JOIN messages rm ON rm.id=m.reply_to LEFT JOIN users ru ON ru.id=rm.user_id LEFT JOIN files rf ON rf.id=rm.file_id
      WHERE m.channel=? AND m.id<? ORDER BY m.id DESC LIMIT 50`, d.channel, before).reverse();
  },
  'msg.pin': (ws, d) => {
    const m = get('SELECT id,channel,pinned FROM messages WHERE id=?', Number(d.id));
    if (!m) fail('Mensaje no encontrado');
    const a = authorize(m.channel, ws.user.id);
    const next = d.pinned !== undefined ? (d.pinned ? 1 : 0) : (m.pinned ? 0 : 1);
    run('UPDATE messages SET pinned=? WHERE id=?', next, m.id);
    toUsers(a.audience, { t: 'msg.pinned', channel: m.channel, id: m.id, pinned: !!next });
    return { id: m.id, pinned: !!next };
  },
  'msg.pins': (ws, d) => {
    authorize(d.channel, ws.user.id);
    return all(`SELECT m.id,m.user_id userId,u.name,u.color,CASE WHEN u.avatar IS NULL THEN 0 ELSE u.av END av,m.text,m.ts,m.pinned,
      f.id fileId,f.name fileName,f.mime fileMime,f.size fileSize
      FROM messages m JOIN users u ON u.id=m.user_id LEFT JOIN files f ON f.id=m.file_id
      WHERE m.channel=? AND m.pinned=1 ORDER BY m.id DESC LIMIT 100`, d.channel);
  },
  'files.list': (ws, d) => {
    authorize(d.channel, ws.user.id);
    return all(`SELECT f.id,f.name,f.mime,f.size,f.ts,u.id userId,u.name userName
      FROM files f JOIN users u ON u.id=f.user_id WHERE f.channel=? ORDER BY f.id DESC LIMIT 200`, d.channel);
  },
  'msg.typing': (ws, d) => {
    const a = authorize(d.channel, ws.user.id);
    toUsers(a.audience.filter((id) => id !== ws.user.id), { t: 'typing', channel: d.channel, userId: ws.user.id, name: ws.user.name });
  },
  'voice.join': (ws, d) => {
    const a = authorize(d.key, ws.user.id);
    if (a.type === 'text') fail('No es canal de voz');
    leaveRoom(ws);
    let r = rooms.get(d.key); if (!r) rooms.set(d.key, (r = new Map()));
    if (!r.has(ws.user.id) && r.size >= MAX_ROOM) fail(`Sala llena (máx. ${MAX_ROOM})`);
    const old = r.get(ws.user.id); if (old && old.ws !== ws) send(old.ws, { t: 'voice.kicked', key: d.key });
    const peers = roomUsers(d.key).filter((p) => p.id !== ws.user.id);
    r.set(ws.user.id, { ws, name: ws.user.name, state: {} });
    ws.room = d.key;
    for (const p of peers) send(r.get(p.id).ws, { t: 'voice.joined', key: d.key, user: { id: ws.user.id, name: ws.user.name, state: {}, ...profileOf(ws.user.id) } });
    toUsers(a.audience, { t: 'voice.room', key: d.key, users: roomUsers(d.key) });
    let ringing = false, offline = false;
    if (a.type === 'dm') {
      if (peers.length) stopRing(d.key, 'answered');                 // el otro contestó
      else {                                                         // soy el primero: sonar al otro
        const other = a.audience.find((id) => id !== ws.user.id);
        if (isOnline(other)) {
          stopRing(d.key, 'replaced');
          rings.set(d.key, { from: ws.user.id, to: other, timer: setTimeout(() => stopRing(d.key, 'missed'), 45000) });
          toUser(other, { t: 'call.incoming', key: d.key, from: { id: ws.user.id, name: ws.user.name, ...profileOf(ws.user.id) } });
          ringing = true;
        } else offline = true;
      }
    }
    return { peers, ice: iceServers(), ringing, offline };
  },
  'call.decline': (ws, d) => { const r = rings.get(d.key); if (r && r.to === ws.user.id) stopRing(d.key, 'declined'); },
  'profile.set': (ws, d) => {
    const cur = get('SELECT avatar,color,bio,av FROM users WHERE id=?', ws.user.id);
    let { avatar, av } = cur;
    if (d.avatar !== undefined) {
      if (d.avatar === null || d.avatar === '') { avatar = null; av = Date.now(); }
      else if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(String(d.avatar)) && d.avatar.length <= 60000) { avatar = d.avatar; av = Date.now(); }
      else fail('Imagen inválida o demasiado grande');
    }
    const color = d.color !== undefined ? (/^#[0-9a-f]{6}$/i.test(d.color) ? d.color : fail('Color inválido')) : cur.color;
    const bio = d.bio !== undefined ? clean(d.bio, 120) : cur.bio;
    run('UPDATE users SET avatar=?,color=?,bio=?,av=? WHERE id=?', avatar, color, bio, av, ws.user.id);
    const pub = { id: ws.user.id, name: ws.user.name, color, bio, av: avatar ? av : 0 };
    toUsers([ws.user.id, ...presenceAudience(ws.user.id)], { t: 'profile.changed', profile: pub });
    return pub;
  },
  'profile.get': (ws, d) => {
    const u = get('SELECT id,name,color,bio,av,avatar FROM users WHERE id=?', Number(d.id)); if (!u) fail('Usuario inexistente');
    return { id: u.id, name: u.name, color: u.color, bio: u.bio, av: u.avatar ? u.av : 0 };
  },
  'profile.avatar': (ws, d) => ({ avatar: get('SELECT avatar FROM users WHERE id=?', Number(d.id))?.avatar || null }),
  'voice.leave': (ws) => leaveRoom(ws),
  'voice.state': (ws, d) => {
    const r = rooms.get(ws.room); const me = r?.get(ws.user.id); if (!me) return;
    me.state = { muted: !!d.muted, deaf: !!d.deaf, cam: !!d.cam, screen: d.screen ? clean(d.screen, 80) : null };
    for (const [id, v] of r) if (id !== ws.user.id) send(v.ws, { t: 'voice.peerstate', userId: ws.user.id, state: me.state });
    broadcastRoom(ws.room);
  },
  'rtc.signal': (ws, d) => {
    const r = rooms.get(ws.room); const to = r?.get(Number(d.to));
    if (!r || !to) return;
    send(to.ws, { t: 'rtc.signal', from: ws.user.id, data: d.data });
  },
  'app.version': () => releaseInfo(),
};

function releaseInfo() {
  const root = path.join(__dirname, '..');
  let version = '1.0.0';
  try { version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version || version; } catch {}
  const dist = path.join(root, 'dist');
  let file = null;
  if (fs.existsSync(dist)) {
    const files = fs.readdirSync(dist).filter((f) => /\.(exe|zip)$/i.test(f) && !/uninstaller/i.test(f));
    files.sort((a, b) => (a.endsWith('.exe') ? -1 : 1) - (b.endsWith('.exe') ? -1 : 1));
    if (files.length) file = files[0];
  }
  return { version, file, downloadPath: file ? '/download/latest' : null };
}

// ---------- transporte ----------
const SAFE_MIMES = /^(image\/(png|jpeg|webp|gif|bmp)|application\/pdf|text\/plain|audio\/(mpeg|wav|ogg|webm)|video\/(mp4|webm))$/i;
const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-token, content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"ok":true,"app":"EpicKast"}'); }
  if (u.pathname === '/version') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(releaseInfo())); }
  if (u.pathname === '/download/latest') {
    const info = releaseInfo();
    const fp = info.file ? path.join(__dirname, '..', 'dist', info.file) : null;
    if (!fp || !fs.existsSync(fp)) { res.writeHead(404); return res.end('No hay instalador generado en dist/'); }
    const stat = fs.statSync(fp);
    res.writeHead(200, {
      'content-type': 'application/octet-stream',
      'content-length': stat.size,
      'content-disposition': `attachment; filename="${info.file}"`,
    });
    return fs.createReadStream(fp).pipe(res);
  }
  if (req.method === 'POST' && u.pathname === '/upload') {
    const tok = String(req.headers['x-token'] || '');
    const usr = get('SELECT u.id,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?', tok);
    if (!usr) { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"error":"No autenticado"}'); }
    const channel = clean(u.searchParams.get('channel'), 32);
    const name = clean(u.searchParams.get('name') || 'archivo', 140).replace(/[/\\?%*:|"<>]/g, '_');
    const mime = clean(u.searchParams.get('mime') || 'application/octet-stream', 80);
    const text = clean(u.searchParams.get('text') || '', 2000);
    let auth;
    try { auth = authorize(channel, usr.id); if (auth.type === 'voice') fail('Canal de voz'); }
    catch (e) { res.writeHead(403, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: e.message })); }
    const disk = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const destPath = path.join(UPLOADS, disk);
    const wsOut = fs.createWriteStream(destPath);
    let size = 0, aborted = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD && !aborted) {
        aborted = true; wsOut.destroy(); try { fs.unlinkSync(destPath); } catch {}
        res.writeHead(413, { 'content-type': 'application/json' }); res.end('{"error":"Archivo demasiado grande (máx. 25 MB)"}');
      } else if (!aborted) wsOut.write(chunk);
    });
    req.on('end', () => {
      if (aborted) return;
      wsOut.end(() => {
        if (!size) { try { fs.unlinkSync(destPath); } catch {} res.writeHead(400, { 'content-type': 'application/json' }); return res.end('{"error":"Archivo vacío"}'); }
        const ts = Date.now();
        const replyTo = u.searchParams.get('replyTo') ? Number(u.searchParams.get('replyTo')) : null;
        let replyInfo = null;
        if (replyTo) {
          const rm = get('SELECT m.id, u.name, m.text FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=? AND m.channel=?', replyTo, channel);
          if (rm) replyInfo = { replyId: rm.id, replyName: rm.name, replyText: (rm.text || '').slice(0, 120) };
        }
        const fileId = Number(run('INSERT INTO files(channel,user_id,name,mime,size,disk,ts) VALUES(?,?,?,?,?,?,?)', channel, usr.id, name, mime, size, disk, ts).lastInsertRowid);
        const msgId = Number(run('INSERT INTO messages(channel,user_id,text,ts,file_id,reply_to) VALUES(?,?,?,?,?,?)', channel, usr.id, text, ts, fileId, replyInfo ? replyTo : null).lastInsertRowid);
        const msg = { id: msgId, userId: usr.id, name: usr.name, text, ts, fileId, fileName: name, fileMime: mime, fileSize: size, ...(replyInfo || {}), ...profileOf(usr.id) };
        toUsers(auth.audience, { t: 'msg', channel, msg });
        res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, fileId, msg }));
      });
    });
    req.on('error', () => { aborted = true; wsOut.destroy(); try { fs.unlinkSync(destPath); } catch {} });
    return;
  }
  const fm = /^\/files\/(\d+)/.exec(u.pathname);
  if (req.method === 'GET' && fm) {
    const f = get('SELECT id,name,mime,size,disk FROM files WHERE id=?', Number(fm[1]));
    const fp = f ? path.join(UPLOADS, f.disk) : null;
    if (!f || !fs.existsSync(fp)) { res.writeHead(404); return res.end('Archivo no encontrado'); }
    const inline = SAFE_MIMES.test(f.mime) && u.searchParams.get('dl') !== '1';
    res.writeHead(200, {
      'content-type': SAFE_MIMES.test(f.mime) ? f.mime : 'application/octet-stream',
      'content-length': f.size,
      'cache-control': 'public, max-age=31536000, immutable',
      'content-disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(f.name)}"`,
    });
    return fs.createReadStream(fp).pipe(res);
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server: httpServer, maxPayload: 256 * 1024, perMessageDeflate: false });

function login(ws, userId, name) {
  ws.user = { id: userId, name };
  let s = conns.get(userId); if (!s) conns.set(userId, (s = new Set()));
  s.add(ws);
  if (s.size === 1) toUsers(presenceAudience(userId), { t: 'presence', id: userId, online: true });
}

wss.on('connection', (ws, req) => {
  ws.tokens = 30; ws.user = null; ws.room = null; ws.alive = true;
  ws.on('pong', () => { ws.alive = true; });
  const refill = setInterval(() => { ws.tokens = Math.min(30, ws.tokens + 6); }, 2000);
  const authTimer = setTimeout(() => { if (!ws.user) ws.close(); }, 10000);

  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (typeof m?.t !== 'string') return;
    if (ws.tokens-- <= 0) { if (m.i) send(ws, { r: m.i, ok: false, error: 'Demasiado rápido' }); return; }
    const reply = (ok, v) => m.i && send(ws, ok ? { r: m.i, ok: true, data: v } : { r: m.i, ok: false, error: v });
    try {
      if (!ws.user) {
        if (m.t === 'register' || m.t === 'login') {
          const name = clean(m.name, 24), pw = String(m.password || '');
          if (m.t === 'register') {
            if (!/^[\w.-]{2,24}$/.test(name)) fail('Usuario: 2-24 letras, números, . _ -');
            if (pw.length < 6) fail('Contraseña mínimo 6 caracteres');
            if (get('SELECT 1 x FROM users WHERE name=?', name)) fail('Usuario ya existe');
            const salt = crypto.randomBytes(16).toString('hex');
            const id = Number(run('INSERT INTO users(name,salt,hash,created) VALUES(?,?,?,?)', name, salt, hashPw(pw, salt), Date.now()).lastInsertRowid);
            const token = newToken(); run('INSERT INTO sessions VALUES(?,?,?)', token, id, Date.now());
            login(ws, id, name); return reply(true, { token, user: selfView(id), ice: iceServers() });
          }
          const u = get('SELECT id,name,salt,hash FROM users WHERE name=?', name);
          if (!u || !crypto.timingSafeEqual(Buffer.from(u.hash, 'hex'), Buffer.from(hashPw(pw, u.salt), 'hex'))) fail('Usuario o contraseña incorrectos');
          const token = newToken(); run('INSERT INTO sessions VALUES(?,?,?)', token, u.id, Date.now());
          login(ws, u.id, u.name); return reply(true, { token, user: selfView(u.id), ice: iceServers() });
        }
        if (m.t === 'resume') {
          const u = get('SELECT u.id,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?', String(m.token || ''));
          if (!u) fail('Sesión expirada');
          login(ws, u.id, u.name); return reply(true, { token: m.token, user: selfView(u.id), ice: iceServers() });
        }
        fail('No autenticado');
      }
      const h = H[m.t]; if (!h) fail('Operación desconocida');
      reply(true, h(ws, m));
    } catch (e) {
      if (!e.user) console.error('[error]', m.t, e);
      reply(false, e.user ? e.message : 'Error interno');
    }
  });

  ws.on('close', () => {
    clearInterval(refill); clearTimeout(authTimer);
    if (!ws.user) return;
    leaveRoom(ws);
    const s = conns.get(ws.user.id); s?.delete(ws);
    if (s && !s.size) { conns.delete(ws.user.id); toUsers(presenceAudience(ws.user.id), { t: 'presence', id: ws.user.id, online: false }); }
  });
  ws.on('error', () => {});
});

// latido: elimina conexiones muertas
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 25000).unref();
// limpieza de sesiones viejas (90 días)
run('DELETE FROM sessions WHERE created<?', Date.now() - 90 * 864e5);

if (require.main === module) {
  httpServer.listen(PORT, '0.0.0.0', () => console.log(`EpicKast server escuchando en :${PORT}  (datos: ${DATA})`));
}
module.exports = { httpServer, wss, db };
