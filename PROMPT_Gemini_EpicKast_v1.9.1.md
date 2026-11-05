# PROMPT PARA GEMINI — EpicKast v1.9.0 → v1.9.1

> Cómo usarlo: guarda este archivo en la raíz del proyecto, abre Gemini (CLI / agente) en esa carpeta y escribe:
> **"Lee PROMPT_Gemini_EpicKast_v1.9.1.md y ejecuta SOLO la Fase 0 y el Bloque A. Detente y espera mi 'continúa'."**
> Luego avanza bloque por bloque (B → C+D → E+F → G → H+I).

---

## 0. ROL Y REGLAS DE TRABAJO

Eres un ingeniero senior de Electron / JavaScript vanilla / CSS. Trabajas sobre **EpicKast** (app tipo Discord con Bóveda de Reliquias, Dojo Elemental y Turbo Core).

Ruta: `C:\Users\puma1\OneDrive\Documentos\Proyecto Comunicacion EpicKap\app\`
Archivos clave:
- `renderer.js` → `modalVault` (≈ líneas 447–960), chat, lista de miembros, panel de usuario
- `style.css` → cosméticos y animaciones (≈ 1185–1280)
- `card-game.js` → `window.CardJitsuGame` (Dojo Elemental)
- `racer-game.js` → `window.CoreRacerGame` (Turbo Core)
- `dungeons-game-backup.js` → respaldo; NO debe ejecutarse ni cargarse

**Reglas obligatorias**
1. ANTES de editar: crea un respaldo (`git commit` si hay git; si no, copia `app\` a `..\EpicKap_backup_v190\`, sin `node_modules`).
2. No asumas nada: **lee el código real** antes de cambiarlo. Los números de línea de este documento son aproximados.
3. Cambios mínimos y localizados. No refactorices lo que no se pide. Sin dependencias npm nuevas (si es imprescindible, detente y pregunta).
4. Sin recursos externos (CSP/offline). Todo el arte se **dibuja en código** (SVG/canvas/CSS) o va en `app\assets\` local. Fuentes: empaquétalas en `app\assets\fonts\`; si no puedes descargarlas, usa fallback `'Courier New', monospace` y anótalo en el reporte.
5. Todo texto de usuario se inserta con `textContent` o se escapa. **Nunca** `innerHTML` con datos de usuarios (anti-XSS).
6. Textos de UI en español con tildes correctas.
7. Si hay ambigüedad, usa el valor por defecto indicado aquí. Pregunta solo si estás bloqueado.
8. Al terminar cada bloque: ejecuta la app (`npm start`), verifica los criterios de aceptación y entrega un reporte: archivos tocados, qué verificaste, qué NO pudiste verificar.

---

## FASE 0 — AUDITORÍA DE SOLO LECTURA (no edites nada)

Entrega un reporte corto con:
1. Dónde se guardan monedas, llaves, esencia, sintonía, cosméticos y límites diarios (¿localStorage, archivo JSON, servidor?). ¿Se validan en el servidor?
2. Cómo se envían y almacenan los mensajes de chat (formato del payload, relay/servidor, persistencia).
3. Lista de TODOS los `requestAnimationFrame`, `setInterval`, `setTimeout`, `addEventListener` (globales: `document`, `window`) y `AudioContext` creados por la Bóveda, `card-game.js` y `racer-game.js`, y dónde (si) se cancelan.
4. Todas las constantes duplicadas (recompensas, precios, nombres) entre `renderer.js`, `card-game.js`, `racer-game.js` y el `.md` de resumen.
5. Dónde se hardcodea la versión `v1.9.0` y los conteos "26".

---

## BLOQUE A — BUGS CRÍTICOS

### A1. El juego sigue ejecutándose al cerrar la Bóveda (PRIORIDAD MÁXIMA)
Causa probable: bucles/timers/listeners/audio sin cancelar. Implementa un **registro de ciclo de vida**:

```js
// lifecycle.js (nuevo, cargado antes de los juegos)
window.EKLifecycle = {
  create(scope) { /* devuelve { raf(fn), interval(fn,ms), timeout(fn,ms), listen(target,evt,fn,opts), audio(ctx), dispose(), count() } */ }
};
```
- `raf()` mantiene el id vigente y se re-agenda solo mientras el scope esté vivo. `listen()` usa `AbortController`. `audio()` hace `ctx.close()` en `dispose()` y detiene osciladores.
- `CardJitsuGame` y `CoreRacerGame` exponen `start() / pause() / resume() / destroy()` **idempotentes**. Tras `destroy()` pone `this.destroyed = true` y TODO callback pendiente hace `if (this.destroyed) return;` (incluye timer de turno de 14 s, cinemáticas, cuenta atrás, resultados).
- Llama a `destroy()` en: botón **✕ Cerrar**, tecla **ESC**, botón **Salir** de cada juego, **cambio de pestaña dentro de la Bóveda**, `window.beforeunload`.
- `document.visibilitychange`: si la ventana se oculta o minimiza durante partida → `pause()` + overlay "PAUSA"; al volver → `resume()` con cuenta de 3 s.
- Salir en plena partida: confirmación "¿Salir? Perderás esta partida (sin recompensas)". Las recompensas se otorgan **una sola vez** (bandera `rewardClaimed`) y nunca después de `destroy()`.
- Al cerrar la Bóveda: quita el modal del DOM (o `display:none` + `animation-play-state: paused` en todo su contenido).
- `dungeons-game-backup.js`: confirma que no se carga ni ejecuta.
- Añade debug: `window.__EK.vaultDebug()` → imprime `{raf, intervals, timeouts, listeners, audio}`.

**Aceptación:** abrir Turbo Core → iniciar carrera → ESC → `__EK.vaultDebug()` devuelve todo en 0 y `audio: 'closed'`; el CPU de la app en reposo < 2 % (Administrador de tareas). Repetir con Dojo en medio de un turno, con una cinemática activa, y cambiando de pestaña.

### A2. Aparece "undefined" en las 5 tarjetas del Dojo
El campo de descripción del guardián no coincide (`desc`/`lore`/etc.). Corrige el dato y agrega guarda `?? ''`. Añade en modo debug `assertNoBadText(container)` que avise si el DOM contiene `undefined`, `NaN` o `[object Object]`; úsalo en cada pestaña de la Bóveda.
Escribe 1 línea de lore por guardián (máx. 70 caracteres) en tono épico.

### A3. Insignias que se pisan con el texto
- Dojo (tarjetas de piso) y Turbo Core (tarjetas de circuito): `✓ DOMINADO`, `1ª RECOMPENSA`, `1ª Conquista`, `NIVEL 4` se superponen con "PISO N · CINTURÓN…".
- Solución: cabecera `display:flex; flex-wrap:wrap; gap:6px; align-items:center; justify-content:space-between; min-width:0`; etiqueta de cinturón `flex:1 1 auto; min-width:0`; insignia `flex:none; position:static`.
- La 4.ª tarjeta de Turbo Core queda cortada: el cuerpo del modal debe mostrar scrollbar visible fina y un degradado inferior que indique que hay más contenido.

### A4. Título/insignia aplastado en el panel de usuario y en la lista de miembros
- En el panel inferior izquierdo ("Expl / del N") y en la lista de Miembros ("Explorador" cortado en el borde): mostrar la insignia **solo como ícono** de 18 px con tooltip nativo (`title`) con el nombre completo.
- En el chat: píldora completa con `max-width:180px; white-space:nowrap; text-overflow:ellipsis; margin-inline:6px 8px`. La hora debe tener `margin-left:8px` (ahora toca la píldora).
- Filas de miembros: nombre con `flex:1; min-width:0; ellipsis`; nada debe desbordar el panel.

### A5. Contraste y estado
- Nombres como "katy" (rojo oscuro) son casi ilegibles. Crea `ensureContrast(color, bg, 4.5)` (ajusta luminosidad en HSL) y aplícalo a colores sólidos y paradas de gradiente de nombre. Miembros desconectados pueden atenuarse pero nunca bajar de 3:1.
- Los usuarios **DESCONECTADOS** muestran punto verde en el avatar. Debe ser gris `#64748b` (offline), verde `#22c55e` (online), amarillo `#eab308` (ausente), rojo `#ef4444` (no molestar).
- El fondo del área de chat es negro puro `#000`. Usa tokens: `--bg-app:#0b0e14; --bg-panel:#0f131d; --bg-raised:#141926; --bg-input:#111622; --border:rgba(255,255,255,.08)`.

