/**
 * EpicKast v2.0.0 — Insignias tipo Logros de Steam (Usuarios) y Niveles/Recompensas de Servidor
 */
'use strict';

(function (global) {
  const ACHIEVEMENTS = [
    // --- ANTIGÜEDAD ---
    {
      id: 'age_pioneer',
      category: 'Antigüedad',
      icon: '🌱',
      name: 'Pionero EpicKast',
      desc: 'Forma parte de la comunidad de EpicKast.',
      tier: 'common',
      check: (s) => (s.accountDays || 0) >= 0
    },
    {
      id: 'age_veteran',
      category: 'Antigüedad',
      icon: '🏅',
      name: 'Veterano (30+ días)',
      desc: 'Más de 30 días de antigüedad en la plataforma.',
      tier: 'rare',
      check: (s) => (s.accountDays || 0) >= 30
    },
    {
      id: 'age_founder',
      category: 'Antigüedad',
      icon: '👑',
      name: 'Leyenda Fundadora',
      desc: 'Cuenta fundadora o más de 90 días de antigüedad.',
      tier: 'legendary',
      check: (s) => (s.accountDays || 0) >= 90 || (Number(s.userId) > 0 && Number(s.userId) <= 5)
    },

    // --- JUEGOS REGISTRADOS ---
    {
      id: 'games_1',
      category: 'Juegos',
      icon: '🕹️',
      name: 'Gamer Iniciado',
      desc: '1 o más juegos detectados en tu actividad.',
      tier: 'common',
      check: (s) => (s.gamesCount || 0) >= 1
    },
    {
      id: 'games_3',
      category: 'Juegos',
      icon: '🎮',
      name: 'Multi-Gamer',
      desc: '3 o más juegos diferentes registrados.',
      tier: 'rare',
      check: (s) => (s.gamesCount || 0) >= 3
    },
    {
      id: 'games_6',
      category: 'Juegos',
      icon: '🏆',
      name: 'Coleccionista Gamer',
      desc: '6 o más juegos diferentes registrados.',
      tier: 'epic',
      check: (s) => (s.gamesCount || 0) >= 6
    },

    // --- HORAS EN LLAMADA ---
    {
      id: 'voice_1h',
      category: 'Llamadas',
      icon: '🎧',
      name: 'Primera Hora en Voz',
      desc: '1 o más horas acumuladas en llamadas.',
      tier: 'common',
      check: (s) => (s.voiceHours || 0) >= 1
    },
    {
      id: 'voice_10h',
      category: 'Llamadas',
      icon: '📻',
      name: 'Voz de la Comunidad',
      desc: '10 o más horas acumuladas en llamadas.',
      tier: 'epic',
      check: (s) => (s.voiceHours || 0) >= 10
    },
    {
      id: 'voice_50h',
      category: 'Llamadas',
      icon: '📡',
      name: 'Leyenda de Voz',
      desc: '50 o más horas acumuladas en llamadas.',
      tier: 'legendary',
      check: (s) => (s.voiceHours || 0) >= 50
    },

    // --- DUELOS GANADOS (SOLO PVP CONTRA JUGADORES REALES) ---
    {
      id: 'pvp_1',
      category: 'Duelos PvP',
      icon: '🥋',
      name: 'Primer Duelo Real',
      desc: 'Gana 1 duelo de Card-Jitsu contra un jugador real.',
      tier: 'rare',
      check: (s) => (s.dojoPvpWins || 0) >= 1
    },
    {
      id: 'pvp_5',
      category: 'Duelos PvP',
      icon: '🔥',
      name: 'Duelista Imparable',
      desc: 'Gana 5 duelos de Card-Jitsu contra jugadores reales.',
      tier: 'epic',
      check: (s) => (s.dojoPvpWins || 0) >= 5
    },
    {
      id: 'pvp_15',
      category: 'Duelos PvP',
      icon: '🐉',
      name: 'Gran Maestro PvP',
      desc: 'Gana 15 duelos de Card-Jitsu contra jugadores reales.',
      tier: 'legendary',
      check: (s) => (s.dojoPvpWins || 0) >= 15
    }
  ];

  const TIER_STYLES = {
    legendary: { bg: 'rgba(251,191,36,0.16)', border: '#fbbf24', color: '#fde047' },
    epic: { bg: 'rgba(168,85,247,0.16)', border: '#a855f7', color: '#e9d5ff' },
    rare: { bg: 'rgba(59,130,246,0.16)', border: '#3b82f6', color: '#bfdbfe' },
    common: { bg: 'rgba(148,163,184,0.12)', border: '#64748b', color: '#e2e8f0' }
  };

  const SERVER_LEVELS = [
    { level: 1, minXp: 0, title: 'Base', reward: 'Banner de Servidor Personalizado', badge: '🏠' },
    { level: 2, minXp: 200, title: 'Activo', reward: 'Degradados Pro de Servidor', badge: '⚡' },
    { level: 3, minXp: 600, title: 'Destacado', reward: 'Insignia Dorada de Servidor', badge: '🌟' },
    { level: 4, minXp: 1500, title: 'Élite', reward: 'Banners Animados de Servidor', badge: '💎' },
    { level: 5, minXp: 3500, title: 'Legendario', reward: 'Corona de Servidor Legendario', badge: '👑' }
  ];

  const SERVER_BANNER_PRESETS = [
    { id: 'srv_obsidian_violet', name: 'Obsidiana Violeta', minLevel: 1, val: 'linear-gradient(135deg, #0b0e18 0%, #312e81 55%, #7c3aed 100%)' },
    { id: 'srv_deep_ocean', name: 'Océano Profundo', minLevel: 1, val: 'linear-gradient(135deg, #04101f 0%, #0369a1 55%, #38bdf8 100%)' },
    { id: 'srv_emerald_pulse', name: 'Pulso Esmeralda', minLevel: 2, val: 'linear-gradient(135deg, #021814 0%, #047857 55%, #34d399 100%)' },
    { id: 'srv_crimson_forge', name: 'Forja Carmesí', minLevel: 2, val: 'linear-gradient(135deg, #1a0508 0%, #991b1b 55%, #f97316 100%)' },
    { id: 'srv_imperial_gold', name: 'Oro Imperial', minLevel: 3, val: 'linear-gradient(135deg, #140f04 0%, #92400e 50%, #fbbf24 100%)' },
    { id: 'srv_eclipse_anim', name: 'Eclipse Animado', minLevel: 4, animated: true, val: 'linear-gradient(125deg, #09061a 0%, #4c1d95 38%, #db2777 72%, #fbbf24 100%)' }
  ];

  function normalizeStats(raw = {}, userId = 0) {
    const createdAt = Number(raw.createdAt || raw.created_at || Date.now());
    const accountDays = Math.max(0, Math.floor((Date.now() - createdAt) / 86400000));
    const voiceSeconds = Math.max(0, Number(raw.voiceSeconds || raw.voice_seconds || 0));
    const voiceHours = +(voiceSeconds / 3600).toFixed(1);
    let games = [];
    if (Array.isArray(raw.gamesSeen)) games = raw.gamesSeen;
    else if (typeof raw.games_seen === 'string' && raw.games_seen) {
      try { games = JSON.parse(raw.games_seen); } catch {}
    }
    const dojoPvpWins = Math.max(0, Number(raw.dojoPvpWins ?? raw.dojo_pvp_wins ?? 0));
    const dojoPvpLosses = Math.max(0, Number(raw.dojoPvpLosses ?? raw.dojo_pvp_losses ?? 0));
    return {
      userId: Number(userId || raw.id || 0),
      createdAt,
      accountDays,
      voiceSeconds,
      voiceHours,
      gamesSeen: games,
      gamesCount: games.length,
      dojoPvpWins,
      dojoPvpLosses
    };
  }

  function evaluate(rawStats = {}, userId = 0) {
    const s = normalizeStats(rawStats, userId);
    const unlocked = [];
    const locked = [];
    for (const a of ACHIEVEMENTS) {
      const ok = !!a.check(s);
      (ok ? unlocked : locked).push({ ...a, unlocked: ok });
    }
    // Ordenar desbloqueadas por prestigio (legendary > epic > rare > common)
    const rank = { legendary: 4, epic: 3, rare: 2, common: 1 };
    unlocked.sort((a, b) => (rank[b.tier] || 0) - (rank[a.tier] || 0));
    return { stats: s, unlocked, locked, total: ACHIEVEMENTS.length };
  }

  function getServerLevel(xp) {
    const val = Math.max(0, Number(xp) || 0);
    let current = SERVER_LEVELS[0];
    let next = SERVER_LEVELS[1] || null;
    for (let i = 0; i < SERVER_LEVELS.length; i++) {
      if (val >= SERVER_LEVELS[i].minXp) {
        current = SERVER_LEVELS[i];
        next = SERVER_LEVELS[i + 1] || null;
      }
    }
    const pct = next
      ? Math.min(100, Math.round(((val - current.minXp) / Math.max(1, next.minXp - current.minXp)) * 100))
      : 100;
    return { xp: val, ...current, next, pct };
  }

  global.EKAchievements = {
    ACHIEVEMENTS,
    TIER_STYLES,
    SERVER_LEVELS,
    SERVER_BANNER_PRESETS,
    normalizeStats,
    evaluate,
    getServerLevel
  };
})(window);
