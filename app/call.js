'use strict';
/**
 * Llamada P2P (malla) con "perfect negotiation".
 * Decisiones de rendimiento (ver docs/OPTIMIZACION-REA.md):
 *  - H.264 primero => codificación/decodificación por hardware (RX 6600 etc.), VP8/VP9/AV1 solo como respaldo.
 *  - Bitrate/fps topados por RTCRtpSender.setParameters y repartidos según nº de participantes.
 *  - Un solo MediaStream para voz+cámara, otro aparte para pantalla (un tile por stream).
 *  - Sin análisis de calidad por CPU ni telemetría; estadísticas solo bajo demanda.
 */
const CAM_PRESETS = {
  '480p30': { w: 640, h: 360, fps: 30, kbps: 700 },
  '720p30': { w: 1280, h: 720, fps: 30, kbps: 1800 },
  '1080p30': { w: 1920, h: 1080, fps: 30, kbps: 3500 },
};
const SCREEN_PRESETS = {
  '720p30': { w: 1280, h: 720, fps: 30, kbps: 2500 },
  '1080p30': { w: 1920, h: 1080, fps: 30, kbps: 5000 },
  '1080p60': { w: 1920, h: 1080, fps: 60, kbps: 8000 },
  '1440p60': { w: 2560, h: 1440, fps: 60, kbps: 12000 },
};

function preferredCodecs() {
  const caps = RTCRtpSender.getCapabilities?.('video');
  if (!caps) return null;
  const rank = (c) => {
    const m = c.mimeType.toLowerCase();
    if (m === 'video/h264') return /packetization-mode=1/.test(c.sdpFmtpLine || '') ? 0 : 1;
    if (m === 'video/vp8') return 2;
    if (m === 'video/vp9') return 3;
    if (m === 'video/av1') return 4;
    return 5; // rtx, red, ulpfec...
  };
  return [...caps.codecs].sort((a, b) => rank(a) - rank(b));
}

/**
 * Micrófono con supresión de ruido seleccionable (settings.noise):
 *  - 'off'  : sin supresión (solo cancelación de eco + ganancia automática)
 *  - 'std'  : supresor integrado de Chromium (muy ligero)
 *  - 'high' : RNNoise (red neuronal ligera en AudioWorklet/WASM, ~1-2 % de un núcleo).
 * Importante en Chromium/Windows:
 *  - Guardamos referencias fuertes a src/rn/dest/keepAlive en `out._nodes` para evitar que el GC de V8
 *    recolecte los nodos de WebAudio y silencie el micrófono.
 *  - Conectamos un GainNode(0) a ctx.destination y un elemento Audio silenciado para forzar el reloj
 *    de captura WASAPI de Chromium (evita el bug Chromium #933677).
 */
