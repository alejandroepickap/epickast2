// ============================================================================
// EPICKAST: TURBO CORE — CARRERAS PIXEL-NEON DEL NÚCLEO (v1.9.0)
// Sistema de Economía Compartida (Monedas, Llaves de Reliquia y Piloto Ninja)
// ============================================================================

(function () {
  'use strict';

  const TRACKS = [
    {
      id: 1,
      name: 'Autopista de Cobre',
      tier: 'Circuito Novato · Nivel 1',
      laps: 3,
      lapLength: 2600,
      aiSpeed: 7.4,
      hazardRate: 0.012,
      theme: {
        road: '#131824',
        border: '#f97316',
        grid: 'rgba(249, 115, 22, 0.16)',
        sky: '#090c14',
        accent: '#fb923c'
      },
      desc: 'Viaductos industriales sobre las fundiciones del Núcleo. Ideal para dominar el derrape y los paneles de turbo.',
      firstReward: { coins: 70, keys: { copper: 1 } },
      repeatReward: { coins: 35, keys: {} }
    },
    {
      id: 2,
      name: 'Cañón de Cristales',
      tier: 'Circuito Intermedio · Nivel 2',
      laps: 3,
      lapLength: 3100,
      aiSpeed: 8.6,
      hazardRate: 0.017,
      theme: {
        road: '#0f1b2d',
        border: '#38bdf8',
        grid: 'rgba(56, 189, 248, 0.18)',
        sky: '#07101c',
        accent: '#7dd3fc'
      },
      desc: 'Túneles de cuarzo congelado con estalagmitas de hielo. Requiere reflejos rápidos y buen uso del nitro.',
      firstReward: { coins: 120, keys: { silver: 1 } },
      repeatReward: { coins: 60, keys: {} }
    },
    {
      id: 3,
      name: 'Puente de Magma',
      tier: 'Circuito Avanzado · Nivel 3',
      laps: 4,
      lapLength: 3500,
      aiSpeed: 9.7,
      hazardRate: 0.022,
      theme: {
        road: '#1f1116',
        border: '#ef4444',
        grid: 'rgba(239, 68, 68, 0.18)',
        sky: '#12080b',
        accent: '#f87171'
      },
      desc: 'Calzada suspendida sobre ríos de lava incandescente. Los rivales usan propulsores de alta cilindrada.',
      firstReward: { coins: 220, keys: { gold: 1 } },
      repeatReward: { coins: 100, keys: {} }
    },
    {
      id: 4,
      name: 'Hipernúcleo Obsidiana',
      tier: 'Gran Premio Maestro · Nivel 4',
      laps: 4,
      lapLength: 4000,
      aiSpeed: 10.9,
      hazardRate: 0.027,
      theme: {
        road: '#150f24',
        border: '#a855f7',
        grid: 'rgba(168, 85, 247, 0.22)',
        sky: '#090612',
        accent: '#e879f9'
      },
      desc: 'El circuito gravitacional del Sensei Supremo. Velocidad extrema y recompensas de élite.',
      firstReward: { coins: 450, keys: { obsidian: 1 } },
      repeatReward: { coins: 180, keys: {} }
    }
  ];

  const CHASSIS_COLORS = [
    { id: 'cyan', name: 'Cian Hiperión', primary: '#06b6d4', glow: '#22d3ee' },
    { id: 'crimson', name: 'Carmesí Ignis', primary: '#dc2626', glow: '#f87171' },
    { id: 'emerald', name: 'Esmeralda Nexo', primary: '#059669', glow: '#34d399' },
    { id: 'gold', name: 'Oro Soberano', primary: '#d97706', glow: '#fbbf24' },
    { id: 'amethyst', name: 'Amatista Vacío', primary: '#7c3aed', glow: '#c084fc' }
  ];

  const UPGRADE_COSTS = [0, 120, 280, 550, 1000]; // nivel 1 -> 2, 2 -> 3, 3 -> 4, 4 -> 5

  // Audio sintetizado ligero
  const RacerAudio = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },
    tone(freq, type, dur, vol = 0.08, endFreq = null) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + dur);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
      } catch {}
    },
    beep(high = false) { this.tone(high ? 880 : 440, 'square', high ? 0.25 : 0.14, 0.08); },
    coin() { this.tone(987, 'sine', 0.09, 0.08, 1318); },
    boost() { this.tone(220, 'sawtooth', 0.35, 0.09, 780); },
    crash() { this.tone(130, 'sawtooth', 0.28, 0.11, 45); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 'triangle', 0.22, 0.1), i * 110));
    }
  };

  function loadRacerSave() {
    try {
      const raw = JSON.parse(localStorage.getItem('epickast.racer.v1') || '{}');
      return {
        engine: Math.max(1, Math.min(5, Number(raw.engine) || 1)),
        turbo: Math.max(1, Math.min(5, Number(raw.turbo) || 1)),
        shield: Math.max(1, Math.min(5, Number(raw.shield) || 1)),
        chassis: raw.chassis || 'cyan',
        clearedTracks: raw.clearedTracks || {},
        bestTimes: raw.bestTimes || {},
        racesWon: Number(raw.racesWon) || 0
      };
    } catch {
      return { engine: 1, turbo: 1, shield: 1, chassis: 'cyan', clearedTracks: {}, bestTimes: {}, racesWon: 0 };
    }
  }

  function saveRacerData(d) {
    try { localStorage.setItem('epickast.racer.v1', JSON.stringify(d)); } catch {}
  }

  function getNinjaPilot() {
    try {
      const saved = JSON.parse(localStorage.getItem('epickast.ninja.v1') || '{}');
      return {
        suitColor: saved.suitColor || '#1e293b',
        maskColor: saved.maskColor || '#dc2626',
        beltColor: saved.beltColor || '#f8fafc',
        eyeColor: saved.eyeColor || '#38bdf8'
      };
    } catch {
      return { suitColor: '#1e293b', maskColor: '#dc2626', beltColor: '#f8fafc', eyeColor: '#38bdf8' };
    }
  }

  class CoreRacerGame {
    constructor(container, options = {}) {
      this.container = container;
      this.options = options;
      this.save = loadRacerSave();
      this.pilot = getNinjaPilot();
      this.inRace = false;
      this.rafId = null;
      this.keyState = {};
      this.selectedTrack = TRACKS[0];

      this._onKeyDown = (e) => {
        if (!this.inRace) return;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
          e.preventDefault();
        }
        this.keyState[e.key.toLowerCase()] = true;
        if (e.key === ' ') this.activateNitro();
      };
      this._onKeyUp = (e) => {
        this.keyState[e.key.toLowerCase()] = false;
      };
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);

      this.renderLobby();
    }

    destroy() {
      this.inRace = false;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
    }

    getCoins() {
      if (typeof this.options.getCoins === 'function') return this.options.getCoins();
      try {
        const d = JSON.parse(localStorage.getItem('epickast.dungeon.v1') || '{}');
        return Number(d.coins) || 0;
      } catch { return 0; }
    }

    spendCoins(amount) {
      if (typeof this.options.spendCoins === 'function') {
        return this.options.spendCoins(amount);
      }
      try {
        const d = JSON.parse(localStorage.getItem('epickast.dungeon.v1') || '{}');
        if ((d.coins || 0) < amount) return false;
        d.coins -= amount;
        localStorage.setItem('epickast.dungeon.v1', JSON.stringify(d));
        return true;
      } catch { return false; }
    }

    renderLobby() {
      this.inRace = false;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.pilot = getNinjaPilot();
      const coins = this.getCoins();
      const ch = CHASSIS_COLORS.find(c => c.id === this.save.chassis) || CHASSIS_COLORS[0];
      const clearedCount = TRACKS.filter(t => !!this.save.clearedTracks[t.id]).length;

      const renderUpgradeCard = (key, title, icon, desc) => {
        const lvl = this.save[key] || 1;
        const isMax = lvl >= 5;
        const cost = isMax ? 0 : UPGRADE_COSTS[lvl];
        const canAfford = coins >= cost;
        return `
          <div style="background:#0c101b;border:1px solid #1f293d;border-radius:10px;padding:11px 13px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:12.5px;font-weight:900;color:#f8fafc;">${icon} ${title}</span>
              <span style="font-size:10.5px;font-weight:800;color:#38bdf8;background:rgba(56,189,248,0.12);padding:2px 7px;border-radius:8px;">Nv. ${lvl}/5</span>
            </div>
            <div style="font-size:11px;color:#94a3b8;">${desc}</div>
            <div style="display:flex;gap:4px;margin:2px 0;">
              ${[1, 2, 3, 4, 5].map(i => `<div style="flex:1;height:5px;border-radius:3px;background:${i <= lvl ? ch.glow : '#1e293b'};"></div>`).join('')}
            </div>
            ${isMax
              ? `<button disabled style="background:#065f46;color:#6ee7b7;border:none;padding:6px;border-radius:6px;font-size:11px;font-weight:800;">✓ NIVEL MÁXIMO</button>`
              : `<button class="racer-upg-btn" data-upg="${key}" style="background:${canAfford ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#1e2433'};color:${canAfford ? '#fff' : '#64748b'};border:1px solid ${canAfford ? '#3b82f6' : '#2d3748'};padding:6px;border-radius:6px;font-size:11px;font-weight:800;cursor:${canAfford ? 'pointer' : 'not-allowed'};">
                  Mejorar (${cost} 🪙)
                </button>`
            }
          </div>
        `;
      };

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <!-- Cabecera Turbo Core -->
          <div style="background:linear-gradient(135deg, #0b101d 0%, #17132b 100%);border:1px solid #28324e;border-radius:12px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 6px 20px rgba(0,0,0,0.4);">
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:58px;height:58px;border-radius:12px;background:radial-gradient(circle,#1e293b,#090d16);border:2px solid ${ch.glow};display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px ${ch.glow}44;">
                <span style="font-size:28px;">🏎️</span>
              </div>
              <div>
                <div style="font-size:15px;font-weight:900;color:#f8fafc;display:flex;align-items:center;gap:8px;">
                  <span>⚡</span> TURBO CORE: CARRERAS PIXEL-NEON · v1.9.0
                  <span style="font-size:10px;background:rgba(168,85,247,0.16);border:1px solid rgba(168,85,247,0.45);color:#e879f9;padding:2px 8px;border-radius:10px;font-weight:800;">${clearedCount}/4 Circuitos</span>
                </div>
                <div style="font-size:11.5px;color:#94a3b8;margin-top:3px;">
                  Compite con tu Ninja personalizado, recoge Monedas del Núcleo en pista y gana Llaves de Reliquia para la Bóveda.
                </div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="background:#090d14;border:1px solid #222c40;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:900;color:#fbbf24;">
                🪙 ${coins.toLocaleString()} Monedas disponibles
              </div>
            </div>
          </div>

          <!-- Taller del Núcleo (Economía Compartida) -->
          <div style="background:#090d15;border:1px solid #1b2436;border-radius:12px;padding:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
              <div style="font-size:13px;font-weight:900;color:#e2e8f0;">🔧 TALLER DE INGENIERÍA DEL NÚCLEO (Mejoras Permanentes)</div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;color:#94a3b8;font-weight:700;">Chasis Neón:</span>
                ${CHASSIS_COLORS.map(c => `
                  <button class="racer-color-btn" data-color="${c.id}" title="${c.name}" style="width:20px;height:20px;border-radius:50%;background:${c.primary};border:2px solid ${this.save.chassis === c.id ? '#fff' : 'transparent'};box-shadow:${this.save.chassis === c.id ? `0 0 8px ${c.glow}` : 'none'};cursor:pointer;"></button>
                `).join('')}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:10px;">
              ${renderUpgradeCard('engine', 'Motor Iónico', '🚀', 'Aumenta la velocidad punta y aceleración en todos los circuitos.')}
              ${renderUpgradeCard('turbo', 'Inyector Nitro', '🔥', 'Incrementa la potencia del propulsor (Espacio) y su recarga.')}
              ${renderUpgradeCard('shield', 'Escudo Magnético', '🛡️', 'Reduce la pérdida de velocidad al chocar y atrae monedas cercanas.')}
            </div>
          </div>

          <!-- Selección de Circuitos -->
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(235px, 1fr));gap:12px;">
            ${TRACKS.map(t => {
              const isCleared = !!this.save.clearedTracks[t.id];
              const best = this.save.bestTimes[t.id] ? `${(this.save.bestTimes[t.id] / 1000).toFixed(1)}s` : 'Sin récord';
              const keyLabel = t.firstReward.keys.copper ? '1 Cobre 🟤' : t.firstReward.keys.silver ? '1 Plata ⚪' : t.firstReward.keys.gold ? '1 Oro 🟡' : '1 Obsidiana 🟣';
              return `
                <div style="background:linear-gradient(160deg, #0e1320 0%, #090c14 100%);border:1.5px solid ${isCleared ? '#10b981' : t.theme.border};border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:9px;position:relative;box-shadow:0 6px 16px rgba(0,0,0,0.4);">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:10px;font-weight:900;color:${t.theme.accent};text-transform:uppercase;">${t.tier}</span>
                    <span style="font-size:10px;font-weight:800;color:${isCleared ? '#34d399' : '#fbbf24'};background:rgba(0,0,0,0.45);padding:2px 7px;border-radius:8px;border:1px solid ${isCleared ? '#10b981' : 'rgba(251,191,36,0.4)'};">
                      ${isCleared ? `✓ Récord: ${best}` : '🌟 1ª Conquista'}
                    </span>
                  </div>
                  <div style="font-size:14.5px;font-weight:900;color:#f8fafc;">${t.name}</div>
                  <div style="font-size:11.5px;color:#94a3b8;line-height:1.4;flex:1;">${t.desc}</div>
                  <div style="font-size:11px;color:#cbd5e1;display:flex;justify-content:space-between;background:#080b12;padding:5px 8px;border-radius:6px;border:1px solid #172033;">
                    <span>🏁 ${t.laps} Vueltas</span>
                    <span style="color:#fbbf24;font-weight:800;">
                      ${isCleared ? `🏆 1º: +${t.repeatReward.coins} 🪙` : `🎁 1º: +${t.firstReward.coins} 🪙 + ${keyLabel}`}
                    </span>
                  </div>
                  <button class="racer-start-btn" data-track="${t.id}" style="background:linear-gradient(135deg, ${t.theme.border}, #2563eb);color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:900;font-size:12px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.35);">
                    🏎️ Correr en ${t.name}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.container.querySelectorAll('.racer-color-btn').forEach(btn => {
        btn.onclick = () => {
          this.save.chassis = btn.dataset.color;
          saveRacerData(this.save);
          this.renderLobby();
        };
      });

      this.container.querySelectorAll('.racer-upg-btn').forEach(btn => {
        btn.onclick = () => {
          const key = btn.dataset.upg;
          const lvl = this.save[key] || 1;
          if (lvl >= 5) return;
          const cost = UPGRADE_COSTS[lvl];
          if (this.spendCoins(cost)) {
            this.save[key] = lvl + 1;
            saveRacerData(this.save);
            RacerAudio.coin();
            this.renderLobby();
          }
        };
      });

      this.container.querySelectorAll('.racer-start-btn').forEach(btn => {
        btn.onclick = () => {
          const tid = Number(btn.dataset.track);
          const track = TRACKS.find(t => t.id === tid) || TRACKS[0];
          this.startRace(track);
        };
      });
    }

    startRace(track) {
      this.selectedTrack = track;
      this.inRace = true;
      this.keyState = {};
      const ch = CHASSIS_COLORS.find(c => c.id === this.save.chassis) || CHASSIS_COLORS[0];

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;user-select:none;">
          <!-- HUD Superior -->
          <div style="background:#0c101a;border:1px solid #20293d;border-radius:10px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:13px;font-weight:900;color:${track.theme.accent};">🏎️ ${track.name}</span>
              <span id="racerLapTxt" style="font-size:12px;font-weight:900;color:#f8fafc;background:#161f30;padding:3px 9px;border-radius:6px;">VUELTA 1 / ${track.laps}</span>
              <span id="racerPosTxt" style="font-size:12px;font-weight:900;color:#fbbf24;background:#161f30;padding:3px 9px;border-radius:6px;">POSICIÓN: 4º / 4</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span id="racerCoinsTxt" style="font-size:12px;font-weight:800;color:#fde047;">🪙 +0 recogidas</span>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:11px;font-weight:800;color:#38bdf8;">NITRO:</span>
                <div style="width:100px;height:10px;background:#1e293b;border-radius:5px;overflow:hidden;border:1px solid #334155;">
                  <div id="racerNitroBar" style="width:100%;height:100%;background:linear-gradient(90deg,#06b6d4,#3b82f6);"></div>
                </div>
              </div>
              <button id="racerBtnExit" style="background:#1e2433;border:1px solid #3b4660;color:#cbd5e1;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;">✕ Salir</button>
            </div>
          </div>

          <!-- Lienzo de Carrera -->
          <div style="position:relative;border-radius:12px;overflow:hidden;border:2px solid ${track.theme.border};background:${track.theme.sky};box-shadow:0 10px 30px rgba(0,0,0,0.6);">
            <canvas id="racerCanvas" width="760" height="390" style="width:100%;height:390px;display:block;"></canvas>
            <div id="racerOverlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;"></div>
          </div>

          <!-- Controles Rápidos (Teclado + Botones en Pantalla) -->
          <div style="display:flex;justify-content:space-between;align-items:center;background:#0b0f18;border:1px solid #1b2334;border-radius:10px;padding:8px 14px;flex-wrap:wrap;gap:8px;">
            <div style="font-size:11.5px;color:#94a3b8;">
              ⌨️ Controles: <b>A / D</b> o <b>◀ / ▶</b> Cambiar carril · <b>W / ▲</b> Acelerar · <b>ESPACIO</b> Activar Turbo Nitro
            </div>
            <div style="display:flex;gap:8px;">
              <button id="racerTouchLeft" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:6px 14px;border-radius:6px;font-weight:900;cursor:pointer;">◀ Izquierda</button>
              <button id="racerTouchNitro" style="background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:900;cursor:pointer;">⚡ NITRO</button>
              <button id="racerTouchRight" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:6px 14px;border-radius:6px;font-weight:900;cursor:pointer;">Derecha ▶</button>
            </div>
          </div>
        </div>
      `;

      const btnExit = this.container.querySelector('#racerBtnExit');
      if (btnExit) btnExit.onclick = () => this.renderLobby();

      const bindHold = (sel, key) => {
        const el = this.container.querySelector(sel);
        if (!el) return;
        el.onmousedown = () => { this.keyState[key] = true; };
        el.onmouseup = () => { this.keyState[key] = false; };
        el.onmouseleave = () => { this.keyState[key] = false; };
      };
      bindHold('#racerTouchLeft', 'arrowleft');
      bindHold('#racerTouchRight', 'arrowright');
      const btnNitro = this.container.querySelector('#racerTouchNitro');
      if (btnNitro) btnNitro.onclick = () => this.activateNitro();

      const canvas = this.container.querySelector('#racerCanvas');
      const ctx = canvas.getContext('2d');

      // Estado físico de la carrera
      const maxSpd = 9.2 + (this.save.engine - 1) * 0.75;
      this.raceState = {
        countdown: 3,
        startedAt: 0,
        finished: false,
        totalDist: track.laps * track.lapLength,
        dist: 0,
        x: 0, // -1 a 1 (ancho de pista)
        vx: 0,
        speed: 0,
        maxSpeed: maxSpd,
        nitro: 100,
        nitroActive: 0,
        shieldCd: 0,
        coinsCollected: 0,
        items: [],
        particles: [],
        rivals: [
          { name: 'Kenshin-X', x: -0.55, dist: 20, speed: track.aiSpeed * 0.94, color: '#ef4444' },
          { name: 'Valkyria-9', x: 0.0, dist: 35, speed: track.aiSpeed * 0.99, color: '#eab308' },
          { name: 'Sensei-GT', x: 0.55, dist: 50, speed: track.aiSpeed * 1.03, color: '#a855f7' }
        ]
      };

      // Generar objetos de la pista (monedas, paneles de turbo y obstáculos)
      for (let d = 220; d < this.raceState.totalDist - 200; d += 140) {
        const lane = [-0.65, -0.22, 0.22, 0.65][Math.floor(Math.random() * 4)];
        const roll = Math.random();
        if (roll < 0.48) {
          this.raceState.items.push({ type: 'coin', dist: d, x: lane, taken: false });
        } else if (roll < 0.68) {
          this.raceState.items.push({ type: 'boost', dist: d, x: lane, taken: false });
        } else {
          this.raceState.items.push({ type: 'hazard', dist: d, x: lane, hit: false });
        }
      }

      // Cuenta regresiva 3..2..1..¡YA!
      const overlay = this.container.querySelector('#racerOverlay');
      const tickCountdown = () => {
        if (!this.inRace) return;
        if (this.raceState.countdown > 0) {
          RacerAudio.beep(false);
          if (overlay) {
            overlay.innerHTML = `<div style="font-size:64px;font-weight:900;color:#fbbf24;text-shadow:0 0 25px rgba(251,191,36,0.8);">${this.raceState.countdown}</div>`;
          }
          this.raceState.countdown--;
          setTimeout(tickCountdown, 750);
        } else {
          RacerAudio.beep(true);
          this.raceState.startedAt = performance.now();
          if (overlay) {
            overlay.innerHTML = `<div style="font-size:54px;font-weight:900;color:#10b981;text-shadow:0 0 25px rgba(16,185,129,0.9);">¡A CORRER!</div>`;
            setTimeout(() => { if (overlay && !this.raceState.finished) overlay.innerHTML = ''; }, 650);
          }
        }
      };
      tickCountdown();

      const loop = () => {
        if (!this.inRace) return;
        this.updateRace(track);
        this.drawRace(ctx, canvas.width, canvas.height, track, ch);
        if (!this.raceState.finished) {
          this.rafId = requestAnimationFrame(loop);
        }
      };
      this.rafId = requestAnimationFrame(loop);
    }

    activateNitro() {
      const st = this.raceState;
      if (!st || st.countdown > 0 || st.finished) return;
      if (st.nitro >= 30 && st.nitroActive <= 0) {
        st.nitro -= 30;
        st.nitroActive = 45 + (this.save.turbo - 1) * 12;
        RacerAudio.boost();
      }
    }

    updateRace(track) {
      const st = this.raceState;
      if (st.countdown > 0 || st.finished) return;

      const left = this.keyState['a'] || this.keyState['arrowleft'];
      const right = this.keyState['d'] || this.keyState['arrowright'];
      const brake = this.keyState['s'] || this.keyState['arrowdown'];

      if (left) st.vx = Math.max(st.vx - 0.0085, -0.032);
      else if (right) st.vx = Math.min(st.vx + 0.0085, 0.032);
      else st.vx *= 0.82;

      st.x = Math.max(-0.82, Math.min(0.82, st.x + st.vx));

      const boostBonus = st.nitroActive > 0 ? (3.2 + (this.save.turbo - 1) * 0.45) : 0;
      if (st.nitroActive > 0) st.nitroActive--;
      else st.nitro = Math.min(100, st.nitro + 0.12 + (this.save.turbo - 1) * 0.03);

      const targetSpd = brake ? st.maxSpeed * 0.55 : (st.maxSpeed + boostBonus);
      st.speed += (targetSpd - st.speed) * 0.08;
      st.dist += st.speed;

      // Rivales IA
      st.rivals.forEach((r, idx) => {
        const wave = Math.sin((st.dist + idx * 180) * 0.015) * 0.006;
        r.x = Math.max(-0.75, Math.min(0.75, r.x + wave));
        const rubberband = (st.dist - r.dist) * 0.0012;
        r.dist += Math.max(5.5, r.speed + rubberband + (Math.random() - 0.48) * 0.35);
      });

      // Colisiones con objetos cercanos
      const magnetRadius = 0.16 + (this.save.shield - 1) * 0.025;
      for (const item of st.items) {
        const dz = item.dist - st.dist;
        if (dz < -30 || dz > 45) continue;
        const dx = Math.abs(item.x - st.x);

        if (item.type === 'coin' && !item.taken && dx < magnetRadius) {
          item.taken = true;
          st.coinsCollected += 5;
          RacerAudio.coin();
        } else if (item.type === 'boost' && !item.taken && dx < 0.18) {
          item.taken = true;
          st.nitro = Math.min(100, st.nitro + 25);
          st.nitroActive = Math.max(st.nitroActive, 32);
          RacerAudio.boost();
        } else if (item.type === 'hazard' && !item.hit && dx < 0.15 && Math.abs(dz) < 22) {
          item.hit = true;
          const dmgReduction = 0.42 + (this.save.shield - 1) * 0.1;
          st.speed *= Math.min(0.88, dmgReduction);
          RacerAudio.crash();
        }
      }

      // Actualizar HUD
      const curLap = Math.min(track.laps, Math.floor(st.dist / track.lapLength) + 1);
      const rank = 1 + st.rivals.filter(r => r.dist > st.dist).length;
      const lapEl = this.container.querySelector('#racerLapTxt');
      const posEl = this.container.querySelector('#racerPosTxt');
      const coinEl = this.container.querySelector('#racerCoinsTxt');
      const nitroEl = this.container.querySelector('#racerNitroBar');
      if (lapEl) lapEl.textContent = `VUELTA ${curLap} / ${track.laps}`;
      if (posEl) {
        posEl.textContent = `POSICIÓN: ${rank}º / 4`;
        posEl.style.color = rank === 1 ? '#10b981' : rank === 2 ? '#38bdf8' : '#fbbf24';
      }
      if (coinEl) coinEl.textContent = `🪙 +${st.coinsCollected} recogidas`;
      if (nitroEl) nitroEl.style.width = `${Math.round(st.nitro)}%`;

      // Verificar meta
      if (st.dist >= st.totalDist) {
        st.finished = true;
        this.finishRace(track, rank);
      }
    }

    drawRace(ctx, W, H, track, ch) {
      const st = this.raceState;
      ctx.fillStyle = track.theme.sky;
      ctx.fillRect(0, 0, W, H);

      const horizon = 115;
      // Cielo Cyber-Grid y montañas pixel-neon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      skyGrad.addColorStop(0, track.theme.sky);
      skyGrad.addColorStop(1, '#131c31');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizon);

      // Sol / Núcleo de fondo
      ctx.save();
      ctx.fillStyle = track.theme.border;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(W / 2, horizon - 10, 58, Math.PI, 0);
      ctx.fill();
      ctx.restore();

      // Carretera con perspectiva trapezoidal
      const roadTopW = 150;
      const roadBotW = 560;
      const cx = W / 2 - st.x * 75;

      ctx.fillStyle = track.theme.road;
      ctx.beginPath();
      ctx.moveTo(cx - roadTopW / 2, horizon);
      ctx.lineTo(cx + roadTopW / 2, horizon);
      ctx.lineTo(W / 2 + roadBotW / 2, H);
      ctx.lineTo(W / 2 - roadBotW / 2, H);
      ctx.closePath();
      ctx.fill();

      // Líneas horizontales de movimiento y bordes neón
      const stripeOffset = Math.floor(st.dist / 35) % 2;
      for (let i = 0; i < 14; i++) {
        const t0 = i / 14;
        const t1 = (i + 0.55) / 14;
        const y0 = horizon + Math.pow(t0, 1.5) * (H - horizon);
        const y1 = horizon + Math.pow(t1, 1.5) * (H - horizon);
        const x0 = cx + (W / 2 - cx) * t0;
        const x1 = cx + (W / 2 - cx) * t1;
        const w0 = roadTopW + (roadBotW - roadTopW) * Math.pow(t0, 1.5);
        const w1 = roadTopW + (roadBotW - roadTopW) * Math.pow(t1, 1.5);

        if ((i + stripeOffset) % 2 === 0) {
          ctx.strokeStyle = track.theme.grid;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x0 - w0 / 2, y0);
          ctx.lineTo(x0 + w0 / 2, y0);
          ctx.stroke();

          // Divisor central de carriles
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(x0 - 3, y0, 6, Math.max(4, y1 - y0));
        }
      }

      // Bordes laterales luminosos
      ctx.strokeStyle = track.theme.border;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - roadTopW / 2, horizon);
      ctx.lineTo(W / 2 - roadBotW / 2, H);
      ctx.moveTo(cx + roadTopW / 2, horizon);
      ctx.lineTo(W / 2 + roadBotW / 2, H);
      ctx.stroke();

      // Dibujar objetos en pista (de lejos a cerca)
      const viewDist = 480;
      const visibleItems = st.items.filter(it => !it.taken && it.dist > st.dist - 20 && it.dist < st.dist + viewDist);
      visibleItems.sort((a, b) => b.dist - a.dist);

      for (const it of visibleItems) {
        const rel = 1 - (it.dist - st.dist) / viewDist;
        const p = Math.max(0, Math.min(1, Math.pow(rel, 1.45)));
        const y = horizon + p * (H - horizon - 55);
        const roadW = roadTopW + (roadBotW - roadTopW) * p;
        const roadCenter = cx + (W / 2 - cx) * p;
        const x = roadCenter + it.x * (roadW * 0.44);
        const sz = 8 + p * 22;

        if (it.type === 'coin') {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(x, y, sz * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (it.type === 'boost') {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x - sz * 0.8, y - sz * 0.3, sz * 1.6, sz * 0.6);
          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - sz * 0.8, y - sz * 0.3, sz * 1.6, sz * 0.6);
        } else if (it.type === 'hazard') {
          ctx.fillStyle = it.hit ? '#475569' : '#ef4444';
          ctx.beginPath();
          ctx.moveTo(x, y - sz * 0.7);
          ctx.lineTo(x + sz * 0.7, y + sz * 0.5);
          ctx.lineTo(x - sz * 0.7, y + sz * 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Dibujar rivales IA visibles
      for (const r of st.rivals) {
        const diff = r.dist - st.dist;
        if (diff < -30 || diff > viewDist) continue;
        const rel = 1 - diff / viewDist;
        const p = Math.max(0.05, Math.min(1, Math.pow(rel, 1.45)));
        const y = horizon + p * (H - horizon - 55);
        const roadW = roadTopW + (roadBotW - roadTopW) * p;
        const roadCenter = cx + (W / 2 - cx) * p;
        const x = roadCenter + r.x * (roadW * 0.44);
        const scale = 0.35 + p * 0.75;
        this.drawKart(ctx, x, y, scale, r.color, '#ffffff', r.name, false);
      }

      // Dibujar el Hover-Kart del Jugador con su Ninja Personalizado
      const px = W / 2 + st.vx * 900;
      const py = H - 52;
      this.drawKart(ctx, px, py, 1.05, ch.primary, ch.glow, this.options.playerName || 'Tú', st.nitroActive > 0);
    }

    drawKart(ctx, x, y, scale, bodyColor, glowColor, label, isBoosting) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Sombra inferior
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(-30, 14, 60, 10);

      // Llamas de Nitro
      if (isBoosting) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-18, 18, 12, 16 + Math.random() * 10);
        ctx.fillRect(6, 18, 12, 16 + Math.random() * 10);
      }

      // Ruedas / Propulsores Pixel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-32, -4, 10, 20);
      ctx.fillRect(22, -4, 10, 20);

      // Chasis principal
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-24, -10, 48, 26);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-24, -10, 48, 26);

      // Alerón trasero
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-28, 8, 56, 6);

      // Cabeza del Piloto Ninja Pixel Art
      ctx.fillStyle = this.pilot.suitColor || '#1e293b';
      ctx.fillRect(-12, -26, 24, 18);
      // Cinta ninja (Mask/Headband)
      ctx.fillStyle = this.pilot.maskColor || '#dc2626';
      ctx.fillRect(-13, -22, 26, 5);
      // Ojos brillantes
      ctx.fillStyle = this.pilot.eyeColor || '#38bdf8';
      ctx.fillRect(-7, -18, 4, 3);
      ctx.fillRect(3, -18, 4, 3);

      // Etiqueta de piloto
      if (label) {
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(label, 0, -32);
      }
      ctx.restore();
    }

    finishRace(track, rank) {
      const st = this.raceState;
      const elapsedMs = Math.max(1000, Math.round(performance.now() - st.startedAt));
      const isWin = rank === 1;
      const isFirstClear = isWin && !this.save.clearedTracks[track.id];

      let baseCoins = 0;
      let keysWon = {};
      let titleText = '';

      if (rank === 1) {
        RacerAudio.win();
        this.save.racesWon = (this.save.racesWon || 0) + 1;
        if (!this.save.bestTimes[track.id] || elapsedMs < this.save.bestTimes[track.id]) {
          this.save.bestTimes[track.id] = elapsedMs;
        }
        if (isFirstClear) {
          baseCoins = track.firstReward.coins;
          keysWon = { ...track.firstReward.keys };
          this.save.clearedTracks[track.id] = true;
          titleText = '🏆 ¡1º LUGAR · PRIMERA CONQUISTA DEL CIRCUITO!';
        } else {
          baseCoins = track.repeatReward.coins;
          if (Math.random() < 0.25) keysWon = { copper: 1 };
          titleText = '🥇 ¡1º LUGAR · VICTORIA EN EL GRAN PREMIO!';
        }
      } else if (rank === 2) {
        RacerAudio.coin();
        baseCoins = Math.round(track.repeatReward.coins * 0.65);
        titleText = '🥈 2º LUGAR · PODIO DE PLATA';
      } else if (rank === 3) {
        baseCoins = Math.round(track.repeatReward.coins * 0.4);
        titleText = '🥉 3º LUGAR · PODIO DE BRONCE';
      } else {
        baseCoins = 15;
        titleText = '🏁 4º LUGAR · CARRERA COMPLETADA';
      }

      saveRacerData(this.save);
      const totalCoins = baseCoins + st.coinsCollected;
      if (typeof this.options.onReward === 'function') {
        this.options.onReward({ coins: totalCoins, keys: keysWon });
      }

      const keyLabels = [];
      if (keysWon.copper) keyLabels.push(`+${keysWon.copper} Llave de Cobre 🟤`);
      if (keysWon.silver) keyLabels.push(`+${keysWon.silver} Llave de Plata ⚪`);
      if (keysWon.gold) keyLabels.push(`+${keysWon.gold} Llave de Oro 🟡`);
      if (keysWon.obsidian) keyLabels.push(`+${keysWon.obsidian} Llave de Obsidiana 🟣`);

      const overlay = this.container.querySelector('#racerOverlay');
      if (overlay) {
        overlay.style.pointerEvents = 'auto';
        overlay.style.background = 'rgba(7, 10, 18, 0.86)';
        overlay.innerHTML = `
          <div style="background:#0f1523;border:2px solid ${rank === 1 ? '#10b981' : '#3b82f6'};border-radius:14px;padding:20px 26px;text-align:center;max-width:430px;box-shadow:0 12px 35px rgba(0,0,0,0.75);">
            <div style="font-size:16px;font-weight:900;color:${rank === 1 ? '#34d399' : '#60a5fa'};margin-bottom:6px;">${titleText}</div>
            <div style="font-size:12px;color:#cbd5e1;margin-bottom:12px;">
              Tiempo oficial: <b>${(elapsedMs / 1000).toFixed(2)}s</b> · Monedas en pista: <b>+${st.coinsCollected} 🪙</b>
            </div>
            <div style="background:#090d16;border:1px solid rgba(251,191,36,0.4);border-radius:9px;padding:10px 14px;margin-bottom:14px;color:#fde047;font-size:12.5px;font-weight:800;">
              🎁 Botín Total: +${totalCoins} 🪙 Monedas ${keyLabels.length ? '· ' + keyLabels.join(' ') : ''}
            </div>
            <div style="display:flex;justify-content:center;gap:10px;">
              <button id="racerBtnAgain" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;padding:8px 16px;border-radius:7px;font-weight:900;font-size:12px;cursor:pointer;">🔄 Correr de Nuevo</button>
              <button id="racerBtnLobby" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;padding:8px 16px;border-radius:7px;font-weight:800;font-size:12px;cursor:pointer;">🔧 Volver al Taller</button>
            </div>
          </div>
        `;
        const bAgain = overlay.querySelector('#racerBtnAgain');
        if (bAgain) bAgain.onclick = () => this.startRace(track);
        const bLobby = overlay.querySelector('#racerBtnLobby');
        if (bLobby) bLobby.onclick = () => this.renderLobby();
      }
    }
  }

  window.CoreRacerGame = CoreRacerGame;
})();
