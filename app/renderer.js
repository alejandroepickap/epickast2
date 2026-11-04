'use strict';
const $ = (id) => document.getElementById(id);
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}

const SVG_PATHS = {
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/>',
  gallery: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  tiles: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  panelLeft: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};
function icoSvg(name, size = 15) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '2');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.innerHTML = SVG_PATHS[name] || '';
  return s;
}

const DEFAULTS = {
  server: 'wss://epickast-b9fd.onrender.com', mic: '', cam: '', spk: '',
  camPreset: '720p30', screenPreset: '1080p30', screenAudio: true, hideOwnScreenPreview: false,
  hwPrefer: true, stats: false, noise: 'high', micGain: 1, voiceGate: 0.006, audioKbps: 96,
  accent: '#7c5cff', ringVol: 0.6, dnd: false, autoPip: true,
  keyMute: 'Alt+M', keyDeaf: 'Alt+D', stageHeight: 60, hideNoVideo: true,
  partyVol: 0.75, partyAudioOnly: false, autoGameDetect: true, customActivity: '',
  hideSide: false, hideMembers: false, disableGpu: false,
  voiceMode: 'vad', pttKey: 'Control', pttCue: true, gameMode: false,
  mutedServers: [], chatSound: true,
};
const ROLES = {
  owner:  { label: 'Dueño',       group: '👑 Dueño',            badge: '👑', color: '#fbbf24', rank: 4 },
  admin:  { label: 'Admin',       group: '🛡️ Administradores',  badge: '🛡️', color: '#ff6b81', rank: 3 },
  mod:    { label: 'Moderador',   group: '⚔️ Moderadores',      badge: '⚔️', color: '#2ed573', rank: 2 },
  dj:     { label: 'DJ',          group: '🎵 DJs',              badge: '🎵', color: '#a29bfe', rank: 1 },
  member: { label: 'Miembro',     group: '🟢 Miembros en línea', badge: '',   color: '',        rank: 0 },
};
const settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('epickast.settings') || '{}') };
if (settings.voiceGate === 0.024 || settings.voiceGate === undefined) settings.voiceGate = 0.006;
if (!settings.server || /^ws:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(settings.server) || /epickast\.onrender\.com/i.test(settings.server)) {
  settings.server = DEFAULTS.server;
  localStorage.setItem('epickast.settings', JSON.stringify(settings));
}
const saveSettings = () => localStorage.setItem('epickast.settings', JSON.stringify(settings));
function applyTheme(theme) {
  theme = theme || settings.theme || 'dark';
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
applyTheme(settings.theme);

const userVols = JSON.parse(localStorage.getItem('epickast.volumes') || '{}'); // userId -> 0..2 (1 = 100%)
const getUserVol = (uid) => (userVols[uid] !== undefined ? Number(userVols[uid]) : 1);
const setUserVol = (uid, v) => { userVols[uid] = Math.round(v * 100) / 100; localStorage.setItem('epickast.volumes', JSON.stringify(userVols)); };
function applyAccent() { document.documentElement.style.setProperty('--ac', settings.accent); }
function applyStageHeight() { document.documentElement.style.setProperty('--stage-h', `${Math.max(24, Math.min(94, Number(settings.stageHeight) || 60))}vh`); }
function applyShortcuts() {
  window.epic.setShortcuts?.({
    mute: settings.keyMute || 'Alt+M',
    deaf: settings.keyDeaf || 'Alt+D',
    overlay: settings.keyOverlay || 'Alt+O',
    pip: settings.keyPip || 'Alt+P',
    screen: settings.keyScreen || 'Alt+S',
    hang: settings.keyHang || 'Alt+Q'
  }).catch(() => {});
}
applyAccent();
applyStageHeight();
applyShortcuts();

function playEpicStartupSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, t);
    master.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    master.connect(ctx.destination);

    // Sub-bass sweep
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.35);
    subGain.gain.setValueAtTime(0.65, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    subOsc.connect(subGain);
    subGain.connect(master);
    subOsc.start(t);
    subOsc.stop(t + 0.8);

    // Punch transient
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(260, t);
    punchOsc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    punchGain.gain.setValueAtTime(0.45, t);
    punchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    punchOsc.connect(punchGain);
    punchGain.connect(master);
    punchOsc.start(t);
    punchOsc.stop(t + 0.2);

    // Crystalline Chime
    const chimeTimes = [0.12, 0.22];
    const freqs = [
      [523.25, 783.99],
      [1046.5, 1318.51, 1567.98]
    ];
    chimeTimes.forEach((delay, idx) => {
      const startT = t + delay;
      freqs[idx].forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startT);
        gain.gain.setValueAtTime(0.001, startT);
        gain.gain.linearRampToValueAtTime(0.18, startT + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.9);
        osc.connect(gain);
        gain.connect(master);
        osc.start(startT);
        osc.stop(startT + 1.0);
      });
    });

    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, 2000);
  } catch {}
}

function handleAppSplash() {
  const splash = $('appSplash');
  if (!splash) return;
  setTimeout(() => playEpicStartupSound(), 150);
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      try { splash.remove(); } catch {}
    }, 550);
  }, 1400);
}

handleAppSplash();

