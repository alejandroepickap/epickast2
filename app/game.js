// EpicKast: Dungeons of the Core • Minas de Magma & Obsidiana (v1.8.0 Pro)
// Action-RPG de Mazmorras Cooperativo con 5 Niveles y Navegación entre Plantas:
// - Nivel 1: Entrada de las Minas de Magma (Mineros Zombi, llaves de cobre)
// - Nivel 2: Galerías de Amatista (Zombis + Arqueros Esqueléticos, llaves de plata)
// - Nivel 3: Los Puentes de Lava (Combate táctico sobre abismos de magma)
// - Nivel 4: La Cripta de Basalto (Guardias de magma de élite, llaves de oro)
// - Nivel 5: Sagrario del Núcleo (Jefe Gólem Coloso de Obsidiana, llave de obsidiana)
//
// Al despejar cada nivel, se abre un Portal Místico (🌀) para descender a la siguiente planta.
// Gráficos HD 2.5D Isométricos: sprites detallados, sombras suaves, antorchas y efectos visuales fluidos.
// Inventario integrado del personaje para equipar armas y armaduras ganadas en el juego.
// Llaves de perfil con ratio de aparición equilibrado mensual para la Bóveda de Reliquias.
// 100% compatible con las políticas de Microsoft Store.

(function(global) {
  'use strict';

  // --- Motor de Audio Web Audio Sintetizado (Sin bucles de sonido) ---
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
    itemPickup() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(523.25, t);
        o.frequency.setValueAtTime(659.25, t + 0.06);
        o.frequency.setValueAtTime(783.99, t + 0.12);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.23);
      } catch {}
    },
    portalOpen() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        [330, 440, 554, 659].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, t + i * 0.07);
          g.gain.setValueAtTime(0.08, t + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.3);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.32);
        });
      } catch {}
    },
    victory() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        // Fanfarria triunfal ascendente única (sin repetición)
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t + i * 0.09);
          g.gain.setValueAtTime(0.001, t + i * 0.09);
          g.gain.linearRampToValueAtTime(0.11, t + i * 0.09 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.45);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.48);
        });
      } catch {}
    }
  };

  // --- Almacenamiento Persistente del Minijuego ---
  const SAVE_KEY = 'epickast.dungeon.v1';
  const INV_KEY = 'epickast.dungeon.inventory.v1';

  function loadDungeonData() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      coins: 50,
      keys: { copper: 1, silver: 0, gold: 0, obsidian: 0 },
      founderFrameUnlocked: false
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

  function loadInventory() {
    let inv = null;
    try {
      const raw = localStorage.getItem(INV_KEY);
      if (raw) inv = JSON.parse(raw);
    } catch {}
    if (!inv) {
      inv = {
        equippedWeapon: { id: 'iron_sword', name: 'Espada de Hierro', type: 'weapon', bonusDmg: 0, desc: 'Espada inicial forjada en la superficie' },
        equippedBow: { id: 'hunting_bow', name: 'Ballesta de Caza', type: 'bow', bonusDmg: 0, desc: 'Ballesta estándar de explorador' },
        equippedArmor: { id: 'leather_armor', name: 'Túnica de Explorador', type: 'armor', bonusHp: 0, desc: 'Túnica de cuero resistente' },
        items: [
          { id: 'iron_sword', name: 'Espada de Hierro', type: 'weapon', bonusDmg: 0, desc: 'Espada inicial forjada' }
        ]
      };
    }
    // Filtrar objetos repetidos en el guardado existente
    const seen = new Set();
    inv.items = (inv.items || []).filter(item => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return inv;
  }

  function saveInventory(inv) {
    try { localStorage.setItem(INV_KEY, JSON.stringify(inv)); } catch {}
  }

  // --- Catálogo de Llaves (Sprites Limpios de perfil) ---
  const KEY_TIERS = {
    copper: {
      name: 'Llave de Cobre', color: '#d97706',
      draw(ctx, x, y, size = 18) {
        ctx.save();
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x - size * 0.08, y, size * 0.16, size * 0.7);
        ctx.fillRect(x, y + size * 0.45, size * 0.25, size * 0.12);
        ctx.fillRect(x, y + size * 0.62, size * 0.2, size * 0.1);
        ctx.restore();
      }
    },
    silver: {
      name: 'Llave de Plata', color: '#cbd5e1',
      draw(ctx, x, y, size = 18) {
        ctx.save();
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.35, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x - size * 0.08, y, size * 0.16, size * 0.7);
        ctx.fillRect(x, y + size * 0.45, size * 0.25, size * 0.12);
        ctx.fillRect(x, y + size * 0.62, size * 0.2, size * 0.1);
        ctx.restore();
      }
    },
    gold: {
      name: 'Llave de Oro', color: '#fbbf24',
      draw(ctx, x, y, size = 18) {
        ctx.save();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.38, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x - size * 0.09, y, size * 0.18, size * 0.75);
        ctx.fillRect(x, y + size * 0.45, size * 0.28, size * 0.14);
        ctx.fillRect(x, y + size * 0.65, size * 0.22, size * 0.12);
        ctx.restore();
      }
    },
    obsidian: {
      name: 'Llave de Obsidiana', color: '#c084fc',
      draw(ctx, x, y, size = 20) {
        ctx.save();
        ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.beginPath(); ctx.arc(x, y, size * 0.75, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a855f7';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0b0e17';
        ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e879f9';
        ctx.fillRect(x - size * 0.09, y, size * 0.18, size * 0.8);
        ctx.fillRect(x, y + size * 0.5, size * 0.3, size * 0.14);
        ctx.fillRect(x, y + size * 0.7, size * 0.24, size * 0.12);
        ctx.restore();
      }
    }
  };

  const COLS = 24;
  const ROWS = 15;
  const TILE_SZ = 32;

  // 5 Diseños únicos de salas (uno por cada planta)
  const FLOOR_NAMES = [
    '',
    'Nivel 1: Entrada de las Minas de Magma',
    'Nivel 2: Galerías de Amatista y Sombras',
    'Nivel 3: El Gran Paso de Lava Ardiente',
    'Nivel 4: Cripta Real de Basalto',
    'Nivel 5: Sagrario del Núcleo • Gólem Coloso'
  ];

  const FLOOR_MAPS = {
    1: [ // Entrada de las Minas de Magma (Abierta, pilares de soporte, sin lava)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,4,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,0,4,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,4,0,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,0,4,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    2: [ // Galerías de Amatista (Columnas de cristal 5, pasillos tácticos)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,5,5,0,0,0,0,1,0,0,0,0,0,1],
      [1,0,5,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,5,0,1],
      [1,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
      [1,0,0,1,1,0,0,0,1,1,0,0,0,0,1,1,0,0,0,1,1,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,5,5,0,0,0,0,0,0,1,1,0,0,1],
      [1,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,1],
      [1,0,0,1,1,0,0,0,0,0,0,5,5,0,0,0,0,0,0,1,1,0,0,1],
      [1,0,0,1,1,0,0,0,1,1,0,0,0,0,1,1,0,0,0,1,1,0,0,1],
      [1,0,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
      [1,0,5,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,5,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,5,5,0,0,0,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    3: [ // El Gran Paso de Lava Ardiente (Río de magma con puentes estrechos)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,4,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,4,0,1],
      [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,3,3,3,3,0,0,0,0,1,1,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,3,3,3,3,0,0,0,0,1,1,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,3,3,3,3,0,0,0,0,1,1,0,0,0,1],
      [1,0,0,0,1,1,0,0,0,0,3,3,3,3,0,0,0,0,1,1,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,4,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,4,0,1],
      [1,0,0,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    4: [ // Cripta Real de Basalto (Laberinto ceremonial con 4 cámaras)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,0,1,0,4,0,0,0,0,4,0,1,0,0,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,0,0,1,0,4,0,0,0,0,4,0,1,0,0,1,1,1,0,1],
      [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    5: [ // Sagrario del Núcleo (Arena del Jefe Gólem Coloso con foso de magma)
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,1],
      [1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,1],
      [1,2,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,2,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,2,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,2,1],
      [1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,1],
      [1,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
  };

  class CyberDefenseGame {
    constructor(container, socket, roomKey, currentUser, options) {
      this.container = container;
      this.socket = socket;
      this.roomKey = roomKey || 'dungeon_room';
      this.currentUser = currentUser || { name: 'Explorador', id: 'p1' };
      this.options = options || {};

      this.data = loadDungeonData();
      this.inventory = loadInventory();

      this.width = COLS * TILE_SZ; // 768px
      this.height = ROWS * TILE_SZ; // 480px

      // Jugador con estadísticas influenciadas por el inventario
      this.player = {
        x: 120,
        y: 240,
        speed: 185,
        hp: 140, maxHp: 140,
        meleeDmg: 45,
        bowDmg: 30,
        angle: 0,
        radius: 13,
        attackCooldown: 0,
        isAttacking: false,
        attackAngle: 0,
        attackTimer: 0,
        walkCycle: 0,
        knockX: 0,
        knockY: 0,
        invulnTimer: 0
      };

      this.recalculatePlayerStats();

      this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, Space: false };
      this.mouse = { x: 384, y: 240, isDown: false, rightDown: false };

      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.droppedLoot = []; // Botín de combate (armas, pociones)
      this.droppedKeys = []; // Llaves para el perfil
      this.floatingTexts = [];
      this.teammates = new Map();

      // Niveles progresivos (1 al 5)
      this.floor = 1;
      this.maxFloors = 5;
      this.currentMap = FLOOR_MAPS[1];
      this.portal = null;
      this.floorCleared = false;
      this.dungeonWon = false;

      this.activeTab = 'dungeon'; // 'dungeon' | 'inventory'

      this.gameState = 'play';
      this.shakeIntensity = 0;
      this.running = false;
      this.animId = null;

      this.torches = [
        { x: 192, y: 128 }, { x: 192, y: 352 },
        { x: 576, y: 128 }, { x: 576, y: 352 },
        { x: 384, y: 96 },  { x: 384, y: 384 }
      ];

      this.initDom();
      this.bindInputs();
      this.bindSocket();
      this.loadFloor(1);
      this.startLoop();
    }

    recalculatePlayerStats() {
      const wDmg = this.inventory.equippedWeapon?.bonusDmg || 0;
      const bDmg = this.inventory.equippedBow?.bonusDmg || 0;
      const aHp = this.inventory.equippedArmor?.bonusHp || 0;

      this.player.maxHp = 140 + aHp;
      this.player.hp = Math.min(this.player.hp, this.player.maxHp);
      this.player.meleeDmg = 45 + wDmg;
      this.player.bowDmg = 30 + bDmg;
    }

    initDom() {
      this.container.innerHTML = `
        <div class="cd-wrap" style="position:relative; width: 1040px; max-width: 98vw; background:#0b0813; border:1px solid #36224d; border-radius:12px; overflow:hidden; box-shadow:0 16px 50px rgba(0,0,0,0.9); font-family:system-ui, -apple-system, sans-serif;">
          
          <!-- Encabezado -->
          <div class="cd-header" style="background:#150f24; border-bottom:1px solid #2d1d44; padding:10px 16px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">🌋</span>
              <div>
                <strong id="dFloorTitle" style="color:#f8fafc; font-size:15px; letter-spacing:0.5px;">Dungeons of the Core • Nivel 1</strong>
                <span style="background:#7c3aed; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; margin-left:6px;">v1.8.0 PRO</span>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:18px;">
              <div style="color:#fca5a5; font-size:12px; font-weight:700;">❤️ Salud: <b id="dHp" style="color:#fff;">${Math.round(this.player.hp)}/${this.player.maxHp}</b></div>
              <div style="color:#fde047; font-size:12px; font-weight:700;">💰 Monedas: <b id="dCoins" style="color:#fff;">${this.data.coins}</b></div>
              <div style="color:#c084fc; font-size:12px; font-weight:700;">🏰 Planta: <b id="dFloorNum" style="color:#fff;">1/5</b></div>
            </div>

            <div style="display:flex; gap:8px;">
              <button id="dBtnRestart" class="cd-btn" style="background:#ca8a04; border-color:#eab308; color:#fff; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer;" title="Reiniciar desde el Nivel 1">🔄 Reiniciar</button>
              <button id="dBtnInvite" class="cd-btn" style="background:#059669; border-color:#10b981; color:#fff; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer;">📢 Invitar</button>
              <button id="dBtnBot" class="cd-btn" style="background:#2563eb; border-color:#3b82f6; color:#fff; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer;">🤖 +Aliado</button>
              <button id="dBtnClose" class="cd-btn" style="background:#334155; border-color:#475569; color:#fff; padding:6px 12px; border-radius:6px; cursor:pointer;">✕ Salir</button>
            </div>
          </div>

          <!-- Canvas + Panel Lateral -->
          <div style="display:flex; background:#08050e;">
            <div style="position:relative; width:768px; height:480px; flex:none;">
              <canvas id="dCanvas" width="768" height="480" style="display:block; image-rendering:pixelated; cursor:crosshair;"></canvas>
              
              <div id="dPortalPrompt" style="display:none; position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(18, 12, 28, 0.94); border:2px solid #a855f7; padding:10px 20px; border-radius:8px; color:#f8fafc; font-size:13px; font-weight:800; box-shadow:0 0 20px rgba(168,85,247,0.5); pointer-events:none; z-index:15;">
                🌀 ¡PORTAL ACTIVO! Camina hacia él para descender
              </div>

              <!-- Modal de Game Over Interactivo -->
              <div id="dGameOverModal" style="display:none; position:absolute; inset:0; background:rgba(12, 5, 20, 0.92); backdrop-filter:blur(6px); z-index:30; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center;">
                <div style="font-size:42px; margin-bottom:8px;">💀</div>
                <h2 style="color:#ef4444; font-size:22px; font-weight:900; margin:0 0 8px 0; letter-spacing:0.8px;">HAS CAÍDO EN LAS MINAS</h2>
                <p style="color:#cbd5e1; font-size:13px; max-width:420px; margin:0 0 18px 0; line-height:1.4;">
                  Los monstruos del Núcleo te han superado. Conservas tus llaves y monedas para reintentar la expedición.
                </p>
                <button id="dGoBtnRetry" style="background:linear-gradient(135deg, #eab308, #ca8a04); color:#0b0813; border:none; padding:12px 30px; border-radius:8px; font-weight:900; cursor:pointer; font-size:14px; box-shadow:0 0 20px rgba(234,179,8,0.5); text-transform:uppercase; letter-spacing:0.8px;">
                  🔄 REINTENTAR DESDE EL NIVEL 1
                </button>
              </div>

              <!-- Modal de Victoria (Único y sin bugs) -->
              <div id="dVictoryModal" style="display:none; position:absolute; inset:0; background:rgba(8, 4, 18, 0.92); backdrop-filter:blur(6px); z-index:30; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center;">
                <div style="font-size:42px; margin-bottom:8px;">🏆</div>
                <h2 style="color:#fbbf24; font-size:22px; font-weight:900; margin:0 0 6px 0; letter-spacing:0.8px;">¡MAZMORRA PURIFICADA!</h2>
                <p style="color:#cbd5e1; font-size:13px; max-width:440px; margin:0 0 16px 0; line-height:1.4;">
                  Has conquistado las 5 plantas del Sagrario del Núcleo y vencido al Gólem Coloso de Obsidiana.
                </p>
                <div style="background:#1c132d; border:1px solid #7c3aed; border-radius:8px; padding:12px 20px; margin-bottom:18px; color:#e2e8f0; font-size:12px;">
                  💎 <b>Recompensa Principal:</b> 1 Llave de Obsidiana para la Bóveda.<br>
                  ★ Abre tu cofre en la barra de la app para desbloquear el <b>Marco Azul de Fundador</b>.
                </div>
                <div style="display:flex; gap:12px;">
                  <button id="dVicOpenVault" style="background:linear-gradient(135deg, #78350f, #d97706); color:#fde047; border:1px solid #fbbf24; padding:10px 20px; border-radius:8px; font-weight:800; cursor:pointer; font-size:13px; box-shadow:0 0 15px rgba(217,119,6,0.4);">
                    🎁 ABRIR BÓVEDA DE RELIQUIAS
                  </button>
                  <button id="dVicRestart" style="background:#334155; color:#fff; border:none; padding:10px 18px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px;">
                    🔄 Jugar de Nuevo
                  </button>
                </div>
              </div>
            </div>

            <!-- Panel Lateral con Pestañas: [Mazmorra] y [Inventario] -->
            <div style="flex:1; background:#110c1c; border-left:1px solid #291b3b; display:flex; flex-direction:column; overflow:hidden; max-height:480px;">
              
              <!-- Selector de Pestañas -->
              <div style="display:flex; border-bottom:1px solid #291b3b; background:#160f24;">
                <button id="dTabBtnDungeon" style="flex:1; padding:10px 4px; font-size:11px; font-weight:800; background:#110c1c; color:#fbbf24; border:none; border-bottom:2px solid #fbbf24; cursor:pointer;">
                  ⚔️ Mazmorra
                </button>
                <button id="dTabBtnInv" style="flex:1; padding:10px 4px; font-size:11px; font-weight:800; background:#160f24; color:#94a3b8; border:none; border-bottom:2px solid transparent; cursor:pointer;">
                  🎒 Inventario
                </button>
              </div>

              <!-- Pestaña 1: Mazmorra y Llaves -->
              <div id="dTabPanelDungeon" style="padding:14px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; flex:1;">
                
                <!-- Acceso a la Bóveda -->
                <div style="background:#1e140a; border:1px solid #ca8a04; border-radius:8px; padding:10px; font-size:11px; color:#fde047; line-height:1.4;">
                  <strong style="display:block; color:#fff; font-size:12px; margin-bottom:4px;">🏛️ Bóveda de Cosméticos</strong>
                  Las llaves abren marcos, colores y banners para tu perfil.
                  <button id="dBtnOpenVault" style="background:linear-gradient(135deg, #78350f, #d97706);color:#fde047;border:1px solid #fbbf24;font-size:11px;font-weight:800;padding:6px 10px;border-radius:6px;cursor:pointer;width:100%;text-align:center;margin-top:8px;">🎁 Ir a la Bóveda de Reliquias</button>
                </div>

                <!-- Llaves Recolectadas -->
                <div style="background:#181126; border:1px solid #33204d; border-radius:8px; padding:10px;">
                  <h4 style="margin:0 0 8px 0; color:#e2e8f0; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">🔑 Llaves de Perfil (Temporada 1)</h4>
                  
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; border:1px solid #78350f;">
                      <canvas id="keyCopperIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#d97706; font-size:11px; font-weight:700;">Cobre</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountCopper" style="color:#fff;">${this.data.keys.copper}</b></div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; border:1px solid #475569;">
                      <canvas id="keySilverIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#cbd5e1; font-size:11px; font-weight:700;">Plata</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountSilver" style="color:#fff;">${this.data.keys.silver}</b></div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; border:1px solid #ca8a04;">
                      <canvas id="keyGoldIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#fbbf24; font-size:11px; font-weight:700;">Oro</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountGold" style="color:#fff;">${this.data.keys.gold}</b></div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; background:#0e0817; padding:6px; border-radius:6px; border:1px solid #7e22ce;">
                      <canvas id="keyObsidianIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#c084fc; font-size:11px; font-weight:700;">Obsidiana</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountObsidian" style="color:#fff;">${this.data.keys.obsidian}</b></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Controles -->
                <div style="background:#181126; border:1px solid #33204d; border-radius:8px; padding:10px; font-size:11px; color:#cbd5e1; line-height:1.5;">
                  <strong style="color:#fff; display:block; margin-bottom:4px;">⚔️ COMBATE Y CONTROLES</strong>
                  <div>🗡️ <b>Clic Izq / Espacio:</b> Espadazo melee (o clic en botín/portal).</div>
                  <div>🏹 <b>Clic Der:</b> Flecha de ballesta rúnica a distancia.</div>
                  <div>🧲 <b>Botín e Imán:</b> Acércate para absorberlo, o pulsa <b>E / F / Clic</b> para recoger y auto-equipar.</div>
                  <div>🏃 <b>WASD:</b> Movimiento con deslizamiento suave en muros.</div>
                  <div>🌀 <b>Portal:</b> Despeja la sala para descender y curarte (+35 HP).</div>
                </div>
              </div>

              <!-- Pestaña 2: Inventario del Personaje (Objetos del Juego) -->
              <div id="dTabPanelInv" style="display:none; padding:14px; flex-direction:column; gap:12px; overflow-y:auto; flex:1;">
                <div style="font-size:11px; color:#94a3b8; line-height:1.3;">
                  Equipa los objetos conseguidos en la mazmorra para aumentar tus estadísticas de combate.
                </div>

                <!-- Ranuras Equipadas -->
                <div style="background:#181126; border:1px solid #33204d; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:8px;">
                  <h4 style="margin:0; color:#e2e8f0; font-size:11px; text-transform:uppercase;">🛡️ Equipo Activo</h4>
                  
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e0817; padding:8px; border-radius:6px; border:1px solid #38bdf8;">
                    <div>
                      <div style="font-size:10px; color:#38bdf8; font-weight:800;">ARMA MELEE</div>
                      <div style="font-size:12px; font-weight:700; color:#fff;" id="dEqWeaponName">${this.inventory.equippedWeapon?.name || 'Espada de Hierro'}</div>
                    </div>
                    <span style="font-size:11px; color:#4ade80; font-weight:800;" id="dEqWeaponStat">+${this.inventory.equippedWeapon?.bonusDmg || 0} Daño</span>
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e0817; padding:8px; border-radius:6px; border:1px solid #c084fc;">
                    <div>
                      <div style="font-size:10px; color:#c084fc; font-weight:800;">BALLESTA</div>
                      <div style="font-size:12px; font-weight:700; color:#fff;" id="dEqBowName">${this.inventory.equippedBow?.name || 'Ballesta de Caza'}</div>
                    </div>
                    <span style="font-size:11px; color:#4ade80; font-weight:800;" id="dEqBowStat">+${this.inventory.equippedBow?.bonusDmg || 0} Daño</span>
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0e0817; padding:8px; border-radius:6px; border:1px solid #fbbf24;">
                    <div>
                      <div style="font-size:10px; color:#fbbf24; font-weight:800;">ARMADURA</div>
                      <div style="font-size:12px; font-weight:700; color:#fff;" id="dEqArmorName">${this.inventory.equippedArmor?.name || 'Túnica de Explorador'}</div>
                    </div>
                    <span style="font-size:11px; color:#4ade80; font-weight:800;" id="dEqArmorStat">+${this.inventory.equippedArmor?.bonusHp || 0} Salud</span>
                  </div>
                </div>

                <!-- Mochila de Objetos -->
                <div style="background:#181126; border:1px solid #33204d; border-radius:8px; padding:10px; flex:1;">
                  <h4 style="margin:0 0 8px 0; color:#e2e8f0; font-size:11px; text-transform:uppercase;">🎒 Mochila de Objetos Ganados</h4>
                  <div id="dInvList" style="display:flex; flex-direction:column; gap:6px;"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;

      this.canvas = this.container.querySelector('#dCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.promptEl = this.container.querySelector('#dPortalPrompt');
      this.victoryModalEl = this.container.querySelector('#dVictoryModal');
      this.victoryModalEl.style.display = 'none';
      this.gameOverModalEl = this.container.querySelector('#dGameOverModal');
      this.gameOverModalEl.style.display = 'none';

      this.renderKeyIcons();
      this.renderInventoryList();
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

    renderInventoryList() {
      const listEl = this.container.querySelector('#dInvList');
      if (!listEl) return;
      listEl.innerHTML = '';

      // Garantizar lista sin duplicados
      const seen = new Set();
      this.inventory.items = (this.inventory.items || []).filter(it => {
        if (!it || !it.id || seen.has(it.id)) return false;
        seen.add(it.id);
        return true;
      });

      if (!this.inventory.items || this.inventory.items.length === 0) {
        listEl.innerHTML = '<div style="color:#64748b; font-size:11px; padding:8px; text-align:center;">Derrota enemigos en la mazmorra para obtener botín de combate.</div>';
        return;
      }

      this.inventory.items.forEach((item) => {
        const isEquipped = (item.type === 'weapon' && this.inventory.equippedWeapon?.id === item.id) ||
                           (item.type === 'bow' && this.inventory.equippedBow?.id === item.id) ||
                           (item.type === 'armor' && this.inventory.equippedArmor?.id === item.id);

        const card = document.createElement('div');
        card.style.cssText = `display:flex; justify-content:space-between; align-items:center; background:#0e0817; padding:6px 10px; border-radius:6px; border:1px solid ${isEquipped ? '#10b981' : '#33204d'}; margin-bottom:4px;`;
        card.innerHTML = `
          <div style="min-width:0; flex:1; padding-right:8px;">
            <div style="font-size:11px; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
            <div style="font-size:9.5px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.desc || ''}</div>
          </div>
          <button style="flex-shrink:0; background:${isEquipped ? '#059669' : '#2563eb'}; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:10px; font-weight:700; cursor:${isEquipped ? 'default' : 'pointer'};">
            ${isEquipped ? '✓ Equipado' : 'Equipar'}
          </button>
        `;

        if (!isEquipped) {
          card.querySelector('button').onclick = () => {
            if (item.type === 'weapon') this.inventory.equippedWeapon = item;
            else if (item.type === 'bow') this.inventory.equippedBow = item;
            else if (item.type === 'armor') this.inventory.equippedArmor = item;
            saveInventory(this.inventory);
            this.recalculatePlayerStats();
            AudioFX.itemPickup();
            this.updateInventoryUi();
            this.renderInventoryList();
            this.spawnFloatingText(this.player.x, this.player.y - 20, `✨ ${item.name} equipado`, '#38bdf8', 14);
          };
        }

        listEl.appendChild(card);
      });
    }

    updateInventoryUi() {
      const eqWName = this.container.querySelector('#dEqWeaponName');
      const eqWStat = this.container.querySelector('#dEqWeaponStat');
      const eqBName = this.container.querySelector('#dEqBowName');
      const eqBStat = this.container.querySelector('#dEqBowStat');
      const eqAName = this.container.querySelector('#dEqArmorName');
      const eqAStat = this.container.querySelector('#dEqArmorStat');

      if (eqWName) eqWName.textContent = this.inventory.equippedWeapon?.name || 'Espada de Hierro';
      if (eqWStat) eqWStat.textContent = `+${this.inventory.equippedWeapon?.bonusDmg || 0} Daño`;
      if (eqBName) eqBName.textContent = this.inventory.equippedBow?.name || 'Ballesta de Caza';
      if (eqBStat) eqBStat.textContent = `+${this.inventory.equippedBow?.bonusDmg || 0} Daño`;
      if (eqAName) eqAName.textContent = this.inventory.equippedArmor?.name || 'Túnica de Explorador';
      if (eqAStat) eqAStat.textContent = `+${this.inventory.equippedArmor?.bonusHp || 0} Salud`;
    }

    bindInputs() {
      this.onKeyDown = (e) => {
        if (this.keys.hasOwnProperty(e.code)) {
          this.keys[e.code] = true;
          e.preventDefault();
        }
        // Tecla E o F: Recoger botín/llaves cercanas prioritariamente, o disparar ballesta
        if (e.code === 'KeyF' || e.code === 'KeyE') {
          let picked = false;
          // Buscar botín a menos de 90px
          for (let i = this.droppedLoot.length - 1; i >= 0; i--) {
            const item = this.droppedLoot[i];
            if (Math.hypot(this.player.x - item.x, this.player.y - item.y) < 90) {
              this.pickupDroppedLoot(item, i);
              picked = true;
              break;
            }
          }
          if (!picked) {
            for (let i = this.droppedKeys.length - 1; i >= 0; i--) {
              const k = this.droppedKeys[i];
              if (Math.hypot(this.player.x - k.x, this.player.y - k.y) < 90) {
                this.pickupDroppedKey(k, i);
                picked = true;
                break;
              }
            }
          }
          if (!picked && e.code === 'KeyE') {
            this.shootCrossbow();
          }
        }
        if (e.code === 'Space') {
          if (!this.checkPortalEnter()) this.attackSword();
        }
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
        if (this.gameState === 'gameover') {
          this.restartDungeon();
          return;
        }
        if (e.button === 0) {
          this.mouse.isDown = true;
          // 1. Si hace clic sobre un arma o llave tirada en el suelo, recogerla al instante
          if (this.checkLootPickup(this.mouse.x, this.mouse.y)) return;
          // 2. Si hace clic sobre el portal activo, entrar
          if (this.checkPortalEnter()) return;
          // 3. De lo contrario, atacar con espada
          this.attackSword();
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

      this.container.querySelector('#dBtnRestart').onclick = () => this.restartDungeon();
      this.container.querySelector('#dBtnInvite').onclick = () => this.options.inviteAll?.();
      this.container.querySelector('#dBtnBot').onclick = () => this.addAllyBot();
      this.container.querySelector('#dBtnClose').onclick = () => this.destroy();

      const vaultBtn = this.container.querySelector('#dBtnOpenVault');
      if (vaultBtn) {
        vaultBtn.onclick = () => {
          this.destroy();
          window.modalVault?.();
        };
      }

      // Pestañas Mazmorra / Inventario
      const tabDungeon = this.container.querySelector('#dTabBtnDungeon');
      const tabInv = this.container.querySelector('#dTabBtnInv');
      const panelDungeon = this.container.querySelector('#dTabPanelDungeon');
      const panelInv = this.container.querySelector('#dTabPanelInv');

      tabDungeon.onclick = () => {
        this.activeTab = 'dungeon';
        tabDungeon.style.background = '#110c1c';
        tabDungeon.style.color = '#fbbf24';
        tabDungeon.style.borderBottom = '2px solid #fbbf24';
        tabInv.style.background = '#160f24';
        tabInv.style.color = '#94a3b8';
        tabInv.style.borderBottom = '2px solid transparent';
        panelDungeon.style.display = 'flex';
        panelInv.style.display = 'none';
      };

      tabInv.onclick = () => {
        this.activeTab = 'inventory';
        tabInv.style.background = '#110c1c';
        tabInv.style.color = '#38bdf8';
        tabInv.style.borderBottom = '2px solid #38bdf8';
        tabDungeon.style.background = '#160f24';
        tabDungeon.style.color = '#94a3b8';
        tabDungeon.style.borderBottom = '2px solid transparent';
        panelDungeon.style.display = 'none';
        panelInv.style.display = 'flex';
        this.updateInventoryUi();
        this.renderInventoryList();
      };

      // Botones del Modal de Victoria
      const vOpenVault = this.container.querySelector('#dVicOpenVault');
      if (vOpenVault) {
        vOpenVault.onclick = () => {
          this.destroy();
          window.modalVault?.();
        };
      }
      const vRestart = this.container.querySelector('#dVicRestart');
      if (vRestart) {
        vRestart.onclick = () => {
          this.restartDungeon();
        };
      }
      const goRetry = this.container.querySelector('#dGoBtnRetry');
      if (goRetry) {
        goRetry.onclick = () => {
          this.restartDungeon();
        };
      }
    }

    restartDungeon() {
      this.dungeonWon = false;
      this.gameState = 'play';
      if (this.victoryModalEl) this.victoryModalEl.style.display = 'none';
      if (this.gameOverModalEl) this.gameOverModalEl.style.display = 'none';

      // Cambiar a pestaña de juego si estaba en inventario
      const tabDungeon = this.container.querySelector('#dTabBtnDungeon');
      const tabInv = this.container.querySelector('#dTabBtnInv');
      const panelDungeon = this.container.querySelector('#dTabPanelDungeon');
      const panelInv = this.container.querySelector('#dTabPanelInv');
      if (tabDungeon && panelDungeon) {
        this.activeTab = 'dungeon';
        tabDungeon.style.background = '#110c1c';
        tabDungeon.style.color = '#fbbf24';
        tabDungeon.style.borderBottom = '2px solid #fbbf24';
        if (tabInv) {
          tabInv.style.background = '#160f24';
          tabInv.style.color = '#94a3b8';
          tabInv.style.borderBottom = '2px solid transparent';
        }
        panelDungeon.style.display = 'flex';
        if (panelInv) panelInv.style.display = 'none';
      }

      this.player.hp = this.player.maxHp;
      this.loadFloor(1);
      AudioFX.itemPickup();
      this.spawnFloatingText(this.player.x, this.player.y - 20, '🔄 ¡Reiniciado al Nivel 1!', '#fbbf24', 14);
    }

    // --- Carga de Plantas / Niveles (1 al 5) ---
    loadFloor(floorNum) {
      this.floor = floorNum;
      this.currentMap = FLOOR_MAPS[floorNum] || FLOOR_MAPS[1];
      this.floorCleared = false;
      this.portal = null;
      if (this.promptEl) this.promptEl.style.display = 'none';
      if (this.victoryModalEl) this.victoryModalEl.style.display = 'none';
      this.enemies = [];
      this.projectiles = [];
      this.droppedLoot = [];
      this.droppedKeys = [];
      this.floatingTexts = [];

      this.player.x = 120;
      this.player.y = 240;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
      this.player.attackCooldown = 0;
      this.player.isAttacking = false;

      // Actualizar Título
      const tEl = this.container.querySelector('#dFloorTitle');
      if (tEl) tEl.textContent = FLOOR_NAMES[floorNum] || `Nivel ${floorNum}`;

      // Configuración de enemigos por piso
      if (floorNum === 1) {
        // Nivel 1: Entrada de las Minas de Magma (5 Mineros Zombi)
        for (let i = 0; i < 5; i++) {
          this.spawnEnemy('zombie_miner', 460 + (i % 3) * 60, 110 + Math.floor(i / 3) * 90);
        }
      } else if (floorNum === 2) {
        // Nivel 2: Galerías de Amatista (4 Zombis + 2 Arqueros)
        for (let i = 0; i < 4; i++) {
          this.spawnEnemy('zombie_miner', 480 + (i % 2) * 80, 120 + Math.floor(i / 2) * 100);
        }
        for (let i = 0; i < 2; i++) {
          this.spawnEnemy('skeleton_archer', 590, 130 + i * 110);
        }
      } else if (floorNum === 3) {
        // Nivel 3: El Gran Paso de Lava (6 Zombis + 3 Arqueros)
        for (let i = 0; i < 6; i++) {
          this.spawnEnemy('zombie_miner', 450 + (i % 3) * 60, 110 + Math.floor(i / 3) * 80);
        }
        for (let i = 0; i < 3; i++) {
          this.spawnEnemy('skeleton_archer', 610, 110 + i * 90);
        }
      } else if (floorNum === 4) {
        // Nivel 4: Cripta Real de Basalto (6 Zombis + 4 Arqueros reforzados)
        for (let i = 0; i < 6; i++) {
          this.spawnEnemy('zombie_miner', 460 + (i % 2) * 80, 100 + Math.floor(i / 2) * 75);
        }
        for (let i = 0; i < 4; i++) {
          this.spawnEnemy('skeleton_archer', 610, 100 + i * 75);
        }
      } else if (floorNum === 5) {
        // Nivel 5: Sagrario del Núcleo (EL JEFE GÓLEM COLOSO DE OBSIDIANA)
        this.spawnEnemy('golem_boss', 560, 240);
        this.spawnEnemy('skeleton_archer', 610, 130);
        this.spawnEnemy('skeleton_archer', 610, 350);
      }

      this.spawnFloatingText(this.player.x, this.player.y - 25, `🏰 ¡Entrando a Planta ${floorNum}!`, '#c084fc', 15);
      this.updateUi();
    }

    checkPortalEnter() {
      if (!this.portal || !this.portal.active || this.dungeonWon) return false;
      const d = Math.hypot(this.player.x - this.portal.x, this.player.y - this.portal.y);
      if (d < 38) {
        this.portal.active = false; // Desactivar inmediatamente para evitar duplicados
        if (this.floor < this.maxFloors) {
          AudioFX.portalOpen();
          this.loadFloor(this.floor + 1);
        } else {
          // Mazmorra completada sin loops
          this.dungeonWon = true;
          AudioFX.victory();
          this.showVictoryModal();
        }
        return true;
      }
      return false;
    }

    checkLootPickup(mouseX, mouseY) {
      // 1. Clic sobre botín de combate tirado en el suelo
      for (let i = this.droppedLoot.length - 1; i >= 0; i--) {
        const item = this.droppedLoot[i];
        if (Math.hypot(mouseX - item.x, mouseY - item.y) < 40) {
          this.pickupDroppedLoot(item, i);
          return true;
        }
      }
      // 2. Clic sobre llaves de perfil tiradas en el suelo
      for (let i = this.droppedKeys.length - 1; i >= 0; i--) {
        const k = this.droppedKeys[i];
        if (Math.hypot(mouseX - k.x, mouseY - k.y) < 40) {
          this.pickupDroppedKey(k, i);
          return true;
        }
      }
      return false;
    }

    pickupDroppedLoot(item, index) {
      if (!item || !item.data) return;
      const isWeapon = item.data.type === 'weapon';
      const isBow = item.data.type === 'bow';
      const isArmor = item.data.type === 'armor';

      const alreadyHas = (this.inventory.items || []).some(it => it.id === item.data.id) ||
                         this.inventory.equippedWeapon?.id === item.data.id ||
                         this.inventory.equippedBow?.id === item.data.id ||
                         this.inventory.equippedArmor?.id === item.data.id;

      if (alreadyHas) {
        const scrapBonus = 60;
        this.data.coins += scrapBonus;
        saveDungeonData(this.data);
        AudioFX.coinPickup();
        this.spawnFloatingText(item.x, item.y - 20, `♻️ ¡${item.data.name} reciclado! (+${scrapBonus} 🪙)`, '#fde047', 13);
        this.updateUi();
      } else {
        let shouldAutoEquip = false;
        if (isWeapon) {
          const curBonus = this.inventory.equippedWeapon?.bonusDmg || 0;
          if ((item.data.bonusDmg || 0) > curBonus) shouldAutoEquip = true;
        } else if (isBow) {
          const curBonus = this.inventory.equippedBow?.bonusDmg || 0;
          if ((item.data.bonusDmg || 0) > curBonus) shouldAutoEquip = true;
        } else if (isArmor) {
          const curBonus = this.inventory.equippedArmor?.bonusHp || 0;
          if ((item.data.bonusHp || 0) > curBonus) shouldAutoEquip = true;
        }

        if (shouldAutoEquip) {
          if (isWeapon) this.inventory.equippedWeapon = item.data;
          else if (isBow) this.inventory.equippedBow = item.data;
          else if (isArmor) this.inventory.equippedArmor = item.data;

          if (!(this.inventory.items || []).some(it => it.id === item.data.id)) {
            this.inventory.items.push(item.data);
          }
          saveInventory(this.inventory);
          this.recalculatePlayerStats();
          AudioFX.itemPickup();
          const bonusText = isArmor ? `+${item.data.bonusHp} Salud` : `+${item.data.bonusDmg} Daño`;
          this.spawnFloatingText(this.player.x, this.player.y - 28, `⚔️ ¡${item.data.name} EQUIPADA! (${bonusText})`, '#38bdf8', 14);
        } else {
          this.inventory.items.push(item.data);
          saveInventory(this.inventory);
          AudioFX.itemPickup();
          this.spawnFloatingText(this.player.x, this.player.y - 24, `📦 ¡${item.data.name} en Mochila!`, '#a855f7', 13);
        }

        this.updateInventoryUi();
        this.renderInventoryList();
        this.updateUi();
      }

      if (typeof index === 'number' && index >= 0) {
        this.droppedLoot.splice(index, 1);
      }
    }

    pickupDroppedKey(k, index) {
      if (!k || !k.tier) return;
      this.data.keys[k.tier] = (this.data.keys[k.tier] || 0) + 1;
      saveDungeonData(this.data);
      AudioFX.itemPickup();
      const color = KEY_TIERS[k.tier]?.color || '#fbbf24';
      this.spawnFloatingText(k.x, k.y - 20, `🔑 ¡Llave de ${k.tier.toUpperCase()} recogida!`, color, 14);
      if (typeof index === 'number' && index >= 0) {
        this.droppedKeys.splice(index, 1);
      }
      this.updateUi();
      this.renderKeyIcons();
    }

    showVictoryModal() {
      if (this.promptEl) this.promptEl.style.display = 'none';
      if (this.victoryModalEl) {
        this.victoryModalEl.style.display = 'flex';
      }
      // Fuegos artificiales de celebración
      for (let i = 0; i < 30; i++) {
        this.particles.push({
          x: 384 + (Math.random() - 0.5) * 100,
          y: 240 + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 180,
          vy: (Math.random() - 0.5) * 180,
          color: ['#fbbf24', '#38bdf8', '#c084fc', '#ea580c'][Math.floor(Math.random() * 4)],
          life: 50, maxLife: 50, size: 5
        });
      }
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

    sendAction(action) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          t: 'dungeon_action',
          room: this.roomKey,
          from: this.currentUser.id,
          action
        }));
      }
    }

    handleRemoteAction(act) {
      if (act.type === 'slash') {
        AudioFX.swordSlash();
      } else if (act.type === 'arrow') {
        AudioFX.bowShot();
        this.projectiles.push({
          x: act.x, y: act.y,
          vx: act.vx, vy: act.vy,
          dmg: act.dmg || 28,
          color: '#38bdf8',
          fromPlayer: true,
          life: 45, radius: 2.5
        });
      }
    }

    addAllyBot() {
      const id = 'bot_' + Math.random().toString(36).slice(2, 6);
      this.teammates.set(id, {
        id,
        name: 'Guardián Bot',
        x: this.player.x - 30,
        y: this.player.y,
        hp: 120, maxHp: 120,
        radius: 12,
        isBot: true,
        shootTimer: 0
      });
      AudioFX.itemPickup();
      this.spawnFloatingText(this.player.x, this.player.y - 20, '🤖 ¡Aliado se unió al equipo!', '#38bdf8', 14);
    }

    attackSword() {
      if (this.player.attackCooldown > 0) return;
      this.player.attackCooldown = 0.28;
      this.player.isAttacking = true;
      this.player.attackAngle = this.player.angle;
      this.player.attackTimer = 160;

      AudioFX.swordSlash();
      this.sendAction({ type: 'slash', x: this.player.x, y: this.player.y, angle: this.player.angle });

      const reach = 54;
      const arc = Math.PI * 0.75;
      let hitAny = false;

      this.enemies.forEach(en => {
        const dx = en.x - this.player.x;
        const dy = en.y - this.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < reach + en.radius) {
          const ang = Math.atan2(dy, dx);
          let diff = ang - this.player.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          if (Math.abs(diff) < arc / 2) {
            hitAny = true;
            en.hp -= this.player.meleeDmg;
            const pushForce = 210;
            en.knockX = Math.cos(ang) * pushForce;
            en.knockY = Math.sin(ang) * pushForce;

            this.spawnFloatingText(en.x, en.y - 12, `-${this.player.meleeDmg}`, '#fbbf24', 14);

            for (let i = 0; i < 4; i++) {
              this.particles.push({
                x: en.x, y: en.y,
                vx: Math.cos(ang + (Math.random() - 0.5)) * 90,
                vy: Math.sin(ang + (Math.random() - 0.5)) * 90,
                color: '#38bdf8', life: 14, maxLife: 14, size: 3
              });
            }
          }
        }
      });

      if (hitAny) {
        AudioFX.hitEnemy();
        this.shakeIntensity = 3.5;
      }
    }

    shootCrossbow() {
      if (this.player.attackCooldown > 0) return;
      this.player.attackCooldown = 0.38;

      AudioFX.bowShot();

      const speed = 440;
      const vx = Math.cos(this.player.angle) * speed;
      const vy = Math.sin(this.player.angle) * speed;

      this.projectiles.push({
        x: this.player.x,
        y: this.player.y,
        vx, vy,
        dmg: this.player.bowDmg,
        color: '#c084fc',
        fromPlayer: true,
        life: 55,
        radius: 3
      });

      this.sendAction({ type: 'arrow', x: this.player.x, y: this.player.y, vx, vy, dmg: this.player.bowDmg });
    }

    isWall(x, y) {
      const col = Math.floor(x / TILE_SZ);
      const row = Math.floor(y / TILE_SZ);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      const m = this.currentMap || FLOOR_MAPS[1];
      const tile = m[row][col];
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

    spawnEnemy(type, x, y) {
      let en = {
        x, y,
        type,
        knockX: 0, knockY: 0,
        shootTimer: 0,
        animTimer: Math.random() * 10
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
        en.name = 'Gólem Coloso de Obsidiana';
      }

      this.enemies.push(en);
    }

    startLoop() {
      this.running = true;
      let lastTime = performance.now();

      const loop = (now) => {
        if (!this.running) return;
        try {
          const dt = Math.min((now - lastTime) / 1000, 0.1);
          lastTime = now;

          this.update(dt, now);
          this.render(now);
        } catch (err) {
          console.error('[CyberDefenseGame] Error en el bucle del juego:', err);
        } finally {
          this.animId = requestAnimationFrame(loop);
        }
      };

      this.animId = requestAnimationFrame(loop);
    }

    damagePlayer(dmg, fromAng) {
      if (this.player.invulnTimer > 0 || this.gameState !== 'play') return;
      this.player.invulnTimer = 0.65; // 650ms de inmunidad tras golpe para reaccionar
      this.player.hp -= dmg;
      this.shakeIntensity = Math.min(10, Math.max(4, dmg * 0.28));
      AudioFX.playerHurt();
      this.spawnFloatingText(this.player.x, this.player.y - 12, `-${dmg}`, '#ef4444', 15);

      if (fromAng != null) {
        const kb = 140;
        this.player.knockX = Math.cos(fromAng) * kb;
        this.player.knockY = Math.sin(fromAng) * kb;
      }
    }

    update(dt, now) {
      if (this.gameState !== 'play') return;

      if (this.player.attackCooldown > 0) this.player.attackCooldown -= dt;
      if (this.player.invulnTimer > 0) this.player.invulnTimer -= dt;

      // Movimiento jugador
      let dx = 0; let dy = 0;
      if (this.keys.KeyW || this.keys.ArrowUp) dy -= 1;
      if (this.keys.KeyS || this.keys.ArrowDown) dy += 1;
      if (this.keys.KeyA || this.keys.ArrowLeft) dx -= 1;
      if (this.keys.KeyD || this.keys.ArrowRight) dx += 1;

      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
      if (dx !== 0 || dy !== 0) {
        this.player.walkCycle += dt * 14;
      }
      this.moveEntity(this.player, dx * this.player.speed, dy * this.player.speed, dt);

      // Verificación automática de entrar al portal (solo si está activo)
      if (this.portal && this.portal.active && !this.dungeonWon) {
        this.checkPortalEnter();
      }

      if (this.player.isAttacking) {
        this.player.attackTimer -= dt * 1000;
        if (this.player.attackTimer <= 0) this.player.isAttacking = false;
      }

      // Bots aliados
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
        en.animTimer = (en.animTimer || 0) + dt;

        if (en.hp <= 0) {
          this.handleEnemyDeath(en);
          this.enemies.splice(i, 1);
          continue;
        }

        const toPlayerX = this.player.x - en.x;
        const toPlayerY = this.player.y - en.y;
        const dist = Math.hypot(toPlayerX, toPlayerY);
        const ang = Math.atan2(toPlayerY, toPlayerX);

        // Separación física suave (anti-atasco): si el enemigo y el jugador colisionan, se separan elásticamente
        const minBodyDist = en.radius + this.player.radius;
        if (dist < minBodyDist && dist > 0.001) {
          const overlap = minBodyDist - dist;
          en.x -= Math.cos(ang) * overlap * 0.55;
          en.y -= Math.sin(ang) * overlap * 0.55;
          this.player.x += Math.cos(ang) * overlap * 0.45;
          this.player.y += Math.sin(ang) * overlap * 0.45;
        }

        if (en.type === 'zombie_miner') {
          if (dist > minBodyDist - 2) {
            this.moveEntity(en, Math.cos(ang) * en.speed, Math.sin(ang) * en.speed, dt);
          }
          if (dist < minBodyDist + 6) {
            en.attackCooldown = (en.attackCooldown || 0) + dt;
            if (en.attackCooldown > 0.75) {
              en.attackCooldown = 0;
              this.damagePlayer(18, ang);
            }
          }
        } else if (en.type === 'skeleton_archer') {
          if (dist < 140) {
            this.moveEntity(en, -Math.cos(ang) * en.speed, -Math.sin(ang) * en.speed, dt);
          } else if (dist > 220) {
            this.moveEntity(en, Math.cos(ang) * en.speed, Math.sin(ang) * en.speed, dt);
          }

          en.shootTimer = (en.shootTimer || 0) + dt;
          if (en.shootTimer > 1.6) {
            en.shootTimer = 0;
            const spd = 280;
            this.projectiles.push({
              x: en.x, y: en.y,
              vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
              dmg: 16, color: '#f87171', fromPlayer: false, life: 55, radius: 2.5
            });
            AudioFX.bowShot();
          }
        } else if (en.type === 'golem_boss') {
          if (dist > minBodyDist - 4) {
            this.moveEntity(en, Math.cos(ang) * en.speed, Math.sin(ang) * en.speed, dt);
          }
          if (dist < minBodyDist + 10) {
            en.attackCooldown = (en.attackCooldown || 0) + dt;
            if (en.attackCooldown > 1.0) {
              en.attackCooldown = 0;
              this.damagePlayer(34, ang);
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

        if (this.isWall(p.x, p.y) || p.life <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }

        if (p.fromPlayer) {
          for (let j = 0; j < this.enemies.length; j++) {
            const en = this.enemies[j];
            if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + p.radius) {
              en.hp -= p.dmg;
              // Las flechas perforan sin empujar hacia atras a los enemigos
              en.knockX = 0;
              en.knockY = 0;
              this.spawnFloatingText(en.x, en.y - 12, `-${p.dmg}`, '#c084fc', 13);
              AudioFX.hitEnemy();
              this.projectiles.splice(i, 1);
              break;
            }
          }
        } else {
          if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < this.player.radius + p.radius) {
            const pAng = Math.atan2(p.vy, p.vx);
            this.damagePlayer(p.dmg, pAng);
            this.projectiles.splice(i, 1);
          }
        }
      }

      // Recolección y atracción magnética de botín de combate (armas y armaduras)
      for (let i = this.droppedLoot.length - 1; i >= 0; i--) {
        const item = this.droppedLoot[i];
        item.bob = (item.bob || 0) + dt * 4;
        const d = Math.hypot(this.player.x - item.x, this.player.y - item.y);

        // Imán de botín: a menos de 135px el arma o armadura vuela hacia el explorador
        if (d < 135 && d > 1) {
          const pullSpeed = Math.min(320, 160 + (135 - d) * 2.5);
          item.x += ((this.player.x - item.x) / d) * pullSpeed * dt;
          item.y += ((this.player.y - item.y) / d) * pullSpeed * dt;
        }

        // Absorción física por contacto (radio ampliado a 44px)
        if (d < this.player.radius + 32) {
          this.pickupDroppedLoot(item, i);
        }
      }

      // Recolección y atracción magnética de llaves de perfil
      for (let i = this.droppedKeys.length - 1; i >= 0; i--) {
        const k = this.droppedKeys[i];
        k.bob = (k.bob || 0) + dt * 4;
        const d = Math.hypot(this.player.x - k.x, this.player.y - k.y);

        // Imán de llaves a menos de 135px
        if (d < 135 && d > 1) {
          const pullSpeed = Math.min(320, 160 + (135 - d) * 2.5);
          k.x += ((this.player.x - k.x) / d) * pullSpeed * dt;
          k.y += ((this.player.y - k.y) / d) * pullSpeed * dt;
        }

        // Absorción física por contacto
        if (d < this.player.radius + 32) {
          this.pickupDroppedKey(k, i);
        }
      }

      // Activar portal al despejar los enemigos de la planta
      if (this.enemies.length === 0 && !this.floorCleared) {
        this.floorCleared = true;
        const pX = (this.floor === 3 ? 660 : (this.floor === 4 || this.floor === 5 ? 384 : 620));
        this.portal = { x: pX, y: 240, active: true };
        AudioFX.portalOpen();

        // Recompensa de Monedas por Despejar Planta
        const floorCoins = [20, 30, 45, 60, 100][this.floor - 1] || 25;
        this.data.coins += floorCoins;
        this.spawnFloatingText(this.player.x, this.player.y - 28, `🪙 +${floorCoins} Monedas (Planta ${this.floor})`, '#fde047', 14);

        // Sistema de Llaves Criptográficas (Drop por Planta con Tope Diario de 20)
        const todayStr = new Date().toISOString().slice(0, 10);
        if (!this.data.dailyKeys || this.data.dailyKeys.date !== todayStr) {
          this.data.dailyKeys = { date: todayStr, count: 0 };
        }

        const dropKeyIfUnderCap = (tierKey, label) => {
          if ((this.data.dailyKeys.count || 0) >= 20) {
            this.data.coins += 25;
            this.spawnFloatingText(this.player.x, this.player.y - 42, 'Tope diario de llaves (20/20) +25 🪙', '#fde047', 12);
            return;
          }
          this.data.dailyKeys.count = (this.data.dailyKeys.count || 0) + 1;
          this.droppedKeys.push({ x: pX + (Math.random() - 0.5) * 40, y: 240 + (Math.random() - 0.5) * 40, tier: tierKey, bob: 0 });
          this.spawnFloatingText(this.player.x, this.player.y - 45, `🔑 ¡Llave de ${label}!`, KEY_TIERS[tierKey].color, 14);
        };

        const rKey = Math.random();
        if (this.floor === 1) {
          if (rKey < 0.60) dropKeyIfUnderCap('copper', 'Cobre');
        } else if (this.floor === 2) {
          if (rKey < 0.10) dropKeyIfUnderCap('silver', 'Plata');
          else if (rKey < 0.90) dropKeyIfUnderCap('copper', 'Cobre');
        } else if (this.floor === 3) {
          if (rKey < 0.25) dropKeyIfUnderCap('silver', 'Plata');
          dropKeyIfUnderCap('copper', 'Cobre');
        } else if (this.floor === 4) {
          if (rKey < 0.10) dropKeyIfUnderCap('gold', 'Oro');
          else if (rKey < 0.70) dropKeyIfUnderCap('silver', 'Plata');
        } else if (this.floor === 5) {
          dropKeyIfUnderCap('silver', 'Plata');
          if (rKey < 0.10) dropKeyIfUnderCap('obsidian', 'Obsidiana');
          else if (rKey < 0.40) dropKeyIfUnderCap('gold', 'Oro');

          // Bono semanal del Gólem
          const dNow = new Date();
          dNow.setHours(0,0,0,0);
          dNow.setDate(dNow.getDate() + 4 - (dNow.getDay() || 7));
          const yStart = new Date(dNow.getFullYear(), 0, 1);
          const curWeek = `${dNow.getFullYear()}-W${Math.ceil((((dNow - yStart) / 86400000) + 1) / 7)}`;

          if (!this.data.weeklyGolem || this.data.weeklyGolem.week !== curWeek) {
            this.data.weeklyGolem = { week: curWeek, killed: true };
            this.droppedKeys.push({ x: pX + 25, y: 240, tier: 'obsidian', bob: 0 });
            this.spawnFloatingText(this.player.x, this.player.y - 60, '💎 ¡BONO SEMANAL: LLAVE DE OBSIDIANA GARANTIZADA!', '#c084fc', 15);
          }
        }

        saveDungeonData(this.data);
        this.updateUi();

        // Sincronización autoritativa con el servidor de EpicKast (SQLite + Firebase)
        if (typeof window !== 'undefined' && window.epicRpc) {
          const keysDict = {};
          for (const k of this.droppedKeys) {
            keysDict[k.tier] = (keysDict[k.tier] || 0) + 1;
          }
          window.epicRpc('dungeon.sync', {
            floor: this.floor,
            coins: floorCoins,
            keys: keysDict,
            bossDefeated: this.floor === 5
          }).catch((e) => console.warn('[dungeon.sync] offline o error:', e.message));
        }

        this.promptEl.style.display = 'block';
        if (this.floor < this.maxFloors) {
          this.promptEl.innerHTML = `🌀 <b>¡Planta ${this.floor} Despejada!</b> Entra al Portal para descender a <b>Nivel ${this.floor + 1}</b>`;
        } else {
          this.promptEl.innerHTML = `🏆 <b>¡Jefe derrotado!</b> Entra al portal central para purificar la mazmorra.`;
        }
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
        if (this.gameOverModalEl) this.gameOverModalEl.style.display = 'flex';
        this.spawnFloatingText(this.player.x, this.player.y, '💀 CAÍDO EN LA MINA', '#ef4444', 16);
      }

      this.updateUi();
    }

    handleEnemyDeath(en) {
      const coinDrop = en.type === 'golem_boss' ? 150 : (en.type === 'skeleton_archer' ? 5 : 2);
      this.data.coins += coinDrop;
      this.spawnFloatingText(en.x, en.y - 16, `+${coinDrop} 🪙`, '#fde047', 12);
      AudioFX.hitEnemy();

      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: en.x, y: en.y,
          vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90,
          color: '#ea580c', life: 22, maxLife: 22, size: 4
        });
      }

      // --- 1. Botín de Combate para el Minijuego ---
      if (en.type === 'golem_boss') {
        // Jefe siempre suelta arma mítica de combate
        this.droppedLoot.push({
          x: en.x - 20, y: en.y, bob: 0,
          data: { id: 'sword_fire_core', name: 'Espada Flamígera del Núcleo', type: 'weapon', bonusDmg: 55, desc: 'Corte ígneo con brasas del Coloso' }
        });
      } else if (en.type === 'skeleton_archer') {
        const rollItem = Math.random();
        if (rollItem < 0.18) {
          this.droppedLoot.push({
            x: en.x, y: en.y, bob: 0,
            data: { id: 'bow_runic', name: 'Ballesta Rúnica', type: 'bow', bonusDmg: 25, desc: 'Tensa cuerda rúnica con alta precisión' }
          });
        } else if (rollItem < 0.28) {
          this.droppedLoot.push({
            x: en.x, y: en.y, bob: 0,
            data: { id: 'armor_magma_mesh', name: 'Cota de Malla Volcánica', type: 'armor', bonusHp: 45, desc: 'Malla resistente a quemaduras' }
          });
        }
      } else {
        const rollItem = Math.random();
        if (rollItem < 0.15) {
          this.droppedLoot.push({
            x: en.x, y: en.y, bob: 0,
            data: { id: 'dagger_copper', name: 'Daga Rústica de Cobre', type: 'weapon', bonusDmg: 15, desc: 'Hoja afilada para cortes veloces' }
          });
        } else if (rollItem < 0.25) {
          this.droppedLoot.push({
            x: en.x, y: en.y, bob: 0,
            data: { id: 'tunic_adventurer', name: 'Túnica de Explorador', type: 'armor', bonusHp: 20, desc: 'Cuero reforzado para viajes largos' }
          });
        }
      }

      // --- 2. Llaves de Perfil (Con Drop Rate Equilibrado Mensual) ---
      if (en.type === 'golem_boss') {
        // El Gólem Coloso siempre otorga 1 Llave de Obsidiana
        this.droppedKeys.push({ x: en.x + 20, y: en.y, tier: 'obsidian', bob: 0 });
        this.spawnFloatingText(en.x, en.y - 30, '💎 ¡LLAVE DE OBSIDIANA!', '#c084fc', 15);
      } else if (en.type === 'skeleton_archer') {
        const rollKey = Math.random();
        if (rollKey < 0.06) {
          this.droppedKeys.push({ x: en.x, y: en.y, tier: 'silver', bob: 0 });
        } else if (rollKey < 0.08) { // 2% para oro
          this.droppedKeys.push({ x: en.x, y: en.y, tier: 'gold', bob: 0 });
        }
      } else {
        if (Math.random() < 0.10) { // 10% para cobre
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

      const fEl = this.container.querySelector('#dFloorNum');
      if (fEl) fEl.textContent = `${this.floor}/${this.maxFloors}`;

      ['copper', 'silver', 'gold', 'obsidian'].forEach(k => {
        const el = this.container.querySelector(`#kCount${k[0].toUpperCase() + k.slice(1)}`);
        if (el) el.textContent = this.data.keys[k] || 0;
      });
    }

    // --- RENDERIZADO HD 2.5D ISOMÉTRICO CON SPRITES Y SOMBRAS ---
    render(now) {
      const ctx = this.ctx;
      ctx.save();

      // Screen Shake
      if (this.shakeIntensity > 0.1) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        ctx.translate(sx, sy);
      }

      ctx.fillStyle = '#06040a';
      ctx.fillRect(0, 0, this.width, this.height);

      const curMap = this.currentMap || FLOOR_MAPS[1];

      // 1. SUELO DE ADOQUINES VOXEL
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = curMap[r][c];
          const tx = c * TILE_SZ;
          const ty = r * TILE_SZ;

          if (tile === 0 || tile === 4 || tile === 5) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#150f24' : '#1a132c';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
            ctx.fillRect(tx + 2, ty + 2, TILE_SZ - 4, TILE_SZ - 4);

            if (tile === 4) {
              // Pilar de soporte tallado
              ctx.fillStyle = '#2d1b44';
              ctx.fillRect(tx + 4, ty + 4, TILE_SZ - 8, TILE_SZ - 8);
              ctx.fillStyle = '#3f285d';
              ctx.fillRect(tx + 6, ty + 6, TILE_SZ - 12, TILE_SZ - 12);
            } else if (tile === 5) {
              // Cristal de amatista brillante
              ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
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

      // 2. RÍO DE LAVA
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = curMap[r][c];
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
            // Puentes de piedra sobre lava
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

      // 3. MUROS 3D VOXEL
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (curMap[r][c] === 1) {
            const tx = c * TILE_SZ;
            const ty = r * TILE_SZ;

            ctx.fillStyle = '#1e142e';
            ctx.fillRect(tx, ty, TILE_SZ, 14);

            ctx.fillStyle = '#4c3175';
            ctx.fillRect(tx, ty, TILE_SZ, 2);
            ctx.fillRect(tx, ty, 2, 14);

            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(tx + 6, ty + 5, 3, 3);
            ctx.fillRect(tx + TILE_SZ - 9, ty + 5, 3, 3);

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

      // 5. PORTAL DE DESCENSO A LA SIGUIENTE PLANTA (🌀)
      if (this.portal && this.portal.active) {
        ctx.save();
        ctx.translate(this.portal.x, this.portal.y);
        const pRot = (now * 0.003) % (Math.PI * 2);
        ctx.rotate(pRot);

        // Anillo exterior púrpura
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();

        // Remolino místico
        ctx.fillStyle = '#c084fc';
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillRect(4, -3, 16, 6);
        }

        // Núcleo del portal
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Texto flotante sobre el portal
        ctx.fillStyle = '#e879f9';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.floor < this.maxFloors ? `🌀 Portal Nivel ${this.floor + 1}` : '🏆 Salida Triunfal', this.portal.x, this.portal.y - 32);
      }

      // 6. BOTÍN EN EL SUELO (Armas, armaduras y pociones de combate)
      this.droppedLoot.forEach(item => {
        const bobY = Math.sin(item.bob || 0) * 4;
        const pulse = 1 + Math.sin((item.bob || 0) * 2) * 0.15;
        ctx.save();
        ctx.translate(item.x, item.y + bobY);

        // Sombra en suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath(); ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

        // Resplandor pulsante
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath(); ctx.arc(0, 0, 16 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2); ctx.stroke();

        if (item.data.type === 'weapon') {
          // Espada brillante
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-2, -10, 4, 16);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-1, -8, 2, 12);
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(-6, 2, 12, 3);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-2, 5, 4, 4);
        } else if (item.data.type === 'bow') {
          // Ballesta
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(0, 0, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-6, -2, 12, 4);
        } else {
          // Armadura
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-7, -7, 14, 14);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-5, -5, 10, 10);
        }

        // Etiqueta flotante oscura con borde neón
        ctx.font = 'bold 9px monospace';
        const txtW = ctx.measureText(item.data.name).width;
        ctx.fillStyle = 'rgba(10, 6, 20, 0.85)';
        ctx.fillRect(-txtW / 2 - 4, -22, txtW + 8, 12);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-txtW / 2 - 4, -22, txtW + 8, 12);

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText(item.data.name, 0, -13);
        ctx.restore();
      });

      // 7. LLAVES EN EL SUELO (Para la Bóveda de perfil)
      this.droppedKeys.forEach(k => {
        const bobY = Math.sin(k.bob) * 3;
        KEY_TIERS[k.tier].draw(ctx, k.x, k.y + bobY, 18);
      });

      // 8. ENEMIGOS (Sprites Detallados con Sombras y Físicas)
      this.enemies.forEach(en => {
        ctx.save();
        ctx.translate(en.x, en.y);

        // Sombra suave en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, en.radius * 0.7, en.radius, en.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        const anim = Math.sin(en.animTimer * 6);

        if (en.type === 'zombie_miner') {
          // Minero Zombi HD
          // Cono de luz de la linterna frontal
          const pAngle = Math.atan2(this.player.y - en.y, this.player.x - en.x);
          ctx.save();
          ctx.rotate(pAngle);
          const grad = ctx.createRadialGradient(8, 0, 4, 38, 0, 42);
          grad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.arc(8, 0, 42, -0.4, 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Cuerpo de zombi
          ctx.fillStyle = '#1e3a8a'; // Pantalón minero
          ctx.fillRect(-6, 2, 12, 10);
          ctx.fillStyle = '#365314'; // Piel verdosa descompuesta
          ctx.fillRect(-7, -6, 14, 9);
          // Brazos extendidos
          ctx.fillRect(-9, -4 + anim * 2, 4, 10);
          ctx.fillRect(5, -4 - anim * 2, 4, 10);
          // Cabeza y Casco
          ctx.fillStyle = '#4d7c0f';
          ctx.fillRect(-6, -14, 12, 9);
          ctx.fillStyle = '#b45309'; // Casco industrial oxidado
          ctx.fillRect(-8, -17, 16, 5);
          ctx.fillStyle = '#fef08a'; // Foco del casco
          ctx.fillRect(-3, -16, 6, 4);
          // Ojos siniestros
          ctx.fillStyle = '#fde047';
          ctx.fillRect(-4, -11, 2, 2);
          ctx.fillRect(2, -11, 2, 2);
          // Pico ensangrentado en la mano
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(8, -6, 3, 14);
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(6, -10, 10, 4);

        } else if (en.type === 'skeleton_archer') {
          // Arquero Esqueleto HD
          // Capa desgarrada
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-6, -4, 12, 14);
          // Costillas de hueso
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(-4, -2, 8, 2);
          ctx.fillRect(-4, 2, 8, 2);
          ctx.fillRect(-4, 6, 8, 2);
          // Cráneo
          ctx.fillRect(-5, -14, 10, 9);
          // Cuencas con fuego espectral violeta
          const fEye = (Math.sin(now * 0.02) + 1) * 0.5;
          ctx.fillStyle = fEye > 0.3 ? '#e11d48' : '#c084fc';
          ctx.fillRect(-3, -11, 2, 2);
          ctx.fillRect(1, -11, 2, 2);
          // Arco largo curvado
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(8, 0, 10, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
          // Cuerda del arco
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(8, -10);
          ctx.lineTo(4, 0);
          ctx.lineTo(8, 10);
          ctx.stroke();

        } else if (en.type === 'golem_boss') {
          // Jefe Gólem Coloso de Obsidiana HD (Imponente)
          const heart = (Math.sin(now * 0.007) + 1) * 0.5;
          
          // Bloques de obsidiana facetados 3D
          ctx.fillStyle = '#0f0a1c';
          ctx.fillRect(-28, -28, 56, 56);
          ctx.fillStyle = '#1e1338';
          ctx.fillRect(-24, -24, 48, 48);

          // Grietas de lava ardiente palpitantes
          ctx.fillStyle = heart > 0.4 ? '#f97316' : '#ea580c';
          ctx.fillRect(-16, -14, 32, 6);
          ctx.fillRect(-6, -8, 12, 24);
          ctx.fillRect(-18, 10, 36, 6);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-8, -13, 16, 4);
          ctx.fillRect(-3, -4, 6, 14);

          // Puños gigantes flotantes de basalto
          const fistBob = Math.sin(now * 0.008) * 4;
          ctx.fillStyle = '#2d1b54';
          ctx.fillRect(-36, -6 + fistBob, 10, 16);
          ctx.fillRect(26, -6 - fistBob, 10, 16);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(-34, -2 + fistBob, 6, 8);
          ctx.fillRect(28, -2 - fistBob, 6, 8);

          // Ojos ardientes de hendidura
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-14, -20, 8, 4);
          ctx.fillRect(6, -20, 8, 4);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(-12, -19, 4, 2);
          ctx.fillRect(8, -19, 4, 2);
        }

        ctx.restore();

        // Barra de Salud Ornamental
        const hpPct = Math.max(0, en.hp / en.maxHp);
        const barW = en.type === 'golem_boss' ? 56 : 28;
        ctx.fillStyle = '#090511';
        ctx.fillRect(en.x - barW / 2, en.y - en.radius - 12, barW, 4);
        ctx.fillStyle = en.type === 'golem_boss' ? '#c084fc' : '#ef4444';
        ctx.fillRect(en.x - barW / 2, en.y - en.radius - 12, Math.round(barW * hpPct), 4);
      });

      // 9. BOTS ALIADOS
      this.teammates.forEach(tm => {
        ctx.save();
        ctx.translate(tm.x, tm.y);
        ctx.rotate(tm.angle || 0);

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 3, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#065f46';
        ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-6, -6, 12, 12);
        ctx.fillStyle = '#a7f3d0';
        ctx.fillRect(2, -2, 4, 4);
        ctx.restore();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tm.name, tm.x, tm.y - 18);
      });

      // 10. EL JUGADOR (Explorador del Núcleo HD con Armadura y Armas Dinámicas)
      // Si está en tiempo de invulnerabilidad, parpadea visualmente
      if (this.player.invulnTimer > 0 && Math.floor(now / 80) % 2 === 0) {
        ctx.globalAlpha = 0.45;
      }
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Sombra suave en el suelo
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 5, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(this.player.angle);

      // Determinar colores y texturas según equipo
      const eqArmorId = this.inventory.equippedArmor?.id || 'leather_armor';
      const eqWeaponId = this.inventory.equippedWeapon?.id || 'iron_sword';

      let capeColor = '#1e293b';
      let armorPrimary = '#0284c7';
      let armorSecondary = '#0f172a';
      let pauldronColor = '#b45309';

      if (eqArmorId === 'armor_magma_mesh') {
        capeColor = '#7f1d1d';
        armorPrimary = '#dc2626';
        armorSecondary = '#450a0a';
        pauldronColor = '#f97316';
      } else if (eqArmorId === 'armor_colossus' || eqArmorId === 'armor_obsidian') {
        capeColor = '#2e1065';
        armorPrimary = '#7e22ce';
        armorSecondary = '#1e1b4b';
        pauldronColor = '#c084fc';
      } else if (eqArmorId === 'tunic_adventurer') {
        capeColor = '#064e3b';
        armorPrimary = '#10b981';
        armorSecondary = '#022c22';
        pauldronColor = '#d97706';
      }

      // Capa ondeando
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-12, -7, 6, 14);
      ctx.fillStyle = capeColor;
      ctx.fillRect(-10, -6, 5, 12);

      // Torso y armadura dinámica
      ctx.fillStyle = armorSecondary;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = armorPrimary;
      ctx.fillRect(-5, -5, 10, 10);

      // Hombreras
      ctx.fillStyle = pauldronColor;
      ctx.fillRect(-7, -8, 4, 16);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, -2, 3, 4);

      // Cabeza y Capucha con Visera
      ctx.fillStyle = '#334155';
      ctx.fillRect(-5, -6, 10, 12);
      // Ojos cian resplandecientes del aventurero
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, -4, 4, 3);
      ctx.fillRect(2, 1, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, -3, 2, 2);
      ctx.fillRect(3, 2, 2, 2);

      // Arma Dinámica en mano
      if (eqWeaponId === 'sword_fire_core' || eqWeaponId === 'sword_fire') {
        // Espada Flamígera con brasa incandescente
        ctx.fillStyle = '#78350f';
        ctx.fillRect(5, 2, 3, 7);
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(6, 4, 16, 4);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(8, 5, 12, 2);
      } else if (eqWeaponId === 'dagger_copper') {
        // Daga rápida de cobre
        ctx.fillStyle = '#92400e';
        ctx.fillRect(5, 2, 2, 5);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(7, 3, 10, 3);
      } else {
        // Espada de hierro forjada estándar
        ctx.fillStyle = '#64748b';
        ctx.fillRect(6, 4, 14, 3);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(8, 5, 11, 1);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(5, 2, 3, 7);
      }

      ctx.restore();
      ctx.globalAlpha = 1.0;

      // Animación de Tajo Melee (Arco de Energía Luminosa)
      if (this.player.isAttacking) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.attackAngle);
        
        const isFire = (this.inventory.equippedWeapon?.id || '').includes('fire');
        ctx.strokeStyle = isFire ? 'rgba(249, 115, 22, 0.95)' : 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 48, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 48, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();

        ctx.restore();
      }

      // 11. PROYECTILES
      this.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - p.vx * 0.012, p.y - p.vy * 0.012, p.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // 12. PARTÍCULAS
      this.particles.forEach(pt => {
        const pct = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pct;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
        ctx.globalAlpha = 1.0;
      });

      // 13. TEXTOS FLOTANTES
      this.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size || 13}px monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // 14. PANTALLA DE GAMEOVER
      if (this.gameState === 'gameover') {
        ctx.fillStyle = 'rgba(15, 6, 24, 0.85)';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💀 HAS CAÍDO EN LAS MINAS', this.width / 2, this.height / 2 - 20);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('👉 Haz clic en la pantalla o pulsa "🔄 Reiniciar" para volver a intentarlo', this.width / 2, this.height / 2 + 15);
      }

      ctx.restore();
    }

    spawnFloatingText(x, y, text, color, size = 13) {
      this.floatingTexts.push({
        x, y,
        text, color, size,
        vy: -0.65,
        life: 0,
        maxLife: 45
      });
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

      this.container.replaceChildren();
    }
  }

  global.CyberDefenseGame = CyberDefenseGame;
})(window);
