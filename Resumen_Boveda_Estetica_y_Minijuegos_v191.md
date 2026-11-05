# Resumen Completo de la Bóveda de Reliquias, Estética y Minijuegos — EpicKast v1.9.1

Documento generado automáticamente a partir de la fuente única de verdad: [`app/game-config.js`](app/game-config.js).
Complementado con los módulos de arquitectura:
- [`app/lifecycle.js`](app/lifecycle.js) — Ciclo de vida idempotente y gestión de memoria.
- [`app/sprites.js`](app/sprites.js) — Motor de renderizado vectorial de sprites pixel-art.
- [`app/card-game.js`](app/card-game.js) — Dojo Elemental (Card-Jitsu).
- [`app/racer-game.js`](app/racer-game.js) — Turbo Core (Carreras Synthwave).
- [`server/server.js`](server/server.js) — Validación de auditoría de economía y menciones.

---

## 1. Arquitectura de Estado y Memoria (EKLifecycle)

La versión v1.9.1 garantiza un ciclo de vida con **cero fugas de memoria** mediante `window.EKLifecycle`:
- **Tracking centralizado:** todos los `requestAnimationFrame`, `setInterval`, `setTimeout`, `addEventListener` (usando `AbortController`) y `AudioContext` quedan registrados en un scope.
- **Auto-Pausa reactiva:** al detectar `document.visibilityState === 'hidden'`, las instancias activas de minijuegos se pausan automáticamente, desplegando un overlay `"PAUSA"` y una cuenta regresiva de 3 segundos al volver a la pestaña.
- **Prevención de pérdida accidental:** si el usuario intenta cerrar la Bóveda, presionar `ESC` o cambiar de pestaña mientras un combate o carrera está activo, se solicita confirmación: `"¿Salir? Perderás esta partida (sin recompensas)"`.
- **Reclamo Idempotente:** bandera `rewardClaimed` en cada partida que previene duplicación de recompensas.

---

## 2. Catálogo Unificado de Cosméticos (33 Artículos)

Todos los cosméticos sincronizados con el servidor y compatibles con la interfaz de usuario:

