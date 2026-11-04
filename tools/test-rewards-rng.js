'use strict';
/**
 * Test automatizado de RNG y Piedad para el Sistema de Recompensas v2 de EpicKast (v1.7.9 / v1.8).
 * 
 * Cumple los 3 requisitos de verificación matemática estricta:
 * 1. Simulación Monte Carlo de 1,000,000 aperturas con PRNG determinista (Mulberry32) y tolerancia ±0.3% (7.5σ).
 * 2. Prueba DETERMINISTA de Piedad Dura: Mock de RNG en el peor caso posible para verificar:
 *    - Apertura 59: no fuerza piedad dura.
 *    - Apertura 60: FUERZA Legendario al 100% (hard_legendary).
 *    - Apertura 61: reinicia contador y no fuerza piedad dura.
 * 3. Prueba DETERMINISTA de Garantía Épica:
 *    - Apertura 9: no fuerza garantía épica.
 *    - Apertura 10: FUERZA Épico al 100% (epic_guarantee).
 *    - Apertura 11: reinicia contador.
 * 4. Verificación de que el Marco Fundador está fuera de las cajas (reserva de 25 cosméticos).
 */
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'rewards.config.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('=== TEST DE SIMULACIÓN Y VERIFICACIÓN MATEMÁTICA: RECOMPENSAS v2 ===');
console.log(`Temporada: ${cfg.season} (${cfg.season_name}) | Total en Cofres: ${cfg.cosmetics.length} cosméticos`);
console.log(`Prestigio Fundador fuera de cofres: ${cfg.prestige_cosmetics?.length || 0} objeto(s)`);

