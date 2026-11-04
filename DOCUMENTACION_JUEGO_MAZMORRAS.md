# 🛡️ Documentación del Minijuego: Dungeons of the Core (Mazmorras)
**Archivo respaldado:** `app/dungeons-game-backup.js`  
**Estado:** Respaldado y preservado para uso futuro o modo alternativo.  
**Versión de origen:** v1.8.0

---

## 1. Resumen y Propósito
`CyberDefenseGame` es un minijuego de mazmorras roguelite en 2D ejecutado en HTML5 Canvas con perspectiva cenital (top-down). Desarrollado para EpicKast, permite a los usuarios jugar en solitario o cooperativo con amigos mediante WebSockets.

---

## 2. Estructura de Pisos y Mecánicas
* **Piso 1: Minas de Magma** — Enemigos: Minero Zombi y Murciélagos de Lava.
* **Piso 2: Galerías de Amatista** — Trampas de cristales y Espectros Rúnicos.
* **Piso 3: Puentes de Lava** — Plataformas estrechas con Gólems menores.
* **Piso 4: Cripta de Basalto** — Jefes de élite y guardianes armados.
* **Piso 5: Sagrario del Gólem** — Jefe final: Gólem de Obsidiana con múltiples fases de combate.

---

## 3. Armas y Sistema de Combate
* **Espada de Melee (Clic Izquierdo / Espacio):** Empuje en arco corto de 180° y daño físico.
* **Ballesta Rúnica (Clic Derecho / Tecla E):** Proyectiles a distancia con rebote en paredes.
* **Sistema de Iman de Botín:** Atracción automática de monedas y orbes de curación al aproximarse.

---

## 4. Recompensas Generadas
* **Piso 1:** 35 Monedas + 1 Llave de Cobre
* **Piso 2:** 65 Monedas + 1 Llave de Cobre + 1 Llave de Plata
* **Piso 3:** 110 Monedas + 1 Llave de Plata + 1 Llave de Oro
* **Piso 4:** 180 Monedas + 1 Llave de Oro + 1 Llave de Obsidiana
* **Piso 5:** 300 Monedas + 2 Llaves de Obsidiana

---

## 5. Instrucciones de Reactivación
Para reactivar este minijuego en el futuro:
1. Copiar `app/dungeons-game-backup.js` de nuevo a `app/game.js` o invocarlo como selector en la Bóveda.
2. La clase exportada es `window.CyberDefenseGame(container, ws, channel, user, options)`.