| ID | Nombre | Tipo | Rareza | Fabricación | Esencia Duplicado | Descripción / Efecto |
|---|---|---|---|---|---|---|
| `founder_frame` | **★ Marco de Avatar FUNDADOR ★** | `frame` | **LEGENDARY** | 800 ✨ | +100 ✨ | Marco Azul Neón con insignia «FUNDADOR» para llamadas, chat y perfil (Prestigio Edición 1). |
| `frame_colossus_legend` | **Marco: Núcleo del Coloso** | `frame` | **LEGENDARY** | 800 ✨ | +100 ✨ | Doble halo dorado y cian con rotación continua forjado en el corazón del Coloso. |
| `banner_golem_animated` | **Banner: Despertar del Coloso** | `banner` | **LEGENDARY** | 800 ✨ | +100 ✨ | Estandarte legendario animado del Coloso de obsidiana despertando. |
| `title_colossus_slayer` | **Título: Coloso Caído** | `title` | **LEGENDARY** | 800 ✨ | +100 ✨ | Título resplandeciente reservado para quienes derriban al Coloso. |
| `plate_colossus` | **Placa: Fragua del Coloso** | `plate` | **LEGENDARY** | 800 ✨ | +100 ✨ | Placa de nombre legendaria del Set del Coloso con brasas incandescentes. |
| `fx_void` | **Efecto: Vórtice Abisal** | `fx` | **LEGENDARY** | 800 ✨ | +100 ✨ | Partículas gravitatorias doradas y violetas del vacío sobre tu tarjeta de perfil. |
| `frame_runic` | **Marco: Partículas Rúnicas** | `frame` | **EPIC** | 300 ✨ | +40 ✨ | Marco pulsante con chispas mágicas alrededor de tu avatar. |
| `color_aurora` | **Color: Aurora Boreal** | `color` | **EPIC** | 300 ✨ | +40 ✨ | Gradiente animado estilo aurora boreal para tu nombre. |
| `color_volcanic_flame` | **Color: Fuego Volcánico** | `color` | **EPIC** | 300 ✨ | +40 ✨ | Gradiente ardiente en movimiento continuo. |
| `banner_fluid_lava` | **Banner: Lava Fluida** | `banner` | **EPIC** | 300 ✨ | +40 ✨ | Banner animado con ondulación fluida de lava fundida. |
| `banner_rune_storm` | **Banner: Tormenta Rúnica** | `banner` | **EPIC** | 300 ✨ | +40 ✨ | Estandarte cósmico animado con rayos de energía púrpura. |
| `plate_runic_storm` | **Placa: Tormenta Rúnica** | `plate` | **EPIC** | 300 ✨ | +40 ✨ | Placa arcana con brillo animado recorriendo tu fila de miembro. |
| `fx_embers` | **Efecto: Brasas del Núcleo** | `fx` | **EPIC** | 300 ✨ | +40 ✨ | Chispas ascendentes de fuego elemental sobre tu tarjeta de perfil. |
| `frame_copper` | **Marco: Cobre Forjado** | `frame` | **RARE** | 120 ✨ | +15 ✨ | Bisel de cobre bruñido para tu avatar. |
| `frame_silver` | **Marco: Plata Rúnica** | `frame` | **RARE** | 120 ✨ | +15 ✨ | Bisel plateado brillante con runas grabadas. |
| `frame_amethyst` | **Marco: Geoda Amatista** | `frame` | **RARE** | 120 ✨ | +15 ✨ | Cristales de amatista facetados que rodean tu avatar. |
| `title_explorer` | **Título: Explorador del Núcleo** | `title` | **RARE** | 120 ✨ | +15 ✨ | Distintivo para quienes descienden a las profundidades. |
| `title_smith` | **Título: Herrero de Magma** | `title` | **RARE** | 120 ✨ | +15 ✨ | Insignia rúnica de maestro forjador de reliquias. |
| `title_shadow` | **Título: Cazador de Sombras** | `title` | **RARE** | 120 ✨ | +15 ✨ | Otorgado a quienes purgan las galerías oscuras. |
| `title_pioneer` | **Título: Pionero** | `title` | **RARE** | 120 ✨ | +15 ✨ | Título honorable para los primeros aventureros. |
| `plate_glacier` | **Placa: Ventisca Glaciar** | `plate` | **RARE** | 120 ✨ | +15 ✨ | Placa cristalina con destellos helados detrás de tu nombre. |
| `fx_snow` | **Efecto: Cristales de Escarcha** | `fx` | **RARE** | 120 ✨ | +15 ✨ | Capa de copos y cristales helados flotando sobre tu tarjeta de perfil. |
| `color_amber` | **Color: Ámbar Volcánico** | `color` | **COMMON** | 40 ✨ | +5 ✨ | Tinte ígneo de magma ardiente para tu nombre y perfil. |
| `color_amethyst` | **Color: Púrpura Amatista** | `color` | **COMMON** | 40 ✨ | +5 ✨ | Resplandor amatista para tu nombre en la lista de miembros. |
| `color_emerald` | **Color: Verde Esmeralda** | `color` | **COMMON** | 40 ✨ | +5 ✨ | Tinte resplandeciente esmeralda del Núcleo. |
| `color_cyan` | **Color: Cian Neón** | `color` | **COMMON** | 40 ✨ | +5 ✨ | Destello ciberpunk cian brillante para tu nombre. |
| `color_crimson` | **Color: Rojo Magma** | `color` | **COMMON** | 40 ✨ | +5 ✨ | Tono carmesí ardiente de roca fundida. |
| `banner_mines` | **Banner: Minas de Magma** | `banner` | **COMMON** | 40 ✨ | +5 ✨ | Estandarte de magma y basalto para tu tarjeta de perfil. |
| `banner_amethyst` | **Banner: Galerías de Amatista** | `banner` | **COMMON** | 40 ✨ | +5 ✨ | Estandarte de geodas púrpuras brillantes para tu tarjeta de perfil. |
| `banner_crypt` | **Banner: Cripta Ancestral** | `banner` | **COMMON** | 40 ✨ | +5 ✨ | Muros de piedra antigua y niebla espectral. |
| `banner_bridges` | **Banner: Puentes de Lava** | `banner` | **COMMON** | 40 ✨ | +5 ✨ | Puentes de piedra sobre el abismo volcánico. |
| `banner_sanctum` | **Banner: Sagrario del Núcleo** | `banner` | **COMMON** | 40 ✨ | +5 ✨ | Santuario central de obsidiana del Núcleo. |
| `plate_copper_forge` | **Placa: Forja de Cobre** | `plate` | **COMMON** | 40 ✨ | +5 ✨ | Franja metálica de cobre templado detrás de tu nombre en miembros y mensajes directos. |

