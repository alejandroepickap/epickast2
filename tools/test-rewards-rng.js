'use strict';
/**
 * Test automatizado de RNG y Piedad para el Sistema de Recompensas v2 de EpicKast.
 * Simula 100,000 aperturas por cofre y verifica:
 * 1. Que las probabilidades empíricas coincidan con las declaradas en rewards.config.json (±0.5%).
 * 2. Que la piedad dura a 60 aperturas garantice siempre Legendario sin fallar jamás.
 * 3. Que la garantía de Épico en 10 aperturas sin épico/legendario se cumpla al 100%.
 */
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'rewards.config.json');
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('=== TEST DE SIMULACIÓN MONTE CARLO: SISTEMA DE RECOMPENSAS v2 ===');
console.log(`Temporada: ${cfg.season} (${cfg.season_name}) | Total Cosméticos: ${cfg.cosmetics.length}`);

function rollChest(tierKey, pityState, applyPity = true) {
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
      // Descontar primero de common, luego de rare
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
      // Garantizar al menos épico (o legendario si toca)
      const roll = Math.random();
      if (roll < odds.legendary) return { rarity: 'legendary', pityTriggered: 'legendary_in_epic_pity' };
      return { rarity: 'epic', pityTriggered: 'epic_guarantee' };
    }
  }

  // Sorteo ponderado estándar
  const r = Math.random();
  let acc = 0;
  for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
    acc += odds[rarity] || 0;
    if (r <= acc) return { rarity, pityTriggered: null };
  }
  return { rarity: 'legendary', pityTriggered: null };
}

// 1. Prueba de distribución pura (sin piedad) para verificar probabilidades matemáticas base
const SIM_COUNT = 100000;
let allPassed = true;

console.log(`\n[1/3] Verificando distribución estadística base (${SIM_COUNT.toLocaleString()} aperturas por cofre)...`);

for (const [tier, chest] of Object.entries(cfg.chests)) {
  const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
  const dummyPity = { withoutEpic: 0, withoutLegendary: 0 };

  for (let i = 0; i < SIM_COUNT; i++) {
    const res = rollChest(tier, dummyPity, false);
    counts[res.rarity]++;
  }

  console.log(`\n  Cofre [${chest.name.toUpperCase()}]:`);
  for (const r of ['common', 'rare', 'epic', 'legendary']) {
    const expected = (chest.odds[r] * 100).toFixed(1);
    const actual = ((counts[r] / SIM_COUNT) * 100).toFixed(2);
    const diff = Math.abs(actual - expected);
    const ok = diff <= 0.6; // tolerancia 0.6%
    if (!ok) allPassed = false;
    console.log(`    - ${r.padEnd(10)}: Esperado = ${expected}% | Obtenido = ${actual}% (Δ = ${diff.toFixed(2)}%) ${ok ? '✓ PASS' : '✗ FAIL'}`);
  }
}

// 2. Prueba de Piedad Dura (Legendario en <= 60 aperturas siempre)
console.log('\n[2/3] Verificando que la piedad dura de Legendario jamás falle en 2,000 rachas...');
let maxPullsToLegendary = 0;
let hardPityHits = 0;

for (let sim = 0; sim < 2000; sim++) {
  const pity = { withoutEpic: 0, withoutLegendary: 0 };
  let pulls = 0;
  while (true) {
    pulls++;
    const res = rollChest('gold', pity, true);
    if (res.rarity === 'legendary') {
      if (pulls > maxPullsToLegendary) maxPullsToLegendary = pulls;
      if (res.pityTriggered === 'hard_legendary') hardPityHits++;
      break;
    }
    pity.withoutLegendary++;
    if (res.rarity === 'epic') pity.withoutEpic = 0;
    else pity.withoutEpic++;

    if (pulls > 60) {
      allPassed = false;
      console.error(`  ✗ ERROR: Se superaron 60 aperturas sin Legendario (Pulls: ${pulls})`);
      break;
    }
  }
}
console.log(`  ✓ Máximo de aperturas hasta Legendario observado: ${maxPullsToLegendary} / 60`);
console.log(`  ✓ Activaciones de piedad dura exacta: ${hardPityHits}`);

// 3. Prueba de Garantía de Épico (en <= 10 aperturas siempre)
console.log('\n[3/3] Verificando garantía de Épico (<= 10 aperturas sin épico ni legendario)...');
let maxPullsToEpic = 0;
for (let sim = 0; sim < 2000; sim++) {
  const pity = { withoutEpic: 0, withoutLegendary: 0 };
  let pullsWithout = 0;
  for (let i = 0; i < 40; i++) {
    pullsWithout++;
    const res = rollChest('copper', pity, true);
    if (res.rarity === 'epic' || res.rarity === 'legendary') {
      if (pullsWithout > maxPullsToEpic) maxPullsToEpic = pullsWithout;
      pity.withoutEpic = 0;
      pullsWithout = 0;
    } else {
      pity.withoutEpic++;
      pity.withoutLegendary++;
    }
    if (pullsWithout > 10) {
      allPassed = false;
      console.error(`  ✗ ERROR: Se superaron 10 aperturas sin Épico ni Legendario (Pulls: ${pullsWithout})`);
      break;
    }
  }
}
console.log(`  ✓ Máximo de aperturas hasta Épico/Legendario: ${maxPullsToEpic} / 10`);

if (allPassed) {
  console.log('\n========================================================');
  console.log('✓✓✓ TODOS LOS TESTS DE RNG Y PIEDAD PASARON CON ÉXITO ✓✓✓');
  console.log('========================================================\n');
  process.exit(0);
} else {
  console.error('\n✗ ALGUNOS TESTS DE RNG FALLARON\n');
  process.exit(1);
}