async function createMic(settings) {
  const mode = ['off', 'std', 'high'].includes(settings.noise) ? settings.noise : 'high';
  const preferredDevice = settings.mic && typeof settings.mic === 'string' && settings.mic.trim() !== '' ? settings.mic.trim() : null;

  let raw = null;
  // 1) Intentar con el dispositivo configurado (con { ideal }, nunca { exact } para no fallar por id re-enumerado o desconectado)
  if (preferredDevice) {
    try {
      raw = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { ideal: preferredDevice },
          echoCancellation: true,
          noiseSuppression: mode !== 'off',
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
    } catch (e) {
      console.warn('getUserMedia con preferredDevice falló, intentando audio predeterminado:', e);
    }
  }

  // 2) Fallback al dispositivo de audio predeterminado del sistema
  if (!raw) {
    raw = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: mode !== 'off',
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
      },
    });
  }

  // Mantener vivo el pull de captura de Chromium en Windows
  const pullEl = new Audio();
  pullEl.muted = true;
  pullEl.srcObject = raw;
  pullEl.play?.().catch(() => {});

  const ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'interactive' });
  const src = ctx.createMediaStreamSource(raw);
  // 1) Filtro paso-alto a 115 Hz + recorte suave en 180 Hz para eliminar golpes de aire, soplidos y respiración nasal
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 115;
  hp.Q.value = 0.707;
  const breathEq = ctx.createBiquadFilter();
  breathEq.type = 'peaking';
  breathEq.frequency.value = 180;
  breathEq.Q.value = 1.1;
  breathEq.gain.value = -3.5;

  src.connect(hp);
  hp.connect(breathEq);

  // 2) RNNoise corre ANTES del compresor para que las respiraciones bajas no sean amplificadas
  let cleanNode = breathEq;
  let actualMode = mode === 'high' ? 'std' : mode;
  if (mode === 'high') {
    try {
      await ctx.audioWorklet.addModule('vendor/rnnoise-worklet.js');
      const rn = new AudioWorkletNode(ctx, 'NoiseSuppressorWorklet', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: 'explicit',
      });
      rn.onprocessorerror = (err) => {
        console.warn('RNNoise processor error, bypassing cleanly to breathEq:', err);
        try {
          breathEq.disconnect(rn);
          breathEq.connect(gateGain);
        } catch {}
      };
      breathEq.connect(rn);
      cleanNode = rn;
      actualMode = 'high';
    } catch (e) {
      console.warn('RNNoise fallback a std:', e);
    }
  }

  // 3) Puerta de Voz Anti-Respiración (Noise Gate)
  const gateAn = ctx.createAnalyser();
  gateAn.fftSize = 256;
  const gateGain = ctx.createGain();
  // En modo 'high' (RNNoise), RNNoise elimina por IA el ruido ambiente y la respiración de forma continua.
  // La compuerta de volumen por umbral solo se impone si el usuario la configura a un umbral alto (> 0.010).
  const userGate = Number(settings.voiceGate ?? 0.006);
  let gateThresh = (actualMode === 'high' && userGate <= 0.010) ? 0 : Math.max(0, Math.min(0.12, userGate));
  // Siempre iniciar en 1 (abierto) para que la voz fluya de inmediato
  gateGain.gain.value = 1;
  let gateOpen = true;

  // Medir la voz directamente de la fuente física ('src') para que filtros o IA no impidan detectar la voz
  src.connect(gateAn);
  cleanNode.connect(gateGain);

  // 4) Limitador/compresor suave de picos (umbral alto -18 dB para no levantar sonidos bajos) + ganancia de usuario
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 2.5;
  comp.attack.value = 0.004;
  comp.release.value = 0.16;

  const inGain = ctx.createGain();
  inGain.gain.value = Math.max(0.2, Math.min(2.5, Number(settings.micGain ?? 1)));

  const an = ctx.createAnalyser();
  an.fftSize = 256;
  const zeroGain = ctx.createGain();
  zeroGain.gain.value = 0;
  const dest = ctx.createMediaStreamDestination();
  dest.channelCount = 1;

  gateGain.connect(comp);
  comp.connect(inGain);
  inGain.connect(dest);
  inGain.connect(an);
  an.connect(zeroGain);
  zeroGain.connect(ctx.destination);

  // Elemento Audio dedicado para monitoreo propio (Oírme / Probador de micrófono)
  // Utiliza dest.stream para oír tu propia voz procesada con sinkId correcto al altavoz o audífono seleccionado
  const monEl = new Audio();
  monEl.srcObject = dest.stream;
  if (settings.spk && typeof monEl.setSinkId === 'function') {
    monEl.setSinkId(settings.spk).catch(() => {});
  }
  if (settings.spk && typeof ctx.setSinkId === 'function') {
    ctx.setSinkId(settings.spk).catch(() => {});
  }
  await ctx.resume().catch(() => {});

  const gateBuf = new Uint8Array(gateAn.fftSize);
  const buf = new Uint8Array(an.fftSize);
  let holdUntil = performance.now() + 400; // Mantener abierto inicialmente
  const gateTimer = setInterval(() => {
    if (gateThresh <= 0.002) {
      if (!gateOpen) { gateOpen = true; gateGain.gain.setTargetAtTime(1, ctx.currentTime, 0.01); }
      return;
    }
    gateAn.getByteTimeDomainData(gateBuf);
    let sum = 0, peak = 0;
    for (let i = 0; i < gateBuf.length; i++) {
      const d = (gateBuf[i] - 128) / 128;
      const a = Math.abs(d);
      if (a > peak) peak = a;
      sum += d * d;
    }
    const rms = Math.sqrt(sum / gateBuf.length);
    const lv = Math.max(rms * 1.5, peak * 0.7);
    const now = performance.now();
    if (lv >= gateThresh) {
      holdUntil = now + 260; // 260ms sostén para no cortar finales de palabras
      if (!gateOpen) {
        gateOpen = true;
        gateGain.gain.setTargetAtTime(1, ctx.currentTime, 0.008);
      }
    } else if (gateOpen && now > holdUntil) {
      gateOpen = false;
      gateGain.gain.setTargetAtTime(0, ctx.currentTime, 0.040);
    }
  }, 22);

  const outStream = new MediaStream(dest.stream.getAudioTracks());
  const out = {
    stream: outStream,
    raw,
    mode: actualMode,
    ctx,
    analyser: an,
    monitoring: false,
    _nodes: { src, hp, breathEq, cleanNode, gateAn, gateGain, comp, inGain, dest, an, zeroGain, monEl, pullEl },
    setGain(val) {
      inGain.gain.setTargetAtTime(Math.max(0.2, Math.min(2.5, Number(val) || 1)), ctx.currentTime, 0.015);
    },
    setGate(val) {
      const v = Number(val) || 0;
      gateThresh = (actualMode === 'high' && v <= 0.010) ? 0 : Math.max(0, Math.min(0.12, v));
      if (gateThresh <= 0.002) {
        gateOpen = true;
        gateGain.gain.setTargetAtTime(1, ctx.currentTime, 0.01);
      }
    },
    setSinkId(sinkId) {
      if (typeof monEl.setSinkId === 'function') monEl.setSinkId(sinkId).catch(() => {});
      if (typeof ctx.setSinkId === 'function') ctx.setSinkId(sinkId).catch(() => {});
    },
    rawLevel() {
      gateAn.getByteTimeDomainData(gateBuf);
      let m = 0;
      for (let i = 0; i < gateBuf.length; i++) {
        const v = Math.abs(gateBuf[i] - 128);
        if (v > m) m = v;
      }
      return m / 128;
    },
    level() {
      an.getByteTimeDomainData(buf);
      let m = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(buf[i] - 128);
        if (v > m) m = v;
      }
      return m / 128;
    },
    monitor(on) {
      this.monitoring = !!on;
      if (on) {
        if (monEl.srcObject !== dest.stream) monEl.srcObject = dest.stream;
        if (settings.spk && typeof monEl.setSinkId === 'function') {
          monEl.setSinkId(settings.spk).catch(() => {});
        }
        monEl.play().catch(() => {});
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      } else {
        monEl.pause();
      }
    },
    dispose() {
      clearInterval(gateTimer);
      this.monitor(false);
      try { monEl.srcObject = null; } catch {}
      try { pullEl.srcObject = null; } catch {}
      raw.getTracks().forEach((t) => t.stop());
      outStream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
    },
  };
  return out;
}

