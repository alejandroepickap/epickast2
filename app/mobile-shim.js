'use strict';
/**
 * EpicKast · Puente móvil / web (v1.9.3)
 * --------------------------------------------------------------
 * Se carga ANTES que el resto de scripts. En Electron, `window.epic` ya existe
 * (lo expone preload.js vía contextBridge) y este archivo solo añade clases de
 * plataforma al <body>. En navegador (PWA) o Capacitor (Android / iOS), crea un
 * `window.epic` compatible para que renderer.js / call.js funcionen sin cambios.
 *
 * Clases añadidas a <html> y <body>:
 *   - ek-electron  : app de escritorio (Electron)
 *   - ek-web       : navegador o Capacitor (sin Electron)
 *   - ek-capacitor : app nativa Android / iOS (Capacitor)
 *   - ek-touch     : dispositivo con puntero táctil (pointer: coarse)
 *   - ek-no-screen : el dispositivo no puede compartir pantalla (getDisplayMedia)
 */
(function () {
  const EK_WEB_VERSION = '1.9.3';
  const isElectron = !!window.epic;
  const cap = window.Capacitor;
  const isAndroidApk = location.hostname === 'appassets.epickast.local';
  const isCapacitor = isAndroidApk || !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  const isTouch = isAndroidApk || !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  const canShareScreen = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') && !isTouch;

  const classes = [isElectron ? 'ek-electron' : 'ek-web'];
  if (isCapacitor) classes.push('ek-capacitor');
  if (isTouch) classes.push('ek-touch');
  if (!isElectron && !canShareScreen) classes.push('ek-no-screen');
  document.documentElement.classList.add(...classes);
  const applyBody = () => document.body && document.body.classList.add(...classes);
  if (document.body) applyBody(); else document.addEventListener('DOMContentLoaded', applyBody, { once: true });

  window.EKPlatform = Object.freeze({ isElectron, isWeb: !isElectron, isCapacitor, isTouch, canShareScreen, version: EK_WEB_VERSION });

  if (isElectron) return;

  // ---------- Almacenamiento de sesión (sin contraseña en claro) ----------
  const AUTH_KEY = 'epickast.mobile.auth';
  const CFG_KEY = 'epickast.mobile.config';
  const readJson = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
  const writeJson = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  const noop = () => {};
  const resolved = (v) => Promise.resolve(v);

  window.epic = {
    // Pantalla compartida: el navegador muestra su propio selector nativo
    listSources: () => resolved(canShareScreen
      ? [{ id: 'browser', name: 'Elegir en el navegador…', screen: true, thumb: 'logo.svg' }]
      : []),
    selectSource: () => resolved(true),
    metrics: () => resolved([]),
    flash: () => { try { if (isTouch && navigator.vibrate) navigator.vibrate(60); } catch {} return resolved(); },
    minimize: () => resolved(), maximize: () => resolved(), close: () => resolved(),
    toggleMini: () => resolved(false),
    onMiniChanged: noop,
    version: () => resolved(EK_WEB_VERSION),
    isStore: () => resolved(true), // sin auto-actualizador: lo gestiona la tienda / el navegador
    openExternal: (url) => {
      try {
        const browser = cap?.Plugins?.Browser;
        if (isCapacitor && browser?.open) return browser.open({ url });
        window.open(url, '_blank', 'noopener');
      } catch {}
      return resolved();
    },
    getUpdateLog: () => resolved(''),
    onUpdateProgress: noop,
    setShortcuts: () => resolved(), onShortcut: noop,
    // La contraseña NUNCA se guarda en localStorage: solo el token de sesión (rpc 'resume')
    loadAuth: () => resolved(readJson(AUTH_KEY, null)),
    saveAuth: (data) => {
      if (!data) { writeJson(AUTH_KEY, null); return resolved(true); }
      const { server, user, token, remember } = data;
      writeJson(AUTH_KEY, { server, user, token, remember: remember !== false });
      return resolved(true);
    },
    detectGame: () => resolved(null),
    getConfig: () => resolved(readJson(CFG_KEY, {})),
    setConfig: (patch) => { writeJson(CFG_KEY, { ...readJson(CFG_KEY, {}), ...(patch || {}) }); return resolved(true); },
    relaunch: () => { location.reload(); return resolved(); },
    uninstall: () => resolved(false),
    toggleOverlay: () => resolved(false),
    updateOverlay: noop,
    onOverlayData: noop,
    onOverlayStatus: noop,
  };

  // ---------- AudioContext: desbloquear en el primer gesto táctil (iOS / Android) ----------
  const NativeAC = window.AudioContext || window.webkitAudioContext;
  if (NativeAC) {
    const live = new Set();
    const Patched = function (...args) { const ctx = new NativeAC(...args); live.add(ctx); return ctx; };
    Patched.prototype = NativeAC.prototype;
    try { window.AudioContext = Patched; } catch {}
    const unlock = () => { live.forEach((c) => { if (c.state === 'suspended') c.resume().catch(noop); if (c.state === 'closed') live.delete(c); }); };
    ['pointerdown', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true, capture: true }));
  }

  // ---------- PWA: Service Worker solo en orígenes http(s) y fuera de Capacitor ----------
  if (!isCapacitor && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(noop); });
  }
})();