---

## 3. Cofres, Llaves y Sistema de Sintonía

| Nivel de Cofre | Precio Llave | Común | Raro | Épico | Legendario | Garantías Especiales |
|---|---|---|---|---|---|---|
| **Cofre de Cobre** | 250 🪙 | 80% | 17% | 3% | 0% | Sin legendarios ni acumulación de sintonía |
| **Cofre de Plata** | 1,000 🪙 | 55% | 33% | 11% | 1% | Acumula sintonía suave (35+) y hard pity (60) |
| **Cofre de Oro** | 4,000 🪙 | 25% | 45% | 25% | 5% | Acumula sintonía suave (35+) y hard pity (60) |
| **Cofre de Obsidiana** | 15,000 🪙 | 0% | 40% | 45% | 15% | Acumula sintonía suave (35+) y hard pity (60) |

### Reglas de Sintonía (Protección Anti-Mala Suerte)
- **Garantía Épica (10 tiradas):** si se acumulan 9 aperturas sin Épico ni Legendario, la tirada 10 es garantizada de calidad Épica o superior.
- **Sintonía Suave Legendaria (35+ tiradas):** a partir de la apertura 35 sin Legendario en cofres Plata, Oro u Obsidiana, la probabilidad aumenta progresivamente un **+1.5%** por apertura.
- **Sintonía Garantizada Legendaria (60 tiradas):** al alcanzar la apertura 59 sin Legendario, la apertura 60 tiene probabilidad **100% asegurada** de otorgar un Legendario.
- **Ruleta Honesta:** la ruleta visual genera únicamente cartas permitidas por las probabilidades nominales del cofre seleccionado (en Cobre no aparecen cartas Legendarias en el strip).

---

## 4. Progresión del Dojo Elemental (Card-Jitsu)

| Piso | Guardián | Cinturón Rival | Lore Épico | Recompensa 1ª Conquista | Entrenamiento Posterior |
|---|---|---|---|---|---|
| **Piso 1** | **Novicio Ignis** | Cinturón Blanco | *Aprendiz de la llama eterna que prueba el temple de todo iniciado.* | +60 🪙 + 1 Llave Cobre | +30 🪙 (25% Llave Cobre) |
| **Piso 2** | **Centinela Escarcha** | Cinturón Azul | *Vigilante de los picos helados; su mente es fría como el glaciar.* | +100 🪙 + 1 Llave Cobre | +50 🪙 (25% Llave Cobre) |
| **Piso 3** | **Maestro Torrente** | Cinturón Rojo | *Señor de las mareas abisales que anticipa cada carta de tu mano.* | +150 🪙 + 1 Llave Plata | +75 🪙 (25% Llave Cobre) |
| **Piso 4** | **Coloso de Basalto** | Cinturón Negro | *Titán viviente forjado en magma; solo los cinturones negros pasan.* | +220 🪙 + 1 Llave Oro | +110 🪙 (25% Llave Cobre) |
| **Piso 5** | **Sensei del Núcleo** | Cinturón Dorado Supremo | *Gran Maestro de los tres elementos y custodio de la Obsidiana.* | +500 🪙 + 1 Llave Obsidiana | +250 🪙 (25% Llave Cobre) |

