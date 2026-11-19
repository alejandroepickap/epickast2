'use strict';
/**
 * Empaqueta las librerías open-source en app/vendor/ de forma 100% local (sin CDNs)
 * para cumplir la CSP estricta ('self') y las políticas de Microsoft Store.
 */
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const VENDOR_DIR = path.join(ROOT, 'app', 'vendor');
fs.mkdirSync(VENDOR_DIR, { recursive: true });

async function build() {
  // 1) UI Kit bundle (Floating UI, SortableJS, GSAP, canvas-confetti, CropperJS v1, Pickr)
  const uiEntry = `
    import * as FloatingUIDOM from '@floating-ui/dom';
    import Sortable from 'sortablejs';
    import gsap from 'gsap';
    import confetti from 'canvas-confetti';
    import Cropper from 'cropperjs';
    import Pickr from '@simonwep/pickr';

    window.EKVendor = {
      FloatingUIDOM,
      Sortable: Sortable?.default || Sortable,
      gsap: gsap?.default || gsap,
      confetti: confetti?.default || confetti,
      Cropper: Cropper?.default || Cropper,
      Pickr: Pickr?.default || Pickr,
    };
  `;

  await esbuild.build({
    stdin: {
      contents: uiEntry,
      resolveDir: ROOT,
      loader: 'js',
    },
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome120'],
    outfile: path.join(VENDOR_DIR, 'ui-kit.bundle.js'),
  });

  // 2) Audio bundle (Howler.js)
  const audioEntry = `
    const howlerPkg = require('howler');
    const Howl = howlerPkg.Howl || howlerPkg.default?.Howl;
    const Howler = howlerPkg.Howler || howlerPkg.default?.Howler;
    window.HowlerLib = { Howl, Howler };
  `;

  await esbuild.build({
    stdin: {
      contents: audioEntry,
      resolveDir: ROOT,
      loader: 'js',
    },
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome120'],
    outfile: path.join(VENDOR_DIR, 'audio.bundle.js'),
  });

  // 3) Copiar hojas de estilo de CropperJS y Pickr, y Phaser 3 para carga diferida (lazy)
  const copies = [
    ['node_modules/cropperjs/dist/cropper.min.css', 'cropper.min.css'],
    ['node_modules/@simonwep/pickr/dist/themes/nano.min.css', 'pickr-nano.min.css'],
    ['node_modules/phaser/dist/phaser.min.js', 'phaser.min.js'],
  ];

  for (const [srcRel, destName] of copies) {
    const src = path.join(ROOT, srcRel);
    const dest = path.join(VENDOR_DIR, destName);
    if (!fs.existsSync(src)) {
      throw new Error(`No se encontró asset vendor requerido: ${src}`);
    }
    fs.copyFileSync(src, dest);
  }

  const outFiles = ['ui-kit.bundle.js', 'audio.bundle.js', 'cropper.min.css', 'pickr-nano.min.css', 'phaser.min.js'];
  for (const f of outFiles) {
    const stat = fs.statSync(path.join(VENDOR_DIR, f));
    console.log(`[bundle-vendors] ${f}: ${(stat.size / 1024).toFixed(1)} KB`);
  }
}

build().catch((err) => {
  console.error('[bundle-vendors] Error:', err);
  process.exit(1);
});
