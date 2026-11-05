const fs = require('fs');
const rendererPath = 'C:/Users/puma1/OneDrive/Documentos/Proyecto Comunicacion EpicKap/app/renderer.js';
let code = fs.readFileSync(rendererPath, 'utf8');

// --- 1. Definición global de dmKey (y corrección de dmK) ---
// Comprobar si dmKey está definida
if (!code.includes('function dmKey(') && !code.includes('const dmKey =')) {
  // Insertar dmKey justo antes de openChannel o en navegación
  const targetNav = '// ---------- navegación ----------';
  const dmKeyDef = 'const dmKey = (a, b) => `d${Math.min(a, b)}_${Math.max(a, b)}`;\n\n' + targetNav;
  code = code.replace(targetNav, dmKeyDef);
  console.log('1. Añadida definición de dmKey');
}

// En modalMemberCard, asegurar que no solo abre el canal sino que si no es amigo o el servidor no tiene canal creado, funcione correctamente
const oldDmCard = `  const btnDm = card.querySelector('#profBtnSendDm');
  if (btnDm) btnDm.onclick = () => {
    closeModal();
    const dmK = dmKey(S.me.id, m.id);
    goHome();
    openChannel(dmK, 'dm', m.name);
  };`;

const newDmCard = `  const btnDm = card.querySelector('#profBtnSendDm');
  if (btnDm) btnDm.onclick = () => {
    closeModal();
    const targetDmKey = (m.dm) ? m.dm : dmKey(S.me.id, m.id);
    goHome();
    openChannel(targetDmKey, 'dm', m.name);
  };`;

if (code.includes(oldDmCard)) {
  code = code.replace(oldDmCard, newDmCard);
  console.log('2. Corregido botón de mensaje directo en modalMemberCard');
} else {
  console.log('2. Advertencia: No se encontró oldDmCard exactamente');
}

// --- 2. Proporción de iconos en la Bóveda y Tienda (renderTabIco) ---
// Actualmente renderTabIco usa escala fija de 15, lo que hace iconos gigantescos de 240x240px en los botones
const oldRenderTabIco = `    const renderTabIco = (key) => {
      if (window.EKSprites && window.EKSprites.renderSpriteHtml) {
        return window.EKSprites.renderSpriteHtml(key, 15);
      }
      return '⭐';
    };`;

const newRenderTabIco = `    const renderTabIco = (key, scale = 1) => {
      if (window.EKSprites && window.EKSprites.renderSpriteHtml) {
        return window.EKSprites.renderSpriteHtml(key, scale);
      }
      return '⭐';
    };`;

if (code.includes(oldRenderTabIco)) {
  code = code.replace(oldRenderTabIco, newRenderTabIco);
  console.log('3. Corregida escala de renderTabIco de 15 a 1 (16x16px proporcional)');
}

// En la Bóveda, para los botones de las 4 llaves que tenían data-tier, renderTabIco(keySprite) debe ser escala 1.3
code = code.replace(
  "<span>${renderTabIco(keySprite)}</span>",
  "<span style=\"display:flex;align-items:center;justify-content:center;height:24px;\">${renderTabIco(keySprite, 1.2)}</span>"
);

// En la barra de recursos, iconos de monedas y esencia
code = code.replace(
  "${renderTabIco('coin')}",
  "${renderTabIco('coin', 1)}"
);
code = code.replace(
  "${renderTabIco('essence')}",
  "${renderTabIco('essence', 1)}"
);
code = code.replace(
  "${renderTabIco('pity_star')}",
  "${renderTabIco('pity_star', 1)}"
);
code = code.replace(
  "${renderTabIco('shop_cart')}",
  "${renderTabIco('shop_cart', 1)}"
);

// Y para las 4 llaves en posesión
code = code.replace("${renderTabIco('key_copper')}", "${renderTabIco('key_copper', 1)}");
code = code.replace("${renderTabIco('key_silver')}", "${renderTabIco('key_silver', 1)}");
code = code.replace("${renderTabIco('key_gold')}", "${renderTabIco('key_gold', 1)}");
code = code.replace("${renderTabIco('key_obsidian')}", "${renderTabIco('key_obsidian', 1)}");

// Y para los botones de pestañas
code = code.replace("${renderTabIco('tab_roulette')}", "${renderTabIco('tab_roulette', 1)}");
code = code.replace("${renderTabIco('tab_armory')}", "${renderTabIco('tab_armory', 1)}");
code = code.replace("${renderTabIco('tab_dojo')}", "${renderTabIco('tab_dojo', 1)}");
code = code.replace("${renderTabIco('tab_racer')}", "${renderTabIco('tab_racer', 1)}");
code = code.replace("${renderTabIco('tab_ninja')}", "${renderTabIco('tab_ninja', 1)}");

