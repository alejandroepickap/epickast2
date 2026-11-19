# Changelog — EpicKast

Todas las notas notables sobre el desarrollo y cambios de EpicKast se documentan en este archivo.

---

## [1.9.8] - 2026-11-19

### 🧩 Menús Unificados con Desplegables, Corrección del Brillo Verde en Videollamadas, Banners Globales, Overlay Click-Through y Baja Latencia WebRTC
- **Corrección del Indicador de Voz en Videollamadas (`app/style.css`):** Eliminado el recuadro verde sobre el avatar/logo interior (`.tile.speaking > .av`) para que únicamente se ilumine el contorno exterior del mosaico al hablar.
- **Corrección de Texto `null` en Cabeceras (`app/renderer.js`):** Filtrado seguro en `replaceChildren()` de `#chTitle` y `#meBar` para eliminar la aparición de `"null"` cuando no hay banner de DM activo.
- **Arquitectura de Modales Unificada y Ajustada a Pantalla (`app/renderer.js`, `app/style.css`):**
  - Todos los modales ahora comparten cabecera fija con botón `✕`, cuerpo desplazable ajustado a `88vh` y pie fijo con los botones `Cerrar` y acción principal siempre visibles.
  - Unificación de `Mi Perfil` y `Tarjeta de Miembro` con acordeones desplegables (`details.settings-acc`) idénticos a `Ajustes`, eliminando controles duplicados y evitando saturar los menús.
- **Banners Globales y Arte Full-Bleed 16:5 (`app/renderer.js`, `app/style.css`, `app/profile-studio.js`, `app/assets/banners/promo_*.webp`):**
  - Banners visibles en Tarjetas de Amigos, Mini-Tarjeta de Inicio, `#meBar`, Lista de Miembros, Cabecera DM, Mosaicos de Voz y `Mi Armario` (altura `72px` sin zoom deformado).
- **Overlay Flotante 100 % Click-Through (`Alt+O`) y Baja Latencia WebRTC (`app/main.js`, `app/overlay.html`, `app/call.js`, `server/server.js`):**
  - Transparencia *click-through* total en bordes/fondo del overlay, cierre global con `Alt+O`/`ESC`, *jitter buffer* reducido (`20 ms` audio / `40 ms` video), eliminación de falsos reinicios ICE y rutas ICE UDP primero.

---

## [1.9.7] - 2026-11-19

### 🎨 Estudio de Banners Pro (Pósters Promocionales Anime & Eventos + Degradados de Estudio), Turbo Core con Perspectiva Curva y Dojo Elemental Refinado
- **8 Pósters Promocionales Originales Anime & Eventos (`1280×400` 16:5 WebP en `app/assets/banners/promo_*.webp`, `tools/build-anime-promo-banners.py`):**
  - Nuevas ilustraciones promocionales estilo key-visual oficial de torneos, convenciones y eventos: *Elemental Clash (Ignis · Maestro Ryūjin · Torrente)*, *Rival Showdown (Ignis vs. Zero-Frost)*, *Cyber Matsuri (Akira Hoshino)*, *Crimson Moon (Kurogane)*, *Shibuya Drift GP (Renji Takahashi)*, *Dual-Soul Shinobi (Kaelen)*, *Colossus Raid* y *Boreal Aurora*.
  - Composición profesional con zona segura lateral izquierda con viñeta coseno sin costuras para que el avatar circular y el nombre nunca tapen los rostros de los personajes.
- **Galería Visual Interactiva de Banners y 12 Degradados Multi-Parada Pro (`app/profile-studio.js`, `app/renderer.js`, `app/style.css`, `app/game-config.js`):**
  - Nuevo selector visual por pestañas (*🔥 Pósters Anime*, *🌈 Degradados Pro*, *🏞️ Mundos Cartoon*, *🎁 Todos*) con miniaturas 16:5 interactivas, insignias de evento y previsualización instantánea en vivo.
  - 12 degradados multi-parada diseñados con armonía de color (*Aurora Hyperion*, *Atardecer en Shibuya*, *Nebulosa de Amatista*, *Obsidiana & Oro Real*, *Océano Bioluminiscente*, *Sakura de Medianoche*, *Cyberpunk Akihabara*, *Esmeralda Cuántica*, *Forja Carmesí*, *Prisma Holográfico*, *Cielo Lo-Fi Pastel*, *Tormenta Eléctrica*).