class Call {
  constructor({ send, myId, settings, ice, onChange, onSpeaking }) {
    this.send = send; this.myId = myId; this.settings = settings; this.ice = ice;
    this.onChange = onChange; this.onSpeaking = onSpeaking;
    this.peers = new Map(); this.pending = new Map();
    this.main = null; this.camTrack = null; this.screenStream = null; this.mic = null;
    this.muted = false; this.deaf = false; this.selfSpeaking = false;
    this.codecs = settings.hwPrefer ? preferredCodecs() : null;
    this.lastBytes = new Map();
    this.speakTimer = setInterval(() => this.pollSpeaking(), 180);
  }

  async start() {
    this.mic = await createMic(this.settings);
    this.noiseMode = this.mic.mode;
    this.main = new MediaStream(this.mic.stream.getAudioTracks());
  }

  setSelfMonitor(on) {
    this.mic?.monitor(on);
    this.onChange();
  }

  setSinkId(sinkId) {
    this.mic?.setSinkId?.(sinkId);
  }

  // ---- pares ----
  addPeer(user) {
    if (this.peers.has(user.id)) return;
    const pc = new RTCPeerConnection({ iceServers: this.ice, bundlePolicy: 'max-bundle', iceCandidatePoolSize: 0 });
    const p = { id: user.id, name: user.name, user, pc, polite: this.myId > user.id, making: false, ignore: false, senders: {}, streams: new Map(), mainId: null, state: user.state || {}, speaking: false };
    this.peers.set(user.id, p);
    pc.onicecandidate = (e) => { if (e.candidate) this.send('rtc.signal', { to: p.id, data: { candidate: e.candidate } }); };
    pc.onnegotiationneeded = async () => {
      try { p.making = true; await pc.setLocalDescription(); this.send('rtc.signal', { to: p.id, data: { description: pc.localDescription } }); }
      catch (e) { console.warn('negotiation', e); } finally { p.making = false; }
    };
    pc.ontrack = (e) => {
      const st = e.streams[0] || new MediaStream([e.track]);
      if (!p.streams.has(st.id)) {
        p.streams.set(st.id, st); if (!p.mainId) p.mainId = st.id;
        st.onaddtrack = st.onremovetrack = () => this.onChange();
      }
      e.track.onmute = e.track.onunmute = e.track.onended = () => this.onChange();
      this.onChange();
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') pc.restartIce();
      this.onChange();
    };
    // pistas locales actuales
    this.main?.getAudioTracks().forEach((t) => { p.senders.mic = pc.addTrack(t, this.main); this.tuneAudio(p.senders.mic); });
    if (this.camTrack) this.attachCam(p);
    if (this.screenStream) this.attachScreen(p);
    const buf = this.pending.get(user.id);
    if (buf) { this.pending.delete(user.id); buf.forEach((d) => this.handleSignal(user.id, d)); }
    this.retune();
    this.onChange();
  }