function modalVault() {
  const m = $('modal');
  if (!m) return;
  m.classList.remove('hidden');
  m.replaceChildren();

  // Cargar datos locales de llaves del jugador, cosméticos, polvo y piedad
  let dData = {
    coins: 50,
    keys: { copper: 1, silver: 0, gold: 0, obsidian: 0 },
    dust: 0,
    pity: { withoutEpic: 0, withoutLegendary: 0 },
    dailyExchange: { date: new Date().toISOString().slice(0, 10), copper: 0, silver: 0 },
    founderFrameUnlocked: false,
    cosmetics: {}
  };

  try {
    const raw = localStorage.getItem('epickast.dungeon.v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      dData = { ...dData, ...parsed };
      if (!dData.cosmetics) dData.cosmetics = {};
      if (!dData.pity) dData.pity = { withoutEpic: 0, withoutLegendary: 0 };
      if (!dData.keys) dData.keys = { copper: 1, silver: 0, gold: 0, obsidian: 0 };
    }
  } catch {}

  const today = new Date().toISOString().slice(0, 10);
  if (!dData.dailyExchange || dData.dailyExchange.date !== today) {
    dData.dailyExchange = { date: today, copper: 0, silver: 0 };
  }

  // CATÁLOGO DE 26 COSMÉTICOS (ORDENADO ESTRICTAMENTE POR PRESTIGIO / RAREZA)
  const PROFILE_COSMETICS = [
    // 1. LEGENDARIOS (4)
    { id: 'founder_frame', name: '★ Marco de Avatar FUNDADOR ★', type: 'frame', val: 'founder_blue', rarity: 'legendary', desc: 'Marco Azul Neón con insignia \"FUNDADOR\" para llamadas, chat y perfil (Prestigio Edición 1).' },
    { id: 'frame_colossus_legend', name: 'Marco: Núcleo del Coloso', type: 'frame', val: 'frame-colossus-legend', rarity: 'legendary', desc: 'Doble halo dorado y cian con rotación continua.' },
    { id: 'banner_golem_animated', name: 'Banner: Despertar del Gólem', type: 'banner', val: 'linear-gradient(135deg, #18181b, #701a75, #b91c1c, #450a0a)', rarity: 'legendary', desc: 'Estandarte animado del coloso de obsidiana despertando.' },
    { id: 'title_colossus_slayer', name: 'Título: Coloso Caído', type: 'title', val: 'Coloso Caído', rarity: 'legendary', desc: 'Título resplandeciente reservado para quienes derriban al Gólem.' },

    // 2. ÉPICOS (5)
    { id: 'frame_runic', name: 'Marco: Partículas Rúnicas', type: 'frame', val: 'frame-runic', rarity: 'epic', desc: 'Marco pulsante con chispas mágicas alrededor de tu avatar.' },
    { id: 'color_aurora', name: 'Color: Aurora Boreal', type: 'color', val: 'linear-gradient(90deg, #00e5ff, #a855f7)', rarity: 'epic', desc: 'Gradiente animado estilo aurora boreal para tu nombre.' },
    { id: 'color_volcanic_flame', name: 'Color: Fuego Volcánico', type: 'color', val: 'linear-gradient(90deg, #ff3366, #ffb300)', rarity: 'epic', desc: 'Gradiente ardiente en movimiento continuo.' },
    { id: 'banner_fluid_lava', name: 'Banner: Lava Fluida', type: 'banner', val: 'linear-gradient(135deg, #7f1d1d, #ea580c, #f59e0b, #991b1b)', rarity: 'epic', desc: 'Banner con ondulación fluida de lava fundida.' },
    { id: 'banner_rune_storm', name: 'Banner: Tormenta Rúnica', type: 'banner', val: 'linear-gradient(135deg, #1e1b4b, #6366f1, #a855f7, #312e81)', rarity: 'epic', desc: 'Estandarte cósmico con rayos de energía púrpura.' },

    // 3. RAROS (7)
    { id: 'frame_copper', name: 'Marco: Cobre Forjado', type: 'frame', val: 'frame-copper', rarity: 'rare', desc: 'Bisel de cobre bruñido para tu avatar.' },
    { id: 'frame_silver', name: 'Marco: Plata Rúnica', type: 'frame', val: 'frame-silver', rarity: 'rare', desc: 'Bisel plateado brillante con runas grabadas.' },
    { id: 'frame_amethyst', name: 'Marco: Geoda Amatista', type: 'frame', val: 'frame-amethyst', rarity: 'rare', desc: 'Cristales de amatista facetados que rodean tu avatar.' },
    { id: 'title_explorer', name: 'Título: Explorador del Núcleo', type: 'title', val: 'Explorador del Núcleo', rarity: 'rare', desc: 'Distintivo para quienes descienden a las profundidades.' },
    { id: 'title_smith', name: 'Título: Herrero de Magma', type: 'title', val: 'Herrero de Magma', rarity: 'rare', desc: 'Insignia rúnica de maestro forjador de reliquias.' },
    { id: 'title_shadow', name: 'Título: Cazador de Sombras', type: 'title', val: 'Cazador de Sombras', rarity: 'rare', desc: 'Otorgado a quienes purgan las galerías oscuras.' },
    { id: 'title_pioneer', name: 'Título: Pionero', type: 'title', val: 'Pionero', rarity: 'rare', desc: 'Título honorable para los primeros aventureros.' },

    // 4. COMUNES (10)
    { id: 'color_amber', name: 'Color: Ámbar Volcánico', type: 'color', val: '#f59e0b', rarity: 'common', desc: 'Tinte ígneo de magma ardiente para tu nombre y perfil.' },
    { id: 'color_amethyst', name: 'Color: Púrpura Amatista', type: 'color', val: '#a855f7', rarity: 'common', desc: 'Resplandor amatista para tu nombre en la lista de miembros.' },
    { id: 'color_emerald', name: 'Color: Verde Esmeralda', type: 'color', val: '#10b981', rarity: 'common', desc: 'Tinte resplandeciente esmeralda del Núcleo.' },
    { id: 'color_cyan', name: 'Color: Cian Neón', type: 'color', val: '#00e5ff', rarity: 'common', desc: 'Destello ciberpunk cian brillante para tu nombre.' },
    { id: 'color_crimson', name: 'Color: Rojo Magma', type: 'color', val: '#ff3366', rarity: 'common', desc: 'Tono carmesí ardiente de roca fundida.' },
    { id: 'banner_mines', name: 'Banner: Minas de Magma', type: 'banner', val: 'linear-gradient(135deg, #451a03, #b45309, #78350f)', rarity: 'common', desc: 'Estandarte de magma y basalto para tu tarjeta de perfil.' },
    { id: 'banner_amethyst', name: 'Banner: Galerías de Amatista', type: 'banner', val: 'linear-gradient(135deg, #2e1065, #7e22ce, #3b0764)', rarity: 'common', desc: 'Estandarte de geodas púrpuras brillantes para tu tarjeta de perfil.' },
    { id: 'banner_crypt', name: 'Banner: Cripta Ancestral', type: 'banner', val: 'linear-gradient(135deg, #09090b, #1e293b, #334155)', rarity: 'common', desc: 'Muros de piedra antigua y niebla espectral.' },
    { id: 'banner_bridges', name: 'Banner: Puentes de Lava', type: 'banner', val: 'linear-gradient(135deg, #1c1917, #ea580c, #7f1d1d)', rarity: 'common', desc: 'Puentes de piedra sobre el abismo volcánico.' },
    { id: 'banner_sanctum', name: 'Banner: Sagrario del Núcleo', type: 'banner', val: 'linear-gradient(135deg, #09090b, #581c87, #dc2626)', rarity: 'common', desc: 'Santuario central de obsidiana del Núcleo.' }
  ];

  const RARITY_COLORS = { common: '#60a5fa', rare: '#a78bfa', epic: '#f43f5e', legendary: '#fbbf24' };
  const CHEST_ODDS = {
    copper: { common: 0.80, rare: 0.17, epic: 0.03, legendary: 0.00 },
    silver: { common: 0.55, rare: 0.33, epic: 0.11, legendary: 0.01 },
    gold: { common: 0.25, rare: 0.45, epic: 0.25, legendary: 0.05 },
    obsidian: { common: 0.00, rare: 0.40, epic: 0.45, legendary: 0.15 }
  };
  const DUST_DUPLICATE = { common: 2, rare: 8, epic: 20, legendary: 50 };
  const DUST_CRAFT = { common: 40, rare: 120, epic: 300, legendary: 800 };

  let activeTab = 'roulette'; // 'roulette' | 'collection' | 'dojo'
  let activeFilter = 'all';    // 'all' | 'frame' | 'banner' | 'color' | 'title'
  let selectedTier = 'copper';
  if ((dData.keys.obsidian || 0) > 0) selectedTier = 'obsidian';
  else if ((dData.keys.gold || 0) > 0) selectedTier = 'gold';
  else if ((dData.keys.silver || 0) > 0) selectedTier = 'silver';

  let isSpinning = false;

  const saveState = () => {
    try { localStorage.setItem('epickast.dungeon.v1', JSON.stringify(dData)); } catch {}
  };

  const rollRarity = (tier) => {
    const odds = { ...CHEST_ODDS[tier] };
    const pLeg = dData.pity.withoutLegendary || 0;
    const pEpic = dData.pity.withoutEpic || 0;

    // Sintonía dura legendaria apertura 60
    if (pLeg >= 59 && tier !== 'copper') return 'legendary';

    // Sintonía suave legendaria desde apertura 35
    if (pLeg >= 35 && tier !== 'copper') {
      const extra = (pLeg - 34) * 0.015;
      odds.legendary = Math.min(0.90, odds.legendary + extra);
    }

    // Sintonía de épico cada 10 aperturas
    if (pEpic >= 9) {
      if (odds.legendary > 0) {
        odds.epic = 1.0 - odds.legendary;
        odds.rare = 0; odds.common = 0;
      } else {
        odds.epic = 1.0; odds.rare = 0; odds.common = 0;
      }
    }

    const r = Math.random();
    let acc = 0;
    for (const [rar, prob] of Object.entries(odds)) {
      acc += prob;
      if (r <= acc) return rar;
    }
    return 'common';
  };

  const equipCosmeticItem = (item) => {
    if (item.type === 'frame') {
      localStorage.setItem('epickast.equipped_frame', item.val);
      if (S.me) S.me.frame = item.val;
      if (typeof rpc === 'function') rpc('profile.update', { frame: item.val }).catch(() => {});
      toast('🖼️ ¡Marco equipado!');
    } else if (item.type === 'color') {
      localStorage.setItem('epickast.equipped_color', item.val);
      if (S.me) S.me.color = item.val;
      if (typeof rpc === 'function') rpc('profile.update', { color: item.val }).catch(() => {});
      toast('🎨 ¡Color de perfil equipado!');
    } else if (item.type === 'banner') {
      localStorage.setItem('epickast.equipped_banner', item.val);
      if (S.me) S.me.banner = item.val;
      if (typeof rpc === 'function') rpc('profile.update', { banner: item.val }).catch(() => {});
      toast('🏷️ ¡Banner equipado!');
    } else if (item.type === 'title') {
      localStorage.setItem('epickast.equipped_title', item.val);
      if (S.me) S.me.title = item.val;
      if (typeof rpc === 'function') rpc('profile.update', { title: item.val }).catch(() => {});
      toast('👑 ¡Título equipado!');
    }
    render();
    renderView();
    if (activeTab === 'collection') renderCosmeticsGrid();
  };

  const wrap = document.createElement('div');
  wrap.style.cssText = 'box-sizing:border-box;width:96%;max-width:960px;max-height:90vh;overflow-y:auto;background:#11141c;border:1px solid #282f40;border-radius:12px;padding:20px;box-shadow:0 12px 36px rgba(0,0,0,0.6);font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;margin:auto;position:relative;';

  const renderView = () => {
    wrap.innerHTML = '';

    const unlockedCount = Object.keys(dData.cosmetics || {}).length + (dData.founderFrameUnlocked ? 1 : 0);
    const pctUnlocked = Math.round((unlockedCount / 26) * 100);

    wrap.innerHTML = `
      <!-- Cabecera Discreta y Navegación Modular por Pestañas -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #222938;padding-bottom:14px;margin-bottom:14px;gap:12px;">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <span style="font-size:24px;">🏛️</span>
          <div style="min-width:0;">
            <h2 style="font-size:16px;font-weight:900;color:#f8fafc;margin:0;letter-spacing:0.5px;white-space:nowrap;">BÓVEDA DE RELIQUIAS · v1.8.3</h2>
            <p style="font-size:11.5px;color:#94a3b8;margin:2px 0 0 0;white-space:nowrap;">Cosméticos permanentes para perfil, chat y llamadas · Dojo de Cartas</p>
          </div>
        </div>

        <!-- 3 Pestañas Modulares tipo Pill -->
        <div style="display:flex;background:#0d1017;padding:3px;border-radius:8px;border:1px solid #202636;gap:4px;margin-left:auto;">
          <button id="vTabBtnRoulette" style="background:${activeTab==='roulette'?'#232a3b':'transparent'};color:${activeTab==='roulette'?'#fff':'#94a3b8'};border:${activeTab==='roulette'?'1px solid #3b4660':'1px solid transparent'};padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;transition:0.15s;">
            🎁 Ruleta y Cofres
          </button>
          <button id="vTabBtnCollection" style="background:${activeTab==='collection'?'#232a3b':'transparent'};color:${activeTab==='collection'?'#fff':'#94a3b8'};border:${activeTab==='collection'?'1px solid #3b4660':'1px solid transparent'};padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;transition:0.15s;">
            🎨 Mi Armario (${unlockedCount}/26)
          </button>
          <button id="vTabBtnDojo" style="background:${activeTab==='dojo'?'#232a3b':'transparent'};color:${activeTab==='dojo'?'#fff':'#94a3b8'};border:${activeTab==='dojo'?'1px solid #3b4660':'1px solid transparent'};padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;transition:0.15s;">
            🥋 Dojo Elemental
          </button>
        </div>

        <!-- Botón de Cerrar formal en la esquina derecha -->
        <button id="vCloseBtn" style="background:#1e2433;border:1px solid #3b4660;color:#f8fafc;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:800;transition:0.15s;flex-shrink:0;" title="Cerrar Bóveda (o presiona ESC)">✕ Cerrar</button>
      </div>

      <!-- Barra de Recursos Compacta y Sobria -->
      <div style="display:flex;justify-content:space-between;align-items:center;background:#151924;border:1px solid #202636;border-radius:8px;padding:8px 14px;margin-bottom:14px;font-size:12px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:14px;align-items:center;">
          <span>🪙 <b>${dData.coins || 0}</b> Monedas</span>
          <span style="color:#334155;">|</span>
          <span>✨ <b id="vDustCount">${dData.dust || 0}</b> Esencia Arcana</span>
          <span style="color:#334155;">|</span>
          <span style="color:#94a3b8;">⭐ Sintonía: <b>${dData.pity.withoutLegendary || 0}/60</b></span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button id="vBtnBuyCopper" style="background:#1e2433;border:1px solid #2e384d;color:#cbd5e1;padding:4px 10px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;" title="Límite 3 canjes por día">
            🔑 Cobre (150 🪙) [${dData.dailyExchange.copper || 0}/3]
          </button>
          <button id="vBtnBuySilver" style="background:#1e2433;border:1px solid #2e384d;color:#cbd5e1;padding:4px 10px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;" title="Límite 1 canje por día">
            🔑 Plata (500 🪙) [${dData.dailyExchange.silver || 0}/1]
          </button>
        </div>
      </div>

      <!-- VISTA 1: RULETA Y COFRES -->
      <div id="vViewRoulette" style="display:${activeTab==='roulette'?'flex':'none'};flex-direction:column;gap:12px;">
        <!-- Selector de Cofre / Nivel -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;">
          ${['copper','silver','gold','obsidian'].map(tier => {
            const count = dData.keys[tier] || 0;
            const isSel = selectedTier === tier;
            const names = { copper: 'Cobre', silver: 'Plata', gold: 'Oro', obsidian: 'Obsidiana' };
            const icons = { copper: '🔑', silver: '🔑', gold: '🥇', obsidian: '💎' };
            const color = { copper: '#d97706', silver: '#cbd5e1', gold: '#fbbf24', obsidian: '#a855f7' }[tier];
            return `
              <button class="vTabBtn" data-tier="${tier}" style="background:${isSel ? '#1e2536' : '#141822'};border:1.5px solid ${isSel ? color : '#222838'};border-radius:8px;padding:8px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:0.15s;">
                <span style="font-size:15px;">${icons[tier]}</span>
                <span style="font-size:12px;font-weight:800;color:${isSel ? '#fff' : '#94a3b8'};">${names[tier]}</span>
                <span style="font-size:10px;font-weight:700;color:${color};">${count} Llaves</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Probabilidades del Cofre Seleccionado -->
        <div style="font-size:11px;color:#94a3b8;text-align:center;">
          Probabilidades: Común ${Math.round(CHEST_ODDS[selectedTier].common*100)}% · Raro ${Math.round(CHEST_ODDS[selectedTier].rare*100)}% · Épico ${Math.round(CHEST_ODDS[selectedTier].epic*100)}% · Legendario ${Math.round(CHEST_ODDS[selectedTier].legendary*100)}%
        </div>

        <!-- Visor de la Ruleta -->
        <div style="position:relative;background:#0d1017;border:1px solid #202636;border-radius:8px;height:120px;overflow:hidden;box-shadow:inset 0 0 20px rgba(0,0,0,0.8);">
          <div style="position:absolute;top:0;bottom:0;left:50%;width:2px;background:#38bdf8;z-index:10;transform:translateX(-50%);box-shadow:0 0 8px #38bdf8;">
            <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #38bdf8;"></div>
          </div>
          <div id="vTrack" style="display:flex;height:100%;align-items:center;position:absolute;left:0;top:0;will-change:transform;"></div>
        </div>

        <!-- Botón Abrir Cofre -->
        <div style="text-align:center;margin-top:4px;">
          <button id="vBtnSpin" ${(dData.keys[selectedTier]||0)<=0?'disabled':''} style="background:${(dData.keys[selectedTier]||0)>0?'#2563eb':'#1e2433'};color:${(dData.keys[selectedTier]||0)>0?'#fff':'#64748b'};border:1px solid ${(dData.keys[selectedTier]||0)>0?'#3b82f6':'#2e384d'};font-size:13px;font-weight:800;padding:10px 28px;border-radius:6px;cursor:${(dData.keys[selectedTier]||0)>0?'pointer':'not-allowed'};letter-spacing:0.5px;transition:0.15s;">
            ${(dData.keys[selectedTier]||0)>0 ? `🔓 ABRIR COFRE DE ${selectedTier.toUpperCase()} (Consume 1 Llave)` : `🔒 NECESITAS 1 LLAVE DE ${selectedTier.toUpperCase()} (Juega en el Dojo)`}
          </button>
        </div>

        <!-- Área de Ganador Desbloqueado o Duplicado Reciclado -->
        <div id="vWinnerArea" style="display:none;padding:12px;background:#141923;border:1.5px solid #38bdf8;border-radius:8px;text-align:center;"></div>
      </div>

      <!-- VISTA 2: MI ARMARIO Y COLECCIÓN DISCRETA -->
      <div id="vViewCollection" style="display:${activeTab==='collection'?'flex':'none'};flex-direction:column;gap:12px;">
        <!-- Barra de Filtros y Progreso -->
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;background:#141822;padding:8px 12px;border-radius:8px;border:1px solid #202636;">
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            <button class="vFilterBtn" data-filter="all" style="background:${activeFilter==='all'?'#283247':'transparent'};color:${activeFilter==='all'?'#fff':'#94a3b8'};border:${activeFilter==='all'?'1px solid #3e4b68':'1px solid transparent'};padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;">Todos (26)</button>
            <button class="vFilterBtn" data-filter="frame" style="background:${activeFilter==='frame'?'#283247':'transparent'};color:${activeFilter==='frame'?'#fff':'#94a3b8'};border:${activeFilter==='frame'?'1px solid #3e4b68':'1px solid transparent'};padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;">🖼️ Marcos (5)</button>
            <button class="vFilterBtn" data-filter="banner" style="background:${activeFilter==='banner'?'#283247':'transparent'};color:${activeFilter==='banner'?'#fff':'#94a3b8'};border:${activeFilter==='banner'?'1px solid #3e4b68':'1px solid transparent'};padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;">🏷️ Banners (7)</button>
            <button class="vFilterBtn" data-filter="color" style="background:${activeFilter==='color'?'#283247':'transparent'};color:${activeFilter==='color'?'#fff':'#94a3b8'};border:${activeFilter==='color'?'1px solid #3e4b68':'1px solid transparent'};padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;">🎨 Colores (7)</button>
            <button class="vFilterBtn" data-filter="title" style="background:${activeFilter==='title'?'#283247':'transparent'};color:${activeFilter==='title'?'#fff':'#94a3b8'};border:${activeFilter==='title'?'1px solid #3e4b68':'1px solid transparent'};padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;">👑 Títulos (7)</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#94a3b8;">
            <span>Colección: <b style="color:#e2e8f0;">${unlockedCount} / 26</b> (${pctUnlocked}%)</span>
            <div style="width:70px;height:5px;background:#202636;border-radius:3px;overflow:hidden;">
              <div style="width:${pctUnlocked}%;height:100%;background:#38bdf8;"></div>
            </div>
          </div>
        </div>

        <!-- Cuadrícula Sobria y Ordenada por Rareza -->
        <div id="vCosmeticsGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));gap:10px;width:100%;box-sizing:border-box;"></div>
      </div>

      <!-- VISTA 3: DOJO ELEMENTAL (MINIJUEGO) -->
      <div id="vViewDojo" style="display:${activeTab==='dojo'?'block':'none'};width:100%;"></div>
    `;

    // Asignar eventos de pestañas
    const tabRoulette = wrap.querySelector('#vTabBtnRoulette');
    const tabCollection = wrap.querySelector('#vTabBtnCollection');
    const tabDojo = wrap.querySelector('#vTabBtnDojo');

    if (tabRoulette) tabRoulette.onclick = () => { activeTab = 'roulette'; renderView(); populatePreview(); };
    if (tabCollection) tabCollection.onclick = () => { activeTab = 'collection'; renderView(); renderCosmeticsGrid(); };
    if (tabDojo) tabDojo.onclick = () => { activeTab = 'dojo'; renderView(); mountDojo(); };

    // Filtros de colección
    wrap.querySelectorAll('.vFilterBtn').forEach(btn => {
      btn.onclick = () => {
        activeFilter = btn.dataset.filter;
        renderView();
        renderCosmeticsGrid();
      };
    });

    // Cerrar modal
    const closeBtn = wrap.querySelector('#vCloseBtn');
    if (closeBtn) closeBtn.onclick = () => { m.classList.add('hidden'); m.replaceChildren(); };

    // Botones de canje
    const buyCopBtn = wrap.querySelector('#vBtnBuyCopper');
    if (buyCopBtn) {
      buyCopBtn.onclick = async () => {
        if ((dData.dailyExchange.copper || 0) >= 3) return toast('Límite diario de Cobre alcanzado (3/3 hoy)');
        if ((dData.coins || 0) < 150) return toast('Monedas insuficientes (Necesitas 150 🪙)');
        dData.coins -= 150;
        dData.keys.copper = (dData.keys.copper || 0) + 1;
        dData.dailyExchange.copper = (dData.dailyExchange.copper || 0) + 1;
        saveState();
        ringer.beep([587, 880], 0.06, 0.12);
        toast('🔑 ¡1 Llave de Cobre canjeada!');
        if (typeof rpc === 'function') rpc('vault.exchange', { type: 'copper' }).catch(() => {});
        renderView();
        populatePreview();
      };
    }

    const buySilBtn = wrap.querySelector('#vBtnBuySilver');
    if (buySilBtn) {
      buySilBtn.onclick = async () => {
        if ((dData.dailyExchange.silver || 0) >= 1) return toast('Límite diario de Plata alcanzado (1/1 hoy)');
        if ((dData.coins || 0) < 500) return toast('Monedas insuficientes (Necesitas 500 🪙)');
        dData.coins -= 500;
        dData.keys.silver = (dData.keys.silver || 0) + 1;
        dData.dailyExchange.silver = (dData.dailyExchange.silver || 0) + 1;
        saveState();
        ringer.beep([659, 987], 0.06, 0.12);
        toast('🔑 ¡1 Llave de Plata canjeada!');
        if (typeof rpc === 'function') rpc('vault.exchange', { type: 'silver' }).catch(() => {});
        renderView();
        populatePreview();
      };
    }

    // Pestañas de cofre
    wrap.querySelectorAll('.vTabBtn').forEach(b => {
      b.onclick = () => {
        if (isSpinning) return;
        selectedTier = b.dataset.tier;
        renderView();
        populatePreview();
      };
    });

    // Botón Abrir Cofre (Ruleta)
    const spinBtn = wrap.querySelector('#vBtnSpin');
    if (spinBtn) {
      spinBtn.onclick = () => {
        if (isSpinning) return;
        if ((dData.keys[selectedTier] || 0) <= 0) {
          toast(`Necesitas 1 llave de ${selectedTier.toUpperCase()} para abrir este cofre. ¡Juega en el Dojo!`);
          return;
        }

        isSpinning = true;
        spinBtn.disabled = true;
        spinBtn.style.opacity = '0.5';
        wrap.querySelectorAll('.vTabBtn').forEach(b => b.disabled = true);
        const prevWinner = wrap.querySelector('#vWinnerArea');
        if (prevWinner) { prevWinner.style.display = 'none'; prevWinner.innerHTML = ''; }
        const trk = wrap.querySelector('#vTrack');
        if (trk) { trk.style.transition = 'none'; trk.style.transform = 'translateX(0px)'; trk.offsetHeight; }

        dData.keys[selectedTier] -= 1;

        const wonRarity = rollRarity(selectedTier);
        if (wonRarity === 'legendary') {
          dData.pity.withoutLegendary = 0;
          dData.pity.withoutEpic = 0;
        } else if (wonRarity === 'epic') {
          dData.pity.withoutEpic = 0;
          dData.pity.withoutLegendary = (dData.pity.withoutLegendary || 0) + 1;
        } else {
          dData.pity.withoutEpic = (dData.pity.withoutEpic || 0) + 1;
          dData.pity.withoutLegendary = (dData.pity.withoutLegendary || 0) + 1;
        }

        const pool = PROFILE_COSMETICS.filter(c => c.rarity === wonRarity);
        const winner = pool[Math.floor(Math.random() * pool.length)] || PROFILE_COSMETICS[0];
        const isDuplicate = !!(dData.cosmetics && dData.cosmetics[winner.id]);

        const track = wrap.querySelector('#vTrack');
        if (!track) return;

        const cardWidth = 100;
        const totalCards = 45;
        const winnerIndex = 36;
        const cards = [];

        for (let i = 0; i < totalCards; i++) {
          if (i === winnerIndex) {
            cards.push(winner);
          } else {
            const r = rollRarity(selectedTier);
            const p = PROFILE_COSMETICS.filter(c => c.rarity === r);
            cards.push(p[Math.floor(Math.random() * p.length)] || PROFILE_COSMETICS[0]);
          }
        }

        track.innerHTML = cards.map(item => {
          const rColor = RARITY_COLORS[item.rarity] || '#60a5fa';
          let visualPreview = '';
          if (item.type === 'frame') {
            visualPreview = '<div style="width:28px;height:28px;border-radius:50%;border:2px solid ' + rColor + ';display:grid;place-items:center;font-size:9.5px;font-weight:900;color:' + rColor + ';margin:2px 0;">★</div>';
          } else if (item.type === 'color') {
            visualPreview = `<div style="width:20px;height:20px;border-radius:50%;background:${item.val};margin:2px 0;"></div>`;
          } else if (item.type === 'title') {
            visualPreview = `<div style="font-size:9px;font-weight:700;color:${rColor};padding:2px 5px;border-radius:3px;background:rgba(255,255,255,0.06);border:1px solid ${rColor};margin:4px 0;">👑 Título</div>`;
          } else {
            visualPreview = `<div style="width:56px;height:14px;border-radius:3px;background:${item.val};border:1px solid rgba(255,255,255,0.2);margin:4px 0;"></div>`;
          }

          return `
            <div style="width:${cardWidth}px;height:95px;flex-shrink:0;background:#141822;border:1px solid #242b3b;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;box-sizing:border-box;margin:0 2px;">
              <span style="font-size:8.5px;font-weight:800;color:${rColor};text-transform:uppercase;">${item.rarity.toUpperCase()}</span>
              ${visualPreview}
              <span style="font-size:9.5px;font-weight:700;color:#cbd5e1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:92%;">${item.name}</span>
            </div>
          `;
        }).join('');

        const viewportWidth = 720;
        const targetOffset = (winnerIndex * cardWidth) - (viewportWidth / 2) + (cardWidth / 2) + (Math.random() * 30 - 15);
        const duration = 4000;

        let startTime = null;
        let lastTick = -1;
        let tickInt = null;

        if (typeof ringer !== 'undefined' && ringer.beep) {
          startTime = Date.now();
          tickInt = setInterval(() => {
            const elap = Date.now() - startTime;
            if (elap >= duration) { clearInterval(tickInt); return; }
            const p = 1 - Math.pow(1 - (elap / duration), 3);
            const curX = p * targetOffset;
            const curCard = Math.floor((curX + (viewportWidth / 2)) / cardWidth);
            if (curCard !== lastTick && curCard < totalCards) {
              lastTick = curCard;
              ringer.beep([950], 0.035, 0.08);
            }
          }, 25);
        }

        track.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.33, 1)`;
        track.style.transform = `translateX(-${targetOffset}px)`;

        setTimeout(() => {
          if (tickInt) clearInterval(tickInt);
          isSpinning = false;
          wrap.querySelectorAll('.vTabBtn').forEach(b => b.disabled = false);
          if (spinBtn) {
            spinBtn.disabled = (dData.keys[selectedTier] || 0) <= 0;
            spinBtn.style.opacity = (dData.keys[selectedTier] || 0) > 0 ? '1' : '0.5';
            spinBtn.innerHTML = (dData.keys[selectedTier] || 0) > 0 ? `🔓 ABRIR COFRE DE ${selectedTier.toUpperCase()} (Consume 1 Llave)` : `🔒 NECESITAS 1 LLAVE DE ${selectedTier.toUpperCase()} (Juega en el Dojo)`;
          }
          const dustEl = wrap.querySelector('#vDustCount');
          if (dustEl) dustEl.textContent = dData.dust || 0;
          if (typeof ringer !== 'undefined') ringer.beep([523, 659, 784, 1046], 0.08, 0.16);

          if (!isDuplicate) {
            if (!dData.cosmetics) dData.cosmetics = {};
            dData.cosmetics[winner.id] = true;
            if (winner.id === 'founder_frame') dData.founderFrameUnlocked = true;
          } else {
            const dustAward = DUST_DUPLICATE[winner.rarity] || 2;
            dData.dust = (dData.dust || 0) + dustAward;
          }

          saveState();

          const winnerArea = wrap.querySelector('#vWinnerArea');
          const rColor = RARITY_COLORS[winner.rarity] || '#60a5fa';
          winnerArea.style.display = 'block';
          winnerArea.style.borderColor = rColor;

          let previewHtml = '';
          if (winner.type === 'color') {
            previewHtml = `<div style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${winner.val};vertical-align:middle;margin-right:8px;"></div>`;
          } else if (winner.type === 'banner') {
            previewHtml = `<div style="display:inline-block;width:70px;height:20px;border-radius:3px;background:${winner.val};border:1px solid rgba(255,255,255,0.3);vertical-align:middle;margin-right:8px;"></div>`;
          } else if (winner.type === 'title') {
            previewHtml = '<span style="font-size:18px;vertical-align:middle;margin-right:6px;">👑</span>';
          } else {
            previewHtml = '<span style="font-size:18px;vertical-align:middle;margin-right:6px;">⭐</span>';
          }

          if (isDuplicate) {
            const dustAward = DUST_DUPLICATE[winner.rarity] || 2;
            winnerArea.innerHTML = `
              <div style="font-size:11px;font-weight:800;color:${rColor};text-transform:uppercase;margin-bottom:3px;">
                ♻️ ¡COSMÉTICO REPETIDO! (${winner.rarity.toUpperCase()})
              </div>
              <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:4px;display:flex;align-items:center;justify-content:center;">
                ${previewHtml} <span>${winner.name}</span>
              </div>
              <div style="font-size:12px;color:#c084fc;font-weight:700;margin-bottom:4px;">
                ✨ Convertido automáticamente en +${dustAward} Esencia Arcana (Total: ${dData.dust})
              </div>
              <div style="font-size:11px;color:#94a3b8;">
                Usa tu polvo en \"Mi Armario\" para forjar cualquier cosmético que te falte.
              </div>
            `;
          } else {
            winnerArea.innerHTML = `
              <div style="font-size:11px;font-weight:800;color:${rColor};text-transform:uppercase;margin-bottom:3px;">
                🎉 ¡NUEVA RECOMPENSA DESBLOQUEADA! (${winner.rarity.toUpperCase()})
              </div>
              <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:4px;display:flex;align-items:center;justify-content:center;">
                ${previewHtml} <span>${winner.name}</span>
              </div>
              <div style="font-size:11.5px;color:#94a3b8;max-width:560px;margin:0 auto 10px auto;">${winner.desc}</div>
              <div>
                <button id="vBtnEquipWinner" style="background:#10b981;border:none;color:#fff;font-weight:800;font-size:12px;padding:7px 22px;border-radius:6px;cursor:pointer;">
                  ✨ EQUIPAR AHORA
                </button>
              </div>
            `;

            const equipBtn = winnerArea.querySelector('#vBtnEquipWinner');
            if (equipBtn) {
              equipBtn.onclick = () => {
                equipCosmeticItem(winner);
                equipBtn.textContent = '✓ ¡Equipado en tu perfil!';
                equipBtn.style.background = '#047857';
              };
            }
          }

          spinBtn.disabled = (dData.keys[selectedTier] || 0) <= 0;
          spinBtn.style.opacity = (dData.keys[selectedTier] || 0) > 0 ? '1' : '0.5';
          spinBtn.style.cursor = (dData.keys[selectedTier] || 0) > 0 ? 'pointer' : 'not-allowed';
          spinBtn.innerHTML = (dData.keys[selectedTier] || 0) > 0
            ? `🔓 ABRIR COFRE DE ${selectedTier.toUpperCase()} (Consume 1 Llave)`
            : `🔒 NECESITAS 1 LLAVE DE ${selectedTier.toUpperCase()} (Juega en el Dojo)`;

          const dCountEl = wrap.querySelector('#vDustCount');
          if (dCountEl) dCountEl.textContent = dData.dust || 0;
        }, duration + 150);
      };
    }
  };

  const renderCosmeticsGrid = () => {
    const grid = wrap.querySelector('#vCosmeticsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const eqFrame = localStorage.getItem('epickast.equipped_frame');
    const eqColor = localStorage.getItem('epickast.equipped_color') || S.me?.color;
    const eqBanner = localStorage.getItem('epickast.equipped_banner') || S.me?.banner;
    const eqTitle = localStorage.getItem('epickast.equipped_title') || S.me?.title;

    // Filtrar y ordenar por rareza (Legendario -> Épico -> Raro -> Común)
    const rarityRank = { legendary: 4, epic: 3, rare: 2, common: 1 };
    const filtered = PROFILE_COSMETICS
      .filter(c => activeFilter === 'all' || c.type === activeFilter)
      .sort((a, b) => (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0));

    filtered.forEach(c => {
      const isUnlocked = !!(dData.cosmetics && dData.cosmetics[c.id]) || (c.id === 'founder_frame' && dData.founderFrameUnlocked);
      const isEquipped = (c.type === 'frame' && eqFrame === c.val) ||
                         (c.type === 'color' && eqColor === c.val) ||
                         (c.type === 'banner' && eqBanner === c.val) ||
                         (c.type === 'title' && eqTitle === c.val);

      const rColor = RARITY_COLORS[c.rarity] || '#60a5fa';
      const craftCost = DUST_CRAFT[c.rarity] || 40;
      const canCraft = !isUnlocked && (dData.dust || 0) >= craftCost;

      const card = document.createElement('div');
      card.style.cssText = `box-sizing:border-box;background:#141822;border:1px solid ${isEquipped ? '#10b981' : '#222838'};border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;position:relative;`;

      // Vista previa visual discreta
      let preview = '';
      if (c.type === 'frame') {
        const frameCls = c.val === 'founder_blue' ? 'frame-founder' : c.val;
        preview = `
          <div style="display:flex;align-items:center;gap:10px;background:#0d1017;padding:6px 10px;border-radius:6px;border:1px solid #1a202c;">
            <div class="avatar ${frameCls}" style="width:36px;height:36px;font-size:14px;background:#2563eb;flex-shrink:0;">EK</div>
            <div style="font-size:10.5px;color:#94a3b8;font-weight:700;">Vista previa en avatar</div>
          </div>
        `;
      } else if (c.type === 'color') {
        preview = `
          <div style="display:flex;align-items:center;gap:8px;background:#0d1017;padding:6px 10px;border-radius:6px;border:1px solid #1a202c;">
            <span style="width:16px;height:16px;border-radius:50%;background:${c.val};flex-shrink:0;"></span>
            <span style="font-size:11.5px;font-weight:800;color:${c.val};">@${S.me?.name || 'Usuario'}</span>
          </div>
        `;
      } else if (c.type === 'title') {
        const isLegend = c.rarity === 'legendary';
        preview = `
          <div style="display:flex;align-items:center;justify-content:center;background:#0d1017;padding:6px;border-radius:6px;border:1px solid #1a202c;">
            <div class="user-title-badge ${isLegend ? 'legendary' : ''}" style="font-size:10.5px;padding:2px 8px;">👑 ${c.val}</div>
          </div>
        `;
      } else {
        preview = `
          <div style="height:28px;border-radius:5px;background:${c.val};border:1px solid rgba(255,255,255,0.15);"></div>
        `;
      }

      let actionHtml = '';
      if (isEquipped) {
        actionHtml = '<button style="width:100%;background:#0f291e;border:1px solid rgba(16,185,129,0.3);color:#6ee7b7;font-size:11px;font-weight:800;padding:6px;border-radius:5px;cursor:default;">✓ Equipado en Perfil</button>';
      } else if (isUnlocked) {
        actionHtml = '<button class="vEqBtn" style="width:100%;background:#283247;border:1px solid #3d4b68;color:#fff;font-size:11px;font-weight:800;padding:6px;border-radius:5px;cursor:pointer;">Equipar</button>';
      } else if (canCraft) {
        actionHtml = `<button class="vCraftBtn" style="width:100%;background:#2a2040;border:1px solid rgba(124,58,237,0.3);color:#c4b5fd;font-size:11px;font-weight:800;padding:6px;border-radius:5px;cursor:pointer;" title="Fabricar permanente">🔨 Fabricar (${craftCost} ✨)</button>`;
      } else {
        actionHtml = `<button disabled style="width:100%;background:#151922;border:1px solid #202634;color:#64748b;font-size:10.5px;font-weight:700;padding:6px;border-radius:5px;cursor:not-allowed;">🔒 Bloqueado (${craftCost} ✨)</button>`;
      }

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:9px;font-weight:800;color:${rColor};text-transform:uppercase;">● ${c.rarity.toUpperCase()} · ${c.type.toUpperCase()}</span>
          ${isEquipped ? '<span style="font-size:9.5px;color:#10b981;font-weight:800;">ACTIVO</span>' : ''}
        </div>
        <div style="font-size:12px;font-weight:800;color:#f1f5f9;line-height:1.2;">${c.name}</div>
        ${preview}
        <div style="font-size:10px;color:#94a3b8;line-height:1.3;min-height:24px;">${c.desc || ''}</div>
        <div style="margin-top:auto;padding-top:2px;">
          ${actionHtml}
        </div>
      `;

      const eqBtn = card.querySelector('.vEqBtn');
      if (eqBtn) eqBtn.onclick = () => equipCosmeticItem(c);

      const craftBtn = card.querySelector('.vCraftBtn');
      if (craftBtn) {
        craftBtn.onclick = () => {
          if ((dData.dust || 0) < craftCost) return;
          dData.dust -= craftCost;
          if (!dData.cosmetics) dData.cosmetics = {};
          dData.cosmetics[c.id] = true;
          if (c.id === 'founder_frame') dData.founderFrameUnlocked = true;
          saveState();
          if (typeof ringer !== 'undefined') ringer.beep([523, 659, 784], 0.06, 0.12);
          toast(`✨ ¡Has fabricado: ${c.name}!`);
          equipCosmeticItem(c);
        };
      }

      grid.appendChild(card);
    });
  };

  const populatePreview = () => {
    const track = wrap.querySelector('#vTrack');
    if (!track) return;
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';
    const sample = PROFILE_COSMETICS.slice(0, 16);
    track.innerHTML = sample.map(item => {
      const rColor = RARITY_COLORS[item.rarity] || '#60a5fa';
      let visualPreview = '';
      if (item.type === 'frame') {
        visualPreview = '<div style="width:28px;height:28px;border-radius:50%;border:2px solid ' + rColor + ';display:grid;place-items:center;font-size:9.5px;font-weight:900;color:' + rColor + ';margin:2px 0;">★</div>';
      } else if (item.type === 'color') {
        visualPreview = `<div style="width:20px;height:20px;border-radius:50%;background:${item.val};margin:2px 0;"></div>`;
      } else if (item.type === 'title') {
        visualPreview = `<div style="font-size:9px;font-weight:700;color:${rColor};padding:2px 5px;border-radius:3px;background:rgba(255,255,255,0.06);border:1px solid ${rColor};margin:4px 0;">👑 Título</div>`;
      } else {
        visualPreview = `<div style="width:56px;height:14px;border-radius:3px;background:${item.val};border:1px solid rgba(255,255,255,0.2);margin:4px 0;"></div>`;
      }

      return `
        <div style="width:100px;height:95px;flex-shrink:0;background:#141822;border:1px solid #242b3b;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;box-sizing:border-box;margin:0 2px;">
          <span style="font-size:8.5px;font-weight:800;color:${rColor};text-transform:uppercase;">${item.rarity.toUpperCase()}</span>
          ${visualPreview}
          <span style="font-size:9.5px;font-weight:700;color:#cbd5e1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:92%;">${item.name}</span>
        </div>
      `;
    }).join('');
  };

  const mountDojo = () => {
    const dojoContainer = wrap.querySelector('#vViewDojo');
    if (!dojoContainer) return;
    if (window.CardJitsuGame) {
      new window.CardJitsuGame(dojoContainer, {
        onReward: (reward) => {
          if (reward.coins) dData.coins = (dData.coins || 0) + reward.coins;
          if (reward.keys) {
            if (reward.keys.copper) dData.keys.copper = (dData.keys.copper || 0) + reward.keys.copper;
            if (reward.keys.silver) dData.keys.silver = (dData.keys.silver || 0) + reward.keys.silver;
            if (reward.keys.gold) dData.keys.gold = (dData.keys.gold || 0) + reward.keys.gold;
            if (reward.keys.obsidian) dData.keys.obsidian = (dData.keys.obsidian || 0) + reward.keys.obsidian;
          }
          saveState();
          toast(`🎁 ¡Recompensas añadidas a tu Bóveda (+ ${reward.coins} 🪙)!`);
        }
      });
    } else {
      dojoContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Cargando Dojo Elemental...</div>';
    }
  };

  m.appendChild(wrap);
  renderView();
  populatePreview();
}

// ---------- CENTRO DE GUÍAS OFICIAL EPICKAST ----------
function openOfficialGuide(chKey = 'notas_version') {
  S.view = { kind: 'guide' };
  S.guideChannel = chKey;
  S.chan = null;
  S.chanType = 'guide';
  render();
}

function renderGuideContent(chKey) {
  const container = h('div', { class: 'guide-container', style: 'padding:24px 32px;overflow-y:auto;height:100%;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;line-height:1.6;' });

            if (chKey === 'notas_version' || chKey === 'notas_version_182' || chKey === 'notas_version_181') {
    container.innerHTML = `
      <div style="max-width:820px;margin:0 auto;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;line-height:1.6;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;border-bottom:1px solid #28193f;padding-bottom:16px;">
          <span style="font-size:36px;">🚀</span>
          <div>
            <h1 style="color:#f8fafc;font-size:22px;font-weight:900;margin:0;">Historial Oficial de Versiones</h1>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Hilo unificado de notas de versión, optimizaciones y registros de desarrollo de EpicKast.</p>
          </div>
        </div>

        <!-- ==================== VERSIÓN 1.8.3 (ACTUAL) ==================== -->
        <div style="border:2px solid #818cf8;border-radius:12px;padding:20px;margin-bottom:24px;background:#141328;box-shadow:0 8px 24px rgba(99,102,241,0.15);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #2d2b52;padding-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="background:#4f46e5;color:#fff;font-size:11px;font-weight:900;padding:3px 10px;border-radius:20px;">ACTUAL</span>
              <h2 style="font-size:18px;font-weight:900;color:#fff;margin:0;">Versión 1.8.3</h2>
            </div>
            <span style="font-size:12px;color:#a5b4fc;font-weight:700;">Lanzamiento Estable</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;color:#cbd5e1;">
            <div>
              <b style="color:#fde047;">🎬 Animaciones Cinemáticas Legendarias (Cartas 10+):</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Las cartas de valor 10, 11 y 12 ahora cuentan con sellos dorados de poder y desatan secuencias cinemáticas especiales al ganar rondas (Dragón Ígneo, Ventisca del Cero Absoluto y Tsunami del Leviatán).</li>
                <li>Ritmo de combate refinado en 3 fases: Revelación simultánea, Choque elemental o cinemático y Veredicto con diálogo del Sensei.</li>
              </ul>
            </div>

            <div>
              <b style="color:#38bdf8;">🧠 Escalado de Dificultad Táctica por Sensei:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li><b>Piso 1 (Novicio Ignis):</b> Nivel básico e instintivo para familiarizarse con el juego.</li>
                <li><b>Piso 2 (Monje de Escarcha):</b> Aprende tus patrones y busca combinaciones de trío.</li>
                <li><b>Piso 3 (Guardián del Torrente):</b> Bloqueador táctico que lee qué elemento te daría la victoria y juega su counter directo.</li>
                <li><b>Piso 4 (Campeón de Basalto):</b> Reserva cartas altas de 10+ para castigar empates de elemento.</li>
                <li><b>Piso 5 (Sensei del Núcleo):</b> Modo Gran Maestro Implacable: cuenta cartas, predice jugadas con árbol minimax y bloquea tus líneas ganadoras.</li>
              </ul>
            </div>

            <div>
              <b style="color:#ec4899;">🎨 Colores y Gradientes de Nombre Visibles Everywhere:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Soporte nativo para renderizar gradientes de texto (Aurora Boreal, Fuego Volcánico) y colores cosméticos en la lista de miembros, mensajes de chat y barra de usuario.</li>
              </ul>
            </div>

            <div>
              <b style="color:#10b981;">🎰 Corrección Definitiva del Bug de Ruleta:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Limpieza automática del banner de recompensa anterior y reseteo del desplazamiento del reel para permitir giros continuos sin trabas.</li>
              </ul>
            </div>

            <div>
              <b style="color:#a855f7;">🧵 Unificación del Registro de Versiones:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Todas las notas de versión se integraron en un único hilo continuo cronológico.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- ==================== VERSIÓN 1.8.2 ==================== -->
        <div style="background:#130e22;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h3 style="color:#c084fc;font-size:16px;font-weight:800;margin:0 0 10px 0;">Versión 1.8.2</h3>
          <ul style="font-size:13px;color:#cbd5e1;padding-left:22px;margin:0;display:flex;flex-direction:column;gap:5px;">
            <li><b>Animaciones de Destrucción:</b> Fuego calcina Nieve, Nieve congela Agua y Agua apaga Fuego.</li>
            <li><b>Personajes con Identidad:</b> Retratos de los 5 guardianes, rangos de cinturón y diálogos reactivos.</li>
            <li><b>Temporizador de Turno:</b> Cuenta regresiva de 15 segundos para mantener duelos dinámicos.</li>
            <li><b>Terminología Prémium:</b> Adopción de "Esencia Arcana" y "Sintonía Legendaria".</li>
            <li><b>Accesibilidad:</b> Botón de cierre en esquina superior y atajo de teclado <code>ESC</code>.</li>
            <li><b>DMs desde Servidores:</b> Envío directo de mensajes privados desde perfiles de miembros compartidos.</li>
            <li><b>Menciones @:</b> Botón para destacar mensajes y notificar usuarios en servidores.</li>
          </ul>
        </div>

        <!-- ==================== VERSIÓN 1.8.1 ==================== -->
        <div style="background:#130e22;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h3 style="color:#94a3b8;font-size:16px;font-weight:800;margin:0 0 10px 0;">Versión 1.8.1</h3>
          <ul style="font-size:13px;color:#cbd5e1;padding-left:22px;margin:0;display:flex;flex-direction:column;gap:5px;">
            <li><b>Bóveda Sobria y Discreta:</b> Rediseño con paleta slate oscura, eliminando saturaciones visuales.</li>
            <li><b>Orden Estricto de Cosméticos:</b> Jerarquía por Legendarios (4), Épicos (5), Raros (7) y Comunes (10).</li>
            <li><b>Minijuego Card-Jitsu:</b> Introducción del combate elemental en la pestaña del Dojo.</li>
            <li><b>Reparación de Configuración:</b> Solución al error de carga del botón de ajustes.</li>
          </ul>
        </div>

        <!-- ==================== VERSIÓN 1.8.0 ==================== -->
        <div style="background:#130e22;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h3 style="color:#64748b;font-size:16px;font-weight:800;margin:0 0 10px 0;">Versión 1.8.0</h3>
          <ul style="font-size:13px;color:#cbd5e1;padding-left:22px;margin:0;display:flex;flex-direction:column;gap:5px;">
            <li><b>Estados de Voz en Tiempo Real:</b> Iconos de silenciado, ensordecido y mute moderado en llamadas.</li>
            <li><b>Persistencia Cloud:</b> Respaldo y restauración automática de SQLite en Firebase Storage.</li>
            <li><b>Piedad Dura Determinista:</b> Algoritmo de garantía matemática en la apertura 60.</li>
          </ul>
        </div>
      </div>`;
  } else if (chKey === 'como_funciona') {
    container.innerHTML = `
      <div style="max-width:820px;margin:0 auto;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <span style="font-size:32px;">📘</span>
          <div>
            <h1 style="color:#f8fafc;font-size:22px;font-weight:900;margin:0;">Cómo Funciona EpicKast</h1>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Guía rápida de comunicación personal, llamadas de voz, streaming y controles de audio.</p>
          </div>
        </div>

        <!-- Sección 1: Llamadas de voz -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#38bdf8;font-size:16px;font-weight:800;margin:0 0 8px 0;display:flex;align-items:center;gap:8px;">
            <span>🔊</span> Llamadas de Voz Ultra-Baja Latencia
          </h2>
          <p style="font-size:13px;color:#cbd5e1;margin:0 0 10px 0;">
            EpicKast utiliza el códec adaptativo <b>Opus 48 kHz</b> con supresión de eco y reducción de ruido integrada. Puedes elegir entre:
          </p>
          <ul style="font-size:12.5px;color:#94a3b8;padding-left:20px;margin:0 0 10px 0;">
            <li><b>Detección de Voz (VAD):</b> Transmite de forma fluida cuando hablas sin necesidad de pulsar teclas.</li>
            <li><b>Pulsar para Hablar (PTT):</b> Mantén pulsada una tecla para abrir tu micrófono. Configurable en Ajustes.</li>
          </ul>
        </div>

        
        <!-- Sección 1b: Iconos de estado de voz y llamada -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#38bdf8;font-size:16px;font-weight:800;margin:0 0 8px 0;display:flex;align-items:center;gap:8px;">
            <span>🎙️</span> Estados de Voz y Moderación en Tiempo Real
          </h2>
          <p style="font-size:13px;color:#cbd5e1;margin:0 0 10px 0;">
            En cualquier sala de voz y llamada, los avatares y listas muestran el estado exacto de cada participante:
          </p>
          <ul style="font-size:12.5px;color:#94a3b8;padding-left:20px;margin:0 0 10px 0;">
            <li><b>🔇 Silenciado:</b> El usuario silenció voluntariamente su micrófono.</li>
            <li><b>🎧❌ Ensordecido:</b> El usuario desactivó el audio de la aplicación para no oír a los demás.</li>
            <li><b>🔇⛔ Silenciado por Admin:</b> Un moderador o administrador aplicó un silencio forzado al participante.</li>
            <li><b>📹 Cámara Web:</b> Indicador de vídeo en directo encendido.</li>
            <li><b>🖥️ Pantalla:</b> Indicador de que el usuario está transmitiendo su pantalla o juego.</li>
          </ul>
        </div>

        <!-- Sección 2: Transmisión de pantalla -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#a855f7;font-size:16px;font-weight:800;margin:0 0 8px 0;display:flex;align-items:center;gap:8px;">
            <span>🖥️</span> Transmisión de Pantalla 60 FPS
          </h2>
          <p style="font-size:13px;color:#cbd5e1;margin:0 0 10px 0;">
            Comparte tus partidas o ventanas de trabajo con aceleración de hardware por GPU (DirectX / NVENC) a 1080p y 60 FPS con mínimo impacto en rendimiento.
          </p>
          <ul style="font-size:12.5px;color:#94a3b8;padding-left:20px;margin:0;">
            <li><b>Ventana de Aplicación:</b> Comparte únicamente el juego o ventana deseada protegiendo tu privacidad.</li>
            <li><b>Pantalla Completa:</b> Comparte todo el monitor con audio sincronizado.</li>
            <li><b>Modo Mini (Picture-in-Picture):</b> Ventana flotante siempre visible para seguir la llamada mientras juegas.</li>
          </ul>
        </div>

        <!-- Sección 3: Bot DJ / YouTube -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#fbbf24;font-size:16px;font-weight:800;margin:0 0 8px 0;display:flex;align-items:center;gap:8px;">
            <span>🎵</span> Bot DJ / Música de YouTube Sincronizada
          </h2>
          <p style="font-size:13px;color:#cbd5e1;margin:0 0 10px 0;">
            En cualquier canal de voz activo, haz clic en el botón superior <b>🎵 Bot DJ</b> para buscar canciones o pegar enlaces de YouTube. Todos los oyentes en la sala escucharán la música sincronizada al milisegundo.
          </p>
        </div>

        <!-- Sección 4: Botones y Configuración -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;">
          <h2 style="color:#4ade80;font-size:16px;font-weight:800;margin:0 0 8px 0;display:flex;align-items:center;gap:8px;">
            <span>⚙️</span> Barra Inferior y Botones de Configuración
          </h2>
          <ul style="font-size:12.5px;color:#94a3b8;padding-left:20px;margin:0;">
            <li><b>🎤 Micrófono:</b> Clic para silenciar/activar con aviso visual.</li>
            <li><b>🎧 Auriculares:</b> Ensordecer audio completo de la app.</li>
            <li><b>⚙️ Ajustes:</b> Calibración de sensibilidad de micrófono, volumen maestro y dispositivos.</li>
          </ul>
        </div>
      </div>
    `;
  } else if (chKey === 'servidores') {
    container.innerHTML = `
      <div style="max-width:820px;margin:0 auto;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <span style="font-size:32px;">🏰</span>
          <div>
            <h1 style="color:#f8fafc;font-size:22px;font-weight:900;margin:0;">Guía de Servidores y Amigos</h1>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Crea tus propios espacios comunitarios, administra canales y organiza a tus grupos.</p>
          </div>
        </div>

        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#38bdf8;font-size:16px;font-weight:800;margin:0 0 8px 0;">➕ Crear tu Propio Servidor</h2>
          <p style="font-size:13px;color:#cbd5e1;margin:0 0 10px 0;">
            Pulsa el botón <b>+</b> en el riel lateral izquierdo. Elige un nombre, personaliza el icono y tu servidor estará listo al instante con canales preconfigurados.
          </p>
        </div>

        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#c084fc;font-size:16px;font-weight:800;margin:0 0 8px 0;">📢 Canales de Texto y Salas de Voz</h2>
          <ul style="font-size:12.5px;color:#94a3b8;padding-left:20px;margin:0;">
            <li><b># Canales de Texto:</b> Para compartir capturas de pantalla, notas de voz, enlaces y mensajes fijados.</li>
            <li><b>🔊 Salas de Voz:</b> Haz clic en cualquier canal de voz para conectarte al instante y compartir pantalla o escuchar música con amigos.</li>
          </ul>
        </div>

        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;">
          <h2 style="color:#fbbf24;font-size:16px;font-weight:800;margin:0 0 8px 0;">🛡️ Sistema de Rangos y Permisos</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-top:8px;">
            <div style="background:#0a0614;padding:8px;border-radius:6px;border:1px solid #78350f;">
              <b style="color:#fde047;">👑 Dueño:</b> Control total de administración.
            </div>
            <div style="background:#0a0614;padding:8px;border-radius:6px;border:1px solid #2563eb;">
              <b style="color:#60a5fa;">🛡️ Administrador:</b> Crear canales y moderación.
            </div>
            <div style="background:#0a0614;padding:8px;border-radius:6px;border:1px solid #16a34a;">
              <b style="color:#4ade80;">⚔️ Moderador:</b> Silenciar y mover usuarios.
            </div>
            <div style="background:#0a0614;padding:8px;border-radius:6px;border:1px solid #475569;">
              <b style="color:#cbd5e1;">👤 Miembro:</b> Acceso estándar a salas y chat.
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (chKey === 'mazmorras') {
    container.innerHTML = `
      <div style="max-width:820px;margin:0 auto;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <span style="font-size:32px;">⚔️</span>
          <div>
            <h1 style="color:#f8fafc;font-size:22px;font-weight:900;margin:0;">Dungeons of the Core • Temporada 1</h1>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Minijuego de 5 pisos, armas de combate, llaves criptográficas y catálogo mensual de skins.</p>
          </div>
        </div>

        <!-- Cómo funciona -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#38bdf8;font-size:16px;font-weight:800;margin:0 0 8px 0;">🌋 Mecánicas y Navegación</h2>
          <p style="font-size:13px;color:#cbd5e1;margin:0 0 10px 0;">
            Avanza a través de <b>5 plantas temáticas</b>: Minas de Magma, Galerías de Amatista, Puentes de Lava, Cripta de Basalto y el Sagrario del Núcleo.
          </p>
          <ul style="font-size:12.5px;color:#94a3b8;padding-left:20px;margin:0;">
            <li><b>Combate:</b> Clic Izquierdo (Espada melee con empuje) y Clic Derecho (Ballesta a distancia).</li>
            <li><b>Portal Místico (🌀):</b> Al derrotar a todos los enemigos de la sala, camina hacia el portal para descender y curarte (+35 HP).</li>
            <li><b>Inventario del Juego:</b> Los enemigos sueltan armas y armaduras para el juego que puedes equipar en la pestaña 🎒 Inventario.</li>
          </ul>
        </div>

        <!-- Llaves y Bóveda v2 -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;margin-bottom:16px;">
          <h2 style="color:#fbbf24;font-size:16px;font-weight:800;margin:0 0 8px 0;">🔑 Sistema de Recompensas v2 y Probabilidades Reales</h2>
          <p style="font-size:13px;color:#cbd5e1;margin:0 0 10px 0;">
            EpicKast garantiza <b>cero apuestas con dinero real</b>. Todas las llaves se ganan jugando. La ruleta se rige por probabilidades matemáticas transparentes y verificadas:
          </p>
          <div style="overflow-x:auto;margin-bottom:12px;">
            <table style="width:100%;font-size:11.5px;border-collapse:collapse;text-align:center;background:#090611;border-radius:6px;overflow:hidden;">
              <thead>
                <tr style="background:#1a1329;color:#e2e8f0;font-weight:800;">
                  <th style="padding:6px;text-align:left;">Cofre / Llave</th>
                  <th style="padding:6px;color:#4b69ff;">Común</th>
                  <th style="padding:6px;color:#8847ff;">Raro</th>
                  <th style="padding:6px;color:#d32ce6;">Épico</th>
                  <th style="padding:6px;color:#fbbf24;">Legendario</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-top:1px solid #221736;">
                  <td style="padding:6px;text-align:left;color:#d97706;font-weight:700;">🥉 Cobre</td>
                  <td>80%</td><td>17%</td><td>3%</td><td>0%</td>
                </tr>
                <tr style="border-top:1px solid #221736;">
                  <td style="padding:6px;text-align:left;color:#cbd5e1;font-weight:700;">🥈 Plata</td>
                  <td>55%</td><td>33%</td><td>11%</td><td>1%</td>
                </tr>
                <tr style="border-top:1px solid #221736;">
                  <td style="padding:6px;text-align:left;color:#fbbf24;font-weight:700;">🥇 Oro</td>
                  <td>25%</td><td>45%</td><td>25%</td><td>5%</td>
                </tr>
                <tr style="border-top:1px solid #221736;">
                  <td style="padding:6px;text-align:left;color:#c084fc;font-weight:700;">💎 Obsidiana</td>
                  <td>0%</td><td>40%</td><td>45%</td><td>15%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style="color:#38bdf8;font-size:13px;font-weight:800;margin:10px 0 6px 0;">🛡️ Garantía de Sintonía (Protección Anti-Mala Suerte)</h3>
          <ul style="font-size:12px;color:#94a3b8;padding-left:18px;margin:0 0 10px 0;">
            <li><b>Garantía de Épico:</b> Cada 10 aperturas seguidas sin Épico ni Legendario, la siguiente es garantizada de calidad Épica o superior.</li>
            <li><b>Sintonía Progresiva Legendaria:</b> Desde la apertura 35 sin Legendario, la probabilidad aumenta progresivamente (+1.5% por apertura).</li>
            <li><b>Sintonía Garantizada Legendaria:</b> En la apertura 60 sin Legendario, ¡el siguiente cosmético es Legendario 100% asegurado!</li>
          </ul>

          <h3 style="color:#a855f7;font-size:13px;font-weight:800;margin:10px 0 6px 0;">✨ Esencia Arcana (Cero Duplicados Inútiles)</h3>
          <p style="font-size:12px;color:#cbd5e1;margin:0 0 6px 0;">
            Si obtienes un cosmético que ya posees en tu colección, se desintegra automáticamente en <b>Esencia Arcana</b> (+2 Común, +8 Raro, +20 Épico, +50 Legendario). Puedes usar este polvo para fabricar cualquier cosmético bloqueado que elijas.
          </p>
        </div>

        <!-- Catálogo de Cosméticos de Temporada 1 -->
        <div style="background:#130f24;border:1px solid #2d1d44;border-radius:10px;padding:18px 20px;">
          <h2 style="color:#e879f9;font-size:16px;font-weight:800;margin:0 0 4px 0;">🎨 Catálogo de Skins Temporada 1 (Rotación Mensual)</h2>
          <p style="font-size:12.5px;color:#94a3b8;margin:0 0 14px 0;">
            Cada mes aproximadamente se cambiará la temática de la mazmorra y su catálogo de recompensas. ¡Consíguelas en la Bóveda (botón 🎁) antes de que termine el mes!
          </p>

          <!-- Tarjetas Visuales -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:12px;">
            <!-- Skin Legendaria -->
            <div style="grid-column: 1 / -1; background:#0c0919;border:2px solid #38bdf8;border-radius:8px;padding:14px;box-shadow:0 0 20px rgba(56,189,248,0.25);">
              <div style="font-size:10px;font-weight:900;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;">⭐ SKIN LEGENDARIA EXCLUSIVA (1ER MES)</div>
              <div style="font-size:16px;font-weight:900;color:#fff;margin:4px 0;">★ Marco de Avatar: FUNDADOR ★</div>
              <div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">Marco animado azul neón con placa de primera edición "FUNDADOR", visible en llamadas, chat y perfil.</div>
              <div style="display:inline-block;padding:2px 8px;border-radius:4px;background:#0284c7;color:#fff;font-size:11px;font-weight:800;">Obtenible en Cofre de Obsidiana</div>
            </div>

            <!-- 3 Colores Comunes -->
            <div style="background:#0c0919;border:2px solid #10b981;border-radius:8px;padding:12px;">
              <div style="font-size:9px;font-weight:800;color:#10b981;text-transform:uppercase;">COMÚN • COLOR DE PERFIL</div>
              <div style="font-size:13px;font-weight:800;color:#fff;margin:4px 0;">Verde Esmeralda del Núcleo</div>
              <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">Tinte resplandeciente esmeralda para tu nombre y cabecera de perfil.</div>
              <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span><span style="color:#10b981;font-weight:800;font-size:11px;">#10b981</span></div>
            </div>

            <div style="background:#0c0919;border:2px solid #a855f7;border-radius:8px;padding:12px;">
              <div style="font-size:9px;font-weight:800;color:#a855f7;text-transform:uppercase;">COMÚN • COLOR DE PERFIL</div>
              <div style="font-size:13px;font-weight:800;color:#fff;margin:4px 0;">Púrpura Amatista Místico</div>
              <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">Resplandor amatista para tu nombre en la lista de miembros y perfil.</div>
              <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;border-radius:50%;background:#a855f7;box-shadow:0 0 8px #a855f7;"></span><span style="color:#a855f7;font-weight:800;font-size:11px;">#a855f7</span></div>
            </div>

            <div style="background:#0c0919;border:2px solid #f59e0b;border-radius:8px;padding:12px;">
              <div style="font-size:9px;font-weight:800;color:#f59e0b;text-transform:uppercase;">COMÚN • COLOR DE PERFIL</div>
              <div style="font-size:13px;font-weight:800;color:#fff;margin:4px 0;">Ámbar Volcánico Radiante</div>
              <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">Tinte ámbar ígneo de magma ardiente para tu nombre en la app.</div>
              <div style="display:flex;align-items:center;gap:6px;"><span style="width:14px;height:14px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;"></span><span style="color:#f59e0b;font-weight:800;font-size:11px;">#f59e0b</span></div>
            </div>

            <!-- 4 Banners de Perfil -->
            <div style="background:#0c0919;border:2px solid #8847ff;border-radius:8px;padding:12px;">
              <div style="font-size:9px;font-weight:800;color:#8847ff;text-transform:uppercase;">ESPECIAL • BANNER</div>
              <div style="font-size:13px;font-weight:800;color:#fff;margin:4px 0;">Estandarte: Minas de Magma</div>
              <div style="height:26px;border-radius:4px;background:linear-gradient(135deg, #451a03, #b45309, #78350f);margin:8px 0;border:1px solid rgba(255,255,255,0.2);"></div>
              <div style="font-size:11px;color:#94a3b8;">Fondo volcánico para la cabecera de tu tarjeta de perfil.</div>
            </div>

            <div style="background:#0c0919;border:2px solid #8847ff;border-radius:8px;padding:12px;">
              <div style="font-size:9px;font-weight:800;color:#8847ff;text-transform:uppercase;">ESPECIAL • BANNER</div>
              <div style="font-size:13px;font-weight:800;color:#fff;margin:4px 0;">Estandarte: Galerías Amatista</div>
              <div style="height:26px;border-radius:4px;background:linear-gradient(135deg, #2e1065, #7e22ce, #3b0764);margin:8px 0;border:1px solid rgba(255,255,255,0.2);"></div>
              <div style="font-size:11px;color:#94a3b8;">Fondo de geodas de cristal para tu perfil.</div>
            </div>

            <div style="background:#0c0919;border:2px solid #d32ce6;border-radius:8px;padding:12px;">
              <div style="font-size:9px;font-weight:800;color:#d32ce6;text-transform:uppercase;">RARO • BANNER</div>
              <div style="font-size:13px;font-weight:800;color:#fff;margin:4px 0;">Estandarte: Puentes de Lava</div>
              <div style="height:26px;border-radius:4px;background:linear-gradient(135deg, #1c1917, #ea580c, #7f1d1d);margin:8px 0;border:1px solid rgba(255,255,255,0.2);"></div>
              <div style="font-size:11px;color:#94a3b8;">Pasos de piedra sobre abismos volcánicos.</div>
            </div>

            <div style="background:#0c0919;border:2px solid #ef4444;border-radius:8px;padding:12px;">
              <div style="font-size:9px;font-weight:800;color:#ef4444;text-transform:uppercase;">MÍTICO • BANNER</div>
              <div style="font-size:13px;font-weight:800;color:#fff;margin:4px 0;">Estandarte: Sagrario del Coloso</div>
              <div style="height:26px;border-radius:4px;background:linear-gradient(135deg, #09090b, #581c87, #dc2626);margin:8px 0;border:1px solid rgba(255,255,255,0.2);"></div>
              <div style="font-size:11px;color:#94a3b8;">Cámara sagrada del Gólem de Obsidiana.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return container;
}

function modalMinigame() {
  const m = $('modal');
  if (!m) return;
  m.classList.remove('hidden');
  m.replaceChildren();

  const wrap = h('div');
  m.appendChild(wrap);

  if (window.CyberDefenseGame) {
    new window.CyberDefenseGame(wrap, S.ws, S.chan || S.callKey || 'global', S.me, {
      inviteAll: () => {
        window.epicBroadcastGameInvite?.(S.chan || S.callKey || 'global');
      }
    });
    const chk = setInterval(() => {
      if (!wrap.children.length) {
        clearInterval(chk);
        m.classList.add('hidden');
        m.replaceChildren();
      }
    }, 200);
  }
}

window.epicBroadcastGameInvite = (roomKey) => {
  const myName = S.me?.name || 'Un amigo';
  const inviteMsg = `🎮 ¡${myName} te ha invitado a jugar a EpicStrike 2D! Haz clic para unirte: epickast://game/join`;
  if (S.chan) {
    rpc('msg.send', { channel: S.chan, text: inviteMsg }).catch(() => {});
  }
  toast('📢 Invitación enviada al chat de la sala');
};


const S = {
  ws: null, seq: 0, pend: new Map(), me: null, token: localStorage.getItem('epickast.token') || '', ice: [],
  friends: { friends: [], incoming: [], outgoing: [] }, servers: [], sdata: new Map(),
  view: { kind: 'home', sid: null }, chan: null, chanType: null, chanName: '',
  rooms: new Map(), partyTracks: new Map(), unread: new Set(), call: null, callKey: null, callLabel: '',
  oldest: null, loadingOld: false, statTimer: null, pingTimer: null, gameTimer: null,
  incoming: null, outgoing: null, cleanup: [],
  mini: false, appVer: '1.8.3', srvRelease: null, typingTimer: null, lastTypingSent: 0,
  replyTo: null, editingMsg: null, vrec: null, focusTile: null, dockOpen: false,
  party: null, partyModalUpdater: null, detectedGame: null, lastSentActivity: '',
  gameMode: false, overlayActive: false, meSpeaking: false, pttPressed: false,
  stageCollapsed: false,
};

window.epic.version?.().then((v) => { if (v) { S.appVer = v; renderRail(); } }).catch(() => {});
window.epic.onMiniChanged?.((val) => {
  S.mini = !!val;
  document.body.classList.toggle('mini-mode', S.mini);
  updateDock();
});
window.epic.onOverlayStatus?.((val) => {
  S.overlayActive = !!val;
  updateDock();
});
window.epic.onShortcut?.((act) => {
  if (act === 'overlay') {
    toggleOverlay();
    return;
  }
  if (act === 'pip') {
    window.epic.toggleMini?.();
    return;
  }
  if (!S.call) return;
  if (act === 'mute') {
    $('bMute')?.click();
    ringer.beep(S.call.muted ? [420, 310] : [520, 680], 0.06, 0.09);
  } else if (act === 'deaf') {
    $('bDeaf')?.click();
    ringer.beep(S.call.deaf ? [360, 260] : [540, 720], 0.06, 0.09);
  } else if (act === 'screen') {
    $('bScreen')?.click();
  } else if (act === 'hang') {
    $('bLeave')?.click();
  }
});

if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'default') {
  Notification.requestPermission?.().catch(() => {});
}

$('bTogglePass')?.addEventListener('click', (e) => {
  e.preventDefault();
  const input = $('lgPass');
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const eye = $('eyeIco');
  if (eye) {
    eye.innerHTML = isPass
      ? '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>'
      : '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
  }
});

// ---------- avatares ----------
const PALETTE = ['#7c5cff', '#ff5d8f', '#ff9f43', '#2ed573', '#1e90ff', '#e056fd', '#00d2d3', '#ffa502', '#f59e0b', '#10b981', '#a855f7'];
function nameColorStyle(col) {
  if (!col) return '';
  if (col.startsWith('linear-gradient') || col.startsWith('radial-gradient')) {
    return `background:${col};-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;font-weight:800;`;
  }
  return `color:${col};font-weight:700;`;
}

const colorFor = (u) => u?.color || PALETTE[(u?.id || 0) % PALETTE.length];
const avCache = new Map(); const avWait = new Set();
function avatar(u, size = 32, online) {
  const isMe = u && S.me && (u.id === S.me.id);
  const myFrame = isMe ? localStorage.getItem('epickast.equipped_frame') : u?.frame;
  let frameClass = '';
  if (myFrame === 'founder_blue') frameClass = ' frame-founder';
  else if (myFrame && myFrame.startsWith('frame-')) frameClass = ' ' + myFrame;
  const el = h('div', { class: 'avatar' + frameClass, style: `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.45)}px;background-color:${colorFor(u)}`, 'data-uid': u?.id ?? 0, 'data-av': u?.av || 0 }, (u?.name || '?')[0].toUpperCase());
  if (online !== undefined) el.append(h('span', { class: 'st' + (online ? ' on' : '') }));
  paintAvatar(el); return el;
}
function paintAvatar(el) {
  const id = el.dataset.uid, av = Number(el.dataset.av); if (!av) return;
  const k = `${id}:${av}`, url = avCache.get(k);
  if (url) { el.style.backgroundImage = `url(${url})`; el.classList.add('img'); return; }
  if (avWait.has(k) || !S.ws) return; avWait.add(k);
  rpc('profile.avatar', { id: Number(id) }).then((r) => {
    if (!r.avatar) return;
    if (avCache.size > 300) avCache.delete(avCache.keys().next().value);
    avCache.set(k, r.avatar);
    document.querySelectorAll(`.avatar[data-uid="${id}"]`).forEach((n) => { if (Number(n.dataset.av) === av) paintAvatar(n); });
  }).catch(() => {}).finally(() => avWait.delete(k));
}

// ---------- sonidos de llamada y sala ----------
const ringer = {
  ctx: null, timer: null,
  beep(freqs, dur = 0.09, gain = 0.12) {
    if (settings.dnd) return;
    try {
      const c = (this.ctx = this.ctx || new AudioContext()); const now = c.currentTime;
      freqs.forEach((f, idx) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t0 = now + idx * (dur + 0.02);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
        g.gain.linearRampToValueAtTime(0, t0 + dur);
        o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.01);
      });
    } catch {}
  },
  playJoin() {
    // Acorde ascendente suave de bienvenida al unirse a la sala
    this.beep([440, 554, 659, 880], 0.05, 0.14);
  },
  playLeave() {
    // Tono descendente sutil al salir alguien de la sala
    this.beep([784, 587, 392], 0.065, 0.11);
  },
  playStreamStart() {
    // Campana brillante moderna al iniciar transmisión de pantalla
    this.beep([587, 880, 1175], 0.07, 0.13);
  },
  playStreamStop() {
    // Tono suave al finalizar transmisión de pantalla
    this.beep([880, 587], 0.07, 0.09);
  },
  start(kind) {
    this.stop(); if (kind === 'in' && settings.dnd) return;
    const play = () => {
      try {
        const c = (this.ctx = this.ctx || new AudioContext()); const now = c.currentTime;
        const vol = Math.max(0, Math.min(1, settings.ringVol)) * (kind === 'in' ? 0.35 : 0.16);
        const tone = (f, t, d) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, now + t); g.gain.linearRampToValueAtTime(vol, now + t + 0.02); g.gain.setValueAtTime(vol, now + t + d - 0.04); g.gain.linearRampToValueAtTime(0, now + t + d); o.connect(g).connect(c.destination); o.start(now + t); o.stop(now + t + d + 0.02); };
        if (kind === 'in') { tone(660, 0, 0.18); tone(880, 0.22, 0.18); tone(660, 0.62, 0.18); tone(880, 0.84, 0.18); } else { tone(440, 0, 0.45); tone(480, 0, 0.45); }
      } catch {}
    };
    play(); this.timer = setInterval(play, kind === 'in' ? 2200 : 3200);
  },
  stop() { clearInterval(this.timer); this.timer = null; },
};