// Versión en la bóveda
code = code.replace("BÓVEDA DE RELIQUIAS · v${currentVer}", "BÓVEDA DE RELIQUIAS · v1.9.2");
code = code.replace("cfg.APP_VERSION || '1.9.1'", "cfg.APP_VERSION || '1.9.2'");

// --- 3. Paleta base de colores y consistencia de guardado ---
// Reducir la paleta base a 8 colores premium elegantes (menos saturados y perfectamente contrastados)
const oldPalette = "const PALETTE = ['#7c5cff', '#ff5d8f', '#ff9f43', '#2ed573', '#1e90ff', '#e056fd', '#00d2d3', '#ffa502', '#f59e0b', '#10b981', '#a855f7'];";
const newPalette = "const PALETTE = ['#7c5cff', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#ec4899', '#64748b'];";
if (code.includes(oldPalette)) {
  code = code.replace(oldPalette, newPalette);
  console.log('4. Paleta base optimizada a 8 colores balanceados');
}

// Al seleccionar un color de la paleta base en modalProfile, guardar también en localStorage('epickast.equipped_color')
// para que no sea pisado por el color anterior
const oldSwClick = "onclick: (e) => { color = c; pv.style.backgroundColor = c; sws.querySelectorAll('.sw').forEach((n) => n.classList.remove('sel')); e.target.classList.add('sel'); }";
const newSwClick = "onclick: (e) => { color = c; pv.style.backgroundColor = c; localStorage.setItem('epickast.equipped_color', c); sws.querySelectorAll('.sw').forEach((n) => n.classList.remove('sel')); e.target.classList.add('sel'); }";
if (code.includes(oldSwClick)) {
  code = code.replace(oldSwClick, newSwClick);
  console.log('5. Color base sincroniza de inmediato con localStorage');
}

// En el botón Guardar de modalProfile, asegurar que localStorage.setItem('epickast.equipped_color', color)
const oldSaveColor = "S.me.color = color;\n      localStorage.setItem('epickast.status', selectedStatus);";
const newSaveColor = "S.me.color = color;\n      localStorage.setItem('epickast.equipped_color', color);\n      localStorage.setItem('epickast.status', selectedStatus);";
if (code.includes(oldSaveColor)) {
  code = code.replace(oldSaveColor, newSaveColor);
  console.log('6. Botón Guardar de perfil persiste equipped_color');
}

// --- 4. Sistema de Sonidos Expandido en Ringer ---
// Añadir métodos especializados para mensajes privados, mensajes enviados y acciones del sistema
const oldRingerEnd = `  stop() { clearInterval(this.timer); this.timer = null; },
};`;

const newRingerEnd = `  playDm() {
    // Tono distintivo para mensajes directos privados (doble campana suave cristalina)
    this.beep([880, 1318], 0.055, 0.14);
  },
  playMsgSend() {
    // Sonido sutil al enviar mensaje con éxito (burbuja/pop táctil rápido)
    this.beep([520, 680], 0.035, 0.08);
  },
  playAction() {
    // Tono positivo para acciones completadas
    this.beep([600, 900], 0.04, 0.09);
  },
  stop() { clearInterval(this.timer); this.timer = null; },
};`;

if (code.includes(oldRingerEnd)) {
  code = code.replace(oldRingerEnd, newRingerEnd);
  console.log('7. Nuevos sonidos añadidos a ringer: playDm, playMsgSend, playAction');
}

// En onChatMsg, si es DM privado entrante, usar ringer.playDm()
const oldDmChatSound = `        if (settings.chatSound !== false) {
          ringer.beep([880, 1174], 0.04, 0.07);
        }`;

const newDmChatSound = `        if (settings.chatSound !== false) {
          if (isDm) {
            ringer.playDm();
          } else {
            ringer.beep([880, 1174], 0.04, 0.07);
          }
        }`;

if (code.includes(oldDmChatSound)) {
  code = code.replace(oldDmChatSound, newDmChatSound);
  console.log('8. Sonido especial playDm vinculado a mensajes privados entrantes');
}

// Al enviar un mensaje en el composer, ejecutar playMsgSend
const oldSubmitSend = "rpc('msg.send', { channel: S.chan, text: t, replyTo, mentions: mentionIds }).catch((er) => toast(er.message));";
const newSubmitSend = "rpc('msg.send', { channel: S.chan, text: t, replyTo, mentions: mentionIds }).then(() => { if (settings.chatSound !== false) ringer.playMsgSend(); }).catch((er) => toast(er.message));";
if (code.includes(oldSubmitSend)) {
  code = code.replace(oldSubmitSend, newSubmitSend);
  console.log('9. Sonido playMsgSend vinculado al envío de mensajes');
}

fs.writeFileSync(rendererPath, code);
console.log('renderer.js actualizado exitosamente');