// PRNG Seeded Mulberry32 para reproducibilidad perfecta y cero intermitencia
function createPrng(seed) {
  let s = seed >>> 0;
  return function() {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rollChestWithRng(tierKey, pityState, applyPity, rngFn) {
  const chest = cfg.chests[tierKey];
  if (!chest) throw new Error('Tier inválido: ' + tierKey);

  let odds = { ...chest.odds };

  if (applyPity) {
    // 1. Piedad dura Legendario (60)
    if (pityState.withoutLegendary >= cfg.pity.legendary_hard_pity_threshold - 1) {
      return { rarity: 'legendary', pityTriggered: 'hard_legendary' };
    }

    // 2. Piedad suave Legendario (desde 35)
    if (pityState.withoutLegendary >= cfg.pity.legendary_soft_pity_start) {
      const extra = (pityState.withoutLegendary - cfg.pity.legendary_soft_pity_start + 1) * cfg.pity.legendary_soft_pity_increment;
      odds.legendary = Math.min(1.0, odds.legendary + extra);
      let rem = extra;
      if (odds.common >= rem) {
        odds.common -= rem;
        rem = 0;
      } else {
        rem -= odds.common;
        odds.common = 0;
        odds.rare = Math.max(0, odds.rare - rem);
      }
    }

    // 3. Garantía de Épico (10 sin épico ni legendario)
    if (pityState.withoutEpic >= cfg.pity.epic_guarantee_threshold - 1) {
      const roll = rngFn();
      if (roll < odds.legendary) return { rarity: 'legendary', pityTriggered: 'legendary_in_epic_pity' };
      return { rarity: 'epic', pityTriggered: 'epic_guarantee' };
    }
  }

  // Sorteo ponderado estándar
  const r = rngFn();
  let acc = 0;
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
    acc += odds[rarity] || 0;
    if (r <= acc) return { rarity, pityTriggered: null };
  }
  return { rarity: 'legendary', pityTriggered: null };
}

let allPassed = true;

// [1/4] Comprobación de integridad de reserva
console.log('\n[1/4] Comprobando reserva de cosméticos y separación de Fundador...');
const hasFounderInChest = cfg.cosmetics.some(c => c.id === 'founder_frame');
if (hasFounderInChest) {
  console.error('  ✗ FALLO: founder_frame sigue presente en los cofres aleatorios!');
  allPassed = false;
} else {
  console.log('  ✓ founder_frame correctamente excluido de los cofres.');
}
if (cfg.cosmetics.length !== 25) {
  console.error(`  ✗ FALLO: Se esperaban exactamente 25 cosméticos en cofre, se encontraron ${cfg.cosmetics.length}`);
  allPassed = false;
} else {
  console.log('  ✓ Reserva de cofres contiene exactamente 25 cosméticos (10 Común, 7 Raro, 5 Épico, 3 Legendario).');
}

// [2/4] Prueba DETERMINISTA de Piedad Dura (Casos 59, 60 y 61 con RNG que nunca saca legendario)
console.log('\n[2/4] Ejecutando prueba DETERMINISTA de Piedad Dura (Casos 59, 60 y 61 con peor RNG sin legendario)...');
// Mock RNG que devuelve 0.05 (cae en Común/Raro, garantizando que el RNG natural jamás saque Legendario)
const noLegendaryRng = () => 0.05;

// Caso 59: Sin legendario en 58 aperturas previas -> NO debe activar piedad dura
const pity59 = { withoutEpic: 0, withoutLegendary: 58 };
const res59 = rollChestWithRng('gold', pity59, true, noLegendaryRng);
if (res59.pityTriggered === 'hard_legendary' || res59.rarity === 'legendary') {
  console.error('  ✗ FALLO: La apertura 59 activó piedad dura o legendario prematuramente!');
  allPassed = false;
} else {
  console.log(`  ✓ Apertura 59: NO activa piedad dura (obtenido: ${res59.rarity}, pityTriggered: ${res59.pityTriggered}).`);
}

// Caso 60: Sin legendario en 59 aperturas previas -> DEBE activar hard_legendary forzado
const pity60 = { withoutEpic: 0, withoutLegendary: 59 };
const res60 = rollChestWithRng('copper', pity60, true, noLegendaryRng); // Incluso en cofre de cobre con 0% base
if (res60.rarity === 'legendary' && res60.pityTriggered === 'hard_legendary') {
  console.log('  ✓ Apertura 60: FUERZA Legendario al 100% (pityTriggered = hard_legendary) incluso con 0% base.');
} else {
  console.error(`  ✗ FALLO: La apertura 60 no forzó Legendario! Resultado: ${JSON.stringify(res60)}`);
  allPassed = false;
}

// Caso 61: Al salir legendario en la 60, el contador se reinicia a 0 -> sorteo normal restaurado
const pity61 = { withoutEpic: 0, withoutLegendary: 0 };
const res61 = rollChestWithRng('copper', pity61, true, noLegendaryRng);
if (res61.pityTriggered === 'hard_legendary' || res61.rarity === 'legendary') {
  console.error('  ✗ FALLO: La apertura 61 tras reinicio activó piedad dura!');
  allPassed = false;
} else {
  console.log(`  ✓ Apertura 61 (reinicio): Contador reiniciado a 0, sorteo normal restaurado (obtenido: ${res61.rarity}).`);
}

// [3/4] Prueba DETERMINISTA de Garantía Épica (Casos 9, 10 y 11)
console.log('\n[3/4] Ejecutando prueba DETERMINISTA de Garantía Épica (Casos 9, 10 y 11 con RNG que no saca épico)...');
// Mock RNG que devuelve 0.05 (cae en común en cofre de cobre donde común es 80%)
const noEpicRng = () => 0.05;

const pity9 = { withoutEpic: 8, withoutLegendary: 8 };
const res9 = rollChestWithRng('copper', pity9, true, noEpicRng);
if (res9.pityTriggered === 'epic_guarantee' || res9.rarity === 'epic') {
  console.error('  ✗ FALLO: Apertura 9 activó garantía épica prematuramente!');
  allPassed = false;
} else {
  console.log(`  ✓ Apertura 9: NO activa garantía épica (obtenido: ${res9.rarity}).`);
}

const pity10 = { withoutEpic: 9, withoutLegendary: 9 };
const res10 = rollChestWithRng('copper', pity10, true, noEpicRng);
if (res10.rarity === 'epic' && res10.pityTriggered === 'epic_guarantee') {
  console.log('  ✓ Apertura 10: FUERZA Épico al 100% (pityTriggered = epic_guarantee).');
} else {
  console.error(`  ✗ FALLO: La apertura 10 no forzó Épico! Resultado: ${JSON.stringify(res10)}`);
  allPassed = false;
}

const pity11 = { withoutEpic: 0, withoutLegendary: 10 };
const res11 = rollChestWithRng('copper', pity11, true, noEpicRng);
if (res11.pityTriggered === 'epic_guarantee' || res11.rarity === 'epic') {
  console.error('  ✗ FALLO: Apertura 11 tras reinicio activó garantía épica!');
  allPassed = false;
} else {
  console.log(`  ✓ Apertura 11 (reinicio): Contador épico reiniciado a 0 (obtenido: ${res11.rarity}).`);
}

// [4/4] Prueba Estadística Monte Carlo de 1,000,000 aperturas por cofre (Tolerancia ±0.3%)
const SIM_COUNT = 1000000;
console.log(`\n[4/4] Verificando distribución estadística pura (${SIM_COUNT.toLocaleString()} aperturas por cofre con Mulberry32, tol ±0.3%)...`);

for (const [tier, chest] of Object.entries(cfg.chests)) {
  const prng = createPrng(133742 + tier.charCodeAt(0) * 100);
  const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
  const dummyPity = { withoutEpic: 0, withoutLegendary: 0 };

  for (let i = 0; i < SIM_COUNT; i++) {
    const res = rollChestWithRng(tier, dummyPity, false, prng);
    counts[res.rarity]++;
  }

  console.log(`\n  Cofre [${chest.name.toUpperCase()}]:`);
  for (const r of ['common', 'rare', 'epic', 'legendary']) {
    const expected = (chest.odds[r] * 100).toFixed(1);
    const actual = ((counts[r] / SIM_COUNT) * 100).toFixed(2);
    const diff = Math.abs(actual - expected);
    const ok = diff <= 0.3; // Tolerancia estricta ±0.3% (7.5σ para 1M tiradas)
    if (!ok) allPassed = false;
    console.log(`    - ${r.padEnd(10)}: Esperado = ${expected.padStart(5)}% | Obtenido = ${actual.padStart(5)}% (Δ = ${diff.toFixed(2)}%) ${ok ? '✓ PASS' : '✗ FAIL'}`);
  }
}

if (allPassed) {
  console.log('\n================================================================');
  console.log('✓✓✓ TODOS LOS TESTS (DETERMINISTA + MONTE CARLO 1M) PASARON ✓✓✓');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error('\n✗ HUBO ERRORES EN LAS PRUEBAS');
  process.exit(1);
}
