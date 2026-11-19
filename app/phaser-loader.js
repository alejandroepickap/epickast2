'use strict';
/**
 * Cargador diferido (lazy) para Phaser 3 desde vendor/phaser.min.js.
 * Mantiene en 0 MB el consumo inicial de RAM mientras el usuario chatea o está en llamada,
 * y carga el motor WebGL/Canvas únicamente al abrir un minijuego.
 */
(function initPhaserLoader() {
  let loadingPromise = null;

  window.loadPhaser = function loadPhaser() {
    if (window.Phaser) return Promise.resolve(window.Phaser);
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'vendor/phaser.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Phaser) resolve(window.Phaser);
        else reject(new Error('Phaser no se inicializó tras cargar vendor/phaser.min.js'));
      };
      script.onerror = () => {
        loadingPromise = null;
        reject(new Error('Error al cargar vendor/phaser.min.js'));
      };
      document.head.appendChild(script);
    });

    return loadingPromise;
  };
})();
