/**
 * EpicKast v1.9.3 — DOJO ELEMENTAL DE CARTAS (Card-Jitsu Tactical Engine) & ESTUDIO "MI NINJA"
 * Bloques A1, A2, A3, C, D, E, F integrados con `window.EKLifecycle`, `window.EKGameConfig` y `window.EKSprites`.
 */
(function () {
  'use strict';

  const CFG = () => window.EKGameConfig || {};
  const SPR = () => window.EKSprites || {};

  // --- MOTOR DE AUDIO CHIPTUNE (Web Audio API registrado en EKLifecycle) ---
  class DojoAudio {
    constructor(scope) {
      this.scope = scope;
      this.ctx = null;
      this._disposed = false;
      this.muted = localStorage.getItem('epickast.dojo.mute') === '1';
      this.masterVol = 0.25;
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('epickast.dojo.mute', this.muted ? '1' : '0');
      return this.muted;
    }

    ensureCtx() {
      if (this._isMutedOrDisposed()) return null;
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        if (this.scope) this.scope.audio(this.ctx);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    tone(freq, dur = 0.08, type = 'square', gainVal = 0.2, slideTo = null) {
      const c = this.ensureCtx();
      if (!c) return;
      try {
        const now = c.currentTime;
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, now);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
        const vol = Math.min(0.5, gainVal * this.masterVol);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        o.connect(g);
        g.connect(c.destination);
        o.start(now);
        o.stop(now + dur + 0.01);
      } catch {}
    }

    noise(dur = 0.12, gainVal = 0.25) {
      const c = this.ensureCtx();
      if (!c) return;
      try {
        const len = Math.max(1, Math.floor(c.sampleRate * dur));
        const buf = c.createBuffer(1, len, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = c.createBufferSource();
        src.buffer = buf;
        const g = c.createGain();
        g.gain.setValueAtTime(gainVal * this.masterVol, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
        src.connect(g);
        g.connect(c.destination);
        src.start();
      } catch {}
    }

    _isMutedOrDisposed() {
      return this._disposed || this.muted || (this.scope && this.scope.isDisposed());
    }

    selectCard() {
      if (this._isMutedOrDisposed()) return;
      if (typeof window.EKAudio?.play === 'function') {
        window.EKAudio.play('msg-send', 0.45);
        return;
      }
      this.tone(660, 0.06, 'triangle', 0.28, 880);
    }

    clash() {
      if (this._isMutedOrDisposed()) return;
      this.noise(0.1, 0.3);
      this.tone(180, 0.1, 'triangle', 0.28, 80);
    }

    cinematicPower() {
      if (this._isMutedOrDisposed()) return;
      if (typeof window.EKAudio?.play === 'function') {
        window.EKAudio.play('legendary-win', 0.65);
        return;
      }
      this.tone(260, 0.22, 'triangle', 0.32, 660);
      if (this.scope) {
        this.scope.timeout(() => this.tone(784, 0.22, 'sine', 0.32, 1046.5), 140);
      }
    }

    winRound() {
      if (this._isMutedOrDisposed()) return;
      if (typeof window.EKAudio?.play === 'function') {
        window.EKAudio.play('chest-open', 0.55);
        return;
      }
      this.tone(523.25, 0.09, 'triangle', 0.28);
      if (this.scope) {
        this.scope.timeout(() => this.tone(659.25, 0.09, 'triangle', 0.28), 80);
        this.scope.timeout(() => this.tone(783.99, 0.14, 'sine', 0.32), 160);
      }
    }

    loseRound() {
      if (this._isMutedOrDisposed()) return;
      this.tone(330, 0.12, 'triangle', 0.24, 220);
      if (this.scope) {
        this.scope.timeout(() => this.tone(220, 0.16, 'sine', 0.24, 150), 110);
      }
    }

    winMatch() {
      if (this._isMutedOrDisposed()) return;
      if (typeof window.EKAudio?.play === 'function') {
        window.EKAudio.play('legendary-win', 0.65);
        return;
      }
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, idx) => {
        if (this.scope) {
          this.scope.timeout(() => this.tone(f, 0.16, idx === 3 ? 'sine' : 'triangle', 0.32), idx * 95);
        }
      });
    }

    loseMatch() {
      if (this._isMutedOrDisposed()) return;
      const notes = [392, 349.23, 311.13, 261.63];
      notes.forEach((f, idx) => {
        if (this.scope) {
          this.scope.timeout(() => this.tone(f, 0.16, 'triangle', 0.24), idx * 110);
        }
      });
    }

    destroy() {
      this._disposed = true;
      if (this.ctx && this.ctx.state !== 'closed') {
        try { this.ctx.close().catch(() => {}); } catch {}
      }
      this.ctx = null;
    }
  }

  // --- GENERADOR DE NINJA PIXEL ART 24×30 (Contorno 1px, 3 tonos, poses Idle/Ataque/Victoria, cinta 3 frames, arma y aura) ---
  function shadeHex(hex, percent) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#1e293b';
    const num = parseInt(hex.slice(1), 16);
    if (Number.isNaN(num)) return hex;
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function getSavedNinjaConfig() {
    const def = {
      suitColor: '#1e293b',
      belt: 'white',
      maskColor: '#0f172a',
      weapon: 'katana',
      aura: 'none',
      headgear: 'none',
      eyes: 'amber',
      pet: 'none'
    };
    try {
      const raw = JSON.parse(localStorage.getItem('epickast.ninja.v1') || '{}');
      return { ...def, ...raw };
    } catch {
      return def;
    }
  }

  // --- CATÁLOGO v2: 36 CARTAS BASE (todos las tienen) + 24 DESBLOQUEABLES (sobres) ---
  // Base: 3 elementos × poder 1-12 (arte en assets/cards/std). Poder 11-12 = cartas ESPECIALES (animación + cinemática).
  const BASE_NAMES = {
    fire: ['Fogata', 'Brasa', 'Antorcha', 'Incendio', 'Erupción', 'Inferno', 'El Sol', 'Espíritu Ígneo', 'Guerrero de Lava', 'Dragón de Fuego', 'Fénix', 'Maestro de Fuego'],
    water: ['Gotas', 'Arroyo', 'Cascada', 'Torrente', 'Inundación', 'Tornado de Agua', 'Maremoto', 'Espíritu Acuático', 'Guerrero del Mar', 'Leviatán', 'Kraken', 'Maestro de Agua'],
    snow: ['Escarcha', 'Nieve', 'Ventisca', 'Estalactitas', 'Glaciar', 'Alud', 'Tundra', 'Espíritu de Hielo', 'Guerrero Gélido', 'Gólem de Hielo', 'Dragón de Hielo', 'Maestro de Hielo']
  };
  const BASE_ACCENT = { fire: '#ef4444', water: '#38bdf8', snow: '#7dd3fc' };
  const BASE_CINE = {
    fire: { 11: '¡ALAS DEL FÉNIX ETERNO!', 12: '¡EL MAESTRO DEL FUEGO DESATA SU FURIA!' },
    water: { 11: '¡TENTÁCULOS DEL KRAKEN ABISAL!', 12: '¡EL MAESTRO DEL AGUA DOBLA LA MAREA!' },
    snow: { 11: '¡ALIENTO DEL DRAGÓN DE HIELO!', 12: '¡EL MAESTRO DEL HIELO CONGELA EL TIEMPO!' }
  };
  const BASE_MOTIFS = {
    fire: ['campfire', 'shuriken_fire', 'torch', 'wildfire', 'volcano', 'inferno', 'sun', 'flame_spirit', 'lava_knight', 'dragon_fire', 'phoenix', 'fire_master'],
    water: ['droplet', 'stream', 'waterfall', 'torrent', 'flood', 'whirlpool', 'tsunami', 'water_spirit', 'sea_knight', 'leviathan', 'kraken', 'water_master'],
    snow: ['crystal', 'snowflake', 'blizzard', 'icicles', 'glacier', 'avalanche', 'tundra', 'ice_spirit', 'frost_knight', 'yeti', 'dragon_ice', 'ice_master']
  };
  const ELEM_ORDER = ['fire', 'water', 'snow'];
  const ELEM_LETTER = { fire: 'F', water: 'A', snow: 'N' };
  const BASE_CARDS = [];
  ELEM_ORDER.forEach((el, ei) => {
    for (let p = 1; p <= 12; p++) {
      BASE_CARDS.push({
        no: ei * 12 + p,
        code: ELEM_LETTER[el] + String(p).padStart(2, '0'),
        element: el, power: p, name: BASE_NAMES[el][p - 1],
        motif: BASE_MOTIFS[el][p - 1],
        accent: BASE_ACCENT[el], starter: true, rarity: p > 10 ? 'special' : 'base',
        imgUrl: `assets/cards/std/${el}_${p}.jpg`,
        ...(p > 10 ? { cineTitle: BASE_CINE[el][p] } : {})
      });
    }
  });

  // Desbloqueables (no 101+): con arte ilustrado real + personalizable desde Estudio de Creador.
  const UNLOCK_RAW = [
    [1, 'fire', 2, 'Ascua Shinobi', '#ef4444', 'shuriken_fire', 'assets/cards/std/fire_2.jpg'],
    [2, 'fire', 4, 'Zorro de Brasas', '#f97316', 'kitsune', 'assets/cards/std/fire_4.jpg'],
    [3, 'fire', 6, 'Katana Carmesí', '#f59e0b', 'katana_fire', 'assets/cards/std/fire_6.jpg'],
    [4, 'fire', 7, 'Lámpara del Templo', '#ec4899', 'lantern', 'assets/cards/std/fire_7.jpg'],
    [5, 'fire', 8, 'Tigre Volcánico', '#eab308', 'tiger', 'assets/cards/fire.jpg'],
    [6, 'fire', 10, 'Oni de Obsidiana', '#dc2626', 'oni', 'assets/cards/fire.jpg'],
    [7, 'fire', 11, 'Fénix Imperial', '#fbbf24', 'phoenix', 'assets/cartoon/card_fire_phoenix.webp', '¡LLAMARADA DEL FÉNIX SOLAR!'],
    [8, 'fire', 12, 'Dragón de Magma', '#ef4444', 'dragon_fire', 'assets/cartoon/card_fire_dragon.webp', '¡CATACLISMO DEL DRAGÓN DE MAGMA!'],
    [9, 'water', 2, 'Gota Serena', '#38bdf8', 'droplet', 'assets/cards/std/water_2.jpg'],
    [10, 'water', 4, 'Koi Imperial', '#06b6d4', 'koi', 'assets/cards/std/water_4.jpg'],
    [11, 'water', 5, 'Tortuga Acorazada', '#10b981', 'turtle', 'assets/cards/std/water_5.jpg'],
    [12, 'water', 7, 'Abanico de Marea', '#3b82f6', 'fan_water', 'assets/cards/std/water_7.jpg'],
    [13, 'water', 8, 'Tiburón Abisal', '#6366f1', 'shark', 'assets/cards/water.jpg'],
    [14, 'water', 10, 'Serpiente Midgard', '#0ea5e9', 'serpent', 'assets/cards/water.jpg'],
    [15, 'water', 11, 'Nutria Marejada', '#38bdf8', 'kraken', 'assets/cartoon/card_water_splash.webp', '¡OLA GIGANTE DE LA MAREA!'],
    [16, 'water', 12, 'Leviatán Tsunami', '#2563eb', 'leviathan', 'assets/cards/card_water_leviathan.jpg', '¡MAREMOTO DEL LEVIATÁN SUPREMO!'],
    [17, 'snow', 3, 'Cristal Boreal', '#7dd3fc', 'crystal', 'assets/cards/std/snow_3.jpg'],
    [18, 'snow', 4, 'Puffle Glacial', '#38bdf8', 'penguin', 'assets/cards/std/snow_4.jpg'],
    [19, 'snow', 6, 'Búho Nival', '#a855f7', 'owl', 'assets/cards/snow.jpg'],
    [20, 'snow', 7, 'Shuriken Cero', '#06b6d4', 'shuriken_ice', 'assets/cards/std/snow_7.jpg'],
    [21, 'snow', 9, 'Lobo Ventisca', '#60a5fa', 'wolf', 'assets/cards/card_snow_titan.jpg'],
    [22, 'snow', 10, 'Yeti Rompehielos', '#38bdf8', 'yeti', 'assets/cartoon/card_snow_yeti.webp'],
    [23, 'snow', 11, 'Pingüino Yeti Glaciar', '#7dd3fc', 'dragon_ice', 'assets/cartoon/card_snow_yeti.webp', '¡VENTISCA DEL YETI GLACIAR!'],
    [24, 'snow', 12, 'Titán Cero Absoluto', '#e0f2fe', 'titan_ice', 'assets/cards/card_snow_titan.jpg', '¡ERA GLACIAL: CERO ABSOLUTO!']
  ];
  const UNLOCK_CARDS = UNLOCK_RAW.map(([n, element, power, name, accent, motif, imgUrl, cineTitle]) => ({
    no: 100 + n, code: 'X' + String(n).padStart(2, '0'), element, power, name, accent, starter: false, motif,
    rarity: power > 10 ? 'special' : power >= 7 ? 'rare' : 'common',
    ...(imgUrl ? { imgUrl } : {}),
    ...(power > 10 ? { cineTitle: cineTitle || '¡INVOCACIÓN ELEMENTAL SUPREMA!' } : {})
  }));
  const DOJO_CARD_CATALOG = [...BASE_CARDS, ...UNLOCK_CARDS];
  const TOTAL_CARDS = DOJO_CARD_CATALOG.length;
  const SPECIAL_THRESHOLD = 10; // poder > 10 => carta especial (holo + efectos + cinemática)

  // Inventario v2: { "<no>": copias }. Migra el formato v1 (array de números 1-24) a desbloqueables 101-124.
  function readOwnedMap() {
    let map = {};
    try {
      const raw = localStorage.getItem('epickast.dojo.cards.v2');
      if (raw) {
        map = JSON.parse(raw) || {};
      } else {
        const old = JSON.parse(localStorage.getItem('epickast.dojo.cards.v1') || '[]');
        if (Array.isArray(old)) old.forEach((n) => { if (Number(n) >= 1 && Number(n) <= 24) map[100 + Number(n)] = 1; });
        localStorage.setItem('epickast.dojo.cards.v2', JSON.stringify(map));
      }
    } catch { map = {}; }
    return map;
  }

  function getUnlockedCardNumbers() {
    const owned = readOwnedMap();
    const set = new Set(BASE_CARDS.map((c) => c.no));
    Object.keys(owned).forEach((k) => { if (owned[k] > 0 && DOJO_CARD_CATALOG.some((c) => c.no === Number(k))) set.add(Number(k)); });
    return Array.from(set);
  }

  function getCardCopies(cardNo) {
    const c = DOJO_CARD_CATALOG.find((x) => x.no === Number(cardNo));
    if (c && c.starter) return 1;
    return Number(readOwnedMap()[cardNo]) || 0;
  }

  function unlockDojoCard(cardNo) {
    const no = Number(cardNo);
    const map = readOwnedMap();
    const isNew = !(map[no] > 0) && !BASE_CARDS.some((c) => c.no === no);
    map[no] = (Number(map[no]) || 0) + 1;
    try { localStorage.setItem('epickast.dojo.cards.v2', JSON.stringify(map)); } catch {}
    const card = DOJO_CARD_CATALOG.find((c) => c.no === no) || DOJO_CARD_CATALOG[0];
    return { card, isNew, copies: map[no] };
  }

  function unlockRandomDojoCard(preferEpic = false) {
    const unlocked = getUnlockedCardNumbers();
    const lockedPool = UNLOCK_CARDS.filter((c) => !unlocked.includes(c.no) && (!preferEpic || c.power > SPECIAL_THRESHOLD));
    const pool = lockedPool.length > 0 ? lockedPool : UNLOCK_CARDS.filter((c) => !preferEpic || c.power > SPECIAL_THRESHOLD);
    // Especiales (11-12) son más raros: peso 1 vs 3
    const weighted = [];
    pool.forEach((c) => { const w = c.power > SPECIAL_THRESHOLD ? 1 : 3; for (let i = 0; i < w; i++) weighted.push(c); });
    const chosen = weighted[Math.floor(Math.random() * weighted.length)] || UNLOCK_CARDS[0];
    return unlockDojoCard(chosen.no);
  }

  window.DojoCardCollection = {
    CATALOG: DOJO_CARD_CATALOG,
    BASE: BASE_CARDS,
    UNLOCKABLE: UNLOCK_CARDS,
    getUnlockedCardNumbers,
    getCardCopies,
    unlockDojoCard,
    unlockRandomDojoCard
  };

  function renderPixelNinjaSvg(config = {}, opts = {}) {
    const cfg = { ...getSavedNinjaConfig(), ...config };
    const size = opts.size || 132;
    const flip = !!opts.flip;
    const pose = opts.pose || 'idle'; // 'idle' | 'attack' | 'victory'
    const frame = Number(opts.frame) || 0;
    const belts = CFG().BELTS || [];
    const beltObj = belts.find((b) => b.id === cfg.belt || ('belt_' + b.id) === cfg.belt) || belts[0] || { color: '#f8fafc', shadow: '#cbd5e1' };

    const suitMap = {
      suit_shadow: '#1e293b',
      suit_crimson: '#dc2626',
      suit_sapphire: '#2563eb',
      suit_cyan: '#0891b2',
      suit_jade: '#16a34a',
      suit_amethyst: '#7c3aed',
      suit_magma: '#ea580c',
      suit_white: '#e2e8f0'
    };
    const suitBase = cfg.suitColor || suitMap[cfg.suit] || '#1e293b';
    const suitLight = shadeHex(suitBase, 34);
    const suitDark = shadeHex(suitBase, -30);
    const maskBase = cfg.maskColor || '#0f172a';
    const maskLight = shadeHex(maskBase, 24);
    const beltColor = beltObj.color || '#f8fafc';
    const beltShadow = beltObj.shadow || shadeHex(beltColor, -35);
    const OL = '#1e2433';

    const breathY = pose === 'idle' ? (frame % 2 === 1 ? 1.4 : 0) : (pose === 'victory' ? -2.5 : 0);
    const scarfWave = frame % 3;
    const tailY1 = scarfWave === 0 ? 0 : scarfWave === 1 ? -3.2 : 2.8;
    const tailY2 = scarfWave === 0 ? 2 : scarfWave === 1 ? -1.4 : 4.2;

    // Armas detrás o en mano con trazo cartoon redondeado
    let backWeaponSvg = '';
    let frontWeaponSvg = '';
    const wpn = String(cfg.weapon || 'katana').replace(/^wpn_/, '');
    if (wpn === 'katana') {
      backWeaponSvg = `
        <g transform="translate(0,${breathY}) rotate(-26 24 46)">
          <rect x="20" y="6" width="5.5" height="52" rx="2.5" fill="#334155" stroke="${OL}" stroke-width="2.4"/>
          <rect x="21.5" y="8" width="2" height="40" fill="#e2e8f0"/>
          <rect x="17" y="18" width="11.5" height="4" rx="2" fill="#fbbf24" stroke="${OL}" stroke-width="1.8"/>
          <rect x="20.5" y="7" width="4.5" height="10" rx="1.5" fill="#ef4444"/>
        </g>`;
    } else if (wpn === 'staff') {
      backWeaponSvg = `
        <g transform="translate(0,${breathY * 0.5}) rotate(-14 20 52)">
          <rect x="17" y="5" width="6" height="84" rx="3" fill="#8b5a2b" stroke="${OL}" stroke-width="2.4"/>
          <rect x="17" y="5" width="6" height="9" rx="2" fill="#fbbf24"/>
          <rect x="17" y="80" width="6" height="9" rx="2" fill="#fbbf24"/>
          <rect x="17" y="40" width="6" height="12" fill="#e87454"/>
        </g>`;
    } else if (wpn === 'scroll') {
      backWeaponSvg = `
        <g transform="translate(0,${breathY}) rotate(-15 36 48)">
          <rect x="16" y="42" width="42" height="13" rx="5" fill="#fde68a" stroke="${OL}" stroke-width="2.4"/>
          <rect x="13" y="41" width="6" height="15" rx="2.5" fill="#ef4444" stroke="${OL}" stroke-width="2"/>
          <rect x="55" y="41" width="6" height="15" rx="2.5" fill="#ef4444" stroke="${OL}" stroke-width="2"/>
          <line x1="37" y1="42" x2="37" y2="55" stroke="#dc2626" stroke-width="3"/>
        </g>`;
    } else if (wpn === 'shuriken') {
      const sx = pose === 'attack' ? 68 : 63;
      const sy = pose === 'victory' ? 22 : 55 + breathY;
      frontWeaponSvg = `
        <g transform="translate(${sx},${sy}) rotate(${frame * 45})">
          <polygon points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3" fill="#e2e8f0" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
          <circle cx="0" cy="0" r="2.6" fill="#38bdf8" stroke="${OL}" stroke-width="1.4"/>
        </g>`;
    } else if (wpn === 'kunai') {
      const kx = pose === 'attack' ? 70 : 63;
      const ky = pose === 'victory' ? 22 : 54 + breathY;
      const kRot = pose === 'attack' ? 75 : 35;
      frontWeaponSvg = `
        <g transform="translate(${kx},${ky}) rotate(${kRot})">
          <polygon points="0,-12 4.5,-2 0,1.5 -4.5,-2" fill="#f8fafc" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
          <rect x="-1.5" y="1.5" width="3" height="6" fill="#ef4444"/>
          <circle cx="0" cy="9.5" r="2.6" fill="none" stroke="#fbbf24" stroke-width="2"/>
        </g>`;
    }

    // Brazos redondeados estilo Club Penguin
    let armsSvg = '';
    if (pose === 'attack') {
      armsSvg = `
        <ellipse cx="22" cy="${54 + breathY}" rx="7" ry="11" transform="rotate(14 22 ${54 + breathY})" fill="${suitDark}" stroke="${OL}" stroke-width="2.4"/>
        <circle cx="20" cy="${63 + breathY}" r="5" fill="${maskBase}" stroke="${OL}" stroke-width="2.2"/>
        <ellipse cx="62" cy="${50 + breathY}" rx="11" ry="6.5" transform="rotate(-8 62 ${50 + breathY})" fill="${suitLight}" stroke="${OL}" stroke-width="2.4"/>
        <circle cx="71" cy="${49 + breathY}" r="5.2" fill="${maskBase}" stroke="${OL}" stroke-width="2.2"/>
      `;
    } else if (pose === 'victory') {
      armsSvg = `
        <ellipse cx="21" cy="${42 + breathY}" rx="6.5" ry="12" transform="rotate(-34 21 ${42 + breathY})" fill="${suitLight}" stroke="${OL}" stroke-width="2.4"/>
        <circle cx="15" cy="${32 + breathY}" r="5.2" fill="${maskBase}" stroke="${OL}" stroke-width="2.2"/>
        <ellipse cx="59" cy="${42 + breathY}" rx="6.5" ry="12" transform="rotate(34 59 ${42 + breathY})" fill="${suitLight}" stroke="${OL}" stroke-width="2.4"/>
        <circle cx="65" cy="${32 + breathY}" r="5.2" fill="${maskBase}" stroke="${OL}" stroke-width="2.2"/>
      `;
    } else {
      armsSvg = `
        <ellipse cx="20" cy="${55 + breathY}" rx="6.5" ry="11" transform="rotate(12 20 ${55 + breathY})" fill="${suitDark}" stroke="${OL}" stroke-width="2.4"/>
        <circle cx="19" cy="${64 + breathY}" r="4.8" fill="${maskBase}" stroke="${OL}" stroke-width="2.2"/>
        <ellipse cx="60" cy="${55 + breathY}" rx="6.5" ry="11" transform="rotate(-12 60 ${55 + breathY})" fill="${suitLight}" stroke="${OL}" stroke-width="2.4"/>
        <circle cx="61" cy="${64 + breathY}" r="4.8" fill="${maskBase}" stroke="${OL}" stroke-width="2.2"/>
      `;
    }

    const flipStyle = flip ? 'transform:scaleX(-1);' : '';
    return `
      <svg class="ek-ninja-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" width="${size}" height="${Math.round(size * 1.25)}" style="overflow:visible;filter:drop-shadow(0 4px 6px rgba(30,36,51,0.28));${flipStyle}">
        <!-- Sombra suave sobre el tatami -->
        <ellipse cx="40" cy="92" rx="26" ry="6" fill="rgba(62,45,29,0.26)"/>
        ${backWeaponSvg}

        <!-- Piernas y botas redondeadas -->
        <rect x="25" y="70" width="11" height="17" rx="5" fill="${suitDark}" stroke="${OL}" stroke-width="2.4"/>
        <rect x="44" y="70" width="11" height="17" rx="5" fill="${suitBase}" stroke="${OL}" stroke-width="2.4"/>
        <ellipse cx="30" cy="88" rx="8.5" ry="5" fill="#2b3347" stroke="${OL}" stroke-width="2.4"/>
        <ellipse cx="50" cy="88" rx="8.5" ry="5" fill="#2b3347" stroke="${OL}" stroke-width="2.4"/>

        <!-- Torso rechoncho estilo 2D cartoon con cel-shading suave -->
        <g transform="translate(0,${breathY})">
          <rect x="21" y="42" width="38" height="31" rx="14" fill="${suitBase}" stroke="${OL}" stroke-width="2.4"/>
          <ellipse cx="33" cy="54" rx="7" ry="9" fill="${suitLight}" opacity="0.72"/>
          <path d="M31,44 L45,59 M49,44 L36,58" stroke="${suitDark}" stroke-width="2.8" stroke-linecap="round"/>
        </g>

        ${armsSvg}

        <!-- Cinturón Obi redondeado + Nudo y puntas -->
        <g transform="translate(0,${breathY})">
          <rect x="20" y="60" width="40" height="8" rx="4" fill="${beltColor}" stroke="${OL}" stroke-width="2.4"/>
          <rect x="22" y="65" width="36" height="2.4" rx="1" fill="${beltShadow}" opacity="0.85"/>
          <path d="M38,67 L33,80 L38,81 L41,68 Z" fill="${beltShadow}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M42,67 L48,81 L43,82 L39,68 Z" fill="${beltColor}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
          <rect x="35.5" y="59" width="9" height="9.5" rx="3.5" fill="${beltColor}" stroke="${OL}" stroke-width="2.2"/>
        </g>

        <!-- Cola de la cinta ondeando suavemente -->
        <g transform="translate(0,${breathY})">
          <path d="M21,21 Q10,${18 + tailY1} 3,${23 + tailY2} L6,${29 + tailY2} Q13,${24 + tailY1} 22,25 Z" fill="${beltColor}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M21,24 Q12,${25 + tailY2} 6,${32 + tailY1} L10,${36 + tailY1} Q16,${29 + tailY2} 22,27 Z" fill="${beltShadow}" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>

          <!-- Cabeza amplia y redondeada -->
          <ellipse cx="40" cy="25" rx="22" ry="19" fill="${suitBase}" stroke="${OL}" stroke-width="2.4"/>
          <ellipse cx="34" cy="14" rx="10" ry="4.5" fill="${suitLight}" opacity="0.78"/>

          <!-- Cinta frontal + placa del Dojo -->
          <rect x="18" y="16.5" width="44" height="7" rx="3.5" fill="${beltColor}" stroke="${OL}" stroke-width="2.2"/>
          <rect x="35" y="17.5" width="13" height="5" rx="2" fill="#f1f5f9" stroke="${OL}" stroke-width="1.6"/>
          <circle cx="41.5" cy="20" r="1.4" fill="#38bdf8"/>

          <!-- Visor amable y ojos expresivos con brillo -->
          <rect x="27" y="23" width="30" height="11.5" rx="5.5" fill="#fde7be" stroke="${OL}" stroke-width="2.2"/>
          ${(() => {
            const eyeType = cfg.eyes || 'amber';
            if (eyeType === 'cyber') {
              return `
                <rect x="29" y="25" width="26" height="7" rx="3.5" fill="#06b6d4" stroke="#cffafe" stroke-width="1.2"/>
                <circle cx="36" cy="28.5" r="1.7" fill="#ffffff"/>
                <circle cx="48" cy="28.5" r="1.7" fill="#ffffff"/>
              `;
            }
            const irisCol = eyeType === 'sharingan' ? '#ef4444' : eyeType === 'ice' ? '#38bdf8' : eyeType === 'dragon' ? '#f59e0b' : '#1e2433';
            return `
              <ellipse cx="35.5" cy="28.5" rx="4.2" ry="4.8" fill="#ffffff" stroke="${OL}" stroke-width="1.6"/>
              <ellipse cx="48.5" cy="28.5" rx="4.2" ry="4.8" fill="#ffffff" stroke="${OL}" stroke-width="1.6"/>
              <circle cx="36.2" cy="28.6" r="2.6" fill="${irisCol}"/>
              <circle cx="49.2" cy="28.6" r="2.6" fill="${irisCol}"/>
              ${eyeType === 'dragon' ? `<ellipse cx="36.2" cy="28.6" rx="0.9" ry="2.4" fill="${OL}"/><ellipse cx="49.2" cy="28.6" rx="0.9" ry="2.4" fill="${OL}"/>` : ''}
              <circle cx="35.2" cy="27.3" r="1.2" fill="#ffffff"/>
              <circle cx="48.2" cy="27.3" r="1.2" fill="#ffffff"/>
            `;
          })()}

          <!-- Máscara inferior redondeada -->
          <path d="M21,32 Q42,35 60,32 L58,41 Q40,45.5 22,41 Z" fill="${maskBase}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M26,35.5 Q42,38 54,35.5" stroke="${maskLight}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>

          <!-- Casco / Sombrero / Peinado -->
          ${(() => {
            const hg = cfg.headgear || 'none';
            if (hg === 'kasa') {
              return `<path d="M8,16 Q40,-3 72,16 Q40,19 8,16 Z" fill="#eab308" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/><path d="M18,14 L62,14" stroke="#fef3c7" stroke-width="2" fill="none" stroke-linecap="round"/>`;
            }
            if (hg === 'oni') {
              return `<path d="M25,13 Q19,-1 30,4 L32,12 Z" fill="#ef4444" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><path d="M55,13 Q61,-1 50,4 L48,12 Z" fill="#ef4444" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`;
            }
            if (hg === 'neko') {
              return `<polygon points="22,14 25,1 35,10" fill="${suitBase}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><polygon points="24.5,12 26.2,4.5 32.5,10.5" fill="#f472b6"/><polygon points="58,14 55,1 45,10" fill="${suitBase}" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><polygon points="55.5,12 53.8,4.5 47.5,10.5" fill="#f472b6"/>`;
            }
            if (hg === 'crown') {
              return `<polygon points="26,11 28,0 35,7 40,-2 45,7 52,0 54,11" fill="#fbbf24" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="40" cy="6.5" r="2.2" fill="#ef4444"/>`;
            }
            if (hg === 'spiky') {
              return `<polygon points="22,13 17,1 30,8 35,-3 41,7 49,-2 52,8 63,1 58,13" fill="#fde047" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>`;
            }
            return '';
          })()}
        </g>

        ${frontWeaponSvg}

        <!-- Mascota Compañera Estilo Caricatura Detallada junto al Ninja -->
        ${(() => {
          const pet = cfg.pet || 'none';
          const py = 65 - (frame % 2) * 2.5;
          if (pet === 'kitsune') {
            return `<g transform="translate(-6,${py})">
              <ellipse cx="12" cy="24" rx="10" ry="3.2" fill="rgba(20,16,12,0.28)"/>
              <path d="M4,18 Q-5,10 2,5 Q7,8 7,15 Z" fill="#fb923c" stroke="${OL}" stroke-width="1.9" stroke-linejoin="round"/>
              <path d="M2,7 Q-1,9 2,12" stroke="#fef3c7" stroke-width="2" stroke-linecap="round" fill="none"/>
              <ellipse cx="12" cy="18" rx="6.5" ry="5.5" fill="#ea580c" stroke="${OL}" stroke-width="2"/>
              <ellipse cx="12.5" cy="19" rx="3.8" ry="3.2" fill="#fef3c7"/>
              <circle cx="12.5" cy="11.5" r="7.5" fill="#f97316" stroke="${OL}" stroke-width="2.1"/>
              <polygon points="6,7 7.5,-1 11.5,5.5" fill="#f97316" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
              <polygon points="7.5,5.5 8.2,1.5 10.3,5" fill="#fef3c7"/>
              <polygon points="19,7 17.5,-1 13.5,5.5" fill="#f97316" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
              <polygon points="17.5,5.5 16.8,1.5 14.7,5" fill="#fef3c7"/>
              <ellipse cx="12.5" cy="14" rx="5.2" ry="3.2" fill="#fef3c7"/>
              <ellipse cx="8.5" cy="13.5" rx="1.6" ry="0.9" fill="#f43f5e" opacity="0.5"/>
              <ellipse cx="16.5" cy="13.5" rx="1.6" ry="0.9" fill="#f43f5e" opacity="0.5"/>
              <circle cx="10.2" cy="11.2" r="1.7" fill="${OL}"/><circle cx="15" cy="11.2" r="1.7" fill="${OL}"/>
              <circle cx="9.7" cy="10.6" r="0.65" fill="#fff"/><circle cx="14.5" cy="10.6" r="0.65" fill="#fff"/>
              <polygon points="11.6,13.2 13.4,13.2 12.5,14.4" fill="${OL}"/>
            </g>`;
          }
          if (pet === 'axolotl') {
            return `<g transform="translate(-6,${py - 3})">
              <ellipse cx="12" cy="23" rx="9.5" ry="3" fill="rgba(20,16,12,0.24)"/>
              <path d="M4,11 L-3,6 M3.5,14 L-3.5,13.5 M4.5,17 L-1.5,19 M20,11 L27,6 M20.5,14 L27.5,13.5 M19.5,17 L25.5,19" stroke="#ec4899" stroke-width="2.6" stroke-linecap="round"/>
              <ellipse cx="12" cy="15.5" rx="8.8" ry="7.4" fill="#f472b6" stroke="${OL}" stroke-width="2.1"/>
              <ellipse cx="12" cy="17.5" rx="5.4" ry="3.8" fill="#fce7f3"/>
              <circle cx="9" cy="13.8" r="1.8" fill="${OL}"/><circle cx="15" cy="13.8" r="1.8" fill="${OL}"/>
              <circle cx="8.4" cy="13.1" r="0.7" fill="#fff"/><circle cx="14.4" cy="13.1" r="0.7" fill="#fff"/>
              <path d="M10.2,16.8 Q12,18.4 13.8,16.8" stroke="${OL}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <ellipse cx="6.8" cy="16" rx="1.4" ry="0.8" fill="#db2777" opacity="0.55"/>
              <ellipse cx="17.2" cy="16" rx="1.4" ry="0.8" fill="#db2777" opacity="0.55"/>
            </g>`;
          }
          if (pet === 'shiba') {
            return `<g transform="translate(-6,${py})">
              <ellipse cx="12" cy="24" rx="9.5" ry="3.2" fill="rgba(20,16,12,0.26)"/>
              <path d="M5,17 Q-1,12 4,9" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round" fill="none"/>
              <ellipse cx="12" cy="18.5" rx="6.5" ry="5" fill="#d97706" stroke="${OL}" stroke-width="2"/>
              <circle cx="12" cy="11.5" r="7.6" fill="#f59e0b" stroke="${OL}" stroke-width="2.1"/>
              <polygon points="5.5,7 6.5,-0.5 10.5,5.5" fill="#d97706" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
              <polygon points="18.5,7 17.5,-0.5 13.5,5.5" fill="#d97706" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>
              <ellipse cx="12" cy="14" rx="5.6" ry="3.8" fill="#fef3c7"/>
              <circle cx="9.6" cy="9.4" r="1" fill="#fef3c7"/><circle cx="14.4" cy="9.4" r="1" fill="#fef3c7"/>
              <circle cx="9.6" cy="11.4" r="1.7" fill="${OL}"/><circle cx="14.4" cy="11.4" r="1.7" fill="${OL}"/>
              <circle cx="9.1" cy="10.8" r="0.65" fill="#fff"/><circle cx="13.9" cy="10.8" r="0.65" fill="#fff"/>
              <ellipse cx="12" cy="13.5" rx="1.5" ry="1.1" fill="${OL}"/>
              <path d="M10.5,15.2 Q12,16.5 13.5,15.2" stroke="${OL}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
            </g>`;
          }
          if (pet === 'penguin') {
            return `<g transform="translate(-6,${py})">
              <ellipse cx="12" cy="24" rx="9.5" ry="3.2" fill="rgba(20,16,12,0.26)"/>
              <ellipse cx="9" cy="22.5" rx="2.6" ry="1.5" fill="#f59e0b" stroke="${OL}" stroke-width="1.4"/>
              <ellipse cx="15" cy="22.5" rx="2.6" ry="1.5" fill="#f59e0b" stroke="${OL}" stroke-width="1.4"/>
              <ellipse cx="12" cy="14" rx="8.2" ry="9" fill="#0284c7" stroke="${OL}" stroke-width="2.1"/>
              <ellipse cx="12" cy="16" rx="5.2" ry="6.2" fill="#f8fafc"/>
              <rect x="4" y="7.5" width="16" height="3.6" rx="1.8" fill="#ef4444" stroke="${OL}" stroke-width="1.5"/>
              <path d="M19,9 L23,7.5 L22,11 Z" fill="#ef4444" stroke="${OL}" stroke-width="1.3"/>
              <polygon points="10.2,13.8 13.8,13.8 12,16.8" fill="#fbbf24" stroke="${OL}" stroke-width="1.4" stroke-linejoin="round"/>
              <circle cx="9.2" cy="12" r="1.7" fill="${OL}"/><circle cx="14.8" cy="12" r="1.7" fill="${OL}"/>
              <circle cx="8.7" cy="11.4" r="0.65" fill="#fff"/><circle cx="14.3" cy="11.4" r="0.65" fill="#fff"/>
            </g>`;
          }
          if (pet === 'dragon') {
            return `<g transform="translate(-6,${py - 5})">
              <ellipse cx="12" cy="25" rx="9" ry="2.8" fill="rgba(88,28,135,0.3)"/>
              <path d="M5,14 L-4,5 L2,12 L-2,15 L6,16 Z" fill="#c084fc" stroke="${OL}" stroke-width="1.7" stroke-linejoin="round"/>
              <path d="M19,14 L28,5 L22,12 L26,15 L18,16 Z" fill="#c084fc" stroke="${OL}" stroke-width="1.7" stroke-linejoin="round"/>
              <ellipse cx="12" cy="17.5" rx="6.2" ry="5.5" fill="#6b21a8" stroke="${OL}" stroke-width="2"/>
              <ellipse cx="12" cy="18.2" rx="3.4" ry="3.8" fill="#fde047"/>
              <circle cx="12" cy="11" r="7.4" fill="#7e22ce" stroke="${OL}" stroke-width="2.1"/>
              <polygon points="7,5.5 4.5,-1.5 10,4.5" fill="#fbbf24" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
              <polygon points="17,5.5 19.5,-1.5 14,4.5" fill="#fbbf24" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
              <circle cx="9.5" cy="10.8" r="1.9" fill="#fde047" stroke="${OL}" stroke-width="1.1"/>
              <circle cx="14.5" cy="10.8" r="1.9" fill="#fde047" stroke="${OL}" stroke-width="1.1"/>
              <circle cx="9.5" cy="10.8" r="0.8" fill="${OL}"/><circle cx="14.5" cy="10.8" r="0.8" fill="${OL}"/>
            </g>`;
          }
          return '';
        })()}
      </svg>`;
  }

  // --- ESCENARIO CALMO DEL DOJO ESTILO CLUB PENGUIN (Shoji crema, cielo pastel, linternas, tatami dorado) ---
  function renderDojoBackdropSvg(accentColor = '#38bdf8') {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 280" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;">
        <!-- Paredes Shoji color crema cálido -->
        <rect x="0" y="0" width="800" height="186" fill="#f3ebd9"/>
        <rect x="0" y="146" width="800" height="40" fill="#e8dcc4"/>

        <!-- Paneles Shoji izquierdo y derecho -->
        <g>
          <rect x="28" y="22" width="174" height="148" rx="4" fill="#f8f2e4" stroke="#7d5837" stroke-width="3"/>
          <line x1="86" y1="24" x2="86" y2="168" stroke="#d8c9ad" stroke-width="1.5"/>
          <line x1="144" y1="24" x2="144" y2="168" stroke="#d8c9ad" stroke-width="1.5"/>
          <line x1="30" y1="71" x2="200" y2="71" stroke="#d8c9ad" stroke-width="1.5"/>
          <line x1="30" y1="120" x2="200" y2="120" stroke="#d8c9ad" stroke-width="1.5"/>

          <rect x="598" y="22" width="174" height="148" rx="4" fill="#f8f2e4" stroke="#7d5837" stroke-width="3"/>
          <line x1="656" y1="24" x2="656" y2="168" stroke="#d8c9ad" stroke-width="1.5"/>
          <line x1="714" y1="24" x2="714" y2="168" stroke="#d8c9ad" stroke-width="1.5"/>
          <line x1="600" y1="71" x2="770" y2="71" stroke="#d8c9ad" stroke-width="1.5"/>
          <line x1="600" y1="120" x2="770" y2="120" stroke="#d8c9ad" stroke-width="1.5"/>
        </g>

        <!-- Ventana central con cielo azul pastel, nubes blancas y montañas nevadas -->
        <g>
          <rect x="248" y="20" width="304" height="144" fill="#cbe2f0"/>
          <rect x="248" y="98" width="304" height="66" fill="#dfeef7" opacity="0.85"/>
          <polygon points="248,164 306,92 370,164" fill="#b1cde0" stroke="#8aaec7" stroke-width="1.5"/>
          <polygon points="291,110 306,92 323,110 307,106" fill="#f8fafc"/>
          <polygon points="336,164 410,74 490,164" fill="#9ab8cf" stroke="#7a9bb5" stroke-width="1.5"/>
          <polygon points="389,99 410,74 432,99 410,94" fill="#ffffff"/>
          <polygon points="438,164 500,96 552,164" fill="#b8d2e3" stroke="#8aaec7" stroke-width="1.5"/>
          <polygon points="484,112 500,96 517,112 500,108" fill="#f8fafc"/>
          <!-- Nubes esponjosas -->
          <g fill="#ffffff" opacity="0.94">
            <circle cx="298" cy="54" r="13"/><circle cx="312" cy="50" r="16"/><circle cx="326" cy="54" r="12"/>
            <circle cx="456" cy="44" r="11"/><circle cx="468" cy="41" r="13"/><circle cx="480" cy="44" r="10"/>
          </g>
          <rect x="248" y="20" width="304" height="144" fill="none" stroke="#5e3f25" stroke-width="4"/>
          <rect x="246" y="18" width="308" height="148" fill="none" stroke="#241b16" stroke-width="2"/>
          <line x1="349" y1="20" x2="349" y2="164" stroke="#7d5837" stroke-width="2"/>
          <line x1="450" y1="20" x2="450" y2="164" stroke="#7d5837" stroke-width="2"/>
        </g>

        <!-- Vigas de madera cálida -->
        <rect x="0" y="0" width="800" height="14" fill="#7d5837" stroke="#241b16" stroke-width="2"/>
        <rect x="216" y="14" width="16" height="170" fill="#7d5837" stroke="#241b16" stroke-width="2"/>
        <rect x="570" y="14" width="16" height="170" fill="#7d5837" stroke="#241b16" stroke-width="2"/>
        <circle cx="224" cy="44" r="5" fill="${accentColor}" stroke="#241b16" stroke-width="1.6" opacity="0.85"/>
        <circle cx="578" cy="44" r="5" fill="${accentColor}" stroke="#241b16" stroke-width="1.6" opacity="0.85"/>

        <!-- Linternas redondas colgantes -->
        <g transform="translate(268, 14)">
          <circle cx="0" cy="30" r="28" fill="#fae1a8" opacity="0.25"/>
          <line x1="0" y1="0" x2="0" y2="12" stroke="#241b16" stroke-width="2.5"/>
          <ellipse cx="0" cy="30" rx="16" ry="17" fill="#e87454" stroke="#241b16" stroke-width="2.4"/>
          <ellipse cx="-2" cy="28" rx="8" ry="11" fill="#fae1a8" opacity="0.65"/>
          <rect x="-9" y="10" width="18" height="5" rx="2" fill="#5e3f25" stroke="#241b16" stroke-width="1.8"/>
          <rect x="-9" y="45" width="18" height="5" rx="2" fill="#5e3f25" stroke="#241b16" stroke-width="1.8"/>
          <line x1="0" y1="50" x2="0" y2="59" stroke="#d95338" stroke-width="2.4"/>
        </g>
        <g transform="translate(532, 14)">
          <circle cx="0" cy="30" r="28" fill="#fae1a8" opacity="0.25"/>
          <line x1="0" y1="0" x2="0" y2="12" stroke="#241b16" stroke-width="2.5"/>
          <ellipse cx="0" cy="30" rx="16" ry="17" fill="#e87454" stroke="#241b16" stroke-width="2.4"/>
          <ellipse cx="-2" cy="28" rx="8" ry="11" fill="#fae1a8" opacity="0.65"/>
          <rect x="-9" y="10" width="18" height="5" rx="2" fill="#5e3f25" stroke="#241b16" stroke-width="1.8"/>
          <rect x="-9" y="45" width="18" height="5" rx="2" fill="#5e3f25" stroke="#241b16" stroke-width="1.8"/>
          <line x1="0" y1="50" x2="0" y2="59" stroke="#d95338" stroke-width="2.4"/>
        </g>

        <!-- Piso Tatami dorado cálido con medallón sutil -->
        <rect x="0" y="184" width="800" height="96" fill="#d8b878"/>
        <rect x="0" y="181" width="800" height="6" fill="#7d5837"/>
        <line x1="0" y1="187" x2="800" y2="187" stroke="#6e4e2e" stroke-width="2.5"/>
        <line x1="155" y1="187" x2="50" y2="280" stroke="#b58c4b" stroke-width="2" opacity="0.75"/>
        <line x1="400" y1="187" x2="400" y2="280" stroke="#b58c4b" stroke-width="2" opacity="0.75"/>
        <line x1="645" y1="187" x2="750" y2="280" stroke="#b58c4b" stroke-width="2" opacity="0.75"/>
        <rect x="76" y="198" width="648" height="70" rx="12" fill="rgba(207,169,98,0.42)" stroke="#b58c4b" stroke-width="3"/>
        <ellipse cx="400" cy="233" rx="58" ry="22" fill="rgba(181,140,75,0.22)" stroke="rgba(110,78,46,0.26)" stroke-width="2"/>
      </svg>
    `;
  }

  // --- PARTÍCULAS DE AURA ELEMENTAL (8–12 partículas pixeladas a máx 30 fps registradas en EKLifecycle) ---
  function attachAuraLoop(scope, canvas, auraType) {
    if (!canvas || !scope || !auraType || auraType === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cleanAura = String(auraType).replace(/^aura_/, '');
    const colors = {
      fire: ['#ef4444', '#f97316', '#fde047'],
      water: ['#2563eb', '#38bdf8', '#93c5fd'],
      snow: ['#7dd3fc', '#e0f2fe', '#ffffff'],
      lightning: ['#a855f7', '#c084fc', '#fde047']
    }[cleanAura] || ['#fbbf24'];

    const count = 12;
    const particles = Array.from({ length: count }, (_, i) => ({
      x: 18 + ((i * 13) % (w - 36)),
      y: 20 + ((i * 19) % (h - 30)),
      vy: cleanAura === 'snow' ? (0.6 + (i % 3) * 0.3) : -(0.85 + (i % 3) * 0.4),
      vx: ((i % 2 === 0 ? 1 : -1) * 0.35),
      size: (i % 3 === 0) ? 4.5 : 3.2,
      color: colors[i % colors.length],
      phase: i * 0.6
    }));

    let lastStep = 0;
    const step = (ts) => {
      if (scope.isDisposed() || !canvas.isConnected) return;
      if (canvas.closest && canvas.closest('.cj-phaser-active')) return;
      if (ts - lastStep >= 34) {
        lastStep = ts;
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
          p.y += p.vy;
          p.x += Math.sin(ts * 0.004 + p.phase) * 0.5 + p.vx;
          if (cleanAura === 'snow') {
            if (p.y > h - 10) { p.y = 10; p.x = 18 + Math.random() * (w - 36); }
          } else {
            if (p.y < 10) { p.y = h - 14; p.x = 18 + Math.random() * (w - 36); }
          }
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      scope.raf(step);
    };
    scope.raf(step);
  }

  // --- 24 ILUSTRACIONES VECTORIALES ÚNICAS PARA CADA CARTA DEL MAZO (#001 A #024) ---
  function renderCardIllustrationSvg(element, power, motif = '') {
    const m = motif || (DOJO_CARD_CATALOG.find((c) => c.element === element && c.power === power)?.motif) || '';
    const glowCol = element === 'fire' ? '#f97316' : element === 'water' ? '#38bdf8' : '#bae6fd';
    const baseCol = element === 'fire' ? '#dc2626' : element === 'water' ? '#1d4ed8' : '#0284c7';
    const midCol = element === 'fire' ? '#fb923c' : element === 'water' ? '#3b82f6' : '#38bdf8';

    let artBody = '';
    switch (m) {
      case 'shuriken_fire':
      case 'shuriken_ice':
        artBody = `
          <g transform="translate(40,40)">
            <circle cx="0" cy="0" r="26" fill="none" stroke="${glowCol}" stroke-width="2" stroke-dasharray="5 3"/>
            <polygon points="0,-26 7,-7 26,0 7,7 0,26 -7,7 -26,0 -7,-7" fill="${midCol}" stroke="#fff" stroke-width="1.6"/>
            <polygon points="-17,-17 -3,-7 17,-17 7,-3 17,17 3,7 -17,17 -7,3" fill="${baseCol}" opacity="0.85"/>
            <circle cx="0" cy="0" r="6" fill="#090d16" stroke="#fde047" stroke-width="2"/>
          </g>`;
        break;
      case 'kitsune':
        artBody = `
          <path d="M20,56 Q10,30 26,34 M60,56 Q70,30 54,34" stroke="#fde047" stroke-width="4" fill="none" stroke-linecap="round"/>
          <polygon points="22,34 26,12 36,26" fill="#ea580c" stroke="#fde047" stroke-width="1.2"/>
          <polygon points="58,34 54,12 44,26" fill="#ea580c" stroke="#fde047" stroke-width="1.2"/>
          <polygon points="20,34 60,34 52,58 40,66 28,58" fill="#f97316" stroke="#fff" stroke-width="1.4"/>
          <polygon points="28,44 36,47 30,50" fill="#fef08a"/>
          <polygon points="52,44 44,47 50,50" fill="#fef08a"/>
          <circle cx="40" cy="61" r="3" fill="#090d16"/>`;
        break;
      case 'katana_fire':
        artBody = `
          <path d="M18,62 Q36,24 62,14" stroke="#f97316" stroke-width="9" stroke-linecap="round" opacity="0.45"/>
          <line x1="16" y1="64" x2="64" y2="16" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round"/>
          <line x1="24" y1="48" x2="34" y2="58" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
          <line x1="14" y1="66" x2="26" y2="54" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>
          <circle cx="48" cy="24" r="4" fill="#fde047"/><circle cx="34" cy="36" r="3" fill="#fde047"/>`;
        break;
      case 'lantern':
        artBody = `
          <line x1="40" y1="8" x2="40" y2="18" stroke="#fbbf24" stroke-width="2.5"/>
          <rect x="24" y="18" width="32" height="40" rx="14" fill="#dc2626" stroke="#fde047" stroke-width="2"/>
          <ellipse cx="40" cy="38" rx="10" ry="13" fill="#fde047" opacity="0.85"/>
          <rect x="30" y="15" width="20" height="5" rx="2" fill="#090d16"/>
          <rect x="30" y="56" width="20" height="5" rx="2" fill="#090d16"/>
          <line x1="40" y1="61" x2="40" y2="71" stroke="#fbbf24" stroke-width="3"/>`;
        break;
      case 'tiger':
        artBody = `
          <circle cx="25" cy="22" r="7" fill="#ea580c" stroke="#fde047" stroke-width="1.5"/>
          <circle cx="55" cy="22" r="7" fill="#ea580c" stroke="#fde047" stroke-width="1.5"/>
          <rect x="20" y="22" width="40" height="38" rx="16" fill="#f97316" stroke="#fde047" stroke-width="1.6"/>
          <path d="M22,32 L30,34 M22,40 L29,40 M58,32 L50,34 M58,40 L51,40 M40,22 L40,30" stroke="#090d16" stroke-width="3" stroke-linecap="round"/>
          <polygon points="28,42 36,45 30,48" fill="#fef08a"/><polygon points="52,42 44,45 50,48" fill="#fef08a"/>
          <polygon points="34,54 36,61 38,54" fill="#fff"/><polygon points="46,54 44,61 42,54" fill="#fff"/>`;
        break;
      case 'oni':
        artBody = `
          <path d="M22,26 Q14,6 28,12 L32,24 Z M58,26 Q66,6 52,12 L48,24 Z" fill="#fef08a" stroke="#92400e" stroke-width="1.5"/>
          <rect x="21" y="22" width="38" height="42" rx="14" fill="#b91c1c" stroke="#fca5a5" stroke-width="1.8"/>
          <polygon points="27,36 37,40 28,43" fill="#fde047"/><polygon points="53,36 43,40 52,43" fill="#fde047"/>
          <rect x="28" y="50" width="24" height="7" rx="3" fill="#090d16"/>
          <polygon points="30,57 33,50 36,57" fill="#fff"/><polygon points="50,57 47,50 44,57" fill="#fff"/>`;
        break;
      case 'phoenix':
        artBody = `
          <path d="M40,36 Q12,14 10,44 Q22,44 34,48 Z M40,36 Q68,14 70,44 Q58,44 46,48 Z" fill="#f97316" stroke="#fde047" stroke-width="1.6"/>
          <path d="M40,14 L47,36 L40,66 L33,36 Z" fill="#fde047" stroke="#dc2626" stroke-width="1.5"/>
          <polygon points="40,6 44,16 36,16" fill="#fff"/>
          <circle cx="37" cy="26" r="1.5" fill="#090d16"/><circle cx="43" cy="26" r="1.5" fill="#090d16"/>`;
        break;
      case 'dragon_fire':
      case 'dragon_ice':
        artBody = `
          <path d="M22,22 L12,8 L28,16 Z M58,22 L68,8 L52,16 Z" fill="#fde047"/>
          <polygon points="40,14 60,28 54,58 40,68 26,58 20,28" fill="${baseCol}" stroke="#fff" stroke-width="1.8"/>
          <polygon points="40,20 52,32 48,54 40,61 32,54 28,32" fill="${midCol}"/>
          <polygon points="27,36 37,41 29,44" fill="#fde047"/><polygon points="53,36 43,41 51,44" fill="#fde047"/>
          <path d="M30,56 L34,62 L38,56 M50,56 L46,62 L42,56" stroke="#fff" stroke-width="2" fill="none"/>`;
        break;
      case 'droplet':
        artBody = `
          <path d="M40,12 C56,32 62,44 58,56 C54,65 47,69 40,69 C33,69 26,65 22,56 C18,44 24,32 40,12 Z" fill="#2563eb" stroke="#bae6fd" stroke-width="1.8"/>
          <path d="M34,26 C28,38 27,48 32,56" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round" fill="none"/>
          <circle cx="34" cy="48" r="2.2" fill="#090d16"/><circle cx="46" cy="48" r="2.2" fill="#090d16"/>`;
        break;
      case 'koi':
        artBody = `
          <circle cx="40" cy="40" r="26" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 4"/>
          <path d="M22,34 Q38,14 56,30 Q62,46 44,56 L54,66 L38,58 Q20,50 22,34 Z" fill="#38bdf8" stroke="#fff" stroke-width="1.5"/>
          <circle cx="34" cy="30" r="5" fill="#f97316"/><circle cx="44" cy="42" r="4" fill="#f97316"/>
          <circle cx="29" cy="33" r="1.8" fill="#090d16"/>`;
        break;
      case 'turtle':
        artBody = `
          <ellipse cx="40" cy="42" rx="22" ry="24" fill="#0d9488" stroke="#99f6e4" stroke-width="2"/>
          <polygon points="40,24 52,33 48,50 32,50 28,33" fill="#115e59" stroke="#5eead4" stroke-width="1.5"/>
          <circle cx="40" cy="14" r="6" fill="#2dd4bf"/>
          <circle cx="20" cy="28" r="5" fill="#2dd4bf"/><circle cx="60" cy="28" r="5" fill="#2dd4bf"/>
          <circle cx="22" cy="56" r="5" fill="#2dd4bf"/><circle cx="58" cy="56" r="5" fill="#2dd4bf"/>`;
        break;
      case 'fan_water':
        artBody = `
          <path d="M12,50 A30,30 0 0,1 68,50 L40,64 Z" fill="#1d4ed8" stroke="#bae6fd" stroke-width="2"/>
          <path d="M18,48 A24,24 0 0,1 62,48 L40,60 Z" fill="#38bdf8"/>
          <line x1="40" y1="64" x2="22" y2="28" stroke="#e0f2fe" stroke-width="1.6"/>
          <line x1="40" y1="64" x2="40" y2="20" stroke="#e0f2fe" stroke-width="1.6"/>
          <line x1="40" y1="64" x2="58" y2="28" stroke="#e0f2fe" stroke-width="1.6"/>`;
        break;
      case 'shark':
        artBody = `
          <polygon points="40,12 58,42 52,64 28,64 22,42" fill="#1e40af" stroke="#93c5fd" stroke-width="1.8"/>
          <polygon points="28,48 52,48 48,60 32,60" fill="#090d16"/>
          <polyline points="29,49 33,54 37,49 41,54 45,49 49,54" fill="none" stroke="#fff" stroke-width="2"/>
          <circle cx="31" cy="36" r="2.2" fill="#ef4444"/><circle cx="49" cy="36" r="2.2" fill="#ef4444"/>`;
        break;
      case 'serpent':
        artBody = `
          <path d="M18,62 Q14,38 38,38 T56,18" stroke="#0284c7" stroke-width="12" fill="none" stroke-linecap="round"/>
          <path d="M18,62 Q14,38 38,38 T56,18" stroke="#38bdf8" stroke-width="7" fill="none" stroke-linecap="round"/>
          <circle cx="56" cy="18" r="9" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.5"/>
          <circle cx="58" cy="16" r="2" fill="#fde047"/>`;
        break;
      case 'kraken':
        artBody = `
          <path d="M18,52 Q12,68 24,66 M30,54 Q28,70 36,68 M50,54 Q52,70 44,68 M62,52 Q68,68 56,66" stroke="#38bdf8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
          <ellipse cx="40" cy="34" rx="20" ry="22" fill="#1d4ed8" stroke="#bae6fd" stroke-width="1.8"/>
          <circle cx="32" cy="38" r="3.5" fill="#fde047"/><circle cx="48" cy="38" r="3.5" fill="#fde047"/>`;
        break;
      case 'leviathan':
        artBody = `
          <path d="M10,58 Q26,38 42,56 T72,50" stroke="#7dd3fc" stroke-width="4" fill="none"/>
          <polygon points="40,8 62,28 56,58 24,58 18,28" fill="#1e3a8a" stroke="#7dd3fc" stroke-width="2"/>
          <polygon points="40,4 46,18 34,18" fill="#fde047"/>
          <polygon points="27,34 37,38 29,42" fill="#38bdf8"/><polygon points="53,34 43,38 51,42" fill="#38bdf8"/>`;
        break;
      case 'crystal':
        artBody = `
          <polygon points="40,8 56,28 50,66 30,66 24,28" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
          <polygon points="40,8 56,28 40,44 24,28" fill="#e0f2fe" opacity="0.85"/>
          <polygon points="18,36 28,30 26,56" fill="#0284c7" stroke="#bae6fd" stroke-width="1.4"/>
          <polygon points="62,36 52,30 54,56" fill="#0284c7" stroke="#bae6fd" stroke-width="1.4"/>`;
        break;
      case 'penguin':
        artBody = `
          <ellipse cx="40" cy="44" rx="20" ry="22" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.8"/>
          <ellipse cx="40" cy="48" rx="13" ry="15" fill="#f8fafc"/>
          <rect x="21" y="25" width="38" height="6" rx="3" fill="#090d16" stroke="#fbbf24" stroke-width="1.2"/>
          <polygon points="35,42 45,42 40,49" fill="#fbbf24"/>
          <circle cx="33" cy="36" r="2.2" fill="#090d16"/><circle cx="47" cy="36" r="2.2" fill="#090d16"/>`;
        break;
      case 'owl':
        artBody = `
          <ellipse cx="40" cy="44" rx="20" ry="22" fill="#7dd3fc" stroke="#fff" stroke-width="1.8"/>
          <polygon points="22,24 18,12 32,20" fill="#bae6fd"/><polygon points="58,24 62,12 48,20" fill="#bae6fd"/>
          <circle cx="32" cy="36" r="6.5" fill="#090d16" stroke="#fff" stroke-width="1.5"/>
          <circle cx="48" cy="36" r="6.5" fill="#090d16" stroke="#fff" stroke-width="1.5"/>
          <circle cx="32" cy="36" r="2.5" fill="#fde047"/><circle cx="48" cy="36" r="2.5" fill="#fde047"/>
          <polygon points="37,43 43,43 40,49" fill="#f59e0b"/>`;
        break;
      case 'wolf':
        artBody = `
          <polygon points="22,30 24,10 35,24" fill="#38bdf8" stroke="#fff" stroke-width="1.5"/>
          <polygon points="58,30 56,10 45,24" fill="#38bdf8" stroke="#fff" stroke-width="1.5"/>
          <polygon points="18,30 62,30 54,56 40,66 26,56" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.8"/>
          <polygon points="28,40 37,44 29,46" fill="#e0f2fe"/><polygon points="52,40 43,44 51,46" fill="#e0f2fe"/>
          <polygon points="36,58 44,58 40,64" fill="#090d16"/>`;
        break;
      case 'campfire':
      case 'torch':
      case 'wildfire':
      case 'inferno':
        artBody = `
          <rect x="20" y="60" width="40" height="7" rx="3.5" fill="#7c2d12" stroke="#141824" stroke-width="2" transform="rotate(-8 40 63)"/>
          <rect x="20" y="60" width="40" height="7" rx="3.5" fill="#9a3412" stroke="#141824" stroke-width="2" transform="rotate(8 40 63)"/>
          <path d="M40,12 C56,28 64,44 56,59 C50,67 30,67 24,59 C16,44 24,28 40,12 Z" fill="#ef4444" stroke="#141824" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M40,22 C50,34 54,46 48,57 C44,62 36,62 32,57 C26,46 30,34 40,22 Z" fill="#f97316" stroke="#141824" stroke-width="1.6"/>
          <path d="M40,36 C46,44 47,52 43,58 C41,60 39,60 37,58 C33,52 34,44 40,36 Z" fill="#fde047"/>
          <circle cx="23" cy="24" r="2.8" fill="#fde047"/><circle cx="58" cy="20" r="2.2" fill="#fb923c"/>`;
        break;
      case 'volcano':
        artBody = `
          <polygon points="10,74 30,30 50,30 70,74" fill="#57534e" stroke="#141824" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M30,30 Q35,44 40,37 Q45,46 50,30 L47,30 L33,30 Z" fill="#f97316" stroke="#141824" stroke-width="1.8"/>
          <path d="M40,6 C52,14 55,24 48,30 L32,30 C25,24 28,14 40,6 Z" fill="#ef4444" stroke="#141824" stroke-width="2.2"/>
          <path d="M40,14 C46,19 47,25 43,29 L37,29 C33,25 34,19 40,14 Z" fill="#fde047"/>
          <circle cx="24" cy="16" r="3" fill="#fb923c" stroke="#141824" stroke-width="1.4"/>
          <circle cx="56" cy="14" r="3.4" fill="#fde047" stroke="#141824" stroke-width="1.4"/>`;
        break;
      case 'sun':
        artBody = `
          <g transform="translate(40,40)">
            <polygon points="0,-31 5,-19 16,-27 14,-14 27,-16 19,-5 31,0 19,5 27,16 14,14 16,27 5,19 0,31 -5,19 -16,27 -14,14 -27,16 -19,5 -31,0 -19,-5 -27,-16 -14,-14 -16,-27 -5,-19" fill="#f97316" stroke="#141824" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="0" cy="0" r="17" fill="#fde047" stroke="#141824" stroke-width="2.2"/>
            <circle cx="-5" cy="-3" r="2.2" fill="#141824"/><circle cx="5" cy="-3" r="2.2" fill="#141824"/>
            <path d="M-5,4 Q0,9 5,4" stroke="#141824" stroke-width="2" fill="none" stroke-linecap="round"/>
          </g>`;
        break;
      case 'flame_spirit':
      case 'lava_knight':
      case 'fire_master':
        artBody = `
          <path d="M40,10 C56,22 62,38 56,56 L24,56 C18,38 24,22 40,10 Z" fill="#dc2626" stroke="#141824" stroke-width="2.4"/>
          <circle cx="40" cy="39" r="16" fill="#1e293b" stroke="#141824" stroke-width="2.2"/>
          <rect x="24" y="29" width="32" height="7" rx="3" fill="#ef4444" stroke="#141824" stroke-width="1.8"/>
          <polygon points="30,39 38,42 31,45" fill="#fde047"/><polygon points="50,39 42,42 49,45" fill="#fde047"/>
          <rect x="24" y="54" width="32" height="16" rx="6" fill="#7f1d1d" stroke="#141824" stroke-width="2.2"/>
          <path d="M32,54 L40,62 L48,54" fill="#fbbf24" stroke="#141824" stroke-width="1.5"/>`;
        break;
      case 'stream':
      case 'waterfall':
      case 'torrent':
      case 'flood':
      case 'tsunami':
        artBody = `
          <path d="M8,54 Q20,24 44,24 Q58,24 62,36 Q52,32 45,38 Q38,44 48,52 L72,52 L72,74 L8,74 Z" fill="#0284c7" stroke="#141824" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M16,58 Q28,36 46,34 Q54,34 57,41" stroke="#bae6fd" stroke-width="4" stroke-linecap="round" fill="none"/>
          <circle cx="58" cy="24" r="3.5" fill="#e0f2fe" stroke="#141824" stroke-width="1.4"/>
          <circle cx="65" cy="31" r="2.6" fill="#e0f2fe" stroke="#141824" stroke-width="1.2"/>
          <path d="M12,66 Q26,60 40,66 T68,66" stroke="#7dd3fc" stroke-width="3" fill="none" stroke-linecap="round"/>`;
        break;
      case 'whirlpool':
        artBody = `
          <g transform="translate(40,42)">
            <circle cx="0" cy="0" r="27" fill="#0284c7" stroke="#141824" stroke-width="2.4"/>
            <path d="M0,-20 A20,20 0 1,1 -18,9" stroke="#e0f2fe" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M0,-11 A11,11 0 1,1 -9,5" stroke="#7dd3fc" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <circle cx="0" cy="0" r="5" fill="#1e3a8a" stroke="#fff" stroke-width="1.8"/>
          </g>`;
        break;
      case 'water_spirit':
      case 'sea_knight':
      case 'water_master':
        artBody = `
          <path d="M40,10 C55,22 61,38 55,56 L25,56 C19,38 25,22 40,10 Z" fill="#0284c7" stroke="#141824" stroke-width="2.4"/>
          <circle cx="40" cy="39" r="16" fill="#0f172a" stroke="#141824" stroke-width="2.2"/>
          <rect x="24" y="29" width="32" height="7" rx="3" fill="#38bdf8" stroke="#141824" stroke-width="1.8"/>
          <polygon points="30,39 38,42 31,45" fill="#7dd3fc"/><polygon points="50,39 42,42 49,45" fill="#7dd3fc"/>
          <rect x="24" y="54" width="32" height="16" rx="6" fill="#1e3a8a" stroke="#141824" stroke-width="2.2"/>
          <path d="M32,54 L40,62 L48,54" fill="#38bdf8" stroke="#141824" stroke-width="1.5"/>`;
        break;
      case 'snowflake':
      case 'blizzard':
      case 'icicles':
      case 'glacier':
      case 'avalanche':
      case 'tundra':
        artBody = `
          <polygon points="10,72 28,28 46,72" fill="#38bdf8" stroke="#141824" stroke-width="2.2" stroke-linejoin="round"/>
          <polygon points="32,72 52,18 72,72" fill="#7dd3fc" stroke="#141824" stroke-width="2.4" stroke-linejoin="round"/>
          <polygon points="44,38 52,18 60,38 52,33" fill="#ffffff"/>
          <polygon points="21,44 28,28 35,44 28,40" fill="#e0f2fe"/>
          <circle cx="20" cy="20" r="3" fill="#fff" stroke="#0284c7" stroke-width="1.2"/>
          <circle cx="64" cy="22" r="2.5" fill="#fff" stroke="#0284c7" stroke-width="1.2"/>`;
        break;
      case 'ice_spirit':
      case 'frost_knight':
      case 'ice_master':
        artBody = `
          <polygon points="40,8 60,28 54,56 26,56 20,28" fill="#7dd3fc" stroke="#141824" stroke-width="2.4" stroke-linejoin="round"/>
          <circle cx="40" cy="39" r="15" fill="#0f172a" stroke="#141824" stroke-width="2.2"/>
          <rect x="25" y="29" width="30" height="7" rx="3" fill="#e0f2fe" stroke="#141824" stroke-width="1.8"/>
          <polygon points="30,39 38,42 31,45" fill="#ffffff"/><polygon points="50,39 42,42 49,45" fill="#ffffff"/>
          <rect x="24" y="54" width="32" height="16" rx="6" fill="#0369a1" stroke="#141824" stroke-width="2.2"/>
          <path d="M32,54 L40,62 L48,54" fill="#e0f2fe" stroke="#141824" stroke-width="1.5"/>`;
        break;
      case 'yeti':
      case 'titan_ice':
      default:
        artBody = `
          <polygon points="40,10 62,26 56,64 24,64 18,26" fill="${baseCol}" stroke="#141824" stroke-width="2.4" stroke-linejoin="round"/>
          <polygon points="40,15 56,28 51,59 29,59 24,28" fill="${midCol}"/>
          <polygon points="40,15 56,28 40,42 24,28" fill="#e0f2fe" opacity="0.88"/>
          <rect x="28" y="36" width="8" height="4.5" rx="1.5" fill="#090d16"/>
          <rect x="44" y="36" width="8" height="4.5" rx="1.5" fill="#090d16"/>
          <circle cx="32" cy="38" r="1.4" fill="#fff"/><circle cx="48" cy="38" r="1.4" fill="#fff"/>
          ${m === 'titan_ice' ? `<polygon points="40,2 46,14 34,14" fill="#fde047" stroke="#141824" stroke-width="1.4"/><circle cx="18" cy="18" r="3.5" fill="#fff"/><circle cx="62" cy="18" r="3.5" fill="#fff"/>` : ''}`;
        break;
    }

    const bgTop = element === 'fire' ? '#7f1d1d' : element === 'water' ? '#0c4a6e' : '#1e3a8a';
    const bgBot = element === 'fire' ? '#ea580c' : element === 'water' ? '#0284c7' : '#38bdf8';
    const groundCol = element === 'fire' ? '#450a0a' : element === 'water' ? '#082f49' : '#0f172a';
    const gid = `cjbg_${element}_${power}_${String(m).replace(/[^a-z0-9]/gi, '')}`;
    const burstRays = power >= 7 ? `
      <g opacity="0.22" stroke="#ffffff" stroke-width="2.5">
        <line x1="40" y1="40" x2="0" y2="0"/><line x1="40" y1="40" x2="40" y2="0"/><line x1="40" y1="40" x2="80" y2="0"/>
        <line x1="40" y1="40" x2="80" y2="40"/><line x1="40" y1="40" x2="80" y2="80"/><line x1="40" y1="40" x2="0" y2="80"/>
        <line x1="40" y1="40" x2="0" y2="40"/>
      </g>` : '';

    return `
      <svg viewBox="0 0 80 80" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="display:block;border-radius:7px;">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${bgTop}"/>
            <stop offset="100%" stop-color="${bgBot}"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="80" height="80" fill="url(#${gid})"/>
        ${burstRays}
        <circle cx="40" cy="40" r="28" fill="${glowCol}" opacity="0.28"/>
        <ellipse cx="40" cy="76" rx="46" ry="14" fill="${groundCol}" opacity="0.65"/>
        ${artBody}
      </svg>`;
  }

  const CARD_FRAME_PALETTE = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#06b6d4'];
  function getCardAccentColor(card) {
    if (card && card.accent) return card.accent;
    const p = Number(card?.power) || 2;
    const elBias = card?.element === 'fire' ? 0 : card?.element === 'water' ? 3 : 5;
    return CARD_FRAME_PALETTE[(p + elBias) % CARD_FRAME_PALETTE.length];
  }

  function renderRivalHandHtml(count = 5) {
    return Array.from({ length: count }, (_, i) => `
      <div class="cj-rival-card-back" style="width:28px;height:38px;border-radius:5px;border:1.5px solid #fbbf24;background:linear-gradient(145deg,#1e3a8a,#0f172a);box-shadow:0 3px 8px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;transform:rotate(${(i - 2) * 3}deg);">
        <div style="width:16px;height:16px;border-radius:50%;border:1px solid rgba(251,191,36,0.65);display:flex;align-items:center;justify-content:center;font-size:8px;color:#fbbf24;background:rgba(0,0,0,0.4);">☯</div>
      </div>
    `).join('');
  }

  // --- COMPONENTE DE CARTA DEL DOJO (112×158 px, Numerada #001-#024 con Soporte de Ilustración Digital HD y Creador) ---
  function renderCardHtml(card, idx = 0, opts = {}) {
    const elemTokens = CFG().ELEMENT_TOKENS || {};
    const tok = elemTokens[card.element] || { name: 'FUEGO', color: '#ef4444', bg: '#450a0a', light: '#fca5a5' };
    const power = Number(card.power) || 2;
    const isSpecial = power > SPECIAL_THRESHOLD;
    const tierClass = isSpecial ? ('cj-tier-epic cj-fx-' + card.element) : power >= 5 ? 'cj-tier-mid' : 'cj-tier-low';
    const cardAccent = getCardAccentColor(card);
    const customOverride = (card.no && window.EKCreatorSystem?.getCustomDojoCards) ? window.EKCreatorSystem.getCustomDojoCards()[String(card.no)] : null;
    const finalImgUrl = customOverride?.imgUrl || card.imgUrl || '';
    const artHtml = finalImgUrl
      ? `<div style="width:100%;height:100%;background:url('${finalImgUrl}') center/cover no-repeat;border-radius:7px;"></div>`
      : renderCardIllustrationSvg(card.element, power, card.motif);
    const elemIconSvg = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('elem_' + card.element, 1) : '';
    const delayMs = opts.stagger ? idx * 70 : 0;
    const cardCode = card.code || (`#0${String(card.no || power).padStart(2, '0')}`);
    const cardTitle = customOverride?.name || card.name || tok.name;

    return `
      <div class="cj-card-v191 ${tierClass}" data-idx="${idx}" title="${cardCode} · ${cardTitle} (${tok.name} Poder ${power})" style="--el-color:${tok.color};--el-bg:${tok.bg};--el-light:${tok.light};--card-accent:${cardAccent};animation-delay:${delayMs}ms;">
        ${isSpecial ? `<div class="cj-card-holo"></div><div class="cj-card-fx"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="cj-card-star-badge">★ ESPECIAL</div>` : `<div style="position:absolute;top:7px;right:7px;font-size:8.5px;font-weight:900;color:rgba(255,255,255,0.65);z-index:4;">${cardCode}</div>`}
        ${power >= 5 && !isSpecial ? `<div class="cj-card-shine"></div>` : ''}
        <div class="cj-card-top">
          <div class="cj-card-crest">
            <span class="cj-card-elem-ico" style="display:inline-flex;">${elemIconSvg}</span>
            <span class="cj-card-num">${power}</span>
          </div>
        </div>
        <div class="cj-card-art">${artHtml}</div>
        <div class="cj-card-bottom" style="flex-direction:column;align-items:flex-start;gap:1px;padding:3px 6px;">
          <span style="font-size:8.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">${cardTitle}</span>
          <span style="color:${cardAccent};font-size:7.5px;">${tok.name} ${isSpecial ? '· INVOCACIÓN' : ''}</span>
        </div>
      </div>
    `;
  }

  // --- CLASE PRINCIPAL: CardJitsuGame ---
  class CardJitsuGame {
    constructor(container, onRewardOrOpts, parentScope) {
      this.container = container;
      if (onRewardOrOpts && typeof onRewardOrOpts === 'object') {
        this.opts = onRewardOrOpts;
        this.onReward = onRewardOrOpts.onReward;
      } else {
        this.opts = {};
        this.onReward = onRewardOrOpts;
      }
      this.scope = parentScope || (window.EKLifecycle ? window.EKLifecycle.create('dojo') : null);
      this.sfx = new DojoAudio(this.scope);

      this.destroyed = false;
      this.paused = false;
      this.resumeCountdown = 0;
      this.rewardClaimed = false;
      this.pvp = null;

      this.phase = 'lobby'; // 'lobby' | 'playing' | 'clash' | 'cinematic' | 'ended'
      this.selectedFloor = (CFG().DOJO_FLOORS || [])[0];
      this.playerHand = [];
      this.aiHand = [];
      this.playerPoints = [];
      this.aiPoints = [];
      this.roundLocked = false;
      this.turnSeconds = 14;
      this.turnIntervalId = null;
      this.idleFrame = 0;
      this.playerPose = 'idle';
      this.aiPose = 'idle';
      this.activeParticles = 0;
      this.phaserArena = null;
      this.phaserMountToken = 0;

      this.bindLifecycleEvents();
      this.start();
    }

    _destroyPhaser() {
      this.phaserMountToken++;
      if (this.phaserArena) {
        try { this.phaserArena.destroy(); } catch {}
        this.phaserArena = null;
      }
    }

    bindLifecycleEvents() {
      if (!this.scope) return;
      this.scope.listen(document, 'visibilitychange', () => {
        if (this.destroyed) return;
        if (document.hidden) {
          if (this.phase === 'playing' || this.phase === 'clash') {
            this.pause();
          }
        } else if (this.paused) {
          this.resume();
        }
      });
    }

    start() {
      if (this.destroyed) return;
      // Loop de animación de idle (600ms respiración + cinta de 3 frames)
      if (this.scope) {
        this.scope.interval(() => {
          if (this.destroyed || this.paused || this.phase === 'lobby') return;
          this.idleFrame = (this.idleFrame + 1) % 6;
          this.refreshArenaSprites();
        }, 600);
      }
      this.renderLobby();
    }

    pause() {
      if (this.destroyed || this.paused || this.phase === 'lobby' || this.phase === 'ended') return;
      this.paused = true;
      this.showPauseOverlay('PAUSA · Ventana en segundo plano');
    }

    resume() {
      if (this.destroyed || !this.paused) return;
      this.resumeCountdown = 3;
      this.showPauseOverlay(`Reanudando en ${this.resumeCountdown} s…`);
      const step = () => {
        if (this.destroyed || !this.paused) return;
        this.resumeCountdown--;
        if (this.resumeCountdown <= 0) {
          this.paused = false;
          this.hidePauseOverlay();
        } else {
          this.showPauseOverlay(`Reanudando en ${this.resumeCountdown} s…`);
          if (this.scope) this.scope.timeout(step, 1000);
        }
      };
      if (this.scope) this.scope.timeout(step, 1000);
    }

    showPauseOverlay(msg) {
      if (!this.container) return;
      let ov = this.container.querySelector('#cjPauseOverlay');
      if (!ov) {
        ov = document.createElement('div');
        ov.id = 'cjPauseOverlay';
        ov.style.cssText = 'position:absolute;inset:0;background:rgba(11,14,20,0.86);backdrop-filter:blur(4px);z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;';
        this.container.style.position = 'relative';
        this.container.appendChild(ov);
      }
      ov.innerHTML = `
        <div class="ek-pixel-font" style="font-size:20px;color:#fbbf24;letter-spacing:1px;">⏸ PAUSA</div>
        <div style="font-size:13px;color:#e2e8f0;font-weight:700;"></div>
      `;
      ov.lastElementChild.textContent = msg;
    }

    hidePauseOverlay() {
      const ov = this.container?.querySelector('#cjPauseOverlay');
      if (ov) ov.remove();
    }

    isMatchActive() {
      return !this.destroyed && (this.phase === 'playing' || this.phase === 'clash' || this.phase === 'cinematic');
    }

    confirmAbortIfActive() {
      if (!this.isMatchActive()) return true;
      return window.confirm('¿Salir? Perderás esta partida (sin recompensas)');
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.paused = false;
      this.phase = 'ended';
      this._destroyPhaser();
      if (this.sfx) this.sfx.destroy();
      if (this.scope) this.scope.dispose();
    }

    getClaimedFloors() {
      const v = window.EconomyService ? window.EconomyService.getVault() : {};
      return v.claimedFloors || {};
    }

    markFloorClaimed(level) {
      if (!window.EconomyService) return;
      const v = window.EconomyService.getVault();
      v.claimedFloors[level] = true;
      window.EconomyService.saveVault(v);
    }

    renderLobby() {
      if (this.destroyed || !this.container) return;
      this._destroyPhaser();
      this.phase = 'lobby';
      const floors = CFG().DOJO_FLOORS || [];
      const claimed = this.getClaimedFloors();
      const myNinja = getSavedNinjaConfig();
      const belts = CFG().BELTS || [];
      const myBeltObj = belts.find((b) => b.id === myNinja.belt) || belts[0] || { name: 'Cinturón Blanco', color: '#f8fafc' };

      const coinSvg = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('coin', 1) : '';

      this.container.innerHTML = `
        <div style="background:var(--bg-panel,#0f131d);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:14px;padding:16px;color:#e2e8f0;position:relative;display:flex;flex-direction:column;gap:14px;">
          <!-- Hero Banner del Templo del Dojo Elemental con Arte Caricatura -->
          <div style="position:relative;border-radius:12px;overflow:hidden;border:1.5px solid rgba(251,191,36,0.45);background:linear-gradient(90deg,rgba(15,23,42,0.88) 0%,rgba(15,23,42,0.68) 55%,rgba(15,23,42,0.34) 100%), url('${window.EKCartoonArtManifest?.dojoHero || 'assets/cartoon/dojo_hero.webp'}') center 40%/cover no-repeat;padding:18px 20px;box-shadow:0 8px 24px rgba(0,0,0,0.45);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
            <div style="max-width:520px;">
              <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(251,191,36,0.16);border:1px solid rgba(251,191,36,0.5);color:#fde047;font-size:9.5px;font-weight:900;padding:2px 9px;border-radius:999px;margin-bottom:6px;">
                <span>🏯 TEMPLO IMPERIAL CARD-JITSU</span>
                <span>·</span>
                <span>PISOS DOMINADOS: ${Object.keys(claimed).filter((k) => claimed[k]).length}/${floors.length}</span>
              </div>
              <h3 class="ek-pixel-font" style="margin:0;font-size:15px;color:#ffffff;text-shadow:0 2px 10px rgba(0,0,0,0.9);display:flex;align-items:center;gap:10px;">
                <span>DOJO ELEMENTAL DE CARTAS</span>
              </h3>
              <p style="margin:6px 0 0;font-size:12px;color:#e2e8f0;text-shadow:0 1px 4px #000;">
                Triángulo Elemental: <b style="color:#f87171;">🔥 Fuego vence a Nieve</b> · <b style="color:#7dd3fc;">❄️ Nieve vence a Agua</b> · <b style="color:#60a5fa;">💧 Agua vence a Fuego</b>
              </p>
              <div style="margin-top:8px;font-size:11px;color:#cbd5e1;">
                🏆 Condición de victoria: <b>3 elementos distintos</b> o <b>3 cartas del mismo elemento</b>.
              </div>
            </div>

            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
              <button id="cjBtnMuteLobby" style="background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.2);color:#f8fafc;padding:6px 12px;border-radius:7px;font-size:11px;font-weight:800;cursor:pointer;">
                ${this.sfx.muted ? '🔇 Sonido OFF' : '🔊 Sonido ON'}
              </button>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button id="cjBtnOpenAlbum" style="background:rgba(15,23,42,0.9);backdrop-filter:blur(8px);border:1.5px solid #38bdf8;color:#f8fafc;padding:8px 13px;border-radius:8px;font-size:11.5px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
                  <span>📖</span> <span>Inventario (${getUnlockedCardNumbers().length}/${TOTAL_CARDS})</span>
                </button>
                <button id="cjBtnBuyPack" style="background:linear-gradient(135deg,#f59e0b,#d97706);border:1px solid #fde047;color:#090d16;padding:8px 14px;border-radius:8px;font-size:11.5px;font-weight:900;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 14px rgba(245,158,11,0.45);">
                  <span>🎴</span> <span>Abrir Sobre (250 🪙)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Barra Unificada: Tu Ninja + Duelo Multijugador 1v1 en Vivo -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px;">
            <div style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#141a2a,#0d121d);border:1px solid rgba(56,189,248,0.25);border-radius:10px;padding:10px 14px;">
              <div style="width:54px;height:64px;background:#090d16;border:1.5px solid ${myBeltObj.color};border-radius:9px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;box-shadow:0 0 12px ${myBeltObj.color}33;">
                ${renderPixelNinjaSvg(myNinja, { size: 46, pose: 'idle', frame: 0 })}
              </div>
              <div style="min-width:0;">
                <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;">Tu Discípulo Equipa</div>
                <div style="font-size:13.5px;font-weight:900;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Ninja del Núcleo · <span style="color:${myBeltObj.color};">${myBeltObj.name}</span></div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Mazo activo: <b style="color:#fbbf24;">${getUnlockedCardNumbers().length}/${TOTAL_CARDS} cartas</b> · Personaliza en «Mi Ninja»</div>
              </div>
            </div>

            <div style="background:linear-gradient(135deg,rgba(124,58,237,0.18),rgba(37,99,235,0.14));border:1px solid rgba(168,85,247,0.45);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <div>
                <div style="font-size:12px;font-weight:900;color:#f8fafc;display:flex;align-items:center;gap:6px;">
                  <span>⚔️ DUELO 1v1 EN VIVO</span>
                  <span style="background:#9333ea;color:#fff;font-size:8.5px;padding:2px 6px;border-radius:999px;">PVP ONLINE</span>
                </div>
                <div style="font-size:10.5px;color:#cbd5e1;margin-top:2px;">Reta a tu pareja o amigos conectados (+180 🪙 + Llave Plata).</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <select id="cjPvpTargetSel" style="background:#0b0e14;color:#f8fafc;border:1px solid #4c1d95;border-radius:7px;padding:6px 9px;font-size:11px;font-weight:700;max-width:165px;">
                  <option value="">Jugador conectado…</option>
                  ${(this.opts.getOnlinePlayers ? this.opts.getOnlinePlayers() : []).map((u) => `<option value="${u.id}">🟢 ${u.name}</option>`).join('')}
                </select>
                <button id="cjBtnChallengePvp" class="ek-pixel-font" style="background:linear-gradient(135deg,#9333ea,#6366f1);color:#fff;border:none;padding:7px 12px;border-radius:7px;font-size:9.5px;font-weight:900;cursor:pointer;white-space:nowrap;box-shadow:0 4px 12px rgba(147,51,234,0.4);">
                  ⚔️ RETAR
                </button>
              </div>
            </div>
          </div>

          <!-- Camino de los 9 Maestros de Cinturón de Karate (Cuadrícula 3x3 con Avatares Únicos) -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(192px, 1fr));gap:10px;">
            ${floors.map((f) => {
              const isDone = !!claimed[f.level];
              const guardianPortrait = renderPixelNinjaSvg(f.ninjaConfig, { size: 54, pose: 'idle', frame: 0 });
              const keySprite = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('key_' + f.reward.key, 0.95) : '';
              const trainCoins = Math.round(f.reward.coins * (CFG().TRAINING_REWARD_RULES?.coinMultiplier || 0.5));
              const descSafe = f.desc ?? '';
              return `
                <div class="cj-floor-card" style="background:linear-gradient(180deg,#161d2e 0%,#0d121d 100%);border:1.5px solid ${isDone ? 'rgba(34,197,94,0.55)' : f.color};border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;min-width:0;box-shadow:0 6px 16px rgba(0,0,0,0.45);transition:transform 0.16s ease;">
                  <div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:space-between;min-width:0;margin-bottom:8px;">
                      <span style="font-size:9.5px;font-weight:900;color:${f.color};text-transform:uppercase;letter-spacing:0.4px;">
                        PISO ${f.level}
                      </span>
                      <span style="background:${isDone ? 'rgba(34,197,94,0.18)' : 'rgba(251,191,36,0.16)'};border:1px solid ${isDone ? '#22c55e' : '#fbbf24'};color:${isDone ? '#4ade80' : '#fde047'};font-size:8.5px;font-weight:900;padding:1px 6px;border-radius:999px;">
                        ${isDone ? '✓ DOMINADO' : '★ RETO'}
                      </span>
                    </div>

                    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;margin-bottom:8px;">
                      <div style="width:62px;height:62px;border-radius:12px;border:2px solid ${f.color};background:radial-gradient(circle at 50% 40%, ${f.color}33, #090d16 80%);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 0 14px ${f.color}44;">
                        ${guardianPortrait}
                      </div>
                      <div>
                        <div style="font-size:13px;font-weight:900;color:#f8fafc;line-height:1.2;">${f.name}</div>
                        <div style="font-size:10px;color:${f.color};font-weight:700;margin-top:2px;">${f.belt} · IA ${Math.round(f.aiSkill * 100)}%</div>
                      </div>
                    </div>

                    <p style="font-size:10.5px;color:#94a3b8;margin:0 0 8px;line-height:1.35;text-align:center;">${descSafe}</p>
                  </div>

                  <div>
                    <div style="background:#090d16;border:1px solid rgba(255,255,255,0.08);border-radius:7px;padding:5px 7px;font-size:10px;color:#fbbf24;font-weight:700;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;text-align:center;">
                      ${isDone
                        ? `<span>+${trainCoins}</span> ${coinSvg} <span>· 25% Llave</span>`
                        : `<span>+${f.reward.coins}</span> ${coinSvg} <span>+</span> ${keySprite} <span>${f.reward.keyLabel}</span>`
                      }
                    </div>
                    <button class="cjStartFloorBtn ek-pixel-font" data-level="${f.level}" style="width:100%;background:${f.color};border:none;color:${f.level === 2 || f.level === 5 ? '#090d16' : '#fff'};font-weight:900;font-size:9.5px;padding:9px 8px;border-radius:7px;cursor:pointer;letter-spacing:0.4px;box-shadow:0 4px 12px ${f.color}44;">
                      ${isDone ? 'ENTRENAR' : 'DESAFIAR'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      const muteBtn = this.container.querySelector('#cjBtnMuteLobby');
      if (muteBtn) {
        muteBtn.onclick = () => {
          const muted = this.sfx.toggleMute();
          muteBtn.textContent = muted ? '🔇 Sonido OFF' : '🔊 Sonido ON';
        };
      }

      this.container.querySelectorAll('.cjStartFloorBtn').forEach((btn) => {
        btn.onclick = () => {
          const lvl = Number(btn.getAttribute('data-level'));
          this.sfx.selectCard();
          this.pvp = null;
          this.startMatch(lvl);
        };
      });

      const pvpBtn = this.container.querySelector('#cjBtnChallengePvp');
      const pvpSel = this.container.querySelector('#cjPvpTargetSel');
      if (pvpBtn && pvpSel) {
        pvpBtn.onclick = () => {
          const uid = Number(pvpSel.value);
          if (!uid) return;
          this.sfx.selectCard();
          this.opts.onChallengePlayer?.(uid, 'dojo');
        };
      }

      const albumBtn = this.container.querySelector('#cjBtnOpenAlbum');
      if (albumBtn) {
        albumBtn.onclick = () => {
          this.sfx.selectCard();
          this.openCardAlbumModal();
        };
      }

      const packBtn = this.container.querySelector('#cjBtnBuyPack');
      if (packBtn) {
        packBtn.onclick = () => {
          this.buyCardPack();
        };
      }

      window.__EK?.assertNoBadText(this.container);
    }

    buyCardPack(fromAlbumModal = null) {
      let dData = { coins: 0 };
      try { dData = JSON.parse(localStorage.getItem('epickast.dungeon.v1') || '{}'); } catch {}
      const price = 250;
      if ((dData.coins || 0) < price) {
        alert('🪙 Necesitas 250 Monedas para abrir un Sobre Elemental. ¡Gana monedas en combates del Dojo o en el Bono Diario!');
        return;
      }
      dData.coins = (dData.coins || 0) - price;
      try { localStorage.setItem('epickast.dungeon.v1', JSON.stringify(dData)); } catch {}
      this.sfx.winMatch();
      const res = unlockRandomDojoCard(false);
      if (typeof this.onReward === 'function') {
        this.onReward({ grantId: `pack:${Date.now()}`, coins: 0, key: null, keyCount: 0 });
      }
      if (fromAlbumModal) {
        fromAlbumModal.remove();
      }
      this.openCardAlbumModal(res.card, res.isNew);
      this.renderLobby();
    }

    openCardAlbumModal(justUnlockedCard = null, isNewCard = false) {
      const modal = document.createElement('div');
      modal.className = 'cj-inv-overlay';
      const box = document.createElement('div');
      box.className = 'cj-inv-box';
      modal.appendChild(box);
      document.body.appendChild(modal);

      const state = { elem: 'all', origin: 'all' };
      const elemTabs = [['all', 'Todas'], ['fire', '🔥 Fuego'], ['water', '💧 Agua'], ['snow', '❄️ Nieve'], ['special', '★ Especiales']];
      const originTabs = [['all', 'Todo'], ['base', 'Base'], ['unlock', 'Desbloqueables']];
      const rarityLabel = { base: 'BASE', common: 'COMÚN', rare: 'RARA', special: 'ESPECIAL' };

      const draw = (flashCard, flashNew) => {
        const owned = getUnlockedCardNumbers();
        let dData = { coins: 0 };
        try { dData = JSON.parse(localStorage.getItem('epickast.dungeon.v1') || '{}'); } catch {}
        const matches = (c) => {
          if (state.elem === 'special' ? !(c.power > SPECIAL_THRESHOLD) : (state.elem !== 'all' && c.element !== state.elem)) return false;
          if (state.origin === 'base' && !c.starter) return false;
          if (state.origin === 'unlock' && c.starter) return false;
          return true;
        };
        const sorter = (a, b) => a.power - b.power || ELEM_ORDER.indexOf(a.element) - ELEM_ORDER.indexOf(b.element) || a.no - b.no;
        const list = DOJO_CARD_CATALOG.filter(matches);
        const have = list.filter((c) => owned.includes(c.no)).sort(sorter);
        const missing = list.filter((c) => !owned.includes(c.no)).sort(sorter);
        const unlockOwned = UNLOCK_CARDS.filter((c) => owned.includes(c.no)).length;
        const pct = Math.round((owned.length / TOTAL_CARDS) * 100);

        const tile = (c, isOwned) => {
          if (isOwned) {
            const copies = getCardCopies(c.no);
            return `<div class="cj-inv-tile" data-no="${c.no}">
              ${renderCardHtml(c, 0)}
              <div class="cj-inv-tag cj-inv-${c.rarity}">${rarityLabel[c.rarity] || ''}${!c.starter && copies > 1 ? ` · x${copies}` : ''}</div>
            </div>`;
          }
          const col = (CFG().ELEMENT_TOKENS || {})[c.element]?.color || '#475569';
          return `<div class="cj-inv-tile cj-inv-locked" data-no="${c.no}">
            <div class="cj-card-v191" style="border:2px dashed ${col}66;background:#090d16;cursor:pointer;--card-accent:${col};">
              <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:900;color:#64748b;"><span>${c.code}</span><span>🔒 ${c.power}</span></div>
              <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:34px;color:${col}55;">?</div>
              <div style="font-size:9px;font-weight:800;color:#64748b;text-align:center;">???</div>
            </div>
            <div class="cj-inv-tag cj-inv-lock">${c.power > SPECIAL_THRESHOLD ? '★ ' : ''}EN SOBRES</div>
          </div>`;
        };

        box.innerHTML = `
          <div class="cj-inv-head">
            <div>
              <h3 class="ek-pixel-font" style="margin:0;font-size:14px;color:#fbbf24;">📖 INVENTARIO DE CARTAS</h3>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Cartas 11-12 son <b style="color:#fde047;">★ Especiales</b>: brillo holográfico, partículas y cinemática al ganar.</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="cj-inv-coins">🪙 ${(dData.coins || 0).toLocaleString()}</span>
              <button id="cjAlbumBuyPackBtn" class="cj-inv-btn cj-inv-btn-gold">🎴 Abrir Sobre (250 🪙)</button>
              <button id="cjAlbumCloseBtn" class="cj-inv-btn">✕ Cerrar</button>
            </div>
          </div>
          <div class="cj-inv-progress">
            <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;color:#e2e8f0;margin-bottom:5px;">
              <span>Colección: ${owned.length} / ${TOTAL_CARDS} cartas</span>
              <span style="color:#a5b4fc;">Desbloqueables: ${unlockOwned} / ${UNLOCK_CARDS.length}</span>
            </div>
            <div class="cj-inv-bar"><div style="width:${pct}%;"></div></div>
          </div>
          ${flashCard ? `
            <div class="cj-inv-flash">
              ${renderCardHtml(flashCard, 0)}
              <div>
                <div class="ek-pixel-font" style="font-size:12px;color:#fde047;margin-bottom:4px;">${flashNew ? '🎉 ¡NUEVA CARTA DESBLOQUEADA!' : '✨ ¡CARTA REPETIDA! (+1 copia)'}</div>
                <div style="font-size:15px;font-weight:900;color:#fff;">${flashCard.name} · Poder ${flashCard.power}</div>
                <div style="font-size:11.5px;color:#cbd5e1;margin-top:4px;">${flashCard.power > SPECIAL_THRESHOLD ? '★ Carta especial: desata una invocación cinemática al ganar un choque.' : 'Ya está disponible en tu mazo.'}</div>
              </div>
            </div>` : ''}
          <div class="cj-inv-filters">
            <div class="cj-inv-tabs">${elemTabs.map(([k, n]) => `<button data-elem="${k}" class="${state.elem === k ? 'on' : ''}">${n}</button>`).join('')}</div>
            <div class="cj-inv-tabs">${originTabs.map(([k, n]) => `<button data-origin="${k}" class="${state.origin === k ? 'on' : ''}">${n}</button>`).join('')}</div>
          </div>
          <div class="cj-inv-section">Cartas desbloqueadas <span>(${have.length})</span></div>
          <div class="cj-inv-grid">${have.map((c) => tile(c, true)).join('') || '<div style="color:#64748b;font-size:12px;">Sin cartas en este filtro.</div>'}</div>
          ${missing.length ? `<div class="cj-inv-section">Por descubrir <span>(${missing.length})</span></div>
          <div class="cj-inv-grid">${missing.map((c) => tile(c, false)).join('')}</div>` : ''}
        `;

        box.querySelector('#cjAlbumCloseBtn').onclick = () => modal.remove();
        box.querySelector('#cjAlbumBuyPackBtn').onclick = () => this.buyCardPack(modal);
        box.querySelectorAll('[data-elem]').forEach((b) => { b.onclick = () => { state.elem = b.dataset.elem; draw(); }; });
        box.querySelectorAll('[data-origin]').forEach((b) => { b.onclick = () => { state.origin = b.dataset.origin; draw(); }; });
        box.querySelectorAll('.cj-inv-tile').forEach((t) => { t.onclick = () => showDetail(Number(t.dataset.no)); });
      };

      const showDetail = (no) => {
        const c = DOJO_CARD_CATALOG.find((x) => x.no === no);
        if (!c) return;
        const isOwned = getUnlockedCardNumbers().includes(no);
        const tok = (CFG().ELEMENT_TOKENS || {})[c.element] || { name: c.element, color: '#38bdf8' };
        const copies = getCardCopies(no);
        const d = document.createElement('div');
        d.className = 'cj-inv-detail';
        d.innerHTML = `
          <div class="cj-inv-detail-box" style="--dc:${tok.color};">
            <div style="transform:scale(1.5);margin:34px 30px;">${isOwned ? renderCardHtml(c, 0) : `<div class="cj-card-v191" style="border:2px dashed ${tok.color};background:#090d16;"><div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:44px;color:${tok.color}66;">?</div></div>`}</div>
            <div style="min-width:200px;max-width:260px;">
              <div style="font-size:19px;font-weight:900;color:#fff;">${isOwned ? c.name : '??? Carta bloqueada'}</div>
              <div class="cj-inv-tag cj-inv-${c.rarity}" style="display:inline-block;margin:6px 0;">${rarityLabel[c.rarity]}</div>
              <div class="cj-inv-stat"><span>Elemento</span><b style="color:${tok.color};">${tok.name}</b></div>
              <div class="cj-inv-stat"><span>Poder</span><b>${c.power}</b></div>
              <div class="cj-inv-stat"><span>Código</span><b>${c.code}</b></div>
              <div class="cj-inv-stat"><span>Origen</span><b>${c.starter ? 'Mazo base (todos)' : 'Sobres / desbloqueable'}</b></div>
              <div class="cj-inv-stat"><span>Copias</span><b>${isOwned ? (c.starter ? '∞' : copies) : 0}</b></div>
              <div style="font-size:11.5px;color:#cbd5e1;margin-top:10px;line-height:1.45;">${c.power > SPECIAL_THRESHOLD ? '★ <b style="color:#fde047;">Carta Especial.</b> Marco holográfico animado y partículas elementales. Al ganar un choque lanza una invocación cinemática a pantalla completa.' : `Gana choques de ${tok.name} contra elementos más débiles con poder mayor.`}</div>
              <button class="cj-inv-btn" style="margin-top:14px;" id="cjDetailClose">Volver</button>
            </div>
          </div>`;
        d.onclick = (e) => { if (e.target === d || e.target.id === 'cjDetailClose') d.remove(); };
        modal.appendChild(d);
      };

      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
      draw(justUnlockedCard, isNewCard);
    }

    drawRandomCard(isAi = false) {
      const unlockedNos = getUnlockedCardNumbers();
      const pool = isAi
        ? DOJO_CARD_CATALOG
        : DOJO_CARD_CATALOG.filter((c) => unlockedNos.includes(c.no));
      const chosen = pool[Math.floor(Math.random() * pool.length)] || DOJO_CARD_CATALOG[0];
      return {
        ...chosen,
        id: Math.random().toString(36).slice(2, 9)
      };
    }

    startMatch(level) {
      if (this.destroyed) return;
      const floors = CFG().DOJO_FLOORS || [];
      this.selectedFloor = floors.find((f) => f.level === level) || floors[0];
      this.phase = 'playing';
      this.rewardClaimed = false;
      this.roundLocked = false;
      this.playerPose = 'idle';
      this.aiPose = 'idle';
      this.playerPoints = [];
      this.aiPoints = [];
      this.playerHand = Array.from({ length: 5 }, () => this.drawRandomCard(false));
      this.aiHand = Array.from({ length: 5 }, () => this.drawRandomCard(true));

      this.renderMatchArena({ staggerHand: true });
      this.setSpeech(this.selectedFloor.quotes.start);
      this.startTurnTimer();
    }

    startPvpMatch(opponent, roomId, sendPlay) {
      if (this.destroyed) return;
      const oppName = opponent?.name || 'Rival';
      this.pvp = {
        opponent: { id: opponent?.id, name: oppName },
        roomId,
        sendPlay,
        myPendingCard: null,
        myPendingIdx: null,
        oppPendingCard: null,
        waitTimeout: null,
      };
      this.selectedFloor = {
        level: 'PVP',
        name: oppName,
        belt: 'Duelo 1v1 en Vivo',
        color: '#a855f7',
        spriteKey: 'sensei_master',
        aiSkill: 0.5,
        ninjaConfig: opponent?.ninjaConfig || { suit: 'suit_shadow', belt: 'belt_black', weapon: 'wpn_katana', aura: 'aura_lightning' },
        quotes: {
          start: `¡Duelo 1v1 en vivo contra ${oppName}! Elige tu carta elemental.`,
          winRound: `${oppName} gana este asalto elemental.`,
          loseRound: `¡Tu carta venció a la de ${oppName}!`,
          tie: '¡Choque de poder idéntico! Empate en este turno.',
          winMatch: `¡Derrotaste a ${oppName} en duelo directo 1v1!`,
          loseMatch: `${oppName} se lleva la victoria en este duelo.`
        },
        reward: { coins: 180, key: 'silver', keyLabel: '1 Llave de Plata (Victoria PvP)' }
      };
      this.phase = 'playing';
      this.rewardClaimed = false;
      this.roundLocked = false;
      this.playerPose = 'idle';
      this.aiPose = 'idle';
      this.playerPoints = [];
      this.aiPoints = [];
      this.playerHand = Array.from({ length: 5 }, () => this.drawRandomCard());
      this.aiHand = Array.from({ length: 5 }, () => this.drawRandomCard());

      this.renderMatchArena({ staggerHand: true });
      this.setSpeech(this.selectedFloor.quotes.start);
      this.startTurnTimer();
    }

    onOpponentPlay(card) {
      if (this.destroyed || !this.pvp || !card) return;
      if (this.pvp.myPendingCard !== null) {
        if (this.pvp.waitTimeout && this.scope) this.scope.clearTimeout(this.pvp.waitTimeout);
        const myIdx = this.pvp.myPendingIdx;
        const myCard = this.pvp.myPendingCard;
        this.pvp.myPendingCard = null;
        this.pvp.myPendingIdx = null;
        this._executeRoundClash(myIdx, myCard, card);
      } else {
        this.pvp.oppPendingCard = card;
        this.setSpeech(`⚡ ¡${this.pvp.opponent.name} ya eligió su carta! Elige la tuya.`);
      }
    }

    startTurnTimer() {
      this.stopTurnTimer();
      if (this.destroyed || this.phase !== 'playing') return;
      this.turnSeconds = 14;
      this.updateTimerHud();

      this.turnIntervalId = this.scope ? this.scope.interval(() => {
        if (this.destroyed || this.paused || this.phase !== 'playing' || this.roundLocked) return;
        this.turnSeconds--;
        this.updateTimerHud();
        if (this.turnSeconds <= 0) {
          this.stopTurnTimer();
          const randIdx = Math.floor(Math.random() * this.playerHand.length);
          this.playRound(randIdx);
        }
      }, 1000) : null;
    }

    stopTurnTimer() {
      if (this.turnIntervalId && this.scope) {
        this.scope.clearInterval(this.turnIntervalId);
        this.turnIntervalId = null;
      }
    }

    updateTimerHud() {
      const txt = this.container?.querySelector('#cjTurnTimerText');
      const bar = this.container?.querySelector('#cjTurnTimerBar');
      if (txt) {
        txt.textContent = `${this.turnSeconds}s`;
        txt.style.color = this.turnSeconds <= 4 ? '#ef4444' : '#38bdf8';
      }
      if (bar) {
        bar.style.width = `${Math.max(0, (this.turnSeconds / 14) * 100)}%`;
        bar.style.background = this.turnSeconds <= 4 ? '#ef4444' : '#38bdf8';
      }
    }

    setSpeech(text) {
      const b = this.container?.querySelector('#cjSenseiSpeech');
      if (b) b.textContent = `«${text || ''}»`;
    }

    isMatchPoint(points) {
      const byElem = { fire: 0, water: 0, snow: 0 };
      for (const p of points) byElem[p.element] = (byElem[p.element] || 0) + 1;
      const distinctElems = (byElem.fire > 0 ? 1 : 0) + (byElem.water > 0 ? 1 : 0) + (byElem.snow > 0 ? 1 : 0);
      return distinctElems === 2 || byElem.fire === 2 || byElem.water === 2 || byElem.snow === 2;
    }

    formatPointsRow(points) {
      const elems = ['fire', 'water', 'snow'];
      const tokMap = CFG().ELEMENT_TOKENS || {};
      const colsHtml = elems.map((el) => {
        const tok = tokMap[el] || { color: '#ef4444', bg: '#450a0a', name: el.toUpperCase() };
        const cards = points.filter((p) => p.element === el);
        const ico = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('elem_' + el, 0.85) : '';
        if (!cards.length) {
          return `
            <div class="cj-stack-col" title="0 cartas de ${tok.name || el}">
              <div class="cj-stack-slot-empty">
                <span>${ico}</span>
                <span style="margin-top:2px;">0</span>
              </div>
            </div>`;
        }
        const miniCards = cards.map((c, idx) => {
          const acc = getCardAccentColor(c);
          return `
            <div class="cj-mini-card" style="background:linear-gradient(135deg,${tok.bg},#090d16);border:1.5px solid ${acc};transform:translateX(${idx * 2}px);">
              <span style="display:inline-flex;">${ico}</span>
              <span>${c.power}</span>
            </div>`;
        }).join('');
        const countBadge = cards.length >= 2
          ? `<span class="cj-stack-count-badge" title="${cards.length} cartas apiladas de ${tok.name || el}">×${cards.length}</span>`
          : '';
        return `
          <div class="cj-stack-col" title="${cards.length} carta(s) de ${tok.name || el}: [${cards.map((c) => c.power).join(', ')}]">
            <div class="cj-stack-pile">
              ${countBadge}
              ${miniCards}
            </div>
          </div>`;
      }).join('');

      const matchPointHtml = this.isMatchPoint(points)
        ? `<span class="cj-matchpoint-badge" title="¡A solo 1 carta de ganar el duelo!">⚠️ ¡A 1 CARTA!</span>`
        : '';
      return `<div class="cj-stack-group">${colsHtml}${matchPointHtml}</div>`;
    }

    refreshArenaSprites() {
      if (this.destroyed || !this.container) return;
      if (this.phaserArena && this.phaserArena.isReady()) return;
      const pBox = this.container.querySelector('#cjPlayerSpriteWrap');
      const aBox = this.container.querySelector('#cjAiSpriteWrap');
      if (pBox) {
        pBox.innerHTML = renderPixelNinjaSvg(getSavedNinjaConfig(), {
          size: 120,
          pose: this.playerPose,
          frame: this.idleFrame
        });
      }
      if (aBox && this.selectedFloor) {
        aBox.innerHTML = renderPixelNinjaSvg(this.selectedFloor.ninjaConfig, {
          size: 120,
          flip: true,
          pose: this.aiPose,
          frame: this.idleFrame
        });
      }
    }

    renderMatchArena(opts = {}) {
      if (this.destroyed || !this.container) return;
      this._destroyPhaser();
      const f = this.selectedFloor;
      const myNinja = getSavedNinjaConfig();
      const belts = CFG().BELTS || [];
      const myBeltObj = belts.find((b) => b.id === myNinja.belt || ('belt_' + b.id) === myNinja.belt) || belts[0] || { name: 'Cinturón Blanco', color: '#f8fafc' };

      this.container.innerHTML = `
        <div id="cjMatchRoot" style="background:var(--bg-panel,#0f131d);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:14px;color:#e2e8f0;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden;">
          <!-- Marcador Superior Estilo Card-Jitsu con Pilas de Cartas en Cascada -->
          <div style="background:linear-gradient(180deg,#161d2e 0%,#0f1420 100%);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;box-shadow:0 6px 16px rgba(0,0,0,0.4);">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <div style="display:flex;flex-direction:column;">
                <span id="cjPlayerScoreLabel" class="ek-pixel-font" style="font-size:9.5px;color:#38bdf8;">TÚ (${this.playerPoints.length})</span>
                <span style="font-size:9px;color:#64748b;">Pilas Elementales</span>
              </div>
              <div id="cjPlayerScoreRow" style="display:flex;gap:5px;flex-wrap:wrap;">${this.formatPointsRow(this.playerPoints)}</div>
            </div>

            <div style="display:flex;flex-direction:column;align-items:center;min-width:150px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span class="ek-pixel-font" style="font-size:9px;color:#94a3b8;">TURNO: <b id="cjTurnTimerText" style="color:#38bdf8;">${this.turnSeconds}s</b></span>
                <button id="cjBtnMuteArena" style="background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:2px 7px;border-radius:4px;font-size:10px;cursor:pointer;" title="Silenciar efectos">${this.sfx.muted ? '🔇' : '🔊'}</button>
                <button id="cjBtnExitMatch" style="background:#1e293b;border:1px solid #475569;color:#cbd5e1;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;cursor:pointer;">✕ Salir</button>
              </div>
              <div style="width:140px;height:5px;background:#0b0e14;border-radius:3px;overflow:hidden;">
                <div id="cjTurnTimerBar" style="width:100%;height:100%;background:#38bdf8;transition:width 0.25s linear;"></div>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <div id="cjAiScoreRow" style="display:flex;gap:5px;flex-wrap:wrap;">${this.formatPointsRow(this.aiPoints)}</div>
              <div style="display:flex;flex-direction:column;text-align:right;">
                <span id="cjAiScoreLabel" class="ek-pixel-font" style="font-size:9.5px;color:${f.color};">RIVAL (${this.aiPoints.length})</span>
                <span style="font-size:9px;color:#64748b;">Pilas del Rival</span>
              </div>
            </div>
          </div>

          <!-- Escenario Tatami Tradicional del Dojo (Phaser 3 + Fallback Vectorial Calmo) -->
          <div id="cjBattleStage" style="position:relative;min-height:268px;border-radius:12px;border:2px solid #8b6843;background:#efe6d2;display:grid;grid-template-columns:168px 1fr 168px;align-items:center;padding:12px 16px;overflow:hidden;box-shadow:inset 0 0 18px rgba(110,78,46,0.22);">
            <div id="cjPhaserHost" class="ek-phaser-stage-host" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:hidden;"></div>
            <div id="cjBackdropSvgWrap" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;">
              ${renderDojoBackdropSvg(f.color)}
            </div>

            <!-- Combatiente Jugador -->
            <div id="cjPlayerCharBox" style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;transition:transform 0.18s ease;">
              <div style="position:relative;width:136px;height:156px;display:flex;align-items:center;justify-content:center;">
                <canvas id="cjPlayerAuraCanvas" width="136" height="156" style="position:absolute;inset:0;pointer-events:none;"></canvas>
                <div id="cjPlayerSpriteWrap">${renderPixelNinjaSvg(myNinja, { size: 124, pose: this.playerPose, frame: this.idleFrame })}</div>
              </div>
              <div style="background:rgba(20,26,40,0.92);border:1.5px solid #38bdf8;border-radius:8px;padding:3px 12px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.35);">
                <div style="font-size:11.5px;font-weight:900;color:#fff;">Tú</div>
                <div style="font-size:9.5px;color:${myBeltObj.color};font-weight:700;">${myBeltObj.name}</div>
              </div>
            </div>

            <!-- Zona Central de Choque + Mano Boca Abajo del Rival -->
            <div id="cjCenterClashZone" style="position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:space-between;min-height:236px;padding-top:2px;">
              <div style="position:relative;top:2px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;">
                <div id="cjRivalHandRow" class="cj-rival-hand" style="display:flex;align-items:center;justify-content:center;gap:3px;" title="Mano oculta del rival (5 cartas)">${renderRivalHandHtml(5)}</div>
              </div>
              <div id="cjArenaTable" style="display:flex;align-items:center;justify-content:center;gap:22px;flex:1;width:100%;">
                <div style="margin-top:auto;margin-bottom:4px;padding:3px 12px;font-size:10px;border-radius:999px;background:rgba(15, 23, 42, 0.76);border:1px solid rgba(255,255,255,0.18);color:#f8fafc;font-weight:800;backdrop-filter:blur(4px);box-shadow:0 4px 12px rgba(0,0,0,0.25);white-space:nowrap;">
                  ⚡ Elige tu carta · 🔥 &gt; ❄️ &gt; 💧 &gt; 🔥
                </div>
              </div>
            </div>

            <!-- Combatiente Guardián -->
            <div id="cjAiCharBox" style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;transition:transform 0.18s ease;">
              <div id="cjSenseiSpeech" style="position:absolute;top:-6px;right:4px;background:rgba(15,23,42,0.92);border:1.5px solid ${f.color};color:#f8fafc;padding:3px 10px;border-radius:10px;font-size:10px;font-style:italic;text-align:center;width:190px;box-shadow:0 4px 12px rgba(0,0,0,0.45);z-index:8;pointer-events:none;"></div>
              <div style="position:relative;width:136px;height:156px;display:flex;align-items:center;justify-content:center;">
                <canvas id="cjAiAuraCanvas" width="136" height="156" style="position:absolute;inset:0;pointer-events:none;"></canvas>
                <div id="cjAiSpriteWrap">${renderPixelNinjaSvg(f.ninjaConfig, { size: 124, flip: true, pose: this.aiPose, frame: this.idleFrame })}</div>
              </div>
              <div style="background:rgba(20,26,40,0.92);border:1.5px solid ${f.color};border-radius:8px;padding:3px 12px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.35);">
                <div style="font-size:11.5px;font-weight:900;color:${f.color};">${f.name}</div>
                <div style="font-size:9.5px;color:#cbd5e1;font-weight:700;">${f.belt} · Piso ${f.level}</div>
              </div>
            </div>
          </div>

          <!-- Mano de 5 Cartas (112×158 px) -->
          <div style="background:linear-gradient(180deg,#141a29 0%,#0d111b 100%);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;">
            <style>
              #cjHandRow { display:flex; justify-content:center; align-items:flex-end; gap:12px; flex-wrap:nowrap; min-height:168px; padding-top:10px; box-sizing:border-box; }
              #cjHandRow .cj-card-v191 { margin:0 !important; align-self:flex-end; transition:transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.18s ease !important; will-change:transform; }
              #cjHandRow .cj-card-v191:hover { transform:translateY(-10px) scale(1.03) !important; z-index:12; }
            </style>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span class="ek-pixel-font" style="font-size:10px;color:#94a3b8;">TU MANO ELEMENTAL (HAZ CLIC PARA LANZAR)</span>
              <span style="font-size:10.5px;color:#fbbf24;font-weight:700;">★ Cartas 10–12 activan cinemática elemental</span>
            </div>
            <div id="cjHandRow">
              ${this.playerHand.map((c, i) => renderCardHtml(c, i, { stagger: !!opts.staggerHand })).join('')}
            </div>
          </div>
        </div>
      `;

      // Iniciar partículas de aura elemental (fallback mientras carga Phaser)
      attachAuraLoop(this.scope, this.container.querySelector('#cjPlayerAuraCanvas'), myNinja.aura);
      attachAuraLoop(this.scope, this.container.querySelector('#cjAiAuraCanvas'), f.ninjaConfig?.aura);

      // Montar escena Phaser 3 UNA sola vez por partida (sin recrear entre rondas)
      const phaserHost = this.container.querySelector('#cjPhaserHost');
      const battleStage = this.container.querySelector('#cjBattleStage');
      if (phaserHost && battleStage && window.EKDojoPhaser && typeof window.EKDojoPhaser.mount === 'function') {
        const mountToken = this.phaserMountToken;
        const opponentName = this.pvp ? (this.pvp.opponent?.name || f.name) : f.name;
        window.EKDojoPhaser.mount(phaserHost, {
          playerConfig: myNinja,
          aiConfig: f.ninjaConfig,
          floorColor: f.color,
          playerName: 'Tú',
          aiName: opponentName,
          accentColor: f.color,
          isDisposed: () => this.destroyed || mountToken !== this.phaserMountToken
        }).then((handle) => {
          if (this.destroyed || mountToken !== this.phaserMountToken || !handle || !handle.isReady()) {
            if (handle && typeof handle.destroy === 'function') handle.destroy();
            return;
          }
          this.phaserArena = handle;
          battleStage.classList.add('cj-phaser-active');
          ['#cjBackdropSvgWrap', '#cjPlayerSpriteWrap', '#cjAiSpriteWrap', '#cjPlayerAuraCanvas', '#cjAiAuraCanvas'].forEach((sel) => {
            const el = battleStage.querySelector(sel);
            if (el) el.style.visibility = 'hidden';
          });
        }).catch(() => {});
      }

      const exitBtn = this.container.querySelector('#cjBtnExitMatch');
      if (exitBtn) {
        exitBtn.onclick = () => {
          if (!this.confirmAbortIfActive()) return;
          this.stopTurnTimer();
          this.renderLobby();
        };
      }

      const muteBtn = this.container.querySelector('#cjBtnMuteArena');
      if (muteBtn) {
        muteBtn.onclick = () => {
          const m = this.sfx.toggleMute();
          muteBtn.textContent = m ? '🔇' : '🔊';
        };
      }

      this.bindHandClicks();
      window.__EK?.assertNoBadText(this.container);
    }

    resetRoundUI() {
      if (this.destroyed || !this.container) return;

      const pScore = this.container.querySelector('#cjPlayerScoreRow');
      const aScore = this.container.querySelector('#cjAiScoreRow');
      if (pScore) pScore.innerHTML = this.formatPointsRow(this.playerPoints);
      if (aScore) aScore.innerHTML = this.formatPointsRow(this.aiPoints);

      const pScoreLabel = this.container.querySelector('#cjPlayerScoreLabel');
      const aScoreLabel = this.container.querySelector('#cjAiScoreLabel');
      if (pScoreLabel) pScoreLabel.textContent = `TÚ (${this.playerPoints.length})`;
      if (aScoreLabel) aScoreLabel.textContent = `RIVAL (${this.aiPoints.length})`;

      const rivalHandRow = this.container.querySelector('#cjRivalHandRow');
      if (rivalHandRow) rivalHandRow.innerHTML = renderRivalHandHtml(5);

      const table = this.container.querySelector('#cjArenaTable');
      if (table) {
        table.innerHTML = `
          <div style="margin-top:auto;margin-bottom:6px;padding:4px 12px;font-size:10.5px;border-radius:999px;background:rgba(15, 23, 42, 0.72);border:1px solid rgba(255,255,255,0.18);color:#f8fafc;font-weight:800;backdrop-filter:blur(4px);box-shadow:0 4px 12px rgba(0,0,0,0.25);white-space:nowrap;">
            ⚡ Elige tu carta · 🔥 &gt; ❄️ &gt; 💧 &gt; 🔥
          </div>
        `;
      }

      const handRow = this.container.querySelector('#cjHandRow');
      if (handRow) {
        handRow.innerHTML = this.playerHand.map((c, i) => renderCardHtml(c, i, { stagger: false })).join('');
        this.bindHandClicks();
      }

      const pCharBox = this.container.querySelector('#cjPlayerCharBox');
      const aCharBox = this.container.querySelector('#cjAiCharBox');
      [pCharBox, aCharBox].forEach((box) => {
        if (!box) return;
        box.style.transform = '';
        box.classList.remove('cj-ninja-hit-shake');
        const oldGag = box.querySelector('.cj-loser-gag');
        if (oldGag) oldGag.remove();
      });

      if (this.phaserArena && this.phaserArena.isReady()) {
        this.phaserArena.resetToIdle();
      } else {
        this.refreshArenaSprites();
      }

      window.__EK?.assertNoBadText(this.container);
    }

    bindHandClicks() {
      if (!this.container) return;
      this.container.querySelectorAll('#cjHandRow .cj-card-v191').forEach((cardEl) => {
        cardEl.onclick = () => {
          if (this.destroyed || this.paused || this.roundLocked || this.phase !== 'playing') return;
          const idx = Number(cardEl.getAttribute('data-idx'));
          cardEl.classList.add('cj-card-selected');
          this.playRound(idx);
        };
      });
    }

    chooseAiCardIndex(playerCard) {
      const skill = this.selectedFloor?.aiSkill || 0.3;
      if (Math.random() < skill) {
        for (let i = 0; i < this.aiHand.length; i++) {
          if (this.resolveOutcome(this.aiHand[i], playerCard) === 'player') return i;
        }
      }
      return Math.floor(Math.random() * this.aiHand.length);
    }

    resolveOutcome(pCard, aCard) {
      if (pCard.element === aCard.element) {
        if (pCard.power > aCard.power) return 'player';
        if (aCard.power > pCard.power) return 'ai';
        return 'tie';
      }
      const beats = { fire: 'snow', snow: 'water', water: 'fire' };
      return beats[pCard.element] === aCard.element ? 'player' : 'ai';
    }

    // --- CINEMÁTICA DE CARTAS 10+ A PANTALLA COMPLETA DEL TABLERO (Solo cuando la carta 10+ GANA la ronda) ---
    triggerCinematic(card, isPlayer, onDone) {
      if (this.destroyed) return;
      const rootStage = this.container?.querySelector('#cjMatchRoot') || this.container?.querySelector('#cjBattleStage');
      if (!rootStage) { onDone(); return; }

      const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const tok = (CFG().ELEMENT_TOKENS || {})[card.element] || { color: '#ef4444', name: 'FUEGO', bg: '#450a0a' };

      if (reducedMotion) {
        const flash = document.createElement('div');
        flash.style.cssText = `position:absolute;inset:0;background:${tok.color};opacity:0.45;z-index:60;pointer-events:none;transition:opacity 0.6s;`;
        rootStage.appendChild(flash);
        this.scope.timeout(() => {
          flash.remove();
          if (!this.destroyed) onDone();
        }, 600);
        return;
      }

      this.phase = 'cinematic';
      this.sfx.cinematicPower();

      const overlay = document.createElement('div');
      overlay.className = 'cj-cinematic-v191';
      overlay.style.cssText = 'position:absolute;inset:0;background:radial-gradient(circle at 50% 48%, rgba(15,23,42,0.95) 0%, rgba(3,5,11,0.99) 90%);backdrop-filter:blur(14px);z-index:85;display:flex;flex-direction:column;justify-content:space-between;align-items:center;overflow:hidden;cursor:pointer;';

      const titleMap = {
        fire: '¡CATACLISMO DEL DRAGÓN DE MAGMA!',
        water: '¡MAREMOTO DEL LEVIATÁN ABISAL!',
        snow: '¡ERA GLACIAL: CERO ABSOLUTO!'
      };
      const customTitle = card.cineTitle || titleMap[card.element] || '¡INVOCACIÓN ELEMENTAL SUPREMA!';
      const cardCode = card.code || (`#0${String(card.no || card.power).padStart(2, '0')}`);

      overlay.innerHTML = `
        <div class="cj-cine-bar" style="width:100%;height:14%;background:linear-gradient(90deg,#000,${tok.bg || '#1e1b4b'},#000);border-bottom:2.5px solid ${tok.color};display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 6px 24px ${tok.color}77;z-index:4;">
          <span class="ek-pixel-font" style="font-size:11.5px;color:#fde047;letter-spacing:1.4px;">★ CARTA ESPECIAL ${cardCode} · ${ (card.name || tok.name).toUpperCase() } (PODER ${card.power}) ★</span>
        </div>
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;flex:1;overflow:hidden;">
          <canvas id="cjCineCanvas" width="760" height="360" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;"></canvas>
          <div style="position:relative;z-index:3;display:flex;align-items:center;justify-content:center;gap:34px;">
            <div style="transform:scale(1.12) rotate(-6deg);box-shadow:0 0 36px ${tok.color};border-radius:12px;">
              ${renderCardHtml(card, 0)}
            </div>
            <div style="transform:scale(2.15);filter:drop-shadow(0 0 28px ${tok.color});">
              ${card.imgUrl ? `<div class="cj-cine-art" style="width:70px;height:88px;border-radius:7px;border:1.5px solid ${tok.color};background:url('${card.imgUrl}') center/cover;"></div>` : renderCardIllustrationSvg(card.element, card.power, card.motif)}
            </div>
          </div>
          <div class="ek-pixel-font" style="position:relative;z-index:3;font-size:16px;color:#fff;text-shadow:0 0 18px ${tok.color}, 0 3px 8px #000;margin-top:10px;letter-spacing:1px;text-align:center;">${customTitle}</div>
          <div id="cjCineSkipHint" style="position:relative;z-index:3;font-size:10.5px;color:#e2e8f0;opacity:0;background:rgba(0,0,0,0.65);border:1px solid rgba(255,255,255,0.2);padding:3px 12px;border-radius:999px;">Clic / Espacio / ESC para saltar</div>
        </div>
        <div class="cj-cine-bar" style="width:100%;height:14%;background:linear-gradient(90deg,#000,${tok.bg || '#1e1b4b'},#000);border-top:2.5px solid ${tok.color};display:flex;align-items:center;justify-content:center;box-shadow:0 -6px 24px ${tok.color}77;z-index:4;">
          <span style="font-size:12.5px;color:#f8fafc;font-weight:900;">${isPlayer ? '⚡ ¡Tu carta especial domina el choque y desata su invocación sobre el rival!' : `⚡ ¡${this.selectedFloor.name} gana el choque con una carta especial!`}</span>
        </div>
      `;
      rootStage.appendChild(overlay);
      rootStage.classList.add('cj-stage-shake');

      const cvs = overlay.querySelector('#cjCineCanvas');
      const ctx = cvs?.getContext('2d');
      let cineFinished = false;
      let canSkip = false;
      let frameIdx = 0;

      const stormParts = Array.from({ length: 42 }, (_, i) => ({
        x: Math.random() * 760,
        y: Math.random() * 360,
        vx: card.element === 'snow' ? (4 + Math.random() * 6) : ((Math.random() - 0.5) * 4),
        vy: card.element === 'fire' ? -(4 + Math.random() * 6) : card.element === 'water' ? -(2 + Math.random() * 4) : (3 + Math.random() * 5),
        r: 3 + (i % 5) * 2,
        c: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? tok.color : '#fde047'
      }));

      const finishCinematic = () => {
        if (cineFinished || this.destroyed) return;
        cineFinished = true;
        rootStage.classList.remove('cj-stage-shake');
        overlay.remove();
        this.phase = 'clash';
        onDone();
      };

      this.scope.timeout(() => {
        canSkip = true;
        const hint = overlay.querySelector('#cjCineSkipHint');
        if (hint) hint.style.opacity = '1';
      }, 500);

      overlay.onclick = () => {
        if (canSkip) finishCinematic();
      };

      const unlistenKey = this.scope.listen(window, 'keydown', (e) => {
        if (!canSkip || cineFinished) return;
        if (e.key === 'Escape' || e.key === ' ') {
          e.stopPropagation();
          e.preventDefault();
          unlistenKey();
          finishCinematic();
        }
      }, true);

      const drawCineFrame = () => {
        if (cineFinished || this.destroyed || !ctx) return;
        frameIdx++;
        const W = cvs.width;
        const H = cvs.height;
        ctx.clearRect(0, 0, W, H);

        // Rayos diagonales anime y anillos de invocación a pantalla completa
        ctx.save();
        ctx.strokeStyle = tok.color;
        for (let i = 0; i < 4; i++) {
          const r = ((frameIdx * 16 + i * 65) % 280);
          ctx.lineWidth = 3 - (r / 140);
          ctx.globalAlpha = Math.max(0.08, 1 - r / 280);
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Líneas de velocidad horizontales/diagonales
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = tok.color;
        for (let i = 0; i < 12; i++) {
          const sy = ((i * 31 + frameIdx * 13) % H);
          ctx.fillRect(0, sy, W, 2.5);
        }

        // Partículas elementales masivas (meteoros de fuego, olas/burbujas de agua o ventisca de hielo)
        for (const p of stormParts) {
          p.x = (p.x + p.vx + W) % W;
          p.y = (p.y + p.vy + H) % H;
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      drawCineFrame();
      const cineInt = this.scope.interval(drawCineFrame, 55);

      this.scope.timeout(() => {
        this.scope.clearInterval(cineInt);
        unlistenKey();
        finishCinematic();
      }, 2150);
    }

    // --- MINI-ANIMACIÓN ELEMENTAL CÓMICA SOBRE EL PERSONAJE QUE PERDIÓ LA RONDA (Balde de agua / Hielo / Pelo quemado) ---
    playLoserGagAnimation(loserCharBox, winningElement) {
      if (!loserCharBox || this.destroyed) return;
      const oldGag = loserCharBox.querySelector('.cj-loser-gag');
      if (oldGag) oldGag.remove();

      const gag = document.createElement('div');
      gag.className = 'cj-loser-gag';
      gag.style.cssText = 'position:absolute;inset:-14px -10px 0 -10px;pointer-events:none;z-index:35;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;';

      if (winningElement === 'water') {
        // Balde de agua que se voltea y empapa al perdedor
        gag.innerHTML = `
          <svg viewBox="0 0 140 170" width="140" height="170" style="overflow:visible;">
            <!-- Balde de madera inclinado -->
            <g transform="translate(70, 18) rotate(125)">
              <polygon points="-16,-14 16,-14 12,14 -12,14" fill="#b45309" stroke="#451a03" stroke-width="2"/>
              <rect x="-15" y="-6" width="30" height="3" fill="#94a3b8"/>
              <rect x="-13" y="5" width="26" height="3" fill="#94a3b8"/>
            </g>
            <!-- Cascada de agua cayendo sobre la cabeza -->
            <path d="M56,24 Q70,20 84,24 L98,136 Q70,146 42,136 Z" fill="rgba(56,189,248,0.62)"/>
            <path d="M62,26 L66,132 M76,26 L74,132" stroke="#e0f2fe" stroke-width="3" stroke-dasharray="8 6"/>
            <!-- Charco y gotas salpicando -->
            <ellipse cx="70" cy="142" rx="46" ry="9" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.5"/>
            <circle cx="34" cy="96" r="4" fill="#7dd3fc"/><circle cx="106" cy="92" r="4.5" fill="#7dd3fc"/>
            <circle cx="42" cy="64" r="3.5" fill="#e0f2fe"/><circle cx="98" cy="68" r="3.5" fill="#e0f2fe"/>
          </svg>
          <span class="ek-pixel-font" style="margin-top:-22px;background:#0284c7;border:1.5px solid #e0f2fe;color:#fff;font-size:9px;padding:2px 8px;border-radius:999px;box-shadow:0 4px 10px rgba(0,0,0,0.6);">💧 ¡EMPAPADO!</span>
        `;
      } else if (winningElement === 'snow') {
        // Manos y cuerpo congelados en bloque de hielo cristalino
        gag.innerHTML = `
          <svg viewBox="0 0 140 170" width="140" height="170" style="overflow:visible;">
            <!-- Bloque de hielo cristalino sobre el cuerpo y manos -->
            <polygon points="30,44 110,44 118,142 22,142" fill="rgba(125,211,252,0.48)" stroke="#e0f2fe" stroke-width="2.5"/>
            <!-- Guantes de hielo en las manos -->
            <circle cx="28" cy="96" r="14" fill="rgba(186,230,253,0.85)" stroke="#ffffff" stroke-width="2"/>
            <circle cx="112" cy="96" r="14" fill="rgba(186,230,253,0.85)" stroke="#ffffff" stroke-width="2"/>
            <!-- Brillos y carámbanos -->
            <line x1="42" y1="54" x2="68" y2="128" stroke="#ffffff" stroke-width="3" opacity="0.75"/>
            <polygon points="34,44 40,62 46,44" fill="#ffffff"/>
            <polygon points="94,44 100,64 106,44" fill="#ffffff"/>
          </svg>
          <span class="ek-pixel-font" style="margin-top:-22px;background:#0369a1;border:1.5px solid #ffffff;color:#e0f2fe;font-size:9px;padding:2px 8px;border-radius:999px;box-shadow:0 4px 10px rgba(0,0,0,0.6);">🥶 ¡MANOS CONGELADAS!</span>
        `;
      } else {
        // Fuego quemando el pelo / capucha con humo negro y chispas
        gag.innerHTML = `
          <svg viewBox="0 0 140 170" width="140" height="170" style="overflow:visible;">
            <!-- Nubes de humo negro subiendo -->
            <circle cx="52" cy="18" r="14" fill="rgba(15,23,42,0.85)"/>
            <circle cx="72" cy="12" r="17" fill="rgba(30,41,59,0.88)"/>
            <circle cx="90" cy="20" r="13" fill="rgba(15,23,42,0.85)"/>
            <!-- Llamas en la cabeza/pelo -->
            <path d="M40,52 C42,24 56,18 62,38 C68,14 82,16 86,38 C94,22 104,30 100,52 Z" fill="#ef4444" stroke="#fde047" stroke-width="1.8"/>
            <path d="M48,52 C52,32 62,28 66,42 C72,24 82,28 84,44 C88,34 94,38 92,52 Z" fill="#fde047"/>
            <!-- Hollín y chispas -->
            <circle cx="36" cy="34" r="3" fill="#fde047"/><circle cx="106" cy="30" r="3.5" fill="#f97316"/>
            <circle cx="46" cy="24" r="2.5" fill="#fde047"/><circle cx="96" cy="22" r="2.5" fill="#fde047"/>
          </svg>
          <span class="ek-pixel-font" style="margin-top:-22px;background:#b91c1c;border:1.5px solid #fde047;color:#fef08a;font-size:9px;padding:2px 8px;border-radius:999px;box-shadow:0 4px 10px rgba(0,0,0,0.6);">🔥 ¡CHAMUSCADO!</span>
        `;
      }

      loserCharBox.appendChild(gag);
      this.scope.timeout(() => {
        if (gag.parentNode) gag.remove();
      }, 950);
    }

    // --- PARTÍCULAS DE DESTRUCCIÓN DE CARTA (24 partículas pixel con gravedad en 600ms, tope global 120) ---
    shatterLoserCard(cardContainer, element) {
      if (!cardContainer || this.destroyed) return;
      const tok = (CFG().ELEMENT_TOKENS || {})[element] || { color: '#ef4444', light: '#fca5a5' };
      const allowed = Math.min(24, Math.max(0, 120 - this.activeParticles));
      if (allowed <= 0) return;

      this.activeParticles += allowed;
      const cvs = document.createElement('canvas');
      cvs.width = 180;
      cvs.height = 200;
      cvs.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:40;';
      cardContainer.style.position = 'relative';
      cardContainer.appendChild(cvs);

      const ctx = cvs.getContext('2d');
      const parts = Array.from({ length: allowed }, (_, i) => {
        const angle = (Math.PI * 2 * i) / allowed + (Math.random() - 0.5) * 0.4;
        const speed = 2.2 + Math.random() * 4.2;
        return {
          x: 90 + (Math.random() - 0.5) * 40,
          y: 100 + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.4,
          size: 5 + (i % 3) * 2,
          color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? tok.color : tok.light,
          alpha: 1
        };
      });

      const t0 = performance.now();
      const step = (now) => {
        if (this.destroyed) return;
        const elapsed = now - t0;
        const p = Math.min(1, elapsed / 600);
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        for (const pt of parts) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.22; // gravedad
          pt.alpha = Math.max(0, 1 - p);
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        }
        if (p < 1) {
          this.scope.raf(step);
        } else {
          this.activeParticles = Math.max(0, this.activeParticles - allowed);
          cvs.remove();
        }
      };
      this.scope.raf(step);
    }

    // --- FICHA DE PUNTO VOLANDO AL MARCADOR (400ms curva Bézier con "+1") ---
    flyPointToken(fromEl, toEl, element) {
      if (!fromEl || !toEl || this.destroyed) return;
      const root = this.container?.querySelector('#cjMatchRoot');
      if (!root) return;
      const rRoot = root.getBoundingClientRect();
      const rFrom = fromEl.getBoundingClientRect();
      const rTo = toEl.getBoundingClientRect();
      const tok = (CFG().ELEMENT_TOKENS || {})[element] || { color: '#ef4444', bg: '#450a0a' };

      const chip = document.createElement('div');
      chip.className = 'ek-pixel-font';
      chip.style.cssText = `position:absolute;left:${rFrom.left - rRoot.left + rFrom.width / 2 - 22}px;top:${rFrom.top - rRoot.top + rFrom.height / 2 - 14}px;background:${tok.bg};border:2px solid ${tok.color};color:#fff;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:900;z-index:75;pointer-events:none;box-shadow:0 0 12px ${tok.color};transition:transform 400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease;`;
      chip.innerHTML = `${SPR().renderSpriteHtml ? SPR().renderSpriteHtml('elem_' + element, 0.9) : ''} +1`;
      root.appendChild(chip);

      const dx = (rTo.left + rTo.width / 2) - (rFrom.left + rFrom.width / 2);
      const dy = (rTo.top + rTo.height / 2) - (rFrom.top + rFrom.height / 2);
      requestAnimationFrame(() => {
        chip.style.transform = `translate(${dx}px, ${dy}px) scale(0.85)`;
      });
      this.scope.timeout(() => chip.remove(), 420);
    }

    // --- SECUENCIA EXACTA DE ATAQUE (Bloque F) ---
    playRound(playerCardIdx) {
      if (this.destroyed || this.paused || this.roundLocked || this.phase !== 'playing') return;
      this.roundLocked = true;
      this.phase = 'clash';
      this.stopTurnTimer();
      this.sfx.selectCard();

      const pCard = this.playerHand[playerCardIdx];
      if (this.pvp) {
        this.pvp.sendPlay?.(pCard);
        if (this.pvp.oppPendingCard) {
          const oppCard = this.pvp.oppPendingCard;
          this.pvp.oppPendingCard = null;
          this._executeRoundClash(playerCardIdx, pCard, oppCard, 0);
          return;
        }
        this.pvp.myPendingIdx = playerCardIdx;
        this.pvp.myPendingCard = pCard;
        const table = this.container?.querySelector('#cjArenaTable');
        if (table) {
          table.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px;">
              ${renderCardHtml(pCard, 0)}
              <div class="ek-pixel-font" style="font-size:10px;color:#c084fc;">⏳ ESPERANDO CARTA DE ${this.pvp.opponent.name.toUpperCase()}…</div>
            </div>
          `;
        }
        this.setSpeech(`Esperando la jugada de ${this.pvp.opponent.name}…`);
        if (this.scope) {
          this.pvp.waitTimeout = this.scope.timeout(() => {
            if (!this.destroyed && this.pvp && this.pvp.myPendingCard) {
              const fallbackCard = this.drawRandomCard();
              const idx = this.pvp.myPendingIdx;
              const mc = this.pvp.myPendingCard;
              this.pvp.myPendingCard = null;
              this.pvp.myPendingIdx = null;
              this._executeRoundClash(idx, mc, fallbackCard, 0);
            }
          }, 16000);
        }
        return;
      }

      const aiIdx = this.chooseAiCardIndex(pCard);
      const aCard = this.aiHand[aiIdx];
      this._executeRoundClash(playerCardIdx, pCard, aCard, aiIdx);
    }

    _executeRoundClash(playerCardIdx, pCard, aCard, aiIdx = 0) {
      if (this.destroyed) return;
      const outcome = this.resolveOutcome(pCard, aCard);

      const table = this.container?.querySelector('#cjArenaTable');
      const stage = this.container?.querySelector('#cjBattleStage');
      if (!table || !stage) return;

      // Animar que el rival saca 1 carta de su mano superior boca abajo
      const rivalHandRow = this.container?.querySelector('#cjRivalHandRow');
      if (rivalHandRow) rivalHandRow.innerHTML = renderRivalHandHtml(4);

      // 1) 0–250ms: Tu carta sube al centro (ease-out) y la del rival se voltea (250ms)
      table.innerHTML = `
        <div id="cjDuelPlayerSlot" class="cj-clash-enter-up" style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span class="ek-pixel-font" style="font-size:8px;color:#38bdf8;">TU CARTA</span>
          ${renderCardHtml(pCard, 0)}
        </div>
        <div class="ek-pixel-font" style="font-size:16px;color:#fbbf24;">VS</div>
        <div id="cjDuelAiSlot" class="cj-clash-flip-in" style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <span class="ek-pixel-font" style="font-size:8px;color:${this.selectedFloor.color};">${this.selectedFloor.name.toUpperCase()}</span>
          ${renderCardHtml(aCard, 0)}
        </div>
      `;

      const runResolutionAfterRise = () => {
        if (this.destroyed) return;
        const executeImpact = () => {
          if (this.destroyed) return;
          // 2) Hit-stop de 80ms + flash blanco de 60ms + animación en escena Phaser 3
          this.sfx.clash();
          const phaserActive = !!(this.phaserArena && this.phaserArena.isReady());
          if (phaserActive) {
            const winElem = outcome === 'player' ? pCard.element : aCard.element;
            const winPower = outcome === 'player' ? pCard.power : aCard.power;
            this.phaserArena.playClash({
              winner: outcome,
              element: winElem,
              power: winPower,
              isSpecial: winPower > SPECIAL_THRESHOLD
            });
          }

          const flash = document.createElement('div');
          flash.style.cssText = `position:absolute;inset:0;background:#ffffff;opacity:${phaserActive ? 0.35 : 0.75};z-index:55;pointer-events:none;`;
          stage.appendChild(flash);
          this.scope.timeout(() => flash.remove(), 60);

          this.scope.timeout(() => {
            if (this.destroyed) return;
            const pSlot = this.container?.querySelector('#cjDuelPlayerSlot');
            const aSlot = this.container?.querySelector('#cjDuelAiSlot');
            const pCharBox = this.container?.querySelector('#cjPlayerCharBox');
            const aCharBox = this.container?.querySelector('#cjAiCharBox');
            const hasPhaser = !!(this.phaserArena && this.phaserArena.isReady());

            // Banner inconfundible del ganador de la ronda
            const elLabels = { fire: '🔥 Fuego', water: '💧 Agua', snow: '❄️ Nieve' };
            const rivalLabel = (this.pvp?.opponent?.name || this.selectedFloor?.name || 'Rival').toUpperCase();
            let reasonTxt = '';
            if (outcome === 'tie') {
              reasonTxt = `${elLabels[pCard.element] || pCard.element} ${pCard.power} = ${aCard.power}`;
            } else if (pCard.element !== aCard.element) {
              const winEl = outcome === 'player' ? pCard.element : aCard.element;
              const loseEl = outcome === 'player' ? aCard.element : pCard.element;
              reasonTxt = `${elLabels[winEl] || winEl} vence a ${elLabels[loseEl] || loseEl}`;
            } else {
              reasonTxt = outcome === 'player'
                ? `Mismo elemento · Poder ${pCard.power} > ${aCard.power}`
                : `Mismo elemento · Poder ${aCard.power} > ${pCard.power}`;
            }
            const bannerColor = outcome === 'player' ? '#10b981' : (outcome === 'ai' ? '#ef4444' : '#f59e0b');
            const bannerTitle = outcome === 'player' ? '🏆 ¡GANAS LA RONDA!' : (outcome === 'ai' ? `💀 GANA ${rivalLabel}` : '🤝 EMPATE DE RONDA');
            const roundBanner = document.createElement('div');
            roundBanner.style.cssText = `position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:60;background:rgba(9,13,22,0.95);border:2px solid ${bannerColor};border-radius:12px;padding:7px 18px;text-align:center;box-shadow:0 8px 26px ${bannerColor}55;pointer-events:none;white-space:nowrap;`;
            roundBanner.innerHTML = `<div style="font-size:13.5px;font-weight:900;color:${bannerColor};letter-spacing:.6px;">${bannerTitle}</div><div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-top:2px;">${reasonTxt}</div>`;
            stage.appendChild(roundBanner);
            this.scope.timeout(() => roundBanner.remove(), 1450);

            // 3) Ganadora escala ×1.15 con halo; perdedora se atenúa y se rompe
            if (outcome === 'player') {
              this.sfx.winRound();
              this.playerPoints.push(pCard);
              if (!hasPhaser) {
                this.playerPose = 'attack';
                this.aiPose = 'idle';
                this.refreshArenaSprites();
              }

              if (pSlot) {
                pSlot.classList.add('cj-card-winner-scale');
                pSlot.style.filter = 'drop-shadow(0 0 18px rgba(16,185,129,0.95))';
              }
              if (aSlot) {
                const cardNode = aSlot.querySelector('.cj-card-v191');
                if (cardNode) { cardNode.style.opacity = '0.28'; cardNode.style.filter = 'grayscale(0.85)'; }
                this.shatterLoserCard(aSlot, aCard.element);
              }
              if (!hasPhaser) {
                if (pCharBox) pCharBox.style.transform = 'translateX(28px)';
                if (aCharBox) {
                  aCharBox.classList.add('cj-ninja-hit-shake');
                  this.playLoserGagAnimation(aCharBox, pCard.element);
                }
              }

              this.flyPointToken(pSlot, this.container?.querySelector('#cjPlayerScoreRow'), pCard.element);
              this.setSpeech(this.selectedFloor.quotes.loseRound);
            } else if (outcome === 'ai') {
              this.sfx.loseRound();
              this.aiPoints.push(aCard);
              if (!hasPhaser) {
                this.playerPose = 'idle';
                this.aiPose = 'attack';
                this.refreshArenaSprites();
              }

              if (aSlot) {
                aSlot.classList.add('cj-card-winner-scale');
                aSlot.style.filter = 'drop-shadow(0 0 18px rgba(239,68,68,0.95))';
              }
              if (pSlot) {
                const cardNode = pSlot.querySelector('.cj-card-v191');
                if (cardNode) { cardNode.style.opacity = '0.28'; cardNode.style.filter = 'grayscale(0.85)'; }
                this.shatterLoserCard(pSlot, pCard.element);
              }
              if (!hasPhaser) {
                if (aCharBox) aCharBox.style.transform = 'translateX(-28px)';
                if (pCharBox) {
                  pCharBox.classList.add('cj-ninja-hit-shake');
                  this.playLoserGagAnimation(pCharBox, aCard.element);
                }
              }

              this.flyPointToken(aSlot, this.container?.querySelector('#cjAiScoreRow'), aCard.element);
              this.setSpeech(this.selectedFloor.quotes.winRound);
            } else {
              this.setSpeech('¡Empate de poder elemental! Ninguna carta cede.');
            }

            // Actualizar marcador tras vuelo de ficha (400ms)
            this.scope.timeout(() => {
              if (this.destroyed) return;
              const pScore = this.container?.querySelector('#cjPlayerScoreRow');
              const aScore = this.container?.querySelector('#cjAiScoreRow');
              if (pScore) pScore.innerHTML = this.formatPointsRow(this.playerPoints);
              if (aScore) aScore.innerHTML = this.formatPointsRow(this.aiPoints);
            }, 420);

            // Ritmo más pausado y claro antes de iniciar la siguiente ronda (1450ms)
            this.scope.timeout(() => {
              if (this.destroyed) return;
              this.playerPose = 'idle';
              this.aiPose = 'idle';
              this.playerHand[playerCardIdx] = this.drawRandomCard(false);
              this.aiHand[aiIdx] = this.drawRandomCard(true);

              const pWin = this.checkWinCondition(this.playerPoints);
              const aWin = this.checkWinCondition(this.aiPoints);
              if (pWin || aWin) {
                this.finishMatch(!!pWin, pWin || aWin);
              } else {
                this.roundLocked = false;
                this.phase = 'playing';
                this.resetRoundUI();
                this.setSpeech('Elige tu siguiente carta elemental…');
                this.startTurnTimer();
              }
            }, 1450);
          }, 80); // fin hit-stop 80ms
        };

        // Disparar cinemática de carta 10+ ÚNICAMENTE cuando esa carta GANA el enfrentamiento
        const playerWinsWithEpic = outcome === 'player' && pCard.power > SPECIAL_THRESHOLD;
        const aiWinsWithEpic = outcome === 'ai' && aCard.power > SPECIAL_THRESHOLD;
        if (playerWinsWithEpic || aiWinsWithEpic) {
          const cineCard = playerWinsWithEpic ? pCard : aCard;
          this.triggerCinematic(cineCard, playerWinsWithEpic, executeImpact);
        } else {
          executeImpact();
        }
      };

      // +1.2 segundos extra para comparar ambas cartas cara a cara sin sensación frenética
      this.scope.timeout(runResolutionAfterRise, 1450);
    }

    checkWinCondition(points) {
      const byElem = { fire: 0, water: 0, snow: 0 };
      for (const p of points) byElem[p.element] = (byElem[p.element] || 0) + 1;
      if (byElem.fire >= 1 && byElem.water >= 1 && byElem.snow >= 1) {
        return 'Trío Elemental (Fuego + Agua + Nieve)';
      }
      for (const el of ['fire', 'water', 'snow']) {
        if (byElem[el] >= 3) {
          const tok = (CFG().ELEMENT_TOKENS || {})[el] || { name: el };
          return `Dominio de ${tok.name} (3 cartas de ${tok.name})`;
        }
      }
      return null;
    }

    finishMatch(playerWon, winReason) {
      if (this.destroyed) return;
      this.stopTurnTimer();
      this.phase = 'ended';
      this.playerPose = playerWon ? 'victory' : 'idle';
      this.aiPose = playerWon ? 'idle' : 'victory';
      this.refreshArenaSprites();
      if (this.phaserArena && this.phaserArena.isReady()) {
        this.phaserArena.playVictory(playerWon ? 'player' : 'ai');
      }

      const f = this.selectedFloor;
      let coinsAwarded = 0;
      let keyAwarded = null;
      let keyLabel = null;
      let isFirstClear = false;

      if (playerWon && !this.rewardClaimed) {
        this.rewardClaimed = true;
        this.sfx.winMatch();
        const claimed = this.getClaimedFloors();
        isFirstClear = this.pvp ? true : !claimed[f.level];

        if (isFirstClear) {
          coinsAwarded = f.reward.coins;
          keyAwarded = f.reward.key;
          keyLabel = f.reward.keyLabel;
          if (!this.pvp) this.markFloorClaimed(f.level);
        } else {
          const rules = CFG().TRAINING_REWARD_RULES || { coinMultiplier: 0.5, copperKeyChance: 0.25 };
          coinsAwarded = Math.round(f.reward.coins * rules.coinMultiplier);
          if (Math.random() < rules.copperKeyChance) {
            keyAwarded = 'copper';
            keyLabel = '1 Llave Cobre (Bono Entrenamiento)';
          }
        }

        if (typeof this.onReward === 'function') {
          this.onReward({
            grantId: `dojo:${f.level}:${Date.now()}`,
            coins: coinsAwarded,
            key: keyAwarded,
            keyCount: keyAwarded ? 1 : 0,
            floor: f.level
          });
        }
      } else if (!playerWon) {
        this.sfx.loseMatch();
      }
      if (this.pvp && this.pvp.opponent?.id && typeof this.opts?.onPvpResult === 'function') {
        try {
          this.opts.onPvpResult({
            won: !!playerWon,
            opponentId: Number(this.pvp.opponent.id),
            opponentName: this.pvp.opponent.name || ''
          });
        } catch {}
      }

      const table = this.container?.querySelector('#cjArenaTable');
      if (!table) return;

      const myNinja = getSavedNinjaConfig();
      const keySprite = keyAwarded && SPR().renderSpriteHtml ? SPR().renderSpriteHtml('key_' + keyAwarded, 1.5) : '';
      const coinSprite = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('coin', 1.2) : '';

      table.innerHTML = `
        <div style="background:rgba(11,14,20,0.96);border:2px solid ${playerWon ? '#22c55e' : '#ef4444'};border-radius:12px;padding:16px 22px;text-align:center;max-width:410px;box-shadow:0 12px 32px rgba(0,0,0,0.85);">
          <div style="display:flex;justify-content:center;margin-bottom:6px;">
            ${renderPixelNinjaSvg(playerWon ? myNinja : f.ninjaConfig, { size: 68, pose: 'victory', frame: 0 })}
          </div>
          <div class="ek-pixel-font" style="font-size:15px;color:${playerWon ? '#4ade80' : '#f87171'};margin-bottom:6px;">
            ${playerWon ? `¡VICTORIA EN PISO ${f.level}!` : `DERROTA EN PISO ${f.level}`}
          </div>
          <div style="font-size:12px;color:#f8fafc;font-weight:700;margin-bottom:4px;">${winReason}</div>
          <div style="font-size:11px;color:#94a3b8;font-style:italic;margin-bottom:10px;">
            «${playerWon ? f.quotes.winMatch : f.quotes.loseMatch}»
          </div>

          ${playerWon ? `
            <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.4);border-radius:8px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
              <span style="display:inline-flex;align-items:center;gap:5px;font-weight:900;color:#fbbf24;font-size:13px;">
                ${coinSprite} +<span id="cjCoinCounterAnim">0</span> Monedas
              </span>
              ${keyAwarded ? `
                <span class="cj-key-bounce" style="display:inline-flex;align-items:center;gap:5px;font-weight:900;color:#f8fafc;font-size:12px;background:rgba(255,255,255,0.08);padding:3px 8px;border-radius:6px;">
                  ${keySprite} <span>${keyLabel}</span>
                </span>
              ` : ''}
            </div>
          ` : ''}

          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button id="cjBtnRetryMatch" class="ek-pixel-font" style="background:${playerWon ? '#1e293b' : '#ef4444'};border:1px solid rgba(255,255,255,0.15);color:#fff;padding:8px 12px;border-radius:6px;font-size:9.5px;cursor:pointer;">
              REPETIR
            </button>
            ${playerWon && f.level < (CFG().DOJO_FLOORS || []).length ? `
              <button id="cjBtnNextFloor" class="ek-pixel-font" style="background:#2563eb;border:none;color:#fff;padding:8px 12px;border-radius:6px;font-size:9.5px;cursor:pointer;">
                SIGUIENTE PISO →
              </button>
            ` : ''}
            <button id="cjBtnBackLobby" class="ek-pixel-font" style="background:#141926;border:1px solid #334155;color:#cbd5e1;padding:8px 12px;border-radius:6px;font-size:9.5px;cursor:pointer;">
              SALIR
            </button>
          </div>
        </div>
      `;

      // Animación de contador de monedas (600ms)
      if (playerWon && coinsAwarded > 0) {
        const coinEl = table.querySelector('#cjCoinCounterAnim');
        if (coinEl && this.scope) {
          const t0 = performance.now();
          const tickCoins = (now) => {
            if (this.destroyed || !coinEl.isConnected) return;
            const prog = Math.min(1, (now - t0) / 600);
            coinEl.textContent = String(Math.round(coinsAwarded * prog));
            if (prog < 1) this.scope.raf(tickCoins);
          };
          this.scope.raf(tickCoins);
        }
      }

      const retryBtn = table.querySelector('#cjBtnRetryMatch');
      if (retryBtn) retryBtn.onclick = () => this.startMatch(f.level);

      const nextBtn = table.querySelector('#cjBtnNextFloor');
      if (nextBtn) nextBtn.onclick = () => this.startMatch(f.level + 1);

      const lobbyBtn = table.querySelector('#cjBtnBackLobby');
      if (lobbyBtn) lobbyBtn.onclick = () => this.renderLobby();
    }
  }

  // --- ESTUDIO "MI NINJA" (Bloque E: 24×30, 3 tonos, poses Idle/Ataque/Victoria, Aleatorio/Restablecer, cintas por piso, cambios sin guardar) ---
  function renderNinjaCustomizer(container, onSaveCallback, parentScope) {
    if (!container) return;
    const scope = parentScope || (window.EKLifecycle ? window.EKLifecycle.create('ninja_studio') : null);
    const savedInitial = getSavedNinjaConfig();
    let draft = { ...savedInitial };
    let currentPose = 'idle';
    let animFrame = 0;
    let isDirty = false;

    const v = window.EconomyService ? window.EconomyService.getVault() : {};
    const claimedFloors = v.claimedFloors || {};
    const isFloorCleared = (reqFloor) => {
      if (!reqFloor || reqFloor <= 0) return true;
      return !!(claimedFloors[reqFloor] || claimedFloors[String(reqFloor)]);
    };

    const suits = CFG().NINJA_SUITS || [];
    const masks = CFG().NINJA_MASKS || [];
    const belts = CFG().BELTS || [];
    const weapons = CFG().NINJA_WEAPONS || [];
    const auras = CFG().NINJA_AURAS || [];

    const checkDirty = () => {
      isDirty = JSON.stringify(draft) !== JSON.stringify(savedInitial);
      const badge = container.querySelector('#njDirtyBadge');
      if (badge) {
        badge.style.display = isDirty ? 'inline-flex' : 'none';
      }
    };

    const draw = () => {
      const beltObj = belts.find((b) => b.id === draft.belt) || belts[0] || { id: 'white', name: 'Cinturón Blanco', color: '#f8fafc' };
      const weaponObj = weapons.find((w) => w.id === draft.weapon) || weapons[0] || { id: 'kunai', name: 'Kunai Clásico' };
      const auraObj = auras.find((a) => a.id === draft.aura) || auras[0] || { id: 'none', name: 'Sin Aura' };

      container.innerHTML = `
        <div style="background:var(--bg-panel,#0f131d);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:18px;color:#e2e8f0;display:grid;grid-template-columns:280px 1fr;gap:18px;align-items:start;">
          <!-- Columna Izquierda: Vista Previa Animada + Poses -->
          <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
              <span style="font-size:11px;font-weight:900;color:#fbbf24;letter-spacing:0.6px;">🏯 DOJO NINJA · EN VIVO</span>
              <span id="njDirtyBadge" style="display:${isDirty ? 'inline-flex' : 'none'};align-items:center;gap:4px;font-size:10px;font-weight:800;color:#fbbf24;background:rgba(251,191,36,0.14);border:1px solid rgba(251,191,36,0.4);padding:2px 7px;border-radius:999px;">
                ● Sin guardar
              </span>
            </div>

            <div style="position:relative;width:210px;height:216px;background:radial-gradient(circle at 50% 32%, rgba(251,191,36,0.22) 0%, rgba(124,58,237,0.14) 48%, #0b0e17 85%);border:2px solid rgba(251,191,36,0.38);border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 -36px 40px rgba(146,64,14,0.28), 0 8px 24px rgba(0,0,0,0.5);">
              <div style="position:absolute;left:0;right:0;bottom:0;height:46px;background:linear-gradient(180deg,rgba(180,83,9,0.22),rgba(120,53,15,0.45));border-top:1px solid rgba(251,191,36,0.25);pointer-events:none;"></div>
              <canvas id="njPreviewAuraCanvas" width="210" height="216" style="position:absolute;inset:0;pointer-events:none;"></canvas>
              <div id="njPreviewSpriteHolder" style="position:relative;z-index:2;filter:drop-shadow(0 10px 14px rgba(0,0,0,0.6));">
                ${renderPixelNinjaSvg(draft, { size: 152, pose: currentPose, frame: animFrame })}
              </div>
            </div>

            <!-- Botones de Pose: Reposo / Ataque / Victoria -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;">
              ${[
                { id: 'idle', label: '🧘 Reposo' },
                { id: 'attack', label: '⚔️ Ataque' },
                { id: 'victory', label: '🏆 Victoria' }
              ].map((p) => `
                <button class="njPoseBtn" data-pose="${p.id}" style="background:${currentPose === p.id ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#0b0e14'};border:1px solid ${currentPose === p.id ? '#60a5fa' : '#334155'};color:#fff;font-size:11px;font-weight:800;padding:7px 4px;border-radius:8px;cursor:pointer;">
                  ${p.label}
                </button>
              `).join('')}
            </div>

            <div style="font-size:11.5px;color:#cbd5e1;text-align:center;line-height:1.4;">
              <div><b style="color:${beltObj.color};">${beltObj.name}</b></div>
              <div style="font-size:11px;color:#94a3b8;">${weaponObj.name} · ${auraObj.name}</div>
            </div>

            <!-- Aleatorio y Restablecer -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;">
              <button id="njBtnRandom" style="background:#1e293b;border:1px solid #475569;color:#f8fafc;font-size:11.5px;font-weight:800;padding:7px 8px;border-radius:6px;cursor:pointer;">
                🎲 Aleatorio
              </button>
              <button id="njBtnReset" style="background:#1e293b;border:1px solid #475569;color:#cbd5e1;font-size:11.5px;font-weight:700;padding:7px 8px;border-radius:6px;cursor:pointer;">
                ↺ Restablecer
              </button>
            </div>

            <button id="njBtnSave" class="ek-pixel-font" style="width:100%;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:900;font-size:11px;padding:11px;border-radius:8px;cursor:pointer;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
              ✓ GUARDAR MI NINJA
            </button>
          </div>

          <!-- Columna Derecha: Opciones de Personalización -->
          <div style="display:flex;flex-direction:column;gap:14px;">
            <!-- 1. Traje Ninja -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">1. Color del Traje Ninja (Sombreado 3 Tonos)</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${suits.map((s) => `
                  <button class="njSuitBtn" data-val="${s.id}" title="${s.name}" style="width:34px;height:34px;border-radius:8px;background:${s.id};border:${draft.suitColor === s.id ? '3px solid #fff' : '2px solid #334155'};cursor:pointer;box-shadow:${draft.suitColor === s.id ? '0 0 10px ' + s.id : 'none'};"></button>
                `).join('')}
              </div>
            </div>

            <!-- 2. Máscara -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">2. Color de Máscara</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${masks.map((m) => `
                  <button class="njMaskBtn" data-val="${m.id}" style="background:${draft.maskColor === m.id ? '#2563eb' : '#0b0e14'};border:1.5px solid ${draft.maskColor === m.id ? '#60a5fa' : '#334155'};color:#f8fafc;padding:6px 11px;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">
                    <span style="width:12px;height:12px;border-radius:3px;background:${m.id};border:1px solid rgba(255,255,255,0.3);"></span>
                    <span>${m.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- 3. Cintas del Dojo (Desbloqueo por piso conquistado) -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">3. Cinta y Rango del Dojo</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;">
                ${belts.map((b) => {
                  const unlocked = isFloorCleared(b.reqFloor);
                  const isSel = draft.belt === b.id;
                  const tip = unlocked ? b.name : `🔒 Domina el Piso ${b.reqFloor} del Dojo para desbloquear`;
                  return `
                    <button class="njBeltBtn" data-val="${b.id}" data-unlocked="${unlocked ? '1' : '0'}" data-req="${b.reqFloor}" title="${tip}" style="background:${isSel ? '#1e293b' : '#0b0e14'};border:1.5px solid ${isSel ? b.color : '#263147'};color:${unlocked ? '#f8fafc' : '#64748b'};padding:7px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:${unlocked ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:space-between;gap:6px;opacity:${unlocked ? '1' : '0.6'};">
                      <span style="display:flex;align-items:center;gap:6px;min-width:0;">
                        <span style="width:12px;height:12px;border-radius:3px;background:${b.color};border:1px solid #000;flex-shrink:0;"></span>
                        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.name.replace('Cinturón ', '')}</span>
                      </span>
                      <span style="font-size:10px;">${unlocked ? (isSel ? '✓' : '') : `🔒 P${b.reqFloor}`}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 4. Arma Equipada (Sprites Pixel 16×16 sin emojis rotos) -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">4. Arma Ninja (Sprite Pixel)</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;">
                ${weapons.map((w) => {
                  const isSel = draft.weapon === w.id;
                  const ico = SPR().renderSpriteHtml ? SPR().renderSpriteHtml(w.spriteKey, 1.2) : '';
                  return `
                    <button class="njWeaponBtn" data-val="${w.id}" style="background:${isSel ? '#2563eb' : '#0b0e14'};border:1.5px solid ${isSel ? '#60a5fa' : '#263147'};color:#f8fafc;padding:7px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;">
                      ${ico}
                      <span>${w.name}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 5. Aura Elemental -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#94a3b8;text-transform:uppercase;margin-bottom:8px;">5. Aura Elemental (Partículas en Vivo)</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;">
                ${auras.map((a) => {
                  const isSel = draft.aura === a.id;
                  const ico = a.element && SPR().renderSpriteHtml ? SPR().renderSpriteHtml('elem_' + a.element, 1.1) : '';
                  return `
                    <button class="njAuraBtn" data-val="${a.id}" style="background:${isSel ? '#1e293b' : '#0b0e14'};border:1.5px solid ${isSel ? (a.color !== 'transparent' ? a.color : '#60a5fa') : '#263147'};color:#f8fafc;padding:7px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;">
                      ${ico}
                      <span>${a.name}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- 6. Sombrero / Casco / Peinado (Sistema Paper-Doll 2D) -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#fbbf24;text-transform:uppercase;margin-bottom:8px;">6. Casco / Sombrero / Peinado</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;">
                ${[
                  { id: 'none', name: 'Capucha Clásica' },
                  { id: 'kasa', name: 'Sombrero Ronin' },
                  { id: 'oni', name: 'Cuernos Oni' },
                  { id: 'neko', name: 'Orejas Neko Cyber' },
                  { id: 'crown', name: 'Corona Sensei' },
                  { id: 'spiky', name: 'Cabello Relámpago' }
                ].map((hg) => {
                  const isSel = (draft.headgear || 'none') === hg.id;
                  return `<button class="njHeadgearBtn" data-val="${hg.id}" style="background:${isSel ? '#2563eb' : '#0b0e14'};border:1.5px solid ${isSel ? '#60a5fa' : '#263147'};color:#f8fafc;padding:7px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;text-align:left;">${hg.name}</button>`;
                }).join('')}
              </div>
            </div>

            <!-- 7. Estilo de Ojos / Visor -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#38bdf8;text-transform:uppercase;margin-bottom:8px;">7. Mirada / Visor Shinobi</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;">
                ${[
                  { id: 'amber', name: 'Ojos Clásicos' },
                  { id: 'sharingan', name: 'Carmesí Rúnico' },
                  { id: 'cyber', name: 'Ciber-Visor Neón' },
                  { id: 'ice', name: 'Mirada Cero Absoluto' },
                  { id: 'dragon', name: 'Ojos Dragón Dorado' }
                ].map((ey) => {
                  const isSel = (draft.eyes || 'amber') === ey.id;
                  return `<button class="njEyesBtn" data-val="${ey.id}" style="background:${isSel ? '#2563eb' : '#0b0e14'};border:1.5px solid ${isSel ? '#60a5fa' : '#263147'};color:#f8fafc;padding:7px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;text-align:left;">${ey.name}</button>`;
                }).join('')}
              </div>
            </div>

            <!-- 8. Mascota Compañera del Dojo -->
            <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;">
              <div style="font-size:11px;font-weight:900;color:#c084fc;text-transform:uppercase;margin-bottom:8px;">8. Mascota / Compañero Guardián (Te acompaña en el Dojo)</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;">
                ${[
                  { id: 'none', name: 'Sin Mascota' },
                  { id: 'kitsune', name: 'Zorrito Kitsune' },
                  { id: 'axolotl', name: 'Ajolote Astral' },
                  { id: 'shiba', name: 'Shiba Shinobi' },
                  { id: 'penguin', name: 'Pingüino Sensei' },
                  { id: 'dragon', name: 'Mini Dragón' }
                ].map((pt) => {
                  const isSel = (draft.pet || 'none') === pt.id;
                  return `<button class="njPetBtn" data-val="${pt.id}" style="background:${isSel ? '#7c3aed' : '#0b0e14'};border:1.5px solid ${isSel ? '#c084fc' : '#263147'};color:#f8fafc;padding:7px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;text-align:left;">${pt.name}</button>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      attachAuraLoop(scope, container.querySelector('#njPreviewAuraCanvas'), draft.aura);

      container.querySelectorAll('.njPoseBtn').forEach((b) => {
        b.onclick = () => {
          currentPose = b.getAttribute('data-pose') || 'idle';
          draw();
        };
      });

      container.querySelectorAll('.njSuitBtn').forEach((b) => {
        b.onclick = () => {
          draft.suitColor = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      container.querySelectorAll('.njMaskBtn').forEach((b) => {
        b.onclick = () => {
          draft.maskColor = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      container.querySelectorAll('.njBeltBtn').forEach((b) => {
        b.onclick = () => {
          if (b.getAttribute('data-unlocked') !== '1') return;
          draft.belt = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      container.querySelectorAll('.njWeaponBtn').forEach((b) => {
        b.onclick = () => {
          draft.weapon = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      container.querySelectorAll('.njAuraBtn').forEach((b) => {
        b.onclick = () => {
          draft.aura = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      container.querySelectorAll('.njHeadgearBtn').forEach((b) => {
        b.onclick = () => {
          draft.headgear = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      container.querySelectorAll('.njEyesBtn').forEach((b) => {
        b.onclick = () => {
          draft.eyes = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      container.querySelectorAll('.njPetBtn').forEach((b) => {
        b.onclick = () => {
          draft.pet = b.getAttribute('data-val');
          checkDirty();
          draw();
        };
      });

      const rndBtn = container.querySelector('#njBtnRandom');
      if (rndBtn) {
        rndBtn.onclick = () => {
          const unlockedBelts = belts.filter((b) => isFloorCleared(b.reqFloor));
          const hgs = ['none', 'kasa', 'oni', 'neko', 'crown', 'spiky'];
          const eys = ['amber', 'sharingan', 'cyber', 'ice', 'dragon'];
          const pts = ['none', 'kitsune', 'axolotl', 'shiba', 'penguin', 'dragon'];
          draft.suitColor = suits[Math.floor(Math.random() * suits.length)].id;
          draft.maskColor = masks[Math.floor(Math.random() * masks.length)].id;
          draft.belt = unlockedBelts[Math.floor(Math.random() * unlockedBelts.length)].id;
          draft.weapon = weapons[Math.floor(Math.random() * weapons.length)].id;
          draft.aura = auras[Math.floor(Math.random() * auras.length)].id;
          draft.headgear = hgs[Math.floor(Math.random() * hgs.length)];
          draft.eyes = eys[Math.floor(Math.random() * eys.length)];
          draft.pet = pts[Math.floor(Math.random() * pts.length)];
          checkDirty();
          draw();
        };
      }

      const resetBtn = container.querySelector('#njBtnReset');
      if (resetBtn) {
        resetBtn.onclick = () => {
          draft = { suitColor: '#1e293b', belt: 'white', maskColor: '#0f172a', weapon: 'katana', aura: 'none', headgear: 'none', eyes: 'amber', pet: 'none' };
          checkDirty();
          draw();
        };
      }

      const saveBtn = container.querySelector('#njBtnSave');
      if (saveBtn) {
        saveBtn.onclick = () => {
          localStorage.setItem('epickast.ninja.v1', JSON.stringify(draft));
          Object.assign(savedInitial, draft);
          checkDirty();
          if (window.EconomyService) {
            window.EconomyService.saveVault(window.EconomyService.getVault());
          }
          if (typeof onSaveCallback === 'function') onSaveCallback(draft);
        };
      }

      window.__EK?.assertNoBadText(container);
    };

    if (scope) {
      scope.interval(() => {
        animFrame = (animFrame + 1) % 6;
        const holder = container.querySelector('#njPreviewSpriteHolder');
        if (holder) {
          holder.innerHTML = renderPixelNinjaSvg(draft, { size: 136, pose: currentPose, frame: animFrame });
        }
      }, 600);
    }

    draw();
    return {
      hasUnsavedChanges: () => isDirty
    };
  }

  CardJitsuGame.renderNinjaCustomizer = renderNinjaCustomizer;
  window.CardJitsuGame = CardJitsuGame;
  window.renderNinjaCustomizer = renderNinjaCustomizer;
  window.renderPixelNinjaSvg = renderPixelNinjaSvg;
})();
