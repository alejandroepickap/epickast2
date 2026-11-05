// tools/gen-doc.js
const fs = require('fs');
const path = require('path');

const cfgPath = path.join(__dirname, '..', 'app', 'game-config.js');
const mod = require(cfgPath);
const cfg = mod.EKGameConfig || mod;

const outDocPath = path.join(__dirname, '..', 'Resumen_Boveda_Estetica_y_Minijuegos_v191.md');

let md = `# Resumen Completo de la Bóveda de Reliquias, Estética y Minijuegos — EpicKast v${cfg.APP_VERSION}

Documento generado automáticamente a partir de la fuente única de verdad: [\`app/game-config.js\`](app/game-config.js).
Complementado con los módulos de arquitectura:
- [\`app/lifecycle.js\`](app/lifecycle.js) — Ciclo de vida idempotente y gestión de memoria.
- [\`app/sprites.js\`](app/sprites.js) — Motor de renderizado vectorial de sprites pixel-art.
- [\`app/card-game.js\`](app/card-game.js) — Dojo Elemental (Card-Jitsu).
- [\`app/racer-game.js\`](app/racer-game.js) — Turbo Core (Carreras Synthwave).
- [\`server/server.js\`](server/server.js) — Validación de auditoría de economía y menciones.

---

## 1. Arquitectura de Estado y Memoria (EKLifecycle)

La versión v${cfg.APP_VERSION} garantiza un ciclo de vida con **cero fugas de memoria** mediante \`window.EKLifecycle\`:
- **Tracking centralizado:** todos los \`requestAnimationFrame\`, \`setInterval\`, \`setTimeout\`, \`addEventListener\` (usando \`AbortController\`) y \`AudioContext\` quedan registrados en un scope.
- **Auto-Pausa reactiva:** al detectar \`document.visibilityState === 'hidden'\`, las instancias activas de minijuegos se pausan automáticamente, desplegando un overlay \`"PAUSA"\` y una cuenta regresiva de 3 segundos al volver a la pestaña.
- **Prevención de pérdida accidental:** si el usuario intenta cerrar la Bóveda, presionar \`ESC\` o cambiar de pestaña mientras un combate o carrera está activo, se solicita confirmación: \`"¿Salir? Perderás esta partida (sin recompensas)"\`.
- **Reclamo Idempotente:** bandera \`rewardClaimed\` en cada partida que previene duplicación de recompensas.

---

## 2. Catálogo Unificado de Cosméticos (${cfg.COSMETICS.length} Artículos)

Todos los cosméticos sincronizados con el servidor y compatibles con la interfaz de usuario:

| ID | Nombre | Tipo | Rareza | Fabricación | Esencia Duplicado | Descripción / Efecto |
|---|---|---|---|---|---|---|
`;

cfg.COSMETICS.forEach(c => {
  const craft = cfg.DUST_CRAFT[c.rarity] || 40;
  const dup = cfg.DUST_DUPLICATE[c.rarity] || 5;
  md += `| \`${c.id}\` | **${c.name}** | \`${c.type}\` | **${c.rarity.toUpperCase()}** | ${craft} ✨ | +${dup} ✨ | ${c.desc} |\n`;
});

md += `
---

## 3. Cofres, Llaves y Sistema de Sintonía

| Nivel de Cofre | Precio Llave | Común | Raro | Épico | Legendario | Garantías Especiales |
|---|---|---|---|---|---|---|
`;

Object.entries(cfg.CHESTS).forEach(([tier, data]) => {
  const p = data.odds;
  const special = tier === 'copper' 
    ? 'Sin legendarios ni acumulación de sintonía'
    : 'Acumula sintonía suave (35+) y hard pity (60)';
  const price = data.shopKeyCost || cfg.KEY_PRICES[tier] || 0;
  md += `| **${data.name}** | ${price.toLocaleString()} 🪙 | ${Math.round(p.common * 100)}% | ${Math.round(p.rare * 100)}% | ${Math.round(p.epic * 100)}% | ${Math.round(p.legendary * 100)}% | ${special} |\n`;
});