---

## BLOQUE B — MENCIONES CON @ EN CANALES DE SERVIDOR

**Comportamiento**
1. Al escribir `@` (al inicio o tras un espacio) en el cuadro de mensaje de un canal de texto: popup flotante sobre el input, ancho 320 px, máx. 8 filas de 40 px (avatar 28 px, nombre con su color equipado, estado a la derecha). Incluye miembros desconectados.
2. Filtra al escribir (sin distinguir mayúsculas ni tildes; primero los que empiezan por el texto, luego los que lo contienen). Sin resultados → fila gris "Sin coincidencias".
3. Teclado: `↑/↓` navegar, `Tab`/`Enter` seleccionar, `Esc` cierra el popup (y NO cierra otros modales), clic con ratón también. Inserta `@Nombre ` y guarda internamente `{userId}`.
4. Al enviar, el mensaje lleva `mentions: [userId…]` y el texto con tokens `<@userId>`. Si el input es `textarea`, resuelve `@Nombre` por coincidencia más larga contra los miembros; ante ambigüedad usa el que se eligió en el popup; si no resuelve, queda como texto plano.
5. Render seguro: primero escapar el texto, luego reemplazar tokens por `<span class="mention" data-uid="…">@Nombre</span>`. El nombre se resuelve por `userId` (si cambió el nombre, se actualiza; si no existe → `@usuario-desconocido`). No procesar menciones dentro de bloques de código. Clic en la mención abre la tarjeta de perfil.
6. Estilos: `.mention{background:rgba(99,102,241,.22);color:#c7d2fe;border-radius:4px;padding:0 4px;cursor:pointer}` `:hover` → `.35`. Si me mencionan a mí: mensaje con barra izquierda 3 px `#facc15` y fondo `rgba(250,204,21,.06)`.
7. Notificaciones: punto/contador rojo (`#ef4444`) en el ícono del servidor (barra izquierda) y en el canal; se limpia al ver el canal. Si la app no está enfocada o el canal no está activo: `Notification` de Electron "«Autor» te mencionó en #canal" + vista previa de 80 caracteres + sonido breve generado con Web Audio (registrado en el ciclo de vida) con opción de silenciar. Si los mensajes persisten, mostrar menciones pendientes al volver a iniciar sesión.
8. Validación: el servidor/relay debe comprobar que cada `userId` mencionado pertenezca al servidor (si existe backend). `@todos` solo si ya existe sistema de permisos (dueño/admin); si no, omitir.

