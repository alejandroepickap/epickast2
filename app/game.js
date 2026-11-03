// EpicKast: EpicStrike 2D • Co-op Arena Shooter & Cajas Tácticas
// Shooter multijugador 2D de acción con WASD + Mouse, construcción de defensas, hordas, jefe titán y ruleta de cajas tácticas.
// Optimizado para rendimiento extremo: <4MB RAM, Canvas 2D puro, audio sintetizado Web Audio (0 archivos externos).

(function(global) {
  'use strict';

  // --- Sistema de Audio Sintetizado en Tiempo Real (Zero Latencia, Zero Assets) ---
  const AudioFX = {
    ctx: null,
    getCtx() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    },
    shoot(type = 'pistol') {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        if (type === 'rifle') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(620, t);
          osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
          g.gain.setValueAtTime(0.18, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          osc.connect(g); g.connect(c.destination);
          osc.start(t); osc.stop(t + 0.09);
        } else if (type === 'shotgun') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(340, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.16);
          g.gain.setValueAtTime(0.35, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          osc.connect(g); g.connect(c.destination);
          osc.start(t); osc.stop(t + 0.17);
        } else if (type === 'plasma') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, t);
          osc.frequency.exponentialRampToValueAtTime(90, t + 0.22);
          g.gain.setValueAtTime(0.28, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.connect(g); g.connect(c.destination);
          osc.start(t); osc.stop(t + 0.23);
        } else { // pistol
          osc.type = 'square';
          osc.frequency.setValueAtTime(540, t);
          osc.frequency.exponentialRampToValueAtTime(160, t + 0.07);
          g.gain.setValueAtTime(0.15, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
          osc.connect(g); g.connect(c.destination);
          osc.start(t); osc.stop(t + 0.08);
        }
      } catch {}
    },
    hit() {
      const c = this.getCtx(); if (!c) return;
      try {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.05);
        g.gain.setValueAtTime(0.12, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
        osc.connect(g); g.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 0.06);
      } catch {}
    },
    boom() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.38);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(g); g.connect(c.destination);
        osc.start(t); osc.stop(t + 0.4);
      } catch {}
    },
    coin() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1174, t + 0.04);
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(g); g.connect(c.destination);
        osc.start(t); osc.stop(t + 0.14);
      } catch {}
    },
    roundCleared() {
      // Notificación de victoria suave y breve (volumen muy bajo, sin bucle infinito)
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, t);
        osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.14);
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g); g.connect(c.destination);
        osc.start(t); osc.stop(t + 0.24);
      } catch {}
    },
    tick() {
      const c = this.getCtx(); if (!c) return;
      try {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.035);
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.035);
        osc.connect(g); g.connect(c.destination);
        osc.start(); osc.stop(c.currentTime + 0.04);
      } catch {}
    },
    goldFanfare() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.09);
          g.gain.setValueAtTime(0.001, t + i * 0.09);
          g.gain.linearRampToValueAtTime(0.25, t + i * 0.09 + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.65);
          osc.connect(g); g.connect(c.destination);
          osc.start(t + i * 0.09); osc.stop(t + i * 0.09 + 0.7);
        });
      } catch {}
    }
  };

  // --- Catálogo de Armas y Skins Tácticas ---
  const SKINS = [
    // ⚪ Mil-Spec (Azul claro)
    { id: 'p_classic', name: 'Pistola Clásica USP-S', type: 'weapon', rarity: 'milspec', color: '#93c5fd', bg: '#1e3a8a', bulletColor: '#60a5fa' },
    { id: 'w_steel', name: 'Barrera Táctica de Acero', type: 'build', rarity: 'milspec', color: '#94a3b8', bg: '#334155' },
    { id: 't_sentry', name: 'Torreta Centinela Rust', type: 'build', rarity: 'milspec', color: '#cbd5e1', bg: '#475569' },

    // 🔵 Restricted (Púrpura claro)
    { id: 'r_ak', name: 'Rifle de Asalto Blue Phosphor', type: 'weapon', rarity: 'restricted', color: '#38bdf8', bg: '#0369a1', bulletColor: '#38bdf8' },
    { id: 's_frost', name: 'Escopeta Nova Frostbite', type: 'weapon', rarity: 'restricted', color: '#818cf8', bg: '#3730a3', bulletColor: '#818cf8' },
    { id: 't_tesla', name: 'Torreta Tesla Criogénica', type: 'build', rarity: 'restricted', color: '#a78bfa', bg: '#5b21b6' },

    // 🟣 Classified (Rosa / Fucsia)
    { id: 'r_cyber', name: 'Rifle M4A4 Cyberpunk Neón', type: 'weapon', rarity: 'classified', color: '#f472b6', bg: '#9d174d', bulletColor: '#f472b6' },
    { id: 'p_vortex', name: 'Cañón de Plasma Vortex', type: 'weapon', rarity: 'classified', color: '#c084fc', bg: '#6b21a8', bulletColor: '#c084fc' },

    // 🔴 Covert (Rojo Legendario)
    { id: 'r_asiimov', name: 'Rifle AWP / AK Asiimov', type: 'weapon', rarity: 'covert', color: '#fb923c', bg: '#9a3412', bulletColor: '#f97316' },
    { id: 'p_hyperbeast', name: 'Cañón de Plasma HyperBeast', type: 'weapon', rarity: 'covert', color: '#ef4444', bg: '#991b1b', bulletColor: '#ef4444' },

    // 🟡 ★ ESPECIAL EXTRAORDINARIO (Dorado - Cuchillos CS)
    { id: 'knife_karambit', name: '★ Cuchillo Karambit EpicKast', type: 'knife', rarity: 'gold', color: '#fbbf24', bg: '#b45309', badge: '★ Karambit' },
    { id: 'knife_butterfly', name: '★ Cuchillo Mariposa Fade Neón', type: 'knife', rarity: 'gold', color: '#f59e0b', bg: '#d97706', badge: '★ Mariposa' },
    { id: 'r_dragonlore', name: '★ Rifle Dragón Lore Dorado', type: 'weapon', rarity: 'gold', color: '#fde047', bg: '#ca8a04', bulletColor: '#fde047' }
  ];

  const RARITY_MAP = {
    milspec: { name: 'Común (Mil-Spec)', color: '#4b69ff' },
    restricted: { name: 'Raro (Restricted)', color: '#8847ff' },
    classified: { name: 'Épico (Classified)', color: '#d32ce6' },
    covert: { name: 'Legendario (Covert)', color: '#eb4b4b' },
    gold: { name: '★ ESPECIAL EXTRAORDINARIO ★', color: '#ffd700' }
  };

  function loadGameData() {
    try {
      const d = JSON.parse(localStorage.getItem('epickast_strike_data') || '{}');
      return {
        credits: typeof d.credits === 'number' && d.credits >= 100 ? d.credits : 250,
        crates: d.crates || 1,
        unlocked: Array.isArray(d.unlocked) ? d.unlocked : ['p_classic', 'w_steel', 't_sentry'],
        equipped: d.equipped || { weapon: 'p_classic', build: 't_sentry', knife: null }
      };
    } catch {}
    return { credits: 250, crates: 1, unlocked: ['p_classic', 'w_steel', 't_sentry'], equipped: { weapon: 'p_classic', build: 't_sentry', knife: null } };
  }

  function saveGameData(data) {
    try { localStorage.setItem('epickast_strike_data', JSON.stringify(data)); } catch {}
  }

  // --- Clase Principal: EpicStrike 2D ---
  class CyberDefenseGame {
    constructor(container, socket, roomKey, currentUser) {
      this.container = container;
      this.socket = socket;
      this.roomKey = roomKey || 'room_default';
      this.currentUser = currentUser || { name: 'Tú', id: 'p1' };
      this.data = loadGameData();

      // Dimensiones de la arena de juego
      this.width = 720;
      this.height = 460;

      // Estado del jugador
      this.player = {
        x: this.width / 2,
        y: this.height / 2,
        vx: 0, vy: 0,
        speed: 210,
        hp: 100, maxHp: 100,
        angle: 0,
        currentWeapon: 'rifle', // 'pistol', 'rifle', 'shotgun', 'plasma'
        lastShotTime: 0
      };

      // Control de teclado y mouse
      this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, Space: false };
      this.mouse = { x: this.width / 2, y: this.height / 2, isDown: false, rightDown: false };

      // Entidades
      this.bullets = [];      // { x, y, vx, vy, dmg, color, fromPlayer, life }
      this.enemies = [];      // { x, y, vx, vy, hp, maxHp, speed, radius, type, shootTimer }
      this.enemyBullets = []; // { x, y, vx, vy, dmg }
      this.structures = [];   // { x, y, type: 'wall'|'turret', hp, maxHp, lastShot, user }
      this.particles = [];    // { x, y, vx, vy, life, maxLife, color, size }
      this.pickups = [];      // { x, y, type: 'credit'|'crate'|'heal', val }
      this.teammates = new Map(); // id -> { name, x, y, angle, hp, isBot }

      // Niveles y Oleadas
      this.wave = 1;
      this.maxWaves = 5;
      this.gameState = 'play'; // 'play', 'cleared', 'gameover'
      this.enemiesSpawned = 0;
      this.enemiesTotalWave = 15;
      this.spawnTimer = 0;
      this.score = 0;
      this.shakeIntensity = 0;

      this.running = false;
      this.animId = null;

      this.initDom();
      this.bindInputs();
      this.bindSocket();
      this.startWave(1);
      this.startLoop();
    }

    initDom() {
      this.container.innerHTML = `
        <div class="cd-wrap" style="width: 760px; max-width: 98vw; background:#0b0e17">
          <div class="cd-header" style="background:#131826; border-bottom:1px solid #1f293d">
            <div class="cd-title">
              <span class="cd-ico">⚡</span>
              <div>
                <strong>EpicStrike 2D • Arena Co-op</strong>
                <span class="cd-badge">v1.7.4</span>
              </div>
            </div>
            <div class="cd-stats">
              <div class="cd-stat">❤️ Salud: <b id="esHp">100/100</b></div>
              <div class="cd-stat">⚡ Créditos: <b id="esCredits">${this.data.credits}</b></div>
              <div class="cd-stat">🏆 Nivel: <b id="esWave">1/5</b></div>
              <div class="cd-stat">📦 Cajas: <b id="esCrates">${this.data.crates}</b></div>
            </div>
            <div class="cd-acts">
              <button id="esBtnInvite" class="cd-btn" style="background:#059669;border-color:#10b981;color:#fff;font-weight:700" title="Invitar a todos en la llamada/sala a unirse a la partida">📢 Invitar a jugar</button>
              <button id="esBtnBot" class="cd-btn" title="Añadir un bot aliado a tu escuadrón para probar el modo cooperativo">🤖 +Bot Aliado</button>
              <button id="esBtnCrate" class="cd-btn gold">🎁 Abrir Cajas Tácticas</button>
              <button id="esBtnClose" class="cd-btn">✕ Salir</button>
            </div>
          </div>

          <div class="cd-main" style="padding:10px; gap:10px; flex-direction:column; align-items:center">
            <!-- Barra Superior de Armas y Acciones -->
            <div style="display:flex; justify-content:space-between; width:100%; max-width:720px; font-size:12px; color:#cbd5e1; align-items:center">
              <div style="display:flex; gap:6px">
                <button class="es-wbtn active" data-w="rifle">🔫 [1] Rifle</button>
                <button class="es-wbtn" data-w="shotgun">💥 [2] Escopeta</button>
                <button class="es-wbtn" data-w="plasma">⚡ [3] Plasma</button>
                <button class="es-wbtn" data-w="pistol">🎯 [4] Pistola</button>
              </div>
              <div style="display:flex; gap:8px; align-items:center">
                <span>Construir:</span>
                <button id="esBuildTurret" class="cd-btn small" title="Construir torreta centinela cerca de ti (Coste: 80⚡)">🔫 Torreta (80⚡)</button>
                <button id="esBuildWall" class="cd-btn small" title="Construir muro de escudo (Coste: 40⚡)">🧱 Muro (40⚡)</button>
              </div>
            </div>

            <!-- Canvas del Shooter 2D -->
            <div style="position:relative; width:720px; height:460px; border-radius:12px; overflow:hidden; border:2px solid #1f293d; box-shadow:0 8px 30px rgba(0,0,0,0.7)">
              <canvas id="esCanvas" width="${this.width}" height="${this.height}" style="background:#080b12; display:block; cursor:crosshair"></canvas>

              <!-- Pantalla de Estado (Game Over / Nivel Superado) -->
              <div id="esOverlay" class="cd-wave-overlay hidden">
                <div class="cd-overlay-box" style="background:#131826; border:2px solid #38bdf8; border-radius:14px; padding:20px; max-width:380px">
                  <h2 id="esOverlayTitle" style="color:#ef4444; font-size:22px; margin:0">¡MISION FALLIDA!</h2>
                  <p id="esOverlayDesc" style="color:#94a3b8; font-size:13px; line-height:1.4">Has sido derrotado. Reinicia la partida con tus créditos listos para defender la base.</p>
                  <button id="esOverlayBtn" class="cd-btn big primary" style="font-weight:700">🔄 Reiniciar Partida</button>
                </div>
              </div>
            </div>

            <!-- Barra Inferior de Ayuda y Escuadrón -->
            <div style="display:flex; justify-content:space-between; width:100%; max-width:720px; font-size:11px; color:#94a3b8">
              <div>🕹️ <b>Controles</b>: [W,A,S,D] Moverte • [Mouse] Apuntar y Disparar • [Espacio] Torreta rápida</div>
              <div id="esSquadList" style="color:#38bdf8; font-weight:600">👥 Escuadrón: Tú (${this.currentUser.name})</div>
            </div>
          </div>
        </div>

        <!-- Modal de Ruleta CS -->
        <div id="esCrateModal" class="cd-crate-modal hidden"></div>
      `;

      this.canvas = this.container.querySelector('#esCanvas');
      this.ctx = this.canvas.getContext('2d');

      // Botones de Armas
      this.container.querySelectorAll('.es-wbtn').forEach(btn => {
        btn.onclick = () => {
          this.container.querySelectorAll('.es-wbtn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.player.currentWeapon = btn.dataset.w;
        };
      });

      // Construcción manual desde barra
      this.container.querySelector('#esBuildTurret').onclick = () => this.placeStructure('turret');
      this.container.querySelector('#esBuildWall').onclick = () => this.placeStructure('wall');

      // Acciones Header
      this.container.querySelector('#esBtnBot').onclick = () => this.addSquadBot();
      this.container.querySelector('#esBtnCrate').onclick = () => this.openCrateScreen();
      this.container.querySelector('#esBtnClose').onclick = () => this.destroy();

      // Botón del Overlay (Reiniciar)
      this.container.querySelector('#esOverlayBtn').onclick = () => {
        if (this.gameState === 'gameover') {
          this.resetGame();
        } else {
          this.nextWave();
        }
      };
    }

    bindInputs() {
      this.onKeyDown = (e) => {
        if (this.keys[e.code] !== undefined) this.keys[e.code] = true;
        if (e.code === 'Digit1') this.selectWeapon('rifle');
        if (e.code === 'Digit2') this.selectWeapon('shotgun');
        if (e.code === 'Digit3') this.selectWeapon('plasma');
        if (e.code === 'Digit4') this.selectWeapon('pistol');
        if (e.code === 'Space') { e.preventDefault(); this.placeStructure('turret'); }
      };

      this.onKeyUp = (e) => {
        if (this.keys[e.code] !== undefined) this.keys[e.code] = false;
      };

      this.onMouseMove = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
      };

      this.onMouseDown = (e) => {
        if (e.button === 0) this.mouse.isDown = true;
        if (e.button === 2) { e.preventDefault(); this.placeStructure('wall'); }
      };

      this.onMouseUp = (e) => {
        if (e.button === 0) this.mouse.isDown = false;
      };

      this.onContextMenu = (e) => e.preventDefault();

      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      this.canvas.addEventListener('mousemove', this.onMouseMove);
      this.canvas.addEventListener('mousedown', this.onMouseDown);
      window.addEventListener('mouseup', this.onMouseUp);
      this.canvas.addEventListener('contextmenu', this.onContextMenu);
    }

    selectWeapon(w) {
      this.player.currentWeapon = w;
      this.container.querySelectorAll('.es-wbtn').forEach(b => {
        b.classList.toggle('active', b.dataset.w === w);
      });
      AudioFX.tick();
    }

    bindSocket() {
      if (!this.socket) return;
      this.onSocketMsg = (d) => {
        if (d?.t === 'game.event' && d.action) {
          const act = d.action;
          if (act.type === 'peer_move') {
            this.teammates.set(act.id, {
              name: d.from || 'Compañero',
              x: act.x, y: act.y, angle: act.angle, hp: act.hp
            });
            this.updateSquadHud();
          } else if (act.type === 'peer_shoot') {
            this.bullets.push({
              x: act.x, y: act.y,
              vx: Math.cos(act.angle) * 580,
              vy: Math.sin(act.angle) * 580,
              dmg: act.dmg || 25,
              color: act.color || '#38bdf8',
              fromPlayer: true, life: 60
            });
            AudioFX.shoot(act.weapon);
          } else if (act.type === 'peer_build') {
            this.structures.push({
              x: act.x, y: act.y, type: act.bType,
              hp: act.hp, maxHp: act.hp, lastShot: 0, user: d.from
            });
            AudioFX.coin();
          }
        }
      };
      if (typeof this.socket.on === 'function') {
        this.socket.on('message', this.onSocketMsg);
      }
    }

    sendAction(action) {
      if (this.socket && this.socket.send) {
        try {
          this.socket.send(JSON.stringify({
            t: 'game.action',
            key: this.roomKey,
            action
          }));
        } catch {}
      }
    }

    addSquadBot() {
      const botId = 'bot_' + Math.random().toString(36).slice(2, 6);
      const names = ['Bot Ghost', 'Bot Viper', 'Bot Shadow', 'Bot Titan'];
      const botName = names[this.teammates.size % names.length];

      this.teammates.set(botId, {
        name: botName,
        x: this.player.x + (Math.random() * 80 - 40),
        y: this.player.y + (Math.random() * 80 - 40),
        angle: 0, hp: 100, maxHp: 100,
        isBot: true, shootTimer: 0
      });

      this.updateSquadHud();
      AudioFX.coin();
      this.spawnFloatingText(this.player.x, this.player.y - 20, `+ ${botName} unido al escuadrón`, '#22c55e');
    }

    updateSquadHud() {
      const el = this.container.querySelector('#esSquadList');
      if (!el) return;
      const mates = Array.from(this.teammates.values()).map(m => m.name);
      el.textContent = `👥 Escuadrón (${mates.length + 1}): Tú (${this.currentUser.name})` + (mates.length ? ', ' + mates.join(', ') : '');
    }

    placeStructure(type) {
      const cost = type === 'wall' ? 40 : 80;
      if (this.data.credits < cost) {
        AudioFX.tick();
        this.spawnFloatingText(this.player.x, this.player.y - 20, `¡Faltan créditos! Requiere ${cost}⚡`, '#f87171');
        return;
      }
      this.data.credits -= cost;
      saveGameData(this.data);
      this.updateStatsUi();
      AudioFX.coin();

      // Colocar enfrente del jugador
      const px = this.player.x + Math.cos(this.player.angle) * 36;
      const py = this.player.y + Math.sin(this.player.angle) * 36;
      const hp = type === 'wall' ? 450 : 250;

      this.structures.push({
        x: px, y: py, type, hp, maxHp: hp, lastShot: 0, user: this.currentUser.name
      });

      this.sendAction({ type: 'peer_build', bType: type, x: px, y: py, hp });
      this.spawnFloatingText(px, py - 10, type === 'wall' ? '🧱 Muro colocado' : '🔫 Torreta activa', '#38bdf8');
    }

    startWave(num) {
      this.wave = num;
      this.gameState = 'play';
      this.enemies = [];
      this.enemyBullets = [];
      this.enemiesSpawned = 0;
      this.spawnTimer = 0;

      // Configuración por nivel
      const configs = [
        { total: 15, name: 'Nivel 1: Despejar Sector', desc: 'Elimina los drones ligeros de exploración.', reward: 250 },
        { total: 25, name: 'Nivel 2: Incursión Cyborg', desc: 'Cyborgs veloces armados con pistolas de plasma.', reward: 350 },
        { total: 35, name: 'Nivel 3: Asedio Blindado', desc: 'Mechs acorazados con alta defensa y cadencia.', reward: 500 },
        { total: 1,  name: 'Nivel 4: JEFE TITÁN GOLIATH', desc: '¡Destruye al colosal Titan Bípedo con 3500 HP!', reward: 1000 },
        { total: 60, name: 'Nivel 5: Supervivencia Élite', desc: 'Oleadas infinitas combinadas. ¡Defiende tu posición!', reward: 1500 }
      ];

      this.currentConfig = configs[Math.min(num - 1, configs.length - 1)];
      this.enemiesTotalWave = this.currentConfig.total;
      this.container.querySelector('#esOverlay').classList.add('hidden');
      this.updateStatsUi();

      this.spawnFloatingText(this.width / 2, 80, `⚡ ${this.currentConfig.name}`, '#fde047', 22);
    }

    resetGame() {
      // REINICIO COMPLETO Y LIMPIO: GARANTIZA CRÉDITOS Y SALUD
      this.player.hp = 100;
      this.player.x = this.width / 2;
      this.player.y = this.height / 2;
      this.player.vx = 0;
      this.player.vy = 0;

      // Asegurar créditos mínimos para volver a jugar
      if (this.data.credits < 250) {
        this.data.credits = 250;
      }
      saveGameData(this.data);

      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];
      this.structures = [];
      this.pickups = [];

      this.startWave(1);
      this.updateStatsUi();
      AudioFX.goldFanfare();
    }

    nextWave() {
      if (this.wave < this.maxWaves) {
        this.startWave(this.wave + 1);
      } else {
        this.resetGame();
      }
    }

    spawnEnemy() {
      if (this.enemiesSpawned >= this.enemiesTotalWave) return;
      this.enemiesSpawned++;

      const isBoss = (this.wave === 4);
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = Math.random() * this.width; y = -30; }
      else if (side === 1) { x = this.width + 30; y = Math.random() * this.height; }
      else if (side === 2) { x = Math.random() * this.width; y = this.height + 30; }
      else { x = -30; y = Math.random() * this.height; }

      if (isBoss) {
        this.enemies.push({
          x: this.width / 2, y: -50,
          vx: 0, vy: 0,
          hp: 3500, maxHp: 3500,
          speed: 40, radius: 34,
          type: 'boss', shootTimer: 0
        });
        this.shakeIntensity = 12;
        AudioFX.boom();
      } else {
        const types = ['drone', 'trooper', 'tank'];
        const type = this.wave === 1 ? 'drone' : (this.wave === 2 ? (Math.random() > 0.4 ? 'trooper' : 'drone') : types[Math.floor(Math.random() * types.length)]);
        const hp = type === 'tank' ? 180 : (type === 'trooper' ? 70 : 35);
        const speed = type === 'tank' ? 65 : (type === 'trooper' ? 95 : 140);
        const radius = type === 'tank' ? 16 : 10;

        this.enemies.push({
          x, y, vx: 0, vy: 0,
          hp, maxHp: hp, speed, radius,
          type, shootTimer: Math.random() * 1.5
        });
      }
    }

    shoot() {
      const now = performance.now();
      const delays = { pistol: 220, rifle: 110, shotgun: 550, plasma: 750 };
      const cd = delays[this.player.currentWeapon] || 150;

      if (now - this.player.lastShotTime < cd) return;
      this.player.lastShotTime = now;

      const w = this.player.currentWeapon;
      const angle = this.player.angle;
      const sx = this.player.x + Math.cos(angle) * 18;
      const sy = this.player.y + Math.sin(angle) * 18;

      AudioFX.shoot(w);

      if (w === 'shotgun') {
        for (let i = -2; i <= 2; i++) {
          const spr = angle + (i * 0.12);
          this.bullets.push({
            x: sx, y: sy,
            vx: Math.cos(spr) * 520, vy: Math.sin(spr) * 520,
            dmg: 18, color: '#f59e0b', fromPlayer: true, life: 35
          });
        }
      } else if (w === 'plasma') {
        this.bullets.push({
          x: sx, y: sy,
          vx: Math.cos(angle) * 380, vy: Math.sin(angle) * 380,
          dmg: 150, color: '#ec4899', isPlasma: true, fromPlayer: true, life: 70
        });
      } else {
        const dmg = w === 'rifle' ? 26 : 20;
        const color = w === 'rifle' ? '#38bdf8' : '#60a5fa';
        this.bullets.push({
          x: sx, y: sy,
          vx: Math.cos(angle) * 620, vy: Math.sin(angle) * 620,
          dmg, color, fromPlayer: true, life: 60
        });
      }

      // Sincronizar disparo con otros miembros
      this.sendAction({ type: 'peer_shoot', weapon: w, x: sx, y: sy, angle, dmg: 25 });
    }

    startLoop() {
      this.running = true;
      let lastTime = performance.now();

      const step = (now) => {
        if (!this.running) return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        this.update(dt);
        this.render();

        this.animId = requestAnimationFrame(step);
      };
      this.animId = requestAnimationFrame(step);
    }

    update(dt) {
      if (this.gameState !== 'play') return;

      // 1. Movimiento del Jugador (WASD)
      let dx = 0, dy = 0;
      if (this.keys.KeyW || this.keys.ArrowUp) dy -= 1;
      if (this.keys.KeyS || this.keys.ArrowDown) dy += 1;
      if (this.keys.KeyA || this.keys.ArrowLeft) dx -= 1;
      if (this.keys.KeyD || this.keys.ArrowRight) dx += 1;

      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

      this.player.x += dx * this.player.speed * dt;
      this.player.y += dy * this.player.speed * dt;

      // Limitar a los bordes
      this.player.x = Math.max(16, Math.min(this.width - 16, this.player.x));
      this.player.y = Math.max(16, Math.min(this.height - 16, this.player.y));

      // Disparo automático si mantiene presionado el ratón
      if (this.mouse.isDown) this.shoot();

      // Transmisión de movimiento periódica
      if (Math.random() < 0.2) {
        this.sendAction({
          type: 'peer_move',
          id: this.currentUser.id || 'me',
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          angle: this.player.angle,
          hp: this.player.hp
        });
      }

      // 2. IA de Bots Compañeros (Co-op)
      this.teammates.forEach((bot) => {
        if (!bot.isBot) return;
        // Seguir al jugador a distancia
        const distToPlayer = Math.hypot(this.player.x - bot.x, this.player.y - bot.y);
        if (distToPlayer > 80) {
          const ang = Math.atan2(this.player.y - bot.y, this.player.x - bot.x);
          bot.x += Math.cos(ang) * 160 * dt;
          bot.y += Math.sin(ang) * 160 * dt;
        }

        // Buscar enemigo cercano y dispararle
        let nearestEn = null;
        let minDist = 320;
        for (const en of this.enemies) {
          const d = Math.hypot(en.x - bot.x, en.y - bot.y);
          if (d < minDist) { minDist = d; nearestEn = en; }
        }

        if (nearestEn) {
          bot.angle = Math.atan2(nearestEn.y - bot.y, nearestEn.x - bot.x);
          bot.shootTimer = (bot.shootTimer || 0) + dt;
          if (bot.shootTimer > 0.22) {
            bot.shootTimer = 0;
            this.bullets.push({
              x: bot.x, y: bot.y,
              vx: Math.cos(bot.angle) * 580, vy: Math.sin(bot.angle) * 580,
              dmg: 24, color: '#38bdf8', fromPlayer: true, life: 50
            });
            AudioFX.shoot('rifle');
          }
        }
      });

      // 3. Torretas construidas disparan automáticamente
      this.structures.forEach((st) => {
        if (st.type === 'turret') {
          st.lastShot = (st.lastShot || 0) + dt;
          if (st.lastShot > 0.35) {
            let target = null;
            let md = 260;
            for (const en of this.enemies) {
              const d = Math.hypot(en.x - st.x, en.y - st.y);
              if (d < md) { md = d; target = en; }
            }
            if (target) {
              st.lastShot = 0;
              const ang = Math.atan2(target.y - st.y, target.x - st.x);
              this.bullets.push({
                x: st.x, y: st.y,
                vx: Math.cos(ang) * 520, vy: Math.sin(ang) * 520,
                dmg: 28, color: '#38bdf8', fromPlayer: true, life: 45
              });
              AudioFX.shoot('pistol');
            }
          }
        }
      });

      // 4. Balas de Jugador avanzan
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life--;

        // Colisión con enemigos
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const en = this.enemies[j];
          if (Math.hypot(en.x - b.x, en.y - b.y) < en.radius + 6) {
            en.hp -= b.dmg;
            AudioFX.hit();
            this.spawnSparks(b.x, b.y, b.color, 4);
            this.spawnFloatingText(en.x, en.y - 12, `-${b.dmg}`, b.color);

            if (b.isPlasma) {
              this.shakeIntensity = 5;
              this.spawnSparks(b.x, b.y, '#ec4899', 15);
            }

            b.life = 0;
            break;
          }
        }

        if (b.life <= 0 || b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
          this.bullets.splice(i, 1);
        }
      }

      // 5. Spawning de Enemigos
      if (this.enemiesSpawned < this.enemiesTotalWave) {
        this.spawnTimer += dt;
        if (this.spawnTimer > (this.wave === 4 ? 1.0 : 0.75)) {
          this.spawnTimer = 0;
          this.spawnEnemy();
        }
      }

      // 6. Actualización de Enemigos
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const en = this.enemies[i];
        if (en.hp <= 0) {
          // Destruido
          AudioFX.boom();
          this.spawnSparks(en.x, en.y, '#eab308', 20);
          this.shakeIntensity = en.type === 'boss' ? 16 : 4;

          // Soltar Créditos
          const rew = en.type === 'boss' ? 400 : (en.type === 'tank' ? 35 : 15);
          this.data.credits += rew;
          this.score += rew * 10;
          saveGameData(this.data);
          this.updateStatsUi();
          AudioFX.coin();
          this.spawnFloatingText(en.x, en.y, `+${rew}⚡`, '#22c55e', 14);

          this.enemies.splice(i, 1);
          continue;
        }

        // Avanzar hacia el jugador o compañero más cercano
        const dx = this.player.x - en.x;
        const dy = this.player.y - en.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 15) {
          en.x += (dx / dist) * en.speed * dt;
          en.y += (dy / dist) * en.speed * dt;
        }

        // Si es Trooper o Boss, disparar al jugador
        if (en.type === 'trooper' || en.type === 'boss') {
          en.shootTimer = (en.shootTimer || 0) + dt;
          const cadence = en.type === 'boss' ? 0.6 : 1.6;
          if (en.shootTimer >= cadence) {
            en.shootTimer = 0;
            const ang = Math.atan2(dy, dx);
            this.enemyBullets.push({
              x: en.x, y: en.y,
              vx: Math.cos(ang) * (en.type === 'boss' ? 340 : 260),
              vy: Math.sin(ang) * (en.type === 'boss' ? 340 : 260),
              dmg: en.type === 'boss' ? 22 : 12
            });
            AudioFX.shoot('pistol');
          }
        }

        // Daño por contacto al jugador
        if (dist < en.radius + 14) {
          this.damagePlayer(en.type === 'boss' ? 45 * dt : 18 * dt);
        }
      }

      // 7. Balas de enemigos avanzan
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const eb = this.enemyBullets[i];
        eb.x += eb.vx * dt;
        eb.y += eb.vy * dt;

        // Choque con muros
        let blocked = false;
        for (const st of this.structures) {
          if (st.type === 'wall' && Math.hypot(st.x - eb.x, st.y - eb.y) < 22) {
            st.hp -= eb.dmg;
            blocked = true;
            this.spawnSparks(eb.x, eb.y, '#38bdf8', 4);
            break;
          }
        }
        if (blocked) { this.enemyBullets.splice(i, 1); continue; }

        // Choque con jugador
        if (Math.hypot(this.player.x - eb.x, this.player.y - eb.y) < 16) {
          this.damagePlayer(eb.dmg);
          this.spawnSparks(eb.x, eb.y, '#ef4444', 8);
          this.enemyBullets.splice(i, 1);
          continue;
        }

        if (eb.x < 0 || eb.x > this.width || eb.y < 0 || eb.y > this.height) {
          this.enemyBullets.splice(i, 1);
        }
      }

      // 8. Limpiar estructuras destruidas
      this.structures = this.structures.filter(s => s.hp > 0);

      // 9. Verificar condición de victoria de la oleada (ejecución única)
      if (this.gameState === 'play' && this.enemiesSpawned >= this.enemiesTotalWave && this.enemies.length === 0) {
        this.gameState = 'cleared';
        this.data.crates += 1;
        this.data.credits += this.currentConfig.reward;
        saveGameData(this.data);
        this.updateStatsUi();
        AudioFX.roundCleared();

        const ov = this.container.querySelector('#esOverlay');
        const t = this.container.querySelector('#esOverlayTitle');
        const d = this.container.querySelector('#esOverlayDesc');
        const b = this.container.querySelector('#esOverlayBtn');

        t.textContent = `🎉 ¡${this.currentConfig.name.toUpperCase()} SUPERADO!`;
        t.style.color = '#22c55e';
        d.innerHTML = `Has defendido la arena con éxito.<br><b>Recompensa:</b> +${this.currentConfig.reward}⚡ y <b>1x Caja CS</b> otorgada.`;
        b.textContent = this.wave >= this.maxWaves ? '🏆 Finalizar Campaña' : `⚔️ Siguiente Nivel (${this.wave + 1})`;
        ov.classList.remove('hidden');
      }

      // 10. Partículas y Screen Shake
      if (this.shakeIntensity > 0) this.shakeIntensity *= 0.9;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx; pt.y += pt.vy;
        pt.life++;
        if (pt.life >= pt.maxLife) this.particles.splice(i, 1);
      }
    }

    damagePlayer(amount) {
      this.player.hp -= amount;
      this.shakeIntensity = Math.min(10, this.shakeIntensity + 3);
      AudioFX.hit();
      this.updateStatsUi();

      if (this.player.hp <= 0) {
        this.player.hp = 0;
        this.gameState = 'gameover';
        AudioFX.boom();

        const ov = this.container.querySelector('#esOverlay');
        const t = this.container.querySelector('#esOverlayTitle');
        const d = this.container.querySelector('#esOverlayDesc');
        const b = this.container.querySelector('#esOverlayBtn');

        t.textContent = '💀 ¡HAS CAÍDO EN COMBATE!';
        t.style.color = '#ef4444';
        d.innerHTML = `Las defensas fueron superadas en la Oleada ${this.wave}.<br>Al reiniciar obtendrás tus <b>250⚡ de inicio</b> y salud al 100%.`;
        b.textContent = '🔄 Reiniciar Partida';
        ov.classList.remove('hidden');
      }
    }

    spawnSparks(x, y, color = '#f59e0b', count = 8) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 3;
        this.particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          color, life: 0, maxLife: 15 + Math.random() * 10
        });
      }
    }

    spawnFloatingText(x, y, text, color = '#38bdf8', size = 12) {
      this.particles.push({
        x, y, vx: (Math.random() - 0.5) * 0.4, vy: -1.0,
        text, color, size, isText: true, life: 0, maxLife: 45
      });
    }

    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const now = Date.now();

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Screen Shake
      if (this.shakeIntensity > 0.5) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        ctx.translate(Math.round(sx), Math.round(sy));
      }

      // 1. PISO PIXEL ART: Arena Retro Sci-Fi con Baldosas Metálicas y Bordes de Advertencia
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Cuadrícula de baldosas con remaches
      ctx.strokeStyle = '#121a2c';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Remaches metálicos en intersecciones
      ctx.fillStyle = '#1e293b';
      for (let x = 32; x < w; x += 64) {
        for (let y = 32; y < h; y += 64) {
          ctx.fillRect(x - 1, y - 1, 3, 3);
        }
      }

      // Franja de peligro perimetral (Hazard Stripes pixeladas amarillo/negro)
      const bw = 10;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, w, bw);
      ctx.fillRect(0, h - bw, w, bw);
      ctx.fillRect(0, 0, bw, h);
      ctx.fillRect(w - bw, 0, bw, h);

      ctx.fillStyle = '#ca8a04';
      for (let x = 0; x < w; x += 16) {
        ctx.fillRect(x, 0, 8, bw);
        ctx.fillRect(x, h - bw, 8, bw);
      }
      for (let y = 0; y < h; y += 16) {
        ctx.fillRect(0, y, bw, 8);
        ctx.fillRect(w - bw, y, bw, 8);
      }

      // 2. ESTRUCTURAS PIXEL ART (Muros y Torretas)
      this.structures.forEach(st => {
        if (st.type === 'wall') {
          // Muro de Escudo Táctico Pixel Art
          const px = Math.round(st.x);
          const py = Math.round(st.y);
          // Postes laterales metálicos
          ctx.fillStyle = '#334155';
          ctx.fillRect(px - 14, py - 14, 6, 28);
          ctx.fillRect(px + 8, py - 14, 6, 28);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(px - 13, py - 13, 2, 2);
          ctx.fillRect(px - 13, py + 11, 2, 2);
          ctx.fillRect(px + 11, py - 13, 2, 2);
          ctx.fillRect(px + 11, py + 11, 2, 2);

          // Campo de fuerza pixelado brillante con scanline
          const pulse = (Math.sin(now * 0.008) + 1) * 0.5;
          ctx.fillStyle = `rgba(56, 189, 248, ${0.25 + pulse * 0.25})`;
          ctx.fillRect(px - 8, py - 12, 16, 24);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.strokeRect(px - 8, py - 12, 16, 24);

          // Líneas de rejilla interna de energía
          ctx.fillStyle = '#7dd3fc';
          const scanY = py - 10 + (Math.floor(now * 0.04) % 20);
          ctx.fillRect(px - 7, scanY, 14, 2);

          // Barra de vida pixelada
          const hpPct = Math.max(0, st.hp / st.maxHp);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px - 12, py - 18, 24, 3);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(px - 12, py - 18, Math.round(24 * hpPct), 3);
        } else {
          // Torreta Centinela Pixel Art
          const px = Math.round(st.x);
          const py = Math.round(st.y);

          // Trípode de base
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px - 12, py - 12, 24, 24);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px - 8, py - 8, 16, 16);

          // Cabeza giratoria de la torreta
          ctx.save();
          ctx.translate(px, py);
          const target = this.enemies[0];
          const tAngle = target ? Math.atan2(target.y - py, target.x - px) : 0;
          ctx.rotate(tAngle);

          // Cañones dobles
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(4, -5, 12, 3);
          ctx.fillRect(4, 2, 12, 3);
          // Núcleo de la torreta
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(-6, -6, 12, 12);
          ctx.fillStyle = '#818cf8';
          ctx.fillRect(-3, -3, 6, 6);
          // Ojo láser central
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(1, -1, 3, 3);
          ctx.restore();

          // Barra de vida pixelada
          const hpPct = Math.max(0, st.hp / st.maxHp);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px - 12, py - 16, 24, 3);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(px - 12, py - 16, Math.round(24 * hpPct), 3);
        }
      });

      // 3. LÍNEA DE APUNTADO LÁSER PIXELADA (Del arma al ratón)
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gunTipX = this.player.x + Math.cos(this.player.angle) * 18;
      const gunTipY = this.player.y + Math.sin(this.player.angle) * 18;
      ctx.moveTo(gunTipX, gunTipY);
      ctx.lineTo(this.mouse.x, this.mouse.y);
      ctx.stroke();
      ctx.restore();

      // Mirilla Retícula Pixel Art en el cursor
      const mx = Math.round(this.mouse.x);
      const my = Math.round(this.mouse.y);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(mx - 6, my, 4, 1);
      ctx.fillRect(mx + 3, my, 4, 1);
      ctx.fillRect(mx, my - 6, 1, 4);
      ctx.fillRect(mx, my + 3, 1, 4);
      ctx.fillRect(mx - 1, my - 1, 3, 3);

      // 4. BALAS DEL JUGADOR (Trazadores Pixel Art)
      this.bullets.forEach(b => {
        const bx = Math.round(b.x);
        const by = Math.round(b.y);
        if (b.isPlasma) {
          ctx.fillStyle = '#e879f9';
          ctx.fillRect(bx - 4, by - 4, 8, 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx - 2, by - 2, 4, 4);
        } else {
          ctx.fillStyle = b.color || '#38bdf8';
          ctx.fillRect(bx - 2, by - 2, 4, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx - 1, by - 1, 2, 2);
        }
      });

      // 5. BALAS ENEMIGAS (Proyectiles Pixel Rojos)
      this.enemyBullets.forEach(eb => {
        const ex = Math.round(eb.x);
        const ey = Math.round(eb.y);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(ex - 2, ey - 2, 5, 5);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ex - 1, ey - 1, 3, 3);
      });

      // 6. ENEMIGOS PIXEL ART
      this.enemies.forEach(en => {
        const ex = Math.round(en.x);
        const ey = Math.round(en.y);

        if (en.type === 'boss') {
          // TITÁN COLOSAL GOLIATH (Sprite Gigante Pixel Art)
          ctx.save();
          ctx.translate(ex, ey);
          const bossAngle = Math.atan2(this.player.y - ey, this.player.x - ex);
          ctx.rotate(bossAngle);

          // Orugas/Pies mecha laterales
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-22, -26, 44, 8);
          ctx.fillRect(-22, 18, 44, 8);

          // Chasis blindado carmesí y obsidiana
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-18, -18, 36, 36);
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(-14, -14, 28, 28);

          // Silos de misiles en hombreras
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-12, -16, 4, 4);
          ctx.fillRect(-6, -16, 4, 4);
          ctx.fillRect(-12, 12, 4, 4);
          ctx.fillRect(-6, 12, 4, 4);

          // Cañones dobles frontales
          ctx.fillStyle = '#475569';
          ctx.fillRect(14, -10, 16, 6);
          ctx.fillRect(14, 4, 16, 6);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(28, -9, 4, 4);
          ctx.fillRect(28, 5, 4, 4);

          // Reactor del Pecho (Pulsante)
          const coreGlow = (Math.sin(now * 0.01) + 1) * 0.5;
          ctx.fillStyle = coreGlow > 0.5 ? '#fef08a' : '#ef4444';
          ctx.fillRect(-4, -4, 8, 8);

          ctx.restore();

          // Barra de Vida Superior del Jefe (Estilo Arcade Retro)
          const barW = 320;
          const barH = 16;
          const bx = Math.round(w / 2 - barW / 2);
          const by = 16;
          ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
          ctx.fillRect(bx, by, barW, barH);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, barW, barH);

          const hpPct = Math.max(0, en.hp / en.maxHp);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(bx + 2, by + 2, Math.round((barW - 4) * hpPct), barH - 4);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`💀 JEFE TITÁN GOLIATH Mk-IV [${Math.round(en.hp)} / ${en.maxHp}]`, w / 2, by + 12);

        } else if (en.type === 'tank') {
          // Tanque Blindado Mecha Pixel Art
          ctx.save();
          ctx.translate(ex, ey);
          const tankAngle = Math.atan2(this.player.y - ey, this.player.x - ex);
          ctx.rotate(tankAngle);

          // Orugas
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-14, -14, 28, 6);
          ctx.fillRect(-14, 8, 28, 6);

          // Casco blindado azul
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(-10, -8, 20, 16);
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(-6, -6, 12, 12);

          // Cañón largo
          ctx.fillStyle = '#64748b';
          ctx.fillRect(6, -2, 12, 4);
          ctx.restore();

          // Barra de vida
          const hpPct = Math.max(0, en.hp / en.maxHp);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ex - 12, ey - 18, 24, 3);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(ex - 12, ey - 18, Math.round(24 * hpPct), 3);

        } else if (en.type === 'trooper') {
          // Cibercrawler Arácnido Pixel Art
          ctx.save();
          ctx.translate(ex, ey);
          const crawlAngle = Math.atan2(this.player.y - ey, this.player.x - ex);
          ctx.rotate(crawlAngle);

          // Patas animadas
          const legSwing = Math.sin(now * 0.02) * 3;
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(-8, -12 + legSwing, 4, 4);
          ctx.fillRect(4, -12 - legSwing, 4, 4);
          ctx.fillRect(-8, 8 - legSwing, 4, 4);
          ctx.fillRect(4, 8 + legSwing, 4, 4);

          // Cuerpo púrpura
          ctx.fillStyle = '#581c87';
          ctx.fillRect(-8, -6, 16, 12);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(-4, -3, 8, 6);
          ctx.restore();

          // Barra de vida
          const hpPct = Math.max(0, en.hp / en.maxHp);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ex - 10, ey - 15, 20, 3);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(ex - 10, ey - 15, Math.round(20 * hpPct), 3);

        } else {
          // Dron Rastreador Volador Pixel Art
          const propFrame = Math.floor(now * 0.05) % 2;
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(ex - 8, ey - 8, 16, 16);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(ex - 5, ey - 5, 10, 10);

          // Ojo rojo central
          ctx.fillStyle = '#fee2e2';
          ctx.fillRect(ex - 2, ey - 2, 4, 4);

          // Aspas de propulsión pixeladas en cruz giratoria
          ctx.fillStyle = propFrame === 0 ? '#94a3b8' : '#cbd5e1';
          ctx.fillRect(ex - 10, ey - 10, 3, 3);
          ctx.fillRect(ex + 7, ey - 10, 3, 3);
          ctx.fillRect(ex - 10, ey + 7, 3, 3);
          ctx.fillRect(ex + 7, ey + 7, 3, 3);

          // Barra de vida
          const hpPct = Math.max(0, en.hp / en.maxHp);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ex - 10, ey - 14, 20, 3);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ex - 10, ey - 14, Math.round(20 * hpPct), 3);
        }
      });

      // 7. COMPAÑEROS DE ESCUADRÓN PIXEL ART (Bots y Amigos Co-op)
      this.teammates.forEach(m => {
        const mx = Math.round(m.x);
        const my = Math.round(m.y);

        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(m.angle || 0);

        // Armadura de soldado verde esmeralda
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#059669';
        ctx.fillRect(-7, -7, 14, 14);

        // Casco con visor verde
        ctx.fillStyle = '#34d399';
        ctx.fillRect(-3, -3, 6, 6);

        // Arma en mano
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(7, 1, 10, 4);
        ctx.restore();

        // Nombre y barra de vida
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(m.name, mx, my - 16);

        const mPct = Math.max(0, m.hp / (m.maxHp || 100));
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx - 12, my - 13, 24, 3);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(mx - 12, my - 13, Math.round(24 * mPct), 3);
      });

      // 8. EL JUGADOR PIXEL ART (Soldado Comandante)
      ctx.save();
      const px = Math.round(this.player.x);
      const py = Math.round(this.player.y);
      ctx.translate(px, py);
      ctx.rotate(this.player.angle);

      // Animación de botas al caminar
      const isMoving = this.keys.KeyW || this.keys.KeyA || this.keys.KeyS || this.keys.KeyD ||
                       this.keys.ArrowUp || this.keys.ArrowLeft || this.keys.ArrowDown || this.keys.ArrowRight;
      const stepOffset = isMoving ? Math.sin(now * 0.02) * 3 : 0;

      // Botas tácticas
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-11, -12 + stepOffset, 5, 4);
      ctx.fillRect(-11, 8 - stepOffset, 5, 4);

      // Hombreras y blindaje corporal
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-7, -7, 14, 14);

      // Casco táctico y visor cibernético brillante
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, -3, 5, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, -2, 2, 4);

      // Cañón del arma táctica seleccionada
      ctx.fillStyle = '#64748b';
      ctx.fillRect(6, 1, 12, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, 2, 7, 2);

      // Destello de disparo pixelado (Muzzle Flash) si disparó hace menos de 50ms
      if (now - this.player.lastShotTime < 50) {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(18, 0, 6, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(22, 1, 4, 4);
      }

      ctx.restore();

      // Placa de Nombre y Barra de Vida del Jugador
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Tú (${this.currentUser.name})`, px, py - 20);

      const pPct = Math.max(0, this.player.hp / this.player.maxHp);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 16, py - 16, 32, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(px - 16, py - 16, Math.round(32 * pPct), 4);

      // 9. PARTÍCULAS Y TEXTOS FLOTANTES
      this.particles.forEach(pt => {
        if (pt.isText) {
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${pt.size || 12}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(pt.text, Math.round(pt.x) + 1, Math.round(pt.y) + 1);
          ctx.fillStyle = pt.color;
          ctx.fillText(pt.text, Math.round(pt.x), Math.round(pt.y));
        } else {
          // Chispa pixel art cuadrada
          ctx.fillStyle = pt.color;
          const sz = pt.size || 3;
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y), sz, sz);
        }
      });

      ctx.restore();
    }

    updateStatsUi() {
      const h = this.container.querySelector('#esHp');
      if (h) h.textContent = `${Math.round(this.player.hp)}/100`;
      const c = this.container.querySelector('#esCredits');
      if (c) c.textContent = this.data.credits;
      const w = this.container.querySelector('#esWave');
      if (w) w.textContent = `${this.wave}/${this.maxWaves}`;
      const cr = this.container.querySelector('#esCrates');
      if (cr) cr.textContent = this.data.crates;
    }

    // --- Sistema de Apertura de Cajas Tácticas Cyber ---
    openCrateScreen() {
      const modal = this.container.querySelector('#esCrateModal');
      modal.classList.remove('hidden');

      const render = () => {
        modal.innerHTML = `
          <div class="cd-crate-dialog">
            <div class="crate-top">
              <h2>🎁 APERTURA DE CAJAS • COUNTER-STRIKE EDICIÓN EPICKAST</h2>
              <button id="esCloseCrates" class="cd-btn">✕ Volver a la Batalla</button>
            </div>

            <div class="crate-summary">
              <span>Tienes <b>${this.data.crates}</b> Caja(s) disponibles</span>
              <button id="esBtnBuyCrate" class="cd-btn small">+ Comprar Caja (150⚡)</button>
            </div>

            <!-- Ruleta Horizontal CS -->
            <div class="roulette-viewport">
              <div class="roulette-marker">▼</div>
              <div id="csTrack" class="roulette-track"></div>
            </div>

            <div class="crate-actions">
              <button id="csBtnSpin" class="cd-btn big gold" ${this.data.crates <= 0 ? 'disabled' : ''}>
                🔓 ABRIR CAJA (Girar Ruleta CS)
              </button>
            </div>

            <div id="csWinnerArea" class="crate-winner hidden"></div>

            <div class="inventory-section">
              <h3>🎒 Tu Armería y Skins Desbloqueadas</h3>
              <div class="inv-grid">
                ${SKINS.map(item => {
                  const isUnlocked = this.data.unlocked.includes(item.id);
                  const isEquipped = Object.values(this.data.equipped).includes(item.id);
                  const rarity = RARITY_MAP[item.rarity];
                  return `
                    <div class="inv-item ${isUnlocked ? '' : 'locked'}" style="border-color:${rarity.color}">
                      <div class="inv-rarity-badge" style="background:${rarity.color}">${rarity.name}</div>
                      <div class="inv-name" style="color:${item.color}">${item.name}</div>
                      <div class="inv-state">
                        ${isEquipped ? '<span class="badge-equipped">✓ EQUIPADO</span>' : (isUnlocked ? `<button class="btn-equip" data-id="${item.id}" data-type="${item.type}">Equipar</button>` : '🔒 Bloqueado')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;

        modal.querySelector('#esCloseCrates').onclick = () => modal.classList.add('hidden');

        modal.querySelector('#esBtnBuyCrate').onclick = () => {
          if (this.data.credits >= 150) {
            this.data.credits -= 150;
            this.data.crates += 1;
            saveGameData(this.data);
            this.updateStatsUi();
            AudioFX.coin();
            render();
          } else {
            AudioFX.tick();
            alert('¡Te faltan créditos! Supera oleadas o destruye enemigos para conseguir más ⚡.');
          }
        };

        modal.querySelectorAll('.btn-equip').forEach(btn => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            const type = btn.dataset.type;
            this.data.equipped[type] = id;
            saveGameData(this.data);
            AudioFX.coin();
            render();
          };
        });

        modal.querySelector('#csBtnSpin').onclick = () => this.spinRoulette(modal, render);
      };

      render();
    }

    spinRoulette(modal, renderCallback) {
      if (this.data.crates <= 0) return;
      this.data.crates -= 1;
      saveGameData(this.data);
      this.updateStatsUi();

      const btnSpin = modal.querySelector('#csBtnSpin');
      btnSpin.disabled = true;

      // Probabilidades reales estilo CS:GO
      const roll = Math.random() * 100;
      let wonRarity = 'milspec';
      if (roll < 0.26) wonRarity = 'gold';       // 0.26% Cuchillo / Dragon Lore
      else if (roll < 0.90) wonRarity = 'covert'; // 0.64% Rojo
      else if (roll < 4.10) wonRarity = 'classified'; // 3.2% Rosa
      else if (roll < 20.08) wonRarity = 'restricted'; // 15.98% Azul
      else wonRarity = 'milspec'; // 79.92% Común

      const eligible = SKINS.filter(s => s.rarity === wonRarity);
      const winner = eligible[Math.floor(Math.random() * eligible.length)] || SKINS[0];

      const track = modal.querySelector('#csTrack');
      track.style.transition = 'none';
      track.style.transform = 'translateX(0px)';

      const cards = [];
      const winnerIndex = 35;
      for (let i = 0; i < 45; i++) {
        cards.push(i === winnerIndex ? winner : SKINS[Math.floor(Math.random() * SKINS.length)]);
      }

      track.innerHTML = cards.map(item => {
        const rar = RARITY_MAP[item.rarity];
        return `
          <div class="roulette-card" style="border-bottom: 4px solid ${rar.color}">
            <div class="card-type">${item.type.toUpperCase()}</div>
            <div class="card-name" style="color:${item.color}">${item.name}</div>
          </div>
        `;
      }).join('');

      const cardWidth = 128;
      const targetOffset = (winnerIndex * cardWidth) - (320 - cardWidth / 2) + Math.floor(Math.random() * 30 - 15);

      // Sonido de ticker mecánico
      let elapsed = 0;
      let interval = 55;
      const tickLoop = () => {
        AudioFX.tick();
        elapsed += interval;
        interval = Math.pow(elapsed / 1000, 1.8) * 38 + 55;
        if (elapsed < 4600) setTimeout(tickLoop, interval);
      };
      tickLoop();

      setTimeout(() => {
        track.style.transition = 'transform 4.8s cubic-bezier(0.12, 0.82, 0.22, 1)';
        track.style.transform = `translateX(-${targetOffset}px)`;
      }, 50);

      setTimeout(() => {
        if (!this.data.unlocked.includes(winner.id)) this.data.unlocked.push(winner.id);
        this.data.equipped[winner.type] = winner.id;
        saveGameData(this.data);

        if (winner.rarity === 'gold') AudioFX.goldFanfare();
        else AudioFX.coin();

        const area = modal.querySelector('#csWinnerArea');
        const rar = RARITY_MAP[winner.rarity];
        area.innerHTML = `
          <div class="winner-box" style="border-color:${rar.color}">
            <span class="winner-badge" style="background:${rar.color}">${rar.name}</span>
            <h2 style="color:${winner.color}">${winner.name}</h2>
            <p>¡Obtenido y equipado con éxito en tu personaje!</p>
          </div>
        `;
        area.classList.remove('hidden');
        btnSpin.disabled = false;
        setTimeout(() => renderCallback(), 2600);
      }, 5000);
    }

    destroy() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('mouseup', this.onMouseUp);
      this.container.innerHTML = '';
    }
  }

  global.CyberDefenseGame = CyberDefenseGame;

})(window);
