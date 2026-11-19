'use strict';

(function (global) {
  let activeState = null;
  const sortablesByContainer = new WeakMap();
  const activeSortables = new Set();

  const RANK_LABELS = {
    0: 'Miembro',
    1: 'Veterano',
    2: 'Moderador',
    3: 'Administrador',
    4: 'Fundador'
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }

  function applyFallbackStyle(node, styles) {
    if (!node || !styles) return;
    Object.assign(node.style, styles);
  }

  function getUserIdFromEl(node) {
    if (!node) return '';
    return (
      node.dataset?.userId ||
      node.dataset?.uid ||
      node.dataset?.id ||
      node.getAttribute?.('data-user-id') ||
      ''
    );
  }

  function isElement(val) {
    return Boolean(val && typeof Element !== 'undefined' && val instanceof Element);
  }

  function resolveReference(anchorOrEvent) {
    if (isElement(anchorOrEvent)) {
      return {
        referenceEl: anchorOrEvent,
        fallbackPoint: () => {
          const r = anchorOrEvent.getBoundingClientRect();
          return { x: r.left, y: r.bottom + 6, rect: r };
        }
      };
    }

    if (anchorOrEvent && typeof anchorOrEvent.getBoundingClientRect === 'function') {
      return {
        referenceEl: {
          getBoundingClientRect: () => anchorOrEvent.getBoundingClientRect()
        },
        fallbackPoint: () => {
          const r = anchorOrEvent.getBoundingClientRect();
          return { x: r.left, y: r.bottom + 6, rect: r };
        }
      };
    }

    if (
      anchorOrEvent &&
      typeof anchorOrEvent.clientX === 'number' &&
      typeof anchorOrEvent.clientY === 'number'
    ) {
      const cx = anchorOrEvent.clientX;
      const cy = anchorOrEvent.clientY;
      if (cx === 0 && cy === 0) {
        const targetEl = isElement(anchorOrEvent.currentTarget)
          ? anchorOrEvent.currentTarget
          : isElement(anchorOrEvent.target)
            ? anchorOrEvent.target
            : null;
        if (targetEl) {
          return {
            referenceEl: targetEl,
            fallbackPoint: () => {
              const r = targetEl.getBoundingClientRect();
              return { x: r.left, y: r.bottom + 6, rect: r };
            }
          };
        }
      }

      const virtualEl = {
        getBoundingClientRect() {
          return {
            width: 0,
            height: 0,
            x: cx,
            y: cy,
            top: cy,
            left: cx,
            right: cx,
            bottom: cy
          };
        }
      };
      return {
        referenceEl: virtualEl,
        fallbackPoint: () => ({ x: cx + 6, y: cy + 6, rect: null })
      };
    }

    const defaultVirtual = {
      getBoundingClientRect() {
        return { width: 0, height: 0, x: 16, y: 16, top: 16, left: 16, right: 16, bottom: 16 };
      }
    };
    return {
      referenceEl: defaultVirtual,
      fallbackPoint: () => ({ x: 16, y: 16, rect: null })
    };
  }

  function close() {
    const stale = document.querySelectorAll('.ek-ctx-menu');
    stale.forEach((node) => {
      if (node.parentNode) node.parentNode.removeChild(node);
    });

    if (!activeState) return;
    const state = activeState;
    activeState = null;

    if (typeof state.cleanupAutoUpdate === 'function') {
      try {
        state.cleanupAutoUpdate();
      } catch (_) {}
    }
    if (typeof state.cleanupListeners === 'function') {
      try {
        state.cleanupListeners();
      } catch (_) {}
    }
    if (state.menuEl && state.menuEl.parentNode) {
      state.menuEl.parentNode.removeChild(state.menuEl);
    }
  }

  function formatStatusText(user, ctx) {
    const parts = [];
    const rankNum = Number(ctx?.targetRank ?? user?.rank ?? 0);
    const customRankLabel = ctx?.targetRankLabel || user?.rankLabel;
    if (customRankLabel) {
      parts.push(String(customRankLabel));
    } else if (ctx?.isServerVoice || rankNum > 0) {
      parts.push(RANK_LABELS[rankNum] || `Rango ${rankNum}`);
    }

    const st = user?.state || {};
    if (st.serverDeafened) parts.push('Ensordecido (servidor)');
    else if (st.serverMuted) parts.push('Muteado (servidor)');
    else if (st.deafened) parts.push('Ensordecido');
    else if (st.muted) parts.push('Silenciado');
    else if (ctx?.isLocalMuted) parts.push('Silenciado para ti');
    else parts.push('En llamada');

    return parts.join(' · ');
  }

  function openVoiceUserMenu(anchorOrEvent, ctx) {
    close();

    const safeCtx = ctx || {};
    const user = safeCtx.user || {};
    const callbacks = safeCtx.callbacks || {};
    const serverData = safeCtx.serverData || {};
    const isServerVoice = Boolean(safeCtx.isServerVoice);
    const myId = safeCtx.myId;
    const isSelf = user.id != null && myId != null && String(user.id) === String(myId);
    const myRank = Number(safeCtx.myRank ?? 0);
    const targetRank = Number(safeCtx.targetRank ?? 0);

    const menu = el('div', 'ek-ctx-menu');
    menu.setAttribute('role', 'menu');
    menu.tabIndex = -1;
    menu.style.position = 'fixed';
    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.style.zIndex = '100020';
    menu.style.visibility = 'hidden';
    menu.style.maxHeight = 'calc(100dvh - 20px)';
    menu.style.overflowY = 'auto';

    document.body.appendChild(menu);

    const cs = global.getComputedStyle ? global.getComputedStyle(menu) : null;
    const needsFallbackTheme =
      !cs || cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent';

    if (needsFallbackTheme) {
      applyFallbackStyle(menu, {
        minWidth: '236px',
        maxWidth: 'min(300px, calc(100vw - 20px))',
        padding: '6px',
        borderRadius: '12px',
        background: '#131722',
        color: '#e5e7eb',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55)',
        fontFamily: 'inherit',
        fontSize: '13px',
        backdropFilter: 'blur(14px)'
      });
    }

    const addSeparator = () => {
      const sep = el('div', 'ek-ctx-sep');
      if (needsFallbackTheme) {
        applyFallbackStyle(sep, {
          height: '1px',
          margin: '5px 4px',
          background: 'rgba(255, 255, 255, 0.08)'
        });
      }
      menu.appendChild(sep);
    };

    const addActionButton = (label, onClick, opts = {}) => {
      const cls = ['ek-ctx-item'];
      if (opts.danger) cls.push('ek-ctx-danger');
      if (opts.sub) cls.push('ek-ctx-subitem');
      const btn = el('button', cls.join(' '), label);
      btn.type = 'button';
      btn.setAttribute('role', 'menuitem');

      if (needsFallbackTheme) {
        applyFallbackStyle(btn, {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: '36px',
          padding: opts.sub ? '7px 10px 7px 20px' : '8px 10px',
          border: 'none',
          borderRadius: '8px',
          background: 'transparent',
          color: opts.danger ? '#f87171' : '#e5e7eb',
          fontSize: opts.sub ? '12.5px' : '13px',
          fontWeight: opts.danger ? '600' : '500',
          textAlign: 'left',
          cursor: 'pointer',
          touchAction: 'manipulation'
        });
        btn.addEventListener('pointerenter', () => {
          btn.style.background = opts.danger
            ? 'rgba(248, 113, 113, 0.14)'
            : 'rgba(255, 255, 255, 0.08)';
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.background = 'transparent';
        });
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (opts.keepOpen) {
          if (typeof onClick === 'function') onClick(e, btn);
          return;
        }
        close();
        if (typeof onClick === 'function') onClick(e, btn);
      });

      menu.appendChild(btn);
      return btn;
    };

    // Header
    const header = el('div', 'ek-ctx-header');
    if (needsFallbackTheme) {
      applyFallbackStyle(header, {
        padding: '6px 10px 8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '4px'
      });
    }
    const nameEl = el('div', 'ek-ctx-name', user.name || user.username || 'Usuario');
    if (needsFallbackTheme) {
      applyFallbackStyle(nameEl, {
        fontWeight: '700',
        fontSize: '13.5px',
        color: '#f9fafb',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      });
    }
    const statusEl = el('div', 'ek-ctx-status', formatStatusText(user, safeCtx));
    if (needsFallbackTheme) {
      applyFallbackStyle(statusEl, {
        fontSize: '11.5px',
        color: '#9ca3af',
        marginTop: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      });
    }
    header.appendChild(nameEl);
    header.appendChild(statusEl);
    menu.appendChild(header);

    // Volume slider + Local mute (when user.id !== myId)
    if (!isSelf) {
      const volWrap = el('div', 'ek-ctx-vol');
      if (needsFallbackTheme) {
        applyFallbackStyle(volWrap, {
          padding: '6px 10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        });
      }

      const volTop = el('div', 'ek-ctx-vol-top');
      if (needsFallbackTheme) {
        applyFallbackStyle(volTop, {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#cbd5e1'
        });
      }
      const volTitle = el('span', null, 'Volumen de usuario');
      const initRatio =
        safeCtx.localVol != null && !Number.isNaN(Number(safeCtx.localVol))
          ? Math.max(0, Math.min(2, Number(safeCtx.localVol)))
          : 1;
      const initPct = Math.round(initRatio * 100);
      const volValue = el('span', 'ek-ctx-vol-val', `${initPct}%`);
      if (needsFallbackTheme) {
        volValue.style.fontVariantNumeric = 'tabular-nums';
        volValue.style.fontWeight = '600';
      }
      volTop.appendChild(volTitle);
      volTop.appendChild(volValue);

      const slider = el('input', 'ek-ctx-slider');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '200';
      slider.step = '1';
      slider.value = String(initPct);
      slider.setAttribute('aria-label', 'Volumen local de usuario');
      slider.style.touchAction = 'none';
      if (needsFallbackTheme) {
        applyFallbackStyle(slider, {
          width: '100%',
          margin: '0',
          accentColor: '#7c3aed',
          cursor: 'pointer'
        });
      }
      slider.addEventListener('input', () => {
        const pct = Math.max(0, Math.min(200, Number(slider.value) || 0));
        volValue.textContent = `${pct}%`;
        if (typeof callbacks.onVolume === 'function') {
          callbacks.onVolume(pct / 100);
        }
      });

      volWrap.appendChild(volTop);
      volWrap.appendChild(slider);
      menu.appendChild(volWrap);

      addActionButton(
        safeCtx.isLocalMuted ? 'Activar audio local' : 'Silenciar solo para mí',
        () => callbacks.onLocalMute?.()
      );
      addSeparator();
    }

    // Always: Ver perfil
    addActionButton('Ver perfil', () => callbacks.onProfile?.());

    // Asistente de audio
    if (!isSelf && (!isServerVoice || (myRank >= 2 && myRank > targetRank))) {
      addActionButton('Asistente de audio', () => callbacks.onAssistAudio?.());
    }

    // Server moderation controls
    const canModerateVoice = isServerVoice && myRank >= 2 && (isSelf || myRank > targetRank);
    let updatePositionFn = null;

    if (canModerateVoice) {
      addSeparator();

      const isServerMuted = Boolean(user.state?.serverMuted);
      addActionButton(
        isServerMuted ? 'Quitar mute de servidor' : 'Mutear en servidor',
        () => callbacks.onServerMute?.(!isServerMuted)
      );

      const isServerDeafened = Boolean(user.state?.serverDeafened);
      addActionButton(
        isServerDeafened ? 'Quitar ensordecido' : 'Ensordecer en servidor',
        () => callbacks.onServerDeafen?.(!isServerDeafened)
      );

      const allChannels = Array.isArray(serverData.channels) ? serverData.channels : [];
      const otherVoiceChannels = allChannels.filter(
        (ch) => ch && ch.type === 'voice' && ch.key !== safeCtx.channelKey
      );

      if (otherVoiceChannels.length > 0) {
        const moveWrap = el('div', 'ek-ctx-move-wrap');
        const subList = el('div', 'ek-ctx-sublist');
        subList.style.display = 'none';
        let expanded = false;

        const toggleBtn = el('button', 'ek-ctx-item ek-ctx-expand');
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('role', 'menuitem');
        toggleBtn.setAttribute('aria-expanded', 'false');
        const toggleLabel = el('span', null, 'Mover a canal');
        const toggleArrow = el('span', 'ek-ctx-arrow', '▸');
        toggleBtn.appendChild(toggleLabel);
        toggleBtn.appendChild(toggleArrow);

        if (needsFallbackTheme) {
          applyFallbackStyle(toggleBtn, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: '36px',
            padding: '8px 10px',
            border: 'none',
            borderRadius: '8px',
            background: 'transparent',
            color: '#e5e7eb',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'left',
            cursor: 'pointer',
            touchAction: 'manipulation'
          });
          toggleBtn.addEventListener('pointerenter', () => {
            toggleBtn.style.background = 'rgba(255, 255, 255, 0.08)';
          });
          toggleBtn.addEventListener('pointerleave', () => {
            toggleBtn.style.background = 'transparent';
          });
        }

        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          expanded = !expanded;
          subList.style.display = expanded ? 'block' : 'none';
          toggleArrow.textContent = expanded ? '▾' : '▸';
          toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          if (typeof updatePositionFn === 'function') updatePositionFn();
        });

        otherVoiceChannels.forEach((ch) => {
          const chName = ch.name || ch.title || ch.key || 'Canal de voz';
          const chBtn = el('button', 'ek-ctx-item ek-ctx-subitem', `# ${chName}`);
          chBtn.type = 'button';
          chBtn.setAttribute('role', 'menuitem');
          if (needsFallbackTheme) {
            applyFallbackStyle(chBtn, {
              display: 'block',
              width: '100%',
              minHeight: '34px',
              padding: '7px 10px 7px 22px',
              border: 'none',
              borderRadius: '8px',
              background: 'transparent',
              color: '#cbd5e1',
              fontSize: '12.5px',
              textAlign: 'left',
              cursor: 'pointer',
              touchAction: 'manipulation',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            });
            chBtn.addEventListener('pointerenter', () => {
              chBtn.style.background = 'rgba(124, 58, 237, 0.22)';
              chBtn.style.color = '#ffffff';
            });
            chBtn.addEventListener('pointerleave', () => {
              chBtn.style.background = 'transparent';
              chBtn.style.color = '#cbd5e1';
            });
          }
          chBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            close();
            callbacks.onMoveUser?.(ch.key, chName);
          });
          subList.appendChild(chBtn);
        });

        moveWrap.appendChild(toggleBtn);
        moveWrap.appendChild(subList);
        menu.appendChild(moveWrap);
      }

      if (!isSelf) {
        addActionButton('Desconectar de la llamada', () => callbacks.onDisconnect?.(), {
          danger: true
        });
      }
    }

    // Kick / Ban / Block
    const canKick = isServerVoice && !isSelf && myRank >= 3 && myRank > targetRank;
    const canBan = isServerVoice && !isSelf && myRank >= 2 && myRank > targetRank;
    const canBlock = !isSelf;

    if (canKick || canBan || canBlock) {
      addSeparator();
    }
    if (canKick) {
      addActionButton('Expulsar del servidor', () => callbacks.onKick?.());
    }
    if (canBan) {
      addActionButton('Banear del servidor', () => callbacks.onBan?.(), { danger: true });
    }
    if (canBlock) {
      addActionButton('Bloquear usuario', () => callbacks.onBlock?.());
    }

    // Positioning via FloatingUIDOM or fixed fallback
    const { referenceEl, fallbackPoint } = resolveReference(anchorOrEvent);
    const floatingUI = global.EKVendor?.FloatingUIDOM;

    const applyFallbackPosition = () => {
      const menuRect = menu.getBoundingClientRect();
      const pt = fallbackPoint();
      const vw = global.innerWidth || document.documentElement.clientWidth || 800;
      const vh = global.innerHeight || document.documentElement.clientHeight || 600;
      let x = pt.x;
      let y = pt.y;
      if (pt.rect && y + menuRect.height > vh - 10 && pt.rect.top - menuRect.height - 6 >= 10) {
        y = pt.rect.top - menuRect.height - 6;
      }
      x = Math.max(10, Math.min(x, Math.max(10, vw - menuRect.width - 10)));
      y = Math.max(10, Math.min(y, Math.max(10, vh - menuRect.height - 10)));
      menu.style.left = `${Math.round(x)}px`;
      menu.style.top = `${Math.round(y)}px`;
      menu.style.visibility = 'visible';
    };

    let cleanupAutoUpdate = null;

    if (floatingUI && typeof floatingUI.computePosition === 'function') {
      const middleware = [];
      if (typeof floatingUI.offset === 'function') middleware.push(floatingUI.offset(6));
      if (typeof floatingUI.flip === 'function') middleware.push(floatingUI.flip());
      if (typeof floatingUI.shift === 'function') middleware.push(floatingUI.shift({ padding: 10 }));

      updatePositionFn = () => {
        if (!menu.isConnected) return;
        floatingUI
          .computePosition(referenceEl, menu, {
            strategy: 'fixed',
            placement: 'bottom-start',
            middleware
          })
          .then(({ x, y }) => {
            if (!menu.isConnected) return;
            menu.style.left = `${Math.round(x)}px`;
            menu.style.top = `${Math.round(y)}px`;
            menu.style.visibility = 'visible';
          })
          .catch(() => {
            if (menu.isConnected) applyFallbackPosition();
          });
      };

      if (typeof floatingUI.autoUpdate === 'function') {
        cleanupAutoUpdate = floatingUI.autoUpdate(referenceEl, menu, updatePositionFn);
      } else {
        updatePositionFn();
      }
    } else {
      updatePositionFn = applyFallbackPosition;
      applyFallbackPosition();
    }

    // Outside click, Escape, and scroll listeners
    const onOutsidePointerDown = (e) => {
      if (e === anchorOrEvent) return;
      if (e.target && menu.contains(e.target)) return;
      close();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    const onScroll = () => {
      close();
    };

    const sideList = document.getElementById('sideList');
    let listenersAttached = false;
    const attachListeners = () => {
      if (activeState?.menuEl !== menu) return;
      listenersAttached = true;
      document.addEventListener('pointerdown', onOutsidePointerDown, true);
      document.addEventListener('keydown', onKeyDown, true);
      global.addEventListener('scroll', onScroll, { passive: true });
      if (sideList) sideList.addEventListener('scroll', onScroll, { passive: true });
    };

    // Defer attachment to microtask so the opening event doesn't trigger immediate close
    Promise.resolve().then(attachListeners);

    activeState = {
      menuEl: menu,
      cleanupAutoUpdate,
      cleanupListeners: () => {
        if (!listenersAttached) return;
        document.removeEventListener('pointerdown', onOutsidePointerDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
        global.removeEventListener('scroll', onScroll, { passive: true });
        if (sideList) sideList.removeEventListener('scroll', onScroll, { passive: true });
      }
    };
  }

  function destroySortablesFor(containerEl) {
    if (containerEl && sortablesByContainer.has(containerEl)) {
      const list = sortablesByContainer.get(containerEl);
      list.forEach((inst) => {
        activeSortables.delete(inst);
        try {
          inst.destroy();
        } catch (_) {}
      });
      sortablesByContainer.delete(containerEl);
    }

    // Also prune any orphaned Sortable instances whose zone detached from DOM
    for (const inst of Array.from(activeSortables)) {
      if (!inst?.el || !inst.el.isConnected) {
        activeSortables.delete(inst);
        try {
          inst.destroy();
        } catch (_) {}
      }
    }
  }

  function attachVoiceDragDrop(containerEl, ctx) {
    if (containerEl) {
      destroySortablesFor(containerEl);
    }

    const safeCtx = ctx || {};
    const myRank = Number(safeCtx.myRank ?? 0);
    const SortableCtor = global.EKVendor?.Sortable;

    if (!containerEl || myRank < 2 || !SortableCtor) {
      return;
    }

    const zones = Array.from(containerEl.querySelectorAll('.voice-drop-zone[data-voice-key]'));
    if (zones.length === 0) return;

    const canMoveUser = (userId) => {
      if (!userId) return false;
      if (safeCtx.myId != null && String(userId) === String(safeCtx.myId)) return true;
      if (typeof safeCtx.getMemberRank === 'function') {
        const targetRank = Number(safeCtx.getMemberRank(userId) ?? 0);
        return myRank > targetRank;
      }
      return true;
    };

    const setDropHighlight = (active, sourceZone) => {
      zones.forEach((z) => {
        if (active && z !== sourceZone) {
          z.classList.add('voice-drop-active');
        } else {
          z.classList.remove('voice-drop-active');
        }
      });
      if (!active) {
        document.querySelectorAll('.voice-drop-active').forEach((n) => {
          n.classList.remove('voice-drop-active');
        });
      }
    };

    const created = [];
    const groupName = 'ek-voice-' + String(safeCtx.serverId || 'default');

    zones.forEach((zone) => {
      if (typeof SortableCtor.get === 'function') {
        const prev = SortableCtor.get(zone);
        if (prev) {
          try {
            prev.destroy();
          } catch (_) {}
        }
      }

      const inst = new SortableCtor(zone, {
        group: groupName,
        animation: 150,
        delay: 140,
        delayOnTouchOnly: true,
        touchStartThreshold: 4,
        ghostClass: 'voice-drag-ghost',
        dragClass: 'voice-dragging',
        filter: '.not-draggable',
        onStart(evt) {
          const userId = getUserIdFromEl(evt.item);
          if (canMoveUser(userId)) {
            setDropHighlight(true, evt.from);
          }
        },
        onMove(evt) {
          const userId = getUserIdFromEl(evt.dragged);
          if (!canMoveUser(userId)) return false;
          if (!evt.to || !evt.to.hasAttribute('data-voice-key')) return false;
          if (evt.from === evt.to) return false;
          return true;
        },
        onEnd(evt) {
          setDropHighlight(false, null);
          const userId = getUserIdFromEl(evt.item);
          const fromKey =
            evt.from?.dataset?.voiceKey || evt.from?.getAttribute?.('data-voice-key') || '';
          const toKey =
            evt.to?.dataset?.voiceKey || evt.to?.getAttribute?.('data-voice-key') || '';

          if (!userId || !fromKey || !toKey || fromKey === toKey) return;
          if (!canMoveUser(userId)) return;

          if (typeof safeCtx.onMove === 'function') {
            safeCtx.onMove(userId, fromKey, toKey);
          }
        }
      });

      created.push(inst);
      activeSortables.add(inst);
    });

    sortablesByContainer.set(containerEl, created);
  }

  global.EKContextMenu = {
    openVoiceUserMenu,
    attachVoiceDragDrop,
    close
  };
})(window);
