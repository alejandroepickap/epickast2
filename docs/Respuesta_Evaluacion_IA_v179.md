# Análisis de Evaluación Externa y Correcciones Implementadas: EpicKast v1.7.9
**Fecha:** 4 de Noviembre de 2026  
**Documento Fuente:** *EpicKast v1.7.8 → v1.8 evaluación, Microsoft Store, recompensas y minijuegos*  
**Versión de Implementación:** v1.7.9  

---

## 1. Resumen de la Evaluación Externa
La evaluación externa realizada a partir de la auditoría técnica de EpicKast v1.7.8 aportó un análisis de alto valor, detectando riesgos potenciales para la publicación en Microsoft Store, señalando inconsistencias entre la arquitectura de cajas y llaves, y proponiendo un **Sistema de Recompensas v2** con validación probabilística y protección contra mala suerte (*pity system*).

Todas las observaciones pertinentes han sido analizadas y corregidas en la versión **v1.7.9**, estableciendo un puente sólido hacia la futura v1.8.0.

---

## 2. Matriz de Correcciones Implementadas en v1.7.9

| # | Hallazgo de la Evaluación | Acción Tomada en EpicKast v1.7.9 | Estado |
|---|---|---|---|
| **1** | **Persistencia de BBDD en Render:** Disco efímero borra usuarios y cosméticos en reinicios. | Se ampliaron las columnas de `users` en SQLite (`frame`, `title`) y se sincronizaron en `saveBackup()` y `restoreBackup()` hacia `server/seed.json` para persistir inventarios y cosméticos en cada despliegue. | ✅ Resuelto en v1.7.9 |
| **5** | **Subida de Archivos y Streaming:** Se recomendó evitar payloads pesados en WebSocket y validar tipos en servidor. | El servidor ya utilizaba streaming HTTP `POST /upload`. Se añadió **validación de Magic Bytes** (rechazo de binarios ejecutables Windows PE `MZ`) y bloqueo de `.svg` con `<script>` maliciosos. | ✅ Resuelto en v1.7.9 |
| **7** | **Cabeceras de Seguridad en Medios:** Se detectó redacción errónea sobre atributos `sandbox` en `<img>`. | Se añadió la cabecera HTTP estándar `X-Content-Type-Options: nosniff` a todas las descargas y previsualizaciones en `GET /files/:id`. | ✅ Resuelto en v1.7.9 |
| **8** | **Recompensas y Probabilidades:** Cajas decididas en cliente o sin configuración centralizada. | Se creó **`rewards.config.json`** como **única fuente de verdad** compartida por cliente, servidor y Guías. Sorteo regido por probabilidades exactas y auditadas. | ✅ Resuelto en v1.7.9 |
| **10** | **Normativa de Cajas de Botín en Store:** Transparencia y ausencia total de apuestas. | Confirmado: cero microtransacciones, todas las llaves se ganan jugando. Se incluyó la tabla pública de probabilidades en la Bóveda y en el Centro de Guías. | ✅ Resuelto en v1.7.9 |
| **11** | **Privacidad en Detección de Juegos:** Consentimiento explícito del usuario. | Se incluyó aviso visible de privacidad ("Sondeo pasivo local sin inyección DLL ni telemetría") y control de presencia en el perfil. | ✅ Resuelto en v1.7.9 |
| **14** | **Inconsistencia de 4 Llaves vs 3 Rarezas:** No coincidían los 4 tiers de cofres con el botín. | **Sistema de Recompensas v2 implementado:** 4 rarezas (**Común, Raro, Épico, Legendario**) alineadas 1:1 con las 4 llaves (**Cobre, Plata, Oro, Obsidiana**). | ✅ Resuelto en v1.7.9 |
| **15** | **Pruebas de RNG:** Falta de tests de simulación de probabilidades. | Creado `tools/test-rewards-rng.js`: **Simulación Monte Carlo de 100,000 aperturas** verificando convergencia estadística (±0.2%) y garantía infalible de piedad. | ✅ Resuelto en v1.7.9 |
| **Mod** | **Herramientas de Moderación (Exigencia Store):** Reportar y bloquear contenido de usuarios. | Se integró botón **🚩 Reportar mensaje** en cada mensaje del chat y botón **🚫 Bloquear / Silenciar usuario** en tarjetas de miembro con enmascaramiento automático de mensajes. | ✅ Resuelto en v1.7.9 |
| **A11y** | **Accesibilidad y Reducir Movimiento:** Evitar mareos o desorientación por giros de ruleta. | Soporte nativo para `@media (prefers-reduced-motion: reduce)` en CSS, atenuando animaciones intensas y saltando la ruleta para usuarios sensibles. | ✅ Resuelto en v1.7.9 |

---

## 3. Detalle Técnico del Sistema de Recompensas v2

### 3.1 Archivo Central: `rewards.config.json`
Todo el ecosistema de cosméticos, probabilidades y economía se alimenta de este archivo JSON unificado.

### 3.2 Probabilidades Exactas por Cofre
| Llave / Cofre | Común | Raro | Épico | Legendario |
|---|---|---|---|---|
| 🥉 **Cobre** | 80% | 17% | 3% | 0% |
| 🥈 **Plata** | 55% | 33% | 11% | 1% |
| 🥇 **Oro** | 25% | 45% | 25% | 5% |
| 💎 **Obsidiana** | 0% | 40% | 45% | 15% |

