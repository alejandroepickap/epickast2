'use strict';

(function (global) {
  const MAX_BANNER_BYTES = 140 * 1024;

  const BANNER_PRESETS = [
    // --- Categoría 'gradient': 🌈 Degradados de Estudio Pro (12) ---
    {
      id: 'grad-aurora-hyperion',
      name: 'Aurora Hyperion',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 28%, #0284c7 68%, #34d399 100%)'
    },
    {
      id: 'grad-atardecer-shibuya',
      name: 'Atardecer en Shibuya',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #1f1135 0%, #9d174d 38%, #f43f5e 72%, #fbbf24 100%)'
    },
    {
      id: 'grad-nebulosa-amatista',
      name: 'Nebulosa de Amatista',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #0f0720 0%, #3b0764 35%, #7e22ce 70%, #e879f9 100%)'
    },
    {
      id: 'grad-obsidiana-oro-real',
      name: 'Obsidiana & Oro Real',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #090a0f 0%, #1c1917 45%, #78350f 78%, #fbbf24 100%)'
    },
    {
      id: 'grad-oceano-bioluminiscente',
      name: 'Océano Bioluminiscente',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #020617 0%, #0c4a6e 40%, #0284c7 72%, #38bdf8 100%)'
    },
    {
      id: 'grad-sakura-medianoche',
      name: 'Sakura de Medianoche',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #160b24 0%, #500724 40%, #be185d 74%, #fbcfe8 100%)'
    },
    {
      id: 'grad-cyberpunk-akihabara',
      name: 'Cyberpunk Akihabara',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #13072e 0%, #701a75 36%, #db2777 68%, #06b6d4 100%)'
    },
    {
      id: 'grad-esmeralda-cuantica',
      name: 'Esmeralda Cuántica',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #021814 0%, #064e3b 42%, #059669 75%, #6ee7b7 100%)'
    },
    {
      id: 'grad-forja-carmesi',
      name: 'Forja Carmesí',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #180606 0%, #7f1d1d 40%, #dc2626 72%, #fb923c 100%)'
    },
    {
      id: 'grad-prisma-holografico',
      name: 'Prisma Holográfico',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 34%, #ec4899 68%, #38bdf8 100%)'
    },
    {
      id: 'grad-cielo-lofi-pastel',
      name: 'Cielo Lo-Fi Pastel',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #1e293b 0%, #475569 35%, #818cf8 70%, #f472b6 100%)'
    },
    {
      id: 'grad-tormenta-electrica',
      name: 'Tormenta Eléctrica',
      category: 'gradient',
      badge: 'ESTUDIO PRO',
      value: 'linear-gradient(135deg, #030712 0%, #1e3a8a 42%, #4f46e5 74%, #22d3ee 100%)'
    },

    // --- Categoría 'world': 🏞️ Mundos Cartoon (3) ---
    {
      id: 'cartoon-dojo-courtyard',
      name: 'Patio del Dojo (Caricatura)',
      category: 'world',
      badge: 'MUNDO DOJO',
      value: "url('assets/cartoon/banner_dojo_courtyard.webp') center/cover no-repeat"
    },
    {
      id: 'cartoon-sunny-valley',
      name: 'Valle Soleado (Caricatura)',
      category: 'world',
      badge: 'MUNDO ISLA',
      value: "url('assets/cartoon/banner_sunny_valley.webp') center/cover no-repeat"
    },
    {
      id: 'cartoon-snow-track',
      name: 'Cumbre Nevada (Caricatura)',
      category: 'world',
      badge: 'MUNDO NIEVE',
      value: "url('assets/cartoon/banner_snow_track.webp') center/cover no-repeat"
    }
  ];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function applyStyle(node, styles) {
    if (!node || !styles) return;
    Object.assign(node.style, styles);
  }

  function normalizeHex(hex, fallback) {
    if (typeof hex !== 'string') return fallback || '#6366f1';
    const trimmed = hex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return fallback || '#6366f1';
  }

  function pickrColorToHex(color, fallback) {
    if (!color) return fallback || '#6366f1';
    try {
      const hexa = color.toHEXA();
      if (Array.isArray(hexa) && hexa.length >= 3) {
        return normalizeHex(`#${hexa[0]}${hexa[1]}${hexa[2]}`, fallback);
      }
      return normalizeHex(String(hexa.toString()).slice(0, 7), fallback);
    } catch (_) {
      return fallback || '#6366f1';
    }
  }

  function parseInitialColor(initial) {
    const result = {
      mode: 'solid',
      solidHex: '#6366f1',
      gradDeg: 135,
      gradColor1: '#6366f1',
      gradColor2: '#ec4899'
    };

    if (typeof initial !== 'string') return result;
    const raw = initial.trim();
    if (!raw) return result;

    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
      const hex = normalizeHex(raw);
      result.mode = 'solid';
      result.solidHex = hex;
      result.gradColor1 = hex;
      return result;
    }

    if (/^linear-gradient\(/i.test(raw)) {
      const degMatch = raw.match(/(-?\d+(?:\.\d+)?)\s*deg/i);
      if (degMatch) {
        const parsed = Math.round(Number(degMatch[1]));
        if (!Number.isNaN(parsed)) {
          result.gradDeg = ((parsed % 360) + 360) % 360;
        }
      }
      const hexMatches = raw.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g);
      if (hexMatches && hexMatches.length >= 2) {
        result.mode = 'gradient';
        result.gradColor1 = normalizeHex(hexMatches[0], result.gradColor1);
        result.gradColor2 = normalizeHex(hexMatches[hexMatches.length - 1], result.gradColor2);
        result.solidHex = result.gradColor1;
      }
    }

    return result;
  }

  function buildGradientString(deg, c1, c2) {
    const cleanDeg = Math.max(0, Math.min(360, Math.round(Number(deg) || 0)));
    const h1 = normalizeHex(c1, '#6366f1');
    const h2 = normalizeHex(c2, '#ec4899');
    return `linear-gradient(${cleanDeg}deg, ${h1}, ${h2})`;
  }

  function createColorPickerField(initialHex, labelText, onPick, needsFallbackTheme) {
    const row = el('div', 'ek-color-row');
    if (needsFallbackTheme) {
      applyStyle(row, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 10px',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      });
    }

    const slot = el('div', 'ek-pickr-slot');
    const anchor = el('div', 'ek-pickr-anchor');
    slot.appendChild(anchor);

    const meta = el('div', 'ek-color-meta');
    if (needsFallbackTheme) {
      applyStyle(meta, {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        minWidth: '0',
        flex: '1'
      });
    }
    const label = el('span', 'ek-color-label', labelText);
    if (needsFallbackTheme) {
      applyStyle(label, { fontSize: '11.5px', color: '#9ca3af' });
    }
    const hexBadge = el('span', 'ek-color-hex', normalizeHex(initialHex));
    if (needsFallbackTheme) {
      applyStyle(hexBadge, {
        fontSize: '13px',
        fontWeight: '600',
        fontFamily: 'monospace',
        color: '#f3f4f6'
      });
    }
    meta.appendChild(label);
    meta.appendChild(hexBadge);

    row.appendChild(slot);
    row.appendChild(meta);

    let pickrInstance = null;
    const PickrCtor = global.EKVendor?.Pickr;

    const mountNativeFallback = () => {
      slot.textContent = '';
      const input = el('input', 'ek-color-native');
      input.type = 'color';
      input.value = normalizeHex(initialHex);
      input.setAttribute('aria-label', labelText);
      applyStyle(input, {
        width: '36px',
        height: '32px',
        padding: '0',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '8px',
        background: 'transparent',
        cursor: 'pointer'
      });
      input.addEventListener('input', () => {
        const hex = normalizeHex(input.value, initialHex);
        hexBadge.textContent = hex;
        onPick(hex);
      });
      slot.appendChild(input);
    };

    if (PickrCtor && typeof PickrCtor.create === 'function') {
      try {
        pickrInstance = PickrCtor.create({
          el: anchor,
          theme: 'nano',
          default: normalizeHex(initialHex),
          lockOpacity: true,
          defaultRepresentation: 'HEX',
          swatches: [
            '#6366f1',
            '#8b5cf6',
            '#ec4899',
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#06b6d4',
            '#3b82f6',
            '#0f172a'
          ],
          components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
              hex: true,
              input: true,
              save: true,
              clear: false
            }
          },
          i18n: {
            'btn:save': 'Listo ✓'
          }
        });

        const root = pickrInstance.getRoot?.();
        if (root?.app) {
          root.app.style.zIndex = '100250';
        }

        const handlePickrColor = (color) => {
          const hex = pickrColorToHex(color, initialHex);
          hexBadge.textContent = hex;
          if (root?.button) {
            root.button.style.setProperty('--pcr-color', hex);
          }
          onPick(hex);
        };

        pickrInstance.on('change', handlePickrColor);
        pickrInstance.on('swatchselect', (color) => {
          handlePickrColor(color);
          try { pickrInstance?.hide?.(); } catch (_) {}
        });
        pickrInstance.on('save', (color) => {
          if (color) handlePickrColor(color);
          try { pickrInstance?.hide?.(); } catch (_) {}
        });

        // Cerrar al hacer clic fuera del popup o presionar Escape
        const onDocDown = (ev) => {
          if (!pickrInstance || !pickrInstance.isOpen?.()) return;
          const t = ev.target;
          if (root?.app && root.app.contains(t)) return;
          if (root?.button && root.button.contains(t)) return;
          try { pickrInstance.hide(); } catch (_) {}
        };
        const onDocKey = (ev) => {
          if (ev.key === 'Escape' && pickrInstance?.isOpen?.()) {
            try { pickrInstance.hide(); } catch (_) {}
          }
        };
        document.addEventListener('mousedown', onDocDown, true);
        document.addEventListener('keydown', onDocKey, true);
        pickrInstance._ekCleanup = () => {
          document.removeEventListener('mousedown', onDocDown, true);
          document.removeEventListener('keydown', onDocKey, true);
        };
      } catch (_) {
        pickrInstance = null;
        mountNativeFallback();
      }
    } else {
      mountNativeFallback();
    }

    return {
      row,
      hide() {
        try {
          pickrInstance?.hide?.();
        } catch (_) {}
      },
      destroy() {
        if (!pickrInstance) return;
        try { pickrInstance._ekCleanup?.(); } catch (_) {}
        try {
          if (typeof pickrInstance.destroyAndRemove === 'function') {
            pickrInstance.destroyAndRemove();
          } else if (typeof pickrInstance.destroy === 'function') {
            pickrInstance.destroy();
          }
        } catch (_) {}
        pickrInstance = null;
      }
    };
  }

  function mountColorControl(container, opts) {
    if (!container) return function noop() {};

    const safeOpts = opts || {};
    const onChange = typeof safeOpts.onChange === 'function' ? safeOpts.onChange : null;
    const state = parseInitialColor(safeOpts.initial);
    let destroyed = false;

    container.textContent = '';
    const root = el('div', 'ek-color-studio');
    container.appendChild(root);

    const cs = global.getComputedStyle ? global.getComputedStyle(root) : null;
    const needsFallbackTheme =
      !cs ||
      !cs.padding ||
      (cs.padding === '0px' && (!cs.borderStyle || cs.borderStyle === 'none'));

    if (needsFallbackTheme) {
      applyStyle(root, {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      });
    }

    // Solo color sólido libre (los degradados y brillos especiales son exclusivos de la Bóveda)
    state.mode = 'solid';
    const solidPanel = el('div', 'ek-color-panel ek-color-panel-solid');
    const solidPicker = createColorPickerField(
      state.solidHex,
      'Color de tu Nombre de Usuario (en chat y miembros)',
      (hex) => {
        if (destroyed) return;
        state.solidHex = hex;
        if (onChange) {
          onChange(state.solidHex);
        }
      },
      needsFallbackTheme
    );
    const vaultHint = el('div', 'ek-color-vault-hint', '✨ Los colores con degradado y brillo son exclusivos de la Bóveda.');
    applyStyle(vaultHint, {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '6px'
    });
    solidPanel.appendChild(solidPicker.row);
    solidPanel.appendChild(vaultHint);
    root.appendChild(solidPanel);

    return function destroy() {
      if (destroyed) return;
      destroyed = true;
      solidPicker.destroy();
      if (root.parentNode === container) {
        container.removeChild(root);
      }
    };
  }

  function canvasToBlob(canvas, mime, quality) {
    return new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => resolve(blob || null), mime, quality);
      } catch (_) {
        resolve(null);
      }
    });
  }

  function renderCoverFallbackCanvas(imgEl, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const iw = imgEl.naturalWidth || imgEl.width || width;
    const ih = imgEl.naturalHeight || imgEl.height || height;
    const scale = Math.max(width / iw, height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imgEl, dx, dy, dw, dh);
    return canvas;
  }

  function openBannerCropper(file, opts) {
    if (!file) return;
    const safeOpts = opts || {};
    const onApply = typeof safeOpts.onApply === 'function' ? safeOpts.onApply : null;

    // Close any previous cropper overlay
    document.querySelectorAll('.ek-cropper-overlay').forEach((n) => {
      if (n.parentNode) n.parentNode.removeChild(n);
    });

    const isBlobLike = typeof Blob !== 'undefined' && file instanceof Blob;
    const sourceObjectUrl = isBlobLike ? URL.createObjectURL(file) : String(file);
    let cropper = null;
    let closed = false;

    const overlay = el('div', 'ek-cropper-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Recortar banner');

    const card = el('div', 'ek-cropper-card');
    const header = el('div', 'ek-cropper-header');
    const title = el('h3', 'ek-cropper-title', 'Recortar banner (16:5)');
    const closeBtn = el('button', 'ek-cropper-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    header.appendChild(title);
    header.appendChild(closeBtn);

    const stage = el('div', 'ek-cropper-stage');
    const imgEl = el('img', 'ek-cropper-img');
    imgEl.alt = 'Vista previa de banner';
    stage.appendChild(imgEl);

    const toolbar = el('div', 'ek-cropper-toolbar');
    const zoomGroup = el('div', 'ek-cropper-zoom-group');
    const zoomOutBtn = el('button', 'ek-cropper-btn', 'Zoom -');
    zoomOutBtn.type = 'button';
    const zoomInBtn = el('button', 'ek-cropper-btn', 'Zoom +');
    zoomInBtn.type = 'button';
    const resetBtn = el('button', 'ek-cropper-btn', 'Reiniciar');
    resetBtn.type = 'button';
    zoomGroup.appendChild(zoomOutBtn);
    zoomGroup.appendChild(zoomInBtn);
    zoomGroup.appendChild(resetBtn);

    const actionGroup = el('div', 'ek-cropper-actions');
    const cancelBtn = el('button', 'ek-cropper-btn ek-cropper-cancel', 'Cancelar');
    cancelBtn.type = 'button';
    const applyBtn = el('button', 'ek-cropper-btn ek-cropper-apply', 'Aplicar y Subir');
    applyBtn.type = 'button';
    applyBtn.disabled = true;
    actionGroup.appendChild(cancelBtn);
    actionGroup.appendChild(applyBtn);

    toolbar.appendChild(zoomGroup);
    toolbar.appendChild(actionGroup);

    card.appendChild(header);
    card.appendChild(stage);
    card.appendChild(toolbar);
    overlay.appendChild(card);

    // Ensure overlay renders above #modal even before style.css loads
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '100500';
    document.body.appendChild(overlay);

    const cs = global.getComputedStyle ? global.getComputedStyle(overlay) : null;
    const needsFallbackTheme =
      !cs || cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent';

    if (needsFallbackTheme) {
      applyStyle(overlay, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(8px)'
      });
      applyStyle(card, {
        width: 'min(94vw, 680px)',
        maxHeight: '92dvh',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '16px',
        background: '#111622',
        color: '#f3f4f6',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)'
      });
      applyStyle(header, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      });
      applyStyle(title, { margin: '0', fontSize: '16px', fontWeight: '700' });
      applyStyle(closeBtn, {
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#e5e7eb',
        cursor: 'pointer',
        fontSize: '15px'
      });
      applyStyle(stage, {
        width: '100%',
        height: 'min(52vh, 360px)',
        background: '#070a10',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
      applyStyle(imgEl, {
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%'
      });
      applyStyle(toolbar, {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      });
      applyStyle(zoomGroup, { display: 'flex', gap: '6px', flexWrap: 'wrap' });
      applyStyle(actionGroup, { display: 'flex', gap: '8px', flexWrap: 'wrap' });

      const styleBtn = (btn, primary) => {
        applyStyle(btn, {
          minHeight: '38px',
          padding: '8px 14px',
          borderRadius: '10px',
          border: primary ? 'none' : '1px solid rgba(255, 255, 255, 0.14)',
          background: primary ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255, 255, 255, 0.06)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: primary ? '600' : '500',
          cursor: 'pointer',
          touchAction: 'manipulation'
        });
      };
      [zoomOutBtn, zoomInBtn, resetBtn, cancelBtn].forEach((b) => styleBtn(b, false));
      styleBtn(applyBtn, true);
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
      }
    };

    const cleanup = () => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeyDown, true);
      if (cropper) {
        try {
          cropper.destroy();
        } catch (_) {}
        cropper = null;
      }
      if (isBlobLike && sourceObjectUrl) {
        try {
          URL.revokeObjectURL(sourceObjectUrl);
        } catch (_) {}
      }
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    closeBtn.addEventListener('click', cleanup);
    cancelBtn.addEventListener('click', cleanup);

    zoomOutBtn.addEventListener('click', () => cropper?.zoom?.(-0.15));
    zoomInBtn.addEventListener('click', () => cropper?.zoom?.(0.15));
    resetBtn.addEventListener('click', () => cropper?.reset?.());

    imgEl.onload = () => {
      if (closed) return;
      const CropperCtor = global.EKVendor?.Cropper;
      if (CropperCtor) {
        try {
          cropper = new CropperCtor(imgEl, {
            aspectRatio: 16 / 5,
            viewMode: 1,
            autoCropArea: 1,
            dragMode: 'move',
            responsive: true,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            background: false,
            toggleDragModeOnDblclick: false
          });
        } catch (_) {
          cropper = null;
        }
      }
      applyBtn.disabled = false;
    };

    imgEl.onerror = () => {
      cleanup();
    };

    applyBtn.addEventListener('click', async () => {
      if (closed) return;
      applyBtn.disabled = true;
      cancelBtn.disabled = true;
      applyBtn.textContent = 'Procesando...';

      try {
        const canvas = cropper
          ? cropper.getCroppedCanvas({
              width: 960,
              height: 300,
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high'
            })
          : renderCoverFallbackCanvas(imgEl, 960, 300);

        if (!canvas) {
          cleanup();
          return;
        }

        let mime = 'image/webp';
        let blob = await canvasToBlob(canvas, 'image/webp', 0.84);

        if (!blob || blob.type !== 'image/webp' || blob.size > MAX_BANNER_BYTES) {
          mime = 'image/jpeg';
          blob = await canvasToBlob(canvas, 'image/jpeg', 0.84);
          if (blob && blob.size > MAX_BANNER_BYTES) {
            const compactJpeg = await canvasToBlob(canvas, 'image/jpeg', 0.72);
            if (compactJpeg) blob = compactJpeg;
          }
        }

        if (!blob || closed) {
          cleanup();
          return;
        }

        mime = blob.type || mime;
        const previewUrl = URL.createObjectURL(blob);
        cleanup();

        if (onApply) {
          onApply({ blob, previewUrl, mime });
        }
      } catch (_) {
        cleanup();
      }
    });

    imgEl.src = sourceObjectUrl;
  }

  function normalizeRarity(rarity) {
    const r = String(rarity || 'common').toLowerCase().trim();
    if (r === 'legendario' || r === 'legendary') return 'legendary';
    if (r === 'epico' || r === 'épico' || r === 'epic') return 'epic';
    if (r === 'raro' || r === 'rare') return 'rare';
    return 'common';
  }

  function celebrateReward(rarity) {
    const confetti = global.EKVendor?.confetti;
    if (typeof confetti !== 'function') return;

    const tier = normalizeRarity(rarity);
    if (tier === 'common') return;

    const fire = (opts) => {
      try {
        confetti(
          Object.assign(
            {
              zIndex: 100999,
              disableForReducedMotion: true
            },
            opts
          )
        );
      } catch (_) {}
    };

    if (tier === 'rare') {
      fire({
        particleCount: 28,
        spread: 52,
        startVelocity: 26,
        scalar: 0.8,
        ticks: 140,
        origin: { y: 0.62 },
        colors: ['#38bdf8', '#60a5fa', '#bae6fd', '#e0f2fe']
      });
      return;
    }

    if (tier === 'epic') {
      fire({
        particleCount: 68,
        spread: 76,
        startVelocity: 38,
        scalar: 0.95,
        ticks: 180,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#7c3aed', '#22d3ee', '#06b6d4', '#e879f9']
      });
      return;
    }

    if (tier === 'legendary') {
      const colors = ['#fbbf24', '#f59e0b', '#fde047', '#a855f7', '#7c3aed', '#ffffff'];
      fire({
        particleCount: 85,
        spread: 92,
        startVelocity: 44,
        origin: { x: 0.5, y: 0.58 },
        colors
      });
      setTimeout(() => {
        fire({
          particleCount: 45,
          angle: 60,
          spread: 58,
          startVelocity: 40,
          origin: { x: 0.14, y: 0.65 },
          colors
        });
        fire({
          particleCount: 45,
          angle: 120,
          spread: 58,
          startVelocity: 40,
          origin: { x: 0.86, y: 0.65 },
          colors
        });
      }, 170);
      setTimeout(() => {
        fire({
          particleCount: 55,
          spread: 112,
          startVelocity: 30,
          scalar: 1.05,
          origin: { x: 0.5, y: 0.45 },
          colors
        });
      }, 340);
    }
  }

  function animateVaultReveal(elNode, rarity) {
    if (!elNode) return null;
    const tier = normalizeRarity(rarity);
    const gsap = global.EKVendor?.gsap;

    if (!gsap || typeof gsap.fromTo !== 'function') {
      elNode.style.opacity = '1';
      return null;
    }

    const presets = {
      legendary: {
        fromScale: 0.72,
        fromY: 28,
        duration: 0.55,
        ease: 'back.out(1.8)',
        glow: '0 0 36px rgba(251, 191, 36, 0.7), 0 0 18px rgba(168, 85, 247, 0.55)',
        settleGlow: '0 0 18px rgba(251, 191, 36, 0.35)'
      },
      epic: {
        fromScale: 0.78,
        fromY: 22,
        duration: 0.45,
        ease: 'back.out(1.6)',
        glow: '0 0 28px rgba(168, 85, 247, 0.6), 0 0 14px rgba(34, 211, 238, 0.45)',
        settleGlow: '0 0 14px rgba(168, 85, 247, 0.25)'
      },
      rare: {
        fromScale: 0.86,
        fromY: 16,
        duration: 0.38,
        ease: 'back.out(1.4)',
        glow: '0 0 20px rgba(56, 189, 248, 0.48)',
        settleGlow: '0 0 8px rgba(56, 189, 248, 0.2)'
      },
      common: {
        fromScale: 0.92,
        fromY: 12,
        duration: 0.28,
        ease: 'power2.out',
        glow: null,
        settleGlow: null
      }
    };

    const cfg = presets[tier] || presets.common;

    try {
      gsap.killTweensOf?.(elNode);
      const fromVars = { scale: cfg.fromScale, opacity: 0, y: cfg.fromY };
      if (cfg.glow) fromVars.boxShadow = cfg.glow;

      const tween = gsap.fromTo(elNode, fromVars, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: cfg.duration,
        ease: cfg.ease,
        clearProps: cfg.glow ? 'transform,opacity' : 'transform,opacity,boxShadow',
        onComplete() {
          if (cfg.glow && typeof gsap.to === 'function') {
            gsap.to(elNode, {
              boxShadow: cfg.settleGlow,
              duration: 0.45,
              ease: 'power2.out',
              clearProps: 'boxShadow'
            });
          }
        }
      });
      return tween;
    } catch (_) {
      elNode.style.opacity = '1';
      return null;
    }
  }

  function hasBalancedParens(str) {
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth < 0) return false;
        if (depth === 0 && i < str.length - 1) return false;
      }
    }
    return depth === 0;
  }

  function resolveHttpBase(httpBaseFn) {
    let base = '';
    if (typeof httpBaseFn === 'function') {
      try {
        base = String(httpBaseFn() || '').trim();
      } catch (_) {
        base = '';
      }
    } else if (typeof httpBaseFn === 'string') {
      base = httpBaseFn.trim();
    }
    base = base.replace(/\/+$/, '');
    if (!base) return '';
    if (!/^https?:\/\/[^\s"'();<>\\]+$/i.test(base)) {
      return '';
    }
    return base;
  }

  function bannerStyle(bannerVal, httpBaseFn) {
    if (typeof bannerVal !== 'string') return '';
    const raw = bannerVal.trim();
    if (!raw || raw.length > 320) return '';

    // Reject dangerous CSS injection tokens globally
    if (/[;'"\\{}<>]|\.\./.test(raw) && !/^url\(\s*['"]?(?:\/files\/|assets\/)/i.test(raw)) {
      return '';
    }

    // 1. Uploaded file path: /files/123 or url(/files/123)
    const fileMatch = raw.match(
      /^(?:url\(\s*['"]?)?(\/files\/[A-Za-z0-9._\-\/%]+(?:\?[A-Za-z0-9._\-=&%]+)?)(?:['"]?\s*\))?$/i
    );
    if (fileMatch) {
      const filePath = fileMatch[1];
      if (filePath.includes('..')) return '';
      const base = resolveHttpBase(httpBaseFn);
      const fullUrl = base ? `${base}${filePath}` : filePath;
      return `background-image:url('${fullUrl}');background-size:cover;background-position:center`;
    }

    // 1b. Packaged safe local asset path: assets/... or url('assets/...')
    const assetMatch = raw.match(
      /^(?:url\(\s*['"]?)?(assets\/[a-z0-9_\/-]+\.(?:webp|jpg|jpeg|png))(?:['"]?\s*\))?(?:\s+[a-z0-9/% -]{1,40})?$/i
    );
    if (assetMatch) {
      const assetPath = assetMatch[1];
      if (assetPath.includes('..') || /[;'"\\{}<>]/.test(assetPath)) return '';
      return `background-image:url('${assetPath}');background-size:cover;background-position:center`;
    }

    // Reject remaining unsafe chars/schemes for color & gradient values
    if (/[;'"\\{}<>]/.test(raw) || /(?:javascript|data|expression|url)\s*[:(]/i.test(raw)) {
      return '';
    }

    // 2. Hex color
    if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) {
      return `background:${raw}`;
    }

    // 3. CSS gradients
    if (
      /^(?:linear|radial|conic)-gradient\([A-Za-z0-9#%,.\s()\-+]+\)$/i.test(raw) &&
      hasBalancedParens(raw)
    ) {
      return `background:${raw}`;
    }

    // 4. rgb/rgba/hsl/hsla
    if (/^(?:rgba?|hsla?)\(\s*[0-9.%\s,/deg]+\s*\)$/i.test(raw) && hasBalancedParens(raw)) {
      return `background:${raw}`;
    }

    return '';
  }

  function mountBannerGallery(container, opts) {
    if (!container) return function noop() {};

    const safeOpts = opts || {};
    const onSelect = typeof safeOpts.onSelect === 'function' ? safeOpts.onSelect : null;
    const onUploadClick =
      typeof safeOpts.onUploadClick === 'function' ? safeOpts.onUploadClick : null;
    const httpBaseFn = safeOpts.httpBaseFn || null;
    let selectedValue = typeof safeOpts.initial === 'string' ? safeOpts.initial.trim() : '';
    let activeCategory = 'gradient';
    let destroyed = false;

    const mergedPresets = BANNER_PRESETS.map((p) => Object.assign({}, p));
    const seenValues = new Set(mergedPresets.map((p) => p.value));

    if (Array.isArray(safeOpts.customBanners)) {
      safeOpts.customBanners.forEach((raw, idx) => {
        if (!raw || typeof raw !== 'object') return;
        const val = String(raw.value || raw.val || '').trim();
        if (!val || seenValues.has(val)) return;
        seenValues.add(val);
        mergedPresets.push({
          id: raw.id || `custom-banner-${idx}`,
          name: String(raw.name || 'Banner Desbloqueado').replace(/^Banner:\s*/i, ''),
          category: raw.category || (val.includes('assets/banners/') ? 'anime' : 'world'),
          badge: raw.badge || (raw.rarity ? String(raw.rarity).toUpperCase() : 'BÓVEDA'),
          value: val
        });
      });
    }

    if (selectedValue && !seenValues.has(selectedValue)) {
      const matched = mergedPresets.find((p) => p.value === selectedValue);
      if (matched && matched.category) {
        activeCategory = matched.category;
      } else {
        activeCategory = 'all';
      }
    } else if (selectedValue) {
      const matched = mergedPresets.find((p) => p.value === selectedValue);
      if (matched && matched.category) {
        activeCategory = matched.category;
      }
    }

    container.textContent = '';
    const root = el('div', 'ek-banner-gallery');
    applyStyle(root, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '10px',
      borderRadius: '12px',
      background: 'rgba(15, 23, 42, 0.65)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    });

    const topBar = el('div', 'ek-banner-gallery-bar');
    applyStyle(topBar, {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '6px'
    });

    const pillsGroup = el('div', 'ek-banner-cat-pills');
    applyStyle(pillsGroup, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      flex: '1'
    });

    const categories = [
      { id: 'gradient', label: '🌈 Degradados Pro' },
      { id: 'world', label: '🏞️ Mundos' },
      { id: 'all', label: '🎁 Todos' }
    ];

    const pillBtns = new Map();
    categories.forEach((cat) => {
      const btn = el('button', 'ek-banner-cat-pill', cat.label);
      btn.type = 'button';
      btn.dataset.category = cat.id;
      btn.addEventListener('click', () => {
        if (destroyed) return;
        activeCategory = cat.id;
        renderGallery();
      });
      pillBtns.set(cat.id, btn);
      pillsGroup.appendChild(btn);
    });
    topBar.appendChild(pillsGroup);

    if (onUploadClick) {
      const uploadBtn = el(
        'button',
        'ek-banner-upload-btn',
        '🖼️ Subir y Recortar (16:5)'
      );
      uploadBtn.type = 'button';
      applyStyle(uploadBtn, {
        minHeight: '32px',
        padding: '5px 11px',
        borderRadius: '8px',
        border: '1px solid rgba(56, 189, 248, 0.5)',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(124, 58, 237, 0.28))',
        color: '#e0f2fe',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        touchAction: 'manipulation'
      });
      uploadBtn.addEventListener('click', () => {
        if (!destroyed) onUploadClick();
      });
      topBar.appendChild(uploadBtn);
    }

    const grid = el('div', 'ek-banner-grid');
    applyStyle(grid, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
      gap: '10px',
      maxHeight: '340px',
      overflowY: 'auto',
      padding: '4px 4px 4px 2px',
      alignContent: 'start'
    });

    root.appendChild(topBar);
    root.appendChild(grid);
    container.appendChild(root);

    function stylePillButton(btn, isActive) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      applyStyle(btn, {
        minHeight: '30px',
        padding: '4px 10px',
        borderRadius: '999px',
        border: isActive
          ? '1px solid rgba(168, 85, 247, 0.8)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        background: isActive ? 'rgba(124, 58, 237, 0.32)' : 'rgba(255, 255, 255, 0.05)',
        color: isActive ? '#faf5ff' : '#cbd5e1',
        fontSize: '11.5px',
        fontWeight: isActive ? '700' : '500',
        cursor: 'pointer',
        touchAction: 'manipulation'
      });
    }

    function renderGallery() {
      if (destroyed) return;
      pillBtns.forEach((btn, id) => {
        stylePillButton(btn, id === activeCategory);
      });

      grid.textContent = '';

      const filtered = mergedPresets.filter((item) => {
        if (activeCategory === 'all') return true;
        return item.category === activeCategory;
      });

      filtered.forEach((preset) => {
        const isSelected = selectedValue === preset.value;
        const card = el(
          'div',
          `ek-banner-card ek-banner-gallery-card${isSelected ? ' active' : ''}`
        );
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.dataset.bannerId = preset.id;
        card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        card.setAttribute('title', preset.name);

        const cssBg = bannerStyle(preset.value, httpBaseFn);
        if (cssBg) {
          card.setAttribute('style', cssBg);
        }
        applyStyle(card, {
          position: 'relative',
          height: '74px',
          minHeight: '74px',
          width: '100%',
          borderRadius: '10px',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          padding: '0',
          cursor: 'pointer',
          textAlign: 'left',
          border: isSelected
            ? '2px solid #a855f7'
            : '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: isSelected
            ? '0 0 14px rgba(168, 85, 247, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.35)'
            : '0 4px 10px rgba(0, 0, 0, 0.35)',
          transition: 'transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease'
        });

        if (preset.badge) {
          const badge = el('span', 'ek-banner-card-badge', preset.badge);
          applyStyle(badge, {
            position: 'absolute',
            top: '5px',
            right: '6px',
            padding: '2px 6px',
            borderRadius: '999px',
            background: 'rgba(9, 13, 22, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#f8fafc',
            fontSize: '9.5px',
            fontWeight: '700',
            letterSpacing: '0.03em',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none'
          });
          card.appendChild(badge);
        }

        if (isSelected) {
          const check = el('span', 'ek-banner-card-check', '✓');
          applyStyle(check, {
            position: 'absolute',
            top: '5px',
            left: '6px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none'
          });
          card.appendChild(check);
        }

        const labelBar = el('div', 'ek-banner-card-label', preset.name);
        applyStyle(labelBar, {
          position: 'absolute',
          left: '0',
          right: '0',
          bottom: '0',
          padding: '4px 8px',
          background: 'linear-gradient(180deg, rgba(9, 13, 22, 0.25) 0%, rgba(9, 13, 22, 0.88) 100%)',
          backdropFilter: 'blur(4px)',
          color: '#f8fafc',
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          pointerEvents: 'none'
        });
        card.appendChild(labelBar);

        card.addEventListener('click', () => {
          if (destroyed) return;
          selectedValue = preset.value;
          renderGallery();
          if (onSelect) {
            onSelect(preset.value, preset);
          }
        });

        grid.appendChild(card);
      });
    }

    renderGallery();

    const cleanup = function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (root.parentNode === container) {
        container.removeChild(root);
      }
    };
    cleanup.setSelected = function setSelected(nextVal) {
      if (destroyed) return;
      selectedValue = typeof nextVal === 'string' ? nextVal.trim() : '';
      renderGallery();
    };
    return cleanup;
  }

  global.EKProfileStudio = {
    BANNER_PRESETS,
    mountColorControl,
    mountBannerGallery,
    openBannerCropper,
    celebrateReward,
    animateVaultReveal,
    bannerStyle
  };
})(window);
