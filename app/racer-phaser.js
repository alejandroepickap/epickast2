// ============================================================================
// EPICKAST: TURBO CORE — MOTOR PHASER 3 CARTOON 2D (v1.9.6)
// Renderizado estilo Club Penguin limpio (paletas luminosas, contorno #1e2433)
// Sincronizado con CoreRacerGame.updateRace(track, dtScale)
// ============================================================================

(function () {
  'use strict';

  const STAGE_W = 760;
  const STAGE_H = 390;
  const HORIZON_Y = 62;
  const ROAD_TOP_W = 250;
  const ROAD_BOT_W = 500;
  const ROAD_W = 440;
  const ROAD_LEFT = (STAGE_W - ROAD_W) / 2; // 160
  const ROAD_RIGHT = ROAD_LEFT + ROAD_W; // 600
  const ROAD_CENTER_X = STAGE_W / 2; // 380
  const PLAYER_Y = 325;
  const OUTLINE = 0x1e2433;
  const FONT_UI = 'Segoe UI, system-ui, -apple-system, sans-serif';

  function roadFrac(y) {
    return Math.max(0, Math.min(1.15, (y - HORIZON_Y) / (STAGE_H - HORIZON_Y)));
  }

  function roadWidthAt(y) {
    return ROAD_TOP_W + (ROAD_BOT_W - ROAD_TOP_W) * roadFrac(y);
  }

  function roadScale(y) {
    const t = Math.max(0, Math.min(1.12, (y - HORIZON_Y) / (PLAYER_Y - HORIZON_Y)));
    return 0.58 + 0.42 * t;
  }

  function curveAt(y, dist) {
    const clampedY = Math.max(HORIZON_Y, Math.min(STAGE_H, y));
    return Math.sin((dist || 0) * 0.0022 + ((STAGE_H - clampedY) * 0.006)) * 42 * ((STAGE_H - clampedY) / STAGE_H);
  }

  function roadCenterX(y, dist) {
    return ROAD_CENTER_X + curveAt(y, dist);
  }

  const TRACK_THEMES = {
    neon_highway: {
      skyHex: '#8ec085',
      horizonTop: 0x1e3a8a,
      horizonMid: 0xf97316,
      horizonBot: 0xfde047,
      skylineCol: 0x1e293b,
      skylineHi: 0x38bdf8,
      marginBg: 0x8ec085,
      marginAlt: 0x7eb275,
      road: 0x5a667a,
      roadAlt: 0x525e71,
      roadEdge: 0x4b5668,
      curbA: 0xef4444,
      curbB: 0xfaf3e0,
      laneDash: 0xf8fafc,
      shoulderLine: 0xfef3c7,
      sceneryKeys: ['scenery_coastal_tree', 'scenery_coastal_bldg']
    },
    magma_canyon: {
      skyHex: '#d6a37a',
      horizonTop: 0x451a03,
      horizonMid: 0xdc2626,
      horizonBot: 0xfbbf24,
      skylineCol: 0x7c2d12,
      skylineHi: 0xf97316,
      marginBg: 0xd6a37a,
      marginAlt: 0xc69066,
      road: 0x615956,
      roadAlt: 0x574f4c,
      roadEdge: 0x514a48,
      curbA: 0xee7b68,
      curbB: 0xfdf4e3,
      laneDash: 0xfef3c7,
      shoulderLine: 0xfed7aa,
      sceneryKeys: ['scenery_canyon_cactus', 'scenery_canyon_mesa', 'scenery_canyon_lava']
    },
    glacier_summit: {
      skyHex: '#e8f3fb',
      horizonTop: 0x0f172a,
      horizonMid: 0x0284c7,
      horizonBot: 0x6ee7b7,
      skylineCol: 0xbae6fd,
      skylineHi: 0xffffff,
      marginBg: 0xe8f3fb,
      marginAlt: 0xd3e7f5,
      road: 0x6d8099,
      roadAlt: 0x63768f,
      roadEdge: 0x5d7088,
      curbA: 0x38bdf8,
      curbB: 0xffffff,
      laneDash: 0xffffff,
      shoulderLine: 0xe0f2fe,
      sceneryKeys: ['scenery_glacier_pine', 'scenery_glacier_flag']
    },
    obsidian_core: {
      skyHex: '#5a5673',
      horizonTop: 0x1e1b4b,
      horizonMid: 0x6d28d9,
      horizonBot: 0xf472b6,
      skylineCol: 0x312e81,
      skylineHi: 0xc084fc,
      marginBg: 0x5a5673,
      marginAlt: 0x4e4a66,
      road: 0x626882,
      roadAlt: 0x585e78,
      roadEdge: 0x535972,
      curbA: 0xf3c669,
      curbB: 0xd8b4fe,
      laneDash: 0xf3e8ff,
      shoulderLine: 0xfde68a,
      sceneryKeys: ['scenery_cavern_crystal', 'scenery_cavern_lantern']
    }
  };

  function getTrackTheme(trackId) {
    return TRACK_THEMES[trackId] || TRACK_THEMES.neon_highway;
  }

  function parseColorInt(val, fallback) {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val !== 'string') return fallback;
    const clean = val.trim().replace('#', '');
    if (clean.length === 3) {
      const expanded = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
      const n = parseInt(expanded, 16);
      return Number.isNaN(n) ? fallback : n;
    }
    if (clean.length === 6) {
      const n = parseInt(clean, 16);
      return Number.isNaN(n) ? fallback : n;
    }
    return fallback;
  }

  function shadeColor(colorInt, factor) {
    const r = Math.min(255, Math.max(0, Math.round(((colorInt >> 16) & 0xff) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(((colorInt >> 8) & 0xff) * factor)));
    const b = Math.min(255, Math.max(0, Math.round((colorInt & 0xff) * factor)));
    return (r << 16) | (g << 8) | b;
  }

  function blendLight(colorInt, amount) {
    const r = Math.min(255, Math.round(((colorInt >> 16) & 0xff) * (1 - amount) + 255 * amount));
    const g = Math.min(255, Math.round(((colorInt >> 8) & 0xff) * (1 - amount) + 255 * amount));
    const b = Math.min(255, Math.round((colorInt & 0xff) * (1 - amount) + 255 * amount));
    return (r << 16) | (g << 8) | b;
  }

  function buildKartTexture(scene, texKey, opts) {
    if (scene.textures.exists(texKey)) return texKey;
    const w = 96;
    const h = 112;
    const cx = w / 2;
    const cy = h / 2 + 4;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    const bodyCol = parseColorInt(opts.bodyColor, 0x06b6d4);
    const accentCol = parseColorInt(opts.accentColor, 0xfef3c7);
    const bodyHi = blendLight(bodyCol, 0.36);
    const bodyDark = shadeColor(bodyCol, 0.72);
    const suitCol = parseColorInt(opts.suitColor, 0x1e293b);
    const suitHi = blendLight(suitCol, 0.25);
    const maskCol = parseColorInt(opts.maskColor, 0xdc2626);
    const eyeCol = parseColorInt(opts.eyeColor, 0x38bdf8);

    // Escapes traseros gemelos
    g.fillStyle(0x94a3b8, 1);
    g.lineStyle(2.5, OUTLINE, 1);
    g.fillRoundedRect(cx - 17, cy + 24, 9, 14, 3);
    g.strokeRoundedRect(cx - 17, cy + 24, 9, 14, 3);
    g.fillRoundedRect(cx + 8, cy + 24, 9, 14, 3);
    g.strokeRoundedRect(cx + 8, cy + 24, 9, 14, 3);

    // 4 ruedas gruesas redondeadas
    const wheels = [
      { x: cx - 32, y: cy - 22, ww: 12, wh: 18 },
      { x: cx + 20, y: cy - 22, ww: 12, wh: 18 },
      { x: cx - 34, y: cy + 8, ww: 13, wh: 21 },
      { x: cx + 21, y: cy + 8, ww: 13, wh: 21 }
    ];
    wheels.forEach((wl) => {
      g.fillStyle(0x2c3447, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(wl.x, wl.y, wl.ww, wl.wh, 5);
      g.strokeRoundedRect(wl.x, wl.y, wl.ww, wl.wh, 5);
      g.fillStyle(0x64748b, 1);
      g.fillRoundedRect(wl.x + 2, wl.y + 3, 4, wl.wh - 7, 2);
    });

    // Alerón trasero simpático
    g.fillStyle(bodyDark, 1);
    g.lineStyle(2.5, OUTLINE, 1);
    g.fillRoundedRect(cx - 27, cy + 20, 54, 10, 4);
    g.strokeRoundedRect(cx - 27, cy + 20, 54, 10, 4);
    g.fillStyle(accentCol, 1);
    g.fillRoundedRect(cx - 21, cy + 22, 42, 4, 2);

    // Cuerpo redondeado del kart (pontones laterales + morro)
    g.fillStyle(bodyCol, 1);
    g.lineStyle(3, OUTLINE, 1);
    g.fillRoundedRect(cx - 24, cy - 16, 48, 40, 14);
    g.strokeRoundedRect(cx - 24, cy - 16, 48, 40, 14);

    // Morro delantero redondeado
    g.fillStyle(bodyCol, 1);
    g.lineStyle(3, OUTLINE, 1);
    g.fillRoundedRect(cx - 17, cy - 36, 34, 28, 13);
    g.strokeRoundedRect(cx - 17, cy - 36, 34, 28, 13);

    // Franja deportiva central + brillo cel-shaded
    g.fillStyle(accentCol, 0.92);
    g.fillRoundedRect(cx - 5, cy - 33, 10, 20, 4);
    g.fillStyle(bodyHi, 0.72);
    g.fillRoundedRect(cx - 20, cy - 13, 10, 26, 5);
    g.fillStyle(0xffffff, 0.5);
    g.fillEllipse(cx - 7, cy - 27, 7, 4);

    // Parabrisas brillante
    g.fillStyle(0xbae6fd, 1);
    g.lineStyle(2, OUTLINE, 1);
    g.fillRoundedRect(cx - 13, cy - 21, 26, 12, 6);
    g.strokeRoundedRect(cx - 13, cy - 21, 26, 12, 6);
    g.fillStyle(0xffffff, 0.85);
    g.fillRoundedRect(cx - 9, cy - 19, 10, 4, 2);

    // Cabina interior
    g.fillStyle(0x1e293b, 0.85);
    g.fillEllipse(cx, cy + 2, 28, 22);

    // Hombros del piloto ninja
    g.fillStyle(suitCol, 1);
    g.lineStyle(2.5, OUTLINE, 1);
    g.fillRoundedRect(cx - 15, cy - 4, 30, 18, 9);
    g.strokeRoundedRect(cx - 15, cy - 4, 30, 18, 9);

    // Cintas de la banda ninja ondeando atrás
    g.fillStyle(maskCol, 1);
    g.lineStyle(2, OUTLINE, 1);
    g.fillRoundedRect(cx + 7, cy + 4, 14, 6, 3);
    g.strokeRoundedRect(cx + 7, cy + 4, 14, 6, 3);
    g.fillRoundedRect(cx + 10, cy + 9, 12, 5, 2.5);
    g.strokeRoundedRect(cx + 10, cy + 9, 12, 5, 2.5);

    // Cabeza estilo cartoon (Club Penguin / chibi ninja)
    g.fillStyle(suitCol, 1);
    g.lineStyle(2.5, OUTLINE, 1);
    g.fillCircle(cx, cy - 6, 14);
    g.strokeCircle(cx, cy - 6, 14);

    // Brillo cel en capucha
    g.fillStyle(suitHi, 0.45);
    g.fillEllipse(cx - 4, cy - 13, 10, 5);

    // Cinta / máscara del piloto ninja
    g.fillStyle(maskCol, 1);
    g.lineStyle(2, OUTLINE, 1);
    g.fillRoundedRect(cx - 14, cy - 13, 28, 7, 3.5);
    g.strokeRoundedRect(cx - 14, cy - 13, 28, 7, 3.5);

    // Visor facial y ojos expresivos
    g.fillStyle(0x0f172a, 1);
    g.lineStyle(1.5, OUTLINE, 1);
    g.fillRoundedRect(cx - 10, cy - 6, 20, 8, 4);
    g.fillStyle(eyeCol, 1);
    g.fillCircle(cx - 4.5, cy - 2, 2.7);
    g.fillCircle(cx + 4.5, cy - 2, 2.7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5.2, cy - 2.8, 1.1);
    g.fillCircle(cx + 3.8, cy - 2.8, 1.1);

    g.generateTexture(texKey, w, h);
    g.destroy();
    return texKey;
  }

  function generateCoreTextures(scene, chassis, pilot, rivals) {
    // 1. Sombra elíptica del kart
    if (!scene.textures.exists('kart_shadow')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x0f172a, 1);
      g.fillEllipse(44, 17, 74, 24);
      g.generateTexture('kart_shadow', 88, 34);
      g.destroy();
    }

    // 2. Moneda dorada cartoon
    if (!scene.textures.exists('coin')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xfbbf24, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillCircle(17, 17, 13);
      g.strokeCircle(17, 17, 13);
      g.fillStyle(0xd97706, 0.55);
      g.fillCircle(17, 17, 9);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(17, 17, 7.5);
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(13, 12, 5, 3);
      g.fillStyle(0xb45309, 1);
      g.fillRoundedRect(15.5, 12, 3, 10, 1.5);
      g.generateTexture('coin', 34, 34);
      g.destroy();
    }

    // 3. Pad de turbo azul cielo con chevrones
    if (!scene.textures.exists('boost')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x0284c7, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(2, 2, 52, 28, 8);
      g.strokeRoundedRect(2, 2, 52, 28, 8);
      g.fillStyle(0x38bdf8, 1);
      g.fillRoundedRect(4, 4, 48, 21, 6);
      g.fillStyle(0xf8fafc, 1);
      [14, 28, 42].forEach((cx) => {
        g.fillTriangle(cx, 8, cx - 5, 20, cx + 5, 20);
        g.fillStyle(0x38bdf8, 1);
        g.fillTriangle(cx, 13, cx - 3, 21, cx + 3, 21);
        g.fillStyle(0xf8fafc, 1);
      });
      g.generateTexture('boost', 56, 32);
      g.destroy();
    }

    // 4. Rampa cartoon dorada/madera
    if (!scene.textures.exists('ramp')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xb45309, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(2, 2, 62, 38, 7);
      g.strokeRoundedRect(2, 2, 62, 38, 7);
      g.fillStyle(0xf59e0b, 1);
      g.fillRoundedRect(4, 4, 58, 29, 5);
      g.fillStyle(0xfef3c7, 0.9);
      g.fillRoundedRect(6, 5, 54, 5, 2);
      g.fillStyle(0xd97706, 0.65);
      g.fillRect(6, 19, 54, 2);
      g.fillRect(6, 28, 54, 2);
      g.fillStyle(0xfef9c3, 1);
      [18, 33, 48].forEach((cx) => {
        g.fillTriangle(cx, 12, cx - 6, 26, cx + 6, 26);
        g.fillStyle(0xf59e0b, 1);
        g.fillTriangle(cx, 18, cx - 3.5, 27, cx + 3.5, 27);
        g.fillStyle(0xfef9c3, 1);
      });
      g.generateTexture('ramp', 66, 42);
      g.destroy();
    }

    // 5. Charco de aceite brillante estilo cómic
    if (!scene.textures.exists('oil')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x2b2740, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillEllipse(30, 18, 48, 22);
      g.fillCircle(13, 19, 8);
      g.fillCircle(47, 16, 7);
      g.strokeEllipse(30, 18, 48, 22);
      g.fillStyle(0xa78bfa, 0.55);
      g.fillEllipse(24, 14, 22, 8);
      g.fillStyle(0xe0f2fe, 0.85);
      g.fillEllipse(20, 12, 8, 3.5);
      g.fillCircle(39, 20, 2.5);
      g.generateTexture('oil', 60, 34);
      g.destroy();
    }

    // 6. Barrera con conos y franjas rojo-blanco cartoon
    if (!scene.textures.exists('hazard')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      // Barra horizontal con franjas
      g.fillStyle(0xffffff, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(6, 11, 44, 11, 4);
      g.fillStyle(0xef4444, 1);
      g.fillRect(10, 12, 9, 9);
      g.fillRect(26, 12, 9, 9);
      g.fillRect(41, 12, 7, 9);
      g.strokeRoundedRect(6, 11, 44, 11, 4);
      // Conos laterales
      [11, 45].forEach((cx) => {
        g.fillStyle(0xf97316, 1);
        g.lineStyle(2.5, OUTLINE, 1);
        g.fillRoundedRect(cx - 8, 22, 16, 7, 3);
        g.strokeRoundedRect(cx - 8, 22, 16, 7, 3);
        g.fillTriangle(cx, 4, cx - 6, 23, cx + 6, 23);
        g.strokeTriangle(cx, 4, cx - 6, 23, cx + 6, 23);
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx - 3.5, 13, 7, 4);
      });
      g.generateTexture('hazard', 56, 34);
      g.destroy();
    }

    // 7. Partícula ligera de nitro y línea de viento
    if (!scene.textures.exists('nitro_puff')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xbae6fd, 0.9);
      g.fillCircle(14, 14, 11);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(12, 11, 6);
      g.generateTexture('nitro_puff', 28, 28);
      g.destroy();
    }

    if (!scene.textures.exists('wind_line')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 0.9);
      g.fillRoundedRect(1, 1, 4, 46, 2);
      g.generateTexture('wind_line', 6, 48);
      g.destroy();
    }

    // 8. Escenografía por circuito (88x88)
    generateSceneryTextures(scene);

    // 9. Karts (jugador + rivales)
    buildKartTexture(scene, 'kart_player', {
      bodyColor: chassis?.primary || '#06b6d4',
      accentColor: chassis?.glow || '#fef3c7',
      suitColor: pilot?.suitColor || '#1e293b',
      maskColor: pilot?.maskColor || '#dc2626',
      eyeColor: pilot?.eyeColor || '#38bdf8'
    });

    if (Array.isArray(rivals)) {
      rivals.forEach((r, idx) => {
        const key = getRivalTexKey(r, idx);
        const rivalSuits = [0x334155, 0x3b2f4a, 0x1e3a5f];
        const rivalMasks = [0xfbbf24, 0x38bdf8, 0xf87171];
        buildKartTexture(scene, key, {
          bodyColor: r.color || '#ef4444',
          accentColor: '#fef3c7',
          suitColor: rivalSuits[idx % rivalSuits.length],
          maskColor: rivalMasks[idx % rivalMasks.length],
          eyeColor: '#fef08a'
        });
      });
    }
  }

  function getRivalTexKey(r, idx) {
    const col = String(r?.color || idx).replace(/[^a-zA-Z0-9]/g, '');
    return `kart_rival_${idx}_${col}`;
  }

  function generateSceneryTextures(scene) {
    // Coastal: árbol redondeado
    if (!scene.textures.exists('scenery_coastal_tree')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x9a6b49, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(38, 48, 12, 28, 4);
      g.strokeRoundedRect(38, 48, 12, 28, 4);
      g.fillStyle(0x529b5a, 1);
      g.fillCircle(44, 34, 22);
      g.fillCircle(28, 42, 14);
      g.fillCircle(60, 42, 14);
      g.lineStyle(2.5, OUTLINE, 1);
      g.strokeCircle(44, 34, 22);
      g.fillStyle(0x7cc47f, 1);
      g.fillCircle(39, 28, 13);
      g.fillStyle(0xa7e3a5, 0.7);
      g.fillEllipse(35, 22, 10, 6);
      g.generateTexture('scenery_coastal_tree', 88, 84);
      g.destroy();
    }

    // Coastal: Tribuna de Carreras & Valla Publicitaria (TURBO GP awning, gradas escalonadas y banderas a cuadros)
    if (scene.textures.exists('scenery_coastal_bldg')) {
      try { scene.textures.remove('scenery_coastal_bldg'); } catch {}
    }
    if (!scene.textures.exists('scenery_coastal_bldg')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      // Mástiles de banderas a cuadros en el techo
      [18, 70].forEach((fx) => {
        g.fillStyle(0x94a3b8, 1);
        g.lineStyle(2, OUTLINE, 1);
        g.fillRect(fx - 1.5, 4, 3, 18);
        // Banderín a cuadros
        g.fillStyle(0xffffff, 1);
        g.fillRect(fx + 1.5, 4, 12, 8);
        g.fillStyle(OUTLINE, 1);
        g.fillRect(fx + 1.5, 4, 4, 4);
        g.fillRect(fx + 9.5, 4, 4, 4);
        g.fillRect(fx + 5.5, 8, 4, 4);
        g.strokeRect(fx + 1.5, 4, 12, 8);
      });

      // Estructura base de la tribuna de estadio
      g.fillStyle(0x334155, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(8, 28, 72, 48, 6);
      g.strokeRoundedRect(8, 28, 72, 48, 6);

      // Gradas escalonadas con asientos de colores y espectadores arcade
      const tierColors = [0xef4444, 0x38bdf8, 0xfbbf24];
      [34, 45, 56].forEach((ty, idx) => {
        g.fillStyle(0x1e293b, 1);
        g.fillRect(12, ty, 64, 9);
        g.fillStyle(tierColors[idx], 1);
        for (let sx = 15; sx <= 69; sx += 9) {
          g.fillRoundedRect(sx, ty + 2, 6, 5, 2);
        }
      });

      // Valla / Muro protector delantero con franjas racing rojo-blanco
      g.fillStyle(0xffffff, 1);
      g.fillRect(10, 66, 68, 8);
      g.fillStyle(0xdc2626, 1);
      for (let bx = 10; bx < 76; bx += 14) {
        g.fillRect(bx, 66, 7, 8);
      }
      g.strokeRect(10, 66, 68, 8);

      // Marquesina superior aerodinámica "TURBO GP"
      g.fillStyle(0x0284c7, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(6, 14, 76, 16, 6);
      g.strokeRoundedRect(6, 14, 76, 16, 6);
      g.fillStyle(0xfbbf24, 1);
      g.fillRoundedRect(12, 18, 64, 8, 3);
      // Bloques pixel-art estilizados "TURBO GP"
      g.fillStyle(OUTLINE, 1);
      [17, 25, 33, 41, 49, 60, 67].forEach((lx) => {
        g.fillRect(lx, 20, 5, 4);
      });

      g.generateTexture('scenery_coastal_bldg', 88, 84);
      g.destroy();
    }

    // Canyon: cactus simpático
    if (!scene.textures.exists('scenery_canyon_cactus')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x5da86d, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(20, 36, 18, 12, 5);
      g.strokeRoundedRect(20, 36, 18, 12, 5);
      g.fillRoundedRect(20, 22, 11, 22, 5);
      g.strokeRoundedRect(20, 22, 11, 22, 5);
      g.fillRoundedRect(50, 40, 18, 12, 5);
      g.strokeRoundedRect(50, 40, 18, 12, 5);
      g.fillRoundedRect(57, 26, 11, 22, 5);
      g.strokeRoundedRect(57, 26, 11, 22, 5);
      g.fillRoundedRect(36, 16, 16, 58, 8);
      g.strokeRoundedRect(36, 16, 16, 58, 8);
      g.fillStyle(0x88cf94, 0.8);
      g.fillRoundedRect(40, 22, 4, 42, 2);
      g.fillStyle(0xf472b6, 1);
      g.fillCircle(44, 14, 5);
      g.strokeCircle(44, 14, 5);
      g.generateTexture('scenery_canyon_cactus', 88, 84);
      g.destroy();
    }

    // Canyon: meseta terracota
    if (!scene.textures.exists('scenery_canyon_mesa')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc96b4b, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(12, 28, 64, 44, 12);
      g.strokeRoundedRect(12, 28, 64, 44, 12);
      g.fillStyle(0xe8a87c, 1);
      g.fillRoundedRect(18, 34, 52, 11, 5);
      g.fillStyle(0xfde68a, 0.5);
      g.fillRoundedRect(22, 30, 30, 4, 2);
      g.generateTexture('scenery_canyon_mesa', 88, 84);
      g.destroy();
    }

    // Canyon: charca de lava ámbar con burbujas
    if (!scene.textures.exists('scenery_canyon_lava')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x7c6f68, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillEllipse(44, 44, 70, 44);
      g.strokeEllipse(44, 44, 70, 44);
      g.fillStyle(0xf59e0b, 1);
      g.fillEllipse(44, 44, 56, 32);
      g.strokeEllipse(44, 44, 56, 32);
      g.fillStyle(0xfde047, 1);
      g.fillCircle(32, 41, 6);
      g.strokeCircle(32, 41, 6);
      g.fillCircle(53, 47, 4.5);
      g.strokeCircle(53, 47, 4.5);
      g.generateTexture('scenery_canyon_lava', 88, 84);
      g.destroy();
    }

    // Glacier: pino nevado estilo Club Penguin
    if (!scene.textures.exists('scenery_glacier_pine')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8c5a3c, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(38, 56, 12, 20, 4);
      g.strokeRoundedRect(38, 56, 12, 20, 4);
      // Capa inferior
      g.fillStyle(0x2f7c78, 1);
      g.fillTriangle(44, 24, 14, 60, 74, 60);
      g.strokeTriangle(44, 24, 14, 60, 74, 60);
      // Capa superior
      g.fillStyle(0x3b9690, 1);
      g.fillTriangle(44, 10, 20, 42, 68, 42);
      g.strokeTriangle(44, 10, 20, 42, 68, 42);
      // Nieve encima
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(44, 10, 31, 27, 57, 27);
      g.fillEllipse(44, 27, 26, 7);
      g.strokeTriangle(44, 10, 31, 27, 57, 27);
      g.generateTexture('scenery_glacier_pine', 88, 84);
      g.destroy();
    }

    // Glacier: banderín de madera nevado
    if (!scene.textures.exists('scenery_glacier_flag')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillEllipse(44, 68, 38, 16);
      g.strokeEllipse(44, 68, 38, 16);
      g.fillStyle(0x9a6b49, 1);
      g.fillRoundedRect(26, 18, 8, 50, 3);
      g.strokeRoundedRect(26, 18, 8, 50, 3);
      g.fillStyle(0x38bdf8, 1);
      g.fillTriangle(34, 20, 68, 30, 34, 42);
      g.strokeTriangle(34, 20, 68, 30, 34, 42);
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(44, 31, 4);
      g.generateTexture('scenery_glacier_flag', 88, 84);
      g.destroy();
    }

    // Cavern: cristales pastel
    if (!scene.textures.exists('scenery_cavern_crystal')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      const shards = [
        { pts: [26, 70, 18, 34, 31, 22, 39, 70], col: 0xc4b5fd },
        { pts: [50, 70, 48, 28, 62, 20, 68, 70], col: 0xa7f3d0 },
        { pts: [33, 72, 34, 20, 46, 10, 56, 72], col: 0xf5d0fe }
      ];
      shards.forEach((sh) => {
        g.fillStyle(sh.col, 1);
        g.lineStyle(2.5, OUTLINE, 1);
        g.fillPoints([
          { x: sh.pts[0], y: sh.pts[1] },
          { x: sh.pts[2], y: sh.pts[3] },
          { x: sh.pts[4], y: sh.pts[5] },
          { x: sh.pts[6], y: sh.pts[7] }
        ], true);
        g.strokePoints([
          { x: sh.pts[0], y: sh.pts[1] },
          { x: sh.pts[2], y: sh.pts[3] },
          { x: sh.pts[4], y: sh.pts[5] },
          { x: sh.pts[6], y: sh.pts[7] }
        ], true);
      });
      g.fillStyle(0xffffff, 0.65);
      g.fillEllipse(43, 28, 5, 16);
      g.generateTexture('scenery_cavern_crystal', 88, 84);
      g.destroy();
    }

    // Cavern: farol de papel cálido
    if (!scene.textures.exists('scenery_cavern_lantern')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x78553a, 1);
      g.lineStyle(2.5, OUTLINE, 1);
      g.fillRoundedRect(24, 18, 8, 56, 3);
      g.strokeRoundedRect(24, 18, 8, 56, 3);
      g.fillRoundedRect(24, 18, 30, 7, 3);
      g.strokeRoundedRect(24, 18, 30, 7, 3);
      g.fillStyle(0xfbbf24, 1);
      g.fillRoundedRect(40, 29, 22, 26, 9);
      g.strokeRoundedRect(40, 29, 22, 26, 9);
      g.fillStyle(0xfef9c3, 0.9);
      g.fillEllipse(51, 42, 10, 14);
      g.generateTexture('scenery_cavern_lantern', 88, 84);
      g.destroy();
    }
  }

  function mount(hostEl, opts = {}) {
    if (!hostEl) return Promise.reject(new Error('hostEl requerido para montar Phaser'));
    if (typeof window.loadPhaser !== 'function') {
      return Promise.reject(new Error('window.loadPhaser no disponible'));
    }

    const { gameRef, track, chassis, pilot, playerName, onReady, isCancelled } = opts;
    const theme = getTrackTheme(track?.id);
    let phaserGame = null;
    let destroyed = false;
    let ready = false;

    const isAborted = () => {
      if (destroyed) return true;
      if (typeof isCancelled === 'function' && isCancelled()) return true;
      if (gameRef && (gameRef.destroyed || !gameRef.inRace)) return true;
      return false;
    };

    const destroy = () => {
      destroyed = true;
      ready = false;
      if (phaserGame) {
        try { phaserGame.destroy(true); } catch {}
        phaserGame = null;
      }
      if (hostEl) {
        try { hostEl.innerHTML = ''; } catch {}
      }
    };

    const isReady = () => ready && !destroyed;

    return window.loadPhaser().then((Phaser) => {
      if (isAborted()) {
        return { destroy, isReady };
      }

      const poppedCoins = new WeakSet();
      const triggeredRamps = new WeakSet();

      class TurboCoreScene extends Phaser.Scene {
        constructor() {
          super({ key: 'TurboCoreScene' });
        }

        preload() {
          const manifest = window.EKCartoonArtManifest && window.EKCartoonArtManifest.racerSprites;
          if (manifest && typeof manifest === 'object') {
            this.load.on('loaderror', () => {});
            Object.entries(manifest).forEach(([key, url]) => {
              if (typeof url === 'string' && url.length > 0 && !/^https?:\/\//i.test(url)) {
                this.load.image(key, url);
              }
            });
          }
        }

        create() {
          if (isAborted()) {
            destroy();
            return;
          }

          const initialRivals = gameRef?.raceState?.rivals || [];
          generateCoreTextures(this, chassis, pilot, initialRivals);

          // Fondo base y carretera en perspectiva con curvas
          this.bgGfx = this.add.graphics().setDepth(0);
          this.drawStaticBackground();

          // Marcas viales dinámicas, bordillos en perspectiva y meta
          this.roadGfx = this.add.graphics().setDepth(1);

          // Horizonte escénico con parallax (y = 0..62)
          this.skyGfx = this.add.graphics().setDepth(3);

          // Escenografía lateral en scroll proyectada junto a la curva (12 props: 6 izquierda, 6 derecha)
          this.sceneryPool = [];
          const scKeys = theme.sceneryKeys || ['scenery_coastal_tree'];
          for (let i = 0; i < 12; i++) {
            const isLeft = i % 2 === 0;
            const row = Math.floor(i / 2);
            const sx = isLeft ? 75 : (STAGE_W - 75);
            const key = scKeys[(row + (isLeft ? 0 : 1)) % scKeys.length];
            const sp = this.add.image(sx, HORIZON_Y + row * 58, key)
              .setDepth(2)
              .setScale(0.76);
            this.sceneryPool.push({ sprite: sp, isLeft, baseY: row * 58, row });
          }

          // Pool de objetos de pista (monedas, turbos, rampas, aceite, barreras)
          this.itemPool = [];
          for (let i = 0; i < 24; i++) {
            const sp = this.add.image(-100, -100, 'coin').setVisible(false).setDepth(4);
            this.itemPool.push(sp);
          }

          // Pool de partículas de nitro y líneas de viento
          this.puffPool = [];
          for (let i = 0; i < 20; i++) {
            const sp = this.add.image(-100, -100, 'nitro_puff').setVisible(false).setDepth(8);
            this.puffPool.push({ sprite: sp, active: false, vx: 0, vy: 0, life: 0, maxLife: 18 });
          }

          this.windPool = [];
          for (let i = 0; i < 10; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const lx = ROAD_CENTER_X + side * (ROAD_W * (0.44 + (i % 3) * 0.04));
            const sp = this.add.image(lx, (i * 42) % STAGE_H, 'wind_line')
              .setDepth(16)
              .setAlpha(0)
              .setVisible(false);
            this.windPool.push({ sprite: sp, side, lx, phase: i * 0.13 });
          }

          // Pool de textos flotantes "+5"
          this.coinPopPool = [];
          for (let i = 0; i < 8; i++) {
            const txt = this.add.text(-100, -100, '+5', {
              fontFamily: FONT_UI,
              fontSize: '15px',
              fontStyle: 'bold',
              color: '#fde047',
              stroke: '#1e2433',
              strokeThickness: 4
            }).setOrigin(0.5).setDepth(17).setVisible(false);
            this.coinPopPool.push({ txt, active: false, life: 0, maxLife: 34 });
          }

          // Jugador + sombra + píldora de nombre
          this.playerShadow = this.add.image(ROAD_CENTER_X, PLAYER_Y + 18, 'kart_shadow')
            .setDepth(6)
            .setAlpha(0.28);
          this.playerSprite = this.add.image(ROAD_CENTER_X, PLAYER_Y, 'kart_player')
            .setOrigin(0.5, 0.58)
            .setDepth(11)
            .setScale(0.96);
          this.playerPill = this.createNamePill(playerName || 'Tú', true);
          this.prevPlayerJump = 0;
          this.playerBounce = 0;

          // Rivales (hasta 3)
          this.rivalObjs = [0, 1, 2].map((idx) => {
            const r = initialRivals[idx] || {};
            const texKey = getRivalTexKey(r, idx);
            const shadow = this.add.image(-100, -100, 'kart_shadow').setDepth(6).setAlpha(0.28).setVisible(false);
            const sprite = this.add.image(-100, -100, texKey).setOrigin(0.5, 0.58).setDepth(10).setScale(0.90).setVisible(false);
            const pill = this.createNamePill(r.name || `Rival ${idx + 1}`, false);
            pill.container.setVisible(false);
            return {
              idx,
              texKey,
              shadow,
              sprite,
              pill,
              prevX: r.x || 0,
              prevJump: 0,
              bounce: 0
            };
          });

          // Flash suave de colisión
          this.flashGfx = this.add.graphics().setDepth(18);

          // Minimapa vertical derecho
          this.minimapGfx = this.add.graphics().setDepth(20);

          // Velocímetro Digital & Marchas Arcade (esquina inferior izquierda)
          this.speedHudGfx = this.add.graphics().setDepth(20);
          this.speedValTxt = this.add.text(24, STAGE_H - 59, '000', {
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: '21px',
            fontStyle: 'bold',
            color: '#38bdf8'
          }).setDepth(21);
          this.speedUnitTxt = this.add.text(72, STAGE_H - 54, 'KM/H', {
            fontFamily: FONT_UI,
            fontSize: '9.5px',
            fontStyle: 'bold',
            color: '#94a3b8'
          }).setDepth(21);
          this.gearBadgeTxt = this.add.text(119, STAGE_H - 49, 'G1', {
            fontFamily: FONT_UI,
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#fbbf24'
          }).setOrigin(0.5).setDepth(21);

          this.puffCd = 0;
          ready = true;
          if (typeof onReady === 'function') {
            try { onReady(); } catch {}
          }
        }

        drawStaticBackground() {
          const g = this.bgGfx;
          g.clear();
          // Fondo base del terreno bajo el horizonte
          g.fillStyle(theme.marginBg, 1);
          g.fillRect(0, HORIZON_Y, STAGE_W, STAGE_H - HORIZON_Y);
        }

        drawHorizonBackdrop(st) {
          const g = this.skyGfx;
          g.clear();

          // Cielo degradado en 3 franjas luminosas (y = 0..62)
          g.fillStyle(theme.horizonTop || 0x1e3a8a, 1);
          g.fillRect(0, 0, STAGE_W, 22);
          g.fillStyle(theme.horizonMid || 0xf97316, 1);
          g.fillRect(0, 22, STAGE_W, 20);
          g.fillStyle(theme.horizonBot || 0xfde047, 1);
          g.fillRect(0, 42, STAGE_W, HORIZON_Y - 42);

          // Desplazamiento horizontal parallax según la curva de la carretera
          const curveShift = -curveAt(HORIZON_Y, st.dist) * 1.5;
          const scrollPx = ((st.dist * 0.14) % 160);
          const baseShift = curveShift - scrollPx;
          const tid = track?.id || 'neon_highway';

          if (tid === 'magma_canyon') {
            // Sol volcánico incandescente y picos rojo-dorados del cañón
            g.fillStyle(0xfef08a, 0.88);
            g.fillCircle(ROAD_CENTER_X + curveShift * 0.45, 24, 15);
            for (let k = -1; k < 7; k++) {
              const px = k * 160 + baseShift;
              g.fillStyle(theme.skylineCol || 0x7c2d12, 1);
              g.fillTriangle(px, HORIZON_Y, px + 48, 18, px + 98, HORIZON_Y);
              g.fillTriangle(px + 72, HORIZON_Y, px + 118, 25, px + 166, HORIZON_Y);
              // Vetas de magma brillante en las cumbres
              g.fillStyle(theme.skylineHi || 0xf97316, 0.9);
              g.fillTriangle(px + 48, 18, px + 41, 34, px + 54, 34);
            }
          } else if (tid === 'glacier_summit') {
            // Auroras boreales y cumbres heladas
            g.fillStyle(0x34d399, 0.35);
            g.fillRoundedRect(60 + curveShift * 0.4, 8, 240, 10, 5);
            g.fillRoundedRect(420 + curveShift * 0.4, 12, 240, 10, 5);
            for (let k = -1; k < 7; k++) {
              const px = k * 160 + baseShift;
              g.fillStyle(0x93c5fd, 1);
              g.fillTriangle(px, HORIZON_Y, px + 54, 14, px + 108, HORIZON_Y);
              g.fillStyle(0xffffff, 0.95);
              g.fillTriangle(px + 54, 14, px + 36, 33, px + 72, 33);
              g.fillStyle(0xbae6fd, 1);
              g.fillTriangle(px + 80, HORIZON_Y, px + 124, 24, px + 168, HORIZON_Y);
            }
          } else if (tid === 'obsidian_core') {
            // Arcos de templo de cristal y obeliscos arcanos
            g.fillStyle(0xe9d5ff, 0.75);
            g.fillCircle(ROAD_CENTER_X + curveShift * 0.35, 21, 13);
            for (let k = -1; k < 7; k++) {
              const px = k * 160 + baseShift;
              g.fillStyle(theme.skylineCol || 0x312e81, 1);
              g.fillTriangle(px + 10, HORIZON_Y, px + 34, 16, px + 58, HORIZON_Y);
              g.fillRect(px + 74, 22, 46, HORIZON_Y - 22);
              g.fillStyle(theme.skylineHi || 0xc084fc, 0.85);
              g.fillRect(px + 86, 30, 22, HORIZON_Y - 30);
            }
          } else {
            // neon_highway: Sol costero, nubes y skyline cyber-city al atardecer
            g.fillStyle(0xfef08a, 0.92);
            g.fillCircle(ROAD_CENTER_X + curveShift * 0.4, 25, 16);
            g.fillStyle(0xffffff, 0.75);
            for (let c = -1; c < 6; c++) {
              const cx = c * 180 + (baseShift * 0.6);
              g.fillRoundedRect(cx + 20, 12, 54, 11, 5);
            }
            const bHeights = [30, 40, 24, 36, 28];
            for (let k = -1; k < 7; k++) {
              const px = k * 160 + baseShift;
              for (let b = 0; b < 5; b++) {
                const bh = bHeights[b];
                const bx = px + b * 31;
                const by = HORIZON_Y - bh;
                g.fillStyle(theme.skylineCol || 0x1e293b, 1);
                g.fillRect(bx, by, 27, bh);
                g.fillStyle(theme.skylineHi || 0x38bdf8, 0.85);
                g.fillRect(bx + 4, by + 5, 19, 3);
                g.fillRect(bx + 4, by + 12, 19, 3);
              }
            }
          }

          // Línea divisoria limpia del horizonte
          g.lineStyle(2.5, OUTLINE, 1);
          g.lineBetween(0, HORIZON_Y, STAGE_W, HORIZON_Y);
        }

        createNamePill(label, isPlayer) {
          const container = this.add.container(0, 0).setDepth(14);
          const bg = this.add.graphics();
          const txt = this.add.text(0, 0, String(label || ''), {
            fontFamily: FONT_UI,
            fontSize: '10.5px',
            fontStyle: 'bold',
            color: '#ffffff'
          }).setOrigin(0.5);

          const redraw = (newLabel) => {
            if (newLabel !== undefined && txt.text !== newLabel) {
              txt.setText(newLabel);
            }
            const pw = Math.max(30, Math.ceil(txt.width) + 14);
            const ph = 17;
            bg.clear();
            bg.fillStyle(0x1e2433, 0.86);
            bg.lineStyle(1.8, isPlayer ? 0xfbbf24 : 0xffffff, 0.92);
            bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 8.5);
            bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 8.5);
          };
          redraw(label);
          container.add([bg, txt]);
          return { container, txt, redraw, lastLabel: String(label || '') };
        }

        spawnPuff(x, y, isBoost) {
          const slot = this.puffPool.find((p) => !p.active);
          if (!slot) return;
          slot.active = true;
          slot.life = 16;
          slot.maxLife = 16;
          slot.vx = (Math.random() - 0.5) * 1.4;
          slot.vy = 2.2 + Math.random() * 1.6;
          slot.sprite
            .setPosition(x, y)
            .setScale(isBoost ? 0.65 : 0.45)
            .setTint(isBoost ? 0xbae6fd : 0xf8fafc)
            .setAlpha(0.85)
            .setVisible(true);
        }

        spawnCoinPop(x, y) {
          const slot = this.coinPopPool.find((p) => !p.active);
          if (!slot) return;
          slot.active = true;
          slot.life = 32;
          slot.maxLife = 32;
          slot.txt
            .setPosition(x, y)
            .setAlpha(1)
            .setScale(1.1)
            .setVisible(true);
        }

        update(time, delta) {
          if (isAborted()) return;
          const dtScale = Math.min(Math.max((delta || 16.667) / 16.667, 0.25), 2.5);
          const st = gameRef.raceState;
          if (!gameRef.paused && st) {
            gameRef.updateRace(track, dtScale);
          }
          if (isAborted() || !st) return;
          this.renderRaceFrame(st, dtScale, time);
        }

        renderRaceFrame(st, dtScale, time) {
          // 1. Camera shake en colisiones
          if (st.shakeFrames > 0) {
            const mag = (st.shakeFrames / 15) * 5;
            this.cameras.main.setScroll(
              (Math.random() - 0.5) * mag * 2,
              (Math.random() - 0.5) * mag * 2
            );
          } else {
            this.cameras.main.setScroll(0, 0);
          }

          // 2. Horizonte escénico parallax + Carretera curva en perspectiva
          this.drawHorizonBackdrop(st);
          this.drawDynamicRoad(st);

          // 3. Escenografía lateral proyectada a lo largo de la curva en perspectiva
          const spanH = (STAGE_H - HORIZON_Y) + 46;
          const scrollDist = (st.dist * 0.85) % spanH;
          for (let i = 0; i < this.sceneryPool.length; i++) {
            const sc = this.sceneryPool[i];
            const sy = HORIZON_Y - 6 + ((sc.baseY + scrollDist) % spanH);
            if (sy < HORIZON_Y + 4) {
              sc.sprite.setVisible(false);
              continue;
            }
            const persp = roadScale(sy);
            const rCx = roadCenterX(sy, st.dist);
            const rHalfW = roadWidthAt(sy) * 0.5;
            const marginOut = (44 + (sc.row % 3) * 18) * persp;
            const sx = sc.isLeft ? (rCx - rHalfW - marginOut) : (rCx + rHalfW + marginOut);
            sc.sprite
              .setPosition(sx, sy)
              .setScale(persp * (0.74 + (sc.row % 2) * 0.08))
              .setDepth(2 + sy * 0.001)
              .setVisible(true);
          }

          // 4. Objetos en pista proyectados en perspectiva (monedas, turbos, rampas, aceite, barreras)
          let itemSlot = 0;
          const items = st.items || [];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const dz = item.dist - st.dist;
            if (dz < -50 || dz > 340) continue;
            const iy = PLAYER_Y - dz * 0.85;
            if (iy < HORIZON_Y + 4 || iy > STAGE_H + 36) continue;
            const iScale = roadScale(iy);
            const ix = roadCenterX(iy, st.dist) + item.x * (roadWidthAt(iy) * 0.42);

            if (item.type === 'coin' && item.taken) {
              if (!poppedCoins.has(item) && Math.abs(dz) < 60) {
                poppedCoins.add(item);
                this.spawnCoinPop(ix, iy - 12);
              }
              continue;
            }
            if ((item.type === 'boost' && item.taken) || ((item.type === 'oil' || item.type === 'hazard') && item.hit)) {
              continue;
            }
            if (item.type === 'ramp' && item.triggered && !triggeredRamps.has(item) && Math.abs(dz) < 60) {
              triggeredRamps.add(item);
              this.spawnPuff(ix - 12, iy, true);
              this.spawnPuff(ix + 12, iy, true);
            }
            if (itemSlot >= this.itemPool.length) continue;

            const sp = this.itemPool[itemSlot++];
            sp.setTexture(item.type);
            sp.setPosition(ix, iy);
            sp.setAlpha(item.type === 'ramp' && item.triggered ? 0.65 : 1);
            if (item.type === 'coin') {
              const spin = 0.84 + 0.16 * Math.cos(time * 0.008 + item.dist * 0.05);
              sp.setScale(spin * iScale, iScale);
            } else {
              sp.setScale(iScale, iScale);
            }
            sp.setDepth(4 + iy * 0.001);
            sp.setVisible(true);
          }
          for (let i = itemSlot; i < this.itemPool.length; i++) {
            this.itemPool[i].setVisible(false);
          }

          // 5. Rivales proyectados sobre la curva y escala de perspectiva
          const rivals = st.rivals || [];
          for (let idx = 0; idx < this.rivalObjs.length; idx++) {
            const ro = this.rivalObjs[idx];
            const r = rivals[idx];
            if (!r) {
              ro.shadow.setVisible(false);
              ro.sprite.setVisible(false);
              ro.pill.container.setVisible(false);
              continue;
            }
            const wantedKey = getRivalTexKey(r, idx);
            if (wantedKey !== ro.texKey || !this.textures.exists(wantedKey)) {
              buildKartTexture(this, wantedKey, {
                bodyColor: r.color || '#38bdf8',
                accentColor: '#fef3c7',
                suitColor: 0x1e293b,
                maskColor: 0xfbbf24,
                eyeColor: '#e0f2fe'
              });
              ro.texKey = wantedKey;
              ro.sprite.setTexture(wantedKey);
            }

            const ry = PLAYER_Y - (r.dist - st.dist) * 0.85;
            if (ry < HORIZON_Y + 6 || ry > STAGE_H + 70) {
              ro.shadow.setVisible(false);
              ro.sprite.setVisible(false);
              ro.pill.container.setVisible(false);
              ro.prevX = r.x;
              ro.prevJump = r.jumpHeight || 0;
              continue;
            }
            const rPersp = roadScale(ry);
            const rx = roadCenterX(ry, st.dist) + r.x * (roadWidthAt(ry) * 0.42);

            const rJump = r.jumpHeight || 0;
            if (ro.prevJump > 2 && rJump <= 0.01) {
              ro.bounce = 14;
            }
            ro.prevJump = rJump;
            if (ro.bounce > 0) ro.bounce = Math.max(0, ro.bounce - dtScale);

            const rvx = (r.x - ro.prevX) / Math.max(0.25, dtScale);
            ro.prevX = r.x;
            const targetRot = Phaser.Math.Clamp(rvx * 5.0, -0.16, 0.16);
            ro.sprite.rotation += (targetRot - ro.sprite.rotation) * Math.min(1, 0.25 * dtScale);

            const baseScale = 0.90 * rPersp;
            const jScale = 1 + (rJump / 26) * 0.16;
            let sx = baseScale * jScale;
            let sy = baseScale * jScale;
            if (ro.bounce > 0) {
              const bt = ro.bounce / 14;
              const sq = Math.sin(bt * Math.PI * 2) * 0.10 * bt;
              sx *= (1 + sq);
              sy *= (1 - sq * 0.85);
            }

            const shadowScale = baseScale * Math.max(0.52, 1 - rJump / 48);
            ro.shadow
              .setPosition(rx, ry + 18 * rPersp)
              .setScale(shadowScale)
              .setAlpha(0.28 * Math.max(0.45, 1 - rJump / 55))
              .setVisible(true);

            const drawY = ry - rJump * 1.15 * rPersp;
            ro.sprite
              .setPosition(rx, drawY)
              .setScale(sx, sy)
              .setDepth(10 + ry * 0.001)
              .setVisible(true);

            if (r.name !== ro.pill.lastLabel) {
              ro.pill.lastLabel = String(r.name || '');
              ro.pill.redraw(ro.pill.lastLabel);
            }
            ro.pill.container
              .setPosition(rx, drawY - 46 * baseScale)
              .setScale(Math.max(0.74, rPersp))
              .setVisible(true);
          }

          // 6. Kart del jugador alineado con la curva en PLAYER_Y
          const pCenterX = roadCenterX(PLAYER_Y, st.dist);
          const pRoadW = roadWidthAt(PLAYER_Y);
          const px = pCenterX + st.x * (pRoadW * 0.42);
          const pJump = st.jumpHeight || 0;
          if (this.prevPlayerJump > 2 && pJump <= 0.01) {
            this.playerBounce = 14;
          }
          this.prevPlayerJump = pJump;
          if (this.playerBounce > 0) this.playerBounce = Math.max(0, this.playerBounce - dtScale);

          const targetPlayerRot = st.skidTimer > 0
            ? Math.sin(st.skidTimer * 0.75) * 0.42
            : Phaser.Math.Clamp((st.vx || 0) * 7.5, -0.20, 0.20);
          this.playerSprite.rotation += (targetPlayerRot - this.playerSprite.rotation) * Math.min(1, 0.28 * dtScale);

          const pBase = 0.96;
          const pjScale = 1 + (pJump / 26) * 0.16;
          let psx = pBase * pjScale;
          let psy = pBase * pjScale;
          if (this.playerBounce > 0) {
            const bt = this.playerBounce / 14;
            const sq = Math.sin(bt * Math.PI * 2) * 0.11 * bt;
            psx *= (1 + sq);
            psy *= (1 - sq * 0.85);
          }

          const pShadowScale = pBase * Math.max(0.52, 1 - pJump / 48);
          this.playerShadow
            .setPosition(px, PLAYER_Y + 18)
            .setScale(pShadowScale)
            .setAlpha(0.28 * Math.max(0.45, 1 - pJump / 55));

          const pDrawY = PLAYER_Y - pJump * 1.15;
          this.playerSprite
            .setPosition(px, pDrawY)
            .setScale(psx, psy)
            .setDepth(10 + PLAYER_Y * 0.001 + 0.0005);

          this.playerPill.container.setPosition(px, pDrawY - 47);

          // 7. Partículas ligeras de nitro y líneas de viento
          this.puffCd -= dtScale;
          if (!gameRef.paused && st.countdown <= 0 && !st.finished && this.puffCd <= 0) {
            if (st.nitroActive > 0) {
              this.puffCd = 1.6;
              this.spawnPuff(px - 11, pDrawY + 28, true);
              this.spawnPuff(px + 11, pDrawY + 28, true);
            } else if (st.speed > 3.5) {
              this.puffCd = 5.5;
              this.spawnPuff(px + (Math.random() < 0.5 ? -11 : 11), pDrawY + 28, false);
            }
          }

          for (let i = 0; i < this.puffPool.length; i++) {
            const pf = this.puffPool[i];
            if (!pf.active) continue;
            pf.life -= dtScale;
            if (pf.life <= 0) {
              pf.active = false;
              pf.sprite.setVisible(false);
              continue;
            }
            const t = pf.life / pf.maxLife;
            pf.sprite.x += pf.vx * dtScale;
            pf.sprite.y += pf.vy * dtScale;
            pf.sprite.setAlpha(t * 0.78);
            pf.sprite.setScale((1 - t * 0.35) * 0.8);
          }

          const showWind = st.nitroActive > 0;
          for (let i = 0; i < this.windPool.length; i++) {
            const wl = this.windPool[i];
            if (showWind) {
              const prog = ((st.dist * 0.055 + wl.phase) % 1);
              const wy = HORIZON_Y + prog * (STAGE_H - HORIZON_Y);
              const wx = roadCenterX(wy, st.dist) + wl.side * (roadWidthAt(wy) * 0.45);
              wl.sprite
                .setPosition(wx, wy)
                .setAlpha(0.75)
                .setVisible(true);
            } else {
              wl.sprite.setVisible(false);
            }
          }

          for (let i = 0; i < this.coinPopPool.length; i++) {
            const cp = this.coinPopPool[i];
            if (!cp.active) continue;
            cp.life -= dtScale;
            if (cp.life <= 0) {
              cp.active = false;
              cp.txt.setVisible(false);
              continue;
            }
            const frac = cp.life / cp.maxLife;
            cp.txt.y -= 1.15 * dtScale;
            cp.txt.setAlpha(Math.min(1, frac * 1.4));
          }

          // 8. Flash suave de colisión
          this.flashGfx.clear();
          if (st.crashFlash > 0) {
            this.flashGfx.fillStyle(0xf87171, (st.crashFlash / 10) * 0.24);
            this.flashGfx.fillRect(0, 0, STAGE_W, STAGE_H);
          }

          // 9. Minimapa vertical de progreso y Velocímetro Digital Arcade
          this.drawMinimap(st);
          this.drawSpeedometerHud(st);
        }

        drawDynamicRoad(st) {
          const g = this.roadGfx;
          g.clear();

          // Renderizado por franjas horizontales en perspectiva (y = HORIZON_Y..STAGE_H)
          // Estilo OutRun / Horizon Chase: bandas alternas de asfalto, pianos curvos y 3 divisores de carril
          const stripH = 5;
          for (let y = HORIZON_Y; y < STAGE_H; y += stripH) {
            const h = Math.min(stripH, STAGE_H - y);
            const ym = y + h * 0.5;
            const scale = roadScale(ym);
            const cx = roadCenterX(ym, st.dist);
            const rw = roadWidthAt(ym);
            const rLeft = cx - rw * 0.5;
            const rRight = cx + rw * 0.5;
            const curbW = Math.max(7, 17 * scale);

            // Coordenada Z proyectada para bandas de velocidad a 60fps
            const zProj = st.dist * 0.92 + (PLAYER_Y - ym) / Math.max(0.38, scale * 0.85);
            const rumbleIdx = Math.floor(zProj / 24);
            const isAltBand = ((rumbleIdx % 2) + 2) % 2 === 0;

            // Franjas laterales de césped/terreno
            g.fillStyle(isAltBand ? theme.marginBg : theme.marginAlt, 1);
            g.fillRect(0, y, Math.max(0, rLeft - curbW), h);
            g.fillRect(rRight + curbW, y, Math.max(0, STAGE_W - (rRight + curbW)), h);

            // Asfalto con bandas alternas claras/oscuras de alta velocidad
            const roadCol = isAltBand ? theme.road : (theme.roadAlt || shadeColor(theme.road, 0.91));
            g.fillStyle(roadCol, 1);
            g.fillRect(rLeft, y, rw, h);

            // Pianos / bordillos de competición (rojo/cian/blanco) con contorno #1e2433
            const curbIdx = Math.floor(zProj / 18);
            const isCurbA = ((curbIdx % 2) + 2) % 2 === 0;
            g.fillStyle(isCurbA ? theme.curbA : theme.curbB, 1);
            g.fillRect(rLeft - curbW, y, curbW, h);
            g.fillRect(rRight, y, curbW, h);

            // Contornos laterales del bordillo y arcén
            g.fillStyle(OUTLINE, 1);
            g.fillRect(rLeft - curbW - 1.5, y, 2, h);
            g.fillRect(rLeft - 1, y, 2, h);
            g.fillRect(rRight - 1, y, 2, h);
            g.fillRect(rRight + curbW - 0.5, y, 2, h);

            // Líneas de arcén interior
            const shPad = Math.max(4, 9 * scale);
            const shW = Math.max(1.5, 2.8 * scale);
            g.fillStyle(theme.shoulderLine, 0.65);
            g.fillRect(rLeft + shPad, y, shW, h);
            g.fillRect(rRight - shPad - shW, y, shW, h);

            // 3 Divisores discontinuos (4 carriles) proyectados sobre la curva
            const isDash = ((Math.floor(zProj / 22) % 2) + 2) % 2 === 0;
            if (isDash) {
              const dashW = Math.max(2, 4.8 * scale);
              g.fillStyle(theme.laneDash, 0.78);
              const l1 = cx - rw * 0.25;
              const l2 = cx;
              const l3 = cx + rw * 0.25;
              g.fillRect(l1 - dashW * 0.5, y, dashW, h);
              g.fillRect(l2 - dashW * 0.5, y, dashW, h);
              g.fillRect(l3 - dashW * 0.5, y, dashW, h);
            }
          }

          // Línea de meta a cuadros proyectada en perspectiva
          const distToFinish = st.totalDist - st.dist;
          if (distToFinish < 340 && distToFinish > -70) {
            const fy = PLAYER_Y - distToFinish * 0.85;
            if (fy >= HORIZON_Y + 4 && fy <= STAGE_H + 20) {
              const fScale = roadScale(fy);
              const fCx = roadCenterX(fy, st.dist);
              const fRw = roadWidthAt(fy);
              const fLeft = fCx - fRw * 0.5;
              const fRight = fCx + fRw * 0.5;
              const sq = Math.max(8, Math.round(16 * fScale));
              for (let cx = fLeft; cx < fRight; cx += sq) {
                for (let row = 0; row < 2; row++) {
                  const cy = fy - sq + row * sq;
                  const isWhite = (Math.floor((cx - fLeft) / sq) + row) % 2 === 0;
                  g.fillStyle(isWhite ? 0xffffff : OUTLINE, 1);
                  g.fillRect(cx, cy, Math.min(sq, fRight - cx), sq);
                }
              }
              g.lineStyle(2, OUTLINE, 1);
              g.strokeRect(fLeft, fy - sq, fRw, sq * 2);
            }
          }
        }

        drawSpeedometerHud(st) {
          const g = this.speedHudGfx;
          g.clear();

          const bx = 12;
          const by = STAGE_H - 66;
          const bw = 126;
          const bh = 54;

          // Cápsula arcade oscura con borde luminoso
          const isNitro = st.nitroActive > 0;
          g.fillStyle(0x0f172a, 0.90);
          g.lineStyle(2, isNitro ? 0x38bdf8 : 0x475569, 0.95);
          g.fillRoundedRect(bx, by, bw, bh, 10);
          g.strokeRoundedRect(bx, by, bw, bh, 10);

          // Cálculo de KM/H, marcha (1..6) y RPM
          const rawSpd = Math.max(0, st.speed || 0);
          const maxRef = Math.max(5.4, st.maxSpeed || 5.8);
          const kmh = Math.min(360, Math.round((rawSpd / 5.4) * 215));
          const gear = rawSpd < 0.2 ? 1 : Math.min(6, Math.max(1, Math.ceil((rawSpd / (maxRef + 1.8)) * 6)));
          const gearFloor = ((gear - 1) / 6) * maxRef;
          const gearSpan = Math.max(0.5, maxRef / 6);
          const rpmFrac = rawSpd < 0.15
            ? 0.12
            : (isNitro ? 1 : Math.max(0.18, Math.min(1, (rawSpd - gearFloor * 0.82) / (gearSpan * 1.35))));

          const kmhStr = String(kmh).padStart(3, '0');
          if (this.speedValTxt.text !== kmhStr) {
            this.speedValTxt.setText(kmhStr);
          }
          this.speedValTxt.setColor(isNitro ? '#fde047' : '#38bdf8');

          const gearStr = `G${gear}`;
          if (this.gearBadgeTxt.text !== gearStr) {
            this.gearBadgeTxt.setText(gearStr);
          }

          // Pastilla de marcha actual (G1..G6)
          g.fillStyle(isNitro ? 0x0284c7 : 0x1e293b, 1);
          g.lineStyle(1.5, isNitro ? 0xfde047 : 0x38bdf8, 0.9);
          g.fillRoundedRect(bx + 92, by + 7, 26, 20, 6);
          g.strokeRoundedRect(bx + 92, by + 7, 26, 20, 6);

          // Barra de RPM segmentada (10 bloques)
          const segCount = 10;
          const activeSegs = Math.round(rpmFrac * segCount);
          const barX = bx + 10;
          const barY = by + 36;
          const segW = 9;
          const segH = 9;
          for (let i = 0; i < segCount; i++) {
            const sx = barX + i * (segW + 1.8);
            if (i < activeSegs) {
              const col = i < 4 ? 0x38bdf8 : (i < 7 ? 0x10b981 : (i < 9 ? 0xfbbf24 : 0xef4444));
              g.fillStyle(col, 1);
            } else {
              g.fillStyle(0x1e293b, 1);
            }
            g.fillRoundedRect(sx, barY, segW, segH, 2);
          }
        }

        drawMinimap(st) {
          const g = this.minimapGfx;
          g.clear();

          const mapX = 736;
          const mapTop = 44;
          const mapBot = 348;
          const mapH = mapBot - mapTop;

          // Cápsula limpia cartoon
          g.fillStyle(0x1e2433, 0.85);
          g.lineStyle(2, 0xffffff, 0.9);
          g.fillRoundedRect(mapX - 11, mapTop - 18, 22, mapH + 36, 11);
          g.strokeRoundedRect(mapX - 11, mapTop - 18, 22, mapH + 36, 11);

          // Línea vertical central
          g.lineStyle(3, 0x94a3b8, 0.45);
          g.lineBetween(mapX, mapTop + 4, mapX, mapBot - 4);

          // Mini meta arriba y luz verde abajo
          g.fillStyle(0xffffff, 1);
          g.fillRect(mapX - 6, mapTop - 11, 4, 4);
          g.fillRect(mapX + 2, mapTop - 7, 4, 4);
          g.fillStyle(0x10b981, 1);
          g.fillCircle(mapX, mapBot + 9, 4);

          // Puntos de los rivales
          const rivals = st.rivals || [];
          for (let i = 0; i < rivals.length; i++) {
            const r = rivals[i];
            const frac = Math.max(0, Math.min(1, (r.dist || 0) / (st.totalDist || 1)));
            const dotY = mapBot - frac * mapH;
            g.fillStyle(parseColorInt(r.color, 0xef4444), 1);
            g.lineStyle(1.5, OUTLINE, 1);
            g.fillCircle(mapX, dotY, 4.5);
            g.strokeCircle(mapX, dotY, 4.5);
          }

          // Punto del jugador encima
          const pFrac = Math.max(0, Math.min(1, (st.dist || 0) / (st.totalDist || 1)));
          const pDotY = mapBot - pFrac * mapH;
          g.fillStyle(parseColorInt(chassis?.glow || chassis?.primary, 0x38bdf8), 1);
          g.lineStyle(2, 0xffffff, 1);
          g.fillCircle(mapX, pDotY, 6);
          g.strokeCircle(mapX, pDotY, 6);
        }
      }

      if (isAborted()) {
        return { destroy, isReady };
      }

      phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostEl,
        width: STAGE_W,
        height: STAGE_H,
        transparent: false,
        backgroundColor: theme.skyHex,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH
        },
        audio: {
          noAudio: true
        },
        scene: TurboCoreScene
      });

      return { destroy, isReady };
    });
  }

  window.EKRacerPhaser = { mount };
})();
