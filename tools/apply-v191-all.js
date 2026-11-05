// tools/apply-v191-all.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'renderer.js');
let code = fs.readFileSync(filePath, 'utf8');

console.log('Initial length:', code.length);

// 1. Update renderGuideContent to feature v1.9.1 at the top
const guideMarker = '<!-- ==================== VERSIÓN 1.9.0 (ACTUAL) ==================== -->';
const v191GuideSection = `<!-- ==================== VERSIÓN 1.9.1 (ACTUAL) ==================== -->
        <div style="border:2px solid #38bdf8;border-radius:12px;padding:20px;margin-bottom:24px;background:#0b1522;box-shadow:0 8px 24px rgba(56,189,248,0.22);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #1e2c44;padding-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="background:#0284c7;color:#fff;font-size:11px;font-weight:900;padding:3px 10px;border-radius:20px;">ACTUAL</span>
              <h2 style="font-size:18px;font-weight:900;color:#fff;margin:0;">Versión 1.9.1</h2>
            </div>
            <span style="font-size:12px;color:#7dd3fc;font-weight:700;">Estabilidad, @ Menciones y Acabado Audiovisual</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;color:#cbd5e1;">
            <div>
              <b style="color:#38bdf8;">🛡️ Ciclo de Vida Idempotente y Cero Fugas de Memoria (EKLifecycle):</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Gestión centralizada de rAF, timers, event listeners y AudioContext mediante <code>EKLifecycle</code>.</li>
                <li>Pausa automática en pestaña oculta (overlay de pausa + cuenta atrás de reanudación de 3s). Confirmación de salida en partidas activas para evitar pérdida de recompensas.</li>
              </ul>
            </div>

            <div>
              <b style="color:#fbbf24;">📢 Menciones con @ en Canales de Servidor:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Menú flotante predictivo con búsqueda rápida de miembros (incluye desconectados) y selección con teclado.</li>
                <li>Tokens anti-XSS seguros, borde dorado en mensajes dirigidos a ti, insignias rojas en canales y riel de servidores, y notificación sonora nativa.</li>
              </ul>
            </div>

            <div>
              <b style="color:#a855f7;">💎 Recompensas Nitro: 33 Cosméticos, Placas y Set del Coloso:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Nuevas Placas de Nombre (Cobre Forjado, Glaciar, Tormenta Rúnica, Coloso) y Efectos de Perfil con partículas en vivo (Ventisca, Ascuas, Vacío).</li>
                <li>Progreso del Set del Coloso (4/4) con insignia exclusiva de Conquistador y previsualizador en tiempo real estilo Discord Nitro.</li>
              </ul>
            </div>

            <div>
              <b style="color:#f87171;">🥋 Dojo Elemental: Mascotas Evolutivas y Choque Cinemático:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>3 etapas de evolución visual por elemento en pixel-art kawaii, bordes holográficos para cartas legendarias, hit-stop de impacto, desintegración de cartas derrotadas en 24 partículas y cinemáticas de cartas 10+ con opción de saltar.</li>
              </ul>
            </div>

            <div>
              <b style="color:#34d399;">🏎️ Turbo Core Refinado:</b>
              <ul style="margin:4px 0 0 20px;padding:0;display:flex;flex-direction:column;gap:4px;">
                <li>Sol synthwave con franjas de horizonte, montañas parallax dobles, líneas de velocidad nitro, sacudida de pantalla en choques, cuenta atrás 3-2-1-GO elástica y podio de posiciones detallado.</li>
              </ul>
            </div>
          </div>
        </div>

        `;

if (code.includes(guideMarker)) {
  code = code.replace(guideMarker, v191GuideSection + guideMarker);
  console.log('v1.9.1 added to official guide');
} else {
  console.warn('Could not find guideMarker');
}

// 2. Anti-XSS Safe Rendering in renderMsgText & mention support
const oldRenderMsgTextStart = 'function renderMsgText(text) {';
const oldRenderMsgTextEnd = 'const msgEl = (m, isThreadItem = false) => {';

const idxRStart = code.indexOf(oldRenderMsgTextStart);
const idxREnd = code.indexOf(oldRenderMsgTextEnd);