// ---------- red ----------
function toast(msg) {
  const t = h('div', { class: 'toast-msg' }, msg);
  $('toast').append(t);
  setTimeout(() => {
    t.classList.add('toast-exit');
    setTimeout(() => t.remove(), 200);
  }, 1600);
}
function connect(url) {
  return new Promise((res, rej) => {
    let ws; try { ws = new WebSocket(url); } catch { return rej(new Error('URL de servidor inválida')); }
    let opened = false;
    ws.onopen = () => { opened = true; S.ws = ws; res(ws); };
    ws.onerror = () => { if (!opened) rej(new Error('No se pudo conectar al servidor')); };
    ws.onmessage = onMsg;
    ws.onclose = () => { if (S.ws === ws) { S.ws = null; if (S.me) scheduleReconnect(); } };
  });
}
window.epicRpc = rpc;
function rpc(t, d = {}) {
  return new Promise((res, rej) => {
    if (!S.ws || S.ws.readyState !== 1) return rej(new Error('Sin conexión'));
    const i = ++S.seq; S.pend.set(i, { res, rej });
    S.ws.send(JSON.stringify({ ...d, t, i }));
    setTimeout(() => { if (S.pend.delete(i)) rej(new Error('Tiempo agotado')); }, 15000);
  });
}
const sendRaw = (t, d) => { if (S.ws?.readyState === 1) S.ws.send(JSON.stringify({ ...d, t })); };
const safe = (p) => p.catch((e) => { toast(e.message); throw e; });

let retry = 0;
function scheduleReconnect() {
  leaveCall(true); clearIncoming(); toast('Conexión perdida, reintentando…');
  const go = async () => {
    try {
      await connect(settings.server);
      const r = await rpc('resume', { token: S.token });
      S.me = r.user; S.ice = r.ice; retry = 0; toast('Reconectado'); await bootstrap();
    } catch (e) { retry = Math.min(retry + 1, 6); setTimeout(go, 1000 * 2 ** retry); }
  };
  setTimeout(go, 1500);
}

function onMsg(ev) {
  let m; try { m = JSON.parse(ev.data); } catch { return; }
  if (m.r) { const p = S.pend.get(m.r); if (p) { S.pend.delete(m.r); m.ok ? p.res(m.data) : p.rej(new Error(m.error)); } return; }
  switch (m.t) {
    case 'presence': {
      if (S.me && m.id === S.me.id) { S.me.activity = m.activity || null; renderMe(); }
      for (const f of S.friends.friends) if (f.id === m.id) { f.online = m.online; if (m.activity !== undefined) f.activity = m.activity; }
      for (const sd of S.sdata.values()) for (const mem of sd.members) if (mem.id === m.id) { mem.online = m.online; if (m.activity !== undefined) mem.activity = m.activity; }
      renderSide(); renderMembers(); renderHome(); break;
    }
    case 'friends.changed': loadFriends(); break;
    case 'servers.changed': loadServers(); break;
    case 'server.changed': if (S.sdata.has(m.id) || S.view.sid === m.id) refreshServer(m.id); break;
    case 'msg': onChatMsg(m); break;
    case 'msg.pinned': onMsgPinned(m); break;
    case 'msg.edited': {
      if (m.channel === S.chan) {
        const el = document.querySelector(`[data-mid="${m.id}"]`);
        if (el) {
          if (el._msg) el._msg.text = m.text;
          const tx = el.querySelector('.tx');
          if (tx) {
            tx.replaceWith(renderMsgText(m.text));
          }
          const mb = el.querySelector('.mb');
          if (mb && !mb.querySelector('.edit-tag')) {
            const head = mb.querySelector('.mhead');
            if (head) head.append(h('span', { class: 'pin-tag edit-tag', style: 'color:#8ba3c7;font-size:10px;font-style:italic' }, '(editado)'));
          }
        }
      }
      break;
    }
    case 'msg.deleted': {
      if (S.editingMsg && S.editingMsg.id === m.id) cancelEditMsg();
      if (m.channel === S.chan) {
        const el = document.querySelector(`[data-mid="${m.id}"]`);
        if (el) el.remove();
      }
      break;
    }
    case 'server.banned': {
      toast(`🚫 Fuiste expulsado y baneado del servidor: ${m.reason || 'Por decisión de moderación'}`);
      if (S.view.sid === m.serverId) goHome();
      break;
    }
    case 'voice.serverMuted': {
      if (S.call) {
        if (m.muted) {
          if (!S.call.muted) {
            S.call.setMute(true);
            updateDock();
            pushState();
          }
          toast('🔇 Fuiste silenciado por un moderador');
        } else {
          toast('🔊 Un moderador reactivó tu micrófono');
        }
      }
      break;
    }
    case 'voice.forceMove': {
      if (S.call && m.toKey) {
        toast(`📢 Un moderador te movió a "${m.channelName || 'otro canal'}"`);
        joinCall(m.toKey, m.channelName);
      }
      break;
    }
    case 'typing': onTyping(m); break;
    case 'voice.room':
      S.rooms.set(m.key, m.users);
      if (!m.users.length) { S.rooms.delete(m.key); S.partyTracks.delete(m.key); }
      else if (m.partyTrack !== undefined) {
        if (m.partyTrack) S.partyTracks.set(m.key, m.partyTrack);
        else S.partyTracks.delete(m.key);
      }
      renderSide();
      break;
    case 'party.sync':
      if (m.party?.current?.title) S.partyTracks.set(m.key, m.party.current.title);
      else S.partyTracks.delete(m.key);
      if (m.key === S.callKey) {
        S.party = m.party;
        renderStage();
        syncPartyTile();
        S.partyModalUpdater?.();
      }
      renderSide();
      break;
    case 'voice.joined':
      S.call?.addPeer(m.user);
      ringer.playJoin();
      toast(`👋 ${m.user?.name || 'Alguien'} se unió a la llamada`);
      break;
    case 'voice.left': {
      const peer = S.call?.peers.get(m.userId);
      const pName = peer?.name || 'Alguien';
      S.call?.removePeer(m.userId);
      ringer.playLeave();
      toast(`🚪 ${pName} salió de la llamada`);
      break;
    }
    case 'voice.peerstate': {
      const p = S.call?.peers.get(m.userId);
      if (p) {
        const oldScreen = !!p.state?.screen;
        const oldCam = !!p.state?.cam;
        p.state = m.state;
        const newScreen = !!m.state?.screen;
        const newCam = !!m.state?.cam;
        if (!oldScreen && newScreen) {
          ringer.playStreamStart();
          toast(`🖥️ ${p.name} comenzó a transmitir pantalla`);
        } else if (oldScreen && !newScreen) {
          ringer.playStreamStop();
        } else if (!oldCam && newCam) {
          ringer.beep([523, 784], 0.06, 0.1);
        }
        renderStage();
      }
      break;
    }
    case 'voice.sound':
      if (m.from !== S.me?.id) {
        playSoundEffect(m.sound);
        toast(`🔊 ${m.name || 'Alguien'} reprodujo: ${SOUND_NAMES[m.sound] || m.sound}`);
      }
      break;
    case 'voice.kicked': leaveCall(true); toast('Te uniste desde otro dispositivo'); break;
    case 'rtc.signal': S.call?.handleSignal(m.from, m.data); break;
    case 'call.incoming': showIncoming(m); break;
    case 'call.stop': onCallStop(m); break;
    case 'profile.changed': onProfile(m.profile); break;
  }
}

function onTyping(m) {
  if (m.channel !== S.chan) return;
  const bar = $('typingBar');
  bar.textContent = `✍️ ${m.name} está escribiendo…`;
  bar.classList.remove('hidden');
  clearTimeout(S.typingTimer);
  S.typingTimer = setTimeout(() => bar.classList.add('hidden'), 3200);
}

function onProfile(p) {
  if (p.id === S.me?.id) Object.assign(S.me, p);
  for (const f of [...S.friends.friends, ...S.friends.incoming, ...S.friends.outgoing]) {
    if (f.id === p.id) Object.assign(f, p);
  }
  for (const sd of S.sdata.values()) {
    for (const mem of sd.members) {
      if (mem.id === p.id) Object.assign(mem, p);
    }
  }
  render(); renderCallOverlay();
}

// ---------- login, sesión persistente ("Permanecer conectado") y actualizaciones ----------
function normUrl(u) {
  u = (u || '').trim().replace(/\/+$/, '');
  if (!u) return DEFAULTS.server;
  if (/^https:\/\//i.test(u)) u = 'wss://' + u.slice(8);
  else if (/^http:\/\//i.test(u)) u = 'ws://' + u.slice(7);
  else if (!/^wss?:\/\//i.test(u)) {
    const isLocal = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u);
    u = (isLocal ? 'ws://' : 'wss://') + u;
  }
  const hostPart = u.replace(/^wss?:\/\//i, '');
  if (u.startsWith('ws://') && !/:\d+$/.test(hostPart) && /^(localhost|127\.|192\.168\.|10\.|172\.)/i.test(hostPart)) u += ':7777';
  return u;
}
function httpBase() { return settings.server.replace(/^ws/i, 'http').replace(/\/+$/, ''); }
$('lgServer').value = settings.server;
$('lgUser').value = localStorage.getItem('epickast.user') || '';
if ($('lgRemember')) $('lgRemember').checked = localStorage.getItem('epickast.remember') !== '0';

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault(); $('lgError').textContent = '';
  const mode = e.submitter?.dataset.mode || 'login';
  const remember = $('lgRemember') ? $('lgRemember').checked : true;
  const userVal = $('lgUser').value.trim();
  const passVal = $('lgPass').value;
  settings.server = normUrl($('lgServer').value); saveSettings();
  try {
    if (S.ws) { S.ws.onclose = null; S.ws.close(); S.ws = null; }
    await connect(settings.server);
    const r = await rpc(mode, { name: userVal, password: passVal });
    S.me = r.user; S.token = r.token; S.ice = r.ice;
    localStorage.setItem('epickast.user', r.user.name);
    localStorage.setItem('epickast.remember', remember ? '1' : '0');
    if (remember) {
      localStorage.setItem('epickast.token', r.token);
      window.epic.saveAuth?.({ server: settings.server, user: r.user.name, pass: passVal, token: r.token, remember: true });
    } else {
      localStorage.removeItem('epickast.token');
      window.epic.saveAuth?.(null);
    }
    $('lgPass').value = ''; await bootstrap();
  } catch (err) { $('lgError').textContent = err.message; }
});