**Aceptación:** escribir `@ka` sugiere "katy"; Enter inserta el chip; el receptor ve el mensaje resaltado, el contador rojo y la notificación; `<script>` dentro de un nombre o mensaje no se ejecuta.

---

## BLOQUE C — FUENTE ÚNICA DE VERDAD Y ECONOMÍA

1. Crea `app\game-config.js` con TODAS las constantes: catálogo de cosméticos (id, nombre, rareza, categoría, forja), cofres (precio, límite diario, probabilidades), pisos del Dojo, circuitos, taller, cinturones, sets. `renderer.js`, `card-game.js` y `racer-game.js` leen de ahí. **Los conteos ("26", "5 pisos", "4 circuitos") se calculan, nunca se escriben a mano.**
2. Nombres canónicos (unifica lore): usa **Coloso** en todo (renombrar "Gólem"). Banners/colores/títulos con los nombres que hoy muestra la UI; el `.md` se regenera desde el código (ver Bloque I).
3. Recompensas del Dojo (valores por defecto, editables en config): primera conquista Piso 1–2: moneda del código + Llave Cobre; Piso 3: Plata; Piso 4: Oro; **Piso 5: +500 🪙 + 1 Llave Obsidiana** (hoy da 2). Entrenamiento: 50 % monedas + 25 % Llave Cobre.
4. Esencia por duplicado (valores por defecto): Común +5, Raro +15, Épico +40, Legendario +100. Costos de forja: 40 / 120 / 300 / 800 (cada rareza = 8 duplicados).
5. Ruleta honesta: la tira se construye con items ponderados **según las probabilidades del cofre elegido** (Cobre: nunca mostrar Legendarios). El resultado se decide primero y la tira se compone para caer en él.
6. Botón ⓘ "Probabilidades": tabla nominal + contadores "Garantía Épica n/10" y "Sintonía n/60" + texto "Cada 10 tiros sin Épico, el siguiente lo es". Indica si el Cobre cuenta para Sintonía.
7. Centraliza monedas/llaves/esencia en `EconomyService.grant(source, payload)` con validación de límites diarios e idempotencia. Si todo es cliente (localStorage), anótalo en el reporte como riesgo de trampas; **no construyas servidor** salvo que ya exista.