### 3.3 Sistema de Piedad Garantizada (*Pity System*)
- **Garantía de Épico:** Si el jugador abre 10 cajas consecutivas sin obtener Épico ni Legendario, la siguiente apertura garantiza un cosmético Épico o superior.
- **Piedad Suave Legendaria:** Desde la apertura 35 sin Legendario, la probabilidad aumenta progresivamente un **+1.5% por apertura**.
- **Piedad Dura Legendaria:** Si se alcanzan 60 aperturas sin Legendario, **la apertura número 60 garantiza un cosmético Legendario al 100%**.
- **Contador Visible en UI:** La Bóveda muestra en tiempo real: `🛡️ Piedad: X/60 aperturas sin Legendario`.

### 3.4 Polvo de Reliquia y Fabricación (*Crafting*)
Para erradicar la frustración de duplicados inútiles:
- Todo duplicado se recicla automáticamente en **Polvo de Reliquia**:
  - *Común:* +2 Polvo
  - *Raro:* +8 Polvo
  - *Épico:* +20 Polvo
  - *Legendario:* +50 Polvo
- Los cosméticos bloqueados del catálogo se pueden fabricar directamente acumulando polvo:
  - *Común:* 40 Polvo
  - *Raro:* 120 Polvo
  - *Épico:* 300 Polvo
  - *Legendario:* 800 Polvo

### 3.5 Canje de Monedas con Topes Diarios
Para darle utilidad a las monedas ganadas en la mazmorra sin devaluar las llaves:
- **Llave de Cobre:** 150 Monedas (Máximo 3 canjes diarios).
- **Llave de Plata:** 500 Monedas (Máximo 1 canje diario).
- Las llaves de Oro y Obsidiana solo se conquistan jugando la mazmorra.

### 3.6 Reserva Completa de Cosméticos (26 Objetos)
- **10 Comunes:** 5 colores de nombre (Ámbar Volcánico, Púrpura Amatista, Verde Esmeralda, Cian Neón, Rojo Magma) + 5 banners panorámicos de mazmorra.
- **7 Raros:** 3 marcos (Cobre Forjado, Plata Rúnica, Geoda Amatista) + 4 títulos de perfil ("Explorador del Núcleo", "Herrero de Magma", "Cazador de Sombras", "Pionero").
- **5 Épicos:** 2 colores degradados animados (Aurora Boreal, Fuego Volcánico) + 2 banners animados (Lava Fluida, Tormenta Rúnica) + 1 marco con partículas rúnicas.
- **4 Legendarios:** Marco Núcleo del Coloso, Banner Despertar del Gólem, Título resplandeciente "Coloso Caído" + Marco de Prestigio FUNDADOR (Edición 1).

---

## 4. Obtención Equilibrada en la Mazmorra
- **Piso 1:** 60% Cobre
- **Piso 2:** 80% Cobre, 10% Plata
- **Piso 3:** 100% Cobre, 25% Plata
- **Piso 4:** 60% Plata, 10% Oro
- **Piso 5 (Jefe Gólem):** 100% Plata, 30% Oro, 10% Obsidiana
- **Bono Semanal:** 1 Llave de Obsidiana garantizada en la primera victoria semanal contra el Gólem Coloso.
- **Tope Diario Anti-Abusos:** Máximo 20 llaves por día en mazmorra; superado el tope, los drops se convierten en monedas extra (+25 🪙) con aviso en pantalla.

---

## 5. Verificación Automatizada del Algoritmo (Monte Carlo)
Ejecución del test [`tools/test-rewards-rng.js`](file:///C:/Users/puma1/OneDrive/Documentos/Proyecto%20Comunicacion%20EpicKap/tools/test-rewards-rng.js):
```text
=== TEST DE SIMULACIÓN MONTE CARLO: SISTEMA DE RECOMPENSAS v2 ===
Temporada: 1 (Minas de Magma) | Total Cosméticos: 26

[1/3] Verificando distribución estadística base (100,000 aperturas por cofre)...
  Cofre [COFRE DE COBRE]:      Común: 79.89% (Δ 0.11%) | Raro: 17.02% | Épico: 3.09% | Leg: 0.00%  ✓ PASS
  Cofre [SAGRARIO DE PLATA]:   Común: 54.95% (Δ 0.05%) | Raro: 33.00% | Épico: 11.05% | Leg: 0.99% ✓ PASS
  Cofre [COFRE DE ORO]:        Común: 25.05% (Δ 0.05%) | Raro: 44.89% | Épico: 25.08% | Leg: 4.98% ✓ PASS
  Cofre [COFRE DE OBSIDIANA]:  Común: 0.00%  (Δ 0.00%) | Raro: 39.92% | Épico: 45.11% | Leg: 14.97%✓ PASS

[2/3] Verificando que la piedad dura de Legendario jamás falle en 2,000 rachas...
  ✓ Máximo de aperturas hasta Legendario observado: 57 / 60 (Cero fallos)

[3/3] Verificando garantía de Épico (<= 10 aperturas)...
  ✓ Máximo de aperturas hasta Épico/Legendario: 10 / 10 (Cero fallos)

✓✓✓ TODOS LOS TESTS DE RNG Y PIEDAD PASARON CON ÉXITO ✓✓✓
```

---

## 6. Distribución de Instaladores v1.7.9
- 🪟 **Instalador Oficial de Windows:** `instalador/EpicKast-Instalador.exe` y en `Escritorio` (98.9 MB)
- 🐧 **Paquete Universal Nativo para Linux:** `instalador/EpicKast-Linux-v1.7.9.tar.gz` y en `Escritorio` (106.5 MB)
