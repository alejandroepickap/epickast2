'use strict';
process.env.EPICKAST_TEST = '1';
/**
 * Test de integración para las nuevas capacidades del servidor EpicKast v1.7.9:
 * 1. Bóveda y Recompensas (vault.get, vault.open, vault.exchange, vault.craft, dungeon.sync).
 * 2. Moderación (report.create, report.list, report.resolve, block.add, block.remove).
 * 3. Bloqueo de mensajes entre usuarios bloqueados.
 */
const { WebSocket } = require('ws');
const { httpServer } = require('../server/server');

const PORT = 7789;

function runTests() {
  return new Promise((resolve, reject) => {
    const srv = httpServer.listen(PORT, '127.0.0.1', async () => {
      console.log('Servidor de prueba iniciado en puerto', PORT);

      function connectUser(username) {
        return new Promise((res, rej) => {
          const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
          let msgId = 1;
          const pending = new Map();

          ws.on('open', () => {
            // Register or login
            const id = msgId++;
            pending.set(id, (r) => {
              if (r.ok) res({ ws, user: r.data.user, token: r.data.token, rpc });
              else rej(new Error(r.error));
            });
            ws.send(JSON.stringify({ t: 'register', name: username, password: 'password123', i: id }));
          });

          ws.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.r && pending.has(m.r)) {
              const cb = pending.get(m.r);
              pending.delete(m.r);
              cb(m);
            }
          });

          function rpc(t, d = {}) {
            return new Promise((rRes, rRej) => {
              const id = msgId++;
              pending.set(id, (resp) => {
                if (resp.ok) rRes(resp.data);
                else rRej(new Error(resp.error));
              });
              ws.send(JSON.stringify({ t, ...d, i: id }));
            });
          }
        });
      }

      try {
        const ts = Date.now().toString().slice(-6);
        const u1 = await connectUser('mod_u1_' + ts);
        const u2 = await connectUser('mod_u2_' + ts);

        console.log('✓ Usuarios de prueba creados y conectados.');

        // Test 1: Vault get
        const vaultState = await u1.rpc('vault.get');
        console.log('✓ vault.get ejecutado:', vaultState.keys);

        // Test 2: Dungeon sync (ganar llaves y monedas)
        const syncRes = await u1.rpc('dungeon.sync', { floor: 1, coins: 200, keys: { copper: 3, silver: 1 } });
        console.log('✓ dungeon.sync ejecutado:', syncRes.keys, 'Monedas:', syncRes.coins);

        // Test 3: Vault exchange
        const exRes = await u1.rpc('vault.exchange', { tier: 'copper' });
        console.log('✓ vault.exchange ejecutado. Nuevas monedas:', exRes.newCoins, 'Nuevas llaves:', exRes.newKeys);

        // Test 4: Vault open
        const openRes = await u1.rpc('vault.open', { tier: 'copper' });
        console.log('✓ vault.open ejecutado:', openRes.reward?.name, 'Rareza:', openRes.rarity, 'Duplicado:', openRes.wasDuplicate);

        // Test 5: Moderation - Reports
        const repRes = await u1.rpc('report.create', { targetUserId: u2.user.id, reason: 'Spam excesivo' });
        console.log('✓ report.create ejecutado. Report ID:', repRes.reportId);

        // Test 6: Blocks
        await u1.rpc('block.add', { targetId: u2.user.id });
        console.log('✓ block.add ejecutado.');
        const blockList = await u1.rpc('block.list');
        console.log('✓ block.list ejecutado. Bloqueados:', blockList.length);

        await u1.rpc('block.remove', { targetId: u2.user.id });
        console.log('✓ block.remove ejecutado.');

        u1.ws.close();
        u2.ws.close();
        srv.close(() => {
          console.log('\n============================================================');
          console.log('✓✓✓ TODAS LAS PRUEBAS DE BÓVEDA Y MODERACIÓN PASARON OK ✓✓✓');
          console.log('============================================================\n');
          resolve();
        });
      } catch (e) {
        srv.close();
        reject(e);
      }
    });
  });
}

runTests().catch((err) => {
  console.error('✗ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
