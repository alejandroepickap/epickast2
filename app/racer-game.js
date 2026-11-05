// ============================================================================
// EPICKAST: TURBO CORE — CARRERAS PIXEL-NEON DEL NÚCLEO (v1.9.2)
// Bloques A1, A3, C, D, G: Lifecycle, Separación de Karts, Synthwave Parallax,
// Postes Laterales, Líneas de Velocidad, Cámara Shake, Podio 1º-4º y Taller.
// ============================================================================

(function () {
  'use strict';

  const CFG = () => window.EKGameConfig || {};
  const SPR = () => window.EKSprites || null;

  function renderSpr(key, scale = 1) {
    const s = SPR();
    return s ? s.renderSpriteHtml(key, scale) : '';
  }

  function getTracks() {
    return CFG().RACER_TRACKS || [];
  }

  function getChassisColors() {
    return CFG().CHASSIS_COLORS || [
      { id: 'cyan', name: 'Cian Hiperión', primary: '#06b6d4', glow: '#22d3ee', cost: 0 },
      { id: 'crimson', name: 'Carmesí Ignis', primary: '#dc2626', glow: '#f87171', cost: 150 },
      { id: 'emerald', name: 'Esmeralda Nexo', primary: '#059669', glow: '#34d399', cost: 150 },
      { id: 'gold', name: 'Oro Soberano', primary: '#d97706', glow: '#fbbf24', cost: 300 },
      { id: 'amethyst', name: 'Amatista Vacío', primary: '#7c3aed', glow: '#c084fc', cost: 300 }
    ];
  }

  function getUpgradesMeta() {
    return CFG().WORKSHOP_UPGRADES || {
      engine: { id: 'engine', name: 'Motor Iónico', sprite: 'workshop_engine', maxLevel: 5, costs: [0, 120, 280, 550, 1000], desc: 'Aumenta la velocidad punta y aceleración en todos los circuitos.' },
      turbo: { id: 'turbo', name: 'Inyector Nitro', sprite: 'workshop_turbo', maxLevel: 5, costs: [0, 120, 280, 550, 1000], desc: 'Incrementa la potencia del propulsor (Espacio) y su recarga.' },
      shield: { id: 'shield', name: 'Escudo Magnético', sprite: 'workshop_shield', maxLevel: 5, costs: [0, 120, 280, 550, 1000], desc: 'Reduce la pérdida de velocidad al chocar y atrae monedas cercanas.' }
    };
  }

  // Audio sintetizado gestionado por EKLifecycle
  const RacerAudio = {
    ctx: null,
    init(scope) {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          this.ctx = new AC();
          if (scope && typeof scope.audio === 'function') scope.audio(this.ctx);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },
    close() {
      if (this.ctx && this.ctx.state !== 'closed') {
        try { this.ctx.close().catch(() => {}); } catch {}
      }
      this.ctx = null;
    },
    tone(scope, freq, type, dur, vol = 0.08, endFreq = null) {
      try {
        this.init(scope);
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
    beep(scope, high = false) { this.tone(scope, high ? 880 : 440, 'square', high ? 0.25 : 0.14, 0.08); },
    coin(scope) { this.tone(scope, 987, 'sine', 0.09, 0.08, 1318); },
    boost(scope) { this.tone(scope, 210, 'sawtooth', 0.38, 0.09, 860); },
    crash(scope) { this.tone(scope, 140, 'sawtooth', 0.30, 0.12, 42); },
    win(scope) {
      [523, 659, 784, 1046].forEach((f, i) => {
        const fn = () => this.tone(scope, f, 'triangle', 0.22, 0.1);
        if (scope) scope.timeout(fn, i * 110);
        else setTimeout(fn, i * 110);
      });
    }
  };

  function loadRacerSave() {
    try {
      const raw = JSON.parse(localStorage.getItem('epickast.racer.v1') || '{}');
      const unlockedChassis = Array.isArray(raw.unlockedChassis) && raw.unlockedChassis.length
        ? raw.unlockedChassis
        : ['cyan'];
      if (!unlockedChassis.includes('cyan')) unlockedChassis.unshift('cyan');
      if (raw.chassis && !unlockedChassis.includes(raw.chassis)) unlockedChassis.push(raw.chassis);
      return {
        engine: Math.max(1, Math.min(5, Number(raw.engine) || 1)),
        turbo: Math.max(1, Math.min(5, Number(raw.turbo) || 1)),
        shield: Math.max(1, Math.min(5, Number(raw.shield) || 1)),
        chassis: raw.chassis || 'cyan',
        unlockedChassis,
        clearedTracks: raw.clearedTracks || {},
        bestTimes: raw.bestTimes || {},
        racesWon: Number(raw.racesWon) || 0
      };
    } catch {
      return {
        engine: 1,
        turbo: 1,
        shield: 1,
        chassis: 'cyan',
        unlockedChassis: ['cyan'],
        clearedTracks: {},
        bestTimes: {},
        racesWon: 0
      };
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
      this.scope = window.EKLifecycle ? window.EKLifecycle.create('racer') : null;
      this.save = loadRacerSave();
      this.pilot = getNinjaPilot();
      this.inRace = false;
      this.paused = false;
      this.destroyed = false;
      this.rafId = null;
      this.keyState = {};
      const tracks = getTracks();
      this.selectedTrack = tracks[0];

      this._bindGlobalEvents();
      this.start();
    }

    _bindGlobalEvents() {
      const onKeyDown = (e) => {
        if (!this.inRace || this.paused || this.destroyed) return;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
          e.preventDefault();
        }
        this.keyState[e.key.toLowerCase()] = true;
        if (e.key === ' ') this.activateNitro();
      };
      const onKeyUp = (e) => {
        this.keyState[e.key.toLowerCase()] = false;
      };
      const onVis = () => {
        if (document.hidden && this.inRace && !this.paused && this.raceState && !this.raceState.finished) {
          this.pause();
        }
      };

      if (this.scope) {
        this.scope.listen(window, 'keydown', onKeyDown);
        this.scope.listen(window, 'keyup', onKeyUp);
        this.scope.listen(document, 'visibilitychange', onVis);
      } else {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        document.addEventListener('visibilitychange', onVis);
      }
    }

    // Lifecycle API (Bloque A1)
    start() {
      if (this.destroyed) return;
      this.renderLobby();
    }

    pause() {
      if (this.destroyed || !this.inRace || this.paused) return;
      if (this.raceState && this.raceState.finished) return;
      this.paused = true;
      this.keyState = {};
      this. pausedAt = performance.now();
      this._showPauseOverlay();
    }

    resume() {
      if (this.destroyed || !this.inRace || !this.paused) return;
      const overlay = this.container.querySelector('#racerPauseOverlay');
      if (!overlay) {
        this.paused = false;
        return;
      }
      let count = 3;
      const tick = () => {
        if (this.destroyed || !this.inRace) return;
        if (count > 0) {
          RacerAudio.beep(this.scope, false);
          overlay.innerHTML = `
            <div style="text-align:center;">
              <div style="font-size:12px;color:#94a3b8;font-weight:800;margin-bottom:6px;">REANUDANDO EN</div>
              <div class="ek-pixel-font" style="font-size:42px;font-weight:900;color:#fbbf24;text-shadow:0 0 20px rgba(251,191,36,0.8);">${count}</div>
            </div>
          `;
          count--;
          this._schedule(tick, 750);
        } else {
          RacerAudio.beep(this.scope, true);
          if (this.pausedAt && this.raceState && this.raceState.startedAt) {
            this.raceState.startedAt += (performance.now() - this.pausedAt);
          }
          this.paused = false;
          overlay.remove();
        }
      };
      tick();
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.inRace = false;
      this.paused = false;
      if (this.scope) {
        this.scope.dispose();
      } else if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
      RacerAudio.close();
    }

    _schedule(fn, ms) {
      if (this.destroyed) return null;
      if (this.scope) return this.scope.timeout(fn, ms);
      return setTimeout(fn, ms);
    }

    _showPauseOverlay() {
      const wrap = this.container.querySelector('#racerStageWrap');
      if (!wrap || wrap.querySelector('#racerPauseOverlay')) return;
      const div = document.createElement('div');
      div.id = 'racerPauseOverlay';
      div.style.cssText = 'position:absolute;inset:0;background:rgba(8,11,18,0.88);backdrop-filter:blur(4px);z-index:45;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
      div.innerHTML = `
        <div class="ek-pixel-font" style="font-size:24px;color:#fbbf24;letter-spacing:2px;">⏸ PAUSA</div>
        <div style="font-size:12px;color:#94a3b8;">Carrera en espera. El cronómetro está detenido.</div>
        <div style="display:flex;gap:10px;">
          <button id="racerResumeBtn" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;padding:9px 18px;border-radius:8px;font-weight:900;font-size:12px;cursor:pointer;">▶ Reanudar (3s)</button>
          <button id="racerPauseExitBtn" style="background:#1e293b;color:#fca5a5;border:1px solid rgba(239,68,68,0.4);padding:9px 16px;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;">✕ Abandonar</button>
        </div>
      `;
      wrap.appendChild(div);
      const rBtn = div.querySelector('#racerResumeBtn');
      if (rBtn) rBtn.onclick = () => this.resume();
      const eBtn = div.querySelector('#racerPauseExitBtn');
      if (eBtn) eBtn.onclick = () => this.confirmExitRace();
    }

    confirmExitRace(onConfirm) {
      const cb = onConfirm || (() => this.renderLobby());
      if (!this.inRace || !this.raceState || this.raceState.finished) {
        cb();
        return;
      }
      const wrap = this.container.querySelector('#racerStageWrap');
      if (!wrap) {
        cb();
        return;
      }
      const wasPaused = this.paused;
      this.paused = true;
      const existing = wrap.querySelector('#racerExitConfirm');
      if (existing) existing.remove();
      const modal = document.createElement('div');
      modal.id = 'racerExitConfirm';
      modal.style.cssText = 'position:absolute;inset:0;background:rgba(7,10,18,0.92);z-index:55;display:flex;align-items:center;justify-content:center;padding:16px;';
      modal.innerHTML = `
        <div style="background:#0f1422;border:1.5px solid #ef4444;border-radius:12px;padding:18px 22px;max-width:360px;text-align:center;box-shadow:0 12px 32px rgba(0,0,0,0.75);">
          <div style="font-size:15px;font-weight:900;color:#f8fafc;margin-bottom:6px;">¿Salir? Perderás esta partida (sin recompensas)</div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:14px;">El progreso de las vueltas actuales no se guardará.</div>
          <div style="display:flex;justify-content:center;gap:10px;">
            <button id="racerExitCancel" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;padding:7px 14px;border-radius:7px;font-weight:800;font-size:12px;cursor:pointer;">Continuar Carrera</button>
            <button id="racerExitOk" style="background:#dc2626;color:#fff;border:none;padding:7px 14px;border-radius:7px;font-weight:900;font-size:12px;cursor:pointer;">Sí, Salir</button>
          </div>
        </div>
      `;
      wrap.appendChild(modal);
      modal.querySelector('#racerExitCancel').onclick = () => {
        modal.remove();
        if (!wasPaused) this.paused = false;
      };
      modal.querySelector('#racerExitOk').onclick = () => {
        modal.remove();
        this.inRace = false;
        this.paused = false;
        cb();
      };
    }

    hasActiveMatch() {
      return !!(this.inRace && this.raceState && !this.raceState.finished);
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
      if (this.destroyed) return;
      this.inRace = false;
      this.paused = false;
      this.pilot = getNinjaPilot();
      const coins = this.getCoins();
      const tracks = getTracks();
      const chassisList = getChassisColors();
      const upgradesMeta = getUpgradesMeta();
      const ch = chassisList.find(c => c.id === this.save.chassis) || chassisList[0];
      const clearedCount = tracks.filter(t => !!this.save.clearedTracks[t.id]).length;
      const appVer = CFG().APP_VERSION || '1.9.2';

      const renderUpgradeCard = (key) => {
        const meta = upgradesMeta[key] || {};
        const lvl = this.save[key] || 1;
        const isMax = lvl >= (meta.maxLevel || 5);
        const costs = Array.isArray(meta.costs) ? meta.costs : [0, meta.baseCost || 120, (meta.baseCost || 120) * 2, (meta.baseCost || 120) * 4, (meta.baseCost || 120) * 8];
        const cost = isMax ? 0 : (costs[lvl] || 200);
        const canAfford = coins >= cost;
        const spr = meta.sprite || meta.spriteKey || 'workshop_engine';
        return `
          <div style="background:#0c101b;border:1px solid #1f293d;border-radius:10px;padding:11px 13px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <span style="font-size:12.5px;font-weight:900;color:#f8fafc;display:inline-flex;align-items:center;gap:6px;">
                ${renderSpr(spr, 1.1)} ${meta.name || key}
              </span>
              <span class="ek-pixel-font" style="font-size:9px;font-weight:800;color:${isMax ? '#34d399' : '#38bdf8'};background:rgba(56,189,248,0.12);padding:3px 7px;border-radius:6px;">
                ${isMax ? 'MAX' : `Nv.${lvl}/5`}
              </span>
            </div>
            <div style="font-size:11px;color:#94a3b8;line-height:1.35;">${meta.desc || ''}</div>
            <div style="display:flex;gap:4px;margin:2px 0;">
              ${[1, 2, 3, 4, 5].map(i => `<div style="flex:1;height:5px;border-radius:3px;background:${i <= lvl ? ch.glow : '#1e293b'};"></div>`).join('')}
            </div>
            ${isMax
              ? `<button disabled class="ek-pixel-font" style="background:#065f46;color:#6ee7b7;border:1px solid #10b981;padding:7px;border-radius:6px;font-size:10px;font-weight:800;letter-spacing:0.5px;">✓ MAX</button>`
              : `<button class="racer-upg-btn" data-upg="${key}" ${canAfford ? '' : 'disabled'} style="background:${canAfford ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#171c28'};color:${canAfford ? '#fff' : '#64748b'};border:1px solid ${canAfford ? '#3b82f6' : '#262f42'};padding:6px;border-radius:6px;font-size:11px;font-weight:800;cursor:${canAfford ? 'pointer' : 'not-allowed'};display:inline-flex;align-items:center;justify-content:center;gap:5px;">
                  Mejorar (${cost} ${renderSpr('coin', 0.85)})
                </button>`
            }
          </div>
        `;
      };

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <!-- Cabecera Turbo Core -->
          <div style="background:linear-gradient(135deg, #0b101d 0%, #17132b 100%);border:1px solid #28324e;border-radius:12px;padding:13px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 6px 20px rgba(0,0,0,0.4);">
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:54px;height:54px;border-radius:12px;background:radial-gradient(circle,#1e293b,#090d16);border:2px solid ${ch.glow};display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px ${ch.glow}44;">
                ${renderSpr('tab_racer', 2.2)}
              </div>
              <div>
                <div style="font-size:14px;font-weight:900;color:#f8fafc;display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
                  <span class="ek-pixel-font" style="font-size:12px;color:#38bdf8;">TURBO CORE · v${appVer}</span>
                  <span style="font-size:10px;background:rgba(168,85,247,0.16);border:1px solid rgba(168,85,247,0.45);color:#e879f9;padding:2px 8px;border-radius:10px;font-weight:800;">
                    ${clearedCount}/${tracks.length} Circuitos
                  </span>
                </div>
                <div style="font-size:11.5px;color:#94a3b8;margin-top:3px;">
                  Compite con tu Ninja personalizado, recoge Monedas del Núcleo en pista y gana Llaves de Reliquia para la Bóveda.
                </div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="background:#090d14;border:1px solid #222c40;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:900;color:#fbbf24;display:inline-flex;align-items:center;gap:6px;">
                ${renderSpr('coin', 1)} ${coins.toLocaleString()} Monedas
              </div>
            </div>
          </div>

          <!-- Taller del Núcleo (Economía Compartida) -->
          <div style="background:#090d15;border:1px solid #1b2436;border-radius:12px;padding:13px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
              <div style="font-size:12.5px;font-weight:900;color:#e2e8f0;display:flex;align-items:center;gap:6px;">
                ${renderSpr('workshop_engine', 1.1)} TALLER DE INGENIERÍA DEL NÚCLEO
              </div>
              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
                <span style="font-size:11px;color:#94a3b8;font-weight:700;">Pintura de Chasis:</span>
                ${chassisList.map(c => {
                  const owned = this.save.unlockedChassis.includes(c.id);
                  const equipped = this.save.chassis === c.id;
                  const tip = owned
                    ? `${c.name} (${equipped ? 'Equipado' : 'Desbloqueado — clic para equipar'})`
                    : `${c.name} — Comprar por ${c.cost} Monedas`;
                  return `
                    <button class="racer-color-btn" data-color="${c.id}" title="${tip}" style="position:relative;height:26px;padding:0 9px;border-radius:999px;background:${c.primary};border:2px solid ${equipped ? '#fff' : 'rgba(255,255,255,0.2)'};box-shadow:${equipped ? `0 0 10px ${c.glow}` : 'none'};cursor:pointer;display:inline-flex;align-items:center;gap:5px;color:#fff;font-size:10px;font-weight:800;">
                      <span>${c.name.split(' ')[0]}</span>
                      ${equipped
                        ? '<span style="background:rgba(0,0,0,0.45);padding:1px 5px;border-radius:6px;font-size:9px;">Equipado</span>'
                        : (!owned ? `<span style="background:rgba(0,0,0,0.55);padding:1px 5px;border-radius:6px;font-size:9px;">🔒 ${c.cost}</span>` : '')
                      }
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:10px;">
              ${renderUpgradeCard('engine')}
              ${renderUpgradeCard('turbo')}
              ${renderUpgradeCard('shield')}
            </div>
          </div>

          <!-- Selección de Circuitos (Bloque A3: cabeceras flex-wrap sin solape y 4 tarjetas visibles) -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
            ${tracks.map(t => {
              const isCleared = !!this.save.clearedTracks[t.id];
              const best = this.save.bestTimes[t.id] ? `${(this.save.bestTimes[t.id] / 1000).toFixed(2)}s` : 'Sin récord';
              const theme = t.theme || { accent: t.accent || '#38bdf8', border: '#2563eb', sky: t.skyTop || '#070b19' };
              const tier = t.tier || `Nivel ${t.level || 1} · ${t.difficulty || 'Normal'}`;
              const firstReward = t.firstReward || { coins: t.reward?.coins || 75, keys: { [t.reward?.key || 'copper']: 1 } };
              const repeatReward = t.repeatReward || { coins: Math.round((t.reward?.coins || 75) * 0.45) };
              const keyId = firstReward.keys?.copper ? 'copper' : firstReward.keys?.silver ? 'silver' : firstReward.keys?.gold ? 'gold' : 'obsidian';
              const keyName = keyId === 'copper' ? 'Cobre' : keyId === 'silver' ? 'Plata' : keyId === 'gold' ? 'Oro' : 'Obsidiana';
              return `
                <div style="background:linear-gradient(160deg, #0e1320 0%, #090c14 100%);border:1.5px solid ${isCleared ? '#10b981' : theme.border};border-radius:12px;padding:13px;display:flex;flex-direction:column;gap:8px;box-shadow:0 6px 16px rgba(0,0,0,0.4);">
                  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;min-width:0;">
                    <span style="font-size:10px;font-weight:900;color:${theme.accent};text-transform:uppercase;letter-spacing:0.3px;">${tier}</span>
                    <span style="font-size:10px;font-weight:800;color:${isCleared ? '#34d399' : '#fbbf24'};background:rgba(0,0,0,0.45);padding:2px 7px;border-radius:8px;border:1px solid ${isCleared ? '#10b981' : 'rgba(251,191,36,0.4)'};white-space:nowrap;">
                      ${isCleared ? `✓ Récord: ${best}` : '★ 1ª Conquista'}
                    </span>
                  </div>
                  <div style="font-size:14.5px;font-weight:900;color:#f8fafc;">${t.name}</div>
                  <div style="font-size:11.5px;color:#94a3b8;line-height:1.4;flex:1;">${t.desc ?? ''}</div>
                  <div style="font-size:11px;color:#cbd5e1;display:flex;flex-wrap:wrap;gap:6px;justify-content:space-between;align-items:center;background:#080b12;padding:6px 8px;border-radius:6px;border:1px solid #172033;">
                    <span>🏁 ${t.laps || 2} Vueltas</span>
                    <span style="color:#fbbf24;font-weight:800;display:inline-flex;align-items:center;gap:4px;">
                      ${isCleared
                        ? `1º: +${repeatReward.coins} ${renderSpr('coin', 0.85)}`
                        : `1º: +${firstReward.coins} ${renderSpr('coin', 0.85)} + 1 ${renderSpr('key_' + keyId, 0.85)} ${keyName}`
                      }
                    </span>
                  </div>
                  <button class="racer-start-btn" data-track="${t.id}" style="background:linear-gradient(135deg, ${theme.border}, #2563eb);color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:900;font-size:12px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:inline-flex;align-items:center;justify-content:center;gap:6px;">
                    ${renderSpr('tab_racer', 1)} Correr en ${t.name}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      this.container.querySelectorAll('.racer-color-btn').forEach(btn => {
        btn.onclick = () => {
          const cid = btn.dataset.color;
          const meta = chassisList.find(c => c.id === cid);
          if (!meta) return;
          if (!this.save.unlockedChassis.includes(cid)) {
            if (!this.spendCoins(meta.cost || 0)) return;
            this.save.unlockedChassis.push(cid);
            RacerAudio.coin(this.scope);
          }
          this.save.chassis = cid;
          saveRacerData(this.save);
          this.renderLobby();
        };
      });

      this.container.querySelectorAll('.racer-upg-btn').forEach(btn => {
        btn.onclick = () => {
          const key = btn.dataset.upg;
          const meta = upgradesMeta[key] || {};
          const lvl = this.save[key] || 1;
          if (lvl >= (meta.maxLevel || 5)) return;
          const costs = Array.isArray(meta.costs) ? meta.costs : [0, meta.baseCost || 120, (meta.baseCost || 120) * 2, (meta.baseCost || 120) * 4, (meta.baseCost || 120) * 8];
          const cost = costs[lvl] || 200;
          if (this.spendCoins(cost)) {
            this.save[key] = lvl + 1;
            saveRacerData(this.save);
            RacerAudio.coin(this.scope);
            this.renderLobby();
          }
        };
      });

      this.container.querySelectorAll('.racer-start-btn').forEach(btn => {
        btn.onclick = () => {
          const tid = btn.dataset.track;
          const track = tracks.find(t => String(t.id) === String(tid)) || tracks[0];
          this.startRace(track);
        };
      });

      if (window.__EK && typeof window.__EK.assertNoBadText === 'function') {
        window.__EK.assertNoBadText(this.container);
      }
    }

    startRace(rawTrack) {
      if (this.destroyed) return;
      const baseTrack = rawTrack || getTracks()[0] || {};
      const theme = baseTrack.theme || {
        sky: baseTrack.skyTop || '#070b19',
        accent: baseTrack.accent || '#38bdf8',
        border: '#2563eb',
        road: '#0b101c',
        grid: '#1e293b'
      };
      const track = {
        ...baseTrack,
        theme,
        laps: baseTrack.laps || 2,
        lapLength: baseTrack.lapLength || 1800,
        aiSpeed: baseTrack.aiSpeed || 140,
        firstReward: baseTrack.firstReward || { coins: baseTrack.reward?.coins || 75, keys: { [baseTrack.reward?.key || 'copper']: 1 } },
        repeatReward: baseTrack.repeatReward || { coins: Math.round((baseTrack.reward?.coins || 75) * 0.45) }
      };
      this.selectedTrack = track;
      this.inRace = true;
      this.paused = false;
      this.keyState = {};
      const chassisList = getChassisColors();
      const ch = chassisList.find(c => c.id === this.save.chassis) || chassisList[0];

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:10px;user-select:none;">
          <!-- HUD Superior Pixel (Bloque G3: fuente pixel >= 16px y barra Nitro segmentada) -->
          <div style="background:#0c101a;border:1px solid #20293d;border-radius:10px;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;flex-wrap:gap:10px;">
              <span style="font-size:13px;font-weight:900;color:${track.theme.accent};display:inline-flex;align-items:center;gap:6px;">
                ${renderSpr('tab_racer', 1.1)} ${track.name}
              </span>
              <span id="racerLapTxt" class="ek-pixel-font" style="font-size:16px;font-weight:900;color:#f8fafc;background:#161f30;padding:4px 10px;border-radius:6px;">VUELTA 1/${track.laps}</span>
              <span id="racerPosTxt" class="ek-pixel-font" style="font-size:16px;font-weight:900;color:#fbbf24;background:#161f30;padding:4px 10px;border-radius:6px;">POS 4º/4</span>
            </div>
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;">
              <span id="racerCoinsTxt" class="ek-pixel-font" style="font-size:16px;font-weight:800;color:#fde047;display:inline-flex;align-items:center;gap:5px;">
                ${renderSpr('coin', 1.1)} +0
              </span>
              <div style="display:flex;align-items:center;gap:6px;">
                <span id="racerNitroLbl" class="ek-pixel-font" style="font-size:11px;font-weight:800;color:#38bdf8;">NITRO</span>
                <div id="racerNitroSegments" style="display:flex;gap:2px;background:#0f172a;padding:3px;border-radius:6px;border:1px solid #334155;">
                  ${Array.from({ length: 10 }, (_, i) => `<div class="nitro-seg" data-idx="${i}" style="width:9px;height:12px;border-radius:2px;background:#06b6d4;"></div>`).join('')}
                </div>
              </div>
              <button id="racerBtnPause" style="background:#1e2433;border:1px solid #3b4660;color:#cbd5e1;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;">⏸ Pausa</button>
              <button id="racerBtnExit" style="background:#1e2433;border:1px solid rgba(239,68,68,0.45);color:#fca5a5;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;">✕ Salir</button>
            </div>
          </div>

          <!-- Lienzo de Carrera -->
          <div id="racerStageWrap" style="position:relative;border-radius:12px;overflow:hidden;border:2px solid ${track.theme.border};background:${track.theme.sky};box-shadow:0 10px 30px rgba(0,0,0,0.6);">
            <canvas id="racerCanvas" width="760" height="390" style="width:100%;height:390px;display:block;"></canvas>
            <div id="racerOverlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:20;"></div>
          </div>

          <!-- Controles Rápidos -->
          <div style="display:flex;justify-content:space-between;align-items:center;background:#0b0f18;border:1px solid #1b2334;border-radius:10px;padding:8px 14px;flex-wrap:wrap;gap:8px;">
            <div style="font-size:11.5px;color:#94a3b8;">
              ⌨️ Controles: <b>A / D</b> o <b>◀ / ▶</b> Cambiar carril · <b>S / ▼</b> Frenar · <b>ESPACIO</b> Activar Turbo Nitro
            </div>
            <div style="display:flex;gap:8px;">
              <button id="racerTouchLeft" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:6px 14px;border-radius:6px;font-weight:900;cursor:pointer;">◀ Izquierda</button>
              <button id="racerTouchNitro" style="background:linear-gradient(135deg,#0284c7,#2563eb);color:#fff;border:none;padding:6px 14px;border-radius:6px;font-weight:900;cursor:pointer;">⚡ NITRO</button>
              <button id="racerTouchRight" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:6px 14px;border-radius:6px;font-weight:900;cursor:pointer;">Derecha ▶</button>
            </div>
          </div>
        </div>
      `;

      const btnPause = this.container.querySelector('#racerBtnPause');
      if (btnPause) btnPause.onclick = () => (this.paused ? this.resume() : this.pause());

      const btnExit = this.container.querySelector('#racerBtnExit');
      if (btnExit) btnExit.onclick = () => this.confirmExitRace();

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

      const maxSpd = 9.3 + (this.save.engine - 1) * 0.75;
      this.raceState = {
        countdown: 3,
        startedAt: 0,
        finished: false,
        rewardClaimed: false,
        totalDist: track.laps * track.lapLength,
        dist: 0,
        x: 0,
        vx: 0,
        speed: 0,
        maxSpeed: maxSpd,
        nitro: 100,
        nitroActive: 0,
        shakeFrames: 0,
        crashFlash: 0,
        coinsCollected: 0,
        items: [],
        speedLines: Array.from({ length: 8 }, (_, i) => ({
          side: i % 2 === 0 ? -1 : 1,
          y: 120 + (i * 33) % 250,
          len: 35 + (i * 17) % 45,
          phase: i * 0.13
        })),
        rivals: [
          { name: 'Kenshin-X', x: -0.58, targetX: -0.58, dist: 24, speed: track.aiSpeed * 0.94, color: '#ef4444' },
          { name: 'Valkyria-9', x: 0.0, targetX: 0.0, dist: 48, speed: track.aiSpeed * 0.99, color: '#eab308' },
          { name: 'Sensei-GT', x: 0.58, targetX: 0.58, dist: 72, speed: track.aiSpeed * 1.03, color: '#a855f7' }
        ]
      };

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

      // Cuenta regresiva 3-2-1-GO con animación pop (scale 1.4 -> 1 en 300ms)
      const overlay = this.container.querySelector('#racerOverlay');
      const tickCountdown = () => {
        if (!this.inRace || this.destroyed) return;
        if (this.paused) {
          this._schedule(tickCountdown, 250);
          return;
        }
        if (this.raceState.countdown > 0) {
          RacerAudio.beep(this.scope, false);
          if (overlay) {
            overlay.innerHTML = `<div class="ek-pixel-font racer-countdown-pop" style="font-size:64px;font-weight:900;color:#fbbf24;text-shadow:0 0 25px rgba(251,191,36,0.85);">${this.raceState.countdown}</div>`;
          }
          this.raceState.countdown--;
          this._schedule(tickCountdown, 750);
        } else {
          RacerAudio.beep(this.scope, true);
          this.raceState.startedAt = performance.now();
          if (overlay) {
            overlay.innerHTML = `<div class="ek-pixel-font racer-countdown-pop" style="font-size:48px;font-weight:900;color:#10b981;text-shadow:0 0 25px rgba(16,185,129,0.9);">¡GO!</div>`;
            this._schedule(() => { if (overlay && !this.raceState.finished) overlay.innerHTML = ''; }, 600);
          }
        }
      };
      tickCountdown();

      const stepFrame = () => {
        if (!this.inRace || this.destroyed) return;
        if (!this.paused) {
          this.updateRace(track);
          this.drawRace(ctx, canvas.width, canvas.height, track, ch);
        }
        if (!this.raceState.finished) {
          if (this.scope) this.rafId = this.scope.raf(stepFrame);
          else this.rafId = requestAnimationFrame(stepFrame);
        }
      };
      if (this.scope) this.rafId = this.scope.raf(stepFrame);
      else this.rafId = requestAnimationFrame(stepFrame);

      if (window.__EK && typeof window.__EK.assertNoBadText === 'function') {
        window.__EK.assertNoBadText(this.container);
      }
    }

    activateNitro() {
      const st = this.raceState;
      if (!st || st.countdown > 0 || st.finished || this.paused) return;
      if (st.nitro >= 30 && st.nitroActive <= 0) {
        st.nitro -= 30;
        st.nitroActive = 48 + (this.save.turbo - 1) * 12;
        RacerAudio.boost(this.scope);
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

      const boostBonus = st.nitroActive > 0 ? (3.3 + (this.save.turbo - 1) * 0.45) : 0;
      if (st.nitroActive > 0) st.nitroActive--;
      else st.nitro = Math.min(100, st.nitro + 0.13 + (this.save.turbo - 1) * 0.03);

      if (st.shakeFrames > 0) st.shakeFrames--;
      if (st.crashFlash > 0) st.crashFlash--;

      const targetSpd = brake ? st.maxSpeed * 0.55 : (st.maxSpeed + boostBonus);
      st.speed += (targetSpd - st.speed) * 0.085;
      st.dist += st.speed;

      // Bloque G1: IA con separación mínima longitudinal y lateral (nunca se apilan ni tapan al jugador)
      const lanes = [-0.62, -0.20, 0.20, 0.62];
      st.rivals.forEach((r, idx) => {
        if (Math.floor(st.dist / 90 + idx * 3) % 7 === 0) {
          r.targetX = lanes[(idx + Math.floor(st.dist / 260)) % lanes.length];
        }
        r.x += (r.targetX - r.x) * 0.04;
        const rubberband = (st.dist - r.dist) * 0.0011;
        r.dist += Math.max(5.5, r.speed + rubberband + Math.sin(st.dist * 0.02 + idx) * 0.18);
      });

      // Resolver repulsión entre rivales y contra el jugador
      for (let i = 0; i < st.rivals.length; i++) {
        const a = st.rivals[i];
        // Separación respecto al jugador si está muy cerca en Z
        if (Math.abs(a.dist - st.dist) < 34 && Math.abs(a.x - st.x) < 0.30) {
          const pushDir = a.x >= st.x ? 1 : -1;
          a.x = Math.max(-0.78, Math.min(0.78, a.x + pushDir * 0.045));
        }
        // Separación entre rivales IA
        for (let j = i + 1; j < st.rivals.length; j++) {
          const b = st.rivals[j];
          const dz = b.dist - a.dist;
          const dx = b.x - a.x;
          if (Math.abs(dz) < 30 && Math.abs(dx) < 0.28) {
            const latDir = dx >= 0 ? 1 : -1;
            a.x = Math.max(-0.78, Math.min(0.78, a.x - latDir * 0.03));
            b.x = Math.max(-0.78, Math.min(0.78, b.x + latDir * 0.03));
            if (Math.abs(dz) < 16) {
              b.dist += dz >= 0 ? 2.5 : -2.5;
            }
          }
        }
      }

      // Colisiones con objetos cercanos
      const magnetRadius = 0.16 + (this.save.shield - 1) * 0.025;
      for (const item of st.items) {
        const dz = item.dist - st.dist;
        if (dz < -30 || dz > 45) continue;
        const dx = Math.abs(item.x - st.x);

        if (item.type === 'coin' && !item.taken && dx < magnetRadius) {
          item.taken = true;
          st.coinsCollected += 5;
          RacerAudio.coin(this.scope);
        } else if (item.type === 'boost' && !item.taken && dx < 0.18) {
          item.taken = true;
          st.nitro = Math.min(100, st.nitro + 25);
          st.nitroActive = Math.max(st.nitroActive, 34);
          RacerAudio.boost(this.scope);
        } else if (item.type === 'hazard' && !item.hit && dx < 0.15 && Math.abs(dz) < 22) {
          item.hit = true;
          const dmgReduction = 0.44 + (this.save.shield - 1) * 0.1;
          st.speed *= Math.min(0.88, dmgReduction);
          st.shakeFrames = 14;
          st.crashFlash = 10;
          RacerAudio.crash(this.scope);
        }
      }

      // Actualizar HUD Pixel
      const curLap = Math.min(track.laps, Math.floor(st.dist / track.lapLength) + 1);
      const rank = 1 + st.rivals.filter(r => r.dist > st.dist).length;
      const lapEl = this.container.querySelector('#racerLapTxt');
      const posEl = this.container.querySelector('#racerPosTxt');
      const coinEl = this.container.querySelector('#racerCoinsTxt');
      const nitroLbl = this.container.querySelector('#racerNitroLbl');
      const segs = this.container.querySelectorAll('.nitro-seg');

      if (lapEl) lapEl.textContent = `VUELTA ${curLap}/${track.laps}`;
      if (posEl) {
        posEl.textContent = `POS ${rank}º/4`;
        posEl.style.color = rank === 1 ? '#10b981' : rank === 2 ? '#38bdf8' : '#fbbf24';
      }
      if (coinEl) coinEl.innerHTML = `${renderSpr('coin', 1.1)} +${st.coinsCollected}`;

      const filledSegs = Math.floor(st.nitro / 10);
      const isFull = st.nitro >= 99.5;
      if (nitroLbl) {
        nitroLbl.textContent = st.nitroActive > 0 ? '⚡ TURBO' : (isFull ? '¡LISTO!' : 'NITRO');
        nitroLbl.style.color = isFull ? '#fde047' : '#38bdf8';
      }
      segs.forEach((seg, idx) => {
        if (idx < filledSegs) {
          seg.style.background = st.nitroActive > 0 ? '#fde047' : (isFull ? '#22d3ee' : '#06b6d4');
          seg.style.boxShadow = isFull ? '0 0 6px #22d3ee' : 'none';
        } else {
          seg.style.background = '#1e293b';
          seg.style.boxShadow = 'none';
        }
      });

      if (st.dist >= st.totalDist) {
        st.finished = true;
        this.finishRace(track, rank);
      }
    }

    drawRace(ctx, W, H, track, ch) {
      const st = this.raceState;
      ctx.save();

      // Bloque G2: Camera shake al chocar y ligero FOV zoom en Nitro
      if (st.shakeFrames > 0) {
        const mag = (st.shakeFrames / 14) * 6;
        ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
      }
      if (st.nitroActive > 0) {
        ctx.translate(W / 2, H / 2);
        ctx.scale(1.035, 1.035);
        ctx.translate(-W / 2, -H / 2);
      }

      ctx.fillStyle = track.theme.sky;
      ctx.fillRect(0, 0, W, H);

      const horizon = 118;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      skyGrad.addColorStop(0, track.theme.sky);
      skyGrad.addColorStop(1, '#162038');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizon);

      // Bloque G2: Sol Synthwave con franjas horizontales recortadas
      ctx.save();
      const sunX = W / 2 - st.x * 18;
      const sunY = horizon - 8;
      const sunR = 54;
      const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY);
      sunGrad.addColorStop(0, '#fde047');
      sunGrad.addColorStop(0.55, track.theme.accent);
      sunGrad.addColorStop(1, track.theme.border);
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, Math.PI, 0);
      ctx.fill();
      // Franjas horizontales synthwave sobre el sol
      ctx.fillStyle = '#131b2e';
      for (let sy = sunY - 28; sy < sunY; sy += 7) {
        const stripeH = Math.max(2, (sy - (sunY - 32)) * 0.12);
        ctx.fillRect(sunX - sunR - 2, sy, sunR * 2 + 4, stripeH);
      }
      ctx.restore();

      // Bloque G2: 2 capas de montañas con parallax
      const drawMountainLayer = (parallaxOffset, baseColor, strokeColor, peaks, amp) => {
        ctx.save();
        ctx.fillStyle = baseColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, horizon);
        for (let px = 0; px <= W; px += 38) {
          const worldX = px + parallaxOffset;
          const h = Math.abs(Math.sin(worldX * 0.012) * amp + Math.cos(worldX * 0.027) * (amp * 0.55));
          ctx.lineTo(px, horizon - 6 - h);
        }
        ctx.lineTo(W, horizon);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      drawMountainLayer(st.x * 24 + st.dist * 0.015, '#0b101d', 'rgba(148,163,184,0.22)', 12, 26);
      drawMountainLayer(st.x * 52 + st.dist * 0.04, '#11182b', track.theme.border + '66', 16, 16);

      // Carretera con perspectiva trapezoidal
      const roadTopW = 152;
      const roadBotW = 566;
      const cx = W / 2 - st.x * 78;

      ctx.fillStyle = track.theme.road;
      ctx.beginPath();
      ctx.moveTo(cx - roadTopW / 2, horizon);
      ctx.lineTo(cx + roadTopW / 2, horizon);
      ctx.lineTo(W / 2 + roadBotW / 2, H);
      ctx.lineTo(W / 2 - roadBotW / 2, H);
      ctx.closePath();
      ctx.fill();

      // Líneas horizontales de movimiento + postes laterales en perspectiva (Bloque G2)
      const stripeOffset = (st.dist / 35) % 2;
      for (let i = 0; i < 14; i++) {
        const t0 = ((i + (1 - (stripeOffset % 1))) % 14) / 14;
        const p = Math.pow(t0, 1.55);
        const y = horizon + p * (H - horizon);
        const xCenter = cx + (W / 2 - cx) * t0;
        const w = roadTopW + (roadBotW - roadTopW) * p;

        ctx.strokeStyle = track.theme.grid;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xCenter - w / 2, y);
        ctx.lineTo(xCenter + w / 2, y);
        ctx.stroke();

        // Divisor central de carril
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.24)';
          ctx.fillRect(xCenter - 2.5 * (0.4 + p), y, 5 * (0.4 + p), Math.max(4, 14 * p));
        }

        // Postes neón laterales en perspectiva a ambos lados
        if (i % 2 === 1 && p > 0.06) {
          const postH = 10 + p * 34;
          const postW = Math.max(2, p * 5);
          const leftPostX = xCenter - w / 2 - 12 * p;
          const rightPostX = xCenter + w / 2 + 12 * p;
          ctx.fillStyle = track.theme.border;
          ctx.fillRect(leftPostX - postW / 2, y - postH, postW, postH);
          ctx.fillRect(rightPostX - postW / 2, y - postH, postW, postH);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(leftPostX - postW / 2, y - postH, postW, Math.max(2, postH * 0.22));
          ctx.fillRect(rightPostX - postW / 2, y - postH, postW, Math.max(2, postH * 0.22));
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

      // Posición en pantalla del jugador (Bloque G1: dibujado siempre el último y a escala x1.35)
      const px = W / 2 + st.vx * 900;
      const py = H - 50;

      // Ordenar rivales de lejos a cerca (mayor dist primero) para z-order limpio
      const visibleRivals = st.rivals
        .filter(r => (r.dist - st.dist) >= -30 && (r.dist - st.dist) <= viewDist)
        .sort((a, b) => b.dist - a.dist)
        .map(r => {
          const diff = r.dist - st.dist;
          const rel = 1 - diff / viewDist;
          const p = Math.max(0.05, Math.min(1, Math.pow(rel, 1.45)));
          const y = horizon + p * (H - horizon - 55);
          const roadW = roadTopW + (roadBotW - roadTopW) * p;
          const roadCenter = cx + (W / 2 - cx) * p;
          const x = roadCenter + r.x * (roadW * 0.44);
          const scale = 0.34 + p * 0.68;
          return { r, x, y, scale };
        });

      for (let i = 0; i < visibleRivals.length; i++) {
        const vr = visibleRivals[i];
        // Atenuar/ocultar etiqueta si se solapa con el jugador o con otro rival más cercano
        const nearPlayer = Math.hypot(vr.x - px, vr.y - py) < 62;
        const nearOther = visibleRivals.slice(i + 1).some(o => Math.hypot(vr.x - o.x, vr.y - o.y) < 52);
        const labelAlpha = (nearPlayer || nearOther) ? 0.18 : 0.92;
        this.drawKart(ctx, vr.x, vr.y, vr.scale, vr.r.color, '#ffffff', vr.r.name, false, labelAlpha);
      }

      // Dibujar SIEMPRE al último el coche del jugador con escala x1.35 (Bloque G1)
      this.drawKart(ctx, px, py, 1.35, ch.primary, ch.glow, this.options.playerName || 'Tú', st.nitroActive > 0, 1.0);

      // Bloque G2: 8 líneas de velocidad blancas/cian laterales durante NITRO
      if (st.nitroActive > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
        ctx.lineWidth = 2.5;
        st.speedLines.forEach((ln, idx) => {
          const progress = ((st.dist * 0.045 + ln.phase) % 1);
          const sx = W / 2 + ln.side * (90 + progress * (W * 0.42));
          const sy = horizon + 15 + progress * (H - horizon - 20);
          const ex = sx + ln.side * ln.len;
          const ey = sy + ln.len * 0.42;
          ctx.strokeStyle = idx % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(56,189,248,0.9)';
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        });
        ctx.restore();
      }

      // Flash rojo breve al chocar (Bloque G2)
      if (st.crashFlash > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${(st.crashFlash / 10) * 0.32})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    }

    drawKart(ctx, x, y, scale, bodyColor, glowColor, label, isBoosting, labelAlpha = 1.0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Sombra inferior
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.fillRect(-30, 14, 60, 10);

      // Llamas de Nitro
      if (isBoosting) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-18, 18, 12, 16 + Math.random() * 12);
        ctx.fillRect(6, 18, 12, 16 + Math.random() * 12);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(-15, 18, 6, 10);
        ctx.fillRect(9, 18, 6, 10);
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
      ctx.fillStyle = this.pilot.maskColor || '#dc2626';
      ctx.fillRect(-13, -22, 26, 5);
      ctx.fillStyle = this.pilot.eyeColor || '#38bdf8';
      ctx.fillRect(-7, -18, 4, 3);
      ctx.fillRect(3, -18, 4, 3);

      // Etiqueta de piloto 14px arriba del coche (Bloque G1)
      if (label && labelAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = labelAlpha;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const tw = Math.ceil(ctx.measureText(label).width) + 10;
        ctx.fillStyle = 'rgba(9, 13, 22, 0.78)';
        ctx.fillRect(-tw / 2, -50, tw, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(label, 0, -40);
        ctx.restore();
      }
      ctx.restore();
    }

    finishRace(track, rank) {
      const st = this.raceState;
      if (!st || st.rewardClaimed) return;
      st.rewardClaimed = true;

      const elapsedMs = Math.max(1000, Math.round(performance.now() - st.startedAt));
      const isWin = rank === 1;
      const isFirstClear = isWin && !this.save.clearedTracks[track.id];
      const prevBest = this.save.bestTimes[track.id] || 0;
      const isNewRecord = isWin && (!prevBest || elapsedMs < prevBest);

      let posCoins = 0;
      let recordBonus = isNewRecord ? 25 : 0;
      let keysWon = {};
      let titleText = '';

      if (rank === 1) {
        RacerAudio.win(this.scope);
        this.save.racesWon = (this.save.racesWon || 0) + 1;
        if (isNewRecord) {
          this.save.bestTimes[track.id] = elapsedMs;
        }
        if (isFirstClear) {
          posCoins = track.firstReward.coins;
          keysWon = { ...track.firstReward.keys };
          this.save.clearedTracks[track.id] = true;
          titleText = '🏆 ¡1º LUGAR · PRIMERA CONQUISTA!';
        } else {
          posCoins = track.repeatReward.coins;
          if (Math.random() < 0.25) keysWon = { copper: 1 };
          titleText = '🥇 ¡1º LUGAR · GRAN PREMIO!';
        }
      } else if (rank === 2) {
        RacerAudio.coin(this.scope);
        posCoins = Math.round(track.repeatReward.coins * 0.65);
        titleText = '🥈 2º LUGAR · PODIO DE PLATA';
      } else if (rank === 3) {
        posCoins = Math.round(track.repeatReward.coins * 0.4);
        titleText = '🥉 3º LUGAR · PODIO DE BRONCE';
      } else {
        posCoins = 15;
        titleText = '🏁 4º LUGAR · CARRERA COMPLETADA';
      }

      saveRacerData(this.save);
      const totalCoins = posCoins + st.coinsCollected + recordBonus;
      if (typeof this.options.onReward === 'function') {
        this.options.onReward({ coins: totalCoins, keys: keysWon, source: 'racer', trackId: track.id, firstClear: isFirstClear });
      }

      // Construir tabla de Podio 1º a 4º (Bloque G3)
      const racers = [
        { name: this.options.playerName || 'Tú (Piloto)', dist: st.dist, isMe: true },
        ...st.rivals.map(r => ({ name: r.name, dist: r.dist, isMe: false }))
      ].sort((a, b) => b.dist - a.dist);

      const keyEntries = Object.entries(keysWon).filter(([, v]) => v > 0);
      const keyBadgeHtml = keyEntries.map(([k, v]) => {
        const name = k === 'copper' ? 'Llave de Cobre' : k === 'silver' ? 'Llave de Plata' : k === 'gold' ? 'Llave de Oro' : 'Llave de Obsidiana';
        return `<span class="cj-key-bounce" style="display:inline-flex;align-items:center;gap:5px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.45);padding:3px 9px;border-radius:8px;color:#fde047;font-weight:900;">+${v} ${renderSpr('key_' + k, 1.1)} ${name}</span>`;
      }).join(' ');

      const overlay = this.container.querySelector('#racerOverlay');
      if (overlay) {
        overlay.style.pointerEvents = 'auto';
        overlay.style.background = 'rgba(7, 10, 18, 0.88)';
        overlay.innerHTML = `
          <div style="background:#0f1523;border:2px solid ${rank === 1 ? '#10b981' : '#3b82f6'};border-radius:14px;padding:18px 22px;text-align:center;max-width:460px;width:92%;box-shadow:0 12px 35px rgba(0,0,0,0.8);">
            <div class="ek-pixel-font" style="font-size:13px;font-weight:900;color:${rank === 1 ? '#34d399' : '#60a5fa'};margin-bottom:6px;">${titleText}</div>
            <div style="font-size:11.5px;color:#cbd5e1;margin-bottom:10px;">
              Tiempo oficial: <b>${(elapsedMs / 1000).toFixed(2)}s</b> ${isNewRecord ? '<span style="color:#34d399;font-weight:900;">· ¡NUEVO RÉCORD!</span>' : ''}
            </div>

            <!-- Podio 1º a 4º -->
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;">
              ${racers.map((rc, idx) => `
                <div style="background:${rc.isMe ? 'rgba(37,99,235,0.22)' : '#090d16'};border:1px solid ${rc.isMe ? '#3b82f6' : '#1e293b'};border-radius:8px;padding:6px 4px;">
                  <div class="ek-pixel-font" style="font-size:11px;color:${idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#fb923c' : '#64748b'};">${idx + 1}º</div>
                  <div style="font-size:10.5px;font-weight:800;color:${rc.isMe ? '#fff' : '#94a3b8'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">${rc.name}</div>
                </div>
              `).join('')}
            </div>

            <!-- Desglose de Recompensas -->
            <div style="background:#090d16;border:1px solid rgba(251,191,36,0.35);border-radius:9px;padding:9px 12px;margin-bottom:12px;font-size:11.5px;color:#e2e8f0;display:flex;flex-direction:column;gap:4px;">
              <div style="display:flex;justify-content:space-between;"><span>Premio de posición (${rank}º):</span><b style="color:#fde047;">+${posCoins} 🪙</b></div>
              <div style="display:flex;justify-content:space-between;"><span>Monedas recogidas en pista:</span><b style="color:#fde047;">+${st.coinsCollected} 🪙</b></div>
              ${recordBonus > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Bono de Récord del Circuito:</span><b style="color:#34d399;">+${recordBonus} 🪙</b></div>` : ''}
              <div style="border-top:1px solid #1e293b;margin-top:3px;padding-top:5px;display:flex;justify-content:space-between;font-size:12.5px;font-weight:900;color:#fbbf24;">
                <span>TOTAL GANADO:</span>
                <span>+${totalCoins} 🪙</span>
              </div>
              ${keyBadgeHtml ? `<div style="margin-top:4px;display:flex;justify-content:center;">${keyBadgeHtml}</div>` : ''}
            </div>

            <div style="display:flex;justify-content:center;gap:10px;">
              <button id="racerBtnAgain" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;padding:8px 16px;border-radius:7px;font-weight:900;font-size:12px;cursor:pointer;">🔄 Reintentar</button>
              <button id="racerBtnLobby" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;padding:8px 16px;border-radius:7px;font-weight:800;font-size:12px;cursor:pointer;">🏁 Circuitos</button>
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