async function autoLogin() {
  const appCfg = await window.epic.getConfig?.().catch(() => null);
  if (appCfg && typeof appCfg.disableGpu === 'boolean') {
    settings.disableGpu = appCfg.disableGpu;
  }
  const saved = await window.epic.loadAuth?.().catch(() => null);
  const remember = localStorage.getItem('epickast.remember') !== '0' && (saved?.remember !== false);
  if (saved?.server && !/^ws:\/\/(127\.0\.0\.1|localhost)/i.test(saved.server) && !localStorage.getItem('epickast.settings')) {
    settings.server = normUrl(saved.server);
    $('lgServer').value = settings.server;
  }
  if (saved?.user && !$('lgUser').value) $('lgUser').value = saved.user;
  if (remember && saved?.pass) $('lgPass').value = saved.pass;
  const tok = S.token || (remember ? saved?.token : '') || '';
  if (!remember || (!tok && !saved?.pass)) return;

  const statusEl = $('lgError');
  if (statusEl) { statusEl.style.color = 'var(--ok)'; statusEl.textContent = `Reconectando sesión de ${$('lgUser').value || 'tu cuenta'}…`; }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await connect(settings.server);
      let r;
      if (tok) {
        try { r = await rpc('resume', { token: tok }); }
        catch (e) {
          if (saved?.user && saved?.pass) r = await rpc('login', { name: saved.user, password: saved.pass });
          else throw e;
        }
      } else {
        r = await rpc('login', { name: saved.user, password: saved.pass });
      }
      S.me = r.user; S.token = r.token || tok; S.ice = r.ice;
      localStorage.setItem('epickast.token', S.token);
      localStorage.setItem('epickast.user', r.user.name);
      if (saved?.pass) window.epic.saveAuth?.({ server: settings.server, user: r.user.name, pass: saved.pass, token: S.token, remember: true });
      if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; }
      await bootstrap();
      return;
    } catch {
      if (S.ws) { S.ws.onclose = null; S.ws.close(); S.ws = null; }
      await new Promise((res) => setTimeout(res, 750));
    }
  }
  if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; }
}
async function bootstrap() {
  $('login').classList.add('hidden'); $('main').classList.remove('hidden');
  S.lastSentActivity = '';
  await Promise.all([loadFriends(), loadServers(), checkServerUpdate()]);
  if (S.view.kind === 'server') await refreshServer(S.view.sid);
  render();
  startGameDetection();
}
async function syncActivity() {
  if (!S.ws || S.ws.readyState !== 1 || !S.me) return;
  let actName = (settings.customActivity || '').trim();
  if (!actName && settings.autoGameDetect) {
    const det = await window.epic.detectGame?.().catch(() => null);
    S.detectedGame = det?.name || null;
    actName = S.detectedGame || '';
  } else if (!settings.autoGameDetect) {
    S.detectedGame = null;
  }
  if (actName === S.lastSentActivity) return;
  S.lastSentActivity = actName;
  rpc('activity.set', { name: actName, kind: 'game' }).catch(() => {});
}
function startGameDetection() {
  clearInterval(S.gameTimer);
  setTimeout(syncActivity, 800);
  S.gameTimer = setInterval(syncActivity, 18000);
}
function isNewerVersion(latest, current) {
  if (!latest || !current) return false;
  const pLatest = String(latest).replace(/^[^\d]*/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const pCurrent = String(current).replace(/^[^\d]*/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pLatest.length, pCurrent.length);
  for (let i = 0; i < len; i++) {
    const l = pLatest[i] || 0;
    const c = pCurrent[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

async function checkServerUpdate() {
  try {
    if (window.epic?.version) {
      const v = await window.epic.version().catch(() => null);
      if (v) S.appVer = v;
    }
    const info = await rpc('app.version');
    S.srvRelease = info;
    const bar = $('updateBar');
    if (!info?.version || !isNewerVersion(info.version, S.appVer)) {
      bar?.classList.add('hidden');
      return;
    }

    const asarUrl = httpBase() + (info.asarDownloadPath || '/download/asar');
    const zipUrl = httpBase() + (info.downloadPath || '/download/latest');

    // Mostrar aviso SIN descargar automáticamente (solo con confirmación del usuario)
    bar.classList.remove('hidden');
    const label = h('span', null, `✨ Nueva versión v${info.version} disponible`);
    const actionArea = h('div', { style: 'display:inline-flex;gap:8px;align-items:center' });
    const closeBtn = h('button', {
      style: 'background:transparent;border:0;color:#fff;opacity:0.75;font-size:14px;padding:2px 6px;cursor:pointer',
      title: 'Cerrar aviso',
      onclick: () => bar.classList.add('hidden')
    }, '✕');

    bar.replaceChildren(label, actionArea, closeBtn);

    let isUpdating = false;

    // Acción al hacer clic en instalar actualización
    const startUpdateFlow = async (btn) => {
      if (isUpdating) return;
      isUpdating = true;
      if (btn) btn.disabled = true;
      label.textContent = `⚡ Descargando actualización v${info.version}...`;
      actionArea.replaceChildren(h('span', { style: 'font-size:11px;color:#a78bfa;font-weight:600' }, '⏳ Descargando paquete...'));

      window.epic?.onUpdateProgress?.((prog) => {
        if (prog?.percent !== undefined) {
          label.textContent = `⚡ Descargando actualización v${info.version} (${prog.percent}%)...`;
        }
      });

      let res = null;
      if (window.epic?.downloadAsarUpdate) {
        res = await window.epic.downloadAsarUpdate(asarUrl);
      }

      if (res?.ok) {
        label.textContent = `🚀 Aplicando actualización v${info.version} y reiniciando...`;
        actionArea.replaceChildren(h('span', { style: 'font-size:11px;color:#10b981;font-weight:700' }, '✓ Reiniciando en 1s...'));
        toast(`Actualización v${info.version} descargada. Reiniciando EpicKast...`);
        setTimeout(async () => {
          if (window.epic?.applyAsarUpdate) {
            await window.epic.applyAsarUpdate();
          }
        }, 1200);
      } else {
        isUpdating = false;
        if (res?.error) toast('Error al descargar: ' + res.error);
        label.textContent = `✨ Actualización v${info.version} disponible`;
        const retryBtn = h('button', {
          class: 'primary',
          style: 'padding:4px 10px;font-size:11px;background:#7c5cff',
          onclick: (e) => startUpdateFlow(e.currentTarget)
        }, '⚡ Reintentar');
        const manualBtn = h('button', {
          style: 'padding:4px 10px;font-size:11px',
          onclick: () => window.epic?.openExternal?.(zipUrl)
        }, '⬇ ZIP manual');
        actionArea.replaceChildren(retryBtn, manualBtn);
      }
    };

    const updateBtn = h('button', {
      class: 'primary',
      style: 'padding:4px 12px;font-size:11px;font-weight:700;background:#7c5cff;border-color:#906eff;cursor:pointer',
      onclick: (e) => startUpdateFlow(e.currentTarget)
    }, '📥 Instalar actualización');

    const manualBtn = h('button', {
      style: 'padding:4px 10px;font-size:11px',
      onclick: () => window.epic?.openExternal?.(zipUrl)
    }, '⬇ ZIP manual');

    actionArea.replaceChildren(updateBtn, manualBtn);
  } catch {}
}

// ---------- datos ----------
setInterval(() => { if (S.ws && S.me) checkServerUpdate(); }, 5 * 60 * 1000);
window.addEventListener('focus', () => { if (S.ws && S.me) checkServerUpdate(); });
async function loadFriends() { try { S.friends = await rpc('friends.list'); } catch {} renderSide(); renderHome(); renderCallOverlay(); }
async function loadServers() {
  try { S.servers = await rpc('servers.list'); } catch { return; }
  if (S.view.kind === 'server' && !S.servers.some((s) => s.id === S.view.sid)) goHome();
  renderRail(); renderSide();
}
async function refreshServer(id) {
  try { S.sdata.set(id, await rpc('server.get', { id })); } catch { S.sdata.delete(id); if (S.view.sid === id) goHome(); return; }
  for (const c of S.sdata.get(id).channels) {
    if (c.room) { if (c.room.length) S.rooms.set(c.key, c.room); else S.rooms.delete(c.key); }
    if (c.partyTrack) S.partyTracks.set(c.key, c.partyTrack); else S.partyTracks.delete(c.key);
  }
  if (S.view.sid === id) { renderSide(); renderMembers(); }
}

// ---------- navegación ----------
function goHome() { S.view = { kind: 'home', sid: null }; S.chan = null; render(); }
async function openServer(id) {
  S.view = { kind: 'server', sid: id };
  if (!S.sdata.has(id)) await refreshServer(id);
  const sd = S.sdata.get(id); const first = sd?.channels.find((c) => c.type === 'text');
  S.chan = null; render();
  if (first) openChannel(first.key, 'text', first.name);
}
async function openChannel(key, type, name) {
  S.chan = key; S.chanType = type; S.chanName = name; S.unread.delete(key); S.oldest = null;
  clearReply();
  cancelEditMsg();
  $('typingBar').classList.add('hidden');
  render(); $('msgs').replaceChildren();
  if (type === 'voice') return;
  if ((type === 'text' || type === 'dm') && S.call && !S.stageCollapsed) toggleStageCollapse(true, true);
  try { const hist = await rpc('msg.history', { channel: key }); if (S.chan !== key) return; hist.forEach((m) => addMsg(m, false)); S.oldest = hist[0]?.id ?? null; $('msgs').scrollTop = 1e9; } catch (e) { toast(e.message); }
  $('msgInput').focus();
}
$('msgs').addEventListener('scroll', async () => {
  const box = $('msgs');
  if (box.scrollTop > 40 || !S.oldest || S.loadingOld || !S.chan) return;
  S.loadingOld = true;
  try {
    const hist = await rpc('msg.history', { channel: S.chan, before: S.oldest });
    if (hist.length) { const prev = box.scrollHeight; const frag = document.createDocumentFragment(); hist.forEach((m) => frag.append(msgEl(m))); box.prepend(frag); box.scrollTop = box.scrollHeight - prev; S.oldest = hist[0].id; } else S.oldest = null;
  } catch {} S.loadingOld = false;
});

// ---------- mensajes, notas de voz, respuestas y archivos ----------
const fmtTime = (ts) => new Date(ts).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
const fmtSize = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);
const isImgMime = (mime, name = '') => /^image\/(png|jpeg|webp|gif|bmp)$/i.test(mime || '') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(name);
const isAudioMime = (mime, name = '') => /^audio\//i.test(mime || '') || /\.(webm|ogg|mp3|wav|m4a)$/i.test(name);
const fileUrl = (id, dl = false) => `${httpBase()}/files/${id}${dl ? '?dl=1' : ''}`;

function setReply(m) {
  S.replyTo = { id: m.id, name: m.name, text: m.text || (m.fileName ? `📎 ${m.fileName}` : 'Archivo adjunto') };
  const bar = $('replyBar');
  bar.replaceChildren(
    h('span', { style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, '↩ Respondiendo a ', h('b', null, S.replyTo.name), ': ', S.replyTo.text.slice(0, 70)),
    h('button', { type: 'button', onclick: clearReply, title: 'Cancelar respuesta' }, '✕')
  );
  bar.classList.remove('hidden');
  $('msgInput').focus();
}
function clearReply() {
  S.replyTo = null;
  const bar = $('replyBar');
  if (bar && !S.editingMsg) { bar.classList.add('hidden'); bar.replaceChildren(); }
}

function startEditMsg(m) {
  clearReply();
  S.editingMsg = m;
  const bar = $('replyBar');
  bar.replaceChildren(
    h('span', { style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' },
      '✏️ ', h('b', null, 'Editando mensaje: '), m.text.slice(0, 60), ' ',
      h('i', { style: 'font-size:11px;opacity:0.7;' }, '(Esc para cancelar, Enter para guardar)')
    ),
    h('button', { type: 'button', onclick: () => { cancelEditMsg(); $('msgInput').value = ''; }, title: 'Cancelar edición' }, '✕')
  );
  bar.classList.remove('hidden');
  $('msgInput').value = m.text;
  $('msgInput').focus();
  const len = $('msgInput').value.length;
  $('msgInput').setSelectionRange(len, len);
}

function cancelEditMsg() {
  S.editingMsg = null;
  const bar = $('replyBar');
  if (bar && !S.replyTo) { bar.classList.add('hidden'); bar.replaceChildren(); }
}

function jumpToMsg(id) {
  const el = document.querySelector(`[data-mid="${id}"]`);
  if (!el) return toast('El mensaje original es más antiguo (desplázate hacia arriba)');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('flash-msg');
  void el.offsetWidth;
  el.classList.add('flash-msg');
}

function openImageLightbox(url, name, dlUrl) {
  modal(name || 'Imagen',
    h('div', { style: 'display:grid;place-items:center;background:#090a0e;border-radius:12px;padding:8px;max-height:68vh;overflow:auto' },
      h('img', { src: url, style: 'max-width:100%;max-height:64vh;object-fit:contain;border-radius:8px' })
    ),
    h('div', { class: 'row' },
      h('button', { class: 'primary', onclick: () => window.epic.openExternal?.(dlUrl || url) }, '⬇ Descargar original')
    )
  );
}

function attachmentEl(m) {
  if (!m.fileId) return null;
  const url = fileUrl(m.fileId, false);
  const dl = fileUrl(m.fileId, true);
  if (isImgMime(m.fileMime, m.fileName)) {
    return h('img', {
      class: 'att-img',
      src: url,
      alt: m.fileName || 'imagen',
      loading: 'lazy',
      title: `${m.fileName || 'Imagen'} (${fmtSize(m.fileSize || 0)}) — Clic para ampliar`,
      onclick: () => openImageLightbox(url, m.fileName, dl),
    });
  }
  if (isAudioMime(m.fileMime, m.fileName)) {
    return h('div', { class: 'att-aud' },
      h('span', { style: 'font-size:18px' }, '🎙️'),
      h('audio', { controls: true, preload: 'metadata', src: url }),
      h('span', { class: 'fs' }, fmtSize(m.fileSize || 0))
    );
  }
  return h('div', { class: 'att-doc' },
    h('span', { style: 'font-size:22px' }, '📄'),
    h('div', { style: 'min-width:0' },
      h('div', { class: 'fn', title: m.fileName }, m.fileName || 'documento'),
      h('div', { class: 'fs' }, fmtSize(m.fileSize || 0))
    ),
    h('button', { class: 'primary', style: 'padding:5px 10px;font-size:12px', onclick: () => window.epic.openExternal?.(dl) }, '⬇ Descargar')
  );
}

function renderMsgText(text) {
  if (!text) return null;

  if (text.includes('epickast://game/join')) {
    const cleanMsg = text.replace(/epickast:\/\/game\/join/i, '').trim();
    return h('div', { class: 'tx' },
      cleanMsg ? h('div', { style: 'margin-bottom:6px' }, cleanMsg) : null,
      h('div', {
        style: 'background:linear-gradient(135deg,rgba(15,23,42,0.95),rgba(24,35,58,0.98));border:1px solid #10b981;border-radius:10px;padding:12px 14px;max-width:340px;margin-top:4px;box-shadow:0 4px 16px rgba(0,0,0,0.3)'
      },
        h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:8px' },
          h('span', { style: 'font-size:26px' }, '👾'),
          h('div', null,
            h('div', { style: 'font-size:11px;text-transform:uppercase;color:#34d399;font-weight:700' }, 'Partida Co-op en Vivo'),
            h('div', { style: 'font-size:13px;font-weight:600;color:#fff' }, 'EpicStrike 2D • Arena de Combate')
          )
        ),
        h('button', {
          class: 'primary',
          style: 'width:100%;padding:8px 12px;font-size:12px;font-weight:700;background:linear-gradient(90deg,#059669,#10b981);border:none;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px',
          onclick: () => modalMinigame()
        }, '⚔️ Unirme al Escuadrón')
      )
    );
  }

  const match = /epickast:\/\/join\/([a-fA-F0-9]+)/i.exec(text);
  if (!match) return h('div', { class: 'tx' }, text);

  const code = match[1].toLowerCase();
  const cleanMsg = text.replace(/epickast:\/\/join\/[a-fA-F0-9]+/i, '').trim();

  const joinBtn = h('button', {
    class: 'primary',
    style: 'padding:7px 14px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;border-radius:6px;margin-top:6px',
    onclick: async (e) => {
      const b = e.currentTarget;
      b.disabled = true;
      b.textContent = 'Uniéndose...';
      try {
        const res = await rpc('server.join', { code });
        toast('¡Te has unido al servidor correctamente!');
        b.textContent = '✓ Ya te uniste';
        b.style.background = '#2ea043';
        if (res?.id) {
          await loadServers();
          selectServer(res.id);
        }
      } catch (err) {
        toast(err.message || 'Error al unirse');
        b.disabled = false;
        b.textContent = '🚀 Unirme al servidor';
      }
    }
  }, '🚀 Unirme al servidor');

  return h('div', { class: 'tx' },
    cleanMsg ? h('div', { style: 'margin-bottom:6px' }, cleanMsg) : null,
    h('div', {
      style: 'background:rgba(20,24,35,0.7);border:1px solid rgba(130,160,255,0.3);border-radius:10px;padding:12px 14px;max-width:340px;margin-top:4px'
    },
      h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:6px' },
        h('span', { style: 'font-size:24px' }, '🏰'),
        h('div', null,
          h('div', { style: 'font-size:11px;text-transform:uppercase;color:#8ba3c7;font-weight:700' }, 'Invitación a Servidor'),
          h('div', { style: 'font-size:13px;font-weight:600;color:#fff' }, `Código: ${code}`)
        )
      ),
      joinBtn
    )
  );
}

const msgEl = (m) => {
  const isMentioned = (m.mentions && m.mentions.includes(S.me?.id)) || (m.text && m.text.includes('@' + S.me?.name)) || m.highlight;
  const el = h('div', { class: 'm' + (isMentioned ? ' mention-highlight' : ''), style: isMentioned ? 'background:rgba(245,158,11,0.08);border-left:3px solid #f59e0b;' : '', 'data-mid': m.id },
    avatar({ id: m.userId, name: m.name, color: m.color, av: m.av, frame: m.frame }, 36),
    h('div', { class: 'mb' },
      m.replyId ? h('div', { class: 'quote', onclick: () => jumpToMsg(m.replyId), title: 'Ir al mensaje original' },
        h('b', null, `↩ ${m.replyName || 'Mensaje'}:`),
        h('span', null, m.replyText || '📎 Archivo adjunto')
      ) : null,
      h('div', { class: 'mhead' },
        h('b', null, m.name),
        h('i', null, fmtTime(m.ts)),
        m.pinned ? h('span', { class: 'pin-tag' }, '📌 Fijado') : null
      ),
      m.text ? renderMsgText(m.text) : null,
      attachmentEl(m)
    ),
    h('div', { class: 'macts' },
      h('button', { title: 'Responder a este mensaje', onclick: () => setReply(m) }, '↩'),
      h('button', { title: 'Fijar / Desfijar mensaje', onclick: () => rpc('msg.pin', { id: m.id }).catch((e) => toast(e.message)) }, '📌'),
      (m.userId === S.me?.id && m.text) ?
        h('button', { class: 'edit-msg-btn', title: 'Editar mensaje', onclick: () => startEditMsg(m) }, '✏️') : null,
      (m.userId === S.me?.id || (S.server && (ROLES[S.server.myRole]?.rank ?? 0) >= 2)) ?
        h('button', {
          class: 'del-msg-btn',
          title: 'Eliminar mensaje (borrar texto o spam)',
          onclick: () => {
            if (confirm('¿Eliminar este mensaje permanentemente?')) {
              rpc('msg.delete', { id: m.id }).catch((e) => toast(e.message));
            }
          }
        }, '🗑️') : null
    )
  );
  el._msg = m;
  return el;
};

function onMsgPinned(m) {
  if (m.channel !== S.chan) return;
  const el = document.querySelector(`[data-mid="${m.id}"] .mhead`);
  if (!el) return;
  const existing = el.querySelector('.pin-tag');
  if (m.pinned && !existing) el.append(h('span', { class: 'pin-tag' }, '📌 Fijado'));
  else if (!m.pinned && existing) existing.remove();
}

function addMsg(m, stick = true) {
  const box = $('msgs'); const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.append(msgEl(m));
  while (box.childElementCount > 300) box.firstElementChild.remove();
  if (stick && near) box.scrollTop = 1e9;
}
function onChatMsg(m) {
  const isCurrentChannel = m.channel === S.chan;
  if (isCurrentChannel) {
    $('typingBar').classList.add('hidden');
    addMsg(m.msg);
  } else if (m.msg.userId !== S.me?.id) {
    S.unread.add(m.channel);
    renderSide();
    renderRail();
  }

  // Notificaciones de chat (solo para mensajes entrantes de otros usuarios)
  if (m.msg.userId !== S.me?.id) {
    const isDm = m.channel[0] === 'd';
    let srv = null;
    let chName = '';
    if (!isDm) {
      srv = [...S.sdata.values()].find((sd) => sd.channels?.some((c) => c.key === m.channel));
      const ch = srv?.channels?.find((c) => c.key === m.channel);
      chName = ch ? `# ${ch.name}` : 'Canal';
    }

    const isServerMuted = srv && (settings.mutedServers || []).includes(srv.id);
    const preview = m.msg.text || (m.msg.fileName ? `📎 ${m.msg.fileName}` : 'Nuevo mensaje');

    // Notificar si no está silenciado el servidor ni está en No Molestar
    if (!isServerMuted && !settings.dnd) {
      const windowUnfocused = !document.hasFocus();

      if (!isCurrentChannel || windowUnfocused) {
        if (settings.chatSound !== false) {
          ringer.beep([880, 1174], 0.04, 0.07);
        }

        window.epic?.flash?.();

        if (window.Notification && (Notification.permission === 'granted' || Notification.permission === 'default')) {
          try {
            const notifTitle = isDm ? `💬 ${m.msg.name}` : `💬 ${m.msg.name} en ${srv?.name || 'Servidor'} (${chName})`;
            const notif = new Notification(notifTitle, {
              body: preview.slice(0, 120),
              silent: true,
            });
            notif.onclick = () => {
              window.focus();
              if (isDm) {
                openChannel(m.channel, 'dm', m.msg.name);
              } else if (srv) {
                openServer(srv.id).then(() => {
                  const ch = srv.channels?.find((c) => c.key === m.channel);
                  if (ch) openChannel(ch.key, 'text', ch.name);
                });
              }
            };
          } catch {}
        }

        if (!isCurrentChannel) {
          const toastPrefix = isDm ? m.msg.name : `${m.msg.name} [${srv?.name || 'Servidor'}]:`;
          toast(`${toastPrefix} ${preview.slice(0, 50)}`);
        }
      }
    }
  }
}

async function uploadFiles(fileList) {
  if (!S.chan || S.chanType === 'voice') return toast('Abre un chat de texto o mensaje directo primero');
  const files = [...(fileList || [])];
  if (!files.length) return;
  const caption = $('msgInput').value.trim();
  const replyId = S.replyTo?.id || '';
  $('msgInput').value = '';
  clearReply();
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.size > 25 * 1024 * 1024) { toast(`"${f.name}" supera los 25 MB`); continue; }
    toast(`Subiendo "${f.name}" (${fmtSize(f.size)})…`);
    try {
      const qs = new URLSearchParams({
        channel: S.chan,
        name: f.name || 'archivo',
        mime: f.type || 'application/octet-stream',
        text: i === 0 ? caption : '',
        replyTo: i === 0 && replyId ? String(replyId) : '',
      });
      const res = await fetch(`${httpBase()}/upload?${qs}`, {
        method: 'POST',
        headers: { 'x-token': S.token },
        body: f,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al subir archivo');
    } catch (e) {
      toast(e.message || 'No se pudo subir el archivo');
    }
  }
}

// ---------- Notas de Voz rápidas (estilo Telegram) ----------
$('bVoiceNote').addEventListener('click', async () => {
  if (!S.chan || S.chanType === 'voice') return toast('Abre un chat de texto o mensaje directo primero');
  const btn = $('bVoiceNote');
  if (S.vrec) {
    S.vrec.stop();
    return;
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: settings.mic ? { ideal: settings.mic } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch {
    return toast('No se pudo abrir el micrófono para grabar la nota de voz');
  }
  const chunks = [];
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 64000 });
  const t0 = Date.now();
  const tick = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    btn.textContent = `⏹ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 250);
  btn.classList.add('rec');
  btn.textContent = '⏹ 0:00';
  rec.ondataavailable = (ev) => { if (ev.data?.size > 0) chunks.push(ev.data); };
  rec.onstop = () => {
    clearInterval(tick);
    stream.getTracks().forEach((t) => t.stop());
    btn.classList.remove('rec');
    btn.textContent = '🎙️';
    S.vrec = null;
    if (!chunks.length || Date.now() - t0 < 400) return;
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const file = new File([blob], `Nota-de-voz-${new Date().toTimeString().slice(0, 8).replace(/:/g, '-')}.webm`, { type: 'audio/webm' });
    uploadFiles([file]);
  };
  S.vrec = rec;
  rec.start();
});

$('bAttach').addEventListener('click', () => $('fileInput').click());
$('fileInput').addEventListener('change', (e) => { uploadFiles(e.target.files); e.target.value = ''; });
$('msgInput').addEventListener('input', () => {
  if (!S.chan || S.chanType === 'voice') return;
  const now = Date.now();
  if (now - S.lastTypingSent > 2200) { S.lastTypingSent = now; sendRaw('msg.typing', { channel: S.chan }); }
});
$('msgInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (S.editingMsg) {
      cancelEditMsg();
      $('msgInput').value = '';
    } else if (S.replyTo) {
      clearReply();
    }
  } else if (e.key === 'ArrowUp' && !$('msgInput').value) {
    e.preventDefault();
    const myMsgEls = Array.from($('msgs').querySelectorAll('.m')).reverse();
    const lastEl = myMsgEls.find(el => el._msg && el._msg.userId === S.me?.id && el._msg.text);
    if (lastEl && lastEl._msg) {
      startEditMsg(lastEl._msg);
    }
  }
});
$('msgInput').addEventListener('paste', (e) => {
  const files = e.clipboardData?.files;
  if (files && files.length > 0) { e.preventDefault(); uploadFiles(files); }
});
let dragOverTimer = null;
function clearDragOver() {
  clearTimeout(dragOverTimer);
  $('center')?.classList.remove('dragover');
}
$('center').addEventListener('dragover', (e) => {
  if (!S.chan || S.chanType === 'voice') return;
  const hasFiles = e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  if (!hasFiles) return;
  e.preventDefault();
  $('center').classList.add('dragover');
  clearTimeout(dragOverTimer);
  dragOverTimer = setTimeout(clearDragOver, 1400);
});
$('center').addEventListener('dragleave', (e) => {
  if (!e.relatedTarget || !$('center').contains(e.relatedTarget)) clearDragOver();
});
$('center').addEventListener('drop', (e) => {
  e.preventDefault();
  clearDragOver();
  if (e.dataTransfer?.files?.length) uploadFiles(e.dataTransfer.files);
});
window.addEventListener('drop', clearDragOver);
window.addEventListener('dragend', clearDragOver);
window.addEventListener('blur', clearDragOver);
window.addEventListener('mousedown', clearDragOver);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearDragOver(); });
$('composer').addEventListener('submit', (e) => {
  e.preventDefault(); const t = $('msgInput').value.trim();
  if (!t || !S.chan || S.chanType === 'voice') return;
  if (S.editingMsg) {
    const editId = S.editingMsg.id;
    cancelEditMsg();
    $('msgInput').value = '';
    rpc('msg.edit', { id: editId, text: t }).catch((er) => toast(er.message));
    return;
  }
  const replyTo = S.replyTo?.id || undefined;
  $('msgInput').value = '';
  clearReply();
  rpc('msg.send', { channel: S.chan, text: t, replyTo }).catch((er) => toast(er.message));
});

// ---------- Mensajes Fijados (estilo Slack / Linear) ----------
async function modalPins() {
  if (!S.chan) return;
  let pins = [];
  try { pins = await rpc('msg.pins', { channel: S.chan }); } catch (e) { return toast(e.message); }
  const body = h('div', { class: 'gal-list' });
  const draw = () => {
    body.replaceChildren();
    if (!pins.length) {
      body.append(h('div', { class: 'hint', style: 'padding:18px 0;text-align:center' }, 'No hay mensajes fijados en este canal. Pasa el cursor sobre cualquier mensaje y pulsa 📌 para fijarlo.'));
      return;
    }
    for (const m of pins) {
      body.append(
        h('div', { class: 'item', style: 'background:var(--bg3);align-items:flex-start;gap:10px' },
          h('div', { style: 'min-width:0;flex:1', onclick: () => { closeModal(); jumpToMsg(m.id); } },
            h('div', { style: 'display:flex;gap:8px;align-items:baseline' },
              h('b', { style: 'color:var(--tx)' }, m.name),
              h('span', { class: 'hint' }, fmtTime(m.ts))
            ),
            m.text ? h('div', { style: 'color:var(--tx);margin-top:3px;white-space:pre-wrap;word-break:break-word' }, m.text) : null,
            m.fileName ? h('div', { class: 'hint', style: 'margin-top:3px' }, `📎 ${m.fileName}`) : null
          ),
          h('button', { title: 'Desfijar', onclick: async () => {
            await rpc('msg.pin', { id: m.id }).catch(() => {});
            pins = pins.filter((x) => x.id !== m.id);
            draw();
          } }, '✕')
        )
      );
    }
  };
  draw();
  modal(`📌 Mensajes fijados · ${S.chanName}`, body);
}

// ---------- Galería de Imágenes y Documentos ----------
async function modalGallery() {
  if (!S.chan) return;
  let items = [];
  try { items = await rpc('files.list', { channel: S.chan }); } catch (e) { return toast(e.message); }
  const imgs = items.filter((f) => isImgMime(f.mime, f.name));
  const docs = items.filter((f) => !isImgMime(f.mime, f.name));
  let tab = imgs.length || !docs.length ? 'img' : 'doc';
  const body = h('div');
  const bImg = h('button', { onclick: () => { tab = 'img'; draw(); } }, `🖼️ Imágenes (${imgs.length})`);
  const bDoc = h('button', { onclick: () => { tab = 'doc'; draw(); } }, `📄 Documentos y Audios (${docs.length})`);
  const search = h('input', { placeholder: 'Buscar por nombre o usuario…', oninput: () => draw() });

  function draw() {
    bImg.className = tab === 'img' ? 'primary' : '';
    bDoc.className = tab === 'doc' ? 'primary' : '';
    const q = search.value.trim().toLowerCase();
    body.replaceChildren();
    if (tab === 'img') {
      const list = imgs.filter((f) => !q || f.name.toLowerCase().includes(q) || f.userName.toLowerCase().includes(q));
      if (!list.length) { body.append(h('div', { class: 'hint', style: 'padding:18px 0;text-align:center' }, 'No hay imágenes en este canal')); return; }
      body.append(h('div', { class: 'gal-grid' }, list.map((f) =>
        h('div', { class: 'gal-card', onclick: () => openImageLightbox(fileUrl(f.id, false), f.name, fileUrl(f.id, true)) },
          h('img', { src: fileUrl(f.id, false), loading: 'lazy', alt: f.name }),
          h('div', { class: 'meta', title: `${f.name} · por ${f.userName}` }, `${f.userName} · ${fmtSize(f.size)}`)
        )
      )));
    } else {
      const list = docs.filter((f) => !q || f.name.toLowerCase().includes(q) || f.userName.toLowerCase().includes(q));
      if (!list.length) { body.append(h('div', { class: 'hint', style: 'padding:18px 0;text-align:center' }, 'No hay documentos en este canal')); return; }
      body.append(h('div', { class: 'gal-list' }, list.map((f) =>
        h('div', { class: 'item', style: 'background:var(--bg3);cursor:default' },
          h('div', { style: 'min-width:0' },
            h('div', { style: 'font-weight:600;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, `${isAudioMime(f.mime, f.name) ? '🎙️' : '📄'} ${f.name}`),
            h('div', { class: 'hint' }, `${fmtSize(f.size)} · enviado por ${f.userName} · ${fmtTime(f.ts)}`)
          ),
          h('button', { class: 'primary', onclick: () => window.epic.openExternal?.(fileUrl(f.id, true)) }, '⬇ Descargar')
        )
      )));
    }
  }
  draw();
  modal(`Galería de archivos · ${S.chanName}`, h('div', { class: 'gal-tabs' }, bImg, bDoc), search, body);
}

// ---------- render ----------
function render() { renderRail(); renderSide(); renderMembers(); renderCenter(); renderHome(); renderStage(); renderMe(); }
function renderMe() {
  const bar = $('meBar'); if (!S.me) return;
  const actTxt = S.me.activity?.name ? `🎮 ${S.me.activity.name}` : (S.me.bio || 'Editar perfil y actividad');
  bar.replaceChildren(
    h('div', { class: 'who', title: 'Editar perfil y estado de juego', onclick: modalProfile },
      avatar(S.me, 34, true),
      h('div', { style: 'min-width:0' },
        h('b', { style: nameColorStyle(localStorage.getItem('epickast.equipped_color') || S.me.color) }, S.me.name),
        h('small', { class: S.me.activity?.name ? 'act-live' : '' }, actTxt)
      )
    ),
    h('button', { class: 'btn-ico', title: 'Ajustes', onclick: modalSettings }, icoSvg('settings', 16)));
}
function renderRail() {
  const r = $('rail'); r.replaceChildren();
  const dmUnread = [...S.unread].some((k) => k[0] === 'd');
  r.append(h('div', { class: 'ico' + (S.view.kind === 'home' ? ' sel' : ''), title: 'Inicio / Amigos', onclick: goHome }, dmUnread ? '🔴' : h('img', { src: 'logo.svg', alt: 'EK' })));
  r.append(h('div', {
    class: 'ico guide-ico' + (S.view.kind === 'guide' ? ' sel' : ''),
    title: 'Centro de Información y Guías Oficiales de EpicKast',
    style: 'background:linear-gradient(135deg, #1e1b4b, #4338ca);color:#c7d2fe;border:1px solid #6366f1;font-weight:900;font-size:15px;',
    onclick: () => openOfficialGuide('notas_version')
  }, '📘'));
  for (const s of S.servers) {
    const isMuted = (settings.mutedServers || []).includes(s.id);
    const content = s.icon
      ? h('img', { src: s.icon, alt: s.name })
      : s.name.slice(0, 2).toUpperCase();
    r.append(h('div', {
      class: 'ico' + (S.view.sid === s.id ? ' sel' : '') + (isMuted ? ' muted-srv' : ''),
      title: s.name + (isMuted ? ' (Silenciado)' : ''),
      onclick: () => openServer(s.id)
    }, content, isMuted ? h('span', { class: 'mute-badge', title: 'Servidor silenciado' }, '🔕') : null));
  }
  r.append(h('div', { class: 'ico', title: 'Crear o unirse a un servidor', onclick: modalServer }, '+'));
  r.append(h('div', {
    class: 'ico vault-ico',
    title: 'Bóveda de Reliquias • Abre tus cofres con las llaves ganadas en las mazmorras',
    style: 'background:linear-gradient(135deg, #78350f, #d97706);color:#fde047;border:1px solid #fbbf24;box-shadow:0 0 10px rgba(251,191,36,0.35);font-size:18px;margin-top:6px;',
    onclick: modalVault
  }, '🎁'));
  const verTxt = S.appVer ? ('v' + S.appVer) : 'v1.8.0';
  r.append(h('div', {
    class: 'rail-version',
    style: 'margin-top:auto;font-size:10.5px;font-weight:700;color:var(--mu);opacity:0.65;padding:8px 2px 4px;letter-spacing:0.5px;user-select:none;text-align:center;white-space:nowrap',
    title: 'EpicKast ' + verTxt
  }, verTxt));
}
function userItem(u, onclick, extra) {
  return h('div', { class: 'item' + (S.chan === u.dm ? ' sel' : ''), onclick },
    h('span', { class: 'l' },
      avatar(u, 28, u.online),
      h('div', { class: 'u-stack' },
        h('span', { class: 'nm' }, u.name, S.unread.has(u.dm) ? ' ●' : ''),
        u.online && u.activity?.name ? h('small', { class: 'u-act' }, `🎮 ${u.activity.name}`) : null
      )
    ),
    extra
  );
}
function renderSide() {
  const L = $('sideList'); L.replaceChildren();

  // MODO 1: GUÍAS OFICIALES (Activado desde el botón especial 📘 del riel)
  if (S.view.kind === 'guide') {
    $('sideTitle').replaceChildren(h('span', { style: 'font-weight:800;color:#c7d2fe;display:flex;align-items:center;gap:6px;' }, '📘 Guías Oficiales'));
    const sGuides = [
      { key: 'notas_version', name: '🚀-notas-de-la-version', title: 'Registro histórico y novedades de versión de EpicKast' },
      { key: 'como_funciona', name: '📖-como-funciona', title: 'Llamadas, streaming, bot DJ y controles' },
      { key: 'servidores', name: '🏰-guia-de-servidores', title: 'Crear servidores, canales, roles y permisos' },
      { key: 'mazmorras', name: '⚔️-boveda-y-dojo-de-cartas', title: 'Bóveda de Reliquias, Dojo de Cartas y Recompensas' }
    ];
    sGuides.forEach(g => {
      const isSel = S.guideChannel === g.key;
      L.append(h('div', {
        class: 'item' + (isSel ? ' sel' : ''),
        style: isSel ? 'background:#241d3e;border-left:3px solid #818cf8;color:#fff;font-weight:700;' : 'color:#c7d2fe;font-size:13px;',
        title: g.title,
        onclick: () => openOfficialGuide(g.key)
      }, h('span', { class: 'nm' }, '# ' + g.name)));
    });
    return;
  }

  // MODO 2: INICIO / AMIGOS
  if (S.view.kind === 'home') {
    $('sideTitle').replaceChildren(h('span', null, 'Mensajes directos'));
    for (const f of S.friends.friends) {
      L.append(userItem(f, () => openChannel(f.dm, 'dm', f.name), h('button', { class: 'side-call', title: `Llamar a ${f.name}`, onclick: (e) => { e.stopPropagation(); openChannel(f.dm, 'dm', f.name); joinCall(f.dm, f.name); } }, icoSvg('phone', 14))));
      const room = S.rooms.get(f.dm); if (room?.length) L.append(h('div', { class: 'sub' }, `🔊 en llamada (${room.length})`));
      const pt = S.partyTracks.get(f.dm); if (pt) L.append(h('div', { class: 'sub party-sub' }, `🎵 ${pt}`));
    }
    if (!S.friends.friends.length) L.append(h('div', { class: 'item' }, 'Aún no tienes amigos'));
    return;
  }

  // MODO 3: SERVIDOR (Exclusivamente canales de texto y voz normales, sin guías adentro)
  const sd = S.sdata.get(S.view.sid); if (!sd) return;
  const myRank = ROLES[sd.myRole || (sd.owner === S.me.id ? 'owner' : 'member')]?.rank ?? 0;
  $('sideTitle').replaceChildren(
    h('span', { style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1' }, sd.name),
    h('button', { class: 'btn-ico', onclick: () => modalInviteFriends(sd.id), title: 'Invitar amigos directamente a este servidor' }, '👥'),
    h('button', { class: 'btn-ico', onclick: modalServerManage, title: 'Administrar servidor, canales y rangos' }, '⋯')
  );

  for (const type of ['text', 'voice']) {
    L.append(h('div', { class: 'sect' }, type === 'text' ? 'Canales de texto' : 'Canales de voz',
      myRank >= 3 ? h('button', { title: type === 'text' ? 'Crear canal de texto' : 'Crear canal de voz', onclick: () => modalChannel(sd.id, type) }, '+') : null));
    for (const c of sd.channels.filter((x) => x.type === type)) {
      const sel = S.chan === c.key || (type === 'voice' && S.callKey === c.key);
      const rUsers = type === 'voice' ? (S.rooms.get(c.key) || []) : [];
      const countBadge = type === 'voice' && (rUsers.length > 0 || c.userLimit > 0)
        ? h('span', { class: 'ch-cnt' + (c.userLimit > 0 && rUsers.length >= c.userLimit ? ' full' : '') }, c.userLimit > 0 ? `${rUsers.length}/${c.userLimit}` : `${rUsers.length}`)
        : null;
      const prefix = type === 'text' ? '# ' : (/^[\p{Emoji}\u200d]+/u.test(c.name) ? '' : '🔊 ');
      L.append(h('div', { class: 'item' + (sel ? ' sel' : ''), onclick: () => (type === 'voice' ? joinCall(c.key, c.name) : openChannel(c.key, 'text', c.name)) },
        h('span', { class: 'l' }, prefix, h('span', { class: 'nm' }, c.name)),
        countBadge
      ));
      if (type === 'voice') {
        const pt = S.partyTracks.get(c.key);
        if (pt) L.append(h('div', { class: 'sub party-sub' }, `🎵 ${pt}`));
        for (const u of rUsers) {
          const st = u.state || {};
          const badges = [];
          if (st.serverMuted) {
            badges.push(h('span', { class: 'voice-badge s-muted', title: 'Silenciado por un Administrador' }, '🔇⛔'));
          } else if (st.muted) {
            badges.push(h('span', { class: 'voice-badge muted', title: 'Micrófono silenciado' }, '🔇'));
          }
          if (st.deaf) {
            badges.push(h('span', { class: 'voice-badge deaf', title: 'Ensordecido (auriculares silenciados)' }, '🎧❌'));
          }
          if (st.cam) {
            badges.push(h('span', { class: 'voice-badge cam', title: 'Cámara activada' }, '📹'));
          }
          if (st.screen) {
            badges.push(h('span', { class: 'voice-badge screen', title: 'Transmitiendo pantalla' }, '🖥️'));
          }
          L.append(h('div', { class: 'sub voice-user-row' },
            avatar(u, 16, true),
            h('span', { class: 'sub-nm' }, u.name),
            badges.length ? h('span', { class: 'voice-badges-stack' }, ...badges) : null
          ));
        }
      }
    }
  }
}
function renderMembers() {
  const M = $('members'); M.replaceChildren();
  if (S.view.kind !== 'server') return;
  const sd = S.sdata.get(S.view.sid); if (!sd) return;
  const online = sd.members.filter((m) => m.online);
  const offline = sd.members.filter((m) => !m.online);

  const renderRow = (m) => {
    const rKey = m.role || (m.id === sd.owner ? 'owner' : 'member');
    const rInfo = ROLES[rKey] || ROLES.member;
    const subTxt = m.online && m.activity?.name ? `🎮 ${m.activity.name}` : (m.bio || '');
    return h('div', { class: 'item mem-row' + (m.online ? '' : ' off'), onclick: () => modalMemberCard(sd, m), title: 'Clic para ver perfil o asignar rango' },
      h('span', { class: 'l' },
        avatar(m, 30, m.online),
        h('div', { class: 'u-stack' },
          h('span', { class: 'nm', style: rInfo.color ? `color:${rInfo.color};font-weight:600` : '' },
            m.name,
            rInfo.badge ? h('span', { class: 'role-badge', title: rInfo.label }, rInfo.badge) : null
          ),
          subTxt ? h('small', { class: m.online && m.activity?.name ? 'u-act' : 'u-bio' }, subTxt) : null
        )
      )
    );
  };

  for (const rKey of ['owner', 'admin', 'mod', 'dj', 'member']) {
    const grp = online.filter((m) => (m.role || (m.id === sd.owner ? 'owner' : 'member')) === rKey);
    if (!grp.length) continue;
    M.append(h('div', { class: 'sect' }, `${ROLES[rKey].group} — ${grp.length}`));
    grp.forEach((m) => M.append(renderRow(m)));
  }
  if (offline.length) {
    M.append(h('div', { class: 'sect' }, `⚫ Desconectados — ${offline.length}`));
    offline.forEach((m) => M.append(renderRow(m)));
  }
}
function modalMemberCard(sd, m) {
  const myRole = sd.myRole || (sd.owner === S.me.id ? 'owner' : 'member');
  const myRank = ROLES[myRole]?.rank ?? 0;
  const mRole = m.role || (m.id === sd.owner ? 'owner' : 'member');
  const mRank = ROLES[mRole]?.rank ?? 0;
  const rInfo = ROLES[mRole] || ROLES.member;
  const isFriend = S.friends.friends.some((f) => f.id === m.id);
  const canSetRole = myRank >= 3 && m.id !== sd.owner && (myRole === 'owner' || myRank > mRank);
  const canKick = myRank >= 2 && m.id !== S.me.id && myRank > mRank;
  const canBan = canKick;

  // Encontrar si el miembro está en un canal de voz de este servidor
  let userVoiceKey = null;
  let userVoiceName = null;
  for (const ch of (sd.channels || [])) {
    if (ch.type === 'voice') {
      const k = 'c' + ch.id;
      const list = S.rooms.get(k) || [];
      if (list.some((u) => u.id === m.id)) {
        userVoiceKey = k;
        userVoiceName = ch.name;
        break;
      }
    }
  }

  const roleSel = canSetRole ? h('select', {
    onchange: async (e) => {
      await safe(rpc('server.setRole', { id: sd.id, userId: m.id, role: e.target.value }));
      toast(`Rango de ${m.name} actualizado a ${ROLES[e.target.value]?.label}`);
      closeModal();
    }
  }, ['admin', 'mod', 'dj', 'member'].filter((rk) => myRole === 'owner' || ROLES[rk].rank < myRank).map((rk) =>
    h('option', { value: rk, selected: mRole === rk }, `${ROLES[rk].badge || '👤'} ${ROLES[rk].label}`)
  )) : null;

  // Dropdown para mover de canal de voz
  const otherVoiceChannels = (sd.channels || []).filter((ch) => ch.type === 'voice' && ('c' + ch.id) !== userVoiceKey);
  const moveSel = (canKick && userVoiceKey && otherVoiceChannels.length > 0) ? h('select', {
    onchange: async (e) => {
      const targetKey = e.target.value;
      if (!targetKey) return;
      await safe(rpc('voice.moveUser', { currentKey: userVoiceKey, targetKey, userId: m.id }));
      toast(`Moviendo a ${m.name}...`);
      closeModal();
    }
  }, h('option', { value: '' }, '🔀 Mover a otro canal de voz...'), otherVoiceChannels.map((ch) =>
    h('option', { value: 'c' + ch.id }, `🔊 ${ch.name}`)
  )) : null;

  const bannerBg = (m.id === S.me?.id && localStorage.getItem('epickast.equipped_banner')) ? localStorage.getItem('epickast.equipped_banner') : (m.banner || (m.id === S.me?.id ? S.me?.banner : null) || m.color || 'linear-gradient(135deg, #7c5cff, #4f46e5)');
  const memberNameColor = (m.id === S.me?.id && localStorage.getItem('epickast.equipped_color')) ? localStorage.getItem('epickast.equipped_color') : (m.color || (m.id === S.me?.id ? S.me?.color : null) || rInfo.color || 'var(--tx)');

  const card = h('div', { class: 'prof-card' },
    h('div', { class: 'prof-banner', style: `background:${bannerBg}` }),
    h('div', { class: 'prof-body' },
      h('div', { class: 'prof-avatar-row' },
        h('div', { class: 'prof-avatar-overlap' }, avatar(m, 72, m.online)),
        m.id !== S.me.id && !isFriend ? h('button', {
          class: 'primary',
          style: 'padding:6px 12px;font-size:12px',
          onclick: () => safe(rpc('friends.add', { name: m.name })).then(() => { toast('Solicitud enviada'); closeModal(); })
        }, icoSvg('userPlus', 13), ' Agregar') : null
      ),
      h('div', { class: 'prof-meta' },
        h('div', { style: `font-size:18px;font-weight:700;color:${memberNameColor}` },
          m.name,
          rInfo.badge ? h('span', { class: 'role-badge', style: 'margin-left:6px', title: rInfo.label }, rInfo.badge) : null
        ),
        h('div', { class: 'hint' }, `Rango: ${rInfo.label} · ${m.online ? '🟢 En línea' : '⚫ Desconectado'}`),
        m.activity?.name ? h('div', { class: 'act-pill', style: 'margin-top:2px' }, `🎮 Jugando a ${m.activity.name}`) : null,
        userVoiceName ? h('div', { class: 'hint', style: 'color:#a29bfe;margin-top:2px' }, `🔊 En llamada: ${userVoiceName}`) : null,
        m.bio ? h('div', { style: 'font-size:12.5px;color:var(--tx);margin-top:4px' }, `“${m.bio}”`) : null
      ),
      canSetRole ? h('label', null, '🛡️ Asignar rango en el servidor', roleSel) : null,
      (canKick || canBan || userVoiceKey) ? h('div', { class: 'mod-box' },
        h('div', { class: 'mod-title' }, '⚖️ Herramientas de Moderación'),
        userVoiceKey ? h('div', { class: 'mod-actions-grid' },
          h('button', {
            type: 'button',
            class: 'mod-btn voice',
            onclick: async () => {
              await safe(rpc('voice.serverMute', { key: userVoiceKey, userId: m.id, mute: true }));
              toast(`Micrófono de ${m.name} silenciado para todos`);
              closeModal();
            }
          }, '🔇 Silenciar micro'),
          h('button', {
            type: 'button',
            class: 'mod-btn voice',
            onclick: async () => {
              await safe(rpc('voice.serverMute', { key: userVoiceKey, userId: m.id, mute: false }));
              toast(`Silencio retirado a ${m.name}`);
              closeModal();
            }
          }, '🔊 Desilenciar')
        ) : null,
        moveSel ? h('div', { class: 'mod-row' },
          h('label', { style: 'font-size:11px;color:var(--mu);margin-bottom:3px;display:block' }, '🔀 Mover a canal de voz:'),
          moveSel
        ) : null,
        h('div', { class: 'mod-actions-grid' },
          canKick ? h('button', {
            type: 'button',
            class: 'mod-btn kick',
            onclick: () => confirm(`¿Expulsar a ${m.name} del servidor?`) && safe(rpc('server.kick', { id: sd.id, userId: m.id })).then(() => { toast(`Usuario ${m.name} expulsado`); closeModal(); })
          }, '👢 Expulsar') : null,
          canBan ? h('button', {
            type: 'button',
            class: 'mod-btn ban',
            onclick: async () => {
              const reason = prompt(`Motivo del baneo para ${m.name} (opcional):`, 'Comportamiento no adecuado o spam');
              if (reason !== null) {
                await safe(rpc('server.ban', { id: sd.id, userId: m.id, reason }));
                toast(`Usuario ${m.name} baneado`);
                closeModal();
              }
            }
          }, '🚫 Banear') : null
        ),
        canKick ? h('button', {
          type: 'button',
          class: 'mod-btn spam',
          style: 'width:100%',
          onclick: async () => {
            if (confirm(`¿Borrar los mensajes recientes de ${m.name} en este canal?`)) {
              await safe(rpc('server.deleteUserMessages', { id: sd.id, chanId: S.chan, userId: m.id }));
              toast(`Mensajes de ${m.name} limpiados`);
              closeModal();
            }
          }
        }, '🧹 Limpiar mensajes recientes (Anti-Spam)') : null
      ) : null
    )
  );

    modal(`Perfil de ${m.name}`, card);
  const btnDm = card.querySelector('#profBtnSendDm');
  if (btnDm) btnDm.onclick = () => {
    closeModal();
    const dmK = dmKey(S.me.id, m.id);
    goHome();
    openChannel(dmK, 'dm', m.name);
  };
  const btnCj = card.querySelector('#profBtnCardJitsu');
  if (btnCj) btnCj.onclick = () => {
    closeModal();
    modalVault('dojo');
    toast(`¡Has desafiado a ${m.name} al Dojo!`);
    safe(rpc('cardjitsu.challenge', { toUserId: m.id }));
  };
}
function applyPanelsLayout() {
  const mainEl = $('main');
  if (!mainEl) return;
  mainEl.classList.toggle('hide-side', !!settings.hideSide);
  const hideRight = S.view.kind !== 'server' || !!settings.hideMembers;
  mainEl.classList.toggle('hide-members', hideRight);
}
function renderCenter() {
  applyPanelsLayout();
  const dm = S.chan && S.chan[0] === 'd';
  const isGuide = S.view.kind === 'guide';
  const showChat = !!S.chan && S.chanType !== 'voice' && !isGuide;
  const isServer = S.view.kind === 'server';

  const toggleSideBtn = h('button', {
    class: 'btn-ico' + (settings.hideSide ? ' on-pane' : ''),
    title: settings.hideSide ? 'Mostrar lista de contactos y canales' : 'Ocultar lista de contactos y canales (mantiene los servidores visibles)',
    onclick: () => { settings.hideSide = !settings.hideSide; saveSettings(); renderCenter(); }
  }, icoSvg('panelLeft', 16));

  const rightBtns = h('div', { style: 'display:flex;gap:8px;align-items:center' },
    S.call ? h('button', { class: 'btn-act hdr' + (S.party?.current ? ' call' : ''), title: 'Abrir EpicBot DJ (YouTube & Playlists en conjunto)', onclick: modalParty }, '🎵 ', S.party?.current ? 'Bot DJ (Sonando)' : 'Bot DJ') : null,
    showChat ? h('button', { class: 'btn-act hdr', title: 'Ver mensajes fijados en este canal', onclick: modalPins }, icoSvg('pin', 14), 'Fijados') : null,
    showChat ? h('button', { class: 'btn-act hdr', title: 'Ver galería de imágenes y documentos enviados', onclick: modalGallery }, icoSvg('gallery', 14), 'Galería') : null,
    dm ? h('button', { class: 'btn-act call hdr', title: 'Iniciar una llamada de voz/video', onclick: () => joinCall(S.chan, S.chanName) }, icoSvg('phone', 14), 'Llamar') : null,
    isServer ? h('button', {
      class: 'btn-act hdr' + (!settings.hideMembers ? ' on-pane' : ''),
      title: settings.hideMembers ? 'Mostrar columna de miembros a la derecha' : 'Ocultar columna de miembros para ampliar la pantalla',
      onclick: () => { settings.hideMembers = !settings.hideMembers; saveSettings(); renderCenter(); }
    }, icoSvg('users', 14), 'Miembros') : null
  );

  const guideTitles = {
    como_funciona: '📖-como-funciona',
    servidores: '🏰-guia-de-servidores',
    mazmorras: '⚔️-mazmorras-y-recompensas'
  };

  const centerTitleText = isGuide 
    ? ('# ' + (guideTitles[S.guideChannel] || 'guia-oficial'))
    : S.chan ? (S.chanType === 'text' ? '# ' : dm ? '@ ' : '') + S.chanName : S.view.kind === 'home' ? 'Amigos' : '';

  $('chTitle').replaceChildren(
    h('div', { style: 'display:flex;align-items:center;gap:8px;min-width:0' },
      toggleSideBtn,
      h('span', { style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;' }, centerTitleText),
      isGuide ? h('span', { style: 'background:#1e1b4b;color:#a5b4fc;padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;border:1px solid #4338ca;' }, 'Canal Informativo Oficial') : null
    ),
    rightBtns
  );

  // Visibilidad de paneles en section#center
  $('msgs').classList.toggle('hidden', !showChat);
  $('composer').classList.toggle('hidden', !showChat);
  $('home').classList.toggle('hidden', isGuide || showChat || S.view.kind !== 'home');

  const gView = $('guideView');
  if (gView) {
    gView.classList.toggle('hidden', !isGuide);
    if (isGuide) {
      gView.replaceChildren(renderGuideContent(S.guideChannel || 'como_funciona'));
    }
  }
}
function renderHome() {
  const H = $('home'); if (H.classList.contains('hidden') && S.view.kind !== 'home') return;
  H.replaceChildren();
  const sendFriend = () => {
    const v = inp.value.trim();
    if (v) safe(rpc('friends.add', { name: v })).then(() => { inp.value = ''; toast('Solicitud enviada'); });
  };
  const inp = h('input', { placeholder: 'Escribe el nombre de usuario de tu amigo…', onkeydown: (e) => { if (e.key === 'Enter') sendFriend(); } });
  H.append(
    h('h3', null, 'Agregar amigo'),
    h('div', { class: 'add-friend-bar' }, inp, h('button', { class: 'primary', onclick: sendFriend }, icoSvg('userPlus', 15), 'Enviar solicitud'))
  );
  if (S.friends.incoming.length) H.append(h('h3', null, `Solicitudes recibidas — ${S.friends.incoming.length}`));
  for (const u of S.friends.incoming) {
    H.append(h('div', { class: 'friend-card' },
      h('span', { class: 'l' }, avatar(u, 36), h('span', { class: 'nm' }, h('b', { style: 'color:var(--tx)' }, u.name), h('div', { class: 'hint' }, 'Quiere agregarte'))),
      h('div', { class: 'f-actions' },
        h('button', { class: 'btn-act call', onclick: () => rpc('friends.accept', { id: u.id }) }, icoSvg('check', 15), 'Aceptar'),
        h('button', { class: 'btn-ico del', title: 'Rechazar', onclick: () => rpc('friends.remove', { id: u.id }) }, icoSvg('close', 15))
      )
    ));
  }
  if (S.friends.outgoing.length) H.append(h('h3', null, `Solicitudes enviadas — ${S.friends.outgoing.length}`));
  for (const u of S.friends.outgoing) {
    H.append(h('div', { class: 'friend-card' },
      h('span', { class: 'l' }, avatar(u, 34), h('span', { class: 'nm' }, u.name, h('div', { class: 'hint' }, 'Pendiente de aceptar'))),
      h('div', { class: 'f-actions' }, h('button', { class: 'btn-act', onclick: () => rpc('friends.remove', { id: u.id }) }, 'Cancelar'))
    ));
  }
  H.append(h('h3', null, `Amigos — ${S.friends.friends.length}`));
  if (!S.friends.friends.length) {
    H.append(h('div', { class: 'hint', style: 'padding:12px 2px' }, 'Aún no has agregado amigos. Envía una solicitud arriba para empezar a chatear y llamar.'));
  }
  for (const u of S.friends.friends) {
    const statusLine = u.online
      ? (u.activity?.name ? `🎮 Jugando a ${u.activity.name}` : (u.bio ? `En línea · ${u.bio}` : 'En línea'))
      : 'Desconectado';
    H.append(h('div', { class: 'friend-card' },
      h('span', { class: 'l', style: 'cursor:pointer', onclick: () => openChannel(u.dm, 'dm', u.name) },
        avatar(u, 38, u.online),
        h('span', { class: 'nm' },
          h('div', { style: 'font-weight:600;color:var(--tx)' }, u.name),
          h('div', { class: 'hint', style: u.online ? (u.activity?.name ? 'color:#a29bfe;font-weight:600' : 'color:var(--ok)') : '' }, statusLine)
        )
      ),
      h('div', { class: 'f-actions' },
        h('button', { class: 'btn-act', title: `Abrir chat con ${u.name}`, onclick: () => openChannel(u.dm, 'dm', u.name) }, icoSvg('chat', 15), 'Mensaje'),
        h('button', { class: 'btn-act call', title: `Llamar a ${u.name}`, onclick: () => { openChannel(u.dm, 'dm', u.name); joinCall(u.dm, u.name); } }, icoSvg('phone', 15), 'Llamar'),
        S.servers.length ? h('button', { class: 'btn-act', title: `Invitar a ${u.name} a un servidor`, onclick: () => modalInviteFriendToAnyServer(u) }, '🏰 Invitar') : null,
        h('button', { class: 'btn-ico del', title: 'Eliminar amigo', onclick: () => confirm(`¿Eliminar a ${u.name}?`) && rpc('friends.remove', { id: u.id }) }, icoSvg('close', 16))
      )
    ));
  }
}

// ---------- modales ----------
function modal(title, ...body) {
  const m = $('modal'); m.replaceChildren(h('div', { class: 'panel' }, h('h3', null, title), ...body, h('button', { onclick: closeModal }, 'Cerrar')));
  m.classList.remove('hidden'); m.onclick = (e) => { if (e.target === m) closeModal(); };
}
function closeModal() { S.partyModalUpdater = null; S.cleanup.splice(0).forEach((f) => { try { f(); } catch {} }); $('modal').classList.add('hidden'); $('modal').replaceChildren(); }
function modalInviteFriendToAnyServer(friend) {
  if (!S.servers.length) return toast('No estás en ningún servidor todavía');
  if (S.servers.length === 1) {
    const s = S.servers[0];
    safe(rpc('server.inviteFriend', { serverId: s.id, friendId: friend.id }))
      .then(() => toast(`¡Invitación a "${s.name}" enviada a ${friend.name}!`))
      .catch((e) => toast(e.message || 'Error al enviar invitación'));
    return;
  }
  const items = S.servers.map((s) => h('button', {
    class: 'primary',
    style: 'width:100%;text-align:left;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-radius:8px;margin-bottom:6px',
    onclick: async () => {
      closeModal();
      try {
        await rpc('server.inviteFriend', { serverId: s.id, friendId: friend.id });
        toast(`¡Invitación a "${s.name}" enviada a ${friend.name}!`);
      } catch (e) {
        toast(e.message || 'Error al enviar invitación');
      }
    }
  }, h('span', { style: 'font-weight:600' }, s.name), h('span', { style: 'font-size:12px;opacity:0.85' }, 'Enviar invitación 📨')));

  modal(`Invitar a ${friend.name}`,
    h('p', { class: 'muted', style: 'font-size:13px;margin-bottom:10px' }, 'Elige el servidor al que deseas invitar a tu amigo:'),
    h('div', { style: 'display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;margin-bottom:12px' }, ...items)
  );
}

function modalServer() {
  const name = h('input', { placeholder: 'Nombre del servidor (ej. Squad Epick3D)' }); const code = h('input', { placeholder: 'Código de invitación' });
  modal('Servidores', h('label', null, 'Crear un servidor (incluye salas de voz, gaming y música)', name), h('button', { class: 'primary', onclick: async () => { const r = await safe(rpc('server.create', { name: name.value })); closeModal(); await loadServers(); openServer(r.id); } }, 'Crear servidor'),
    h('label', null, 'Unirse con invitación', code), h('button', { class: 'primary', onclick: async () => { const r = await safe(rpc('server.join', { code: code.value })); closeModal(); await loadServers(); openServer(r.id); } }, 'Unirse'));
}
function modalChannel(sid, type) {
  const name = h('input', { placeholder: type === 'text' ? 'ej. clips-y-memes' : 'ej. 🎮 Squad Ranked' });
  const limSel = h('select', null,
    [[0, 'Sin límite (hasta 8 en malla P2P)'], [2, '2 usuarios (Sala Dúo)'], [3, '3 usuarios (Trío)'], [4, '4 usuarios (Squad)'], [5, '5 usuarios (5v5)'], [6, '6 usuarios']].map(([v, t]) => h('option', { value: v }, t))
  );
  const presets = type === 'voice' ? h('div', { class: 'preset-chips' },
    [
      ['🔊 Sala General', 0],
      ['🎮 Gaming Squad', 5],
      ['🎵 Sala de Música / DJ', 0],
      ['🎬 Cine & YouTube', 0],
      ['🔒 Sala Dúo VIP', 2],
      ['💤 AFK / Descanso', 0],
    ].map(([n, l]) => h('button', { type: 'button', class: 'chip', onclick: () => { name.value = n; limSel.value = String(l); } }, n))
  ) : null;

  modal(type === 'text' ? 'Nuevo canal de texto' : 'Nuevo canal de voz',
    type === 'voice' ? h('label', null, 'Plantillas rápidas (clic para rellenar)', presets) : null,
    h('label', null, 'Nombre del canal', name),
    type === 'voice' ? h('label', null, 'Límite de usuarios en el canal', limSel) : null,
    h('button', { class: 'primary', onclick: async () => {
      await safe(rpc('channel.create', { serverId: sid, name: name.value, type, userLimit: type === 'voice' ? Number(limSel.value) : 0 }));
      closeModal();
    } }, 'Crear canal')
  );
}
function modalInviteFriends(serverId) {
  const sd = S.sdata.get(serverId);
  if (!sd) return toast('Servidor no disponible');
  const friends = S.friends?.friends || [];
  if (friends.length === 0) {
    modal(`Invitar a ${sd.name}`,
      h('p', { class: 'muted', style: 'padding:14px 0' }, 'No tienes amigos agregados aún. Agrega amigos en la sección de Contactos para poder invitarlos directamente con un solo clic.'),
      h('div', { class: 'row' }, h('button', { onclick: closeModal }, 'Cerrar'))
    );
    return;
  }

  const existingMemberIds = new Set((sd.members || []).map((m) => m.id));
  const list = h('div', { style: 'max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin:12px 0;padding-right:4px' });

  function renderFriendRows(filter = '') {
    list.replaceChildren();
    const q = filter.trim().toLowerCase();
    const filtered = friends.filter((f) => !q || f.name.toLowerCase().includes(q));
    if (filtered.length === 0) {
      list.append(h('p', { class: 'muted', style: 'text-align:center;padding:12px' }, 'No se encontraron amigos'));
      return;
    }
    filtered.forEach((f) => {
      const isMember = existingMemberIds.has(f.id);
      const btn = h('button', {
        class: isMember ? '' : 'primary',
        disabled: isMember,
        style: 'font-size:12px;padding:6px 14px;min-width:105px;font-weight:600;border-radius:6px',
        onclick: async () => {
          btn.disabled = true;
          btn.textContent = 'Enviando...';
          try {
            await rpc('server.inviteFriend', { serverId: sd.id, friendId: f.id });
            btn.textContent = '✓ Enviada';
            btn.style.background = '#2ea043';
            btn.style.borderColor = '#2ea043';
            toast(`Invitación enviada a ${f.name}`);
          } catch (err) {
            btn.disabled = false;
            btn.textContent = '📨 Invitar';
            toast(err.message || 'Error al enviar invitación');
          }
        }
      }, isMember ? 'Ya es miembro' : '📨 Invitar');

      list.append(h('div', {
        style: 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:8px'
      },
        h('div', { style: 'display:flex;align-items:center;gap:10px' },
          avatar(f, 32),
          h('div', null,
            h('b', { style: 'font-size:13px;display:block' }, f.name),
            h('span', { class: 'muted', style: 'font-size:11px' }, f.online ? '🟢 En línea' : '⚪ Desconectado')
          )
        ),
        btn
      ));
    });
  }

  const searchInput = h('input', {
    placeholder: '🔍 Buscar amigo...',
    style: 'margin-bottom:8px',
    oninput: (e) => renderFriendRows(e.target.value)
  });

  renderFriendRows();

  modal(`👥 Invitar amigos a "${sd.name}"`,
    h('p', { class: 'muted', style: 'font-size:12px;margin-bottom:8px' }, 'Envía la invitación directamente al chat privado de tus amigos con un solo clic:'),
    searchInput,
    list,
    h('div', { class: 'row' }, h('button', { onclick: closeModal }, 'Listo'))
  );
}


async function modalModerationReports() {
  try {
    const list = await rpc('report.list');
    const wrap = h('div', { style: 'display:flex;flex-direction:column;gap:12px;max-height:70vh;overflow-y:auto;min-width:min(500px, 90vw);' });
    if (!list || !list.length) {
      wrap.appendChild(h('div', { style: 'padding:20px;text-align:center;color:#94a3b8;' }, '✓ No hay reportes pendientes de revisión.'));
    } else {
      list.forEach((r) => {
        const item = h('div', { style: 'background:#1e293b;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:6px;border-left:4px solid ' + (r.status === 'resolved' ? '#10b981' : '#f59e0b') },
          h('div', { style: 'display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;' },
            h('span', null, `Reporte #${r.id} • ${new Date(r.ts).toLocaleDateString()} ${new Date(r.ts).toLocaleTimeString()}`),
            h('span', { style: 'font-weight:bold;color:' + (r.status === 'resolved' ? '#10b981' : '#f59e0b') }, r.status === 'resolved' ? '✓ Resuelto' : '⏳ Pendiente')
          ),
          h('div', { style: 'font-size:13px;' },
            h('b', { style: 'color:#38bdf8;' }, r.reporterName || ('Usuario #' + r.reporter_id)),
            ' reportó a ',
            h('b', { style: 'color:#f87171;' }, r.reportedName || ('Usuario #' + r.reported_user_id))
          ),
          r.messageText ? h('div', { style: 'background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:6px;font-style:italic;font-size:12px;color:#cbd5e1;' }, '«' + r.messageText + '»') : null,
          h('div', { style: 'font-size:13px;color:#fde047;' }, 'Motivo: ' + r.reason),
          r.status !== 'resolved' ? h('div', { style: 'display:flex;gap:8px;margin-top:6px;' },
            h('button', {
              class: 'primary',
              style: 'padding:5px 10px;font-size:12px;',
              onclick: async () => {
                await rpc('report.resolve', { reportId: r.id, status: 'resolved' });
                toast('✓ Reporte marcado como resuelto');
                closeModal();
                modalModerationReports();
              }
            }, '✓ Marcar Resuelto')
          ) : null
        );
        wrap.appendChild(item);
      });
    }
    modal('🛡️ Buzón de Moderación y Reportes', wrap);
  } catch (e) {
    toast('Error al cargar reportes: ' + e.message);
  }
}

