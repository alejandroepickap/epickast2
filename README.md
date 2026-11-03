# EpicKast v1.7.1 🚀

Plataforma de comunicación personal y gaming de ultrabaja latencia, optimizada con técnicas de ingeniería inversa con **REA (`morluto/rea`)**.

Chat en tiempo real, canales de texto y voz comunitarios, videollamadas con aceleración por hardware (`MediaFoundation` + `D3D11`), compartición de pantalla, modo overlay transparente para juegos, sincronización de YouTube y música (EpicBot DJ), y supresión de ruido neuronal con IA ultraligera (**RNNoise**).

---

## 🎮 Novedades de la Versión 1.7.1

- **Actualizador Atómico Sin Bloqueos**:
  - Resuelto el conflicto de Electron (`Invalid package`) mediante el uso del módulo de bajo nivel `original-fs` y buffers temporales `.bin`.
  - Instalación bajo demanda en un solo clic desde el banner superior (`[📥 Instalar actualización]`), sin bucles de descarga ni consumo excesivo de red.
  - Paquete ZIP manual simplificado con `1-Doble-Clic-Para-Actualizar.bat` e instrucciones claras para evitar confusiones con el archivo `app.asar`.
- **Botón Modo Juego (Overlay)**:
  - Reparado el botón de juego en el panel dock inferior para activar o desactivar la superposición gamer al instante.
- **Indicador de Versión en Riel Lateral**:
  - Visualización discreta y permanente de la versión en ejecución (`v1.7.1`) al pie del selector de servidores.
- **Atajos de Teclado Globales y de Navegación**:
  - Control total sin salir de tu partida a pantalla completa (`Alt+O`, `Alt+P`, `Alt+S`, `Alt+Q`, `Alt+M`, `Alt+D`).
  - Navegación instantánea entre servidores (`Ctrl+0..9`), acceso rápido a ajustes (`Ctrl+,`) y edición de mensajes con `Flecha Arriba`.

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

EpicKast viene preconfigurado para conectarse automáticamente al servidor en la nube de producción:
- **URL WebSocket**: `wss://epickast-b9fd.onrender.com`
- **URL Web / Descargas**: `https://epickast-b9fd.onrender.com`

No necesitas abrir puertos ni configurar VPNs para hablar y jugar con tus amigos desde cualquier lugar del mundo.

---

## 🛠️ Modos de Actualización

### 1. Actualización Automática Integrada (Recomendada)
Cuando haya una nueva versión disponible, aparecerá un aviso discreto en la parte superior:
1. Haz clic en **`📥 Instalar actualización`**.
2. La app descargará la actualización de forma silenciosa.
3. Se reiniciará automáticamente en 1 segundo con la nueva versión aplicada.

### 2. Actualización Manual (ZIP)
Si prefieres actualizar sin conexión o de forma manual:
1. Haz clic en **`⬇ ZIP manual`** o descarga `EpicKast-v1.7.1-Manual.zip`.
2. Extrae el archivo ZIP en cualquier carpeta.
3. Haz doble clic en **`1-Doble-Clic-Para-Actualizar.bat`**.
*(Nota: No intentes abrir directamente el archivo `app.asar`, ya que es el paquete interno de la aplicación y Windows no lo abre como ejecutable).*

---

## 🔬 Optimización y Auditoría REA

EpicKast fue diseñado contrastando el rendimiento frente a clientes convencionales como Discord y Slack mediante el kit de ingeniería inversa **REA (`morluto/rea`)**:
- **Memoria RAM**: 75–115 MB (frente a 450–850 MB de Discord).
- **Consumo de CPU**: 2–6% en llamadas activas con RNNoise activado.
- **GPU MediaFoundation**: Aceleración nativa de hardware para codificación y decodificación de video H.264.
- Consulta el informe exhaustivo en [`docs/ARQUITECTURA-Y-ESTADO.md`](docs/ARQUITECTURA-Y-ESTADO.md) y [`docs/OPTIMIZACION-REA.md`](docs/OPTIMIZACION-REA.md).

---

## 💻 Desarrollo y Pruebas Locales

Si deseas ejecutar o modificar el proyecto en local:
- `npm start`: Inicia el cliente en modo desarrollo con Electron.
- `npm run server`: Inicia el servidor local en el puerto `7777`.
- `npm test`: Ejecuta los tests de integración del servidor (usuarios, canales, base de datos SQLite).