- **Turbo Core Arcade Circuit con Perspectiva Curva, Horizonte Parallax y Anti-Amontonamiento (`app/racer-phaser.js`, `app/racer-game.js`):**
  - Carretera con perspectiva trapezoidal y curvas sinusoidales dinámicas, horizonte temático con scroll parallax, tribunas de competición *TURBO GP*, velocímetro digital (`KM/H`, marcha y barra RPM) e IA con separación lateral activa para evitar que los rivales se encimen.
- **Dojo Elemental con Escenario Despejado y Ninjas Expresivos (`app/dojo-phaser.js`, `app/card-game.js`):**
  - Reubicación compacta del HUD central para dejar 100% visible la ventana al Monte Fuji con disco solar, pétalos de sakura en movimiento y pergaminos *kakemono*; ninjas rediseñados con túnica *gi*, mirada expresiva y cintas ondeantes.

---

## [1.9.6] - 2026-11-19

### 🎨 Motor Phaser 3 Cartoon 2D (Estilo Club Penguin), Cloudflare Realtime TURN, Moderación Clic Derecho, Estudio de Perfil Pro y Audio Orgánico
- **Minijuegos con Motor Phaser 3 y Arte Cartoon 2D (`app/dojo-phaser.js`, `app/racer-phaser.js`, `app/card-game.js`, `app/racer-game.js`, `app/game.js`, `app/cartoon-art.js`, `app/assets/cartoon/*.webp`):**
  - **Dojo Elemental Phaser 3 (`EKDojoScene`):** Escenario animado a 60 FPS con tatami cálido, puertas *shoji*, ventana con cielo pastel, linternas oscilantes, ninjas cartoon redondeados con contorno limpio (`#1e2433`) y soporte completo de cosméticos/mascotas de *Mi Ninja*, proyectiles elementales y gags cómicos al estilo Card-Jitsu clásico sin recrear el contexto WebGL entre rondas.
  - **Turbo Core Phaser 3 (`TurboCoreScene`):** Motor de carreras pseudo-3D de curvas suaves, paletas diurnas descansadas en las 4 pistas, karts redondeados con inclinación al girar, normalización `dtScale` para monitores de 60/120/144 Hz, rivales con evasión anticipada de obstáculos y sincronización PvP intacta.
  - **Mazmorras Cartoon 2D y Paquete WebP (`318 KB`):** Suelo de adoquines pizarra descansado para la vista, héroes/jefes con contornos limpios 100% aptos para clasificación familiar IARC y 10 ilustraciones cartoon originales optimizadas en `.webp`.
- **Cloudflare Realtime TURN, Videollamada Directa y Estabilidad WebRTC (`server/server.js`, `app/call.js`):**
  - Integración oficial con **Cloudflare Realtime TURN** (`CF_TURN_TOKEN_ID` / `CF_TURN_API_TOKEN`) con credenciales efímeras `stun:` / `turn:` / `turns:` y respaldo automático.
  - Presupuesto de subida adaptativo (`4800 kbps`), degradación inteligente de resolución/FPS ante pérdida de paquetes (`monitorNetwork`), *watchdog* contra audio unidireccional y botón de **Videollamada Directa** (`video: true`) en amigos y mensajes directos.
- **Moderación por Clic Derecho y Drag & Drop en Canales de Voz (`app/context-menu.js`, `server/server.js`):**
  - Menú contextual (clic derecho en PC / pulsación larga en móvil) sobre mosaicos de cámara y miembros en canales de voz con control de volumen individual (`0–200%`), enfoque de cámara, silenciar, ensordecer, asistencia de audio, mover a otro canal o desconectar (`voice.disconnect`).
  - Arrastrar y soltar (*SortableJS*) usuarios entre canales de voz de la barra lateral para administradores con permisos `moveMembers`.
