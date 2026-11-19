/**
 * EpicKast v1.9.6 — Dojo Elemental Phaser 3 Scene (`window.EKDojoPhaser`)
 * Clean, calm, joyful Club Penguin / Card-Jitsu 2D cartoon aesthetic.
 */
(function () {
  'use strict';

  const STAGE_W = 800;
  const STAGE_H = 280;
  const OUTLINE = 0x1e2433;
  const OUTLINE_WOOD = 0x241b16;

  const FALLBACK_BELTS = {
    white: { color: '#f8fafc', shadow: '#cbd5e1' },
    yellow: { color: '#facc15', shadow: '#ca8a04' },
    blue: { color: '#3b82f6', shadow: '#1d4ed8' },
    red: { color: '#ef4444', shadow: '#b91c1c' },
    black: { color: '#1e293b', shadow: '#090d16' },
    gold: { color: '#fbbf24', shadow: '#b45309' }
  };

  const SUIT_NAME_MAP = {
    suit_shadow: '#1e293b',
    suit_crimson: '#dc2626',
    suit_sapphire: '#2563eb',
    suit_cyan: '#0891b2',
    suit_jade: '#16a34a',
    suit_amethyst: '#7c3aed',
    suit_magma: '#ea580c',
    suit_white: '#e2e8f0'
  };

  function hexToInt(hex, fallback = 0x1e293b) {
    if (typeof hex === 'number' && !Number.isNaN(hex)) return hex;
    if (typeof hex !== 'string') return fallback;
    const clean = hex.trim().replace(/^#/, '');
    if (clean.length === 3) {
      const exp = clean.split('').map((c) => c + c).join('');
      const val = parseInt(exp, 16);
      return Number.isNaN(val) ? fallback : val;
    }
    if (clean.length === 6) {
      const val = parseInt(clean, 16);
      return Number.isNaN(val) ? fallback : val;
    }
    return fallback;
  }

  function shadeInt(colorInt, delta) {
    const r = Math.min(255, Math.max(0, ((colorInt >> 16) & 0xff) + delta));
    const g = Math.min(255, Math.max(0, ((colorInt >> 8) & 0xff) + delta));
    const b = Math.min(255, Math.max(0, (colorInt & 0xff) + delta));
    return (r << 16) | (g << 8) | b;
  }

  function normalizeNinjaConfig(raw = {}) {
    const cfg = raw || {};
    const belts = (window.EKGameConfig && window.EKGameConfig.BELTS) || [];
    const beltKey = String(cfg.belt || 'white').replace(/^belt_/, '');
    const beltEntry = belts.find((b) => b.id === beltKey) || FALLBACK_BELTS[beltKey] || FALLBACK_BELTS.white;

    const suitHex = cfg.suitColor || SUIT_NAME_MAP[cfg.suit] || '#1e293b';
    const maskHex = cfg.maskColor || '#0f172a';

    return {
      suitInt: hexToInt(suitHex, 0x1e293b),
      maskInt: hexToInt(maskHex, 0x0f172a),
      beltInt: hexToInt(beltEntry.color, 0xf8fafc),
      beltShadowInt: hexToInt(beltEntry.shadow, 0xcbd5e1),
      weapon: String(cfg.weapon || 'katana').replace(/^wpn_/, ''),
      headgear: String(cfg.headgear || 'none'),
      eyes: String(cfg.eyes || 'amber'),
      aura: String(cfg.aura || 'none').replace(/^aura_/, ''),
      pet: String(cfg.pet || 'none')
    };
  }

  function quadPoints(x0, y0, cx, cy, x1, y1, steps = 7) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      pts.push({
        x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
        y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1
      });
    }
    return pts;
  }

  function fillPolyPoints(g, pts, fillCol, strokeCol = OUTLINE, strokeW = 2.5, alpha = 1) {
    if (!pts || pts.length < 3) return;
    g.fillStyle(fillCol, alpha);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath();
    g.fillPath();
    if (strokeW > 0) {
      g.lineStyle(strokeW, strokeCol, alpha);
      g.strokePath();
    }
  }

  function buildDojoBackdrop(scene, accentHex) {
    const root = scene.add.container(0, 0);
    const accentInt = hexToInt(accentHex, 0x38bdf8);

    // Optional future approved WebP backdrop override
    if (scene.textures.exists('dojo_backdrop')) {
      const bgImg = scene.add.image(STAGE_W / 2, STAGE_H / 2, 'dojo_backdrop');
      bgImg.setDisplaySize(STAGE_W, STAGE_H);
      root.add(bgImg);
    }

    const wall = scene.add.graphics();
    // Cream shoji paper walls
    wall.fillStyle(0xf3ebd9, 1);
    wall.fillRect(0, 0, STAGE_W, 186);
    wall.fillStyle(0xe8dcc4, 1);
    wall.fillRect(0, 146, STAGE_W, 40);

    // Left & right shoji sliding paper panels
    const drawShojiPanel = (px, py, pw, ph) => {
      wall.fillStyle(0xf8f2e4, 1);
      wall.fillRoundedRect(px, py, pw, ph, 4);
      wall.lineStyle(3, 0x7d5837, 1);
      wall.strokeRoundedRect(px, py, pw, ph, 4);
      wall.lineStyle(1.5, 0xd8c9ad, 1);
      for (let c = 1; c < 3; c++) {
        const lx = px + (pw / 3) * c;
        wall.lineBetween(lx, py + 2, lx, py + ph - 2);
      }
      for (let r = 1; r < 3; r++) {
        const ly = py + (ph / 3) * r;
        wall.lineBetween(px + 2, ly, px + pw - 2, ly);
      }
    };
    drawShojiPanel(28, 22, 174, 148);
    drawShojiPanel(598, 22, 174, 148);

    // Central calm window sky & distant snowy mountain hills (Anime / Club-Penguin-Dojo mountain sanctuary)
    const winX = 248;
    const winY = 20;
    const winW = 304;
    const winH = 144;
    wall.fillStyle(0xb9d9ee, 1);
    wall.fillRect(winX, winY, winW, winH);
    wall.fillStyle(0xd2e8f6, 0.9);
    wall.fillRect(winX, winY + 52, winW, winH - 52);
    wall.fillStyle(0xfef3c7, 0.45);
    wall.fillRect(winX, winY + 100, winW, winH - 100);

    // Warm golden-amber sun/moon halo disc behind the snow-capped Mount Fuji peak
    wall.fillStyle(0xfef08a, 0.28);
    wall.fillCircle(winX + 162, winY + 64, 44);
    wall.fillStyle(0xfde047, 0.45);
    wall.fillCircle(winX + 162, winY + 64, 33);
    wall.fillStyle(0xfbbf24, 0.85);
    wall.fillCircle(winX + 162, winY + 64, 23);
    wall.lineStyle(1.5, 0xfef9c3, 0.8);
    wall.strokeCircle(winX + 162, winY + 64, 23);

    // Soft distant pastel mountains + snow-capped Mount Fuji sanctuary peak
    fillPolyPoints(wall, [
      { x: winX, y: winY + winH },
      { x: winX + 58, y: winY + 72 },
      { x: winX + 122, y: winY + winH }
    ], 0x9ec0d8, 0x7c9fb8, 1.5);
    fillPolyPoints(wall, [
      { x: winX + 43, y: winY + 90 },
      { x: winX + 58, y: winY + 72 },
      { x: winX + 75, y: winY + 90 },
      { x: winX + 64, y: winY + 86 },
      { x: winX + 53, y: winY + 88 }
    ], 0xf8fafc, 0, 0);

    // Central Mount Fuji sanctuary peak
    fillPolyPoints(wall, [
      { x: winX + 76, y: winY + winH },
      { x: winX + 150, y: winY + 48 },
      { x: winX + 174, y: winY + 48 },
      { x: winX + 248, y: winY + winH }
    ], 0x7c9eb8, 0x5c7f99, 1.8);
    fillPolyPoints(wall, [
      { x: winX + 131, y: winY + 80 },
      { x: winX + 150, y: winY + 48 },
      { x: winX + 174, y: winY + 48 },
      { x: winX + 193, y: winY + 80 },
      { x: winX + 177, y: winY + 73 },
      { x: winX + 162, y: winY + 82 },
      { x: winX + 146, y: winY + 73 }
    ], 0xffffff, 0, 0);

    fillPolyPoints(wall, [
      { x: winX + 190, y: winY + winH },
      { x: winX + 252, y: winY + 74 },
      { x: winX + winW, y: winY + winH }
    ], 0xa6c6dc, 0x7c9fb8, 1.5);
    fillPolyPoints(wall, [
      { x: winX + 236, y: winY + 91 },
      { x: winX + 252, y: winY + 74 },
      { x: winX + 269, y: winY + 91 },
      { x: winX + 252, y: winY + 87 }
    ], 0xf8fafc, 0, 0);

    // Soft layered pine tree silhouettes along the window horizon
    const drawPine = (px, py, sc, col) => {
      fillPolyPoints(wall, [
        { x: px, y: py - 18 * sc },
        { x: px - 7 * sc, y: py - 7 * sc },
        { x: px + 7 * sc, y: py - 7 * sc }
      ], col, 0, 0, 0.88);
      fillPolyPoints(wall, [
        { x: px, y: py - 12 * sc },
        { x: px - 9 * sc, y: py },
        { x: px + 9 * sc, y: py }
      ], col, 0, 0, 0.92);
    };
    // Distant mist layer
    [262, 278, 296, 322, 344, 458, 480, 504, 526, 540].forEach((tx, idx) => {
      drawPine(tx, winY + winH, 0.78 + (idx % 3) * 0.14, 0x62829c);
    });
    // Closer pine tree ridge silhouette
    [256, 270, 286, 308, 492, 514, 532, 545].forEach((tx, idx) => {
      drawPine(tx, winY + winH + 1, 0.92 + (idx % 2) * 0.18, 0x456178);
    });

    root.add(wall);

    // Fluffy drifting clouds & 10 gently drifting pink cherry-blossom (sakura) petals inside central window (clipped via mask)
    const cloudGroup = scene.add.container(0, 0);
    const maskG = scene.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff);
    maskG.fillRect(winX, winY, winW, winH);
    cloudGroup.setMask(maskG.createGeometryMask());

    const makeCloud = (cx, cy, sc) => {
      const cg = scene.add.graphics();
      cg.fillStyle(0xffffff, 0.94);
      cg.fillCircle(0, 0, 14 * sc);
      cg.fillCircle(14 * sc, -4 * sc, 17 * sc);
      cg.fillCircle(30 * sc, 0, 13 * sc);
      cg.fillRoundedRect(-12 * sc, 0, 54 * sc, 13 * sc, 6 * sc);
      cg.setPosition(cx, cy);
      cloudGroup.add(cg);
      return cg;
    };
    const c1 = makeCloud(296, 52, 0.92);
    const c2 = makeCloud(456, 42, 0.76);
    scene.tweens.add({
      targets: c1,
      x: c1.x + 28,
      duration: 6500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    scene.tweens.add({
      targets: c2,
      x: c2.x - 24,
      duration: 7800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 10 gently drifting pink cherry-blossom (sakura) petals across the window
    for (let i = 0; i < 10; i++) {
      const startX = winX + 18 + ((i * 29) % (winW - 36));
      const startY = winY + 12 + ((i * 17) % (winH - 34));
      const petal = scene.add.graphics();
      const pCol = i % 2 === 0 ? 0xf9a8d4 : 0xf472b6;
      petal.fillStyle(pCol, 0.9);
      petal.fillEllipse(0, 0, 6.2, 3.6);
      petal.fillStyle(0xfce7f3, 0.75);
      petal.fillEllipse(-1, -0.5, 2.8, 1.6);
      petal.setPosition(startX, startY);
      petal.setAngle((i * 36) % 180);
      cloudGroup.add(petal);

      scene.tweens.add({
        targets: petal,
        x: startX + (i % 2 === 0 ? 34 : -32),
        y: startY + 26 + (i % 3) * 8,
        angle: petal.angle + (i % 2 === 0 ? 110 : -110),
        duration: 3800 + (i % 4) * 750,
        delay: i * 240,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    root.add(cloudGroup);

    // Window wood sill, vertical lattice bars, and dojo beams
    const beams = scene.add.graphics();
    beams.lineStyle(4, 0x5e3f25, 1);
    beams.strokeRect(winX, winY, winW, winH);
    beams.lineStyle(2, 0x241b16, 1);
    beams.strokeRect(winX - 2, winY - 2, winW + 4, winH + 4);
    beams.lineStyle(2, 0x7d5837, 0.85);
    beams.lineBetween(winX + 101, winY, winX + 101, winY + winH);
    beams.lineBetween(winX + 202, winY, winX + 202, winY + winH);

    // Top ceiling wood beam + side pillars with hanging dojo scrolls (kakemono)
    beams.fillStyle(0x7d5837, 1);
    beams.fillRect(0, 0, STAGE_W, 14);
    beams.fillStyle(0x5e3f25, 1);
    beams.fillRect(0, 10, STAGE_W, 4);
    beams.lineStyle(2.5, OUTLINE_WOOD, 1);
    beams.lineBetween(0, 14, STAGE_W, 14);

    [216, 570].forEach((bx, idx) => {
      beams.fillStyle(0x7d5837, 1);
      beams.fillRect(bx, 14, 16, 170);
      beams.fillStyle(0x5e3f25, 1);
      beams.fillRect(bx + 11, 14, 5, 170);
      beams.lineStyle(2, OUTLINE_WOOD, 1);
      beams.strokeRect(bx, 14, 16, 170);

      // Decorative vertical dojo scroll (kakemono) with golden rollers & elemental calligraphy crests
      const sx = bx - 3;
      const sy = 34;
      const sw = 22;
      const sh = 108;

      // Hanging cord & pin
      beams.fillStyle(0xfbbf24, 1);
      beams.fillCircle(bx + 8, sy - 7, 2.5);
      beams.lineStyle(1.5, 0xfbbf24, 0.9);
      beams.lineBetween(bx + 8, sy - 7, sx + 3, sy);
      beams.lineBetween(bx + 8, sy - 7, sx + sw - 3, sy);

      // Crimson-trimmed silk brocade backing & warm parchment inner scroll
      beams.fillStyle(0x991b1b, 1);
      beams.fillRoundedRect(sx, sy, sw, sh, 2);
      beams.lineStyle(1.8, OUTLINE_WOOD, 1);
      beams.strokeRoundedRect(sx, sy, sw, sh, 2);

      beams.fillStyle(0xfef3c7, 1);
      beams.fillRect(sx + 3, sy + 7, sw - 6, sh - 14);
      beams.lineStyle(1.2, 0xd97706, 0.8);
      beams.strokeRect(sx + 3, sy + 7, sw - 6, sh - 14);

      // Top & bottom golden rollers with end caps
      beams.fillStyle(0xfbbf24, 1);
      beams.fillRoundedRect(sx - 3, sy - 2, sw + 6, 5, 2);
      beams.fillRoundedRect(sx - 3, sy + sh - 3, sw + 6, 5, 2);
      beams.lineStyle(1.5, OUTLINE_WOOD, 1);
      beams.strokeRoundedRect(sx - 3, sy - 2, sw + 6, 5, 2);
      beams.strokeRoundedRect(sx - 3, sy + sh - 3, sw + 6, 5, 2);

      // Golden tassel under bottom roller
      beams.lineStyle(2, 0xf59e0b, 1);
      beams.lineBetween(bx + 8, sy + sh + 2, bx + 8, sy + sh + 11);

      // Elemental calligraphy crests inside the scroll (Fire / Water / Snow + floor accent)
      const cx = bx + 8;
      // Top floor crest disc
      beams.fillStyle(accentInt, 0.9);
      beams.fillCircle(cx, sy + 20, 4.5);
      beams.lineStyle(1.4, OUTLINE_WOOD, 1);
      beams.strokeCircle(cx, sy + 20, 4.5);

      // Calligraphy brush strokes (kanji / elemental motifs)
      beams.lineStyle(2.2, 0x1e2433, 0.88);
      beams.lineBetween(cx - 4, sy + 34, cx + 4, sy + 34);
      beams.lineBetween(cx, sy + 31, cx, sy + 44);
      beams.lineBetween(cx - 5, sy + 40, cx + 5, sy + 40);

      // Middle elemental symbol (Flame on left pillar, Wave/Snow on right pillar)
      const midCol = idx === 0 ? 0xdc2626 : 0x0284c7;
      beams.fillStyle(midCol, 0.9);
      beams.fillCircle(cx, sy + 58, 4.2);
      beams.lineStyle(1.8, 0x1e2433, 0.85);
      beams.lineBetween(cx - 4, sy + 71, cx + 4, sy + 71);
      beams.lineBetween(cx - 3, sy + 76, cx + 3, sy + 83);
      beams.lineBetween(cx + 3, sy + 76, cx - 3, sy + 83);
    });

    // Warm golden-tan tatami floor
    beams.fillStyle(0xd8b878, 1);
    beams.fillRect(0, 184, STAGE_W, 96);
    beams.fillStyle(0x7d5837, 1);
    beams.fillRect(0, 181, STAGE_W, 6);
    beams.lineStyle(2.5, 0x6e4e2e, 1);
    beams.lineBetween(0, 187, STAGE_W, 187);

    // Tatami perspective planks & woven border mat
    beams.lineStyle(2, 0xb58c4b, 0.75);
    beams.lineBetween(155, 187, 50, 280);
    beams.lineBetween(400, 187, 400, 280);
    beams.lineBetween(645, 187, 750, 280);

    beams.fillStyle(0xcfa962, 0.45);
    beams.fillRoundedRect(76, 198, 648, 70, 12);
    beams.lineStyle(3, 0xb58c4b, 0.9);
    beams.strokeRoundedRect(76, 198, 648, 70, 12);
    beams.lineStyle(1.5, 0x6e4e2e, 0.45);
    beams.strokeRoundedRect(82, 202, 636, 62, 9);

    // Crisp, detailed 3-element Dojo Crest on central tatami floor (med at 400, 233)
    const med = scene.add.graphics();
    med.setPosition(400, 233);
    // Outer golden-wood ring in perspective
    med.fillStyle(0xa87c3e, 0.34);
    med.fillEllipse(0, 0, 128, 50);
    med.lineStyle(2.6, 0x5e3f25, 0.52);
    med.strokeEllipse(0, 0, 128, 50);
    med.fillStyle(0xe5c88c, 0.42);
    med.fillEllipse(0, 0, 108, 41);
    med.lineStyle(2, 0x8b5a2b, 0.55);
    med.strokeEllipse(0, 0, 108, 41);

    // Decorative cardinal notches on the outer ring
    [-58, 58].forEach((nx) => {
      med.lineStyle(2, 0x5e3f25, 0.5);
      med.lineBetween(nx, -2, nx, 2);
    });
    [-21, 21].forEach((ny) => {
      med.lineStyle(2, 0x5e3f25, 0.5);
      med.lineBetween(-4, ny, 4, ny);
    });

    // Inner triskelion / triangle connecting Fire, Water, and Snow symbols in subtle warm tones
    med.lineStyle(1.8, 0x7d5837, 0.48);
    med.strokeTriangle(0, -13, -28, 8, 28, 8);
    med.fillStyle(0x6e4e2e, 0.35);
    med.fillCircle(0, 1, 4.5);

    // Top node: Fire symbol (warm terracotta crimson flame)
    med.fillStyle(0xc2410c, 0.48);
    med.fillEllipse(0, -11, 18, 9);
    med.lineStyle(1.5, 0x7c2d12, 0.55);
    med.strokeEllipse(0, -11, 18, 9);
    fillPolyPoints(med, [
      { x: 0, y: -15 },
      { x: 4, y: -10 },
      { x: 0, y: -8 },
      { x: -4, y: -10 }
    ], 0xfde047, 0x7c2d12, 1, 0.65);

    // Bottom-Left node: Water symbol (warm teal-indigo wave droplet)
    med.fillStyle(0x0369a1, 0.42);
    med.fillEllipse(-26, 7, 18, 9);
    med.lineStyle(1.5, 0x0c4a6e, 0.5);
    med.strokeEllipse(-26, 7, 18, 9);
    fillPolyPoints(med, [
      { x: -26, y: 3 },
      { x: -22, y: 8 },
      { x: -26, y: 10 },
      { x: -30, y: 8 }
    ], 0x7dd3fc, 0x0c4a6e, 1, 0.65);

    // Bottom-Right node: Snow symbol (warm frosty gold-ivory crystal)
    med.fillStyle(0x475569, 0.38);
    med.fillEllipse(26, 7, 18, 9);
    med.lineStyle(1.5, 0x334155, 0.5);
    med.strokeEllipse(26, 7, 18, 9);
    med.lineStyle(1.6, 0xf8fafc, 0.72);
    med.lineBetween(21, 7, 31, 7);
    med.lineBetween(26, 3.5, 26, 10.5);

    root.add(beams);
    root.add(med);

    // Hanging round paper lanterns with sinusoidal sway tween
    const makeLantern = (lx, phaseDelay) => {
      const lc = scene.add.container(lx, 14);
      const lg = scene.add.graphics();
      lg.fillStyle(0xfae1a8, 0.25);
      lg.fillCircle(0, 32, 30);
      lg.lineStyle(2.5, OUTLINE_WOOD, 1);
      lg.lineBetween(0, 0, 0, 12);
      // Lantern paper body
      lg.fillStyle(0xe87454, 1);
      lg.fillEllipse(0, 30, 32, 34);
      lg.fillStyle(0xfae1a8, 0.65);
      lg.fillEllipse(-3, 28, 16, 22);
      lg.lineStyle(2.5, OUTLINE_WOOD, 1);
      lg.strokeEllipse(0, 30, 32, 34);
      // Paper ribs
      lg.lineStyle(1.4, 0x9c3e26, 0.55);
      lg.lineBetween(-14, 24, 14, 24);
      lg.lineBetween(-15, 31, 15, 31);
      lg.lineBetween(-13, 38, 13, 38);
      // Wooden caps + tassel
      lg.fillStyle(0x5e3f25, 1);
      lg.fillRoundedRect(-9, 10, 18, 5, 2);
      lg.fillRoundedRect(-9, 45, 18, 5, 2);
      lg.lineStyle(2, OUTLINE_WOOD, 1);
      lg.strokeRoundedRect(-9, 10, 18, 5, 2);
      lg.strokeRoundedRect(-9, 45, 18, 5, 2);
      lg.lineStyle(2.5, 0xd95338, 1);
      lg.lineBetween(0, 50, 0, 59);
      lc.add(lg);
      scene.tweens.add({
        targets: lc,
        angle: { from: -4, to: 4 },
        duration: 2400,
        delay: phaseDelay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      root.add(lc);
    };
    makeLantern(268, 0);
    makeLantern(532, 950);

    return root;
  }

  function drawPetGraphic(g, petType) {
    g.clear();
    if (!petType || petType === 'none') return;

    // Soft pet floor shadow
    g.fillStyle(0x3e2d1d, 0.22);
    g.fillEllipse(0, 16, 26, 8);

    if (petType === 'kitsune') {
      // Bushy tail
      g.fillStyle(0xfb923c, 1);
      g.fillEllipse(-11, 2, 16, 12);
      g.lineStyle(2.4, OUTLINE, 1);
      g.strokeEllipse(-11, 2, 16, 12);
      g.fillStyle(0xfef3c7, 1);
      g.fillCircle(-15, 0, 4);
      // Rounded fox body/head
      g.fillStyle(0xf97316, 1);
      g.fillCircle(0, 2, 12);
      g.lineStyle(2.5, OUTLINE, 1);
      g.strokeCircle(0, 2, 12);
      // Ears
      fillPolyPoints(g, [{ x: -9, y: -6 }, { x: -7, y: -17 }, { x: -1, y: -9 }], 0xf97316, OUTLINE, 2.2);
      fillPolyPoints(g, [{ x: 1, y: -9 }, { x: 7, y: -17 }, { x: 9, y: -6 }], 0xf97316, OUTLINE, 2.2);
      // Cute cheeks & eyes
      g.fillStyle(0xfef3c7, 1);
      g.fillEllipse(2, 6, 14, 9);
      g.fillStyle(OUTLINE, 1);
      g.fillCircle(-2, 1, 2);
      g.fillCircle(6, 1, 2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-2.6, 0.4, 0.8);
      g.fillCircle(5.4, 0.4, 0.8);
    } else if (petType === 'axolotl') {
      // Side gills
      g.lineStyle(3, 0xdb2777, 1);
      g.lineBetween(-11, -2, -18, -6);
      g.lineBetween(-11, 2, -19, 2);
      g.lineBetween(11, -2, 18, -6);
      g.lineBetween(11, 2, 19, 2);
      // Chubby pink body
      g.fillStyle(0xf472b6, 1);
      g.fillEllipse(0, 2, 24, 20);
      g.lineStyle(2.5, OUTLINE, 1);
      g.strokeEllipse(0, 2, 24, 20);
      g.fillStyle(0xfbcfe8, 1);
      g.fillEllipse(1, 5, 14, 9);
      g.fillStyle(OUTLINE, 1);
      g.fillCircle(-3, 0, 2);
      g.fillCircle(5, 0, 2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-3.6, -0.6, 0.8);
      g.fillCircle(4.4, -0.6, 0.8);
    } else if (petType === 'shiba') {
      g.fillStyle(0xeab308, 1);
      g.fillCircle(0, 2, 12.5);
      g.lineStyle(2.5, OUTLINE, 1);
      g.strokeCircle(0, 2, 12.5);
      fillPolyPoints(g, [{ x: -9, y: -6 }, { x: -8, y: -16 }, { x: -1, y: -9 }], 0xca8a04, OUTLINE, 2.2);
      fillPolyPoints(g, [{ x: 1, y: -9 }, { x: 8, y: -16 }, { x: 9, y: -6 }], 0xca8a04, OUTLINE, 2.2);
      g.fillStyle(0xfef9c3, 1);
      g.fillEllipse(2, 6, 16, 10);
      g.fillStyle(OUTLINE, 1);
      g.fillCircle(-2, 0, 2);
      g.fillCircle(6, 0, 2);
      g.fillCircle(2, 4, 2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-2.5, -0.6, 0.8);
      g.fillCircle(5.5, -0.6, 0.8);
    } else if (petType === 'penguin') {
      g.fillStyle(0x0284c7, 1);
      g.fillEllipse(0, 2, 24, 26);
      g.lineStyle(2.5, OUTLINE, 1);
      g.strokeEllipse(0, 2, 24, 26);
      g.fillStyle(0xf8fafc, 1);
      g.fillEllipse(2, 4, 15, 18);
      // Cute red ninja headband on penguin
      g.fillStyle(0xef4444, 1);
      g.fillRoundedRect(-11, -8, 22, 5, 2);
      g.lineStyle(1.8, OUTLINE, 1);
      g.strokeRoundedRect(-11, -8, 22, 5, 2);
      // Orange beak & eyes
      fillPolyPoints(g, [{ x: 0, y: 1 }, { x: 7, y: 3 }, { x: 0, y: 6 }], 0xfbbf24, OUTLINE, 1.8);
      g.fillStyle(OUTLINE, 1);
      g.fillCircle(-2, -2, 2);
      g.fillCircle(5, -2, 2);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(-2.5, -2.6, 0.8);
      g.fillCircle(4.5, -2.6, 0.8);
    } else if (petType === 'dragon') {
      // Cute mini wings
      fillPolyPoints(g, [{ x: -8, y: 0 }, { x: -19, y: -11 }, { x: -12, y: 6 }], 0xa855f7, OUTLINE, 2);
      g.fillStyle(0x7e22ce, 1);
      g.fillCircle(0, 2, 12);
      g.lineStyle(2.5, OUTLINE, 1);
      g.strokeCircle(0, 2, 12);
      fillPolyPoints(g, [{ x: -6, y: -8 }, { x: -10, y: -17 }, { x: -2, y: -10 }], 0xfbbf24, OUTLINE, 1.8);
      fillPolyPoints(g, [{ x: 2, y: -10 }, { x: 10, y: -17 }, { x: 6, y: -8 }], 0xfbbf24, OUTLINE, 1.8);
      g.fillStyle(0xfde047, 1);
      g.fillCircle(-2, 0, 2.4);
      g.fillCircle(6, 0, 2.4);
      g.fillStyle(OUTLINE, 1);
      g.fillCircle(-1.8, 0, 1);
      g.fillCircle(6.2, 0, 1);
    }
  }

  function buildNinjaFighter(scene, rawCfg, isFlipped = false, x = 112, y = 174) {
    const cfg = normalizeNinjaConfig(rawCfg);
    const facingDir = isFlipped ? -1 : 1;
    const suitLight = shadeInt(cfg.suitInt, 32);
    const suitLapel = shadeInt(cfg.suitInt, 28);
    const suitDark = shadeInt(cfg.suitInt, -28);
    const maskLight = shadeInt(cfg.maskInt, 24);

    const root = scene.add.container(x, y);
    root.setScale(facingDir, 1);

    // Clean soft shadow on tatami
    const shadow = scene.add.ellipse(0, 41, 68, 15, 0x3e2d1d, 0.26);
    root.add(shadow);

    // Bouncing companion pet beside ninja
    const petBox = scene.add.container(-46, 25);
    const petG = scene.add.graphics();
    drawPetGraphic(petG, cfg.pet);
    petBox.add(petG);
    root.add(petBox);

    if (cfg.pet && cfg.pet !== 'none') {
      scene.tweens.add({
        targets: petBox,
        y: 19,
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const anim = scene.add.container(0, 0);
    root.add(anim);

    // Subtle elemental aura ring (auraG) on the tatami beneath the ninja's feet + floating aura particles
    const auraG = scene.add.graphics();
    anim.add(auraG);
    const auraColors = {
      fire: [0xf97316, 0xfbbf24, 0xfef08a],
      water: [0x38bdf8, 0x60a5fa, 0xe0f2fe],
      snow: [0xbae6fd, 0xe0f2fe, 0xffffff],
      lightning: [0xc084fc, 0xfde047, 0xe9d5ff]
    }[cfg.aura] || null;
    const ringBaseCol = auraColors ? auraColors[0] : cfg.beltInt;
    const drawBaseAuraRing = (pulse = 0) => {
      const rx = 64 + Math.sin(pulse) * 3;
      const ry = 15 + Math.sin(pulse) * 1.2;
      auraG.fillStyle(ringBaseCol, auraColors ? 0.16 : 0.1);
      auraG.fillEllipse(0, 39, rx + 8, ry + 3);
      auraG.lineStyle(2, ringBaseCol, auraColors ? 0.55 : 0.35);
      auraG.strokeEllipse(0, 39, rx, ry);
      auraG.lineStyle(1.2, 0xffffff, auraColors ? 0.45 : 0.22);
      auraG.strokeEllipse(0, 39, rx - 10, ry - 3);
    };
    drawBaseAuraRing(0);

    const auraParts = auraColors
      ? Array.from({ length: 10 }, (_, i) => ({
          baseX: -24 + ((i * 11) % 48),
          y: -38 + ((i * 15) % 72),
          r: 2.2 + (i % 3) * 1.1,
          vy: cfg.aura === 'snow' ? 18 + (i % 3) * 6 : -(20 + (i % 3) * 7),
          phase: i * 0.7,
          col: auraColors[i % auraColors.length]
        }))
      : [];

    // Back weapon
    const backWeaponG = scene.add.graphics();
    if (cfg.weapon === 'katana') {
      const k = scene.add.graphics();
      k.fillStyle(0x334155, 1);
      k.fillRoundedRect(-4, -36, 6, 50, 3);
      k.lineStyle(2.5, OUTLINE, 1);
      k.strokeRoundedRect(-4, -36, 6, 50, 3);
      k.fillStyle(0xfbbf24, 1);
      k.fillRoundedRect(-7, -21, 12, 4, 2);
      k.lineStyle(2, OUTLINE, 1);
      k.strokeRoundedRect(-7, -21, 12, 4, 2);
      k.fillStyle(0xef4444, 1);
      k.fillRoundedRect(-3.5, -36, 5, 14, 2);
      k.setPosition(-13, -8);
      k.setAngle(-26);
      anim.add(k);
    } else if (cfg.weapon === 'staff') {
      const s = scene.add.graphics();
      s.fillStyle(0x8b5a2b, 1);
      s.fillRoundedRect(-3, -44, 6, 84, 3);
      s.lineStyle(2.5, OUTLINE, 1);
      s.strokeRoundedRect(-3, -44, 6, 84, 3);
      s.fillStyle(0xfbbf24, 1);
      s.fillRoundedRect(-3, -44, 6, 9, 2);
      s.fillRoundedRect(-3, 31, 6, 9, 2);
      s.fillStyle(0xe87454, 1);
      s.fillRect(-3, -6, 6, 12);
      s.setPosition(-14, -2);
      s.setAngle(-16);
      anim.add(s);
    } else if (cfg.weapon === 'scroll') {
      const sc = scene.add.graphics();
      sc.fillStyle(0xfde68a, 1);
      sc.fillRoundedRect(-22, -7, 44, 14, 5);
      sc.lineStyle(2.5, OUTLINE, 1);
      sc.strokeRoundedRect(-22, -7, 44, 14, 5);
      sc.fillStyle(0xef4444, 1);
      sc.fillRoundedRect(-25, -8, 6, 16, 2);
      sc.fillRoundedRect(19, -8, 6, 16, 2);
      sc.lineStyle(2, OUTLINE, 1);
      sc.strokeRoundedRect(-25, -8, 6, 16, 2);
      sc.strokeRoundedRect(19, -8, 6, 16, 2);
      sc.fillStyle(0xdc2626, 1);
      sc.fillRect(-2, -7, 4, 14);
      sc.setPosition(-6, 4);
      sc.setAngle(-18);
      anim.add(sc);
    }
    anim.add(backWeaponG);

    // Dynamic knotted headband (hachimaki) with twin flowing ribbon tails behind the head (redrawn at 60fps)
    const tailsG = scene.add.graphics();
    anim.add(tailsG);

    // Martial arts hakama trousers, shin wraps & tabi boots
    const legsG = scene.add.graphics();
    legsG.fillStyle(suitDark, 1);
    legsG.fillRoundedRect(-18, 17, 13, 19, 5);
    legsG.lineStyle(2.8, OUTLINE, 1);
    legsG.strokeRoundedRect(-18, 17, 13, 19, 5);

    legsG.fillStyle(cfg.suitInt, 1);
    legsG.fillRoundedRect(5, 17, 13, 19, 5);
    legsG.lineStyle(2.8, OUTLINE, 1);
    legsG.strokeRoundedRect(5, 17, 13, 19, 5);

    // Shinobi ankle wraps
    legsG.lineStyle(1.8, suitLapel, 0.85);
    legsG.lineBetween(-16, 29, -7, 29);
    legsG.lineBetween(7, 29, 16, 29);

    // Tabi martial-arts boots
    legsG.fillStyle(0x2b3347, 1);
    legsG.fillEllipse(-11, 36, 18, 10);
    legsG.lineStyle(2.8, OUTLINE, 1);
    legsG.strokeEllipse(-11, 36, 18, 10);
    legsG.fillEllipse(12, 36, 18, 10);
    legsG.strokeEllipse(12, 36, 18, 10);
    anim.add(legsG);

    // Back arm with defined shoulder pad/sleeve + bracer + gloved fist
    const backArmG = scene.add.graphics();
    // Shoulder sleeve cap
    fillPolyPoints(backArmG, [
      { x: -16, y: -4 },
      { x: -29, y: 1 },
      { x: -27, y: 11 },
      { x: -15, y: 8 }
    ], suitLapel, OUTLINE, 2.6);
    // Forearm & bracer
    backArmG.fillStyle(suitDark, 1);
    backArmG.fillEllipse(-23, 13, 12, 16);
    backArmG.lineStyle(2.8, OUTLINE, 1);
    backArmG.strokeEllipse(-23, 13, 12, 16);
    backArmG.fillStyle(cfg.maskInt, 1);
    backArmG.fillCircle(-24, 20, 5.5);
    backArmG.lineStyle(2.5, OUTLINE, 1);
    backArmG.strokeCircle(-24, 20, 5.5);
    anim.add(backArmG);

    // Well-defined martial-arts Gi tunic with V-neck lapel collar (shadeInt(cfg.suitInt, 28)), shoulder pads/sleeves, and crisp dark outlines
    const torsoG = scene.add.graphics();
    // Lower gi skirt flare below belt
    fillPolyPoints(torsoG, [
      { x: -20, y: 16 },
      { x: 20, y: 16 },
      { x: 24, y: 28 },
      { x: -24, y: 28 }
    ], suitDark, OUTLINE, 2.8);

    // Main structured gi torso
    torsoG.fillStyle(cfg.suitInt, 1);
    torsoG.fillRoundedRect(-21, -6, 42, 28, 10);
    torsoG.fillStyle(suitLight, 0.55);
    torsoG.fillEllipse(-8, 5, 14, 16);
    torsoG.lineStyle(3, OUTLINE, 1);
    torsoG.strokeRoundedRect(-21, -6, 42, 28, 10);

    // Inner dark undershirt at neck V-opening
    fillPolyPoints(torsoG, [
      { x: -8, y: -5 },
      { x: 10, y: -5 },
      { x: 2, y: 8 }
    ], 0x0f172a, OUTLINE, 1.8);

    // Crisp V-neck lapel collar (shadeInt(cfg.suitInt, 28)) wrapping across chest
    fillPolyPoints(torsoG, [
      { x: -13, y: -5 },
      { x: -7, y: -5 },
      { x: 5, y: 12 },
      { x: 0, y: 14 }
    ], suitLapel, OUTLINE, 2.2);
    fillPolyPoints(torsoG, [
      { x: 13, y: -5 },
      { x: 7, y: -5 },
      { x: -6, y: 14 },
      { x: 0, y: 14 }
    ], suitLapel, OUTLINE, 2.2);

    // Left & right structured gi shoulder wing trims
    fillPolyPoints(torsoG, [
      { x: -22, y: -6 },
      { x: -12, y: -6 },
      { x: -16, y: 5 },
      { x: -24, y: 2 }
    ], suitLapel, OUTLINE, 2.4);
    fillPolyPoints(torsoG, [
      { x: 12, y: -6 },
      { x: 22, y: -6 },
      { x: 24, y: 2 },
      { x: 16, y: 5 }
    ], suitLapel, OUTLINE, 2.4);

    // Obi belt + center knot + dangling ends
    torsoG.fillStyle(cfg.beltInt, 1);
    torsoG.fillRoundedRect(-22, 13, 44, 8, 4);
    torsoG.fillStyle(cfg.beltShadowInt, 0.85);
    torsoG.fillRect(-20, 18, 40, 3);
    torsoG.lineStyle(2.6, OUTLINE, 1);
    torsoG.strokeRoundedRect(-22, 13, 44, 8, 4);

    // Dangling belt tails
    fillPolyPoints(torsoG, [
      { x: -1, y: 20 },
      { x: -7, y: 34 },
      { x: -1, y: 35 },
      { x: 4, y: 21 }
    ], cfg.beltShadowInt, OUTLINE, 2.2);
    fillPolyPoints(torsoG, [
      { x: 5, y: 20 },
      { x: 12, y: 35 },
      { x: 6, y: 36 },
      { x: 2, y: 21 }
    ], cfg.beltInt, OUTLINE, 2.2);

    // Belt knot
    torsoG.fillStyle(cfg.beltInt, 1);
    torsoG.fillRoundedRect(-2, 12, 10, 10, 3.5);
    torsoG.lineStyle(2.5, OUTLINE, 1);
    torsoG.strokeRoundedRect(-2, 12, 10, 10, 3.5);
    anim.add(torsoG);

    // Pro-grade Chibi-Anime / Sensei Martial Artist Head + Sleek Angled Mask Visor Opening + Hachimaki Headband
    const headG = scene.add.graphics();
    // Hood cowl & sculpted anime head silhouette
    headG.fillStyle(cfg.suitInt, 1);
    headG.fillEllipse(0, -20, 48, 42);
    headG.fillStyle(suitLight, 0.72);
    headG.fillEllipse(-7, -33, 22, 9);
    headG.lineStyle(3, OUTLINE, 1);
    headG.strokeEllipse(0, -20, 48, 42);

    // Sleek, angled ninja mask visor opening (0xfde68a warm skin tone instead of a boxy white rectangle)
    fillPolyPoints(headG, [
      { x: -15, y: -23 },
      { x: 4, y: -25 },
      { x: 21, y: -22 },
      { x: 20, y: -11 },
      { x: 4, y: -9 },
      { x: -13, y: -11 }
    ], 0xfde68a, OUTLINE, 2.4);
    // Warm upper brow shadow inside visor
    fillPolyPoints(headG, [
      { x: -14, y: -22 },
      { x: 4, y: -24 },
      { x: 20, y: -21 },
      { x: 19, y: -19 },
      { x: 4, y: -21 },
      { x: -13, y: -19 }
    ], 0xf59e0b, 0, 0, 0.28);

    // Fitted ninja face mask with sculpted nose-bridge peak & cloth fold seam
    fillPolyPoints(headG, [
      { x: -20, y: -12 },
      { x: -4, y: -11 },
      { x: 4, y: -14 },
      { x: 14, y: -11 },
      { x: 22, y: -12 },
      { x: 20, y: -1 },
      { x: 2, y: 3 },
      { x: -18, y: -1 }
    ], cfg.maskInt, OUTLINE, 2.6);
    headG.lineStyle(1.8, maskLight, 0.78);
    headG.lineBetween(-12, -7, 4, -9);
    headG.lineBetween(4, -9, 16, -7);

    // Hachimaki headband wrapped tightly around forehead + metallic dojo emblem plate
    headG.fillStyle(cfg.beltInt, 1);
    headG.fillRoundedRect(-24, -30, 48, 8.5, 4);
    headG.fillStyle(cfg.beltShadowInt, 0.75);
    headG.fillRect(-22, -24, 44, 2.2);
    headG.lineStyle(2.5, OUTLINE, 1);
    headG.strokeRoundedRect(-24, -30, 48, 8.5, 4);

    // Metallic forehead protector plate (hitai-ate)
    headG.fillStyle(0xf1f5f9, 1);
    headG.fillRoundedRect(-5, -29, 17, 6.5, 2.5);
    headG.lineStyle(1.8, OUTLINE, 1);
    headG.strokeRoundedRect(-5, -29, 17, 6.5, 2.5);
    headG.fillStyle(0x38bdf8, 1);
    headG.fillCircle(3.5, -25.8, 1.6);

    // Headgear layer
    if (cfg.headgear === 'kasa') {
      fillPolyPoints(headG, [
        { x: -35, y: -29 },
        { x: 0, y: -50 },
        { x: 35, y: -29 },
        { x: 0, y: -26 }
      ], 0xeab308, OUTLINE, 2.8);
      headG.lineStyle(2.2, 0xfef3c7, 0.9);
      headG.lineBetween(-22, -31, 22, -31);
    } else if (cfg.headgear === 'oni') {
      fillPolyPoints(headG, [{ x: -16, y: -33 }, { x: -22, y: -48 }, { x: -8, y: -37 }], 0xef4444, OUTLINE, 2.4);
      fillPolyPoints(headG, [{ x: 10, y: -37 }, { x: 22, y: -48 }, { x: 16, y: -33 }], 0xef4444, OUTLINE, 2.4);
    } else if (cfg.headgear === 'neko') {
      fillPolyPoints(headG, [{ x: -19, y: -32 }, { x: -16, y: -47 }, { x: -5, y: -37 }], cfg.suitInt, OUTLINE, 2.5);
      fillPolyPoints(headG, [{ x: -16, y: -34 }, { x: -15, y: -43 }, { x: -8, y: -36 }], 0xf472b6, 0, 0);
      fillPolyPoints(headG, [{ x: 5, y: -37 }, { x: 16, y: -47 }, { x: 19, y: -32 }], cfg.suitInt, OUTLINE, 2.5);
      fillPolyPoints(headG, [{ x: 8, y: -36 }, { x: 15, y: -43 }, { x: 16, y: -34 }], 0xf472b6, 0, 0);
    } else if (cfg.headgear === 'crown') {
      fillPolyPoints(headG, [
        { x: -14, y: -37 },
        { x: -12, y: -49 },
        { x: -5, y: -42 },
        { x: 0, y: -51 },
        { x: 5, y: -42 },
        { x: 12, y: -49 },
        { x: 14, y: -37 }
      ], 0xfbbf24, OUTLINE, 2.4);
      headG.fillStyle(0xef4444, 1);
      headG.fillCircle(0, -42, 2.5);
    } else if (cfg.headgear === 'spiky') {
      fillPolyPoints(headG, [
        { x: -19, y: -33 },
        { x: -24, y: -46 },
        { x: -11, y: -40 },
        { x: -5, y: -52 },
        { x: 2, y: -41 },
        { x: 10, y: -51 },
        { x: 14, y: -39 },
        { x: 25, y: -45 },
        { x: 19, y: -33 }
      ], 0xfde047, OUTLINE, 2.4);
    }
    anim.add(headG);

    // Expressive angled anime/cartoon eyes with colored irises matching cfg.eyes, white specular catchlights, and determined angled eyebrows
    const eyesOpenG = scene.add.graphics();
    const eyesBlinkG = scene.add.graphics();
    if (cfg.eyes === 'cyber') {
      fillPolyPoints(eyesOpenG, [
        { x: -11, y: -20 },
        { x: 4, y: -18 },
        { x: 18, y: -20 },
        { x: 16, y: -13 },
        { x: 4, y: -12 },
        { x: -9, y: -13 }
      ], 0x06b6d4, 0xcffafe, 1.8);
      eyesOpenG.fillStyle(0xffffff, 0.95);
      eyesOpenG.fillCircle(-2, -16, 2);
      eyesOpenG.fillCircle(11, -16, 2);
    } else {
      const irisCol =
        cfg.eyes === 'sharingan' ? 0xef4444 :
        cfg.eyes === 'ice' ? 0x38bdf8 :
        cfg.eyes === 'dragon' ? 0xf59e0b :
        cfg.eyes === 'amber' ? 0xd97706 : 0x1e2433;
      [
        { ex: -3.5, ey: -16, isLeft: true },
        { ex: 11.5, ey: -16, isLeft: false }
      ].forEach(({ ex, ey, isLeft }) => {
        // Crisp anime eye sclera
        eyesOpenG.fillStyle(0xffffff, 1);
        eyesOpenG.fillEllipse(ex, ey, 9.5, 8.8);
        eyesOpenG.lineStyle(1.8, OUTLINE, 1);
        eyesOpenG.strokeEllipse(ex, ey, 9.5, 8.8);

        // Colored iris matching cfg.eyes
        eyesOpenG.fillStyle(irisCol, 1);
        eyesOpenG.fillCircle(ex + 0.7, ey + 0.2, 3.4);

        // Deep pupil / dragon slit / sharingan ring
        eyesOpenG.fillStyle(OUTLINE, 1);
        if (cfg.eyes === 'dragon') {
          eyesOpenG.fillEllipse(ex + 0.7, ey + 0.2, 1.8, 5.2);
        } else {
          eyesOpenG.fillCircle(ex + 0.8, ey + 0.2, 1.7);
        }

        // Dual white specular catchlights for heroic anime expression
        eyesOpenG.fillStyle(0xffffff, 1);
        eyesOpenG.fillCircle(ex - 0.8, ey - 1.3, 1.45);
        eyesOpenG.fillCircle(ex + 1.8, ey + 1.2, 0.75);

        // Determined angled anime eyebrow above each eye
        if (isLeft) {
          fillPolyPoints(eyesOpenG, [
            { x: ex - 4.8, y: ey - 5.2 },
            { x: ex + 4.4, y: ey - 3.3 },
            { x: ex + 3.8, y: ey - 1.8 },
            { x: ex - 5.2, y: ey - 3.6 }
          ], OUTLINE, 0, 0);
        } else {
          fillPolyPoints(eyesOpenG, [
            { x: ex - 4.2, y: ey - 3.3 },
            { x: ex + 4.8, y: ey - 5.4 },
            { x: ex + 5.2, y: ey - 3.7 },
            { x: ex - 3.6, y: ey - 1.8 }
          ], OUTLINE, 0, 0);
        }
      });
    }
    // Determined closed blink arcs
    eyesBlinkG.lineStyle(2.4, OUTLINE, 1);
    eyesBlinkG.lineBetween(-8, -16, 0, -15);
    eyesBlinkG.lineBetween(7, -15, 16, -16);
    eyesBlinkG.setVisible(false);
    anim.add(eyesOpenG);
    anim.add(eyesBlinkG);

    // Front arm with defined shoulder pad/sleeve + bracer + front weapon
    const frontArmG = scene.add.graphics();
    fillPolyPoints(frontArmG, [
      { x: 15, y: -4 },
      { x: 28, y: 1 },
      { x: 26, y: 10 },
      { x: 14, y: 8 }
    ], suitLapel, OUTLINE, 2.6);
    frontArmG.fillStyle(suitLight, 1);
    frontArmG.fillEllipse(22, 12, 12, 16);
    frontArmG.lineStyle(2.8, OUTLINE, 1);
    frontArmG.strokeEllipse(22, 12, 12, 16);
    frontArmG.fillStyle(cfg.maskInt, 1);
    frontArmG.fillCircle(24, 18, 5.5);
    frontArmG.lineStyle(2.5, OUTLINE, 1);
    frontArmG.strokeCircle(24, 18, 5.5);
    anim.add(frontArmG);

    if (cfg.weapon === 'shuriken') {
      const sh = scene.add.graphics();
      fillPolyPoints(sh, [
        { x: 0, y: -9 }, { x: 2.5, y: -2.5 },
        { x: 9, y: 0 }, { x: 2.5, y: 2.5 },
        { x: 0, y: 9 }, { x: -2.5, y: 2.5 },
        { x: -9, y: 0 }, { x: -2.5, y: -2.5 }
      ], 0xe2e8f0, OUTLINE, 2.2);
      sh.fillStyle(0x38bdf8, 1);
      sh.fillCircle(0, 0, 2.4);
      sh.setPosition(28, 12);
      anim.add(sh);
    } else if (cfg.weapon === 'kunai') {
      const ku = scene.add.graphics();
      fillPolyPoints(ku, [
        { x: 0, y: -12 }, { x: 4.5, y: -2 }, { x: 0, y: 2 }, { x: -4.5, y: -2 }
      ], 0xf8fafc, OUTLINE, 2.2);
      ku.fillStyle(0xef4444, 1);
      ku.fillRect(-1.5, 2, 3, 6);
      ku.lineStyle(2, 0xfbbf24, 1);
      ku.strokeCircle(0, 10, 2.6);
      ku.setPosition(28, 10);
      ku.setAngle(42);
      anim.add(ku);
    }

    let breathTween = null;
    const startIdleBreath = () => {
      if (breathTween) {
        breathTween.stop();
        breathTween = null;
      }
      anim.setScale(1, 1);
      anim.setPosition(0, 0);
      anim.setAngle(0);
      breathTween = scene.tweens.add({
        targets: anim,
        scaleY: 0.96,
        scaleX: 1.03,
        y: 1.6,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    };

    const stopIdleBreath = () => {
      if (breathTween) {
        breathTween.stop();
        breathTween = null;
      }
      anim.setScale(1, 1);
      anim.setPosition(0, 0);
      anim.setAngle(0);
    };

    const updateHeadband = (t) => {
      tailsG.clear();
      const wave1 = Math.sin(t * 0.0055 + (facingDir < 0 ? 1.5 : 0)) * 5.5;
      const wave2 = Math.cos(t * 0.0048 + (facingDir < 0 ? 1.5 : 0)) * 4.5;

      // Twin flowing ribbon tails behind the head
      const top1 = quadPoints(-23, -27, -36, -31 + wave1 * 0.6, -48, -23 + wave1, 6);
      const bot1 = quadPoints(-22, -22, -34, -25 + wave1 * 0.6, -45, -17 + wave1, 6).reverse();
      fillPolyPoints(tailsG, top1.concat(bot1), cfg.beltInt, OUTLINE, 2.2);

      const top2 = quadPoints(-23, -23, -33, -20 + wave2 * 0.6, -42, -11 + wave2, 6);
      const bot2 = quadPoints(-22, -19, -31, -16 + wave2 * 0.6, -38, -6 + wave2, 6).reverse();
      fillPolyPoints(tailsG, top2.concat(bot2), cfg.beltShadowInt, OUTLINE, 2);

      // Dynamic knotted hachimaki tie at the back of the head
      tailsG.fillStyle(cfg.beltInt, 1);
      tailsG.fillCircle(-23, -24.5, 4.8);
      tailsG.lineStyle(2.3, OUTLINE, 1);
      tailsG.strokeCircle(-23, -24.5, 4.8);
    };

    const updateAura = (dtSec, t) => {
      auraG.clear();
      drawBaseAuraRing(t * 0.0035);
      if (!auraParts.length) return;
      for (const p of auraParts) {
        p.y += p.vy * dtSec;
        const drawX = p.baseX + Math.sin(t * 0.004 + p.phase) * 7;
        if (cfg.aura === 'snow' && p.y > 36) p.y = -40;
        if (cfg.aura !== 'snow' && p.y < -42) p.y = 34;
        auraG.fillStyle(p.col, 0.76);
        auraG.fillCircle(drawX, p.y, p.r);
      }
    };

    startIdleBreath();
    updateHeadband(0);

    return {
      root,
      anim,
      petBox,
      eyesOpenG,
      eyesBlinkG,
      cfg,
      homeX: x,
      homeY: y,
      dir: facingDir,
      isAi: facingDir < 0,
      startIdleBreath,
      stopIdleBreath,
      updateHeadband,
      updateAura,
      setBlink(closed) {
        eyesOpenG.setVisible(!closed);
        eyesBlinkG.setVisible(closed);
      }
    };
  }

  function createCartoonNinja(scene, x, y, rawConfig, facingDir = 1) {
    return buildNinjaFighter(scene, rawConfig, facingDir < 0, x, y);
  }

  function makeCartoonStar(scene, x, y, outerR, innerR, color, outlineCol = OUTLINE) {
    const g = scene.add.graphics();
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (Math.PI * 2 * i) / 12 - Math.PI / 2;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    fillPolyPoints(g, pts, color, outlineCol, 2.4);
    g.setPosition(x, y);
    return g;
  }

  function createProjectileSprite(scene, element, x, y, dir) {
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    if (element === 'water') {
      fillPolyPoints(g, [
        { x: -16, y: 10 },
        { x: -8, y: -12 },
        { x: 10, y: -14 },
        { x: 18, y: -2 },
        { x: 10, y: 10 }
      ], 0x38bdf8, OUTLINE, 2.5);
      g.fillStyle(0xe0f2fe, 0.9);
      g.fillCircle(4, -4, 5);
      g.fillCircle(-6, 4, 3);
    } else if (element === 'snow') {
      [
        { sx: 0, sy: -8, r: 9 },
        { sx: -11, sy: 6, r: 7.5 },
        { sx: 9, sy: 7, r: 7.5 }
      ].forEach((b) => {
        g.fillStyle(0xe0f2fe, 1);
        g.fillCircle(b.sx, b.sy, b.r);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(b.sx - 2, b.sy - 2, b.r * 0.5);
        g.lineStyle(2.4, OUTLINE, 1);
        g.strokeCircle(b.sx, b.sy, b.r);
      });
    } else {
      // Cheerful cartoon flame puff
      fillPolyPoints(g, [
        { x: -16, y: 4 },
        { x: -6, y: -14 },
        { x: 6, y: -8 },
        { x: 18, y: 0 },
        { x: 6, y: 12 },
        { x: -8, y: 12 }
      ], 0xf97316, OUTLINE, 2.5);
      g.fillStyle(0xfde047, 1);
      g.fillCircle(2, 1, 6.5);
    }
    c.setScale(dir, 1);
    c.add(g);
    return c;
  }

  function mount(hostEl, opts = {}) {
    let destroyed = false;
    let ready = false;
    let game = null;
    let sceneRef = null;
    const isDisposedFn = typeof opts.isDisposed === 'function' ? opts.isDisposed : () => false;

    let resolveMount = null;
    const mountPromise = new Promise((resolve) => {
      resolveMount = resolve;
    });

    const transientTweens = new Set();
    const transientTimers = new Set();
    const transientObjects = new Set();

    const trackTween = (tw) => {
      if (tw) transientTweens.add(tw);
      return tw;
    };
    const trackTimer = (tm) => {
      if (tm) transientTimers.add(tm);
      return tm;
    };
    const trackObj = (obj) => {
      if (obj) transientObjects.add(obj);
      return obj;
    };

    let backdropRoot = null;
    let playerNinja = null;
    let aiNinja = null;
    let gagLayer = null;

    const clearTransientEffects = () => {
      transientTweens.forEach((tw) => {
        try { tw.stop(); } catch {}
      });
      transientTweens.clear();

      transientTimers.forEach((tm) => {
        try { tm.remove(false); } catch {}
      });
      transientTimers.clear();

      transientObjects.forEach((obj) => {
        try { obj.destroy(); } catch {}
      });
      transientObjects.clear();
    };

    const spawnLoserGag = (scene, targetNinja, element) => {
      if (!gagLayer || !targetNinja || destroyed) return;
      const gx = targetNinja.homeX;
      const gy = targetNinja.homeY;

      if (element === 'water') {
        // Cartoon wooden bucket tips over head + blue splash + puddle
        const gC = trackObj(scene.add.container(gx, gy - 68));
        const bucket = scene.add.graphics();
        fillPolyPoints(bucket, [
          { x: -16, y: -14 },
          { x: 16, y: -14 },
          { x: 12, y: 12 },
          { x: -12, y: 12 }
        ], 0xb45309, OUTLINE_WOOD, 2.5);
        bucket.lineStyle(2.5, 0x94a3b8, 1);
        bucket.lineBetween(-14, -5, 14, -5);
        bucket.lineBetween(-13, 4, 13, 4);
        gC.add(bucket);
        gC.setAngle(-20);
        gagLayer.add(gC);

        trackTween(scene.tweens.add({
          targets: gC,
          angle: 138,
          y: gy - 58,
          duration: 240,
          ease: 'Back.easeOut'
        }));

        const splash = trackObj(scene.add.graphics());
        splash.fillStyle(0x38bdf8, 0.72);
        splash.fillEllipse(gx, gy - 4, 48, 70);
        splash.fillStyle(0x0284c7, 0.85);
        splash.fillEllipse(gx, gy + 41, 76, 16);
        splash.lineStyle(2.2, OUTLINE, 0.75);
        splash.strokeEllipse(gx, gy + 41, 76, 16);
        // Droplets
        [
          { dx: -32, dy: -22 }, { dx: 30, dy: -18 },
          { dx: -24, dy: 14 }, { dx: 26, dy: 16 }
        ].forEach((d) => {
          splash.fillStyle(0x7dd3fc, 1);
          splash.fillCircle(gx + d.dx, gy + d.dy, 4.2);
          splash.lineStyle(1.8, OUTLINE, 1);
          splash.strokeCircle(gx + d.dx, gy + d.dy, 4.2);
        });
        gagLayer.add(splash);
      } else if (element === 'snow') {
        // Translucent sky-blue cartoon ice block encases loser briefly
        const ice = trackObj(scene.add.container(gx, gy + 2));
        const g = scene.add.graphics();
        g.fillStyle(0x7dd3fc, 0.56);
        g.fillRoundedRect(-32, -46, 64, 86, 10);
        g.fillStyle(0xffffff, 0.55);
        fillPolyPoints(g, [
          { x: -24, y: -38 }, { x: -10, y: -38 }, { x: -24, y: -10 }
        ], 0xffffff, 0, 0, 0.65);
        g.lineStyle(3, 0xffffff, 0.9);
        g.lineBetween(-20, -34, 14, 24);
        g.lineStyle(3, OUTLINE, 0.85);
        g.strokeRoundedRect(-32, -46, 64, 86, 10);
        ice.add(g);
        ice.setScale(0.4);
        gagLayer.add(ice);

        trackTween(scene.tweens.add({
          targets: ice,
          scaleX: 1,
          scaleY: 1,
          duration: 210,
          ease: 'Back.easeOut'
        }));
      } else {
        // Comical soot-cloud & cartoon flame tuft on loser's headband
        const soot = trackObj(scene.add.container(gx, gy - 44));
        const g = scene.add.graphics();
        g.fillStyle(0x475569, 0.9);
        g.fillCircle(-12, -12, 11);
        g.fillCircle(4, -18, 13);
        g.fillCircle(16, -10, 10);
        g.lineStyle(2.2, OUTLINE, 0.85);
        g.strokeCircle(4, -18, 13);
        // Cute little flame tuft
        fillPolyPoints(g, [
          { x: -12, y: 6 }, { x: -6, y: -8 }, { x: 0, y: 0 },
          { x: 6, y: -10 }, { x: 12, y: 6 }
        ], 0xf97316, OUTLINE, 2.2);
        fillPolyPoints(g, [
          { x: -6, y: 6 }, { x: 0, y: -3 }, { x: 6, y: 6 }
        ], 0xfde047, 0, 0);
        soot.add(g);
        gagLayer.add(soot);

        trackTween(scene.tweens.add({
          targets: soot,
          y: gy - 54,
          duration: 600,
          ease: 'Sine.easeOut'
        }));
      }
    };

    const handle = {
      isReady() {
        return Boolean(!destroyed && ready && game && sceneRef);
      },

      resetToIdle() {
        if (destroyed || !sceneRef || !playerNinja || !aiNinja) return;
        clearTransientEffects();
        [playerNinja, aiNinja].forEach((n) => {
          sceneRef.tweens.killTweensOf(n.root);
          sceneRef.tweens.killTweensOf(n.anim);
          n.root.setPosition(n.homeX, n.homeY);
          n.root.setScale(n.dir, 1);
          n.anim.setPosition(0, 0);
          n.anim.setScale(1, 1);
          n.anim.setAngle(0);
          n.startIdleBreath();
        });
      },

      playClash({ winner = 'player', element = 'fire', power = 5, isSpecial = false } = {}) {
        if (destroyed || !ready || !sceneRef || !playerNinja || !aiNinja) return;
        handle.resetToIdle();

        const isTie = winner === 'tie';
        const attacker = winner === 'ai' ? aiNinja : playerNinja;
        const defender = winner === 'ai' ? playerNinja : aiNinja;

        attacker.stopIdleBreath();
        if (isTie) defender.stopIdleBreath();

        if (isTie) {
          trackTween(sceneRef.tweens.add({
            targets: playerNinja.root,
            x: 244,
            duration: 210,
            ease: 'Back.easeOut'
          }));
          trackTween(sceneRef.tweens.add({
            targets: aiNinja.root,
            x: 556,
            duration: 210,
            ease: 'Back.easeOut'
          }));

          const p1 = trackObj(createProjectileSprite(sceneRef, element, playerNinja.homeX + 38, 156, 1));
          const p2 = trackObj(createProjectileSprite(sceneRef, element, aiNinja.homeX - 38, 156, -1));
          gagLayer.add(p1);
          gagLayer.add(p2);

          trackTween(sceneRef.tweens.add({
            targets: p1,
            x: 392,
            duration: 220,
            ease: 'Cubic.easeIn',
            onComplete: () => { try { p1.destroy(); } catch {} }
          }));
          trackTween(sceneRef.tweens.add({
            targets: p2,
            x: 408,
            duration: 220,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              try { p2.destroy(); } catch {}
              if (destroyed || !sceneRef) return;
              const star = trackObj(makeCartoonStar(sceneRef, 400, 156, 26, 12, 0xfde047));
              star.setScale(0.3);
              gagLayer.add(star);
              trackTween(sceneRef.tweens.add({
                targets: star,
                scaleX: 1.25,
                scaleY: 1.25,
                alpha: 0,
                duration: 280,
                ease: 'Back.easeOut'
              }));
              try { sceneRef.cameras.main.shake(140, 0.005); } catch {}
            }
          }));

          trackTimer(sceneRef.time.delayedCall(460, () => {
            if (destroyed || !sceneRef) return;
            trackTween(sceneRef.tweens.add({
              targets: playerNinja.root,
              x: playerNinja.homeX,
              duration: 240,
              ease: 'Quad.easeOut'
            }));
            trackTween(sceneRef.tweens.add({
              targets: aiNinja.root,
              x: aiNinja.homeX,
              duration: 240,
              ease: 'Quad.easeOut',
              onComplete: () => {
                if (!destroyed) {
                  playerNinja.startIdleBreath();
                  aiNinja.startIdleBreath();
                }
              }
            }));
          }));
          return;
        }

        // Lunge winner toward center
        const lungeX = attacker.isAi ? 536 : 264;
        trackTween(sceneRef.tweens.add({
          targets: attacker.root,
          x: lungeX,
          duration: 210,
          ease: 'Back.easeOut'
        }));
        trackTween(sceneRef.tweens.add({
          targets: attacker.anim,
          angle: 8,
          scaleX: 1.07,
          scaleY: 0.94,
          duration: 180,
          ease: 'Quad.easeOut'
        }));

        // Elemental projectile + light cartoon trail
        const startX = attacker.homeX + attacker.dir * 38;
        const proj = trackObj(createProjectileSprite(sceneRef, element, startX, 156, attacker.dir));
        gagLayer.add(proj);

        const trailColor = element === 'water' ? 0x93c5fd : element === 'snow' ? 0xe0f2fe : 0xfbbf24;
        const trailTimer = trackTimer(sceneRef.time.addEvent({
          delay: 42,
          repeat: 4,
          callback: () => {
            if (destroyed || !sceneRef || !proj.active) return;
            const puff = trackObj(sceneRef.add.circle(proj.x, proj.y, 6, trailColor, 0.72));
            gagLayer.add(puff);
            trackTween(sceneRef.tweens.add({
              targets: puff,
              scaleX: 0.2,
              scaleY: 0.2,
              alpha: 0,
              duration: 200
            }));
          }
        }));

        trackTween(sceneRef.tweens.add({
          targets: proj,
          x: defender.homeX,
          duration: 230,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            try { trailTimer.remove(false); } catch {}
            try { proj.destroy(); } catch {}
            if (destroyed || !sceneRef) return;

            // Impact burst star + gentle camera shake
            const starCol = element === 'water' ? 0x38bdf8 : element === 'snow' ? 0xffffff : 0xfde047;
            const burst = trackObj(makeCartoonStar(sceneRef, defender.homeX, 154, isSpecial ? 36 : 28, isSpecial ? 16 : 13, starCol));
            burst.setScale(0.35);
            gagLayer.add(burst);
            trackTween(sceneRef.tweens.add({
              targets: burst,
              scaleX: 1.35,
              scaleY: 1.35,
              alpha: 0,
              duration: 300,
              ease: 'Back.easeOut'
            }));

            try {
              sceneRef.cameras.main.shake(isSpecial ? 220 : 140, isSpecial ? 0.009 : 0.005);
            } catch {}

            // Defender comical squash recoil + Club Penguin gag
            defender.stopIdleBreath();
            trackTween(sceneRef.tweens.add({
              targets: defender.anim,
              angle: -10,
              scaleX: 1.1,
              scaleY: 0.88,
              duration: 120,
              yoyo: true,
              ease: 'Quad.easeOut',
              onComplete: () => {
                if (!destroyed) defender.startIdleBreath();
              }
            }));

            spawnLoserGag(sceneRef, defender, element);
          }
        }));

        // Return winner to home corner smoothly
        trackTimer(sceneRef.time.delayedCall(520, () => {
          if (destroyed || !sceneRef) return;
          trackTween(sceneRef.tweens.add({
            targets: attacker.root,
            x: attacker.homeX,
            duration: 240,
            ease: 'Quad.easeOut'
          }));
          trackTween(sceneRef.tweens.add({
            targets: attacker.anim,
            angle: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 220,
            ease: 'Quad.easeOut',
            onComplete: () => {
              if (!destroyed) attacker.startIdleBreath();
            }
          }));
        }));
      },

      playVictory(winner = 'player') {
        if (destroyed || !ready || !sceneRef || !playerNinja || !aiNinja) return;
        handle.resetToIdle();

        const winNinja = winner === 'ai' ? aiNinja : playerNinja;
        const loseNinja = winner === 'ai' ? playerNinja : aiNinja;

        winNinja.stopIdleBreath();
        loseNinja.stopIdleBreath();

        // Joyful jump loop on winner
        trackTween(sceneRef.tweens.add({
          targets: winNinja.root,
          y: winNinja.homeY - 38,
          duration: 330,
          yoyo: true,
          repeat: -1,
          ease: 'Quad.easeOut'
        }));
        trackTween(sceneRef.tweens.add({
          targets: winNinja.anim,
          scaleY: 1.07,
          scaleX: 0.94,
          duration: 330,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        }));

        // Polite bow on defeated ninja
        trackTween(sceneRef.tweens.add({
          targets: loseNinja.anim,
          scaleY: 0.92,
          angle: 6,
          duration: 300,
          ease: 'Sine.easeOut'
        }));

        // Joyful pastel cartoon star / confetti rain
        const confColors = [0xfbbf24, 0xe87454, 0x38bdf8, 0x4ade80, 0xf472b6];
        for (let i = 0; i < 20; i++) {
          const cx = 48 + Math.random() * (STAGE_W - 96);
          const col = confColors[i % confColors.length];
          const piece = i % 2 === 0
            ? makeCartoonStar(sceneRef, cx, -24, 7, 3.5, col, OUTLINE)
            : sceneRef.add.rectangle(cx, -24, 8, 5, col).setStrokeStyle(1.5, OUTLINE);
          trackObj(piece);
          gagLayer.add(piece);

          trackTween(sceneRef.tweens.add({
            targets: piece,
            y: STAGE_H + 24,
            x: cx + (Math.random() - 0.5) * 70,
            angle: (i % 2 === 0 ? 1 : -1) * (160 + Math.random() * 180),
            duration: 2100 + Math.random() * 1000,
            delay: i * 110,
            repeat: -1,
            ease: 'Linear'
          }));
        }
      },

      resetIdle() {
        handle.resetToIdle();
      },

      playRound(params = {}) {
        handle.playClash(params);
      },

      setFloorTheme(accentHex) {
        if (destroyed || !ready || !sceneRef) return;
        const nextAccent = accentHex || '#38bdf8';
        opts.accentColor = nextAccent;
        if (backdropRoot) {
          try { backdropRoot.destroy(true); } catch {}
        }
        backdropRoot = buildDojoBackdrop(sceneRef, nextAccent);
        sceneRef.children.sendToBack(backdropRoot);
      },

      updateConfigs(nextPlayerCfg, nextAiCfg) {
        if (destroyed || !ready || !sceneRef) return;
        clearTransientEffects();
        if (nextPlayerCfg) opts.playerConfig = nextPlayerCfg;
        if (nextAiCfg) opts.aiConfig = nextAiCfg;
        if (playerNinja && playerNinja.root) {
          try { playerNinja.root.destroy(true); } catch {}
        }
        if (aiNinja && aiNinja.root) {
          try { aiNinja.root.destroy(true); } catch {}
        }
        playerNinja = buildNinjaFighter(sceneRef, opts.playerConfig || {}, false, 112, 174);
        aiNinja = buildNinjaFighter(sceneRef, opts.aiConfig || {}, true, 688, 174);
        if (gagLayer) sceneRef.children.bringToTop(gagLayer);
      },

      destroy() {
        if (destroyed) return;
        destroyed = true;
        ready = false;
        clearTransientEffects();
        if (game) {
          const g = game;
          game = null;
          sceneRef = null;
          try { g.destroy(true); } catch {}
        }
        if (hostEl) {
          try { hostEl.innerHTML = ''; } catch {}
        }
        if (resolveMount) {
          const r = resolveMount;
          resolveMount = null;
          r(handle);
        }
      }
    };

    const startBoot = async () => {
      if (destroyed || isDisposedFn() || !hostEl || typeof window.loadPhaser !== 'function') {
        if (resolveMount) {
          const r = resolveMount;
          resolveMount = null;
          r(handle);
        }
        return;
      }

      let PhaserLib = null;
      try {
        PhaserLib = await window.loadPhaser();
      } catch {
        if (resolveMount) {
          const r = resolveMount;
          resolveMount = null;
          r(handle);
        }
        return;
      }

      if (destroyed || isDisposedFn() || !PhaserLib || !hostEl.isConnected) {
        if (resolveMount) {
          const r = resolveMount;
          resolveMount = null;
          r(handle);
        }
        return;
      }

      let destroyScheduled = false;
      const scheduleDestroy = () => {
        if (destroyScheduled || destroyed) return;
        destroyScheduled = true;
        setTimeout(() => handle.destroy(), 0);
      };

      class EKDojoScene extends PhaserLib.Scene {
        constructor() {
          super({ key: 'EKDojoScene' });
          this._blinkAt = 2400;
          this._isBlinking = false;
          this._blinkEnd = 0;
        }

        preload() {
          if (destroyed || isDisposedFn()) return;
          this.load.on('loaderror', () => {});
          const manifest = window.EKCartoonArtManifest && window.EKCartoonArtManifest.dojoSprites;
          if (manifest && typeof manifest === 'object') {
            Object.keys(manifest).forEach((key) => {
              const url = manifest[key];
              if (typeof url === 'string' && url.trim()) {
                try { this.load.image(key, url); } catch {}
              }
            });
          }
        }

        create() {
          if (destroyed || isDisposedFn()) {
            scheduleDestroy();
            return;
          }
          sceneRef = this;
          backdropRoot = buildDojoBackdrop(this, opts.accentColor || opts.floorColor || '#38bdf8');
          playerNinja = buildNinjaFighter(this, opts.playerConfig || {}, false, 112, 174);
          aiNinja = buildNinjaFighter(this, opts.aiConfig || {}, true, 688, 174);
          gagLayer = this.add.container(0, 0);
          ready = true;

          if (resolveMount) {
            const r = resolveMount;
            resolveMount = null;
            r(handle);
          }
        }

        update(time, delta) {
          if (destroyed || isDisposedFn()) {
            scheduleDestroy();
            return;
          }
          if (!ready || !playerNinja || !aiNinja) return;
          const dtSec = Math.min(0.05, (delta || 16) / 1000);
          playerNinja.updateHeadband(time);
          aiNinja.updateHeadband(time);
          playerNinja.updateAura(dtSec, time);
          aiNinja.updateAura(dtSec, time);

          // Natural cartoon blinking timer
          if (!this._isBlinking && time >= this._blinkAt) {
            this._isBlinking = true;
            this._blinkEnd = time + 115;
            playerNinja.setBlink(true);
            aiNinja.setBlink(true);
          } else if (this._isBlinking && time >= this._blinkEnd) {
            this._isBlinking = false;
            this._blinkAt = time + 2600 + Math.random() * 1900;
            playerNinja.setBlink(false);
            aiNinja.setBlink(false);
          }
        }
      }

      const buildPhaserCfg = (renderType) => ({
        type: renderType,
        parent: hostEl,
        width: STAGE_W,
        height: STAGE_H,
        transparent: false,
        backgroundColor: '#efe6d2',
        scale: {
          mode: PhaserLib.Scale.FIT,
          autoCenter: PhaserLib.Scale.CENTER_BOTH
        },
        audio: { noAudio: true },
        scene: [EKDojoScene]
      });

      hostEl.innerHTML = '';
      try {
        game = new PhaserLib.Game(buildPhaserCfg(PhaserLib.AUTO));
      } catch (_webglErr) {
        try {
          game = new PhaserLib.Game(buildPhaserCfg(PhaserLib.CANVAS));
        } catch (_canvasErr) {
          game = null;
          if (resolveMount) {
            const r = resolveMount;
            resolveMount = null;
            r(handle);
          }
          return;
        }
      }

      // Safety fallback if scene fails to initialize or host unmounts while booting
      const bootStartedAt = Date.now();
      const bootWatch = setInterval(() => {
        if (ready || destroyed) {
          clearInterval(bootWatch);
          return;
        }
        if (isDisposedFn() || !hostEl.isConnected || Date.now() - bootStartedAt > 4500) {
          clearInterval(bootWatch);
          handle.destroy();
        }
      }, 60);
    };

    startBoot();
    mountPromise.destroy = handle.destroy;
    return mountPromise;
  }

  window.EKDojoPhaser = { mount };
})();
