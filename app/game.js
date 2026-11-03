// EpicKast: EpicStrike 2D • Co-op Arena Shooter & Cajas CS
// Shooter multijugador 2D de acción con WASD + Mouse, construcción de defensas, hordas, jefe titán y ruleta de cajas CS.
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
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.06);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g); g.connect(c.destination);
        osc.start(t); osc.stop(t + 0.22);
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

  // --- Catálogo de Armas y Skins estilo Counter-Strike ---
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
                <span class="cd-badge">v1.7.3</span>
              </div>
            </div>
            <div class="cd-stats">
              <div class="cd-stat">❤️ Salud: <b id="esHp">100/100</b></div>
              <div class="cd-stat">⚡ Créditos: <b id="esCredits">${this.data.credits}</b></div>
              <div class="cd-stat">🏆 Nivel: <b id="esWave">1/5</b></div>
              <div class="cd-stat">📦 Cajas: <b id="esCrates">${this.data.crates}</b></div>
            </div>
            <div class="cd-acts">
              <button id="esBtnBot" class="cd-btn" title="Añadir un bot aliado a tu escuadrón para probar el modo cooperativo">🤖 +Bot Aliado</button>
              <button id="esBtnCrate" class="cd-btn gold">🎁 Abrir Cajas CS</button>
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
      if (this.gameState === 'gameover') return;

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

      // 9. Verificar condición de victoria de la oleada
      if (this.enemiesSpawned >= this.enemiesTotalWave && this.enemies.length === 0) {
        this.gameState = 'cleared';
        this.data.crates += 1;
        this.data.credits += this.currentConfig.reward;
        saveGameData(this.data);
        this.updateStatsUi();
        AudioFX.goldFanfare();

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

      ctx.save();

      // Screen Shake
      if (this.shakeIntensity > 0.5) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        ctx.translate(sx, sy);
      }

      // Fondo oscuro cyberpunk con rejilla tecnológica
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#121826';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 36) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Muros y Torretas
      this.structures.forEach(st => {
        if (st.type === 'wall') {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(st.x - 14, st.y - 14, 28, 28);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(st.x - 14, st.y - 14, 28, 28);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('🧱', st.x, st.y + 4);
        } else {
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath(); ctx.arc(st.x, st.y, 14, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#c084fc';
          ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('🔫', st.x, st.y + 4);
        }
      });

      // Balas del jugador
      this.bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.isPlasma ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Balas de enemigos
      this.enemyBullets.forEach(eb => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(eb.x, eb.y, 3.5, 0, Math.PI * 2); ctx.fill();
      });

      // Enemigos
      this.enemies.forEach(en => {
        if (en.type === 'boss') {
          // Jefe Titán Goliath
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.stroke();

          ctx.fillStyle = '#fee2e2';
          ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('GOLIATH', en.x, en.y + 4);

          // Barra de vida superior del Jefe
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(w / 2 - 140, 16, 280, 14);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(w / 2 - 138, 18, 276 * (en.hp / en.maxHp), 10);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          ctx.strokeRect(w / 2 - 140, 16, 280, 14);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
          ctx.fillText(`JEFE TITÁN: ${Math.round(en.hp)} / ${en.maxHp}`, w / 2, 26);
        } else {
          ctx.fillStyle = en.type === 'tank' ? '#312e81' : (en.type === 'trooper' ? '#701a75' : '#831843');
          ctx.beginPath(); ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = en.type === 'tank' ? '#818cf8' : '#f43f5e';
          ctx.lineWidth = 1.5; ctx.stroke();

          // Barra de vida pequeña
          const pct = Math.max(0, en.hp / en.maxHp);
          ctx.fillStyle = '#ef4444'; ctx.fillRect(en.x - 10, en.y - en.radius - 6, 20, 3);
          ctx.fillStyle = '#22c55e'; ctx.fillRect(en.x - 10, en.y - en.radius - 6, 20 * pct, 3);
        }
      });

      // Compañeros (Co-op)
      this.teammates.forEach(m => {
        ctx.fillStyle = '#059669';
        ctx.beginPath(); ctx.arc(m.x, m.y, 13, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(m.name, m.x, m.y - 18);
      });

      // Jugador
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.player.angle);

      // Cuerpo del agente
      ctx.fillStyle = '#2563eb';
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.stroke();

      // Cañón del arma
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, -3, 14, 6);

      ctx.restore();

      // Nombre y barra de vida sobre el jugador
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`Tú (${this.currentUser.name})`, this.player.x, this.player.y - 20);

      const pPct = Math.max(0, this.player.hp / this.player.maxHp);
      ctx.fillStyle = '#ef4444'; ctx.fillRect(this.player.x - 14, this.player.y - 16, 28, 4);
      ctx.fillStyle = '#10b981'; ctx.fillRect(this.player.x - 14, this.player.y - 16, 28 * pPct, 4);

      // Partículas y Textos
      this.particles.forEach(pt => {
        if (pt.isText) {
          ctx.fillStyle = pt.color;
          ctx.font = `bold ${pt.size || 12}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2); ctx.fill();
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

    // --- Sistema de Apertura de Cajas CS:GO ---
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
