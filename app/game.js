// EpicKast: Cyber Squad Defense & Cajas CS
// Minijuego multijugador ultraligero (<3MB RAM, Canvas 2D puro, audio sintetizado con Web Audio)

(function(global) {
  'use strict';

  // --- Sistema de Audio Sintetizado (Zero Assets, Zero Latencia) ---
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
    tick() {
      const c = this.getCtx();
      if (!c) return;
      try {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.04);
        g.gain.setValueAtTime(0.2, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
        osc.connect(g);
        g.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.05);
      } catch {}
    },
    laser() {
      const c = this.getCtx();
      if (!c) return;
      try {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.09);
        g.gain.setValueAtTime(0.12, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
        osc.connect(g);
        g.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.1);
      } catch {}
    },
    boom() {
      const c = this.getCtx();
      if (!c) return;
      try {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.35);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
        osc.connect(g);
        g.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.4);
      } catch {}
    },
    build() {
      const c = this.getCtx();
      if (!c) return;
      try {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(640, c.currentTime + 0.12);
        g.gain.setValueAtTime(0.15, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
        osc.connect(g);
        g.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + 0.15);
      } catch {}
    },
    goldFanfare() {
      const c = this.getCtx();
      if (!c) return;
      try {
        const t = c.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        notes.forEach((f, i) => {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.1);
          g.gain.setValueAtTime(0.001, t + i * 0.1);
          g.gain.linearRampToValueAtTime(0.25, t + i * 0.1 + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.6);
          osc.connect(g);
          g.connect(c.destination);
          osc.start(t + i * 0.1);
          osc.stop(t + i * 0.1 + 0.7);
        });
      } catch {}
    }
  };

  // --- Base de Datos de Cajas e Ítems estilo Counter-Strike ---
  const SKINS_CATALOG = [
    // ⚪ Mil-Spec / Común (Gris/Azul claro)
    { id: 'm_steel', name: 'Muro de Acero Táctico', type: 'wall', rarity: 'milspec', color: '#94a3b8', bg: '#334155' },
    { id: 't_rusty', name: 'Torreta Oxidada Rust', type: 'turret', rarity: 'milspec', color: '#cbd5e1', bg: '#475569' },
    { id: 'g_diesel', name: 'Generador Diésel Vintage', type: 'solar', rarity: 'milspec', color: '#a1a1aa', bg: '#3f3f46' },

    // 🔵 Restricted / Raro (Azul eléctrico)
    { id: 'm_graphene', name: 'Muro de Grafeno Reforzado', type: 'wall', rarity: 'restricted', color: '#38bdf8', bg: '#0369a1' },
    { id: 't_cobalt', name: 'Torreta Centinela Blue Cobalt', type: 'turret', rarity: 'restricted', color: '#60a5fa', bg: '#1d4ed8' },
    { id: 't_frost', name: 'Torreta Criogénica Frostbite', type: 'tesla', rarity: 'restricted', color: '#7dd3fc', bg: '#0284c7' },

    // 🟣 Classified / Épico (Púrpura Neón)
    { id: 't_electro', name: 'Torreta Tesla Neón Púrpura', type: 'tesla', rarity: 'classified', color: '#c084fc', bg: '#7e22ce' },
    { id: 'p_cyber', name: 'Cañón de Plasma Cyberpunk 2077', type: 'plasma', rarity: 'classified', color: '#f472b6', bg: '#be185d' },
    { id: 'm_nano', name: 'Muro Nano-Cristal Translúcido', type: 'wall', rarity: 'classified', color: '#e879f9', bg: '#a21caf' },

    // 🔴 Covert / Legendario (Rojo Fuego)
    { id: 'p_hyperbeast', name: 'Cañón de Plasma HyperBeast', type: 'plasma', rarity: 'covert', color: '#f43f5e', bg: '#9f1239' },
    { id: 't_asiimov', name: 'Torreta de Asalto Asiimov', type: 'turret', rarity: 'covert', color: '#fb923c', bg: '#c2410c' },
    { id: 'm_vulcan', name: 'Muro Blindado Vulcanite', type: 'wall', rarity: 'covert', color: '#ef4444', bg: '#b91c1c' },

    // 🟡 ★ ESPECIAL EXTRAORDINARIO (Dorado - Cuchillo / Dragon Lore)
    { id: 'knife_karambit', name: '★ Cuchillo Karambit EpicKast', type: 'knife', rarity: 'gold', color: '#fbbf24', bg: '#b45309', badge: '★ Karambit' },
    { id: 'knife_butterfly', name: '★ Cuchillo Mariposa Neón Fade', type: 'knife', rarity: 'gold', color: '#f59e0b', bg: '#d97706', badge: '★ Mariposa' },
    { id: 't_dragonlore', name: '★ Torreta Dragón Lore Dorada', type: 'turret', rarity: 'gold', color: '#fde047', bg: '#ca8a04', badge: '★ Dragón Lore' }
  ];

  const RARITY_INFO = {
    milspec: { name: 'Común (Mil-Spec)', color: '#4b69ff', text: '#cbd5e1' },
    restricted: { name: 'Raro (Restricted)', color: '#8847ff', text: '#e0e7ff' },
    classified: { name: 'Épico (Classified)', color: '#d32ce6', text: '#f5d0fe' },
    covert: { name: 'Legendario (Covert)', color: '#eb4b4b', text: '#ffe4e6' },
    gold: { name: '★ ESPECIAL EXTRAORDINARIO ★', color: '#ffd700', text: '#fef08a' }
  };

  const CRATES = [
    { id: 'classic', name: 'Caja Clásica EpicKast', icon: '📦', cost: 100 },
    { id: 'neon', name: 'Caja Cíber-Asalto Neón', icon: '🎁', cost: 200 },
    { id: 'elite', name: 'Caja Élite Dragón CS', icon: '⭐', cost: 350 }
  ];

  // --- Almacenamiento Local de Inventario ---
  function getInventory() {
    try {
      const raw = localStorage.getItem('epickast_game_inv');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      credits: 200,
      crates: 1,
      unlocked: ['m_steel', 't_rusty'],
      equipped: { wall: 'm_steel', turret: 't_rusty', tesla: null, plasma: null, knife: null },
      stats: { wavesCleared: 0, kills: 0, cratesOpened: 0 }
    };
  }

  function saveInventory(inv) {
    try {
      localStorage.setItem('epickast_game_inv', JSON.stringify(inv));
    } catch {}
  }

  // --- Motor Principal del Minijuego (Squad Defense) ---
  class CyberDefenseGame {
    constructor(container, socket, roomKey, currentUser) {
      this.container = container;
      this.socket = socket;
      this.roomKey = roomKey || 'room_default';
      this.currentUser = currentUser || { name: 'Jugador', id: 'p1' };
      this.inv = getInventory();

      this.running = false;
      this.animId = null;

      // Estado del Juego
      this.gridSize = 12;
      this.cellSize = 36;
      this.coreHp = 1000;
      this.maxCoreHp = 1000;
      this.wave = 1;
      this.maxWaves = 5;
      this.waveState = 'prep'; // 'prep', 'running', 'cleared', 'gameover'
      this.waveTimeLeft = 0;
      this.enemiesToSpawn = 0;
      this.spawnTimer = 0;

      // Entidades
      this.buildings = []; // { x, y, type, hp, maxHp, level, user, skin, lastShot }
      this.enemies = []; // { x, y, hp, maxHp, speed, reward, type, radius }
      this.projectiles = []; // { x, y, tx, ty, speed, dmg, color }
      this.particles = []; // { x, y, vx, vy, life, maxLife, color }

      // Construcción seleccionada por el jugador
      this.selectedTool = 'turret'; // 'wall', 'turret', 'tesla', 'plasma', 'solar'

      this.initDom();
      this.bindSocket();
      this.startLoop();
    }

    initDom() {
      this.container.innerHTML = `
        <div class="cd-wrap">
          <div class="cd-header">
            <div class="cd-title">
              <span class="cd-ico">🎮</span>
              <div>
                <strong>Cyber Squad Defense</strong>
                <span class="cd-badge">v1.7.2 Co-op</span>
              </div>
            </div>
            <div class="cd-stats">
              <div class="cd-stat">🛡️ Núcleo: <b id="cdCoreHp">${this.coreHp}/${this.maxCoreHp}</b></div>
              <div class="cd-stat">⚡ Créditos: <b id="cdCredits">${this.inv.credits}</b></div>
              <div class="cd-stat">🏆 Oleada: <b id="cdWave">${this.wave}/${this.maxWaves}</b></div>
              <div class="cd-stat">📦 Cajas: <b id="cdCrates">${this.inv.crates}</b></div>
            </div>
            <div class="cd-acts">
              <button id="cdBtnCrate" class="cd-btn gold">🎁 Abrir Cajas CS</button>
              <button id="cdBtnClose" class="cd-btn">✕ Salir</button>
            </div>
          </div>

          <div class="cd-main">
            <div class="cd-canvas-box">
              <canvas id="cdCanvas" width="${this.gridSize * this.cellSize}" height="${this.gridSize * this.cellSize}"></canvas>
              <div id="cdWaveOverlay" class="cd-wave-overlay">
                <div class="cd-overlay-box">
                  <h2 id="cdOverlayTitle">Nivel 1: Incursión Inicial</h2>
                  <p id="cdOverlayDesc">Construye defensas alrededor del Núcleo del Servidor y sobrevive a los drones enemigos.</p>
                  <button id="cdBtnStartWave" class="cd-btn big primary">⚔️ Iniciar Oleada</button>
                </div>
              </div>
            </div>

            <div class="cd-sidebar">
              <h3>🛠️ Taller de Construcción</h3>
              <div class="cd-tools">
                <button class="cd-tool active" data-type="wall">
                  <div class="tool-ico">🧱</div>
                  <div class="tool-info"><b>Muro de Escudo</b><span>50 ⚡ • 500 HP</span></div>
                </button>
                <button class="cd-tool" data-type="turret">
                  <div class="tool-ico">🔫</div>
                  <div class="tool-info"><b>Torreta Centinela</b><span>100 ⚡ • Ataque Rápido</span></div>
                </button>
                <button class="cd-tool" data-type="tesla">
                  <div class="tool-ico">⚡</div>
                  <div class="tool-info"><b>Torreta Tesla</b><span>150 ⚡ • Ralentiza Área</span></div>
                </button>
                <button class="cd-tool" data-type="plasma">
                  <div class="tool-ico">💥</div>
                  <div class="tool-info"><b>Cañón Plasma</b><span>200 ⚡ • Daño Masivo</span></div>
                </button>
                <button class="cd-tool" data-type="solar">
                  <div class="tool-ico">🔋</div>
                  <div class="tool-info"><b>Módulo Cuántico</b><span>75 ⚡ • +15⚡ cada 5s</span></div>
                </button>
              </div>

              <div class="cd-objectives">
                <h4>🎯 Misiones del Nivel</h4>
                <div id="cdObjText" class="obj-text">• Construye al menos 2 torretas de defensa.<br>• Destruye a los drones sin que el núcleo caiga.<br>• Recompensa: +150 ⚡ y 1x Caja Clásica CS.</div>
              </div>

              <div class="cd-equipped-card">
                <h4>✨ Tu Skin Equipada</h4>
                <div id="cdEquippedPreview" class="equipped-preview">Cargando skin...</div>
              </div>
            </div>
          </div>
        </div>
        <div id="cdCrateModal" class="cd-crate-modal hidden"></div>
      `;

      this.canvas = this.container.querySelector('#cdCanvas');
      this.ctx = this.canvas.getContext('2d');

      // Eventos UI
      this.container.querySelectorAll('.cd-tool').forEach(btn => {
        btn.onclick = () => {
          this.container.querySelectorAll('.cd-tool').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedTool = btn.dataset.type;
        };
      });

      this.container.querySelector('#cdBtnStartWave').onclick = () => this.startWave();
      this.container.querySelector('#cdBtnCrate').onclick = () => this.openCrateScreen();
      this.container.querySelector('#cdBtnClose').onclick = () => this.destroy();

      this.canvas.onclick = (e) => this.handleCanvasClick(e);

      this.updateEquippedDisplay();
      this.centerServerCore();
    }

    centerServerCore() {
      const mid = Math.floor(this.gridSize / 2);
      // Colocar Núcleo Central
      this.buildings.push({
        x: mid - 1, y: mid - 1, type: 'core', w: 2, h: 2,
        hp: this.coreHp, maxHp: this.maxCoreHp, user: 'Servidor', skin: null
      });
    }

    bindSocket() {
      if (!this.socket) return;
      this.onSocketMsg = (d) => {
        if (d?.t === 'game.event' && d.action) {
          this.handleRemoteAction(d.action, d.from);
        }
      };
      // Escucha mensajes del socket
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

    handleRemoteAction(act, fromUser) {
      if (act.type === 'build') {
        this.buildings.push({
          x: act.x, y: act.y, type: act.buildingType,
          hp: act.hp, maxHp: act.maxHp, level: act.level || 1,
          user: fromUser || act.user, skin: act.skin
        });
        AudioFX.build();
        this.spawnTextFloat(act.x * this.cellSize + 18, act.y * this.cellSize, `${fromUser || 'Aliado'} construyó`);
      } else if (act.type === 'start_wave') {
        this.startWave(true);
      }
    }

    handleCanvasClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const gx = Math.floor(clickX / this.cellSize);
      const gy = Math.floor(clickY / this.cellSize);

      if (gx < 0 || gx >= this.gridSize || gy < 0 || gy >= this.gridSize) return;

      // Verificar si ya hay edificio en esa casilla
      const existing = this.buildings.find(b => {
        if (b.type === 'core') {
          return gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h;
        }
        return b.x === gx && b.y === gy;
      });

      if (existing) {
        if (existing.type !== 'core' && existing.level < 3 && this.inv.credits >= 80) {
          // Mejorar edificio
          this.inv.credits -= 80;
          existing.level = (existing.level || 1) + 1;
          existing.hp = Math.min(existing.hp + 200, existing.maxHp * 1.5);
          saveInventory(this.inv);
          this.updateStatsUi();
          AudioFX.build();
          this.spawnTextFloat(gx * this.cellSize + 18, gy * this.cellSize, `Nivel ${existing.level}!`);
        }
        return;
      }

      // Costos por herramienta
      const costs = { wall: 50, turret: 100, tesla: 150, plasma: 200, solar: 75 };
      const maxHps = { wall: 600, turret: 300, tesla: 250, plasma: 350, solar: 200 };
      const cost = costs[this.selectedTool] || 100;

      if (this.inv.credits < cost) {
        AudioFX.tick();
        this.spawnTextFloat(clickX, clickY, '¡Faltan créditos ⚡!');
        return;
      }

      this.inv.credits -= cost;
      saveInventory(this.inv);
      this.updateStatsUi();
      AudioFX.build();

      const equippedSkinId = this.inv.equipped[this.selectedTool];
      const skinObj = SKINS_CATALOG.find(s => s.id === equippedSkinId) || null;

      const newBuilding = {
        x: gx, y: gy, type: this.selectedTool,
        hp: maxHps[this.selectedTool], maxHp: maxHps[this.selectedTool],
        level: 1, user: this.currentUser.name, skin: skinObj, lastShot: 0
      };

      this.buildings.push(newBuilding);

      // Transmitir a compañeros en la sala
      this.sendAction({
        type: 'build',
        x: gx, y: gy,
        buildingType: this.selectedTool,
        hp: newBuilding.hp,
        maxHp: newBuilding.maxHp,
        user: this.currentUser.name,
        skin: skinObj
      });
    }

    startWave(fromRemote = false) {
      if (this.waveState === 'running') return;
      this.waveState = 'running';
      this.container.querySelector('#cdWaveOverlay').classList.add('hidden');

      if (!fromRemote) {
        this.sendAction({ type: 'start_wave', wave: this.wave });
      }

      // Configuración según el Nivel
      const waveConfigs = [
        { count: 12, hp: 50, speed: 0.8, type: 'drone' },
        { count: 20, hp: 90, speed: 1.1, type: 'runner' },
        { count: 28, hp: 160, speed: 0.7, type: 'tank' },
        { count: 1, hp: 3500, speed: 0.4, type: 'boss' }, // Nivel 4 Boss
        { count: 45, hp: 220, speed: 1.2, type: 'elite' } // Nivel 5 Endless
      ];

      const cfg = waveConfigs[Math.min(this.wave - 1, waveConfigs.length - 1)];
      this.enemiesToSpawn = cfg.count;
      this.currentEnemyCfg = cfg;
      this.spawnTimer = 0;
    }

    spawnEnemy() {
      if (this.enemiesToSpawn <= 0) return;
      this.enemiesToSpawn--;

      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      const maxPx = this.gridSize * this.cellSize;

      if (side === 0) { x = Math.random() * maxPx; y = 0; }
      else if (side === 1) { x = maxPx; y = Math.random() * maxPx; }
      else if (side === 2) { x = Math.random() * maxPx; y = maxPx; }
      else { x = 0; y = Math.random() * maxPx; }

      const isBoss = this.currentEnemyCfg.type === 'boss';

      this.enemies.push({
        x, y,
        hp: this.currentEnemyCfg.hp,
        maxHp: this.currentEnemyCfg.hp,
        speed: this.currentEnemyCfg.speed,
        type: this.currentEnemyCfg.type,
        radius: isBoss ? 20 : 8,
        reward: isBoss ? 400 : 15
      });
    }

    spawnTextFloat(x, y, text, color = '#38bdf8') {
      this.particles.push({
        x, y, vx: (Math.random() - 0.5) * 0.5, vy: -1.2,
        life: 0, maxLife: 50, text, color, isText: true
      });
    }

    spawnExplosion(x, y, color = '#f97316', count = 10) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 2.5;
        this.particles.push({
          x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          life: 0, maxLife: 25 + Math.random() * 15, color, isText: false
        });
      }
    }

    startLoop() {
      this.running = true;
      let lastTime = performance.now();

      const step = (now) => {
        if (!this.running) return;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        this.update(dt);
        this.render();

        this.animId = requestAnimationFrame(step);
      };

      this.animId = requestAnimationFrame(step);
    }

    update(dt) {
      const mid = (this.gridSize * this.cellSize) / 2;

      // 1. Spawning
      if (this.waveState === 'running' && this.enemiesToSpawn > 0) {
        this.spawnTimer += dt;
        if (this.spawnTimer > (this.currentEnemyCfg.type === 'boss' ? 1.0 : 0.8)) {
          this.spawnTimer = 0;
          this.spawnEnemy();
        }
      }

      // 2. Módulos Cuánticos / Solares generan créditos pasivos
      this.buildings.forEach(b => {
        if (b.type === 'solar') {
          b.timer = (b.timer || 0) + dt;
          if (b.timer >= 5) {
            b.timer = 0;
            this.inv.credits += 15 * (b.level || 1);
            saveInventory(this.inv);
            this.updateStatsUi();
            this.spawnTextFloat(b.x * this.cellSize + 18, b.y * this.cellSize, '+15 ⚡', '#10b981');
          }
        }
      });

      // 3. Torretas disparan a enemigos
      const nowMs = performance.now();
      this.buildings.forEach(b => {
        if (b.type === 'turret' || b.type === 'tesla' || b.type === 'plasma') {
          const cd = b.type === 'turret' ? 450 : (b.type === 'tesla' ? 700 : 1200);
          if (nowMs - (b.lastShot || 0) >= cd) {
            const bx = b.x * this.cellSize + 18;
            const by = b.y * this.cellSize + 18;
            const range = (b.type === 'plasma' ? 180 : 130) + (b.level - 1) * 25;

            // Buscar enemigo más cercano
            let target = null;
            let minDist = range;
            for (const en of this.enemies) {
              const d = Math.hypot(en.x - bx, en.y - by);
              if (d < minDist) {
                minDist = d;
                target = en;
              }
            }

            if (target) {
              b.lastShot = nowMs;
              const dmg = (b.type === 'plasma' ? 90 : (b.type === 'tesla' ? 35 : 25)) * (b.level || 1);
              const color = b.skin?.color || (b.type === 'plasma' ? '#f43f5e' : (b.type === 'tesla' ? '#a855f7' : '#38bdf8'));

              this.projectiles.push({
                x: bx, y: by, tx: target.x, ty: target.y,
                target, speed: 380, dmg, color, type: b.type
              });

              AudioFX.laser();
            }
          }
        }
      });

      // 4. Proyectiles avanzan
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10 || !p.target || p.target.hp <= 0) {
          // Impacto
          if (p.target && p.target.hp > 0) {
            p.target.hp -= p.dmg;
            if (p.type === 'tesla') p.target.speed *= 0.6; // Ralentizar
            this.spawnTextFloat(p.tx, p.ty, `-${p.dmg}`, p.color);
            this.spawnExplosion(p.tx, p.ty, p.color, 4);
          }
          this.projectiles.splice(i, 1);
        } else {
          p.x += (dx / dist) * p.speed * dt;
          p.y += (dy / dist) * p.speed * dt;
        }
      }

      // 5. Enemigos avanzan hacia el Núcleo y atacan muros
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const en = this.enemies[i];
        if (en.hp <= 0) {
          // Destruido
          AudioFX.boom();
          this.spawnExplosion(en.x, en.y, '#eab308', 12);
          this.inv.credits += en.reward;
          this.inv.stats.kills++;
          saveInventory(this.inv);
          this.updateStatsUi();
          this.enemies.splice(i, 1);
          continue;
        }

        // Buscar si colisiona con un muro
        const egx = Math.floor(en.x / this.cellSize);
        const egy = Math.floor(en.y / this.cellSize);
        const blocker = this.buildings.find(b => b.x === egx && b.y === egy && b.type !== 'core');

        if (blocker) {
          blocker.hp -= 25 * dt;
          if (blocker.hp <= 0) {
            AudioFX.boom();
            this.spawnExplosion(en.x, en.y, '#ef4444', 15);
            this.buildings = this.buildings.filter(b => b !== blocker);
          }
        } else {
          // Avanzar hacia el centro (Núcleo)
          const dx = mid - en.x;
          const dy = mid - en.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 32) {
            // Dañar el núcleo
            this.coreHp -= en.type === 'boss' ? 80 * dt : 15 * dt;
            this.updateStatsUi();
            if (this.coreHp <= 0) {
              this.coreHp = 0;
              this.waveState = 'gameover';
              this.showWaveOverlay('¡NÚCLEO DESTRUIDO!', 'Las defensas cayeron. Vuelve a intentarlo.', 'Reiniciar');
            }
          } else {
            en.x += (dx / dist) * en.speed * 60 * dt;
            en.y += (dy / dist) * en.speed * 60 * dt;
          }
        }
      }

      // 6. Verificar si la oleada fue superada
      if (this.waveState === 'running' && this.enemiesToSpawn <= 0 && this.enemies.length === 0) {
        this.waveState = 'cleared';
        this.inv.crates += 1;
        this.inv.credits += 150 * this.wave;
        this.inv.stats.wavesCleared++;
        saveInventory(this.inv);
        this.updateStatsUi();
        AudioFX.goldFanfare();

        if (this.wave >= this.maxWaves) {
          this.showWaveOverlay('🎉 ¡VICTORIA TOTAL!', '¡Tu escuadrón defendió la base con éxito! Has ganado 2x Cajas Élite.', 'Jugar de nuevo');
          this.inv.crates += 1;
          saveInventory(this.inv);
        } else {
          this.showWaveOverlay(
            `¡OLEADA ${this.wave} SUPERADA!`,
            `Recompensa: +${150 * this.wave} ⚡ y 1x Caja de Botín CS entregada a tu inventario.`,
            `Comenzar Oleada ${this.wave + 1}`
          );
          this.wave++;
        }
      }

      // 7. Partículas
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life++;
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.life >= pt.maxLife) {
          this.particles.splice(i, 1);
        }
      }
    }

    render() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Fondo oscuro cyberpunk
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      // Rejilla
      ctx.strokeStyle = '#1e2638';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += this.cellSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += this.cellSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Edificios
      this.buildings.forEach(b => {
        const bx = b.x * this.cellSize;
        const by = b.y * this.cellSize;

        if (b.type === 'core') {
          // Núcleo
          const cw = b.w * this.cellSize;
          const ch = b.h * this.cellSize;
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(bx, by, cw, ch);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx + 4, by + 4, cw - 8, ch - 8);

          ctx.fillStyle = '#818cf8';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('NÚCLEO', bx + cw / 2, by + ch / 2 - 2);
          ctx.fillText('SERVIDOR', bx + cw / 2, by + ch / 2 + 12);
        } else {
          // Defensas
          const skinCol = b.skin?.color || '#38bdf8';
          const bgCol = b.skin?.bg || '#1e293b';

          ctx.fillStyle = bgCol;
          ctx.fillRect(bx + 2, by + 2, this.cellSize - 4, this.cellSize - 4);
          ctx.strokeStyle = skinCol;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(bx + 2, by + 2, this.cellSize - 4, this.cellSize - 4);

          // Icono o diseño
          ctx.fillStyle = skinCol;
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          const icon = b.type === 'wall' ? '🧱' : (b.type === 'turret' ? '🔫' : (b.type === 'tesla' ? '⚡' : (b.type === 'plasma' ? '💥' : '🔋')));
          ctx.fillText(icon, bx + this.cellSize / 2, by + this.cellSize / 2 + 5);

          // Barra de vida
          const hpPct = Math.max(0, b.hp / b.maxHp);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bx + 4, by + this.cellSize - 6, this.cellSize - 8, 3);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(bx + 4, by + this.cellSize - 6, (this.cellSize - 8) * hpPct, 3);

          if (b.level > 1) {
            ctx.fillStyle = '#fde047';
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(`★${b.level}`, bx + this.cellSize - 8, by + 10);
          }
        }
      });

      // Proyectiles
      this.projectiles.forEach(p => {
        ctx.fillStyle = p.color || '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === 'plasma' ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Enemigos
      this.enemies.forEach(en => {
        ctx.fillStyle = en.type === 'boss' ? '#ef4444' : (en.type === 'runner' ? '#f59e0b' : '#a855f7');
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Barra de vida del enemigo
        const enHpPct = Math.max(0, en.hp / en.maxHp);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(en.x - 12, en.y - en.radius - 8, 24, 3);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(en.x - 12, en.y - en.radius - 8, 24 * enHpPct, 3);
      });

      // Partículas y Textos flotantes
      this.particles.forEach(pt => {
        if (pt.isText) {
          ctx.fillStyle = pt.color || '#fff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color || '#f97316';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    showWaveOverlay(title, desc, btnText) {
      const o = this.container.querySelector('#cdWaveOverlay');
      this.container.querySelector('#cdOverlayTitle').textContent = title;
      this.container.querySelector('#cdOverlayDesc').textContent = desc;
      const b = this.container.querySelector('#cdBtnStartWave');
      b.textContent = btnText;
      o.classList.remove('hidden');
    }

    updateStatsUi() {
      const ch = this.container.querySelector('#cdCoreHp');
      if (ch) ch.textContent = `${Math.round(this.coreHp)}/${this.maxCoreHp}`;
      const cc = this.container.querySelector('#cdCredits');
      if (cc) cc.textContent = this.inv.credits;
      const cw = this.container.querySelector('#cdWave');
      if (cw) cw.textContent = `${this.wave}/${this.maxWaves}`;
      const cr = this.container.querySelector('#cdCrates');
      if (cr) cr.textContent = this.inv.crates;
    }

    updateEquippedDisplay() {
      const el = this.container.querySelector('#cdEquippedPreview');
      if (!el) return;
      const tSkin = SKINS_CATALOG.find(s => s.id === this.inv.equipped.turret);
      const wSkin = SKINS_CATALOG.find(s => s.id === this.inv.equipped.wall);
      el.innerHTML = `
        <div style="font-size:12px;display:flex;flex-direction:column;gap:4px">
          <div>🔫 Torreta: <b style="color:${tSkin?.color || '#fff'}">${tSkin?.name || 'Estándar'}</b></div>
          <div>🧱 Muro: <b style="color:${wSkin?.color || '#fff'}">${wSkin?.name || 'Estándar'}</b></div>
        </div>
      `;
    }

    // --- Sistema de Apertura de Cajas Estilo Counter-Strike ---
    openCrateScreen() {
      const modal = this.container.querySelector('#cdCrateModal');
      modal.classList.remove('hidden');

      const renderModal = () => {
        modal.innerHTML = `
          <div class="cd-crate-dialog">
            <div class="crate-top">
              <h2>🎁 APERTURA DE CAJAS • COUNTER-STRIKE EDICIÓN EPICKAST</h2>
              <button id="cdCloseCrates" class="cd-btn">✕ Cerrar</button>
            </div>

            <div class="crate-summary">
              <span>Tienes <b>${this.inv.crates}</b> Caja(s) disponibles</span>
              <button id="cdBtnBuyCrate" class="cd-btn small">+ Comprar Caja (150⚡)</button>
            </div>

            <!-- Carrusel de Ruleta CS -->
            <div class="roulette-viewport">
              <div class="roulette-marker">▼</div>
              <div id="rouletteTrack" class="roulette-track"></div>
            </div>

            <div class="crate-actions">
              <button id="cdBtnRoll" class="cd-btn big gold" ${this.inv.crates <= 0 ? 'disabled' : ''}>
                🔓 ABRIR CAJA (Girar Ruleta)
              </button>
            </div>

            <div id="crateWinnerArea" class="crate-winner hidden"></div>

            <div class="inventory-section">
              <h3>🎒 Tu Inventario de Skins y Armas</h3>
              <div class="inv-grid">
                ${SKINS_CATALOG.map(item => {
                  const isUnlocked = this.inv.unlocked.includes(item.id);
                  const isEquipped = Object.values(this.inv.equipped).includes(item.id);
                  const rarity = RARITY_INFO[item.rarity];
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

        modal.querySelector('#cdCloseCrates').onclick = () => {
          modal.classList.add('hidden');
          this.updateEquippedDisplay();
        };

        modal.querySelector('#cdBtnBuyCrate').onclick = () => {
          if (this.inv.credits >= 150) {
            this.inv.credits -= 150;
            this.inv.crates += 1;
            saveInventory(this.inv);
            this.updateStatsUi();
            AudioFX.build();
            renderModal();
          } else {
            AudioFX.tick();
            alert('¡No tienes suficientes créditos! Supera oleadas para ganar más ⚡.');
          }
        };

        modal.querySelectorAll('.btn-equip').forEach(btn => {
          btn.onclick = () => {
            const id = btn.dataset.id;
            const type = btn.dataset.type;
            this.inv.equipped[type] = id;
            saveInventory(this.inv);
            AudioFX.build();
            renderModal();
          };
        });

        modal.querySelector('#cdBtnRoll').onclick = () => this.spinCsRoulette(modal, renderModal);
      };

      renderModal();
    }

    spinCsRoulette(modal, renderModal) {
      if (this.inv.crates <= 0) return;
      this.inv.crates -= 1;
      this.inv.stats.cratesOpened++;
      saveInventory(this.inv);
      this.updateStatsUi();

      const btnRoll = modal.querySelector('#cdBtnRoll');
      btnRoll.disabled = true;

      // Calcular el ítem ganador según probabilidades reales estilo CS:GO
      const roll = Math.random() * 100;
      let winningRarity = 'milspec';
      if (roll < 0.26) winningRarity = 'gold'; // 0.26% Cuchillo / Dragon Lore
      else if (roll < 0.90) winningRarity = 'covert'; // 0.64% Rojo Covert
      else if (roll < 4.10) winningRarity = 'classified'; // 3.2% Rosa
      else if (roll < 20.08) winningRarity = 'restricted'; // 15.98% Azul
      else winningRarity = 'milspec'; // 79.92% Común

      const eligible = SKINS_CATALOG.filter(s => s.rarity === winningRarity);
      const winner = eligible[Math.floor(Math.random() * eligible.length)] || SKINS_CATALOG[0];

      // Generar 45 cartas para la ruleta
      const track = modal.querySelector('#rouletteTrack');
      track.style.transition = 'none';
      track.style.transform = 'translateX(0px)';

      const cards = [];
      const winnerIndex = 36; // La carta ganadora estará en la posición 36

      for (let i = 0; i < 45; i++) {
        if (i === winnerIndex) {
          cards.push(winner);
        } else {
          // Items aleatorios decorativos
          const r = SKINS_CATALOG[Math.floor(Math.random() * SKINS_CATALOG.length)];
          cards.push(r);
        }
      }

      track.innerHTML = cards.map(item => {
        const rar = RARITY_INFO[item.rarity];
        return `
          <div class="roulette-card" style="border-bottom: 4px solid ${rar.color}">
            <div class="card-type">${item.type.toUpperCase()}</div>
            <div class="card-name" style="color:${item.color}">${item.name}</div>
          </div>
        `;
      }).join('');

      // Calcular desplazamiento exacto (cada carta tiene 120px de ancho + 8px gap)
      const cardWidth = 128;
      const targetOffset = (winnerIndex * cardWidth) - (320 - cardWidth / 2) + Math.floor(Math.random() * 40 - 20);

      // Reproducir sonido mecánico tipo ticker CS
      let tickInterval = 60;
      let tickTimer = null;
      const startTicker = () => {
        let elapsed = 0;
        const tickStep = () => {
          AudioFX.tick();
          elapsed += tickInterval;
          tickInterval = Math.pow(elapsed / 1000, 1.8) * 40 + 60;
          if (elapsed < 4600) {
            tickTimer = setTimeout(tickStep, tickInterval);
          }
        };
        tickStep();
      };

      startTicker();

      // Animación suave con desaceleración natural
      setTimeout(() => {
        track.style.transition = 'transform 4.8s cubic-bezier(0.10, 0.85, 0.20, 1)';
        track.style.transform = `translateX(-${targetOffset}px)`;
      }, 50);

      // Finalización del giro
      setTimeout(() => {
        if (!this.inv.unlocked.includes(winner.id)) {
          this.inv.unlocked.push(winner.id);
        }
        // Equipar automáticamente
        this.inv.equipped[winner.type] = winner.id;
        saveInventory(this.inv);

        if (winner.rarity === 'gold') {
          AudioFX.goldFanfare();
        } else {
          AudioFX.build();
        }

        const area = modal.querySelector('#crateWinnerArea');
        const rar = RARITY_INFO[winner.rarity];
        area.innerHTML = `
          <div class="winner-box" style="border-color:${rar.color}">
            <span class="winner-badge" style="background:${rar.color}">${rar.name}</span>
            <h2 style="color:${winner.color}">${winner.name}</h2>
            <p>¡Desbloqueado y equipado con éxito en tu armería!</p>
          </div>
        `;
        area.classList.remove('hidden');

        btnRoll.disabled = false;
        setTimeout(() => renderModal(), 2500);
      }, 5000);
    }

    destroy() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      this.container.innerHTML = '';
    }
  }

  global.CyberDefenseGame = CyberDefenseGame;

})(window);