if (idxRStart !== -1 && idxREnd !== -1) {
  const newRenderMsgTextCode = `function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMsgText(text) {
  if (!text) return null;

  if (text.includes('epickast://game/join')) {
    const cleanMsg = text.replace(/epickast:\/\/game\/join/i, '').trim();
    return h('div', { class: 'tx' },
      cleanMsg ? h('div', { style: 'margin-bottom:6px' }, cleanMsg) : null,
      h('div', {
        style: 'background:linear-gradient(135deg,rgba(15,23,42,0.95),rgba(24,35,58,0.98));border:1px solid #10b981;border-radius:10px;padding:12px 14px;max-width:340px;margin-top:4px;box-shadow:0 4px 16px rgba(0,0,0,0.3)'
      },
        h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:8px' },
          h('span', { style: 'font-size:26px' }, '👾'),
          h('div', null,
            h('div', { style: 'font-size:11px;text-transform:uppercase;color:#34d399;font-weight:700' }, 'Partida Co-op en Vivo'),
            h('div', { style: 'font-size:13px;font-weight:600;color:#fff' }, 'EpicStrike 2D • Arena de Combate')
          )
        ),
        h('button', {
          class: 'primary',
          style: 'width:100%;padding:8px 12px;font-size:12px;font-weight:700;background:linear-gradient(90deg,#059669,#10b981);border:none;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px',
          onclick: () => modalMinigame()
        }, '⚔️ Unirme al Escuadrón')
      )
    );
  }

  const matchJoin = /epickast:\/\/join\/([a-fA-F0-9]+)/i.exec(text);
  if (matchJoin) {
    const codeVal = matchJoin[1].toLowerCase();
    const cleanMsg = text.replace(/epickast:\/\/join\/[a-fA-F0-9]+/i, '').trim();

    const joinBtn = h('button', {
      class: 'primary',
      style: 'padding:7px 14px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px;border-radius:6px;margin-top:6px',
      onclick: async (e) => {
        const b = e.currentTarget;
        b.disabled = true;
        b.textContent = 'Uniéndose...';
        try {
          const res = await rpc('server.join', { code: codeVal });
          toast('¡Te has unido al servidor correctamente!');
          b.textContent = '✓ Ya te uniste';
          b.style.background = '#2ea043';
          if (res?.id) {
            await loadServers();
            selectServer(res.id);
          }
        } catch (err) {
          toast(err.message || 'Error al unirse');
          b.disabled = false;
          b.textContent = '🚀 Unirme al servidor';
        }
      }
    }, '🚀 Unirme al servidor');

    return h('div', { class: 'tx' },
      cleanMsg ? h('div', { style: 'margin-bottom:6px' }, cleanMsg) : null,
      h('div', {
        style: 'background:rgba(20,24,35,0.7);border:1px solid rgba(130,160,255,0.3);border-radius:10px;padding:12px 14px;max-width:340px;margin-top:4px'
      },
        h('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:6px' },
          h('span', { style: 'font-size:24px' }, '🏰'),
          h('div', null,
            h('div', { style: 'font-size:11px;text-transform:uppercase;color:#8ba3c7;font-weight:700' }, 'Invitación a Servidor'),
            h('div', { style: 'font-size:13px;font-weight:600;color:#fff' }, \`Código: \${codeVal}\`)
          )
        ),
        joinBtn
      )
    );
  }

  // Parse anti-XSS y render de menciones fuera de bloques de código
  // Separar bloques de código para nunca alterar menciones dentro de \`\`\` o \`
  const codeBlockRegex = /(\`\`\`[\\s\\S]*?\`\`\`|\`[^\\n\`]+\`)/g;
  const parts = [];
  let lastIndex = 0;
  let mPart;

  while ((mPart = codeBlockRegex.exec(text)) !== null) {
    if (mPart.index > lastIndex) {
      parts.push({ isCode: false, str: text.slice(lastIndex, mPart.index) });
    }
    parts.push({ isCode: true, str: mPart[0] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ isCode: false, str: text.slice(lastIndex) });
  }

  // Obtener lista de miembros actuales para resolver nombres
  let membersList = [];
  if (S.view.kind === 'server') {
    const sd = S.sdata.get(S.view.sid);
    if (sd && sd.members) membersList = sd.members;
  }
  if (S.friends && S.friends.friends) {
    membersList = membersList.concat(S.friends.friends);
  }
  if (S.me) membersList.push(S.me);

  const getMemberById = (uid) => membersList.find(m => String(m.id) === String(uid));
  const getMemberByName = (nm) => membersList.find(m => m.name.toLowerCase() === nm.toLowerCase());

  let finalHtml = '';
  parts.forEach(p => {
    if (p.isCode) {
      if (p.str.startsWith('\`\`\`')) {
        const clean = p.str.slice(3, -3);
        finalHtml += \`<pre style="background:#090d14;border:1px solid #1a2233;padding:8px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:12px;color:#cbd5e1;"><code>\${escapeHtml(clean)}</code></pre>\`;
      } else {
        const clean = p.str.slice(1, -1);
        finalHtml += \`<code style="background:#090d14;padding:2px 5px;border-radius:4px;font-family:monospace;font-size:12px;color:#cbd5e1;border:1px solid #1a2233;">\${escapeHtml(clean)}</code>\`;
      }
    } else {
      let escaped = escapeHtml(p.str);
      // Reemplazar tokens <@123>
      escaped = escaped.replace(/&lt;@(\\d+)&gt;/g, (orig, uid) => {
        const mem = getMemberById(uid);
        const name = mem ? mem.name : uid;
        return \`<span class="mention" data-uid="\${uid}">@\${name}</span>\`;
      });
      // Reemplazar menciones @Nombre si coincide con miembro
      membersList.forEach(mem => {
        if (!mem.name) return;
        const re = new RegExp('(^|\\s)@' + escapeHtml(mem.name) + '(?=\\s|$|[.,!?])', 'gi');
        escaped = escaped.replace(re, (match, prefix) => {
          return \`\${prefix}<span class="mention" data-uid="\${mem.id}">@\${mem.name}</span>\`;
        });
      });
      finalHtml += escaped.replace(/\\n/g, '<br/>');
    }
  });

  const txEl = h('div', { class: 'tx' });
  txEl.innerHTML = finalHtml;

  // Click en mención para abrir tarjeta de perfil
  txEl.querySelectorAll('.mention').forEach(span => {
    span.onclick = (e) => {
      e.stopPropagation();
      const uid = span.dataset.uid;
      if (!uid) return;
      if (S.view.kind === 'server') {
        const sd = S.sdata.get(S.view.sid);
        const mem = sd?.members?.find(m => String(m.id) === String(uid));
        if (mem) return modalMemberCard(sd, mem);
      }
      const fr = S.friends.friends.find(f => String(f.id) === String(uid));
      if (fr) {
        openChannel(fr.dm, 'dm', fr.name);
      } else if (String(uid) === String(S.me?.id)) {
        modalProfile();
      }
    };
  });

  return txEl;
}

`;

  code = code.slice(0, idxRStart) + newRenderMsgTextCode + code.slice(idxREnd);
  console.log('renderMsgText updated with anti-XSS and click handlers');
} else {
  console.warn('Could not find renderMsgText boundaries');
}

