'use strict';
/**
 * Dojo Elemental del Núcleo - Minijuego de Cartas Card-Jitsu
 * Versión: v1.8.3
 *
 * Mejoras:
 * - Dificultad táctica progresiva ajustada por cada Sensei (hasta Modo Gran Maestro en Piso 5).
 * - Animaciones Cinemáticas Legendarias a pantalla completa para cartas de nivel 10, 11 y 12.
 * - Ritmo de combate dramático con fases claras (Revelación -> Choque Legendario -> Veredicto).
 * - Arte ilustrado de personajes y cartas elementales integrados en los assets.
 * - Sistema de audio Web Audio sintetizado de alto impacto.
 */

(function () {
  const ELEMENTS = ['fire', 'water', 'snow'];
  const ELEM_CONFIG = {
    fire: {
      name: 'Fuego',
      icon: '🔥',
      img: 'assets/cards/fire.jpg',
      color: '#ef4444',
      bg: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
      border: '#f87171',
      glow: 'rgba(239, 68, 68, 0.45)',
      defeatBy: 'water',
      beats: 'snow',
      verb: 'calcina a',
      cinematicTitle: '¡EL DESPERTAR DEL DRAGÓN ÍGNEO!'
    },
    water: {
      name: 'Agua',
      icon: '💧',
      img: 'assets/cards/water.jpg',
      color: '#06b6d4',
      bg: 'linear-gradient(135deg, #164e63, #06b6d4)',
      border: '#38bdf8',
      glow: 'rgba(6, 182, 212, 0.45)',
      defeatBy: 'snow',
      beats: 'fire',
      verb: 'apaga a',
      cinematicTitle: '¡EL GRAN TSUNAMI DEL LEVIATÁN!'
    },
    snow: {
      name: 'Nieve',
      icon: '❄️',
      img: 'assets/cards/snow.jpg',
      color: '#38bdf8',
      bg: 'linear-gradient(135deg, #0c4a6e, #38bdf8)',
      border: '#7dd3fc',
      glow: 'rgba(56, 189, 248, 0.45)',
      defeatBy: 'fire',
      beats: 'water',
      verb: 'congela a',
      cinematicTitle: '¡LA VENTISCA DEL CERO ABSOLUTO!'
    }
  };

  const FLOORS = [
    {
      level: 1,
      name: 'Novicio Ignis',
      belt: 'Cinturón Blanco',
      avatarImg: 'assets/bosses/ignis.jpg',
      avatarText: '🔥',
      avatarBg: 'linear-gradient(135deg, #450a0a, #dc2626)',
      desc: 'Iniciado del fuego en las Minas de Magma. Juega de forma básica e instintiva.',
      color: '#f87171',
      aiSkill: 0.20,
      quotes: {
        intro: '¡Que la llama del Núcleo guíe mis cartas!',
        winRound: '¡El fuego es impredecible!',
        loseRound: '¡Ugh, casi me apagas la llama!',
        defeat: 'Has dominado mi fuego... mereces avanzar.'
      },
      reward: { coins: 40, keys: { copper: 1 } }
    },
    {
      level: 2,
      name: 'Monje de Escarcha',
      belt: 'Cinturón Azul',
      avatarImg: 'assets/bosses/frost.jpg',
      avatarText: '❄️',
      avatarBg: 'linear-gradient(135deg, #082f49, #0284c7)',
      desc: 'Maestro de cristales helados. Analiza tus jugadas recientes y busca hacer combinaciones.',
      color: '#38bdf8',
      aiSkill: 0.50,
      quotes: {
        intro: 'El hielo no perdona la indecisión...',
        winRound: 'Tus movimientos se congelaron.',
        loseRound: '¡Una grieta en mi defensa de hielo!',
        defeat: 'El frío se disipa ante tu determinación.'
      },
      reward: { coins: 75, keys: { copper: 1, silver: 1 } }
    },
    {
      level: 3,
      name: 'Guardián del Torrente',
      belt: 'Cinturón Rojo',
      avatarImg: 'assets/bosses/torrent.jpg',
      avatarText: '💧',
      avatarBg: 'linear-gradient(135deg, #164e63, #0891b2)',
      desc: 'Defensor de los Puentes de Lava. Detecta qué elemento necesitas para ganar y lo bloquea.',
      color: '#06b6d4',
      aiSkill: 0.75,
      quotes: {
        intro: '¡El caudal del torrente arrasará con todo!',
        winRound: '¡La corriente fue demasiado fuerte!',
        loseRound: '¡Has frenado mi torrente!',
        defeat: 'El agua cede el paso al verdadero maestro.'
      },
      reward: { coins: 130, keys: { silver: 1, gold: 1 } }
    },
    {
      level: 4,
      name: 'Campeón de Basalto',
      belt: 'Cinturón Negro',
      avatarImg: 'assets/bosses/basalt.jpg',
      avatarText: '🌋',
      avatarBg: 'linear-gradient(135deg, #1c1917, #78716c)',
      desc: 'Veterano imponente de la Cripta. Reserva cartas de nivel 10+ para forzar empates a su favor.',
      color: '#cbd5e1',
      aiSkill: 0.88,
      quotes: {
        intro: 'Forjado en roca y fuego eterno. ¡Demuestra tu valía!',
        winRound: '¡El basalto es inquebrantable!',
        loseRound: '¡Un impacto formidable!',
        defeat: 'Incluso la roca más dura reconoce tu poderío.'
      },
      reward: { coins: 220, keys: { gold: 1, obsidian: 1 } }
    },
    {
      level: 5,
      name: 'Sensei del Núcleo',
      belt: 'Cinturón Ninja Supremo',
      avatarImg: 'assets/bosses/sensei.jpg',
      avatarText: '🥋',
      avatarBg: 'linear-gradient(135deg, #451a03, #d97706)',
      desc: 'Maestro absoluto. Nivel Gran Maestro: cuenta cartas, predice jugadas y no comete errores.',
      color: '#f59e0b',
      aiSkill: 0.98,
      quotes: {
        intro: 'El verdadero ninja sincroniza mente, cuerpo y elementos. ¡Comencemos!',
        winRound: 'Equilibrio y armonía superan la fuerza bruta.',
        loseRound: 'Interesante técnica... pero la batalla continúa.',
        defeat: '¡Extraordinario! Eres digno del cinturón supremo del Núcleo.'
      },
      reward: { coins: 400, keys: { obsidian: 2 } }
    }
  ];

  class AudioEffects {
    constructor() {
      this.ctx = null;
    }
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
      // Fanfarria / rugido para cartas 10+
      [146, 220, 293, 440, 587, 880].forEach((f, i) => {
        setTimeout(() => this.playTone(f, i % 2 === 0 ? 'sawtooth' : 'triangle', 0.4, 0.12), i * 80);
      });
    }
    winRound() {
      this.playTone(587, 'sine', 0.12, 0.09);
      setTimeout(() => this.playTone(880, 'sine', 0.2, 0.1), 90);
    }
    loseRound() {
      this.playTone(311, 'sawtooth', 0.15, 0.07);
      setTimeout(() => this.playTone(220, 'sawtooth', 0.25, 0.08), 110);
    }
    winMatch() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.28, 0.12), i * 110);
      });
    }
  }

  class CardJitsuGame {
    constructor(container, options = {}) {
      this.container = container;
      this.options = options || {};
      this.sfx = new AudioEffects();
      this.currentFloor = 1;
      this.inMatch = false;
      this.isResolvingRound = false;
      this.showTutorial = false;
      this.isPvP = !!options.isPvP;

      this.playerHand = [];
      this.aiHand = [];
      this.playerWon = [];
      this.aiWon = [];
      this.matchWinner = null;
      this.claimedFloors = {};

      this.turnTimer = null;
      this.timeLeft = 15;

      try {
        const saved = localStorage.getItem('epickast.dojo.floors');
        if (saved) this.claimedFloors = JSON.parse(saved);
      } catch {}

      this.injectStyles();
      this.initUI();
    }

    injectStyles() {
      if (document.getElementById('cardJitsuStylesV183')) return;
      const s = document.createElement('style');
      s.id = 'cardJitsuStylesV183';
      s.textContent = `
        @keyframes cjCardFlipIn {
          0% { transform: scale(0.6) rotateY(90deg); opacity: 0; }
          60% { transform: scale(1.08) rotateY(0deg); opacity: 1; }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes cjBurnDissolve {
          0% { filter: drop-shadow(0 0 16px #ef4444) brightness(1.4); transform: scale(1); }
          50% { filter: drop-shadow(0 0 35px #b91c1c) brightness(2) contrast(1.6); transform: scale(0.95) rotate(5deg); }
          100% { filter: brightness(0.1) blur(7px); opacity: 0; transform: scale(0.5) rotate(18deg); }
        }
        @keyframes cjIceFreezeShatter {
          0% { filter: drop-shadow(0 0 14px #38bdf8); transform: scale(1); }
          40% { filter: drop-shadow(0 0 30px #e0f2fe) brightness(2.2); transform: scale(1.06); }
          100% { filter: contrast(2.2) brightness(0.3) blur(5px); opacity: 0; transform: scale(0.6) translateY(24px); }
        }
        @keyframes cjWaterExtinguish {
          0% { filter: drop-shadow(0 0 16px #06b6d4); transform: scale(1); }
          40% { filter: drop-shadow(0 0 28px #67e8f9) saturate(2); transform: scale(1.03); }
          100% { filter: grayscale(1) opacity(0.1) blur(6px); opacity: 0; transform: scale(0.55) translateY(-20px); }
        }
        @keyframes cjCinematicBlast {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.05); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        @keyframes cjScreenShake {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-6px, 4px) rotate(-1deg); }
          30% { transform: translate(6px, -4px) rotate(1deg); }
          45% { transform: translate(-5px, -3px); }
          60% { transform: translate(5px, 3px); }
          75% { transform: translate(-2px, 2px); }
        }
        @keyframes cjGoldShine {
          0%, 100% { border-color: #fbbf24; box-shadow: 0 0 14px rgba(251, 191, 36, 0.6); }
          50% { border-color: #fff; box-shadow: 0 0 28px rgba(251, 191, 36, 1); }
        }
        .cj-hand-card {
          width: 86px;
          height: 126px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px;
          box-sizing: border-box;
        }
        .cj-hand-card:hover {
          transform: translateY(-12px) scale(1.08);
          box-shadow: 0 12px 26px rgba(0,0,0,0.6) !important;
          z-index: 10;
        }
        .cj-power-10 {
          border: 2px solid #fbbf24 !important;
          animation: cjGoldShine 2s infinite ease-in-out;
        }
        .cj-power-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 10px;
          border: 1px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
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

      // Condición A: 3 elementos distintos (1 Fuego + 1 Agua + 1 Nieve)
      if (counts.fire >= 1 && counts.water >= 1 && counts.snow >= 1) {
        return { type: 'triad', desc: '¡Trío Elemental Supremo! (Fuego 🔥 + Agua 💧 + Nieve ❄️)' };
      }
      // Condición B: 3 del mismo elemento
      for (const el of ELEMENTS) {
        if (counts[el] >= 3) {
          const cfg = ELEM_CONFIG[el];
          return { type: 'monolith', desc: `¡Poder Monolítico! 3 cartas de ${cfg.name} ${cfg.icon}` };
        }
      }
      return false;
    }

    /**
     * DIFICULTAD DE IA PROFUNDA Y PROGRESIVA
     * Cada nivel calcula con mayor profundidad táctica.
     */
    pickAICard(floorConfig) {
      if (this.aiHand.length === 0) return this.createCard();
      const level = floorConfig.level || 1;
      const skill = floorConfig.aiSkill || 0.3;

      // Nivel 1 (Novicio Ignis): Principalmente juega al azar o su carta más baja
      if (level === 1) {
        if (Math.random() > skill) return this.aiHand[Math.floor(Math.random() * this.aiHand.length)];
        return this.aiHand.slice().sort((a, b) => a.value - b.value)[0];
      }

      // Nivel 2 (Monje de Escarcha): Intenta hacer combinaciones de su propio trío
      if (level === 2) {
        const aiCounts = { fire: 0, water: 0, snow: 0 };
        this.aiWon.forEach(c => aiCounts[c.element]++);
        const missing = ELEMENTS.find(e => aiCounts[e] === 0);
        if (missing && Math.random() < skill) {
          const want = this.aiHand.find(c => c.element === missing);
          if (want) return want;
        }
      }

      // Nivel 3 (Guardián del Torrente): DETECTA Y BLOQUEA la victoria del jugador
      if (level === 3 || level >= 4) {
        const pCounts = { fire: 0, water: 0, snow: 0 };
        this.playerWon.forEach(c => pCounts[c.element]++);

        // ¿El jugador está a 1 carta de ganar por Trío?
        const pMissing = ELEMENTS.filter(e => pCounts[e] === 0);
        if (pMissing.length === 1 && Math.random() < skill) {
          const dangerousElem = pMissing[0];
          // Qué vence a dangerousElem: Fuego -> Agua; Nieve -> Fuego; Agua -> Nieve
          const counter = { fire: 'water', snow: 'fire', water: 'snow' }[dangerousElem];
          const blocker = this.aiHand.find(c => c.element === counter);
          if (blocker) return blocker;
        }

        // ¿El jugador tiene 2 cartas del mismo elemento y busca el Monolito de 3?
        for (const el of ELEMENTS) {
          if (pCounts[el] === 2 && Math.random() < skill) {
            const counter = { fire: 'water', snow: 'fire', water: 'snow' }[el];
            const blocker = this.aiHand.find(c => c.element === counter);
            if (blocker) return blocker;
          }
        }
      }

      // Nivel 4 (Campeón de Basalto): Agresivo con cartas altas (10+) en empates
      if (level === 4) {
        const highCards = this.aiHand.filter(c => c.value >= 9);
        if (highCards.length > 0 && Math.random() < skill) {
          return highCards.sort((a, b) => b.value - a.value)[0];
        }
      }

      // Nivel 5 (Sensei del Núcleo): MODO GRAN MAESTRO / IMPLACABLE
      if (level === 5) {
        // Evalúa cada carta en la mano con minimax scoring
        let bestCard = this.aiHand[0];
        let maxScore = -999;

        const aiCounts = { fire: 0, water: 0, snow: 0 };
        this.aiWon.forEach(c => aiCounts[c.element]++);

        const pCounts = { fire: 0, water: 0, snow: 0 };
        this.playerWon.forEach(c => pCounts[c.element]++);

        for (const c of this.aiHand) {
          let score = c.value * 0.5;

          // Si esta carta le da la victoria inmediata al Sensei
          const simWon = [...this.aiWon, c];
          if (this.checkWinCondition(simWon)) score += 100;

          // Si esta carta bloquea la victoria inminente del jugador
          const pMissing = ELEMENTS.filter(e => pCounts[e] === 0);
          if (pMissing.length === 1) {
            const danger = pMissing[0];
            const counter = { fire: 'water', snow: 'fire', water: 'snow' }[danger];
            if (c.element === counter) score += 50;
          }

          // Cartas 10-12 son reservadas para momentos críticos
          if (c.value >= 10) {
            score += 15;
          }

          if (score > maxScore) {
            maxScore = score;
            bestCard = c;
          }
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

      const floor = FLOORS[this.currentFloor - 1];
      const aiCard = this.pickAICard(floor);

      // Quitar cartas de mano
      this.playerHand = this.playerHand.filter(c => c.id !== playerCard.id);
      this.aiHand = this.aiHand.filter(c => c.id !== aiCard.id);

      // Reponer mano
      this.playerHand.push(this.createCard());
      this.aiHand.push(this.createCard());

      // Determinar ganador de ronda
      let roundWinner = 'tie';
      let reason = '';
      let clashType = 'element';

      if (playerCard.element === aiCard.element) {
        clashType = 'number';
        if (playerCard.value > aiCard.value) {
          roundWinner = 'player';
          reason = `Mismo elemento (${ELEM_CONFIG[playerCard.element].name}). Tu número (${playerCard.value}) superó a (${aiCard.value}).`;
        } else if (playerCard.value < aiCard.value) {
          roundWinner = 'ai';
          reason = `Mismo elemento (${ELEM_CONFIG[playerCard.element].name}). El número rival (${aiCard.value}) superó a (${playerCard.value}).`;
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

      // Comprobar si hay carta de nivel 10 o superior involucrada en la victoria
      const winningCard = roundWinner === 'player' ? playerCard : roundWinner === 'ai' ? aiCard : null;
      const isCinematic = winningCard && winningCard.value >= 10;

      this.renderClashPacing(playerCard, aiCard, roundWinner, reason, clashType, isCinematic, timedOut, () => {
        if (roundWinner === 'player') {
          this.playerWon.push(playerCard);
          this.sfx.winRound();
        } else if (roundWinner === 'ai') {
          this.aiWon.push(aiCard);
          this.sfx.loseRound();
        }

        const pWin = this.checkWinCondition(this.playerWon);
        const aiWin = this.checkWinCondition(this.aiWon);

        if (pWin) {
          this.matchWinner = 'player';
          this.sfx.winMatch();
          this.renderMatchResult(true, pWin.desc);
        } else if (aiWin) {
          this.matchWinner = 'ai';
          this.renderMatchResult(false, aiWin.desc);
        } else {
          this.isResolvingRound = false;
          this.renderMatchBoard();
          this.startTurnTimer();
        }
      });
    }

    renderClashPacing(pCard, aCard, roundWinner, reason, clashType, isCinematic, timedOut, onDone) {
      const mat = this.container.querySelector('#dojoClashMat');
      if (!mat) return onDone();

      const pCfg = ELEM_CONFIG[pCard.element];
      const aCfg = ELEM_CONFIG[aCard.element];
      const floor = FLOORS[this.currentFloor - 1];

      // FASE 1: Cartas viajan al centro boca abajo y se revelan
      mat.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="font-size:12px;font-weight:800;color:#38bdf8;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">
            ⚡ ¡Cartas Reveladas!
          </div>
          <div style="display:flex;justify-content:center;align-items:center;gap:36px;animation: cjCardFlipIn 0.5s ease-out;">
            <!-- Carta Jugador -->
            <div style="width:90px;height:130px;border-radius:10px;background:${pCfg.bg};border:2px solid ${pCard.value >= 10 ? '#fbbf24' : pCfg.border};box-shadow:0 0 18px ${pCfg.glow};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7px;color:#fff;position:relative;">
              ${pCard.value >= 10 ? `<span class="cj-power-badge">★ PODER ${pCard.value}</span>` : ''}
              <div style="font-size:14px;font-weight:900;width:100%;">${pCard.value}</div>
              <img src="${pCfg.img}" style="width:44px;height:44px;object-fit:contain;" alt="${pCfg.name}">
              <div style="font-size:10.5px;font-weight:800;text-transform:uppercase;">${pCfg.name}</div>
            </div>

            <div style="font-size:20px;font-weight:900;color:#64748b;background:#0d111a;border:1px solid #202636;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;">VS</div>

            <!-- Carta Rival -->
            <div style="width:90px;height:130px;border-radius:10px;background:${aCfg.bg};border:2px solid ${aCard.value >= 10 ? '#fbbf24' : aCfg.border};box-shadow:0 0 18px ${aCfg.glow};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7px;color:#fff;position:relative;">
              ${aCard.value >= 10 ? `<span class="cj-power-badge">★ PODER ${aCard.value}</span>` : ''}
              <div style="font-size:14px;font-weight:900;width:100%;">${aCard.value}</div>
              <img src="${aCfg.img}" style="width:44px;height:44px;object-fit:contain;" alt="${aCfg.name}">
              <div style="font-size:10.5px;font-weight:800;text-transform:uppercase;">${aCfg.name}</div>
            </div>
          </div>
        </div>
      `;
      this.sfx.flip();

      // FASE 2: Choque con animación especial para cartas 10+ tras 700ms
      setTimeout(() => {
        let pAnim = '';
        let aAnim = '';
        let cinematicBanner = '';

        if (isCinematic) {
          this.sfx.cinematicPower();
          const winCard = roundWinner === 'player' ? pCard : aCard;
          const winCfg = ELEM_CONFIG[winCard.element];
          cinematicBanner = `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%);z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:cjCinematicBlast 2.2s forwards;border-radius:10px;pointer-events:none;">
              <div style="font-size:42px;margin-bottom:6px;filter:drop-shadow(0 0 20px ${winCfg.color});">${winCfg.icon}</div>
              <div style="font-size:17px;font-weight:900;color:#fde047;letter-spacing:1px;text-transform:uppercase;text-align:center;text-shadow:0 0 14px rgba(251,191,36,0.8);">${winCfg.cinematicTitle}</div>
              <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">Carta Legendaria de Poder ${winCard.value} desatada</div>
            </div>
          `;
          mat.style.animation = 'cjScreenShake 0.6s ease-in-out';
          setTimeout(() => { if (mat) mat.style.animation = ''; }, 600);
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
          pAnim = 'animation: cjImpactBump 0.8s ease;';
          aAnim = 'animation: cjImpactBump 0.8s ease;';
          this.sfx.clash();
        }

        const dialogueQuote = roundWinner === 'player'
          ? (floor.quotes?.loseRound || '¡Buen golpe!')
          : roundWinner === 'ai'
          ? (floor.quotes?.winRound || '¡Siente el poder!')
          : '¡Equilibrio perfecto!';

        mat.innerHTML = `
          ${cinematicBanner}
          <div style="position:relative;width:100%;display:flex;flex-direction:column;align-items:center;z-index:5;">
            ${timedOut ? `<div style="font-size:11px;color:#f59e0b;font-weight:700;margin-bottom:6px;">⏱️ Tiempo agotado: Carta seleccionada automáticamente</div>` : ''}

            <!-- Banner central de resultado de ronda -->
            <div style="background:${roundWinner === 'player' ? 'rgba(16,185,129,0.18)' : roundWinner === 'ai' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)'};border:1.5px solid ${roundWinner === 'player' ? '#10b981' : roundWinner === 'ai' ? '#ef4444' : '#f59e0b'};border-radius:20px;padding:6px 20px;margin-bottom:14px;box-shadow:0 4px 18px rgba(0,0,0,0.5);">
              <span style="font-size:14px;font-weight:900;letter-spacing:0.5px;color:${roundWinner === 'player' ? '#34d399' : roundWinner === 'ai' ? '#f87171' : '#fbbf24'};">
                ${roundWinner === 'player' ? '⚡ ¡RONDA PARA TI!' : roundWinner === 'ai' ? '💥 ¡RONDA PARA EL RIVAL!' : '⚖️ ¡EMPATE ELEMENTAL!'}
              </span>
            </div>

            <!-- Choque animado -->
            <div style="display:flex;justify-content:center;align-items:center;gap:36px;margin-bottom:12px;">
              <!-- Carta Jugador -->
              <div style="width:90px;height:130px;border-radius:10px;background:${pCfg.bg};border:2px solid ${pCard.value >= 10 ? '#fbbf24' : pCfg.border};box-shadow:0 0 18px ${pCfg.glow};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7px;color:#fff;${pAnim}">
                <div style="font-size:14px;font-weight:900;width:100%;">${pCard.value}</div>
                <img src="${pCfg.img}" style="width:44px;height:44px;object-fit:contain;" alt="${pCfg.name}">
                <div style="font-size:10.5px;font-weight:800;text-transform:uppercase;">${pCfg.name}</div>
              </div>

              <div style="font-size:20px;font-weight:900;color:#64748b;background:#0d111a;border:1px solid #202636;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;">VS</div>

              <!-- Carta Rival -->
              <div style="width:90px;height:130px;border-radius:10px;background:${aCfg.bg};border:2px solid ${aCard.value >= 10 ? '#fbbf24' : aCfg.border};box-shadow:0 0 18px ${aCfg.glow};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7px;color:#fff;${aAnim}">
                <div style="font-size:14px;font-weight:900;width:100%;">${aCard.value}</div>
                <img src="${aCfg.img}" style="width:44px;height:44px;object-fit:contain;" alt="${aCfg.name}">
                <div style="font-size:10.5px;font-weight:800;text-transform:uppercase;">${aCfg.name}</div>
              </div>
            </div>

            <div style="font-size:12.5px;font-weight:700;color:#cbd5e1;margin-bottom:6px;text-align:center;">
              ${reason}
            </div>

            <div style="font-size:11.5px;color:#94a3b8;font-style:italic;background:rgba(255,255,255,0.04);padding:4px 14px;border-radius:12px;">
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
      const mat = this.container.querySelector('#dojoClashMat');
      if (!mat) return;

      const floor = FLOORS[this.currentFloor - 1];

      if (playerWon) {
        let rewText = `+${floor.reward.coins} 🪙 Monedas`;
        if (floor.reward.keys) {
          const kParts = [];
          if (floor.reward.keys.copper) kParts.push(`${floor.reward.keys.copper} Cobre 🔑`);
          if (floor.reward.keys.silver) kParts.push(`${floor.reward.keys.silver} Plata 🔑`);
          if (floor.reward.keys.gold) kParts.push(`${floor.reward.keys.gold} Oro 🔑`);
          if (floor.reward.keys.obsidian) kParts.push(`${floor.reward.keys.obsidian} Obsidiana 💎`);
          rewText += ` · ` + kParts.join(', ');
        }

        if (this.options.onReward) {
          this.options.onReward(floor.reward);
        }

        this.claimedFloors[floor.level] = true;
        try { localStorage.setItem('epickast.dojo.floors', JSON.stringify(this.claimedFloors)); } catch {}

        mat.innerHTML = `
          <div style="padding:22px;background:rgba(16,185,129,0.08);border:1.5px solid #10b981;border-radius:12px;text-align:center;box-shadow:0 8px 30px rgba(16,185,129,0.15);animation: cjCardFlipIn 0.35s ease;">
            <div style="font-size:34px;margin-bottom:6px;">🏆</div>
            <div style="font-size:18px;font-weight:900;color:#10b981;margin-bottom:4px;letter-spacing:0.5px;">¡VICTORIA EN PISO ${floor.level}!</div>
            <div style="font-size:13px;color:#e2e8f0;margin-bottom:8px;">${reasonDesc}</div>
            <div style="font-size:12px;color:#94a3b8;font-style:italic;margin-bottom:14px;">"${floor.quotes?.defeat || 'Bien jugado.'}"</div>

            <div style="font-size:13px;font-weight:800;color:#fde047;background:rgba(0,0,0,0.4);border:1px solid rgba(253,224,71,0.25);padding:9px 16px;border-radius:8px;display:inline-block;margin-bottom:16px;">
              🎁 Recompensas otorgadas: ${rewText}
            </div>

            <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
              ${this.currentFloor < 5 ? `
                <button id="dojoBtnNextFloor" style="background:#2563eb;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:800;font-size:12.5px;cursor:pointer;box-shadow:0 4px 14px rgba(37,99,235,0.4);">
                  ⚔️ Desafiar Piso ${this.currentFloor + 1}
                </button>
              ` : `
                <button id="dojoBtnReplay" style="background:#059669;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:800;font-size:12.5px;cursor:pointer;">
                  👑 ¡Maestro del Núcleo! Repetir combate
                </button>
              `}
              <button id="dojoBtnBackLobby" style="background:#1e2433;color:#cbd5e1;border:1px solid #3b4660;padding:8px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">
                Volver al Salón del Dojo
              </button>
            </div>
          </div>
        `;
      } else {
        mat.innerHTML = `
          <div style="padding:22px;background:rgba(239,68,68,0.08);border:1.5px solid #ef4444;border-radius:12px;text-align:center;box-shadow:0 8px 30px rgba(239,68,68,0.15);animation: cjCardFlipIn 0.35s ease;">
            <div style="font-size:34px;margin-bottom:6px;">💀</div>
            <div style="font-size:18px;font-weight:900;color:#ef4444;margin-bottom:4px;">DERROTA EN PISO ${floor.level}</div>
            <div style="font-size:13px;color:#e2e8f0;margin-bottom:8px;">${reasonDesc}</div>
            <div style="font-size:12px;color:#94a3b8;font-style:italic;margin-bottom:14px;">"${floor.quotes?.winRound || 'Sigue entrenando.'}"</div>

            <div style="display:flex;justify-content:center;gap:12px;">
              <button id="dojoBtnRetry" style="background:#ef4444;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:800;font-size:12.5px;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,0.4);">
                🔄 Reintentar Combate
              </button>
              <button id="dojoBtnBackLobby" style="background:#1e2433;color:#cbd5e1;border:1px solid #3b4660;padding:8px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">
                Volver al Salón
              </button>
            </div>
          </div>
        `;
      }

      const btnNext = mat.querySelector('#dojoBtnNextFloor');
      if (btnNext) btnNext.onclick = () => { this.currentFloor++; this.startMatch(this.currentFloor); };

      const btnReplay = mat.querySelector('#dojoBtnReplay');
      if (btnReplay) btnReplay.onclick = () => { this.startMatch(this.currentFloor); };

      const btnRetry = mat.querySelector('#dojoBtnRetry');
      if (btnRetry) btnRetry.onclick = () => { this.startMatch(this.currentFloor); };

      const btnBack = mat.querySelector('#dojoBtnBackLobby');
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
      const meAvatar = this.options.playerAvatar || '🥷';

      const renderTokens = (cards) => {
        if (!cards.length) return `<span style="font-size:11px;color:#64748b;font-style:italic;">Ninguna aún</span>`;
        return `
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${cards.map(c => {
              const cfg = ELEM_CONFIG[c.element];
              return `
                <div style="background:${cfg.bg};border:1px solid #fff;border-radius:5px;padding:2px 6px;display:flex;align-items:center;gap:4px;font-size:11px;font-weight:900;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);" title="${cfg.name} (${c.value})">
                  <span>${c.value}</span><img src="${cfg.img}" style="width:14px;height:14px;vertical-align:middle;" alt="${cfg.name}">
                </div>
              `;
            }).join('')}
          </div>
        `;
      };

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <!-- Barra Superior del Duelo: Personajes con Retratos Ilustrados -->
          <div style="background:#0e121a;border:1px solid #202636;border-radius:10px;padding:10px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <!-- Lado Jugador -->
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;border-radius:8px;background:#1e293b;border:2px solid #3b82f6;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;box-shadow:0 0 12px rgba(59,130,246,0.35);">
                  ${meAvatar}
                </div>
                <div>
                  <div style="font-size:13.5px;font-weight:900;color:#f8fafc;">${meName}</div>
                  <div style="font-size:11px;color:#94a3b8;">Aspirante Ninja del Núcleo</div>
                </div>
              </div>

              <!-- Centro: Temporizador y Salir -->
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:11px;font-weight:700;color:#94a3b8;">TURNO:</span>
                  <span id="dojoTimerTxt" style="font-size:12px;font-weight:900;color:#10b981;">15s</span>
                  <button id="dojoBtnExitMatch" style="background:transparent;border:1px solid #2d3748;color:#94a3b8;padding:2px 8px;border-radius:4px;font-size:10.5px;cursor:pointer;margin-left:8px;">
                    ✕ Salir
                  </button>
                </div>
                <div style="width:160px;height:5px;background:#1e2433;border-radius:3px;overflow:hidden;">
                  <div id="dojoTimerFill" style="width:100%;height:100%;background:#10b981;transition:width 0.3s linear;"></div>
                </div>
              </div>

              <!-- Lado Rival con Retrato Ilustrado Oficial -->
              <div style="display:flex;align-items:center;gap:10px;text-align:right;">
                <div>
                  <div style="font-size:13.5px;font-weight:900;color:${floor.color};">${floor.name}</div>
                  <div style="font-size:11px;color:#94a3b8;">${floor.belt} · Piso ${floor.level}</div>
                </div>
                <div style="width:44px;height:44px;border-radius:8px;background:url('${floor.avatarImg}') center/cover no-repeat, ${floor.avatarBg};border:2px solid ${floor.color};box-shadow:0 0 12px ${floor.color}45;"></div>
              </div>
            </div>

            <!-- Tablero de Colección de la Partida -->
            <div style="display:flex;justify-content:space-between;align-items:center;background:#090d14;border:1px solid #1a202c;border-radius:8px;padding:6px 12px;font-size:11.5px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:#38bdf8;font-weight:800;">TUS CARTAS (${this.playerWon.length}):</span>
                ${renderTokens(this.playerWon)}
              </div>
              <div style="font-size:10.5px;color:#64748b;font-weight:700;">
                Victoria: 3 distintos (🔥💧❄️) o 3 iguales
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:#f87171;font-weight:800;">RIVAL (${this.aiWon.length}):</span>
                ${renderTokens(this.aiWon)}
              </div>
            </div>
          </div>

          <!-- Tapete Central de Combate -->
          <div id="dojoClashMat" style="background:#090c13;border:1px solid #1e2433;border-radius:10px;min-height:230px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:18px;position:relative;overflow:hidden;">
            <div style="font-size:13px;font-weight:800;color:#94a3b8;margin-bottom:8px;">
              ⚡ Selecciona una carta de tu mano para iniciar el duelo
            </div>
            <div style="display:flex;gap:16px;font-size:11.5px;color:#64748b;background:#0d111a;padding:6px 16px;border-radius:20px;border:1px solid #1a2233;">
              <span>🔥 Fuego vence a Nieve ❄️</span>
              <span>❄️ Nieve vence a Agua 💧</span>
              <span>💧 Agua vence a Fuego 🔥</span>
            </div>
          </div>

          <!-- Mano del Jugador -->
          <div style="background:#0e121a;border:1px solid #202636;border-radius:10px;padding:12px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:11.5px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">
                🃏 Tu Mano (Elige una carta para jugar):
              </div>
              <div style="font-size:11px;color:#64748b;">
                Cartas de nivel 10+ tienen poderes cinemáticos
              </div>
            </div>

            <div id="dojoHandContainer" style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
              ${this.playerHand.map((c, idx) => {
                const cfg = ELEM_CONFIG[c.element];
                const isPower = c.value >= 10;
                return `
                  <div class="cj-hand-card ${isPower ? 'cj-power-10' : ''}" data-card-idx="${idx}" style="background:${cfg.bg};border:2px solid ${isPower ? '#fbbf24' : cfg.border};box-shadow:0 0 12px ${cfg.glow};color:#fff;">
                    ${isPower ? `<span class="cj-power-badge">★ ${c.value}</span>` : ''}
                    <div style="font-size:13px;font-weight:900;text-align:left;">${c.value}</div>
                    <div style="text-align:center;"><img src="${cfg.img}" style="width:38px;height:38px;object-fit:contain;" alt="${cfg.name}"></div>
                    <div style="font-size:10px;font-weight:800;text-align:center;text-transform:uppercase;">${cfg.name}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      const handCards = this.container.querySelectorAll('.cj-hand-card');
      handCards.forEach(el => {
        el.onclick = () => {
          if (this.isResolvingRound || this.matchWinner) return;
          const idx = parseInt(el.getAttribute('data-card-idx'), 10);
          const card = this.playerHand[idx];
          if (card) this.playRound(card);
        };
      });

      const btnExit = this.container.querySelector('#dojoBtnExitMatch');
      if (btnExit) btnExit.onclick = () => {
        clearInterval(this.turnTimer);
        this.inMatch = false;
        this.initUI();
      };
    }

    initUI() {
      clearInterval(this.turnTimer);
      if (this.inMatch) {
        this.renderMatchBoard();
        return;
      }

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <!-- Banner Superior del Salón con Tutorial -->
          <div style="background:linear-gradient(135deg, #0e121a, #161b26);border:1px solid #202636;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="font-size:15px;font-weight:900;color:#f8fafc;display:flex;align-items:center;gap:8px;">
                <span>🥋</span> DOJO ELEMENTAL DEL NÚCLEO · v1.8.3
              </div>
              <div style="font-size:11.5px;color:#94a3b8;margin-top:2px;">
                Duelos tácticos con ilustraciones oficiales, animaciones para cartas 10+ e IA escalonada por cada Sensei.
              </div>
            </div>

            <div style="display:flex;gap:8px;align-items:center;">
              <button id="dojoBtnHowToPlay" style="background:#1e2433;border:1px solid #3b4660;color:#38bdf8;padding:6px 14px;border-radius:6px;font-size:11.5px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;">
                ❓ ¿Cómo Jugar?
              </button>
            </div>
          </div>

          <!-- Panel Desplegable "¿Cómo Jugar?" -->
          <div id="dojoHowToPlayPanel" style="display:${this.showTutorial ? 'block' : 'none'};background:#090d14;border:1px solid #202636;border-radius:10px;padding:14px 18px;animation: cjCardFlipIn 0.25s ease;">
            <div style="font-size:13px;font-weight:900;color:#f59e0b;margin-bottom:8px;">
              📖 Reglas Oficiales del Card-Jitsu Elemental:
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:12px;font-size:11.5px;color:#cbd5e1;line-height:1.6;">
              <div style="background:#111520;border:1px solid #1e2433;border-radius:8px;padding:10px;">
                <b style="color:#ef4444;">1. Triángulo Elemental:</b><br>
                • 🔥 <b>Fuego</b> calcina y derrite a ❄️ <b>Nieve</b>.<br>
                • ❄️ <b>Nieve</b> congela y fragmenta a 💧 <b>Agua</b>.<br>
                • 💧 <b>Agua</b> empapa y apaga a 🔥 <b>Fuego</b>.
              </div>
              <div style="background:#111520;border:1px solid #1e2433;border-radius:8px;padding:10px;">
                <b style="color:#38bdf8;">2. Desempate por Números:</b><br>
                • Si ambos eligen el <b>mismo elemento</b>, gana la carta con el <b>número más alto</b> (2 al 12).<br>
                • ¡Las cartas de nivel <b>10 o superior</b> desatan cinemáticas legendarias de impacto!
              </div>
              <div style="background:#111520;border:1px solid #1e2433;border-radius:8px;padding:10px;">
                <b style="color:#10b981;">3. Cómo Ganar la Partida:</b><br>
                • <b>Opción A (Trío):</b> 1 carta de cada elemento distinto (🔥 + 💧 + ❄️).<br>
                • <b>Opción B (Monolito):</b> 3 cartas del MISMO elemento.
              </div>
            </div>
          </div>

          <!-- Cuadrícula de los 5 Guardianes con Ilustraciones Oficiales -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));gap:12px;">
            ${FLOORS.map(f => {
              const isCleared = !!this.claimedFloors[f.level];
              let rewText = `+${f.reward.coins} 🪙`;
              if (f.reward.keys.copper) rewText += ` · ${f.reward.keys.copper} Cobre 🔑`;
              if (f.reward.keys.silver) rewText += ` · ${f.reward.keys.silver} Plata 🔑`;
              if (f.reward.keys.gold) rewText += ` · ${f.reward.keys.gold} Oro 🔑`;
              if (f.reward.keys.obsidian) rewText += ` · ${f.reward.keys.obsidian} Obsidiana 💎`;

              return `
                <div style="background:#111520;border:1px solid ${isCleared ? '#10b98140' : '#202636'};border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;position:relative;overflow:hidden;">
                  ${isCleared ? `<div style="position:absolute;top:8px;right:8px;background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#10b981;font-size:10px;font-weight:900;padding:2px 8px;border-radius:10px;">✓ VENCIDO</div>` : ''}

                  <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:50px;height:50px;border-radius:10px;background:url('${f.avatarImg}') center/cover no-repeat, ${f.avatarBg};border:2px solid ${f.color};box-shadow:0 0 14px ${f.color}40;flex-shrink:0;"></div>
                    <div>
                      <div style="font-size:10.5px;font-weight:800;color:#94a3b8;text-transform:uppercase;">Piso ${f.level} · ${f.belt}</div>
                      <div style="font-size:14px;font-weight:900;color:#f8fafc;">${f.name}</div>
                    </div>
                  </div>

                  <div style="font-size:11.5px;color:#94a3b8;line-height:1.4;">
                    ${f.desc}
                  </div>

                  <div style="font-size:11px;font-weight:700;color:#fde047;background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:6px;border:1px solid rgba(253,224,71,0.15);">
                    🎁 ${rewText}
                  </div>

                  <button class="dojo-btn-challenge" data-floor="${f.level}" style="background:#2563eb;color:#fff;border:none;padding:7px 14px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;transition:0.15s;box-shadow:0 4px 10px rgba(37,99,235,0.3);">
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
        const p = this.container.querySelector('#dojoHowToPlayPanel');
        if (p) p.style.display = this.showTutorial ? 'block' : 'none';
      };

      const btnsChallenge = this.container.querySelectorAll('.dojo-btn-challenge');
      btnsChallenge.forEach(b => {
        b.onclick = () => {
          const fl = parseInt(b.getAttribute('data-floor'), 10);
          this.startMatch(fl);
        };
      });
    }
  }

  window.CardJitsuGame = CardJitsuGame;
})();
