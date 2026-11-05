# Inventario Técnico para Clasificación por Edades (IARC / Microsoft Store Policy 11.11.1)

**Producto:** EpicKast (`9NWDBN0SHXQR`)  
**Publisher:** `epickap`  
**Versión auditada:** `1.9.1` (`Version="1.9.1.0"`)  
**Propósito de este documento:** Proveer evidencia exacta del código fuente (`Sí / No / Incierto`) para que el desarrollador responda con precisión el cuestionario **Age Ratings (IARC)** en Microsoft Partner Center tras la observación **11.11.1 Age Ratings - Required Rating Certificate**.

> **Nota importante:** Este documento **no** selecciona ni envía la clasificación final por edades. Expone únicamente los hechos técnicos verificables en el código de EpicKast para responder cada pregunta del cuestionario oficial de Partner Center.

---

## Resumen Ejecutivo Rápido para el Cuestionario IARC

| Categoría del Cuestionario IARC | Respuesta según Código | Motivo / Evidencia Principal |
| :--- | :---: | :--- |
| **¿Es una app social / de comunicación con contenido generado por usuarios?** | **SÍ** | Chat de texto en tiempo real, mensajes directos (DMs), llamadas de voz WebRTC y envío de imágenes/archivos (`app/renderer.js`, `server/server.js`). |
| **¿Incluye minijuegos integrados dentro de la aplicación?** | **SÍ** | **Dojo Elemental** (combate de cartas ninja pixel-art) y **Turbo Core** (carrera arcade 2D) dentro de la Bóveda (`app/card-game.js`, `app/racer-game.js`). |
| **¿Contiene violencia fantástica / caricaturesca leve (Cartoon/Fantasy Violence)?** | **SÍ** | En **Dojo Elemental**, ninjas pixel-art de 16×16 lanzan hechizos elementales (fuego, agua, nieve) con destellos y retroceso sin sangre. En **Turbo Core**, autos pixel-art chocan con chispas y pierden escudos (`app/card-game.js`, `app/racer-game.js`). |
| **¿Contiene violencia realista, sangre, gore, muertes gráficas o armas reales?** | **NO** | Cero sangre, cero desmembramientos, cero muertes realistas. Todo el arte es pixel-art abstracto en `Canvas 2D` (`app/sprites.js`). |
| **¿Contiene cofres / recompensas aleatorias virtuales (Loot Boxes)?** | **SÍ (Solo moneda virtual gratuita)** | Cofres de Cobre, Plata, Oro y Obsidiana en la **Bóveda de Reliquias** que otorgan cosméticos de perfil (`rewards.config.json`, `server/server.js`). |
| **¿Se pueden comprar cofres, llaves, monedas o artículos con DINERO REAL?** | **NO** | **Cero pasarelas de pago, cero compras integradas (IAP).** Las monedas y llaves se obtienen exclusivamente gratis jugando y participando (`package.json`, `app/`, `server/`). |
| **¿Contiene apuestas reales o simuladas de casino (Gambling / Cash-out)?** | **NO** | No hay juegos de casino (ruleta de casino, póker, tragamonedas de apuestas) ni posibilidad de retirar dinero real. |
| **¿Permite interacción libre entre usuarios (chat de texto, voz, imágenes)?** | **SÍ** | Comunicación abierta entre usuarios registrados en servidores y mensajes directos (`server/server.js`). |
| **¿Tiene filtro automático de lenguaje inapropiado en el chat?** | **NO** | El contenido propio de la app es 100% limpio, pero el chat de usuarios no aplica filtro léxico automático (`server/server.js`). |
| **¿Comparte la ubicación física (GPS) del usuario?** | **NO** | No se utiliza `navigator.geolocation` ni APIs de ubicación de Windows en ningún archivo. |

---

## Desglose Detallado por Tema (Evidencia en Código)

### 1. Violencia (Minijuegos *Dojo Elemental* y *Turbo Core*)

