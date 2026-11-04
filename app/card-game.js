'use strict';
/**
 * Dojo Elemental del Núcleo - Minijuego de Cartas Estilo Card-Jitsu
 * Versión: v1.8.1
 * 
 * Reglas:
 * - 3 Elementos: Fuego (🔥) vence a Nieve (❄️), Nieve vence a Agua (💧), Agua vence a Fuego (🔥).
 * - Mismo elemento: Gana el número más alto (valores del 2 al 12).
 * - Mismo elemento y número: Empate de ronda.
 * - Condición de Victoria:
 *   a) Coleccionar 3 cartas de elementos DIFERENTES (1 Fuego + 1 Agua + 1 Nieve).
 *   b) Coleccionar 3 cartas del MISMO elemento (3 Fuego, 3 Agua o 3 Nieve).
 */

(function () {
  const ELEMENTS = ['fire', 'water', 'snow'];
  const ELEM_CONFIG = {
    fire: { name: 'Fuego', icon: '🔥', color: '#ef4444', bg: 'linear-gradient(135deg, #7f1d1d, #ef4444)' },
    water: { name: 'Agua', icon: '💧', color: '#06b6d4', bg: 'linear-gradient(135deg, #164e63, #06b6d4)' },
    snow: { name: 'Nieve', icon: '❄️', color: '#38bdf8', bg: 'linear-gradient(135deg, #0c4a6e, #38bdf8)' }
  };

  const FLOORS = [
    {
      level: 1,
      name: 'Novicio Ignis',
      belt: 'Cinturón Blanco',
      desc: 'Iniciado del fuego en las Minas de Magma.',
      color: '#e2e8f0',
      aiSkill: 0.3,
      reward: { coins: 35, keys: { copper: 1 } }
    },
    {
      level: 2,
      name: 'Monje de Escarcha',
      belt: 'Cinturón Azul',
      desc: 'Maestro de cristales helados en las Galerías.',
      color: '#38bdf8',
      aiSkill: 0.5,
      reward: { coins: 65, keys: { copper: 1, silver: 1 } }
    },
    {
      level: 3,
      name: 'Guardián del Torrente',
      belt: 'Cinturón Rojo',
      desc: 'Defensor de los Puentes de Lava ardiente.',
      color: '#ef4444',
      aiSkill: 0.7,
      reward: { coins: 110, keys: { silver: 1, gold: 1 } }
    },
    {
      level: 4,
      name: 'Campeón de Basalto',
      belt: 'Cinturón Negro',
      desc: 'Veterano imponente de la Cripta Ancestral.',
      color: '#64748b',
      aiSkill: 0.85,
      reward: { coins: 180, keys: { gold: 1, obsidian: 1 } }
    },
    {
      level: 5,
      name: 'Sensei del Núcleo',
      belt: 'Cinturón Ninja Supremo',
      desc: 'Maestro absoluto de los tres elementos.',
      color: '#fbbf24',
      aiSkill: 0.95,
      reward: { coins: 300, keys: { obsidian: 2 } }
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
    cardSelect() { this.playTone(520, 'sine', 0.08, 0.06); }
    clash() { this.playTone(220, 'triangle', 0.15, 0.1); }
    winRound() {
      this.playTone(659, 'sine', 0.1, 0.08);
      setTimeout(() => this.playTone(880, 'sine', 0.18, 0.08), 90);
    }
    loseRound() {
      this.playTone(330, 'sawtooth', 0.12, 0.06);
      setTimeout(() => this.playTone(247, 'sawtooth', 0.2, 0.06), 110);
    }
    winMatch() {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.1), i * 110);
      });
    }
  }

  class CardJitsuGame {
    constructor(container, options = {}) {
      this.container = container;
      this.options = options;
      this.sfx = new AudioEffects();
      this.currentFloor = 1;
      this.inMatch = false;
      this.isResolvingRound = false;

      this.playerHand = [];
      this.aiHand = [];
      this.playerWon = [];
      this.aiWon = [];
      this.matchWinner = null;
      this.claimedFloors = {};

      try {
        const saved = localStorage.getItem('epickast.dojo.floors');
        if (saved) this.claimedFloors = JSON.parse(saved);
      } catch {}

      this.initUI();
    }

    createCard() {
      const elem = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      const val = Math.floor(Math.random() * 11) + 2; // 2 al 12
      return { id: 'c_' + Math.random().toString(36).substring(2, 8), element: elem, value: val };
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
    }

    checkWinCondition(wonCards) {
      if (wonCards.length < 3) return false;
      const counts = { fire: 0, water: 0, snow: 0 };
      wonCards.forEach(c => { if (counts[c.element] !== undefined) counts[c.element]++; });

      // Condición A: 3 elementos distintos
      if (counts.fire >= 1 && counts.water >= 1 && counts.snow >= 1) {
        return { type: 'triad', desc: '¡Trío Elemental! (Fuego 🔥 + Agua 💧 + Nieve ❄️)' };
      }
      // Condición B: 3 del mismo elemento
      for (const el of ELEMENTS) {
        if (counts[el] >= 3) {
          const cfg = ELEM_CONFIG[el];
          return { type: 'monolith', desc: `¡Poder Absoluto! 3 cartas de ${cfg.name} ${cfg.icon}` };
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

        // Contra qué elemento debería jugar la IA para frenar
        // Si al jugador le falta fuego, la IA busca jugar Agua para vencerlo
        const counters = { fire: 'water', water: 'snow', snow: 'fire' };
        for (const n of needed) {
          const counterElem = counters[n];
          const found = this.aiHand.find(c => c.element === counterElem);
          if (found) return found;
        }
      }
      // Selección aleatoria o carta de mayor valor
      return this.aiHand[Math.floor(Math.random() * this.aiHand.length)];
    }

    playRound(playerCard) {
      if (this.isResolvingRound || this.matchWinner) return;
      this.isResolvingRound = true;
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
      let roundWinner = 'tie'; // 'player' | 'ai' | 'tie'
      let reason = '';

      if (playerCard.element === aiCard.element) {
        if (playerCard.value > aiCard.value) {
          roundWinner = 'player';
          reason = `Mismo elemento (${ELEM_CONFIG[playerCard.element].name}). Tu carta (${playerCard.value}) superó a la rival (${aiCard.value}).`;
        } else if (playerCard.value < aiCard.value) {
          roundWinner = 'ai';
          reason = `Mismo elemento (${ELEM_CONFIG[playerCard.element].name}). La carta rival (${aiCard.value}) superó a la tuya (${playerCard.value}).`;
        } else {
          roundWinner = 'tie';
          reason = `¡Empate idéntico! Mismo elemento y mismo valor (${playerCard.value}).`;
        }
      } else {
        const winsOver = { fire: 'snow', snow: 'water', water: 'fire' };
        if (winsOver[playerCard.element] === aiCard.element) {
          roundWinner = 'player';
          reason = `¡${ELEM_CONFIG[playerCard.element].name} ${ELEM_CONFIG[playerCard.element].icon} vence a ${ELEM_CONFIG[aiCard.element].name} ${ELEM_CONFIG[aiCard.element].icon}!`;
        } else {
          roundWinner = 'ai';
          reason = `¡${ELEM_CONFIG[aiCard.element].name} ${ELEM_CONFIG[aiCard.element].icon} del rival vence a tu ${ELEM_CONFIG[playerCard.element].name} ${ELEM_CONFIG[playerCard.element].icon}!`;
        }
      }

      // Renderizar el choque en el tapiz
      this.renderClash(playerCard, aiCard, roundWinner, reason, () => {
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
        }
      });
    }

    renderClash(pCard, aCard, roundWinner, reason, onDone) {
      const mat = this.container.querySelector('#dojoClashMat');
      if (!mat) return onDone();

      const pCfg = ELEM_CONFIG[pCard.element];
      const aCfg = ELEM_CONFIG[aCard.element];

      mat.innerHTML = `
        <div style="display:flex;justify-content:center;align-items:center;gap:24px;margin-bottom:12px;">
          <!-- Carta Jugador -->
          <div style="width:78px;height:115px;border-radius:8px;background:${pCfg.bg};border:2px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px;box-shadow:0 0 16px ${pCfg.color};transform:scale(1.05);transition:transform 0.2s;">
            <div style="font-size:12px;font-weight:900;color:#fff;width:100%;text-align:left;">${pCard.value}</div>
            <div style="font-size:32px;">${pCfg.icon}</div>
            <div style="font-size:10px;font-weight:800;color:#fff;text-transform:uppercase;">${pCfg.name}</div>
          </div>

          <div style="font-size:22px;font-weight:900;color:#94a3b8;">VS</div>

          <!-- Carta Rival -->
          <div style="width:78px;height:115px;border-radius:8px;background:${aCfg.bg};border:2px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px;box-shadow:0 0 16px ${aCfg.color};transform:scale(1.05);transition:transform 0.2s;">
            <div style="font-size:12px;font-weight:900;color:#fff;width:100%;text-align:left;">${aCard.value}</div>
            <div style="font-size:32px;">${aCfg.icon}</div>
            <div style="font-size:10px;font-weight:800;color:#fff;text-transform:uppercase;">${aCfg.name}</div>
          </div>
        </div>

        <div style="font-size:13px;font-weight:800;color:${roundWinner === 'player' ? '#10b981' : roundWinner === 'ai' ? '#ef4444' : '#fbbf24'};margin-bottom:4px;">
          ${roundWinner === 'player' ? '✓ ¡Ronda Ganada!' : roundWinner === 'ai' ? '✗ Ronda para el Rival' : '═ ¡Empate!'}
        </div>
        <div style="font-size:11.5px;color:#94a3b8;">${reason}</div>
      `;

      this.sfx.clash();
      setTimeout(onDone, 1600);
    }

    renderMatchResult(playerWon, reasonDesc) {
      const mat = this.container.querySelector('#dojoClashMat');
      if (!mat) return;

      const floor = FLOORS[this.currentFloor - 1];

      if (playerWon) {
        // Marcar piso reclamado y otorgar recompensas
        let rewText = `+${floor.reward.coins} 🪙 Monedas`;
        if (floor.reward.keys) {
          const kParts = [];
          if (floor.reward.keys.copper) kParts.push(`${floor.reward.keys.copper} Llave(s) Cobre 🔑`);
          if (floor.reward.keys.silver) kParts.push(`${floor.reward.keys.silver} Llave(s) Plata 🔑`);
          if (floor.reward.keys.gold) kParts.push(`${floor.reward.keys.gold} Llave(s) Oro 🔑`);
          if (floor.reward.keys.obsidian) kParts.push(`${floor.reward.keys.obsidian} Llave(s) Obsidiana 💎`);
          rewText += ` · ` + kParts.join(', ');
        }

        // Callback al padre para sumar a la Bóveda
        if (this.options.onReward) {
          this.options.onReward(floor.reward);
        }

        this.claimedFloors[floor.level] = true;
        try { localStorage.setItem('epickast.dojo.floors', JSON.stringify(this.claimedFloors)); } catch {}

        mat.innerHTML = `
          <div style="padding:16px;background:rgba(16,185,129,0.08);border:1.5px solid #10b981;border-radius:10px;text-align:center;">
            <div style="font-size:24px;margin-bottom:4px;">🏆</div>
            <div style="font-size:16px;font-weight:900;color:#10b981;margin-bottom:4px;">¡VICTORIA EN PISO ${floor.level}!</div>
            <div style="font-size:12px;color:#cbd5e1;margin-bottom:10px;">${reasonDesc}</div>
            <div style="font-size:13px;font-weight:800;color:#fde047;background:rgba(0,0,0,0.3);padding:8px 12px;border-radius:6px;display:inline-block;margin-bottom:12px;">
              🎁 Recompensas otorgadas: ${rewText}
            </div>
            <div style="display:flex;justify-content:center;gap:10px;">
              ${this.currentFloor < 5 ? `
                <button id="dojoBtnNextFloor" style="background:#2563eb;color:#fff;border:none;padding:7px 16px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">
                  ⚔️ Desafiar Piso ${this.currentFloor + 1}
                </button>
              ` : `
                <button id="dojoBtnReplay" style="background:#059669;color:#fff;border:none;padding:7px 16px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">
                  👑 ¡Has derrotado al Sensei! Repetir combate
                </button>
              `}
              <button id="dojoBtnBackLobby" style="background:#1e2433;color:#94a3b8;border:1px solid #2e384d;padding:7px 14px;border-radius:6px;font-weight:700;font-size:11.5px;cursor:pointer;">
                Volver al Dojo
              </button>
            </div>
          </div>
        `;

        const nextBtn = mat.querySelector('#dojoBtnNextFloor');
        if (nextBtn) {
          nextBtn.onclick = () => {
            this.currentFloor++;
            this.startMatch();
          };
        }
        const replayBtn = mat.querySelector('#dojoBtnReplay');
        if (replayBtn) replayBtn.onclick = () => this.startMatch();

        const backBtn = mat.querySelector('#dojoBtnBackLobby');
        if (backBtn) backBtn.onclick = () => { this.inMatch = false; this.initUI(); };

      } else {
        mat.innerHTML = `
          <div style="padding:16px;background:rgba(239,68,68,0.08);border:1.5px solid #ef4444;border-radius:10px;text-align:center;">
            <div style="font-size:24px;margin-bottom:4px;">💀</div>
            <div style="font-size:16px;font-weight:900;color:#ef4444;margin-bottom:4px;">DERROTA ANTE ${floor.name.toUpperCase()}</div>
            <div style="font-size:12px;color:#cbd5e1;margin-bottom:12px;">${reasonDesc}</div>
            <div style="display:flex;justify-content:center;gap:10px;">
              <button id="dojoBtnRetry" style="background:#2563eb;color:#fff;border:none;padding:7px 16px;border-radius:6px;font-weight:800;font-size:12px;cursor:pointer;">
                🔄 Intentar de Nuevo
              </button>
              <button id="dojoBtnBackLobby" style="background:#1e2433;color:#94a3b8;border:1px solid #2e384d;padding:7px 14px;border-radius:6px;font-weight:700;font-size:11.5px;cursor:pointer;">
                Volver al Dojo
              </button>
            </div>
          </div>
        `;

        const retryBtn = mat.querySelector('#dojoBtnRetry');
        if (retryBtn) retryBtn.onclick = () => this.startMatch();

        const backBtn = mat.querySelector('#dojoBtnBackLobby');
        if (backBtn) backBtn.onclick = () => { this.inMatch = false; this.initUI(); };
      }
    }

    startMatch() {
      this.inMatch = true;
      this.initHand();
      this.renderMatchBoard();
    }

    renderMatchBoard() {
      const floor = FLOORS[this.currentFloor - 1];

      // Formatear chips ganados
      const formatChips = (cards) => {
        if (cards.length === 0) return '<span style="font-size:11px;color:#64748b;">(Ninguno aún)</span>';
        return cards.map(c => `
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${ELEM_CONFIG[c.element].color}22;border:1px solid ${ELEM_CONFIG[c.element].color};font-size:12px;" title="${ELEM_CONFIG[c.element].name} ${c.value}">
            ${ELEM_CONFIG[c.element].icon}
          </span>
        `).join('');
      };

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;color:#e2e8f0;">
          <!-- Cabecera de combate -->
          <div style="display:flex;justify-content:space-between;align-items:center;background:#141923;padding:8px 14px;border-radius:8px;border:1px solid #232b3b;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:18px;">🥋</span>
              <div>
                <div style="font-size:12.5px;font-weight:800;color:#fff;">Piso ${floor.level}: ${floor.name}</div>
                <div style="font-size:10.5px;color:${floor.color};font-weight:700;">${floor.belt}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;color:#94a3b8;">Gana con <b>3 elementos distintos</b> o <b>3 del mismo</b></span>
              <button id="dojoBtnExitMatch" style="background:transparent;border:1px solid #334155;color:#94a3b8;border-radius:5px;padding:3px 8px;font-size:10.5px;cursor:pointer;">Salir</button>
            </div>
          </div>

          <!-- Marcador de elementos obtenidos -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#10141d;padding:8px 14px;border-radius:8px;border:1px solid #1f2637;">
            <div>
              <div style="font-size:10.5px;font-weight:800;color:#38bdf8;text-transform:uppercase;margin-bottom:4px;">Tus Elementos:</div>
              <div style="display:flex;gap:6px;align-items:center;">${formatChips(this.playerWon)}</div>
            </div>
            <div>
              <div style="font-size:10.5px;font-weight:800;color:#ef4444;text-transform:uppercase;margin-bottom:4px;">Elementos Rival:</div>
              <div style="display:flex;gap:6px;align-items:center;">${formatChips(this.aiWon)}</div>
            </div>
          </div>

          <!-- Tapiz Central de Enfrentamiento -->
          <div id="dojoClashMat" style="min-height:160px;background:#0d1117;border:1.5px dashed #242c3d;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center;">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Elige una carta de tu mano para iniciar el duelo</div>
            <div style="font-size:10.5px;color:#475569;">🔥 Fuego derrite Nieve ❄️ · ❄️ Nieve congela Agua 💧 · 💧 Agua apaga Fuego 🔥</div>
          </div>

          <!-- Mano del Jugador (5 Cartas) -->
          <div style="background:#141923;padding:10px 14px;border-radius:8px;border:1px solid #232b3b;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:11px;font-weight:800;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.5px;">Tu Mano (Selecciona una carta):</span>
              <span style="font-size:10.5px;color:#64748b;">Mazo inagotable</span>
            </div>
            <div id="dojoHandCards" style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;"></div>
          </div>
        </div>
      `;

      // Renderizar cartas de mano
      const handWrap = this.container.querySelector('#dojoHandCards');
      if (handWrap) {
        this.playerHand.forEach(card => {
          const cfg = ELEM_CONFIG[card.element];
          const btn = document.createElement('button');
          btn.style.cssText = `
            width:64px;height:95px;border-radius:8px;background:${cfg.bg};border:1.5px solid rgba(255,255,255,0.25);
            display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:5px;
            cursor:${this.isResolvingRound ? 'not-allowed' : 'pointer'};box-shadow:0 3px 8px rgba(0,0,0,0.4);
            transition:transform 0.12s, box-shadow 0.12s;user-select:none;
          `;
          btn.innerHTML = `
            <div style="font-size:11px;font-weight:900;color:#fff;width:100%;text-align:left;line-height:1;">${card.value}</div>
            <div style="font-size:24px;line-height:1;">${cfg.icon}</div>
            <div style="font-size:9px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.3px;">${cfg.name}</div>
          `;

          if (!this.isResolvingRound) {
            btn.onmouseenter = () => { btn.style.transform = 'translateY(-6px)'; btn.style.boxShadow = `0 6px 14px ${cfg.color}55`; };
            btn.onmouseleave = () => { btn.style.transform = 'translateY(0px)'; btn.style.boxShadow = '0 3px 8px rgba(0,0,0,0.4)'; };
            btn.onclick = () => this.playRound(card);
          } else {
            btn.style.opacity = '0.5';
          }

          handWrap.appendChild(btn);
        });
      }

      const exitBtn = this.container.querySelector('#dojoBtnExitMatch');
      if (exitBtn) exitBtn.onclick = () => { this.inMatch = false; this.initUI(); };
    }

    initUI() {
      // Vista principal del Dojo: Selección de Pisos y Guardianes
      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;color:#e2e8f0;">
          <!-- Cabecera del Dojo -->
          <div style="background:#141923;padding:12px 16px;border-radius:8px;border:1px solid #232b3b;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:900;color:#fff;display:flex;align-items:center;gap:6px;">
                <span>🥋</span> DOJO ELEMENTAL DEL NÚCLEO
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                Minijuego táctico de cartas. Derrota a los 5 guardianes para obtener llaves y monedas para la Bóveda.
              </div>
            </div>
            <div style="display:flex;gap:6px;font-size:11px;background:#0d1117;padding:5px 10px;border-radius:6px;border:1px solid #1e2637;">
              <span>🔥 Vence a ❄️</span>
              <span style="color:#64748b;">•</span>
              <span>❄️ Vence a 💧</span>
              <span style="color:#64748b;">•</span>
              <span>💧 Vence a 🔥</span>
            </div>
          </div>

          <!-- Lista de 5 Pisos -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
            ${FLOORS.map(f => {
              const isClaimed = !!this.claimedFloors[f.level];
              const isCurrent = this.currentFloor === f.level;
              return `
                <div style="background:#131720;border:1.5px solid ${isCurrent ? '#38bdf8' : '#212736'};border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:10px;font-weight:900;color:${f.color};text-transform:uppercase;">PISO ${f.level}</span>
                    ${isClaimed ? '<span style="font-size:10px;color:#10b981;font-weight:800;">✓ CONQUISTADO</span>' : ''}
                  </div>
                  <div style="font-size:13px;font-weight:800;color:#fff;">${f.name}</div>
                  <div style="font-size:10.5px;color:${f.color};font-weight:700;">${f.belt}</div>
                  <div style="font-size:10.5px;color:#94a3b8;line-height:1.3;">${f.desc}</div>
                  <div style="font-size:11px;color:#fbbf24;background:#0d1017;padding:5px 8px;border-radius:4px;margin-top:auto;">
                    🎁 +${f.reward.coins} 🪙 ${f.reward.keys.obsidian ? '· 2 Obsidiana 💎' : f.reward.keys.gold ? '· Llave Oro 🔑' : f.reward.keys.silver ? '· Llave Plata 🔑' : '· Llave Cobre 🔑'}
                  </div>
                  <button class="dojoStartFloorBtn" data-level="${f.level}" style="width:100%;background:${isCurrent ? '#2563eb' : '#1e2433'};color:${isCurrent ? '#fff' : '#cbd5e1'};border:1px solid ${isCurrent ? '#3b82f6' : '#2e384d'};padding:7px;border-radius:6px;font-weight:800;font-size:11px;cursor:pointer;margin-top:4px;">
                    ${isClaimed ? 'Rejugar Duelo' : 'Comenzar Combate'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.container.querySelectorAll('.dojoStartFloorBtn').forEach(btn => {
        btn.onclick = () => {
          this.currentFloor = parseInt(btn.dataset.level, 10);
          this.startMatch();
        };
      });
    }
  }

  window.CardJitsuGame = CardJitsuGame;
})();
