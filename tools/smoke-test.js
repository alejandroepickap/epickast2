'use strict';
// Prueba de humo end-to-end del servidor (usa una BD temporal).
const os = require('node:os'), path = require('node:path'), fs = require('node:fs');
process.env.EPICKAST_TEST = '1';
process.env.EPICKAST_DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'epickast-'));
const { httpServer, wss } = require('../server/server.js');
const WebSocket = require('ws');
const assert = require('node:assert/strict');

function client(port) {
  return new Promise((res) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}`); let i = 0; const pend = new Map(); const events = [];
    ws.on('message', (d) => { const m = JSON.parse(d); if (m.r) { pend.get(m.r)(m); pend.delete(m.r); } else events.push(m); });
    const c = { ws, events, rpc: (t, d = {}) => new Promise((r, j) => { const n = ++i; pend.set(n, (m) => (m.ok ? r(m.data) : j(new Error(m.error)))); ws.send(JSON.stringify({ ...d, t, i: n })); }), wait: async (t, ms = 1500) => { const e0 = Date.now(); while (Date.now() - e0 < ms) { const k = events.findIndex((e) => e.t === t); if (k >= 0) return events.splice(k, 1)[0]; await new Promise((r) => setTimeout(r, 20)); } throw new Error('timeout evento ' + t); } };
    ws.on('open', () => res(c));
  });
}
(async () => {
  await new Promise((r) => httpServer.listen(0, '127.0.0.1', r));
  const port = httpServer.address().port;
  const a = await client(port), b = await client(port);
  const uAna = 'ana_' + Date.now(), uBeto = 'beto_' + Date.now();
  const ra = await a.rpc('register', { name: uAna, password: 'secreto1' });
  const rb = await b.rpc('register', { name: uBeto, password: 'secreto2' });
  await assert.rejects(client(port).then((c) => c.rpc('login', { name: uAna, password: 'mal' })), /incorrectos/);
  // amigos
  await a.rpc('friends.add', { name: uBeto }); await b.wait('friends.changed');
  assert.equal((await b.rpc('friends.list')).incoming.length, 1);
  await b.rpc('friends.accept', { id: ra.user.id });
  const fl = await a.rpc('friends.list'); assert.equal(fl.friends[0].name, uBeto); assert.equal(fl.friends[0].online, true);
  // DM
  const { key } = await a.rpc('dm.open', { userId: rb.user.id });
  await a.rpc('msg.send', { channel: key, text: 'hola beto' });
  assert.equal((await b.wait('msg')).msg.text, 'hola beto');
  // llamada entrante: rechazar
  assert.equal((await a.rpc('voice.join', { key })).ringing, true);
  const inc = await b.wait('call.incoming'); assert.equal(inc.from.name, uAna); assert.equal(inc.key, key);
  await b.rpc('call.decline', { key }); assert.equal((await a.wait('call.stop')).reason, 'declined'); await a.rpc('voice.leave');
  // llamada entrante: contestar
  a.events.length = 0; b.events.length = 0;
  await a.rpc('voice.join', { key }); await b.wait('call.incoming');
  assert.equal((await b.rpc('voice.join', { key })).peers.length, 1);
  assert.equal((await b.wait('call.stop')).reason, 'answered'); await b.rpc('voice.leave'); await a.rpc('voice.leave');
  // llamada entrante: cancelar antes de contestar
  a.events.length = 0; b.events.length = 0;
  await a.rpc('voice.join', { key }); await b.wait('call.incoming'); await a.rpc('voice.leave');
  assert.equal((await b.wait('call.stop')).reason, 'cancelled');
  // perfil / avatar
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
  const pub = await a.rpc('profile.set', { color: '#ff8800', bio: 'hola', avatar: png }); assert.ok(pub.av > 0);
  assert.equal((await b.wait('profile.changed')).profile.color, '#ff8800');
  assert.equal((await b.rpc('profile.avatar', { id: ra.user.id })).avatar, png);
  await assert.rejects(a.rpc('profile.set', { avatar: 'data:text/html;base64,AAAA' }), /inválida/);
  assert.equal((await b.rpc('friends.list')).friends[0].color, '#ff8800');
  a.events.length = 0; b.events.length = 0;
  // subida de archivo/imagen y galería (files.list + GET /files/:id)
  const upRes = await fetch(`http://127.0.0.1:${port}/upload?channel=${key}&name=plano.pdf&mime=application/pdf&text=adjunto`, {
    method: 'POST', headers: { 'x-token': ra.token }, body: Buffer.from('PDF-TEST-CONTENT'),
  });
  assert.equal(upRes.status, 200);
  const upJson = await upRes.json(); assert.ok(upJson.fileId > 0);
  const fMsg = await b.wait('msg'); assert.equal(fMsg.msg.fileName, 'plano.pdf'); assert.equal(fMsg.msg.text, 'adjunto');
  const gal = await b.rpc('files.list', { channel: key }); assert.equal(gal.length, 1); assert.equal(gal[0].name, 'plano.pdf');
  const dlRes = await fetch(`http://127.0.0.1:${port}/files/${upJson.fileId}`);
  assert.equal(await dlRes.text(), 'PDF-TEST-CONTENT');
  a.events.length = 0; b.events.length = 0;
  // respuestas citadas (replyTo) y mensajes fijados (msg.pin / msg.pins)
  const repRes = await b.rpc('msg.send', { channel: key, text: 'recibido el plano!', replyTo: upJson.msg.id });
  const repEvt = await a.wait('msg');
  assert.equal(repEvt.msg.replyId, upJson.msg.id);
  assert.equal(repEvt.msg.replyName, uAna);
  const pinRes = await a.rpc('msg.pin', { id: repRes.id });
  assert.equal(pinRes.pinned, true);
  const pinEvt = await b.wait('msg.pinned');
  assert.equal(pinEvt.id, repRes.id);
  assert.equal(pinEvt.pinned, true);
  const pinsList = await b.rpc('msg.pins', { channel: key });
  assert.equal(pinsList.length, 1);
  assert.equal(pinsList[0].id, repRes.id);
  a.events.length = 0; b.events.length = 0;
  // servidor, rangos, canales de voz con límite, actividad de juego y EpicBot DJ
  const { id } = await a.rpc('server.create', { name: 'Mi Server' });
  let sv = await a.rpc('server.get', { id }); assert.equal(sv.channels.length, 5);
  await assert.rejects(b.rpc('server.get', { id }), /miembro/);
  // Invitar amigo directamente a este servidor (server.inviteFriend)
  a.events.length = 0; b.events.length = 0;
  const invRes = await a.rpc('server.inviteFriend', { serverId: id, friendId: rb.user.id });
  assert.equal(invRes.ok, true);
  const invMsg = await b.wait('msg');
  assert.ok(invMsg.msg.text.includes('epickast://join/' + sv.invite));
  await b.rpc('server.join', { code: sv.invite });
  const txt = sv.channels.find((c) => c.type === 'text'), voice = sv.channels.find((c) => c.type === 'voice');
  await b.rpc('msg.send', { channel: txt.key, text: 'hola server' });
  assert.equal((await a.rpc('msg.history', { channel: txt.key }))[0].text, 'hola server');
  await assert.rejects(b.rpc('channel.create', { serverId: id, name: 'x', type: 'text' }), /Dueño o Admin/);
  // Asignar rango Admin a beto y probar crear canal de voz con límite
  await a.rpc('server.setRole', { id, userId: rb.user.id, role: 'admin' });
  sv = await b.rpc('server.get', { id });
  assert.equal(sv.myRole, 'admin');
  await b.rpc('channel.create', { serverId: id, name: '🔒 Sala Duo', type: 'voice', userLimit: 2 });
  sv = await a.rpc('server.get', { id });
  assert.equal(sv.channels.some((c) => c.name === '🔒 Sala Duo' && c.userLimit === 2), true);
  // Actividad de juego en vivo
  a.events.length = 0; b.events.length = 0;
  await a.rpc('activity.set', { name: 'VALORANT', kind: 'game' });
  const presEvt = await b.wait('presence');
  assert.equal(presEvt.activity.name, 'VALORANT');
  // voz + señalización + EpicBot DJ (Watch & Listen Together)
  const ja = await a.rpc('voice.join', { key: voice.key }); assert.equal(ja.peers.length, 0);
  const jb = await b.rpc('voice.join', { key: voice.key }); assert.equal(jb.peers[0].name, uAna);
  assert.equal((await a.wait('voice.joined')).user.name, uBeto);
  a.events.length = 0; b.events.length = 0;
  const pAdd = await a.rpc('party.add', { key: voice.key, track: { ytId: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio', author: 'Lofi Girl', duration: 'EN VIVO' } });
  assert.equal(pAdd.added, 1);
  assert.equal(pAdd.party.current.ytId, 'jfKfPfyJRdk');
  const pSync = await b.wait('party.sync');
  assert.equal(pSync.party.current.title, 'Lofi Hip Hop Radio');
  assert.equal(pSync.party.playing, true);
  a.events.length = 0;
  await b.rpc('party.control', { key: voice.key, action: 'pause', pos: 42 });
  const pSync2 = await a.wait('party.sync');
  assert.equal(pSync2.party.playing, false);
  assert.equal(Math.round(pSync2.party.pos), 42);
  const ytHtmlRes = await fetch(`http://127.0.0.1:${port}/yt-player?v=jfKfPfyJRdk`);
  assert.equal(ytHtmlRes.status, 200);
  assert.ok((await ytHtmlRes.text()).includes('YT.Player'));
  await b.rpc('rtc.signal', { to: ra.user.id, data: { description: { type: 'offer', sdp: 'x' } } });
  assert.equal((await a.wait('rtc.signal')).from, rb.user.id);
  await a.rpc('voice.state', { muted: true, cam: true });
  assert.equal((await b.wait('voice.peerstate')).state.muted, true);
  b.ws.close(); assert.equal((await a.wait('voice.left')).userId, rb.user.id);
  // sesión
  const c2 = await client(port); await c2.rpc('resume', { token: ra.token });
  console.log('✔ Todas las pruebas del servidor pasaron');
  for (const c of [a, c2]) c.ws.close(); wss.close(); httpServer.close(); setTimeout(() => process.exit(0), 200);
})().catch((e) => { console.error('✘', e); process.exit(1); });