---

## BLOQUE D — SISTEMA VISUAL (rareza, tipografía, íconos)

**Tokens de rareza** (el Épico deja de ser rojo; el rojo queda para Fuego/errores):
- Común `#94a3b8` sin glow · Raro `#3b82f6` glow `0 0 10px rgba(59,130,246,.45)` · Épico `#a855f7` glow `0 0 14px rgba(168,85,247,.55)` + brillo animado · Legendario `#fbbf24` glow `0 0 18px rgba(251,191,36,.6)` + foil + partículas.
- Aplica a etiquetas, bordes de tarjetas del Armario, ruleta, resultados y documentación.

**Elementos:** Fuego `#ef4444` (fondo `#450a0a`) · Agua `#2563eb` (`#172554`) · Nieve `#7dd3fc` (`#083344`).

**Tipografía:** `Press Start 2P` (o `Silkscreen`) para título de la Bóveda, números de carta, HUD y botones principales; la fuente actual para texto corrido. Tamaños en múltiplos de 8 px (8/16/24).

**Íconos pixel propios** (sustituir emojis del sistema en pestañas, llaves, taller, armas): renderizador

```js
// sprites.js — formato: matriz de strings + paleta. '.' = transparente
renderSprite({ map: ["..aa..", ".abba."], palette: { a: "#000", b: "#fff" } }, scale)
// devuelve <svg shape-rendering="crispEdges"> con un <rect> por píxel agrupado por color
```
Sprites 16×16 requeridos: 5 íconos de pestaña (cofre, armario, dojo, auto, ninja), 4 llaves **con la misma silueta** y paletas Cobre `#c2410c/#fb923c/#7c2d12`, Plata `#cbd5e1/#f8fafc/#64748b`, Oro `#eab308/#fef08a/#a16207`, Obsidiana `#7c3aed/#c4b5fd/#2e1065` (con glow), íconos de monedas, esencia y sintonía, y 5 armas. Cada sprite: contorno oscuro de 1 px, 3 tonos (base, sombra, luz), sin anti-aliasing (`image-rendering:pixelated`).

**Aceptación:** ningún emoji de sistema en la barra de pestañas, llaves ni taller; las 4 llaves son reconocibles como un mismo set.

---

## BLOQUE E — PERSONAJES (Estudio "Mi Ninja")

Mantén la cuadrícula actual del ninja (24×30) y mejora **dentro** de ella:
1. Contorno oscuro de 1 px y sombreado de 3 tonos en traje, máscara y cinta.
2. **Idle de 2 frames** (respiración, 600 ms) y **cinta/bufanda de 3 frames** ondeando. Poses en la vista previa con botones **Idle / Ataque / Victoria**. Botones **🎲 Aleatorio** y **Restablecer**.
3. El **aura elemental** (Llamas, Burbujas, Cristales) debe verse en la vista previa y en el tatami: 8–12 partículas pixel alrededor del ninja (colores del elemento), máx. 30 fps, registradas en el ciclo de vida.
4. Arma: sustituir los emojis rotos (🟧, 📜) por sprites pixel; cada arma visible en la espalda/mano del sprite.
5. Cintas con desbloqueo real y visible (candado + tooltip "Domina el Piso N"): Blanco y Amarillo libres; Azul = Piso 2; Rojo = Piso 3; **Negro = Piso 4**; Dorado = Piso 5. (Hoy "Cinturón Negro" aparece bloqueado aunque el Piso 4 está dominado: revisa la condición.)
6. Guardado: conserva el botón "Guardar Mi Ninja", añade indicador "Cambios sin guardar" y aviso al salir sin guardar.
7. Retratos de guardianes: hoy son `.jpg` ilustrados que chocan con el estilo pixel. Sustituir por **sprites pixel 32×32** en retrato (marco con color del elemento: Ignis rojo, Escarcha cian, Torrente azul, Basalto gris-naranja, Sensei dorado). Verifica que Escarcha=Piso 2 y Torrente=Piso 3 usen la imagen correcta.

---

