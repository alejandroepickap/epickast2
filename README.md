# EpicKast v1.7.3 🚀

Plataforma de comunicación personal y gaming de ultrabaja latencia, optimizada con técnicas de ingeniería inversa con **REA (`morluto/rea`)**.

Chat en tiempo real, canales de texto y voz comunitarios, videollamadas con aceleración por hardware (`MediaFoundation` + `D3D11`), compartición de pantalla, modo overlay transparente para juegos, sincronización de YouTube y música (EpicBot DJ), supresión de ruido neuronal con IA ultraligera (**RNNoise**), y el nuevo minijuego de acción multijugador **EpicStrike 2D** con ruleta de cajas estilo Counter-Strike.

---

## 🎮 Novedades de la Versión 1.7.3

- **EpicStrike 2D • Arena Co-op & Cajas CS**:
  - **Shooter 2D de acción con WASD + Mouse**: Controla a tu agente, apunta con la mira láser y dispara en tiempo real con Rifle de Asalto, Escopeta, Cañón de Plasma y Pistola.
  - **Construcción en combate**: Coloca torretas automáticas aliadas y muros de absorción durante la partida con `Espacio` o clic derecho.
  - **Cooperativo Multijugador Real**: Sincronización instantánea de movimiento, disparos y construcciones por WebSocket. ¡Incluye el botón **`🤖 +Bot Aliado`** para añadir bots inteligentes a tu escuadrón si juegas solo!
  - **Reinicio Garantizado y Economía Equilibrada**: Al caer en combate o terminar una ronda, el botón **Reiniciar** restablece tu salud al 100%, otorga **250⚡ de créditos iniciales garantizados**, limpia enemigos y te permite jugar inmediatamente sin trabas.
  - **Hordas y Jefe Titán Goliath**: 5 niveles con objetivos claros, barra de vida superior para el Jefe Colosal en el nivel 4 y hordas de elite.
- **Apertura de Cajas estilo Counter-Strike (CS Cases)**:
  - Ruleta horizontal auténtica con sonido mecánico de ticker (`tik-tik-tik... CLACK!`).
  - Drop rate auténtico de CS: Mil-Spec (79.9%), Restricted (15.9%), Classified (3.2%), Covert (0.64%) y **★ Especial Extraordinario (0.26% - Cuchillos Karambit / Mariposa Fade / Dragón Lore)**.
- **Actualizador VBScript 100% Silencioso**:
  - Reemplazo del script `.cmd` por un actualizador nativo en **VBScript (`wscript.exe`)**: cero terminales CMD parpadeando, cero bloqueos en tuberías de procesos y reinicio suave en segundo plano.
- **Intro Cinemática (Splash Screen)**:
  - Pantalla de bienvenida con pulso neón y sonido icónico sub-bass + acorde cristalino generado en tiempo real con Web Audio API (0 MB de descarga).

---

## ⚡ Atajos de Teclado

### Atajos Globales (Funcionan mientras juegas a pantalla completa)
| Atajo | Acción |
|---|---|
| **`Alt + O`** | Alternar **Modo Overlay Gamer** (superposición transparente sobre el juego). |
| **`Alt + P`** | Alternar **Modo Flotante (PiP)** de video sobre cualquier ventana. |
| **`Alt + S`** | Iniciar o detener la **compartición de pantalla**. |
| **`Alt + Q`** | **Colgar llamada** o abandonar el canal de voz rápidamente. |
| **`Alt + M`** | **Silenciar / Activar micrófono**. |
| **`Alt + D`** | **Ensordecer / Reactivar audio** de la aplicación. |

### Atajos de Navegación Dentro de la App
| Atajo | Acción |
|---|---|
| **`Ctrl + ,`** | Abrir el panel de **Ajustes y Configuración**. |
| **`Ctrl + 0`** | Ir a la pantalla de **Inicio / Mensajes Directos**. |
| **`Ctrl + 1` .. `Ctrl + 9`** | Cambiar directamente al servidor en esa posición. |
| **`Flecha Arriba (↑)`** | Si el campo de texto está vacío, **edita tu último mensaje** enviado. |
| **`Escape (Esc)`** | Cerrar ventanas modales, cancelar edición o cerrar visualizador. |

---

## 🌐 Conexión y Servidor en la Nube 24/7

- **URL WebSocket**: `wss://epickast-b9fd.onrender.com`
- **URL Web / Descargas**: `https://epickast-b9fd.onrender.com`

---

## 🛠️ Modos de Actualización

### 1. Actualización Automática Integrada (Recomendada)
Haz clic en **`[ 📥 Instalar actualización ]`** en el banner superior. La app se actualiza silenciosamente en segundo plano sin ventanas negras de CMD.

### 2. Actualización Manual (ZIP)
Descarga `EpicKast-v1.7.3-Manual.zip` y ejecuta **`1-Doble-Clic-Para-Actualizar.bat`**.
