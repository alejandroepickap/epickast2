// EpicKast: Dungeons of the Core • Minas de Magma & Obsidiana (Beta v1.7.5 Pro)
// Action-RPG de Mazmorras con:
// 1. Motor Visual 2.5D Isométrico Voxel estilo Minecraft Dungeons:
//    - Bloques de obsidiana 3D con cara superior iluminada, bisel lateral y frontal de mampostería con sombras.
//    - Suelo de adoquines con losas individuales y mortero.
//    - Río de magma animado con oleaje térmico, vapor y brasas ardientes flotantes.
//    - Cono de linterna direccional del explorador y antorchas con resplandor cálido.
// 2. Sistema Completo de Apertura de Cofres Estilo CS:GO:
//    - Ruleta horizontal animada con >40 cartas de ítems pasando a alta velocidad.
//    - Sonido táctil 'tick' en cada carta al pasar el marcador central '▼'.
//    - Desaceleración 'cubic-bezier' suave y celebración con fanfarria.
//    - 4 Cofres asociados a sus 4 Llaves (Cobre, Plata, Oro y Obsidiana).
//    - El Cofre Ancestral de Obsidiana otorga el codiciado premio dorado ★:
//      ¡Marco de Avatar Azul 'FUNDADOR' de Primera Edición para tu perfil de EpicKast!
// 3. Físicas Blindadas: Knockback controlado contra colisiones de muros y candado de bordes.
// 4. Botón '🔄 Reiniciar' en la barra superior.

