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
try { db.exec("ALTER TABLE members ADD COLUMN role TEXT DEFAULT 'member'"); } catch {}
try { db.exec('ALTER TABLE channels ADD COLUMN user_limit INTEGER DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE servers ADD COLUMN icon TEXT'); } catch {}
const stmts = new Map();
const sql = (s) => { let p = stmts.get(s); if (!p) { p = db.prepare(s); stmts.set(s, p); } return p; };
const get = (s, ...a) => sql(s).get(...a);
const all = (s, ...a) => sql(s).all(...a);
const run = (s, ...a) => sql(s).run(...a);

const BACKUP_FILE = path.join(DATA, 'backup-state.json');
const SEED_FILE = path.join(__dirname, 'seed.json');

function saveBackup() {
  try {
    const users = all('SELECT id,name,salt,hash,avatar,color,bio,av,created FROM users');
    const friends = all('SELECT a,b,status FROM friends');
    const servers = all('SELECT id,name,owner,invite,created FROM servers');
    const members = all('SELECT server_id,user_id,role FROM members');
    const channels = all('SELECT id,server_id,name,type,user_limit FROM channels');
    const state = { ts: Date.now(), users, friends, servers, members, channels };
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(state, null, 2));
    if (fs.existsSync(SEED_FILE) || !process.env.RENDER) {
      try { fs.writeFileSync(SEED_FILE, JSON.stringify(state, null, 2)); } catch {}
    }
  } catch (e) {
    console.error('[backup] Error al guardar respaldo:', e);
  }
}

function restoreBackup() {
  try {
    // sync always
    const target = fs.existsSync(BACKUP_FILE) ? BACKUP_FILE : (fs.existsSync(SEED_FILE) ? SEED_FILE : null);
    if (target) {
      try {
        db.exec("DELETE FROM users WHERE name LIKE 'ana_%' OR name LIKE 'beto_%'");
        db.exec("DELETE FROM servers WHERE name = 'Mi Server'");
      } catch {}
      const data = JSON.parse(fs.readFileSync(target, 'utf8'));
      if (Array.isArray(data.users)) {
        for (const u of data.users) {
          run('INSERT OR IGNORE INTO users(id,name,salt,hash,avatar,color,bio,av,created) VALUES(?,?,?,?,?,?,?,?,?)',
            u.id, u.name, u.salt, u.hash, u.avatar || null, u.color || null, u.bio || null, u.av || 0, u.created || Date.now());
        }
      }
      if (Array.isArray(data.friends)) {
        for (const f of data.friends) {
          run('INSERT OR IGNORE INTO friends(a,b,status) VALUES(?,?,?)', f.a, f.b, f.status);
        }
      }
      if (Array.isArray(data.servers)) {
        for (const s of data.servers) {
          run('INSERT OR IGNORE INTO servers(id,name,owner,invite,created) VALUES(?,?,?,?,?)', s.id, s.name, s.owner, s.invite, s.created || Date.now());
        }
      }
      if (Array.isArray(data.members)) {
        for (const m of data.members) {
          run('INSERT OR IGNORE INTO members(server_id,user_id,role) VALUES(?,?,?)', m.server_id, m.user_id, m.role || 'member');
        }
      }
      if (Array.isArray(data.channels)) {
        for (const c of data.channels) {
          run('INSERT OR IGNORE INTO channels(id,server_id,name,type,user_limit) VALUES(?,?,?,?,?)', c.id, c.server_id, c.name, c.type, c.user_limit || 0);
        }
      }
      console.log(`[backup] Restaurados ${data.users?.length || 0} usuarios y ${data.servers?.length || 0} servidores desde el respaldo ${path.basename(target)}.`);
    }
  } catch (e) {
    console.error('[backup] Error al restaurar respaldo:', e);
  }
}
restoreBackup();

// ---------- utilidades ----------
const conns = new Map();            // userId -> Set<ws>
const rooms = new Map();            // roomKey -> Map<userId, {ws,name,state}>
const activities = new Map();       // userId -> {name, kind, since}
const parties = new Map();          // roomKey -> {current, queue:[], playing:boolean, pos:number, updatedAt:number, loop:boolean}
const ROLE_RANK = { owner: 4, admin: 3, mod: 2, dj: 1, member: 0 };
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
const roleOf = (sid, uid) => {
  const s = get('SELECT owner FROM servers WHERE id=?', sid);
  if (!s) return null;
  if (s.owner === uid) return 'owner';
  const m = get('SELECT role FROM members WHERE server_id=? AND user_id=?', sid, uid);
  return m ? (m.role || 'member') : null;
};
const roleRank = (r) => ROLE_RANK[r] ?? 0;