  removePeer(id) {
    const p = this.peers.get(id); if (!p) return;
    p.pc.close(); this.peers.delete(id); this.lastBytes.delete(id);
    this.retune(); this.onChange();
  }

  async handleSignal(from, data) {
    const p = this.peers.get(from);
    if (!p) { const b = this.pending.get(from) || []; b.push(data); this.pending.set(from, b); return; }
    try {
      if (data.description) {
        const d = data.description;
        const collision = d.type === 'offer' && (p.making || p.pc.signalingState !== 'stable');
        p.ignore = !p.polite && collision;
        if (p.ignore) return;
        await p.pc.setRemoteDescription(d);
        if (d.type === 'offer') { await p.pc.setLocalDescription(); this.send('rtc.signal', { to: from, data: { description: p.pc.localDescription } }); }
      } else if (data.candidate) {
        try { await p.pc.addIceCandidate(data.candidate); } catch (e) { if (!p.ignore) throw e; }
      }
    } catch (e) { console.warn('signal', e); }
  }

  // ---- afinado de emisores ----
  async setParams(sender, fn) {
    try {
      const prm = sender.getParameters();
      if (!prm.encodings || !prm.encodings.length) prm.encodings = [{}];
      fn(prm);
      await sender.setParameters(prm);
    } catch (e) {}
  }
  tuneAudio(sender) {
    const kbps = Number(this.settings.audioKbps) || 96;
    this.setParams(sender, (prm) => {
      prm.encodings[0].maxBitrate = kbps * 1000;
      prm.encodings[0].networkPriority = 'high';
      prm.encodings[0].priority = 'high';
    });
  }
  share() { return Math.min(1, 2 / Math.max(1, this.peers.size)); }
  tuneVideo(sender, preset, kind) {
    this.setParams(sender, (prm) => {
      const e = prm.encodings[0];
      e.maxBitrate = Math.round(preset.kbps * 1000 * this.share());
      e.maxFramerate = preset.fps;
      e.networkPriority = kind === 'screen' ? 'medium' : 'high';
      prm.degradationPreference = kind === 'screen' && preset.fps <= 30 ? 'maintain-resolution' : 'balanced';
    });
  }
  retune() {
    const cp = CAM_PRESETS[this.settings.camPreset] || CAM_PRESETS['720p30'];
    const sp = SCREEN_PRESETS[this.settings.screenPreset] || SCREEN_PRESETS['1080p30'];
    for (const p of this.peers.values()) {
      if (p.senders.cam) this.tuneVideo(p.senders.cam, cp, 'cam');
      if (p.senders.screen) this.tuneVideo(p.senders.screen, sp, 'screen');
    }
  }
  prefer(sender) {
    if (!this.codecs) return;
    const pc = [...this.peers.values()].map((p) => p.pc).find((c) => c.getSenders().includes(sender));
    const tr = pc?.getTransceivers().find((t) => t.sender === sender);
    try { tr?.setCodecPreferences(this.codecs); } catch (e) { console.warn('codecs', e); }
  }