- **Estudio de Perfil Pro, Bóveda Animada y 16 Sonidos Orgánicos (`app/profile-studio.js`, `app/audio-engine.js`, `app/theme-tokens.css`):**
  - Selector libre de color sólido y degradado de 2 paradas (*Pickr*), recortador interactivo `16:5` para subir banners personalizados (*CropperJS* + `POST /upload?kind=banner`), 3 fondos cartoon gratuitos estilo Club Penguin y animaciones *GSAP* + confeti en la Bóveda.
  - Motor de audio **Howler.js** (`window.EKAudio`) con 16 efectos WAV orgánicos sin pitidos estridentes, jerarquía visual de 4 superficies oscuras descansadas y vista de Amigos en 2 columnas.
- **Cumplimiento Microsoft Store (`app/main.js`, `app/preload.js`, `STORE_AGE_RATING_INVENTORY.md`):**
  - `isStoreBuild()` desactiva y oculta cualquier auto-actualizador/desinstalador propio cuando la app se ejecuta como paquete de Microsoft Store (`9NWDBN0SHXQR`), manteniendo `0` CDNs externos (`script-src 'self'`).

---

## [1.9.5] - 2026-11-17

### 🏯 Dojo Elemental HD (Estilo Card-Jitsu Original), Colección de 60 Cartas, Inventario Estilo Clash Royale, Santuario Arcano y Ventana Flotante Limpia
- **Colección Ampliada a 60 Cartas (36 Base Ilustradas + 24 Desbloqueables) e Inventario Estilo Clash Royale (`app/card-game.js`, `app/style.css`, `app/assets/cards/std/`):**
  - **36 Cartas Base por Defecto (Poder 1 al 12 en Fuego, Agua y Nieve):** Todos los jugadores cuentan desde el inicio con el set completo ilustrado de 36 cartas (`Fogata` a `Maestro de Fuego`, `Gotas` a `Maestro de Agua`, `Escarcha` a `Maestro de Hielo`).
  - **24 Cartas Desbloqueables de Colección (`X01`–`X24`):** Carátulas exclusivas obtenibles en sobres elementales (`250 🪙`) y como bono en la Ruleta de la Bóveda, con contador de copias repetidas (`×2`, `×3`, etc.) y rarezas (`Común`, `Rara`, `★ Especial`).
  - **Animaciones y Cinemáticas Exclusivas para Cartas > 10 (`Poder 11 y 12`):** Las cartas de poder 11 y 12 (tanto base como desbloqueables) lucen marco dorado pulsante, barrido holográfico continuo, insignia **`★ ESPECIAL`**, partículas elementales ascendentes/descendentes (brasas, burbujas o copos) e **invocación cinemática a pantalla completa** al ganar un choque.
  - **Inventario de Cartas Estilo Clash Royale:** Nuevo modal de colección con barra de progreso global (`n/60`), filtros por elemento (`Todas`, `🔥 Fuego`, `💧 Agua`, `❄️ Nieve`, `★ Especiales`) y origen (`Base` / `Desbloqueables`), secciones **"Cartas desbloqueadas"** y **"Por descubrir"**, y vista detallada al hacer clic en cualquier carta.
- **Pilas Visuales de Cartas en Cascada (`app/card-game.js`, `app/style.css`):**
  - Marcador superior con **3 columnas elementales (`Fuego`, `Agua`, `Nieve`)** que apilan cada carta ganada como una mini-carta real en cascada vertical con su color de marco, elemento y número, más insignia **`×2` / `×3`** y alerta **`⚠️ ¡A 1 CARTA!`** en *Match Point*.
- **Dojo Tradicional Ilustrado HD, Ninjas Vectoriales y Cartas 3D:**
  - Escenario del tatami con puertas *shoji*, linternas cálidas, vigas de madera y Amuleto Elemental central.
  - Ninjas vectoriales detallados con cinturón Obi y colas ondeantes en el color exacto de tu rango, armas detalladas (Katana, Bastón Bo, Pergamino, Shuriken, Kunai) y mano oculta de 5 cartas boca abajo del rival.
