'use strict';
/**
 * EpicKast · Service Worker (PWA)
 * Estrategia "network-first" para el shell de la app: siempre intenta la versión más
 * reciente y usa la caché solo sin conexión. NUNCA cachea WebSockets, /upload ni /files
 * (los datos en tiempo real siempre vienen del servidor).
 */
const CACHE = 'epickast-shell-v1.9.7';
const SHELL = [
  './', './index.html', './theme-tokens.css', './vendor/cropper.min.css', './vendor/pickr-nano.min.css',
  './style.css', './mobile.css',
  './mobile-shim.js', './mobile.js', './lifecycle.js', './game-config.js', './sprites.js',
  './vendor/ui-kit.bundle.js', './vendor/audio.bundle.js', './audio-engine.js',
  './context-menu.js', './profile-studio.js', './cartoon-art.js', './phaser-loader.js',
  './dojo-phaser.js', './racer-phaser.js',
  './call.js', './game.js', './card-game.js', './racer-game.js', './renderer.js',
  './logo.svg', './icon.png', './icons/icon-192.png', './icons/icon-512.png', './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // servidor de Render, YouTube, etc.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