* **¿Contiene violencia de fantasía o caricaturesca leve? -> `SÍ`**
  * **Dojo Elemental (`app/card-game.js`, `app/sprites.js`, `app/game-config.js`):**
    * **Mecánica:** Juego de cartas por turnos estilo piedra-papel-tijera elemental (*Fuego vence a Nieve, Nieve vence a Agua, Agua vence a Fuego*) definido en `app/card-game.js` (`resolveRound`, líneas 230–284).
    * **Representación visual:** Dos personajes ninja pixel-art de 16×16 píxeles (`app/sprites.js`, funciones `drawPlayerNinja` y `drawBotNinja`, líneas 155–310) se enfrentan en un tatami japonés. Al ganar un turno, se ejecuta `triggerCombatAnim` (`app/card-game.js`, líneas 285–370), que dibuja proyectiles elementales abstractos (llamas naranjas, burbujas/olas azules o copos de nieve celestes) que impactan al rival, causando un breve parpadeo blanco y sacudida de pantalla (`shake`).
    * **Nivel de daño:** Ningún personaje muere, sangra ni sufre heridas visibles; al terminar la partida aparece un cartel de *"¡VICTORIA EN PISO X!"* o *"DERROTA EN PISO X"*.
  * **Turbo Core (`app/racer-game.js`, `app/sprites.js`):**
    * **Mecánica:** Juego arcade de carreras visto desde arriba en 3 carriles (`app/racer-game.js`, `TurboCoreGame`, líneas 1–685).
    * **Representación visual:** El jugador conduce un vehículo deportivo pixel-art (`drawPlayerCar`) esquivando autos rivales (`drawEnemyCar`) y recogiendo monedas y baterías de nitro.
    * **Colisiones:** En la función de colisión (`app/racer-game.js`, líneas 330–405), cuando el auto del jugador choca contra un vehículo rival, se generan partículas de chispas geométricas, se descuenta 1 punto de escudo (`shields`) y el vehículo parpadea durante unos segundos de invulnerabilidad. No existen peatones, atropellos, explosiones sangrientas ni destrucción gráfica.
* **¿Contiene sangre, gore, violencia sexual, tortura o violencia realista? -> `NO`**
  * Verificado en `app/sprites.js`, `app/card-game.js` y `app/racer-game.js`.

---

### 2. Interacción entre Usuarios (Comunicación y Moderación)

* **¿Permite que los usuarios se comuniquen e interactúen entre sí en línea? -> `SÍ`**
  * **Chat de texto en servidores y canales:** `app/renderer.js` (envío y renderizado de mensajes) y `server/server.js` (manejador WebSocket `type === 'chat'`, líneas 1880–1985).
  * **Hilos de conversación (Threads):** `server/server.js` (`thread_create`, `thread_message`, líneas 2010–2115).
  * **Mensajes directos (DMs) y sistema de amigos:** `server/server.js` (`friend_request`, `friend_response`, `friend_remove`, `dm_message`, líneas 2240–2395).
  * **Llamadas de voz en tiempo real:** `app/renderer.js` (`joinVoiceChannel`, captura de micrófono mediante `navigator.mediaDevices.getUserMedia({ audio: ... })` y WebRTC `RTCPeerConnection`) y señalización en `server/server.js` (`voice_join`, `voice_leave`, `voice_signal`, líneas 2420–2540).
  * **Envío de archivos e imágenes y Galería compartida:** `server/server.js` (`POST /upload`, líneas 1020–1110, almacena archivos de hasta 25 MB en `server/uploads/`) y visualización en el chat/galería en `app/renderer.js`.
  * **Enlaces externos y música/YouTube:** Los mensajes con URLs permiten abrir el navegador del sistema mediante `shell.openExternal` (`app/main.js`, líneas 240–255). Además, existe un bot de música para canales de voz (`server/server.js`, `music_play`, líneas 1350–1590) que reproduce audio de YouTube/URLs.
* **¿Existen herramientas de moderación, bloqueo o reporte de usuarios?**
  * **Moderación por propietarios/administradores de servidor -> `SÍ`:** Los dueños y administradores de un servidor pueden expulsar miembros (`kick_member`), gestionar roles y borrar mensajes (`delete_message`) en `server/server.js`. En mensajes directos, un usuario puede eliminar a otro de su lista de amigos (`friend_remove`).
  * **Bloqueo global (`block_user`) o botón de "Reportar abuso" -> `NO`:** En el código actual (`app/renderer.js` y `server/server.js`) **no** existe una función de bloqueo individual (`block_user`) ni un formulario integrado para reportar mensajes/usuarios a un equipo de moderación central.

---

### 3. Contenido Generado por Usuarios (UGC)

* **¿Permite crear o compartir contenido generado por usuarios (texto, imágenes, audio, archivos)? -> `SÍ`**
  * **Evidencia:**
    * Nombres de usuario, biografía/estado personalizado y fotos de perfil/banners (`server/server.js`, `profile_update`).
    * Creación de servidores y canales con nombres e íconos personalizados (`server_create`, `channel_create`).
    * Mensajes de texto libres en canales, hilos y DMs.
    * Subida de imágenes, audio, video y documentos mediante `POST /upload` (`server/server.js`, líneas 1020–1110).

---

### 4. Recompensas Aleatorias (Cofres / *Loot Boxes*)

