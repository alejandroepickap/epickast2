# EpicKast v1.7.2 🚀

Plataforma de comunicación personal y gaming de ultrabaja latencia, optimizada con técnicas de ingeniería inversa con **REA (`morluto/rea`)**.

Chat en tiempo real, canales de texto y voz comunitarios, videollamadas con aceleración por hardware (`MediaFoundation` + `D3D11`), compartición de pantalla, modo overlay transparente para juegos, sincronización de YouTube y música (EpicBot DJ), supresión de ruido neuronal con IA ultraligera (**RNNoise**), y minijuegos cooperativos con apertura de cajas estilo Counter-Strike.

---

## 🎮 Novedades de la Versión 1.7.2

- **Pantalla de Inicio Cinemática (Splash Screen)**:
  - Nueva animación de bienvenida al abrir la app con el logotipo iluminado de EpicKast.
  - **Sonido de inicio icónico**: Efecto de audio sintetizado en tiempo real con Web Audio API (impacto sub-bass + acorde cristalino de alta tecnología), sin cargar archivos pesados y con 0 ms de latencia.
- **Minijuego Multijugador: Cyber Squad Defense & Cajas CS**:
  - Minijuego cooperativo integrado para jugar con los amigos de la sala de voz o canal.
  - **Construcción en tiempo real**: Muros de absorción, Torretas Centinela, Torretas Tesla de ralentización, Cañones de Plasma de daño en área y Módulos de Créditos.
  - **Niveles y Objetivos**: Desde la Incursión Inicial hasta el Ciber-Titán Leviatán (Jefe con 3500 HP) y Modo Supervivencia Infinita.
  - Sincronización instantánea por WebSocket entre todos los miembros de la sala con consumo nulo de CPU al cerrar (<3 MB RAM).
- **Apertura de Cajas estilo Counter-Strike (CS Cases)**:
  - Sistema de ruleta horizontal con desaceleración física y sonido de ticker mecánico (`tik-tik-tik... CLACK!`).
  - Tabla de probabilidades auténtica: Común (Mil-Spec 79.9%), Raro (Restricted 15.9%), Épico (Classified 3.2%), Legendario (Covert 0.64%) y **★ Especial Extraordinario (0.26% - Cuchillos Karambit / Mariposa Fade / Dragón Lore)**.
  - Inventario de skins desbloqueadas con opción de equipar para personalizar tus defensas en la partida.
- **Validación del Auto-Actualizador Atómico**:
  - Preparado para verificar la descarga fluida y segura en un clic desde la versión 1.7.1 instalada.

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

---

## 🛠️ Modos de Actualización

### 1. Actualización Automática Integrada (Recomendada)
Cuando haya una nueva versión disponible, aparecerá un aviso en la parte superior:
1. Haz clic en **`📥 Instalar actualización`**.
2. La app descargará el paquete `.bin` de forma silenciosa.
3. Se reiniciará automáticamente en 1 segundo con la versión 1.7.2 aplicada.

### 2. Actualización Manual (ZIP)
1. Haz clic en **`⬇ ZIP manual`** o descarga `EpicKast-v1.7.2-Manual.zip`.
2. Extrae el archivo ZIP.
3. Haz doble clic en **`1-Doble-Clic-Para-Actualizar.bat`**.

---

## 🔬 Optimización REA
- Memoria RAM en reposo: 75–115 MB.
- CPU en llamada con RNNoise: 2–6%.
- Minijuego Canvas 2D: 0% CPU al estar cerrado.
