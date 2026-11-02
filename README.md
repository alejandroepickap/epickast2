# EpicKast

Plataforma de comunicación personal optimizada con **REA**: chat, amigos, servidores con canales de texto y voz, videollamadas con aceleración por hardware (`MediaFoundationVideoEncodeAccelerator` + `D3D11VideoDecoder`), pantalla compartida, avatares personalizados y supresión de ruido neuronal ligera (**RNNoise**).

## 🚀 Uso rápido en tu PC
1. **Abrir todo (Servidor + App)**: haz doble clic en [`Iniciar-Todo.bat`](Iniciar-Todo.bat).
2. **Probar una llamada contigo mismo en el mismo PC**: con tu sesión abierta, haz doble clic en [`Iniciar-Segunda-Ventana.bat`](Iniciar-Segunda-Ventana.bat) para abrir un segundo perfil independiente (`EpicKap2`), agrégalo como amigo y llámalo con el botón verde **📞 Llamar**.

## ✨ Novedades incluidas
- **Notificación de llamadas entrantes y salientes**:
  - Al pulsar **📞 Llamar** a un amigo conectado, a él le salta una tarjeta a pantalla completa con tu avatar animado, timbre de llamada, notificación de Windows y parpadeo en la barra de tareas, con botones claros **📞 Contestar** y **📵 Rechazar**.
  - Mientras suena (hasta 45 s), tú ves *"Llamando…"* con botón **📵 Cancelar**.
  - En llamada, la barra inferior muestra etiquetas claras: **Micro**, **Audio**, **Cámara**, **Pantalla** y **Colgar**.
- **Avatares de perfil y personalización**:
  - Haz clic en tu nombre/avatar abajo a la izquierda para subir una foto de perfil (se recorta y comprime automáticamente a WebP 128×128), elegir el color de tu avatar y poner tu frase/estado.
  - En **⚙️ Ajustes** puedes elegir el **Color de acento** de toda la app, el **Volumen del timbre** y el modo **No molestar**.
- **Supresión de ruido con IA ligera (RNNoise) + Probador de micrófono**:
  - Activada por defecto en modo **Alta — RNNoise (recomendada)** usando `AudioWorklet` + WebAssembly (~1–2 % de un núcleo de CPU, frente al modelo pesado `full_NC` de Discord).
  - En **⚙️ Ajustes** puedes cambiar entre **Alta (RNNoise)**, **Estándar (Chromium)** y **Desactivada**, y usar el botón **🎙 Probar micrófono** con barra de nivel en vivo y opción *"Escucharme para comparar"*.

## 📦 Versión empaquetada para enviar a tus amigos
En la carpeta `dist/` tienes el paquete listo para compartir con tu novia o tus amigos (no necesitan instalar Node ni configurar nada):
- **`dist/EpicKast-Amigos-1.0.0-win64.zip`**: tus amigos solo descomprimen el `.zip` y abren **`EpicKast.exe`**.
- Para conectarse a tu servidor desde fuera de tu casa:
  1. Tú dejas corriendo [`Iniciar-Servidor.bat`](Iniciar-Servidor.bat) en tu PC.
  2. Usa **[Tailscale](https://tailscale.com)** (gratis, sin abrir puertos en el router) o comparte tu IP: tus amigos escriben `ws://TU-IP:7777` en el campo **Servidor** al iniciar sesión.

## 🛠️ Scripts de desarrollo y verificación
- `npm test`: prueba automatizada del servidor (usuarios, amigos, DMs, timbre de llamada, perfiles, servidores y canales).
- `electron tools/e2e-electron.js`: prueba E2E real con dos ventanas de Electron verificando login, avatares, timbre de llamada, audio con RNNoise, video de cámara por GPU `(HW)` y pantalla compartida.
- `npm run pack:friends`: genera el paquete `dist/EpicKast-Amigos-1.0.0-win64.zip` y endurece los Electron Fuses automáticamente.
- Detalles técnicos de optimización con REA: [`docs/OPTIMIZACION-REA.md`](docs/OPTIMIZACION-REA.md).