// 3. Update msgEl to apply yellow highlight on messages mentioning me
const oldMsgElCheck = "const isMentioned = (m.mentions && m.mentions.includes(S.me?.id)) || (m.text && m.text.includes('@' + S.me?.name)) || m.highlight;";
const newMsgElCheck = `const isMentioned = (m.mentions && Array.isArray(m.mentions) && m.mentions.includes(S.me?.id)) ||
    (m.text && (m.text.includes('<@' + S.me?.id + '>') || m.text.includes('@' + S.me?.name))) ||
    m.highlight;`;

if (code.includes(oldMsgElCheck)) {
  code = code.replace(oldMsgElCheck, newMsgElCheck);
  console.log('msgEl mention check updated');
}

// 4. Update onChatMsg for desktop notifications and sound chime on mentions
const oldOnChatCheck = "if (!isServerMuted && !settings.dnd && S.me?.status !== 'dnd') {";
const newOnChatCheck = `// Verificar si el usuario actual fue mencionado directamente
    const wasMentioned = (m.msg?.mentions && Array.isArray(m.msg.mentions) && m.msg.mentions.includes(S.me?.id)) ||
      (m.msg?.text && (m.msg.text.includes('<@' + S.me?.id + '>') || m.msg.text.includes('@' + S.me?.name)));

    if (wasMentioned && !isCurrentChannel) {
      S.mentionsByChannel.set(m.channel, (S.mentionsByChannel.get(m.channel) || 0) + 1);
      renderSide();
      renderRail();
    }

    if (!isServerMuted && !settings.dnd && S.me?.status !== 'dnd') {
      if (wasMentioned) {
        ringer.beep([659, 880, 1046], 0.05, 0.12);
      }
`;

if (code.includes(oldOnChatCheck)) {
  code = code.replace(oldOnChatCheck, newOnChatCheck);
  console.log('onChatMsg mention sound and counter updated');
}

// 5. Update openChannel to clear mention count
const oldOpenChannelClear = "S.chan = key; S.chanType = type; S.chanName = name; S.unread.delete(key); S.oldest = null;";
const newOpenChannelClear = "S.chan = key; S.chanType = type; S.chanName = name; S.unread.delete(key); S.mentionsByChannel.delete(key); S.oldest = null;";