  // ---- cámara ----
  attachCam(p) { p.senders.cam = p.pc.addTrack(this.camTrack, this.main); this.prefer(p.senders.cam); this.retune(); }
  async setCamera(on) {
    if (on && !this.camTrack) {
      const pr = CAM_PRESETS[this.settings.camPreset] || CAM_PRESETS['720p30'];
      const st = await navigator.mediaDevices.getUserMedia({ video: { deviceId: this.settings.cam ? { exact: this.settings.cam } : undefined, width: { ideal: pr.w }, height: { ideal: pr.h }, frameRate: { ideal: pr.fps, max: pr.fps } } });
      this.camTrack = st.getVideoTracks()[0]; this.camTrack.contentHint = 'motion';
      this.camTrack.onended = () => { this.setCamera(false); this.onCamEnded?.(); };
      this.main.addTrack(this.camTrack);
      for (const p of this.peers.values()) this.attachCam(p);
    } else if (!on && this.camTrack) {
      for (const p of this.peers.values()) { if (p.senders.cam) { try { p.pc.removeTrack(p.senders.cam); } catch {} delete p.senders.cam; } }
      this.main.removeTrack(this.camTrack); this.camTrack.stop(); this.camTrack = null;
    }
    this.onChange();
  }

  // ---- pantalla ----
  attachScreen(p) {
    p.senders.screenTracks = [];
    for (const t of this.screenStream.getTracks()) {
      const s = p.pc.addTrack(t, this.screenStream);
      if (t.kind === 'video') { p.senders.screen = s; this.prefer(s); } else p.senders.screenTracks.push(s);
    }
    this.retune();
  }
  async startScreen(sourceId) {
    const pr = SCREEN_PRESETS[this.settings.screenPreset] || SCREEN_PRESETS['1080p30'];
    await window.epic.selectSource(sourceId, !!this.settings.screenAudio);
    const st = await navigator.mediaDevices.getDisplayMedia({ video: { width: { max: pr.w }, height: { max: pr.h }, frameRate: { ideal: pr.fps, max: pr.fps } }, audio: !!this.settings.screenAudio });
    await this.stopScreen();
    this.screenStream = st;
    const v = st.getVideoTracks()[0];
    v.contentHint = pr.fps >= 60 ? 'motion' : 'detail';
    v.onended = () => { this.stopScreen(); this.onScreenEnded?.(); };
    for (const p of this.peers.values()) this.attachScreen(p);
    this.onChange();
    return st.id;
  }
  async stopScreen() {
    if (!this.screenStream) return;
    for (const p of this.peers.values()) {
      if (p.senders.screen) { try { p.pc.removeTrack(p.senders.screen); } catch {} delete p.senders.screen; }
      (p.senders.screenTracks || []).forEach((s) => { try { p.pc.removeTrack(s); } catch {} });
      p.senders.screenTracks = [];
    }
    this.screenStream.getTracks().forEach((t) => t.stop());
    this.screenStream = null; this.onChange();
  }

  setMuted(m) {
    this.muted = m;
    this.main?.getAudioTracks().forEach((t) => { t.enabled = !m; });
    this.mic?.raw?.getAudioTracks().forEach((t) => { t.enabled = !m; });
  }

