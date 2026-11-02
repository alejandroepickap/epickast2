# Guía de Contexto y Arquitectura de EpicKast

> **Propósito de este documento**: Servir como mapa de referencia rápida para entender cada archivo, tabla, protocolo y flujo de audio/video de **EpicKast** en cualquier sesión futura sin tener que re-explorar todo el proyecto desde cero.

---

## 1. Mapa de Archivos del Proyecto

| Ruta | Rol y Responsabilidad |
|---|---|
| [`package.json`](../package.json) | Metadatos (`version`, `scripts`, configuración de `electron-builder` para generar el instalador NSIS `.exe` y el `.zip`). |
| [`server/server.js`](../server/server.js) | Servidor ligero todo-en-uno (HTTP + WebSocket `ws` + SQLite nativo `node:sqlite`). Maneja cuentas, amigos, servidores/canales, mensajes, subida/descarga de archivos (`/upload`, `/files/:id`), galería (`files.list`), timbre de llamada (`call.incoming`/`call.stop`), señalización WebRTC (`rtc.signal`) y actualizaciones (`/version`, `/download/latest`). |
| [`app/main.js`](../app/main.js) | Proceso principal de Electron: banderas de rendimiento GPU/Chromium, ventana única, permisos de medios, captura de pantalla con selector propio (`desktopCapturer`), modo ventana sobre ventana (`setMiniMode` Always-on-Top) y métricas de CPU/RAM. |
| [`app/preload.js`](../app/preload.js) | Puente seguro (`contextBridge` -> `window.epic`): expone `listSources`, `selectSource`, `metrics`, `flash`, `toggleMini`, `onMiniChanged`, `version` y `openExternal`. |
| [`app/index.html`](../app/index.html) | Estructura DOM principal (Login, Rail lateral con logo `EK`, Sidebar de DMs/Canales, VoiceDock compacto desplegable, Escenario de video `#stageWrap` con barra flotante estilo Google Meet `#meetBar` y tirador de altura `#stageResizer`, Chat con botones `📎` y `🎙️`, `callOverlay` y `modal`). |
| [`app/style.css`](../app/style.css) | Sistema de diseño oscuro minimalista (`--bg`, `--bg2`, `--bg3`, `--ac`), modo Spotlight estilo Google Meet (`#stage.spotlight`), barra flotante `#meetBar`, grilla de galería, controles de volumen por usuario (`.vol-wrap`) y layout responsivo para `body.mini-mode`. |
| [`app/call.js`](../app/call.js) | Motor WebRTC P2P (`Call`) y cadena de micrófono de estudio (`createMic`): filtro paso-alto (`115 Hz`), recorte nasal (`180 Hz`), supresión neuronal **RNNoise** (`AudioWorklet`), **Puerta de Voz Anti-Respiración (`voiceGate`)**, compresor suave de picos (`DynamicsCompressorNode`), ganancia (`micGain`), priorización **H.264 por hardware** y bitrate de audio HD (`96–128 kbps`). |
| [`app/renderer.js`](../app/renderer.js) | Lógica de interfaz: estado `S`, cliente WebSocket con reconexión automática, subida de archivos (`📎`, Drag & Drop, `Ctrl+V`), galería de imágenes/documentos (`modalGallery`), editor de perfil (`FileReader` -> WebP `128×128`), control de volumen individual por usuario (`0 %–200 %` con `GainNode` boost) y timbre/overlays de llamada. |
| [`app/vendor/rnnoise-worklet.js`](../app/vendor/rnnoise-worklet.js) | Bundle compilado de `@timephy/rnnoise-wasm` que corre en el hilo de audio (`AudioWorkletGlobalScope`). |
| [`tools/harden-fuses.js`](../tools/harden-fuses.js) | Hook `afterPack` de `electron-builder` que estampa el icono multi-resolución `build/icon.ico` en `EpicKast.exe` mediante `rcedit.exe` y endurece los *Electron Fuses* según la auditoría de REA. |
| [`tools/make-icon.js`](../tools/make-icon.js) | Generador sin dependencias del monograma minimalista **EK** multi-resolución (`16, 32, 48, 64, 128, 256 px` en `build/icon.ico`, `build/icon.png` y `app/icon.png`). |
| [`tools/smoke-test.js`](../tools/smoke-test.js) | Test unitario/integración del servidor (`npm test`). |
| [`tools/e2e-electron.js`](../tools/e2e-electron.js) | Test E2E real con dos ventanas de Electron probando login, amigos, avatares, llamadas, RNNoise, cámara H.264 HW y pantalla compartida. |
| [`docs/OPTIMIZACION-REA.md`](OPTIMIZACION-REA.md) | Decisiones de rendimiento derivadas de la ingeniería inversa con **REA (`rea-agents`)** sobre Discord y Electron. |
| [`Dockerfile`](../Dockerfile) | Contenedor listo para desplegar el servidor en la nube 24/7 cuando se decida activar el pendiente de servidor externo. |

