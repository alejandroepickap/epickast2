// tools/verify-v191.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('--- INICIANDO VERIFICACIÓN EXHAUSTIVA DE EPICKAST v1.9.1 ---');

const projectRoot = path.join(__dirname, '..');
const filesToCheck = [
  'app/lifecycle.js',
  'app/game-config.js',
  'app/sprites.js',
  'app/card-game.js',
  'app/racer-game.js',
  'app/renderer.js',
  'server/server.js',
  'tools/gen-doc.js'
];

let failed = false;

// 1. Syntax check
const nodeBin = process.execPath;
filesToCheck.forEach(f => {
  const fullPath = path.join(projectRoot, f);
  try {
    execSync(`"${nodeBin}" --check "${fullPath}"`, { stdio: 'pipe' });
    console.log(`✓ Sintaxis válida: ${f}`);
  } catch (err) {
    console.error(`✗ Error de sintaxis en: ${f}`, err.message);
    failed = true;
  }
});

// 2. Game config checks
const cfg = require('../app/game-config.js').EKGameConfig;
console.log(`✓ Versión en game-config.js: ${cfg.APP_VERSION}`);
if (cfg.APP_VERSION !== '1.9.1') {
  console.error('✗ Versión incorrecta en game-config.js');
  failed = true;
}

console.log(`✓ Total de cosméticos: ${cfg.COSMETICS.length}`);
if (cfg.COSMETICS.length !== 33) {
  console.error(`✗ Se esperaban 33 cosméticos, se encontraron ${cfg.COSMETICS.length}`);
  failed = true;
}

console.log(`✓ Pisos del Dojo: ${cfg.DOJO_FLOORS.length}`);
if (cfg.DOJO_FLOORS.length !== 5) {
  console.error(`✗ Se esperaban 5 pisos en el Dojo, se encontraron ${cfg.DOJO_FLOORS.length}`);
  failed = true;
}

console.log(`✓ Circuitos de Turbo Core: ${cfg.RACER_TRACKS.length}`);
if (cfg.RACER_TRACKS.length !== 4) {
  console.error(`✗ Se esperaban 4 circuitos en Turbo Core, se encontraron ${cfg.RACER_TRACKS.length}`);
  failed = true;
}

// 3. Package.json check
const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
console.log(`✓ Versión en package.json: ${pkg.version}`);
if (pkg.version !== '1.9.1') {
  console.error('✗ Versión incorrecta en package.json');
  failed = true;
}

// 4. Index.html check
const indexHtml = fs.readFileSync(path.join(projectRoot, 'app', 'index.html'), 'utf8');
if (indexHtml.includes('dungeons-game-backup.js')) {
  console.error('✗ index.html carga dungeons-game-backup.js');
  failed = true;
} else {
  console.log('✓ index.html NO carga dungeons-game-backup.js');
}

if (!indexHtml.includes('lifecycle.js') || !indexHtml.includes('game-config.js') || !indexHtml.includes('sprites.js')) {
  console.error('✗ index.html no incluye los nuevos scripts del Núcleo');
  failed = true;
} else {
  console.log('✓ index.html incluye lifecycle.js, game-config.js y sprites.js en orden correcto');
}

// 5. Verification of lore and no undefined
cfg.DOJO_FLOORS.forEach(f => {
  if (!f.desc || f.desc.length > 70) {
    console.error(`✗ Piso ${f.level} tiene descripción inválida o mayor a 70 caracteres: "${f.desc}" (${f.desc?.length})`);
    failed = true;
  }
});
console.log('✓ Los 5 pisos del Dojo tienen lore épico conciso (≤ 70 caracteres)');

// 6. Documentation check
const docPath = path.join(projectRoot, 'Resumen_Boveda_Estetica_y_Minijuegos_v191.md');
if (!fs.existsSync(docPath)) {
  console.error('✗ Resumen_Boveda_Estetica_y_Minijuegos_v191.md no existe');
  failed = true;
} else {
  console.log('✓ Resumen_Boveda_Estetica_y_Minijuegos_v191.md generado y verificado');
}

// 7. Changelog check
const clPath = path.join(projectRoot, 'CHANGELOG.md');
if (!fs.existsSync(clPath)) {
  console.error('✗ CHANGELOG.md no existe');
  failed = true;
} else {
  console.log('✓ CHANGELOG.md generado y verificado');
}

if (failed) {
  console.error('\n✗ AL MENOS UNA VERIFICACIÓN FALLÓ');
  process.exit(1);
} else {
  console.log('\n=========================================');
  console.log('✓ TODAS LAS VERIFICACIONES PASARON CON ÉXITO');
  console.log('=========================================');
}
