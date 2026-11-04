// EpicKast: Dungeons of the Core • Minas de Magma & Obsidiana (Beta v1.7.5)
// Action-RPG cooperativo inspirado en Minecraft Dungeons con generación de mazmorras,
// físicas de colisión con muros, knockback, enemigos adaptados al bioma (Zombis Mineros,
// Arqueros Esqueléticos y Gólem de Obsidiana), llaves de rareza pura (sin marco)
// y el Gran Cofre Ancestral que desbloquea el Marco de Avatar 'FUNDADOR' (estilo Nitro gratuito).
// Rendimiento extremo: Canvas 2D puro, audio sintetizado Web Audio, < 5MB RAM, 0 dependencias.

(function(global) {
  'use strict';

  // --- Motor de Audio Web Audio Sintetizado (0 archivos externos) ---
  const AC = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  const AudioFX = {
    getCtx() {
      if (!audioCtx && AC) {
        try { audioCtx = new AC(); } catch {}
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    },
    swordSlash() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(320, t);
        o.frequency.exponentialRampToValueAtTime(80, t + 0.09);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.1);
      } catch {}
    },
    bowShot() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(640, t);
        o.frequency.exponentialRampToValueAtTime(220, t + 0.12);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.13);
      } catch {}
    },
    hitEnemy() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.07);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.08);
      } catch {}
    },
    playerHurt() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.16);
      } catch {}
    },
    keyPickup() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(784, t);
        o.frequency.setValueAtTime(1046, t + 0.05);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.18);
      } catch {}
    },
    chestOpen() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        [440, 554, 659, 880].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, t + i * 0.06);
          g.gain.setValueAtTime(0.06, t + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.28);
        });
      } catch {}
    },
    founderUnlocked() {
      // Fanfarria mística triunfal al desbloquear el Marco Fundador
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t + i * 0.08);
          g.gain.setValueAtTime(0.001, t + i * 0.08);
          g.gain.linearRampToValueAtTime(0.14, t + i * 0.08 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.45);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.5);
        });
      } catch {}
    }
  };

  // --- Datos y Almacenamiento Local (0 Espacio en Servidor Render) ---
  const SAVE_KEY = 'epickast.dungeon.v1';
  function loadDungeonData() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      coins: 50,
      keys: { copper: 1, silver: 0, gold: 0, obsidian: 0 },
      chestsOpened: { copper: false, silver: false, gold: false, core: false },
      founderFrameUnlocked: false,
      equippedWeapon: 'sword', // 'sword' | 'crossbow'
      highWave: 1
    };
  }

  function saveDungeonData(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      // Sincronizar el marco con toda la app si está desbloqueado
      if (data.founderFrameUnlocked) {
        localStorage.setItem('epickast.equipped_frame', 'founder_blue');
      }
    } catch {}
  }

  // --- Catálogo de Llaves (Sprites Limpios sin Marco Exterior) ---
  const KEY_TIERS = {
    copper: {
      name: 'Llave de Cobre',
      color: '#d97706',
      rarity: 'Común',
      desc: 'Abre cofres de madera rústicos con monedas y pociones.',
      draw(ctx, x, y, size = 18) {
        ctx.save();
        ctx.fillStyle = '#b45309';
        // Cabeza redonda con orificio
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Vástago y dientes
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x - size * 0.08, y, size * 0.16, size * 0.7);
        ctx.fillRect(x, y + size * 0.45, size * 0.25, size * 0.12);
        ctx.fillRect(x, y + size * 0.62, size * 0.2, size * 0.1);
        ctx.restore();
      }
    },
    silver: {
      name: 'Llave de Plata',
      color: '#94a3b8',
      rarity: 'Raro',
      desc: 'Abre el sagrario de plata con la Ballesta Rúnica.',
      draw(ctx, x, y, size = 18) {
        ctx.save();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x - size * 0.08, y, size * 0.16, size * 0.7);
        ctx.fillRect(x, y + size * 0.45, size * 0.25, size * 0.12);
        ctx.fillRect(x, y + size * 0.62, size * 0.2, size * 0.1);
        ctx.restore();
      }
    },
    gold: {
      name: 'Llave de Oro',
      color: '#f59e0b',
      rarity: 'Épico',
      desc: 'Abre el cofre real dorado con la Espada de Fuego.',
      draw(ctx, x, y, size = 18) {
        ctx.save();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x - size * 0.09, y, size * 0.18, size * 0.75);
        ctx.fillRect(x, y + size * 0.45, size * 0.28, size * 0.14);
        ctx.fillRect(x, y + size * 0.65, size * 0.22, size * 0.12);
        ctx.restore();
      }
    },
    obsidian: {
      name: 'Llave de Obsidiana',
      color: '#c084fc',
      rarity: 'Mítico Prisma',
      desc: '¡La llave del jefe! Abre el Cofre Ancestral que otorga el Marco FUNDADOR.',
      draw(ctx, x, y, size = 20) {
        ctx.save();
        // Resplandor púrpura cósmico
        ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        // Cabeza prismática
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e879f9';
        ctx.fillRect(x - size * 0.09, y, size * 0.18, size * 0.8);
        ctx.fillRect(x, y + size * 0.5, size * 0.3, size * 0.14);
        ctx.fillRect(x, y + size * 0.7, size * 0.24, size * 0.12);
        ctx.restore();
      }
    }
  };

  // --- MAPA DE MINAS DE MAGMA Y OBSIDIANA (Matriz 24x15, Baldosas 32x32) ---
  // 0: Camino de piedra volcánica
  // 1: Muro de roca de obsidiana indestructible
  // 2: Río de Lava ardiente (abismo)
  // 3: Puente de piedra minera que cruza la lava
  // 4: Vagoneta minera
  // 5: Cristal de amatista brillante
  const COLS = 24;
  const ROWS = 15;
  const TILE_SZ = 32;

  // Mapa diseñado: dos salas amplias conectadas por dos puentes de piedra sobre un río central de lava
  const LEVEL_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,5,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,5,0,1],
    [1,0,0,0,4,0,0,0,0,0,1,2,2,1,0,0,0,0,0,4,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,1], // Puente Norte
    [1,0,0,1,1,0,0,0,0,0,3,3,3,3,0,0,0,0,0,1,1,0,0,1],
    [1,1,0,1,1,0,0,0,0,0,1,2,2,1,0,0,0,0,0,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1], // Centro
    [1,1,0,1,1,0,0,0,0,0,1,2,2,1,0,0,0,0,0,1,1,0,1,1],
    [1,0,0,1,1,0,0,0,0,0,3,3,3,3,0,0,0,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,1], // Puente Sur
    [1,0,0,0,4,0,0,0,0,0,1,2,2,1,0,0,0,0,0,4,0,0,0,1],
    [1,0,5,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,5,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  // --- Clase Principal: Dungeons of the Core Beta ---
  class CyberDefenseGame {
    constructor(container, socket, roomKey, currentUser, options) {
      this.container = container;
      this.socket = socket;
      this.roomKey = roomKey || 'dungeon_room';
      this.currentUser = currentUser || { name: 'Explorador', id: 'p1' };
      this.options = options || {};

      this.data = loadDungeonData();

      // Dimensiones de la pantalla del juego
      this.width = COLS * TILE_SZ; // 768px
      this.height = ROWS * TILE_SZ; // 480px

      // Jugador (Vanguardia)
      this.player = {
        x: 160,
        y: 240,
        vx: 0, vy: 0,
        speed: 180,
        hp: 100, maxHp: 100,
        angle: 0,
        radius: 12,
        attackCooldown: 0,
        isAttacking: false,
        attackAngle: 0,
        attackTimer: 0,
        weapon: this.data.equippedWeapon || 'sword' // 'sword' | 'crossbow'
      };

      // Controles
      this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, Space: false };
      this.mouse = { x: 384, y: 240, isDown: false, rightDown: false };

      // Entidades del mundo
      this.enemies = [];     // { x, y, vx, vy, hp, maxHp, speed, type, radius, attackCooldown, knockX, knockY }
      this.projectiles = []; // { x, y, vx, vy, dmg, color, fromPlayer, life, radius }
      this.particles = [];   // { x, y, vx, vy, color, life, maxLife, size }
      this.droppedKeys = []; // { x, y, tier, bob }
      this.floatingTexts = []; // { x, y, vy, text, color, life }
      this.teammates = new Map(); // Bots o amigos en llamada

      // Cofres en el mapa
      this.chests = [
        { id: 'copper', x: 80, y: 80, tier: 'copper', opened: !!this.data.chestsOpened.copper, name: 'Cofre Rústico de Cobre' },
        { id: 'silver', x: 688, y: 80, tier: 'silver', opened: !!this.data.chestsOpened.silver, name: 'Sagrario de Plata' },
        { id: 'gold', x: 80, y: 400, tier: 'gold', opened: !!this.data.chestsOpened.gold, name: 'Cofre Real Dorado' },
        { id: 'core', x: 384, y: 240, tier: 'obsidian', opened: !!this.data.chestsOpened.core, name: '★ Cofre Ancestral del Núcleo ★' }
      ];

      // Oleadas y Estado
      this.wave = 1;
      this.maxWaves = 3;
      this.gameState = 'play'; // 'play', 'victory', 'gameover'
      this.waveState = 'spawning'; // 'spawning', 'fighting'
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
        <div class="cd-wrap" style="width: 1040px; max-width: 98vw; background:#0d0a14; border:1px solid #2e1d42; border-radius:10px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.85); font-family:system-ui, -apple-system, sans-serif;">
          
          <!-- Encabezado de la Mazmorra -->
          <div class="cd-header" style="background:#161022; border-bottom:1px solid #2d1f44; padding:10px 16px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">🌋</span>
              <div>
                <strong style="color:#f8fafc; font-size:15px; letter-spacing:0.5px;">Dungeons of the Core • Minas de Magma</strong>
                <span style="background:#7c3aed; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; margin-left:6px;">BETA v1.7.5</span>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <div style="color:#fca5a5; font-size:12px; font-weight:700;">❤️ Salud: <b id="dHp" style="color:#fff;">100/100</b></div>
              <div style="color:#fde047; font-size:12px; font-weight:700;">💰 Monedas: <b id="dCoins" style="color:#fff;">${this.data.coins}</b></div>
              <div style="color:#c084fc; font-size:12px; font-weight:700;">⚔️ Oleada: <b id="dWave" style="color:#fff;">1/3</b></div>
            </div>

            <div style="display:flex; gap:8px;">
              <button id="dBtnInvite" class="cd-btn" style="background:#059669; border-color:#10b981; color:#fff; font-weight:700; padding:5px 12px; border-radius:6px; cursor:pointer;" title="Invitar a los miembros de la llamada a la mazmorra">📢 Invitar</button>
              <button id="dBtnBot" class="cd-btn" style="background:#2563eb; border-color:#3b82f6; color:#fff; font-weight:700; padding:5px 12px; border-radius:6px; cursor:pointer;" title="Añadir un explorador bot aliado a tu escuadrón">🤖 +Aliado</button>
              <button id="dBtnClose" class="cd-btn" style="background:#334155; border-color:#475569; color:#fff; padding:5px 12px; border-radius:6px; cursor:pointer;">✕ Salir</button>
            </div>
          </div>

          <!-- Cuerpo Principal: Canvas + Panel Lateral RPG -->
          <div style="display:flex; background:#0a0710;">
            
            <!-- Canvas de Juego (768x480) -->
            <div style="position:relative; width:768px; height:480px; flex:none; background:#000;">
              <canvas id="dCanvas" width="768" height="480" style="display:block; image-rendering:pixelated; cursor:crosshair;"></canvas>
              
              <!-- Cartel de Interacción con Cofres -->
              <div id="dChestPrompt" style="display:none; position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(19, 13, 30, 0.92); border:1px solid #a855f7; padding:8px 18px; border-radius:8px; color:#f8fafc; font-size:12px; font-weight:700; box-shadow:0 4px 16px rgba(0,0,0,0.7); pointer-events:none;">
                Presiona <b style="color:#38bdf8;">ESPACIO</b> o haz <b style="color:#38bdf8;">CLIC</b> para abrir
              </div>
            </div>

            <!-- Panel Lateral de Llaves & Prestigio Nitro -->
            <div style="flex:1; background:#120d1c; border-left:1px solid #291b3b; padding:14px; display:flex; flex-direction:column; gap:14px; overflow-y:auto; max-height:480px;">
              
              <!-- 1. TUS LLAVES CRIPTOGRÁFICAS (Sprites Limpios sin marco) -->
              <div style="background:#191226; border:1px solid #33224b; border-radius:8px; padding:10px;">
                <h4 style="margin:0 0 8px 0; color:#e2e8f0; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">🔑 Llaves Criptográficas</h4>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                  
                  <div style="display:flex; align-items:center; gap:8px; background:#100b19; padding:6px; border-radius:6px;">
                    <canvas id="keyCopperIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#d97706; font-size:11px; font-weight:700;">Cobre</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountCopper" style="color:#fff;">${this.data.keys.copper}</b></div>
                    </div>
                  </div>

                  <div style="display:flex; align-items:center; gap:8px; background:#100b19; padding:6px; border-radius:6px;">
                    <canvas id="keySilverIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#cbd5e1; font-size:11px; font-weight:700;">Plata</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountSilver" style="color:#fff;">${this.data.keys.silver}</b></div>
                    </div>
                  </div>

                  <div style="display:flex; align-items:center; gap:8px; background:#100b19; padding:6px; border-radius:6px;">
                    <canvas id="keyGoldIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#fbbf24; font-size:11px; font-weight:700;">Oro</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountGold" style="color:#fff;">${this.data.keys.gold}</b></div>
                    </div>
                  </div>

                  <div style="display:flex; align-items:center; gap:8px; background:#100b19; padding:6px; border-radius:6px; border:1px solid rgba(192,132,252,0.4);">
                    <canvas id="keyObsidianIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#c084fc; font-size:11px; font-weight:700;">Obsidiana</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountObsidian" style="color:#fff;">${this.data.keys.obsidian}</b></div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- 2. CONTROLES Y ARMAS -->
              <div style="background:#191226; border:1px solid #33224b; border-radius:8px; padding:10px;">
                <h4 style="margin:0 0 6px 0; color:#e2e8f0; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">⚔️ Combate (Estilo Dungeons)</h4>
                <div style="font-size:11px; color:#cbd5e1; line-height:1.5;">
                  <div>🗡️ <b>Clic Izquierdo / Espacio:</b> Espadazo melee (con empuje / knockback).</div>
                  <div>🏹 <b>Clic Derecho / Tecla E:</b> Flecha de ballesta a distancia.</div>
                  <div>⌨️ <b>WASD:</b> Movimiento con deslizamiento suave en muros.</div>
                </div>
              </div>

              <!-- 3. GRAN PREMIO: MARCO DE AVATAR 'FUNDADOR' (ESTILO NITRO GRATUITO) -->
              <div id="dFounderCard" style="background:#151828; border:1px solid ${this.data.founderFrameUnlocked ? '#38bdf8' : '#334155'}; border-radius:8px; padding:12px; position:relative;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                  <span style="font-size:11px; font-weight:800; color:#38bdf8; letter-spacing:0.5px;">💎 RECOMPENSA DE PRESTIGIO</span>
                  <span id="dFounderBadge" style="font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; ${this.data.founderFrameUnlocked ? 'background:#0284c7;color:#fff;' : 'background:#334155;color:#94a3b8;'}">
                    ${this.data.founderFrameUnlocked ? '✓ DESBLOQUEADO' : '🔒 BLOQUEADO'}
                  </span>
                </div>

                <div style="display:flex; align-items:center; gap:12px;">
                  <!-- Preview del Avatar con Marco de Fundador -->
                  <div style="position:relative; width:44px; height:44px; flex:none;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#0284c7; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:16px; box-shadow:0 0 0 2px #0284c7, 0 0 10px rgba(56, 189, 248, 0.75);">
                      ${(this.currentUser.name || 'T')[0].toUpperCase()}
                    </div>
                    <!-- Placa FUNDADOR inferior -->
                    <div style="position:absolute; bottom:-3px; left:50%; transform:translateX(-50%) scale(0.75); background:linear-gradient(135deg, #0284c7, #2563eb); color:#fff; font-size:8px; font-weight:900; letter-spacing:0.5px; padding:1px 4px; border-radius:3px; border:1px solid #38bdf8; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.6);">
                      FUNDADOR
                    </div>
                  </div>

                  <div style="font-size:11px; color:#cbd5e1;">
                    <strong style="color:#fff; display:block;">Marco de Avatar Azul 'FUNDADOR'</strong>
                    <span style="color:#94a3b8; font-size:10px;">Visible en llamadas y chat de EpicKast para siempre. Se obtiene al abrir el Cofre Ancestral con la Llave de Obsidiana del Jefe.</span>
                  </div>
                </div>

                <div style="margin-top:10px;">
                  <button id="dBtnEquipFounder" class="cd-btn" style="width:100%; padding:6px; font-size:11px; font-weight:700; border-radius:6px; cursor:pointer; ${this.data.founderFrameUnlocked ? 'background:#0284c7;border-color:#38bdf8;color:#fff;' : 'background:#1e293b;border-color:#334155;color:#64748b;cursor:not-allowed;'}" ${!this.data.founderFrameUnlocked ? 'disabled' : ''}>
                    ${this.data.founderFrameUnlocked ? '✓ Marco de Fundador Activo en tu Perfil' : 'Derrota al Gólem para desbloquear'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;

      this.canvas = this.container.querySelector('#dCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.promptEl = this.container.querySelector('#dChestPrompt');

      // Dibujar iconos limpios de las 4 llaves en el panel lateral
      this.renderKeyIcons();
    }

    renderKeyIcons() {
      ['copper', 'silver', 'gold', 'obsidian'].forEach(k => {
        const c = this.container.querySelector(`#key${k[0].toUpperCase() + k.slice(1)}Ico`);
        if (c) {
          const ctx = c.getContext('2d');
          ctx.clearRect(0, 0, 22, 24);
          KEY_TIERS[k].draw(ctx, 11, 11, 16);
        }
      });
    }

    bindInputs() {
      this.onKeyDown = (e) => {
        if (this.keys.hasOwnProperty(e.code)) {
          this.keys[e.code] = true;
          e.preventDefault();
        }
        if (e.code === 'KeyE') this.shootCrossbow();
        if (e.code === 'Space') this.attackSword();
      };

      this.onKeyUp = (e) => {
        if (this.keys.hasOwnProperty(e.code)) {
          this.keys[e.code] = false;
          e.preventDefault();
        }
      };

      this.onMouseMove = (e) => {
        const r = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left;
        this.mouse.y = e.clientY - r.top;
        this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
      };

      this.onMouseDown = (e) => {
        if (e.button === 0) {
          this.mouse.isDown = true;
          this.interactChest() || this.attackSword();
        } else if (e.button === 2) {
          e.preventDefault();
          this.mouse.rightDown = true;
          this.shootCrossbow();
        }
      };

      this.onMouseUp = (e) => {
        if (e.button === 0) this.mouse.isDown = false;
        if (e.button === 2) this.mouse.rightDown = false;
      };

      this.onContextMenu = (e) => e.preventDefault();

      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      this.canvas.addEventListener('mousemove', this.onMouseMove);
      this.canvas.addEventListener('mousedown', this.onMouseDown);
      this.canvas.addEventListener('mouseup', this.onMouseUp);
      this.canvas.addEventListener('contextmenu', this.onContextMenu);

      // Botón invitar a la llamada
      const btnInv = this.container.querySelector('#dBtnInvite');
      if (btnInv) {
        btnInv.onclick = () => {
          this.options.inviteAll?.();
        };
      }

      // Botón bot aliado
      const btnBot = this.container.querySelector('#dBtnBot');
      if (btnBot) {
        btnBot.onclick = () => this.addAllyBot();
      }

      // Botón cerrar
      const btnClose = this.container.querySelector('#dBtnClose');
      if (btnClose) {
        btnClose.onclick = () => this.destroy();
      }
    }

    bindSocket() {
      // Sincronización P2P ligera a través del socket existente
      if (!this.socket) return;
      this.onSocketMsg = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.t === 'dungeon_action' && m.room === this.roomKey && m.from !== this.currentUser.id) {
            this.handleRemoteAction(m.action);
          }
        } catch {}
      };
      this.socket.addEventListener('message', this.onSocketMsg);
    }

    sendAction(action) {
      if (this.socket && this.socket.readyState === 1) {
        try {
          this.socket.send(JSON.stringify({ t: 'dungeon_action', room: this.roomKey, from: this.currentUser.id, action }));
        } catch {}
      }
    }

    handleRemoteAction(act) {
      if (act.type === 'peer_move') {
        let tm = this.teammates.get(act.id);
        if (!tm) {
          tm = { name: act.name || 'Aliado', x: act.x, y: act.y, angle: act.angle, hp: act.hp, isBot: false };
          this.teammates.set(act.id, tm);
        }
        tm.x = act.x; tm.y = act.y; tm.angle = act.angle; tm.hp = act.hp;
      }
    }

    addAllyBot() {
      const id = 'bot_' + Date.now();
      this.teammates.set(id, {
        name: 'Guardián Bot',
        x: this.player.x - 30,
        y: this.player.y - 30,
        angle: 0,
        hp: 100,
        maxHp: 100,
        isBot: true,
        shootTimer: 0
      });
      AudioFX.keyPickup();
      this.spawnFloatingText(this.player.x, this.player.y - 20, '🤖 ¡Aliado se unió!', '#38bdf8');
    }

    // --- Ataque Melee: Espadazo en Abanico (Minecraft Dungeons style) ---
    attackSword() {
      const now = performance.now();
      if (now - this.player.attackCooldown < 320) return;
      this.player.attackCooldown = now;
      this.player.isAttacking = true;
      this.player.attackAngle = this.player.angle;
      this.player.attackTimer = 120; // 120ms de animación de corte

      AudioFX.swordSlash();

      // Rango de corte: 48px, abanico de 120 grados frente al jugador
      const slashRange = 52;
      const slashArc = Math.PI * 0.7; // ~126 grados

      this.enemies.forEach(en => {
        const dx = en.x - this.player.x;
        const dy = en.y - this.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < slashRange + en.radius) {
          const enAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enAngle - this.player.attackAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          if (diff < slashArc / 2) {
            // Impacto y daño
            const dmg = 38;
            en.hp -= dmg;
            AudioFX.hitEnemy();
            this.spawnFloatingText(en.x, en.y, `-${dmg}`, '#fde047');

            // KNOCKBACK: Empuje hacia atrás en el ángulo del espadazo
            const kbDist = 32;
            en.knockX = Math.cos(this.player.attackAngle) * kbDist;
            en.knockY = Math.sin(this.player.attackAngle) * kbDist;

            // Partículas de corte
            for (let i = 0; i < 4; i++) {
              this.particles.push({
                x: en.x, y: en.y,
                vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
                color: '#f59e0b', life: 15, maxLife: 15, size: 3
              });
            }
          }
        }
      });
    }

    // --- Ataque a Distancia: Ballesta Rúnica ---
    shootCrossbow() {
      const now = performance.now();
      if (now - (this.player.lastShotTime || 0) < 450) return;
      this.player.lastShotTime = now;

      AudioFX.bowShot();

      const ang = this.player.angle;
      const sx = this.player.x + Math.cos(ang) * 16;
      const sy = this.player.y + Math.sin(ang) * 16;

      this.projectiles.push({
        x: sx, y: sy,
        vx: Math.cos(ang) * 440,
        vy: Math.sin(ang) * 440,
        dmg: 28,
        color: '#c084fc',
        fromPlayer: true,
        life: 50,
        radius: 3
      });
    }

    // --- Detección e Interacción con Cofres ---
    getNearChest() {
      for (const ch of this.chests) {
        const d = Math.hypot(this.player.x - ch.x, this.player.y - ch.y);
        if (d < 38) return ch;
      }
      return null;
    }

    interactChest() {
      const ch = this.getNearChest();
      if (!ch) return false;

      if (ch.opened) {
        this.spawnFloatingText(ch.x, ch.y, 'Cofre ya vacío', '#94a3b8');
        return true;
      }

      // Verificar si tiene la llave requerida
      if (this.data.keys[ch.tier] > 0) {
        this.data.keys[ch.tier]--;
        ch.opened = true;
        this.data.chestsOpened[ch.id] = true;

        AudioFX.chestOpen();
        this.spawnFloatingText(ch.x, ch.y - 10, `¡${ch.name} Abierto!`, KEY_TIERS[ch.tier].color, 14);

        if (ch.id === 'copper') {
          this.data.coins += 80;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
          this.spawnFloatingText(this.player.x, this.player.y - 20, '+80 Monedas & +35 Salud', '#10b981');
        } else if (ch.id === 'silver') {
          this.data.coins += 150;
          this.spawnFloatingText(this.player.x, this.player.y - 20, '🏹 ¡Ballesta Mejorada!', '#cbd5e1');
        } else if (ch.id === 'gold') {
          this.data.coins += 300;
          this.player.maxHp = 140;
          this.player.hp = 140;
          this.spawnFloatingText(this.player.x, this.player.y - 20, '🔥 ¡Espada de Magma + Salud Máx!', '#fbbf24');
        } else if (ch.id === 'core') {
          // ¡EL GRAN PREMIO! Desbloqueo del Marco de Avatar "FUNDADOR"
          this.data.founderFrameUnlocked = true;
          saveDungeonData(this.data);
          AudioFX.founderUnlocked();

          // Activar marco en toda la aplicación
          localStorage.setItem('epickast.equipped_frame', 'founder_blue');
          document.querySelectorAll(`.avatar[data-uid="${this.currentUser.id}"]`).forEach(n => n.classList.add('frame-founder'));

          this.updateUi();
          this.showFounderUnlockedModal();
        }

        saveDungeonData(this.data);
        this.updateUi();
        return true;
      } else {
        AudioFX.hitEnemy();
        this.spawnFloatingText(ch.x, ch.y - 10, `Requiere ${KEY_TIERS[ch.tier].name}`, '#ef4444');
        return true;
      }
    }

    showFounderUnlockedModal() {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed; inset:0; z-index:99999; background:rgba(6,8,15,0.85); display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px);';
      modal.innerHTML = `
        <div style="background:#0f1523; border:2px solid #38bdf8; border-radius:12px; padding:24px; width:440px; max-width:92vw; text-align:center; box-shadow:0 0 40px rgba(56,189,248,0.4); font-family:system-ui,sans-serif;">
          <div style="font-size:42px; margin-bottom:8px;">💎</div>
          <h2 style="color:#38bdf8; margin:0 0 6px 0; font-size:20px; font-weight:800; letter-spacing:0.5px;">¡RECOMPENSA DE PRESTIGIO DESBLOQUEADA!</h2>
          <p style="color:#e2e8f0; font-size:13px; line-height:1.5; margin:0 0 16px 0;">
            Has abierto el Cofre Ancestral del Núcleo y reclamado la distinción de Primera Edición:
          </p>
          
          <div style="display:inline-block; padding:12px 20px; background:#162035; border:1px solid #0284c7; border-radius:10px; margin-bottom:18px;">
            <div style="position:relative; width:52px; height:52px; margin:0 auto 8px auto;">
              <div style="width:48px; height:48px; border-radius:50%; background:#0284c7; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:20px; box-shadow:0 0 0 2px #0284c7, 0 0 14px rgba(56,189,248,0.85);">
                ${(this.currentUser.name || 'T')[0].toUpperCase()}
              </div>
              <div style="position:absolute; bottom:-3px; left:50%; transform:translateX(-50%) scale(0.8); background:linear-gradient(135deg, #0284c7, #2563eb); color:#fff; font-size:8px; font-weight:900; letter-spacing:0.6px; padding:1px 5px; border-radius:3px; border:1px solid #38bdf8; white-space:nowrap;">
                FUNDADOR
              </div>
            </div>
            <strong style="color:#fff; font-size:14px; display:block;">Marco de Avatar 'FUNDADOR'</strong>
            <span style="color:#38bdf8; font-size:11px;">Equipado automáticamente en tu perfil de EpicKast</span>
          </div>

          <div>
            <button id="dCloseModal" style="background:#0284c7; border:none; color:#fff; font-weight:700; padding:10px 24px; border-radius:8px; cursor:pointer; font-size:13px;">¡Continuar la Aventura!</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector('#dCloseModal').onclick = () => modal.remove();
    }

    // --- Colisiones con Muros (Deslizamiento Suave / Slide Collision) ---
    isWall(x, y) {
      const col = Math.floor(x / TILE_SZ);
      const row = Math.floor(y / TILE_SZ);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      const tile = LEVEL_MAP[row][col];
      return tile === 1 || tile === 2; // Muro sólido o Lava profunda sin puente
    }

    moveEntity(ent, dx, dy, dt) {
      const r = ent.radius || 12;

      // 1. Moverse en X y verificar colisión
      ent.x += dx * dt;
      if (this.isWall(ent.x - r, ent.y) || this.isWall(ent.x + r, ent.y)) {
        ent.x -= dx * dt; // Cancelar solo componente X permitiendo deslizar en Y
      }

      // 2. Moverse en Y y verificar colisión independientemente
      ent.y += dy * dt;
      if (this.isWall(ent.x, ent.y - r) || this.isWall(ent.x, ent.y + r)) {
        ent.y -= dy * dt; // Cancelar solo componente Y permitiendo deslizar en X
      }

      // Aplicar Knockback si existe
      if (ent.knockX || ent.knockY) {
        ent.x += (ent.knockX || 0);
        ent.y += (ent.knockY || 0);
        ent.knockX = (ent.knockX || 0) * 0.75;
        ent.knockY = (ent.knockY || 0) * 0.75;
        if (Math.abs(ent.knockX) < 0.5) ent.knockX = 0;
        if (Math.abs(ent.knockY) < 0.5) ent.knockY = 0;
      }
    }

    startWave(num) {
      this.wave = num;
      this.enemies = [];
      this.droppedKeys = [];

      if (num === 1) {
        // Oleada 1: 8 Mineros Zombi (Caminantes de Magma)
        for (let i = 0; i < 8; i++) {
          this.spawnEnemy('zombie_miner', 450 + (i % 3) * 60, 100 + Math.floor(i / 3) * 80);
        }
      } else if (num === 2) {
        // Oleada 2: 6 Mineros Zombi + 4 Arqueros Esqueléticos Calcinados
        for (let i = 0; i < 6; i++) {
          this.spawnEnemy('zombie_miner', 480 + (i % 2) * 80, 120 + Math.floor(i / 2) * 90);
        }
        for (let i = 0; i < 4; i++) {
          this.spawnEnemy('skeleton_archer', 580, 100 + i * 80);
        }
      } else if (num === 3) {
        // Oleada 3: EL JEFE GÓLEM DE OBSIDIANA + Escoltas
        this.spawnEnemy('golem_boss', 580, 240);
        this.spawnEnemy('skeleton_archer', 620, 140);
        this.spawnEnemy('skeleton_archer', 620, 340);
      }

      this.updateUi();
    }

    spawnEnemy(type, x, y) {
      let en = {
        x, y,
        type,
        knockX: 0, knockY: 0,
        shootTimer: 0
      };

      if (type === 'zombie_miner') {
        en.hp = 70; en.maxHp = 70;
        en.speed = 85;
        en.radius = 14;
        en.name = 'Minero Zombi';
      } else if (type === 'skeleton_archer') {
        en.hp = 50; en.maxHp = 50;
        en.speed = 65;
        en.radius = 12;
        en.name = 'Arquero Esqueleto';
      } else if (type === 'golem_boss') {
        en.hp = 600; en.maxHp = 600;
        en.speed = 50;
        en.radius = 26;
        en.name = 'Gólem de Obsidiana';
      }

      this.enemies.push(en);
    }

    spawnFloatingText(x, y, text, color = '#38bdf8', size = 12) {
      this.floatingTexts.push({ x, y, vy: -1.0, text, color, size, life: 0, maxLife: 40 });
    }

    update(dt) {
      if (this.gameState !== 'play') return;

      // 1. Movimiento del Jugador
      let dx = 0, dy = 0;
      if (this.keys.KeyW || this.keys.ArrowUp) dy -= 1;
      if (this.keys.KeyS || this.keys.ArrowDown) dy += 1;
      if (this.keys.KeyA || this.keys.ArrowLeft) dx -= 1;
      if (this.keys.KeyD || this.keys.ArrowRight) dx += 1;

      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
      this.moveEntity(this.player, dx * this.player.speed, dy * this.player.speed, dt);

      // Temporizador de corte de espada
      if (this.player.isAttacking) {
        this.player.attackTimer -= dt * 1000;
        if (this.player.attackTimer <= 0) this.player.isAttacking = false;
      }

      // 2. IA de Bots Aliados
      this.teammates.forEach(tm => {
        if (!tm.isBot) return;
        const dist = Math.hypot(this.player.x - tm.x, this.player.y - tm.y);
        if (dist > 60) {
          const a = Math.atan2(this.player.y - tm.y, this.player.x - tm.x);
          this.moveEntity(tm, Math.cos(a) * 140, Math.sin(a) * 140, dt);
        }

        // Buscar enemigo y disparar
        let nearest = null; let minD = 240;
        for (const en of this.enemies) {
          const d = Math.hypot(en.x - tm.x, en.y - tm.y);
          if (d < minD) { minD = d; nearest = en; }
        }
        if (nearest) {
          tm.shootTimer = (tm.shootTimer || 0) + dt;
          if (tm.shootTimer > 0.45) {
            tm.shootTimer = 0;
            const a = Math.atan2(nearest.y - tm.y, nearest.x - tm.x);
            this.projectiles.push({
              x: tm.x, y: tm.y,
              vx: Math.cos(a) * 380, vy: Math.sin(a) * 380,
              dmg: 22, color: '#38bdf8', fromPlayer: true, life: 40, radius: 2.5
            });
            AudioFX.bowShot();
          }
        }
      });

      // 3. IA de Enemigos
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const en = this.enemies[i];

        if (en.hp <= 0) {
          // Muerte del enemigo: Dropeo de botín
          this.handleEnemyDeath(en);
          this.enemies.splice(i, 1);
          continue;
        }

        const toPlayerX = this.player.x - en.x;
        const toPlayerY = this.player.y - en.y;
        const dist = Math.hypot(toPlayerX, toPlayerY);
        const ang = Math.atan2(toPlayerY, toPlayerX);

        if (en.type === 'zombie_miner') {
          // Camina hacia el jugador para golpear melee
          this.moveEntity(en, Math.cos(ang) * en.speed, Math.sin(ang) * en.speed, dt);
          if (dist < en.radius + this.player.radius + 4) {
            en.attackCooldown = (en.attackCooldown || 0) + dt;
            if (en.attackCooldown > 0.8) {
              en.attackCooldown = 0;
              this.player.hp -= 14;
              AudioFX.playerHurt();
              this.shakeIntensity = 5;
              this.spawnFloatingText(this.player.x, this.player.y, '-14', '#ef4444');
            }
          }
        } else if (en.type === 'skeleton_archer') {
          // Mantiene distancia de ~180px y dispara flechas ardientes
          if (dist < 150) {
            this.moveEntity(en, -Math.cos(ang) * en.speed, -Math.sin(ang) * en.speed, dt);
          } else if (dist > 220) {
            this.moveEntity(en, Math.cos(ang) * en.speed, Math.sin(ang) * en.speed, dt);
          }
          en.shootTimer = (en.shootTimer || 0) + dt;
          if (en.shootTimer > 1.6) {
            en.shootTimer = 0;
            this.projectiles.push({
              x: en.x, y: en.y,
              vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280,
              dmg: 12, color: '#f97316', fromPlayer: false, life: 60, radius: 3
            });
            AudioFX.bowShot();
          }
        } else if (en.type === 'golem_boss') {
          // Jefe avanza y cada 3.5s golpea el suelo
          this.moveEntity(en, Math.cos(ang) * en.speed, Math.sin(ang) * en.speed, dt);
          en.shootTimer = (en.shootTimer || 0) + dt;
          if (en.shootTimer > 3.2) {
            en.shootTimer = 0;
            this.shakeIntensity = 10;
            AudioFX.hitEnemy();
            this.spawnFloatingText(en.x, en.y - 20, '💥 ¡TERREMOTO DE MAGMA!', '#ef4444', 14);
            // Ondas de fuego en 8 direcciones
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
              this.projectiles.push({
                x: en.x, y: en.y,
                vx: Math.cos(a) * 210, vy: Math.sin(a) * 210,
                dmg: 18, color: '#ef4444', fromPlayer: false, life: 45, radius: 4
              });
            }
          }
        }
      }

      // 4. Proyectiles avanzan y colisionan
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 1;

        // Choque con muro
        if (this.isWall(p.x, p.y)) {
          this.projectiles.splice(i, 1);
          continue;
        }

        if (p.fromPlayer) {
          // Impacto en enemigos
          let hit = false;
          for (const en of this.enemies) {
            if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + p.radius) {
              en.hp -= p.dmg;
              AudioFX.hitEnemy();
              this.spawnFloatingText(en.x, en.y, `-${p.dmg}`, '#c084fc');
              hit = true;
              break;
            }
          }
          if (hit || p.life <= 0) this.projectiles.splice(i, 1);
        } else {
          // Impacto en jugador
          if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < this.player.radius + p.radius) {
            this.player.hp -= p.dmg;
            AudioFX.playerHurt();
            this.shakeIntensity = 4;
            this.spawnFloatingText(this.player.x, this.player.y, `-${p.dmg}`, '#ef4444');
            this.projectiles.splice(i, 1);
          } else if (p.life <= 0) {
            this.projectiles.splice(i, 1);
          }
        }
      }

      // 5. Recoger llaves dropeadas
      for (let i = this.droppedKeys.length - 1; i >= 0; i--) {
        const k = this.droppedKeys[i];
        k.bob = (k.bob || 0) + dt * 4;
        if (Math.hypot(this.player.x - k.x, this.player.y - k.y) < 24) {
          this.data.keys[k.tier] = (this.data.keys[k.tier] || 0) + 1;
          saveDungeonData(this.data);
          AudioFX.keyPickup();
          this.spawnFloatingText(this.player.x, this.player.y - 15, `+1 ${KEY_TIERS[k.tier].name}`, KEY_TIERS[k.tier].color, 13);
          this.droppedKeys.splice(i, 1);
          this.updateUi();
        }
      }

      // 6. Revisar proximidad a cofres
      const nearCh = this.getNearChest();
      if (nearCh && !nearCh.opened) {
        this.promptEl.style.display = 'block';
        this.promptEl.innerHTML = `Presiona <b style="color:#38bdf8;">ESPACIO</b> para abrir <b>${nearCh.name}</b>`;
      } else {
        this.promptEl.style.display = 'none';
      }

      // 7. Partículas y Textos
      this.particles.forEach(pt => {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= 1;
      });
      this.particles = this.particles.filter(pt => pt.life > 0);

      this.floatingTexts.forEach(ft => {
        ft.y += ft.vy;
        ft.life += 1;
      });
      this.floatingTexts = this.floatingTexts.filter(ft => ft.life < ft.maxLife);

      // Reducir pantalla temblorosa
      if (this.shakeIntensity > 0) this.shakeIntensity *= 0.9;

      // 8. Condición de derrota / victoria de oleada
      if (this.player.hp <= 0) {
        this.player.hp = 0;
        this.gameState = 'gameover';
        this.spawnFloatingText(this.player.x, this.player.y, '💀 CAÍDO EN LA MINA', '#ef4444', 16);
      } else if (this.enemies.length === 0 && this.wave < this.maxWaves) {
        this.startWave(this.wave + 1);
      }

      this.updateUi();
    }

    handleEnemyDeath(en) {
      this.data.coins += (en.type === 'golem_boss' ? 250 : 25);
      AudioFX.hitEnemy();

      // Generar partículas de lava/ceniza
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: en.x, y: en.y,
          vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80,
          color: '#ea580c', life: 20, maxLife: 20, size: 4
        });
      }

      // Probabilidades de Llaves Limpias (Sprite puro)
      if (en.type === 'golem_boss') {
        // El Gólem SIEMPRE dropea la Llave de Obsidiana
        this.droppedKeys.push({ x: en.x, y: en.y, tier: 'obsidian', bob: 0 });
        this.spawnFloatingText(en.x, en.y - 30, '💎 ¡LLAVE DE OBSIDIANA!', '#c084fc', 15);
      } else if (en.type === 'skeleton_archer') {
        const roll = Math.random();
        if (roll < 0.35) {
          this.droppedKeys.push({ x: en.x, y: en.y, tier: 'silver', bob: 0 });
        } else if (roll < 0.55) {
          this.droppedKeys.push({ x: en.x, y: en.y, tier: 'gold', bob: 0 });
        }
      } else {
        // Minero zombi dropea Cobre (45% prob)
        if (Math.random() < 0.45) {
          this.droppedKeys.push({ x: en.x, y: en.y, tier: 'copper', bob: 0 });
        }
      }

      saveDungeonData(this.data);
    }

    updateUi() {
      const hpEl = this.container.querySelector('#dHp');
      if (hpEl) hpEl.textContent = `${Math.max(0, Math.round(this.player.hp))}/${this.player.maxHp}`;

      const coinsEl = this.container.querySelector('#dCoins');
      if (coinsEl) coinsEl.textContent = this.data.coins;

      const waveEl = this.container.querySelector('#dWave');
      if (waveEl) waveEl.textContent = `${this.wave}/${this.maxWaves}`;

      ['copper', 'silver', 'gold', 'obsidian'].forEach(k => {
        const el = this.container.querySelector(`#kCount${k[0].toUpperCase() + k.slice(1)}`);
        if (el) el.textContent = this.data.keys[k] || 0;
      });
    }

    // --- RENDERIZADO DEL MOTOR (Canvas 2D Pixel Art) ---
    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const now = performance.now();

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Temblor de pantalla
      if (this.shakeIntensity > 0.5) {
        ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
      }

      // 1. DIBUJAR MAPA DE BALDOSAS (Tilemap 24x15)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = LEVEL_MAP[r][c];
          const tx = c * TILE_SZ;
          const ty = r * TILE_SZ;

          if (tile === 1) {
            // Muro de Obsidiana con bordes morados y remaches
            ctx.fillStyle = '#0f0a17';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);
            ctx.fillStyle = '#1e142e';
            ctx.fillRect(tx + 2, ty + 2, TILE_SZ - 4, TILE_SZ - 4);
            ctx.fillStyle = '#3b255c';
            ctx.fillRect(tx + 4, ty + 4, 3, 3);
            ctx.fillRect(tx + TILE_SZ - 7, ty + TILE_SZ - 7, 3, 3);
          } else if (tile === 2) {
            // Río de Lava ardiente animado
            const lavaPulse = (Math.sin(now * 0.005 + c * 0.5 + r * 0.5) + 1) * 0.5;
            ctx.fillStyle = lavaPulse > 0.5 ? '#ea580c' : '#c2410c';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(tx + 6, ty + 6, 8, 8);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(tx + 8, ty + 8, 4, 4);
          } else if (tile === 3) {
            // Puente de piedra que cruza la lava
            ctx.fillStyle = '#292038';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);
            ctx.fillStyle = '#3c2f52';
            ctx.fillRect(tx + 2, ty + 2, TILE_SZ - 4, 6);
            ctx.fillRect(tx + 2, ty + 12, TILE_SZ - 4, 6);
            ctx.fillRect(tx + 2, ty + 22, TILE_SZ - 4, 6);
          } else {
            // Suelo de roca volcánica
            ctx.fillStyle = '#171124';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);
            ctx.strokeStyle = '#1e162f';
            ctx.strokeRect(tx, ty, TILE_SZ, TILE_SZ);

            if (tile === 4) {
              // Rieles de mina
              ctx.fillStyle = '#4a3b63';
              ctx.fillRect(tx + 4, ty + 6, TILE_SZ - 8, 3);
              ctx.fillRect(tx + 4, ty + 22, TILE_SZ - 8, 3);
              ctx.fillStyle = '#6b528f';
              ctx.fillRect(tx + 12, ty + 2, 4, TILE_SZ - 4);
            } else if (tile === 5) {
              // Cristal de amatista
              ctx.fillStyle = '#c084fc';
              ctx.fillRect(tx + 12, ty + 8, 8, 14);
              ctx.fillStyle = '#e879f9';
              ctx.fillRect(tx + 14, ty + 10, 4, 8);
            }
          }
        }
      }

      // 2. COFRES EN EL MAPA
      this.chests.forEach(ch => {
        ctx.save();
        ctx.translate(ch.x, ch.y);

        if (ch.opened) {
          // Cofre abierto (tapa inclinada)
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-12, -4, 24, 16);
          ctx.fillStyle = '#44403c';
          ctx.fillRect(-14, -12, 28, 8);
        } else {
          // Cofre cerrado con detalles de su rareza
          const col = KEY_TIERS[ch.tier].color;
          ctx.fillStyle = '#292524';
          ctx.fillRect(-12, -10, 24, 20);
          ctx.fillStyle = col;
          ctx.fillRect(-12, -3, 24, 4); // Franja
          ctx.fillRect(-3, -2, 6, 6);   // Cerradura dorada/prisma

          if (ch.tier === 'obsidian') {
            // Aura mística para el Cofre Ancestral
            const aura = (Math.sin(now * 0.008) + 1) * 0.5;
            ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 + aura * 0.4})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(-16, -14, 32, 28);
          }
        }

        // Nombre del cofre encima
        ctx.fillStyle = KEY_TIERS[ch.tier].color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ch.name, 0, -16);
        ctx.restore();
      });

      // 3. LLAVES DROPEADAS EN EL SUELO (Sprite limpio sin marco)
      this.droppedKeys.forEach(k => {
        const bobY = Math.sin(k.bob) * 3;
        KEY_TIERS[k.tier].draw(ctx, k.x, k.y + bobY, 18);
      });

      // 4. ENEMIGOS DEL BIOMA
      this.enemies.forEach(en => {
        ctx.save();
        ctx.translate(en.x, en.y);

        if (en.type === 'zombie_miner') {
          // MINERO ZOMBI: Casco minero amarillo, piel verdosa de magma, pico
          const isWalking = (Math.floor(now * 0.01) % 2 === 0);
          // Cuerpo
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(-8, -6, 16, 16);
          // Cabeza zombi
          ctx.fillStyle = '#15803d';
          ctx.fillRect(-6, -14, 12, 10);
          // Casco minero con linterna
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-8, -18, 16, 5);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-2, -16, 4, 4); // Linterna
          // Pico minero
          ctx.fillStyle = '#64748b';
          ctx.fillRect(8, -4, 4, 12);
          ctx.fillRect(6, -8, 8, 4);
        } else if (en.type === 'skeleton_archer') {
          // ARQUERO ESQUELETO CALCINADO: Huesos negros, ojos de fuego, arco
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-6, -6, 12, 14); // Costillas negras
          ctx.fillRect(-5, -14, 10, 8); // Cráneo
          // Ojos de fuego
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(-3, -12, 2, 2);
          ctx.fillRect(1, -12, 2, 2);
          // Arco de madera
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(8, 0, 8, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        } else if (en.type === 'golem_boss') {
          // GÓLEM COLOSO DE OBSIDIANA (Jefe 48x48)
          ctx.fillStyle = '#0f0a17';
          ctx.fillRect(-22, -22, 44, 44);
          ctx.fillStyle = '#291b3d';
          ctx.fillRect(-18, -18, 36, 36);
          // Grietas de magma ardiente
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(-10, -10, 20, 4);
          ctx.fillRect(-4, -6, 8, 16);
          ctx.fillRect(-12, 6, 24, 4);
          // Ojos de amatista brillante
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(-12, -16, 6, 4);
          ctx.fillRect(6, -16, 6, 4);
        }

        ctx.restore();

        // Barra de vida
        const hpPct = Math.max(0, en.hp / en.maxHp);
        ctx.fillStyle = '#000';
        ctx.fillRect(en.x - 14, en.y - en.radius - 8, 28, 4);
        ctx.fillStyle = en.type === 'golem_boss' ? '#c084fc' : '#ef4444';
        ctx.fillRect(en.x - 14, en.y - en.radius - 8, Math.round(28 * hpPct), 4);
      });

      // 5. BOTS ALIADOS
      this.teammates.forEach(tm => {
        ctx.save();
        ctx.translate(tm.x, tm.y);
        ctx.rotate(tm.angle || 0);
        ctx.fillStyle = '#065f46';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tm.name, tm.x, tm.y - 14);
      });

      // 6. EL JUGADOR (Vanguardia con Armadura)
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.player.angle);

      // Armadura de explorador
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-6, -6, 12, 12);
      // Casco con visor azul
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -3, 4, 6);

      // Espada de Obsidiana en mano
      ctx.fillStyle = '#475569';
      ctx.fillRect(7, 2, 12, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(9, 3, 8, 1);

      ctx.restore();

      // Animación de Corte de Espada en Abanico Melee
      if (this.player.isAttacking) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.attackAngle);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 42, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
        ctx.restore();
      }

      // Nombre y vida del jugador
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.currentUser.name || 'Tú', this.player.x, this.player.y - 18);

      const pPct = Math.max(0, this.player.hp / this.player.maxHp);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(this.player.x - 16, this.player.y - 14, 32, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(this.player.x - 16, this.player.y - 14, Math.round(32 * pPct), 4);

      // 7. PROYECTILES
      this.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - p.radius), Math.round(p.y - p.radius), p.radius * 2, p.radius * 2);
      });

      // 8. PARTÍCULAS
      this.particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size || 2, pt.size || 2);
      });

      // 9. TEXTOS FLOTANTES
      this.floatingTexts.forEach(ft => {
        ctx.fillStyle = '#000';
        ctx.font = `bold ${ft.size || 12}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
      });

      ctx.restore();
    }

    startLoop() {
      this.running = true;
      let lastTime = performance.now();

      const loop = (time) => {
        if (!this.running) return;
        const dt = Math.min(0.1, (time - lastTime) / 1000);
        lastTime = time;

        this.update(dt);
        this.render();

        this.animId = requestAnimationFrame(loop);
      };

      this.animId = requestAnimationFrame(loop);
    }

    destroy() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      this.canvas.removeEventListener('mousemove', this.onMouseMove);
      this.canvas.removeEventListener('mousedown', this.onMouseDown);
      this.canvas.removeEventListener('mouseup', this.onMouseUp);
      this.canvas.removeEventListener('contextmenu', this.onContextMenu);
      if (this.socket && this.onSocketMsg) {
        this.socket.removeEventListener('message', this.onSocketMsg);
      }
      this.container.innerHTML = '';
    }
  }

  // Exportar al entorno global
  global.CyberDefenseGame = CyberDefenseGame;

})(window);
