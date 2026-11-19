(function (global) {
  'use strict';

  const SOUND_DIR = './assets/sounds/';
  const RING_FADE_IN_MS = 220;
  const RING_FADE_OUT_MS = 140;
  const DEFAULT_RING_VOL = 0.75;

  const RING_MAP = Object.freeze({
    in: 'ring-in',
    video: 'ring-video',
    out: 'ring-out',
  });

  const SFX_NAMES = Object.freeze([
    'voice-join',
    'voice-leave',
    'mute',
    'unmute',
    'deafen',
    'undeafen',
    'user-moved',
    'dm-notify',
    'msg-send',
    'stream-start',
    'stream-stop',
    'chest-open',
    'legendary-win',
  ]);

  const ALL_SOUNDS = Object.freeze([
    'ring-in',
    'ring-video',
    'ring-out',
    ...SFX_NAMES,
  ]);

  const VALID_SOUND_SET = new Set(ALL_SOUNDS);

  // Explicit local UI / reward feedback sounds remain audible in DND by default
  const DND_EXEMPT_DEFAULT = new Set([
    'mute',
    'unmute',
    'deafen',
    'undeafen',
    'chest-open',
    'legendary-win',
  ]);

  const _cache = Object.create(null);
  const _fadingRings = new Set();

  let _getSettings = null;
  let _activeRing = null;
  let _ringToken = 0;
  let _unlockBound = false;
  let _unlocked = false;

  function getHowlerLib() {
    const lib = global && global.HowlerLib;
    if (lib && typeof lib.Howl === 'function') return lib;
    return null;
  }

  function clamp01(val) {
    if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
    return val < 0 ? 0 : val > 1 ? 1 : val;
  }

  function readSettings() {
    let raw = null;
    try {
      raw = typeof _getSettings === 'function' ? _getSettings() : null;
    } catch (_) {
      raw = null;
    }

    const dnd = !!(raw && raw.dnd);
    let ringVol = raw && typeof raw.ringVol === 'number' && Number.isFinite(raw.ringVol)
      ? raw.ringVol
      : DEFAULT_RING_VOL;

    // Support both 0..1 normalized and 0..100 percentage inputs safely
    if (ringVol > 1) ringVol = ringVol / 100;
    ringVol = clamp01(ringVol);

    return { dnd, ringVol };
  }

  /**
   * Minimal HTMLAudioElement fallback if HowlerLib is unavailable.
   */
  function createFallbackSound(src, defaultLoop) {
    let currentVol = 1;
    let isLoop = !!defaultLoop;
    let nextId = 1;
    const instances = new Map();

    function stopInstance(id) {
      const entry = instances.get(id);
      if (!entry) return;
      if (entry.fadeTimer) {
        clearInterval(entry.fadeTimer);
        entry.fadeTimer = null;
      }
      try {
        entry.audio.pause();
        entry.audio.currentTime = 0;
      } catch (_) {}
      instances.delete(id);
    }

    return {
      _isFallback: true,
      loop(val) {
        if (typeof val === 'boolean') isLoop = val;
        return isLoop;
      },
      volume(val, id) {
        if (typeof val !== 'number') {
          if (id != null && instances.has(id)) return instances.get(id).vol;
          return currentVol;
        }
        const v = clamp01(val);
        if (id != null && instances.has(id)) {
          const entry = instances.get(id);
          entry.vol = v;
          try { entry.audio.volume = v; } catch (_) {}
        } else {
          currentVol = v;
        }
        return this;
      },
      play() {
        if (typeof global.Audio !== 'function') return null;
        try {
          const audio = new global.Audio(src);
          audio.loop = isLoop;
          audio.volume = currentVol;
          const id = nextId++;
          const entry = { audio, vol: currentVol, fadeTimer: null };
          instances.set(id, entry);
          if (!isLoop) {
            audio.addEventListener('ended', () => instances.delete(id), { once: true });
          }
          const p = audio.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {});
          }
          return id;
        } catch (_) {
          return null;
        }
      },
      fade(from, to, durationMs, id) {
        const entry = id != null ? instances.get(id) : null;
        if (!entry) return this;
        if (entry.fadeTimer) {
          clearInterval(entry.fadeTimer);
          entry.fadeTimer = null;
        }
        const startVol = clamp01(from);
        const endVol = clamp01(to);
        const dur = Math.max(1, durationMs || 0);
        const startedAt = Date.now();
        entry.vol = startVol;
        try { entry.audio.volume = startVol; } catch (_) {}

        entry.fadeTimer = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const t = Math.min(1, elapsed / dur);
          const v = clamp01(startVol + (endVol - startVol) * t);
          entry.vol = v;
          try { entry.audio.volume = v; } catch (_) {}
          if (t >= 1) {
            clearInterval(entry.fadeTimer);
            entry.fadeTimer = null;
          }
        }, 16);
        return this;
      },
      stop(id) {
        if (id != null) {
          stopInstance(id);
        } else {
          for (const key of Array.from(instances.keys())) {
            stopInstance(key);
          }
        }
        return this;
      },
      state() {
        return 'loaded';
      },
    };
  }

  /**
   * Lazy-create and cache Howl instances so startup memory footprint stays near zero.
   */
  function getHowl(name, isLoop) {
    if (!VALID_SOUND_SET.has(name)) return null;
    if (_cache[name]) return _cache[name];

    const src = `${SOUND_DIR}${name}.wav`;
    const lib = getHowlerLib();

    if (!lib) {
      const fb = createFallbackSound(src, !!isLoop);
      _cache[name] = fb;
      return fb;
    }

    const howl = new lib.Howl({
      src: [src],
      format: ['wav'],
      loop: !!isLoop,
      preload: true,
      volume: isLoop ? 0 : 1,
      onloaderror: function () {
        // Non-fatal: keep UI silent without throwing if an asset is missing
      },
      onplayerror: function (id) {
        // If blocked by mobile autoplay policy during an active ring, retry cleanly on unlock
        if (_activeRing && _activeRing.howl === howl && (_activeRing.id === id || _activeRing.id == null)) {
          const capturedToken = _activeRing.token;
          const capturedKind = _activeRing.kind;
          howl.once('unlock', function () {
            if (_activeRing && _activeRing.token === capturedToken) {
              try { howl.stop(id); } catch (_) {}
              startRing(capturedKind);
            }
          });
        }
      },
    });

    _cache[name] = howl;
    return howl;
  }

  function tryUnlockAudio() {
    if (_unlocked) return;
    const lib = getHowlerLib();
    const howler = lib && lib.Howler;

    if (!howler) {
      // No HowlerLib present yet; keep listener ready in case bundle initializes later
      return;
    }

    try {
      // Ensure AudioContext exists without loading any sound assets
      if (!howler.ctx && typeof howler.volume === 'function') {
        howler.volume(howler.volume());
      }
      const ctx = howler.ctx;
      if (ctx) {
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          const p = ctx.resume();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              if (ctx.state === 'running') markUnlocked();
            }).catch(() => {});
          }
        } else if (ctx.state === 'running') {
          markUnlocked();
        }
      }
    } catch (_) {}
  }

  function markUnlocked() {
    if (_unlocked) return;
    _unlocked = true;
    unbindUnlockListeners();
  }

  function unbindUnlockListeners() {
    if (!_unlockBound) return;
    _unlockBound = false;
    const target = global && global.document ? global.document : global;
    if (!target || typeof target.removeEventListener !== 'function') return;
    const events = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
    for (let i = 0; i < events.length; i++) {
      target.removeEventListener(events[i], tryUnlockAudio, true);
    }
  }

  function bindUnlockListeners() {
    if (_unlockBound || _unlocked) return;
    const target = global && global.document ? global.document : global;
    if (!target || typeof target.addEventListener !== 'function') return;
    _unlockBound = true;
    const events = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
    for (let i = 0; i < events.length; i++) {
      target.addEventListener(events[i], tryUnlockAudio, { capture: true, passive: true });
    }
  }

  function forceStopAllRingsImmediate() {
    if (_activeRing) {
      const active = _activeRing;
      _activeRing = null;
      if (active.id != null) {
        try { active.howl.stop(active.id); } catch (_) {}
      }
    }
    if (_fadingRings.size > 0) {
      for (const pending of Array.from(_fadingRings)) {
        clearTimeout(pending.timer);
        if (pending.id != null) {
          try { pending.howl.stop(pending.id); } catch (_) {}
        }
      }
      _fadingRings.clear();
    }
  }

  /**
   * Initialize audio engine with a settings getter `() => ({ dnd, ringVol })`
   * and register one-time user gesture AudioContext unlock.
   */
  function init(getSettings) {
    if (typeof getSettings === 'function') {
      _getSettings = getSettings;
    } else if (getSettings && typeof getSettings === 'object') {
      _getSettings = function () { return getSettings; };
    }
    bindUnlockListeners();
  }

  /**
   * Start looping ringtone ('in' | 'video' | 'out') with 220ms fade-in.
   */
  function startRing(kind) {
    const soundName = RING_MAP[kind];
    _ringToken += 1;
    const token = _ringToken;

    forceStopAllRingsImmediate();

    if (!soundName) return null;

    const settings = readSettings();
    if (settings.dnd && (kind === 'in' || kind === 'video')) {
      return null;
    }

    const targetVol = settings.ringVol;
    if (targetVol <= 0) return null;

    const howl = getHowl(soundName, true);
    if (!howl) return null;

    const ringEntry = { howl, id: null, kind, soundName, targetVol, token };
    _activeRing = ringEntry;

    try {
      if (typeof howl.loop === 'function') howl.loop(true);
      howl.volume(0);
      const id = howl.play();
      if (id == null) {
        if (_activeRing === ringEntry) _activeRing = null;
        return null;
      }

      ringEntry.id = id;
      howl.volume(0, id);
      howl.fade(0, targetVol, RING_FADE_IN_MS, id);

      return id;
    } catch (_) {
      if (_activeRing === ringEntry) _activeRing = null;
      return null;
    }
  }

  /**
   * Smoothly fade out active ringtone over 140ms and stop loop.
   */
  function stopRing() {
    _ringToken += 1;
    if (!_activeRing) return;

    const ring = _activeRing;
    _activeRing = null;

    try {
      const current = ring.howl.volume(ring.id);
      const startVol = typeof current === 'number' && Number.isFinite(current)
        ? current
        : ring.targetVol;

      ring.howl.fade(startVol, 0, RING_FADE_OUT_MS, ring.id);

      const pending = {
        howl: ring.howl,
        id: ring.id,
        timer: null,
      };
      pending.timer = setTimeout(() => {
        _fadingRings.delete(pending);
        try { ring.howl.stop(ring.id); } catch (_) {}
      }, RING_FADE_OUT_MS + 20);

      _fadingRings.add(pending);
    } catch (_) {
      try { ring.howl.stop(ring.id); } catch (__) {}
    }
  }

  /**
   * Play a named sound effect.
   * @param {string} name - Sound identifier (e.g. 'voice-join', 'dm-notify', 'mute')
   * @param {number} [volScale=1] - Multiplier against settings.ringVol
   * @param {boolean} [ignoreDnd] - Explicitly force or respect DND mode
   */
  function play(name, volScale, ignoreDnd) {
    if (typeof name !== 'string' || !VALID_SOUND_SET.has(name)) return null;

    const settings = readSettings();
    const bypassDnd = ignoreDnd === true || (ignoreDnd !== false && DND_EXEMPT_DEFAULT.has(name));
    if (settings.dnd && !bypassDnd) return null;

    const scale = typeof volScale === 'number' && Number.isFinite(volScale)
      ? (volScale < 0 ? 0 : volScale)
      : 1;
    const targetVol = clamp01(settings.ringVol * scale);
    if (targetVol <= 0) return null;

    const isRing = name === 'ring-in' || name === 'ring-video' || name === 'ring-out';
    const howl = getHowl(name, isRing);
    if (!howl) return null;

    try {
      if (typeof howl.loop === 'function') howl.loop(false);
      howl.volume(targetVol);
      const id = howl.play();
      if (id != null) {
        howl.volume(targetVol, id);
      }
      return id;
    } catch (_) {
      return null;
    }
  }

  const EKAudio = {
    init,
    startRing,
    stopRing,
    play,
    isRinging: function () {
      return !!_activeRing;
    },
    unlock: tryUnlockAudio,
    SOUNDS: ALL_SOUNDS,
  };

  if (global) {
    global.EKAudio = EKAudio;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EKAudio;
  }
})(typeof window !== 'undefined' ? window : globalThis);