md += `
### Reglas de Sintonía (Protección Anti-Mala Suerte)
- **Garantía Épica (10 tiradas):** si se acumulan 9 aperturas sin Épico ni Legendario, la tirada 10 es garantizada de calidad Épica o superior.
- **Sintonía Suave Legendaria (35+ tiradas):** a partir de la apertura 35 sin Legendario en cofres Plata, Oro u Obsidiana, la probabilidad aumenta progresivamente un **+1.5%** por apertura.
- **Sintonía Garantizada Legendaria (60 tiradas):** al alcanzar la apertura 59 sin Legendario, la apertura 60 tiene probabilidad **100% asegurada** de otorgar un Legendario.
- **Ruleta Honesta:** la ruleta visual genera únicamente cartas permitidas por las probabilidades nominales del cofre seleccionado (en Cobre no aparecen cartas Legendarias en el strip).

---

## 4. Progresión del Dojo Elemental (Card-Jitsu)

| Piso | Guardián | Cinturón Rival | Lore Épico | Recompensa 1ª Conquista | Entrenamiento Posterior |
|---|---|---|---|---|---|
`;

cfg.DOJO_FLOORS.forEach(f => {
  const firstCoins = f.reward ? f.reward.coins : 0;
  const firstKey = f.reward ? f.reward.keyLabel : 'Ninguna';
  const farmCoins = Math.round(firstCoins * 0.5);
  md += `| **Piso ${f.level}** | **${f.name}** | ${f.belt} | *${f.desc}* | +${firstCoins} 🪙 + ${firstKey} | +${farmCoins} 🪙 (25% Llave Cobre) |\n`;
});

md += `
### Cinturones de Maestría Ninja
| Nivel | Cinturón | Requisito de Desbloqueo |
|---|---|---|
`;

cfg.BELTS.forEach(b => {
  const req = b.floorRequired === 0 ? 'Gratuito inicial' : `Superar Piso ${b.floorRequired} del Dojo`;
  md += `| **${b.id.toUpperCase()}** | **${b.name}** (${b.color}) | ${req} |\n`;
});

md += `
---

## 5. Circuitos y Mejoras de Turbo Core (Carreras Arcade)

| Circuito | Nombre | Dificultad | Vueltas | Recompensa 1ª Conquista |
|---|---|---|---|---|
`;

cfg.RACER_TRACKS.forEach(t => {
  const rCoins = t.reward ? t.reward.coins : 0;
  const rKey = t.reward ? t.reward.keyLabel : 'Ninguna';
  md += `| **Circuito ${t.level}** | **${t.name}** | ${t.difficulty.toUpperCase()} | ${t.laps} | +${rCoins} 🪙 + ${rKey} |\n`;
});

md += `
### Taller de Ingeniería del Núcleo
| Sistema | Descripción | Niveles | Coste Base |
|---|---|---|---|
| **Motor Iónico** | Aumenta la velocidad máxima y aceleración punta | 1 a 5 (MAX) | 200 🪙 (+150 🪙/nivel) |
| **Inyector Nitro** | Mayor empuje y recarga acelerada del turbo | 1 a 5 (MAX) | 250 🪙 (+200 🪙/nivel) |
| **Escudo Magnético** | Mayor radio de atracción de monedas del circuito | 1 a 5 (MAX) | 150 🪙 (+100 🪙/nivel) |

---

## 6. Sets y Coleccionismo Especial

### Set del Coloso (4/4)
Conjunto temático Legendario que conmemora la victoria definitiva sobre las profundidades:
1. **Marco:** \`frame_colossus_legend\` (Núcleo del Coloso)
2. **Banner:** \`banner_colossus_awakening\` (Despertar del Coloso)
3. **Título:** \`title_colossus_slayer\` (Coloso Caído)
4. **Placa de Nombre:** \`plate_colossus\` (Placa del Coloso)

*Recompensa de Set:* Título e insignia honorífica **«⚡ Conquistador del Coloso»** activa en el perfil.

---

## 7. Menciones con @ y Seguridad Anti-XSS

- **Formato de Token Seguro:** \`<span class="mention" data-uid="ID">@Nombre</span>\`
- **Escapado Preventivo:** el texto del usuario se sanea estrictamente antes de interpretar las menciones fuera de bloques de código (\`\`\` o \`).
- **Resaltado Visual:** mensajes donde el usuario es mencionado reciben \`border-left: 3px solid #facc15\` y fondo dorado translúcido \`rgba(250,204,21,.06)\`.
- **Alertas Sonoras:** aviso Web Audio chime (\`[659, 880, 1046]\`) y notificación de escritorio nativa cuando la app no está enfocada.
`;

fs.writeFileSync(outDocPath, md, 'utf8');
console.log('Generated documentation successfully at:', outDocPath);
