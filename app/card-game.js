/**
 * EpicKast v1.9.2 — DOJO ELEMENTAL DE CARTAS (Card-Jitsu Tactical Engine) & ESTUDIO "MI NINJA"
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
      this.muted = localStorage.getItem('epickast.dojo.mute') === '1';
      this.masterVol = 0.25;
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('epickast.dojo.mute', this.muted ? '1' : '0');
      return this.muted;
    }

    ensureCtx() {
      if (this.muted || (this.scope && this.scope.isDisposed())) return null;
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

    selectCard() {
      this.tone(880, 0.06, 'square', 0.35);
    }

    clash() {
      this.noise(0.12, 0.45);
      this.tone(180, 0.1, 'sawtooth', 0.3, 75);
    }

    cinematicPower() {
      this.tone(220, 0.25, 'sawtooth', 0.35, 660);
      if (this.scope) {
        this.scope.timeout(() => this.tone(880, 0.22, 'square', 0.35, 1320), 140);
      }
    }

    winRound() {
      this.tone(523.25, 0.09, 'square', 0.3);
      if (this.scope) {
        this.scope.timeout(() => this.tone(659.25, 0.09, 'square', 0.3), 80);
        this.scope.timeout(() => this.tone(783.99, 0.14, 'square', 0.35), 160);
      }
    }

    loseRound() {
      this.tone(330, 0.12, 'sawtooth', 0.28, 220);
      if (this.scope) {
        this.scope.timeout(() => this.tone(220, 0.18, 'sawtooth', 0.28, 140), 110);
      }
    }

    winMatch() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, idx) => {
        if (this.scope) {
          this.scope.timeout(() => this.tone(f, 0.14, 'square', 0.38), idx * 95);
        }
      });
    }

    loseMatch() {
      const notes = [392, 349.23, 311.13, 261.63];
      notes.forEach((f, idx) => {
        if (this.scope) {
          this.scope.timeout(() => this.tone(f, 0.16, 'sawtooth', 0.3), idx * 110);
        }
      });
    }

    destroy() {
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
      aura: 'none'
    };
    try {
      const raw = JSON.parse(localStorage.getItem('epickast.ninja.v1') || '{}');
      return { ...def, ...raw };
    } catch {
      return def;
    }
  }

  function renderPixelNinjaSvg(config = {}, opts = {}) {
    const cfg = { ...getSavedNinjaConfig(), ...config };
    const size = opts.size || 132;
    const flip = !!opts.flip;
    const pose = opts.pose || 'idle'; // 'idle' | 'attack' | 'victory'
    const frame = Number(opts.frame) || 0; // 0, 1, 2
    const belts = CFG().BELTS || [];
    const beltObj = belts.find((b) => b.id === cfg.belt) || belts[0] || { color: '#f8fafc', shadow: '#cbd5e1' };

    const suitBase = cfg.suitColor || '#1e293b';
    const suitLight = shadeHex(suitBase, 34);
    const suitDark = shadeHex(suitBase, -32);
    const maskBase = cfg.maskColor || '#0f172a';
    const maskLight = shadeHex(maskBase, 28);
    const beltColor = beltObj.color || '#f8fafc';
    const beltShadow = beltObj.shadow || shadeHex(beltColor, -35);
    const outline = '#070a12';

    // Respiración de 2 frames (desplaza torso/cabeza 1px en frame par/impar)
    const breathY = pose === 'idle' ? (frame % 2 === 1 ? 1 : 0) : 0;
    // Cinta ondeando en 3 frames
    const scarfWave = frame % 3;

    const rects = [];
    const px = (x, y, w, h, fill) => {
      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`);
    };

    // --- ARMA DETRÁS DEL CUERPO ---
    if (cfg.weapon === 'katana') {
      px(17, 2 + breathY, 2, 14, '#0f172a');
      px(18, 2 + breathY, 1, 12, '#e2e8f0');
      px(16, 4 + breathY, 4, 2, '#fbbf24');
    } else if (cfg.weapon === 'staff') {
      px(19, 2, 3, 26, '#1c1008');
      px(20, 3, 1, 24, '#d97706');
      px(20, 3, 1, 3, '#fef08a');
    } else if (cfg.weapon === 'scroll') {
      px(4, 11 + breathY, 16, 5, '#1c1008');
      px(5, 12 + breathY, 14, 3, '#fde68a');
      px(4, 12 + breathY, 2, 3, '#dc2626');
      px(18, 12 + breathY, 2, 3, '#dc2626');
    }

    // --- CABEZA Y CAPUCHA (con contorno oscuro 1px y 3 tonos) ---
    const hy = 4 + breathY;
    px(7, hy - 1, 10, 1, outline);
    px(6, hy, 12, 9, outline);
    px(7, hy, 10, 2, suitLight);
    px(7, hy + 2, 10, 6, suitBase);
    px(7, hy + 7, 10, 1, suitDark);

    // Cinta / Bandana en la frente + cola de 3 frames
    px(6, hy + 2, 12, 2, beltColor);
    px(6, hy + 3, 12, 1, beltShadow);
    // Cola de la cinta ondeando a la izquierda
    if (scarfWave === 0) {
      px(3, hy + 2, 3, 2, beltColor);
      px(1, hy + 3, 2, 2, beltShadow);
    } else if (scarfWave === 1) {
      px(3, hy + 1, 3, 2, beltColor);
      px(1, hy + 1, 2, 2, beltShadow);
    } else {
      px(3, hy + 3, 3, 2, beltColor);
      px(2, hy + 5, 2, 2, beltShadow);
    }

    // Visor de ojos y máscara
    px(8, hy + 4, 8, 2, '#fde68a');
    px(9, hy + 4, 2, 2, '#090d16');
    px(13, hy + 4, 2, 2, '#090d16');
    px(9, hy + 4, 1, 1, '#ffffff');
    px(13, hy + 4, 1, 1, '#ffffff');
    // Máscara facial 3 tonos
    px(7, hy + 6, 10, 2, maskBase);
    px(8, hy + 6, 8, 1, maskLight);

    // --- TORSO Y BRAZOS SEGÚN POSE ---
    const ty = 13 + breathY;
    px(6, ty, 12, 10, outline);
    px(7, ty, 10, 9, suitBase);
    px(7, ty, 3, 8, suitLight);
    px(14, ty, 3, 8, suitDark);

    // Solapa cruzada del traje ninja
    px(9, ty + 1, 2, 5, suitDark);
    px(11, ty + 3, 2, 4, suitDark);

    // Brazos según pose
    if (pose === 'attack') {
      // Brazo izquierdo extendido al frente en pose de ataque
      px(2, ty + 1, 5, 4, outline);
      px(3, ty + 2, 4, 2, suitLight);
      px(17, ty, 5, 4, outline);
      px(17, ty + 1, 4, 2, suitBase);
    } else if (pose === 'victory') {
      // Ambos brazos levantados en victoria
      px(3, ty - 4, 4, 7, outline);
      px(4, ty - 3, 2, 5, suitLight);
      px(17, ty - 4, 4, 7, outline);
      px(18, ty - 3, 2, 5, suitLight);
    } else {
      // Idle
      px(4, ty + 1, 3, 7, outline);
      px(5, ty + 2, 2, 5, suitLight);
      px(17, ty + 1, 3, 7, outline);
      px(17, ty + 2, 2, 5, suitDark);
    }

    // --- CINTURÓN Y NUDO ---
    px(6, ty + 6, 12, 3, outline);
    px(7, ty + 6, 10, 2, beltColor);
    px(7, ty + 7, 10, 1, beltShadow);
    px(11, ty + 6, 2, 4, beltColor);
    px(10, ty + 8, 1, 3, beltShadow);
    px(13, ty + 8, 1, 3, beltColor);

    // --- ARMA EN MANO ---
    if (cfg.weapon === 'shuriken') {
      const sx = pose === 'attack' ? 1 : 18;
      const sy = pose === 'victory' ? ty - 6 : ty + 4;
      px(sx, sy, 4, 4, '#0f172a');
      px(sx + 1, sy, 2, 4, '#f8fafc');
      px(sx, sy + 1, 4, 2, '#94a3b8');
    } else if (cfg.weapon === 'kunai') {
      const kx = pose === 'attack' ? 0 : 18;
      const ky = pose === 'victory' ? ty - 6 : ty + 3;
      px(kx, ky, 5, 3, '#0f172a');
      px(kx + 1, ky + 1, 3, 1, '#e2e8f0');
      px(kx + 4, ky + 1, 1, 1, '#ef4444');
    }

    // --- PIERNAS Y BOTAS ---
    px(7, 23, 4, 6, outline);
    px(8, 23, 2, 5, suitDark);
    px(13, 23, 4, 6, outline);
    px(14, 23, 2, 5, suitBase);
    // Sombra en el tatami
    px(5, 28, 14, 2, 'rgba(0,0,0,0.45)');

    const flipStyle = flip ? 'transform:scaleX(-1);' : '';
    return `<svg class="ek-ninja-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" width="${size}" height="${Math.round(size * 1.25)}" shape-rendering="crispEdges" style="image-rendering:pixelated;overflow:visible;${flipStyle}">${rects.join('')}</svg>`;
  }

  // --- PARTÍCULAS DE AURA ELEMENTAL (8–12 partículas pixeladas a máx 30 fps registradas en EKLifecycle) ---
  function attachAuraLoop(scope, canvas, auraType) {
    if (!canvas || !scope || !auraType || auraType === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const colors = {
      fire: ['#ef4444', '#f97316', '#fde047'],
      water: ['#2563eb', '#38bdf8', '#93c5fd'],
      snow: ['#7dd3fc', '#e0f2fe', '#ffffff']
    }[auraType] || ['#fbbf24'];

    const count = 10;
    const particles = Array.from({ length: count }, (_, i) => ({
      x: 18 + ((i * 13) % (w - 36)),
      y: 20 + ((i * 19) % (h - 30)),
      vy: auraType === 'snow' ? (0.6 + (i % 3) * 0.3) : -(0.8 + (i % 3) * 0.4),
      vx: ((i % 2 === 0 ? 1 : -1) * 0.35),
      size: (i % 3 === 0) ? 5 : 4,
      color: colors[i % colors.length],
      phase: i * 0.6
    }));

    let lastStep = 0;
    const step = (ts) => {
      if (scope.isDisposed() || !canvas.isConnected) return;
      if (ts - lastStep >= 34) { // ~30 FPS
        lastStep = ts;
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
          p.y += p.vy;
          p.x += Math.sin(ts * 0.004 + p.phase) * 0.5 + p.vx;
          if (auraType === 'snow') {
            if (p.y > h - 10) { p.y = 10; p.x = 18 + Math.random() * (w - 36); }
          } else {
            if (p.y < 10) { p.y = h - 14; p.x = 18 + Math.random() * (w - 36); }
          }
          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
      }
      scope.raf(step);
    };
    scope.raf(step);
  }

  // --- COMPONENTE DE CARTA DEL DOJO (104×148 px, 3 etapas de mascota, bordes por nivel) ---
  function renderCardHtml(card, idx = 0, opts = {}) {
    const elemTokens = CFG().ELEMENT_TOKENS || {};
    const tok = elemTokens[card.element] || { name: 'FUEGO', color: '#ef4444', bg: '#450a0a', light: '#fca5a5' };
    const power = Number(card.power) || 2;
    const tierClass = power >= 10 ? 'cj-tier-epic' : power >= 5 ? 'cj-tier-mid' : 'cj-tier-low';
    const mascotKey = SPR().getCardMascotKey ? SPR().getCardMascotKey(card.element, power) : 'mascot_fire_1';
    const mascotSvg = SPR().renderSpriteHtml ? SPR().renderSpriteHtml(mascotKey, 4) : '';
    const elemIconSvg = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('elem_' + card.element, 1) : '';
    const delayMs = opts.stagger ? idx * 70 : 0;

    return `
      <div class="cj-card-v191 ${tierClass}" data-idx="${idx}" style="--el-color:${tok.color};--el-bg:${tok.bg};--el-light:${tok.light};animation-delay:${delayMs}ms;">
        ${power >= 10 ? `<div class="cj-card-holo"></div><div class="cj-card-star-badge">★ ${power}</div>` : ''}
        ${power >= 5 && power < 10 ? `<div class="cj-card-shine"></div>` : ''}
        <div class="cj-card-top">
          <div class="cj-card-num">${power}</div>
          <div class="cj-card-elem-ico">${elemIconSvg}</div>
        </div>
        <div class="cj-card-art">${mascotSvg}</div>
        <div class="cj-card-bottom">${tok.name}</div>
      </div>
    `;
  }

  // --- CLASE PRINCIPAL: CardJitsuGame ---
  class CardJitsuGame {
    constructor(container, onReward, parentScope) {
      this.container = container;
      this.onReward = onReward;
      this.scope = parentScope || (window.EKLifecycle ? window.EKLifecycle.create('dojo') : null);
      this.sfx = new DojoAudio(this.scope);

      this.destroyed = false;
      this.paused = false;
      this.resumeCountdown = 0;
      this.rewardClaimed = false;

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

      this.bindLifecycleEvents();
      this.start();
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
      this.phase = 'lobby';
      const floors = CFG().DOJO_FLOORS || [];
      const claimed = this.getClaimedFloors();
      const myNinja = getSavedNinjaConfig();
      const belts = CFG().BELTS || [];
      const myBeltObj = belts.find((b) => b.id === myNinja.belt) || belts[0] || { name: 'Cinturón Blanco', color: '#f8fafc' };

      const coinSvg = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('coin', 1) : '';

      this.container.innerHTML = `
        <div style="background:var(--bg-panel,#0f131d);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:18px;color:#e2e8f0;position:relative;">
          <!-- Cabecera del Dojo -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:14px;margin-bottom:14px;flex-wrap:wrap;gap:12px;">
            <div>
              <h3 class="ek-pixel-font" style="margin:0;font-size:15px;color:#f8fafc;display:flex;align-items:center;gap:10px;">
                ${SPR().renderSpriteHtml ? SPR().renderSpriteHtml('tab_dojo', 1.4) : ''}
                <span>DOJO ELEMENTAL DE CARTAS</span>
              </h3>
              <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">
                Triángulo Elemental: <b style="color:#ef4444;">Fuego vence a Nieve</b> · <b style="color:#7dd3fc;">Nieve vence a Agua</b> · <b style="color:#3b82f6;">Agua vence a Fuego</b>
              </p>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button id="cjBtnMuteLobby" style="background:#141926;border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">
                ${this.sfx.muted ? '🔇 Sonido OFF' : '🔊 Sonido ON'}
              </button>
              <div style="background:#141926;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 12px;font-size:11.5px;color:#cbd5e1;">
                🏆 Victoria: <b>3 elementos distintos</b> o <b>3 del mismo elemento</b>
              </div>
            </div>
          </div>

          <!-- Tu Ninja Actual -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 16px;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:56px;height:66px;background:#0b0e14;border:1px solid #334155;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                ${renderPixelNinjaSvg(myNinja, { size: 46, pose: 'idle', frame: 0 })}
              </div>
              <div>
                <div style="font-size:10px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.6px;">Tu Combatiente</div>
                <div style="font-size:14px;font-weight:900;color:#f8fafc;">Ninja del Núcleo · <span style="color:${myBeltObj.color};">${myBeltObj.name}</span></div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Personaliza traje, cinta, arma y aura en la pestaña «Mi Ninja».</div>
              </div>
            </div>
            <div style="font-size:11.5px;color:#94a3b8;">
              Pisos dominados: <b style="color:#22c55e;">${Object.keys(claimed).filter((k) => claimed[k]).length} / ${floors.length}</b>
            </div>
          </div>

          <!-- Selector de los Guardianes del Dojo (Insignias sin solapamiento A3 y Lore sin undefined A2) -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(168px, 1fr));gap:10px;">
            ${floors.map((f) => {
              const isDone = !!claimed[f.level];
              const portraitSvg = SPR().renderSpriteHtml ? SPR().renderSpriteHtml(f.spriteKey, 3) : '';
              const keySprite = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('key_' + f.reward.key, 1) : '';
              const trainCoins = Math.round(f.reward.coins * (CFG().TRAINING_REWARD_RULES?.coinMultiplier || 0.5));
              const descSafe = f.desc ?? '';
              return `
                <div class="cj-floor-card" style="background:#141926;border:1.5px solid ${isDone ? 'rgba(34,197,94,0.45)' : f.color};border-radius:10px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;min-width:0;">
                  <div>
                    <!-- Cabecera flex-wrap sin superposición (Bloque A3) -->
                    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;min-width:0;margin-bottom:8px;">
                      <span style="flex:1 1 auto;min-width:0;font-size:10px;font-weight:900;color:${f.color};text-transform:uppercase;letter-spacing:0.4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        PISO ${f.level} · ${f.belt}
                      </span>
                      <span style="flex:none;position:static;background:${isDone ? 'rgba(34,197,94,0.18)' : 'rgba(251,191,36,0.16)'};border:1px solid ${isDone ? '#22c55e' : '#fbbf24'};color:${isDone ? '#4ade80' : '#fde047'};font-size:9px;font-weight:900;padding:2px 6px;border-radius:4px;">
                        ${isDone ? '✓ DOMINADO' : '1ª RECOMPENSA'}
                      </span>
                    </div>

                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                      <div style="width:52px;height:52px;border-radius:8px;border:2px solid ${f.color};background:#0b0e14;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 10px ${f.color}33;">
                        ${portraitSvg}
                      </div>
                      <div style="min-width:0;">
                        <div style="font-size:13.5px;font-weight:900;color:#f8fafc;line-height:1.2;">${f.name}</div>
                        <div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">IA Táctica: ${Math.round(f.aiSkill * 100)}%</div>
                      </div>
                    </div>

                    <p style="font-size:11px;color:#cbd5e1;margin:0 0 8px;line-height:1.35;">${descSafe}</p>
                  </div>

                  <div>
                    <div style="background:#0b0e14;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:6px 8px;font-size:10.5px;color:#fbbf24;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
                      ${isDone
                        ? `<span>Entrenamiento: +${trainCoins}</span> ${coinSvg} <span>· 25%</span> ${SPR().renderSpriteHtml ? SPR().renderSpriteHtml('key_copper', 0.9) : ''}`
                        : `<span>1ª Conquista: +${f.reward.coins}</span> ${coinSvg} <span>+</span> ${keySprite} <span>${f.reward.keyLabel}</span>`
                      }
                    </div>
                    <button class="cjStartFloorBtn ek-pixel-font" data-level="${f.level}" style="width:100%;background:${f.color};border:none;color:${f.level === 2 || f.level === 5 ? '#090d16' : '#fff'};font-weight:900;font-size:10px;padding:9px 8px;border-radius:6px;cursor:pointer;letter-spacing:0.4px;">
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
          this.startMatch(lvl);
        };
      });

      window.__EK?.assertNoBadText(this.container);
    }

    drawRandomCard() {
      const elems = ['fire', 'water', 'snow'];
      const element = elems[Math.floor(Math.random() * elems.length)];
      const r = Math.random();
      let power;
      if (r < 0.55) power = 2 + Math.floor(Math.random() * 4); // 2..5
      else if (r < 0.85) power = 6 + Math.floor(Math.random() * 4); // 6..9
      else power = 10 + Math.floor(Math.random() * 3); // 10..12
      return {
        id: Math.random().toString(36).slice(2, 9),
        element,
        power
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
      this.playerHand = Array.from({ length: 5 }, () => this.drawRandomCard());
      this.aiHand = Array.from({ length: 5 }, () => this.drawRandomCard());

      this.renderMatchArena({ staggerHand: true });
      this.setSpeech(this.selectedFloor.quotes.start);
      this.startTurnTimer();
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

    formatPointsRow(points) {
      const elems = ['fire', 'water', 'snow'];
      const tokMap = CFG().ELEMENT_TOKENS || {};
      return elems.map((el) => {
        const tok = tokMap[el] || { color: '#ef4444', bg: '#450a0a' };
        const cards = points.filter((p) => p.element === el);
        const ico = SPR().renderSpriteHtml ? SPR().renderSpriteHtml('elem_' + el, 0.9) : '';
        if (!cards.length) {
          return `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(15,23,42,0.7);border:1px dashed rgba(255,255,255,0.15);padding:3px 8px;border-radius:6px;opacity:0.45;font-size:11px;">${ico} -</span>`;
        }
        return `<span style="display:inline-flex;align-items:center;gap:4px;background:${tok.bg};border:1.5px solid ${tok.color};color:#fff;padding:3px 9px;border-radius:6px;font-weight:900;font-size:11px;">${ico} ${cards.map((c) => c.power).join(', ')}</span>`;
      }).join(' ');
    }

    refreshArenaSprites() {
      if (this.destroyed || !this.container) return;
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
      const f = this.selectedFloor;
      const myNinja = getSavedNinjaConfig();
      const belts = CFG().BELTS || [];
      const myBeltObj = belts.find((b) => b.id === myNinja.belt) || belts[0] || { name: 'Cinturón Blanco', color: '#f8fafc' };

      this.container.innerHTML = `
        <div id="cjMatchRoot" style="background:var(--bg-panel,#0f131d);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:14px;color:#e2e8f0;display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden;">
          <!-- Marcador Superior -->
          <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="ek-pixel-font" style="font-size:10px;color:#38bdf8;">TÚ (${this.playerPoints.length}):</span>
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

            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="ek-pixel-font" style="font-size:10px;color:${f.color};">RIVAL (${this.aiPoints.length}):</span>
              <div id="cjAiScoreRow" style="display:flex;gap:5px;flex-wrap:wrap;">${this.formatPointsRow(this.aiPoints)}</div>
            </div>
          </div>

          <!-- Tatami Pixel Art -->
          <div id="cjBattleStage" style="position:relative;min-height:256px;border-radius:10px;border:2px solid #263147;background:linear-gradient(180deg, #0b0e14 0%, #141926 68%, #271a14 68%, #18100c 100%);display:grid;grid-template-columns:165px 1fr 165px;align-items:center;padding:12px 16px;overflow:hidden;">
            <!-- Decoración Tatami -->
            <div style="position:absolute;left:0;right:0;top:68%;height:3px;background:#b45309;opacity:0.7;pointer-events:none;"></div>

            <!-- Combatiente Jugador -->
            <div id="cjPlayerCharBox" style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;transition:transform 0.18s ease;">
              <div style="position:relative;width:136px;height:156px;display:flex;align-items:center;justify-content:center;">
                <canvas id="cjPlayerAuraCanvas" width="136" height="156" style="position:absolute;inset:0;pointer-events:none;"></canvas>
                <div id="cjPlayerSpriteWrap">${renderPixelNinjaSvg(myNinja, { size: 120, pose: this.playerPose, frame: this.idleFrame })}</div>
              </div>
              <div style="background:rgba(11,14,20,0.9);border:1.5px solid #38bdf8;border-radius:6px;padding:3px 10px;text-align:center;">
                <div style="font-size:11.5px;font-weight:900;color:#fff;">Tú</div>
                <div style="font-size:9.5px;color:${myBeltObj.color};font-weight:700;">${myBeltObj.name}</div>
              </div>
            </div>

            <!-- Zona Central de Choque -->
            <div id="cjCenterClashZone" style="position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:210px;">
              <div id="cjSenseiSpeech" style="background:rgba(11,14,20,0.92);border:1px solid ${f.color};color:#f8fafc;padding:5px 12px;border-radius:16px;font-size:11.5px;font-style:italic;margin-bottom:10px;text-align:center;max-width:360px;"></div>
              <div id="cjArenaTable" style="display:flex;align-items:center;justify-content:center;gap:22px;min-height:154px;">
                <div style="text-align:center;color:#94a3b8;font-size:12px;">
                  <div class="ek-pixel-font" style="font-size:11px;color:#f8fafc;margin-bottom:6px;">ELIGE UNA CARTA DE TU MANO</div>
                  <div style="font-size:11px;">🔥 Fuego &gt; ❄️ Nieve &gt; 💧 Agua &gt; 🔥 Fuego</div>
                </div>
              </div>
            </div>

            <!-- Combatiente Guardián -->
            <div id="cjAiCharBox" style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;transition:transform 0.18s ease;">
              <div style="position:relative;width:136px;height:156px;display:flex;align-items:center;justify-content:center;">
                <canvas id="cjAiAuraCanvas" width="136" height="156" style="position:absolute;inset:0;pointer-events:none;"></canvas>
                <div id="cjAiSpriteWrap">${renderPixelNinjaSvg(f.ninjaConfig, { size: 120, flip: true, pose: this.aiPose, frame: this.idleFrame })}</div>
              </div>
              <div style="background:rgba(11,14,20,0.9);border:1.5px solid ${f.color};border-radius:6px;padding:3px 10px;text-align:center;">
                <div style="font-size:11.5px;font-weight:900;color:${f.color};">${f.name}</div>
                <div style="font-size:9.5px;color:#cbd5e1;font-weight:700;">${f.belt} · Piso ${f.level}</div>
              </div>
            </div>
          </div>

          <!-- Mano de 5 Cartas (104×148 px) -->
          <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span class="ek-pixel-font" style="font-size:10px;color:#94a3b8;">TU MANO (HAZ CLIC PARA LANZAR)</span>
              <span style="font-size:10.5px;color:#fbbf24;font-weight:700;">★ Cartas 10–12 activan cinemática elemental</span>
            </div>
            <div id="cjHandRow" style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;min-height:154px;align-items:center;">
              ${this.playerHand.map((c, i) => renderCardHtml(c, i, { stagger: !!opts.staggerHand })).join('')}
            </div>
          </div>
        </div>
      `;

      // Iniciar partículas de aura elemental
      attachAuraLoop(this.scope, this.container.querySelector('#cjPlayerAuraCanvas'), myNinja.aura);
      attachAuraLoop(this.scope, this.container.querySelector('#cjAiAuraCanvas'), f.ninjaConfig?.aura);

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

    // --- CINEMÁTICA DE CARTAS 10+ (Máx 2.2s, <canvas> animado, saltable tras 600ms, respeta prefers-reduced-motion) ---
    triggerCinematic(card, isPlayer, onDone) {
      if (this.destroyed) return;
      const stage = this.container?.querySelector('#cjBattleStage');
      if (!stage) { onDone(); return; }

      const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const tok = (CFG().ELEMENT_TOKENS || {})[card.element] || { color: '#ef4444', name: 'FUEGO' };

      if (reducedMotion) {
        const flash = document.createElement('div');
        flash.style.cssText = `position:absolute;inset:0;background:${tok.color};opacity:0.45;z-index:60;pointer-events:none;transition:opacity 0.6s;`;
        stage.appendChild(flash);
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
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(5,7,12,0.75);z-index:65;display:flex;flex-direction:column;justify-content:space-between;align-items:center;overflow:hidden;cursor:pointer;';

      const titleMap = {
        fire: '¡DRAGÓN DE MAGMA SUPREMO!',
        water: '¡LEVIATÁN ABISAL DESATADO!',
        snow: '¡VENTISCA CERO ABSOLUTA!'
      };

      overlay.innerHTML = `
        <div class="cj-cine-bar" style="width:100%;height:12%;background:#000;border-bottom:2px solid ${tok.color};display:flex;align-items:center;justify-content:center;">
          <span class="ek-pixel-font" style="font-size:10px;color:${tok.color};letter-spacing:1px;">★ PODER ELEMENTAL NIVEL ${card.power} ★</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <canvas id="cjCineCanvas" width="220" height="130" style="image-rendering:pixelated;"></canvas>
          <div class="ek-pixel-font" style="font-size:13px;color:#fff;text-shadow:0 0 12px ${tok.color};">${titleMap[card.element] || '¡ATAQUE SUPREMO!'}</div>
          <div id="cjCineSkipHint" style="font-size:10px;color:#94a3b8;opacity:0;">Clic / Espacio / ESC para saltar</div>
        </div>
        <div class="cj-cine-bar" style="width:100%;height:12%;background:#000;border-top:2px solid ${tok.color};display:flex;align-items:center;justify-content:center;">
          <span style="font-size:11px;color:#cbd5e1;font-weight:800;">${isPlayer ? 'Tu técnica sacude el tatami' : `${this.selectedFloor.name} invoca su técnica maestra`}</span>
        </div>
      `;
      stage.appendChild(overlay);
      stage.classList.add('cj-stage-shake');

      const cvs = overlay.querySelector('#cjCineCanvas');
      const ctx = cvs?.getContext('2d');
      let cineFinished = false;
      let canSkip = false;
      let frameIdx = 0;

      const finishCinematic = () => {
        if (cineFinished || this.destroyed) return;
        cineFinished = true;
        stage.classList.remove('cj-stage-shake');
        overlay.remove();
        this.phase = 'clash';
        onDone();
      };

      this.scope.timeout(() => {
        canSkip = true;
        const hint = overlay.querySelector('#cjCineSkipHint');
        if (hint) hint.style.opacity = '1';
      }, 600);

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

      // Animación de 4 frames en el canvas de la cinemática
      const mascotKey = `mascot_${card.element}_3`;
      const spec = SPR().SPRITES?.[mascotKey];
      const drawCineFrame = () => {
        if (cineFinished || this.destroyed || !ctx || !spec) return;
        frameIdx++;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        // Rayos de fondo
        ctx.fillStyle = tok.color + '33';
        for (let i = 0; i < 6; i++) {
          const rx = ((i * 42 + frameIdx * 8) % cvs.width);
          ctx.fillRect(rx, 0, 10, cvs.height);
        }
        // Dibujar el sprite 16×16 escalado a ×6 en el centro con pulso
        const scale = (frameIdx % 2 === 0) ? 6 : 7;
        const ox = Math.floor((cvs.width - 16 * scale) / 2);
        const oy = Math.floor((cvs.height - 16 * scale) / 2);
        for (let y = 0; y < 16; y++) {
          const row = spec.map[y] || '';
          for (let x = 0; x < 16; x++) {
            const ch = row[x];
            if (ch && ch !== '.' && spec.palette[ch]) {
              ctx.fillStyle = spec.palette[ch];
              ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
            }
          }
        }
      };
      drawCineFrame();
      const cineInt = this.scope.interval(drawCineFrame, 160);

      // Duración máxima estricta: 2.0s (≤ 2.2s)
      this.scope.timeout(() => {
        this.scope.clearInterval(cineInt);
        unlistenKey();
        finishCinematic();
      }, 2000);
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
      const aiIdx = this.chooseAiCardIndex(pCard);
      const aCard = this.aiHand[aiIdx];
      const outcome = this.resolveOutcome(pCard, aCard);

      const table = this.container?.querySelector('#cjArenaTable');
      const stage = this.container?.querySelector('#cjBattleStage');
      if (!table || !stage) return;

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
          // 2) Hit-stop de 80ms + flash blanco de 60ms
          this.sfx.clash();
          const flash = document.createElement('div');
          flash.style.cssText = 'position:absolute;inset:0;background:#ffffff;opacity:0.75;z-index:55;pointer-events:none;';
          stage.appendChild(flash);
          this.scope.timeout(() => flash.remove(), 60);

          this.scope.timeout(() => {
            if (this.destroyed) return;
            const pSlot = this.container?.querySelector('#cjDuelPlayerSlot');
            const aSlot = this.container?.querySelector('#cjDuelAiSlot');
            const pCharBox = this.container?.querySelector('#cjPlayerCharBox');
            const aCharBox = this.container?.querySelector('#cjAiCharBox');

            // 3) Ganadora escala ×1.15 con halo; perdedora se rompe en 24 partículas pixel (600ms)
            // 4) Ninja ganador embiste 28px en 180ms; perdedor tiembla ±4px en 6 cuadros
            if (outcome === 'player') {
              this.sfx.winRound();
              this.playerPoints.push(pCard);
              this.playerPose = 'attack';
              this.aiPose = 'idle';
              this.refreshArenaSprites();

              if (pSlot) pSlot.classList.add('cj-card-winner-scale');
              if (aSlot) {
                const cardNode = aSlot.querySelector('.cj-card-v191');
                if (cardNode) cardNode.style.opacity = '0';
                this.shatterLoserCard(aSlot, aCard.element);
              }
              if (pCharBox) pCharBox.style.transform = 'translateX(28px)';
              if (aCharBox) aCharBox.classList.add('cj-ninja-hit-shake');

              this.flyPointToken(pSlot, this.container?.querySelector('#cjPlayerScoreRow'), pCard.element);
              this.setSpeech(this.selectedFloor.quotes.loseRound);
            } else if (outcome === 'ai') {
              this.sfx.loseRound();
              this.aiPoints.push(aCard);
              this.playerPose = 'idle';
              this.aiPose = 'attack';
              this.refreshArenaSprites();

              if (aSlot) aSlot.classList.add('cj-card-winner-scale');
              if (pSlot) {
                const cardNode = pSlot.querySelector('.cj-card-v191');
                if (cardNode) cardNode.style.opacity = '0';
                this.shatterLoserCard(pSlot, pCard.element);
              }
              if (aCharBox) aCharBox.style.transform = 'translateX(-28px)';
              if (pCharBox) pCharBox.classList.add('cj-ninja-hit-shake');

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
            }, 380);

            // Reemplazar cartas jugadas y evaluar condición de victoria tras los 600ms de partículas
            this.scope.timeout(() => {
              if (this.destroyed) return;
              this.playerPose = 'idle';
              this.aiPose = 'idle';
              this.playerHand[playerCardIdx] = this.drawRandomCard();
              this.aiHand[aiIdx] = this.drawRandomCard();

              const pWin = this.checkWinCondition(this.playerPoints);
              const aWin = this.checkWinCondition(this.aiPoints);
              if (pWin || aWin) {
                this.finishMatch(!!pWin, pWin || aWin);
              } else {
                this.roundLocked = false;
                this.phase = 'playing';
                this.renderMatchArena({ staggerHand: false });
                this.setSpeech('Elige tu siguiente carta elemental…');
                this.startTurnTimer();
              }
            }, 720);
          }, 80); // fin hit-stop 80ms
        };

        // Si alguna carta es 10+, disparar cinemática antes del impacto
        if (pCard.power >= 10 || aCard.power >= 10) {
          const cineCard = pCard.power >= aCard.power ? pCard : aCard;
          const cineIsPlayer = pCard.power >= aCard.power;
          this.triggerCinematic(cineCard, cineIsPlayer, executeImpact);
        } else {
          executeImpact();
        }
      };

      this.scope.timeout(runResolutionAfterRise, 250);
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

      const f = this.selectedFloor;
      let coinsAwarded = 0;
      let keyAwarded = null;
      let keyLabel = null;
      let isFirstClear = false;

      if (playerWon && !this.rewardClaimed) {
        this.rewardClaimed = true;
        this.sfx.winMatch();
        const claimed = this.getClaimedFloors();
        isFirstClear = !claimed[f.level];

        if (isFirstClear) {
          coinsAwarded = f.reward.coins;
          keyAwarded = f.reward.key;
          keyLabel = f.reward.keyLabel;
          this.markFloorClaimed(f.level);
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
      const beltObj = belts.find((b) => b.id === draft.belt) || belts[0];
      const weaponObj = weapons.find((w) => w.id === draft.weapon) || weapons[0];
      const auraObj = auras.find((a) => a.id === draft.aura) || auras[0];

      container.innerHTML = `
        <div style="background:var(--bg-panel,#0f131d);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:18px;color:#e2e8f0;display:grid;grid-template-columns:280px 1fr;gap:18px;align-items:start;">
          <!-- Columna Izquierda: Vista Previa Animada + Poses -->
          <div style="background:#141926;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
              <span class="ek-pixel-font" style="font-size:10px;color:#38bdf8;">VISTA PREVIA 24×30</span>
              <span id="njDirtyBadge" style="display:${isDirty ? 'inline-flex' : 'none'};align-items:center;gap:4px;font-size:10px;font-weight:800;color:#fbbf24;background:rgba(251,191,36,0.14);border:1px solid rgba(251,191,36,0.4);padding:2px 7px;border-radius:999px;">
                ● Cambios sin guardar
              </span>
            </div>

            <div style="position:relative;width:180px;height:200px;background:radial-gradient(circle at 50% 60%, #1e293b 0%, #0b0e14 80%);border:2px solid #334155;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              <canvas id="njPreviewAuraCanvas" width="180" height="200" style="position:absolute;inset:0;pointer-events:none;"></canvas>
              <div id="njPreviewSpriteHolder">
                ${renderPixelNinjaSvg(draft, { size: 136, pose: currentPose, frame: animFrame })}
              </div>
            </div>

            <!-- Botones de Pose: Idle / Ataque / Victoria -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;">
              ${[
                { id: 'idle', label: 'Idle' },
                { id: 'attack', label: 'Ataque' },
                { id: 'victory', label: 'Victoria' }
              ].map((p) => `
                <button class="njPoseBtn" data-pose="${p.id}" style="background:${currentPose === p.id ? '#2563eb' : '#0b0e14'};border:1px solid ${currentPose === p.id ? '#60a5fa' : '#334155'};color:#fff;font-size:11px;font-weight:800;padding:6px 4px;border-radius:6px;cursor:pointer;">
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

      const rndBtn = container.querySelector('#njBtnRandom');
      if (rndBtn) {
        rndBtn.onclick = () => {
          const unlockedBelts = belts.filter((b) => isFloorCleared(b.reqFloor));
          draft.suitColor = suits[Math.floor(Math.random() * suits.length)].id;
          draft.maskColor = masks[Math.floor(Math.random() * masks.length)].id;
          draft.belt = unlockedBelts[Math.floor(Math.random() * unlockedBelts.length)].id;
          draft.weapon = weapons[Math.floor(Math.random() * weapons.length)].id;
          draft.aura = auras[Math.floor(Math.random() * auras.length)].id;
          checkDirty();
          draw();
        };
      }

      const resetBtn = container.querySelector('#njBtnReset');
      if (resetBtn) {
        resetBtn.onclick = () => {
          draft = { suitColor: '#1e293b', belt: 'white', maskColor: '#0f172a', weapon: 'katana', aura: 'none' };
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

  window.CardJitsuGame = CardJitsuGame;
  window.renderNinjaCustomizer = renderNinjaCustomizer;
  window.renderPixelNinjaSvg = renderPixelNinjaSvg;
})();