* **¿Incluye mecánicas de recompensas aleatorias (cofres con llaves)? -> `SÍ (Solo con moneda virtual obtenida jugando)`**
  * **Evidencia (`rewards.config.json`, `app/renderer.js`, `server/server.js`):**
    * La **Bóveda de Reliquias** ofrece 4 cofres (`Cobre`, `Plata`, `Oro`, `Obsidiana`) configurados en `rewards.config.json`.
    * Cada cofre se abre consumiendo 1 llave del mismo tipo (`vault_open_chest` en `server/server.js`) y selecciona un artículo cosmético (marcos de avatar, colores de nombre, banners, títulos, trajes de ninja) según tablas de probabilidad explícitas mostradas en pantalla (`Común`, `Raro`, `Épico`, `Legendario`).
    * Cuenta con garantía **Pity / Sintonía Arcana** (`pityThreshold: 60` tiradas para garantizar un cosmético Legendario no poseído) y convierte duplicados en **Esencia Arcana** para fabricar artículos directamente sin azar (`vault_craft_item`).
  * **¿De dónde salen las monedas y las llaves? -> `Exclusivamente jugando y usando la app (100% gratuito)`**
    * Las **Monedas** y **Llaves** se ganan al vencer pisos en **Dojo Elemental** (`game_dojo_reward`), completar carreras en **Turbo Core** (`game_racer_reward`) y por actividad en el chat/voz (`server/server.js`).
    * Las llaves adicionales se compran únicamente con esas mismas monedas virtuales ganadas jugando (`vault_buy_key`).

---

### 5. Compras con Dinero Real (In-App Purchases / Microtransacciones)

* **¿Existe CUALQUIER compra con dinero real, pasarela de pago o tienda financiera? -> `NO`**
  * **Evidencia:**
    * Se inspeccionaron `package.json`, `app/main.js`, `app/preload.js`, `app/renderer.js` y `server/server.js`.
    * No existe integración con `Windows.Services.Store` (`StoreContext`), Stripe, PayPal, MercadoPago, tarjetas de crédito ni enlaces de pago externos.
    * Ningún elemento de la Bóveda de Reliquias, llaves, monedas o membresías se vende por dinero real.

---

### 6. Apuestas o Juego con Dinero Real (Gambling)

* **¿Contiene apuestas con dinero real, pagos en efectivo o juegos de casino simulados? -> `NO`**
  * **Evidencia:**
    * No es posible ingresar dinero real ni retirar monedas virtuales a dinero real (*cash-out* imposible).
    * Aunque la pestaña de cofres muestra una animación horizontal de selección de reliquias al abrir un cofre (`app/renderer.js`), no existen juegos de azar de casino (póker, ruleta de casino con apuestas, blackjack o tragamonedas).

---

### 7. Datos Personales, Cuentas, Ubicación y Publicidad

* **¿Requiere o permite crear una cuenta de usuario? -> `SÍ`**
  * Registro e inicio de sesión con nombre de usuario y contraseña cifrada con `crypto.scryptSync` + salt en `server/server.js` (almacenado en `server/users.json`).
* **¿Comparte datos personales o actividad con otros usuarios? -> `SÍ (Perfil y presencia)`**
  * Muestra el nombre de usuario, avatar, estado de presencia (`En línea`, `Ausente`, `No molestar`, `Invisible`) y, opcionalmente, el nombre de la aplicación/juego en ejecución detectado localmente (`detectRunningActivity` en `app/main.js`, líneas 88–180).
* **¿Recopila o comparte la ubicación física (GPS) del usuario? -> `NO`**
  * Confirmado: no hay llamadas a `navigator.geolocation` ni permisos de ubicación en `AppxManifest.xml`.
* **¿Muestra publicidad de terceros (Ads)? -> `NO`**
  * Cero SDKs de publicidad o rastreo comercial en todo el proyecto.
* **¿Incluye enlaces a sitios web externos? -> `SÍ`**
  * Los usuarios pueden compartir enlaces web en el chat que se abren en el navegador externo mediante `shell.openExternal` (`app/main.js`).

---

### 8. Lenguaje y Temática Adulta

* **¿El contenido propio de la app incluye lenguaje obsceno, drogas, alcohol, tabaco o contenido sexual? -> `NO`**
  * Todos los textos de la interfaz (`app/index.html`, `app/renderer.js`) y las frases de los personajes del Dojo (`app/game-config.js`) son de temática ninja/arcade familiar.
* **¿Existe un filtro automático de lenguaje inapropiado para los mensajes que escriben los usuarios? -> `NO`**
  * En `server/server.js` los mensajes de chat se sanitizan contra inyección HTML/XSS en el cliente (`escapeHtml` / `textContent`), pero no pasan por un diccionario de censura de groserías. En los cuestionarios IARC esto forma parte de la declaración de **interacción en línea sin filtro entre usuarios** (*Unrestricted / Unfiltered User-to-User Communication*).