/** Devuelve { audience:[userId], voice:boolean } o lanza error si uid no tiene acceso. */
function authorize(key, uid) {
  key = String(key || '');
  if (key[0] === 'c') {
    const ch = get('SELECT c.id,c.server_id s,c.type t,c.user_limit lim FROM channels c WHERE c.id=?', Number(key.slice(1)));
    if (!ch) fail('Canal inexistente');
    if (!get('SELECT 1 x FROM members WHERE server_id=? AND user_id=?', ch.s, uid)) fail('No eres miembro');
    return { audience: memberIds(ch.s), type: ch.t, serverId: ch.s, userLimit: ch.lim || 0 };
  }
  const m = /^d(\d+)_(\d+)$/.exec(key);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    if (uid !== a && uid !== b) fail('Sin acceso');
    if (!areFriends(a, b)) fail('Solo entre amigos');
    return { audience: [a, b], type: 'dm', userLimit: 2 };
  }
  return fail('Canal inválido');
}

function presenceAudience(uid) {
  const s = all('SELECT DISTINCT m2.user_id u FROM members m1 JOIN members m2 ON m1.server_id=m2.server_id WHERE m1.user_id=?', uid).map((r) => r.u);
  return [...s, ...friendIds(uid)];
}

const selfView = (id) => ({ ...get('SELECT id,name,color,bio,CASE WHEN avatar IS NULL THEN 0 ELSE av END av FROM users WHERE id=?', id), activity: activities.get(id) || null });
const profileOf = (id) => ({ ...(get('SELECT color,av FROM users WHERE id=?', id) || {}), activity: activities.get(id) || null });
function roomUsers(key) {
  const r = rooms.get(key);
  return r ? [...r.entries()].map(([id, v]) => ({ id, name: v.name, state: v.state, ...profileOf(id) })) : [];
}

// ---- EpicBot DJ: Watch & Listen Together sincronizado por sala ----
function partyPos(p) {
  if (!p || !p.current) return 0;
  return p.playing ? Math.max(0, p.pos + (Date.now() - p.updatedAt) / 1000) : Math.max(0, p.pos);
}
function partyView(key) {
  const p = parties.get(key);
  if (!p) return { current: null, queue: [], playing: false, pos: 0, serverTs: Date.now(), loop: false };
  return { current: p.current, queue: p.queue, playing: p.playing, pos: partyPos(p), serverTs: Date.now(), loop: !!p.loop };
}
function broadcastParty(key) {
  const r = rooms.get(key);
  const view = partyView(key);
  if (r) for (const [, v] of r) send(v.ws, { t: 'party.sync', key, party: view });
  broadcastRoom(key);
}
async function searchYouTube(raw) {
  const q = clean(raw, 300);
  if (!q) return [];
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
  // 1) Si es URL de Playlist de YouTube (list=PL... o youtube.com/playlist?list=...)
  const listMatch = /[?&]list=([A-Za-z0-9_-]{10,})/.exec(q);
  if (listMatch && (/youtube\.com\/playlist/i.test(q) || !/(?:v=|youtu\.be\/)/.test(q) || /list=PL/i.test(q))) {
    try {
      const r = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(listMatch[1])}&hl=es`, { headers: { 'User-Agent': ua, 'Accept-Language': 'es-419,es;q=0.9,en;q=0.8' } });
      const html = await r.text();
      const m = /var ytInitialData = (\{.*?\});<\/script>/s.exec(html);
      if (m) {
        const items = [];
        const re = /"playlistVideoRenderer":\{"videoId":"([A-Za-z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"\}.*?"shortBylineText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"\}/g;
        let x;
        while ((x = re.exec(m[1])) && items.length < 35) {
          const ytId = x[1];
          const title = JSON.parse(`"${x[2]}"`);
          const author = JSON.parse(`"${x[3]}"`);
          items.push({ ytId, kind: 'yt', title, author, duration: 'Playlist', thumb: `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`, url: `https://www.youtube.com/watch?v=${ytId}` });
        }
        if (items.length) return items;
      }
    } catch {}
  }
  // 2) Si es link directo de video de YouTube (watch?v=, youtu.be/, shorts/, embed/)
  const ytMatch = /(?:youtube\.com\/(?:watch\?.*?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i.exec(q) || (/^[A-Za-z0-9_-]{11}$/.test(q) ? [q, q] : null);
  if (ytMatch) {
    const ytId = ytMatch[1];
    let title = `YouTube (${ytId})`, author = 'YouTube';
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`, { headers: { 'User-Agent': ua } });
      if (r.ok) { const j = await r.json(); title = j.title || title; author = j.author_name || author; }
    } catch {}
    return [{ ytId, kind: 'yt', title, author, duration: 'Video', thumb: `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`, url: `https://www.youtube.com/watch?v=${ytId}` }];
  }
  // 3) Si es archivo directo de audio/video (.mp3, .mp4, .webm, .ogg, .wav o /files/...)
  if (/^https?:\/\/.+\.(mp3|wav|ogg|webm|mp4|m4a)(\?.*)?$/i.test(q) || /^\/files\/\d+/.test(q)) {
    const cleanName = decodeURIComponent(q.split('/').pop().split('?')[0]) || ' Multimedia directo';
    return [{ ytId: null, kind: 'direct', title: cleanName, author: 'Archivo directo', duration: 'Directo', thumb: '', url: q }];
  }
  // 4) Búsqueda por texto en YouTube (sin API key)
  try {
    const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=es`, { headers: { 'User-Agent': ua, 'Accept-Language': 'es-419,es;q=0.9,en;q=0.8' } });
    const html = await r.text();
    const m = /var ytInitialData = (\{.*?\});<\/script>/s.exec(html);
    if (!m) return [];
    const data = JSON.parse(m[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const out = [];
    for (const sec of contents) {
      const list = sec?.itemSectionRenderer?.contents || [];
      for (const it of list) {
        const v = it.videoRenderer;
        if (!v || !v.videoId) continue;
        const title = v.title?.runs?.map((x) => x.text).join('') || 'Sin título';
        const author = v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'YouTube';
        const duration = v.lengthText?.simpleText || 'EN VIVO';
        out.push({ ytId: v.videoId, kind: 'yt', title, author, duration, thumb: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, url: `https://www.youtube.com/watch?v=${v.videoId}` });
        if (out.length >= 10) break;
      }
      if (out.length >= 10) break;
    }
    return out;
  } catch { return []; }
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
  const partyTrack = parties.get(key)?.current?.title || null;
  toUsers(aud, { t: 'voice.room', key, users: roomUsers(key), partyTrack });
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
    if (!r.size) { rooms.delete(key); parties.delete(key); }
    const partyTrack = parties.get(key)?.current?.title || null;
    toUsers(aud, { t: 'voice.room', key, users: roomUsers(key), partyTrack });
  }
}