function modalServerManage() {
  const sd = S.sdata.get(S.view.sid); if (!sd) return;
  const myRole = sd.myRole || (sd.owner === S.me.id ? 'owner' : 'member');
  const myRank = ROLES[myRole]?.rank ?? 0;
  const parts = [];
  parts.push(
    h('button', {
      class: 'primary',
      style: 'width:100%;padding:10px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px',
      onclick: () => { closeModal(); modalInviteFriends(sd.id); }
    }, '👥 Invitar amigos directamente a este servidor')
  );
  const isMuted = (settings.mutedServers || []).includes(sd.id);
  parts.push(
    h('button', {
      style: 'width:100%;padding:9px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:8px',
      onclick: () => {
        if (!settings.mutedServers) settings.mutedServers = [];
        if (isMuted) settings.mutedServers = settings.mutedServers.filter((id) => id !== sd.id);
        else settings.mutedServers.push(sd.id);
        saveSettings();
        toast(isMuted ? '🔔 Notificaciones activadas para este servidor' : '🔕 Servidor silenciado (sin sonidos ni avisos)');
        closeModal();
        renderRail();
      }
    }, isMuted ? '🔔 Desmutear notificaciones de este servidor' : '🔕 Silenciar notificaciones de este servidor')
  );
  if (myRank >= 3) {
    const srvIcoPv = h('div', {
      class: 'avatar',
      style: `width:60px;height:60px;font-size:24px;border-radius:18px;background:#1e2230;background-size:cover;background-position:center;${sd.icon ? `background-image:url(${sd.icon})` : ''}`
    }, sd.icon ? '' : sd.name.slice(0, 2).toUpperCase());

    const srvFile = h('input', { type: 'file', accept: 'image/*', class: 'hidden', onchange: () => {
      const f = srvFile.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
          const s = Math.min(img.width, img.height);
          x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
          let out = c.toDataURL('image/webp', 0.82);
          if (out.length > 58000) out = c.toDataURL('image/webp', 0.62);
          if (out.length > 58000) out = c.toDataURL('image/jpeg', 0.65);
          srvIcoPv.style.backgroundImage = `url(${out})`;
          srvIcoPv.textContent = '';
          rpc('server.setIcon', { id: sd.id, icon: out }).then(() => {
            sd.icon = out;
            const targetSrv = S.servers.find(s => s.id === sd.id);
            if (targetSrv) targetSrv.icon = out;
            renderRail();
            toast('Icono del servidor actualizado con éxito');
          }).catch(e => toast(e.message));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
    } });

    parts.push(
      h('div', { class: 'sect' }, 'Icono del Servidor'),
      h('div', { style: 'display:flex;align-items:center;gap:14px;background:var(--bg3);border-radius:10px;padding:10px;margin-bottom:10px' },
        srvIcoPv,
        h('div', { style: 'display:flex;flex-direction:column;gap:6px;flex:1' },
          h('button', { style: 'padding:6px 12px;font-size:12px;font-weight:600', onclick: () => srvFile.click() }, '📷 Cambiar imagen del servidor'),
          sd.icon ? h('button', { style: 'padding:5px 10px;font-size:11px;opacity:0.85', onclick: () => {
            rpc('server.setIcon', { id: sd.id, icon: null }).then(() => {
              sd.icon = null;
              srvIcoPv.style.backgroundImage = '';
              srvIcoPv.textContent = sd.name.slice(0, 2).toUpperCase();
              const targetSrv = S.servers.find(s => s.id === sd.id);
              if (targetSrv) targetSrv.icon = null;
              renderRail();
              toast('Icono del servidor eliminado');
            }).catch(e => toast(e.message));
          } }, 'Quitar imagen') : null,
          srvFile
        )
      )
    );
  }
  if (sd.invite) {
    parts.push(h('label', null, '🔗 Código de invitación (clic para copiar y compartir con tus amigos)',
      h('input', { value: sd.invite, readonly: true, onclick: (e) => { e.target.select(); navigator.clipboard?.writeText(e.target.value); toast('Código copiado'); } })));
    if (myRank >= 3) parts.push(h('button', { onclick: () => rpc('server.newinvite', { id: sd.id }).then(closeModal) }, '🔄 Generar nuevo código de invitación'));
  }
  if (myRank >= 3) {
    parts.push(
      h('div', { class: 'sect', style: 'display:flex;justify-content:space-between;align-items:center' },
        h('span', null, `Canales (${sd.channels.length})`),
        h('div', { style: 'display:flex;gap:6px' },
          h('button', { style: 'padding:3px 8px;font-size:11px', onclick: () => { closeModal(); modalChannel(sd.id, 'text'); } }, '+ Texto'),
          h('button', { style: 'padding:3px 8px;font-size:11px', onclick: () => { closeModal(); modalChannel(sd.id, 'voice'); } }, '+ Voz')
        )
      )
    );
    for (const c of sd.channels) {
      parts.push(h('div', { class: 'item', style: 'background:var(--bg3)' },
        h('span', null, (c.type === 'text' ? '# ' : '🔊 ') + c.name + (c.userLimit ? ` (máx. ${c.userLimit})` : '')),
        h('button', { class: 'btn-ico del', title: 'Eliminar canal', onclick: () => confirm(`¿Eliminar ${c.name}?`) && rpc('channel.delete', { id: c.id }).then(closeModal) }, '✕')
      ));
    }
  }
  parts.push(h('div', { class: 'sect' }, `Miembros y Rangos (${sd.members.length})`));
  const memList = h('div', { class: 'gal-list', style: 'max-height:220px' });
  for (const m of sd.members) {
    const mRole = m.role || (m.id === sd.owner ? 'owner' : 'member');
    const mRank = ROLES[mRole]?.rank ?? 0;
    const canEditRole = myRank >= 3 && m.id !== sd.owner && (myRole === 'owner' || myRank > mRank);
    const canKick = myRank >= 2 && m.id !== S.me.id && myRank > mRank;
    memList.append(h('div', { class: 'item', style: 'background:var(--bg3);gap:8px' },
      h('span', { class: 'l' }, avatar(m, 26, m.online), h('span', { style: 'color:' + (ROLES[mRole]?.color || 'var(--tx)') + ';font-weight:600' }, `${m.name} ${ROLES[mRole]?.badge || ''}`)),
      h('div', { style: 'display:flex;gap:6px;align-items:center' },
        canEditRole ? h('select', {
          style: 'padding:4px 8px;font-size:12px;width:auto',
          onchange: (e) => safe(rpc('server.setRole', { id: sd.id, userId: m.id, role: e.target.value })).then(() => toast(`Rango de ${m.name}: ${ROLES[e.target.value]?.label}`))
        }, ['admin', 'mod', 'dj', 'member'].filter((rk) => myRole === 'owner' || ROLES[rk].rank < myRank).map((rk) =>
          h('option', { value: rk, selected: mRole === rk }, `${ROLES[rk].badge || '👤'} ${ROLES[rk].label}`)
        )) : h('span', { class: 'hint' }, ROLES[mRole]?.label || 'Miembro'),
        canKick ? h('button', { class: 'btn-ico del', title: 'Expulsar', onclick: () => confirm(`¿Expulsar a ${m.name}?`) && rpc('server.kick', { id: sd.id, userId: m.id }).then(closeModal) }, '✕') : null
      )
    ));
  }
  parts.push(memList);
  if (sd.owner === S.me.id) {
    parts.push(h('button', { class: 'danger', onclick: () => confirm('¿Eliminar el servidor y todos sus mensajes?') && rpc('server.delete', { id: sd.id }).then(closeModal) }, 'Eliminar servidor permanentemente'));
  } else {
    parts.push(h('button', { class: 'danger', onclick: () => rpc('server.leave', { id: sd.id }).then(closeModal) }, 'Salir del servidor'));
  }
  modal(`Administrar · ${sd.name}`, ...parts);
}

// ---- perfil / personalización + estado de actividad/juego ----
function modalProfile() {
  const me = S.me; let color = colorFor(me); let avatarData;
  const ini = (me.name || '?')[0].toUpperCase();
  const eqF = localStorage.getItem('epickast.equipped_frame') || me.frame;
  const fCls = eqF === 'founder_blue' ? ' frame-founder' : (eqF && eqF.startsWith('frame-') ? ' ' + eqF : '');
  const pv = h('div', { class: 'avatar' + fCls, style: `width:96px;height:96px;font-size:42px;background-color:${color}` }, ini);
  const showImg = (url) => { pv.style.backgroundImage = url ? `url(${url})` : ''; pv.classList.toggle('img', !!url); };
  if (me.av && avCache.get(`${me.id}:${me.av}`)) showImg(avCache.get(`${me.id}:${me.av}`));
  const file = h('input', { type: 'file', accept: 'image/*', class: 'hidden', onchange: () => {
    const f = file.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
        const s = Math.min(img.width, img.height);
        x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
        let out = c.toDataURL('image/webp', 0.82);
        if (out.length > 58000) out = c.toDataURL('image/webp', 0.62);
        if (out.length > 58000) out = c.toDataURL('image/jpeg', 0.65);
        avatarData = out;
        showImg(avatarData);
      };
      img.onerror = () => toast('Formato de imagen no compatible');
      img.src = reader.result;
    };
    reader.onerror = () => toast('No se pudo leer el archivo');
    reader.readAsDataURL(f);
  } });
  const sws = h('div', { class: 'swatches' }, PALETTE.map((c) => h('div', { class: 'sw' + (c === color ? ' sel' : ''), style: `background:${c}`, onclick: (e) => { color = c; pv.style.backgroundColor = c; sws.querySelectorAll('.sw').forEach((n) => n.classList.remove('sel')); e.target.classList.add('sel'); } })));
  
  // Cosméticos Desbloqueados de la Bóveda (Colores y Gradientes Prémium)
  let unlockedCosmeticColors = [];
  try {
    const rawVault = localStorage.getItem('epickast.dungeon.v1');
    if (rawVault) {
      const vData = JSON.parse(rawVault);
      const VAULT_COLORS = [
        { id: 'color_aurora', name: 'Aurora Boreal', val: 'linear-gradient(90deg, #00e5ff, #a855f7)' },
        { id: 'color_volcanic_flame', name: 'Fuego Volcánico', val: 'linear-gradient(90deg, #ff3366, #ffb300)' },
        { id: 'color_amber', name: 'Ámbar Volcánico', val: '#f59e0b' },
        { id: 'color_amethyst', name: 'Púrpura Amatista', val: '#a855f7' },
        { id: 'color_emerald', name: 'Verde Esmeralda', val: '#10b981' },
        { id: 'color_cyan', name: 'Cian Neón', val: '#06b6d4' },
        { id: 'color_magma', name: 'Rojo Magma', val: '#ef4444' }
      ];
      unlockedCosmeticColors = VAULT_COLORS.filter(vc => vData.cosmetics && vData.cosmetics[vc.id]);
    }
  } catch {}

  const vaultColorSwatches = unlockedCosmeticColors.length > 0 ? h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;' },
    unlockedCosmeticColors.map(vc => h('button', {
      style: `background:${vc.val};color:#fff;border:1.5px solid ${color === vc.val ? '#fff' : 'rgba(255,255,255,0.3)'};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3);text-shadow:0 1px 2px rgba(0,0,0,0.8);`,
      onclick: () => {
        color = vc.val;
        pv.style.backgroundColor = vc.val.startsWith('linear') ? '#1e293b' : vc.val;
        localStorage.setItem('epickast.equipped_color', vc.val);
        toast(`Color equipado: ${vc.name}`);
      }
    }, '★ ' + vc.name))
  ) : null;
  const BANNER_PRESETS = [
    { name: '💜 Púrpura Imperial', val: 'linear-gradient(135deg, #7c5cff, #4f46e5)' },
    { name: '🌊 Océano Cyan', val: 'linear-gradient(135deg, #06b6d4, #2563eb)' },
    { name: '🌲 Esmeralda Cyber', val: 'linear-gradient(135deg, #10b981, #047857)' },
    { name: '🔥 Carmesí Fuego', val: 'linear-gradient(135deg, #f43f5e, #9f1239)' },
    { name: '⚡ Ámbar Sunset', val: 'linear-gradient(135deg, #f59e0b, #b45309)' },
    { name: '🌑 Obsidiana Gamer', val: 'linear-gradient(135deg, #334155, #0f172a)' }
  ];
  let banner = me.banner || BANNER_PRESETS[0].val;
  const bannerPreview = h('div', { class: 'prof-banner', style: `background:${banner};margin-bottom:8px` });
  const bannerSelect = h('select', {
    onchange: (e) => {
      banner = e.target.value;
      bannerPreview.style.background = banner;
    }
  }, BANNER_PRESETS.map((b) => h('option', { value: b.val, selected: banner === b.val }, b.name)));
  const bio = h('input', { value: me.bio || '', maxlength: 120, placeholder: 'Estado o frase (opcional)' });
  const customAct = h('input', { value: settings.customActivity || '', maxlength: 60, placeholder: S.detectedGame ? `Detectado automáticamente: ${S.detectedGame}` : 'Ej. VALORANT, Minecraft, Diseñando en 3D… (vacío = automático)' });
  const autoChk = h('input', { type: 'checkbox', style: 'width:auto', checked: settings.autoGameDetect !== false });
  modal('Mi perfil y actividad',
    h('div', { class: 'prof' }, pv, h('div', { style: 'display:flex;flex-direction:column;gap:6px' }, h('button', { onclick: () => file.click() }, '📷 Subir foto'), h('button', { onclick: () => { avatarData = ''; showImg(null); } }, 'Quitar foto'), file)),
    h('label', null, 'Color del avatar y nombre (Paleta Base)', sws),
    vaultColorSwatches ? h('label', null, '✨ Colores y Gradientes Desbloqueados en la Bóveda', vaultColorSwatches) : null,
    h('label', null, 'Banner de perfil estilo Discord', bannerPreview, bannerSelect),
    h('label', null, 'Estado / Biografía', bio),
    h('label', null, '🎮 Actividad o juego mostrado a tus amigos', customAct),
    h('label', { style: 'flex-direction:row;align-items:center;gap:8px;color:var(--tx)' }, autoChk, 'Detectar automáticamente juegos abiertos en mi PC (sin afectar rendimiento)'),
    h('div', { style: 'font-size:11px;color:var(--mu);margin-top:-4px;line-height:1.4' }, '🔒 Sondeo pasivo local sin inyección DLL. Seguro para anticheats (VAC / EasyAntiCheat).'),
    h('div', { style: 'font-size:11px;color:var(--mu);margin-top:-4px;line-height:1.4' }, '🔒 Sondeo pasivo local sin inyección DLL. Seguro para anticheats (VAC / EasyAntiCheat).'),
    h('button', { class: 'primary', onclick: async () => {
      settings.customActivity = customAct.value.trim();
      settings.autoGameDetect = autoChk.checked;
      saveSettings();
      S.lastSentActivity = '__force__';
      await syncActivity();
      await safe(rpc('profile.set', { color, banner, bio: bio.value, avatar: avatarData }));
      closeModal();
      toast('Perfil y actividad actualizados');
    } }, 'Guardar'));
}