  // ---- detección de voz (propia + pares remotos) ----
  pollSpeaking() {
    if (this.mic) {
      const lv = this.muted ? 0 : this.mic.level();
      const meSp = lv > 0.035;
      if (meSp !== this.selfSpeaking) {
        this.selfSpeaking = meSp;
        this.onSpeaking('me', meSp, lv);
      } else if (meSp) {
        this.onSpeaking('me', true, lv);
      }
    }
    const now = performance.now();
    for (const p of this.peers.values()) {
      let sp = false;
      for (const r of p.pc.getReceivers()) {
        if (r.track?.kind !== 'audio') continue;
        const s = r.getSynchronizationSources?.()[0];
        if (s && s.audioLevel > 0.015 && now - s.timestamp < 600) sp = true;
      }
      if (sp !== p.speaking) { p.speaking = sp; this.onSpeaking(p.id, sp); }
    }
  }

  // ---- semáforo rápido de red (estilo Parsec/Steam: ping RTT + pérdida de paquetes) ----
  async pingSummary() {
    let maxRtt = null, lost = 0, recv = 0;
    for (const p of this.peers.values()) {
      try {
        const rep = await p.pc.getStats();
        rep.forEach((r) => {
          if (r.type === 'candidate-pair' && r.state === 'succeeded' && r.nominated && r.currentRoundTripTime != null) {
            const ms = Math.round(r.currentRoundTripTime * 1000);
            if (maxRtt === null || ms > maxRtt) maxRtt = ms;
          }
          if (r.type === 'inbound-rtp') {
            lost += r.packetsLost || 0;
            recv += r.packetsReceived || 0;
          }
        });
      } catch {}
    }
    const total = lost + recv;
    const lossPct = total > 20 ? Math.max(0, Math.round((lost / total) * 100)) : 0;
    return { rtt: maxRtt, lossPct, peers: this.peers.size };
  }

  // ---- estadísticas bajo demanda ----
  async stats() {
    const out = new Map();
    for (const p of this.peers.values()) {
      const lines = [];
      try {
        const rep = await p.pc.getStats();
        let rtt = null; const last = this.lastBytes.get(p.id) || { t: 0, b: 0 };
        let bytes = 0;
        rep.forEach((r) => {
          if (r.type === 'candidate-pair' && r.state === 'succeeded' && r.nominated) rtt = r.currentRoundTripTime;
          if (r.type === 'outbound-rtp' && r.kind === 'video') {
            bytes += r.bytesSent;
            lines.push(`↑ ${r.frameWidth || '?'}x${r.frameHeight || '?'}@${Math.round(r.framesPerSecond || 0)} ${r.encoderImplementation || ''}${r.powerEfficientEncoder ? ' (HW)' : ' (CPU)'}${r.qualityLimitationReason && r.qualityLimitationReason !== 'none' ? ' lim:' + r.qualityLimitationReason : ''}`);
          }
          if (r.type === 'inbound-rtp' && r.kind === 'video') lines.push(`↓ ${r.frameWidth || '?'}x${r.frameHeight || '?'}@${Math.round(r.framesPerSecond || 0)} ${r.decoderImplementation || ''}${r.powerEfficientDecoder ? ' (HW)' : ' (CPU)'}`);
        });
        const now = performance.now();
        if (last.t && bytes >= last.b) lines.push(`${Math.round(((bytes - last.b) * 8) / (now - last.t))} kbps`);
        this.lastBytes.set(p.id, { t: now, b: bytes });
        if (rtt != null) lines.push(`RTT ${Math.round(rtt * 1000)} ms`);
      } catch {}
      out.set(p.id, lines.join('\n'));
    }
    return out;
  }

  close() {
    clearInterval(this.speakTimer);
    for (const p of this.peers.values()) p.pc.close();
    this.peers.clear();
    this.mic?.dispose(); this.mic = null;
    this.camTrack?.stop();
    this.screenStream?.getTracks().forEach((t) => t.stop());
    this.main = this.camTrack = this.screenStream = null;
  }
}
