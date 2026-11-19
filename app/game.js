// EpicKast: Dungeons of the Core • Minas de Magma & Obsidiana (v1.9.6 Cartoon Edition)
// Action-RPG de Mazmorras Cooperativo con 5 Niveles y Navegación entre Plantas:
// - Nivel 1: Entrada de las Minas de Magma (Mineros Zombi, llaves de cobre)
// - Nivel 2: Galerías de Amatista (Zombis + Arqueros Esqueléticos, llaves de plata)
// - Nivel 3: Los Puentes de Lava (Combate táctico sobre abismos de magma)
// - Nivel 4: La Cripta de Basalto (Guardias de magma de élite, llaves de oro)
// - Nivel 5: Sagrario del Núcleo (Jefe Gólem Coloso de Obsidiana, llave de obsidiana)
//
// Al despejar cada nivel, se abre un Portal Místico (🌀) para descender a la siguiente planta.
// Estética Cartoon 2D suave con trazos #1e2433, sombras blandas, partículas circulares y efectos fluidos.
// Inventario integrado del personaje para equipar armas y armaduras ganadas en el juego.
// Llaves de perfil con ratio de aparición equilibrado mensual para la Bóveda de Reliquias.
// 100% compatible con las políticas de Microsoft Store (IARC Everyone).