(function(global) {
  'use strict';

  // --- Motor de Audio Web Audio Sintetizado ---
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
    tick() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(950, t);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.04);
      } catch {}
    },
    swordSlash() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(360, t);
        o.frequency.exponentialRampToValueAtTime(70, t + 0.1);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.11);
      } catch {}
    },
    bowShot() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(700, t);
        o.frequency.exponentialRampToValueAtTime(180, t + 0.12);
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
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.09);
      } catch {}
    },
    playerHurt() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.17);
      } catch {}
    },
    keyPickup() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(880, t);
        o.frequency.setValueAtTime(1174, t + 0.05);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.19);
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
          g.gain.setValueAtTime(0.07, t + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.28);
        });
      } catch {}
    },
    founderUnlocked() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t + i * 0.08);
          g.gain.setValueAtTime(0.001, t + i * 0.08);
          g.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.5);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.55);
        });
      } catch {}
    }
  };

  // --- Almacenamiento Local (0 KB en Servidor Render) ---
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
      unlockedItems: ['dagger_copper', 'potion_heal'],
      highWave: 1
    };
  }

  function saveDungeonData(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      if (data.founderFrameUnlocked) {
        localStorage.setItem('epickast.equipped_frame', 'founder_blue');
      }
    } catch {}
  }

  // --- Catálogo de Ítems de la Ruleta CS:GO por Cofre ---
  const CHEST_REWARDS = {
    copper: [
      { id: 'coins_50', name: 'Bolsa de 50 Monedas', type: 'Monedas', rarity: 'milspec', color: '#60a5fa', desc: '+50 Monedas para la tienda' },
      { id: 'potion_heal', name: 'Poción de Salud', type: 'Consumible', rarity: 'milspec', color: '#4ade80', desc: '+35 Salud inmediata' },
      { id: 'dagger_copper', name: 'Daga Rústica de Cobre', type: 'Arma', rarity: 'milspec', color: '#93c5fd', desc: '+15% Velocidad de ataque' },
      { id: 'shield_wood', name: 'Escudo Táctico de Roble', type: 'Defensa', rarity: 'restricted', color: '#c084fc', desc: 'Reduce daño recibido un 10%' },
      { id: 'badge_copper', name: 'Insignia: Minero Novato', type: 'Prestigio', rarity: 'classified', color: '#f472b6', desc: 'Distintivo al lado de tu nombre' }
    ],
    silver: [
      { id: 'coins_150', name: 'Cofrecillo de 150 Monedas', type: 'Monedas', rarity: 'milspec', color: '#60a5fa', desc: '+150 Monedas' },
      { id: 'crossbow_silver', name: 'Ballesta Rúnica de Plata', type: 'Arma', rarity: 'restricted', color: '#c084fc', desc: '+30 Daño a distancia' },
      { id: 'shield_silver', name: 'Escudo de Plata Pulida', type: 'Defensa', rarity: 'restricted', color: '#a78bfa', desc: 'Reduce daño recibido un 20%' },
      { id: 'mail_magma', name: 'Cota de Malla Volcánica', type: 'Armadura', rarity: 'classified', color: '#f472b6', desc: '+40 Salud Máxima' },
      { id: 'badge_silver', name: 'Insignia: Explorador de Plata', type: 'Prestigio', rarity: 'covert', color: '#ef4444', desc: 'Insignia brillante en chat' }
    ],
    gold: [
      { id: 'coins_300', name: 'Saco de 300 Monedas Reales', type: 'Monedas', rarity: 'restricted', color: '#c084fc', desc: '+300 Monedas' },
      { id: 'sword_fire', name: 'Espada Flamígera Real', type: 'Arma', rarity: 'classified', color: '#f472b6', desc: 'Corte ígneo con quemadura' },
      { id: 'armor_heavy', name: 'Armadura Pesada de Magma', type: 'Armadura', rarity: 'covert', color: '#ef4444', desc: '+60 Salud Máxima' },
      { id: 'nick_glow_gold', name: '★ Nombre Dorado Brillante ★', type: 'Cosmético', rarity: 'gold', color: '#fbbf24', desc: 'Tu nombre resplandece en oro' },
      { id: 'founder_frame', name: '★ MARCO DE AVATAR: FUNDADOR ★', type: 'Gran Premio', rarity: 'gold', color: '#38bdf8', desc: 'El Marco Azul Oficial para tu perfil' }
    ],
    obsidian: [
      { id: 'sword_core', name: 'Espada Devastadora del Núcleo', type: 'Arma Mítica', rarity: 'covert', color: '#ef4444', desc: 'Corte sísmico con 75 daño' },
      { id: 'crossbow_void', name: 'Ballesta Titánica de Vacío', type: 'Arma Mítica', rarity: 'covert', color: '#ec4899', desc: 'Proyectil penetrante masivo' },
      { id: 'armor_colossus', name: 'Armadura del Gólem Coloso', type: 'Armadura Mítica', rarity: 'covert', color: '#f43f5e', desc: '+80 Salud Máxima y Resistencia' },
      { id: 'founder_frame', name: '★ MARCO DE AVATAR: FUNDADOR ★', type: 'GRAN PREMIO', rarity: 'gold', color: '#38bdf8', desc: '¡El Marco Azul de Primera Edición para tu Perfil!' }
    ]
  };

  const RARITY_COLORS = {
    milspec: '#4b69ff',    // Azul Común
    restricted: '#8847ff', // Púrpura Raro
    classified: '#d32ce6', // Fucsia Épico
    covert: '#eb4b4b',     // Rojo Legendario
    gold: '#fbbf24'        // Dorado Especial Extraordinario
  };

  // --- Catálogo de Llaves (Sprites Limpios sin marco) ---
  const KEY_TIERS = {
    copper: {
      name: 'Llave de Cobre',
      color: '#d97706',
      draw(ctx, x, y, size = 18) {
        ctx.save();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.25, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x - size * 0.08, y, size * 0.16, size * 0.7);
        ctx.fillRect(x, y + size * 0.45, size * 0.25, size * 0.12);
        ctx.fillRect(x, y + size * 0.62, size * 0.2, size * 0.1);
        ctx.restore();
      }
    },
    silver: {
      name: 'Llave de Plata',
      color: '#cbd5e1',
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
      color: '#fbbf24',
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
      draw(ctx, x, y, size = 20) {
        ctx.save();
        ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.75, 0, Math.PI * 2);
        ctx.fill();
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

  // --- MAPA 24x15 (Baldosas 32x32) ---
  const COLS = 24;
  const ROWS = 15;
  const TILE_SZ = 32;

  const LEVEL_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,5,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,5,0,1],
    [1,0,0,0,4,0,0,0,0,0,1,2,2,1,0,0,0,0,0,4,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,1], // Puente Norte
    [1,0,0,1,1,0,0,0,0,0,3,3,3,3,0,0,0,0,0,1,1,0,0,1],
    [1,1,0,1,1,0,0,0,0,0,1,2,2,1,0,0,0,0,0,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1], // Pasaje central
    [1,1,0,1,1,0,0,0,0,0,1,2,2,1,0,0,0,0,0,1,1,0,1,1],
    [1,0,0,1,1,0,0,0,0,0,3,3,3,3,0,0,0,0,0,1,1,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,1], // Puente Sur
    [1,0,0,0,4,0,0,0,0,0,1,2,2,1,0,0,0,0,0,4,0,0,0,1],
    [1,0,5,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,5,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,2,2,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  class CyberDefenseGame {
    constructor(container, socket, roomKey, currentUser, options) {
      this.container = container;
      this.socket = socket;
      this.roomKey = roomKey || 'dungeon_room';
      this.currentUser = currentUser || { name: 'Explorador', id: 'p1' };
      this.options = options || {};

      this.data = loadDungeonData();

      this.width = COLS * TILE_SZ; // 768px
      this.height = ROWS * TILE_SZ; // 480px

      // Jugador
      this.player = {
        x: 160,
        y: 240,
        speed: 185,
        hp: 140, maxHp: 140,
        angle: 0,
        radius: 12,
        attackCooldown: 0,
        isAttacking: false,
        attackAngle: 0,
        attackTimer: 0
      };

      // Controles
      this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, Space: false };
      this.mouse = { x: 384, y: 240, isDown: false, rightDown: false };

      // Entidades
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.droppedKeys = [];
      this.floatingTexts = [];
      this.teammates = new Map();

      // Cofres en la arena
      this.chests = [
        { id: 'copper', x: 80, y: 80, tier: 'copper', opened: !!this.data.chestsOpened.copper, name: 'Cofre Rústico' },
        { id: 'silver', x: 688, y: 80, tier: 'silver', opened: !!this.data.chestsOpened.silver, name: 'Sagrario de Plata' },
        { id: 'gold', x: 80, y: 400, tier: 'gold', opened: !!this.data.chestsOpened.gold, name: 'Cofre Real Dorado' },
        { id: 'core', x: 384, y: 240, tier: 'obsidian', opened: !!this.data.chestsOpened.core, name: '★ Cofre Ancestral ★' }
      ];

      // Estado
      this.wave = 1;
      this.maxWaves = 3;
      this.gameState = 'play';
      this.shakeIntensity = 0;
      this.running = false;
      this.animId = null;

      // Antorchas con luz dinámica
      this.torches = [
        { x: 192, y: 128 }, { x: 192, y: 352 },
        { x: 576, y: 128 }, { x: 576, y: 352 },
        { x: 384, y: 96 },  { x: 384, y: 384 }
      ];

      this.initDom();
      this.bindInputs();
      this.bindSocket();
      this.startWave(1);
      this.startLoop();
    }

    initDom() {
      this.container.innerHTML = `
        <div class="cd-wrap" style="position:relative; width: 1040px; max-width: 98vw; background:#0b0813; border:1px solid #36224d; border-radius:12px; overflow:hidden; box-shadow:0 16px 50px rgba(0,0,0,0.9); font-family:system-ui, -apple-system, sans-serif;">
          
          <!-- Encabezado con Botones de Acción -->
          <div class="cd-header" style="background:#150f24; border-bottom:1px solid #2d1d44; padding:10px 16px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">🌋</span>
              <div>
                <strong style="color:#f8fafc; font-size:15px; letter-spacing:0.5px;">Dungeons of the Core • Minas de Magma</strong>
                <span style="background:#7c3aed; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; margin-left:6px;">BETA v1.7.5</span>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <div style="color:#fca5a5; font-size:12px; font-weight:700;">❤️ Salud: <b id="dHp" style="color:#fff;">140/140</b></div>
              <div style="color:#fde047; font-size:12px; font-weight:700;">💰 Monedas: <b id="dCoins" style="color:#fff;">${this.data.coins}</b></div>
              <div style="color:#c084fc; font-size:12px; font-weight:700;">⚔️ Oleada: <b id="dWave" style="color:#fff;">1/3</b></div>
            </div>

            <div style="display:flex; gap:8px;">
              <button id="dBtnRestart" class="cd-btn" style="background:#ca8a04; border-color:#eab308; color:#fff; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer;" title="Reiniciar la mazmorra">🔄 Reiniciar</button>
              <button id="dBtnInvite" class="cd-btn" style="background:#059669; border-color:#10b981; color:#fff; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer;" title="Invitar a los miembros de la llamada">📢 Invitar</button>
              <button id="dBtnBot" class="cd-btn" style="background:#2563eb; border-color:#3b82f6; color:#fff; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer;">🤖 +Aliado</button>
              <button id="dBtnClose" class="cd-btn" style="background:#334155; border-color:#475569; color:#fff; padding:6px 12px; border-radius:6px; cursor:pointer;">✕ Salir</button>
            </div>
          </div>

          <!-- Canvas + Panel Lateral -->
          <div style="display:flex; background:#08050e;">
            <div style="position:relative; width:768px; height:480px; flex:none;">
              <canvas id="dCanvas" width="768" height="480" style="display:block; image-rendering:pixelated; cursor:crosshair;"></canvas>
              
              <div id="dChestPrompt" style="display:none; position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(18, 12, 28, 0.94); border:1px solid #c084fc; padding:8px 18px; border-radius:8px; color:#f8fafc; font-size:12px; font-weight:700; box-shadow:0 4px 18px rgba(0,0,0,0.8); pointer-events:none;">
                Presiona <b style="color:#38bdf8;">ESPACIO</b> o haz <b style="color:#38bdf8;">CLIC</b> para abrir la Ruleta
              </div>
            </div>

            <!-- Panel Lateral de Llaves & Ruleta CS:GO -->
            <div style="flex:1; background:#110c1c; border-left:1px solid #291b3b; padding:14px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; max-height:480px;">
              
              <!-- Botón Gigante: Abrir Ruleta CS:GO -->
              <button id="dBtnOpenRoulette" style="width:100%; font-size:12px; font-weight:900; background:linear-gradient(135deg, #d97706, #b45309); border:1px solid #fbbf24; color:#fff; padding:12px 10px; border-radius:8px; cursor:pointer; box-shadow:0 4px 16px rgba(245,158,11,0.35); text-transform:uppercase; letter-spacing:0.5px;">
                🎁 ABRIR COFRES (RULETA CS:GO)
              </button>

              <!-- LLAVES CRIPTOGRÁFICAS (Clickables para abrir cofre) -->
              <div style="background:#181126; border:1px solid #33204d; border-radius:8px; padding:10px;">
                <h4 style="margin:0 0 8px 0; color:#e2e8f0; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">🔑 Tus Llaves (Clic para abrir)</h4>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                  <div id="dKeyCardCopper" style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; cursor:pointer; border:1px solid #78350f;">
                    <canvas id="keyCopperIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#d97706; font-size:11px; font-weight:700;">Cobre</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountCopper" style="color:#fff;">${this.data.keys.copper}</b></div>
                    </div>
                  </div>

                  <div id="dKeyCardSilver" style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; cursor:pointer; border:1px solid #475569;">
                    <canvas id="keySilverIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#cbd5e1; font-size:11px; font-weight:700;">Plata</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountSilver" style="color:#fff;">${this.data.keys.silver}</b></div>
                    </div>
                  </div>

                  <div id="dKeyCardGold" style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; cursor:pointer; border:1px solid #ca8a04;">
                    <canvas id="keyGoldIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#fbbf24; font-size:11px; font-weight:700;">Oro</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountGold" style="color:#fff;">${this.data.keys.gold}</b></div>
                    </div>
                  </div>

                  <div id="dKeyCardObsidian" style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; cursor:pointer; border:1px solid rgba(192,132,252,0.6); box-shadow:0 0 8px rgba(192,132,252,0.2);">
                    <canvas id="keyObsidianIco" width="22" height="24"></canvas>
                    <div>
                      <div style="color:#c084fc; font-size:11px; font-weight:700;">Obsidiana</div>
                      <div style="color:#94a3b8; font-size:10px;">x<b id="kCountObsidian" style="color:#fff;">${this.data.keys.obsidian}</b></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CONTROLES -->
              <div style="background:#181126; border:1px solid #33204d; border-radius:8px; padding:10px;">
                <h4 style="margin:0 0 6px 0; color:#e2e8f0; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">⚔️ Combate (Estilo Dungeons)</h4>
                <div style="font-size:11px; color:#cbd5e1; line-height:1.5;">
                  <div>🗡️ <b>Clic Izq / Espacio:</b> Espadazo melee con empuje (knockback).</div>
                  <div>🏹 <b>Clic Der / Tecla E:</b> Flecha de ballesta rúnica.</div>
                  <div>⌨️ <b>WASD:</b> Movimiento con deslizamiento suave en muros.</div>
                </div>
              </div>

              <!-- PRESTIGIO: MARCO FUNDADOR -->
              <div id="dFounderCard" style="background:#141726; border:1px solid ${this.data.founderFrameUnlocked ? '#38bdf8' : '#334155'}; border-radius:8px; padding:10px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                  <span style="font-size:10px; font-weight:800; color:#38bdf8; letter-spacing:0.5px;">💎 RECOMPENSA DE PRESTIGIO</span>
                  <span id="dFounderBadge" style="font-size:9px; font-weight:800; padding:2px 6px; border-radius:4px; ${this.data.founderFrameUnlocked ? 'background:#0284c7;color:#fff;' : 'background:#334155;color:#94a3b8;'}">
                    ${this.data.founderFrameUnlocked ? '✓ DESBLOQUEADO' : '🔒 BLOQUEADO'}
                  </span>
                </div>

                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="position:relative; width:40px; height:40px; flex:none;">
                    <div style="width:36px; height:36px; border-radius:50%; background:#0284c7; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:15px; box-shadow:0 0 0 2px #0284c7, 0 0 10px rgba(56, 189, 248, 0.75);">
                      ${(this.currentUser.name || 'T')[0].toUpperCase()}
                    </div>
                    <div style="position:absolute; bottom:-3px; left:50%; transform:translateX(-50%) scale(0.72); background:linear-gradient(135deg, #0284c7, #2563eb); color:#fff; font-size:8px; font-weight:900; letter-spacing:0.5px; padding:1px 4px; border-radius:3px; border:1px solid #38bdf8; white-space:nowrap;">
                      FUNDADOR
                    </div>
                  </div>

                  <div style="font-size:11px; color:#cbd5e1;">
                    <strong style="color:#fff; display:block;">Marco de Avatar 'FUNDADOR'</strong>
                    <span style="color:#94a3b8; font-size:10px;">Obtenible en la ruleta del Cofre Ancestral de Obsidiana.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- MODAL DE RULETA CS:GO (Oculto por defecto) -->
          <div id="dRouletteOverlay" style="display:none; position:absolute; inset:0; z-index:999; background:rgba(7,5,12,0.94); backdrop-filter:blur(6px); padding:20px; flex-direction:column; justify-content:center; align-items:center;">
            <div class="cd-crate-dialog" style="background:#130e20; border:2px solid #ca8a04; border-radius:12px; padding:20px; box-shadow:0 0 40px rgba(202,138,4,0.3);">
              
              <div class="crate-top" style="margin-bottom:12px;">
                <h2 id="rModalTitle" style="color:#fbbf24; font-size:18px; font-weight:900; letter-spacing:0.5px;">🎁 APERTURA DE COFRE • RULETA ESTILO CS:GO</h2>
                <button id="rBtnClose" class="cd-btn" style="background:#334155; color:#fff; padding:6px 14px; border-radius:6px; cursor:pointer;">✕ Volver</button>
              </div>

              <!-- Selector de Cofre / Llave -->
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-bottom:14px;">
                <button class="rTabBtn" data-tier="copper" style="background:#1e140a; border:2px solid #d97706; color:#fde047; padding:8px 4px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:700;">
                  🥉 Cofre Cobre<br><span style="color:#94a3b8; font-size:10px;">Llaves: <b id="rKeyCopper">${this.data.keys.copper}</b></span>
                </button>
                <button class="rTabBtn" data-tier="silver" style="background:#111827; border:1px solid #475569; color:#cbd5e1; padding:8px 4px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:700;">
                  🥈 Sagrario Plata<br><span style="color:#94a3b8; font-size:10px;">Llaves: <b id="rKeySilver">${this.data.keys.silver}</b></span>
                </button>
                <button class="rTabBtn" data-tier="gold" style="background:#1c1305; border:1px solid #78350f; color:#fbbf24; padding:8px 4px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:700;">
                  🥇 Cofre Oro<br><span style="color:#94a3b8; font-size:10px;">Llaves: <b id="rKeyGold">${this.data.keys.gold}</b></span>
                </button>
                <button class="rTabBtn" data-tier="obsidian" style="background:#170a24; border:1px solid #581c87; color:#c084fc; padding:8px 4px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:700;">
                  💎 Ancestral Núcleo<br><span style="color:#94a3b8; font-size:10px;">Llaves: <b id="rKeyObsidian">${this.data.keys.obsidian}</b></span>
                </button>
              </div>

              <!-- Ruleta Horizontal -->
              <div class="roulette-viewport" style="position:relative; width:100%; height:135px; background:#08050e; border:2px solid #ca8a04; border-radius:10px; overflow:hidden; box-shadow:inset 0 0 20px #000;">
                <div class="roulette-marker" style="position:absolute; top:0; left:50%; transform:translateX(-50%); color:#fbbf24; font-size:20px; z-index:10;">▼</div>
                <div id="rTrack" class="roulette-track" style="display:flex; gap:8px; padding:12px 10px; will-change:transform;"></div>
              </div>

              <!-- Botón Girar Ruleta -->
              <div style="text-align:center; margin-top:14px;">
                <button id="rBtnSpin" style="background:linear-gradient(135deg, #eab308, #ca8a04); border:none; color:#0b0813; font-weight:900; font-size:14px; padding:12px 36px; border-radius:8px; cursor:pointer; box-shadow:0 0 20px rgba(234,179,8,0.5); text-transform:uppercase; letter-spacing:0.8px;">
                  🔓 DESBLOQUEAR Y GIRAR RULETA (1 LLAVE)
                </button>
              </div>

              <!-- Área de Ganador -->
              <div id="rWinnerArea" style="display:none; margin-top:14px; padding:12px; background:#1c142b; border:2px solid #38bdf8; border-radius:8px; text-align:center;"></div>

            </div>
          </div>

        </div>
      `;

      this.canvas = this.container.querySelector('#dCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.promptEl = this.container.querySelector('#dChestPrompt');
      this.rouletteOverlay = this.container.querySelector('#dRouletteOverlay');

      this.currentSelectedTier = 'copper';
      this.isSpinning = false;

      this.renderKeyIcons();
      this.initRouletteEvents();
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

    // --- Sistema de Ruleta CS:GO ---
    initRouletteEvents() {
      // Botón principal del sidebar
      const btnOpen = this.container.querySelector('#dBtnOpenRoulette');
      if (btnOpen) {
        btnOpen.onclick = () => this.openRouletteModal(this.getBestAvailableTier());
      }

      // Clics en las tarjetas de llaves del sidebar
      ['copper', 'silver', 'gold', 'obsidian'].forEach(tier => {
        const card = this.container.querySelector(`#dKeyCard${tier[0].toUpperCase() + tier.slice(1)}`);
        if (card) {
          card.onclick = () => this.openRouletteModal(tier);
        }
      });

      // Botón cerrar ruleta
      const btnClose = this.container.querySelector('#rBtnClose');
      if (btnClose) {
        btnClose.onclick = () => {
          if (!this.isSpinning) this.rouletteOverlay.style.display = 'none';
        };
      }

      // Pestañas de cofres en el modal
      this.container.querySelectorAll('.rTabBtn').forEach(btn => {
        btn.onclick = () => {
          if (this.isSpinning) return;
          this.selectRouletteTier(btn.dataset.tier);
        };
      });

      // Botón de girar
      const btnSpin = this.container.querySelector('#rBtnSpin');
      if (btnSpin) {
        btnSpin.onclick = () => this.spinRoulette();
      }
    }

    getBestAvailableTier() {
      if (this.data.keys.obsidian > 0) return 'obsidian';
      if (this.data.keys.gold > 0) return 'gold';
      if (this.data.keys.silver > 0) return 'silver';
      return 'copper';
    }

    openRouletteModal(tier = 'copper') {
      this.selectRouletteTier(tier);
      this.rouletteOverlay.style.display = 'flex';
      this.container.querySelector('#rWinnerArea').style.display = 'none';
    }

    selectRouletteTier(tier) {
      this.currentSelectedTier = tier;
      const title = this.container.querySelector('#rModalTitle');
      const names = {
        copper: '🥉 COFRE RÚSTICO DE COBRE • RULETA CS',
        silver: '🥈 SAGRARIO DE PLATA • RULETA CS',
        gold: '🥇 COFRE REAL DORADO • RULETA CS',
        obsidian: '💎 COFRE ANCESTRAL DEL NÚCLEO • RULETA CS'
      };
      if (title) title.textContent = names[tier] || names.copper;

      // Actualizar bordes de pestañas
      this.container.querySelectorAll('.rTabBtn').forEach(b => {
        if (b.dataset.tier === tier) {
          b.style.borderColor = '#fbbf24';
          b.style.boxShadow = '0 0 10px rgba(251,191,36,0.3)';
        } else {
          b.style.borderColor = '#334155';
          b.style.boxShadow = 'none';
        }
      });

      // Actualizar botón de girar según llaves disponibles
      const hasKey = (this.data.keys[tier] || 0) > 0;
      const btnSpin = this.container.querySelector('#rBtnSpin');
      if (btnSpin) {
        btnSpin.disabled = !hasKey;
        btnSpin.style.opacity = hasKey ? '1' : '0.5';
        btnSpin.style.cursor = hasKey ? 'pointer' : 'not-allowed';
        btnSpin.innerHTML = hasKey 
          ? `🔓 ABRIR ${tier.toUpperCase()} (Consume 1 Llave de ${KEY_TIERS[tier].name})`
          : `🔒 NECESITAS 1 ${KEY_TIERS[tier].name.toUpperCase()} (Obtenla derrotando enemigos)`;
      }

      this.populateRouletteTrackPreview(tier);
    }

    populateRouletteTrackPreview(tier) {
      const track = this.container.querySelector('#rTrack');
      if (!track) return;
      track.style.transition = 'none';
      track.style.transform = 'translateX(0px)';

      const pool = CHEST_REWARDS[tier] || CHEST_REWARDS.copper;
      let html = '';
      for (let i = 0; i < 20; i++) {
        const item = pool[i % pool.length];
        const rColor = RARITY_COLORS[item.rarity] || '#4b69ff';
        html += `
          <div class="roulette-card" style="width:120px; height:108px; flex-shrink:0; background:#110c1c; border:2px solid ${rColor}; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px; box-shadow:0 4px 10px rgba(0,0,0,0.5);">
            <div style="font-size:9px; font-weight:800; color:${rColor}; text-transform:uppercase; margin-bottom:4px;">${item.type}</div>
            <div style="font-size:11px; font-weight:800; color:#fff; line-height:1.2; text-align:center;">${item.name}</div>
          </div>
        `;
      }
      track.innerHTML = html;
    }

    spinRoulette() {
      const tier = this.currentSelectedTier;
      if (this.isSpinning || (this.data.keys[tier] || 0) <= 0) return;

      this.isSpinning = true;
      this.data.keys[tier]--;
      saveDungeonData(this.data);
      this.updateUi();

      const btnSpin = this.container.querySelector('#rBtnSpin');
      if (btnSpin) btnSpin.disabled = true;

      const track = this.container.querySelector('#rTrack');
      const winnerArea = this.container.querySelector('#rWinnerArea');
      winnerArea.style.display = 'none';

      const pool = CHEST_REWARDS[tier] || CHEST_REWARDS.copper;

      // Decidir el ganador según el tipo de cofre
      let winner;
      if (tier === 'obsidian') {
        // En el cofre de obsidiana, el Marco Fundador tiene 75% o si no lo tiene, lo gana!
        winner = !this.data.founderFrameUnlocked 
          ? pool.find(i => i.id === 'founder_frame') || pool[0]
          : pool[Math.floor(Math.random() * pool.length)];
      } else if (tier === 'gold') {
        winner = pool[Math.floor(Math.random() * pool.length)];
      } else {
        winner = pool[Math.floor(Math.random() * (pool.length - 1))]; // Comunes/Raros
      }

      // Generar carril de 50 cartas con el ganador en el índice 40
      const totalCards = 50;
      const winnerIndex = 40;
      const cards = [];

      for (let i = 0; i < totalCards; i++) {
        cards.push(i === winnerIndex ? winner : pool[Math.floor(Math.random() * pool.length)]);
      }

      track.innerHTML = cards.map(c => {
        const rColor = RARITY_COLORS[c.rarity] || '#4b69ff';
        return `
          <div class="roulette-card" style="width:120px; height:108px; flex-shrink:0; background:#110c1c; border:2px solid ${rColor}; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px; box-shadow:0 4px 10px rgba(0,0,0,0.5);">
            <div style="font-size:9px; font-weight:800; color:${rColor}; text-transform:uppercase; margin-bottom:4px;">${c.type}</div>
            <div style="font-size:11px; font-weight:800; color:#fff; line-height:1.2; text-align:center;">${c.name}</div>
          </div>
        `;
      }).join('');

      // Calcular el desplazamiento exacto para centrar la carta ganadora
      const cardWidth = 128; // 120px + 8px gap
      const viewportWidth = 720;
      const jitter = (Math.random() - 0.5) * 50; // variación aleatoria suave dentro de la carta
      const targetOffset = (winnerIndex * cardWidth) - (viewportWidth / 2) + (cardWidth / 2) + jitter;

      track.style.transition = 'none';
      track.style.transform = 'translateX(0px)';
      track.offsetHeight; // forzar reflow

      // Audio de ticks mientras pasa cada carta
      const duration = 5200; // 5.2 segundos
      const startTime = performance.now();
      let lastCardTick = -1;

      const tickInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= duration) {
          clearInterval(tickInterval);
          return;
        }
        // Progreso con desaceleración cúbica
        const p = 1 - Math.pow(1 - (elapsed / duration), 3);
        const currentX = p * targetOffset;
        const currentCard = Math.floor((currentX + (viewportWidth / 2)) / cardWidth);

        if (currentCard !== lastCardTick && currentCard < totalCards) {
          lastCardTick = currentCard;
          AudioFX.tick();
        }
      }, 25);

      // Deslizar con animación física
      track.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.33, 1)`;
      track.style.transform = `translateX(-${targetOffset}px)`;

      // Al terminar de girar
      setTimeout(() => {
        this.isSpinning = false;
        AudioFX.chestOpen();

        // Aplicar recompensa del ganador
        this.grantReward(winner);

        // Mostrar ganador en el modal
        const rColor = RARITY_COLORS[winner.rarity] || '#4b69ff';
        winnerArea.style.display = 'block';
        winnerArea.style.borderColor = rColor;
        winnerArea.innerHTML = `
          <div style="font-size:10px; font-weight:900; color:${rColor}; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">¡HAS OBTENIDO!</div>
          <div style="font-size:18px; font-weight:900; color:#fff; margin-bottom:6px;">${winner.name}</div>
          <div style="font-size:12px; color:#cbd5e1;">${winner.desc}</div>
        `;

        this.selectRouletteTier(this.currentSelectedTier);
      }, duration + 200);
    }

    grantReward(item) {
      if (item.id.startsWith('coins_')) {
        const amount = parseInt(item.id.split('_')[1]) || 50;
        this.data.coins += amount;
        this.spawnFloatingText(this.player.x, this.player.y - 20, `+${amount} Monedas`, '#fde047', 15);
      } else if (item.id === 'potion_heal') {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
        this.spawnFloatingText(this.player.x, this.player.y - 20, '+40 Salud', '#4ade80', 14);
      } else if (item.id === 'founder_frame') {
        this.data.founderFrameUnlocked = true;
        saveDungeonData(this.data);
        AudioFX.founderUnlocked();

        localStorage.setItem('epickast.equipped_frame', 'founder_blue');
        document.querySelectorAll(`.avatar[data-uid="${this.currentUser.id}"]`).forEach(n => n.classList.add('frame-founder'));

        this.showFounderUnlockedModal();
      } else {
        if (!this.data.unlockedItems) this.data.unlockedItems = [];
        if (!this.data.unlockedItems.includes(item.id)) {
          this.data.unlockedItems.push(item.id);
        }
        this.spawnFloatingText(this.player.x, this.player.y - 20, `¡${item.name} Desbloqueado!`, item.color, 14);
      }

      saveDungeonData(this.data);
      this.updateUi();
    }

    bindInputs() {
      this.onKeyDown = (e) => {
        if (this.keys.hasOwnProperty(e.code)) {
          this.keys[e.code] = true;
          e.preventDefault();
        }
        if (e.code === 'KeyE') this.shootCrossbow();
        if (e.code === 'Space') this.interactChest() || this.attackSword();
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

      // Botón Reiniciar Partida
      const btnRestart = this.container.querySelector('#dBtnRestart');
      if (btnRestart) {
        btnRestart.onclick = () => this.restartDungeon();
      }

      // Botón invitar
      const btnInv = this.container.querySelector('#dBtnInvite');
      if (btnInv) {
        btnInv.onclick = () => this.options.inviteAll?.();
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

    restartDungeon() {
      this.player.x = 160;
      this.player.y = 240;
      this.player.hp = this.player.maxHp;
      this.player.attackCooldown = 0;
      this.player.isAttacking = false;
      this.enemies = [];
      this.projectiles = [];
      this.droppedKeys = [];
      this.floatingTexts = [];
      this.gameState = 'play';
      this.startWave(1);
      AudioFX.keyPickup();
      this.spawnFloatingText(this.player.x, this.player.y - 20, '🔄 ¡Mazmorra Reiniciada!', '#fbbf24', 14);
    }

    bindSocket() {
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
        hp: 120, maxHp: 120,
        isBot: true,
        shootTimer: 0
      });
      AudioFX.keyPickup();
      this.spawnFloatingText(this.player.x, this.player.y - 20, '🤖 ¡Aliado se unió!', '#38bdf8');
    }

    // --- Ataque Melee: Espada con Knockback Controlado ---
    attackSword() {
      const now = performance.now();
      if (now - this.player.attackCooldown < 300) return;
      this.player.attackCooldown = now;
      this.player.isAttacking = true;
      this.player.attackAngle = this.player.angle;
      this.player.attackTimer = 140;

      AudioFX.swordSlash();

      const slashRange = 56;
      const slashArc = Math.PI * 0.75;

      this.enemies.forEach(en => {
        const dx = en.x - this.player.x;
        const dy = en.y - this.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < slashRange + en.radius) {
          const enAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enAngle - this.player.attackAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          if (diff < slashArc / 2) {
            const dmg = 42;
            en.hp -= dmg;
            AudioFX.hitEnemy();
            this.spawnFloatingText(en.x, en.y, `-${dmg}`, '#fde047');

            const kbDist = 18;
            en.knockX = Math.cos(this.player.attackAngle) * kbDist;
            en.knockY = Math.sin(this.player.attackAngle) * kbDist;

            for (let i = 0; i < 5; i++) {
              this.particles.push({
                x: en.x, y: en.y,
                vx: (Math.random() - 0.5) * 70, vy: (Math.random() - 0.5) * 70,
                color: '#f59e0b', life: 16, maxLife: 16, size: 3
              });
            }
          }
        }
      });
    }

    shootCrossbow() {
      const now = performance.now();
      if (now - (this.player.lastShotTime || 0) < 420) return;
      this.player.lastShotTime = now;

      AudioFX.bowShot();

      const ang = this.player.angle;
      const sx = this.player.x + Math.cos(ang) * 16;
      const sy = this.player.y + Math.sin(ang) * 16;

      this.projectiles.push({
        x: sx, y: sy,
        vx: Math.cos(ang) * 460,
        vy: Math.sin(ang) * 460,
        dmg: 30,
        color: '#c084fc',
        fromPlayer: true,
        life: 55,
        radius: 3
      });
    }

    getNearChest() {
      for (const ch of this.chests) {
        const d = Math.hypot(this.player.x - ch.x, this.player.y - ch.y);
        if (d < 42) return ch;
      }
      return null;
    }

    interactChest() {
      const ch = this.getNearChest();
      if (!ch) return false;

      // ¡Al interactuar con el cofre en el mundo, abre directamente la Ruleta CS:GO de ese cofre!
      this.openRouletteModal(ch.tier);
      return true;
    }

    showFounderUnlockedModal() {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed; inset:0; z-index:99999; background:rgba(6,8,15,0.85); display:flex; align-items:center; justify-content:center; backdrop-filter:blur(6px);';
      modal.innerHTML = `
        <div style="background:#0f1523; border:2px solid #38bdf8; border-radius:12px; padding:24px; width:440px; max-width:92vw; text-align:center; box-shadow:0 0 40px rgba(56,189,248,0.4); font-family:system-ui,sans-serif;">
          <div style="font-size:42px; margin-bottom:8px;">💎</div>
          <h2 style="color:#38bdf8; margin:0 0 6px 0; font-size:20px; font-weight:800; letter-spacing:0.5px;">¡RECOMPENSA DE PRESTIGIO DESBLOQUEADA!</h2>
          <p style="color:#e2e8f0; font-size:13px; line-height:1.5; margin:0 0 16px 0;">
            Has abierto el Cofre Ancestral del Núcleo y ganado la distinción oficial de Primera Edición:
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

    isWall(x, y) {
      const col = Math.floor(x / TILE_SZ);
      const row = Math.floor(y / TILE_SZ);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      const tile = LEVEL_MAP[row][col];
      return tile === 1 || tile === 2;
    }

    moveEntity(ent, vx, vy, dt) {
      const r = ent.radius || 12;

      const totalDx = vx * dt + (ent.knockX || 0);
      const totalDy = vy * dt + (ent.knockY || 0);

      ent.knockX = (ent.knockX || 0) * 0.72;
      ent.knockY = (ent.knockY || 0) * 0.72;
      if (Math.abs(ent.knockX) < 0.4) ent.knockX = 0;
      if (Math.abs(ent.knockY) < 0.4) ent.knockY = 0;

      ent.x += totalDx;
      if (this.isWall(ent.x - r, ent.y) || this.isWall(ent.x + r, ent.y)) {
        ent.x -= totalDx;
        ent.knockX = 0;
      }

      ent.y += totalDy;
      if (this.isWall(ent.x, ent.y - r) || this.isWall(ent.x, ent.y + r)) {
        ent.y -= totalDy;
        ent.knockY = 0;
      }

      const minX = TILE_SZ + r + 2;
      const maxX = this.width - TILE_SZ - r - 2;
      const minY = TILE_SZ + r + 2;
      const maxY = this.height - TILE_SZ - r - 2;

      ent.x = Math.max(minX, Math.min(maxX, ent.x));
      ent.y = Math.max(minY, Math.min(maxY, ent.y));

      if (this.isWall(ent.x, ent.y)) {
        ent.x += (ent.x < this.width / 2 ? 8 : -8);
        ent.y += (ent.y < this.height / 2 ? 8 : -8);
      }
    }

    startWave(num) {
      this.wave = num;
      this.enemies = [];
      this.droppedKeys = [];

      if (num === 1) {
        for (let i = 0; i < 6; i++) {
          this.spawnEnemy('zombie_miner', 460 + (i % 3) * 60, 110 + Math.floor(i / 3) * 90);
        }
      } else if (num === 2) {
        for (let i = 0; i < 5; i++) {
          this.spawnEnemy('zombie_miner', 480 + (i % 2) * 80, 130 + Math.floor(i / 2) * 90);
        }
        for (let i = 0; i < 3; i++) {
          this.spawnEnemy('skeleton_archer', 590, 120 + i * 90);
        }
      } else if (num === 3) {
        this.spawnEnemy('golem_boss', 580, 240);
        this.spawnEnemy('skeleton_archer', 610, 140);
        this.spawnEnemy('skeleton_archer', 610, 340);
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
        en.speed = 80;
        en.radius = 13;
        en.name = 'Minero Zombi';
      } else if (type === 'skeleton_archer') {
        en.hp = 50; en.maxHp = 50;
        en.speed = 65;
        en.radius = 12;
        en.name = 'Arquero Esqueleto';
      } else if (type === 'golem_boss') {
        en.hp = 650; en.maxHp = 650;
        en.speed = 52;
        en.radius = 26;
        en.name = 'Gólem de Obsidiana';
      }

      this.enemies.push(en);
    }

    spawnFloatingText(x, y, text, color = '#38bdf8', size = 12) {
      this.floatingTexts.push({ x, y, vy: -1.0, text, color, size, life: 0, maxLife: 42 });
    }

    update(dt) {
      if (this.gameState !== 'play') return;

      let dx = 0, dy = 0;
      if (this.keys.KeyW || this.keys.ArrowUp) dy -= 1;
      if (this.keys.KeyS || this.keys.ArrowDown) dy += 1;
      if (this.keys.KeyA || this.keys.ArrowLeft) dx -= 1;
      if (this.keys.KeyD || this.keys.ArrowRight) dx += 1;

      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
      this.moveEntity(this.player, dx * this.player.speed, dy * this.player.speed, dt);

      if (this.player.isAttacking) {
        this.player.attackTimer -= dt * 1000;
        if (this.player.attackTimer <= 0) this.player.isAttacking = false;
      }

      // Bots
      this.teammates.forEach(tm => {
        if (!tm.isBot) return;
        const dist = Math.hypot(this.player.x - tm.x, this.player.y - tm.y);
        if (dist > 65) {
          const a = Math.atan2(this.player.y - tm.y, this.player.x - tm.x);
          this.moveEntity(tm, Math.cos(a) * 140, Math.sin(a) * 140, dt);
        }

        let nearest = null; let minD = 260;
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
              dmg: 24, color: '#38bdf8', fromPlayer: true, life: 42, radius: 2.5
            });
            AudioFX.bowShot();
          }
        }
      });

      // Enemigos
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const en = this.enemies[i];

        if (en.hp <= 0) {
          this.handleEnemyDeath(en);
          this.enemies.splice(i, 1);
          continue;
        }

        const toPlayerX = this.player.x - en.x;
        const toPlayerY = this.player.y - en.y;
        const dist = Math.hypot(toPlayerX, toPlayerY);
        const ang = Math.atan2(toPlayerY, toPlayerX);

        if (en.type === 'zombie_miner') {
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
              vx: Math.cos(ang) * 290, vy: Math.sin(ang) * 290,
              dmg: 12, color: '#f97316', fromPlayer: false, life: 60, radius: 3
            });
            AudioFX.bowShot();
          }
        } else if (en.type === 'golem_boss') {
          this.moveEntity(en, Math.cos(ang) * en.speed, Math.sin(ang) * en.speed, dt);
          en.shootTimer = (en.shootTimer || 0) + dt;
          if (en.shootTimer > 3.2) {
            en.shootTimer = 0;
            this.shakeIntensity = 10;
            AudioFX.hitEnemy();
            this.spawnFloatingText(en.x, en.y - 20, '💥 ¡TERREMOTO DE MAGMA!', '#ef4444', 14);
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

      // Proyectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 1;

        if (this.isWall(p.x, p.y)) {
          this.projectiles.splice(i, 1);
          continue;
        }

        if (p.fromPlayer) {
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

      // Llaves caídas
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

      // Prompt cofre
      const nearCh = this.getNearChest();
      if (nearCh) {
        this.promptEl.style.display = 'block';
        this.promptEl.innerHTML = `Presiona <b style="color:#fbbf24;">ESPACIO</b> para abrir Ruleta de <b>${nearCh.name}</b>`;
      } else {
        this.promptEl.style.display = 'none';
      }

      // Partículas y Textos
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

      if (this.shakeIntensity > 0) this.shakeIntensity *= 0.88;

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
      this.data.coins += (en.type === 'golem_boss' ? 300 : 30);
      AudioFX.hitEnemy();

      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: en.x, y: en.y,
          vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80,
          color: '#ea580c', life: 20, maxLife: 20, size: 4
        });
      }

      if (en.type === 'golem_boss') {
        this.droppedKeys.push({ x: en.x, y: en.y, tier: 'obsidian', bob: 0 });
        this.spawnFloatingText(en.x, en.y - 30, '💎 ¡LLAVE DE OBSIDIANA!', '#c084fc', 15);
      } else if (en.type === 'skeleton_archer') {
        const roll = Math.random();
        if (roll < 0.4) {
          this.droppedKeys.push({ x: en.x, y: en.y, tier: 'silver', bob: 0 });
        } else if (roll < 0.6) {
          this.droppedKeys.push({ x: en.x, y: en.y, tier: 'gold', bob: 0 });
        }
      } else {
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
        const rEl = this.container.querySelector(`#rKey${k[0].toUpperCase() + k.slice(1)}`);
        if (rEl) rEl.textContent = this.data.keys[k] || 0;
      });
    }

    // --- RENDERIZADO 2.5D ISOMÉTRICO VOXEL ---
    render() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const now = performance.now();

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      if (this.shakeIntensity > 0.5) {
        ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
      }

      // 1. SUELO DE ADOQUINES BASÁLTICOS
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = LEVEL_MAP[r][c];
          const tx = c * TILE_SZ;
          const ty = r * TILE_SZ;

          if (tile === 0 || tile === 4 || tile === 5) {
            const hash = ((c * 17) + (r * 31)) % 4;
            const floorColors = ['#161022', '#1a1329', '#1e1630', '#181125'];
            ctx.fillStyle = floorColors[hash];
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);

            ctx.strokeStyle = '#251b3d';
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, TILE_SZ, TILE_SZ);

            ctx.fillStyle = '#2b2046';
            ctx.fillRect(tx + 4, ty + 4, 10, 8);
            ctx.fillRect(tx + 16, ty + 14, 12, 12);

            if (tile === 4) {
              ctx.fillStyle = '#3f2c1d';
              ctx.fillRect(tx + 2, ty + 4, 28, 4);
              ctx.fillRect(tx + 2, ty + 20, 28, 4);
              ctx.fillStyle = '#94a3b8';
              ctx.fillRect(tx + 6, ty, 3, TILE_SZ);
              ctx.fillRect(tx + 22, ty, 3, TILE_SZ);
            } else if (tile === 5) {
              ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
              ctx.beginPath();
              ctx.arc(tx + 16, ty + 16, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#c084fc';
              ctx.fillRect(tx + 12, ty + 8, 8, 14);
              ctx.fillStyle = '#e879f9';
              ctx.fillRect(tx + 14, ty + 10, 4, 8);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(tx + 15, ty + 11, 2, 3);
            }
          }
        }
      }

      // 2. RÍO DE LAVA CON OLEAJE Y ORILLAS
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = LEVEL_MAP[r][c];
          const tx = c * TILE_SZ;
          const ty = r * TILE_SZ;

          if (tile === 2) {
            ctx.fillStyle = '#3a1608';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);

            const wave = Math.sin(now * 0.003 + c * 0.4 + r * 0.4);
            const wave2 = Math.cos(now * 0.004 + r * 0.6);
            ctx.fillStyle = wave > 0.2 ? '#c2410c' : '#ea580c';
            ctx.fillRect(tx + 2, ty + 2, TILE_SZ - 4, TILE_SZ - 4);

            ctx.fillStyle = '#f97316';
            ctx.fillRect(tx + 6 + wave * 3, ty + 6, 12, 10);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(tx + 8 + wave2 * 2, ty + 8, 6, 6);
          } else if (tile === 3) {
            ctx.fillStyle = '#261b36';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);
            ctx.fillStyle = '#3a2a52';
            ctx.fillRect(tx + 2, ty + 2, TILE_SZ - 4, 6);
            ctx.fillRect(tx + 2, ty + 11, TILE_SZ - 4, 8);
            ctx.fillRect(tx + 2, ty + 22, TILE_SZ - 4, 7);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(tx + 4, ty + 4, 2, 2);
            ctx.fillRect(tx + TILE_SZ - 6, ty + 4, 2, 2);
          }
        }
      }

      // 3. MUROS 3D VOXEL (Cara superior 14px + cara frontal 18px con ladrillos)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (LEVEL_MAP[r][c] === 1) {
            const tx = c * TILE_SZ;
            const ty = r * TILE_SZ;

            // Techo de losa de obsidiana
            ctx.fillStyle = '#1e142e';
            ctx.fillRect(tx, ty, TILE_SZ, 14);

            ctx.fillStyle = '#4c3175';
            ctx.fillRect(tx, ty, TILE_SZ, 2);
            ctx.fillRect(tx, ty, 2, 14);

            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(tx + 6, ty + 5, 3, 3);
            ctx.fillRect(tx + TILE_SZ - 9, ty + 5, 3, 3);

            // Frontal de mampostería con sombra
            ctx.fillStyle = '#100b1a';
            ctx.fillRect(tx, ty + 14, TILE_SZ, 18);

            ctx.fillStyle = '#191128';
            ctx.fillRect(tx + 2, ty + 15, 12, 7);
            ctx.fillRect(tx + 16, ty + 15, 14, 7);
            ctx.fillRect(tx + 2, ty + 23, 14, 7);
            ctx.fillRect(tx + 18, ty + 23, 12, 7);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(tx, ty + 30, TILE_SZ, 2);
          }
        }
      }

      // 4. ANTORCHAS
      this.torches.forEach(tc => {
        ctx.fillStyle = '#332347';
        ctx.fillRect(tc.x - 3, tc.y - 4, 6, 12);
        const flk = (Math.sin(now * 0.012 + tc.x) + 1) * 0.5;
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(tc.x - 3, tc.y - 10 - flk * 2, 6, 6 + flk * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(tc.x - 1, tc.y - 8 - flk * 2, 2, 3);
      });

      // 5. COFRES
      this.chests.forEach(ch => {
        ctx.save();
        ctx.translate(ch.x, ch.y);

        const col = KEY_TIERS[ch.tier].color;
        ctx.fillStyle = '#1e140a';
        ctx.fillRect(-14, -8, 28, 20);
        ctx.fillStyle = '#291b0f';
        ctx.fillRect(-15, -14, 30, 8);
        ctx.fillStyle = col;
        ctx.fillRect(-12, -14, 4, 26);
        ctx.fillRect(8, -14, 4, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -4, 6, 6);
        ctx.fillStyle = col;
        ctx.fillRect(-2, -3, 4, 4);

        if (ch.tier === 'obsidian') {
          const aura = (Math.sin(now * 0.008) + 1) * 0.5;
          ctx.strokeStyle = `rgba(192, 132, 252, ${0.45 + aura * 0.45})`;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(-18, -18, 36, 34);
        }

        ctx.fillStyle = KEY_TIERS[ch.tier].color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ch.name, 0, -20);
        ctx.restore();
      });

      // 6. LLAVES EN EL SUELO
      this.droppedKeys.forEach(k => {
        const bobY = Math.sin(k.bob) * 3;
        KEY_TIERS[k.tier].draw(ctx, k.x, k.y + bobY, 18);
      });

      // 7. ENEMIGOS
      this.enemies.forEach(en => {
        ctx.save();
        ctx.translate(en.x, en.y);

        if (en.type === 'zombie_miner') {
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(-7, -4, 14, 16);
          ctx.fillStyle = '#1d4ed8';
          ctx.fillRect(-5, -2, 10, 10);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(-6, -14, 12, 10);
          ctx.fillRect(-10, -2, 3, 10);
          ctx.fillRect(7, -2, 3, 10);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-8, -18, 16, 5);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-3, -16, 6, 4);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(8, -6, 4, 14);
          ctx.fillRect(6, -10, 10, 4);
        } else if (en.type === 'skeleton_archer') {
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-5, -5, 10, 14);
          ctx.fillStyle = '#292524';
          ctx.fillRect(-4, -14, 8, 9);
          const fEye = (Math.sin(now * 0.02) + 1) * 0.5;
          ctx.fillStyle = fEye > 0.3 ? '#f97316' : '#ea580c';
          ctx.fillRect(-3, -11, 2, 2);
          ctx.fillRect(1, -11, 2, 2);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(8, 0, 9, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        } else if (en.type === 'golem_boss') {
          ctx.fillStyle = '#0a0612';
          ctx.fillRect(-26, -26, 52, 52);
          ctx.fillStyle = '#1c122e';
          ctx.fillRect(-22, -22, 44, 44);
          const heart = (Math.sin(now * 0.007) + 1) * 0.5;
          ctx.fillStyle = heart > 0.4 ? '#f97316' : '#ea580c';
          ctx.fillRect(-12, -12, 24, 6);
          ctx.fillRect(-4, -6, 8, 20);
          ctx.fillRect(-14, 8, 28, 5);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(-14, -18, 7, 4);
          ctx.fillRect(7, -18, 7, 4);
        }

        ctx.restore();

        const hpPct = Math.max(0, en.hp / en.maxHp);
        ctx.fillStyle = '#090511';
        ctx.fillRect(en.x - 16, en.y - en.radius - 10, 32, 4);
        ctx.fillStyle = en.type === 'golem_boss' ? '#c084fc' : '#ef4444';
        ctx.fillRect(en.x - 16, en.y - en.radius - 10, Math.round(32 * hpPct), 4);
      });

      // 8. BOTS
      this.teammates.forEach(tm => {
        ctx.save();
        ctx.translate(tm.x, tm.y);
        ctx.rotate(tm.angle || 0);
        ctx.fillStyle = '#065f46';
        ctx.fillRect(-9, -9, 18, 18);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tm.name, tm.x, tm.y - 16);
      });

      // 9. JUGADOR
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.player.angle);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -3, 5, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -2, 2, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(8, 2, 14, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10, 3, 10, 2);

      ctx.restore();

      if (this.player.isAttacking) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.attackAngle);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, 46, -Math.PI * 0.38, Math.PI * 0.38);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.currentUser.name || 'Tú', this.player.x, this.player.y - 20);

      const pPct = Math.max(0, this.player.hp / this.player.maxHp);
      ctx.fillStyle = '#090511';
      ctx.fillRect(this.player.x - 18, this.player.y - 15, 36, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(this.player.x - 18, this.player.y - 15, Math.round(36 * pPct), 4);

      // 10. PROYECTILES
      this.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - p.radius), Math.round(p.y - p.radius), p.radius * 2, p.radius * 2);
      });

      // 11. PARTÍCULAS
      this.particles.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size || 2, pt.size || 2);
      });

      // 12. TEXTOS FLOTANTES
      this.floatingTexts.forEach(ft => {
        ctx.fillStyle = '#000';
        ctx.font = `bold ${ft.size || 12}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
      });

      // 13. ILUMINACIÓN AMBIENTAL
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      const pGrad = ctx.createRadialGradient(this.player.x, this.player.y, 10, this.player.x, this.player.y, 140);
      pGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      pGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, 0, w, h);

      this.torches.forEach(tc => {
        const tGrad = ctx.createRadialGradient(tc.x, tc.y, 8, tc.x, tc.y, 90);
        tGrad.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
        tGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = tGrad;
        ctx.fillRect(0, 0, w, h);
      });

      ctx.restore();

      ctx.restore();
    }

    startLoop() {
      this.running = true;
      let lastTime = performance.now();

      const loop = (time) => {
        if (!this.running) return;
        const dt = Math.min(0.08, (time - lastTime) / 1000);
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

  global.CyberDefenseGame = CyberDefenseGame;

})(window);
