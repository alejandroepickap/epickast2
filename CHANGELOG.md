# Changelog — EpicKast

Todas las notas notables sobre el desarrollo y cambios de EpicKast se documentan en este archivo.

---

## [1.9.4] - 2026-11-17

### 🎙️ Audio HD, Anti-Doble-Voz, Multijugador 1v1, Controles de Admin y Cámaras Flotantes
- **Solución al silencio al entrar a canales de servidor:** Reanudación automática de reproducción de elementos `<video>` tras re-parentar el DOM en `renderStage()` y limpieza de `p.ignore` en colisiones WebRTC (*glare*).
- **Filtro De-Hiss Anti-Ruido-Blanco y Guarda Anti-Eco:** Corte de estática aguda (`highshelf` `-3.5 dB` en `6.2 kHz`), piso mínimo de compuerta (`0.0045`) para que el AGC/Compresor no amplifique ruido térmico en silencio, y atenuación adaptativa del retorno de altavoces cuando otro habla.
- **Minijuegos Multijugador 1v1 en Vivo (`Dojo Elemental` y `Turbo Core`) + Bono Diario:** Duelos de cartas 1v1 y carreras 1v1 en tiempo real contra amigos/pareja conectados (`cardjitsu.challenge`, `cardjitsu.accept`, `cardjitsu.play`, `minigame.sync`) con banner interactivo para aceptar retos y botón de **Bono Diario** en la Bóveda.
- **Overlay Gamer Automático:** Activación automática del Overlay flotante al detectar la apertura de un juego compatible (`autoOverlayOnGame`), con opción para deshabilitarlo en Ajustes.
- **Controles de Administrador en Canales de Voz:** Añadido **Ensordecer** (`voice.serverDeafen`), **Asistencia Remota de Audio** (`voice.assistAudio`: Anti-Eco, Voz Clara HD, Subir Micro) además de Silenciar y Mover de Canal de Voz.
- **Interfaz Simple + Ajustes Avanzados (Pro) + Mejoras Estéticas:** Configuración simplificada por defecto con botón **"Ajustes Avanzados (Pro)"**, agrupación limpia de mensajes consecutivos en el chat, anillos de voz con brillo neón y efectos *glassmorphism*.
- **Cámaras Flotantes PiP (Dentro de la App y al Minimizar) + Insignia `v1.9.4`:** Miniventana flotante arrastrable al navegar por la app y modo flotante automático al minimizar en llamada, más insignia `v1.9.4` en la esquina inferior derecha.

## [1.9.3] - 2026-11-05

### 📱 Nuevo: Versión Móvil (Android APK + PWA Multiplataforma) y Microsoft Store Certified
- **Interfaz Responsiva y Táctil (`app/mobile.css`, `app/mobile.js`, `app/mobile-shim.js`):**
  - Adaptación automática en pantallas `<= 820px` con cajones deslizables (`#rail` + `#side` a la izquierda y `#members` a la derecha), gestos swipe desde los bordes y soporte nativo del botón **Atrás** de Android.
  - Tarjetas de amigos, Bóveda de Reliquias, Hilos y Guías Oficiales optimizadas para uso con una sola mano y soporte `safe-area-inset` para *notch* / isla dinámica.
- **Llamadas WebRTC en Móvil (`app/call.js`):**
  - Alternancia de cámara frontal/trasera en vivo (`switchCamera()` con `RTCRtpSender.replaceTrack`) sin renegociar ni cortar la llamada.
  - Puente nativo en `MainActivity.java` para permisos de micrófono/cámara, enrutamiento a altavoz (`MODE_IN_COMMUNICATION`), desbloqueo de `AudioContext` y selector de archivos adjuntos (`📎`).
- **Minijuegos Adaptados a Pantalla Táctil:**
  - **Turbo Core (`app/racer-game.js`):** Controles táctiles multi-touch con `Pointer Events`, botón dedicado de freno, rampas, aceite, barreras láser y minimapa.
  - **Dojo Elemental (`app/card-game.js`):** Tatami fluido sin recortes laterales y mano de cartas con desplazamiento horizontal táctil.
- **Servidor & Persistencia (`server/server.js`, `server/firebase-adapter.js`):**
  - Servidor web móvil en `/app/` (PWA instalable) y descarga directa del APK en `/apk`.
  - Coalescing de respaldos cada 60s y deduplicación SHA-256 para proteger la cuota gratuita de Firebase Spark.

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