// ---------- API ----------
const iceServers = () => {
  const l = [{ urls: process.env.EPICKAST_STUN || 'stun:stun.l.google.com:19302' }];
  if (process.env.EPICKAST_TURN_URL) l.push({ urls: process.env.EPICKAST_TURN_URL, username: process.env.EPICKAST_TURN_USER, credential: process.env.EPICKAST_TURN_PASS });
  return l;
};
const serverView = (sid, uid) => {
  const s = get('SELECT id,name,owner,invite,icon FROM servers WHERE id=?', sid);
  if (!s) fail('Servidor inexistente');
  const myRole = roleOf(sid, uid);
  if (!myRole) fail('No eres miembro');
  const channels = all(`SELECT id,name,type,user_limit FROM channels WHERE server_id=? ORDER BY CASE WHEN type='text' THEN 0 ELSE 1 END, id`, sid).map((c) => {
    const key = 'c' + c.id;
    return {
      id: c.id, name: c.name, type: c.type, key,
      userLimit: c.user_limit || 0,
      room: c.type === 'voice' ? roomUsers(key) : undefined,
      partyTrack: c.type === 'voice' ? (parties.get(key)?.current?.title || null) : undefined,
    };
  });
  const members = all('SELECT u.id,u.name,u.color,u.bio,CASE WHEN u.avatar IS NULL THEN 0 ELSE u.av END av,m.role FROM members m JOIN users u ON u.id=m.user_id WHERE m.server_id=? ORDER BY u.name', sid).map((m) => ({
    id: m.id, name: m.name, color: m.color, bio: m.bio, av: m.av,
    role: m.id === s.owner ? 'owner' : (m.role || 'member'),
    online: isOnline(m.id),
    activity: activities.get(m.id) || null,
  }));
  return { id: s.id, name: s.name, owner: s.owner, icon: s.icon || null, myRole, invite: roleRank(myRole) >= 2 ? s.invite : undefined, channels, members };
};
const friendsView = (uid) => {
  const rows = all(`SELECT f.a,f.b,f.status,u.id uid,u.name,u.color,u.bio,CASE WHEN u.avatar IS NULL THEN 0 ELSE u.av END av FROM friends f JOIN users u ON u.id=CASE WHEN f.a=? THEN f.b ELSE f.a END WHERE f.a=? OR f.b=?`, uid, uid, uid);
  const out = { friends: [], incoming: [], outgoing: [] };
  for (const r of rows) {
    const u = { id: r.uid, name: r.name, color: r.color, bio: r.bio, av: r.av, online: isOnline(r.uid), activity: activities.get(r.uid) || null, dm: dmKey(uid, r.uid) };
    if (r.status === 'accepted') out.friends.push(u); else if (r.b === uid) out.incoming.push(u); else out.outgoing.push(u);
  }
  return out;
};
const notifyServer = (sid) => toUsers(memberIds(sid), { t: 'server.changed', id: sid });
const notifyFriends = (...ids) => ids.forEach((i) => toUser(i, { t: 'friends.changed' }));
const newInvite = () => crypto.randomBytes(5).toString('hex');

