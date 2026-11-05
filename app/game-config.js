/**
 * EpicKast v1.9.1 — Fuente Única de Verdad y Servicio de Economía (`window.EKGameConfig`, `window.EconomyService`)
 * Compatible con navegador (Electron renderer) y Node.js (`tools/gen-doc.js`).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exported = factory();
    root.EKGameConfig = exported.EKGameConfig;
    root.EconomyService = exported.EconomyService;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const APP_VERSION = '1.9.2';

  const RARITY_TOKENS = {
    common: {
      id: 'common',
      label: 'COMÚN',
      name: 'Común',
      color: '#94a3b8',
      border: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      glow: 'none',
      dustDuplicate: 5,
      dustCraft: 40
    },
    rare: {
      id: 'rare',
      label: 'RARO',
      name: 'Raro',
      color: '#3b82f6',
      border: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.14)',
      glow: '0 0 10px rgba(59,130,246,.45)',
      dustDuplicate: 15,
      dustCraft: 120
    },
    epic: {
      id: 'epic',
      label: 'ÉPICO',
      name: 'Épico',
      color: '#a855f7',
      border: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.16)',
      glow: '0 0 14px rgba(168,85,247,.55)',
      dustDuplicate: 40,
      dustCraft: 300
    },
    legendary: {
      id: 'legendary',
      label: 'LEGENDARIO',
      name: 'Legendario',
      color: '#fbbf24',
      border: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.18)',
      glow: '0 0 18px rgba(251,191,36,.6)',
      dustDuplicate: 100,
      dustCraft: 800
    }
  };

  const ELEMENT_TOKENS = {
    fire: {
      id: 'fire',
      name: 'FUEGO',
      color: '#ef4444',
      bg: '#450a0a',
      border: '#ef4444',
      light: '#fca5a5',
      beats: 'snow'
    },
    water: {
      id: 'water',
      name: 'AGUA',
      color: '#2563eb',
      bg: '#172554',
      border: '#2563eb',
      light: '#93c5fd',
      beats: 'fire'
    },
    snow: {
      id: 'snow',
      name: 'NIEVE',
      color: '#7dd3fc',
      bg: '#083344',
      border: '#7dd3fc',
      light: '#e0f2fe',
      beats: 'water'
    }
  };

  const PITY_RULES = {
    epicGuaranteeThreshold: 10,
    legendarySoftPityStart: 35,
    legendarySoftPityIncrement: 0.015,
    legendaryHardPityThreshold: 60,
    copperCountsForPity: true
  };

  const KEY_PRICES = {
    copper: 250,
    silver: 1000,
    gold: 4000,
    obsidian: 15000
  };
  const KEY_PACK_DISCOUNT = 0.90;

  const CHESTS = {
    copper: {
      id: 'copper',
      name: 'Cofre de Cobre',
      shortName: 'Cobre',
      keyName: 'Llave de Cobre',
      color: '#fb923c',
      palette: { base: '#c2410c', light: '#fb923c', dark: '#7c2d12', outline: '#1c1008' },
      coinCost: 150,
      shopKeyCost: KEY_PRICES.copper,
      dailyLimit: 3,
      odds: { common: 0.80, rare: 0.17, epic: 0.03, legendary: 0.00 }
    },
    silver: {
      id: 'silver',
      name: 'Cofre de Plata',
      shortName: 'Plata',
      keyName: 'Llave de Plata',
      color: '#e2e8f0',
      palette: { base: '#cbd5e1', light: '#f8fafc', dark: '#64748b', outline: '#0f172a' },
      coinCost: 500,
      shopKeyCost: KEY_PRICES.silver,
      dailyLimit: 1,
      odds: { common: 0.55, rare: 0.33, epic: 0.11, legendary: 0.01 }
    },
    gold: {
      id: 'gold',
      name: 'Cofre de Oro',
      shortName: 'Oro',
      keyName: 'Llave de Oro',
      color: '#fde047',
      palette: { base: '#eab308', light: '#fef08a', dark: '#a16207', outline: '#1f1605' },
      coinCost: null,
      shopKeyCost: KEY_PRICES.gold,
      dailyLimit: 0,
      odds: { common: 0.25, rare: 0.45, epic: 0.25, legendary: 0.05 }
    },
    obsidian: {
      id: 'obsidian',
      name: 'Cofre de Obsidiana',
      shortName: 'Obsidiana',
      keyName: 'Llave de Obsidiana',
      color: '#c4b5fd',
      palette: { base: '#7c3aed', light: '#c4b5fd', dark: '#2e1065', outline: '#0e0520', glow: true },
      coinCost: null,
      shopKeyCost: KEY_PRICES.obsidian,
      dailyLimit: 0,
      odds: { common: 0.00, rare: 0.40, epic: 0.45, legendary: 0.15 }
    }
  };

  // CATÁLOGO UNIFICADO DE COSMÉTICOS (Lore unificado a "Coloso")
  const COSMETICS = [
    // --- LEGENDARIOS (6) ---
    { id: 'founder_frame', name: '★ Marco de Avatar FUNDADOR ★', type: 'frame', val: 'founder_blue', rarity: 'legendary', desc: 'Marco Azul Neón con insignia «FUNDADOR» para llamadas, chat y perfil (Prestigio Edición 1).' },
    { id: 'frame_colossus_legend', name: 'Marco: Núcleo del Coloso', type: 'frame', val: 'frame-colossus-legend', rarity: 'legendary', desc: 'Doble halo dorado y cian con rotación continua forjado en el corazón del Coloso.' },
    { id: 'banner_golem_animated', name: 'Banner: Despertar del Coloso', type: 'banner', val: 'linear-gradient(135deg, #18181b, #701a75, #b91c1c, #450a0a)', animated: true, rarity: 'legendary', desc: 'Estandarte legendario animado del Coloso de obsidiana despertando.' },
    { id: 'title_colossus_slayer', name: 'Título: Coloso Caído', type: 'title', val: 'Coloso Caído', badgeIcon: '👑', rarity: 'legendary', desc: 'Título resplandeciente reservado para quienes derriban al Coloso.' },
    { id: 'plate_colossus', name: 'Placa: Fragua del Coloso', type: 'plate', val: 'plate_colossus', cssClass: 'plate-colossus', animated: true, previewBg: 'linear-gradient(90deg, rgba(251,191,36,0.42), rgba(239,68,68,0.32), rgba(120,53,15,0.25))', rarity: 'legendary', desc: 'Placa de nombre legendaria del Set del Coloso con brasas incandescentes.' },
    { id: 'fx_void', name: 'Efecto: Vórtice Abisal', type: 'fx', val: 'fx_void', fxKind: 'void', particleColor: '#fbbf24', rarity: 'legendary', desc: 'Partículas gravitatorias doradas y violetas del vacío sobre tu tarjeta de perfil.' },

    // --- ÉPICOS (7) ---
    { id: 'frame_runic', name: 'Marco: Partículas Rúnicas', type: 'frame', val: 'frame-runic', rarity: 'epic', desc: 'Marco pulsante con chispas mágicas alrededor de tu avatar.' },
    { id: 'color_aurora', name: 'Color: Aurora Boreal', type: 'color', val: 'linear-gradient(90deg, #38bdf8, #a855f7)', rarity: 'epic', desc: 'Gradiente animado estilo aurora boreal para tu nombre.' },
    { id: 'color_volcanic_flame', name: 'Color: Fuego Volcánico', type: 'color', val: 'linear-gradient(90deg, #fb7185, #fbbf24)', rarity: 'epic', desc: 'Gradiente ardiente en movimiento continuo.' },
    { id: 'banner_fluid_lava', name: 'Banner: Lava Fluida', type: 'banner', val: 'linear-gradient(135deg, #7f1d1d, #ea580c, #f59e0b, #991b1b)', animated: true, rarity: 'epic', desc: 'Banner animado con ondulación fluida de lava fundida.' },
    { id: 'banner_rune_storm', name: 'Banner: Tormenta Rúnica', type: 'banner', val: 'linear-gradient(135deg, #1e1b4b, #6366f1, #a855f7, #312e81)', animated: true, rarity: 'epic', desc: 'Estandarte cósmico animado con rayos de energía púrpura.' },
    { id: 'plate_runic_storm', name: 'Placa: Tormenta Rúnica', type: 'plate', val: 'plate_runic_storm', cssClass: 'plate-runic-storm', animated: true, previewBg: 'linear-gradient(90deg, rgba(168,85,247,0.42), rgba(59,130,246,0.28), rgba(236,72,153,0.22))', rarity: 'epic', desc: 'Placa arcana con brillo animado recorriendo tu fila de miembro.' },
    { id: 'fx_embers', name: 'Efecto: Brasas del Núcleo', type: 'fx', val: 'fx_embers', fxKind: 'embers', particleColor: '#fb923c', rarity: 'epic', desc: 'Chispas ascendentes de fuego elemental sobre tu tarjeta de perfil.' },

    // --- RAROS (9) ---
    { id: 'frame_copper', name: 'Marco: Cobre Forjado', type: 'frame', val: 'frame-copper', rarity: 'rare', desc: 'Bisel de cobre bruñido para tu avatar.' },
    { id: 'frame_silver', name: 'Marco: Plata Rúnica', type: 'frame', val: 'frame-silver', rarity: 'rare', desc: 'Bisel plateado brillante con runas grabadas.' },
    { id: 'frame_amethyst', name: 'Marco: Geoda Amatista', type: 'frame', val: 'frame-amethyst', rarity: 'rare', desc: 'Cristales de amatista facetados que rodean tu avatar.' },
    { id: 'title_explorer', name: 'Título: Explorador del Núcleo', type: 'title', val: 'Explorador del Núcleo', badgeIcon: '🧭', rarity: 'rare', desc: 'Distintivo para quienes descienden a las profundidades.' },
    { id: 'title_smith', name: 'Título: Herrero de Magma', type: 'title', val: 'Herrero de Magma', badgeIcon: '⚒️', rarity: 'rare', desc: 'Insignia rúnica de maestro forjador de reliquias.' },
    { id: 'title_shadow', name: 'Título: Cazador de Sombras', type: 'title', val: 'Cazador de Sombras', badgeIcon: '🗡️', rarity: 'rare', desc: 'Otorgado a quienes purgan las galerías oscuras.' },
    { id: 'title_pioneer', name: 'Título: Pionero', type: 'title', val: 'Pionero', badgeIcon: '🛡️', rarity: 'rare', desc: 'Título honorable para los primeros aventureros.' },
    { id: 'plate_glacier', name: 'Placa: Ventisca Glaciar', type: 'plate', val: 'plate_glacier', cssClass: 'plate-glacier', previewBg: 'linear-gradient(90deg, rgba(59,130,246,0.34), rgba(125,211,252,0.12))', rarity: 'rare', desc: 'Placa cristalina con destellos helados detrás de tu nombre.' },
    { id: 'fx_snow', name: 'Efecto: Cristales de Escarcha', type: 'fx', val: 'fx_snow', fxKind: 'snow', particleColor: '#7dd3fc', rarity: 'rare', desc: 'Capa de copos y cristales helados flotando sobre tu tarjeta de perfil.' },

    // --- COMUNES (11) ---
    { id: 'color_amber', name: 'Color: Ámbar Volcánico', type: 'color', val: '#f59e0b', rarity: 'common', desc: 'Tinte ígneo de magma ardiente para tu nombre y perfil.' },
    { id: 'color_amethyst', name: 'Color: Púrpura Amatista', type: 'color', val: '#c084fc', rarity: 'common', desc: 'Resplandor amatista para tu nombre en la lista de miembros.' },
    { id: 'color_emerald', name: 'Color: Verde Esmeralda', type: 'color', val: '#34d399', rarity: 'common', desc: 'Tinte resplandeciente esmeralda del Núcleo.' },
    { id: 'color_cyan', name: 'Color: Cian Neón', type: 'color', val: '#38bdf8', rarity: 'common', desc: 'Destello ciberpunk cian brillante para tu nombre.' },
    { id: 'color_crimson', name: 'Color: Rojo Magma', type: 'color', val: '#fb7185', rarity: 'common', desc: 'Tono carmesí ardiente de roca fundida.' },
    { id: 'banner_mines', name: 'Banner: Minas de Magma', type: 'banner', val: 'linear-gradient(135deg, #451a03, #b45309, #78350f)', rarity: 'common', desc: 'Estandarte de magma y basalto para tu tarjeta de perfil.' },
    { id: 'banner_amethyst', name: 'Banner: Galerías de Amatista', type: 'banner', val: 'linear-gradient(135deg, #2e1065, #7e22ce, #3b0764)', rarity: 'common', desc: 'Estandarte de geodas púrpuras brillantes para tu tarjeta de perfil.' },
    { id: 'banner_crypt', name: 'Banner: Cripta Ancestral', type: 'banner', val: 'linear-gradient(135deg, #09090b, #1e293b, #334155)', rarity: 'common', desc: 'Muros de piedra antigua y niebla espectral.' },
    { id: 'banner_bridges', name: 'Banner: Puentes de Lava', type: 'banner', val: 'linear-gradient(135deg, #1c1917, #ea580c, #7f1d1d)', rarity: 'common', desc: 'Puentes de piedra sobre el abismo volcánico.' },
    { id: 'banner_sanctum', name: 'Banner: Sagrario del Núcleo', type: 'banner', val: 'linear-gradient(135deg, #09090b, #581c87, #dc2626)', rarity: 'common', desc: 'Santuario central de obsidiana del Núcleo.' },
    { id: 'plate_copper_forge', name: 'Placa: Forja de Cobre', type: 'plate', val: 'plate_copper_forge', cssClass: 'plate-copper-forge', previewBg: 'linear-gradient(90deg, rgba(194,65,12,0.32), rgba(124,45,18,0.08))', rarity: 'common', desc: 'Franja metálica de cobre templado detrás de tu nombre en miembros y mensajes directos.' }
  ];

  const SETS = [
    {
      id: 'colossus_set',
      name: 'Set del Coloso',
      items: ['frame_colossus_legend', 'banner_golem_animated', 'title_colossus_slayer', 'plate_colossus'],
      rewardBadge: 'Conquistador del Coloso',
      rewardIcon: '👑',
      desc: 'Completa las 4 reliquias del Coloso (Marco Núcleo del Coloso + Banner Despertar del Coloso + Título Coloso Caído + Placa Fragua del Coloso) para desbloquear la insignia «Conquistador del Coloso» y el destello dorado permanente en tu marco.'
    }
  ];

  // --- DOJO ELEMENTAL: PISOS Y GUARDIANES ---
  const DOJO_FLOORS = [
    {
      level: 1,
      name: 'Novicio Ignis',
      belt: 'Cinturón Blanco',
      element: 'fire',
      spriteKey: 'guardian_ignis',
      color: '#ef4444',
      aiSkill: 0.20,
      desc: 'Aprendiz de la llama eterna que prueba el temple de todo iniciado.',
      quotes: {
        start: '¡Bienvenido al Dojo! Veamos si soportas el calor del primer piso.',
        winRound: '¡Ja! El fuego consume a los indecisos.',
        loseRound: '¡Auch! Buen golpe, tienes reflejos.',
        winMatch: '¡Has dominado mi fuego! Mereces avanzar al segundo piso.',
        loseMatch: 'Te falta entrenamiento. ¡Observa el triángulo elemental!'
      },
      reward: { coins: 60, key: 'copper', keyCount: 1, keyLabel: '1 Llave Cobre' },
      ninjaConfig: { suitColor: '#dc2626', belt: 'white', maskColor: '#7f1d1d', weapon: 'staff', aura: 'fire' }
    },
    {
      level: 2,
      name: 'Centinela Escarcha',
      belt: 'Cinturón Azul',
      element: 'snow',
      spriteKey: 'guardian_frost',
      color: '#7dd3fc',
      aiSkill: 0.45,
      desc: 'Vigilante de los picos helados; su mente es fría como el glaciar.',
      quotes: {
        start: 'Tu impetuosidad se congelará ante mi defensa glaciar.',
        winRound: 'Congelado antes de tocar el tatami.',
        loseRound: 'Hmph... rompiste mi guardia de hielo.',
        winMatch: 'Impresionante. Tu espíritu arde más fuerte que la ventisca.',
        loseMatch: 'La paciencia congela la prisa. Inténtalo de nuevo.'
      },
      reward: { coins: 100, key: 'copper', keyCount: 1, keyLabel: '1 Llave Cobre' },
      ninjaConfig: { suitColor: '#0284c7', belt: 'blue', maskColor: '#0c4a6e', weapon: 'shuriken', aura: 'snow' }
    },
    {
      level: 3,
      name: 'Maestro Torrente',
      belt: 'Cinturón Rojo',
      element: 'water',
      spriteKey: 'guardian_torrent',
      color: '#2563eb',
      aiSkill: 0.68,
      desc: 'Señor de las mareas abisales que anticipa cada carta de tu mano.',
      quotes: {
        start: 'El agua se adapta a cualquier vasija. ¿Podrás predecir mi corriente?',
        winRound: '¡La marea arrasa con tu estrategia!',
        loseRound: '¡Buena lectura! Viste a través de la niebla.',
        winMatch: 'Reconozco tu maestría táctica. El cuarto piso te aguarda.',
        loseMatch: 'Intentaste golpear el océano con los ojos cerrados.'
      },
      reward: { coins: 150, key: 'silver', keyCount: 1, keyLabel: '1 Llave Plata' },
      ninjaConfig: { suitColor: '#1d4ed8', belt: 'red', maskColor: '#1e1b4b', weapon: 'katana', aura: 'water' }
    },
    {
      level: 4,
      name: 'Coloso de Basalto',
      belt: 'Cinturón Negro',
      element: 'fire',
      spriteKey: 'guardian_colossus',
      color: '#f97316',
      aiSkill: 0.84,
      desc: 'Titán viviente forjado en magma; solo los cinturones negros pasan.',
      quotes: {
        start: 'Soy el muro inquebrantable antes del Gran Sensei. ¡En guardia!',
        winRound: '¡La roca fundida aplasta tus esperanzas!',
        loseRound: '¡Una grieta en mi armadura! Bien jugado.',
        winMatch: 'Has superado al Coloso. El Sensei del Núcleo te espera en la cima.',
        loseMatch: 'Tu técnica aún se quiebra ante la presión del Núcleo.'
      },
      reward: { coins: 220, key: 'gold', keyCount: 1, keyLabel: '1 Llave Oro' },
      ninjaConfig: { suitColor: '#475569', belt: 'black', maskColor: '#0f172a', weapon: 'kunai', aura: 'fire' }
    },
    {
      level: 5,
      name: 'Sensei del Núcleo',
      belt: 'Cinturón Dorado Supremo',
      element: 'legendary',
      spriteKey: 'guardian_sensei',
      color: '#fbbf24',
      aiSkill: 0.94,
      desc: 'Gran Maestro de los tres elementos y custodio de la Obsidiana.',
      quotes: {
        start: 'Fuego, Agua y Nieve son uno en mis manos. Demuestra tu leyenda.',
        winRound: 'El equilibrio elemental aún se inclina a mi favor.',
        loseRound: '¡Sublime! Pocos discípulos logran anticipar ese movimiento.',
        winMatch: '¡Reverencia! Eres un verdadero Gran Maestro del Dojo Elemental.',
        loseMatch: 'Un duelo honorable. Medita tu estrategia y vuelve a desafiarme.'
      },
      reward: { coins: 500, key: 'obsidian', keyCount: 1, keyLabel: '1 Llave Obsidiana' },
      ninjaConfig: { suitColor: '#581c87', belt: 'gold', maskColor: '#fbbf24', weapon: 'scroll', aura: 'snow' }
    }
  ];

  const TRAINING_REWARD_RULES = {
    coinMultiplier: 0.5,
    copperKeyChance: 0.25
  };

  // --- CINTURONES Y PERSONALIZACIÓN NINJA ---
  const BELTS = [
    { id: 'white', name: 'Cinturón Blanco', color: '#f8fafc', shadow: '#cbd5e1', reqFloor: 0 },
    { id: 'yellow', name: 'Cinturón Amarillo', color: '#facc15', shadow: '#ca8a04', reqFloor: 0 },
    { id: 'blue', name: 'Cinturón Azul', color: '#3b82f6', shadow: '#1d4ed8', reqFloor: 2 },
    { id: 'red', name: 'Cinturón Rojo', color: '#ef4444', shadow: '#b91c1c', reqFloor: 3 },
    { id: 'black', name: 'Cinturón Negro', color: '#1e293b', shadow: '#090d16', reqFloor: 4 },
    { id: 'gold', name: 'Cinturón Dorado', color: '#fbbf24', shadow: '#b45309', reqFloor: 5 }
  ];

  const NINJA_SUITS = [
    { id: '#1e293b', name: 'Sombra Nocturna', shadow: '#0f172a', light: '#334155' },
    { id: '#dc2626', name: 'Carmesí Ígneo', shadow: '#991b1b', light: '#ef4444' },
    { id: '#2563eb', name: 'Zafiro Abisal', shadow: '#1e40af', light: '#3b82f6' },
    { id: '#0891b2', name: 'Cian Glaciar', shadow: '#155e75', light: '#22d3ee' },
    { id: '#16a34a', name: 'Jade del Bosque', shadow: '#166534', light: '#22c55e' },
    { id: '#7c3aed', name: 'Amatista Arcana', shadow: '#5b21b6', light: '#a855f7' },
    { id: '#ea580c', name: 'Magma del Coloso', shadow: '#9a3412', light: '#fb923c' },
    { id: '#e2e8f0', name: 'Loto Blanco', shadow: '#94a3b8', light: '#ffffff' }
  ];

  const NINJA_MASKS = [
    { id: '#0f172a', name: 'Obsidiana' },
    { id: '#991b1b', name: 'Escarlata' },
    { id: '#1e3a8a', name: 'Cobalto' },
    { id: '#581c87', name: 'Vacío' },
    { id: '#fbbf24', name: 'Oro Imperial' },
    { id: '#38bdf8', name: 'Hielo Puro' }
  ];

  const NINJA_WEAPONS = [
    { id: 'none', name: 'Sin Arma', spriteKey: 'weapon_none' },
    { id: 'katana', name: 'Katana Rúnica', spriteKey: 'weapon_katana' },
    { id: 'staff', name: 'Bastón Bo', spriteKey: 'weapon_staff' },
    { id: 'shuriken', name: 'Shuriken Estelar', spriteKey: 'weapon_shuriken' },
    { id: 'kunai', name: 'Kunai Doble', spriteKey: 'weapon_kunai' },
    { id: 'scroll', name: 'Pergamino Ancestral', spriteKey: 'weapon_scroll' }
  ];

  const NINJA_AURAS = [
    { id: 'none', name: 'Sin Aura', element: null, color: 'transparent' },
    { id: 'fire', name: 'Llamas Ígneas', element: 'fire', color: '#ef4444' },
    { id: 'water', name: 'Burbujas Abisales', element: 'water', color: '#3b82f6' },
    { id: 'snow', name: 'Cristales de Escarcha', element: 'snow', color: '#7dd3fc' }
  ];

  // --- TURBO CORE: CIRCUITOS, TALLER Y COLORES DE CHASIS ---
  const RACER_TRACKS = [
    {
      id: 'neon_highway',
      level: 1,
      tier: 'Circuito 1 · Nivel Fácil',
      name: 'Autopista Ciber-Neón',
      laps: 2,
      lapLength: 1800,
      aiSpeed: 135,
      difficulty: 'Fácil',
      length: 3600,
      accent: '#38bdf8',
      skyTop: '#070b19',
      skyBot: '#1e1b4b',
      roadDark: '#111827',
      roadLight: '#1f2937',
      rumbleA: '#38bdf8',
      rumbleB: '#0f172a',
      groundA: '#090d1a',
      groundB: '#0f172a',
      curveIntensity: 0.7,
      theme: { sky: '#070b19', accent: '#38bdf8', border: '#2563eb', road: '#0b101c', grid: '#1e293b' },
      firstReward: { coins: 75, keys: { copper: 1 } },
      repeatReward: { coins: 35 },
      reward: { coins: 75, key: 'copper', keyCount: 1, keyLabel: '1 Llave Cobre' },
      desc: 'Rectas veloces bajo los rascacielos holográficos del sector exterior.'
    },
    {
      id: 'magma_canyon',
      level: 2,
      tier: 'Circuito 2 · Nivel Medio',
      name: 'Desfiladero de Magma',
      laps: 2,
      lapLength: 2100,
      aiSpeed: 150,
      difficulty: 'Media',
      length: 4200,
      accent: '#f97316',
      skyTop: '#180606',
      skyBot: '#451a03',
      roadDark: '#1c1917',
      roadLight: '#292524',
      rumbleA: '#f97316',
      rumbleB: '#fef08a',
      groundA: '#1c0a05',
      groundB: '#2a1008',
      curveIntensity: 1.0,
      theme: { sky: '#180606', accent: '#f97316', border: '#ea580c', road: '#180a06', grid: '#431407' },
      firstReward: { coins: 120, keys: { silver: 1 } },
      repeatReward: { coins: 55 },
      reward: { coins: 120, key: 'silver', keyCount: 1, keyLabel: '1 Llave Plata' },
      desc: 'Curvas cerradas entre ríos de roca fundida y puentes de basalto.'
    },
    {
      id: 'glacier_summit',
      level: 3,
      tier: 'Circuito 3 · Nivel Difícil',
      name: 'Cumbre Glaciar Cero',
      laps: 3,
      lapLength: 2200,
      aiSpeed: 165,
      difficulty: 'Difícil',
      length: 4800,
      accent: '#7dd3fc',
      skyTop: '#04131d',
      skyBot: '#0c4a6e',
      roadDark: '#0f172a',
      roadLight: '#1e293b',
      rumbleA: '#7dd3fc',
      rumbleB: '#e0f2fe',
      groundA: '#082032',
      groundB: '#0c2d48',
      curveIntensity: 1.25,
      theme: { sky: '#04131d', accent: '#7dd3fc', border: '#0284c7', road: '#091524', grid: '#0c4a6e' },
      firstReward: { coins: 180, keys: { gold: 1 } },
      repeatReward: { coins: 80 },
      reward: { coins: 180, key: 'gold', keyCount: 1, keyLabel: '1 Llave Oro' },
      desc: 'Asfalto congelado a gran altitud con chicanes técnicas de alta velocidad.'
    },
    {
      id: 'obsidian_core',
      level: 4,
      tier: 'Circuito 4 · Nivel Experto',
      name: 'Santuario del Coloso',
      laps: 3,
      lapLength: 2500,
      aiSpeed: 180,
      difficulty: 'Experto',
      length: 5400,
      accent: '#a855f7',
      skyTop: '#090314',
      skyBot: '#3b0764',
      roadDark: '#130d21',
      roadLight: '#1f1635',
      rumbleA: '#a855f7',
      rumbleB: '#fbbf24',
      groundA: '#0d061a',
      groundB: '#170b2c',
      curveIntensity: 1.5,
      theme: { sky: '#090314', accent: '#a855f7', border: '#9333ea', road: '#12071f', grid: '#3b0764' },
      firstReward: { coins: 300, keys: { obsidian: 1 } },
      repeatReward: { coins: 140 },
      reward: { coins: 300, key: 'obsidian', keyCount: 1, keyLabel: '1 Llave Obsidiana' },
      desc: 'El circuito definitivo alrededor del reactor dimensional del Coloso.'
    }
  ];

  const WORKSHOP_UPGRADES = {
    engine: {
      id: 'engine',
      name: 'Motor Iónico',
      maxLevel: 5,
      costs: [0, 120, 280, 550, 1000],
      baseCost: 120,
      desc: 'Aumenta la velocidad punta y aceleración en todos los circuitos.',
      sprite: 'workshop_engine',
      spriteKey: 'workshop_engine'
    },
    turbo: {
      id: 'turbo',
      name: 'Inyector Nitro',
      maxLevel: 5,
      costs: [0, 120, 280, 550, 1000],
      baseCost: 120,
      desc: 'Incrementa la potencia del propulsor (Espacio) y su recarga.',
      sprite: 'workshop_turbo',
      spriteKey: 'workshop_turbo'
    },
    shield: {
      id: 'shield',
      name: 'Escudo Magnético',
      maxLevel: 5,
      costs: [0, 120, 280, 550, 1000],
      baseCost: 120,
      desc: 'Reduce la pérdida de velocidad al chocar y atrae monedas cercanas.',
      sprite: 'workshop_shield',
      spriteKey: 'workshop_shield'
    },
    tires: {
      id: 'tires',
      name: 'Neumáticos Grip',
      maxLevel: 5,
      costs: [0, 120, 280, 550, 1000],
      baseCost: 120,
      desc: 'Mejor agarre lateral al tomar curvas cerradas.',
      sprite: 'workshop_tires',
      spriteKey: 'workshop_tires'
    }
  };

  const CHASSIS_COLORS = [
    { id: 'cyan', name: 'Cian Hiperión', primary: '#06b6d4', glow: '#22d3ee', cost: 0 },
    { id: 'crimson', name: 'Carmesí Ignis', primary: '#dc2626', glow: '#f87171', cost: 150 },
    { id: 'emerald', name: 'Esmeralda Nexo', primary: '#059669', glow: '#34d399', cost: 150 },
    { id: 'gold', name: 'Oro Soberano', primary: '#d97706', glow: '#fbbf24', cost: 300 },
    { id: 'amethyst', name: 'Amatista Vacío', primary: '#7c3aed', glow: '#c084fc', cost: 300 }
  ];

  const DAILY_LIMITS = {
    dailyKeyCap: 20,
    copperExchangeMax: 3,
    silverExchangeMax: 1
  };

  const claimedGrantIds = new Set();

  function getVaultState() {
    if (typeof localStorage === 'undefined') {
      return {
        coins: 250,
        dust: 0,
        keys: { copper: 1, silver: 0, gold: 0, obsidian: 0 },
        pity: { withoutEpic: 0, withoutLegendary: 0 },
        cosmetics: {},
        seenCosmetics: {},
        dailyKeys: { date: '', count: 0 },
        dailyExchange: { date: '', copper: 0, silver: 0 },
        claimedFloors: {},
        claimedRacerTracks: {}
      };
    }
    let v = {};
    try {
      v = JSON.parse(localStorage.getItem('epickast.dungeon.v1') || '{}');
    } catch {}
    if (typeof v.coins !== 'number' || Number.isNaN(v.coins)) v.coins = 250;
    if (typeof v.dust !== 'number' || Number.isNaN(v.dust)) v.dust = 0;
    if (!v.keys || typeof v.keys !== 'object') v.keys = { copper: 1, silver: 0, gold: 0, obsidian: 0 };
    for (const k of ['copper', 'silver', 'gold', 'obsidian']) {
      if (typeof v.keys[k] !== 'number' || Number.isNaN(v.keys[k])) v.keys[k] = 0;
    }
    if (!v.pity || typeof v.pity !== 'object') v.pity = { withoutEpic: 0, withoutLegendary: 0 };
    if (typeof v.pity.withoutEpic !== 'number') v.pity.withoutEpic = 0;
    if (typeof v.pity.withoutLegendary !== 'number') v.pity.withoutLegendary = 0;
    if (!v.cosmetics || typeof v.cosmetics !== 'object') v.cosmetics = {};
    if (!v.seenCosmetics || typeof v.seenCosmetics !== 'object') v.seenCosmetics = {};
    const today = new Date().toISOString().slice(0, 10);
    if (!v.dailyKeys || v.dailyKeys.date !== today) {
      v.dailyKeys = { date: today, count: 0 };
    }
    if (!v.dailyExchange || v.dailyExchange.date !== today) {
      v.dailyExchange = { date: today, copper: 0, silver: 0 };
    }
    if (!v.claimedFloors || typeof v.claimedFloors !== 'object') v.claimedFloors = {};
    if (!v.claimedRacerTracks || typeof v.claimedRacerTracks !== 'object') v.claimedRacerTracks = {};
    return v;
  }

  function saveVaultState(v) {
    if (typeof localStorage === 'undefined') return v;
    localStorage.setItem('epickast.dungeon.v1', JSON.stringify(v));
    if (typeof window !== 'undefined' && typeof window.epicRpc === 'function') {
      try {
        const unlockedList = Object.keys(v.cosmetics || {}).filter((k) => v.cosmetics[k]);
        if (v.founderFrameUnlocked && !unlockedList.includes('founder_frame')) unlockedList.push('founder_frame');
        let ninjaCfg = {};
        try { ninjaCfg = JSON.parse(localStorage.getItem('epickast.ninja.v1') || '{}'); } catch {}
        window.epicRpc('vault.sync', {
          coins: v.coins,
          dust: v.dust,
          keys: v.keys,
          pity: v.pity,
          unlockedCosmetics: unlockedList,
          ninjaConfig: ninjaCfg
        }).catch(() => {});
      } catch {}
    }
    return v;
  }

  const EconomyService = {
    getVault: getVaultState,
    saveVault: saveVaultState,
    grant(source, payload = {}) {
      if (payload.grantId) {
        if (claimedGrantIds.has(payload.grantId)) {
          return { ok: false, reason: 'duplicate_grant', vault: getVaultState() };
        }
        claimedGrantIds.add(payload.grantId);
      }
      const v = getVaultState();
      const coinsDelta = Math.trunc(Number(payload.coinsDelta) || 0);
      const dustDelta = Math.trunc(Number(payload.dustDelta) || 0);

      if (coinsDelta < 0 && v.coins + coinsDelta < 0) {
        return { ok: false, reason: 'insufficient_coins', vault: v };
      }
      if (dustDelta < 0 && v.dust + dustDelta < 0) {
        return { ok: false, reason: 'insufficient_dust', vault: v };
      }

      v.coins = Math.max(0, v.coins + coinsDelta);
      v.dust = Math.max(0, v.dust + dustDelta);

      const keysGranted = { copper: 0, silver: 0, gold: 0, obsidian: 0 };
      if (payload.keysDelta && typeof payload.keysDelta === 'object') {
        for (const k of ['copper', 'silver', 'gold', 'obsidian']) {
          const delta = Math.trunc(Number(payload.keysDelta[k]) || 0);
          if (delta > 0) {
            if (!payload.bypassDailyKeyCap && v.dailyKeys.count + delta > DAILY_LIMITS.dailyKeyCap) {
              const allowed = Math.max(0, DAILY_LIMITS.dailyKeyCap - v.dailyKeys.count);
              if (allowed > 0) {
                v.keys[k] = (v.keys[k] || 0) + allowed;
                v.dailyKeys.count += allowed;
                keysGranted[k] = allowed;
              }
            } else {
              v.keys[k] = (v.keys[k] || 0) + delta;
              if (!payload.bypassDailyKeyCap) v.dailyKeys.count += delta;
              keysGranted[k] = delta;
            }
          } else if (delta < 0) {
            v.keys[k] = Math.max(0, (v.keys[k] || 0) + delta);
            keysGranted[k] = delta;
          }
        }
      }

      saveVaultState(v);
      return { ok: true, source, coinsGranted: coinsDelta, dustGranted: dustDelta, keysGranted, vault: v };
    }
  };

  const DUST_DUPLICATE = {
    common: RARITY_TOKENS.common.dustDuplicate,
    rare: RARITY_TOKENS.rare.dustDuplicate,
    epic: RARITY_TOKENS.epic.dustDuplicate,
    legendary: RARITY_TOKENS.legendary.dustDuplicate
  };
  const DUST_CRAFT = {
    common: RARITY_TOKENS.common.dustCraft,
    rare: RARITY_TOKENS.rare.dustCraft,
    epic: RARITY_TOKENS.epic.dustCraft,
    legendary: RARITY_TOKENS.legendary.dustCraft
  };

  const EKGameConfig = {
    APP_VERSION,
    RARITY_TOKENS,
    ELEMENT_TOKENS,
    PITY_RULES,
    KEY_PRICES,
    KEY_PACK_DISCOUNT,
    DUST_DUPLICATE,
    DUST_CRAFT,
    CHESTS,
    COSMETICS,
    SETS,
    DOJO_FLOORS,
    TRAINING_REWARD_RULES,
    BELTS,
    NINJA_SUITS,
    NINJA_MASKS,
    NINJA_WEAPONS,
    NINJA_AURAS,
    RACER_TRACKS,
    WORKSHOP_UPGRADES,
    CHASSIS_COLORS,
    DAILY_LIMITS,
    getCounts() {
      const byType = {};
      const byRarity = {};
      for (const c of COSMETICS) {
        byType[c.type] = (byType[c.type] || 0) + 1;
        byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1;
      }
      return {
        totalCosmetics: COSMETICS.length,
        byType,
        byRarity,
        dojoFloors: DOJO_FLOORS.length,
        racerTracks: RACER_TRACKS.length,
        sets: SETS.length
      };
    }
  };

  return { EKGameConfig, EconomyService };
});
