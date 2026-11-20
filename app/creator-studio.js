/**
 * EpicKast v2.0.0 — Sistema de Creador y Estudio Completo (Vista tipo Servidor)
 * Permite crear y eliminar banners, colores de usuario y bordes de perfil (incluidos los existentes),
 * personalizar cartas del Dojo, gestionar rangos de Creador y configurar el filtro de moderación de imágenes.
 */
'use strict';

(function (global) {
  const KEYS = {
    creators: 'epickast.creators.v1',
    rewards: 'epickast.creator_rewards.v1',
    hidden: 'epickast.creator_hidden.v1',
    dojoCards: 'epickast.creator_dojo_cards.v1'
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const EKCreatorSystem = {
    isMasterCreator(u) {
      if (!u) return false;
      const n = String(u.name || '').trim().toLowerCase();
      return n === 'epickap' || Number(u.id) === 1;
    },

    getGrantedCreators() {
      const list = readJson(KEYS.creators, []);
      return Array.isArray(list) ? list : [];
    },

    setCreatorRole(userObj, grant = true) {
      if (!userObj) return this.getGrantedCreators();
      let list = this.getGrantedCreators();
      const uid = Number(userObj.id);
      const uname = String(userObj.name || '').trim();
      list = list.filter((c) => (uid ? Number(c.id) !== uid : true) && String(c.name || '').toLowerCase() !== uname.toLowerCase());
      if (grant && uname) list.push({ id: uid || Date.now(), name: uname, grantedAt: Date.now() });
      writeJson(KEYS.creators, list);
      return list;
    },

    isCreator(u) {
      if (!u) return false;
      if (this.isMasterCreator(u)) return true;
      const n = String(u.name || '').trim().toLowerCase();
      return this.getGrantedCreators().some((c) => (u.id && Number(c.id) === Number(u.id)) || (n && String(c.name || '').toLowerCase() === n));
    },

    getCustomRewards() {
      const list = readJson(KEYS.rewards, []);
      return Array.isArray(list) ? list : [];
    },

    saveCustomReward(item) {
      const list = this.getCustomRewards().filter((x) => x.id !== item.id);
      list.unshift(item);
      writeJson(KEYS.rewards, list);
      this.injectCustomFramesCss();
      return list;
    },

    deleteCustomReward(id) {
      const list = this.getCustomRewards().filter((x) => x.id !== id);
      writeJson(KEYS.rewards, list);
      this.injectCustomFramesCss();
      return list;
    },

    getHiddenIds() {
      const list = readJson(KEYS.hidden, []);
      return Array.isArray(list) ? list : [];
    },

    isHidden(id) {
      return this.getHiddenIds().includes(String(id));
    },

    hideBuiltinItem(id) {
      const s = String(id);
      const list = this.getHiddenIds().filter((x) => x !== s);
      list.push(s);
      writeJson(KEYS.hidden, list);
      return list;
    },

    restoreBuiltinItem(id) {
      const s = String(id);
      const list = this.getHiddenIds().filter((x) => x !== s);
      writeJson(KEYS.hidden, list);
      return list;
    },

    restoreAllBuiltins() {
      writeJson(KEYS.hidden, []);
      return [];
    },

    getActiveCosmetics() {
      const hidden = new Set(this.getHiddenIds());
      const custom = this.getCustomRewards().filter((x) => !hidden.has(String(x.id)));
      const builtin = (global.EKGameConfig?.COSMETICS || []).filter((x) => !hidden.has(String(x.id)));
      return [...custom, ...builtin];
    },

    getActiveProfileBannerPresets() {
      const hidden = new Set(this.getHiddenIds());
      const customBanners = this.getCustomRewards()
        .filter((x) => x.type === 'banner' && !hidden.has(String(x.id)))
        .map((x) => ({
          id: x.id,
          name: x.name,
          category: 'creator',
          badge: 'CREADOR',
          value: x.val
        }));
      const studioPresets = (global.EKProfileStudio?.BANNER_PRESETS || [])
        .filter((x) => !hidden.has(String(x.id)));
      return [...customBanners, ...studioPresets];
    },

    getCustomDojoCards() {
      const map = readJson(KEYS.dojoCards, {});
      return map && typeof map === 'object' ? map : {};
    },

    saveCustomDojoCard(cardNo, data) {
      const map = this.getCustomDojoCards();
      map[String(cardNo)] = data;
      writeJson(KEYS.dojoCards, map);
      return map;
    },

    injectCustomFramesCss() {
      if (typeof document === 'undefined') return;
      const customFrames = this.getCustomRewards().filter((x) => x.type === 'frame' && x.frameStyle);
      let styleEl = document.getElementById('ek-custom-frames-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'ek-custom-frames-css';
        document.head.appendChild(styleEl);
      }
      const rules = [];
      for (const f of customFrames) {
        const cls = String(f.val || '').replace(/[^a-zA-Z0-9_-]/g, '');
        if (!cls) continue;
        const st = f.frameStyle || {};
        const c1 = st.borderColor || '#a855f7';
        const c2 = st.glowColor || c1;
        const c3 = st.secondaryColor || '#38bdf8';
        const width = Math.max(1, Math.min(4, Number(st.thickness) || 2));
        const anim = st.animation || 'pulse';
        const kfName = `ekFrameAnim_${cls.replace(/-/g, '_')}`;

        if (anim === 'pulse') {
          rules.push(`@keyframes ${kfName}{0%,100%{box-shadow:0 0 0 ${width}px ${c1},0 0 10px ${c2}aa;}50%{box-shadow:0 0 0 ${width + 1}px ${c1},0 0 20px ${c2};}}`);
        } else if (anim === 'dual') {
          rules.push(`@keyframes ${kfName}{0%,100%{border-color:${c1};box-shadow:0 0 0 ${width}px ${c1},0 0 14px ${c2};}50%{border-color:${c3};box-shadow:0 0 0 ${width + 0.5}px ${c3},0 0 16px ${c3};}}`);
        } else if (anim === 'rainbow') {
          rules.push(`@keyframes ${kfName}{0%{border-color:#f43f5e;box-shadow:0 0 0 ${width}px #f43f5e,0 0 14px #f43f5eaa;}33%{border-color:#fbbf24;box-shadow:0 0 0 ${width}px #fbbf24,0 0 14px #fbbf24aa;}66%{border-color:#38bdf8;box-shadow:0 0 0 ${width}px #38bdf8,0 0 14px #38bdf8aa;}100%{border-color:#f43f5e;box-shadow:0 0 0 ${width}px #f43f5e,0 0 14px #f43f5eaa;}}`);
        }

        const animCss = anim === 'none' ? '' : `animation:${kfName} ${anim === 'rainbow' ? '3.4s' : '2.2s'} infinite ease-in-out;`;
        rules.push(`.avatar.${cls},.av.${cls}{border:${width}px solid ${c1} !important;box-shadow:0 0 0 ${width}px ${c1},0 0 14px ${c2}cc !important;${animCss}}`);
      }
      styleEl.textContent = rules.join('\n');
    },

    exportServerCatalog() {
      return {
        customRewards: this.getCustomRewards(),
        hiddenIds: this.getHiddenIds(),
        grantedCreators: this.getGrantedCreators(),
        moderation: global.EKImageModeration?.getConfig?.() || { enabled: true, level: 'balanced' }
      };
    },

    applyServerCatalog(payload) {
      if (!payload || typeof payload !== 'object') return;
      if (Array.isArray(payload.customRewards)) writeJson(KEYS.rewards, payload.customRewards);
      if (Array.isArray(payload.hiddenIds)) writeJson(KEYS.hidden, payload.hiddenIds);
      if (Array.isArray(payload.grantedCreators)) writeJson(KEYS.creators, payload.grantedCreators);
      if (payload.moderation && global.EKImageModeration?.setConfig) {
        global.EKImageModeration.setConfig(payload.moderation);
      }
      this.injectCustomFramesCss();
    }
  };

  global.EKCreatorSystem = EKCreatorSystem;
  EKCreatorSystem.injectCustomFramesCss();

  const CHANNELS = [
    { key: 'banners', name: '🖼️-banners', title: 'Crear y eliminar banners de perfil y Bóveda' },
    { key: 'colores', name: '🎨-colores-de-usuario', title: 'Crear y eliminar colores y estilos de nombre' },
    { key: 'bordes', name: '✨-bordes-de-perfil', title: 'Crear y eliminar bordes y marcos de avatar' },
    { key: 'dojo', name: '🎴-cartas-del-dojo', title: 'Personalizar cartas del Dojo Elemental' },
    { key: 'moderacion', name: '🛡️-moderacion-y-rangos', title: 'Filtro de normas de la comunidad y rango Creador' }
  ];

  const RARITY_BADGE = {
    legendary: { label: 'LEGENDARIO', bg: 'rgba(251,191,36,0.2)', border: '#fbbf24', color: '#fde047' },
    epic: { label: 'ÉPICO', bg: 'rgba(168,85,247,0.2)', border: '#a855f7', color: '#e9d5ff' },
    rare: { label: 'RARO', bg: 'rgba(59,130,246,0.2)', border: '#3b82f6', color: '#bfdbfe' },
    common: { label: 'COMÚN', bg: 'rgba(148,163,184,0.2)', border: '#94a3b8', color: '#e2e8f0' }
  };

  function unlockInLocalVault(itemId) {
    try {
      const raw = localStorage.getItem('epickast.dungeon.v1');
      const d = raw ? JSON.parse(raw) : {};
      if (!d.cosmetics) d.cosmetics = {};
      d.cosmetics[itemId] = true;
      localStorage.setItem('epickast.dungeon.v1', JSON.stringify(d));
    } catch {}
  }

  function renderCreatorPage(chKey, ctx) {
    const { me, toast, syncServerCatalog, rerender, nameColorStyle, bannerCss } = ctx || {};
    const container = document.createElement('div');
    container.className = 'creator-page';
    container.style.cssText = 'padding:22px 28px;overflow-y:auto;height:100%;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;';

    if (!EKCreatorSystem.isCreator(me)) {
      container.innerHTML = `
        <div style="max-width:560px;margin:48px auto;text-align:center;background:#131826;border:1px solid #ef4444;border-radius:14px;padding:28px;">
          <div style="font-size:38px;margin-bottom:8px;">🔒</div>
          <h2 style="margin:0 0 8px;color:#fff;font-size:18px;">Acceso Exclusivo de Creadores</h2>
          <p style="margin:0;color:#94a3b8;font-size:13px;">Esta página tipo servidor está reservada para <b>EpicKap</b> y usuarios con el rango <b>🎨 Creador</b>.</p>
        </div>
      `;
      return container;
    }

    const doSync = () => {
      if (typeof syncServerCatalog === 'function') syncServerCatalog();
    };
    const refresh = () => {
      doSync();
      if (typeof rerender === 'function') rerender();
    };

    const hiddenSet = new Set(EKCreatorSystem.getHiddenIds());
    const customList = EKCreatorSystem.getCustomRewards();
    const builtinCosmetics = global.EKGameConfig?.COSMETICS || [];
    const studioBanners = global.EKProfileStudio?.BANNER_PRESETS || [];

    // =========================================================================
    // CANAL 1: BANNERS (Crear por imagen o degradado + Borrar/Restaurar todos)
    // =========================================================================
    if (chKey === 'banners') {
      const customBanners = customList.filter((x) => x.type === 'banner');
      const vaultBanners = builtinCosmetics.filter((x) => x.type === 'banner' && !hiddenSet.has(x.id));
      const profileBanners = studioBanners.filter((x) => !hiddenSet.has(x.id));
      const hiddenBanners = [
        ...builtinCosmetics.filter((x) => x.type === 'banner' && hiddenSet.has(x.id)).map((x) => ({ id: x.id, name: x.name, src: 'Bóveda' })),
        ...studioBanners.filter((x) => hiddenSet.has(x.id)).map((x) => ({ id: x.id, name: x.name, src: 'Estudio Perfil' }))
      ];

      container.innerHTML = `
        <div style="max-width:1060px;margin:0 auto;display:flex;flex-direction:column;gap:18px;">
          <div style="background:linear-gradient(135deg,rgba(147,51,234,0.22),rgba(59,130,246,0.16));border:1.5px solid #8b5cf6;border-radius:14px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="font-size:18px;font-weight:900;color:#fff;display:flex;align-items:center;gap:8px;">
                <span>🖼️ Gestión Total de Banners</span>
                <span style="background:#7c3aed;color:#fff;font-size:10px;padding:3px 9px;border-radius:999px;">${customBanners.length + vaultBanners.length + profileBanners.length} ACTIVOS</span>
              </div>
              <p style="margin:4px 0 0;font-size:12.5px;color:#cbd5e1;">Crea nuevos banners (imagen, GIF o degradado Pro) y elimina cualquiera de los banners existentes del catálogo.</p>
            </div>
          </div>

          <!-- Formulario Crear Banner -->
          <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:14px;font-weight:900;color:#fbbf24;">➕ Crear Nuevo Banner</div>
              <div style="display:flex;gap:6px;">
                <button type="button" id="csBanModeImg" class="cs-pill on" style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid #6366f1;background:#312e81;color:#fff;font-size:12px;font-weight:800;cursor:pointer;">📁 Subir Imagen / GIF</button>
                <button type="button" id="csBanModeGrad" class="cs-pill" style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid #334155;background:#0b0f1a;color:#cbd5e1;font-size:12px;font-weight:800;cursor:pointer;">🌈 Crear Degradado</button>
              </div>
              <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Nombre del Banner
                <input id="csBanName" type="text" placeholder="Ej: Horizonte Cyberpunk / Samurai Neón..." style="margin-top:4px;width:100%;box-sizing:border-box;background:#090d16;border:1px solid #334155;color:#fff;padding:8px 10px;border-radius:8px;font-size:12.5px;">
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Rareza
                  <select id="csBanRarity" style="margin-top:4px;width:100%;background:#090d16;border:1px solid #334155;color:#fff;padding:8px;border-radius:8px;font-size:12px;">
                    <option value="legendary">🟡 Legendario</option>
                    <option value="epic" selected>🟣 Épico</option>
                    <option value="rare">🔵 Raro</option>
                    <option value="common">⚪ Común</option>
                  </select>
                </label>
                <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Descripción corta
                  <input id="csBanDesc" type="text" placeholder="Diseño oficial del creador" style="margin-top:4px;width:100%;box-sizing:border-box;background:#090d16;border:1px solid #334155;color:#fff;padding:8px 10px;border-radius:8px;font-size:12px;">
                </label>
              </div>
              <div id="csBanImgWrap">
                <input id="csBanFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" style="width:100%;box-sizing:border-box;background:#090d16;border:1px dashed #6366f1;color:#cbd5e1;padding:9px;border-radius:8px;font-size:12px;cursor:pointer;">
              </div>
              <div id="csBanGradWrap" style="display:none;flex-direction:column;gap:8px;">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                  <label style="font-size:11px;color:#94a3b8;">Color 1 <input id="csBanC1" type="color" value="#1e1b4b" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
                  <label style="font-size:11px;color:#94a3b8;">Color 2 <input id="csBanC2" type="color" value="#7c3aed" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
                  <label style="font-size:11px;color:#94a3b8;">Color 3 <input id="csBanC3" type="color" value="#ec4899" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
                </div>
                <label style="font-size:11px;color:#94a3b8;">Ángulo (<span id="csBanDegLbl">135°</span>)
                  <input id="csBanDeg" type="range" min="0" max="360" value="135" style="width:100%;accent-color:#8b5cf6;">
                </label>
              </div>
              <button type="button" id="csBanPublish" style="background:linear-gradient(135deg,#10b981,#059669);border:0;color:#fff;padding:10px 16px;border-radius:9px;font-size:13px;font-weight:900;cursor:pointer;">✨ Publicar Banner</button>
            </div>
            <div style="display:flex;flex-direction:column;justify-content:center;gap:8px;">
              <div style="font-size:11.5px;color:#94a3b8;font-weight:700;">VISTA PREVIA EN PERFIL (16:5)</div>
              <div id="csBanPrev" style="height:126px;border-radius:12px;border:1.5px solid #334155;background:linear-gradient(135deg,#1e1b4b,#7c3aed,#ec4899);background-size:cover;background-position:center;display:flex;align-items:flex-end;padding:12px;box-sizing:border-box;position:relative;overflow:hidden;">
                <div style="background:rgba(9,13,22,0.78);backdrop-filter:blur(6px);padding:5px 10px;border-radius:8px;font-size:12px;font-weight:800;color:#fff;">@${esc(me?.name || 'EpicKap')}</div>
              </div>
              <div style="font-size:11px;color:#64748b;">Los banners subidos pasan automáticamente por el Filtro de Normas de la Comunidad y se sincronizan con la Bóveda y Mi Perfil.</div>
            </div>
          </div>

          <!-- Lista Completa de Banners Existentes -->
          <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;">
            <div style="font-size:14px;font-weight:900;color:#38bdf8;margin-bottom:12px;">📦 Todos los Banners Activos (${customBanners.length + vaultBanners.length + profileBanners.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;">
              ${[
                ...customBanners.map((b) => ({ id: b.id, name: b.name, val: b.val, tag: 'CREADOR', rarity: b.rarity, isCustom: true })),
                ...vaultBanners.map((b) => ({ id: b.id, name: b.name, val: b.val, tag: 'BÓVEDA', rarity: b.rarity, isCustom: false })),
                ...profileBanners.map((b) => ({ id: b.id, name: b.name, val: b.value || b.val, tag: b.badge || 'PERFIL', rarity: 'common', isCustom: false }))
              ].map((b) => `
                <div style="background:#090d16;border:1px solid #1e293b;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;">
                  <div style="height:68px;${bannerCss ? bannerCss(b.val) : `background:${esc(b.val)};background-size:cover;background-position:center;`};position:relative;">
                    <span style="position:absolute;top:6px;left:6px;background:rgba(9,13,22,0.82);color:#e2e8f0;font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:999px;border:1px solid rgba(255,255,255,0.14);">${esc(b.tag)}</span>
                  </div>
                  <div style="padding:9px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <div style="min-width:0;">
                      <div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${esc(b.name)}">${esc(b.name)}</div>
                      <div style="font-size:10px;color:#64748b;">${esc(b.id)}</div>
                    </div>
                    <button type="button" class="csDelBannerBtn" data-id="${esc(b.id)}" data-custom="${b.isCustom ? '1' : '0'}" style="background:rgba(239,68,68,0.16);border:1px solid #ef4444;color:#fca5a5;padding:5px 9px;border-radius:7px;font-size:11px;font-weight:800;cursor:pointer;flex:none;">🗑️ Borrar</button>
                  </div>
                </div>
              `).join('')}
            </div>

            ${hiddenBanners.length > 0 ? `
              <div style="margin-top:16px;padding-top:14px;border-top:1px solid #1e293b;">
                <div style="font-size:12px;font-weight:800;color:#94a3b8;margin-bottom:8px;">♻️ Banners del catálogo oficial eliminados (${hiddenBanners.length})</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${hiddenBanners.map((hb) => `
                    <button type="button" class="csRestoreBtn" data-id="${esc(hb.id)}" style="background:#1e293b;border:1px solid #475569;color:#e2e8f0;padding:5px 10px;border-radius:8px;font-size:11px;cursor:pointer;">↩️ Restaurar: ${esc(hb.name)}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      let banMode = 'img';
      let uploadDataUrl = '';
      const modeImgBtn = container.querySelector('#csBanModeImg');
      const modeGradBtn = container.querySelector('#csBanModeGrad');
      const imgWrap = container.querySelector('#csBanImgWrap');
      const gradWrap = container.querySelector('#csBanGradWrap');
      const prevEl = container.querySelector('#csBanPrev');
      const c1El = container.querySelector('#csBanC1');
      const c2El = container.querySelector('#csBanC2');
      const c3El = container.querySelector('#csBanC3');
      const degEl = container.querySelector('#csBanDeg');
      const degLbl = container.querySelector('#csBanDegLbl');

      const getGradCss = () => `linear-gradient(${degEl.value}deg, ${c1El.value} 0%, ${c2El.value} 50%, ${c3El.value} 100%)`;
      const updatePrev = () => {
        if (banMode === 'grad') {
          prevEl.style.background = getGradCss();
          degLbl.textContent = `${degEl.value}°`;
        } else if (uploadDataUrl) {
          prevEl.style.background = `url("${uploadDataUrl}") center/cover no-repeat`;
        }
      };

      modeImgBtn.onclick = () => {
        banMode = 'img';
        modeImgBtn.style.background = '#312e81'; modeImgBtn.style.borderColor = '#6366f1'; modeImgBtn.style.color = '#fff';
        modeGradBtn.style.background = '#0b0f1a'; modeGradBtn.style.borderColor = '#334155'; modeGradBtn.style.color = '#cbd5e1';
        imgWrap.style.display = 'block'; gradWrap.style.display = 'none';
        updatePrev();
      };
      modeGradBtn.onclick = () => {
        banMode = 'grad';
        modeGradBtn.style.background = '#312e81'; modeGradBtn.style.borderColor = '#6366f1'; modeGradBtn.style.color = '#fff';
        modeImgBtn.style.background = '#0b0f1a'; modeImgBtn.style.borderColor = '#334155'; modeImgBtn.style.color = '#cbd5e1';
        imgWrap.style.display = 'none'; gradWrap.style.display = 'flex';
        updatePrev();
      };
      [c1El, c2El, c3El, degEl].forEach((inp) => { inp.oninput = updatePrev; });

      container.querySelector('#csBanFile').onchange = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (global.EKImageModeration?.checkImage) {
          const check = await global.EKImageModeration.checkImage(f, { kind: 'banner', fileName: f.name, mime: f.type });
          if (!check.allowed) {
            e.target.value = '';
            toast('🛡️ ' + check.reason);
            return;
          }
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          uploadDataUrl = String(ev.target?.result || '');
          updatePrev();
        };
        reader.readAsDataURL(f);
      };

      container.querySelector('#csBanPublish').onclick = () => {
        const rawName = container.querySelector('#csBanName').value.trim();
        const rarity = container.querySelector('#csBanRarity').value;
        const desc = container.querySelector('#csBanDesc').value.trim() || `Banner oficial creado por ${me?.name || 'EpicKap'}.`;
        if (!rawName) return toast('Escribe un nombre para el banner');
        if (banMode === 'img' && !uploadDataUrl) return toast('Selecciona una imagen o cambia a modo Degradado');

        const id = `creator_banner_${Date.now()}`;
        const val = banMode === 'grad' ? getGradCss() : `url("${uploadDataUrl}") center/cover no-repeat`;
        const name = rawName.toLowerCase().startsWith('banner') ? rawName : `Banner: ${rawName}`;
        EKCreatorSystem.saveCustomReward({ id, name, type: 'banner', val, rarity, animated: banMode === 'grad', desc });
        unlockInLocalVault(id);
        toast(`✨ ¡Banner "${name}" creado y desbloqueado!`);
        refresh();
      };

      container.querySelectorAll('.csDelBannerBtn').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const isCustom = btn.getAttribute('data-custom') === '1';
          if (!confirm('¿Eliminar este banner del catálogo de EpicKast?')) return;
          if (isCustom) EKCreatorSystem.deleteCustomReward(id);
          else EKCreatorSystem.hideBuiltinItem(id);
          toast('🗑️ Banner eliminado del catálogo');
          refresh();
        };
      });

      container.querySelectorAll('.csRestoreBtn').forEach((btn) => {
        btn.onclick = () => {
          EKCreatorSystem.restoreBuiltinItem(btn.getAttribute('data-id'));
          toast('↩️ Banner restaurado al catálogo');
          refresh();
        };
      });

      return container;
    }

    // =========================================================================
    // CANAL 2: COLORES DE USUARIO (Estilos de Nombre)
    // =========================================================================
    if (chKey === 'colores') {
      const customColors = customList.filter((x) => x.type === 'color');
      const builtinColors = builtinCosmetics.filter((x) => x.type === 'color' && !hiddenSet.has(x.id));
      const hiddenColors = builtinCosmetics.filter((x) => x.type === 'color' && hiddenSet.has(x.id));

      container.innerHTML = `
        <div style="max-width:1060px;margin:0 auto;display:flex;flex-direction:column;gap:18px;">
          <div style="background:linear-gradient(135deg,rgba(236,72,153,0.2),rgba(139,92,246,0.18));border:1.5px solid #ec4899;border-radius:14px;padding:18px 22px;">
            <div style="font-size:18px;font-weight:900;color:#fff;display:flex;align-items:center;gap:8px;">
              <span>🎨 Gestión Total de Colores de Usuario</span>
              <span style="background:#db2777;color:#fff;font-size:10px;padding:3px 9px;border-radius:999px;">${customColors.length + builtinColors.length} ACTIVOS</span>
            </div>
            <p style="margin:4px 0 0;font-size:12.5px;color:#cbd5e1;">Crea colores sólidos o degradados con tipografía personalizada para los nombres de usuario y elimina los estilos existentes que no quieras usar.</p>
          </div>

          <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:14px;font-weight:900;color:#fbbf24;">➕ Crear Nuevo Color / Estilo de Nombre</div>
              <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Nombre del Estilo
                <input id="csColName" type="text" placeholder="Ej: Neón Dorado / Fuego Estelar..." style="margin-top:4px;width:100%;box-sizing:border-box;background:#090d16;border:1px solid #334155;color:#fff;padding:8px 10px;border-radius:8px;font-size:12.5px;">
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Tipo
                  <select id="csColMode" style="margin-top:4px;width:100%;background:#090d16;border:1px solid #334155;color:#fff;padding:8px;border-radius:8px;font-size:12px;">
                    <option value="gradient" selected>🌈 Degradado (2 colores)</option>
                    <option value="solid">🎯 Color Sólido</option>
                  </select>
                </label>
                <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Rareza
                  <select id="csColRarity" style="margin-top:4px;width:100%;background:#090d16;border:1px solid #334155;color:#fff;padding:8px;border-radius:8px;font-size:12px;">
                    <option value="legendary">🟡 Legendario</option>
                    <option value="epic" selected>🟣 Épico</option>
                    <option value="rare">🔵 Raro</option>
                    <option value="common">⚪ Común</option>
                  </select>
                </label>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <label style="font-size:11px;color:#94a3b8;">Color Principal <input id="csCol1" type="color" value="#38bdf8" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
                <label id="csCol2Wrap" style="font-size:11px;color:#94a3b8;">Segundo Color <input id="csCol2" type="color" value="#c084fc" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
              </div>
              <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Tipografía
                <select id="csColFont" style="margin-top:4px;width:100%;background:#090d16;border:1px solid #334155;color:#fff;padding:8px;border-radius:8px;font-size:12px;">
                  <option value="modern">Moderna Bold</option>
                  <option value="imperial">Imperial Serif (Mayúsculas)</option>
                  <option value="cyber">Cyber Monoespaciada</option>
                  <option value="italic">Cursiva Dinámica</option>
                </select>
              </label>
              <button type="button" id="csColPublish" style="background:linear-gradient(135deg,#10b981,#059669);border:0;color:#fff;padding:10px 16px;border-radius:9px;font-size:13px;font-weight:900;cursor:pointer;">✨ Publicar Color de Usuario</button>
            </div>
            <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:10px;background:#090d16;border:1px solid #1e293b;border-radius:12px;padding:24px;">
              <div style="font-size:11px;color:#64748b;font-weight:800;letter-spacing:.7px;">VISTA PREVIA EN CHAT Y PERFIL</div>
              <div id="csColPrev" style="font-size:24px;font-weight:900;">@${esc(me?.name || 'EpicKap')}</div>
            </div>
          </div>

          <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;">
            <div style="font-size:14px;font-weight:900;color:#f472b6;margin-bottom:12px;">📦 Todos los Colores de Usuario Activos (${customColors.length + builtinColors.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
              ${[
                ...customColors.map((c) => ({ ...c, isCustom: true })),
                ...builtinColors.map((c) => ({ ...c, isCustom: false }))
              ].map((c) => {
                const rb = RARITY_BADGE[c.rarity] || RARITY_BADGE.common;
                return `
                  <div style="background:#090d16;border:1px solid #1e293b;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                      <span style="font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:${rb.bg};border:1px solid ${rb.border};color:${rb.color};">${c.isCustom ? 'CREADOR · ' : ''}${rb.label}</span>
                      <button type="button" class="csDelColBtn" data-id="${esc(c.id)}" data-custom="${c.isCustom ? '1' : '0'}" style="background:rgba(239,68,68,0.16);border:1px solid #ef4444;color:#fca5a5;padding:3px 8px;border-radius:6px;font-size:10.5px;font-weight:800;cursor:pointer;">🗑️ Borrar</button>
                    </div>
                    <div style="background:#111625;border-radius:8px;padding:10px;text-align:center;">
                      <span style="font-size:15px;${nameColorStyle ? nameColorStyle(c.val) : `color:${esc(c.val)};font-weight:800;`}">@${esc(me?.name || 'EpicKap')}</span>
                    </div>
                    <div style="font-size:12px;font-weight:800;color:#fff;">${esc(c.name)}</div>
                  </div>
                `;
              }).join('')}
            </div>

            ${hiddenColors.length > 0 ? `
              <div style="margin-top:16px;padding-top:14px;border-top:1px solid #1e293b;">
                <div style="font-size:12px;font-weight:800;color:#94a3b8;margin-bottom:8px;">♻️ Colores oficiales eliminados (${hiddenColors.length})</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${hiddenColors.map((hc) => `
                    <button type="button" class="csRestoreBtn" data-id="${esc(hc.id)}" style="background:#1e293b;border:1px solid #475569;color:#e2e8f0;padding:5px 10px;border-radius:8px;font-size:11px;cursor:pointer;">↩️ Restaurar: ${esc(hc.name)}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const modeEl = container.querySelector('#csColMode');
      const c1El = container.querySelector('#csCol1');
      const c2El = container.querySelector('#csCol2');
      const c2Wrap = container.querySelector('#csCol2Wrap');
      const fontEl = container.querySelector('#csColFont');
      const prevEl = container.querySelector('#csColPrev');

      const getFontCss = () => {
        const v = fontEl.value;
        if (v === 'imperial') return "font-family:'Georgia',serif;letter-spacing:0.9px;font-weight:900;text-transform:uppercase;";
        if (v === 'cyber') return "font-family:'Consolas','Courier New',monospace;letter-spacing:1.2px;font-weight:900;text-transform:uppercase;";
        if (v === 'italic') return "font-family:'Trebuchet MS',sans-serif;font-style:italic;letter-spacing:0.6px;font-weight:900;";
        return 'font-weight:900;letter-spacing:0.3px;';
      };
      const getVal = () => (modeEl.value === 'solid' ? c1El.value : `linear-gradient(90deg, ${c1El.value}, ${c2El.value})`);
      const updatePrev = () => {
        c2Wrap.style.display = modeEl.value === 'solid' ? 'none' : 'block';
        const val = getVal();
        const extra = getFontCss();
        if (val.startsWith('linear-gradient')) {
          prevEl.setAttribute('style', `font-size:24px;background:${val};-webkit-background-clip:text;background-clip:text;color:transparent;${extra}`);
        } else {
          prevEl.setAttribute('style', `font-size:24px;color:${val};${extra}`);
        }
      };
      [modeEl, c1El, c2El, fontEl].forEach((el) => { el.oninput = updatePrev; el.onchange = updatePrev; });
      updatePrev();

      container.querySelector('#csColPublish').onclick = () => {
        const rawName = container.querySelector('#csColName').value.trim();
        if (!rawName) return toast('Escribe un nombre para el color');
        const id = `creator_color_${Date.now()}`;
        const name = rawName.toLowerCase().startsWith('letra') ? rawName : `Letra: ${rawName}`;
        EKCreatorSystem.saveCustomReward({
          id,
          name,
          type: 'color',
          val: getVal(),
          fontCss: getFontCss(),
          rarity: container.querySelector('#csColRarity').value,
          desc: `Estilo de nombre creado por ${me?.name || 'EpicKap'}.`
        });
        unlockInLocalVault(id);
        toast(`✨ ¡Color "${name}" creado y desbloqueado!`);
        refresh();
      };

      container.querySelectorAll('.csDelColBtn').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const isCustom = btn.getAttribute('data-custom') === '1';
          if (!confirm('¿Eliminar este color de usuario del catálogo?')) return;
          if (isCustom) EKCreatorSystem.deleteCustomReward(id);
          else EKCreatorSystem.hideBuiltinItem(id);
          toast('🗑️ Color de usuario eliminado');
          refresh();
        };
      });

      container.querySelectorAll('.csRestoreBtn').forEach((btn) => {
        btn.onclick = () => {
          EKCreatorSystem.restoreBuiltinItem(btn.getAttribute('data-id'));
          toast('↩️ Color restaurado');
          refresh();
        };
      });

      return container;
    }

    // =========================================================================
    // CANAL 3: BORDES DE PERFIL (Marcos de Avatar)
    // =========================================================================
    if (chKey === 'bordes') {
      const customFrames = customList.filter((x) => x.type === 'frame');
      const builtinFrames = builtinCosmetics.filter((x) => x.type === 'frame' && !hiddenSet.has(x.id));
      const hiddenFrames = builtinCosmetics.filter((x) => x.type === 'frame' && hiddenSet.has(x.id));
      const initials = (me?.name || 'EK').slice(0, 2).toUpperCase();

      container.innerHTML = `
        <div style="max-width:1060px;margin:0 auto;display:flex;flex-direction:column;gap:18px;">
          <div style="background:linear-gradient(135deg,rgba(251,191,36,0.18),rgba(249,115,22,0.16));border:1.5px solid #f59e0b;border-radius:14px;padding:18px 22px;">
            <div style="font-size:18px;font-weight:900;color:#fff;display:flex;align-items:center;gap:8px;">
              <span>✨ Gestión Total de Bordes de Perfil</span>
              <span style="background:#d97706;color:#fff;font-size:10px;padding:3px 9px;border-radius:999px;">${customFrames.length + builtinFrames.length} ACTIVOS</span>
            </div>
            <p style="margin:4px 0 0;font-size:12.5px;color:#cbd5e1;">Diseña nuevos marcos y auras luminosas para avatares en tiempo real y elimina los bordes existentes del catálogo.</p>
          </div>

          <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:14px;font-weight:900;color:#fbbf24;">➕ Crear Nuevo Borde de Perfil</div>
              <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Nombre del Borde
                <input id="csFrName" type="text" placeholder="Ej: Corona Esmeralda / Flama Estelar..." style="margin-top:4px;width:100%;box-sizing:border-box;background:#090d16;border:1px solid #334155;color:#fff;padding:8px 10px;border-radius:8px;font-size:12.5px;">
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                <label style="font-size:11px;color:#94a3b8;">Color Borde <input id="csFrC1" type="color" value="#10b981" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
                <label style="font-size:11px;color:#94a3b8;">Color Aura <input id="csFrC2" type="color" value="#34d399" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
                <label style="font-size:11px;color:#94a3b8;">Color Oscilación <input id="csFrC3" type="color" value="#38bdf8" style="width:100%;height:34px;border:0;background:transparent;cursor:pointer;"></label>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Animación
                  <select id="csFrAnim" style="margin-top:4px;width:100%;background:#090d16;border:1px solid #334155;color:#fff;padding:8px;border-radius:8px;font-size:12px;">
                    <option value="pulse" selected>✨ Pulso Luminoso</option>
                    <option value="dual">🔄 Bicolor Oscilante</option>
                    <option value="rainbow">🌈 Arcoíris Neón</option>
                    <option value="none">💎 Fijo Elegante</option>
                  </select>
                </label>
                <label style="font-size:11.5px;color:#cbd5e1;font-weight:700;">Rareza
                  <select id="csFrRarity" style="margin-top:4px;width:100%;background:#090d16;border:1px solid #334155;color:#fff;padding:8px;border-radius:8px;font-size:12px;">
                    <option value="legendary">🟡 Legendario</option>
                    <option value="epic" selected>🟣 Épico</option>
                    <option value="rare">🔵 Raro</option>
                    <option value="common">⚪ Común</option>
                  </select>
                </label>
              </div>
              <button type="button" id="csFrPublish" style="background:linear-gradient(135deg,#10b981,#059669);border:0;color:#fff;padding:10px 16px;border-radius:9px;font-size:13px;font-weight:900;cursor:pointer;">✨ Publicar Borde de Perfil</button>
            </div>
            <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;background:#090d16;border:1px solid #1e293b;border-radius:12px;padding:24px;">
              <div style="font-size:11px;color:#64748b;font-weight:800;letter-spacing:.7px;">VISTA PREVIA EN AVATAR</div>
              <div id="csFrPrev" class="avatar" style="width:76px;height:76px;font-size:28px;background:#1e293b;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:900;">${esc(initials)}</div>
            </div>
          </div>

          <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;">
            <div style="font-size:14px;font-weight:900;color:#fbbf24;margin-bottom:12px;">📦 Todos los Bordes de Perfil Activos (${customFrames.length + builtinFrames.length})</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
              ${[
                ...customFrames.map((f) => ({ ...f, isCustom: true })),
                ...builtinFrames.map((f) => ({ ...f, isCustom: false }))
              ].map((f) => {
                const rb = RARITY_BADGE[f.rarity] || RARITY_BADGE.common;
                return `
                  <div style="background:#090d16;border:1px solid #1e293b;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px;align-items:center;">
                    <div style="width:100%;display:flex;justify-content:space-between;align-items:center;">
                      <span style="font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:${rb.bg};border:1px solid ${rb.border};color:${rb.color};">${f.isCustom ? 'CREADOR · ' : ''}${rb.label}</span>
                      <button type="button" class="csDelFrBtn" data-id="${esc(f.id)}" data-custom="${f.isCustom ? '1' : '0'}" style="background:rgba(239,68,68,0.16);border:1px solid #ef4444;color:#fca5a5;padding:3px 8px;border-radius:6px;font-size:10.5px;font-weight:800;cursor:pointer;">🗑️ Borrar</button>
                    </div>
                    <div class="avatar ${esc(f.val)}" style="width:58px;height:58px;font-size:20px;background:#1e293b;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:900;">${esc(initials)}</div>
                    <div style="font-size:12.5px;font-weight:800;color:#fff;text-align:center;">${esc(f.name)}</div>
                  </div>
                `;
              }).join('')}
            </div>

            ${hiddenFrames.length > 0 ? `
              <div style="margin-top:16px;padding-top:14px;border-top:1px solid #1e293b;">
                <div style="font-size:12px;font-weight:800;color:#94a3b8;margin-bottom:8px;">♻️ Bordes oficiales eliminados (${hiddenFrames.length})</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  ${hiddenFrames.map((hf) => `
                    <button type="button" class="csRestoreBtn" data-id="${esc(hf.id)}" style="background:#1e293b;border:1px solid #475569;color:#e2e8f0;padding:5px 10px;border-radius:8px;font-size:11px;cursor:pointer;">↩️ Restaurar: ${esc(hf.name)}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const c1 = container.querySelector('#csFrC1');
      const c2 = container.querySelector('#csFrC2');
      const prev = container.querySelector('#csFrPrev');
      const updatePrev = () => {
        prev.style.border = `2.5px solid ${c1.value}`;
        prev.style.boxShadow = `0 0 0 2px ${c1.value}, 0 0 16px ${c2.value}`;
      };
      [c1, c2].forEach((el) => { el.oninput = updatePrev; });
      updatePrev();

      container.querySelector('#csFrPublish').onclick = () => {
        const rawName = container.querySelector('#csFrName').value.trim();
        if (!rawName) return toast('Escribe un nombre para el borde de perfil');
        const ts = Date.now();
        const id = `creator_frame_${ts}`;
        const val = `frame-custom-${ts}`;
        const name = rawName.toLowerCase().startsWith('marco') ? rawName : `Marco: ${rawName}`;
        EKCreatorSystem.saveCustomReward({
          id,
          name,
          type: 'frame',
          val,
          rarity: container.querySelector('#csFrRarity').value,
          desc: `Borde de perfil creado por ${me?.name || 'EpicKap'}.`,
          frameStyle: {
            borderColor: c1.value,
            glowColor: c2.value,
            secondaryColor: container.querySelector('#csFrC3').value,
            animation: container.querySelector('#csFrAnim').value,
            thickness: 2
          }
        });
        unlockInLocalVault(id);
        toast(`✨ ¡Borde "${name}" creado y desbloqueado!`);
        refresh();
      };

      container.querySelectorAll('.csDelFrBtn').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-id');
          const isCustom = btn.getAttribute('data-custom') === '1';
          if (!confirm('¿Eliminar este borde de perfil del catálogo?')) return;
          if (isCustom) EKCreatorSystem.deleteCustomReward(id);
          else EKCreatorSystem.hideBuiltinItem(id);
          toast('🗑️ Borde de perfil eliminado');
          refresh();
        };
      });

      container.querySelectorAll('.csRestoreBtn').forEach((btn) => {
        btn.onclick = () => {
          EKCreatorSystem.restoreBuiltinItem(btn.getAttribute('data-id'));
          toast('↩️ Borde restaurado');
          refresh();
        };
      });

      return container;
    }

    // =========================================================================
    // CANAL 4: CARTAS DEL DOJO (EDITOR VISUAL DE LAS 60 CARTAS)
    // =========================================================================
    if (chKey === 'dojo') {
      const dojoCatalog = global.DojoCardCollection?.CATALOG || [];
      const customMap = EKCreatorSystem.getCustomDojoCards() || {};
      const customizedEntries = Object.entries(customMap);
      const firstCard = dojoCatalog[0] || { no: 1, code: 'F01', name: 'Fogata', element: 'fire', power: 1, imgUrl: 'assets/cards/std/fire_1.jpg' };
      const getCardImg = (c) => customMap[String(c.no)]?.imgUrl || c.imgUrl || '';
      const getCardName = (c) => customMap[String(c.no)]?.name || c.name || '';

      container.innerHTML = `
        <div style="max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:16px;">
          <div style="background:linear-gradient(135deg,rgba(56,189,248,0.18),rgba(99,102,241,0.18));border:1.5px solid #38bdf8;border-radius:14px;padding:18px 22px;">
            <div style="font-size:18px;font-weight:900;color:#fff;">🎴 Personalización de Cartas del Dojo (${dojoCatalog.length} cartas)</div>
            <p style="margin:4px 0 0;font-size:12.5px;color:#cbd5e1;">Sube tus propias ilustraciones o renombra cualquiera de las 60 cartas del Dojo Elemental. Los cambios se sincronizan para todos los usuarios.</p>
          </div>
          <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;display:grid;grid-template-columns:160px 1fr;gap:18px;align-items:start;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
              <div id="csDojoPrevBox" style="width:140px;height:185px;border-radius:12px;border:2px solid #38bdf8;background:#090d16;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 20px rgba(0,0,0,0.45);">
                <div id="csDojoPrevImg" style="flex:1;background:url('${esc(getCardImg(firstCard))}') center/cover no-repeat #0f172a;"></div>
                <div style="padding:6px 8px;background:#0b101d;border-top:1px solid rgba(255,255,255,0.08);">
                  <div id="csDojoPrevTitle" style="font-size:11px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(getCardName(firstCard))}</div>
                  <div id="csDojoPrevMeta" style="font-size:9.5px;color:#38bdf8;font-weight:700;">${esc(firstCard.code)} · Poder ${firstCard.power}</div>
                </div>
              </div>
              <span style="font-size:10px;color:#94a3b8;text-align:center;">Vista previa en vivo</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <label style="font-size:12px;color:#cbd5e1;font-weight:700;">Seleccionar Carta del Dojo
                <select id="csDojoNo" style="margin-top:4px;width:100%;background:#090d16;border:1px solid #334155;color:#fff;padding:9px;border-radius:8px;font-size:12.5px;">
                  ${dojoCatalog.map((c) => `<option value="${c.no}">${customMap[String(c.no)] ? '★ ' : ''}${esc(c.code)} · ${esc(getCardName(c))} (${esc(String(c.element || '').toUpperCase())} Poder ${c.power})</option>`).join('')}
                </select>
              </label>
              <label style="font-size:12px;color:#cbd5e1;font-weight:700;">Nuevo nombre (opcional)
                <input id="csDojoName" type="text" placeholder="Ej: Dragón Carmesí Supremo" value="${esc(customMap[String(firstCard.no)]?.name || '')}" style="margin-top:4px;width:100%;box-sizing:border-box;background:#090d16;border:1px solid #334155;color:#fff;padding:8px 10px;border-radius:8px;font-size:12.5px;">
              </label>
              <label style="font-size:12px;color:#cbd5e1;font-weight:700;">Subir nueva ilustración (PNG / JPG / WebP)
                <input id="csDojoFile" type="file" accept="image/*" style="margin-top:4px;width:100%;box-sizing:border-box;background:#090d16;border:1px dashed #38bdf8;color:#cbd5e1;padding:9px;border-radius:8px;font-size:12px;">
              </label>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="button" id="csDojoSave" style="flex:1;background:linear-gradient(135deg,#0284c7,#2563eb);border:0;color:#fff;padding:10px 16px;border-radius:9px;font-size:13px;font-weight:900;cursor:pointer;">💾 Guardar Carta y Sincronizar</button>
                <button type="button" id="csDojoReset" style="background:rgba(239,68,68,0.14);border:1px solid rgba(239,68,68,0.45);color:#fca5a5;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;">↺ Restaurar original</button>
              </div>
            </div>
          </div>
          ${customizedEntries.length > 0 ? `
            <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:16px;">
              <div style="font-size:12.5px;font-weight:800;color:#7dd3fc;margin-bottom:10px;">✨ Cartas personalizadas activas (${customizedEntries.length})</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${customizedEntries.map(([no, ov]) => {
                  const base = dojoCatalog.find((x) => String(x.no) === String(no));
                  return `<button type="button" class="csPickCustomCard" data-no="${esc(no)}" style="display:flex;align-items:center;gap:8px;background:#090d16;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11.5px;font-weight:700;">
                    ${ov.imgUrl ? `<span style="width:24px;height:24px;border-radius:4px;background:url('${esc(ov.imgUrl)}') center/cover no-repeat;display:inline-block;"></span>` : ''}
                    <span>${esc(base?.code || '#' + no)} · ${esc(ov.name || base?.name || 'Carta')}</span>
                  </button>`;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      let dojoImg = '';
      const selEl = container.querySelector('#csDojoNo');
      const nameEl = container.querySelector('#csDojoName');
      const prevImgEl = container.querySelector('#csDojoPrevImg');
      const prevTitleEl = container.querySelector('#csDojoPrevTitle');
      const prevMetaEl = container.querySelector('#csDojoPrevMeta');

      const updatePreview = () => {
        const no = Number(selEl.value || 1);
        const c = dojoCatalog.find((x) => x.no === no) || firstCard;
        const ov = customMap[String(no)] || {};
        const img = dojoImg || ov.imgUrl || c.imgUrl || '';
        prevImgEl.style.backgroundImage = img ? `url('${img}')` : 'none';
        prevTitleEl.textContent = nameEl.value.trim() || ov.name || c.name || '';
        prevMetaEl.textContent = `${c.code || '#' + no} · Poder ${c.power}`;
      };

      selEl.onchange = () => {
        dojoImg = '';
        const no = Number(selEl.value || 1);
        nameEl.value = customMap[String(no)]?.name || '';
        container.querySelector('#csDojoFile').value = '';
        updatePreview();
      };
      nameEl.oninput = updatePreview;

      container.querySelector('#csDojoFile').onchange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
          const raw = String(ev.target?.result || '');
          const img = new Image();
          img.onload = () => {
            try {
              const cv = document.createElement('canvas');
              cv.width = 240; cv.height = 240;
              const ctx = cv.getContext('2d');
              const side = Math.min(img.width, img.height);
              const sx = (img.width - side) / 2;
              const sy = (img.height - side) / 2;
              ctx.drawImage(img, sx, sy, side, side, 0, 0, 240, 240);
              dojoImg = cv.toDataURL('image/webp', 0.86);
            } catch {
              dojoImg = raw;
            }
            updatePreview();
          };
          img.onerror = () => { dojoImg = raw; updatePreview(); };
          img.src = raw;
        };
        r.readAsDataURL(f);
      };

      container.querySelector('#csDojoSave').onclick = () => {
        const no = Number(selEl.value || 1);
        const nm = nameEl.value.trim();
        if (!nm && !dojoImg) return toast('Elige una imagen o escribe un nuevo nombre');
        const prev = customMap[String(no)] || {};
        EKCreatorSystem.saveCustomDojoCard(no, {
          name: nm || prev.name || undefined,
          imgUrl: dojoImg || prev.imgUrl || undefined
        });
        toast(`🎴 ¡Carta #${String(no).padStart(3, '0')} guardada y sincronizada!`);
        refresh();
      };

      container.querySelector('#csDojoReset').onclick = () => {
        const no = Number(selEl.value || 1);
        const map = EKCreatorSystem.getCustomDojoCards();
        delete map[String(no)];
        writeJson(KEYS.dojoCards, map);
        syncToServer();
        toast(`↺ Carta #${String(no).padStart(3, '0')} restaurada a su arte original`);
        refresh();
      };

      container.querySelectorAll('.csPickCustomCard').forEach((b) => {
        b.onclick = () => {
          selEl.value = b.dataset.no;
          selEl.onchange();
        };
      });
      return container;
    }

    // =========================================================================
    // CANAL 5: MODERACIÓN DE IMÁGENES Y RANGOS DE CREADOR
    // =========================================================================
    const modCfg = global.EKImageModeration?.getConfig?.() || { enabled: true, level: 'balanced', blockExplicitFilenames: true };
    const modLogs = global.EKImageModeration?.getLogs?.() || [];
    const isMaster = EKCreatorSystem.isMasterCreator(me);
    const creatorsList = EKCreatorSystem.getGrantedCreators();

    container.innerHTML = `
      <div style="max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:18px;">
        <div style="background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(59,130,246,0.16));border:1.5px solid #10b981;border-radius:14px;padding:18px 22px;">
          <div style="font-size:18px;font-weight:900;color:#fff;">🛡️ Filtro de Normas de la Comunidad y Rangos</div>
          <p style="margin:4px 0 0;font-size:12.5px;color:#cbd5e1;">Protege automáticamente los avatares y banners subidos contra contenido NSFW o inapropiado, y administra los usuarios con rango Creador.</p>
        </div>

        <div style="background:#111625;border:1px solid #263147;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:14px;font-weight:900;color:#34d399;">🛡️ Filtro Automático de Imágenes (Perfil y Banners)</div>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#fff;cursor:pointer;">
            <input id="csModEnabled" type="checkbox" ${modCfg.enabled ? 'checked' : ''} style="width:16px;height:16px;accent-color:#10b981;">
            <b>Activar filtro automático de Normas de la Comunidad en avatares y banners</b>
          </label>
          <label style="font-size:12px;color:#cbd5e1;font-weight:700;">Nivel de Sensibilidad
            <select id="csModLevel" style="margin-top:4px;width:100%;max-width:360px;background:#090d16;border:1px solid #334155;color:#fff;padding:8px 10px;border-radius:8px;font-size:12.5px;">
              <option value="strict" ${modCfg.level === 'strict' ? 'selected' : ''}>🔒 Estricto (Máxima protección)</option>
              <option value="balanced" ${modCfg.level === 'balanced' ? 'selected' : ''}>⚖️ Equilibrado (Recomendado — evita falsos positivos en retratos)</option>
              <option value="relaxed" ${modCfg.level === 'relaxed' ? 'selected' : ''}>🟢 Moderado (Solo casos muy evidentes)</option>
            </select>
          </label>
          <div style="background:#090d16;border:1px dashed #334155;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:12px;font-weight:800;color:#94a3b8;">🧪 Probar una imagen con el filtro local:</div>
            <input id="csModTestFile" type="file" accept="image/*" style="font-size:12px;color:#cbd5e1;">
            <div id="csModTestOut" style="font-size:12px;color:#94a3b8;"></div>
          </div>
          <div style="margin-top:4px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:12px;font-weight:800;color:#cbd5e1;">📋 Registro reciente de bloqueos (${modLogs.length})</span>
              ${modLogs.length ? '<button type="button" id="csModClearLog" style="background:transparent;border:1px solid #475569;color:#94a3b8;padding:3px 8px;border-radius:6px;font-size:11px;cursor:pointer;">Limpiar</button>' : ''}
            </div>
            <div style="max-height:150px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
              ${modLogs.length === 0
                ? '<div style="font-size:11.5px;color:#64748b;">Sin bloqueos registrados.</div>'
                : modLogs.slice(0, 10).map((lg) => `
                  <div style="background:#090d16;border:1px solid #1e293b;border-radius:7px;padding:7px 10px;font-size:11.5px;">
                    <b style="color:#f87171;">[${esc(lg.kind)}]</b> ${esc(lg.fileName || 'imagen')} — <span style="color:#94a3b8;">${esc(lg.reason)}</span>
                  </div>
                `).join('')}
            </div>
          </div>
        </div>

        ${isMaster ? `
          <div style="background:#111625;border:1px solid #a855f7;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px;">
            <div style="font-size:14px;font-weight:900;color:#c084fc;">👑 Gestión de Rango Creador (Solo EpicKap)</div>
            <div style="display:flex;gap:8px;max-width:460px;">
              <input id="csGrantUser" type="text" placeholder="Nombre exacto del usuario..." style="flex:1;background:#090d16;border:1px solid #334155;color:#fff;padding:8px 10px;border-radius:8px;font-size:12.5px;">
              <button type="button" id="csGrantBtn" style="background:#9333ea;border:0;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;">+ Dar Rango</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <span style="background:rgba(251,191,36,0.16);border:1px solid #fbbf24;color:#fde047;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;">👑 EpicKap (Creador Maestro)</span>
              ${creatorsList.map((c) => `
                <span style="background:rgba(168,85,247,0.18);border:1px solid #a855f7;color:#e9d5ff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;">
                  🎨 ${esc(c.name)}
                  <button type="button" class="csRevokeBtn" data-name="${esc(c.name)}" style="background:transparent;border:0;color:#f87171;cursor:pointer;font-weight:900;padding:0;">✕</button>
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    container.querySelector('#csModEnabled').onchange = (e) => {
      global.EKImageModeration?.setConfig?.({ enabled: e.target.checked });
      toast(e.target.checked ? '🛡️ Filtro de Normas activado' : '⚠️ Filtro de Normas desactivado');
      doSync();
    };
    container.querySelector('#csModLevel').onchange = (e) => {
      global.EKImageModeration?.setConfig?.({ level: e.target.value });
      toast('🛡️ Sensibilidad del filtro actualizada');
      doSync();
    };
    container.querySelector('#csModTestFile').onchange = async (e) => {
      const f = e.target.files?.[0];
      const out = container.querySelector('#csModTestOut');
      if (!f || !out) return;
      out.textContent = 'Analizando imagen…';
      const res = await global.EKImageModeration.checkImage(f, { kind: 'avatar', fileName: f.name, mime: f.type });
      if (res.allowed) {
        out.innerHTML = `<span style="color:#4ade80;font-weight:800;">✅ APROBADA</span> — Piel detectada: ${res.metrics?.skinPct ?? 0}% · Zona central: ${res.metrics?.centerPct ?? 0}% · Suavidad: ${res.metrics?.smoothPct ?? 0}%`;
      } else {
        out.innerHTML = `<span style="color:#f87171;font-weight:800;">⛔ BLOQUEADA</span> — ${esc(res.reason)} ${res.metrics ? `(Piel: ${res.metrics.skinPct}%, Centro: ${res.metrics.centerPct}%)` : ''}`;
      }
    };
    const clearBtn = container.querySelector('#csModClearLog');
    if (clearBtn) clearBtn.onclick = () => { global.EKImageModeration?.clearLogs?.(); refresh(); };

    const grantBtn = container.querySelector('#csGrantBtn');
    if (grantBtn) {
      grantBtn.onclick = () => {
        const uname = container.querySelector('#csGrantUser').value.trim();
        if (!uname) return;
        EKCreatorSystem.setCreatorRole({ name: uname }, true);
        toast(`🎨 ¡Rango Creador otorgado a ${uname}!`);
        refresh();
      };
    }
    container.querySelectorAll('.csRevokeBtn').forEach((btn) => {
      btn.onclick = () => {
        EKCreatorSystem.setCreatorRole({ name: btn.getAttribute('data-name') }, false);
        toast('Rango Creador revocado');
        refresh();
      };
    });

    return container;
  }

  global.EKCreatorStudio = {
    CHANNELS,
    render: renderCreatorPage
  };
})(window);
