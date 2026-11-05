/**
 * EpicKast v1.9.1 — Motor de Sprites Pixel Art (`window.EKSprites`)
 * Renderiza matrices 16×16 / 32×32 como `<svg shape-rendering="crispEdges">` sin recursos externos.
 */
(function () {
  'use strict';

  // Silueta unificada de llave 16×16 (k = contorno oscuro, b = base, l = luz, d = sombra, g = gema central)
  const KEY_MAP_16 = [
    '....kkkkkk......',
    '...kllllllk.....',
    '..klbbbbbbbk....',
    '..klbggggbbk....',
    '..klbgllgbbk....',
    '..klbggggbbk....',
    '..kdbbbbbddk....',
    '...kddddddk.....',
    '....kkkkkk......',
    '......klbk......',
    '......klbk......',
    '......klbkkkk...',
    '......klbllbk...',
    '......klbkkkk...',
    '......klbllk....',
    '......kkkkkk....'
  ];

  const SPRITES = {
    // --- 5 PESTAÑAS DE LA BÓVEDA ---
    tab_chest: {
      map: [
        '................',
        '..kkkkkkkkkkkk..',
        '.kllllllllllllk.',
        '.klbbbbbbbbbbbk.',
        '.klbbbbggbbbbbk.',
        '.kdddddggdddddk.',
        '.kkkkkkggkkkkkk.',
        '.klbbbbggbbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kddddddddddddk.',
        '.kddddddddddddk.',
        '..kkkkkkkkkkkk..',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#d97706', l: '#fbbf24', d: '#92400e', g: '#fef08a' }
    },
    tab_armory: {
      map: [
        '....kkkkkkkk....',
        '...kllllllllk...',
        '..klbbbbbbbbbk..',
        '..klbbkkkkbbbk..',
        '..klbk....kbbk..',
        '..kdbk....kddk..',
        '...kkk....kkk...',
        '..kkkkkkkkkkkk..',
        '.kllllllllllllk.',
        '.klbbbbggbbbbbk.',
        '.klbbbggggbbbbk.',
        '.klbbbbggbbbbbk.',
        '.kddddddddddddk.',
        '..kkkkkkkkkkkk..',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#8b5cf6', l: '#c4b5fd', d: '#5b21b6', g: '#fbbf24' }
    },
    tab_dojo: {
      map: [
        '......kkkk......',
        '.....kllllk.....',
        '....klbbbbk.....',
        '...klbbbbk..kk..',
        '..klbbbbk..kllk.',
        '..kdbbbk..klbbk.',
        '...kbbk..klbbk..',
        '....kk..klbbk...',
        '...kggk.kbbk....',
        '..kggggkkbk.....',
        '..kggkggkk......',
        '...kk.kggk......',
        '.....kggkggk....',
        '....kggk.kggk...',
        '....kkk...kkk...',
        '................'
      ],
      palette: { k: '#0f172a', b: '#e2e8f0', l: '#ffffff', d: '#94a3b8', g: '#ef4444' }
    },
    tab_racer: {
      map: [
        '................',
        '................',
        '....kkkkkkkk....',
        '...kllllllllk...',
        '..klbbbbggggbk..',
        '.klbbbbggggggbk.',
        'klbbbbbbbbbbbbbk',
        'kldddddddddddddk',
        'kkkkwwwkkkkwwwkk',
        '.k..www....www..',
        '....kkk....kkk..',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#3b82f6', l: '#93c5fd', d: '#1d4ed8', g: '#38bdf8', w: '#f8fafc' }
    },
    tab_ninja: {
      map: [
        '....kkkkkkkk....',
        '...kllllllllk...',
        '..klbbbbbbbbbk..',
        '..krrrrrrrrrrk..',
        '..klbwwwwwwbbk..',
        '..klbwkbbkwbbk..',
        '..klbwwwwwwbbk..',
        '..kddddddddddk..',
        '...kkkkkkkkkk...',
        '....klbbbbbk....',
        '...klbbrrbbbk...',
        '...klbbbbbbbbk..',
        '...kdddddddddk..',
        '....kkk..kkk....',
        '....kkk..kkk....',
        '................'
      ],
      palette: { k: '#090d16', b: '#334155', l: '#64748b', d: '#1e293b', r: '#ef4444', w: '#fde68a' }
    },

    // --- 4 LLAVES CON LA MISMA SILUETA UNIFICADA ---
    key_copper: {
      map: KEY_MAP_16,
      palette: { k: '#1c1008', b: '#c2410c', l: '#fb923c', d: '#7c2d12', g: '#fdba74' }
    },
    key_silver: {
      map: KEY_MAP_16,
      palette: { k: '#0f172a', b: '#cbd5e1', l: '#f8fafc', d: '#64748b', g: '#38bdf8' }
    },
    key_gold: {
      map: KEY_MAP_16,
      palette: { k: '#1f1605', b: '#eab308', l: '#fef08a', d: '#a16207', g: '#ef4444' }
    },
    key_obsidian: {
      map: KEY_MAP_16,
      palette: { k: '#0e0520', b: '#7c3aed', l: '#c4b5fd', d: '#2e1065', g: '#fbbf24' },
      glow: '0 0 8px rgba(168,85,247,0.85)'
    },

    // --- ECONOMÍA Y RECURSOS ---
    coin: {
      map: [
        '....kkkkkkkk....',
        '..kkllllllllkk..',
        '.klbbbbbbbbbbbk.',
        '.klbbbllllbbbbk.',
        'klbbblkkkkdbbbbk',
        'klbbblk..kdbbbbk',
        'klbbblk..kdbbbbk',
        'klbbblk..kdbbbbk',
        'klbbblk..kdbbbbk',
        'klbbblkkkkdbbbbk',
        '.klbbbddddbbbbk.',
        '.kdbbbbbbbbbbbk.',
        '..kkddddddddkk..',
        '....kkkkkkkk....',
        '................',
        '................'
      ],
      palette: { k: '#451a03', b: '#f59e0b', l: '#fef08a', d: '#b45309' }
    },
    essence: {
      map: [
        '.......kk.......',
        '......kllk......',
        '.....klbbbk.....',
        '....klbbbbbk....',
        '..kkllbbbbbllkk.',
        '.klllbbbbbbblllk',
        '..kkbbbbbbbbbkk.',
        '....klbbbbbbk...',
        '....kdbbbbbdk...',
        '.....kddbbdk....',
        '......kdddk.....',
        '.......kkk......',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#2e1065', b: '#a855f7', l: '#f3e8ff', d: '#6b21a8' }
    },
    pity_star: {
      map: [
        '.......kk.......',
        '......kllk......',
        '......kbbk......',
        '.....klbbbk.....',
        '.kkkkklbbbkkkkk.',
        'kllllbbbbbbllllk',
        '.kbbbbbbbbbbbbk.',
        '..kdbbbbbbbbbk..',
        '...klbbbbbbbk...',
        '..klbbkddkbbbk..',
        '..kdbk....kddk..',
        '.kddk......kddk.',
        '.kkk........kkk.',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#451a03', b: '#fbbf24', l: '#fef9c3', d: '#d97706' }
    },
    shop_cart: {
      map: [
        '.kkk............',
        '.kllk...........',
        '..kbbkkkkkkkkkk.',
        '..klbbbbbbbbbbk.',
        '...klbbbbbbbbk..',
        '...klbbbbbbbbk..',
        '....kddddddddk..',
        '....kkkkkkkkkk..',
        '....kbbk..kbbk..',
        '....kkkk..kkkk..',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#60a5fa', l: '#dbeafe', d: '#1d4ed8' }
    },

    // --- ELEMENTOS ---
    elem_fire: {
      map: [
        '.......kk.......',
        '......kllk......',
        '.....klbbbk.....',
        '....klbbbbbk....',
        '...klbbllbbbk...',
        '..klbbllllbbbk..',
        '..klbllllllbbk..',
        '.klbbllllllbbbk.',
        '.klbbbllllbbbbk.',
        '.kdbbbbbbbbbbbk.',
        '..kddddddddddk..',
        '...kkkkkkkkkk...',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#450a0a', b: '#ef4444', l: '#fde047', d: '#991b1b' }
    },
    elem_water: {
      map: [
        '.......kk.......',
        '......kllk......',
        '.....klbbbk.....',
        '....klbbbbbk....',
        '...klbbbbbbbk...',
        '..klbbllbbbbbk..',
        '..klblllbbbbbk..',
        '.klbbllbbbbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kdbbbbbbbbbbbk.',
        '..kddddddddddk..',
        '...kkkkkkkkkk...',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#172554', b: '#2563eb', l: '#93c5fd', d: '#1e3a8a' }
    },
    elem_snow: {
      map: [
        '.......kk.......',
        '..kk..kllk..kk..',
        '.kllk.kbbk.kllk.',
        '..kbbkkbbkkbbk..',
        '...kbbbbbbbbk...',
        '.kkkllllllllkkk.',
        '..kbbbbbbbbbbk..',
        '...kbbkkbbkkbk..',
        '.kllk.kbbk.kllk.',
        '..kk..kddk..kk..',
        '.......kk.......',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#083344', b: '#38bdf8', l: '#e0f2fe', d: '#0284c7' }
    },

    // --- TALLER DE TURBO CORE ---
    workshop_engine: {
      map: [
        '....kkkkkkkk....',
        '...kllllllllk...',
        '..kkkkkkkkkkkk..',
        '.klbbbbbbbbbbbk.',
        'klbbkkkkkkkkbbbk',
        'klbkllllllllkbbk',
        'klbklbbbbbbklbbk',
        'klbklbbbbbbklbbk',
        'kddkkkkkkkkkkddk',
        '.kddddddddddddk.',
        '..kkkkkkkkkkkk..',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#94a3b8', l: '#f8fafc', d: '#475569' }
    },
    workshop_turbo: {
      map: [
        '.....kkkkkk.....',
        '....kllllllk....',
        '...klbbbbbbbk...',
        '..klbbkkkkbbbk..',
        '..klbkggggkbbk..',
        '..klbkggggkbbk..',
        '..kdbbkkkkbddk..',
        '...kddddddddk...',
        '....kkkkkkkk....',
        '.....kggggk.....',
        '....kggggggk....',
        '.....kggggk.....',
        '......kkkk......',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#38bdf8', l: '#e0f2fe', d: '#0284c7', g: '#f97316' }
    },
    workshop_tires: {
      map: [
        '....kkkkkkkk....',
        '..kkddddddddkk..',
        '.kddkkkkkkkkddk.',
        '.kdkllllllllkdk.',
        'kddklbbbbbbklddk',
        'kddklbkkkkbklddk',
        'kddklbkkkkbklddk',
        'kddklbbbbbbklddk',
        '.kdkddddddddkdk.',
        '.kddkkkkkkkkddk.',
        '..kkddddddddkk..',
        '....kkkkkkkk....',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#090d16', b: '#64748b', l: '#cbd5e1', d: '#1e293b' }
    },

    // --- 5 ARMAS NINJA ---
    weapon_none: {
      map: [
        '....kkkkkkkk....',
        '..kkddddddddkk..',
        '.kddkkkkkkkkddk.',
        '.kdk........kdk.',
        'kddk...kk...kddk',
        'kddk..kddk..kddk',
        'kddk...kk...kddk',
        '.kdk........kdk.',
        '.kddkkkkkkkkddk.',
        '..kkddddddddkk..',
        '....kkkkkkkk....',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', d: '#475569' }
    },
    weapon_katana: {
      map: [
        '.............kkk',
        '............kllk',
        '...........klbbk',
        '..........klbbk.',
        '.........klbbk..',
        '........klbbk...',
        '.......klbbk....',
        '......klbbk.....',
        '.....klbbk......',
        '...kkgggk.......',
        '...kggggk.......',
        '..kddggk........',
        '.kdddkk.........',
        'kdddk...........',
        'kkkk............',
        '................'
      ],
      palette: { k: '#0f172a', b: '#cbd5e1', l: '#ffffff', d: '#dc2626', g: '#fbbf24' }
    },
    weapon_staff: {
      map: [
        '.............kkk',
        '............kgk.',
        '...........klbk.',
        '..........klbk..',
        '.........klbk...',
        '........klbk....',
        '.......klbk.....',
        '......klbk......',
        '.....klbk.......',
        '....klbk........',
        '...klbk.........',
        '..klbk..........',
        '.kgk............',
        'kkk.............',
        '................',
        '................'
      ],
      palette: { k: '#1c1008', b: '#b45309', l: '#f59e0b', d: '#78350f', g: '#fef08a' }
    },
    weapon_shuriken: {
      map: [
        '.......kk.......',
        '......kllk......',
        '.....klbbbk.....',
        '....klbbbbbk....',
        '.kkkklbkkbblkkkk',
        'kllllbkkkkbllllk',
        '.kbbbbk..kbbbbk.',
        '..kdbbk..kbbdk..',
        '.kbbbbkkkkbbbbk.',
        'kllllbkkkkbllllk',
        '.kkkkdbbbbdlkkkk',
        '....kdbbbbbk....',
        '.....kddddk.....',
        '......kkkk......',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#94a3b8', l: '#f8fafc', d: '#475569' }
    },
    weapon_kunai: {
      map: [
        '...........kkkk.',
        '..........klllk.',
        '.........klbbbk.',
        '........klbbbbk.',
        '.......klbbbbk..',
        '......klbbbbk...',
        '.....klbbbbk....',
        '....kkddddkk....',
        '....kggggggk....',
        '...kddkkkk......',
        '..kddk..........',
        '.kkkk...........',
        'kllk............',
        'kkkk............',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#94a3b8', l: '#e2e8f0', d: '#475569', g: '#ef4444' }
    },
    weapon_scroll: {
      map: [
        '..kkkkkkkkkkkk..',
        '.kggggggggggggk.',
        '.kllllllllllllk.',
        '..klbbbbbbbbbk..',
        '..klbbrrrrbbbk..',
        '..klbbbbbbbbbk..',
        '..klbbrrrrbbbk..',
        '..klbbbbbbbbbk..',
        '..kddddddddddk..',
        '.kggggggggggggk.',
        '..kkkkkkkkkkkk..',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#1c1008', b: '#fde68a', l: '#fef9c3', d: '#d97706', g: '#dc2626', r: '#7c2d12' }
    },

    // --- 5 RETRATOS PIXEL DE GUARDIANES DEL DOJO ---
    guardian_ignis: {
      map: [
        '....kkkkkkkk....',
        '..kkllllllllkk..',
        '.klbbbbbbbbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kggggggggggggk.',
        '.klbwwwwwwwwwbk.',
        '.klbwkbbbwkbbwk.',
        '.klbwwwwwwwwwbk.',
        '.kddddddddddddk.',
        '.kddddddddddddk.',
        '..klbbbbbbbbbk..',
        '.klbbbggggbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kddddddddddddk.',
        '..kkkkkkkkkkkk..',
        '................'
      ],
      palette: { k: '#1c0606', b: '#dc2626', l: '#f87171', d: '#7f1d1d', g: '#fef08a', w: '#fde68a' }
    },
    guardian_frost: {
      map: [
        '....kkkkkkkk....',
        '..kkllllllllkk..',
        '.klbbbbbbbbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kggggggggggggk.',
        '.klbwwwwwwwwwbk.',
        '.klbwkbbbwkbbwk.',
        '.klbwwwwwwwwwbk.',
        '.kddddddddddddk.',
        '.kddddddddddddk.',
        '..klbbbbbbbbbk..',
        '.klbbbggggbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kddddddddddddk.',
        '..kkkkkkkkkkkk..',
        '................'
      ],
      palette: { k: '#04131d', b: '#0284c7', l: '#7dd3fc', d: '#0c4a6e', g: '#e0f2fe', w: '#f0f9ff' }
    },
    guardian_torrent: {
      map: [
        '....kkkkkkkk....',
        '..kkllllllllkk..',
        '.klbbbbbbbbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kggggggggggggk.',
        '.klbwwwwwwwwwbk.',
        '.klbwkbbbwkbbwk.',
        '.klbwwwwwwwwwbk.',
        '.kddddddddddddk.',
        '.kddddddddddddk.',
        '..klbbbbbbbbbk..',
        '.klbbbggggbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kddddddddddddk.',
        '..kkkkkkkkkkkk..',
        '................'
      ],
      palette: { k: '#090d26', b: '#2563eb', l: '#60a5fa', d: '#1e3a8a', g: '#ef4444', w: '#dbeafe' }
    },
    guardian_colossus: {
      map: [
        '...kkkkkkkkkk...',
        '.kkllllllllllkk.',
        '.klbbbbbbbbbbbk.',
        'klbbggggggggbbbk',
        'klbggggggggggbbk',
        'klbbwwkkkkwwbbbk',
        'klbbwwwwwwwwbbbk',
        'kddbbbbbbbbbbddk',
        '.kddddddddddddk.',
        '.klbbbggggbbbbk.',
        'klbbbggggggbbbbk',
        'klbbbbggggbbbbbk',
        'kddddddddddddddk',
        '.kkkkkkkkkkkkkk.',
        '................',
        '................'
      ],
      palette: { k: '#090d16', b: '#475569', l: '#94a3b8', d: '#1e293b', g: '#f97316', w: '#fef08a' }
    },
    guardian_sensei: {
      map: [
        '.....kkkkkk.....',
        '...kkggggggkk...',
        '..kggllllllggk..',
        '.klbbbbbbbbbbbk.',
        '.kggggggggggggk.',
        '.klbwwwwwwwwwbk.',
        '.klbwkbbbwkbbwk.',
        '.klbwwwwwwwwwbk.',
        '..kwwwddddwwwk..',
        '...kwwwwwwwwk...',
        '..klbbggggbbbk..',
        '.klbbbggggbbbbk.',
        '.klbbbbbbbbbbbk.',
        '.kddddddddddddk.',
        '..kkkkkkkkkkkk..',
        '................'
      ],
      palette: { k: '#1a0633', b: '#6b21a8', l: '#a855f7', d: '#3b0764', g: '#fbbf24', w: '#f8fafc' }
    },

    // --- 9 MASCOTAS DE CARTAS DEL DOJO (3 ETAPAS POR ELEMENTO) ---
    // FUEGO Etapa 1 (2–4): Chispa Ígnea
    mascot_fire_1: {
      map: [
        '................',
        '.......kk.......',
        '......kllk......',
        '.....klbbbk.....',
        '....klbbbbbk....',
        '...klbbbbbbbk...',
        '..klbwbbbbwbk...',
        '..klbkwbbwkbk...',
        '..klbbbbbbbbk...',
        '...kddddddddk...',
        '....kkkkkkkk....',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#450a0a', b: '#ef4444', l: '#fde047', d: '#991b1b', w: '#ffffff' }
    },
    // FUEGO Etapa 2 (5–9): Salamandra Ardiente
    mascot_fire_2: {
      map: [
        '....kk....kk....',
        '...kllk..kllk...',
        '..klbbbkkbbbbk..',
        '.klbbbbbbbbbbbk.',
        '.klbbllllllbbbk.',
        '.klbwwbbbbwwbbk.',
        '.klbwkbbbbkwbbk.',
        '.klbbbbbbbbbbbk.',
        '..kdbbblllbbbdk.',
        '..klbbbbbbbbbk..',
        '.klbbbbbbbbbbbk.',
        '..kddddddddddk..',
        '...kkk....kkk...',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#450a0a', b: '#ef4444', l: '#facc15', d: '#991b1b', w: '#ffffff' }
    },
    // FUEGO Etapa 3 (10–12): Dragón de Magma
    mascot_fire_3: {
      map: [
        '.kk...kkkk...kk.',
        'kllk.kllllk.kllk',
        'klbbklbbbbklbbbk',
        '.klbbbbbbbbbbbk.',
        'klbbbllllllbbbbk',
        'klbbwwbbbbwwbbbk',
        'klbbwkllllkwbbbk',
        'klbbbbllllbbbbbk',
        '.kdbbbllllbbbdk.',
        'klbbbbllllbbbbbk',
        'kdbbbbbbbbbbbbdk',
        '.kddddddddddddk.',
        '..kkk..kk..kkk..',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#450a0a', b: '#dc2626', l: '#fde047', d: '#7f1d1d', w: '#ffffff' }
    },

    // AGUA Etapa 1 (2–4): Gota Cristalina
    mascot_water_1: {
      map: [
        '................',
        '.......kk.......',
        '......kllk......',
        '.....klbbbk.....',
        '....klbbbbbk....',
        '...klbbbbbbbk...',
        '..klbwbbbbwbk...',
        '..klbkwbbwkbk...',
        '..klbbbbbbbbk...',
        '...kddddddddk...',
        '....kkkkkkkk....',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#172554', b: '#3b82f6', l: '#bae6fd', d: '#1d4ed8', w: '#ffffff' }
    },
    // AGUA Etapa 2 (5–9): Guardián de Marea
    mascot_water_2: {
      map: [
        '......kkkk......',
        '....kkllllkk....',
        '..kkllllllllkk..',
        '.klbbbbbbbbbbbk.',
        '.klbbllllllbbbk.',
        '.klbwwbbbbwwbbk.',
        '.klbwkbbbbkwbbk.',
        '.klbbbbbbbbbbbk.',
        '..kdbbblllbbbdk.',
        '.klbbbbbbbbbbbk.',
        '..kddddddddddk..',
        '...kkkkkkkkkk...',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#172554', b: '#2563eb', l: '#7dd3fc', d: '#1e3a8a', w: '#ffffff' }
    },
    // AGUA Etapa 3 (10–12): Leviatán Abisal
    mascot_water_3: {
      map: [
        '.kk...kkkk...kk.',
        'kllk.kllllk.kllk',
        'klbbklbbbbklbbbk',
        '.klbbbbbbbbbbbk.',
        'klbbbllllllbbbbk',
        'klbbwwbbbbwwbbbk',
        'klbbwkllllkwbbbk',
        'klbbbbllllbbbbbk',
        '.kdbbbllllbbbdk.',
        'klbbbbllllbbbbbk',
        'kdbbbbbbbbbbbbdk',
        '.kddddddddddddk.',
        '..kkk..kk..kkk..',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#0f172a', b: '#1d4ed8', l: '#38bdf8', d: '#1e1b4b', w: '#fef08a' }
    },

    // NIEVE Etapa 1 (2–4): Copo Helado
    mascot_snow_1: {
      map: [
        '................',
        '......kkkk......',
        '....kkllllkk....',
        '...klbbbbbbbk...',
        '..klbbbbbbbbbk..',
        '..klbwbbbbwbbk..',
        '..klbkwbbwkbbk..',
        '..klbbbbbbbbbk..',
        '...kddddddddk...',
        '....kkkkkkkk....',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#083344', b: '#38bdf8', l: '#f0f9ff', d: '#0284c7', w: '#ffffff' }
    },
    // NIEVE Etapa 2 (5–9): Gólem de Escarcha
    mascot_snow_2: {
      map: [
        '....kkkkkkkk....',
        '..kkllllllllkk..',
        '.klbbbbbbbbbbbk.',
        '.klbbllllllbbbk.',
        '.klbwwbbbbwwbbk.',
        '.klbwkbbbbkwbbk.',
        '.klbbbbbbbbbbbk.',
        '..kdbbblllbbbdk.',
        '.klbbbbbbbbbbbk.',
        '.kddddddddddddk.',
        '..kkk......kkk..',
        '................',
        '................',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#083344', b: '#0ea5e9', l: '#e0f2fe', d: '#0369a1', w: '#ffffff' }
    },
    // NIEVE Etapa 3 (10–12): Ventisca Cero
    mascot_snow_3: {
      map: [
        '.kk...kkkk...kk.',
        'kllk.kllllk.kllk',
        'klbbklbbbbklbbbk',
        '.klbbbbbbbbbbbk.',
        'klbbbllllllbbbbk',
        'klbbwwbbbbwwbbbk',
        'klbbwkllllkwbbbk',
        'klbbbbllllbbbbbk',
        '.kdbbbllllbbbdk.',
        'klbbbbllllbbbbbk',
        'kdbbbbbbbbbbbbdk',
        '.kddddddddddddk.',
        '..kkk..kk..kkk..',
        '................',
        '................',
        '................'
      ],
      palette: { k: '#083344', b: '#0284c7', l: '#f0f9ff', d: '#0c4a6e', w: '#fde047' }
    }
  };

  function resolveSprite(specOrKey) {
    if (typeof specOrKey === 'string') {
      return SPRITES[specOrKey] || SPRITES.coin;
    }
    return specOrKey || SPRITES.coin;
  }

  function renderSpriteHtml(specOrKey, scale = 1, extraStyle = '') {
    const spec = resolveSprite(specOrKey);
    const map = spec.map || [];
    const palette = spec.palette || {};
    const rows = map.length || 16;
    const cols = (map[0] || '').length || 16;
    const width = Math.round(cols * scale);
    const height = Math.round(rows * scale);

    const rectsByColor = new Map();
    for (let y = 0; y < rows; y++) {
      const row = map[y] || '';
      let x = 0;
      while (x < cols) {
        const ch = row[x];
        if (!ch || ch === '.' || !palette[ch]) {
          x++;
          continue;
        }
        const color = palette[ch];
        let run = 1;
        while (x + run < cols && row[x + run] === ch) {
          run++;
        }
        if (!rectsByColor.has(color)) rectsByColor.set(color, []);
        rectsByColor.get(color).push(`<rect x="${x}" y="${y}" width="${run}" height="1"/>`);
        x += run;
      }
    }

    let groupsHtml = '';
    for (const [color, rects] of rectsByColor.entries()) {
      groupsHtml += `<g fill="${color}">${rects.join('')}</g>`;
    }

    const glowStyle = spec.glow ? `filter:drop-shadow(${spec.glow});` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges" style="image-rendering:pixelated;vertical-align:middle;flex-shrink:0;${glowStyle}${extraStyle}">${groupsHtml}</svg>`;
  }

  function renderSprite(specOrKey, scale = 1, extraStyle = '') {
    const wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;line-height:0;';
    wrap.innerHTML = renderSpriteHtml(specOrKey, scale, extraStyle);
    return wrap.firstElementChild || wrap;
  }

  function getCardMascotKey(element, power) {
    const el = (element === 'water' || element === 'snow') ? element : 'fire';
    const stage = power >= 10 ? 3 : power >= 5 ? 2 : 1;
    return `mascot_${el}_${stage}`;
  }

  window.EKSprites = {
    SPRITES,
    renderSprite,
    renderSpriteHtml,
    getCardMascotKey
  };
})();
