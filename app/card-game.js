'use strict';
/**
 * Dojo Elemental del Núcleo - Minijuego de Cartas Card-Jitsu
 * Versión: v1.8.6
 *
 * Características y Mejoras v1.8.4:
 * - Personajes Pixel Art en combate a gran escala (3/4 de presencia en el tapete).
 * - Fondo Pixel Art del Dojo Elemental (tatami, shoji, antorchas místicas).
 * - Estudio de Personalización Ninja interactivo (Gi, Máscaras, Ojos, Cinturón, Armas y Auras).
 * - Rediseño de Cartas estilo Trading Card (Ilustración central y placa de valor/elemento en esquina).
 * - Tablero de puntos por columnas elementales independientes con colores 100% distinguibles
 *   (Fuego Carmesí, Agua Azul Océano Profundo y Nieve Blanco Escarcha / Diamante Helado).
 * - Alertas tácticas en tiempo real de condiciones de victoria ("Falta 1 Nieve", "Peligro: 2 de Fuego").
 * - Cinemáticas a pantalla completa para cartas de nivel 10+ (Dragón Ígneo, Tsunami y Ventisca Cero).
 * - Dificultad escalonada por IA (hasta Gran Maestro implacable en Piso 5).
 */

(function () {
  const ELEMENTS = ['fire', 'water', 'snow'];

  // COLORES ELEMENTALES RIGUROSAMENTE DISTINGUIBLES
  const ELEM_CONFIG = {
    fire: {
      id: 'fire',
      name: 'Fuego',
      icon: '🔥',
      img: 'assets/cards/cute-fire.svg',
      color: '#ef4444',
      badgeBg: '#dc2626',
      badgeText: '#ffffff',
      bg: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
      border: '#f87171',
      glow: 'rgba(239, 68, 68, 0.5)',
      defeatBy: 'water',
      beats: 'snow',
      verb: 'calcina a',
      cinematicTitle: '¡EL DESPERTAR DEL DRAGÓN ÍGNEO!'
    },
    water: {
      id: 'water',
      name: 'Agua',
      icon: '💧',
      img: 'assets/cards/cute-water.svg',
      color: '#2563eb', // AZUL PROFUNDO REAL - CERO CONFUSIÓN
      badgeBg: '#1d4ed8',
      badgeText: '#ffffff',
      bg: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
      border: '#60a5fa',
      glow: 'rgba(37, 99, 235, 0.5)',
      defeatBy: 'snow',
      beats: 'fire',
      verb: 'apaga a',
      cinematicTitle: '¡EL GRAN TSUNAMI DEL LEVIATÁN!'
    },
    snow: {
      id: 'snow',
      name: 'Nieve',
      icon: '❄️',
      img: 'assets/cards/cute-snow.svg',
      color: '#e0f2fe', // BLANCO CRISTAL DE HIELO
      badgeBg: '#ffffff',
      badgeText: '#0f172a',
      bg: 'linear-gradient(135deg, #0284c7, #e0f2fe)',
      border: '#a5f3fc',
      glow: 'rgba(165, 243, 252, 0.65)',
      defeatBy: 'fire',
      beats: 'water',
      verb: 'congela a',
      cinematicTitle: '¡LA VENTISCA DEL CERO ABSOLUTO!'
    }
  };

  // CONFIGURACIÓN DE LOS 5 PISOS Y JEFES
  const FLOORS = [
    {
      level: 1,
      name: 'Novicio Ignis',
      belt: 'Cinturón Blanco',
      avatarImg: 'assets/bosses/ignis.jpg',
      color: '#ef4444',
      aiSkill: 0.20,
      quotes: {
        intro: '¡Que la llama del Núcleo guíe mis cartas!',
        winRound: '¡El fuego es impredecible!',
        loseRound: '¡Ugh, casi me apagas la llama!',
        defeat: 'Has dominado mi fuego... mereces avanzar.'
      },
      reward: { coins: 50, keys: { copper: 1 } },
      ninjaConfig: { giColor: '#b91c1c', giAccent: '#7f1d1d', beltColor: '#f8fafc', eyeColor: '#f59e0b', maskType: 'classic', weaponType: 'katanas', aura: 'fire' }
    },
    {
      level: 2,
      name: 'Monje de Escarcha',
      belt: 'Cinturón Azul',
      avatarImg: 'assets/bosses/frost.jpg',
      color: '#38bdf8',
      aiSkill: 0.50,
      quotes: {
        intro: 'El hielo no perdona la indecisión...',
        winRound: 'Tus movimientos se congelaron.',
        loseRound: '¡Una grieta en mi defensa de hielo!',
        defeat: 'El frío se disipa ante tu determinación.'
      },
      reward: { coins: 90, keys: { copper: 1, silver: 1 } },
      ninjaConfig: { giColor: '#0369a1', giAccent: '#075985', beltColor: '#38bdf8', eyeColor: '#e0f2fe', maskType: 'classic', weaponType: 'scroll', aura: 'snow' }
    },
    {
      level: 3,
      name: 'Guardián del Torrente',
      belt: 'Cinturón Rojo',
      avatarImg: 'assets/bosses/torrent.jpg',
      color: '#06b6d4',
      aiSkill: 0.75,
      quotes: {
        intro: '¡El caudal del torrente arrasará con todo!',
        winRound: '¡La corriente fue demasiado fuerte!',
        loseRound: '¡Has frenado mi torrente!',
        defeat: 'El agua cede el paso al verdadero maestro.'
      },
      reward: { coins: 150, keys: { silver: 1, gold: 1 } },
      ninjaConfig: { giColor: '#0f766e', giAccent: '#134e4a', beltColor: '#dc2626', eyeColor: '#38bdf8', maskType: 'kitsune', weaponType: 'shuriken', aura: 'water' }
    },
    {
      level: 4,
      name: 'Campeón de Basalto',
      belt: 'Cinturón Negro',
      avatarImg: 'assets/bosses/basalt.jpg',
      color: '#cbd5e1',
      aiSkill: 0.88,
      quotes: {
        intro: 'Forjado en roca y fuego eterno. ¡Demuestra tu valía!',
        winRound: '¡El basalto es inquebrantable!',
        loseRound: '¡Un impacto formidable!',
        defeat: 'Incluso la roca más dura reconoce tu poderío.'
      },
      reward: { coins: 250, keys: { gold: 1, obsidian: 1 } },
      ninjaConfig: { giColor: '#27272a', giAccent: '#18181b', beltColor: '#ef4444', eyeColor: '#ef4444', maskType: 'oni', weaponType: 'staff', aura: 'fire' }
    },
    {
      level: 5,
      name: 'Sensei del Núcleo',
      belt: 'Cinturón Dorado Supremo',
      avatarImg: 'assets/bosses/sensei.jpg',
      color: '#f59e0b',
      aiSkill: 0.98,
      quotes: {
        intro: 'El verdadero ninja sincroniza mente, cuerpo y elementos. ¡Comencemos!',
        winRound: 'Equilibrio y armonía superan la fuerza bruta.',
        loseRound: 'Interesante técnica... pero la batalla continúa.',
        defeat: '¡Extraordinario! Eres digno del cinturón supremo del Núcleo.'
      },
      reward: { coins: 500, keys: { obsidian: 2 } },
      ninjaConfig: { giColor: '#581c87', giAccent: '#3b0764', beltColor: '#fbbf24', eyeColor: '#fbbf24', maskType: 'sensei_kasa', weaponType: 'staff', aura: 'none' }
    }
  ];

  // ==========================================
  // GENERADOR PIXEL ART VECTORIAL DE NINJAS
  // ==========================================
  function generatePixelNinjaSVG(opt = {}, isFacingRight = true, width = 140, height = 175) {
    const giColor = opt.giColor || '#18181b';
    const giAccent = opt.giAccent || '#27272a';
    const skinColor = opt.skinColor || '#fcd34d';
    const eyeColor = opt.eyeColor || '#00e5ff';
    const beltColor = opt.beltColor || '#f8fafc';
    const maskType = opt.maskType || 'classic';
    const weaponType = opt.weaponType || 'katanas';
    const aura = opt.aura || 'none';

    const pixelSize = 6;
    const gridW = 24;
    const gridH = 30;

    const rects = [];
    function p(x, y, color, w = 1, h = 1) {
      if (!color || color === 'none') return;
      rects.push(`<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${w * pixelSize}" height="${h * pixelSize}" fill="${color}" shape-rendering="crispEdges"/>`);
    }

    // AURA TRASERA
    if (aura === 'fire') {
      p(2, 24, '#ef4444', 2, 4); p(1, 26, '#f59e0b', 1, 2);
      p(20, 23, '#ef4444', 2, 5); p(21, 25, '#fde047', 1, 2);
      p(3, 16, '#f59e0b', 1, 3); p(19, 14, '#ef4444', 1, 3);
    } else if (aura === 'water') {
      p(2, 26, '#0284c7', 3, 2); p(19, 25, '#38bdf8', 3, 2);
      p(3, 18, '#38bdf8', 1, 2); p(20, 16, '#bae6fd', 1, 2);
    } else if (aura === 'snow') {
      p(2, 12, '#ffffff', 1, 1); p(21, 10, '#e0f2fe', 1, 1);
      p(1, 22, '#7dd3fc', 1, 1); p(22, 20, '#ffffff', 1, 1);
      p(4, 27, '#e0f2fe', 2, 1); p(18, 26, '#ffffff', 2, 1);
    }

    // ARMA A LA ESPALDA
    if (weaponType === 'katanas') {
      p(5, 5, '#fbbf24', 1, 2); p(6, 7, '#d97706', 1, 1); p(7, 8, '#71717a', 2, 8);
      p(17, 5, '#fbbf24', 1, 2); p(16, 7, '#d97706', 1, 1); p(14, 8, '#71717a', 2, 8);
    } else if (weaponType === 'shuriken') {
      p(9, 6, '#94a3b8', 6, 2); p(11, 4, '#cbd5e1', 2, 6); p(11, 7, '#38bdf8', 2, 2);
    } else if (weaponType === 'scroll') {
      p(6, 9, '#78350f', 12, 3); p(5, 9, '#d97706', 1, 3); p(18, 9, '#d97706', 1, 3);
      p(7, 10, '#fef3c7', 10, 1);
    } else if (weaponType === 'staff') {
      p(18, 2, '#78350f', 2, 26); p(17, 2, '#fbbf24', 4, 2); p(18, 1, '#f59e0b', 2, 1);
    }

    // Cintas ondeando
    p(4, 5, beltColor, 2, 1); p(2, 6, beltColor, 3, 2); p(1, 8, beltColor, 2, 3);

    // PIERNAS Y BOTAS
    p(7, 20, giColor, 3, 4); p(6, 24, giColor, 4, 3); p(6, 27, '#27272a', 4, 2); p(5, 29, '#09090b', 5, 1);
    p(13, 20, giAccent, 4, 4); p(14, 24, giAccent, 3, 3); p(14, 27, '#27272a', 3, 2); p(14, 29, '#09090b', 5, 1);

    // TORSO Y GI
    p(7, 12, giColor, 10, 5); p(8, 13, giAccent, 2, 4); p(10, 12, skinColor, 3, 2); p(9, 14, '#27272a', 5, 1);

    // CINTURÓN (OBI)
    p(7, 17, beltColor, 10, 2); p(9, 19, beltColor, 2, 4); p(11, 19, beltColor, 2, 3);

    // BRAZOS Y GUARDIA
    p(4, 13, giColor, 3, 4); p(3, 17, '#27272a', 3, 3); p(3, 20, skinColor, 3, 2);
    p(16, 13, giAccent, 3, 4); p(17, 16, '#27272a', 3, 3); p(17, 19, skinColor, 3, 2);

    // CABEZA Y MÁSCARA
    p(8, 3, giColor, 8, 2); p(7, 5, giColor, 10, 6); p(8, 11, giColor, 8, 1);

    if (maskType === 'classic') {
      p(9, 6, skinColor, 6, 2);
      p(10, 6, eyeColor, 2, 1); p(13, 6, eyeColor, 2, 1);
      p(8, 4, '#71717a', 8, 1); p(11, 4, '#e4e4e7', 2, 1);
    } else if (maskType === 'kitsune') {
      p(8, 4, '#ffffff', 8, 7);
      p(7, 3, '#ffffff', 2, 2); p(15, 3, '#ffffff', 2, 2);
      p(7, 3, '#ef4444', 1, 1); p(16, 3, '#ef4444', 1, 1);
      p(9, 6, '#ef4444', 1, 2); p(14, 6, '#ef4444', 1, 2); p(11, 9, '#ef4444', 2, 1);
      p(10, 6, eyeColor, 1, 1); p(13, 6, eyeColor, 1, 1);
    } else if (maskType === 'oni') {
      p(8, 4, '#b91c1c', 8, 7);
      p(7, 2, '#fbbf24', 2, 2); p(15, 2, '#fbbf24', 2, 2);
      p(10, 6, eyeColor, 2, 1); p(12, 6, eyeColor, 2, 1);
      p(9, 8, '#ffffff', 1, 2); p(14, 8, '#ffffff', 1, 2);
    } else if (maskType === 'cyber') {
      p(8, 4, '#09090b', 8, 7);
      p(8, 6, eyeColor, 8, 2); p(10, 6, '#ffffff', 4, 1);
      p(9, 9, '#3f3f46', 6, 2);
    } else if (maskType === 'sensei_kasa') {
      p(4, 3, '#78350f', 16, 1); p(6, 2, '#b45309', 12, 1); p(9, 1, '#d97706', 6, 1); p(11, 0, '#fbbf24', 2, 1);
      p(9, 6, skinColor, 6, 2); p(10, 6, eyeColor, 1, 1); p(13, 6, eyeColor, 1, 1);
      p(10, 9, '#f8fafc', 4, 4); p(11, 13, '#f8fafc', 2, 2);
    }

    const transform = isFacingRight ? '' : 'transform="scale(-1, 1)" transform-origin="center"';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridW * pixelSize} ${gridH * pixelSize}" width="${width}" height="${height}" style="image-rendering:pixelated;image-rendering:crisp-edges;" ${transform}>${rects.join('')}</svg>`;
  }

  function getSavedNinjaConfig() {
    try {
      const raw = localStorage.getItem('epickast.ninja.v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      giColor: '#18181b',
      giAccent: '#27272a',
      skinColor: '#fcd34d',
      eyeColor: '#00e5ff',
      beltColor: '#f8fafc',
      beltName: 'Cinturón Blanco',
      maskType: 'classic',
      weaponType: 'katanas',
      aura: 'none'
    };
  }

  function saveNinjaConfig(cfg) {
    try { localStorage.setItem('epickast.ninja.v1', JSON.stringify(cfg)); } catch {}
  }

  // ==========================================
  // CLASE DE AUDIO EFECTOS (SINTETIZADOR)
  // ==========================================
  class AudioEffects {
    constructor() { this.ctx = null; }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }
    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.08) {
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch {}
    }
    cardSelect() { this.playTone(540, 'sine', 0.08, 0.06); }
    flip() { this.playTone(320, 'triangle', 0.06, 0.05); }
    clash() {
      this.playTone(180, 'triangle', 0.22, 0.14);
      setTimeout(() => this.playTone(110, 'square', 0.18, 0.09), 90);
    }
    burnSound() {
      this.playTone(220, 'sawtooth', 0.4, 0.12);
      setTimeout(() => this.playTone(440, 'sine', 0.3, 0.08), 120);
    }
    freezeSound() {
      this.playTone(980, 'triangle', 0.3, 0.1);
      setTimeout(() => this.playTone(660, 'sine', 0.35, 0.08), 90);
    }
    splashSound() {
      this.playTone(300, 'sine', 0.35, 0.12);
      setTimeout(() => this.playTone(160, 'triangle', 0.28, 0.1), 110);
    }
    cinematicPower() {
      [146, 220, 293, 440, 587, 880].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sawtooth', 0.35, 0.15), i * 65);
      });
    }
    winRound() {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.14, 0.1), i * 75);
      });
    }
    loseRound() {
      [400, 350, 300, 220].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sawtooth', 0.18, 0.09), i * 85);
      });
    }
    winMatch() {
      [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.3, 0.14), i * 95);
      });
    }
  }

  // ==========================================
  // JUEGO PRINCIPAL: CARD-JITSU
  // ==========================================
  class CardJitsuGame {
    constructor(container, options = {}) {
      this.container = container;
      this.options = options || {};
      this.currentFloor = 1;
      this.playerHand = [];
      this.aiHand = [];
      this.playerWon = [];
      this.aiWon = [];
      this.inMatch = false;
      this.isResolvingRound = false;
      this.matchWinner = null;
      this.turnTimer = null;
      this.timeLeft = 15;
      this.sfx = new AudioEffects();
      this.showTutorial = false;

      this.playerNinja = getSavedNinjaConfig();

      this.claimedFloors = {};
      try {
        const raw = localStorage.getItem('epickast.dojo.floors');
        if (raw) this.claimedFloors = JSON.parse(raw);
      } catch {}

      this.initStyles();
      this.initUI();
    }

    initStyles() {
      if (document.getElementById('card-jitsu-styles-v184')) return;
      const s = document.createElement('style');
      s.id = 'card-jitsu-styles-v184';
      s.textContent = `
        @keyframes cjCardFlipIn {
          0% { transform: scale(0.6) rotateY(90deg); opacity: 0; }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes cjScreenShake {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-6px, 4px); }
          40% { transform: translate(6px, -4px); }
          60% { transform: translate(-4px, 2px); }
          80% { transform: translate(4px, -2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes cjGoldShine {
          0% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
          50% { box-shadow: 0 0 25px rgba(251, 191, 36, 0.9), 0 0 40px rgba(245, 158, 11, 0.6); }
          100% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
        }
        @keyframes cjNinjaIdle {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        @keyframes cjNinjaStrike {
          0% { transform: translateX(0px); }
          50% { transform: translateX(35px) scale(1.08); }
          100% { transform: translateX(0px); }
        }
        @keyframes cjNinjaVictory {
          0% { transform: translateY(0); }
          30% { transform: translateY(-18px) rotate(-4deg); }
          60% { transform: translateY(-8px) rotate(4deg); }
          100% { transform: translateY(0); }
        }
        @keyframes cjBurnDissolve {
          0% { filter: brightness(1.5) drop-shadow(0 0 12px #ef4444); opacity: 1; transform: scale(1); }
          50% { filter: contrast(2) drop-shadow(0 0 24px #dc2626); transform: scale(1.1) rotate(5deg); }
          100% { opacity: 0; transform: scale(0.3) rotate(25deg); }
        }
        @keyframes cjIceFreezeShatter {
          0% { filter: brightness(1.8) drop-shadow(0 0 14px #38bdf8); opacity: 1; }
          40% { filter: contrast(1.8) drop-shadow(0 0 28px #a5f3fc); transform: scale(1.08); }
          100% { opacity: 0; transform: scale(0.2) translateY(20px); }
        }
        @keyframes cjWaterExtinguish {
          0% { filter: drop-shadow(0 0 14px #0284c7); opacity: 1; }
          50% { filter: drop-shadow(0 0 24px #0369a1); transform: scale(1.05) rotate(-6deg); }
          100% { opacity: 0; transform: scale(0.4) translateY(25px); }
        }

        .cj-trading-card {
          width: 104px;
          height: 148px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
          position: relative;
          user-select: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 6px;
          box-sizing: border-box;
          overflow: hidden;
          background: #0f172a;
        }
        .cj-trading-card:hover {
          transform: translateY(-12px) scale(1.08);
          box-shadow: 0 14px 28px rgba(0,0,0,0.7) !important;
          z-index: 10;
        }
        .cj-trading-card.power-10 {
          border: 2px solid #fbbf24 !important;
          animation: cjGoldShine 2s infinite ease-in-out;
        }
        .cj-corner-badge {
          position: absolute;
          top: 5px;
          left: 5px;
          border-radius: 6px;
          padding: 2px 7px;
          font-size: 11px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.6);
          z-index: 5;
        }
        .cj-power-star {
          position: absolute;
          top: 5px;
          right: 5px;
          background: #fbbf24;
          color: #78350f;
          font-size: 9px;
          font-weight: 900;
          padding: 1px 5px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          z-index: 5;
        }
      `;
      document.head.appendChild(s);
    }

    createCard() {
      const elem = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      const val = Math.floor(Math.random() * 11) + 2; // 2 al 12
      return { id: 'c_' + Math.random().toString(36).substring(2, 9), element: elem, value: val };
    }

    initHand() {
      this.playerHand = [];
      this.aiHand = [];
      for (let i = 0; i < 5; i++) {
        this.playerHand.push(this.createCard());
        this.aiHand.push(this.createCard());
      }
      this.playerWon = [];
      this.aiWon = [];
      this.matchWinner = null;
      this.isResolvingRound = false;
      this.playerNinja = getSavedNinjaConfig();
      this.startTurnTimer();
    }

    startTurnTimer() {
      clearInterval(this.turnTimer);
      this.timeLeft = 15;
      this.updateTimerBar();
      this.turnTimer = setInterval(() => {
        this.timeLeft--;
        this.updateTimerBar();
        if (this.timeLeft <= 0) {
          clearInterval(this.turnTimer);
          if (this.inMatch && !this.isResolvingRound && !this.matchWinner && this.playerHand.length > 0) {
            const randomCard = this.playerHand[Math.floor(Math.random() * this.playerHand.length)];
            this.playRound(randomCard, true);
          }
        }
      }, 1000);
    }

    updateTimerBar() {
      const bar = this.container.querySelector('#dojoTimerFill');
      const txt = this.container.querySelector('#dojoTimerTxt');
      if (bar) {
        const pct = Math.max(0, (this.timeLeft / 15) * 100);
        bar.style.width = pct + '%';
        bar.style.background = this.timeLeft <= 4 ? '#ef4444' : this.timeLeft <= 8 ? '#f59e0b' : '#10b981';
      }
      if (txt) {
        txt.textContent = `${this.timeLeft}s`;
        txt.style.color = this.timeLeft <= 4 ? '#ef4444' : '#94a3b8';
      }
    }

    checkWinCondition(wonCards) {
      if (wonCards.length < 3) return false;
      const counts = { fire: 0, water: 0, snow: 0 };
      wonCards.forEach(c => { if (counts[c.element] !== undefined) counts[c.element]++; });

      if (counts.fire >= 1 && counts.water >= 1 && counts.snow >= 1) {
        return { type: 'triad', desc: '¡Trío Elemental Supremo! (1 Fuego 🔥 + 1 Agua 💧 + 1 Nieve ❄️)' };
      }
      for (const el of ELEMENTS) {
        if (counts[el] >= 3) {
          const cfg = ELEM_CONFIG[el];
          return { type: 'monolith', desc: `¡Poder Monolítico! 3 cartas de ${cfg.name} ${cfg.icon}` };
        }
      }
      return false;
    }

    pickAICard(floorConfig) {
      if (this.aiHand.length === 0) return this.createCard();
      const level = floorConfig.level || 1;
      const skill = floorConfig.aiSkill || 0.3;

      if (level === 1) {
        if (Math.random() > skill) return this.aiHand[Math.floor(Math.random() * this.aiHand.length)];
        return this.aiHand.slice().sort((a, b) => a.value - b.value)[0];
      }

      if (level === 2) {
        const aiCounts = { fire: 0, water: 0, snow: 0 };
        this.aiWon.forEach(c => aiCounts[c.element]++);
        const missing = ELEMENTS.find(e => aiCounts[e] === 0);
        if (missing && Math.random() < skill) {
          const want = this.aiHand.find(c => c.element === missing);
          if (want) return want;
        }
      }

      if (level === 3 || level >= 4) {
        const pCounts = { fire: 0, water: 0, snow: 0 };
        this.playerWon.forEach(c => pCounts[c.element]++);

        const pMissing = ELEMENTS.filter(e => pCounts[e] === 0);
        if (pMissing.length === 1 && Math.random() < skill) {
          const dangerousElem = pMissing[0];
          const counter = { fire: 'water', snow: 'fire', water: 'snow' }[dangerousElem];
          const blocker = this.aiHand.find(c => c.element === counter);
          if (blocker) return blocker;
        }

        for (const el of ELEMENTS) {
          if (pCounts[el] === 2 && Math.random() < skill) {
            const counter = { fire: 'water', snow: 'fire', water: 'snow' }[el];
            const blocker = this.aiHand.find(c => c.element === counter);
            if (blocker) return blocker;
          }
        }
      }

      if (level === 4) {
        const highCards = this.aiHand.filter(c => c.value >= 9);
        if (highCards.length > 0 && Math.random() < skill) {
          return highCards.sort((a, b) => b.value - a.value)[0];
        }
      }

      if (level === 5) {
        let bestCard = this.aiHand[0];
        let maxScore = -999;
        const pCounts = { fire: 0, water: 0, snow: 0 };
        this.playerWon.forEach(c => pCounts[c.element]++);

        for (const c of this.aiHand) {
          let score = c.value * 0.5;
          const simWon = [...this.aiWon, c];
          if (this.checkWinCondition(simWon)) score += 100;

          const pMissing = ELEMENTS.filter(e => pCounts[e] === 0);
          if (pMissing.length === 1) {
            const danger = pMissing[0];
            const counter = { fire: 'water', snow: 'fire', water: 'snow' }[danger];
            if (c.element === counter) score += 50;
          }

          if (c.value >= 10) score += 15;
          if (score > maxScore) { maxScore = score; bestCard = c; }
        }
        return bestCard;
      }

      return this.aiHand[Math.floor(Math.random() * this.aiHand.length)];
    }

    playRound(playerCard, timedOut = false) {
      if (this.isResolvingRound || this.matchWinner) return;
      this.isResolvingRound = true;
      clearInterval(this.turnTimer);
      this.sfx.cardSelect();

      // Animación de ataque del ninja del jugador
      const pNinjaWrap = this.container.querySelector('#cjPlayerNinjaContainer');
      if (pNinjaWrap) {
        pNinjaWrap.style.animation = 'cjNinjaStrike 0.45s ease';
        setTimeout(() => { if (pNinjaWrap) pNinjaWrap.style.animation = 'cjNinjaIdle 2.6s infinite ease-in-out'; }, 450);
      }

      const floor = FLOORS[this.currentFloor - 1];
      const aiCard = this.pickAICard(floor);

      this.playerHand = this.playerHand.filter(c => c.id !== playerCard.id);
      this.aiHand = this.aiHand.filter(c => c.id !== aiCard.id);
      this.playerHand.push(this.createCard());
      this.aiHand.push(this.createCard());

      let roundWinner = 'tie';
      let reason = '';
      let clashType = 'element';

      if (playerCard.element === aiCard.element) {
        clashType = 'number';
        if (playerCard.value > aiCard.value) {
          roundWinner = 'player';
          reason = `Mismo elemento (${ELEM_CONFIG[playerCard.element].name}). Tu valor (${playerCard.value}) superó a (${aiCard.value}).`;
        } else if (playerCard.value < aiCard.value) {
          roundWinner = 'ai';
          reason = `Mismo elemento (${ELEM_CONFIG[playerCard.element].name}). El valor rival (${aiCard.value}) superó a (${playerCard.value}).`;
        } else {
          clashType = 'tie';
          roundWinner = 'tie';
          reason = `¡Empate idéntico! Mismo elemento y mismo valor (${playerCard.value}).`;
        }
      } else {
        const winsOver = { fire: 'snow', snow: 'water', water: 'fire' };
        if (winsOver[playerCard.element] === aiCard.element) {
          roundWinner = 'player';
          const pCfg = ELEM_CONFIG[playerCard.element];
          const aCfg = ELEM_CONFIG[aiCard.element];
          reason = `¡${pCfg.name} ${pCfg.icon} ${pCfg.verb} ${aCfg.name} ${aCfg.icon}!`;
        } else {
          roundWinner = 'ai';
          const aCfg = ELEM_CONFIG[aiCard.element];
          const pCfg = ELEM_CONFIG[playerCard.element];
          reason = `¡${aCfg.name} ${aCfg.icon} rival ${aCfg.verb} tu ${pCfg.name} ${pCfg.icon}!`;
        }
      }

      const winningCard = roundWinner === 'player' ? playerCard : roundWinner === 'ai' ? aiCard : null;
      const isCinematic = winningCard && winningCard.value >= 10;

      this.renderClashPacing(playerCard, aiCard, roundWinner, reason, clashType, isCinematic, timedOut, () => {
        if (roundWinner === 'player') {
          this.playerWon.push(playerCard);
          this.sfx.winRound();
          if (pNinjaWrap) pNinjaWrap.style.animation = 'cjNinjaVictory 0.7s ease';
        } else if (roundWinner === 'ai') {
          this.aiWon.push(aiCard);
          this.sfx.loseRound();
          const aiNinjaWrap = this.container.querySelector('#cjAiNinjaContainer');
          if (aiNinjaWrap) aiNinjaWrap.style.animation = 'cjNinjaVictory 0.7s ease';
        }

        const pWin = this.checkWinCondition(this.playerWon);
        const aiWin = this.checkWinCondition(this.aiWon);

        if (pWin) {
          this.matchWinner = 'player';
          this.isResolvingRound = false;
          this.renderMatchBoard();
          this.sfx.winMatch();
          this.renderMatchResult(true, pWin.desc);
        } else if (aiWin) {
          this.matchWinner = 'ai';
          this.isResolvingRound = false;
          this.renderMatchBoard();
          this.renderMatchResult(false, aiWin.desc);
        } else {
          this.isResolvingRound = false;
          this.renderMatchBoard();
          this.startTurnTimer();
        }
      });
    }

    renderClashPacing(pCard, aCard, roundWinner, reason, clashType, isCinematic, timedOut, onDone) {
      const centerClash = this.container.querySelector('#cjCenterClashArea');
      if (!centerClash) return onDone();

      const pCfg = ELEM_CONFIG[pCard.element];
      const aCfg = ELEM_CONFIG[aCard.element];
      const floor = FLOORS[this.currentFloor - 1];

      // FASE 1: Cartas se revelan en el centro
      centerClash.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="font-size:12px;font-weight:900;color:#fbbf24;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;text-shadow:0 0 8px rgba(251,191,36,0.6);">
            ⚡ ¡CARTAS REVELADAS!
          </div>
          <div style="display:flex;justify-content:center;align-items:center;gap:30px;animation: cjCardFlipIn 0.45s ease-out;">
            <!-- Carta Jugador -->
            <div class="cj-trading-card ${pCard.value >= 10 ? 'power-10' : ''}" style="border:2px solid ${pCfg.border};box-shadow:0 0 16px ${pCfg.glow};">
              <div class="cj-corner-badge" style="background:${pCfg.badgeBg};color:${pCfg.badgeText};">
                ${pCard.value} <span>${pCfg.icon}</span>
              </div>
              ${pCard.value >= 10 ? `<div class="cj-power-star">★ ${pCard.value}</div>` : ''}
              <div style="height:86px;border-radius:6px;background:url('${pCfg.img}') center/cover no-repeat;margin-top:22px;border:1px solid rgba(255,255,255,0.2);"></div>
              <div style="font-size:10px;font-weight:900;color:#fff;text-align:center;letter-spacing:1px;">${pCfg.name.toUpperCase()}</div>
            </div>

            <div style="font-size:18px;font-weight:900;color:#64748b;background:#090d14;border:1.5px solid #202636;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.6);">VS</div>

            <!-- Carta Rival -->
            <div class="cj-trading-card ${aCard.value >= 10 ? 'power-10' : ''}" style="border:2px solid ${aCfg.border};box-shadow:0 0 16px ${aCfg.glow};">
              <div class="cj-corner-badge" style="background:${aCfg.badgeBg};color:${aCfg.badgeText};">
                ${aCard.value} <span>${aCfg.icon}</span>
              </div>
              ${aCard.value >= 10 ? `<div class="cj-power-star">★ ${aCard.value}</div>` : ''}
              <div style="height:86px;border-radius:6px;background:url('${aCfg.img}') center/cover no-repeat;margin-top:22px;border:1px solid rgba(255,255,255,0.2);"></div>
              <div style="font-size:10px;font-weight:900;color:#fff;text-align:center;letter-spacing:1px;">${aCfg.name.toUpperCase()}</div>
            </div>
          </div>
        </div>
      `;
      this.sfx.flip();

      // FASE 2: Choque y Cinemática tras 700ms
      setTimeout(() => {
        let pAnim = '';
        let aAnim = '';
        let cinematicBanner = '';

        if (isCinematic) {
          this.sfx.cinematicPower();
          const winCard = roundWinner === 'player' ? pCard : aCard;
          const winCfg = ELEM_CONFIG[winCard.element];
          cinematicBanner = `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%);z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:10px;pointer-events:none;padding:16px;">
              <div style="font-size:46px;margin-bottom:6px;filter:drop-shadow(0 0 24px ${winCfg.color});">${winCfg.icon}</div>
              <div style="font-size:18px;font-weight:900;color:#fde047;letter-spacing:1px;text-transform:uppercase;text-align:center;text-shadow:0 0 16px rgba(251,191,36,0.9);">${winCfg.cinematicTitle}</div>
              <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">Carta Legendaria de Poder ${winCard.value} desatada</div>
            </div>
          `;
          const mat = this.container.querySelector('#dojoClashMat');
          if (mat) {
            mat.style.animation = 'cjScreenShake 0.6s ease-in-out';
            setTimeout(() => { if (mat) mat.style.animation = ''; }, 600);
          }
        }

        if (roundWinner === 'player') {
          if (clashType === 'element') {
            if (pCard.element === 'fire') { aAnim = 'animation: cjBurnDissolve 1.6s forwards;'; this.sfx.burnSound(); }
            else if (pCard.element === 'snow') { aAnim = 'animation: cjIceFreezeShatter 1.6s forwards;'; this.sfx.freezeSound(); }
            else if (pCard.element === 'water') { aAnim = 'animation: cjWaterExtinguish 1.6s forwards;'; this.sfx.splashSound(); }
          } else {
            aAnim = 'animation: cjWaterExtinguish 1.3s forwards;';
            this.sfx.clash();
          }
        } else if (roundWinner === 'ai') {
          if (clashType === 'element') {
            if (aCard.element === 'fire') { pAnim = 'animation: cjBurnDissolve 1.6s forwards;'; this.sfx.burnSound(); }
            else if (aCard.element === 'snow') { pAnim = 'animation: cjIceFreezeShatter 1.6s forwards;'; this.sfx.freezeSound(); }
            else if (aCard.element === 'water') { pAnim = 'animation: cjWaterExtinguish 1.6s forwards;'; this.sfx.splashSound(); }
          } else {
            pAnim = 'animation: cjWaterExtinguish 1.3s forwards;';
            this.sfx.clash();
          }
        } else {
          pAnim = 'animation: cjScreenShake 0.5s ease;';
          aAnim = 'animation: cjScreenShake 0.5s ease;';
          this.sfx.clash();
        }

        const dialogueQuote = roundWinner === 'player'
          ? (floor.quotes?.loseRound || '¡Buen golpe!')
          : roundWinner === 'ai'
          ? (floor.quotes?.winRound || '¡Siente el poder!')
          : '¡Equilibrio perfecto!';

        centerClash.innerHTML = `
          ${cinematicBanner}
          <div style="position:relative;width:100%;display:flex;flex-direction:column;align-items:center;z-index:5;">
            ${timedOut ? `<div style="font-size:11px;color:#f59e0b;font-weight:700;margin-bottom:4px;">⏱️ Tiempo agotado: Carta automática</div>` : ''}

            <!-- Banner central de resultado -->
            <div style="background:${roundWinner === 'player' ? 'rgba(16,185,129,0.22)' : roundWinner === 'ai' ? 'rgba(239,68,68,0.22)' : 'rgba(245,158,11,0.22)'};border:1.5px solid ${roundWinner === 'player' ? '#10b981' : roundWinner === 'ai' ? '#ef4444' : '#f59e0b'};border-radius:20px;padding:5px 18px;margin-bottom:10px;box-shadow:0 4px 18px rgba(0,0,0,0.5);">
              <span style="font-size:13.5px;font-weight:900;letter-spacing:0.5px;color:${roundWinner === 'player' ? '#34d399' : roundWinner === 'ai' ? '#f87171' : '#fbbf24'};">
                ${roundWinner === 'player' ? '⚡ ¡RONDA PARA TI!' : roundWinner === 'ai' ? '💥 ¡RONDA PARA EL RIVAL!' : '⚖️ ¡EMPATE ELEMENTAL!'}
              </span>
            </div>

            <!-- Choque animado -->
            <div style="display:flex;justify-content:center;align-items:center;gap:30px;margin-bottom:8px;">
              <div class="cj-trading-card" style="border:2px solid ${pCard.value >= 10 ? '#fbbf24' : pCfg.border};box-shadow:0 0 16px ${pCfg.glow};${pAnim}">
                <div class="cj-corner-badge" style="background:${pCfg.badgeBg};color:${pCfg.badgeText};">${pCard.value} <span>${pCfg.icon}</span></div>
                <div style="height:86px;border-radius:6px;background:url('${pCfg.img}') center/cover no-repeat;margin-top:22px;border:1px solid rgba(255,255,255,0.2);"></div>
                <div style="font-size:10px;font-weight:900;color:#fff;text-align:center;">${pCfg.name.toUpperCase()}</div>
              </div>

              <div style="font-size:18px;font-weight:900;color:#64748b;background:#090d14;border:1px solid #202636;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;">VS</div>

              <div class="cj-trading-card" style="border:2px solid ${aCard.value >= 10 ? '#fbbf24' : aCfg.border};box-shadow:0 0 16px ${aCfg.glow};${aAnim}">
                <div class="cj-corner-badge" style="background:${aCfg.badgeBg};color:${aCfg.badgeText};">${aCard.value} <span>${aCfg.icon}</span></div>
                <div style="height:86px;border-radius:6px;background:url('${aCfg.img}') center/cover no-repeat;margin-top:22px;border:1px solid rgba(255,255,255,0.2);"></div>
                <div style="font-size:10px;font-weight:900;color:#fff;text-align:center;">${aCfg.name.toUpperCase()}</div>
              </div>
            </div>

            <div style="font-size:12px;font-weight:800;color:#cbd5e1;margin-bottom:4px;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,0.8);">
              ${reason}
            </div>

            <div style="font-size:11px;color:#94a3b8;font-style:italic;background:rgba(0,0,0,0.6);padding:3px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);">
              💬 <b>${floor.name}:</b> "${dialogueQuote}"
            </div>
          </div>
        `;

        const totalWait = isCinematic ? 2600 : 2000;
        setTimeout(onDone, totalWait);
      }, 700);
    }

    renderMatchResult(playerWon, reasonDesc) {
      clearInterval(this.turnTimer);
      const centerClash = this.container.querySelector('#cjCenterClashArea');
      if (!centerClash) return;

      const floor = FLOORS[this.currentFloor - 1];

      if (playerWon) {
        let rewText = `+${floor.reward.coins} 🪙 Monedas`;
        if (floor.reward.keys) {
          const kParts = [];
          if (floor.reward.keys.copper) kParts.push(`${floor.reward.keys.copper} Cobre 🟤`);
          if (floor.reward.keys.silver) kParts.push(`${floor.reward.keys.silver} Plata ⚪`);
          if (floor.reward.keys.gold) kParts.push(`${floor.reward.keys.gold} Oro 🟡`);
          if (floor.reward.keys.obsidian) kParts.push(`${floor.reward.keys.obsidian} Obsidiana 🟣`);
          rewText += ` · ` + kParts.join(', ');
        }

        if (this.options.onReward) {
          this.options.onReward(floor.reward);
        }

        this.claimedFloors[floor.level] = true;
        try { localStorage.setItem('epickast.dojo.floors', JSON.stringify(this.claimedFloors)); } catch {}

        centerClash.innerHTML = `
          <div style="padding:18px 24px;background:rgba(10,25,18,0.92);border:2px solid #10b981;border-radius:12px;text-align:center;box-shadow:0 8px 32px rgba(16,185,129,0.3);animation: cjCardFlipIn 0.35s ease;max-width:440px;">
            <div style="font-size:32px;margin-bottom:4px;">🏆</div>
            <div style="font-size:17px;font-weight:900;color:#10b981;margin-bottom:4px;letter-spacing:0.5px;">¡VICTORIA EN PISO ${floor.level}!</div>
            <div style="font-size:12.5px;color:#e2e8f0;margin-bottom:6px;">${reasonDesc}</div>
            <div style="font-size:11.5px;color:#94a3b8;font-style:italic;margin-bottom:12px;">"${floor.quotes?.defeat || 'Bien jugado.'}"</div>

            <div style="font-size:12px;font-weight:800;color:#fde047;background:rgba(0,0,0,0.6);border:1px solid rgba(253,224,71,0.3);padding:8px 14px;border-radius:8px;display:inline-block;margin-bottom:14px;">
              🎁 Recompensas obtenidas: ${rewText}
            </div>

            <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
              ${this.currentFloor < 5 ? `
                <button id="dojoBtnNextFloor" style="background:#2563eb;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.4);">
                  ⚔️ Desafiar Piso ${this.currentFloor + 1}
                </button>
              ` : `
                <button id="dojoBtnReplay" style="background:#059669;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">
                  👑 ¡Maestro del Núcleo! Repetir combate
                </button>
              `}
              <button id="dojoBtnBackLobby" style="background:#1e2433;color:#cbd5e1;border:1px solid #3b4660;padding:8px 14px;border-radius:6px;font-weight:700;font-size:11.5px;cursor:pointer;">
                Volver al Salón
              </button>
            </div>
          </div>
        `;
      } else {
        centerClash.innerHTML = `
          <div style="padding:18px 24px;background:rgba(25,12,14,0.92);border:2px solid #ef4444;border-radius:12px;text-align:center;box-shadow:0 8px 32px rgba(239,68,68,0.3);animation: cjCardFlipIn 0.35s ease;max-width:440px;">
            <div style="font-size:32px;margin-bottom:4px;">💀</div>
            <div style="font-size:17px;font-weight:900;color:#ef4444;margin-bottom:4px;">DERROTA EN PISO ${floor.level}</div>
            <div style="font-size:12.5px;color:#e2e8f0;margin-bottom:6px;">${reasonDesc}</div>
            <div style="font-size:11.5px;color:#94a3b8;font-style:italic;margin-bottom:12px;">"${floor.quotes?.winRound || 'Sigue entrenando.'}"</div>

            <div style="display:flex;justify-content:center;gap:10px;">
              <button id="dojoBtnRetry" style="background:#ef4444;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 4px 12px rgba(239,68,68,0.4);">
                🔄 Reintentar Combate
              </button>
              <button id="dojoBtnBackLobby" style="background:#1e2433;color:#cbd5e1;border:1px solid #3b4660;padding:8px 14px;border-radius:6px;font-weight:700;font-size:11.5px;cursor:pointer;">
                Volver al Salón
              </button>
            </div>
          </div>
        `;
      }

      const btnNext = centerClash.querySelector('#dojoBtnNextFloor');
      if (btnNext) btnNext.onclick = () => { this.currentFloor++; this.startMatch(this.currentFloor); };

      const btnReplay = centerClash.querySelector('#dojoBtnReplay');
      if (btnReplay) btnReplay.onclick = () => { this.startMatch(this.currentFloor); };

      const btnRetry = centerClash.querySelector('#dojoBtnRetry');
      if (btnRetry) btnRetry.onclick = () => { this.startMatch(this.currentFloor); };

      const btnBack = centerClash.querySelector('#dojoBtnBackLobby');
      if (btnBack) btnBack.onclick = () => { this.inMatch = false; this.initUI(); };
    }

    startMatch(floorLevel) {
      this.currentFloor = floorLevel;
      this.inMatch = true;
      this.initHand();
      this.renderMatchBoard();
    }

    renderMatchBoard() {
      const floor = FLOORS[this.currentFloor - 1];
      const meName = this.options.playerName || 'Tú';
      this.playerNinja = getSavedNinjaConfig();
      const playerNinjaCfg = this.playerNinja;
      const bossNinjaCfg = floor.ninjaConfig;

      // RENDERIZADOR DE COLUMNAS ELEMENTALES CON COLORES 100% DISTINGUIBLES
      const renderElementSlots = (cards) => {
        const fCards = cards.filter(c => c.element === 'fire');
        const wCards = cards.filter(c => c.element === 'water');
        const sCards = cards.filter(c => c.element === 'snow');

        return `
          <div style="display:flex;gap:5px;align-items:center;">
            <!-- FUEGO 🔥 -->
            <div style="background:${fCards.length ? '#dc2626' : '#1e1c24'};border:1px solid ${fCards.length ? '#ef4444' : '#2d2b38'};color:#fff;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:900;display:flex;align-items:center;gap:4px;box-shadow:${fCards.length ? '0 0 8px rgba(239,68,68,0.5)' : 'none'};">
              <span>🔥</span>
              <span>${fCards.length ? fCards.map(c=>c.value).join(',') : '—'}</span>
            </div>

            <!-- AGUA 💧 (AZUL PROFUNDO) -->
            <div style="background:${wCards.length ? '#1d4ed8' : '#141c2b'};border:1px solid ${wCards.length ? '#3b82f6' : '#1e2d45'};color:#fff;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:900;display:flex;align-items:center;gap:4px;box-shadow:${wCards.length ? '0 0 8px rgba(37,99,235,0.5)' : 'none'};">
              <span>💧</span>
              <span>${wCards.length ? wCards.map(c=>c.value).join(',') : '—'}</span>
            </div>

            <!-- NIEVE ❄️ (BLANCO CRISTAL DE HIELO) -->
            <div style="background:${sCards.length ? '#ffffff' : '#151c22'};border:1.5px solid ${sCards.length ? '#0284c7' : '#1f2e3d'};color:${sCards.length ? '#0f172a' : '#64748b'};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:900;display:flex;align-items:center;gap:4px;box-shadow:${sCards.length ? '0 0 10px rgba(165,243,252,0.8)' : 'none'};">
              <span>❄️</span>
              <span>${sCards.length ? sCards.map(c=>c.value).join(',') : '—'}</span>
            </div>
          </div>
        `;
      };

      // EVALUADOR TÁCTICO EN TIEMPO REAL
      const getTacticalAlert = () => {
        const pCounts = { fire: 0, water: 0, snow: 0 };
        this.playerWon.forEach(c => pCounts[c.element]++);
        const aiCounts = { fire: 0, water: 0, snow: 0 };
        this.aiWon.forEach(c => aiCounts[c.element]++);

        const aiMiss = ELEMENTS.filter(e => aiCounts[e] === 0);
        if (aiMiss.length === 1) {
          const name = ELEM_CONFIG[aiMiss[0]].name.toUpperCase();
          const icon = ELEM_CONFIG[aiMiss[0]].icon;
          return `<span style="color:#f87171;">⚠️ ¡PELIGRO! Al rival le falta 1 ${name} ${icon} para ganar</span>`;
        }
        for (const el of ELEMENTS) {
          if (aiCounts[el] === 2) return `<span style="color:#f87171;">⚠️ ¡Alerta! Rival tiene 2 cartas de ${ELEM_CONFIG[el].name.toUpperCase()}</span>`;
        }

        const pMiss = ELEMENTS.filter(e => pCounts[e] === 0);
        if (pMiss.length === 1) {
          const name = ELEM_CONFIG[pMiss[0]].name.toUpperCase();
          const icon = ELEM_CONFIG[pMiss[0]].icon;
          return `<span style="color:#34d399;">⚡ ¡A 1 CARTA! Necesitas 1 ${name} ${icon} para ganar</span>`;
        }
        for (const el of ELEMENTS) {
          if (pCounts[el] === 2) return `<span style="color:#34d399;">⚡ ¡Tienes 2 de ${ELEM_CONFIG[el].name.toUpperCase()}, 1 más para ganar!</span>`;
        }

        return '<span style="color:#94a3b8;">Condición de Victoria: 1 de cada elemento (🔥 + 💧 + ❄️) O 3 del mismo elemento</span>';
      };

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;">
          <!-- Barra Superior: Tablero de Puntos Elemental y Estado -->
          <div style="background:#0e121a;border:1px solid #202636;border-radius:10px;padding:8px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <!-- Puntos Jugador -->
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:11.5px;font-weight:900;color:#38bdf8;">TÚ (${this.playerWon.length}):</span>
                ${renderElementSlots(this.playerWon)}
              </div>

              <!-- Centro: Temporizador y Alerta Táctica -->
              <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-size:11px;font-weight:800;color:#94a3b8;">TURNO:</span>
                  <span id="dojoTimerTxt" style="font-size:12px;font-weight:900;color:#10b981;">15s</span>
                  <button id="dojoBtnExitMatch" style="background:#1e2433;border:1px solid #3b4660;color:#cbd5e1;padding:2px 8px;border-radius:4px;font-size:10.5px;cursor:pointer;margin-left:6px;font-weight:700;">
                    ✕ Salir
                  </button>
                </div>
                <div style="width:130px;height:4px;background:#1e2433;border-radius:2px;overflow:hidden;">
                  <div id="dojoTimerFill" style="width:100%;height:100%;background:#10b981;transition:width 0.3s linear;"></div>
                </div>
              </div>

              <!-- Puntos Rival -->
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:11.5px;font-weight:900;color:#f87171;">RIVAL (${this.aiWon.length}):</span>
                ${renderElementSlots(this.aiWon)}
              </div>
            </div>

            <div style="text-align:center;margin-top:6px;font-size:11px;border-top:1px solid #1a2233;padding-top:4px;">
              ${getTacticalAlert()}
            </div>
          </div>

          <!-- TAPETE DE COMBATE CON FONDO PIXEL ART DEL DOJO Y NINJAS A GRAN ESCALA -->
          <div id="dojoClashMat" style="background:linear-gradient(rgba(10,14,22,0.65), rgba(10,14,22,0.8)), url('assets/dojo-arena.jpg') center/cover no-repeat;border:1.5px solid #28334a;border-radius:12px;min-height:280px;display:flex;justify-content:space-between;align-items:center;padding:12px 18px;position:relative;overflow:hidden;box-shadow:inset 0 0 35px rgba(0,0,0,0.85);">
            
            <!-- LADO IZQUIERDO: NINJA DEL JUGADOR (PIXEL ART) -->
            <div id="cjPlayerNinjaContainer" style="display:flex;flex-direction:column;align-items:center;min-width:140px;z-index:4;animation: cjNinjaIdle 2.6s infinite ease-in-out;">
              <div style="filter:drop-shadow(0 10px 14px rgba(0,0,0,0.85));">
                ${generatePixelNinjaSVG(playerNinjaCfg, true, 135, 170)}
              </div>
              <div style="width:85px;height:12px;background:radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 70%);border-radius:50%;margin-top:-6px;"></div>
              <div style="margin-top:6px;background:rgba(15,23,42,0.92);border:1.5px solid #3b82f6;border-radius:12px;padding:3px 12px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.6);">
                <div style="font-size:12px;font-weight:900;color:#fff;">${meName}</div>
                <div style="font-size:10px;font-weight:800;color:#93c5fd;">${playerNinjaCfg.beltName || 'Cinturón Blanco'}</div>
              </div>
            </div>

            <!-- CENTRO: ÁREA DE CLASH / CARTAS Y RESULTADOS -->
            <div id="cjCenterClashArea" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:5;min-height:220px;padding:0 12px;">
              <div style="font-size:13.5px;font-weight:900;color:#f8fafc;margin-bottom:8px;text-shadow:0 2px 8px rgba(0,0,0,0.9);letter-spacing:0.5px;">
                ⚡ Selecciona una carta de tu mano para atacar
              </div>
              <div style="display:flex;gap:12px;font-size:11px;color:#cbd5e1;background:rgba(13,17,26,0.85);padding:6px 14px;border-radius:20px;border:1px solid #202b3d;box-shadow:0 4px 12px rgba(0,0,0,0.5);">
                <span style="color:#f87171;font-weight:800;">🔥 Fuego vence Nieve ❄️</span>
                <span style="color:#38bdf8;font-weight:800;">❄️ Nieve vence Agua 💧</span>
                <span style="color:#60a5fa;font-weight:800;">💧 Agua vence Fuego 🔥</span>
              </div>
            </div>

            <!-- LADO DERECHO: NINJA DEL SENSEI RIVAL (PIXEL ART) -->
            <div id="cjAiNinjaContainer" style="display:flex;flex-direction:column;align-items:center;min-width:140px;z-index:4;animation: cjNinjaIdle 2.6s infinite ease-in-out;animation-delay:0.7s;">
              <div style="filter:drop-shadow(0 10px 14px rgba(0,0,0,0.85));">
                ${generatePixelNinjaSVG(bossNinjaCfg, false, 135, 170)}
              </div>
              <div style="width:85px;height:12px;background:radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 70%);border-radius:50%;margin-top:-6px;"></div>
              <div style="margin-top:6px;background:rgba(15,23,42,0.92);border:1.5px solid ${floor.color};border-radius:12px;padding:3px 12px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.6);">
                <div style="font-size:12px;font-weight:900;color:${floor.color};">${floor.name}</div>
                <div style="font-size:10px;font-weight:800;color:#cbd5e1;">${floor.belt} · Piso ${floor.level}</div>
              </div>
            </div>
          </div>

          <!-- MANO DEL JUGADOR: REDISEÑO ESTILO TRADING CARD -->
          <div style="background:#0e121a;border:1px solid #202636;border-radius:10px;padding:12px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:11.5px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
                🃏 TU MANO (Elige una carta para lanzar):
              </div>
              <div style="font-size:11px;color:#fbbf24;font-weight:700;">
                ★ Cartas de poder 10+ desatan cinemáticas legendarias
              </div>
            </div>

            <div id="dojoHandContainer" style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
              ${this.playerHand.map((c, idx) => {
                const cfg = ELEM_CONFIG[c.element];
                const isPower = c.value >= 10;
                return `
                  <div class="cj-trading-card ${isPower ? 'power-10' : ''}" data-card-idx="${idx}" style="border:2px solid ${isPower ? '#fbbf24' : cfg.border};box-shadow:0 0 14px ${cfg.glow};">
                    <!-- Insignia en esquina -->
                    <div class="cj-corner-badge" style="background:${cfg.badgeBg};color:${cfg.badgeText};">
                      <span>${c.value}</span>
                      <span>${cfg.icon}</span>
                    </div>

                    ${isPower ? `<div class="cj-power-star">★ ${c.value}</div>` : ''}

                    <!-- Ilustración central -->
                    <div style="height:90px;border-radius:6px;background:rgba(0,0,0,0.4);margin-top:22px;border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;padding:4px;"><img src="${cfg.img}" style="width:72px;height:72px;object-fit:contain;image-rendering:pixelated;" alt="${cfg.name}"></div>

                    <!-- Pie de carta -->
                    <div style="font-size:10px;font-weight:900;color:#fff;text-align:center;letter-spacing:0.5px;">
                      ${cfg.name.toUpperCase()}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      const handCards = this.container.querySelectorAll('.cj-trading-card');
      handCards.forEach(el => {
        el.onclick = () => {
          if (this.isResolvingRound || this.matchWinner) return;
          const idx = parseInt(el.dataset.cardIdx, 10);
          if (this.playerHand[idx]) {
            this.playRound(this.playerHand[idx]);
          }
        };
      });

      const btnExit = this.container.querySelector('#dojoBtnExitMatch');
      if (btnExit) btnExit.onclick = () => {
        clearInterval(this.turnTimer);
        this.inMatch = false;
        this.initUI();
      };
    }

    // ==========================================
    // SALÓN PRINCIPAL DEL DOJO (LOBBY)
    // ==========================================
    initUI() {
      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <!-- Encabezado con Botón a Personalización Ninja -->
          <div style="background:linear-gradient(135deg, #0e121a, #161b26);border:1px solid #202636;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="font-size:15px;font-weight:900;color:#f8fafc;display:flex;align-items:center;gap:8px;">
                <span>🥋</span> DOJO ELEMENTAL DEL NÚCLEO · v1.8.6
              </div>
              <div style="font-size:11.5px;color:#94a3b8;margin-top:2px;">
                Duelos tácticos Card-Jitsu con Ninjas Pixel Art, fondos interactivos y combate cinemático.
              </div>
            </div>

            <div style="display:flex;gap:8px;align-items:center;">
              <button id="dojoBtnCustomNinja" style="background:linear-gradient(135deg, #7c3aed, #6d28d9);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:800;font-size:11.5px;cursor:pointer;box-shadow:0 4px 10px rgba(124,58,237,0.3);display:flex;align-items:center;gap:6px;">
                <span>🥷</span> Personalizar Mi Ninja
              </button>
              <button id="dojoBtnHowToPlay" style="background:#1e2433;border:1px solid #3b4660;color:#cbd5e1;padding:6px 12px;border-radius:6px;font-weight:700;font-size:11.5px;cursor:pointer;">
                ¿Cómo Jugar?
              </button>
            </div>
          </div>

          <!-- Tutorial Desplegable -->
          <div id="dojoTutorialBox" style="display:${this.showTutorial ? 'block' : 'none'};background:#090d14;border:1px solid #1a2233;border-radius:10px;padding:14px 18px;animation: cjCardFlipIn 0.25s ease;">
            <div style="font-size:13px;font-weight:900;color:#f8fafc;margin-bottom:8px;">Reglas del Dojo:</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;font-size:12px;color:#cbd5e1;">
              <div style="background:#111520;border:1px solid #1e2433;border-radius:8px;padding:10px;">
                <b style="color:#ef4444;">1. Triángulo Elemental:</b><br>
                • 🔥 <b>Fuego</b> vence a ❄️ <b>Nieve</b>.<br>
                • ❄️ <b>Nieve</b> vence a 💧 <b>Agua</b>.<br>
                • 💧 <b>Agua</b> vence a 🔥 <b>Fuego</b>.
              </div>
              <div style="background:#111520;border:1px solid #1e2433;border-radius:8px;padding:10px;">
                <b style="color:#38bdf8;">2. Desempate por Números:</b><br>
                • En mismo elemento, gana la carta con el número más alto (2 al 12).<br>
                • ¡Las cartas <b>10 o más</b> desatan cinemáticas legendarias de impacto!
              </div>
              <div style="background:#111520;border:1px solid #1e2433;border-radius:8px;padding:10px;">
                <b style="color:#10b981;">3. Cómo Ganar:</b><br>
                • <b>Trío Elemental:</b> 1 de cada elemento (1 🔥 + 1 💧 + 1 ❄️).<br>                • <b>Monolito:</b> 3 cartas del mismo elemento (3 🔥, 3 💧 o 3 ❄️).<br>                • <i>Regla estricta: 3 cartas mixtas (ej: 2 agua y 1 fuego) NO otorgan victoria.</i>
              </div>
            </div>
          </div>

          <!-- Cuadrícula de los 5 Guardianes del Dojo -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));gap:12px;">
            ${FLOORS.map(f => {
              const isCleared = !!this.claimedFloors[f.level];
              return `
                <div style="background:#0e121a;border:1.5px solid ${isCleared ? '#10b981' : '#202636'};border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px;position:relative;transition:0.15s;box-shadow:0 4px 12px rgba(0,0,0,0.4);">
                  ${isCleared ? `<div style="position:absolute;top:8px;right:8px;background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#10b981;font-size:10px;font-weight:900;padding:2px 8px;border-radius:10px;">✓ VENCIDO</div>` : ''}

                  <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:50px;height:50px;border-radius:10px;background:url('${f.avatarImg}') center/cover no-repeat;border:2px solid ${f.color};box-shadow:0 0 14px ${f.color}40;flex-shrink:0;"></div>
                    <div>
                      <div style="font-size:10.5px;font-weight:800;color:#94a3b8;text-transform:uppercase;">Piso ${f.level} · ${f.belt}</div>
                      <div style="font-size:14px;font-weight:900;color:#f8fafc;">${f.name}</div>
                    </div>
                  </div>

                  <div style="font-size:11.5px;color:#94a3b8;line-height:1.4;">
                    ${f.desc}
                  </div>

                  <div style="font-size:11px;font-weight:700;color:#fbbf24;background:#090d14;border:1px solid #1a2233;padding:5px 8px;border-radius:6px;">
                    🎁 Botín: +${f.reward.coins} Monedas + Llaves
                  </div>

                  <button class="dojo-btn-challenge" data-floor="${f.level}" style="background:#2563eb;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;transition:0.15s;box-shadow:0 4px 10px rgba(37,99,235,0.3);">
                    ⚔️ Desafiar Piso ${f.level}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      const btnHelp = this.container.querySelector('#dojoBtnHowToPlay');
      if (btnHelp) btnHelp.onclick = () => {
        this.showTutorial = !this.showTutorial;
        this.initUI();
      };

      const btnCustom = this.container.querySelector('#dojoBtnCustomNinja');
      if (btnCustom) btnCustom.onclick = () => {
        CardJitsuGame.renderNinjaCustomizer(this.container, () => { this.initUI(); });
      };

      const challengeBtns = this.container.querySelectorAll('.dojo-btn-challenge');
      challengeBtns.forEach(b => {
        b.onclick = () => {
          const fl = parseInt(b.dataset.floor, 10);
          this.startMatch(fl);
        };
      });
    }

    // ==========================================
    // ESTUDIO INTERACTIVO DE PERSONALIZACIÓN NINJA
    // ==========================================
    static renderNinjaCustomizer(container, onBack) {
      let cfg = getSavedNinjaConfig();

      const GI_OPTIONS = [
        { name: 'Negro Sombra', val: '#18181b', accent: '#27272a' },
        { name: 'Blanco Espectral', val: '#f8fafc', accent: '#cbd5e1' },
        { name: 'Carmesí Ígneo', val: '#dc2626', accent: '#991b1b' },
        { name: 'Azul Abisal', val: '#2563eb', accent: '#1e3a8a' },
        { name: 'Cian Glaciar', val: '#06b6d4', accent: '#0891b2' },
        { name: 'Verde Jade', val: '#059669', accent: '#047857' },
        { name: 'Púrpura Sombrío', val: '#7c3aed', accent: '#5b21b6' },
        { name: 'Oro Imperial', val: '#eab308', accent: '#a16207' }
      ];

      const MASK_OPTIONS = [
        { id: 'classic', name: 'Capucha Clásica y Placa' },
        { id: 'kitsune', name: 'Máscara Kitsune Sagrada' },
        { id: 'oni', name: 'Máscara Oni con Cuernos' },
        { id: 'cyber', name: 'Visor Ciber-Ninja Neón' },
        { id: 'sensei_kasa', name: 'Sombrero Kasa y Barba' }
      ];

      const EYE_OPTIONS = [
        { name: 'Cian Neón', val: '#00e5ff' },
        { name: 'Rojo Carmesí', val: '#ef4444' },
        { name: 'Oro Eléctrico', val: '#fbbf24' },
        { name: 'Verde Esmeralda', val: '#10b981' },
        { name: 'Blanco Fantasma', val: '#ffffff' }
      ];

      const BELT_OPTIONS = [
        { name: 'Cinturón Blanco', val: '#f8fafc' },
        { name: 'Cinturón Amarillo', val: '#facc15' },
        { name: 'Cinturón Azul', val: '#38bdf8' },
        { name: 'Cinturón Rojo', val: '#ef4444' },
        { name: 'Cinturón Negro', val: '#27272a' },
        { name: 'Dorado del Núcleo', val: '#fbbf24' }
      ];

      const WEAPON_OPTIONS = [
        { id: 'katanas', name: 'Katanas Cruzadas ⚔️' },
        { id: 'shuriken', name: 'Shuriken Gigante ✴️' },
        { id: 'scroll', name: 'Pergamino Rúnico 📜' },
        { id: 'staff', name: 'Bastón de Bo 🥢' },
        { id: 'none', name: 'Sin Arma (Manos Limpias)' }
      ];

      const AURA_OPTIONS = [
        { id: 'none', name: 'Sin Aura' },
        { id: 'fire', name: 'Llamas de Fuego 🔥' },
        { id: 'water', name: 'Salpicaduras de Agua 💧' },
        { id: 'snow', name: 'Cristales de Nieve ❄️' }
      ];

      const renderStudio = () => {
        container.innerHTML = `
          <div style="background:#0e121a;border:1.5px solid #28334a;border-radius:12px;padding:20px;color:#fff;font-family:system-ui,-apple-system,sans-serif;">
            <!-- Cabecera -->
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #202636;padding-bottom:12px;margin-bottom:18px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:26px;">🥷</span>
                <div>
                  <h3 style="margin:0;font-size:17px;font-weight:900;">Estudio de Personalización Ninja</h3>
                  <p style="margin:2px 0 0 0;font-size:11.5px;color:#94a3b8;">Diseña tu aspecto en el tatami de combate. Tu ninja luchará con este traje.</p>
                </div>
              </div>
              <button id="customBackBtn" style="background:#1e2433;border:1px solid #3b4660;color:#cbd5e1;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:800;font-size:12px;">
                ← Volver al Dojo
              </button>
            </div>

            <!-- Contenido: Izquierda Preview, Derecha Selectores -->
            <div style="display:grid;grid-template-columns:260px 1fr;gap:22px;align-items:start;">
              <!-- Panel de Vista Previa -->
              <div style="background:#090d14;border:1px solid #1a2233;border-radius:12px;padding:18px;display:flex;flex-direction:column;align-items:center;box-shadow:inset 0 0 20px rgba(0,0,0,0.8);">
                <div style="font-size:12px;font-weight:900;color:#94a3b8;margin-bottom:12px;text-transform:uppercase;">
                  Vista Previa en Tatami
                </div>
                <div id="ninjaLivePreview" style="filter:drop-shadow(0 12px 18px rgba(0,0,0,0.9));margin-bottom:6px;min-height:190px;display:flex;align-items:center;justify-content:center;">
                  ${generatePixelNinjaSVG(cfg, true, 160, 200)}
                </div>
                <div style="width:110px;height:14px;background:radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 70%);border-radius:50%;margin-bottom:14px;"></div>

                <div style="width:100%;background:#131824;border:1px solid #202b3d;border-radius:8px;padding:8px 12px;font-size:11px;color:#94a3b8;display:flex;flex-direction:column;gap:4px;">
                  <div>🥋 <b>Traje:</b> <span style="color:#fff;">${GI_OPTIONS.find(g=>g.val===cfg.giColor)?.name || 'Personalizado'}</span></div>
                  <div>🎭 <b>Máscara:</b> <span style="color:#fff;">${MASK_OPTIONS.find(m=>m.id===cfg.maskType)?.name || 'Clásica'}</span></div>
                  <div>🥋 <b>Cinturón:</b> <span style="color:#fbbf24;">${cfg.beltName || 'Cinturón Blanco'}</span></div>
                  <div>⚔️ <b>Arma:</b> <span style="color:#fff;">${WEAPON_OPTIONS.find(w=>w.id===cfg.weaponType)?.name || 'Katanas'}</span></div>
                </div>

                <button id="saveNinjaBtn" style="margin-top:14px;width:100%;background:linear-gradient(135deg,#059669,#10b981);color:#fff;border:none;padding:10px;border-radius:8px;font-weight:900;font-size:12.5px;cursor:pointer;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                  💾 Guardar Mi Ninja
                </button>
              </div>

              <!-- Panel de Opciones -->
              <div style="display:flex;flex-direction:column;gap:14px;max-height:480px;overflow-y:auto;padding-right:6px;">
                <!-- 1. Color del Gi / Traje -->
                <div>
                  <div style="font-size:12px;font-weight:900;color:#f8fafc;margin-bottom:6px;">1. Color del Traje (Gi)</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${GI_OPTIONS.map(g => `
                      <button class="optGiBtn" data-val="${g.val}" data-acc="${g.accent}" style="background:${g.val};color:${g.val==='#f8fafc'?'#000':'#fff'};border:2px solid ${cfg.giColor===g.val?'#fff':'rgba(255,255,255,0.2)'};padding:6px 12px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                        ${g.name}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- 2. Máscara y Casco -->
                <div>
                  <div style="font-size:12px;font-weight:900;color:#f8fafc;margin-bottom:6px;">2. Máscara y Cabeza</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${MASK_OPTIONS.map(m => `
                      <button class="optMaskBtn" data-id="${m.id}" style="background:${cfg.maskType===m.id?'#2563eb':'#141924'};color:#fff;border:1px solid ${cfg.maskType===m.id?'#3b82f6':'#242f44'};padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">
                        ${m.name}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- 3. Brillo de Ojos -->
                <div>
                  <div style="font-size:12px;font-weight:900;color:#f8fafc;margin-bottom:6px;">3. Brillo de Ojos</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${EYE_OPTIONS.map(e => `
                      <button class="optEyeBtn" data-val="${e.val}" style="background:#111520;color:${e.val};border:1.5px solid ${cfg.eyeColor===e.val?e.val:'#242f44'};padding:6px 12px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px;">
                        <span style="width:8px;height:8px;border-radius:50%;background:${e.val};box-shadow:0 0 6px ${e.val};"></span>
                        ${e.name}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- 4. Rango de Cinturón -->
                <div>
                  <div style="font-size:12px;font-weight:900;color:#f8fafc;margin-bottom:6px;">4. Rango de Cinturón</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${BELT_OPTIONS.map(b => `
                      <button class="optBeltBtn" data-val="${b.val}" data-name="${b.name}" style="background:${cfg.beltColor===b.val?'#1e293b':'#111520'};color:${b.val};border:1.5px solid ${cfg.beltColor===b.val?b.val:'#242f44'};padding:6px 12px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;">
                        ${b.name}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- 5. Arma a la Espalda -->
                <div>
                  <div style="font-size:12px;font-weight:900;color:#f8fafc;margin-bottom:6px;">5. Arma a la Espalda</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${WEAPON_OPTIONS.map(w => `
                      <button class="optWeaponBtn" data-id="${w.id}" style="background:${cfg.weaponType===w.id?'#2563eb':'#141924'};color:#fff;border:1px solid ${cfg.weaponType===w.id?'#3b82f6':'#242f44'};padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">
                        ${w.name}
                      </button>
                    `).join('')}
                  </div>
                </div>

                <!-- 6. Aura Elemental -->
                <div>
                  <div style="font-size:12px;font-weight:900;color:#f8fafc;margin-bottom:6px;">6. Aura Elemental</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${AURA_OPTIONS.map(a => `
                      <button class="optAuraBtn" data-id="${a.id}" style="background:${cfg.aura===a.id?'#2563eb':'#141924'};color:#fff;border:1px solid ${cfg.aura===a.id?'#3b82f6':'#242f44'};padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">
                        ${a.name}
                      </button>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

        // Eventos
        container.querySelector('#customBackBtn').onclick = () => {
          saveNinjaConfig(cfg);
          if (onBack) onBack();
        };

        container.querySelector('#saveNinjaBtn').onclick = () => {
          saveNinjaConfig(cfg);
          if (typeof toast === 'function') toast('🥷 ¡Tu Ninja personalizado ha sido guardado!');
          if (onBack) onBack();
        };

        container.querySelectorAll('.optGiBtn').forEach(b => {
          b.onclick = () => {
            cfg.giColor = b.dataset.val;
            cfg.giAccent = b.dataset.acc;
            saveNinjaConfig(cfg);
            renderStudio();
          };
        });

        container.querySelectorAll('.optMaskBtn').forEach(b => {
          b.onclick = () => {
            cfg.maskType = b.dataset.id;
            saveNinjaConfig(cfg);
            renderStudio();
          };
        });

        container.querySelectorAll('.optEyeBtn').forEach(b => {
          b.onclick = () => {
            cfg.eyeColor = b.dataset.val;
            saveNinjaConfig(cfg);
            renderStudio();
          };
        });

        container.querySelectorAll('.optBeltBtn').forEach(b => {
          b.onclick = () => {
            cfg.beltColor = b.dataset.val;
            cfg.beltName = b.dataset.name;
            saveNinjaConfig(cfg);
            renderStudio();
          };
        });

        container.querySelectorAll('.optWeaponBtn').forEach(b => {
          b.onclick = () => {
            cfg.weaponType = b.dataset.id;
            saveNinjaConfig(cfg);
            renderStudio();
          };
        });

        container.querySelectorAll('.optAuraBtn').forEach(b => {
          b.onclick = () => {
            cfg.aura = b.dataset.id;
            saveNinjaConfig(cfg);
            renderStudio();
          };
        });
      };

      renderStudio();
    }
  }

  window.CardJitsuGame = CardJitsuGame;
})();