## BLOQUE F — CARTAS Y ANIMACIONES DEL DOJO

**Carta** (104×148 px):
- Número arriba-izquierda en chip 32×28 del color del elemento, `Press Start 2P` 22 px; ícono de elemento arriba-derecha (16 px); mascota 16×16 escalada ×4 al centro; nombre del elemento abajo.
- **3 etapas de mascota por elemento (9 sprites):** valores 2–4 (forma pequeña), 5–9 (forma media con detalle extra), 10–12 (forma evolucionada: Dragón de Magma / Leviatán Abisal / Ventisca Cero). Ya no deben verse idénticas.
- Marco por nivel: 2–4 borde 1 px; 5–9 borde 2 px + brillo interior que recorre la carta cada 4 s; **10–12** borde dorado `conic-gradient` rotando 3 s + capa holográfica (`mix-blend-mode: overlay`) + "★ n" flotante + 6 partículas.
- Hover: `translateY(-8px) scale(1.06)` + sombra; seleccionada: anillo del color del elemento. Reparto de mano: entrada escalonada de 70 ms por carta.

**Secuencia de ataque (tiempos exactos):**
1. 0–250 ms: tu carta sube de la mano al centro (ease-out); la del rival se voltea (250 ms).
2. **Hit-stop** de 80 ms (todo congelado) + flash blanco de 60 ms.
3. Ganadora escala ×1.15 con halo del elemento; **perdedora se rompe en 24 partículas pixel** del color de su elemento con gravedad (600 ms).
4. Ninja ganador embiste 28 px en 180 ms; ninja perdedor tiembla ±4 px en 6 cuadros.
5. La ficha del elemento ganado vuela al marcador (400 ms, curva bézier) con "+1".
6. Tope global: 120 partículas simultáneas.

**Cinemática de cartas 10+ (máx. 2.2 s):** oscurecer 70 %, barras de cine arriba/abajo (12 %, entrada 250 ms), sprite gigante animado en `<canvas>` (3–4 frames en bucle) + sacudida de pantalla + flash del color del elemento. **Saltable** con clic/ESC/Espacio tras 600 ms. Si `prefers-reduced-motion` o "Reducir efectos" está activo → sustituir por flash de 600 ms. Todo dentro del ciclo de vida (A1).

**Resultado:** pantalla "¡VICTORIA!" / "DERROTA" con pose del ninja, desglose de recompensas con contador de monedas animado (600 ms) y la llave ganada rebotando. Botones: Repetir / Siguiente piso / Salir.

**Opcional (si hay tiempo):** SFX chiptune sintetizados con Web Audio (carta 880 Hz 60 ms, choque ruido 120 ms, victoria arpegio), volumen maestro 0.25, botón silenciar persistente; el `AudioContext` se cierra en `destroy()`.

---

## BLOQUE G — TURBO CORE

1. **Solape de coches:** el coche del jugador se dibuja al final (z-order) a escala ×1.35; las IA mantienen separación mínima longitudinal y lateral para no superponerse; la etiqueta de nombre se ubica 14 px sobre el coche y se oculta/atenúa si choca con otra.
2. **Escenario synthwave:** sol con franjas horizontales y degradado del acento del circuito → magenta, medio oculto tras el horizonte; 2 capas de montañas con parallax (la capa lejana se desplaza al tomar curvas); postes/neones laterales que escalan con la perspectiva; bandas de carretera alternas; líneas de velocidad (8) al usar Nitro; pequeña sacudida de cámara al chocar.
3. Cuenta atrás **3-2-1-GO** con `Press Start 2P`, animación "pop" (escala 1.4→1 en 300 ms).
4. HUD más legible (fuente pixel, 16 px mínimo) y barra de Nitro con segmentos.
5. **Pantalla de resultados:** podio 1.º–4.º, desglose "premio de posición + monedas recogidas + bono de récord", llave ganada con animación. Botones: Reintentar / Circuitos.
6. **Taller:** los puntos de color de Chasis deben tener tooltip (nombre y precio), candado si no están comprados, y estado "Equipado". Botones "Mejorar (N 🪙)": deshabilitar si no alcanza y mostrar **MAX** en nivel 5.
7. Sincroniza nombres, vueltas y premios de circuitos con `game-config.js` (hoy el `.md` y la UI no coinciden).

---

