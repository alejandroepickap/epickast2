'use strict';
/**
 * EpicKast · Capa de interfaz móvil (v1.9.3)
 * --------------------------------------------------------------
 * Se carga justo antes de renderer.js (el DOM ya existe). Gestiona:
 *   - Cajón izquierdo (#rail + #side) y cajón derecho (#members) en pantallas estrechas.
 *   - Fondo oscurecido (scrim), gestos de deslizamiento desde los bordes.
 *   - Botón "atrás" de Android (Capacitor App plugin) y tecla Escape.
 *   - Girar cámara (frontal / trasera) durante una llamada.
 * En escritorio (ancho > 820px) no altera nada.
 */
(function () {
  const MQ = window.matchMedia ? window.matchMedia('(max-width: 820px)') : { matches: false, addEventListener() {} };
  const body = document.body;
  const isMobileLayout = () => !!MQ.matches;

  // Fondo oscurecido para cerrar cajones con un toque
  const scrim = document.createElement('div');
  scrim.id = 'ekScrim';
  scrim.addEventListener('click', () => closeDrawers());
  body.appendChild(scrim);

  function closeDrawers() {
    body.classList.remove('ek-drawer-left', 'ek-drawer-right');
  }
  function openDrawer(side) {
    if (!isMobileLayout()) return;
    if (side === 'right' && !rightDrawerAvailable()) return;
    body.classList.remove(side === 'left' ? 'ek-drawer-right' : 'ek-drawer-left');
    body.classList.add(side === 'left' ? 'ek-drawer-left' : 'ek-drawer-right');
  }
  function toggleDrawer(side) {
    const cls = side === 'left' ? 'ek-drawer-left' : 'ek-drawer-right';
    if (body.classList.contains(cls)) closeDrawers(); else openDrawer(side);
  }
  // La lista de miembros solo tiene sentido dentro de un servidor
  function rightDrawerAvailable() {
    try { return S?.view?.kind === 'server'; } catch { return false; }
  }

  const modalOpen = () => { const m = document.getElementById('modal'); return !!m && !m.classList.contains('hidden'); };
  const threadOpen = () => { const t = document.getElementById('threadPane'); return !!t && !t.classList.contains('hidden'); };

  async function flipCamera() {
    try {
      const c = S?.call;
      if (!c) return;
      if (!c.camTrack) { document.getElementById('bCam')?.click(); return; }
      const facing = await c.switchCamera();
      toast?.(facing === 'environment' ? '📷 Cámara trasera' : '🤳 Cámara frontal');
      renderStage?.(); pushState?.();
    } catch { try { toast('No se pudo cambiar de cámara'); } catch {} }
  }

  // Al pasar a escritorio (rotar tablet, redimensionar) se cierran los cajones
  const onMQ = () => {
    const isMob = isMobileLayout();
    if (!isMob) closeDrawers();
    body.classList.toggle('ek-mobile', isMob);
    const msgInp = document.getElementById('msgInput');
    if (msgInp) {
      msgInp.placeholder = isMob ? 'Mensaje…' : 'Escribe un mensaje, pega una captura (Ctrl+V) o arrastra archivos…';
    }
  };
  if (MQ.addEventListener) MQ.addEventListener('change', onMQ); else if (MQ.addListener) MQ.addListener(onMQ);
  window.addEventListener('DOMContentLoaded', onMQ);
  onMQ();

  // ---------- Gestos: deslizar desde el borde izquierdo / derecho ----------
  const EDGE = 28, MIN_DX = 60;
  let tStart = null;
  window.addEventListener('touchstart', (e) => {
    if (!isMobileLayout() || modalOpen() || e.touches.length !== 1) { tStart = null; return; }
    const t = e.touches[0];
    tStart = { x: t.clientX, y: t.clientY, w: window.innerWidth };
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!tStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tStart.x, dy = t.clientY - tStart.y;
    const s = tStart; tStart = null;
    if (Math.abs(dx) < MIN_DX || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    const L = body.classList.contains('ek-drawer-left'), R = body.classList.contains('ek-drawer-right');
    if (dx > 0) {
      if (R) closeDrawers();
      else if (!L && s.x <= EDGE) openDrawer('left');
    } else {
      if (L) closeDrawers();
      else if (!R && s.x >= s.w - EDGE) openDrawer('right');
    }
  }, { passive: true });

  // ---------- Botón "atrás" (Android) / Escape ----------
  function handleBack() {
    if (body.classList.contains('ek-drawer-left') || body.classList.contains('ek-drawer-right')) { closeDrawers(); return true; }
    if (modalOpen()) {
      // Reutiliza el botón "Cerrar" del modal para respetar confirmaciones (p. ej. salir de una carrera)
      const m = document.getElementById('modal');
      const closeBtn = [...m.querySelectorAll('button')].reverse().find((b) => /cerrar|✕/i.test(b.textContent || ''));
      if (closeBtn) closeBtn.click(); else { try { closeModal(); } catch {} }
      return true;
    }
    if (threadOpen()) { try { closeThread(); } catch {} return true; }
    return false; // nada que cerrar: Android minimiza la app
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (body.classList.contains('ek-drawer-left') || body.classList.contains('ek-drawer-right'))) {
      e.stopPropagation(); closeDrawers();
    }
  }, true);
  try {
    const App = window.Capacitor?.Plugins?.App;
    if (App?.addListener) {
      App.addListener('backButton', () => {
        if (!handleBack()) App.minimizeApp?.();
      });
    }
  } catch {}

  window.EKMobile = Object.freeze({ isMobileLayout, openDrawer, closeDrawers, toggleDrawer, flipCamera, handleBack });
})();