---

## 2. Esquema de Base de Datos (`server/data/epickast.db`)

- **`users`**: `(id, name, salt, hash, created, avatar, color, bio, av)` — `avatar` guarda el DataURL WebP `128×128` (<60 KB) y `av` es el timestamp de versión para cachear avatares en el cliente sin re-descargarlos.
- **`sessions`**: `(token, user_id, created)` — tokens de sesión de 90 días.
- **`friends`**: `(a, b, status)` — `'pending'` o `'accepted'`.
- **`servers` / `members` / `channels`**: servidores creados por usuarios, códigos de invitación (`invite`), canales `'text'` y `'voice'`.
- **`files`**: `(id, channel, user_id, name, mime, size, disk, ts)` — metadatos de imágenes, documentos y notas de voz enviadas; los bytes reales viven en `server/data/uploads/<disk>` para mantener la BD SQLite ultrarrápida.
- **`messages`**: `(id, channel, user_id, text, ts, file_id, reply_to, pinned)` — mensajes de texto, notas de voz (`audio/webm`), archivos adjuntos (`file_id`), respuestas citadas (`reply_to`) y mensajes fijados (`pinned`).

---

## 3. Protocolo del Servidor (`:7777`)

### Endpoints HTTP
- `GET /health`: estado del servidor.
- `GET /version` y `GET /download/latest`: versión actual y descarga directa del instalador `EpicKast-Instalador-x.y.z.exe` desde `dist/`.
- `POST /upload?channel=...&name=...&mime=...&text=...&replyTo=...` (Header `x-token`): recibe el stream binario del archivo o nota de voz (hasta 25 MB), lo guarda en `uploads/`, crea el registro en `files` y `messages`, y emite el evento `{ t: 'msg' }` en tiempo real.
- `GET /files/:id` (`?dl=1` para forzar descarga): sirve imágenes y notas de voz inline con caché inmutable y documentos como descarga segura.

### Operaciones WebSocket (`rpc(t, data)`)
- **Autenticación y perfil**: `register`, `login`, `resume`, `profile.set`, `profile.get`, `profile.avatar`.
- **Amigos y DMs**: `friends.list`, `friends.add`, `friends.accept`, `friends.remove`, `dm.open`.
- **Servidores y canales**: `servers.list`, `server.create`, `server.get`, `server.join`, `server.leave`, `server.delete`, `server.kick`, `server.newinvite`, `channel.create`, `channel.delete`.
- **Chat, notas de voz, fijados y galería**: `msg.send` (soporta `replyTo`), `msg.history`, `msg.pin`, `msg.pins`, `msg.typing`, `files.list`.
- **Voz, llamadas y WebRTC**: `voice.join`, `voice.leave`, `voice.state`, `call.decline`, `rtc.signal`.

---

## 4. Pendientes y Hoja de Ruta (Roadmap)

- [ ] **Pendiente 1 — Servidor Externo 24/7 en la Nube**:
  - Actualmente el servidor corre localmente (`Iniciar-Servidor.bat` / `Iniciar-Todo.bat`).
  - Cuando se quiera que los amigos puedan llamarse y chatear aunque la PC principal esté apagada, desplegar [`Dockerfile`](../Dockerfile) en un servicio gratuito (Render / Fly.io / Railway / Oracle Cloud Free Tier) y apuntar la URL del servidor a `wss://...`.
- [x] **Completado — Mejoras multi-plataforma recomendadas**:
  - Notas de voz rápidas (`🎙️`) y respuestas citadas (`↩ Responder`) estilo Telegram.
  - Mensajes fijados por canal/DM (`📌 Fijados`) estilo Slack/Linear.
  - Semáforo de señal en vivo (`🟢 14 ms` / pérdida de paquetes) estilo Parsec/Steam.
  - Atajos globales de teclado (`Alt+M` Silenciar micro / `Alt+D` Silenciar audio) funcionando incluso dentro de juegos a pantalla completa estilo TeamSpeak 5.