// ---------- Protocolo de Diagnóstico y Reporte de Errores ----------
const recentErrors = [];
window.addEventListener('error', (e) => {
  recentErrors.push({ ts: new Date().toISOString(), type: 'JS_ERROR', msg: e.message || 'Error desconocido' });
  if (recentErrors.length > 10) recentErrors.shift();
});
window.addEventListener('unhandledrejection', (e) => {
  recentErrors.push({ ts: new Date().toISOString(), type: 'PROMISE_ERROR', msg: String(e.reason || 'Rechazo asíncrono') });
  if (recentErrors.length > 10) recentErrors.shift();
});

async function copyDiagnosticReport() {
  const lastErr = recentErrors[recentErrors.length - 1];
  let errCode = 'ERR_OK_SISTEMA_ESTABLE';
  if (lastErr) {
    const m = (lastErr.msg || '').toLowerCase();
    if (m.includes('update') || m.includes('descarga') || m.includes('install')) errCode = 'ERR_UPD_002';
    else if (m.includes('webrtc') || m.includes('ice') || m.includes('peer') || m.includes('sdp')) errCode = 'ERR_RTC_001';
    else if (m.includes('audio') || m.includes('mic') || m.includes('camera') || m.includes('device')) errCode = 'ERR_DEV_001';
    else if (m.includes('websocket') || m.includes('connect') || m.includes('token') || m.includes('resume')) errCode = 'ERR_NET_001';
    else errCode = 'ERR_APP_GENERAL';
  }
  
  let pingText = 'No conectado a voz';
  if (S.call) {
    try {
      const p = await S.call.pingSummary();
      if (p?.rtt != null) pingText = `${p.rtt} ms (Pérdida: ${p.loss || 0}%)`;
    } catch {}
  } else if (S.ws?.readyState === 1) {
    pingText = 'Servidor en línea (Sin llamada activa)';
  } else {
    pingText = 'Desconectado del servidor';
  }

  const lines = [
    '========================================',
    '   📋 REPORTE DE DIAGNÓSTICO EPICKAST',
    '========================================',
    `Fecha: ${new Date().toLocaleString()}`,
    `Versión App: v${S.appVer || '1.5.9'}`,
    `Código de Error: ${errCode}`,
    `Usuario: ${S.me?.name || 'No autenticado'} (ID: ${S.me?.id || '-'})`,
    `Servidor: ${settings.server || 'No configurado'}`,
    `Estado de Conexión: ${pingText}`,
    `Llamada Activa: ${S.call ? (S.callLabel || 'En llamada') : 'Ninguna'}`,
    `Dispositivos:`,
    ` - Micrófono ID: ${settings.mic || 'Predeterminado'}`,
    ` - Altavoz ID: ${settings.spk || 'Predeterminado'}`,
    ` - Cámara ID: ${settings.cam || 'Predeterminado'}`,
    ` - Supresión Ruido: ${settings.noise}`,
    ` - Puerta de Voz: ${Math.round(((settings.voiceGate ?? 0.006) / 0.06) * 100)}%`,
    `Últimos Registros de Error:`,
    recentErrors.length > 0
      ? recentErrors.map((r) => ` • [${r.ts.slice(11, 19)}] [${r.type}] ${r.msg}`).join('\n')
      : ' • Sin errores registrados durante esta sesión.',
    '========================================',
    'Envía este bloque al canal #soporte o al administrador.'
  ];

  const reportText = lines.join('\n');
  try {
    await navigator.clipboard.writeText(reportText);
    toast('📋 Reporte de diagnóstico copiado al portapapeles. Pégalo en soporte.');
  } catch {
    prompt('Copia tu reporte de diagnóstico:', reportText);
  }
}

async function modalDiagnostics() {
  let devs = [];
  try { devs = await navigator.mediaDevices.enumerateDevices(); } catch {}

  let curMicId = settings.mic || '';
  let curSpkId = settings.spk || '';
  let curCamId = settings.cam || '';
  let curRes = settings.camPreset || '720p30';
  let curGate = settings.voiceGate ?? 0.006;

  let micStream = null, audioCtx = null, analyser = null;
  let camStream = null;
  let rafId = null;

  const micSel = h('select', { onchange: () => { curMicId = micSel.value; initMic(); } },
    h('option', { value: '' }, 'Micrófono predeterminado'),
    devs.filter((d) => d.kind === 'audioinput').map((d, i) => h('option', { value: d.deviceId, selected: curMicId === d.deviceId }, d.label || `Micrófono ${i + 1}`))
  );

  const meterBar = h('div', { style: 'height:100%;width:0%;background:linear-gradient(90deg,#10b981,#fbbf24,#ef4444);border-radius:4px;transition:width .06s' });
  const meterWrap = h('div', { class: 'meter', style: 'flex:1;height:12px;background:#141722;border-radius:6px;overflow:hidden;position:relative' }, meterBar);
  const statusBadge = h('span', { style: 'font-size:11.5px;color:var(--mu);min-width:115px' }, '⚪ En silencio');

  const gateLabel = h('span', { style: 'font-size:11.5px;color:#c4b5fd;font-weight:600' }, `${Math.round((curGate / 0.06) * 100)}%`);
  const gateSlider = h('input', { type: 'range', min: 0, max: 0.06, step: 0.002, value: curGate, oninput: () => {
    curGate = Number(gateSlider.value);
    gateLabel.textContent = `${Math.round((curGate / 0.06) * 100)}%`;
  } });

  const calBtn = h('button', { style: 'font-size:12px;padding:6px 12px;border-radius:8px' }, '🎯 Calibrar Ruido Ambiente (2s)');
  calBtn.onclick = () => {
    calBtn.disabled = true;
    calBtn.textContent = '🤫 Silencio por favor... (2s)';
    let maxAmbient = 0;
    const start = performance.now();
    const poll = () => {
      if (!analyser) return;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      if (rms > maxAmbient) maxAmbient = rms;
      if (performance.now() - start < 2000) {
        requestAnimationFrame(poll);
      } else {
        const recommended = Math.max(0.004, Math.min(0.04, maxAmbient * 1.4));
        curGate = Math.round(recommended * 1000) / 1000;
        gateSlider.value = curGate;
        gateLabel.textContent = `${Math.round((curGate / 0.06) * 100)}%`;
        calBtn.disabled = false;
        calBtn.textContent = '✅ Calibrado';
        toast(`Filtro ajustado a tu entorno: ${Math.round((curGate / 0.06) * 100)}%`);
      }
    };
    poll();
  };

  const recBtn = h('button', { style: 'font-size:12px;padding:6px 12px;border-radius:8px' }, '🔴 Grabar y escuchar mi voz (3s)');
  recBtn.onclick = async () => {
    if (!micStream) return;
    recBtn.disabled = true;
    recBtn.textContent = '🎙️ Habla ahora (3s)...';
    try {
      const rec = new MediaRecorder(micStream);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        recBtn.textContent = '🔊 Reproduciendo tu voz...';
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const audio = new Audio(URL.createObjectURL(blob));
        if (curSpkId && audio.setSinkId) audio.setSinkId(curSpkId).catch(() => {});
        audio.onended = () => {
          recBtn.disabled = false;
          recBtn.textContent = '🔴 Grabar y escuchar mi voz (3s)';
        };
        audio.play().catch(() => { recBtn.disabled = false; recBtn.textContent = '🔴 Grabar y escuchar mi voz (3s)'; });
      };
      rec.start();
      setTimeout(() => rec.stop(), 3000);
    } catch {
      recBtn.disabled = false;
      recBtn.textContent = '🔴 Grabar y escuchar mi voz (3s)';
    }
  };

  const spkSel = h('select', { onchange: () => { curSpkId = spkSel.value; } },
    h('option', { value: '' }, 'Altavoces predeterminados'),
    devs.filter((d) => d.kind === 'audiooutput').map((d, i) => h('option', { value: d.deviceId, selected: curSpkId === d.deviceId }, d.label || `Altavoz ${i + 1}`))
  );
  const toneBtn = h('button', { style: 'font-size:12px;padding:6px 12px;border-radius:8px' }, '🔔 Probar altavoces');
  toneBtn.onclick = () => {
    ringer.beep([523, 659, 784, 1046]);
    toast('Reproduciendo tono de prueba en altavoces...');
  };

  const camSel = h('select', { onchange: () => { curCamId = camSel.value; initCam(); } },
    h('option', { value: '' }, 'Cámara predeterminada'),
    devs.filter((d) => d.kind === 'videoinput').map((d, i) => h('option', { value: d.deviceId, selected: curCamId === d.deviceId }, d.label || `Cámara ${i + 1}`))
  );
  const resSel = h('select', { onchange: () => { curRes = resSel.value; initCam(); } },
    [['720p30', 'HD 720p (30 FPS - Fluido y ligero)'], ['1080p30', 'Full HD 1080p (30 FPS - Alta definición)']].map(([k, t]) => h('option', { value: k, selected: curRes === k }, t))
  );

  const camPreview = h('video', {
    autoplay: true,
    playsinline: true,
    muted: true,
    style: 'width:100%;height:160px;background:#06080d;border-radius:10px;border:1px solid rgba(255,255,255,0.1);object-fit:contain'
  });

  async function initMic() {
    try {
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(rafId);
      const constraints = {
        audio: curMicId ? { deviceId: { exact: curMicId } } : true,
        video: false
      };
      micStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const src = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);

      const loop = () => {
        if (!analyser) return;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        meterBar.style.width = Math.min(100, Math.round(rms * 280)) + '%';
        if (rms > curGate) {
          statusBadge.textContent = `🟢 Hablando (${Math.round(rms * 100)}%)`;
          statusBadge.style.color = '#34d399';
        } else {
          statusBadge.textContent = '⚪ En silencio';
          statusBadge.style.color = 'var(--mu)';
        }
        rafId = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      statusBadge.textContent = '⚠️ Error de micrófono';
    }
  }

  async function initCam() {
    try {
      if (camStream) camStream.getTracks().forEach((t) => t.stop());
      const pr = CAM_PRESETS[curRes] || CAM_PRESETS['720p30'];
      const constraints = {
        video: {
          deviceId: curCamId ? { exact: curCamId } : undefined,
          width: { ideal: pr.w },
          height: { ideal: pr.h },
          frameRate: { ideal: pr.fps }
        },
        audio: false
      };
      camStream = await navigator.mediaDevices.getUserMedia(constraints);
      camPreview.srcObject = camStream;
    } catch {
      camPreview.srcObject = null;
    }
  }

  initMic();
  initCam();

  const cleanup = () => {
    cancelAnimationFrame(rafId);
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    if (camStream) camStream.getTracks().forEach((t) => t.stop());
    try { audioCtx?.close(); } catch {}
  };
  S.cleanup.push(cleanup);

  const saveBtn = h('button', {
    class: 'primary',
    style: 'padding:11px 16px;font-size:13.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;margin-top:8px',
    onclick: async () => {
      settings.mic = curMicId;
      settings.spk = curSpkId;
      settings.cam = curCamId;
      settings.camPreset = curRes;
      settings.voiceGate = curGate;
      saveSettings();
      cleanup();
      closeModal();

      if (S.call) {
        if (settings.spk) S.call.setSinkId?.(settings.spk);
        if (S.call.mic) S.call.mic.setGate?.(settings.voiceGate);
      }
      toast('✅ ¡Diagnóstico completado! Todos tus ajustes han sido guardados.');
    }
  }, '✅ Guardar y Finalizar Diagnóstico');

  const content = h('div', { style: 'display:flex;flex-direction:column;gap:12px;max-height:76vh;overflow-y:auto;padding-right:4px' },
    h('div', { style: 'font-size:12px;color:var(--mu);margin-bottom:-4px' },
      'Verifica tus periféricos una sola vez. Tus opciones se quedarán guardadas permanentemente para todas tus llamadas.'
    ),
    h('div', { class: 'sect' }, '1. Micrófono y Puerta de Voz'),
    h('label', null, 'Dispositivo de Entrada', micSel),
    h('div', { style: 'display:flex;align-items:center;gap:10px;margin-top:2px' }, meterWrap, statusBadge),
    h('label', null, h('span', null, 'Filtro Anti-Respiración (Puerta de Voz): ', gateLabel), gateSlider),
    h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, calBtn, recBtn),

    h('div', { class: 'sect', style: 'margin-top:6px' }, '2. Altavoces y Salida'),
    h('label', null, 'Dispositivo de Salida', spkSel),
    h('div', null, toneBtn),

    h('div', { class: 'sect', style: 'margin-top:6px' }, '3. Cámara de Video'),
    h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px' },
      h('label', null, 'Cámara', camSel),
      h('label', null, 'Calidad', resSel)
    ),
    camPreview,

    saveBtn,
    h('button', { style: 'margin-top:6px;width:100%;padding:9px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);border-radius:10px;font-weight:700;font-size:12px;color:#fff;cursor:pointer', onclick: () => copyDiagnosticReport() }, '📋 Copiar Reporte de Diagnóstico y Error (para Soporte)')
  );

  modal('Diagnóstico y Calibración de Audio y Video', content);
}

