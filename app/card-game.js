'use strict';
/**
 * Dojo Elemental del Núcleo - Minijuego de Cartas Card-Jitsu
 * Versión: v1.8.2
 *
 * Características:
 * - Triángulo elemental: Fuego 🔥 vence a Nieve ❄️, Nieve vence a Agua 💧, Agua vence a Fuego 🔥.
 * - Desempate por valor: Números del 2 al 12.
 * - Condiciones de victoria: 3 elementos distintos (🔥+💧+❄️) o 3 del mismo elemento.
 * - Personajes con avatares, rangos de cinturón y frases contextuales dinámicas.
 * - Animaciones visuales de choque y destrucción elemental de cartas.
 * - Temporizador de turno dinámico (15s).
 * - Modal y guía visual interactiva "¿Cómo Jugar?".
 * - Modo Solitario (5 Pisos con IA progresiva) y Modo Duelo PvP 1v1 contra amigos/contactos.
 */

(function () {
  const ELEMENTS = ['fire', 'water', 'snow'];
  const ELEM_CONFIG = {
    fire: {
      name: 'Fuego',
      icon: '🔥',
      color: '#ef4444',
      bg: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
      border: '#f87171',
      glow: 'rgba(239, 68, 68, 0.4)',
      defeatBy: 'water',
      beats: 'snow',
      verb: 'calcina a'
    },
    water: {
      name: 'Agua',
      icon: '💧',
      color: '#06b6d4',
      bg: 'linear-gradient(135deg, #164e63, #06b6d4)',
      border: '#38bdf8',
      glow: 'rgba(6, 182, 212, 0.4)',
      defeatBy: 'snow',
      beats: 'fire',
      verb: 'apaga a'
    },
    snow: {
      name: 'Nieve',
      icon: '❄️',
      color: '#38bdf8',
      bg: 'linear-gradient(135deg, #0c4a6e, #38bdf8)',
      border: '#7dd3fc',
      glow: 'rgba(56, 189, 248, 0.4)',
      defeatBy: 'fire',
      beats: 'water',
      verb: 'congela a'
    }
  };

  const FLOORS = [
    {
      level: 1,
      name: 'Novicio Ignis',
      belt: 'Cinturón Blanco',
      avatarText: '🔥',
      avatarBg: 'linear-gradient(135deg, #450a0a, #dc2626)',
      desc: 'Iniciado del fuego en las Minas de Magma.',
      color: '#f87171',
      aiSkill: 0.25,
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
      avatarText: '❄️',
      avatarBg: 'linear-gradient(135deg, #082f49, #0284c7)',
      desc: 'Maestro de cristales helados en las Galerías.',
      color: '#38bdf8',
      aiSkill: 0.45,
      quotes: {
        intro: 'El hielo no perdona la indecisión...',
        winRound: 'Tus movimientos se congelaron.',
        loseRound: '¡Una grieta en mi defensa de hielo!',
        defeat: 'El frío se disipa ante tu determinación.'
      },
      reward: { coins: 70, keys: { copper: 1, silver: 1 } }
    },
    {
      level: 3,
      name: 'Guardián del Torrente',
      belt: 'Cinturón Rojo',
      avatarText: '💧',
      avatarBg: 'linear-gradient(135deg, #164e63, #0891b2)',
      desc: 'Defensor de los Puentes de Lava ardiente.',
      color: '#06b6d4',
      aiSkill: 0.65,
      quotes: {
        intro: '¡El caudal del torrente arrasará con todo!',
        winRound: '¡La corriente fue demasiado fuerte!',
        loseRound: '¡Has frenado mi torrente!',
        defeat: 'El agua cede el paso al verdadero maestro.'
      },
      reward: { coins: 120, keys: { silver: 1, gold: 1 } }
    },
    {
      level: 4,
      name: 'Campeón de Basalto',
      belt: 'Cinturón Negro',
      avatarText: '🌋',
      avatarBg: 'linear-gradient(135deg, #1c1917, #78716c)',
      desc: 'Veterano imponente de la Cripta Ancestral.',
      color: '#cbd5e1',
      aiSkill: 0.82,
      quotes: {
        intro: 'Forjado en roca y fuego eterno. ¡Demuestra tu valía!',
        winRound: '¡El basalto es inquebrantable!',
        loseRound: '¡Un impacto formidable!',
        defeat: 'Incluso la roca más dura reconoce tu poderío.'
      },
      reward: { coins: 200, keys: { gold: 1, obsidian: 1 } }
    },
    {
      level: 5,
      name: 'Sensei del Núcleo',
      belt: 'Cinturón Ninja Supremo',
      avatarText: '🥋',
      avatarBg: 'linear-gradient(135deg, #451a03, #d97706)',
      desc: 'Maestro absoluto de los tres elementos.',
      color: '#f59e0b',
      aiSkill: 0.94,
      quotes: {
        intro: 'El verdadero ninja sincroniza mente, cuerpo y elementos.',
        winRound: 'Equilibrio y armonía superan la fuerza bruta.',
        loseRound: 'Interesante técnica... pero la batalla continúa.',
        defeat: '¡Extraordinario! Eres digno del cinturón supremo.'
      },
      reward: { coins: 350, keys: { obsidian: 2 } }
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
    clash() {
      this.playTone(180, 'triangle', 0.2, 0.14);
      setTimeout(() => this.playTone(120, 'square', 0.15, 0.08), 80);
    }
    burnSound() {
      this.playTone(220, 'sawtooth', 0.3, 0.09);
      setTimeout(() => this.playTone(440, 'sine', 0.2, 0.06), 100);
    }
    freezeSound() {
      this.playTone(880, 'triangle', 0.2, 0.08);
      setTimeout(() => this.playTone(660, 'sine', 0.25, 0.06), 70);
    }
    splashSound() {
      this.playTone(320, 'sine', 0.25, 0.1);
      setTimeout(() => this.playTone(180, 'triangle', 0.2, 0.08), 90);
    }
    winRound() {
      this.playTone(587, 'sine', 0.1, 0.08);
      setTimeout(() => this.playTone(880, 'sine', 0.18, 0.09), 80);
    }
    loseRound() {
      this.playTone(311, 'sawtooth', 0.14, 0.07);
      setTimeout(() => this.playTone(220, 'sawtooth', 0.22, 0.07), 100);
    }
    winMatch() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.11), i * 100);
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
      this.opponent = options.opponent || null; // Para modo PvP

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
      if (document.getElementById('cardJitsuStyles')) return;
      const s = document.createElement('style');
      s.id = 'cardJitsuStyles';
      s.textContent = `
        @keyframes cjCardFlipIn {
          0% { transform: scale(0.6) rotateY(90deg); opacity: 0; }
          60% { transform: scale(1.1) rotateY(0deg); opacity: 1; }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes cjBurnDissolve {
          0% { filter: drop-shadow(0 0 14px #ef4444) brightness(1.3); transform: scale(1); }
          50% { filter: drop-shadow(0 0 25px #b91c1c) brightness(1.8) contrast(1.5); transform: scale(0.95) rotate(4deg); }
          100% { filter: brightness(0.2) blur(6px); opacity: 0; transform: scale(0.6) rotate(14deg); }
        }
        @keyframes cjIceFreezeShatter {
          0% { filter: drop-shadow(0 0 12px #38bdf8); transform: scale(1); }
          40% { filter: drop-shadow(0 0 24px #e0f2fe) brightness(2); transform: scale(1.04); }
          100% { filter: contrast(2) brightness(0.4) blur(4px); opacity: 0; transform: scale(0.7) translateY(20px); }
        }
        @keyframes cjWaterExtinguish {
          0% { filter: drop-shadow(0 0 14px #06b6d4); transform: scale(1); }
          40% { filter: drop-shadow(0 0 22px #67e8f9) saturate(1.8); transform: scale(1.02); }
          100% { filter: grayscale(1) opacity(0.15) blur(5px); opacity: 0; transform: scale(0.65) translateY(-15px); }
        }
        @keyframes cjImpactBump {
          0% { transform: scale(1); }
          30% { transform: scale(1.2) translateY(-8px); }
          60% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes cjTieBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.15) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes cjPulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 22px rgba(59, 130, 246, 0.85); }
        }
        .cj-hand-card {
          width: 82px;
          height: 120px;
          border-radius: 9px;
          cursor: pointer;
          transition: all 0.16s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          position: relative;
        }
        .cj-hand-card:hover {
          transform: translateY(-10px) scale(1.07);
          box-shadow: 0 10px 22px rgba(0,0,0,0.5) !important;
          z-index: 10;
        }
        .cj-speech-bubble {
          position: relative;
          background: #1e2433;
          border: 1px solid #3b4660;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11.5px;
          color: #e2e8f0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          max-width: 220px;
        }
        .cj-speech-bubble:after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 20px;
          border-width: 6px 6px 0;
          border-style: solid;
          border-color: #1e2433 transparent;
          display: block;
          width: 0;
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
            // Auto seleccionar carta al azar por tiempo agotado
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
          return { type: 'monolith', desc: `¡Poder Monolítico! 3 cartas del elemento ${cfg.name} ${cfg.icon}` };
        }
      }
      return false;
    }

    pickAICard(floorConfig) {
      if (this.aiHand.length === 0) return this.createCard();
      const skill = floorConfig.aiSkill || 0.4;
      if (Math.random() < skill && this.playerWon.length > 0) {
        // La IA intenta bloquear la condición de victoria del jugador
        const needed = [];
        const pCounts = { fire: 0, water: 0, snow: 0 };
        this.playerWon.forEach(c => pCounts[c.element]++);
        if (pCounts.fire === 0) needed.push('fire');
        if (pCounts.water === 0) needed.push('water');
        if (pCounts.snow === 0) needed.push('snow');

        const counters = { fire: 'water', water: 'snow', snow: 'fire' };
        for (const n of needed) {
          const counterElem = counters[n];
          const found = this.aiHand.find(c => c.element === counterElem);
          if (found) return found;
        }
      }
      // Seleccionar carta de mayor valor o aleatoria
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

      // Reponer mano para la siguiente ronda
      this.playerHand.push(this.createCard());
      this.aiHand.push(this.createCard());

      // Determinar ganador de ronda
      let roundWinner = 'tie'; // 'player' | 'ai' | 'tie'
      let reason = '';
      let clashType = 'element'; // 'element' | 'number' | 'tie'

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

      this.renderClashAnimation(playerCard, aiCard, roundWinner, reason, clashType, timedOut, () => {
        if (roundWinner === 'player') {
          this.playerWon.push(playerCard);
          this.sfx.winRound();
        } else if (roundWinner === 'ai') {
          this.aiWon.push(aiCard);
          this.sfx.loseRound();
        }

        // Comprobar victorias
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

    renderClashAnimation(pCard, aCard, roundWinner, reason, clashType, timedOut, onDone) {
      const mat = this.container.querySelector('#dojoClashMat');
      if (!mat) return onDone();

      const pCfg = ELEM_CONFIG[pCard.element];
      const aCfg = ELEM_CONFIG[aCard.element];
      const floor = FLOORS[this.currentFloor - 1];

      // Determinar clase de animación de destrucción
      let pAnimStyle = 'animation: cjImpactBump 0.5s ease-out;';
      let aAnimStyle = 'animation: cjImpactBump 0.5s ease-out;';

      if (roundWinner === 'player') {
        if (clashType === 'element') {
          if (pCard.element === 'fire') { aAnimStyle = 'animation: cjBurnDissolve 1.4s forwards;'; this.sfx.burnSound(); }
          else if (pCard.element === 'snow') { aAnimStyle = 'animation: cjIceFreezeShatter 1.4s forwards;'; this.sfx.freezeSound(); }
          else if (pCard.element === 'water') { aAnimStyle = 'animation: cjWaterExtinguish 1.4s forwards;'; this.sfx.splashSound(); }
        } else {
          aAnimStyle = 'animation: cjWaterExtinguish 1.2s forwards;';
          this.sfx.clash();
        }
      } else if (roundWinner === 'ai') {
        if (clashType === 'element') {
          if (aCard.element === 'fire') { pAnimStyle = 'animation: cjBurnDissolve 1.4s forwards;'; this.sfx.burnSound(); }
          else if (aCard.element === 'snow') { pAnimStyle = 'animation: cjIceFreezeShatter 1.4s forwards;'; this.sfx.freezeSound(); }
          else if (aCard.element === 'water') { pAnimStyle = 'animation: cjWaterExtinguish 1.4s forwards;'; this.sfx.splashSound(); }
        } else {
          pAnimStyle = 'animation: cjWaterExtinguish 1.2s forwards;';
          this.sfx.clash();
        }
      } else {
        pAnimStyle = 'animation: cjTieBounce 0.8s ease-in-out;';
        aAnimStyle = 'animation: cjTieBounce 0.8s ease-in-out;';
        this.sfx.clash();
      }

      const dialogueQuote = roundWinner === 'player'
        ? (floor.quotes?.loseRound || '¡Buen golpe!')
        : roundWinner === 'ai'
        ? (floor.quotes?.winRound || '¡Siente el poder!')
        : '¡Equilibrio perfecto!';

      mat.innerHTML = `
        <div style="position:relative;width:100%;display:flex;flex-direction:column;align-items:center;">
          ${timedOut ? `<div style="font-size:11px;color:#f59e0b;font-weight:700;margin-bottom:6px;">⏱️ Tiempo agotado: Carta seleccionada automáticamente</div>` : ''}

          <!-- Banner central de resultado de ronda -->
          <div style="background:${roundWinner === 'player' ? 'rgba(16,185,129,0.15)' : roundWinner === 'ai' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'};border:1.5px solid ${roundWinner === 'player' ? '#10b981' : roundWinner === 'ai' ? '#ef4444' : '#f59e0b'};border-radius:20px;padding:5px 18px;margin-bottom:14px;box-shadow:0 4px 16px rgba(0,0,0,0.4);animation: cjCardFlipIn 0.3s ease;">
            <span style="font-size:13.5px;font-weight:900;letter-spacing:0.5px;color:${roundWinner === 'player' ? '#34d399' : roundWinner === 'ai' ? '#f87171' : '#fbbf24'};">
              ${roundWinner === 'player' ? '⚡ ¡RONDA PARA TI!' : roundWinner === 'ai' ? '💥 ¡RONDA PARA EL RIVAL!' : '⚖️ ¡EMPATE ELEMENTAL!'}
            </span>
          </div>

          <!-- Choque animado de cartas -->
          <div style="display:flex;justify-content:center;align-items:center;gap:36px;margin-bottom:12px;">
            <!-- Carta Jugador -->
            <div style="width:88px;height:128px;border-radius:10px;background:${pCfg.bg};border:2px solid ${pCfg.border};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7px;box-shadow:0 0 20px ${pCfg.glow};${pAnimStyle}">
              <div style="font-size:14px;font-weight:900;color:#fff;width:100%;text-align:left;">${pCard.value}</div>
              <div style="font-size:38px;">${pCfg.icon}</div>
              <div style="font-size:11px;font-weight:800;color:#fff;text-transform:uppercase;">${pCfg.name}</div>
            </div>

            <!-- Indicador VS -->
            <div style="font-size:20px;font-weight:900;color:#64748b;background:#0d111a;border:1px solid #202636;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(0,0,0,0.5);">
              VS
            </div>

            <!-- Carta Rival -->
            <div style="width:88px;height:128px;border-radius:10px;background:${aCfg.bg};border:2px solid ${aCfg.border};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:7px;box-shadow:0 0 20px ${aCfg.glow};${aAnimStyle}">
              <div style="font-size:14px;font-weight:900;color:#fff;width:100%;text-align:left;">${aCard.value}</div>
              <div style="font-size:38px;">${aCfg.icon}</div>
              <div style="font-size:11px;font-weight:800;color:#fff;text-transform:uppercase;">${aCfg.name}</div>
            </div>
          </div>

          <!-- Razón del resultado -->
          <div style="font-size:12px;font-weight:700;color:#cbd5e1;margin-bottom:6px;text-align:center;">
            ${reason}
          </div>

          <!-- Burbuja de diálogo del personaje -->
          <div style="font-size:11px;color:#94a3b8;font-style:italic;background:rgba(255,255,255,0.04);padding:4px 12px;border-radius:12px;">
            💬 <b>${floor.name}:</b> "${dialogueQuote}"
          </div>
        </div>
      `;

      setTimeout(onDone, 1850);
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
          <div style="padding:20px;background:rgba(16,185,129,0.08);border:1.5px solid #10b981;border-radius:12px;text-align:center;box-shadow:0 8px 30px rgba(16,185,129,0.15);animation: cjCardFlipIn 0.35s ease;">
            <div style="font-size:32px;margin-bottom:6px;">🏆</div>
            <div style="font-size:18px;font-weight:900;color:#10b981;margin-bottom:4px;letter-spacing:0.5px;">¡VICTORIA EN PISO ${floor.level}!</div>
            <div style="font-size:12.5px;color:#e2e8f0;margin-bottom:8px;">${reasonDesc}</div>
            <div style="font-size:11.5px;color:#94a3b8;font-style:italic;margin-bottom:12px;">"${floor.quotes?.defeat || 'Bien jugado.'}"</div>

            <div style="font-size:13px;font-weight:800;color:#fde047;background:rgba(0,0,0,0.4);border:1px solid rgba(253,224,71,0.25);padding:9px 16px;border-radius:8px;display:inline-block;margin-bottom:16px;">
              🎁 Recompensas obtenidas: ${rewText}
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
          <div style="padding:20px;background:rgba(239,68,68,0.08);border:1.5px solid #ef4444;border-radius:12px;text-align:center;box-shadow:0 8px 30px rgba(239,68,68,0.15);animation: cjCardFlipIn 0.35s ease;">
            <div style="font-size:32px;margin-bottom:6px;">💀</div>
            <div style="font-size:18px;font-weight:900;color:#ef4444;margin-bottom:4px;">DERROTA EN PISO ${floor.level}</div>
            <div style="font-size:12.5px;color:#e2e8f0;margin-bottom:8px;">${reasonDesc}</div>
            <div style="font-size:11.5px;color:#94a3b8;font-style:italic;margin-bottom:14px;">"${floor.quotes?.winRound || 'Sigue entrenando.'}"</div>

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

      // Función auxiliar para renderizar fichas de cartas ganadas
      const renderTokens = (cards) => {
        if (!cards.length) return `<span style="font-size:11px;color:#64748b;font-style:italic;">Ninguna aún</span>`;
        return `
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${cards.map(c => {
              const cfg = ELEM_CONFIG[c.element];
              return `
                <div style="background:${cfg.bg};border:1px solid #fff;border-radius:5px;padding:2px 6px;display:flex;align-items:center;gap:3px;font-size:11px;font-weight:900;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);" title="${cfg.name} (${c.value})">
                  <span>${c.value}</span><span>${cfg.icon}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      };

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <!-- Barra Superior del Duelo: Personajes, Retratos y Barra de Turno -->
          <div style="background:#0e121a;border:1px solid #202636;border-radius:10px;padding:10px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <!-- Lado Jugador -->
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;border-radius:8px;background:#1e293b;border:2px solid #3b82f6;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;box-shadow:0 0 10px rgba(59,130,246,0.3);">
                  ${meAvatar}
                </div>
                <div>
                  <div style="font-size:13px;font-weight:900;color:#f8fafc;">${meName}</div>
                  <div style="font-size:11px;color:#94a3b8;">Aspirante Elemental</div>
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

              <!-- Lado Rival -->
              <div style="display:flex;align-items:center;gap:10px;text-align:right;">
                <div>
                  <div style="font-size:13px;font-weight:900;color:${floor.color};">${floor.name}</div>
                  <div style="font-size:11px;color:#94a3b8;">${floor.belt} · Piso ${floor.level}</div>
                </div>
                <div style="width:40px;height:40px;border-radius:8px;background:${floor.avatarBg};border:2px solid ${floor.color};display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 10px ${floor.color}40;">
                  ${floor.avatarText}
                </div>
              </div>
            </div>

            <!-- Tablero de Colección de la Partida -->
            <div style="display:flex;justify-content:space-between;align-items:center;background:#090d14;border:1px solid #1a202c;border-radius:8px;padding:6px 12px;font-size:11.5px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:#38bdf8;font-weight:800;">TUS CARTAS (${this.playerWon.length}):</span>
                ${renderTokens(this.playerWon)}
              </div>
              <div style="font-size:10.5px;color:#64748b;font-weight:700;">
                Condición: 3 distintos (🔥💧❄️) o 3 iguales
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:#f87171;font-weight:800;">RIVAL (${this.aiWon.length}):</span>
                ${renderTokens(this.aiWon)}
              </div>
            </div>
          </div>

          <!-- Tapete Central de Combate / Choque de Cartas -->
          <div id="dojoClashMat" style="background:#090c13;border:1px solid #1e2433;border-radius:10px;min-height:220px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:18px;position:relative;">
            <div style="font-size:12.5px;font-weight:800;color:#94a3b8;margin-bottom:8px;">
              ⚡ Selecciona una carta de tu mano para iniciar el duelo
            </div>
            <div style="display:flex;gap:16px;font-size:11px;color:#64748b;background:#0d111a;padding:5px 14px;border-radius:20px;border:1px solid #1a2233;">
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
                ${this.playerHand.length} cartas disponibles
              </div>
            </div>

            <div id="dojoHandContainer" style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
              ${this.playerHand.map((c, idx) => {
                const cfg = ELEM_CONFIG[c.element];
                return `
                  <div class="cj-hand-card" data-card-idx="${idx}" style="background:${cfg.bg};border:2px solid ${cfg.border};box-shadow:0 0 12px ${cfg.glow};display:flex;flex-direction:column;justify-content:space-between;padding:7px;color:#fff;">
                    <div style="font-size:13px;font-weight:900;text-align:left;">${c.value}</div>
                    <div style="font-size:32px;text-align:center;">${cfg.icon}</div>
                    <div style="font-size:10px;font-weight:800;text-align:center;text-transform:uppercase;">${cfg.name}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      // Event listeners para cartas de la mano
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
                <span>🥋</span> DOJO ELEMENTAL DEL NÚCLEO
              </div>
              <div style="font-size:11.5px;color:#94a3b8;margin-top:2px;">
                Duelos tácticos de cartas elementales inspirados en Card-Jitsu. ¡Derrota a los guardianes para forjar llaves y monedas!
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
                • Si ambos eligen el <b>mismo elemento</b>, gana la carta con el <b>número más alto</b> (valores del 2 al 12).<br>
                • Si el elemento y el número son idénticos, es un <b>empate neutral</b>.
              </div>
              <div style="background:#111520;border:1px solid #1e2433;border-radius:8px;padding:10px;">
                <b style="color:#10b981;">3. Cómo Ganar la Partida:</b><br>
                • <b>Opción A (Trío):</b> 1 carta de cada elemento distinto (🔥 + 💧 + ❄️).<br>
                • <b>Opción B (Monolito):</b> 3 cartas del MISMO elemento.
              </div>
            </div>
          </div>

          <!-- Cuadrícula de los 5 Guardianes del Núcleo -->
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
                    <div style="width:44px;height:44px;border-radius:9px;background:${f.avatarBg};border:2px solid ${f.color};display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 0 12px ${f.color}35;">
                      ${f.avatarText}
                    </div>
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
                    ⚔️ Comenzar Combate
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      // Handlers
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
