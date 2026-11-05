# Changelog — EpicKast

Todas las notas notables sobre el desarrollo y cambios de EpicKast se documentan en este archivo.

---

## [1.9.1] - 2026-11-04

### 🚀 Correcciones (Bugs Críticos Bloque A)
- **A1. Fugas de Memoria y Ciclo de Vida Idempotente:**
  - Implementación de `app/lifecycle.js` (`window.EKLifecycle.create(scope)`) para gestión unificada de `requestAnimationFrame`, `setInterval`, `setTimeout`, `addEventListener` (mediante `AbortController`) y `AudioContext`.
  - Métodos idempotentes `start()`, `pause()`, `resume()` y `destroy()` integrados en `CardJitsuGame` y `CoreRacerGame`.
  - Pausa automática instantánea al ocultar la pestaña (`visibilitychange`) con overlay modal `"PAUSA"` y cuenta regresiva elástica de 3 segundos al reanudar.
  - Confirmación de salida (`"¿Salir? Perderás esta partida (sin recompensas)"`) al pulsar `✕ Cerrar`, `ESC` o cambiar de pestaña durante una partida en curso.
  - Guardia de reclamo único (`rewardClaimed`) contra duplicación de recompensas por doble clic o lag.
  - Cierre formal del `AudioContext` en `destroy()` para evitar acumulación de nodos de audio fantasma.
  - Destrucción segura en `beforeunload` y utilidades de diagnóstico `window.__EK.vaultDebug()` y `window.__EK.disposeVaultScopes()`.
- **A2. Texto "undefined" e Inconsistencias de Lore:**
  - Corregido el renderizado de descripción en las 5 tarjetas de guardianes del Dojo (`f.desc ?? ''`).
  - Añadido lore épico de ≤ 70 caracteres para cada guardián del Núcleo.
  - Verificación automática en cada pestaña con `window.__EK.assertNoBadText(container)`.
- **A3. Insignias Superpuestas y Scroll en Turbo Core:**
  - Cabeceras de circuitos de Dojo y Turbo Core adaptadas con flex-wrap estático (`✓ DOMINADO`, `1ª RECOMPENSA`, `NIVEL 4`).
  - Barra de scroll visible y degradado inferior en la Bóveda para asegurar visibilidad completa de la 4ª tarjeta de Turbo Core.
- **A4. Insignia de Título Comprimida en Barra Inferior y Lista de Miembros:**
  - Versión compacta (`titleBadgeEl(title, 'icon')`) con icono de 18px y tooltip nativo `title` para `#meBar` y `#members`.
  - Versión extendida en chat con ancho máximo de 180px, texto truncado con puntos suspensivos y separación adecuada.
- **A5. Contraste WCAG AA y Estado de Usuarios Desconectados:**
  - Función `ensureContrast(color, bg, 4.5)` aplicada a nombres y gradientes (3:1 para miembros desconectados).
  - Punto de estado de desconectados corregido a `#64748b` (evitando que usuarios offline muestren punto verde).
  - Integración de paleta oscura slate (`--bg-app: #0b0e14`, `--bg-panel: #0f131d`, etc.).

### ✨ Nuevo (Bloques B, D, E, F, G, H)
- **Bloque B: Menciones con `@` en Canales de Servidor:**
  - Menú flotante predictivo de menciones sobre el input de chat (320px de ancho, hasta 8 filas de 40px, avatar de 28px, nombre con color y contraste seguro, e indicador de presencia).
  - Búsqueda insensible a mayúsculas y acentos (starts-with y contains) con aviso `"Sin coincidencias"`.
  - Navegación completa por teclado (`↑`/`↓`, `Enter`/`Tab`, `Escape`).
  - Renderizado seguro anti-XSS con tokens `<span class="mention" data-uid="...">@Nombre</span>` que abren la tarjeta de perfil al hacer clic.
  - Resaltado dorado visual en mensajes que te mencionan (`border-left: 3px solid #facc15`).
  - Notificaciones de escritorio, sonido de campanilla rúnica Web Audio e insignia roja con contador en canales y riel de servidores.
- **Bloque D & E: Sistema Visual Pixel-Art y Estudio "Mi Ninja":**
  - Motor de sprites vectoriales nítidos `app/sprites.js` para pestañas, llaves, monedas, esencia, elementos y armas.
  - Estudio ninja en cuadrícula 24×30 con sombreado de 3 tonos, animación de respiración idle, cinta de cabeza al viento, botones de pose (`Idle`, `Ataque`, `Victoria`), generador aleatorio y partículas de aura a 30 FPS.
- **Bloque F: Animaciones y Mascotas del Dojo Elemental:**
  - 3 fases evolutivas por elemento (9 mascotas pixel art kawaii).
  - Bordes de nivel con marcos holográficos dorados rotativos para cartas 10-12.
  - Secuencia de choque con hit-stop de 80ms, destello blanco, desintegración de la carta perdedora en 24 partículas y cinemática épica de cartas 10+ skippable.
- **Bloque G: Acabado Audiovisual Turbo Core:**
  - Dibujado del vehículo del jugador a escala 1.35x en capa superior con separación de karts rivales.
  - Sol synthwave con franjas de horizonte, montañas en paralaje de 2 capas, postes de neón en perspectiva, líneas de velocidad nitro y sacudida de pantalla en colisiones.
  - Cuenta atrás elástica 3-2-1-GO y pantalla de podio detallada.
- **Bloque H: Recompensas Estilo Discord Nitro:**
  - 33 Cosméticos en catálogo único: Nuevas Placas de Nombre (`plate_copper_forge`, `plate_glacier`, `plate_runic_storm`, `plate_colossus`) y Efectos de Perfil animados (`fx_snow`, `fx_embers`, `fx_void`).
  - Progreso del **Set del Coloso (4/4)** con distinción de *Conquistador del Coloso*.
  - Modal *"👁️ Probar en Perfil"* con simulación en tiempo real y partículas en canvas.
  - Ceremonia de cofre con botón de saltar y guardado de preferencia persistente.

### ⚖️ Cambios de Balance y Fuente de Verdad (Bloque C)
- Módulo unificado `app/game-config.js` y sincronización con `rewards.config.json`.
- Unificación total del lore a **Coloso** (eliminado término Gólem).
- Piso 5 del Dojo otorga recompensa primera victoria: `+500 🪙 + 1 Llave Obsidiana` (entrenamiento: 50% monedas + 25% Llave Cobre).
- Esencia por duplicados rebalanceada: `5 / 15 / 40 / 100` (fabricación: `40 / 120 / 300 / 800`).
- Ruleta honesta: cartas del strip generadas exclusivamente con probabilidades del cofre seleccionado (en Cobre no aparecen legendarias en el visor).
- Modal `ⓘ Probabilidades` con tabla nominal completa y contadores de Sintonía y Garantía Épica en vivo.