### Cinturones de Maestría Ninja
| Nivel | Cinturón | Requisito de Desbloqueo |
|---|---|---|
| **WHITE** | **Cinturón Blanco** (#f8fafc) | Superar Piso undefined del Dojo |
| **YELLOW** | **Cinturón Amarillo** (#facc15) | Superar Piso undefined del Dojo |
| **BLUE** | **Cinturón Azul** (#3b82f6) | Superar Piso undefined del Dojo |
| **RED** | **Cinturón Rojo** (#ef4444) | Superar Piso undefined del Dojo |
| **BLACK** | **Cinturón Negro** (#1e293b) | Superar Piso undefined del Dojo |
| **GOLD** | **Cinturón Dorado** (#fbbf24) | Superar Piso undefined del Dojo |

---

## 5. Circuitos y Mejoras de Turbo Core (Carreras Arcade)

| Circuito | Nombre | Dificultad | Vueltas | Recompensa 1ª Conquista |
|---|---|---|---|---|
| **Circuito 1** | **Autopista Ciber-Neón** | FÁCIL | 2 | +75 🪙 + 1 Llave Cobre |
| **Circuito 2** | **Desfiladero de Magma** | MEDIA | 2 | +120 🪙 + 1 Llave Plata |
| **Circuito 3** | **Cumbre Glaciar Cero** | DIFÍCIL | 3 | +180 🪙 + 1 Llave Oro |
| **Circuito 4** | **Santuario del Coloso** | EXPERTO | 3 | +300 🪙 + 1 Llave Obsidiana |

### Taller de Ingeniería del Núcleo
| Sistema | Descripción | Niveles | Coste Base |
|---|---|---|---|
| **Motor Iónico** | Aumenta la velocidad máxima y aceleración punta | 1 a 5 (MAX) | 200 🪙 (+150 🪙/nivel) |
| **Inyector Nitro** | Mayor empuje y recarga acelerada del turbo | 1 a 5 (MAX) | 250 🪙 (+200 🪙/nivel) |
| **Escudo Magnético** | Mayor radio de atracción de monedas del circuito | 1 a 5 (MAX) | 150 🪙 (+100 🪙/nivel) |

---

## 6. Sets y Coleccionismo Especial

### Set del Coloso (4/4)
Conjunto temático Legendario que conmemora la victoria definitiva sobre las profundidades:
1. **Marco:** `frame_colossus_legend` (Núcleo del Coloso)
2. **Banner:** `banner_colossus_awakening` (Despertar del Coloso)
3. **Título:** `title_colossus_slayer` (Coloso Caído)
4. **Placa de Nombre:** `plate_colossus` (Placa del Coloso)

*Recompensa de Set:* Título e insignia honorífica **«⚡ Conquistador del Coloso»** activa en el perfil.

---

## 7. Menciones con @ y Seguridad Anti-XSS

- **Formato de Token Seguro:** `<span class="mention" data-uid="ID">@Nombre</span>`
- **Escapado Preventivo:** el texto del usuario se sanea estrictamente antes de interpretar las menciones fuera de bloques de código (``` o `).
- **Resaltado Visual:** mensajes donde el usuario es mencionado reciben `border-left: 3px solid #facc15` y fondo dorado translúcido `rgba(250,204,21,.06)`.
- **Alertas Sonoras:** aviso Web Audio chime (`[659, 880, 1046]`) y notificación de escritorio nativa cuando la app no está enfocada.