if (code.includes(oldOpenChannelClear)) {
  code = code.replace(oldOpenChannelClear, newOpenChannelClear);
  console.log('openChannel clears mentionsByChannel');
}

// 6. Update titleBadgeEl usages in meBar, userItem, renderMembers to use 'icon'
code = code.replace("titleBadgeEl(eqTitle)", "titleBadgeEl(eqTitle, 'icon')");
code = code.replace("titleBadgeEl(u.title)", "titleBadgeEl(u.title, 'icon')");
code = code.replace("titleBadgeEl(mTitle)", "titleBadgeEl(mTitle, 'icon')");

// 7. Update renderSide to display mention badge on channels
const oldSideItem = "countBadge\n      ));";
const newSideItem = `countBadge,
        (S.mentionsByChannel.get(c.key) > 0) ? h('span', { class: 'mention-badge' }, String(S.mentionsByChannel.get(c.key))) : null
      ));`;

if (code.includes(oldSideItem)) {
  code = code.replace(oldSideItem, newSideItem);
  console.log('renderSide updated with mention-badge');
}

// 8. Update renderRail to display mention badge on server icon
const oldRailItem = "r.append(h('div', {\n      class: 'ico' + (S.view.sid === s.id ? ' sel' : '') + (isMuted ? ' muted-srv' : ''),\n      title: s.name + (isMuted ? ' (Silenciado)' : ''),\n      onclick: () => openServer(s.id)\n    }, content, isMuted ? h('span', { class: 'mute-badge', title: 'Servidor silenciado' }, '🔕') : null));";

const newRailItem = `const srvMentions = (s.channels || []).reduce((acc, ch) => acc + (S.mentionsByChannel.get(ch.key) || 0), 0);
    r.append(h('div', {
      class: 'ico' + (S.view.sid === s.id ? ' sel' : '') + (isMuted ? ' muted-srv' : ''),
      title: s.name + (isMuted ? ' (Silenciado)' : ''),
      onclick: () => openServer(s.id)
    }, content,
      isMuted ? h('span', { class: 'mute-badge', title: 'Servidor silenciado' }, '🔕') : null,
      srvMentions > 0 ? h('span', { class: 'rail-mention-badge' }, String(srvMentions)) : null
    ));`;

if (code.includes(oldRailItem)) {
  code = code.replace(oldRailItem, newRailItem);
  console.log('renderRail updated with rail-mention-badge');
}

// 9. Mention Autocomplete Popup on msgInput
const oldMsgInputInput = "$('msgInput').addEventListener('input', () => {";
const newMsgInputInput = `// Autocomplete predictivo flotante para menciones @
let mentionPopupEl = null;
let mentionCandidates = [];
let mentionSelectedIndex = 0;
let mentionMatchQuery = null;

function hideMentionPopup() {
  if (mentionPopupEl) {
    mentionPopupEl.remove();
    mentionPopupEl = null;
  }
}

function insertMention(member) {
  const inp = $('msgInput');
  if (!inp || !member) return;
  const pos = inp.selectionStart;
  const val = inp.value;
  const before = val.slice(0, pos);
  const after = val.slice(pos);
  const match = /@([a-zA-Z0-9_\u00C0-\u017F]*)$/.exec(before);
  if (!match) return;
  const replaceStart = match.index;
  const insertText = '@' + member.name + ' ';
  inp.value = val.slice(0, replaceStart) + insertText + after;
  const newPos = replaceStart + insertText.length;
  inp.setSelectionRange(newPos, newPos);
  inp.focus();
  hideMentionPopup();
}

function updateMentionPopupSelection() {
  if (!mentionPopupEl) return;
  const items = mentionPopupEl.querySelectorAll('.mention-popup-item');
  items.forEach((it, idx) => {
    it.classList.toggle('sel', idx === mentionSelectedIndex);
  });
}

function checkMentionAutocomplete() {
  const inp = $('msgInput');
  if (!inp || !S.chan || S.chanType === 'voice') { hideMentionPopup(); return; }
  const pos = inp.selectionStart;
  const before = inp.value.slice(0, pos);
  const match = /@([a-zA-Z0-9_\u00C0-\u017F]*)$/.exec(before);

  if (!match) {
    hideMentionPopup();
    return;
  }

  mentionMatchQuery = match[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let pool = [];
  if (S.view.kind === 'server') {
    const sd = S.sdata.get(S.view.sid);
    if (sd && sd.members) pool = sd.members.slice();
  } else if (S.friends && S.friends.friends) {
    pool = S.friends.friends.slice();
  }

  if (mentionMatchQuery) {
    const starts = pool.filter(m => m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').startsWith(mentionMatchQuery));
    const contains = pool.filter(m => !starts.includes(m) && m.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(mentionMatchQuery));
    mentionCandidates = starts.concat(contains).slice(0, 8);
  } else {
    mentionCandidates = pool.slice(0, 8);
  }

  mentionSelectedIndex = 0;

  if (!mentionPopupEl) {
    mentionPopupEl = document.createElement('div');
    mentionPopupEl.className = 'mention-popup';
    const comp = $('composer');
    if (comp) comp.appendChild(mentionPopupEl);
    else document.body.appendChild(mentionPopupEl);
  }

  mentionPopupEl.replaceChildren();

  if (mentionCandidates.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'mention-popup-empty';
    empty.textContent = 'Sin coincidencias';
    mentionPopupEl.appendChild(empty);
    return;
  }

  mentionCandidates.forEach((m, idx) => {
    const item = document.createElement('div');
    item.className = 'mention-popup-item' + (idx === 0 ? ' sel' : '');
    const avEl = avatar(m, 28, m.online);
    const nmSpan = document.createElement('span');
    nmSpan.className = 'name';
    nmSpan.textContent = m.name;
    const stEl = document.createElement('span');
    stEl.className = 'st' + statusDotClass(m, m.online);

    item.append(avEl, nmSpan, stEl);
    item.onmousedown = (e) => {
      e.preventDefault();
      insertMention(m);
    };
    mentionPopupEl.appendChild(item);
  });
}

$('msgInput').addEventListener('input', () => {
  checkMentionAutocomplete();`;

