/**
 * EpicKast v1.9.1 — Lifecycle Registry & Diagnostics (`window.EKLifecycle`, `window.__EK`)
 * Garantiza cancelación determinista de RAF, setInterval, setTimeout, listeners (AbortController) y AudioContext.
 */
(function () {
  'use strict';

  const activeScopes = new Map();

  function createScope(scopeName = 'default') {
    const prev = activeScopes.get(scopeName);
    if (prev && !prev.isDisposed()) {
      prev.dispose();
    }

    let disposed = false;
    const rafs = new Set();
    const intervals = new Set();
    const timeouts = new Set();
    const abortControllers = new Set();
    const audioContexts = new Set();
    const cleanupCallbacks = new Set();

    const api = {
      scope: scopeName,
      isDisposed() {
        return disposed;
      },
      raf(fn) {
        if (disposed || typeof fn !== 'function') return null;
        let id = null;
        id = window.requestAnimationFrame((ts) => {
          rafs.delete(id);
          if (disposed) return;
          fn(ts);
        });
        rafs.add(id);
        return id;
      },
      cancelRaf(id) {
        if (id != null) {
          window.cancelAnimationFrame(id);
          rafs.delete(id);
        }
      },
      interval(fn, ms) {
        if (disposed || typeof fn !== 'function') return null;
        const id = window.setInterval(() => {
          if (disposed) {
            window.clearInterval(id);
            intervals.delete(id);
            return;
          }
          fn();
        }, ms);
        intervals.add(id);
        return id;
      },
      clearInterval(id) {
        if (id != null) {
          window.clearInterval(id);
          intervals.delete(id);
        }
      },
      timeout(fn, ms) {
        if (disposed || typeof fn !== 'function') return null;
        let id = null;
        id = window.setTimeout(() => {
          timeouts.delete(id);
          if (disposed) return;
          fn();
        }, ms);
        timeouts.add(id);
        return id;
      },
      clearTimeout(id) {
        if (id != null) {
          window.clearTimeout(id);
          timeouts.delete(id);
        }
      },
      listen(target, evt, fn, opts) {
        if (disposed || !target || typeof target.addEventListener !== 'function') return () => {};
        const ac = new AbortController();
        abortControllers.add(ac);
        const listenerOpts = typeof opts === 'boolean'
          ? { capture: opts, signal: ac.signal }
          : { ...(opts || {}), signal: ac.signal };
        const wrapped = (e) => {
          if (disposed) return;
          fn(e);
        };
        target.addEventListener(evt, wrapped, listenerOpts);
        return () => {
          ac.abort();
          abortControllers.delete(ac);
        };
      },
      audio(ctx) {
        if (!ctx) return null;
        if (disposed) {
          try { if (ctx.state !== 'closed') ctx.close(); } catch {}
          return ctx;
        }
        audioContexts.add(ctx);
        return ctx;
      },
      onDispose(fn) {
        if (typeof fn === 'function' && !disposed) {
          cleanupCallbacks.add(fn);
        }
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        for (const id of rafs) {
          try { window.cancelAnimationFrame(id); } catch {}
        }
        rafs.clear();
        for (const id of intervals) {
          try { window.clearInterval(id); } catch {}
        }
        intervals.clear();
        for (const id of timeouts) {
          try { window.clearTimeout(id); } catch {}
        }
        timeouts.clear();
        for (const ac of abortControllers) {
          try { ac.abort(); } catch {}
        }
        abortControllers.clear();
        for (const ctx of audioContexts) {
          try {
            if (ctx && ctx.state !== 'closed') {
              ctx.close().catch(() => {});
            }
          } catch {}
        }
        audioContexts.clear();
        for (const fn of cleanupCallbacks) {
          try { fn(); } catch {}
        }
        cleanupCallbacks.clear();
        if (activeScopes.get(scopeName) === api) {
          activeScopes.delete(scopeName);
        }
      },
      count() {
        let openAudio = 0;
        for (const ctx of audioContexts) {
          if (ctx && ctx.state !== 'closed') openAudio++;
        }
        return {
          raf: rafs.size,
          intervals: intervals.size,
          timeouts: timeouts.size,
          listeners: abortControllers.size,
          audio: openAudio === 0 ? 'closed' : openAudio
        };
      }
    };

    activeScopes.set(scopeName, api);
    return api;
  }

  function disposeAll() {
    for (const scope of Array.from(activeScopes.values())) {
      try { scope.dispose(); } catch {}
    }
    activeScopes.clear();
  }

  function vaultDebug() {
    let raf = 0;
    let intervals = 0;
    let timeouts = 0;
    let listeners = 0;
    let openAudio = 0;
    for (const scope of activeScopes.values()) {
      const c = scope.count();
      raf += c.raf;
      intervals += c.intervals;
      timeouts += c.timeouts;
      listeners += c.listeners;
      if (typeof c.audio === 'number') openAudio += c.audio;
    }
    const summary = {
      raf,
      intervals,
      timeouts,
      listeners,
      audio: openAudio === 0 ? 'closed' : openAudio
    };
    console.info('[__EK.vaultDebug]', summary);
    return summary;
  }

  function assertNoBadText(container) {
    const root = container || document.getElementById('modal');
    if (!root) return { ok: true, matches: [] };
    const text = root.textContent || '';
    const badPatterns = [
      { label: 'undefined', re: /\bundefined\b/g },
      { label: 'NaN', re: /\bNaN\b/g },
      { label: '[object Object]', re: /\[object Object\]/g }
    ];
    const matches = [];
    for (const p of badPatterns) {
      if (p.re.test(text)) {
        matches.push(p.label);
      }
    }
    if (matches.length > 0) {
      console.warn('[__EK.assertNoBadText] Texto inválido detectado en el DOM:', matches);
    }
    return { ok: matches.length === 0, matches };
  }

  window.EKLifecycle = {
    create: createScope,
    disposeAll,
    getScope(name) {
      return activeScopes.get(name) || null;
    }
  };

  window.__EK = Object.assign(window.__EK || {}, {
    vaultDebug,
    assertNoBadText,
    disposeVaultScopes: disposeAll
  });

  window.addEventListener('beforeunload', () => {
    disposeAll();
  });
})();