async function modalSettings() {
  let devs = []; try { devs = await navigator.mediaDevices.enumerateDevices(); } catch {}
  const sel = (kind, key) => {
    const s = h('select', { onchange: () => {
      settings[key] = s.value;
      saveSettings();
      if (key === 'spk') {
        mic?.setSinkId?.(settings.spk);
        S.call?.setSinkId?.(settings.spk);
        tiles.forEach((t) => {
          if (t.video && t.video.setSinkId && t.sink !== settings.spk) {
            t.sink = settings.spk;
            t.video.setSinkId(settings.spk).catch(() => {});
          }
        });
      }
    } }, h('option', { value: '' }, 'Predeterminado'), devs.filter((d) => d.kind === kind).map((d, i) => h('option', { value: d.deviceId, selected: settings[key] === d.deviceId }, d.label || `Dispositivo ${i + 1}`)));
    return s;
  };
  const preset = (key, obj) => { const s = h('select', { onchange: () => { settings[key] = s.value; saveSettings(); S.call?.retune(); } }, Object.keys(obj).map((k) => h('option', { value: k, selected: settings[key] === k }, k))); return s; };
  const chk = (key, text, after) => h('label', { style: 'flex-direction:row;align-items:center;gap:8px;color:var(--tx);cursor:pointer' }, h('input', { type: 'checkbox', style: 'width:16px;height:16px;cursor:pointer;accent-color:var(--ac)', checked: !!settings[key], onchange: (e) => { settings[key] = e.target.checked; saveSettings(); after?.(); } }), text);
  const acc = (icon, title, desc, ...children) => {
    const summary = h('summary', null,
      h('div', null,
        h('div', { class: 'acc-title' }, `${icon} ${title}`),
        desc ? h('div', { class: 'acc-desc' }, desc) : null
      ),
      h('span', { class: 'acc-arrow' }, '▸')
    );
    const body = h('div', { class: 'acc-body' }, ...children);
    return h('details', { class: 'settings-acc' }, summary, body);
  };
  const noiseSel = h('select', { onchange: () => { settings.noise = noiseSel.value; saveSettings(); if (mic && ownMic) startTest(); else hint.textContent = 'Se aplicará en la próxima llamada.'; } },
    [['high', 'Alta — RNNoise + Filtro 115 Hz + Anti-Respiración (recomendada)'], ['std', 'Estándar — Chromium'], ['off', 'Desactivada']].map(([v, t]) => h('option', { value: v, selected: settings.noise === v }, t)));
  const audioQSel = h('select', { onchange: () => { settings.audioKbps = Number(audioQSel.value); saveSettings(); S.call?.peers.forEach((p) => p.senders.mic && S.call.tuneAudio(p.senders.mic)); } },
    [[64, 'Voz Clara (64 kbps)'], [96, 'Voz HD (96 kbps — recomendada)'], [128, 'Estudio / Música (128 kbps)']].map(([v, t]) => h('option', { value: v, selected: Number(settings.audioKbps) === v }, t)));
  const micGainLbl = h('span', null, `${Math.round((settings.micGain || 1) * 100)}%`);
  const micGainInput = h('input', { type: 'range', min: 0.5, max: 2, step: 0.05, value: settings.micGain || 1, oninput: () => {
    settings.micGain = Number(micGainInput.value); saveSettings();
    micGainLbl.textContent = `${Math.round(settings.micGain * 100)}%`;
    S.call?.mic?.setGain?.(settings.micGain);
    mic?.setGain?.(settings.micGain);
  } });
  const gatePct = (v) => (v <= 0.002 ? 'Desactivada (0%)' : `${Math.round((v / 0.06) * 100)}%`);
  const gateLbl = h('span', null, gatePct(settings.voiceGate ?? 0.006));
  const gateInput = h('input', { type: 'range', min: 0, max: 0.06, step: 0.002, value: settings.voiceGate ?? 0.006, oninput: () => {
    settings.voiceGate = Number(gateInput.value); saveSettings();
    gateLbl.textContent = gatePct(settings.voiceGate);
    S.call?.mic?.setGate?.(settings.voiceGate);
    mic?.setGate?.(settings.voiceGate);
  } });
  const hint = h('div', { class: 'hint' }, 'Incluye filtro paso-alto (115 Hz), recorte nasal (180 Hz), RNNoise y puerta de voz anti-respiración para silenciar suspiros y aire entre palabras.');
  let mic = null, raf = 0, ownMic = false;
  const bar = h('div');
  const meterStatus = h('span', { style: 'font-size:11px;color:var(--mu);margin-left:8px' }, '⚪ Micrófono inactivo');
  const meter = h('div', { style: 'display:flex;align-items:center;gap:8px;width:100%' }, h('div', { class: 'meter', style: 'flex:1' }, bar), meterStatus);
  const mon = h('input', { type: 'checkbox', style: 'width:auto', checked: true, onchange: () => mic?.monitor(mon.checked) });
  const testBtn = h('button', { onclick: () => (mic ? stopTest() : startTest()) }, '🎙 Probar micrófono');
  const stopTest = () => {
    cancelAnimationFrame(raf);
    if (mic) {
      mic.monitor(false);
      if (ownMic) mic.dispose();
      mic = null;
    }
    bar.style.width = '0%';
    meterStatus.textContent = '⚪ Micrófono inactivo';
    meterStatus.style.color = 'var(--mu)';
    testBtn.textContent = '🎙 Probar micrófono';
  };
  const startTest = async () => {
    stopTest();
    meterStatus.textContent = '⌛ Conectando micrófono...';
    if (S.call?.mic) {
      mic = S.call.mic;
      ownMic = false;
    } else {
      try {
        mic = await createMic(settings);
        ownMic = true;
      } catch (e) {
        meterStatus.textContent = '❌ Error al abrir micrófono';
        meterStatus.style.color = 'var(--re)';
        return toast('No se pudo abrir el micrófono: ' + (e.message || e.name || 'Permiso denegado'));
      }
    }
    mic.monitor(mon.checked);
    testBtn.textContent = '⏹ Detener prueba';
    hint.textContent = `Supresión activa: ${{ high: 'RNNoise + Puerta Anti-Respiración', std: 'estándar', off: 'ninguna' }[mic.mode] || 'estándar'}. Habla al micrófono para verificar la barra verde y escucharte.`;
    const loop = () => {
      if (!mic) return;
      const raw = mic.rawLevel ? mic.rawLevel() : 0;
      const proc = mic.level ? mic.level() : 0;
      const lv = Math.max(raw, proc);
      bar.style.width = Math.min(100, Math.round(lv * 220)) + '%';
      if (lv > 0.02) {
        meterStatus.textContent = `🟢 Hablando (${Math.round(lv * 100)}%)`;
        meterStatus.style.color = 'var(--gr)';
      } else {
        meterStatus.textContent = '⚪ En silencio';
        meterStatus.style.color = 'var(--mu)';
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
  };
  S.cleanup.push(stopTest);
  const swA = h('div', { class: 'swatches' }, PALETTE.map((c) => h('div', { class: 'sw' + (c === settings.accent ? ' sel' : ''), style: `background:${c}`, onclick: (e) => { settings.accent = c; saveSettings(); applyAccent(); swA.querySelectorAll('.sw').forEach((n) => n.classList.remove('sel')); e.target.classList.add('sel'); } })));
  const vol = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: settings.ringVol, onchange: () => { settings.ringVol = Number(vol.value); saveSettings(); ringer.start('in'); setTimeout(() => ringer.stop(), 1200); } });
  const dlLink = httpBase() + '/download/latest';

  const testSpkBtn = h('button', {
    style: 'padding:5px 12px;border-radius:8px;font-weight:700;font-size:11.5px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;cursor:pointer',
    onclick: () => {
      ringer.start('in');
      setTimeout(() => ringer.stop(), 900);
      toast('🔊 Reproduciendo tono de prueba en altavoces...');
    }
  }, '🔔 Probar');

  const diagBtn = h('button', {
    class: 'primary',
    style: 'display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 14px;font-size:13px;font-weight:700;border-radius:10px;margin-bottom:6px;background:linear-gradient(135deg,rgba(124,92,255,0.95),rgba(99,102,241,0.95));color:#fff;border:0;cursor:pointer',
    onclick: () => {
      closeModal();
      modalDiagnostics();
    }
  }, '🎯 Diagnóstico y Calibración Rápida de Audio y Video');

  // Tarjeta 1: Micrófono (lo esencial para saber si se escucha)
  const micCard = h('div', { class: 'settings-card' },
    h('div', { class: 'settings-card-title' },
      h('span', null, '🎙️ Micrófono de entrada'),
      testBtn
    ),
    sel('audioinput', 'mic'),
    meter,
    h('label', { style: 'flex-direction:row;align-items:center;gap:8px;font-size:12px;color:var(--tx);cursor:pointer;margin-top:2px' }, mon, 'Escucharme en audífonos durante la prueba')
  );

  // Tarjeta 2: Altavoces / Auriculares
  const spkCard = h('div', { class: 'settings-card' },
    h('div', { class: 'settings-card-title' },
      h('span', null, '🔊 Altavoces / Auriculares'),
      testSpkBtn
    ),
    sel('audiooutput', 'spk')
  );

  // Tarjeta 3: Cámara
  const camCard = h('div', { class: 'settings-card' },
    h('div', { class: 'settings-card-title' }, '📷 Cámara Web'),
    sel('videoinput', 'cam')
  );

  // Tarjeta 4: Modo de transmisión
  const modeCard = h('div', { class: 'settings-card' },
    h('div', { class: 'settings-card-title' }, '🗣️ Modo de Transmisión de Voz'),
    h('select', { onchange: (e) => {
      settings.voiceMode = e.target.value;
      saveSettings();
      if (S.call) {
        if (settings.voiceMode === 'ptt') S.call.setMuted(true);
        else S.call.setMuted(false);
        updateDock();
      }
      closeModal();
      modalSettings();
    } },
      h('option', { value: 'vad', selected: settings.voiceMode !== 'ptt' }, 'Activación continua / por voz (VAD)'),
      h('option', { value: 'ptt', selected: settings.voiceMode === 'ptt' }, 'Pulsar para hablar (Push-to-Talk / PTT)')
    ),
    settings.voiceMode === 'ptt' ? h('div', { style: 'background:rgba(124,92,255,0.08);border:1px solid rgba(124,92,255,0.25);border-radius:10px;padding:10px 12px;margin:4px 0 2px;display:flex;flex-direction:column;gap:8px' },
      h('div', { style: 'font-weight:700;font-size:12px;color:#c4b5fd' }, '🎙️ Configuración de Pulsar para Hablar (PTT)'),
      h('div', { style: 'display:flex;gap:8px;align-items:center' },
        h('button', {
          style: 'padding:7px 14px;border-radius:8px;font-weight:700;background:var(--ac);color:#fff;border:0;cursor:pointer',
          onclick: (e) => {
            const btn = e.target;
            btn.textContent = '⌨️ Presiona cualquier tecla...';
            const handler = (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              let keyName = ev.key;
              if (ev.code === 'Space') keyName = ' ';
              settings.pttKey = keyName;
              saveSettings();
              btn.textContent = `Tecla asignada: [ ${settings.pttKey === ' ' ? 'Barra Espaciadora' : settings.pttKey} ]`;
              toast(`Tecla PTT guardada: ${settings.pttKey === ' ' ? 'Espacio' : settings.pttKey}`);
              window.removeEventListener('keydown', handler, true);
            };
            window.addEventListener('keydown', handler, true);
          }
        }, `Tecla asignada: [ ${settings.pttKey === ' ' ? 'Barra Espaciadora' : (settings.pttKey || 'Control')} ]`),
        h('span', { style: 'font-size:11.5px;color:var(--mu)' }, '(Haz clic y presiona la tecla que quieras)')
      ),
      chk('pttCue', 'Reproducir bip sonoro al activar y soltar el micrófono')
    ) : null
  );

  // Acordeón 1: Ajustes avanzados de voz
  const accAudio = acc('🎛️', 'Ajustes Avanzados de Micrófono y Supresión de Ruido', 'Sensibilidad, volumen, puerta de voz y calidad de llamada',
    h('label', null, h('span', null, 'Volumen del micrófono: ', micGainLbl), micGainInput),
    h('label', null, h('span', null, '🌬️ Filtro Anti-Respiración (Puerta de Voz): ', gateLbl), gateInput),
    h('label', null, 'Supresión de ruido por IA', noiseSel),
    hint,
    h('label', null, 'Calidad de audio en llamada', audioQSel)
  );

  // Acordeón 2: Video y Pantalla
  const accVideo = acc('🖥️', 'Video y Pantalla Compartida', 'Resolución, FPS, aceleración gráfica y modo juego',
    h('label', null, 'Calidad de cámara', preset('camPreset', CAM_PRESETS)),
    h('label', null, 'Calidad de pantalla', preset('screenPreset', SCREEN_PRESETS)),
    chk('screenAudio', 'Compartir audio del sistema por defecto (usa audífonos para evitar eco)'),
    chk('hwPrefer', 'Preferir compresión H.264 por hardware (NVIDIA, AMD o Intel)'),
    chk('disableGpu', 'Deshabilitar aceleración por hardware (soluciona pantallas negras al compartir)', async () => {
      await window.epic.setConfig?.({ disableGpu: settings.disableGpu });
      if (confirm(settings.disableGpu
        ? 'Aceleración por hardware desactivada.\n\n¿Deseas reiniciar EpicKast ahora para aplicar el cambio y evitar pantallas negras al compartir?'
        : 'Aceleración por hardware activada.\n\n¿Deseas reiniciar EpicKast ahora?')) {
        window.epic.relaunch?.();
      }
    }),
    chk('gameMode', '🎮 Modo Juego por defecto (prioriza 100% de FPS y Ping del juego)', () => {
      if (S.call) S.call.setGameMode(settings.gameMode);
      S.gameMode = settings.gameMode;
      updateDock();
    }),
    h('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:4px' },
      h('button', {
        style: 'flex:1;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);font-weight:600;font-size:12px;cursor:pointer',
        onclick: () => toggleOverlay()
      }, '🎮 Abrir Overlay Gamer'),
      h('button', {
        style: 'flex:1;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);font-weight:600;font-size:12px;cursor:pointer',
        onclick: () => { closeModal(); modalSoundboard(); }
      }, '🔊 Abrir Soundboard')
    )
  );

  // Acordeón 3: Atajos
  const accShortcuts = acc('⌨️', 'Atajos de Teclado Globales y Navegación', 'Combinaciones de teclas activas dentro y fuera de juegos',
    h('div', { style: 'font-size:12px;color:var(--mu);margin-bottom:6px;font-weight:600' }, '🎮 Atajos Globales (in-game / pantalla completa):'),
    h('label', null, 'Silenciar / Activar micrófono (Alt + M)',
      h('input', { value: settings.keyMute || 'Alt+M', placeholder: 'Ej. Alt+M', onchange: (e) => { settings.keyMute = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de micrófono actualizado'); } })),
    h('label', null, 'Silenciar / Activar audio / Deafen (Alt + D)',
      h('input', { value: settings.keyDeaf || 'Alt+D', placeholder: 'Ej. Alt+D', onchange: (e) => { settings.keyDeaf = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de audio actualizado'); } })),
    h('label', null, 'Alternar Overlay Gamer sobre juego (Alt + O)',
      h('input', { value: settings.keyOverlay || 'Alt+O', placeholder: 'Ej. Alt+O', onchange: (e) => { settings.keyOverlay = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de overlay actualizado'); } })),
    h('label', null, 'Alternar Modo Flotante / PiP (Alt + P)',
      h('input', { value: settings.keyPip || 'Alt+P', placeholder: 'Ej. Alt+P', onchange: (e) => { settings.keyPip = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de modo flotante actualizado'); } })),
    h('label', null, 'Compartir / Detener pantalla (Alt + S)',
      h('input', { value: settings.keyScreen || 'Alt+S', placeholder: 'Ej. Alt+S', onchange: (e) => { settings.keyScreen = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de pantalla compartido actualizado'); } })),
    h('label', null, 'Colgar llamada de voz (Alt + Q)',
      h('input', { value: settings.keyHang || 'Alt+Q', placeholder: 'Ej. Alt+Q', onchange: (e) => { settings.keyHang = e.target.value.trim(); saveSettings(); applyShortcuts(); toast('Atajo de colgar actualizado'); } })),
    h('div', { style: 'margin-top:12px;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:8px;font-size:11.5px;color:var(--mu);line-height:1.6' },
      h('b', { style: 'color:var(--tx);display:block;margin-bottom:4px' }, '⚡ Atajos de Navegación Rápida en la app:'),
      '• ', h('code', { style: 'background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;color:#fff' }, 'Ctrl + ,'), ' — Abrir / Cerrar Ajustes', h('br'),
      '• ', h('code', { style: 'background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;color:#fff' }, 'Ctrl + 0'), ' — Volver a Inicio / Amigos', h('br'),
      '• ', h('code', { style: 'background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;color:#fff' }, 'Ctrl + 1..9'), ' — Cambiar directamente a servidor', h('br'),
      '• ', h('code', { style: 'background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;color:#fff' }, '↑ Flecha Arriba'), ' en el chat vacío — Editar tu último mensaje'
    )
  );

  const THEMES = [
    { id: 'dark', name: '🌌 Oscuro EpicKast (Predeterminado)' },
    { id: 'amoled', name: '🖤 Negro Puro AMOLED (Ultra Contraste)' },
    { id: 'midnight', name: '🌃 Azul Medianoche (Navy Deep)' },
    { id: 'emerald', name: '🌲 Esmeralda Cyberpunk (Dark Forest)' },
    { id: 'crimson', name: '🍷 Carmesí Velvet (Rojo Vino Oscuro)' },
    { id: 'cyberpunk', name: '🔮 Neón Synthwave (Violeta Cyberpunk)' }
  ];
  const themeSel = h('select', {
    onchange: (e) => {
      settings.theme = e.target.value;
      saveSettings();
      applyTheme(settings.theme);
      toast(`Tema aplicado: ${THEMES.find((t) => t.id === settings.theme)?.name || settings.theme}`);
    }
  }, THEMES.map((t) => h('option', { value: t.id, selected: (settings.theme || 'dark') === t.id }, t.name)));

  // Acordeón 4: Apariencia y Notificaciones
  const accVisual = acc('🎨', 'Apariencia y Notificaciones', 'Temas de fondo (0% de CPU/GPU), colores de acento y avisos',
    h('label', null, 'Tema de fondo (0% de impacto en rendimiento)', themeSel),
    h('label', null, 'Color de acento', swA),
    h('label', null, 'Volumen del timbre', vol),
    chk('dnd', 'Modo No molestar (silenciar timbre y avisos)'),
    chk('stats', 'Mostrar estadísticas de red (CPU, RAM y Ping en vivo)', updateStatTimer)
  );

  // Acordeón 5: Conexión y Cuenta
  const accAccount = acc('🌐', 'Servidor y Cuenta', 'Servidor activo, enlace de descarga para amigos y sesión',
    h('label', null, 'Servidor conectado', h('input', { value: settings.server, onchange: (e) => { settings.server = normUrl(e.target.value); saveSettings(); toast('Se aplicará al volver a iniciar sesión'); } })),
    h('label', null, '📦 Enlace de descarga para amigos (clic para copiar)',
      h('input', { value: dlLink, readonly: true, onclick: (e) => { e.target.select(); navigator.clipboard?.writeText(dlLink); toast('Enlace de descarga copiado'); } })),
    h('button', { style: 'margin-top:6px;padding:9px 12px;font-weight:700;font-size:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);border-radius:8px;color:#fff;cursor:pointer', onclick: () => copyDiagnosticReport() }, '📋 Copiar Reporte de Diagnóstico y Error'),
    h('button', { class: 'danger', style: 'margin-top:6px', onclick: async () => { localStorage.removeItem('epickast.token'); await window.epic.saveAuth?.(null).catch(() => {}); location.reload(); } }, 'Cerrar sesión')
  );

  // Acordeón 6: Acerca de EpicKast
  const accAbout = acc('ℹ️', 'Acerca de EpicKast', `Versión v${S.appVer || '1.8.1'} · Desarrollado por EpicKap`,
    h('div', { style: 'font-size:12px;color:var(--mu);line-height:1.6;display:flex;flex-direction:column;gap:6px' },
      h('div', null, h('b', { style: 'color:var(--tx)' }, 'EpicKast Comunicación Ultraligera')),
      h('div', null, 'Versión de la aplicación: ', h('code', { style: 'background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;color:#fff' }, `v${S.appVer || '1.8.1'}`)),
      h('div', null, 'Arquitectura WebRTC P2P directo y servidor en la nube de baja latencia.'),
      h('div', { style: 'font-size:11px;opacity:0.75' }, '© 2026 EpicKap Group. Todos los derechos reservados.')
    )
  );

  modal(`Ajustes · EpicKast v${S.appVer}`,
    diagBtn,
    micCard,
    spkCard,
    camCard,
    modeCard,
    accAudio,
    accVideo,
    accShortcuts,
    accVisual,
    accAccount,
    accAbout
  );
}

// ---------- llamadas entrantes / salientes ----------
const friendByDm = (key) => S.friends.friends.find((f) => f.dm === key);
function showIncoming(m) {
  if (S.callKey === m.key) return;
  S.incoming = { key: m.key, from: m.from }; ringer.start('in'); renderCallOverlay();
  if (!settings.dnd) { window.epic.flash(); if (!document.hasFocus()) try { new Notification(`${m.from.name} te está llamando`, { body: 'Abre EpicKast para contestar', silent: true }); } catch {} }
}
function clearIncoming() { S.incoming = null; if (!S.outgoing) ringer.stop(); renderCallOverlay(); }
function clearOutgoing() { S.outgoing = null; if (!S.incoming) ringer.stop(); renderCallOverlay(); }
function onCallStop(m) {
  if (S.incoming?.key === m.key) {
    const who = S.incoming.from.name; clearIncoming();
    if (m.reason === 'missed') toast(`Llamada perdida de ${who}`); else if (m.reason === 'cancelled') toast(`${who} canceló la llamada`);
  }
  if (S.outgoing?.key === m.key) {
    const who = S.outgoing.name; clearOutgoing();
    if (m.reason === 'declined') { toast(`${who} rechazó la llamada`); leaveCall(false); }
    else if (m.reason === 'missed') { toast(`${who} no contestó`); leaveCall(false); }
  }
}
async function answerIncoming() {
  const inc = S.incoming; if (!inc) return; clearIncoming();
  S.view = { kind: 'home', sid: null }; await openChannel(inc.key, 'dm', inc.from.name);
  joinCall(inc.key, inc.from.name);
}
function declineIncoming() { const inc = S.incoming; if (!inc) return; sendRaw('call.decline', { key: inc.key }); clearIncoming(); }
function renderCallOverlay() {
  const o = $('callOverlay');
  const info = S.incoming ? { u: S.incoming.from } : S.outgoing ? { u: friendByDm(S.outgoing.key) || { id: 0, name: S.outgoing.name } } : null;
  if (!info) { o.classList.add('hidden'); o.replaceChildren(); return; }
  o.classList.remove('hidden');
  if (S.incoming) {
    o.replaceChildren(h('div', { class: 'callcard' }, h('div', { class: 'pulse' }, avatar(info.u, 110)), h('h2', null, info.u.name), h('p', null, 'te está llamando…'),
      S.callKey ? h('p', { class: 'hint' }, 'Si contestas, saldrás de tu llamada actual') : null,
      h('div', { class: 'btns' }, h('button', { class: 'big btn-call', onclick: answerIncoming }, h('i', null, '📞'), 'Contestar'), h('button', { class: 'big btn-bad', onclick: declineIncoming }, h('i', null, '📵'), 'Rechazar'))));
  } else {
    o.replaceChildren(h('div', { class: 'callcard' }, h('div', { class: 'pulse' }, avatar(info.u, 110)), h('h2', null, info.u.name), h('p', null, 'Llamando…'),
      h('div', { class: 'btns' }, h('button', { class: 'big btn-bad', onclick: () => leaveCall(false) }, h('i', null, '📵'), 'Cancelar'))));
  }
}

// ---------- llamada ----------
async function joinCall(key, label) {
  if (S.callKey === key) { if (S.stageCollapsed) toggleStageCollapse(false); return; }
  if (S.incoming?.key === key) clearIncoming();
  leaveCall(false);
  const call = new Call({
    send: sendRaw,
    myId: S.me.id,
    settings,
    ice: S.ice,
    onChange: () => { renderStage(); syncOverlay(); },
    onSpeaking: (id, v, lv = 0) => {
      const k = id === 'me' ? 'me' : `p${id}`;
      document.querySelector(`[data-tile="${k}"]`)?.classList.toggle('speaking', v);
      if (id === 'me') {
        S.meSpeaking = v;
        $('micLive').style.width = v ? Math.min(100, Math.round(lv * 180)) + '%' : '0%';
      }
      syncOverlay();
    },
  });
  call.onScreenEnded = () => pushState();
  call.onCamEnded = () => { updateDock(); pushState(); toast('La cámara está ocupada por otra app (ej. Discord) o se desconectó'); };
  try {
    await call.start();
    if (settings.voiceMode === 'ptt') {
      call.setMuted(true);
    }
    if (S.gameMode) {
      call.setGameMode(true);
    }
    const r = await rpc('voice.join', { key });
    call.ice = r.ice; S.call = call; S.callKey = key; S.callLabel = label;
    S.party = r.party || null;
    if (S.party?.current?.title) S.partyTracks.set(key, S.party.current.title);
    r.peers.forEach((p) => call.addPeer(p));
    if (r.offline) { toast(`${label} no está conectado ahora`); S.call = call; leaveCall(false); return; }
    if (r.ringing) { S.outgoing = { key, name: label }; ringer.start('out'); } else ringer.beep([480, 640]);
  } catch (e) { call.close(); toast(e.name === 'NotAllowedError' || e.name === 'NotFoundError' ? 'No se pudo acceder al micrófono' : e.message); return; }
  $('voiceDock').classList.remove('hidden'); $('stageWrap').classList.remove('hidden');
  updateDock(); renderCenter(); renderStage(); syncPartyTile(); updateStatTimer(); updatePingTimer(); pushState(); renderCallOverlay(); syncOverlay();
}
function leaveCall(silent) {
  if (S.mini) window.epic.toggleMini?.(false);
  if (document.pictureInPictureElement) document.exitPictureInPicture?.().catch(() => {});
  if (S.outgoing) { S.outgoing = null; if (!S.incoming) ringer.stop(); renderCallOverlay(); }
  if (!S.call) return;
  if (!silent) { sendRaw('voice.leave', {}); ringer.beep([520, 360]); }
  S.call.close(); S.call = null; S.callKey = null; S.focusTile = null; S.party = null; S.meSpeaking = false; S.stageCollapsed = false;
  $('micLive').style.width = '0%';
  $('voiceDock').classList.add('hidden'); $('stageWrap').classList.add('hidden');
  $('stageWrap').classList.remove('collapsed');
  $('stageResizer')?.classList.remove('hidden');
  $('voicePill')?.classList.add('hidden');
  $('meetMenu')?.classList.add('hidden');
  tiles.forEach((t) => { t.boostCtx?.close().catch(() => {}); t.el.remove(); });
  tiles.clear(); renderCenter(); updateStatTimer(); updatePingTimer();
  syncOverlay();
}
function pushState() { const c = S.call; if (c) sendRaw('voice.state', { muted: c.muted, deaf: c.deaf, cam: !!c.camTrack, screen: c.screenStream?.id || null }); }
const ICONS = {
  mic: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
  micOff: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
  deaf: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>',
  deafOff: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M4.6 4.6A9 9 0 0 0 3 10v7a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3"/><path d="M19 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3"/><path d="M21 10a9 9 0 0 0-14.4-7.2"/></svg>',
  cam: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>',
  camOff: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="m22 8-6 4 6 4V8Z"/><path d="M2 10v6a2 2 0 0 0 2 2h12a2 2 0 0 0 1.74-1"/><path d="M6 6h10a2 2 0 0 1 2 2v3"/></svg>',
  screen: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>',
  party: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  grid: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  size: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>',
  hangup: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 11.7 11.7 0 0 0 3.73.59 2 2 0 0 1 2 2v2.5a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.09-8.7A2 2 0 0 1 5.4 2h2.5a2 2 0 0 1 2 2 11.7 11.7 0 0 0 .59 3.73 2 2 0 0 1-.45 2.11L8.77 11.1"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
  more: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>',
  loop: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>',
  mini: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2"/><rect width="7" height="5" x="12" y="12" rx="1"/></svg>',
  pin: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1V2H6v1a1 1 0 0 0 1 1h1a1 1 0 0 1 1 1v5.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>',
  pinOff: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><line x1="12" x2="12" y1="17" y2="22"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h10"/><path d="M15 9.34V5a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1V2H7.34"/></svg>',
  crop: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
  expand: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  chevronUp: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  chevronDown: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  sound: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  game: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="6"/></svg>',
  overlay: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  collapse: '<svg width="{S}" height="{S}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
};
function getSvg(name, size = 16) {
  const tpl = ICONS[name] || '';
  return tpl.replaceAll('{S}', String(size));
}
function setSvg(el, name, size = 16) {
  if (!el) return;
  el.innerHTML = getSvg(name, size);
}

const SIZES = [
  { label: 'S', vh: 38, desc: 'Compacto' },
  { label: 'M', vh: 60, desc: 'Equilibrado' },
  { label: 'L', vh: 80, desc: 'Amplio' },
  { label: 'XL', vh: 94, desc: 'Modo Teatro' },
];
function cycleStageSize() {
  const cur = Number(settings.stageHeight) || 60;
  let idx = SIZES.findIndex((s) => Math.abs(s.vh - cur) <= 8);
  if (idx < 0) idx = 1;
  const next = SIZES[(idx + 1) % SIZES.length];
  setStagePreset(next.vh);
  toast(`Tamaño del escenario: ${next.label} (${next.desc} — ${next.vh}%)`);
}

function toggleStageCollapse(force, quiet = false) {
  if (!S.call) return;
  S.stageCollapsed = force !== undefined ? !!force : !S.stageCollapsed;
  $('stageWrap')?.classList.toggle('collapsed', S.stageCollapsed);
  $('stageResizer')?.classList.toggle('hidden', S.stageCollapsed);
  $('voicePill')?.classList.toggle('hidden', !S.stageCollapsed);
  if (S.stageCollapsed) {
    updateVoicePill();
    if (!quiet) toast('Escenario minimizado (hablando en segundo plano para ver el chat)');
  }
  updateDock();
}

function updateVoicePill() {
  if (!S.call) {
    $('voicePill')?.classList.add('hidden');
    return;
  }
  const c = S.call;
  const pillTitle = $('vpillTitle');
  if (pillTitle) pillTitle.textContent = `🔊 ${S.callLabel || 'Llamada de voz'}`;
  const pillInfo = $('vpillInfo');
  if (pillInfo) {
    const total = 1 + c.peers.size;
    pillInfo.textContent = `${total} ${total === 1 ? 'persona' : 'personas'} · ${c.muted ? '🔇 Silenciado' : '🎙️ En vivo'}`;
  }
  const muteBtn = $('vpillMute');
  if (muteBtn) {
    muteBtn.className = 'vpill-btn' + (c.muted ? ' off' : '');
    muteBtn.textContent = c.muted ? '🔇 Muteado' : '🎙️ Hablando';
  }
  const deafBtn = $('vpillDeaf');
  if (deafBtn) {
    deafBtn.className = 'vpill-btn' + (c.deaf ? ' off' : '');
    deafBtn.textContent = c.deaf ? '🔇 Sordo' : '🎧 Audio';
  }
}

// ---------- Tablero de Sonidos (Soundboard) Sincronizado ----------
const SOUND_NAMES = {
  victory: '🎺 Fanfarria de Victoria',
  airhorn: '📯 Bocina de Fiesta (Airhorn)',
  badumtss: '🥁 Ba-Dum-Tss (Chiste)',
  applause: '👏 Aplausos',
  levelup: '⭐ Level Up (Arcade)',
  ding: '🔔 Campana / Ding',
  boing: '🌀 Resorte Cómico (Boing)',
  gameover: '👾 Game Over (8-Bit)',
};

let soundCtx = null;
function getSoundCtx() {
  if (!soundCtx || soundCtx.state === 'closed') {
    soundCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (soundCtx.state === 'suspended') soundCtx.resume().catch(() => {});
  return soundCtx;
}

function playSoundEffect(name) {
  try {
    const ctx = getSoundCtx();
    const now = ctx.currentTime;
    switch (name) {
      case 'victory': {
        const notes = [
          { f: 261.63, t: 0, d: 0.14 },
          { f: 329.63, t: 0.14, d: 0.14 },
          { f: 392.00, t: 0.28, d: 0.14 },
          { f: 523.25, t: 0.42, d: 0.65 },
          { f: 659.25, t: 0.42, d: 0.65 },
          { f: 783.99, t: 0.42, d: 0.65 },
        ];
        notes.forEach(({ f, t, d }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + t);
          g.gain.setValueAtTime(0.001, now + t);
          g.gain.exponentialRampToValueAtTime(0.28, now + t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d + 0.04);
        });
        break;
      }
      case 'applause': {
        const dur = 2.0;
        const bufSize = ctx.sampleRate * dur;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(2.0, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.01, now);
        g.gain.linearRampToValueAtTime(0.25, now + 0.25);
        g.gain.setValueAtTime(0.25, now + 1.2);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        src.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        src.start(now);
        src.stop(now + dur);
        break;
      }
      case 'airhorn': {
        const blasts = [
          { t: 0, d: 0.11 },
          { t: 0.14, d: 0.11 },
          { t: 0.28, d: 0.11 },
          { t: 0.42, d: 0.5 },
        ];
        blasts.forEach(({ t, d }) => {
          [466, 622].forEach((freq) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + t);
            osc.frequency.linearRampToValueAtTime(freq * 1.02, now + t + d);
            g.gain.setValueAtTime(0.001, now + t);
            g.gain.linearRampToValueAtTime(0.16, now + t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(now + t);
            osc.stop(now + t + d + 0.02);
          });
        });
        break;
      }
      case 'badumtss': {
        const hits = [
          { t: 0, f: 140, d: 0.11 },
          { t: 0.16, f: 160, d: 0.11 },
        ];
        hits.forEach(({ t, f, d }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + t);
          osc.frequency.exponentialRampToValueAtTime(45, now + t + d);
          g.gain.setValueAtTime(0.32, now + t);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d);
        });
        const cDur = 0.75;
        const cBuf = ctx.createBuffer(1, Math.round(ctx.sampleRate * cDur), ctx.sampleRate);
        const cd = cBuf.getChannelData(0);
        for (let i = 0; i < cd.length; i++) cd[i] = Math.random() * 2 - 1;
        const cSrc = ctx.createBufferSource();
        cSrc.buffer = cBuf;
        const cFilt = ctx.createBiquadFilter();
        cFilt.type = 'highpass';
        cFilt.frequency.setValueAtTime(6000, now + 0.34);
        const cGain = ctx.createGain();
        cGain.gain.setValueAtTime(0.001, now);
        cGain.gain.setValueAtTime(0.26, now + 0.34);
        cGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34 + cDur);
        cSrc.connect(cFilt);
        cFilt.connect(cGain);
        cGain.connect(ctx.destination);
        cSrc.start(now + 0.34);
        cSrc.stop(now + 0.34 + cDur);
        break;
      }
      case 'gameover': {
        const seq = [
          { f: 493.88, t: 0, d: 0.2 },
          { f: 466.16, t: 0.2, d: 0.2 },
          { f: 440.00, t: 0.4, d: 0.2 },
          { f: 415.30, t: 0.6, d: 0.5 },
        ];
        seq.forEach(({ f, t, d }) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, now + t);
          g.gain.setValueAtTime(0.12, now + t);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d + 0.02);
        });
        break;
      }
      case 'ding': {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(1760, now);
        osc2.type = 'sine'; osc2.frequency.setValueAtTime(3520, now);
        g.gain.setValueAtTime(0.26, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        osc.connect(g); osc2.connect(g); g.connect(ctx.destination);
        osc.start(now); osc2.start(now);
        osc.stop(now + 1.15); osc2.stop(now + 1.15);
        break;
      }
      case 'boing': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.4);
        g.gain.setValueAtTime(0.28, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.55);
        break;
      }
      case 'levelup': {
        const notes = [330, 392, 523, 659, 784, 1046];
        notes.forEach((freq, idx) => {
          const t = idx * 0.075;
          const d = idx === notes.length - 1 ? 0.4 : 0.075;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + t);
          g.gain.setValueAtTime(0.18, now + t);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + t); osc.stop(now + t + d + 0.02);
        });
        break;
      }
    }
  } catch (e) {
    console.warn('playSoundEffect', e);
  }
}

function modalSoundboard() {
  const SOUNDS = [
    { key: 'victory', name: 'Victoria', icon: '🏆', desc: 'Fanfarria triunfal de victoria' },
    { key: 'airhorn', name: 'Airhorn', icon: '📯', desc: 'El clásico sonido de fiesta' },
    { key: 'badumtss', name: 'Ba-Dum-Tss', icon: '🥁', desc: 'Remate de chiste gracioso' },
    { key: 'applause', name: 'Aplausos', icon: '👏', desc: 'Ovación del público' },
    { key: 'levelup', name: 'Level Up', icon: '⭐', desc: 'Subida de nivel retro arcade' },
    { key: 'ding', name: 'Campana', icon: '🔔', desc: 'Campanita cristalina' },
    { key: 'boing', name: 'Boing', icon: '🌀', desc: 'Resorte cómico de caricatura' },
    { key: 'gameover', name: 'Game Over', icon: '👾', desc: 'Melodía de derrota 8-bit' },
  ];

  const grid = h('div', {
    style: 'display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px',
  }, SOUNDS.map((s) => {
    return h('button', {
      style: 'display:flex;align-items:center;gap:10px;padding:11px;background:#181b28;border:1px solid rgba(255,255,255,0.08);border-radius:10px;text-align:left;cursor:pointer;transition:all 0.15s ease',
      onclick: () => {
        playSoundEffect(s.key);
        if (S.call) {
          sendRaw('voice.sound', { sound: s.key, name: S.me?.name || 'Tú' });
          toast(`🔊 Has enviado "${s.name}" a la llamada`);
        } else {
          toast(`🔊 Reproduciendo: ${s.name} (Prueba local)`);
        }
      },
    },
      h('span', { style: 'font-size:22px;line-height:1' }, s.icon),
      h('div', { style: 'flex:1;overflow:hidden' },
        h('div', { style: 'font-weight:700;font-size:12.5px;color:#f1f5f9' }, s.name),
        h('div', { style: 'font-size:11px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, s.desc)
      )
    );
  }));

  const info = h('div', {
    style: 'font-size:11.5px;color:var(--mu);margin-top:12px;line-height:1.4;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:8px'
  }, S.call ? '✨ Los sonidos se reproducen sincronizados para todos los miembros conectados a la llamada.' : 'ℹ️ Conéctate a una llamada para compartir los sonidos con tus amigos en tiempo real.');

  modal('Tablero de Sonidos (Soundboard) 🔊', grid, info);
}

// ---------- Modo Juego (Baja Latencia / Mínimo Ping) ----------
function toggleGameMode(enable) {
  S.gameMode = enable === undefined ? !S.gameMode : !!enable;
  if (S.call) S.call.setGameMode(S.gameMode);
  toast(S.gameMode ? '🎮 Modo Juego activado: 15 fps y bitrate reducido para dar 100% de CPU/Ping a tu partida' : 'Modo Juego desactivado');
  updateDock();
}

// ---------- Superposición Gamer Flotante (Overlay Transparente) ----------
function syncOverlay() {
  if (!window.epic?.updateOverlay) return;
  if (!S.call) {
    window.epic.updateOverlay({ peers: [] });
    return;
  }
  const peers = [];
  peers.push({
    id: 'me',
    name: S.me?.name || 'Tú',
    color: S.me?.color || '#a855f7',
    speaking: !!S.meSpeaking,
    muted: !!S.call?.muted,
  });
  for (const [id, p] of S.call.peers.entries()) {
    peers.push({
      id,
      name: p.user?.name || `Usuario ${id}`,
      color: p.user?.color || '#3b82f6',
      speaking: !!p.speaking,
      muted: !!p.muted,
    });
  }
  window.epic.updateOverlay({ peers, channel: S.callLabel || 'Llamada' });
}

function toggleOverlay(enable) {
  if (!window.epic?.toggleOverlay) return;
  window.epic.toggleOverlay(enable).then((active) => {
    S.overlayActive = active;
    syncOverlay();
    toast(active ? '🎮 Overlay de voz sobre juegos activado' : 'Overlay cerrado');
    updateDock();
  }).catch(() => {});
}

// ---------- Pulsar para Hablar (Push-to-Talk / PTT) ----------
let pttHolding = false;
window.addEventListener('keydown', (e) => {
  if (settings.voiceMode !== 'ptt' || !S.call) return;
  const tag = e.target?.tagName?.toUpperCase();
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;
  const pttKey = settings.pttKey || 'Control';
  
  if (isInput && !['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'Tab'].includes(e.key) && !/^F\d+$/.test(e.key)) {
    return;
  }

  const matches = (e.key === pttKey) || (pttKey === ' ' && e.code === 'Space');
  if (matches) {
    if (e.repeat) return;
    pttHolding = true;
    if (S.call.muted) {
      S.call.setMuted(false);
      if (settings.pttCue !== false) ringer.beep([880], 0.04);
      updateDock();
      renderStage();
      pushState();
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (settings.voiceMode !== 'ptt' || !S.call) return;
  const pttKey = settings.pttKey || 'Control';
  const matches = (e.key === pttKey) || (pttKey === ' ' && e.code === 'Space');
  if (matches) {
    pttHolding = false;
    if (!S.call.muted) {
      S.call.setMuted(true);
      if (settings.pttCue !== false) ringer.beep([440], 0.04);
      updateDock();
      renderStage();
      pushState();
    }
  }
});

function updateDock() {
  const c = S.call; if (!c) return;
  const ns = c.noiseMode === 'high' ? ' · 🔇 RNNoise' : '';
  const cleanLabel = (S.callLabel || '').replace(/^🔊\s*/, '');
  if (!settings.stats) $('voiceInfo').textContent = `🔊 ${cleanLabel}${ns}`;
  const setQ = (id, cls, icoKey, sz = 16) => {
    const el = $(id); if (!el) return;
    el.className = 'qbtn' + (id === 'bLeave' ? ' hang' : '') + (cls ? ' ' + cls : '');
    const i = el.querySelector('i'); if (i) setSvg(i, icoKey, sz);
  };
  const setD = (id, cls, txt, icoKey) => {
    const el = $(id); if (!el) return;
    el.className = 'dockbtn' + (cls ? ' ' + cls : '');
    const sp = el.querySelector('span'); if (sp) sp.textContent = txt;
    const i = el.querySelector('i'); if (i && icoKey) setSvg(i, icoKey, 16);
  };
  const setM = (id, cls, icoKey, sz = 16) => {
    const el = $(id); if (!el) return;
    el.className = 'mbtn' + (cls ? ' ' + cls : '');
    setSvg(el, icoKey, sz);
  };
  const hasParty = !!S.party?.current;
  setQ('bMute', c.muted ? 'off' : '', c.muted ? 'micOff' : 'mic');
  setQ('bDeaf', c.deaf ? 'off' : '', c.deaf ? 'deafOff' : 'deaf');
  setQ('bDockMore', S.dockOpen ? 'on' : '', S.dockOpen ? 'chevronDown' : 'chevronUp');
  setQ('bLeave', '', 'hangup');

  $('dockDrawer')?.classList.toggle('hidden', !S.dockOpen);
  setD('bCam', c.camTrack ? 'on' : '', c.camTrack ? 'Cámara ON' : 'Cámara', c.camTrack ? 'cam' : 'camOff');
  setD('bScreen', c.screenStream ? 'on' : '', c.screenStream ? 'Pantalla ON' : 'Pantalla', 'screen');
  if ($('bParty')) setD('bParty', hasParty ? 'on' : '', hasParty ? 'DJ Sonando' : 'Bot DJ', 'party');
  setD('bSoundboard', '', 'Sonidos', 'sound');
  setD('bGameMode', S.gameMode ? 'on' : '', S.gameMode ? 'Juegos ON' : 'Juegos', 'game');
  
  setD('bOverlay', S.overlayActive ? 'on' : '', S.overlayActive ? 'Overlay ON' : 'Overlay', 'overlay');
  setD('bLoop', c.mic?.monitoring ? 'on' : '', c.mic?.monitoring ? 'Oyéndome' : 'Oírme', 'loop');
  setD('bMini', S.mini ? 'on' : '', S.mini ? 'Expandir' : 'Flotante', 'mini');

  setM('mMute', c.muted ? 'off' : '', c.muted ? 'micOff' : 'mic');
  setM('mDeaf', c.deaf ? 'off' : '', c.deaf ? 'deafOff' : 'deaf');
  setM('mCam', c.camTrack ? 'on' : '', c.camTrack ? 'cam' : 'camOff');
  setM('mScreen', c.screenStream ? 'on' : '', 'screen');
  setM('mMore', '', 'more');
  setSvg($('mLeaveIco'), 'hangup', 15);
  updateVoicePill();

  if (settings.voiceMode === 'ptt') {
    const keyTxt = settings.pttKey === ' ' ? 'Espacio' : (settings.pttKey || 'Control');
    const tip = `Pulsar para hablar [${keyTxt}] · ${pttHolding ? '🎙️ Abierto' : 'Silenciado'}`;
    $('bMute')?.setAttribute('title', tip);
    $('mMute')?.setAttribute('title', tip);
  }

  const curVh = Math.round(Number(settings.stageHeight) || 60);
  const curItem = SIZES.find((s) => Math.abs(s.vh - curVh) <= 8) || SIZES[1];
  const badge = $('mSizeBadge');
  if (badge) badge.textContent = curItem.label;
  $('mSizeMenu')?.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('on', Number(btn.dataset.sz) === curItem.vh);
  });
}
$('bMute').onclick = () => { const c = S.call; if (!c) return; if (c.deaf) c.deaf = false; c.setMuted(!c.muted); updateDock(); renderStage(); syncPartyTile(); pushState(); };
$('bDeaf').onclick = () => { const c = S.call; if (!c) return; c.deaf = !c.deaf; c.setMuted(c.deaf); updateDock(); renderStage(); syncPartyTile(); pushState(); };
$('bDockMore').onclick = () => { S.dockOpen = !S.dockOpen; updateDock(); };
$('bLoop').onclick = () => {
  const c = S.call; if (!c?.mic) return;
  const next = !c.mic.monitoring;
  c.setSelfMonitor(next);
  if (next) toast('👂 Escuchando tu propio micrófono (desactívalo para no oírte doble)');
  updateDock();
};
$('bCam').onclick = async () => {
  try {
    const turningOn = !S.call?.camTrack;
    await S.call?.setCamera(turningOn);
    if (turningOn) ringer.beep([523, 784], 0.06, 0.1);
    else ringer.beep([784, 523], 0.06, 0.08);
  } catch (e) { toast('No se pudo abrir la cámara'); }
  updateDock(); renderStage(); pushState();
};
if ($('bParty')) $('bParty').onclick = () => modalParty();
$('bSoundboard').onclick = () => modalSoundboard();
if ($('mSoundboard')) $('mSoundboard').onclick = () => modalSoundboard();
if ($('mGameMode')) $('mGameMode').onclick = () => toggleGameMode();
if ($('bGameMode')) $('bGameMode').onclick = () => toggleGameMode();

$('bOverlay').onclick = () => toggleOverlay();
$('bMini').onclick = () => window.epic.toggleMini?.();
if ($('bMiniExit')) $('bMiniExit').onclick = () => window.epic.toggleMini?.(false);
if ($('mCollapse')) $('mCollapse').onclick = () => toggleStageCollapse();
$('vpillExpand').onclick = () => toggleStageCollapse(false);
$('vpillMute').onclick = () => $('bMute').click();
$('vpillDeaf').onclick = () => $('bDeaf').click();
$('vpillHang').onclick = () => leaveCall(false);
$('bLeave').onclick = () => leaveCall(false);
$('bScreen').onclick = async () => {
  const c = S.call; if (!c) return;
  if (c.screenStream) {
    await c.stopScreen();
    ringer.playStreamStop();
    updateDock(); renderStage(); pushState();
    return;
  }
  let srcs = []; try { srcs = await window.epic.listSources(); } catch (e) { return toast('No se pudieron listar las pantallas'); }
  const screens = srcs.filter((s) => s.screen);
  const windows = srcs.filter((s) => !s.screen);

  const audioChk = h('input', {
    type: 'checkbox',
    style: 'width:17px;height:17px;margin:0;accent-color:var(--ac);cursor:pointer',
    checked: settings.screenAudio !== false,
    onchange: (e) => {
      settings.screenAudio = e.target.checked;
      saveSettings();
    }
  });
  const audioRow = h('div', {
    style: 'display:flex;flex-direction:column;gap:6px;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;'
  },
    h('label', { style: 'display:flex;flex-direction:row;align-items:center;gap:9px;cursor:pointer;font-size:12.5px;color:var(--tx);font-weight:600' },
      audioChk,
      h('span', null, '🔊 Compartir también el audio del sistema (juegos, videos, música)')
    ),
    h('span', { style: 'font-size:11px;color:#94a3b8;margin-left:26px;line-height:1.3' },
      '🎧 Tip anti-eco: Usa audífonos para que el audio del juego o llamada no se cuele a tu micrófono. Tu auto-monitoreo local se pausa automáticamente.'
    )
  );

  const makeCard = (s) => h('div', { class: 'src', onclick: async () => {
    closeModal();
    try {
      await c.startScreen(s.id, settings.screenAudio !== false);
      ringer.playStreamStart();
    } catch (e) { return toast('No se pudo compartir la pantalla'); }
    updateDock(); renderStage(); pushState();
  } }, h('img', { src: s.thumb }), h('span', { title: s.name }, (s.screen ? '🖥️ ' : '🪟 ') + s.name));

  const content = h('div', { style: 'display:flex;flex-direction:column;gap:12px;max-height:68vh;overflow-y:auto' },
    audioRow,
    screens.length ? h('div', { class: 'sect', style: 'margin:0' }, '🖥️ Pantallas completas (Recomendado — sin pantallas negras)') : null,
    screens.length ? h('div', { class: 'srcs' }, screens.map(makeCard)) : null,
    windows.length ? h('div', { class: 'sect', style: 'margin-top:6px' }, '🪟 Ventanas y aplicaciones') : null,
    windows.length ? h('div', { class: 'srcs' }, windows.map(makeCard)) : null,
    h('div', { class: 'hint', style: 'background:rgba(124,92,255,0.09);border:1px solid rgba(124,92,255,0.25);border-radius:9px;padding:9px 12px;font-size:12px;color:#c4b5fd;line-height:1.4' },
      '💡 Consejo: Si una ventana (como Chrome, Spotify o juegos) se ve en negro al compartirla, elige "Pantalla completa" o desactiva la Aceleración por hardware en Ajustes (⚙️).'
    )
  );

  modal('¿Qué quieres compartir?', content);
};

// Controles de la barra flotante estilo Google Meet
$('mMute').onclick = () => $('bMute').click();
$('mDeaf').onclick = () => $('bDeaf').click();
$('mCam').onclick = () => $('bCam').click();
$('mScreen').onclick = () => $('bScreen').click();
if ($('mParty')) $('mParty').onclick = () => modalParty();
$('mLeave').onclick = () => $('bLeave').click();
if ($('mHideNoVid')) $('mHideNoVid').onclick = () => {
  settings.hideNoVideo = !settings.hideNoVideo;
  saveSettings();
  toast(settings.hideNoVideo ? 'Mostrando solo cámaras y pantallas activas' : 'Mostrando todos los participantes en cuadrícula');
  renderStage();
};
function setStagePreset(vh) {
  settings.stageHeight = vh;
  saveSettings();
  applyStageHeight();
  updateDock();
}
if ($('mSizeBtn')) $('mSizeBtn').onclick = (e) => {
  e.stopPropagation();
  $('meetMenu')?.classList.add('hidden');
  $('mSizeMenu')?.classList.toggle('hidden');
};
$('mSizeMenu')?.querySelectorAll('button[data-sz]').forEach((btn) => {
  btn.onclick = (e) => {
    e.stopPropagation();
    setStagePreset(Number(btn.dataset.sz));
    $('mSizeMenu')?.classList.add('hidden');
  };
});
$('stageResizer').onclick = () => cycleStageSize();
$('stage').ondblclick = (e) => {
  if (e.target.id === 'stage' || e.target.id === 'stageSideStrip') cycleStageSize();
};
window.addEventListener('click', () => {
  $('mSizeMenu')?.classList.add('hidden');
  $('meetMenu')?.classList.add('hidden');
});

$('mMore').onclick = (e) => {
  e.stopPropagation();
  const menu = $('meetMenu');
  if (!menu.classList.contains('hidden')) { menu.classList.add('hidden'); return; }
  const c = S.call;
  const curVh = Math.round(Number(settings.stageHeight) || 60);

  const tipBar = h('div', { id: 'meetMenuTip', class: 'menu-tip' }, 'Panel de Controles Rápidos');
  const setTip = (txt) => { tipBar.textContent = txt; };

  const tileBtn = (icon, tip, onClick, active = false, extraCls = '') => {
    const b = h('button', {
      type: 'button',
      class: 'meet-tile' + (active ? ' on' : '') + (extraCls ? ' ' + extraCls : ''),
      title: tip,
      'data-tip': tip,
      onmouseenter: () => setTip(tip),
      onmouseleave: () => setTip('Panel de Controles Rápidos'),
      onclick: (ev) => { ev.stopPropagation(); onClick(); }
    }, icon);
    return b;
  };

  // 1. Tamaños del Escenario agrupados todos juntos (S, M, L, XL)
  const gridSizes = h('div', { class: 'meet-grid size-grid' },
    tileBtn('S', 'Tamaño S (38% altura escenario)', () => { setStagePreset(38); menu.classList.add('hidden'); }, Math.abs(curVh - 38) <= 5, 'sz'),
    tileBtn('M', 'Tamaño M (60% equilibrado)', () => { setStagePreset(60); menu.classList.add('hidden'); }, Math.abs(curVh - 60) <= 5, 'sz'),
    tileBtn('L', 'Tamaño L (80% amplio)', () => { setStagePreset(80); menu.classList.add('hidden'); }, Math.abs(curVh - 80) <= 5, 'sz'),
    tileBtn('XL', 'Modo Teatro XL (94% pantalla)', () => { setStagePreset(94); menu.classList.add('hidden'); }, Math.abs(curVh - 94) <= 5, 'sz')
  );

  // 2. Modos de Vista y Pantalla
  const gridVistas = h('div', { class: 'meet-grid' },
    tileBtn(S.stageCollapsed ? '🔼' : '🔽', S.stageCollapsed ? 'Expandir escenario de video' : 'Minimizar escenario (ver chat)', () => { toggleStageCollapse(); menu.classList.add('hidden'); }, S.stageCollapsed),
    tileBtn('⊞', !settings.hideNoVideo ? 'Modo Cuadrícula: Mostrando todos (clic para ocultar sin cámara)' : 'Modo Cuadrícula: Solo cámaras (clic para ver todos)', () => {
      settings.hideNoVideo = !settings.hideNoVideo;
      saveSettings();
      toast(settings.hideNoVideo ? 'Solo cámaras y pantallas activas' : 'Todos los participantes en cuadrícula');
      renderStage();
      menu.classList.add('hidden');
    }, !settings.hideNoVideo),
    tileBtn('📌', S.mini ? 'Ventana flotante: ON (Always-on-top)' : 'Ventana flotante PiP (sobre juegos)', () => { $('bMini').click(); menu.classList.add('hidden'); }, S.mini),
    tileBtn('🪟', S.overlayActive ? 'Overlay Gamer: ON (clic para ocultar)' : 'Overlay Gamer: OFF (superposición en juego)', () => { toggleOverlay(); menu.classList.add('hidden'); }, S.overlayActive)
  );

  // 3. Audio, Música y Gaming
  const gridAudioGaming = h('div', { class: 'meet-grid' },
    tileBtn('🎵', 'Bot DJ (YouTube / Música sincronizada)', () => { modalParty(); menu.classList.add('hidden'); }, !!S.party?.current),
    tileBtn('🔊', 'Tablero de Sonidos (Soundboard)', () => { modalSoundboard(); menu.classList.add('hidden'); }),
    tileBtn('🎮', S.gameMode ? 'Modo Juego: ON (Baja latencia activada)' : 'Modo Juego: OFF (Optimizar para jugar)', () => { toggleGameMode(); menu.classList.add('hidden'); }, S.gameMode),
    tileBtn('👾', 'Minijuego Co-op: EpicStrike 2D & Cajas Tácticas', () => { modalMinigame(); menu.classList.add('hidden'); }),
    tileBtn('👂', c?.mic?.monitoring ? 'Escuchar mi voz: ON (clic para apagar)' : 'Escuchar mi voz: OFF (auto-monitoreo)', () => { $('bLoop').click(); menu.classList.add('hidden'); }, !!c?.mic?.monitoring)
  );

  // 4. Diagnóstico y Utilidades
  const gridUtil = h('div', { class: 'meet-grid util-grid' },
    tileBtn('📊', settings.stats ? 'Estadísticas HW/Ping: ON' : 'Estadísticas HW y Ping: OFF', () => { settings.stats = !settings.stats; saveSettings(); updateStatTimer(); menu.classList.add('hidden'); }, settings.stats),
    tileBtn('🎯', 'Diagnóstico y Códigos de Error', () => { modalDiagnostics(); menu.classList.add('hidden'); })
  );

  // Control deslizante de filtro anti-respiración
  const gLbl = h('b', null, `${Math.round(((settings.voiceGate ?? 0.006) / 0.06) * 100)}%`);
  const gRng = h('input', {
    type: 'range', min: 0, max: 0.06, step: 0.002, value: settings.voiceGate ?? 0.006,
    oninput: () => {
      settings.voiceGate = Number(gRng.value);
      saveSettings();
      gLbl.textContent = `${Math.round((settings.voiceGate / 0.06) * 100)}%`;
      c?.mic?.setGate?.(settings.voiceGate);
    }
  });
  const gateRow = h('div', { class: 'gate-row' },
    h('span', null, '🌬️ Filtro:'),
    gRng,
    gLbl
  );

  menu.replaceChildren(
    h('div', { class: 'meet-sect-label' }, 'Tamaño del Escenario'),
    gridSizes,
    h('div', { class: 'meet-sect-label' }, 'Vista y Pantalla'),
    gridVistas,
    h('div', { class: 'meet-sect-label' }, 'Audio y Gaming'),
    gridAudioGaming,
    h('div', { class: 'meet-sect-label' }, 'Diagnóstico'),
    gridUtil,
    gateRow,
    tipBar
  );
  menu.classList.remove('hidden');
};
document.addEventListener('click', (e) => {
  const menu = $('meetMenu');
  if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && e.target !== $('mMore')) menu.classList.add('hidden');
});

// Tirador arrastrable para modificar el tamaño del escenario de cámaras/transmisiones
$('stageResizer').addEventListener('mousedown', (e) => {
  e.preventDefault();
  const onMove = (ev) => {
    const rect = $('center').getBoundingClientRect();
    const px = Math.max(170, Math.min(rect.height - 90, ev.clientY - rect.top - 50));
    const vh = Math.round((px / window.innerHeight) * 100);
    settings.stageHeight = Math.max(24, Math.min(92, vh));
    applyStageHeight();
    updateDock();
  };
  const onUp = () => {
    saveSettings();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

// ---------- Tiles de video, Enfoque estilo Google Meet y volumen individual (0% a 200%) ----------
const tiles = new Map();
function applyTileVolume(t) {
  if (!t.uid) return;
  const vol = S.call?.deaf ? 0 : getUserVol(t.uid);
  t.video.volume = Math.max(0, Math.min(1, vol));
  if (vol > 1.01 && t.video.srcObject && t.video.srcObject.getAudioTracks().length > 0) {
    if (!t.boostCtx || t.boostStream !== t.video.srcObject) {
      t.boostCtx?.close().catch(() => {});
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(t.video.srcObject);
      const gain = ctx.createGain();
      src.connect(gain); gain.connect(ctx.destination);
      t.boostCtx = ctx; t.boostGain = gain; t.boostStream = t.video.srcObject; t._boostSrc = src;
    }
    t.boostGain.gain.setTargetAtTime(vol - 1, t.boostCtx.currentTime, 0.015);
    if (t.boostCtx.state === 'suspended') t.boostCtx.resume().catch(() => {});
  } else if (t.boostGain) {
    t.boostGain.gain.setTargetAtTime(0, t.boostCtx.currentTime, 0.015);
  }
}

function toggleFocusTile(key) {
  S.focusTile = S.focusTile === key ? null : key;
  renderStage();
}

function tile(key, label, user, withVol = false) {
  let t = tiles.get(key);
  if (!t) {
    const isCam = key === 'me' || /^p\d+$/.test(key);
    const video = h('video', { autoplay: true, playsinline: true, onclick: () => toggleFocusTile(key), title: 'Clic para enfocar / ampliar esta cámara o transmisión' });
    const nm = h('div', { class: 'nm' }); const av = h('div', { class: 'av' }, avatar(user, 72)); const stat = h('div', { class: 'stat' });
    const pinBtn = h('button', { title: 'Enfocar / ampliar esta cámara (Spotlight)', onclick: (e) => { e.stopPropagation(); toggleFocusTile(key); } });
    setSvg(pinBtn, 'pin', 13);
    const fitBtn = h('button', {
      class: '',
      title: 'Alternar entre imagen completa (sin recortar cámara) o rellenar cuadro',
      onclick: (e) => {
        e.stopPropagation();
        el.classList.toggle('cover');
        const isCover = el.classList.contains('cover');
        fitBtn.classList.toggle('on', isCover);
        setSvg(fitBtn, isCover ? 'crop' : 'expand', 13);
        toast(isCover ? 'Modo Rellenar (recorta bordes para llenar)' : 'Modo Completo (sin recortar cámara)');
      }
    });
    setSvg(fitBtn, 'expand', 13);
    const pip = h('button', { title: 'Ventana sobre ventana (Picture-in-Picture)', onclick: (e) => { e.stopPropagation(); (document.pictureInPictureElement === video ? document.exitPictureInPicture() : video.requestPictureInPicture?.()).catch(() => {}); } });
    setSvg(pip, 'mini', 13);
    const fs = h('button', { title: 'Pantalla completa', onclick: (e) => { e.stopPropagation(); video.requestFullscreen?.(); } });
    setSvg(fs, 'size', 13);
    let hidePrevBtn = null;
    if (key === 'me-screen') {
      hidePrevBtn = h('button', {
        title: 'Ocultar mi vista previa (Ahorra 100% de CPU y GPU en tu PC)',
        onclick: (e) => {
          e.stopPropagation();
          settings.hideOwnScreenPreview = !settings.hideOwnScreenPreview;
          saveSettings();
          renderStage();
          toast(settings.hideOwnScreenPreview ? 'Vista previa oculta (ahorrando recursos)' : 'Vista previa visible');
        }
      });
      setSvg(hidePrevBtn, 'eye', 13);
    }
    const tbtns = h('div', { class: 'tbtns' }, hidePrevBtn, pinBtn, fitBtn, pip, fs);
    let volWrap = null;
    if (withVol && user?.id) {
      const cur = getUserVol(user.id);
      const vTxt = h('span', null, `${Math.round(cur * 100)}%`);
      const vRng = h('input', { type: 'range', min: 0, max: 2, step: 0.05, value: cur, title: 'Volumen de este usuario (0% a 200%)', oninput: () => {
        const val = Number(vRng.value);
        setUserVol(user.id, val);
        vTxt.textContent = `${Math.round(val * 100)}%`;
        applyTileVolume(t);
      } });
      volWrap = h('div', { class: 'vol-wrap' }, '🔊', vRng, vTxt);
    }
    const badgeOverlay = h('div', { class: 'tile-badges' });
    const el = h('div', { class: 'tile', 'data-tile': key }, video, av, badgeOverlay, nm, stat, volWrap, tbtns);
    $('stage').append(el);
    t = {
      key, el, video, nm, av, stat, tbtns, pinBtn, fitBtn, badgeOverlay,
      uid: withVol ? user?.id : 0, hasVideo: false,
      avKey: `${user?.id}:${user?.av}:${user?.color}`,
      updateBadges: (st = {}) => {
        badgeOverlay.replaceChildren();
        if (st.serverMuted) {
          badgeOverlay.append(h('span', { class: 'tile-badge server-muted', title: 'Silenciado por un Administrador' }, '🔇 Admin Muted'));
        } else if (st.muted) {
          badgeOverlay.append(h('span', { class: 'tile-badge muted', title: 'Micrófono apagado' }, '🔇 Mute'));
        }
        if (st.deaf) {
          badgeOverlay.append(h('span', { class: 'tile-badge deaf', title: 'Ensordecido' }, '🎧 Sordo'));
        }
      }
    };
    tiles.set(key, t);
  }
  const k = `${user?.id}:${user?.av}:${user?.color}`;
  if (t.avKey !== k) { t.avKey = k; t.av.replaceChildren(avatar(user, 72)); }
  t.nm.textContent = label; return t;
}
function setStream(t, stream, hasVideo, muted) {
  if (t.key === 'me-screen' && settings.hideOwnScreenPreview) {
    if (t.video.srcObject) {
      t.video.srcObject = null;
      t.vCount = 0;
    }
    t.video.classList.add('noVideo');
    t.av.style.display = 'none';
    if (!t.savingCard) {
      t.savingCard = h('div', { class: 'saving-card' },
        h('div', { style: 'font-size:26px;margin-bottom:4px' }, '🖥️'),
        h('div', { style: 'font-weight:700;font-size:13px;color:#fff' }, 'Transmitiendo tu pantalla'),
        h('div', { style: 'font-size:11.5px;color:#94a3b8;margin-top:2px' }, '🟢 En vivo · Vista previa pausada para ahorrar CPU y GPU'),
        h('button', {
          style: 'margin-top:10px;padding:5px 12px;font-size:11px;font-weight:600;border-radius:7px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;cursor:pointer',
          onclick: (e) => {
            e.stopPropagation();
            settings.hideOwnScreenPreview = false;
            saveSettings();
            renderStage();
          }
        }, '▶ Mostrar vista previa')
      );
      t.el.append(t.savingCard);
    }
    t.savingCard.style.display = 'flex';
    t.hasVideo = true;
    t.tbtns.style.display = '';
    return;
  } else if (t.savingCard) {
    t.savingCard.style.display = 'none';
  }
  const vCount = stream ? stream.getVideoTracks().length : 0;
  const aCount = stream ? stream.getAudioTracks().length : 0;
  if (t.video.srcObject !== stream || t.vCount !== vCount || t.aCount !== aCount) {
    t.video.srcObject = stream;
    t.vCount = vCount;
    t.aCount = aCount;
    if (stream) t.video.play?.().catch(() => {});
  }
  t.hasVideo = !!hasVideo;
  t.video.muted = muted || !!S.call?.deaf;
  if (!muted) applyTileVolume(t);
  t.video.classList.toggle('noVideo', !hasVideo);
  t.av.style.display = hasVideo ? 'none' : '';
  t.tbtns.style.display = hasVideo ? '' : 'none';
  if (settings.spk && t.video.setSinkId && t.sink !== settings.spk) { t.sink = settings.spk; t.video.setSinkId(settings.spk).catch(() => {}); }
}
// ---------- EpicBot DJ: Ver YouTube y Escuchar Playlists en Conjunto ----------
function fmtDur(sec) {
  sec = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
function sendPartyCmd(cmdObj) {
  const t = tiles.get('party');
  if (t?.iframe?.contentWindow) {
    try { t.iframe.contentWindow.postMessage(cmdObj, '*'); } catch {}
  }
}
function ensurePartyTile() {
  let t = tiles.get('party');
  if (!t) {
    const iframe = h('iframe', { class: 'yt-frame', allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', referrerpolicy: 'origin-when-cross-origin' });
    const video = h('video', { class: 'yt-direct hidden', autoplay: true, playsinline: true });
    const pinBtn = h('button', { title: 'Enfocar / ampliar el reproductor en el escenario', onclick: (e) => { e.stopPropagation(); toggleFocusTile('party'); } }, '📌 Enfocar');
    const pipBtn = h('button', {
      title: 'Ventana flotante sobre otras apps (Always on top)',
      onclick: (e) => {
        e.stopPropagation();
        S.focusTile = 'party';
        renderStage();
        window.epic?.toggleMini?.(true);
        toast('Modo ventana flotante activado');
      }
    });
    setSvg(pipBtn, 'mini', 13);
    pipBtn.append(' Flotante');

    const modeBtn = h('button', {
      title: 'Alternar entre ver video en escenario o modo solo música de fondo',
      onclick: (e) => {
        e.stopPropagation();
        settings.partyAudioOnly = !settings.partyAudioOnly;
        saveSettings();
        renderStage();
        syncPartyTile();
      }
    }, settings.partyAudioOnly ? '🎬 Ver video' : '🎧 Solo música');

    const qBtn = h('button', { title: 'Abrir buscador de YouTube y cola de reproducción', onclick: (e) => { e.stopPropagation(); modalParty(); } }, '🎵 Cola');

    const fsBtn = h('button', {
      title: 'Pantalla completa',
      onclick: (e) => {
        e.stopPropagation();
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        else el.requestFullscreen?.().catch(() => {});
      }
    });
    setSvg(fsBtn, 'size', 13);

    const tbtns = h('div', { class: 'tbtns' }, modeBtn, qBtn, pipBtn, pinBtn, fsBtn);

    const playBtn = h('button', { class: 'p-btn', title: 'Pausar / Reproducir para toda la sala', onclick: (e) => {
      e.stopPropagation();
      rpc('party.control', { key: S.callKey, action: S.party?.playing ? 'pause' : 'play', pos: t.curPos }).catch(() => {});
    } }, '⏸');
    const nextBtn = h('button', { class: 'p-btn', title: 'Siguiente pista de la cola', onclick: (e) => {
      e.stopPropagation();
      rpc('party.control', { key: S.callKey, action: 'next' }).catch(() => {});
    } }, '⏭');
    const titleEl = h('span', { class: 'p-title', title: 'Clic para abrir la cola y buscador de YouTube', onclick: () => modalParty() }, '🎵 EpicBot DJ');
    const timeEl = h('span', { class: 'p-time' }, '0:00');
    const vTxt = h('span', null, `${Math.round((settings.partyVol ?? 0.75) * 100)}%`);
    const vRng = h('input', { type: 'range', min: 0, max: 1, step: 0.02, value: settings.partyVol ?? 0.75, title: 'Volumen local de la música/video (solo para ti)', oninput: () => {
      settings.partyVol = Number(vRng.value);
      saveSettings();
      vTxt.textContent = `${Math.round(settings.partyVol * 100)}%`;
      const eff = S.call?.deaf ? 0 : Math.round(settings.partyVol * 100);
      sendPartyCmd({ cmd: 'vol', vol: eff });
      video.volume = S.call?.deaf ? 0 : settings.partyVol;
    } });
    const ctrlBar = h('div', { class: 'party-ctrl' },
      playBtn, nextBtn, titleEl, timeEl,
      h('div', { class: 'p-vol' }, '🔊', vRng, vTxt)
    );
    const stat = h('div', { class: 'stat' });
    const el = h('div', { class: 'tile party-tile', 'data-tile': 'party' }, iframe, video, stat, tbtns, ctrlBar);
    video.addEventListener('ended', () => {
      if (S.party?.current) rpc('party.control', { key: S.callKey, action: 'ended', trackId: S.party.current.id }).catch(() => {});
    });
    video.addEventListener('timeupdate', () => {
      t.curPos = video.currentTime || 0;
      t.curDur = video.duration || 0;
      timeEl.textContent = fmtDur(t.curPos) + (t.curDur ? ' / ' + fmtDur(t.curDur) : '');
    });
    $('stage').append(el);
    t = { el, iframe, video, stat, tbtns, pinBtn, modeBtn, qBtn, playBtn, titleEl, timeEl, hasVideo: !settings.partyAudioOnly, curVid: '', curUrl: '', curPos: 0, curDur: 0 };
    tiles.set('party', t);
  }
  t.hasVideo = !settings.partyAudioOnly;
  t.el.classList.toggle('party-audio-mode', !!settings.partyAudioOnly);
  t.modeBtn.textContent = settings.partyAudioOnly ? '🎬 Ver video' : '🎧 Solo música';
  const qLen = S.party?.queue?.length || 0;
  t.qBtn.textContent = qLen ? `🎵 Cola (${qLen})` : '🎵 Cola / Buscar';
  return t;
}

function syncPartyTile() {
  const p = S.party;
  const t = tiles.get('party');
  if (!p?.current || !t) return;
  const cur = p.current;
  t.titleEl.textContent = `🎵 ${cur.title}${cur.addedBy ? ` · por ${cur.addedBy}` : ''}`;
  t.playBtn.textContent = p.playing ? '⏸' : '▶';
  const effVol = S.call?.deaf ? 0 : Math.round((settings.partyVol ?? 0.75) * 100);
  if (cur.kind === 'yt' && cur.ytId) {
    t.video.classList.add('hidden');
    t.video.pause?.();
    t.iframe.classList.remove('hidden');
    const targetSrc = `${httpBase()}/yt-player?v=${encodeURIComponent(cur.ytId)}&hl=es&gl=MX`;
    if (t.curVid !== cur.ytId) {
      t.curVid = cur.ytId;
      t.curPos = p.pos || 0;
      if (!t.iframe.src || !t.iframe.src.includes('/yt-player')) {
        t.iframe.src = targetSrc;
      } else {
        sendPartyCmd({ cmd: 'load', videoId: cur.ytId, pos: p.pos || 0, playing: p.playing });
        sendPartyCmd({ cmd: 'vol', vol: effVol });
      }
    } else {
      sendPartyCmd({ cmd: 'sync', videoId: cur.ytId, pos: p.pos || 0, playing: p.playing });
      sendPartyCmd({ cmd: 'vol', vol: effVol });
    }
  } else if (cur.url) {
    t.iframe.classList.add('hidden');
    sendPartyCmd({ cmd: 'pause' });
    t.video.classList.remove('hidden');
    const fullUrl = cur.url.startsWith('/') ? httpBase() + cur.url : cur.url;
    if (t.curUrl !== fullUrl) {
      t.curUrl = fullUrl;
      t.video.src = fullUrl;
    }
    t.video.volume = S.call?.deaf ? 0 : (settings.partyVol ?? 0.75);
    if (Math.abs((t.video.currentTime || 0) - (p.pos || 0)) > 2.2) {
      try { t.video.currentTime = p.pos || 0; } catch {}
    }
    if (p.playing) t.video.play?.().catch(() => {});
    else t.video.pause?.();
  }
}

window.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.src !== 'epickast-yt') return;
  const t = tiles.get('party');
  if (!t || !S.party?.current) return;
  if (d.ev === 'ready') {
    const effVol = S.call?.deaf ? 0 : Math.round((settings.partyVol ?? 0.75) * 100);
    sendPartyCmd({ cmd: 'vol', vol: effVol });
    sendPartyCmd({ cmd: 'sync', videoId: S.party.current.ytId, pos: S.party.pos || 0, playing: S.party.playing });
  } else if (d.ev === 'time') {
    t.curPos = d.pos || 0;
    t.curDur = d.duration || 0;
    t.timeEl.textContent = fmtDur(t.curPos) + (t.curDur ? ' / ' + fmtDur(t.curDur) : '');
  } else if (d.ev === 'ended') {
    rpc('party.control', { key: S.callKey, action: 'ended', trackId: S.party.current.id }).catch(() => {});
  }
});

function modalParty() {
  if (!S.call || !S.callKey) return toast('Únete primero a un canal de voz o llamada para usar el Bot DJ');
  const qInp = h('input', { placeholder: 'Busca en YouTube, pega un link de video o una Playlist (list=…)' });
  const resultsBox = h('div', { class: 'gal-list', style: 'max-height:210px' });
  const queueBox = h('div');

  const doSearch = async (queryText) => {
    const val = (queryText !== undefined ? queryText : qInp.value).trim();
    if (!val) return;
    if (queryText !== undefined) qInp.value = val;
    resultsBox.replaceChildren(h('div', { class: 'hint', style: 'padding:10px;text-align:center' }, '🔍 Buscando en YouTube…'));
    try {
      const r = await rpc('party.search', { q: val });
      const items = r.items || [];
      resultsBox.replaceChildren();
      if (!items.length) {
        resultsBox.append(h('div', { class: 'hint', style: 'padding:10px;text-align:center' }, 'No se encontraron videos. Prueba con otro término o pega un enlace directo.'));
        return;
      }
      if (items.length > 1 && /[?&]list=/.test(val)) {
        resultsBox.append(h('div', { class: 'item', style: 'background:rgba(124,92,255,.16);border:1px solid var(--ac)' },
          h('span', { style: 'font-weight:700;color:var(--tx)' }, `📋 Playlist detectada (${items.length} pistas)`),
          h('button', { class: 'primary', onclick: async () => {
            const res = await safe(rpc('party.add', { key: S.callKey, q: val }));
            toast(`🎵 Se agregaron ${res.added} pistas de la playlist a la cola`);
            resultsBox.replaceChildren();
            qInp.value = '';
          } }, `➕ Encolar las ${items.length} pistas`)
        ));
      }
      for (const it of items) {
        resultsBox.append(h('div', { class: 'item party-res' },
          it.thumb ? h('img', { src: it.thumb, class: 'yt-thumb', loading: 'lazy' }) : h('span', { style: 'font-size:20px' }, '🎵'),
          h('div', { style: 'min-width:0;flex:1' },
            h('div', { style: 'font-weight:600;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, it.title),
            h('div', { class: 'hint' }, `${it.author || 'YouTube'} · ${it.duration || ''}`)
          ),
          h('button', { class: 'primary', style: 'padding:6px 11px;font-size:12px;flex-shrink:0', onclick: async () => {
            await safe(rpc('party.add', { key: S.callKey, track: it }));
            toast(`🎵 Agregado: ${it.title.slice(0, 45)}`);
          } }, S.party?.current ? '➕ A la cola' : '▶ Poner ahora')
        ));
      }
    } catch (e) {
      resultsBox.replaceChildren(h('div', { class: 'err' }, e.message));
    }
  };

  qInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });

  const quickChips = h('div', { class: 'preset-chips' },
    [
      ['☕ Lofi Hip Hop Beats', 'lofi hip hop radio beats to relax study'],
      ['⚡ Phonk Gaming Mix', 'phonk gaming mix'],
      ['🎸 Rock Clásico Hits', 'classic rock greatest hits mix'],
      ['🎹 Synthwave Retro', 'synthwave retrowave mix'],
      ['🎧 Electrónica / EDM', 'electronic gaming music mix'],
    ].map(([lbl, q]) => h('button', { type: 'button', class: 'chip', onclick: () => doSearch(q) }, lbl))
  );

  const drawQueue = () => {
    queueBox.replaceChildren();
    const p = S.party;
    if (!p?.current) {
      queueBox.append(h('div', { class: 'hint', style: 'padding:12px;text-align:center;background:var(--bg3);border-radius:10px' },
        '🎵 No hay música ni videos sonando ahora. Busca una canción arriba o pega un link de YouTube / Playlist para escuchar y ver en conjunto con tus amigos.'
      ));
      return;
    }
    const cur = p.current;
    const t = tiles.get('party');
    const seekInput = h('input', {
      type: 'range', min: 0, max: Math.max(1, Math.round(t?.curDur || 300)), value: Math.round(t?.curPos || p.pos || 0),
      title: 'Adelantar o retroceder para toda la sala',
      onchange: () => rpc('party.control', { key: S.callKey, action: 'seek', pos: Number(seekInput.value) }).catch(() => {})
    });
    queueBox.append(
      h('div', { class: 'now-playing-card' },
        h('div', { style: 'display:flex;gap:10px;align-items:center' },
          cur.thumb ? h('img', { src: cur.thumb, class: 'yt-thumb big' }) : h('span', { style: 'font-size:26px' }, '🎵'),
          h('div', { style: 'min-width:0;flex:1' },
            h('div', { class: 'hint', style: 'color:#a29bfe;font-weight:700' }, p.playing ? '🟢 SONANDO AHORA EN CONJUNTO' : '⏸ EN PAUSA'),
            h('div', { style: 'font-weight:700;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, cur.title),
            h('div', { class: 'hint' }, `${cur.author || 'YouTube'} · pedido por ${cur.addedBy || 'alguien'}`)
          )
        ),
        seekInput,
        h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between' },
          h('div', { style: 'display:flex;gap:6px' },
            h('button', { class: 'primary', onclick: () => rpc('party.control', { key: S.callKey, action: p.playing ? 'pause' : 'play', pos: t?.curPos || p.pos || 0 }) }, p.playing ? '⏸ Pausar' : '▶ Reproducir'),
            h('button', { onclick: () => rpc('party.control', { key: S.callKey, action: 'next' }) }, '⏭ Siguiente'),
            h('button', { class: p.loop ? 'primary' : '', onclick: () => rpc('party.control', { key: S.callKey, action: 'loop' }) }, p.loop ? '🔁 Bucle ON' : '🔁 Bucle'),
            h('button', { class: settings.partyAudioOnly ? 'primary' : '', onclick: () => { settings.partyAudioOnly = !settings.partyAudioOnly; saveSettings(); renderStage(); syncPartyTile(); drawQueue(); } }, settings.partyAudioOnly ? '🎬 Ver Video' : '🎧 Solo Audio')
          ),
          h('button', { class: 'danger', style: 'padding:6px 10px;font-size:12px', onclick: () => rpc('party.control', { key: S.callKey, action: 'clear' }) }, '⏹ Detener todo')
        )
      )
    );
    if (p.queue?.length) {
      queueBox.append(h('div', { class: 'sect' }, `Siguientes en la cola — ${p.queue.length}`));
      const qList = h('div', { class: 'gal-list', style: 'max-height:175px' });
      p.queue.forEach((tr, idx) => {
        qList.append(h('div', { class: 'item', style: 'background:var(--bg3);gap:8px' },
          h('span', { class: 'hint', style: 'width:22px' }, `#${idx + 1}`),
          h('div', { style: 'min-width:0;flex:1' },
            h('div', { style: 'font-weight:600;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, tr.title),
            h('div', { class: 'hint' }, `${tr.author || 'YouTube'} · por ${tr.addedBy || ''}`)
          ),
          h('div', { style: 'display:flex;gap:5px' },
            h('button', { title: 'Reproducir esta pista ahora', style: 'padding:4px 8px;font-size:12px', onclick: () => rpc('party.control', { key: S.callKey, action: 'jump', index: idx }) }, '▶'),
            h('button', { class: 'btn-ico del', title: 'Quitar de la cola', onclick: () => rpc('party.control', { key: S.callKey, action: 'remove', index: idx }) }, '✕')
          )
        ));
      });
      queueBox.append(qList);
    }
  };

  S.partyModalUpdater = drawQueue;
  drawQueue();

  modal('🎵 EpicBot DJ — Música y YouTube en Conjunto',
    h('div', { class: 'add-friend-bar' },
      qInp,
      h('button', { class: 'primary', onclick: () => doSearch() }, '🔍 Buscar'),
      h('button', { title: 'Pega un link de YouTube o Playlist y encolar directamente', onclick: async () => {
        const v = qInp.value.trim(); if (!v) return;
        const r = await safe(rpc('party.add', { key: S.callKey, q: v }));
        toast(`🎵 Se agregaron ${r.added} pista(s)`);
        qInp.value = '';
      } }, '➕ Link directo')
    ),
    quickChips,
    resultsBox,
    queueBox
  );
  qInp.focus();
}

function renderStage() {
  const c = S.call; if (!c) return;
  if (S.outgoing && c.peers.size > 0) clearOutgoing();
  const keep = new Set();
  if (S.party?.current) {
    ensurePartyTile();
    keep.add('party');
  }
  const me = tile('me', 'Tú' + (c.serverMuted ? ' (Silenciado por Admin)' : (c.muted ? ' 🔇' : '')), S.me, false);
  keep.add('me');
  setStream(me, c.main, !!c.camTrack, true);
  me.updateBadges?.({ muted: c.muted, deaf: c.deaf, serverMuted: c.serverMuted, cam: !!c.camTrack });
  if (c.screenStream) {
    const liveTracks = c.screenStream.getVideoTracks().filter((t) => t.readyState !== 'ended');
    if (liveTracks.length > 0) {
      const t = tile('me-screen', 'Tu pantalla', S.me, false);
      keep.add('me-screen');
      setStream(t, new MediaStream(liveTracks), true, true);
    }
  }
  for (const p of c.peers.values()) {
    const user = { id: p.id, name: p.name, color: p.user?.color, av: p.user?.av };
    const friend = friendByDm(S.callKey)?.id === p.id ? friendByDm(S.callKey) : null; if (friend) { user.color = friend.color; user.av = friend.av; }
    const pSt = p.state || {};
    const label = p.name + (pSt.serverMuted ? ' (Silenciado por Admin)' : (pSt.muted ? ' 🔇' : ''));
    const k = 'p' + p.id; keep.add(k);
    const peerTile = tile(k, label, user, true);
    setStream(peerTile, p.streams.get(p.mainId) || null, !!pSt.cam, false);
    peerTile.updateBadges?.(pSt);
    if (p.state?.screen) {
      for (const [sid, st] of p.streams) {
        if (sid === p.mainId) continue;
        const liveVideo = st.getVideoTracks().filter((t) => t.readyState !== 'ended');
        if (liveVideo.length === 0) {
          p.streams.delete(sid);
          continue;
        }
        const sk = `p${p.id}-${sid}`; keep.add(sk);
        setStream(tile(sk, p.name + ' — pantalla', user, true), st, true, false);
      }
    } else {
      for (const [sid] of p.streams) {
        if (sid !== p.mainId) p.streams.delete(sid);
      }
    }
  }
  for (const [k, t] of tiles) if (!keep.has(k)) { t.boostCtx?.close().catch(() => {}); t.el.remove(); tiles.delete(k); }
  if (S.focusTile && !tiles.has(S.focusTile)) S.focusTile = null;

  // Enfoque inteligente estilo Google Meet:
  // 1) Si algún participante tiene cámara o pantalla activa y settings.hideNoVideo está activo,
  //    ocultamos los cuadros vacíos sin cámara (como "Tú" sin cámara) para que el video aproveche toda la pantalla.
  const videoKeys = [...tiles.entries()].filter(([, t]) => t.hasVideo).map(([k]) => k);
  const anyVideo = videoKeys.length > 0;
  let visibleCount = 0;
  for (const [k, t] of tiles) {
    // Nunca desmontar el tile de party (para que siga sonando en modo solo-música), pero si ningún otro tiene video mostrar al menos 'party' o 'me'
    const hide = anyVideo && settings.hideNoVideo && !t.hasVideo && S.focusTile !== k && k !== 'party';
    t.el.classList.toggle('hide-tile', hide);
    if (!hide) visibleCount++;
  }
  // 2) Si el usuario enfocó un tile (📌) o solo hay 1 video activo con más tiles visibles, activamos Spotlight
  const autoFocusKey = S.focusTile || (videoKeys.length === 1 ? videoKeys[0] : null);
  const stg = $('stage');
  const isSpotlight = !!autoFocusKey && tiles.has(autoFocusKey);
  stg.classList.toggle('spotlight', isSpotlight);
  stg.classList.toggle('solo', isSpotlight && visibleCount <= 1);

  // Recolectar tiles visibles secundarios para la barra lateral de spotlight
  const visibleSideTiles = [];
  for (const [k, t] of tiles) {
    if (k === autoFocusKey) continue;
    if (!t.el.classList.contains('hide-tile')) {
      visibleSideTiles.push(t.el);
    } else {
      t.el.remove();
    }
  }

  let sideStrip = $('stageSideStrip');
  const hasSideStrip = isSpotlight && visibleSideTiles.length > 0;
  stg.classList.toggle('solo', !hasSideStrip && isSpotlight);

  if (hasSideStrip) {
    if (!sideStrip) sideStrip = h('div', { id: 'stageSideStrip' });
    sideStrip.replaceChildren(...visibleSideTiles);
    const focusedTile = tiles.get(autoFocusKey);
    stg.replaceChildren(focusedTile.el, sideStrip);
  } else {
    if (sideStrip) sideStrip.remove();
    const visibleTiles = [];
    if (isSpotlight && autoFocusKey && tiles.has(autoFocusKey)) {
      visibleTiles.push(tiles.get(autoFocusKey).el);
    } else {
      for (const [, t] of tiles) {
        if (!t.el.classList.contains('hide-tile')) visibleTiles.push(t.el);
        else t.el.remove();
      }
    }
    stg.replaceChildren(...visibleTiles);
  }

  for (const [k, t] of tiles) {
    const foc = isSpotlight && k === autoFocusKey;
    t.el.classList.toggle('focused', foc);
    if (t.pinBtn) {
      t.pinBtn.classList.toggle('on', S.focusTile === k);
      setSvg(t.pinBtn, S.focusTile === k ? 'pin' : 'pinOff', 13);
      t.pinBtn.title = S.focusTile === k ? 'Desenfocar esta cámara' : 'Enfocar esta cámara (Spotlight)';
    }
  }
  updateDock();
}
function updateStatTimer() {
  clearInterval(S.statTimer); S.statTimer = null;
  tiles.forEach((t) => { t.stat.textContent = ''; });
  if (!settings.stats || !S.call) return;
  S.statTimer = setInterval(async () => {
    if (!S.call) return;
    const m = await window.epic.metrics().catch(() => []); const cpu = m.reduce((a, x) => a + x.cpu, 0); const mem = m.reduce((a, x) => a + x.mem, 0) / 1024;
    const cleanLabel = (S.callLabel || '').replace(/^🔊\s*/, '');
    $('voiceInfo').textContent = `🔊 ${cleanLabel} · CPU ${cpu.toFixed(0)}% · RAM ${(mem / 1024).toFixed(0)} MB`;
    const st = await S.call.stats();
    for (const [id, txt] of st) { const t = tiles.get('p' + id); if (t) t.stat.textContent = txt; }
  }, 2000);
}
function updatePingTimer() {
  clearInterval(S.pingTimer); S.pingTimer = null;
  const b = $('pingBadge');
  if (!S.call) { if (b) b.textContent = '🟢 Conectando…'; return; }
  const tick = async () => {
    if (!S.call || !b) return;
    const info = await S.call.pingSummary().catch(() => null);
    if (!info) {
      b.textContent = S.call.peers.size ? '🟢 En línea' : '🟢 Sala lista';
      b.title = 'Semáforo de señal en vivo';
      return;
    }
    const { rtt, loss = 0 } = info;
    if (rtt == null || isNaN(rtt)) {
      b.textContent = S.call.peers.size ? '🟢 En línea' : '🟢 Sala lista';
      b.title = 'Conexión WebRTC P2P activa';
      return;
    }
    const sem = rtt < 90 && loss < 2 ? '🟢' : rtt < 180 && loss < 6 ? '🟡' : '🔴';
    b.textContent = `${sem} ${rtt} ms${loss > 0 ? ` · ${loss}% pérd.` : ''}`;
    b.title = `Latencia P2P: ${rtt} ms · Pérdida de paquetes: ${loss}%`;
  };
  tick();
  S.pingTimer = setInterval(tick, 2500);
}

autoLogin();

$('winMin')?.addEventListener('click', () => window.epic?.minimize?.());
$('winMax')?.addEventListener('click', () => window.epic?.maximize?.());
$('winClose')?.addEventListener('click', () => window.epic?.close?.());


// Global keydown: Escape + Atajos de Navegación Rápida (Ctrl+, / Ctrl+0 / Ctrl+1..9)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else if (S.mini) {
      window.epic.toggleMini?.(false);
    } else if (S.focusTile) {
      S.focusTile = null;
      renderStage();
      toast('Spotlight desactivado');
    } else if ((Number(settings.stageHeight) || 60) > 60) {
      setStagePreset(60);
      toast('Escenario restaurado a tamaño equilibrado (60%)');
    }
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    if (e.key === ',' || e.code === 'Comma') {
      e.preventDefault();
      const modal = $('modal');
      if (modal && !modal.classList.contains('hidden')) closeModal();
      else modalSettings();
      return;
    }
    if (e.key === '0' || e.code === 'Digit0') {
      e.preventDefault();
      goHome();
      return;
    }
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      if (S.servers && S.servers[idx]) {
        openServer(S.servers[idx].id);
      }
      return;
    }
  }
});