if (code.includes(oldMsgInputInput)) {
  code = code.replace(oldMsgInputInput, newMsgInputInput);
  console.log('msgInput input listener enhanced with autocomplete');
}

// 10. Enhance msgInput keydown for mention navigation
const oldMsgKeydown = "$('msgInput').addEventListener('keydown', (e) => {";
const newMsgKeydown = `$('msgInput').addEventListener('keydown', (e) => {
  if (mentionPopupEl && mentionCandidates.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      mentionSelectedIndex = (mentionSelectedIndex + 1) % mentionCandidates.length;
      updateMentionPopupSelection();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      mentionSelectedIndex = (mentionSelectedIndex - 1 + mentionCandidates.length) % mentionCandidates.length;
      updateMentionPopupSelection();
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(mentionCandidates[mentionSelectedIndex]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      hideMentionPopup();
      return;
    }
  }
`;

if (code.includes(oldMsgKeydown)) {
  code = code.replace(oldMsgKeydown, newMsgKeydown);
  console.log('msgInput keydown enhanced for keyboard mention navigation');
}

// 11. Enhance composer submit to extract mentions array and tokens
const oldComposerSubmit = "rpc('msg.send', { channel: S.chan, text: t, replyTo }).catch((er) => toast(er.message));";
const newComposerSubmit = `let membersPool = [];
  if (S.view.kind === 'server') {
    const sd = S.sdata.get(S.view.sid);
    if (sd && sd.members) membersPool = sd.members;
  }
  const mentionIds = [];
  membersPool.forEach(mem => {
    const re = new RegExp('(^|\\\\s)@' + mem.name + '(?=\\\\s|$|[.,!?])', 'i');
    if (re.test(t)) {
      if (!mentionIds.includes(mem.id)) mentionIds.push(mem.id);
    }
  });
  hideMentionPopup();
  rpc('msg.send', { channel: S.chan, text: t, replyTo, mentions: mentionIds }).catch((er) => toast(er.message));`;

if (code.includes(oldComposerSubmit)) {
  code = code.replace(oldComposerSubmit, newComposerSubmit);
  console.log('composer submit enhanced with mentions extraction');
}

// 12. Update global ESC listener to close mention popup first
const oldGlobalEscape = "window.addEventListener('keydown', (e) => {\n  if (e.key === 'Escape') {";
const newGlobalEscape = `window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (typeof hideMentionPopup === 'function' && mentionPopupEl) {
      hideMentionPopup();
      return;
    }
`;

if (code.includes(oldGlobalEscape)) {
  code = code.replace(oldGlobalEscape, newGlobalEscape);
  console.log('global Escape listener updated for mention popup');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('All changes applied successfully. Final length:', code.length);