const H = {
  'servers.list': (ws) => all('SELECT s.id,s.name,s.icon FROM servers s JOIN members m ON m.server_id=s.id WHERE m.user_id=? ORDER BY s.id', ws.user.id),
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
    run(`INSERT INTO members(server_id,user_id,role) VALUES(?,?,'owner')`, id, ws.user.id);
    run(`INSERT INTO channels(server_id,name,type,user_limit) VALUES(?, 'general','text',0)`, id);
    run(`INSERT INTO channels(server_id,name,type,user_limit) VALUES(?, 'multimedia-y-links','text',0)`, id);
    run(`INSERT INTO channels(server_id,name,type,user_limit) VALUES(?, '🔊 Sala General','voice',0)`, id);
    run(`INSERT INTO channels(server_id,name,type,user_limit) VALUES(?, '🎮 Gaming Squad','voice',5)`, id);
    run(`INSERT INTO channels(server_id,name,type,user_limit) VALUES(?, '🎵 Música & YouTube','voice',0)`, id);
    toUser(ws.user.id, { t: 'servers.changed' });
    return { id };
  },
  'server.get': (ws, d) => serverView(Number(d.id), ws.user.id),
  'server.join': (ws, d) => {
    const s = get('SELECT id FROM servers WHERE invite=?', clean(d.code, 32).toLowerCase());
    if (!s) fail('Invitación inválida');
    run(`INSERT OR IGNORE INTO members(server_id,user_id,role) VALUES(?,?,'member')`, s.id, ws.user.id);
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
    for (const c of all('SELECT id FROM channels WHERE server_id=?', id)) { run('DELETE FROM messages WHERE channel=?', 'c' + c.id); parties.delete('c' + c.id); }
    run('DELETE FROM servers WHERE id=?', id);
    toUsers(m, { t: 'servers.changed' });
  },
  'server.kick': (ws, d) => {
    const id = Number(d.id), target = Number(d.userId);
    const myR = roleOf(id, ws.user.id), tarR = roleOf(id, target);
    if (!myR || roleRank(myR) < 2) fail('Necesitas rango Moderador, Admin o Dueño para expulsar');
    if (target === ws.user.id) fail('No puedes expulsarte');
    if (!tarR || roleRank(myR) <= roleRank(tarR)) fail('No puedes expulsar a alguien de igual o mayor rango');
    run('DELETE FROM members WHERE server_id=? AND user_id=?', id, target);
    toUser(target, { t: 'servers.changed' }); notifyServer(id);
  },
  'server.setRole': (ws, d) => {
    const id = Number(d.id), target = Number(d.userId), newRole = String(d.role || 'member');
    if (!['admin', 'mod', 'dj', 'member'].includes(newRole)) fail('Rango inválido');
    const myR = roleOf(id, ws.user.id), tarR = roleOf(id, target);
    if (!myR || roleRank(myR) < 3) fail('Solo el Dueño o Administradores pueden asignar rangos');
    if (!tarR || tarR === 'owner') fail('No puedes cambiar el rango del dueño');
    if (myR !== 'owner' && (roleRank(newRole) >= roleRank(myR) || roleRank(tarR) >= roleRank(myR))) fail('Solo el dueño puede gestionar administradores');
    run('UPDATE members SET role=? WHERE server_id=? AND user_id=?', newRole, id, target);
    notifyServer(id);
    return { userId: target, role: newRole };
  },
  'server.newinvite': (ws, d) => {
    const id = Number(d.id);
    if (roleRank(roleOf(id, ws.user.id)) < 3) fail('Solo Dueño o Admin');
    run('UPDATE servers SET invite=? WHERE id=?', newInvite(), id); notifyServer(id);
  },
  'server.setIcon': (ws, d) => {
    const id = Number(d.id);
    const s = get('SELECT owner FROM servers WHERE id=?', id);
    const r = roleOf(id, ws.user.id);
    if (!s || (s.owner !== ws.user.id && roleRank(r) < 3)) fail('Solo el dueño o administradores pueden cambiar el icono');
    const icon = d.icon ? String(d.icon).slice(0, 85000) : null;
    run('UPDATE servers SET icon=? WHERE id=?', icon, id);
    notifyServer(id);
    for (const m of memberIds(id)) toUser(m, { t: 'servers.changed' });
    return { ok: true, icon };
  },
  'server.inviteFriend': (ws, d) => {
    const sid = Number(d.serverId);
    const friendId = Number(d.friendId);
    if (!sid || !friendId) fail('Datos incompletos');
    const myRole = roleOf(sid, ws.user.id);
    if (!myRole) fail('No eres miembro del servidor');

    const isFriend = get('SELECT 1 FROM friends WHERE ((a=? AND b=?) OR (a=? AND b=?)) AND status=\'accepted\'', ws.user.id, friendId, friendId, ws.user.id);
    if (!isFriend) fail('El usuario no es tu amigo');

    const alreadyMember = get('SELECT 1 FROM members WHERE server_id=? AND user_id=?', sid, friendId);
    if (alreadyMember) fail('Ya es miembro del servidor');

    const s = get('SELECT id, name, invite FROM servers WHERE id=?', sid);
    if (!s) fail('Servidor inexistente');

    const dm = dmKey(ws.user.id, friendId);
    const msgText = `¡Te he invitado a unirte al servidor **${s.name}**!\nepickast://join/${s.invite}`;
    const now = Date.now();
    const r = run('INSERT INTO messages(channel, user_id, text, ts) VALUES(?,?,?,?)', dm, ws.user.id, msgText, now);
    const mid = Number(r.lastInsertRowid);

    const fullMsg = {
      id: mid,
      channel: dm,
      userId: ws.user.id,
      name: ws.user.name,
      color: ws.user.color,
      av: ws.user.avatar ? (ws.user.av || 1) : 0,
      text: msgText,
      ts: now,
      fileId: null,
      fileName: null,
      fileMime: null,
      fileSize: null
    };

    toUser(friendId, { t: 'msg', channel: dm, msg: fullMsg });
    toUser(ws.user.id, { t: 'msg', channel: dm, msg: fullMsg });
    return { ok: true, mid };
  },
  'channel.create': (ws, d) => {
    const sid = Number(d.serverId);
    if (roleRank(roleOf(sid, ws.user.id)) < 3) fail('Solo Dueño o Admin pueden crear canales');
    const type = d.type === 'voice' ? 'voice' : 'text';
    const rawName = clean(d.name, 34);
    const name = type === 'text' ? rawName.replace(/\s+/g, '-').toLowerCase() : rawName.replace(/\s+/g, ' ');
    if (!name) fail('Nombre vacío');
    const userLimit = type === 'voice' ? Math.max(0, Math.min(MAX_ROOM, Number(d.userLimit) || 0)) : 0;
    if (all('SELECT 1 FROM channels WHERE server_id=?', sid).length >= 50) fail('Límite de canales');
    const cid = Number(run('INSERT INTO channels(server_id,name,type,user_limit) VALUES(?,?,?,?)', sid, name, type, userLimit).lastInsertRowid);
    notifyServer(sid);
    return { id: cid };
  },
  'channel.delete': (ws, d) => {
    const c = get('SELECT c.id, c.server_id s FROM channels c WHERE c.id=?', Number(d.id));
    if (!c || roleRank(roleOf(c.s, ws.user.id)) < 3) fail('Solo Dueño o Admin');
    run('DELETE FROM messages WHERE channel=?', 'c' + c.id);
    run('DELETE FROM channels WHERE id=?', c.id);
    parties.delete('c' + c.id);
    notifyServer(c.s);
  },
  'activity.set': (ws, d) => {
    const name = clean(d?.name, 60);
    if (name) {
      const prev = activities.get(ws.user.id);
      activities.set(ws.user.id, { name, kind: clean(d?.kind || 'game', 16), since: prev?.name === name ? prev.since : Date.now() });
    } else {
      activities.delete(ws.user.id);
    }
    const act = activities.get(ws.user.id) || null;
    toUsers([ws.user.id, ...presenceAudience(ws.user.id)], { t: 'presence', id: ws.user.id, online: true, activity: act });
    if (ws.room) broadcastRoom(ws.room);
    return { activity: act };
  },
  'party.get': (ws, d) => {
    const key = d?.key || ws.room;
    if (!key) fail('No estás en una sala de voz');
    authorize(key, ws.user.id);
    return partyView(key);
  },
  'party.search': async (ws, d) => {
    return { items: await searchYouTube(d?.q) };
  },
  'party.add': async (ws, d) => {
    const key = d?.key || ws.room;
    if (!key) fail('Únete primero a un canal de voz o llamada para usar el Bot DJ');
    authorize(key, ws.user.id);
    let tracks = [];
    if (d?.track && (d.track.ytId || d.track.url)) {
      tracks = [{
        id: crypto.randomBytes(6).toString('hex'),
        ytId: d.track.ytId ? clean(d.track.ytId, 16) : null,
        kind: d.track.ytId ? 'yt' : 'direct',
        title: clean(d.track.title || ' Pista', 140),
        author: clean(d.track.author || 'YouTube', 80),
        duration: clean(d.track.duration || '', 24),
        thumb: clean(d.track.thumb || '', 240),
        url: clean(d.track.url || '', 400),
        addedBy: ws.user.name,
      }];
    } else if (d?.q) {
      const found = await searchYouTube(d.q);
      if (!found.length) fail('No se encontraron resultados para agregar');
      // Si fue una playlist se agregan todos; si fue búsqueda normal se agrega el primero
      const isPlaylist = /[?&]list=([A-Za-z0-9_-]{10,})/.test(String(d.q));
      const picked = isPlaylist ? found : [found[0]];
      tracks = picked.map((t) => ({ ...t, id: crypto.randomBytes(6).toString('hex'), addedBy: ws.user.name }));
    } else fail('Pista inválida');

    let p = parties.get(key);
    if (!p) parties.set(key, (p = { current: null, queue: [], playing: false, pos: 0, updatedAt: Date.now(), loop: false }));
    for (const tr of tracks) {
      if (!p.current) {
        p.current = tr;
        p.playing = true;
        p.pos = 0;
        p.updatedAt = Date.now();
      } else {
        p.queue.push(tr);
      }
    }
    broadcastParty(key);
    return { added: tracks.length, party: partyView(key) };
  },
  'party.control': (ws, d) => {
    const key = d?.key || ws.room;
    if (!key) fail('No estás en una sala de voz');
    const a = authorize(key, ws.user.id);
    let p = parties.get(key);
    if (!p) return partyView(key);
    const act = String(d?.action || '');
    if (act === 'play') {
      if (p.current && !p.playing) { p.pos = typeof d.pos === 'number' ? Math.max(0, d.pos) : partyPos(p); p.playing = true; p.updatedAt = Date.now(); }
    } else if (act === 'pause') {
      if (p.current) { p.pos = typeof d.pos === 'number' ? Math.max(0, d.pos) : partyPos(p); p.playing = false; p.updatedAt = Date.now(); }
    } else if (act === 'seek') {
      if (p.current) { p.pos = Math.max(0, Number(d.pos) || 0); p.updatedAt = Date.now(); }
    } else if (act === 'next' || act === 'ended') {
      // Si es 'ended', verificar trackId para que si 4 clientes mandan 'ended' al terminar el video solo avance una vez
      if (act === 'ended' && d.trackId && p.current?.id !== d.trackId) return partyView(key);
      if (p.loop && p.current) p.queue.push({ ...p.current, id: crypto.randomBytes(6).toString('hex') });
      p.current = p.queue.shift() || null;
      p.pos = 0;
      p.playing = !!p.current;
      p.updatedAt = Date.now();
    } else if (act === 'jump') {
      const idx = Number(d.index);
      if (idx >= 0 && idx < p.queue.length) {
        if (p.loop && p.current) p.queue.push({ ...p.current, id: crypto.randomBytes(6).toString('hex') });
        p.current = p.queue.splice(idx, 1)[0];
        p.pos = 0;
        p.playing = true;
        p.updatedAt = Date.now();
      }
    } else if (act === 'remove') {
      const idx = Number(d.index);
      if (idx >= 0 && idx < p.queue.length) p.queue.splice(idx, 1);
    } else if (act === 'loop') {
      p.loop = !p.loop;
    } else if (act === 'clear') {
      if (a.serverId && roleRank(roleOf(a.serverId, ws.user.id)) < 1 && p.queue.length > 3) {
        // Cualquiera con rol DJ/Mod/Admin/Owner o en llamadas pequeñas puede limpiar
      }
      p.current = null; p.queue = []; p.playing = false; p.pos = 0; p.updatedAt = Date.now();
    }
    broadcastParty(key);
    return partyView(key);
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
    const limit = a.userLimit > 0 ? Math.min(MAX_ROOM, a.userLimit) : MAX_ROOM;
    if (!r.has(ws.user.id) && r.size >= limit) fail(`Sala llena (máx. ${limit} usuarios)`);
    const old = r.get(ws.user.id); if (old && old.ws !== ws) send(old.ws, { t: 'voice.kicked', key: d.key });
    const peers = roomUsers(d.key).filter((p) => p.id !== ws.user.id);
    r.set(ws.user.id, { ws, name: ws.user.name, state: {} });
    ws.room = d.key;
    for (const p of peers) send(r.get(p.id).ws, { t: 'voice.joined', key: d.key, user: { id: ws.user.id, name: ws.user.name, state: {}, ...profileOf(ws.user.id) } });
    const partyTrack = parties.get(d.key)?.current?.title || null;
    toUsers(a.audience, { t: 'voice.room', key: d.key, users: roomUsers(d.key), partyTrack });
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
    return { peers, ice: iceServers(), ringing, offline, party: partyView(d.key) };
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
  'voice.sound': (ws, d) => {
    const r = rooms.get(ws.room); if (!r) return;
    const soundKey = clean(d.sound || '', 40);
    const soundName = clean(d.name || ws.user.name, 40);
    for (const [, v] of r) {
      send(v.ws, { t: 'voice.sound', from: ws.user.id, sound: soundKey, name: soundName, customUrl: d.customUrl ? String(d.customUrl).slice(0, 500) : null });
    }
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
  let version = '1.5.7';
  try { version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version || version; } catch {}
  const dist = path.join(root, 'dist');
  let file = null;
  let exeFile = null;
  if (fs.existsSync(dist)) {
    const files = fs.readdirSync(dist).filter((f) => /\.(exe|zip)$/i.test(f) && !/uninstaller/i.test(f));
    const exes = files.filter(f => f.endsWith('.exe'));
    if (exes.length) exeFile = exes[0];
    files.sort((a, b) => {
      const aMatch = a.includes(version) ? 1 : 0, bMatch = b.includes(version) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      const aZip = a.endsWith('.zip') ? 1 : 0;
      const bZip = b.endsWith('.zip') ? 1 : 0;
      if (aZip !== bZip) return bZip - aZip;
      return b.localeCompare(a, undefined, { numeric: true });
    });
    if (files.length) file = files[0];
  }
  const directExe = process.env.DIRECT_EXE_URL || 'https://www.dropbox.com/scl/fi/cmp9ejaxgduafw52vtq0q/EpicKast-Instalador.exe?rlkey=2hzhonhyw3aew9a5p9em80upp&st=3bllva08&dl=1';
  const directZip = process.env.DIRECT_ZIP_URL || null;
  const ghUrl = directZip || `https://github.com/alejandroepickap/epickast2/releases/latest/download/EpicKast-v${version}-Amigos.zip`;
  const ghExe = directExe;
  return {
    version,
    file: file || `EpicKast-v${version}-Amigos.zip`,
    exeFile: exeFile || 'EpicKast-Instalador.exe',
    downloadPath: '/download/latest',
    exeDownloadPath: '/download/exe',
    directExe,
    directZip,
    ghUrl,
    ghExe
  };
}

// ---------- transporte ----------
function ytPlayerHtml(vid) {
  const safeVid = /^[A-Za-z0-9_-]{11}$/.test(vid || '') ? vid : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="origin-when-cross-origin">
<style>html,body{margin:0;padding:0;width:100%;height:100%;background:#090a0f;overflow:hidden;font-family:system-ui,sans-serif}
#player{width:100%;height:100%;border:0}
</style></head><body><div id="player"></div>
<script>
let p = null, ready = false, curVid = ${JSON.stringify(safeVid)}, pending = [];
const post = (o) => { try { parent.postMessage({ src: 'epickast-yt', ...o }, '*'); } catch {} };
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = function() {
  p = new YT.Player('player', {
    width: '100%', height: '100%',
    videoId: curVid || undefined,
    playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, origin: location.origin },
    events: {
      onReady: () => {
        ready = true;
        while (pending.length) runCmd(pending.shift());
        post({ ev: 'ready', videoId: curVid, duration: p.getDuration ? p.getDuration() : 0 });
      },
      onStateChange: (e) => {
        post({ ev: 'state', state: e.data, pos: p.getCurrentTime ? p.getCurrentTime() : 0, duration: p.getDuration ? p.getDuration() : 0 });
        if (e.data === 0) post({ ev: 'ended', videoId: curVid });
      },
      onError: (e) => post({ ev: 'error', code: e.data, videoId: curVid })
    }
  });
};
function runCmd(m) {
  if (!ready || !p) { pending.push(m); return; }
  try {
    if (m.cmd === 'load') {
      curVid = m.videoId;
      p.loadVideoById({ videoId: m.videoId, startSeconds: Number(m.pos) || 0 });
      if (m.playing === false) setTimeout(() => { try { p.pauseVideo(); } catch {} }, 350);
    } else if (m.cmd === 'sync') {
      if (m.videoId && m.videoId !== curVid) {
        curVid = m.videoId;
        p.loadVideoById({ videoId: m.videoId, startSeconds: Number(m.pos) || 0 });
      } else if (typeof m.pos === 'number' && p.getCurrentTime) {
        const cur = p.getCurrentTime() || 0;
        if (Math.abs(cur - m.pos) > 2.2) p.seekTo(m.pos, true);
      }
      const st = p.getPlayerState ? p.getPlayerState() : -1;
      if (m.playing && st !== 1 && st !== 3) p.playVideo();
      else if (!m.playing && st === 1) p.pauseVideo();
    } else if (m.cmd === 'play') p.playVideo();
    else if (m.cmd === 'pause') p.pauseVideo();
    else if (m.cmd === 'seek') p.seekTo(Number(m.pos) || 0, true);
    else if (m.cmd === 'vol') { p.setVolume(Math.max(0, Math.min(100, Number(m.vol) ?? 80))); if (m.vol > 0 && p.isMuted && p.isMuted()) p.unMute(); }
  } catch {}
}
window.addEventListener('message', (e) => { if (e.data && e.data.cmd) runCmd(e.data); });
setInterval(() => {
  if (ready && p && p.getCurrentTime && p.getPlayerState && p.getPlayerState() === 1) {
    post({ ev: 'time', pos: p.getCurrentTime() || 0, duration: p.getDuration ? p.getDuration() : 0 });
  }
}, 1000);
</script></body></html>`;
}

const SAFE_MIMES = /^(image\/(png|jpeg|webp|gif|bmp)|application\/pdf|text\/plain|audio\/(mpeg|wav|ogg|webm)|video\/(mp4|webm))$/i;
const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-token, content-type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"ok":true,"app":"EpicKast"}'); }
  if (u.pathname === '/version') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(releaseInfo())); }
  if (u.pathname === '/backup') {
    saveBackup();
    if (fs.existsSync(BACKUP_FILE)) {
      res.writeHead(200, { 'content-type': 'application/json' });
      return fs.createReadStream(BACKUP_FILE).pipe(res);
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end('{}'); }
  if (u.pathname === '/restore-seed') {
    restoreBackup();
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, msg: 'Restaurado con exito' }));
  }
  if (u.pathname === '/yt-player') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'referrer-policy': 'origin-when-cross-origin' });
    return res.end(ytPlayerHtml(u.searchParams.get('v') || ''));
  }
  if (u.pathname === '/' || u.pathname === '/index.html') {
    const info = releaseInfo();
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>EpicKast — Descarga Oficial</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 50% 20%,#1d1b38 0%,#0e1015 70%);color:#eef0f6;font-family:system-ui,sans-serif;text-align:center;padding:20px}
.box{background:#151821;border:1px solid rgba(255,255,255,.08);padding:34px;border-radius:20px;max-width:480px;box-shadow:0 20px 50px #000a}
h1{margin:0 0 6px;font-size:28px}h1 span{color:#7c5cff}p{color:#8c93a8;font-size:14px;line-height:1.5}
a.btn{display:inline-block;margin-top:14px;background:#7c5cff;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:12px;font-size:15px}
.steps{text-align:left;background:#1e2230;padding:14px 18px;border-radius:12px;margin-top:18px;font-size:13px;color:#d0d5e6}
.steps li{margin:6px 0}</style></head><body><div class="box">
<h1>Epic<span>Kast</span> v${info.version}</h1>
<p>Comunicación ultraligera de baja latencia · Servidor en línea 🟢</p>
<a class="btn" href="/download/latest">⬇ Descargar para Windows (ZIP sin bloqueo)</a>
<ol class="steps">
<li>Descarga el archivo <b>.zip</b> de arriba y extráelo.</li>
<li>Abre <b>Instalar-Sin-Bloqueo.bat</b> (elimina el aviso de SmartScreen automáticamente e instala EpicKast).</li>
<li>¡Listo! Ya viene conectado por defecto a <b>wss://epickast-b9fd.onrender.com</b>.</li>
</ol></div></body></html>`);
  }
  if (u.pathname === '/download/latest') {
    const info = releaseInfo();
    const fp = info.file ? path.join(__dirname, '..', 'dist', info.file) : null;
    if (!fp || !fs.existsSync(fp)) {
      res.writeHead(302, { Location: info.ghUrl });
      return res.end();
    }
    const stat = fs.statSync(fp);
    res.writeHead(200, {
      'content-type': 'application/octet-stream',
      'content-length': stat.size,
      'content-disposition': `attachment; filename="${info.file}"`,
    });
    return fs.createReadStream(fp).pipe(res);
  }
  if (u.pathname === '/download/exe') {
    const info = releaseInfo();
    const fp = info.exeFile ? path.join(__dirname, '..', 'dist', info.exeFile) : null;
    if (!fp || !fs.existsSync(fp)) {
      res.writeHead(302, { Location: info.ghExe });
      return res.end();
    }
    const stat = fs.statSync(fp);
    res.writeHead(200, {
      'content-type': 'application/vnd.microsoft.portable-executable',
      'content-length': stat.size,
      'content-disposition': `attachment; filename="${info.exeFile}"`,
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
  if (s.size === 1) toUsers(presenceAudience(userId), { t: 'presence', id: userId, online: true, activity: activities.get(userId) || null });
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
            saveBackup();
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
      const res = h(ws, m);
      if (['friends.add', 'friends.accept', 'friends.remove', 'server.create', 'server.join', 'server.leave', 'server.delete', 'channel.create', 'channel.delete', 'profile.set'].includes(m.t)) {
        setTimeout(saveBackup, 300);
      }
      if (res && typeof res.then === 'function') {
        res.then((v) => reply(true, v)).catch((e) => {
          if (!e.user) console.error('[error]', m.t, e);
          reply(false, e.user ? e.message : 'Error interno');
        });
      } else {
        reply(true, res);
      }
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
    if (s && !s.size) {
      conns.delete(ws.user.id);
      activities.delete(ws.user.id);
      toUsers(presenceAudience(ws.user.id), { t: 'presence', id: ws.user.id, online: false, activity: null });
    }
  });
  ws.on('error', () => {});
});

// latido: elimina conexiones muertas
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 25000).unref();
// keep-alive automático para hosts gratuitos en la nube (Render / Koyeb)
if (process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL) {
  const selfUrl = String(process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL).replace(/\/+$/, '') + '/health';
  setInterval(() => fetch(selfUrl).catch(() => {}), 10 * 60 * 1000).unref();
}
// limpieza de sesiones viejas (90 días)
run('DELETE FROM sessions WHERE created<?', Date.now() - 90 * 864e5);

if (require.main === module) {
  httpServer.listen(PORT, '0.0.0.0', () => console.log(`EpicKast server escuchando en :${PORT}  (datos: ${DATA})`));
}
module.exports = { httpServer, wss, db };