(function(global) {
  'use strict';

  // --- Motor de Audio Web Audio Sintetizado + Puente Opcional EKAudio ---
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
        o.frequency.exponentialRampToValueAtTime(75, t + 0.1);
        g.gain.setValueAtTime(0.13, t);
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
        o.frequency.setValueAtTime(680, t);
        o.frequency.exponentialRampToValueAtTime(190, t + 0.12);
        g.gain.setValueAtTime(0.08, t);
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
        o.type = 'triangle';
        o.frequency.setValueAtTime(190, t);
        o.frequency.exponentialRampToValueAtTime(62, t + 0.08);
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
        o.type = 'triangle';
        o.frequency.setValueAtTime(155, t);
        o.frequency.exponentialRampToValueAtTime(58, t + 0.16);
        g.gain.setValueAtTime(0.10, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.17);
      } catch {}
    },
    coinPickup() {
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, t);
        o.frequency.setValueAtTime(1174.66, t + 0.05);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.17);
      } catch {}
    },
    itemPickup() {
      try { window.EKAudio?.play?.('chest-open', 0.45); } catch {}
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(523.25, t);
        o.frequency.setValueAtTime(659.25, t + 0.06);
        o.frequency.setValueAtTime(783.99, t + 0.12);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.23);
      } catch {}
    },
    allyJoin() {
      try { window.EKAudio?.play?.('voice-join', 0.45); } catch {}
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        const o = c.createOscillator(); const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(440, t);
        o.frequency.setValueAtTime(587.33, t + 0.07);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.21);
      } catch {}
    },
    portalOpen() {
      try { window.EKAudio?.play?.('msg-send', 0.5); } catch {}
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        [330, 440, 554, 659].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, t + i * 0.07);
          g.gain.setValueAtTime(0.07, t + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.3);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.32);
        });
      } catch {}
    },
    victory() {
      try { window.EKAudio?.play?.('legendary-win', 0.65); } catch {}
      const c = this.getCtx(); if (!c) return;
      try {
        const t = c.currentTime;
        // Fanfarria triunfal ascendente única (sin repetición)
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
          const o = c.createOscillator(); const g = c.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, t + i * 0.09);
          g.gain.setValueAtTime(0.001, t + i * 0.09);
          g.gain.linearRampToValueAtTime(0.09, t + i * 0.09 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.45);
          o.connect(g); g.connect(c.destination);
          o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.48);
        });
      } catch {}
    }
  };

  function roundedRectPath(ctx, x, y, w, h, r) {
    const rad = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawCartoonKey(ctx, x, y, size, mainColor, highlightColor, glowColor) {
    ctx.save();
    const outlineW = Math.max(1.6, Math.min(2.2, size * 0.11));
    if (glowColor) {
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.68, 0, Math.PI * 2);
      ctx.fill();
    }

    const bowY = y - size * 0.25;
    const outerR = size * 0.33;
    const innerR = size * 0.13;
    const shaftW = Math.max(3, size * 0.20);
    const shaftTop = bowY + outerR * 0.65;
    const shaftH = size * 0.66;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e2433';
    ctx.lineWidth = outlineW;

    // Dientes de llave redondeados
    roundedRectPath(ctx, x, shaftTop + shaftH * 0.50, size * 0.25, Math.max(2.3, size * 0.14), 1.4);
    ctx.fillStyle = mainColor;
    ctx.fill();
    ctx.stroke();

    roundedRectPath(ctx, x, shaftTop + shaftH * 0.78, size * 0.19, Math.max(2.1, size * 0.12), 1.3);
    ctx.fillStyle = mainColor;
    ctx.fill();
    ctx.stroke();

    // Vástago redondeado
    roundedRectPath(ctx, x - shaftW / 2, shaftTop, shaftW, shaftH, shaftW / 2);
    ctx.fillStyle = mainColor;
    ctx.fill();
    ctx.stroke();

    // Brillo en el vástago
    ctx.fillStyle = highlightColor;
    ctx.fillRect(x - shaftW * 0.18, shaftTop + 2, shaftW * 0.32, shaftH * 0.62);

    // Cabeza anillada hueca con contorno #1e2433
    ctx.beginPath();
    ctx.arc(x, bowY, outerR, 0, Math.PI * 2, false);
    ctx.moveTo(x + innerR, bowY);
    ctx.arc(x, bowY, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = mainColor;
    ctx.fill('evenodd');
    ctx.stroke();

    // Brillo cartoon en anillo
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = Math.max(1.2, size * 0.08);
    ctx.beginPath();
    ctx.arc(x, bowY, (outerR + innerR) * 0.52, -Math.PI * 0.85, -Math.PI * 0.25);
    ctx.stroke();

    ctx.restore();
  }

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

  // --- Catálogo de Llaves (Sprites Cartoon Limpios de perfil) ---
  const KEY_TIERS = {
    copper: {
      name: 'Llave de Cobre', color: '#f59e0b',
      draw(ctx, x, y, size = 18) {
        drawCartoonKey(ctx, x, y, size, '#e07a24', '#fcd34d', null);
      }
    },
    silver: {
      name: 'Llave de Plata', color: '#cbd5e1',
      draw(ctx, x, y, size = 18) {
        drawCartoonKey(ctx, x, y, size, '#cbd5e1', '#ffffff', null);
      }
    },
    gold: {
      name: 'Llave de Oro', color: '#fbbf24',
      draw(ctx, x, y, size = 18) {
        drawCartoonKey(ctx, x, y, size, '#fbbf24', '#fef9c3', 'rgba(251, 191, 36, 0.25)');
      }
    },
    obsidian: {
      name: 'Llave de Obsidiana', color: '#c084fc',
      draw(ctx, x, y, size = 20) {
        drawCartoonKey(ctx, x, y, size, '#a855f7', '#f5d0fe', 'rgba(192, 132, 252, 0.35)');
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
        <div class="cd-wrap" style="position:relative; width: 1040px; max-width: 98vw; background:#131722; border:2px solid #2b3348; border-radius:14px; overflow:hidden; box-shadow:0 16px 44px rgba(8, 11, 20, 0.72); font-family:system-ui, -apple-system, sans-serif;">
          
          <!-- Encabezado -->
          <div class="cd-header" style="background:#1b2131; border-bottom:1px solid #2b3348; padding:10px 16px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">🌋</span>
              <div>
                <strong id="dFloorTitle" style="color:#f8fafc; font-size:15px; letter-spacing:0.4px;">Dungeons of the Core • Nivel 1</strong>
                <span style="background:#4f46e5; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:999px; margin-left:6px; border:1px solid #818cf8;">v1.9.6</span>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:18px;">
              <div style="color:#fda4af; font-size:12px; font-weight:700;">❤️ Salud: <b id="dHp" style="color:#fff;">${Math.round(this.player.hp)}/${this.player.maxHp}</b></div>
              <div style="color:#fde047; font-size:12px; font-weight:700;">💰 Monedas: <b id="dCoins" style="color:#fff;">${this.data.coins}</b></div>
              <div style="color:#c4b5fd; font-size:12px; font-weight:700;">🏰 Planta: <b id="dFloorNum" style="color:#fff;">1/5</b></div>
            </div>

            <div style="display:flex; gap:8px;">
              <button id="dBtnRestart" class="cd-btn" style="background:#d97706; border:1px solid #f59e0b; color:#fff; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer; box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2);" title="Reiniciar desde el Nivel 1">🔄 Reiniciar</button>
              <button id="dBtnInvite" class="cd-btn" style="background:#059669; border:1px solid #34d399; color:#fff; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer; box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2);">📢 Invitar</button>
              <button id="dBtnBot" class="cd-btn" style="background:#2563eb; border:1px solid #60a5fa; color:#fff; font-weight:700; padding:6px 12px; border-radius:8px; cursor:pointer; box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2);">🤖 +Aliado</button>
              <button id="dBtnClose" class="cd-btn" style="background:#334155; border:1px solid #475569; color:#fff; padding:6px 12px; border-radius:8px; cursor:pointer;">✕ Salir</button>
            </div>
          </div>

          <!-- Canvas + Panel Lateral -->
          <div style="display:flex; background:#131722;">
            <div style="position:relative; width:768px; height:480px; flex:none;">
              <canvas id="dCanvas" width="768" height="480" style="display:block; cursor:crosshair; background:#262c3d;"></canvas>
              
              <div id="dPortalPrompt" style="display:none; position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(19, 23, 34, 0.94); border:2px solid #818cf8; padding:10px 20px; border-radius:999px; color:#f8fafc; font-size:13px; font-weight:800; box-shadow:0 8px 24px rgba(15, 23, 42, 0.55); pointer-events:none; z-index:15;">
                🌀 ¡PORTAL ACTIVO! Camina hacia él para descender
              </div>

              <!-- Modal de Game Over Interactivo -->
              <div id="dGameOverModal" style="display:none; position:absolute; inset:0; background:rgba(19, 23, 34, 0.90); backdrop-filter:blur(6px); z-index:30; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center;">
                <div style="font-size:42px; margin-bottom:8px;">💫</div>
                <h2 style="color:#fb7185; font-size:22px; font-weight:900; margin:0 0 8px 0; letter-spacing:0.6px;">HAS CAÍDO EN LAS MINAS</h2>
                <p style="color:#cbd5e1; font-size:13px; max-width:420px; margin:0 0 18px 0; line-height:1.45;">
                  Los guardianes de la mina te han superado. Conservas tus llaves y monedas para reintentar la expedición.
                </p>
                <button id="dGoBtnRetry" style="background:linear-gradient(135deg, #facc15, #eab308); color:#131722; border:2px solid #1e2433; padding:12px 30px; border-radius:10px; font-weight:900; cursor:pointer; font-size:14px; box-shadow:0 6px 20px rgba(234,179,8,0.35); text-transform:uppercase; letter-spacing:0.6px;">
                  🔄 REINTENTAR DESDE EL NIVEL 1
                </button>
              </div>

              <!-- Modal de Victoria (Único y sin bugs) -->
              <div id="dVictoryModal" style="display:none; position:absolute; inset:0; background:rgba(19, 23, 34, 0.90); backdrop-filter:blur(6px); z-index:30; flex-direction:column; align-items:center; justify-content:center; padding:20px; text-align:center;">
                <div style="font-size:42px; margin-bottom:8px;">🏆</div>
                <h2 style="color:#fbbf24; font-size:22px; font-weight:900; margin:0 0 6px 0; letter-spacing:0.6px;">¡MAZMORRA PURIFICADA!</h2>
                <p style="color:#cbd5e1; font-size:13px; max-width:440px; margin:0 0 16px 0; line-height:1.45;">
                  Has conquistado las 5 plantas del Sagrario del Núcleo y vencido al Gólem Coloso de Obsidiana.
                </p>
                <div style="background:#1b2131; border:1.5px solid #6366f1; border-radius:12px; padding:12px 20px; margin-bottom:18px; color:#e2e8f0; font-size:12px;">
                  💎 <b>Recompensa Principal:</b> 1 Llave de Obsidiana para la Bóveda.<br>
                  ★ Abre tu cofre en la barra de la app para desbloquear el <b>Marco Azul de Fundador</b>.
                </div>
                <div style="display:flex; gap:12px;">
                  <button id="dVicOpenVault" style="background:linear-gradient(135deg, #92400e, #d97706); color:#fef3c7; border:1.5px solid #fbbf24; padding:10px 20px; border-radius:10px; font-weight:800; cursor:pointer; font-size:13px; box-shadow:0 6px 18px rgba(217,119,6,0.35);">
                    🎁 ABRIR BÓVEDA DE RELIQUIAS
                  </button>
                  <button id="dVicRestart" style="background:#334155; color:#fff; border:1px solid #475569; padding:10px 18px; border-radius:10px; font-weight:700; cursor:pointer; font-size:13px;">
                    🔄 Jugar de Nuevo
                  </button>
                </div>
              </div>
            </div>

            <!-- Panel Lateral con Pestañas: [Mazmorra] y [Inventario] -->
            <div style="flex:1; background:#131722; border-left:1px solid #2b3348; display:flex; flex-direction:column; overflow:hidden; max-height:480px;">
              
              <!-- Selector de Pestañas -->
              <div style="display:flex; border-bottom:1px solid #2b3348; background:#1b2131;">
                <button id="dTabBtnDungeon" style="flex:1; padding:10px 4px; font-size:11px; font-weight:800; background:#131722; color:#fbbf24; border:none; border-bottom:2px solid #fbbf24; cursor:pointer;">
                  ⚔️ Mazmorra
                </button>
                <button id="dTabBtnInv" style="flex:1; padding:10px 4px; font-size:11px; font-weight:800; background:#1b2131; color:#94a3b8; border:none; border-bottom:2px solid transparent; cursor:pointer;">
                  🎒 Inventario
                </button>
              </div>

              <!-- Pestaña 1: Mazmorra y Llaves -->
              <div id="dTabPanelDungeon" style="padding:14px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; flex:1;">
                
                <!-- Acceso a la Bóveda -->
                <div style="background:#1b2131; border:1px solid #d97706; border-radius:10px; padding:10px; font-size:11px; color:#fde68a; line-height:1.4;">
                  <strong style="display:block; color:#fff; font-size:12px; margin-bottom:4px;">🏛️ Bóveda de Cosméticos</strong>
                  Las llaves abren marcos, colores y banners para tu perfil.
                  <button id="dBtnOpenVault" style="background:linear-gradient(135deg, #92400e, #d97706);color:#fef3c7;border:1px solid #fbbf24;font-size:11px;font-weight:800;padding:6px 10px;border-radius:8px;cursor:pointer;width:100%;text-align:center;margin-top:8px;">🎁 Ir a la Bóveda de Reliquias</button>
                </div>

                <!-- Llaves Recolectadas -->
                <div style="background:#1b2131; border:1px solid #2b3348; border-radius:10px; padding:10px;">
                  <h4 style="margin:0 0 8px 0; color:#e2e8f0; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">🔑 Llaves de Perfil (Temporada 1)</h4>
                  
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px; background:#131722; padding:6px; border-radius:8px; border:1px solid #92400e;">
                      <canvas id="keyCopperIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#f59e0b; font-size:11px; font-weight:700;">Cobre</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountCopper" style="color:#fff;">${this.data.keys.copper}</b></div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; background:#131722; padding:6px; border-radius:8px; border:1px solid #475569;">
                      <canvas id="keySilverIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#cbd5e1; font-size:11px; font-weight:700;">Plata</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountSilver" style="color:#fff;">${this.data.keys.silver}</b></div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; background:#131722; padding:6px; border-radius:8px; border:1px solid #ca8a04;">
                      <canvas id="keyGoldIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#fbbf24; font-size:11px; font-weight:700;">Oro</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountGold" style="color:#fff;">${this.data.keys.gold}</b></div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px; background:#131722; padding:6px; border-radius:8px; border:1px solid #7c3aed;">
                      <canvas id="keyObsidianIco" width="22" height="24"></canvas>
                      <div>
                        <div style="color:#c084fc; font-size:11px; font-weight:700;">Obsidiana</div>
                        <div style="color:#94a3b8; font-size:10px;">x<b id="kCountObsidian" style="color:#fff;">${this.data.keys.obsidian}</b></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Controles -->
                <div style="background:#1b2131; border:1px solid #2b3348; border-radius:10px; padding:10px; font-size:11px; color:#cbd5e1; line-height:1.5;">
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
                <div style="font-size:11px; color:#94a3b8; line-height:1.35;">
                  Equipa los objetos conseguidos en la mazmorra para aumentar tus estadísticas de combate.
                </div>

                <!-- Ranuras Equipadas -->
                <div style="background:#1b2131; border:1px solid #2b3348; border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:8px;">
                  <h4 style="margin:0; color:#e2e8f0; font-size:11px; text-transform:uppercase;">🛡️ Equipo Activo</h4>
                  
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#131722; padding:8px; border-radius:8px; border:1px solid #38bdf8;">
                    <div>
                      <div style="font-size:10px; color:#38bdf8; font-weight:800;">ARMA MELEE</div>
                      <div style="font-size:12px; font-weight:700; color:#fff;" id="dEqWeaponName">${this.inventory.equippedWeapon?.name || 'Espada de Hierro'}</div>
                    </div>
                    <span style="font-size:11px; color:#4ade80; font-weight:800;" id="dEqWeaponStat">+${this.inventory.equippedWeapon?.bonusDmg || 0} Daño</span>
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; background:#131722; padding:8px; border-radius:8px; border:1px solid #c084fc;">
                    <div>
                      <div style="font-size:10px; color:#c084fc; font-weight:800;">BALLESTA</div>
                      <div style="font-size:12px; font-weight:700; color:#fff;" id="dEqBowName">${this.inventory.equippedBow?.name || 'Ballesta de Caza'}</div>
                    </div>
                    <span style="font-size:11px; color:#4ade80; font-weight:800;" id="dEqBowStat">+${this.inventory.equippedBow?.bonusDmg || 0} Daño</span>
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; background:#131722; padding:8px; border-radius:8px; border:1px solid #fbbf24;">
                    <div>
                      <div style="font-size:10px; color:#fbbf24; font-weight:800;">ARMADURA</div>
                      <div style="font-size:12px; font-weight:700; color:#fff;" id="dEqArmorName">${this.inventory.equippedArmor?.name || 'Túnica de Explorador'}</div>
                    </div>
                    <span style="font-size:11px; color:#4ade80; font-weight:800;" id="dEqArmorStat">+${this.inventory.equippedArmor?.bonusHp || 0} Salud</span>
                  </div>
                </div>

                <!-- Mochila de Objetos -->
                <div style="background:#1b2131; border:1px solid #2b3348; border-radius:10px; padding:10px; flex:1;">
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
        card.style.cssText = `display:flex; justify-content:space-between; align-items:center; background:#131722; padding:6px 10px; border-radius:8px; border:1px solid ${isEquipped ? '#10b981' : '#2b3348'}; margin-bottom:4px;`;
        card.innerHTML = `
          <div style="min-width:0; flex:1; padding-right:8px;">
            <div style="font-size:11px; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
            <div style="font-size:9.5px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.desc || ''}</div>
          </div>
          <button style="flex-shrink:0; background:${isEquipped ? '#059669' : '#2563eb'}; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:10px; font-weight:700; cursor:${isEquipped ? 'default' : 'pointer'};">
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
        tabDungeon.style.background = '#131722';
        tabDungeon.style.color = '#fbbf24';
        tabDungeon.style.borderBottom = '2px solid #fbbf24';
        tabInv.style.background = '#1b2131';
        tabInv.style.color = '#94a3b8';
        tabInv.style.borderBottom = '2px solid transparent';
        panelDungeon.style.display = 'flex';
        panelInv.style.display = 'none';
      };

      tabInv.onclick = () => {
        this.activeTab = 'inventory';
        tabInv.style.background = '#131722';
        tabInv.style.color = '#38bdf8';
        tabInv.style.borderBottom = '2px solid #38bdf8';
        tabDungeon.style.background = '#1b2131';
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
        tabDungeon.style.background = '#131722';
        tabDungeon.style.color = '#fbbf24';
        tabDungeon.style.borderBottom = '2px solid #fbbf24';
        if (tabInv) {
          tabInv.style.background = '#1b2131';
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
      // Fuegos artificiales de celebración (burbujas y chispas cartoon)
      const colors = ['#fbbf24', '#38bdf8', '#c084fc', '#34d399', '#f472b6'];
      for (let i = 0; i < 32; i++) {
        this.particles.push({
          x: 384 + (Math.random() - 0.5) * 100,
          y: 240 + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 180,
          vy: (Math.random() - 0.5) * 180,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 52, maxLife: 52, size: 4.5 + Math.random() * 2.5
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
      AudioFX.allyJoin();
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

            for (let i = 0; i < 5; i++) {
              this.particles.push({
                x: en.x, y: en.y,
                vx: Math.cos(ang + (Math.random() - 0.5)) * 95,
                vy: Math.sin(ang + (Math.random() - 0.5)) * 95,
                color: i % 2 === 0 ? '#7dd3fc' : '#fef08a',
                life: 16, maxLife: 16, size: 3.5 + Math.random() * 1.5
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
        this.spawnFloatingText(this.player.x, this.player.y, '💫 CAÍDO EN LA MINA', '#fb7185', 16);
      }

      this.updateUi();
    }

    handleEnemyDeath(en) {
      const coinDrop = en.type === 'golem_boss' ? 150 : (en.type === 'skeleton_archer' ? 5 : 2);
      this.data.coins += coinDrop;
      this.spawnFloatingText(en.x, en.y - 16, `+${coinDrop} 🪙`, '#fde047', 12);
      AudioFX.hitEnemy();

      const puffColors = en.type === 'golem_boss'
        ? ['#c084fc', '#fbbf24', '#e9d5ff', '#f97316']
        : ['#fde68a', '#f59e0b', '#cbd5e1', '#a78bfa'];
      const puffCount = en.type === 'golem_boss' ? 20 : 10;
      for (let i = 0; i < puffCount; i++) {
        this.particles.push({
          x: en.x, y: en.y,
          vx: (Math.random() - 0.5) * 95, vy: (Math.random() - 0.5) * 95,
          color: puffColors[i % puffColors.length],
          life: 24, maxLife: 24, size: 4 + Math.random() * 3
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

    // --- RENDERIZADO CARTOON 2D SUAVE ESTILO CLUB PENGUIN ---
    render(now) {
      const ctx = this.ctx;
      ctx.save();

      // Screen Shake
      if (this.shakeIntensity > 0.1) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        ctx.translate(sx, sy);
      }

      ctx.fillStyle = '#262c3d';
      ctx.fillRect(0, 0, this.width, this.height);

      const curMap = this.currentMap || FLOOR_MAPS[1];

      // 1. SUELO DE ADOQUINES CARTOON + PILARES + CRISTALES
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = curMap[r][c];
          const tx = c * TILE_SZ;
          const ty = r * TILE_SZ;

          if (tile === 0 || tile === 4 || tile === 5) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#464e68' : '#4e5773';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);

            // Bisel interior suave redondeado
            roundedRectPath(ctx, tx + 2.5, ty + 2.5, TILE_SZ - 5, TILE_SZ - 5, 5);
            ctx.strokeStyle = '#596382';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            if (tile === 4) {
              // Pilar de piedra redondeado con contorno #1e2433
              ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
              ctx.beginPath();
              ctx.ellipse(tx + 16, ty + 25, 12, 5, 0, 0, Math.PI * 2);
              ctx.fill();

              roundedRectPath(ctx, tx + 4, ty + 7, TILE_SZ - 8, TILE_SZ - 9, 7);
              ctx.fillStyle = '#525c7a';
              ctx.fill();
              ctx.strokeStyle = '#1e2433';
              ctx.lineWidth = 2;
              ctx.stroke();

              roundedRectPath(ctx, tx + 6, ty + 3, TILE_SZ - 12, TILE_SZ - 14, 6);
              ctx.fillStyle = '#727ea1';
              ctx.fill();
              ctx.stroke();

              // Brillo superior cartoon
              ctx.fillStyle = '#9aa7c7';
              ctx.beginPath();
              ctx.ellipse(tx + 13, ty + 8, 4.5, 2.2, -0.25, 0, Math.PI * 2);
              ctx.fill();
            } else if (tile === 5) {
              // Cristales pastel cielo/lila con contorno #1e2433
              ctx.fillStyle = 'rgba(167, 139, 250, 0.22)';
              ctx.beginPath();
              ctx.arc(tx + 16, ty + 16, 15, 0, Math.PI * 2);
              ctx.fill();

              // Base de piedra
              ctx.fillStyle = '#475569';
              ctx.strokeStyle = '#1e2433';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.ellipse(tx + 16, ty + 23, 10, 4.5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Cristal izquierdo cielo pastel
              ctx.beginPath();
              ctx.moveTo(tx + 8, ty + 21);
              ctx.lineTo(tx + 7, ty + 12);
              ctx.lineTo(tx + 11, ty + 9);
              ctx.lineTo(tx + 14, ty + 21);
              ctx.closePath();
              ctx.fillStyle = '#7dd3fc';
              ctx.fill();
              ctx.stroke();

              // Cristal derecho lavanda pastel
              ctx.beginPath();
              ctx.moveTo(tx + 18, ty + 21);
              ctx.lineTo(tx + 21, ty + 10);
              ctx.lineTo(tx + 25, ty + 13);
              ctx.lineTo(tx + 24, ty + 21);
              ctx.closePath();
              ctx.fillStyle = '#d8b4fe';
              ctx.fill();
              ctx.stroke();

              // Cristal central lila brillante
              ctx.beginPath();
              ctx.moveTo(tx + 12, ty + 22);
              ctx.lineTo(tx + 13, ty + 8);
              ctx.lineTo(tx + 16, ty + 4);
              ctx.lineTo(tx + 20, ty + 9);
              ctx.lineTo(tx + 20, ty + 22);
              ctx.closePath();
              ctx.fillStyle = '#c4b5fd';
              ctx.fill();
              ctx.stroke();

              // Destello blanco cartoon
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(tx + 15.5, ty + 10, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 2. RÍO DE LAVA SUAVE & PUENTES CONTRASTADOS
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const tile = curMap[r][c];
          const tx = c * TILE_SZ;
          const ty = r * TILE_SZ;

          if (tile === 2) {
            ctx.fillStyle = '#e8743b';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);

            // Ondas suaves de lava sin estrobo
            const wave = Math.sin(now * 0.0018 + c * 0.6 + r * 0.5);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(tx + 16 + wave * 3, ty + 15, 11, 7, 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Burbujas cómics cremosas que suben suavemente
            const bPhase = (now * 0.0011 + c * 0.37 + r * 0.53) % 1;
            const bRad = 1.6 + Math.sin(bPhase * Math.PI) * 2.4;
            const bx = tx + 10 + ((c * 13 + r * 7) % 13);
            const by = ty + 23 - bPhase * 12;
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(bx, by, bRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Orilla oscura alrededor del río de lava
            ctx.fillStyle = '#1e2433';
            if ((curMap[r - 1]?.[c] ?? 1) !== 2) ctx.fillRect(tx, ty, TILE_SZ, 2.5);
            if ((curMap[r + 1]?.[c] ?? 1) !== 2) ctx.fillRect(tx, ty + TILE_SZ - 2.5, TILE_SZ, 2.5);
            if ((curMap[r]?.[c - 1] ?? 1) !== 2) ctx.fillRect(tx, ty, 2.5, TILE_SZ);
            if ((curMap[r]?.[c + 1] ?? 1) !== 2) ctx.fillRect(tx + TILE_SZ - 2.5, ty, 2.5, TILE_SZ);
          } else if (tile === 3) {
            // Puentes cálidos de madera/piedra claramente visibles sobre la lava
            ctx.fillStyle = '#a67c46';
            ctx.fillRect(tx, ty, TILE_SZ, TILE_SZ);

            for (let p = 0; p < 3; p++) {
              const py = ty + 2 + p * 9.5;
              roundedRectPath(ctx, tx + 1.5, py, TILE_SZ - 3, 8, 2.5);
              ctx.fillStyle = p % 2 === 0 ? '#c8a26d' : '#d6b380';
              ctx.fill();
              ctx.strokeStyle = '#1e2433';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Clavos de tablón
              ctx.fillStyle = '#78532a';
              ctx.beginPath();
              ctx.arc(tx + 5, py + 4, 1.2, 0, Math.PI * 2);
              ctx.arc(tx + TILE_SZ - 5, py + 4, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }

            const topOpen = (curMap[r - 1]?.[c] ?? 0) !== 3;
            const botOpen = (curMap[r + 1]?.[c] ?? 0) !== 3;
            const leftOpen = (curMap[r]?.[c - 1] ?? 0) !== 3;
            const rightOpen = (curMap[r]?.[c + 1] ?? 0) !== 3;

            // Barandas superiores/inferiores
            ctx.strokeStyle = '#1e2433';
            ctx.lineWidth = 1.8;
            if (topOpen) {
              roundedRectPath(ctx, tx, ty, TILE_SZ, 4.5, 2);
              ctx.fillStyle = '#a67c46';
              ctx.fill();
              ctx.stroke();
            }
            if (botOpen) {
              roundedRectPath(ctx, tx, ty + TILE_SZ - 4.5, TILE_SZ, 4.5, 2);
              ctx.fillStyle = '#a67c46';
              ctx.fill();
              ctx.stroke();
            }

            // Postes en las esquinas exteriores del puente
            const corners = [];
            if (topOpen && leftOpen) corners.push([tx + 3.5, ty + 3.5]);
            if (topOpen && rightOpen) corners.push([tx + TILE_SZ - 3.5, ty + 3.5]);
            if (botOpen && leftOpen) corners.push([tx + 3.5, ty + TILE_SZ - 3.5]);
            if (botOpen && rightOpen) corners.push([tx + TILE_SZ - 3.5, ty + TILE_SZ - 3.5]);
            corners.forEach(([px, py]) => {
              ctx.beginPath();
              ctx.arc(px, py, 4, 0, Math.PI * 2);
              ctx.fillStyle = '#deb982';
              ctx.fill();
              ctx.strokeStyle = '#1e2433';
              ctx.lineWidth = 1.8;
              ctx.stroke();
            });
          }
        }
      }

      // 3. MUROS 3D CARTOON CON TAPAS REDONDEADAS Y LADRILLOS LIMPIOS
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (curMap[r][c] === 1) {
            const tx = c * TILE_SZ;
            const ty = r * TILE_SZ;

            // Sombra suave proyectada hacia abajo si el bloque inferior es transitable
            if ((curMap[r + 1]?.[c] ?? 1) !== 1) {
              ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
              ctx.fillRect(tx, ty + TILE_SZ, TILE_SZ, 5);
            }

            // Fachada frontal del muro
            ctx.fillStyle = '#343b52';
            ctx.fillRect(tx, ty + 12, TILE_SZ, 20);

            // Ladrillos limpios con juntas suaves
            ctx.fillStyle = '#3e4661';
            roundedRectPath(ctx, tx + 2, ty + 15, 13, 6.5, 2);
            ctx.fill();
            roundedRectPath(ctx, tx + 17, ty + 15, 13, 6.5, 2);
            ctx.fill();
            roundedRectPath(ctx, tx + 2, ty + 23.5, 14, 6.5, 2);
            ctx.fill();
            roundedRectPath(ctx, tx + 18, ty + 23.5, 12, 6.5, 2);
            ctx.fill();

            ctx.strokeStyle = '#1e2433';
            ctx.lineWidth = 1.4;
            ctx.strokeRect(tx + 0.5, ty + 13, TILE_SZ - 1, 18.5);

            // Tapa superior redondeada cartoon
            roundedRectPath(ctx, tx + 0.5, ty + 0.5, TILE_SZ - 1, 14, 4);
            ctx.fillStyle = '#667091';
            ctx.fill();
            ctx.strokeStyle = '#1e2433';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Brillo sutil superior
            ctx.fillStyle = '#7c87ab';
            ctx.fillRect(tx + 4, ty + 2.5, TILE_SZ - 8, 2.5);
          }
        }
      }

      // 4. ANTORCHAS ACOGEDORAS DE PARED
      this.torches.forEach(tc => {
        const flk = Math.sin(now * 0.008 + tc.x) * 1.3;
        const glow = ctx.createRadialGradient(tc.x, tc.y - 6, 4, tc.x, tc.y - 6, 44);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.26)');
        glow.addColorStop(0.55, 'rgba(249, 115, 22, 0.10)');
        glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tc.x, tc.y - 6, 44, 0, Math.PI * 2);
        ctx.fill();

        // Soporte redondeado de hierro
        roundedRectPath(ctx, tc.x - 3.5, tc.y - 3, 7, 11, 3);
        ctx.fillStyle = '#475569';
        ctx.fill();
        ctx.strokeStyle = '#1e2433';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Flama en gota cartoon
        ctx.beginPath();
        ctx.moveTo(tc.x - 4.5, tc.y - 4);
        ctx.quadraticCurveTo(tc.x - 5, tc.y - 11, tc.x + flk * 0.4, tc.y - 15 - Math.abs(flk));
        ctx.quadraticCurveTo(tc.x + 5, tc.y - 11, tc.x + 4.5, tc.y - 4);
        ctx.closePath();
        ctx.fillStyle = '#f97316';
        ctx.fill();
        ctx.strokeStyle = '#1e2433';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tc.x + flk * 0.2, tc.y - 7, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
      });

      // 5. PORTAL DE DESCENSO A LA SIGUIENTE PLANTA (🌀 Cartoon Pastel)
      if (this.portal && this.portal.active) {
        const pulse = Math.sin(now * 0.004) * 2;
        ctx.save();
        ctx.translate(this.portal.x, this.portal.y);

        // Sombra suave
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 24, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Aura exterior pastel
        ctx.fillStyle = 'rgba(167, 139, 250, 0.28)';
        ctx.beginPath();
        ctx.arc(0, 0, 29 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Anillos concéntricos pastel con contorno #1e2433
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e2433';

        ctx.beginPath();
        ctx.arc(0, 0, 23, 0, Math.PI * 2);
        ctx.fillStyle = '#818cf8';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
        ctx.fillStyle = '#c4b5fd';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
        ctx.fillStyle = '#bae6fd';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 5.5 + pulse * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Destellos giratorios en órbita
        const pRot = (now * 0.0025) % (Math.PI * 2);
        for (let i = 0; i < 5; i++) {
          const ang = pRot + (i * Math.PI * 2) / 5;
          const sx = Math.cos(ang) * 19;
          const sy = Math.sin(ang) * 19;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#e0f2fe';
          ctx.fill();
          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();

        // Etiqueta flotante limpia sobre el portal
        const portalTxt = this.floor < this.maxFloors ? `🌀 Portal Nivel ${this.floor + 1}` : '🏆 Salida Triunfal';
        ctx.save();
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        const pTxtW = ctx.measureText(portalTxt).width;
        roundedRectPath(ctx, this.portal.x - pTxtW / 2 - 8, this.portal.y - 44, pTxtW + 16, 17, 8);
        ctx.fillStyle = 'rgba(19, 23, 34, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(portalTxt, this.portal.x, this.portal.y - 32);
        ctx.restore();
      }

      // 6. BOTÍN EN EL SUELO (Armas y armaduras cartoon con contorno #1e2433)
      this.droppedLoot.forEach(item => {
        const bobY = Math.sin(item.bob || 0) * 3.5;
        const pulse = 1 + Math.sin((item.bob || 0) * 2) * 0.12;
        ctx.save();
        ctx.translate(item.x, item.y + bobY);

        // Sombra suave en el suelo
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 12 - bobY, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Resplandor pastel suave
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.beginPath();
        ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#1e2433';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        if (item.data.type === 'weapon') {
          // Espada cartoon redondeada
          roundedRectPath(ctx, -2.5, -11, 5, 15, 2.5);
          ctx.fillStyle = '#e2e8f0';
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-1, -8, 2, 10);

          roundedRectPath(ctx, -6, 2, 12, 3.5, 1.5);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.stroke();

          roundedRectPath(ctx, -2, 5.5, 4, 4.5, 1.5);
          ctx.fillStyle = '#92400e';
          ctx.fill();
          ctx.stroke();
        } else if (item.data.type === 'bow') {
          // Arco/Ballesta cartoon
          ctx.beginPath();
          ctx.arc(-1, 0, 8.5, -Math.PI * 0.55, Math.PI * 0.55);
          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 4.8;
          ctx.stroke();
          ctx.strokeStyle = '#c8a26d';
          ctx.lineWidth = 2.4;
          ctx.stroke();

          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(0, 8);
          ctx.stroke();

          roundedRectPath(ctx, -7, -2, 13, 4, 2);
          ctx.fillStyle = '#a78bfa';
          ctx.fill();
          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else {
          // Armadura / Escudo cartoon
          roundedRectPath(ctx, -7.5, -7.5, 15, 15, 5);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#bae6fd';
          ctx.beginPath();
          ctx.arc(-2, -2, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Badge legible redondeado
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        const txtW = ctx.measureText(item.data.name).width;
        roundedRectPath(ctx, -txtW / 2 - 6, -26, txtW + 12, 15, 7);
        ctx.fillStyle = 'rgba(19, 23, 34, 0.92)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#e0f2fe';
        ctx.textAlign = 'center';
        ctx.fillText(item.data.name, 0, -15);
        ctx.restore();
      });

      // 7. LLAVES EN EL SUELO (Para la Bóveda de perfil)
      this.droppedKeys.forEach(k => {
        const bobY = Math.sin(k.bob) * 3;
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
        ctx.beginPath();
        ctx.ellipse(k.x, k.y + 12, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        KEY_TIERS[k.tier].draw(ctx, k.x, k.y + bobY, 18);

        const tierInfo = KEY_TIERS[k.tier];
        if (tierInfo) {
          ctx.save();
          ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
          const kW = ctx.measureText(tierInfo.name).width;
          roundedRectPath(ctx, k.x - kW / 2 - 5, k.y + bobY - 25, kW + 10, 14, 7);
          ctx.fillStyle = 'rgba(19, 23, 34, 0.9)';
          ctx.fill();
          ctx.strokeStyle = tierInfo.color;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(tierInfo.name, k.x, k.y + bobY - 14.5);
          ctx.restore();
        }
      });

      // 8. ENEMIGOS (Sprites Cartoon 2D Amigables, IARC Everyone)
      this.enemies.forEach(en => {
        ctx.save();
        ctx.translate(en.x, en.y);

        // Sombra suave en el suelo
        ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
        ctx.beginPath();
        ctx.ellipse(0, en.radius * 0.78, en.radius * 0.95, en.radius * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        const anim = Math.sin(en.animTimer * 6);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (en.type === 'zombie_miner') {
          // Minero Cavernícola Cartoon (Casco amarillo + Pico limpio plata/cobre)
          const pAngle = Math.atan2(this.player.y - en.y, this.player.x - en.x);
          ctx.save();
          ctx.rotate(pAngle);
          const grad = ctx.createRadialGradient(8, 0, 4, 38, 0, 40);
          grad.addColorStop(0, 'rgba(254, 243, 199, 0.28)');
          grad.addColorStop(1, 'rgba(254, 243, 199, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.arc(8, 0, 40, -0.38, 0.38);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 2;

          // Brazos redondeados
          roundedRectPath(ctx, -11, -3 + anim * 1.8, 5, 10, 2.5);
          ctx.fillStyle = '#84cc16';
          ctx.fill();
          ctx.stroke();

          roundedRectPath(ctx, 6, -3 - anim * 1.8, 5, 10, 2.5);
          ctx.fillStyle = '#84cc16';
          ctx.fill();
          ctx.stroke();

          // Pico limpio de plata y cobre en la mano derecha (100% IARC)
          ctx.save();
          ctx.translate(9, -2 - anim * 1.8);
          roundedRectPath(ctx, -1.5, -6, 3, 14, 1.5);
          ctx.fillStyle = '#b45309';
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -6, 7, Math.PI * 1.15, Math.PI * 1.85);
          ctx.lineWidth = 4.5;
          ctx.strokeStyle = '#1e2433';
          ctx.stroke();
          ctx.lineWidth = 2.6;
          ctx.strokeStyle = '#cbd5e1';
          ctx.stroke();
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(0, -7, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.restore();

          // Overol azul de minero
          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 2;
          roundedRectPath(ctx, -7, -2, 14, 13, 5);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.stroke();

          // Cabeza redondeada alegre
          ctx.beginPath();
          ctx.arc(0, -9, 8.5, 0, Math.PI * 2);
          ctx.fillStyle = '#a3e635';
          ctx.fill();
          ctx.stroke();

          // Ojos cartoon expresivos
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = '#1e2433';
          [-3.2, 3.2].forEach((ex) => {
            ctx.beginPath();
            ctx.arc(ex, -8, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(ex + 0.4, -8, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = '#1e2433';
            ctx.fill();
          });

          // Casco amarillo de minero + lámpara
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -12, 8.8, Math.PI, 0);
          ctx.closePath();
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.stroke();

          roundedRectPath(ctx, -10, -13, 20, 3.2, 1.6);
          ctx.fillStyle = '#eab308';
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, -15, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
          ctx.lineWidth = 1.4;
          ctx.stroke();

        } else if (en.type === 'skeleton_archer') {
          // Arquero Esqueleto Explorador Cartoon
          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 2;

          // Capa de explorador índigo
          roundedRectPath(ctx, -7, -3, 14, 14, 5);
          ctx.fillStyle = '#4f46e5';
          ctx.fill();
          ctx.stroke();

          // Pecho de huesitos redondeado
          roundedRectPath(ctx, -4.5, -1, 9, 9, 3);
          ctx.fillStyle = '#f1f5f9';
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-3, 2, 6, 1.5);
          ctx.fillRect(-3, 5, 6, 1.5);

          // Cráneo redondeado simpático
          ctx.beginPath();
          ctx.arc(0, -9, 8.2, 0, Math.PI * 2);
          ctx.fillStyle = '#f8fafc';
          ctx.fill();
          ctx.stroke();

          // Capucha / pluma lila de arquero
          ctx.beginPath();
          ctx.arc(0, -11, 8.4, Math.PI * 1.1, -Math.PI * 0.1);
          ctx.fillStyle = '#6366f1';
          ctx.fill();
          ctx.stroke();

          // Ojos grandes expresivos
          ctx.fillStyle = '#1e2433';
          ctx.beginPath();
          ctx.arc(-3, -8, 2.4, 0, Math.PI * 2);
          ctx.arc(3, -8, 2.4, 0, Math.PI * 2);
          ctx.fill();

          const fEye = (Math.sin(now * 0.01) + 1) * 0.5;
          ctx.fillStyle = fEye > 0.4 ? '#c4b5fd' : '#7dd3fc';
          ctx.beginPath();
          ctx.arc(-2.6, -8.3, 1.1, 0, Math.PI * 2);
          ctx.arc(3.4, -8.3, 1.1, 0, Math.PI * 2);
          ctx.fill();

          // Arco curvo de madera limpio
          ctx.beginPath();
          ctx.arc(7, 0, 10, -Math.PI * 0.48, Math.PI * 0.48);
          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 4.6;
          ctx.stroke();
          ctx.strokeStyle = '#c8a26d';
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // Cuerda del arco
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(7.5, -9.5);
          ctx.lineTo(4, 0);
          ctx.lineTo(7.5, 9.5);
          ctx.stroke();

        } else if (en.type === 'golem_boss') {
          // Jefe Coloso Cartoon de Obsidiana & Cristales
          const heart = (Math.sin(now * 0.005) + 1) * 0.5;

          // Aura suave del jefe
          ctx.fillStyle = 'rgba(192, 132, 252, 0.16)';
          ctx.beginPath();
          ctx.arc(0, 0, 34, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#1e2433';
          ctx.lineWidth = 3;

          // Corona de cristales en hombros
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.moveTo(-18, -18);
          ctx.lineTo(-14, -30);
          ctx.lineTo(-7, -21);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(18, -18);
          ctx.lineTo(14, -30);
          ctx.lineTo(7, -21);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cuerpo robusto redondeado de obsidiana
          roundedRectPath(ctx, -24, -24, 48, 48, 16);
          ctx.fillStyle = '#312b4b';
          ctx.fill();
          ctx.stroke();

          // Bisel superior suave
          roundedRectPath(ctx, -19, -20, 38, 16, 10);
          ctx.fillStyle = '#453e68';
          ctx.fill();

          // Runa cristalina brillante en el pecho
          ctx.fillStyle = heart > 0.45 ? '#fbbf24' : '#c084fc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 5, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.arc(-2, 3, 3.2, 0, Math.PI * 2);
          ctx.fill();

          // Puños flotantes redondeados de roca
          const fistBob = Math.sin(now * 0.007) * 4;
          [-1, 1].forEach(side => {
            const fx = side < 0 ? -38 : 24;
            const fy = -7 + (side < 0 ? fistBob : -fistBob);
            roundedRectPath(ctx, fx, fy, 14, 18, 6);
            ctx.fillStyle = '#3b3559';
            ctx.lineWidth = 2.5;
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(fx + 7, fy + 9, 3.6, 0, Math.PI * 2);
            ctx.fillStyle = side < 0 ? '#fbbf24' : '#c084fc';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });

          // Ojos expresivos de coloso
          ctx.fillStyle = '#fef08a';
          ctx.lineWidth = 2;
          roundedRectPath(ctx, -14, -14, 10, 6.5, 3);
          ctx.fill();
          ctx.stroke();
          roundedRectPath(ctx, 4, -14, 10, 6.5, 3);
          ctx.fill();
          ctx.stroke();

          // Pupilas cartoon
          ctx.fillStyle = '#1e2433';
          ctx.beginPath();
          ctx.arc(-8.5, -10.8, 1.8, 0, Math.PI * 2);
          ctx.arc(9.5, -10.8, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Barra de Salud Cartoon Redondeada con Contorno #1e2433
        const hpPct = Math.max(0, Math.min(1, en.hp / en.maxHp));
        const barW = en.type === 'golem_boss' ? 60 : 30;
        const barH = en.type === 'golem_boss' ? 7 : 5;
        const barX = en.x - barW / 2;
        const barY = en.y - en.radius - 14;

        roundedRectPath(ctx, barX - 1.5, barY - 1.5, barW + 3, barH + 3, (barH + 3) / 2);
        ctx.fillStyle = '#1e2433';
        ctx.fill();

        roundedRectPath(ctx, barX, barY, barW, barH, barH / 2);
        ctx.fillStyle = '#334155';
        ctx.fill();

        if (hpPct > 0) {
          const fillW = Math.max(barH, Math.round(barW * hpPct));
          roundedRectPath(ctx, barX, barY, fillW, barH, barH / 2);
          ctx.fillStyle = en.type === 'golem_boss' ? '#c084fc' : '#f43f5e';
          ctx.fill();
        }
      });

      // 9. BOTS ALIADOS (Guardianes Cartoon Redondeados)
      this.teammates.forEach(tm => {
        ctx.save();
        ctx.translate(tm.x, tm.y);

        // Sombra suave
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 7, 11, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(tm.angle || 0);
        ctx.strokeStyle = '#1e2433';
        ctx.lineWidth = 2;

        // Mochila/capa esmeralda
        roundedRectPath(ctx, -11, -7, 7, 14, 3.5);
        ctx.fillStyle = '#059669';
        ctx.fill();
        ctx.stroke();

        // Cuerpo redondeado
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
        ctx.stroke();

        // Visor amigable
        roundedRectPath(ctx, 1, -5, 6.5, 10, 3);
        ctx.fillStyle = '#ecfdf5';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e2433';
        ctx.beginPath();
        ctx.arc(4.5, -2.2, 1.3, 0, Math.PI * 2);
        ctx.arc(4.5, 2.2, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Nombre legible en cápsula
        ctx.save();
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        const nmW = ctx.measureText(tm.name).width;
        roundedRectPath(ctx, tm.x - nmW / 2 - 5, tm.y - 26, nmW + 10, 13, 6);
        ctx.fillStyle = 'rgba(19, 23, 34, 0.85)';
        ctx.fill();
        ctx.fillStyle = '#6ee7b7';
        ctx.textAlign = 'center';
        ctx.fillText(tm.name, tm.x, tm.y - 16);
        ctx.restore();
      });

      // 10. EL JUGADOR (Héroe Cartoon Redondeado con Capa, Ojos y Armadura Dinámica)
      if (this.player.invulnTimer > 0 && Math.floor(now / 80) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      const eqArmorId = this.inventory.equippedArmor?.id || 'leather_armor';
      const eqWeaponId = this.inventory.equippedWeapon?.id || 'iron_sword';
      const armorBonusHp = this.inventory.equippedArmor?.bonusHp || 0;

      let capeColor = '#334155';
      let armorPrimary = '#38bdf8';
      let pauldronColor = '#f59e0b';
      let auraColor = 'rgba(56, 189, 248, 0.25)';

      if (eqArmorId === 'armor_magma_mesh') {
        capeColor = '#b91c1c';
        armorPrimary = '#f97316';
        pauldronColor = '#fbbf24';
        auraColor = 'rgba(251, 146, 60, 0.28)';
      } else if (eqArmorId === 'armor_colossus' || eqArmorId === 'armor_obsidian') {
        capeColor = '#5b21b6';
        armorPrimary = '#a855f7';
        pauldronColor = '#e9d5ff';
        auraColor = 'rgba(192, 132, 252, 0.30)';
      } else if (eqArmorId === 'tunic_adventurer') {
        capeColor = '#047857';
        armorPrimary = '#10b981';
        pauldronColor = '#fbbf24';
        auraColor = 'rgba(52, 211, 153, 0.28)';
      }

      // Aura/anillo de escudo si lleva armadura de salud mejorada
      if (armorBonusHp >= 20) {
        const ringPulse = 17.5 + Math.sin(now * 0.005) * 1.2;
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(0, 0, ringPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = armorPrimary;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Sombra suave en el suelo
      ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
      ctx.beginPath();
      ctx.ellipse(0, 6, 13, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(this.player.angle);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e2433';
      ctx.lineWidth = 2;

      // Capa ondeante matching armadura
      const capeWave = Math.sin(this.player.walkCycle || 0) * 1.6;
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.quadraticCurveTo(-15, -7 + capeWave, -14, capeWave * 0.5);
      ctx.quadraticCurveTo(-15, 7 + capeWave, -4, 8);
      ctx.closePath();
      ctx.fillStyle = capeColor;
      ctx.fill();
      ctx.stroke();

      // Arma dinámica en mano derecha
      ctx.save();
      if (this.player.isAttacking) {
        ctx.rotate(0.55);
      }
      if (eqWeaponId === 'sword_fire_core' || eqWeaponId === 'sword_fire') {
        // Espada Flamígera redondeada
        roundedRectPath(ctx, 5, 3, 17, 4.5, 2.2);
        ctx.fillStyle = '#fb923c';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(8, 4.3, 11, 2);
        roundedRectPath(ctx, 4, 1.5, 3.2, 7.5, 1.5);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.stroke();
      } else if (eqWeaponId === 'dagger_copper') {
        // Daga de cobre brillante
        roundedRectPath(ctx, 6, 3.5, 11, 3.5, 1.8);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(8, 4.5, 7, 1.4);
      } else {
        // Espada de hierro brillante
        roundedRectPath(ctx, 5, 3.5, 15, 4, 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(8, 4.8, 10, 1.5);
        roundedRectPath(ctx, 4, 1.5, 3, 8, 1.5);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // Torso & Hombreras redondeadas
      ctx.strokeStyle = '#1e2433';
      ctx.lineWidth = 2;
      roundedRectPath(ctx, -8, -10, 16, 20, 8);
      ctx.fillStyle = armorPrimary;
      ctx.fill();
      ctx.stroke();

      // Hombreras cartoon
      [-9, 9].forEach((py) => {
        ctx.beginPath();
        ctx.arc(-1, py, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = pauldronColor;
        ctx.fill();
        ctx.stroke();
      });

      // Capucha/Casco redondeado alegre
      ctx.beginPath();
      ctx.arc(1, 0, 8.2, 0, Math.PI * 2);
      ctx.fillStyle = '#475569';
      ctx.fill();
      ctx.stroke();

      // Visera cálida y ojos expresivos
      ctx.beginPath();
      ctx.ellipse(4.2, 0, 4.2, 5.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fde68a';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ojos cartoon blancos con pupilas
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4.8, -2.3, 2, 0, Math.PI * 2);
      ctx.arc(4.8, 2.3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e2433';
      ctx.beginPath();
      ctx.arc(5.4, -2.3, 1.1, 0, Math.PI * 2);
      ctx.arc(5.4, 2.3, 1.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1.0;

      // Animación suave de tajo melee (blanco + cian/ámbar)
      if (this.player.isAttacking) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.attackAngle);
        ctx.lineCap = 'round';

        const isWarmBlade = eqWeaponId.includes('fire') || eqWeaponId.includes('copper');
        ctx.strokeStyle = isWarmBlade ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 48, -Math.PI * 0.42, Math.PI * 0.42);
        ctx.stroke();

        ctx.strokeStyle = isWarmBlade ? '#f59e0b' : '#38bdf8';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(0, 0, 48, -Math.PI * 0.40, Math.PI * 0.40);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 48, -Math.PI * 0.33, Math.PI * 0.33);
        ctx.stroke();

        ctx.restore();
      }

      // 11. PROYECTILES CARTOON CON CONTORNO
      this.projectiles.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#1e2433';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.radius || 3) + 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - p.vx * 0.01, p.y - p.vy * 0.01, (p.radius || 3) * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 12. PARTÍCULAS CIRCULARES SUAVES (Puffs y chispas cartoon)
      this.particles.forEach(pt => {
        const pct = Math.max(0, pt.life / pt.maxLife);
        const rad = Math.max(1.4, (pt.size || 4) * (0.45 + 0.55 * pct));
        ctx.save();
        ctx.globalAlpha = pct;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e2433';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      });

      // 13. TEXTOS FLOTANTES CON BORDE SUAVE
      this.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.font = `800 ${ft.size || 13}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e2433';
        ctx.lineWidth = 3.2;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // 14. PANTALLA DE GAMEOVER
      if (this.gameState === 'gameover') {
        ctx.fillStyle = 'rgba(19, 23, 34, 0.86)';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#fb7185';
        ctx.font = '900 24px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💫 HAS CAÍDO EN LAS MINAS', this.width / 2, this.height / 2 - 20);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '13px system-ui, -apple-system, sans-serif';
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
