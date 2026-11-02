# EpicKast — optimización guiada por REA

Evidencia cruda en [`rea-evidence/`](rea-evidence). Todo se obtuvo con REA (`rea-agents`) sobre el cliente de Discord instalado en este equipo y sobre EpicKast mismo.

## Qué mostró REA del cliente de Discord → qué hace EpicKast distinto

| Hallazgo en Discord (REA + logs + desensamblado de `discord_voice.node`) | Costo | Decisión en EpicKast |
|---|---|---|
| Webcam (C920, frames `I420` en CPU) rechazada por el codificador AMD DX11 (`EncodeInvalidEncoderType`), cae a `MediaFoundation SW` y **reintenta cada 10 s** | 24–52 % CPU | Se usa la ruta estándar de Chromium: captura MediaFoundation **D3D11** (`main.js`) y **H.264 primero** (`call.js › preferredCodecs`) para codificar/decodificar por GPU. Panel de estadísticas muestra `(HW)` o `(CPU)` real por llamada. |
| Segundo decodificador H264 + VMAF/PSNR cada 5 s sobre tu propio video (`ImageQualitySink`, `singleCpuCopy`) solo para telemetría | CPU + RAM extra | **No existe**: cero telemetría ni análisis de calidad. |
| `debugLogging` activo por defecto: logs WebRTC de 5 MB sin parar | Disco/CPU | Sin logs de depuración en disco. |
| Krisp `full_NC` (red neuronal a 32 kHz) + sondas de eco + módulos `discord_ml`, `game_utils`… | CPU/RAM | Supresión de ruido/eco/AGC **integrada de Chromium** (barata); sin módulos nativos extra. |
| Borrado de caché de shaders/V8 al arrancar | Arranque lento | Cachés de Chromium intactas; `--lite-mode` y `--max-old-space-size=192` limitan V8. |
| Electron con fuses por defecto (`RunAsNode`, `NodeOptions`, `Inspect` activos; sin integridad ASAR) | Superficie de ataque | Ver "Endurecimiento" abajo ([`electron_fuses.json`](rea-evidence/electron_fuses.json)). |

## Decisiones por área

- **Videollamadas**: bitrate/fps topados con `RTCRtpSender.setParameters`; el uplink se reparte entre receptores (`share()`); `degradationPreference` según tipo de contenido; Opus 40 kbps mono con prioridad de red alta.
- **Pantalla compartida**: selector propio (miniaturas solo cuando lo abres), presets 720p30 → 1440p60, `contentHint` `detail`/`motion`, audio del sistema opcional (desactivado por defecto: con altavoces genera eco).
- **Memoria**: cliente sin frameworks (~vanilla JS), una ventana, DOM de chat acotado a 300 nodos con carga paginada hacia atrás, tiles de video reutilizados (sin recrear `<video>`), detección de voz leyendo SSRC (sin `AudioContext`), estadísticas solo si las activas.
- **Servidores y amigos**: SQLite en modo WAL con sentencias preparadas cacheadas, un WebSocket por cliente sin compresión, límite de 256 KB por mensaje y 30 msg/10 s por conexión, invitaciones por código, roles dueño/miembro, expulsión, canales de texto y voz, DM solo entre amigos.
- **Seguridad**: contraseñas con scrypt + sal, comparación en tiempo constante, tokens de sesión de 90 días, `contextIsolation`, `sandbox`, CSP estricta, permisos de Chromium limitados, navegación externa bloqueada.

## Límites conocidos (honestos)

1. **Malla P2P**: cada participante codifica su video una vez por receptor. Ideal para 2–5 personas; el servidor limita salas a 8 (`EPICKAST_MAX_ROOM`). Para grupos grandes, el siguiente paso es un SFU (p. ej. mediasoup/LiveKit), que codifica una sola vez.
2. **Conexión entre redes distintas** requiere STUN (incluido) y, para algunas redes/CGNAT, un servidor TURN (`EPICKAST_TURN_URL/USER/PASS`).
3. El cifrado es el de WebRTC (DTLS-SRTP) entre pares; los mensajes de texto viajan por el servidor sin cifrado de extremo a extremo; usa `wss://` (proxy TLS) o una VPN (Tailscale) fuera de tu red local.

## Endurecimiento para distribución (pendiente al empaquetar)

Los fuses del Electron de desarrollo están por defecto. Al empaquetar con `electron-builder` + `@electron/fuses`, desactivar `RunAsNode`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments`; activar `EnableCookieEncryption`, `EnableEmbeddedAsarIntegrityValidation`, `OnlyLoadAppFromAsar`; y volver a verificar con `rea inspect-electron-fuses`.

## Cómo reproducir los análisis

```
rea analyze-javascript-application app --detail summary --evidence_output docs/rea-evidence/epickast_app.evidence.json --json
rea inspect-electron-fuses node_modules/electron/dist/electron.exe --json
```