- **Bóveda "Santuario Arcano" & Turbo Core Plasma (`app/renderer.js`, `app/racer-game.js`):**
  - Tarjetas de cofres/llaves con acabado metálico radial y riel de ruleta con iluminación por rareza; halo radial *Warp* y llamas de plasma en **Turbo Core**.
- **Ventana Flotante y Enfoque de Cámara Auto-Ocultable (`app/style.css`, `app/renderer.js`):**
  - Botón `⤢ Restaurar` compacto en una sola línea, y ocultamiento automático de la barra superior y controles de cámara al enfocar una cámara o usar modo flotante, desplegándose al seleccionar/hacer clic en la cámara o pasar el cursor arriba.

---

## [1.9.4] - 2026-11-17

### 🎙️ Audio HD, Anti-Doble-Voz, Multijugador 1v1, Controles de Admin y Cámaras Flotantes
- **Solución al silencio al entrar a canales de servidor:** Reanudación automática de reproducción de elementos `<video>` tras re-parentar el DOM en `renderStage()` y limpieza de `p.ignore` en colisiones WebRTC (*glare*).
- **Filtro De-Hiss Anti-Ruido-Blanco y Guarda Anti-Eco:** Corte de estática aguda (`highshelf` `-3.5 dB` en `6.2 kHz`), piso mínimo de compuerta (`0.0045`) para que el AGC/Compresor no amplifique ruido térmico en silencio, y atenuación adaptativa del retorno de altavoces cuando otro habla.
- **Minijuegos Multijugador 1v1 en Vivo (`Dojo Elemental` y `Turbo Core`) + Bono Diario:** Duelos de cartas 1v1 y carreras 1v1 en tiempo real contra amigos/pareja conectados (`cardjitsu.challenge`, `cardjitsu.accept`, `cardjitsu.play`, `minigame.sync`) con banner interactivo para aceptar retos y botón de **Bono Diario** en la Bóveda.
- **Overlay Gamer Automático:** Activación automática del Overlay flotante al detectar la apertura de un juego compatible (`autoOverlayOnGame`), con opción para deshabilitarlo en Ajustes.
- **Controles de Administrador en Canales de Voz:** Añadido **Ensordecer** (`voice.serverDeafen`), **Asistencia Remota de Audio** (`voice.assistAudio`: Anti-Eco, Voz Clara HD, Subir Micro) además de Silenciar y Mover de Canal de Voz.
- **Interfaz Simple + Ajustes Avanzados (Pro) + Mejoras Estéticas:** Configuración simplificada por defecto con botón **"Ajustes Avanzados (Pro)"**, agrupación limpia de mensajes consecutivos en el chat, anillos de voz con brillo neón y efectos *glassmorphism*.
- **Cámaras Flotantes Unificadas, Zoom y Panorámica Interactiva:**
  - **Rueda del ratón (`1x` a `3.5x`)** o botón **`1x / 1.5x / 2x / 2.5x`** sobre cualquier cámara para acercar y **clic + arrastrar** para mover el encuadre; **doble clic** para fijar en grande (*Spotlight*).
  - **Mini-cámaras integradas en la barra de llamada (`#voicePill`)** al cambiar de canal sin ventanas encimadas, y **Modo Ventana Flotante (`mini-mode`)** con controles integrados en la barra superior (`#winBar`), indicador luminoso de quién habla y recuperación automática de posición entre monitores.
- **Reconexión de Llamada tras Cierre Inesperado + Iconografía Minimalista:**
  - Banner superior inteligente (**"Reconectar a la llamada"**) al reabrir EpicKast tras un cierre inesperado, además de botón de resincronización WebRTC en vivo.
  - Sustitución de emojis genéricos por **iconos vectoriales monocromáticos (SVG)** minimalistas y eliminación de cualquier duplicación de audio local (`c.camTrack` solo-video en vistas previas y silenciamiento estricto al usar amplificación `>100%` o filtro receptor anti-teclado).

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
