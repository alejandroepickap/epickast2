/**
 * EpicKast v2.0.0 — Filtro de Moderación de Imágenes (Normas de la Comunidad)
 * Analiza avatares y banners antes de subirlos al servidor (100% local, privado y rápido).
 * Combina validación de formato/peso, filtro de nombre de archivo y análisis visual YCbCr/HSV
 * de exposición + densidad de bordes para bloquear contenido NSFW sin falsos positivos en retratos normales.
 */
'use strict';

(function (global) {
  const STORAGE_KEY = 'epickast.moderation.config.v1';
  const LOG_KEY = 'epickast.moderation.log.v1';

  const ALLOWED_MIMES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
  const BLOCKED_NAME_RE = /(?:^|[^a-z])(nsfw|porn|porno|xxx|nude|nudes|desnud[oa]s?|hentai|gore|bdsm|fetish|sex[oy]?|boobs|tits|dick|cock|pussy|penis|vagina|ecchi|r18|rule34|onlyfans|lewd)(?:[^a-z]|$)/i;

  const PRESETS = {
    strict: {
      label: 'Estricto (Máxima protección)',
      avatarSkinRatio: 0.44,
      avatarCenterSkinRatio: 0.50,
      bannerSkinRatio: 0.36,
      bannerCenterSkinRatio: 0.42,
      minSmoothRatio: 0.52
    },
    balanced: {
      label: 'Equilibrado (Recomendado)',
      avatarSkinRatio: 0.54,
      avatarCenterSkinRatio: 0.60,
      bannerSkinRatio: 0.46,
      bannerCenterSkinRatio: 0.52,
      minSmoothRatio: 0.58
    },
    relaxed: {
      label: 'Moderado (Solo casos muy evidentes)',
      avatarSkinRatio: 0.66,
      avatarCenterSkinRatio: 0.72,
      bannerSkinRatio: 0.58,
      bannerCenterSkinRatio: 0.64,
      minSmoothRatio: 0.65
    }
  };

  function getConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const level = PRESETS[saved.level] ? saved.level : 'balanced';
      return {
        enabled: saved.enabled !== false,
        level,
        blockExplicitFilenames: saved.blockExplicitFilenames !== false
      };
    } catch {
      return { enabled: true, level: 'balanced', blockExplicitFilenames: true };
    }
  }

  function setConfig(patch) {
    const next = { ...getConfig(), ...(patch || {}) };
    if (!PRESETS[next.level]) next.level = 'balanced';
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  }

  function getLogs() {
    try {
      const arr = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function addLog(entry) {
    try {
      const logs = getLogs();
      logs.unshift({ ts: Date.now(), ...entry });
      localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 40)));
    } catch {}
  }

  function clearLogs() {
    try { localStorage.removeItem(LOG_KEY); } catch {}
  }

  /**
   * Clasificación de píxel de piel en espacio combinado RGB + YCbCr + HSV
   * Cubre múltiples tonos de piel (claros, medios y oscuros) reduciendo falsos positivos
   * en rojos puros, madera oscura, dorado neón o fondos cálidos.
   */
  function isSkinPixel(r, g, b) {
    // Filtro rápido de extremos
    if (r < 45 || g < 25 || b < 15) return false;
    if (r <= g || r <= b) return false;
    if (Math.abs(r - g) < 12) return false;

    // Espacio YCbCr (BT.601)
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    const ycbcrMatch = y > 65 && cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
    if (!ycbcrMatch) return false;

    // Verificación HSV para descartar amarillos/rojos saturados de arte/neón
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (delta < 14) return false;
    const sat = delta / max;
    if (sat < 0.14 || sat > 0.72) return false;

    let hue = 0;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;

    return hue <= 42 || hue >= 342;
  }

  function loadImageFromSource(source) {
    return new Promise((resolve, reject) => {
      if (source instanceof HTMLImageElement && source.complete && source.naturalWidth > 0) {
        return resolve({ img: source, revoke: null });
      }
      const img = new Image();
      let objectUrl = null;
      img.onload = () => resolve({ img, revoke: objectUrl });
      img.onerror = () => {
        if (objectUrl) { try { URL.revokeObjectURL(objectUrl); } catch {} }
        reject(new Error('No se pudo decodificar la imagen'));
      };
      if (typeof source === 'string') {
        img.src = source;
      } else if (source instanceof Blob) {
        objectUrl = URL.createObjectURL(source);
        img.src = objectUrl;
      } else {
        reject(new Error('Fuente de imagen no compatible'));
      }
    });
  }

  /**
   * Analiza una imagen (File, Blob, DataURL o HTMLImageElement) para avatar o banner.
   * @param {File|Blob|string|HTMLImageElement} source
   * @param {{ kind?: 'avatar'|'banner'|'creator', fileName?: string, mime?: string }} opts
   * @returns {Promise<{ allowed: boolean, reason?: string, metrics?: object }>}
   */
  async function checkImage(source, opts = {}) {
    const cfg = getConfig();
    const kind = opts.kind || 'avatar';
    const fileName = String(opts.fileName || (source && source.name) || '');
    const mime = String(opts.mime || (source && source.type) || '').toLowerCase();

    // 1. Validación de tipo MIME y tamaño siempre activa (seguridad básica)
    if (mime && !ALLOWED_MIMES.test && !ALLOWED_MIMES.has(mime)) {
      const reason = 'Formato de imagen no permitido. Usa PNG, JPG, WebP o GIF.';
      addLog({ kind, fileName, allowed: false, reason });
      return { allowed: false, reason };
    }
    if (source instanceof Blob) {
      const maxBytes = kind === 'avatar' ? 4 * 1024 * 1024 : 5 * 1024 * 1024;
      if (source.size > maxBytes) {
        const reason = `La imagen supera el límite permitido (${Math.round(maxBytes / (1024 * 1024))} MB).`;
        addLog({ kind, fileName, allowed: false, reason });
        return { allowed: false, reason };
      }
    }

    if (!cfg.enabled) {
      return { allowed: true, metrics: { bypassed: true } };
    }

    // 2. Filtro de nombres de archivo explícitos
    if (cfg.blockExplicitFilenames && fileName && BLOCKED_NAME_RE.test(fileName)) {
      const reason = 'Imagen bloqueada por Normas de la Comunidad (nombre de archivo con contenido explícito/NSFW).';
      addLog({ kind, fileName, allowed: false, reason });
      return { allowed: false, reason };
    }

    // 3. Análisis visual en canvas reducido (128x128 o 160x64 para banners)
    let loaded = null;
    try {
      loaded = await loadImageFromSource(source);
      const { img } = loaded;
      const w = kind === 'banner' ? 160 : 128;
      const h = kind === 'banner' ? 64 : 128;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return { allowed: true };

      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      const skinMask = new Uint8Array(w * h);
      let totalOpaque = 0;
      let totalSkin = 0;
      let centerOpaque = 0;
      let centerSkin = 0;
      let lowerSkin = 0;
      let lowerOpaque = 0;

      const cx0 = Math.floor(w * 0.18);
      const cx1 = Math.floor(w * 0.82);
      const cy0 = Math.floor(h * 0.15);
      const cy1 = Math.floor(h * 0.90);
      const lowerStart = Math.floor(h * 0.45);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const a = data[idx + 3];
          if (a < 180) continue;
          totalOpaque++;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const skin = isSkinPixel(r, g, b);
          if (skin) {
            skinMask[y * w + x] = 1;
            totalSkin++;
          }
          if (x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1) {
            centerOpaque++;
            if (skin) centerSkin++;
          }
          if (y >= lowerStart) {
            lowerOpaque++;
            if (skin) lowerSkin++;
          }
        }
      }

      if (totalOpaque < 100) {
        return { allowed: true, metrics: { totalOpaque } };
      }

      // Calcular suavidad / continuidad de los píxeles de piel (desnudez tiene áreas grandes lisas vs. caras/arte con mucho detalle)
      let smoothSkin = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const pos = y * w + x;
          if (!skinMask[pos]) continue;
          const neighbors = skinMask[pos - 1] + skinMask[pos + 1] + skinMask[pos - w] + skinMask[pos + w];
          if (neighbors >= 4) {
            const idx = pos * 4;
            const idxR = (pos + 1) * 4;
            const idxD = (pos + w) * 4;
            const diff = Math.abs(data[idx] - data[idxR]) + Math.abs(data[idx] - data[idxD]);
            if (diff < 18) smoothSkin++;
          }
        }
      }

      const skinRatio = totalSkin / totalOpaque;
      const centerRatio = centerOpaque > 0 ? (centerSkin / centerOpaque) : 0;
      const lowerRatio = lowerOpaque > 0 ? (lowerSkin / lowerOpaque) : 0;
      const smoothRatio = totalSkin > 0 ? (smoothSkin / totalSkin) : 0;

      const preset = PRESETS[cfg.level] || PRESETS.balanced;
      const maxSkin = kind === 'banner' ? preset.bannerSkinRatio : preset.avatarSkinRatio;
      const maxCenter = kind === 'banner' ? preset.bannerCenterSkinRatio : preset.avatarCenterSkinRatio;

      // Bloquea si hay alta exposición general + áreas lisas extensas, o exposición muy alta en zona central/inferior
      const highOverall = skinRatio >= maxSkin && smoothRatio >= preset.minSmoothRatio;
      const highCenterAndLower = centerRatio >= maxCenter && lowerRatio >= (maxSkin * 0.92) && smoothRatio >= (preset.minSmoothRatio - 0.05);
      const extremeExposure = skinRatio >= Math.min(0.82, maxSkin + 0.16);

      const metrics = {
        skinPct: Math.round(skinRatio * 100),
        centerPct: Math.round(centerRatio * 100),
        lowerPct: Math.round(lowerRatio * 100),
        smoothPct: Math.round(smoothRatio * 100),
        level: cfg.level
      };

      if (highOverall || highCenterAndLower || extremeExposure) {
        const reason = 'Imagen bloqueada por Normas de la Comunidad: el filtro automático detectó contenido potencialmente inapropiado o sensible (NSFW). Elige otra imagen apta para todo público.';
        addLog({ kind, fileName, allowed: false, reason, metrics });
        return { allowed: false, reason, metrics };
      }

      return { allowed: true, metrics };
    } catch (err) {
      return { allowed: false, reason: 'No se pudo validar la imagen seleccionada: ' + (err?.message || 'archivo dañado') };
    } finally {
      if (loaded?.revoke) {
        try { URL.revokeObjectURL(loaded.revoke); } catch {}
      }
    }
  }

  global.EKImageModeration = {
    PRESETS,
    getConfig,
    setConfig,
    getLogs,
    clearLogs,
    checkImage
  };
})(window);