## BLOQUE H — RECOMPENSAS ESTILO DISCORD NITRO

1. **Nuevas categorías de cosméticos** (se agregan al catálogo; el contador total se recalcula solo):
   - **Placas de nombre** (franja de 28 px detrás del nombre en lista de miembros y mensajes directos): `plate_copper_forge` (Común), `plate_glacier` (Raro), `plate_runic_storm` (Épico, brillo animado), `plate_colossus` (Legendario, brasas).
   - **Efectos de perfil** (capa de partículas sobre la tarjeta de perfil, ≤ 24 partículas, pausada fuera de pantalla y con ciclo de vida): `fx_snow` (Raro), `fx_embers` (Épico), `fx_void` (Legendario).
   - **Banners animados:** los Épicos/Legendarios existentes ganan movimiento sutil (gradiente desplazándose 8–12 s); con `prefers-reduced-motion` quedan estáticos.
2. **Sets:** "Set del Coloso" = Marco Núcleo del Coloso + Banner Despertar del Coloso + Título Coloso Caído + `plate_colossus`. Al completarlo: insignia "Conquistador del Coloso" y destello dorado permanente en el marco. Define `SETS` en config y muestra progreso (n/4) en el Armario.
3. **Vista previa antes de equipar:** botón "Probar en perfil" que abre una tarjeta de perfil de muestra con el cosmético aplicado (también para los bloqueados que se pueden forjar).
4. **Apertura de cofre con ceremonia** (saltable con clic/Espacio/ESC; opción "Saltar animación" persistente):
   - Llave entra (300 ms) → cofre vibra (600 ms) → estallido de luz del color de rareza → la carta se voltea.
   - Legendario: pantalla oscurece, rayos dorados y partículas 1.2 s. Duplicado: la carta se disuelve en esencia que vuela al contador.
   - La tira de la ruleta termina con la carta ganadora ampliada ×1.15 y glow.
5. **Armario:** filtro por rareza, orden "Nuevos primero", insignia "NUEVO" (punto) hasta ver el item, y tarjetas con borde/glow según los tokens del Bloque D.

---

## BLOQUE I — VERSIÓN Y DOCUMENTACIÓN

1. `package.json` → `1.9.1`. La etiqueta `v1.9.0` del título de la Bóveda, del Dojo, de Turbo Core y de la esquina inferior izquierda se lee de **una sola constante** (`APP_VERSION`).
2. `CHANGELOG.md` con la entrada 1.9.1 (agrupada por: Correcciones, Nuevo, Cambios de balance).
3. Script `tools\gen-doc.js` que genera `Resumen_Boveda_Estetica_y_Minijuegos_v191.md` **desde `game-config.js`** (conteos correctos, nombres reales, rarezas con los colores nuevos). Enlaces **relativos** (`./app/renderer.js`), sin rutas `C:\Users\...` ni números de línea fijos.

---

## CHECKLIST FINAL (verifica y reporta cada punto)

- [ ] `__EK.vaultDebug()` en 0 tras cerrar con X, ESC, Salir y cambio de pestaña (Dojo y Turbo Core).
- [ ] No aparece "undefined" en ninguna pestaña.
- [ ] Sin insignias superpuestas (Dojo, Turbo Core, panel de usuario, miembros).
- [ ] `@` abre popup, filtra, inserta, resalta, notifica; sin XSS.
- [ ] Rareza: Común gris, Raro azul, Épico morado, Legendario dorado en toda la UI.
- [ ] Sin emojis de sistema en pestañas/llaves/taller; set de llaves unificado.
- [ ] Ruleta de Cobre sin Legendarios en la tira; ⓘ muestra probabilidades y garantías.
- [ ] Piso 5 = +500 🪙 + 1 Obsidiana; esencia por duplicado 5/15/40/100.
- [ ] Cartas con 3 etapas y marcos por nivel; secuencia de ataque y cinemática saltable.
- [ ] Turbo Core sin solapes, con resultados y taller claro.
- [ ] Versión 1.9.1 visible en todas partes; `.md` regenerado desde el código.
- [ ] 60 FPS en carrera, CPU en reposo < 2 % con la Bóveda cerrada.

**Formato del reporte final:** tabla (Bloque | Estado ✅/⚠️/❌ | Archivos | Pendiente) + lista de riesgos (p. ej. economía en cliente) + qué no pudiste probar.
