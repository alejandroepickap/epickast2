// tools/update-renderer-v191.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'renderer.js');
let code = fs.readFileSync(filePath, 'utf8');

console.log('Original length:', code.length);

// 1. Replace modalVault with the comprehensive v1.9.1 modalVault
const oldModalVaultStart = 'function modalVault(initialTab = \'roulette\') {';
const oldModalVaultEndMarker = '// ---------- CENTRO DE GUÍAS OFICIAL EPICKAST ----------';

const idxStart = code.indexOf(oldModalVaultStart);
const idxEnd = code.indexOf(oldModalVaultEndMarker);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Could not find modalVault boundaries:', { idxStart, idxEnd });
  process.exit(1);
}

const newModalVaultCode = `function modalVault(initialTab = 'roulette') {
  const m = $('modal');
  if (!m) return;

  // Garantizar ciclo de vida idempotente y limpiar suscripciones previas
  if (window.__EK && typeof window.__EK.disposeVaultScopes === 'function') {
    window.__EK.disposeVaultScopes();
  }
  const vaultScope = (window.EKLifecycle && typeof window.EKLifecycle.create === 'function')
    ? window.EKLifecycle.create('vault')
    : null;

  m.classList.remove('hidden');
  m.replaceChildren();

  const cfg = window.EKGameConfig || {};
  const PROFILE_COSMETICS = cfg.COSMETICS || [];
  const RARITY_COLORS = cfg.RARITY_TOKENS ? {
    common: cfg.RARITY_TOKENS.common.color,
    rare: cfg.RARITY_TOKENS.rare.color,
    epic: cfg.RARITY_TOKENS.epic.color,
    legendary: cfg.RARITY_TOKENS.legendary.color
  } : { common: '#94a3b8', rare: '#3b82f6', epic: '#a855f7', legendary: '#fbbf24' };

  const KEY_PRICES = { copper: 250, silver: 1000, gold: 4000, obsidian: 15000 };
  const KEY_PACK_DISCOUNT = 0.90;
  const DUST_DUPLICATE = cfg.DUST_DUPLICATE || { common: 5, rare: 15, epic: 40, legendary: 100 };
  const DUST_CRAFT = cfg.DUST_CRAFT || { common: 40, rare: 120, epic: 300, legendary: 800 };

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

  const currentVer = cfg.APP_VERSION || '1.9.1';
  if (dData.version !== currentVer) {
    dData.version = currentVer;
    try { localStorage.setItem('epickast.dungeon.v1', JSON.stringify(dData)); } catch {}
  }

  let activeTab = (typeof initialTab === 'string' && ['roulette', 'collection', 'dojo', 'racer', 'ninja'].includes(initialTab)) ? initialTab : 'roulette';
  let activeFilter = 'all'; // 'all' | 'frame' | 'banner' | 'color' | 'title' | 'nameplate' | 'profile_fx'
  let activeRarityFilter = 'all'; // 'all' | 'common' | 'rare' | 'epic' | 'legendary'
  let sortNewestFirst = true;

  let selectedTier = 'copper';
  if ((dData.keys.obsidian || 0) > 0) selectedTier = 'obsidian';
  else if ((dData.keys.gold || 0) > 0) selectedTier = 'gold';
  else if ((dData.keys.silver || 0) > 0) selectedTier = 'silver';

  let isSpinning = false;
  let lastSpinResult = null;
  let activeDojoInstance = null;
  let activeRacerInstance = null;

  const saveState = () => {
    try { localStorage.setItem('epickast.dungeon.v1', JSON.stringify(dData)); } catch {}
    if (typeof rpc === 'function' && S.ws && S.ws.readyState === 1) {
      let ninjaCfg = {};
      try { ninjaCfg = JSON.parse(localStorage.getItem('epickast.ninja.v1') || '{}'); } catch {}
      const unlockedList = Object.keys(dData.cosmetics || {}).filter(k => dData.cosmetics[k]);
      if (dData.founderFrameUnlocked && !unlockedList.includes('founder_frame')) unlockedList.push('founder_frame');
      rpc('vault.sync', {
        coins: dData.coins || 0,
        dust: dData.dust || 0,
        keys: dData.keys || { copper: 0, silver: 0, gold: 0, obsidian: 0 },
        pity: dData.pity || { withoutEpic: 0, withoutLegendary: 0 },
        unlockedCosmetics: unlockedList,
        ninjaConfig: ninjaCfg
      }).catch(() => {});
    }
  };

  const rollRarity = (tier) => {
    if (cfg.rollRarityWithPity) {
      return cfg.rollRarityWithPity(tier, dData.pity);
    }
    const CHEST_ODDS = cfg.CHESTS ? {
      copper: cfg.CHESTS.copper.odds,
      silver: cfg.CHESTS.silver.odds,
      gold: cfg.CHESTS.gold.odds,
      obsidian: cfg.CHESTS.obsidian.odds
    } : {
      copper: { common: 0.80, rare: 0.17, epic: 0.03, legendary: 0.00 },
      silver: { common: 0.55, rare: 0.33, epic: 0.11, legendary: 0.01 },
      gold: { common: 0.25, rare: 0.45, epic: 0.25, legendary: 0.05 },
      obsidian: { common: 0.00, rare: 0.40, epic: 0.45, legendary: 0.15 }
    };
    const odds = { ...CHEST_ODDS[tier] };
    const pLeg = dData.pity.withoutLegendary || 0;
    const pEpic = dData.pity.withoutEpic || 0;
    if (pLeg >= 59 && tier !== 'copper') return 'legendary';
    if (pLeg >= 35 && tier !== 'copper') {
      odds.legendary = Math.min(0.90, odds.legendary + (pLeg - 34) * 0.015);
    }
    if (pEpic >= 9) {
      if (odds.legendary > 0) { odds.epic = 1.0 - odds.legendary; odds.rare = 0; odds.common = 0; }
      else { odds.epic = 1.0; odds.rare = 0; odds.common = 0; }
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
      if (typeof rpc === 'function') rpc('profile.set', { frame: item.val }).catch(() => {});
      toast('🖼️ ¡Marco equipado y sincronizado!');
    } else if (item.type === 'color') {
      localStorage.setItem('epickast.equipped_color', item.val);
      if (S.me) S.me.color = item.val;
      if (typeof rpc === 'function') rpc('profile.set', { color: item.val }).catch(() => {});
      toast('🎨 ¡Color de perfil equipado!');
    } else if (item.type === 'banner') {
      localStorage.setItem('epickast.equipped_banner', item.val);
      if (S.me) S.me.banner = item.val;
      if (typeof rpc === 'function') rpc('profile.set', { banner: item.val }).catch(() => {});
      toast('🏷️ ¡Banner equipado!');
    } else if (item.type === 'title') {
      localStorage.setItem('epickast.equipped_title', item.val);
      if (S.me) S.me.title = item.val;
      if (typeof rpc === 'function') rpc('profile.set', { title: item.val }).catch(() => {});
      toast('👑 ¡Título equipado!');
    } else if (item.type === 'nameplate') {
      localStorage.setItem('epickast.equipped_nameplate', item.val);
      if (S.me) S.me.nameplate = item.val;
      if (typeof rpc === 'function') rpc('profile.set', { nameplate: item.val }).catch(() => {});
      toast('🏷️ ¡Placa de nombre equipada!');
    } else if (item.type === 'profile_fx') {
      localStorage.setItem('epickast.equipped_profile_fx', item.val);
      if (S.me) S.me.profile_fx = item.val;
      if (typeof rpc === 'function') rpc('profile.set', { profile_fx: item.val }).catch(() => {});
      toast('✨ ¡Efecto de perfil Nitro activado!');
    }
    render();
    renderView();
    if (activeTab === 'collection') renderCosmeticsGrid();
  };

  // Previsualizador en vivo estilo Nitro
  const openCosmeticLivePreviewModal = (item) => {
    const prevWrap = document.createElement('div');
    prevWrap.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(6px);';

    const box = document.createElement('div');
    box.style.cssText = 'background:#0f131d;border:1.5px solid #283247;border-radius:14px;padding:24px;width:92%;max-width:440px;box-shadow:0 16px 40px rgba(0,0,0,0.8);color:#fff;font-family:system-ui,-apple-system,sans-serif;position:relative;overflow:hidden;';

    const eqFrame = (item.type === 'frame' ? item.val : localStorage.getItem('epickast.equipped_frame')) || S.me?.frame;
    const eqBanner = (item.type === 'banner' ? item.val : localStorage.getItem('epickast.equipped_banner')) || S.me?.banner || 'linear-gradient(135deg, #1e1b4b, #4338ca)';
    const eqColor = (item.type === 'color' ? item.val : localStorage.getItem('epickast.equipped_color')) || S.me?.color || '#38bdf8';
    const eqTitle = (item.type === 'title' ? item.val : localStorage.getItem('epickast.equipped_title')) || S.me?.title || 'Aspirante del Núcleo';
    const eqPlate = (item.type === 'nameplate' ? item.val : localStorage.getItem('epickast.equipped_nameplate')) || S.me?.nameplate || '';
    const activeFx = (item.type === 'profile_fx' ? item.val : localStorage.getItem('epickast.equipped_profile_fx')) || S.me?.profile_fx || '';

    const frameCls = eqFrame === 'founder_blue' ? 'frame-founder' : (eqFrame ? ' ' + eqFrame : '');
    const isAnimatedBanner = String(eqBanner).includes('linear-gradient') && item.type === 'banner' && item.rarity === 'legendary';

    box.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #1e2638;padding-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">👁️</span>
          <b style="font-size:14px;letter-spacing:0.3px;">Vista Previa de Perfil Nitro</b>
        </div>
        <button id="closePreviewBtn" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;font-weight:900;">✕</button>
      </div>

      <div style="position:relative;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.12);background:#0b0e14;box-shadow:0 8px 24px rgba(0,0,0,0.5);">
        <!-- Banner con efecto de partículas si aplica -->
        <div class="preview-banner-box \${isAnimatedBanner ? 'banner-animated' : ''}" style="height:90px;background:\${eqBanner};background-size:cover;position:relative;">
          <canvas id="prevFxCanvas" width="390" height="90" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
        </div>

        <div style="padding:16px;position:relative;margin-top:-38px;">
          <div style="display:flex;align-items:flex-end;gap:12px;margin-bottom:10px;">
            <div class="avatar \${frameCls}" style="width:64px;height:64px;font-size:24px;background:#1e293b;border:3px solid #0f131d;border-radius:50%;display:grid;place-items:center;font-weight:900;box-shadow:0 4px 12px rgba(0,0,0,0.6);flex-shrink:0;">
              \${(S.me?.name || 'Tú').slice(0, 2).toUpperCase()}
            </div>
            <div style="min-width:0;">
              <div class="\${eqPlate ? ('plate-' + eqPlate.replace(/_/g, '-')) : ''}" style="padding:3px 8px;border-radius:6px;display:inline-block;">
                <span style="font-size:15px;font-weight:900;\${nameColorStyle(eqColor)}">\${S.me?.name || 'EpicKap'}</span>
              </div>
              <div style="margin-top:2px;">
                \${titleBadgeEl(eqTitle, 'pill')?.outerHTML || ''}
              </div>
            </div>
          </div>

          <div style="font-size:11.5px;color:#cbd5e1;line-height:1.4;background:#141926;border:1px solid #1e2638;border-radius:8px;padding:8px 12px;margin-top:8px;">
            <b style="color:#fbbf24;">\${item.name}</b> · <span style="color:\${RARITY_COLORS[item.rarity] || '#94a3b8'};text-transform:uppercase;font-size:10px;font-weight:800;">\${item.rarity}</span>
            <p style="margin:4px 0 0 0;font-size:11px;color:#94a3b8;">\${item.desc || ''}</p>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
        <button id="closePreviewBtn2" style="background:#1e2638;border:1px solid #2d3748;color:#cbd5e1;padding:7px 16px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">Cerrar</button>
        <button id="equipFromPreviewBtn" style="background:#10b981;border:none;color:#fff;padding:7px 18px;border-radius:6px;font-weight:900;font-size:12px;cursor:pointer;box-shadow:0 2px 10px rgba(16,185,129,0.4);">✓ Equipar en mi Perfil</button>
      </div>
    \`;

    prevWrap.appendChild(box);
    document.body.appendChild(prevWrap);

    let fxRaf = null;
    const cvs = box.querySelector('#prevFxCanvas');
    if (cvs && activeFx) {
      const ctx = cvs.getContext('2d');
      const parts = [];
      const count = activeFx === 'fx_snow' ? 24 : activeFx === 'fx_embers' ? 20 : 16;
      for (let i = 0; i < count; i++) {
        parts.push({
          x: Math.random() * cvs.width,
          y: Math.random() * cvs.height,
          r: Math.random() * 2 + 1,
          vx: activeFx === 'fx_snow' ? (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * 0.4,
          vy: activeFx === 'fx_snow' ? Math.random() * 0.9 + 0.4 : activeFx === 'fx_embers' ? -(Math.random() * 1.2 + 0.5) : (Math.random() - 0.5) * 0.6,
          alpha: Math.random() * 0.7 + 0.3
        });
      }
      const loop = () => {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        parts.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          if (activeFx === 'fx_snow' && p.y > cvs.height) { p.y = -5; p.x = Math.random() * cvs.width; }
          if (activeFx === 'fx_embers' && p.y < -5) { p.y = cvs.height + 5; p.x = Math.random() * cvs.width; }
          if (activeFx === 'fx_void') {
            if (p.x < 0 || p.x > cvs.width) p.vx *= -1;
            if (p.y < 0 || p.y > cvs.height) p.vy *= -1;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          if (activeFx === 'fx_snow') ctx.fillStyle = 'rgba(255,255,255,' + p.alpha + ')';
          else if (activeFx === 'fx_embers') ctx.fillStyle = 'rgba(251,146,60,' + p.alpha + ')';
          else ctx.fillStyle = 'rgba(192,132,252,' + p.alpha + ')';
          ctx.fill();
        });
        fxRaf = requestAnimationFrame(loop);
      };
      fxRaf = requestAnimationFrame(loop);
    }

    const closeMe = () => {
      if (fxRaf) cancelAnimationFrame(fxRaf);
      if (prevWrap.parentNode) prevWrap.parentNode.removeChild(prevWrap);
    };

    box.querySelector('#closePreviewBtn').onclick = closeMe;
    box.querySelector('#closePreviewBtn2').onclick = closeMe;
    box.querySelector('#equipFromPreviewBtn').onclick = () => {
      equipCosmeticItem(item);
      closeMe();
    };
  };

  // Modal explicativo de probabilidades nominales y sintonía
  const openProbabilitiesModal = () => {
    const oddsWrap = document.createElement('div');
    oddsWrap.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);';

    const oddsBox = document.createElement('div');
    oddsBox.style.cssText = 'background:#111622;border:1.5px solid #283247;border-radius:12px;padding:22px;max-width:540px;width:92%;box-shadow:0 12px 36px rgba(0,0,0,0.8);color:#fff;font-family:system-ui,-apple-system,sans-serif;';

    const pEpic = dData.pity.withoutEpic || 0;
    const pLeg = dData.pity.withoutLegendary || 0;

    oddsBox.innerHTML = \`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #1e2638;padding-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">ⓘ</span>
          <b style="font-size:15px;">Probabilidades Nominales y Sistema de Sintonía</b>
        </div>
        <button id="closeOddsBtn" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;font-weight:900;">✕</button>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:14px;text-align:center;">
        <thead>
          <tr style="background:#182030;color:#94a3b8;">
            <th style="padding:6px;text-align:left;">Cofre</th>
            <th>Común</th>
            <th>Raro</th>
            <th>Épico</th>
            <th>Legendario</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #1c2333;">
            <td style="padding:7px;text-align:left;color:#d97706;font-weight:800;">🟤 Cobre</td>
            <td>80%</td><td>17%</td><td>3%</td><td style="color:#64748b;">0%</td>
          </tr>
          <tr style="border-bottom:1px solid #1c2333;">
            <td style="padding:7px;text-align:left;color:#cbd5e1;font-weight:800;">⚪ Plata</td>
            <td>55%</td><td>33%</td><td>11%</td><td>1%</td>
          </tr>
          <tr style="border-bottom:1px solid #1c2333;">
            <td style="padding:7px;text-align:left;color:#fbbf24;font-weight:800;">🟡 Oro</td>
            <td>25%</td><td>45%</td><td>25%</td><td>5%</td>
          </tr>
          <tr>
            <td style="padding:7px;text-align:left;color:#c084fc;font-weight:800;">🟣 Obsidiana</td>
            <td style="color:#64748b;">0%</td><td>40%</td><td>45%</td><td>15%</td>
          </tr>
        </tbody>
      </table>

      <div style="background:#0b0e14;border:1px solid #1e2638;border-radius:8px;padding:12px;margin-bottom:12px;font-size:12px;line-height:1.45;">
        <div style="color:#38bdf8;font-weight:800;margin-bottom:4px;">🛡️ Tus Contadores de Protección Anti-Mala Suerte en Vivo:</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:6px 10px;background:#141926;border-radius:6px;">
          <span>Garantía Épica:</span>
          <b style="color:#a855f7;">\${pEpic}/10</b>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;padding:6px 10px;background:#141926;border-radius:6px;">
          <span>Sintonía Legendaria:</span>
          <b style="color:#fbbf24;">\${pLeg}/60</b>
        </div>
        <ul style="margin:8px 0 0 16px;padding:0;color:#94a3b8;font-size:11px;">
          <li><b>Garantía Épica (10 tiradas):</b> si pasan 9 aperturas sin Épico ni Legendario, la tirada 10 es asegurada calidad Épica o superior.</li>
          <li><b>Sintonía Progresiva Legendaria (35+ tiradas):</b> desde la apertura 35 sin Legendario, la probabilidad base sube un +1.5% extra en cada apertura.</li>
          <li><b>Garantía Absoluta Legendaria (60 tiradas):</b> si llegas a 59 tiradas sin Legendario, la tirada 60 garantiza un Legendario 100% asegurado en cofres de Plata, Oro u Obsidiana.</li>
          <li><i>Nota:</i> los cofres de Cobre nunca otorgan Legendarios ni acumulan sintonía legendaria.</li>
        </ul>
      </div>

      <div style="text-align:right;">
        <button id="closeOddsBtn2" style="background:#2563eb;color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-weight:800;font-size:12px;">Entendido</button>
      </div>
    \`;

    oddsWrap.appendChild(oddsBox);
    document.body.appendChild(oddsWrap);

    const closeMe = () => { if (oddsWrap.parentNode) oddsWrap.parentNode.removeChild(oddsWrap); };
    oddsBox.querySelector('#closeOddsBtn').onclick = closeMe;
    oddsBox.querySelector('#closeOddsBtn2').onclick = closeMe;
  };

  const closeVaultOrModal = () => {
    if (activeDojoInstance && activeDojoInstance.hasActiveMatch && activeDojoInstance.hasActiveMatch()) {
      if (!confirm('¿Salir? Perderás esta partida (sin recompensas)')) return;
    }
    if (activeRacerInstance && activeRacerInstance.hasActiveMatch && activeRacerInstance.hasActiveMatch()) {
      if (!confirm('¿Salir? Perderás esta partida (sin recompensas)')) return;
    }
    if (activeDojoInstance) { try { activeDojoInstance.destroy(); } catch {} activeDojoInstance = null; }
    if (activeRacerInstance) { try { activeRacerInstance.destroy(); } catch {} activeRacerInstance = null; }
    if (window.__EK && typeof window.__EK.disposeVaultScopes === 'function') {
      window.__EK.disposeVaultScopes();
    }
    m.classList.add('hidden');
    m.replaceChildren();
  };

  const wrap = document.createElement('div');
  wrap.className = 'vault-modal-body';
  wrap.style.cssText = 'box-sizing:border-box;width:96%;max-width:960px;max-height:90vh;overflow-y:auto;background:var(--bg-panel, #0f131d);border:1px solid var(--border, rgba(255,255,255,0.08));border-radius:12px;padding:20px;box-shadow:0 12px 36px rgba(0,0,0,0.7);font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;margin:auto;position:relative;';

  const renderView = () => {
    if (activeRacerInstance && activeTab !== 'racer') {
      try { activeRacerInstance.destroy(); } catch {}
      activeRacerInstance = null;
    }
    if (activeDojoInstance && activeTab !== 'dojo') {
      try { activeDojoInstance.destroy(); } catch {}
      activeDojoInstance = null;
    }

    wrap.innerHTML = '';
    const totalCosmetics = PROFILE_COSMETICS.length;
    const unlockedCount = Object.keys(dData.cosmetics || {}).filter(k => dData.cosmetics[k]).length + (dData.founderFrameUnlocked ? 1 : 0);
    const pctUnlocked = Math.round((unlockedCount / Math.max(1, totalCosmetics)) * 100);

    const renderTabIco = (key) => {
      if (window.EKSprites && window.EKSprites.renderSpriteHtml) {
        return window.EKSprites.renderSpriteHtml(key, 15);
      }
      return '⭐';
    };

    wrap.innerHTML = \`
      <!-- Cabecera de la Bóveda -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e2638;padding-bottom:14px;margin-bottom:14px;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <span style="font-size:24px;">🏛️</span>
          <div style="min-width:0;">
            <h2 style="font-size:15px;font-weight:900;color:#f8fafc;margin:0;letter-spacing:0.5px;font-family:'Press Start 2P','Courier New',monospace;white-space:nowrap;">BÓVEDA DE RELIQUIAS · v\${currentVer}</h2>
            <p style="font-size:11.5px;color:#94a3b8;margin:3px 0 0 0;white-space:nowrap;">Economía Compartida · Cosméticos, Dojo Elemental y Turbo Core</p>
          </div>
        </div>

        <!-- 5 Pestañas Modulares con Sprites Pixel-Art -->
        <div style="display:flex;background:#0b0e14;padding:3px;border-radius:8px;border:1px solid #1a2233;gap:4px;margin-left:auto;flex-wrap:wrap;">
          <button id="vTabBtnRoulette" style="background:\${activeTab==='roulette'?'#1e2638':'transparent'};color:\${activeTab==='roulette'?'#fff':'#94a3b8'};border:\${activeTab==='roulette'?'1px solid #3b82f6':'1px solid transparent'};padding:6px 11px;border-radius:6px;cursor:pointer;font-weight:700;font-size:11.5px;display:flex;align-items:center;gap:6px;transition:0.15s;">
            \${renderTabIco('tab_roulette')} <span>Ruleta y Cofres</span>
          </button>
          <button id="vTabBtnCollection" style="background:\${activeTab==='collection'?'#1e2638':'transparent'};color:\${activeTab==='collection'?'#fff':'#94a3b8'};border:\${activeTab==='collection'?'1px solid #3b82f6':'1px solid transparent'};padding:6px 11px;border-radius:6px;cursor:pointer;font-weight:700;font-size:11.5px;display:flex;align-items:center;gap:6px;transition:0.15s;">
            \${renderTabIco('tab_armory')} <span>Mi Armario (\${unlockedCount}/\${totalCosmetics})</span>
          </button>
          <button id="vTabBtnDojo" style="background:\${activeTab==='dojo'?'#1e2638':'transparent'};color:\${activeTab==='dojo'?'#fff':'#94a3b8'};border:\${activeTab==='dojo'?'1px solid #3b82f6':'1px solid transparent'};padding:6px 11px;border-radius:6px;cursor:pointer;font-weight:700;font-size:11.5px;display:flex;align-items:center;gap:6px;transition:0.15s;">
            \${renderTabIco('tab_dojo')} <span>Dojo Elemental</span>
          </button>
          <button id="vTabBtnRacer" style="background:\${activeTab==='racer'?'#1e2638':'transparent'};color:\${activeTab==='racer'?'#fff':'#94a3b8'};border:\${activeTab==='racer'?'1px solid #3b82f6':'1px solid transparent'};padding:6px 11px;border-radius:6px;cursor:pointer;font-weight:700;font-size:11.5px;display:flex;align-items:center;gap:6px;transition:0.15s;">
            \${renderTabIco('tab_racer')} <span>Turbo Core</span>
          </button>
          <button id="vTabBtnNinja" style="background:\${activeTab==='ninja'?'#1e2638':'transparent'};color:\${activeTab==='ninja'?'#fff':'#94a3b8'};border:\${activeTab==='ninja'?'1px solid #3b82f6':'1px solid transparent'};padding:6px 11px;border-radius:6px;cursor:pointer;font-weight:700;font-size:11.5px;display:flex;align-items:center;gap:6px;transition:0.15s;">
            \${renderTabIco('tab_ninja')} <span>Mi Ninja</span>
          </button>
        </div>

        <!-- Botón de Cerrar formal -->
        <button id="vCloseBtn" style="background:#1e2638;border:1px solid #3b4660;color:#f8fafc;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:800;transition:0.15s;flex-shrink:0;" title="Cerrar Bóveda (o presiona ESC)">✕ Cerrar</button>
      </div>

      <!-- Barra de Recursos y Llaves con Tienda Ilimitada -->
      <div style="background:#131826;border:1px solid #1f273b;border-radius:10px;padding:10px 16px;margin-bottom:14px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;gap:14px;align-items:center;font-size:12.5px;">
            <span style="display:inline-flex;align-items:center;gap:5px;">\${renderTabIco('coin')} <b>\${(dData.coins || 0).toLocaleString()}</b> Monedas</span>
            <span style="color:#334155;">|</span>
            <span style="display:inline-flex;align-items:center;gap:5px;">\${renderTabIco('essence')} <b id="vDustCount">\${dData.dust || 0}</b> Esencia Arcana</span>
            <span style="color:#334155;">|</span>
            <span style="display:inline-flex;align-items:center;gap:5px;color:#94a3b8;">\${renderTabIco('pity_star')} Sintonía: <b style="color:#fbbf24;">\${dData.pity.withoutLegendary || 0}/60</b></span>
          </div>

          <div style="display:flex;gap:8px;align-items:center;">
            <button id="vBtnProbabilities" style="background:#1e2638;color:#94a3b8;border:1px solid #2d3748;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11.5px;font-weight:700;display:flex;align-items:center;gap:4px;" title="Ver tabla de probabilidades y sintonía">
              <span>ⓘ</span> Probabilidades
            </button>
            <button id="vBtnOpenKeyShop" style="background:linear-gradient(135deg, #2563eb, #1d4ed8);color:#fff;border:none;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:11.5px;font-weight:800;box-shadow:0 2px 8px rgba(37,99,235,0.4);display:flex;align-items:center;gap:6px;">
              \${renderTabIco('shop_cart')} <span>Comprar Llaves con Monedas</span>
            </button>
          </div>
        </div>

        <!-- Inventario de Llaves en Posesión con Siluetas Unificadas -->
        <div style="display:flex;justify-content:space-between;align-items:center;background:#090d14;border:1px solid #161e2e;border-radius:6px;padding:6px 14px;font-size:11.5px;flex-wrap:wrap;gap:8px;">
          <div style="font-weight:800;color:#94a3b8;display:flex;align-items:center;gap:6px;">
            <span>🗝️</span> TUS LLAVES DISPONIBLES:
          </div>
          <div style="display:flex;gap:14px;align-items:center;font-weight:800;">
            <span style="color:#d97706;display:inline-flex;align-items:center;gap:4px;">\${renderTabIco('key_copper')} Cobre: <b style="color:#fff;">\${dData.keys.copper || 0}</b></span>
            <span style="color:#cbd5e1;display:inline-flex;align-items:center;gap:4px;">\${renderTabIco('key_silver')} Plata: <b style="color:#fff;">\${dData.keys.silver || 0}</b></span>
            <span style="color:#fbbf24;display:inline-flex;align-items:center;gap:4px;">\${renderTabIco('key_gold')} Oro: <b style="color:#fff;">\${dData.keys.gold || 0}</b></span>
            <span style="color:#c084fc;display:inline-flex;align-items:center;gap:4px;">\${renderTabIco('key_obsidian')} Obsidiana: <b style="color:#fff;">\${dData.keys.obsidian || 0}</b></span>
          </div>
        </div>
      </div>

      <!-- VISTA 1: RULETA Y COFRES -->
      <div id="vViewRoulette" style="display:\${activeTab==='roulette'?'flex':'none'};flex-direction:column;gap:12px;">
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;">
          \${['copper','silver','gold','obsidian'].map(tier => {
            const count = dData.keys[tier] || 0;
            const isSel = selectedTier === tier;
            const names = { copper: 'Cobre', silver: 'Plata', gold: 'Oro', obsidian: 'Obsidiana' };
            const keySprite = 'key_' + tier;
            const color = { copper: '#d97706', silver: '#cbd5e1', gold: '#fbbf24', obsidian: '#a855f7' }[tier];
            return \`
              <button class="vTabBtn" data-tier="\${tier}" style="background:\${isSel ? '#1a2233' : '#111622'};border:1.5px solid \${isSel ? color : '#20283a'};border-radius:8px;padding:8px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:0.15s;">
                <span>\${renderTabIco(keySprite)}</span>
                <span style="font-size:12px;font-weight:800;color:\${isSel ? '#fff' : '#94a3b8'};">\${names[tier]}</span>
                <span style="font-size:10px;font-weight:700;color:\${color};">\${count} Llaves</span>
              </button>
            \`;
          }).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;padding:0 4px;">
          <span>Probabilidades Nominales: Común \${Math.round((cfg.CHESTS?.[selectedTier]?.odds?.common || 0)*100)}% · Raro \${Math.round((cfg.CHESTS?.[selectedTier]?.odds?.rare || 0)*100)}% · Épico \${Math.round((cfg.CHESTS?.[selectedTier]?.odds?.epic || 0)*100)}% · Legendario \${Math.round((cfg.CHESTS?.[selectedTier]?.odds?.legendary || 0)*100)}%</span>
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;user-select:none;">
            <input type="checkbox" id="vChkSkipAnim" \${localStorage.getItem('epickast.skip_chest_anim')==='1'?'checked':''} style="cursor:pointer;" />
            <span style="color:#cbd5e1;">Saltar animación</span>
          </label>
        </div>

        <!-- Visor de la Ruleta Honesta -->
        <div style="position:relative;background:#090d14;border:1px solid #1a2233;border-radius:8px;height:120px;overflow:hidden;box-shadow:inset 0 0 20px rgba(0,0,0,0.8);">
          <div style="position:absolute;top:0;bottom:0;left:50%;width:2px;background:#38bdf8;z-index:10;transform:translateX(-50%);box-shadow:0 0 8px #38bdf8;">
            <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #38bdf8;"></div>
          </div>
          <div id="vTrack" style="display:flex;height:100%;align-items:center;position:absolute;left:0;top:0;will-change:transform;"></div>
        </div>

        <!-- Botones de Acción de Apertura -->
        <div style="display:flex;justify-content:center;gap:12px;margin-top:6px;">
          \${(dData.keys[selectedTier] || 0) > 0 ? \`
            <button id="vBtnSpin" style="background:linear-gradient(135deg, #2563eb, #1d4ed8);color:#fff;border:1px solid #3b82f6;font-size:13px;font-weight:900;padding:11px 32px;border-radius:8px;cursor:pointer;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(37,99,235,0.4);display:flex;align-items:center;gap:8px;transition:0.15s;">
              <span>🔓</span>
              <span>ABRIR COFRE (\${dData.keys[selectedTier] || 0} Llave\${(dData.keys[selectedTier]||0)>1?'s':''})</span>
            </button>
          \` : \`
            <button id="vBtnSpin" style="background:#1a2233;color:#fbbf24;border:1.5px solid #d97706;font-size:13px;font-weight:900;padding:11px 28px;border-radius:8px;cursor:pointer;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(217,119,6,0.25);display:flex;align-items:center;gap:8px;transition:0.15s;">
              <span>🛒</span>
              <span>COMPRAR 1 LLAVE (\${(KEY_PRICES[selectedTier]||250).toLocaleString()} 🪙) Y ABRIR</span>
            </button>
          \`}
        </div>

        <!-- Notificación de Ganador -->
        \${lastSpinResult ? \`
          <div id="vWinnerArea" style="margin-top:12px;padding:14px 18px;background:\${lastSpinResult.isDuplicate ? '#161426' : '#0a1d15'};border:2px solid \${lastSpinResult.isDuplicate ? '#a855f7' : '#10b981'};border-radius:10px;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,0.6);animation:cjCardFlipIn 0.3s ease;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div style="font-size:11px;font-weight:900;letter-spacing:0.8px;padding:3px 10px;border-radius:6px;background:\${lastSpinResult.isDuplicate ? 'rgba(168,85,247,0.2)' : 'rgba(16,185,129,0.2)'};color:\${lastSpinResult.isDuplicate ? '#c084fc' : '#34d399'};border:1px solid \${lastSpinResult.isDuplicate ? '#a855f7' : '#10b981'};">
                \${lastSpinResult.isDuplicate ? '♻️ [ COSMÉTICO REPETIDO · YA EN TU COLECCIÓN ]' : '🎉 [ ¡NUEVO COSMÉTICO DESBLOQUEADO! ]'}
              </div>
              <button id="vBtnCloseWinnerNotice" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:13px;padding:2px 6px;" title="Cerrar aviso">✕</button>
            </div>
            
            <div style="font-size:16px;font-weight:900;color:#fff;margin:6px 0;display:flex;align-items:center;justify-content:center;gap:8px;">
              \${lastSpinResult.previewHtml} <span>\${lastSpinResult.winner.name}</span>
              <span style="font-size:10.5px;font-weight:800;color:\${RARITY_COLORS[lastSpinResult.winner.rarity]};text-transform:uppercase;background:rgba(0,0,0,0.5);padding:2px 8px;border-radius:4px;border:1px solid \${RARITY_COLORS[lastSpinResult.winner.rarity]};">
                \${lastSpinResult.winner.rarity}
              </span>
            </div>

            <div style="font-size:12px;color:#cbd5e1;margin-bottom:8px;">
              \${lastSpinResult.winner.desc || ''}
            </div>

            \${lastSpinResult.isDuplicate ? \`
              <div style="font-size:12px;color:#e9d5ff;font-weight:800;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.4);border-radius:6px;padding:6px 14px;display:inline-block;margin-bottom:4px;">
                ✨ Duplicado convertido automáticamente en <b>+\${lastSpinResult.dustAward} Esencia Arcana</b> (Saldo: \${dData.dust} Esencia)
              </div>
            \` : \`
              <div style="display:flex;justify-content:center;gap:12px;align-items:center;margin-top:8px;">
                <button id="vBtnEquipWinner" style="background:#10b981;border:none;color:#fff;font-weight:900;font-size:12px;padding:8px 22px;border-radius:6px;cursor:pointer;box-shadow:0 2px 10px rgba(16,185,129,0.4);">
                  ✨ EQUIPAR EN MI PERFIL AHORA
                </button>
                <button id="vBtnPreviewWinner" style="background:#1e2638;border:1px solid #3b82f6;color:#93c5fd;font-weight:800;font-size:12px;padding:8px 16px;border-radius:6px;cursor:pointer;">
                  👁️ Probar en Perfil
                </button>
              </div>
            \`}
          </div>
        \` : \`
          <div id="vWinnerArea" style="display:none;"></div>
        \`}
      </div>

      <!-- VISTA 2: MI ARMARIO Y COLECCIÓN DISCRETA -->
      <div id="vViewCollection" style="display:\${activeTab==='collection'?'flex':'none'};flex-direction:column;gap:12px;">
        <!-- Banner del Set del Coloso -->
        \${(() => {
          const colosoItems = ['frame_colossus_legend', 'banner_colossus_awakening', 'title_colossus_slayer', 'plate_colossus'];
          const ownedColoso = colosoItems.filter(id => !!(dData.cosmetics && dData.cosmetics[id])).length;
          const isComplete = ownedColoso >= 4;
          return \`
            <div style="background:linear-gradient(135deg, rgba(69,10,10,0.5), rgba(24,24,27,0.8));border:1.5px solid \${isComplete ? '#fbbf24' : '#ef4444'};border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
              <div>
                <b style="color:\${isComplete ? '#fbbf24' : '#f87171'};font-size:13px;">\${isComplete ? '⚡ Set del Coloso (4/4 COMPLETADO)' : '🛡️ Set del Coloso (' + ownedColoso + '/4 Desbloqueados)'}</b>
                <p style="margin:2px 0 0 0;font-size:11px;color:#94a3b8;">Marco Núcleo + Banner Despertar + Título Coloso Caído + Placa del Coloso</p>
              </div>
              <span style="font-size:11px;font-weight:800;background:\${isComplete ? '#fbbf24' : '#222838'};color:\${isComplete ? '#000' : '#cbd5e1'};padding:3px 10px;border-radius:4px;">
                \${isComplete ? '✓ Conquistador del Coloso' : ownedColoso + ' de 4 obtenidos'}
              </span>
            </div>
          \`;
        })()}

        <!-- Barra de Filtros por Categoría y Rareza -->
        <div style="display:flex;flex-direction:column;gap:8px;background:#131826;padding:10px 12px;border-radius:8px;border:1px solid #1f273b;">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              \${[
                ['all', 'Todos (' + totalCosmetics + ')'],
                ['frame', '🖼️ Marcos'],
                ['banner', '🏷️ Banners'],
                ['color', '🎨 Colores'],
                ['title', '👑 Títulos'],
                ['nameplate', '📛 Placas'],
                ['profile_fx', '✨ Efectos Nitro']
              ].map(([k, lbl]) => \`
                <button class="vFilterBtn" data-filter="\${k}" style="background:\${activeFilter===k?'#2563eb':'transparent'};color:\${activeFilter===k?'#fff':'#94a3b8'};border:\${activeFilter===k?'1px solid #3b82f6':'1px solid transparent'};padding:4px 10px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;">\${lbl}</button>
              \`).join('')}
            </div>

            <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:#94a3b8;">
              <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" id="vChkNewestFirst" \${sortNewestFirst ? 'checked' : ''} style="cursor:pointer;" />
                <span>Nuevos primero</span>
              </label>
              <span>Colección: <b style="color:#e2e8f0;">\${unlockedCount} / \${totalCosmetics}</b> (\${pctUnlocked}%)</span>
              <div style="width:60px;height:5px;background:#1a2233;border-radius:3px;overflow:hidden;">
                <div style="width:\${pctUnlocked}%;height:100%;background:#38bdf8;"></div>
              </div>
            </div>
          </div>

          <!-- Filtro secundario por rareza -->
          <div style="display:flex;gap:4px;align-items:center;border-top:1px solid #1c2333;padding-top:6px;font-size:11px;">
            <span style="color:#64748b;font-weight:700;margin-right:4px;">Rareza:</span>
            \${[
              ['all', 'Todas'],
              ['common', 'Común'],
              ['rare', 'Raro'],
              ['epic', 'Épico'],
              ['legendary', 'Legendario']
            ].map(([rKey, rLbl]) => \`
              <button class="vRarityFilterBtn" data-rarity="\${rKey}" style="background:\${activeRarityFilter===rKey?'#1e2638':'transparent'};color:\${activeRarityFilter===rKey?(RARITY_COLORS[rKey]||'#fff'):'#64748b'};border:\${activeRarityFilter===rKey?'1px solid #3b4660':'1px solid transparent'};padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10.5px;font-weight:700;">\${rLbl}</button>
            \`).join('')}
          </div>
        </div>

        <!-- Cuadrícula Sobria y Ordenada -->
        <div id="vCosmeticsGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(230px, 1fr));gap:10px;width:100%;box-sizing:border-box;"></div>
      </div>

      <!-- VISTA 3: DOJO ELEMENTAL -->
      <div id="vViewDojo" style="display:\${activeTab==='dojo'?'block':'none'};width:100%;"></div>

      <!-- VISTA 4: TURBO CORE -->
      <div id="vViewRacer" style="display:\${activeTab==='racer'?'block':'none'};width:100%;"></div>

      <!-- VISTA 5: PERSONALIZACIÓN NINJA -->
      <div id="vViewNinja" style="display:\${activeTab==='ninja'?'block':'none'};width:100%;"></div>
    \`;

    // Eventos de Pestañas
    const bindTab = (id, tabName, mountFn) => {
      const btn = wrap.querySelector(id);
      if (btn) {
        btn.onclick = () => {
          if (isSpinning) return;
          if (activeDojoInstance && activeDojoInstance.hasActiveMatch && activeDojoInstance.hasActiveMatch()) {
            if (!confirm('¿Salir? Perderás esta partida (sin recompensas)')) return;
          }
          if (activeRacerInstance && activeRacerInstance.hasActiveMatch && activeRacerInstance.hasActiveMatch()) {
            if (!confirm('¿Salir? Perderás esta partida (sin recompensas)')) return;
          }
          activeTab = tabName;
          renderView();
          if (mountFn) mountFn();
        };
      }
    };

    bindTab('#vTabBtnRoulette', 'roulette', populatePreview);
    bindTab('#vTabBtnCollection', 'collection', renderCosmeticsGrid);
    bindTab('#vTabBtnDojo', 'dojo', mountDojo);
    bindTab('#vTabBtnRacer', 'racer', mountRacer);
    bindTab('#vTabBtnNinja', 'ninja', mountNinja);

    const closeBtn = wrap.querySelector('#vCloseBtn');
    if (closeBtn) closeBtn.onclick = closeVaultOrModal;

    const probBtn = wrap.querySelector('#vBtnProbabilities');
    if (probBtn) probBtn.onclick = openProbabilitiesModal;

    const chkSkip = wrap.querySelector('#vChkSkipAnim');
    if (chkSkip) {
      chkSkip.onchange = () => {
        localStorage.setItem('epickast.skip_chest_anim', chkSkip.checked ? '1' : '0');
      };
    }

    const chkNewest = wrap.querySelector('#vChkNewestFirst');
    if (chkNewest) {
      chkNewest.onchange = () => {
        sortNewestFirst = chkNewest.checked;
        renderCosmeticsGrid();
      };
    }

    // Filtros de categoría y rareza
    wrap.querySelectorAll('.vFilterBtn').forEach(b => {
      b.onclick = () => {
        activeFilter = b.dataset.filter;
        renderView();
        renderCosmeticsGrid();
      };
    });

    wrap.querySelectorAll('.vRarityFilterBtn').forEach(b => {
      b.onclick = () => {
        activeRarityFilter = b.dataset.rarity;
        renderView();
        renderCosmeticsGrid();
      };
    });

    // Pestañas de nivel de cofre
    wrap.querySelectorAll('.vTabBtn').forEach(b => {
      b.onclick = () => {
        if (isSpinning) return;
        selectedTier = b.dataset.tier;
        renderView();
        populatePreview();
      };
    });

    // Botón de tienda de llaves
    const btnShop = wrap.querySelector('#vBtnOpenKeyShop');
    if (btnShop) btnShop.onclick = openKeyShopModal;

    // Botón de giro de ruleta
    const spinBtn = wrap.querySelector('#vBtnSpin');
    if (spinBtn) {
      spinBtn.onclick = () => {
        if (isSpinning) return;
        if ((dData.keys[selectedTier] || 0) > 0) {
          executeRouletteSpin();
        } else {
          const price = KEY_PRICES[selectedTier] || 250;
          if ((dData.coins || 0) < price) {
            toast(\`🪙 Necesitas \${price.toLocaleString()} Monedas para esta llave. ¡Gánalas en el Dojo o Turbo Core!\`);
            if (typeof ringer !== 'undefined') ringer.beep([330, 260], 0.08, 0.15);
            return;
          }
          dData.coins -= price;
          dData.keys[selectedTier] = (dData.keys[selectedTier] || 0) + 1;
          saveState();
          if (typeof ringer !== 'undefined') ringer.beep([587, 880], 0.06, 0.12);
          toast(\`🔑 ¡1 Llave de \${selectedTier.toUpperCase()} comprada!\`);
          executeRouletteSpin();
        }
      };
    }

    const btnCloseNotice = wrap.querySelector('#vBtnCloseWinnerNotice');
    if (btnCloseNotice) {
      btnCloseNotice.onclick = () => {
        lastSpinResult = null;
        renderView();
        populatePreview();
      };
    }

    const equipBtn = wrap.querySelector('#vBtnEquipWinner');
    if (equipBtn && lastSpinResult && !lastSpinResult.isDuplicate) {
      equipBtn.onclick = () => {
        equipCosmeticItem(lastSpinResult.winner);
        equipBtn.textContent = '✓ ¡Equipado en tu perfil!';
        equipBtn.style.background = '#047857';
      };
    }

    const prevWinnerBtn = wrap.querySelector('#vBtnPreviewWinner');
    if (prevWinnerBtn && lastSpinResult && !lastSpinResult.isDuplicate) {
      prevWinnerBtn.onclick = () => {
        openCosmeticLivePreviewModal(lastSpinResult.winner);
      };
    }

    if (window.__EK && typeof window.__EK.assertNoBadText === 'function') {
      window.__EK.assertNoBadText(wrap);
    }
  };

  const openKeyShopModal = () => {
    const modalWrap = document.createElement('div');
    modalWrap.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);';

    const shopBox = document.createElement('div');
    shopBox.style.cssText = 'background:#111520;border:1.5px solid #2d3748;border-radius:12px;padding:22px;max-width:540px;width:92%;box-shadow:0 12px 36px rgba(0,0,0,0.8);color:#fff;font-family:system-ui,-apple-system,sans-serif;';

    const renderShop = () => {
      shopBox.innerHTML = \`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid #222938;padding-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">🛒</span>
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:900;">Tienda de Llaves del Núcleo</h3>
              <p style="margin:2px 0 0 0;font-size:11.5px;color:#94a3b8;">Canjea tus monedas sin límite diario para abrir cofres en la Bóveda</p>
            </div>
          </div>
          <button id="closeShopBtn" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;font-weight:900;">✕</button>
        </div>

        <div style="background:#090d14;border:1px solid #1a2233;border-radius:8px;padding:8px 14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:#94a3b8;">Tus Monedas acumuladas:</span>
          <span style="font-size:14px;font-weight:900;color:#fbbf24;">🪙 \${(dData.coins || 0).toLocaleString()}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          \${['copper','silver','gold','obsidian'].map(tier => {
            const names = { copper: 'Cobre', silver: 'Plata', gold: 'Oro', obsidian: 'Obsidiana' };
            const icons = { copper: '🟤', silver: '⚪', gold: '🟡', obsidian: '🟣' };
            const singlePrice = KEY_PRICES[tier];
            const packPrice = Math.round(singlePrice * 5 * KEY_PACK_DISCOUNT);
            return \`
              <div style="background:#161c28;border:1px solid #252e42;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <b style="font-size:13px;">\${icons[tier]} Llave de \${names[tier]}</b>
                  <span style="font-size:11px;color:#94a3b8;">Tienes: <b>\${dData.keys[tier] || 0}</b></span>
                </div>
                <div style="display:flex;gap:6px;">
                  <button class="shopBuy1Btn" data-tier="\${tier}" style="flex:1;background:#2563eb;color:#fff;border:none;padding:6px;border-radius:5px;font-weight:800;font-size:11px;cursor:pointer;">
                    1x (\${singlePrice.toLocaleString()} 🪙)
                  </button>
                  <button class="shopBuy5Btn" data-tier="\${tier}" style="flex:1;background:#059669;color:#fff;border:none;padding:6px;border-radius:5px;font-weight:800;font-size:11px;cursor:pointer;" title="10% de descuento">
                    5x (\${packPrice.toLocaleString()} 🪙)
                  </button>
                </div>
              </div>
            \`;
          }).join('')}
        </div>
      \`;

      shopBox.querySelector('#closeShopBtn').onclick = () => {
        document.body.removeChild(modalWrap);
        renderView();
        populatePreview();
      };

      shopBox.querySelectorAll('.shopBuy1Btn').forEach(b => {
        b.onclick = () => {
          const tier = b.dataset.tier;
          const price = KEY_PRICES[tier];
          if ((dData.coins || 0) < price) return toast('Monedas insuficientes');
          dData.coins -= price;
          dData.keys[tier] = (dData.keys[tier] || 0) + 1;
          saveState();
          ringer.beep([587, 880], 0.06, 0.12);
          toast(\`🔑 ¡Compraste 1 Llave de \${tier.toUpperCase()}!\`);
          renderShop();
        };
      });

      shopBox.querySelectorAll('.shopBuy5Btn').forEach(b => {
        b.onclick = () => {
          const tier = b.dataset.tier;
          const price = Math.round(KEY_PRICES[tier] * 5 * KEY_PACK_DISCOUNT);
          if ((dData.coins || 0) < price) return toast('Monedas insuficientes para pack de 5');
          dData.coins -= price;
          dData.keys[tier] = (dData.keys[tier] || 0) + 5;
          saveState();
          ringer.beep([659, 987, 1318], 0.06, 0.16);
          toast(\`🔑 ¡Compraste 5 Llaves de \${tier.toUpperCase()} con 10% dto!\`);
          renderShop();
        };
      });
    };

    renderShop();
    modalWrap.appendChild(shopBox);
    document.body.appendChild(modalWrap);
  };

  const populatePreview = () => {
    const track = wrap.querySelector('#vTrack');
    if (!track) return;
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    // Ruleta honesta: generar cartas del strip ponderadas según el cofre seleccionado
    const sample = [];
    for (let i = 0; i < 20; i++) {
      const rar = cfg.rollNominalRarity ? cfg.rollNominalRarity(selectedTier) : 'common';
      const pool = PROFILE_COSMETICS.filter(c => c.rarity === rar);
      sample.push(pool[Math.floor(Math.random() * pool.length)] || PROFILE_COSMETICS[0]);
    }

    track.innerHTML = sample.map(item => {
      const rColor = RARITY_COLORS[item.rarity] || '#60a5fa';
      let visualPreview = '';
      if (item.type === 'frame') {
        visualPreview = '<div style="width:28px;height:28px;border-radius:50%;border:2px solid ' + rColor + ';display:grid;place-items:center;font-size:9.5px;font-weight:900;color:' + rColor + ';margin:2px 0;">★</div>';
      } else if (item.type === 'color') {
        visualPreview = \`<div style="width:20px;height:20px;border-radius:50%;background:\${item.val};margin:2px 0;"></div>\`;
      } else if (item.type === 'title') {
        visualPreview = \`<div style="font-size:9px;font-weight:700;color:\${rColor};padding:2px 5px;border-radius:3px;background:rgba(255,255,255,0.06);border:1px solid \${rColor};margin:4px 0;">👑 Título</div>\`;
      } else if (item.type === 'nameplate') {
        visualPreview = \`<div style="font-size:8px;font-weight:800;color:\${rColor};border:1px solid \${rColor};border-radius:3px;padding:2px 4px;margin:3px 0;">📛 PLACA</div>\`;
      } else if (item.type === 'profile_fx') {
        visualPreview = \`<div style="font-size:8px;font-weight:800;color:\${rColor};background:rgba(168,85,247,0.2);border:1px solid \${rColor};border-radius:3px;padding:2px 4px;margin:3px 0;">✨ EFECTO</div>\`;
      } else {
        visualPreview = \`<div style="width:56px;height:14px;border-radius:3px;background:\${item.val};border:1px solid rgba(255,255,255,0.2);margin:4px 0;"></div>\`;
      }

      return \`
        <div style="width:100px;height:95px;flex-shrink:0;background:#141822;border:1px solid #242b3b;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;box-sizing:border-box;margin:0 2px;">
          <span style="font-size:8.5px;font-weight:800;color:\${rColor};text-transform:uppercase;">\${item.rarity.toUpperCase()}</span>
          \${visualPreview}
          <span style="font-size:9.5px;font-weight:700;color:#cbd5e1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:92%;">\${item.name}</span>
        </div>
      \`;
    }).join('');
  };

  const executeRouletteSpin = () => {
    if (isSpinning) return;
    if ((dData.keys[selectedTier] || 0) <= 0) {
      toast(\`Necesitas 1 llave de \${selectedTier.toUpperCase()} para abrir este cofre\`);
      return;
    }
    dData.keys[selectedTier] -= 1;
    saveState();
    isSpinning = true;
    lastSpinResult = null;

    wrap.querySelectorAll('button').forEach(b => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
    });

    const prevWinner = wrap.querySelector('#vWinnerArea');
    if (prevWinner) { prevWinner.style.display = 'none'; prevWinner.innerHTML = ''; }
    const trk = wrap.querySelector('#vTrack');
    if (trk) { trk.style.transition = 'none'; trk.style.transform = 'translateX(0px)'; trk.offsetHeight; }

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

    const cardWidth = 100;
    const totalCards = 45;
    const winnerIndex = 36;
    const cards = [];

    // Tira honesta ponderada por el cofre seleccionado (sin cartas ilegales)
    for (let i = 0; i < totalCards; i++) {
      if (i === winnerIndex) {
        cards.push(winner);
      } else {
        const r = cfg.rollNominalRarity ? cfg.rollNominalRarity(selectedTier) : 'common';
        const p = PROFILE_COSMETICS.filter(c => c.rarity === r);
        cards.push(p[Math.floor(Math.random() * p.length)] || PROFILE_COSMETICS[0]);
      }
    }

    const track = wrap.querySelector('#vTrack');
    if (!track) { isSpinning = false; return; }

    track.innerHTML = cards.map(item => {
      const rColor = RARITY_COLORS[item.rarity] || '#60a5fa';
      let visualPreview = '';
      if (item.type === 'frame') {
        visualPreview = '<div style="width:28px;height:28px;border-radius:50%;border:2px solid ' + rColor + ';display:grid;place-items:center;font-size:9.5px;font-weight:900;color:' + rColor + ';margin:2px 0;">★</div>';
      } else if (item.type === 'color') {
        visualPreview = \`<div style="width:20px;height:20px;border-radius:50%;background:\${item.val};margin:2px 0;"></div>\`;
      } else if (item.type === 'title') {
        visualPreview = \`<div style="font-size:9px;font-weight:700;color:\${rColor};padding:2px 5px;border-radius:3px;background:rgba(255,255,255,0.06);border:1px solid \${rColor};margin:4px 0;">👑 Título</div>\`;
      } else if (item.type === 'nameplate') {
        visualPreview = \`<div style="font-size:8px;font-weight:800;color:\${rColor};border:1px solid \${rColor};border-radius:3px;padding:2px 4px;margin:3px 0;">📛 PLACA</div>\`;
      } else if (item.type === 'profile_fx') {
        visualPreview = \`<div style="font-size:8px;font-weight:800;color:\${rColor};background:rgba(168,85,247,0.2);border:1px solid \${rColor};border-radius:3px;padding:2px 4px;margin:3px 0;">✨ EFECTO</div>\`;
      } else {
        visualPreview = \`<div style="width:56px;height:14px;border-radius:3px;background:\${item.val};border:1px solid rgba(255,255,255,0.2);margin:4px 0;"></div>\`;
      }

      return \`
        <div style="width:\${cardWidth}px;height:95px;flex-shrink:0;background:#141822;border:1px solid #242b3b;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;box-sizing:border-box;margin:0 2px;">
          <span style="font-size:8.5px;font-weight:800;color:\${rColor};text-transform:uppercase;">\${item.rarity.toUpperCase()}</span>
          \${visualPreview}
          <span style="font-size:9.5px;font-weight:700;color:#cbd5e1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:92%;">\${item.name}</span>
        </div>
      \`;
    }).join('');

    const skipAnim = localStorage.getItem('epickast.skip_chest_anim') === '1';
    const viewportWidth = 720;
    const targetOffset = (winnerIndex * cardWidth) - (viewportWidth / 2) + (cardWidth / 2) + (Math.random() * 24 - 12);
    const duration = skipAnim ? 100 : 3600;

    let tickInt = null;
    if (!skipAnim && typeof ringer !== 'undefined' && ringer.beep) {
      const startTime = Date.now();
      let lastTick = -1;
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

    track.style.transition = skipAnim ? 'none' : \`transform \${duration}ms cubic-bezier(0.12, 0.8, 0.33, 1)\`;
    track.style.transform = \`translateX(-\${targetOffset}px)\`;

    setTimeout(() => {
      if (tickInt) clearInterval(tickInt);
      isSpinning = false;

      if (!isDuplicate) {
        if (!dData.cosmetics) dData.cosmetics = {};
        dData.cosmetics[winner.id] = true;
        if (winner.id === 'founder_frame') dData.founderFrameUnlocked = true;
      } else {
        const dustAward = DUST_DUPLICATE[winner.rarity] || 5;
        dData.dust = (dData.dust || 0) + dustAward;
      }

      saveState();

      if (typeof ringer !== 'undefined') {
        if (winner.rarity === 'legendary') ringer.beep([523, 659, 784, 1046, 1318], 0.08, 0.2);
        else if (winner.rarity === 'epic') ringer.beep([523, 659, 784, 1046], 0.07, 0.16);
        else ringer.beep([523, 659, 784], 0.06, 0.12);
      }

      wrap.querySelectorAll('button').forEach(b => {
        b.disabled = false;
        b.style.pointerEvents = '';
      });

      const currentUnlocked = Object.keys(dData.cosmetics || {}).filter(k => dData.cosmetics[k]).length + (dData.founderFrameUnlocked ? 1 : 0);
      const dustAward = isDuplicate ? (DUST_DUPLICATE[winner.rarity] || 5) : 0;

      let previewHtml = '';
      if (winner.type === 'color') {
        previewHtml = \`<div style="display:inline-block;width:24px;height:24px;border-radius:50%;background:\${winner.val};vertical-align:middle;box-shadow:0 0 8px \${winner.val};"></div>\`;
      } else if (winner.type === 'banner') {
        previewHtml = \`<div style="display:inline-block;width:65px;height:22px;border-radius:4px;background:\${winner.val};border:1px solid rgba(255,255,255,0.3);vertical-align:middle;"></div>\`;
      } else if (winner.type === 'title') {
        previewHtml = '<span style="font-size:20px;vertical-align:middle;">👑</span>';
      } else if (winner.type === 'nameplate') {
        previewHtml = '<span style="font-size:18px;vertical-align:middle;">📛</span>';
      } else if (winner.type === 'profile_fx') {
        previewHtml = '<span style="font-size:18px;vertical-align:middle;">✨</span>';
      } else {
        previewHtml = '<span style="font-size:20px;vertical-align:middle;">⭐</span>';
      }

      lastSpinResult = {
        winner,
        isDuplicate,
        dustAward,
        unlockedCount: currentUnlocked,
        previewHtml
      };

      renderView();
      populatePreview();
    }, duration + 100);
  };

  const renderCosmeticsGrid = () => {
    const grid = wrap.querySelector('#vCosmeticsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const eqFrame = localStorage.getItem('epickast.equipped_frame');
    const eqColor = localStorage.getItem('epickast.equipped_color') || S.me?.color;
    const eqBanner = localStorage.getItem('epickast.equipped_banner') || S.me?.banner;
    const eqTitle = localStorage.getItem('epickast.equipped_title') || S.me?.title;
    const eqPlate = localStorage.getItem('epickast.equipped_nameplate') || S.me?.nameplate;
    const eqFx = localStorage.getItem('epickast.equipped_profile_fx') || S.me?.profile_fx;

    const rarityRank = { legendary: 4, epic: 3, rare: 2, common: 1 };
    let filtered = PROFILE_COSMETICS.filter(c => {
      const matchType = activeFilter === 'all' || c.type === activeFilter;
      const matchRarity = activeRarityFilter === 'all' || c.rarity === activeRarityFilter;
      return matchType && matchRarity;
    });

    filtered.sort((a, b) => {
      if (sortNewestFirst) {
        const isAUnl = !!(dData.cosmetics && dData.cosmetics[a.id]);
        const isBUnl = !!(dData.cosmetics && dData.cosmetics[b.id]);
        if (isAUnl !== isBUnl) return isAUnl ? -1 : 1;
      }
      return (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0);
    });

    filtered.forEach(c => {
      const isUnlocked = !!(dData.cosmetics && dData.cosmetics[c.id]) || (c.id === 'founder_frame' && dData.founderFrameUnlocked);
      const isEquipped = (c.type === 'frame' && eqFrame === c.val) ||
                         (c.type === 'color' && eqColor === c.val) ||
                         (c.type === 'banner' && eqBanner === c.val) ||
                         (c.type === 'title' && eqTitle === c.val) ||
                         (c.type === 'nameplate' && eqPlate === c.val) ||
                         (c.type === 'profile_fx' && eqFx === c.val);

      const rColor = RARITY_COLORS[c.rarity] || '#60a5fa';
      const craftCost = DUST_CRAFT[c.rarity] || 40;
      const canCraft = !isUnlocked && (dData.dust || 0) >= craftCost;

      const card = document.createElement('div');
      card.className = \`rarity-card-\${c.rarity}\`;
      card.style.cssText = \`box-sizing:border-box;background:#141824;border:1px solid \${isEquipped ? '#10b981' : '#222838'};border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;position:relative;\`;

      let preview = '';
      if (c.type === 'frame') {
        const frameCls = c.val === 'founder_blue' ? 'frame-founder' : c.val;
        preview = \`
          <div style="display:flex;align-items:center;gap:10px;background:#0d1017;padding:6px 10px;border-radius:6px;border:1px solid #1a202c;">
            <div class="avatar \${frameCls}" style="width:36px;height:36px;font-size:14px;background:#2563eb;flex-shrink:0;">EK</div>
            <div style="font-size:10.5px;color:#94a3b8;font-weight:700;">Vista previa en avatar</div>
          </div>
        \`;
      } else if (c.type === 'color') {
        preview = \`
          <div style="display:flex;align-items:center;gap:8px;background:#0d1017;padding:6px 10px;border-radius:6px;border:1px solid #1a202c;">
            <span style="width:16px;height:16px;border-radius:50%;background:\${c.val};flex-shrink:0;"></span>
            <span style="font-size:11.5px;font-weight:800;\${nameColorStyle(c.val)}">@\${S.me?.name || 'Usuario'}</span>
          </div>
        \`;
      } else if (c.type === 'title') {
        const isLegend = c.rarity === 'legendary';
        preview = \`
          <div style="display:flex;align-items:center;justify-content:center;background:#0d1017;padding:6px;border-radius:6px;border:1px solid #1a202c;">
            <div class="user-title-badge \${isLegend ? 'legendary' : ''}" style="font-size:10.5px;padding:2px 8px;">👑 \${c.val}</div>
          </div>
        \`;
      } else if (c.type === 'nameplate') {
        preview = \`
          <div style="display:flex;align-items:center;justify-content:center;background:#0d1017;padding:6px;border-radius:6px;border:1px solid #1a202c;">
            <div class="plate-\${c.val.replace(/_/g, '-')}" style="padding:3px 10px;border-radius:6px;font-size:11.5px;font-weight:800;">
              @\${S.me?.name || 'Usuario'}
            </div>
          </div>
        \`;
      } else if (c.type === 'profile_fx') {
        preview = \`
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(168,85,247,0.1);padding:6px;border-radius:6px;border:1px solid rgba(168,85,247,0.3);">
            <span style="font-size:15px;">✨</span>
            <span style="font-size:11px;font-weight:800;color:#c084fc;">Efecto Nitro Animado</span>
          </div>
        \`;
      } else {
        preview = \`
          <div style="height:28px;border-radius:5px;background:\${c.val};border:1px solid rgba(255,255,255,0.15);"></div>
        \`;
      }

      let actionHtml = '';
      if (isEquipped) {
        actionHtml = '<button style="width:100%;background:#0f291e;border:1px solid rgba(16,185,129,0.3);color:#6ee7b7;font-size:11px;font-weight:800;padding:6px;border-radius:5px;cursor:default;">✓ Equipado en Perfil</button>';
      } else if (isUnlocked) {
        actionHtml = \`
          <div style="display:flex;gap:4px;">
            <button class="vEqBtn" style="flex:1;background:#2563eb;border:1px solid #3b82f6;color:#fff;font-size:11px;font-weight:800;padding:6px;border-radius:5px;cursor:pointer;">Equipar</button>
            <button class="vPrevBtn" style="background:#1e2638;border:1px solid #3b4660;color:#cbd5e1;font-size:11px;padding:6px 10px;border-radius:5px;cursor:pointer;" title="Probar en perfil">👁️</button>
          </div>
        \`;
      } else if (canCraft) {
        actionHtml = \`
          <div style="display:flex;gap:4px;">
            <button class="vCraftBtn" style="flex:1;background:#2a2040;border:1px solid rgba(124,58,237,0.3);color:#c4b5fd;font-size:11px;font-weight:800;padding:6px;border-radius:5px;cursor:pointer;" title="Fabricar permanente">🔨 Fabricar (\${craftCost} ✨)</button>
            <button class="vPrevBtn" style="background:#1e2638;border:1px solid #3b4660;color:#cbd5e1;font-size:11px;padding:6px 10px;border-radius:5px;cursor:pointer;" title="Probar en perfil">👁️</button>
          </div>
        \`;
      } else {
        actionHtml = \`
          <div style="display:flex;gap:4px;">
            <button disabled style="flex:1;background:#151922;border:1px solid #202634;color:#64748b;font-size:10.5px;font-weight:700;padding:6px;border-radius:5px;cursor:not-allowed;">🔒 Bloqueado (\${craftCost} ✨)</button>
            <button class="vPrevBtn" style="background:#1e2638;border:1px solid #3b4660;color:#cbd5e1;font-size:11px;padding:6px 10px;border-radius:5px;cursor:pointer;" title="Probar en perfil">👁️</button>
          </div>
        \`;
      }

      card.innerHTML = \`
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:9px;font-weight:800;color:\${rColor};text-transform:uppercase;">● \${c.rarity.toUpperCase()} · \${c.type.toUpperCase()}</span>
          \${isEquipped ? '<span style="font-size:9.5px;color:#10b981;font-weight:800;">ACTIVO</span>' : (isUnlocked ? '<span style="font-size:9px;color:#38bdf8;font-weight:800;">EN POSESIÓN</span>' : '')}
        </div>
        <div style="font-size:12px;font-weight:800;color:#f1f5f9;line-height:1.2;">\${c.name}</div>
        \${preview}
        <div style="font-size:10px;color:#94a3b8;line-height:1.3;min-height:24px;">\${c.desc || ''}</div>
        <div style="margin-top:auto;padding-top:2px;">
          \${actionHtml}
        </div>
      \`;

      const eqBtn = card.querySelector('.vEqBtn');
      if (eqBtn) eqBtn.onclick = () => equipCosmeticItem(c);

      const prevBtn = card.querySelector('.vPrevBtn');
      if (prevBtn) prevBtn.onclick = () => openCosmeticLivePreviewModal(c);

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
          toast(\`✨ ¡Has fabricado: \${c.name}!\`);
          equipCosmeticItem(c);
        };
      }

      grid.appendChild(card);
    });
  };

  const mountDojo = () => {
    const dojoContainer = wrap.querySelector('#vViewDojo');
    if (!dojoContainer) return;
    if (window.CardJitsuGame) {
      if (activeDojoInstance) { try { activeDojoInstance.destroy(); } catch {} }
      activeDojoInstance = new window.CardJitsuGame(dojoContainer, {
        playerName: S.me?.name || 'Tú',
        onReward: (reward) => {
          if (reward.coins) dData.coins = (dData.coins || 0) + reward.coins;
          if (reward.keys) {
            if (reward.keys.copper) dData.keys.copper = (dData.keys.copper || 0) + reward.keys.copper;
            if (reward.keys.silver) dData.keys.silver = (dData.keys.silver || 0) + reward.keys.silver;
            if (reward.keys.gold) dData.keys.gold = (dData.keys.gold || 0) + reward.keys.gold;
            if (reward.keys.obsidian) dData.keys.obsidian = (dData.keys.obsidian || 0) + reward.keys.obsidian;
          }
          saveState();
          toast(\`🎁 ¡Recompensas añadidas a tu Bóveda (+ \${reward.coins} 🪙)!\`);
        }
      });
    } else {
      dojoContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Cargando Dojo Elemental...</div>';
    }
  };

  const mountRacer = () => {
    const racerContainer = wrap.querySelector('#vViewRacer');
    if (!racerContainer) return;
    if (window.CoreRacerGame) {
      if (activeRacerInstance) { try { activeRacerInstance.destroy(); } catch {} }
      activeRacerInstance = new window.CoreRacerGame(racerContainer, {
        playerName: S.me?.name || 'Tú',
        getCoins: () => dData.coins || 0,
        spendCoins: (amt) => {
          if ((dData.coins || 0) < amt) {
            toast('🪙 Monedas insuficientes para esta mejora');
            return false;
          }
          dData.coins -= amt;
          saveState();
          toast(\`🔧 ¡Mejora instalada en tu Hover-Kart (-\${amt} 🪙)!\`);
          return true;
        },
        onReward: (reward) => {
          if (reward.coins) dData.coins = (dData.coins || 0) + reward.coins;
          if (reward.keys) {
            if (reward.keys.copper) dData.keys.copper = (dData.keys.copper || 0) + reward.keys.copper;
            if (reward.keys.silver) dData.keys.silver = (dData.keys.silver || 0) + reward.keys.silver;
            if (reward.keys.gold) dData.keys.gold = (dData.keys.gold || 0) + reward.keys.gold;
            if (reward.keys.obsidian) dData.keys.obsidian = (dData.keys.obsidian || 0) + reward.keys.obsidian;
          }
          saveState();
          toast(\`🏎️ ¡Botín de carrera acreditado (+\${reward.coins} 🪙)!\`);
        }
      });
    } else {
      racerContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Cargando Turbo Core...</div>';
    }
  };

  const mountNinja = () => {
    const ninjaContainer = wrap.querySelector('#vViewNinja');
    if (!ninjaContainer) return;
    if (window.CardJitsuGame && window.CardJitsuGame.renderNinjaCustomizer) {
      window.CardJitsuGame.renderNinjaCustomizer(ninjaContainer, () => {
        saveState();
        activeTab = 'dojo';
        renderView();
        mountDojo();
      });
    } else {
      ninjaContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;">Cargando Estudio Ninja...</div>';
    }
  };

  m.appendChild(wrap);
  renderView();
  if (activeTab === 'ninja') mountNinja();
  else if (activeTab === 'racer') mountRacer();
  else if (activeTab === 'dojo') mountDojo();
  else if (activeTab === 'collection') renderCosmeticsGrid();
  else populatePreview();
}

`;

code = code.slice(0, idxStart) + newModalVaultCode + code.slice(idxEnd);
console.log('modalVault updated successfully');

fs.writeFileSync(filePath, code, 'utf8');
console.log('File written, new length:', code.length);
