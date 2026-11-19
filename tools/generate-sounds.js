#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const OUT_DIR = path.resolve(__dirname, '..', 'app', 'assets', 'sounds');

// Deterministic PRNG (Mulberry32) for reproducible noise bursts and TPDF dither
function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeBuffer(durationSec) {
  return new Float64Array(Math.max(1, Math.round(durationSec * SAMPLE_RATE)));
}

function raisedCosineAttack(t, attackSec) {
  if (attackSec <= 0 || t >= attackSec) return 1;
  if (t <= 0) return 0;
  return 0.5 - 0.5 * Math.cos((Math.PI * t) / attackSec);
}

function raisedCosineRelease(t, durSec, releaseSec) {
  if (releaseSec <= 0) return 1;
  const start = durSec - releaseSec;
  if (t <= start) return 1;
  if (t >= durSec) return 0;
  return 0.5 + 0.5 * Math.cos((Math.PI * (t - start)) / releaseSec);
}

/**
 * Add an organic harmonic instrument voice (Rhodes, marimba, glass bell, or warm pad).
 */
function addVoice(buf, startSec, freq, durSec, amp, opts = {}) {
  if (freq <= 0 || durSec <= 0 || amp <= 0) return;

  const {
    harmonics = [
      [1.0, 1.0, 1.0],
      [2.0, 0.28, 1.9],
      [3.0, 0.10, 3.0],
      [4.0, 0.04, 4.4],
    ],
    attackSec = 0.005,
    decayRate = 4.5,
    releaseSec = Math.min(0.04, durSec * 0.25),
    tineAmp = 0.06,
    tineRatio = 6.0,
    tineDecay = 42,
    detuneCents = 0,
    detuneMix = 0.28,
    pitchSlideEnd = null,
  } = opts;

  const startIdx = Math.max(0, Math.round(startSec * SAMPLE_RATE));
  const len = Math.round(durSec * SAMPLE_RATE);
  const endIdx = Math.min(buf.length, startIdx + len);
  const nyquistSafe = SAMPLE_RATE * 0.42;

  const detuneRatio = detuneCents ? Math.pow(2, detuneCents / 1200) : 1;
  const useDetune = detuneCents !== 0;

  let phase = 0;
  let phaseDetune = 0;
  let tinePhase = 0;

  for (let i = startIdx; i < endIdx; i++) {
    const localIdx = i - startIdx;
    const t = localIdx / SAMPLE_RATE;

    // Optional subtle pitch bend/glide
    let instFreq = freq;
    if (pitchSlideEnd !== null && durSec > 0) {
      const p = Math.min(1, t / durSec);
      instFreq = freq * Math.pow(pitchSlideEnd / freq, p);
    }

    const atk = raisedCosineAttack(t, attackSec);
    const rel = raisedCosineRelease(t, durSec, releaseSec);
    const envWindow = atk * rel;

    let sample = 0;
    for (let h = 0; h < harmonics.length; h++) {
      const [ratio, weight, decayMult] = harmonics[h];
      const hFreq = instFreq * ratio;
      if (hFreq >= nyquistSafe) continue;

      const hEnv = Math.exp(-t * decayRate * decayMult);
      let s = Math.sin(phase * ratio);
      if (useDetune && ratio <= 2.5) {
        s = (1 - detuneMix) * s + detuneMix * Math.sin(phaseDetune * ratio);
      }
      sample += s * weight * hEnv;
    }

    if (tineAmp > 0 && instFreq * tineRatio < nyquistSafe) {
      const tEnv = Math.exp(-t * tineDecay);
      sample += Math.sin(tinePhase) * tineAmp * tEnv;
    }

    buf[i] += sample * envWindow * amp;

    const dPhase = (2 * Math.PI * instFreq) / SAMPLE_RATE;
    phase += dPhase;
    if (useDetune) phaseDetune += dPhase * detuneRatio;
    if (tineAmp > 0) tinePhase += dPhase * tineRatio;
  }
}

function addRhodes(buf, startSec, freq, durSec, amp, extra = {}) {
  addVoice(buf, startSec, freq, durSec, amp, {
    harmonics: [
      [1.0, 1.0, 1.0],
      [2.0, 0.30, 1.85],
      [3.0, 0.11, 2.9],
      [4.0, 0.045, 4.2],
      [5.0, 0.015, 6.0],
    ],
    attackSec: 0.005,
    decayRate: extra.decayRate ?? 3.4,
    tineAmp: extra.tineAmp ?? 0.075,
    tineRatio: 7.0,
    tineDecay: 52,
    detuneCents: extra.detuneCents ?? 2.4,
    detuneMix: 0.25,
    ...extra,
  });
}

function addMarimba(buf, startSec, freq, durSec, amp, extra = {}) {
  addVoice(buf, startSec, freq, durSec, amp, {
    harmonics: [
      [1.0, 1.0, 1.0],
      [2.0, 0.14, 2.4],
      [3.98, 0.22, 6.8], // Classic marimba bar overtone (~2 octaves)
    ],
    attackSec: 0.0028,
    decayRate: extra.decayRate ?? 6.8,
    tineAmp: extra.tineAmp ?? 0.09,
    tineRatio: 2.5,
    tineDecay: 95,
    detuneCents: 0,
    ...extra,
  });
}

function addGlassBell(buf, startSec, freq, durSec, amp, extra = {}) {
  addVoice(buf, startSec, freq, durSec, amp, {
    harmonics: [
      [1.0, 1.0, 1.0],
      [2.0, 0.24, 1.7],
      [3.0, 0.10, 2.8],
      [4.0, 0.05, 4.2],
    ],
    attackSec: 0.003,
    decayRate: extra.decayRate ?? 4.2,
    tineAmp: extra.tineAmp ?? 0.08,
    tineRatio: 5.0,
    tineDecay: 65,
    detuneCents: extra.detuneCents ?? 1.8,
    detuneMix: 0.22,
    ...extra,
  });
}

function addWarmPad(buf, startSec, freq, durSec, amp, extra = {}) {
  addVoice(buf, startSec, freq, durSec, amp, {
    harmonics: [
      [1.0, 1.0, 1.0],
      [2.0, 0.34, 1.2],
      [3.0, 0.14, 1.5],
      [4.0, 0.05, 1.9],
    ],
    attackSec: extra.attackSec ?? 0.055,
    decayRate: extra.decayRate ?? 1.9,
    releaseSec: extra.releaseSec ?? Math.min(0.14, durSec * 0.4),
    tineAmp: 0,
    detuneCents: extra.detuneCents ?? 4.0,
    detuneMix: 0.38,
    ...extra,
  });
}

function addSoftPop(buf, startSec, fStart, fEnd, durSec, amp, extra = {}) {
  addVoice(buf, startSec, fStart, durSec, amp, {
    harmonics: [
      [1.0, 1.0, 1.0],
      [2.0, extra.secondHarm ?? 0.16, 2.2],
    ],
    attackSec: extra.attackSec ?? 0.0025,
    decayRate: extra.decayRate ?? 18.0,
    releaseSec: Math.min(0.02, durSec * 0.35),
    tineAmp: 0,
    pitchSlideEnd: fEnd,
    ...extra,
  });
}

/**
 * Add filtered airy noise swoosh (for channel move / chest shimmer).
 */
function addAiryWhoosh(buf, startSec, durSec, amp, fLow, fPeak, fEnd, rng) {
  const startIdx = Math.max(0, Math.round(startSec * SAMPLE_RATE));
  const len = Math.round(durSec * SAMPLE_RATE);
  const endIdx = Math.min(buf.length, startIdx + len);

  // 2-pole SVF bandpass
  let low = 0;
  let band = 0;
  const q = 1.6;

  for (let i = startIdx; i < endIdx; i++) {
    const p = (i - startIdx) / Math.max(1, len - 1);
    const env = Math.sin(Math.PI * p); // smooth bell window
    const envShaped = env * env;

    // Sweep center frequency up then down smoothly
    const fc = p < 0.45
      ? fLow + (fPeak - fLow) * (p / 0.45)
      : fPeak + (fEnd - fPeak) * ((p - 0.45) / 0.55);

    const f = 2 * Math.sin((Math.PI * Math.min(fc, SAMPLE_RATE * 0.38)) / SAMPLE_RATE);
    const white = rng() * 2 - 1;
    const high = white - low - band / q;
    band += f * high;
    low += f * band;

    buf[i] += band * envShaped * amp;
  }
}

/**
 * RBJ Biquad Filter (lowpass or highpass).
 */
function applyBiquad(buf, type, cutoffHz, q = 0.707) {
  const omega = (2 * Math.PI * Math.min(cutoffHz, SAMPLE_RATE * 0.45)) / SAMPLE_RATE;
  const sinW = Math.sin(omega);
  const cosW = Math.cos(omega);
  const alpha = sinW / (2 * q);

  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') {
    b0 = (1 - cosW) / 2;
    b1 = 1 - cosW;
    b2 = (1 - cosW) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosW;
    a2 = 1 - alpha;
  } else {
    // highpass
    b0 = (1 + cosW) / 2;
    b1 = -(1 + cosW);
    b2 = (1 + cosW) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosW;
    a2 = 1 - alpha;
  }

  const nb0 = b0 / a0;
  const nb1 = b1 / a0;
  const nb2 = b2 / a0;
  const na1 = a1 / a0;
  const na2 = a2 / a0;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x0 = buf[i];
    const y0 = nb0 * x0 + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    buf[i] = y0;
  }
}

/**
 * Compact algorithmic studio delay-reverb with damped feedback combs + allpass diffusers.
 */
function applyReverb(buf, opts = {}) {
  const {
    wet = 0.25,
    decay = 0.45,
    damp = 0.52,
    earlyMix = 0.24,
    tailFadeSec = 0.035,
  } = opts;

  if (wet <= 0) return;

  const N = buf.length;
  const wetBuf = new Float64Array(N);

  // Early reflection taps (prime ms offsets scaled to 24 kHz)
  const erTaps = [
    [Math.round(0.0115 * SAMPLE_RATE), 0.42],
    [Math.round(0.0193 * SAMPLE_RATE), 0.30],
    [Math.round(0.0311 * SAMPLE_RATE), 0.20],
    [Math.round(0.0437 * SAMPLE_RATE), 0.13],
  ];

  // 4 parallel lowpass-damped comb filters
  const combDelays = [701, 887, 1069, 1277];
  const combs = combDelays.map((d) => ({
    buf: new Float64Array(d),
    idx: 0,
    lp: 0,
    fb: Math.min(0.84, Math.max(0.2, decay)),
  }));

  // 2 series Schroeder allpass diffusers
  const apDelays = [113, 47];
  const allpasses = apDelays.map((d) => ({
    buf: new Float64Array(d),
    idx: 0,
    g: 0.5,
  }));

  for (let i = 0; i < N; i++) {
    const x = buf[i];

    // Early reflections
    let er = 0;
    for (let t = 0; t < erTaps.length; t++) {
      const [delay, gain] = erTaps[t];
      if (i >= delay) er += buf[i - delay] * gain;
    }

    // Parallel damped combs
    let combSum = 0;
    for (let c = 0; c < combs.length; c++) {
      const comb = combs[c];
      const delayed = comb.buf[comb.idx];
      comb.lp = damp * comb.lp + (1 - damp) * delayed;
      comb.buf[comb.idx] = x + comb.fb * comb.lp;
      comb.idx = (comb.idx + 1) % comb.buf.length;
      combSum += delayed;
    }
    combSum *= 0.25;

    // Series allpasses for silky diffusion
    let diffused = combSum;
    for (let a = 0; a < allpasses.length; a++) {
      const ap = allpasses[a];
      const v = ap.buf[ap.idx];
      const w = diffused + ap.g * v;
      ap.buf[ap.idx] = w;
      ap.idx = (ap.idx + 1) % ap.buf.length;
      diffused = v - ap.g * w;
    }

    wetBuf[i] = er * earlyMix + diffused;
  }

  for (let i = 0; i < N; i++) {
    buf[i] = buf[i] * (1 - wet * 0.22) + wetBuf[i] * wet;
  }

  // Smooth tail fade so loop boundaries & buffer endings reach exact zero cleanly
  const fadeSamples = Math.min(Math.floor(N * 0.25), Math.round(tailFadeSec * SAMPLE_RATE));
  if (fadeSamples > 1) {
    const fadeStart = N - fadeSamples;
    for (let i = fadeStart; i < N; i++) {
      const p = (i - fadeStart) / (fadeSamples - 1);
      buf[i] *= 0.5 + 0.5 * Math.cos(Math.PI * p);
    }
  }
}

/**
 * Soft peak limiter + normalized headroom + zero-crossing edge fades.
 */
function finalizeBuffer(buf, targetPeak = 0.78, fadeInSec = 0.0015, fadeOutSec = 0.02) {
  let maxAbs = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i]);
    if (a > maxAbs) maxAbs = a;
  }
  if (maxAbs < 1e-9) return buf;

  // Gentle soft-saturation to tame resonant peaks musically without harsh clipping
  const normScale = maxAbs > 1 ? 1 / maxAbs : 1;
  const drive = 1.25;
  const tanhDrive = Math.tanh(drive);

  let postMax = 0;
  for (let i = 0; i < buf.length; i++) {
    const s = Math.tanh(buf[i] * normScale * drive) / tanhDrive;
    buf[i] = s;
    const a = Math.abs(s);
    if (a > postMax) postMax = a;
  }

  const gain = postMax > 0 ? targetPeak / postMax : 0;
  for (let i = 0; i < buf.length; i++) {
    buf[i] *= gain;
  }

  // Guarantee click-free 0 start & end
  const inSamp = Math.min(Math.floor(buf.length * 0.1), Math.round(fadeInSec * SAMPLE_RATE));
  for (let i = 0; i < inSamp; i++) {
    const p = i / Math.max(1, inSamp - 1);
    buf[i] *= 0.5 - 0.5 * Math.cos(Math.PI * p);
  }
  if (buf.length > 0) buf[0] = 0;

  const outSamp = Math.min(Math.floor(buf.length * 0.25), Math.round(fadeOutSec * SAMPLE_RATE));
  if (outSamp > 1) {
    const start = buf.length - outSamp;
    for (let i = start; i < buf.length; i++) {
      const p = (i - start) / (outSamp - 1);
      buf[i] *= 0.5 + 0.5 * Math.cos(Math.PI * p);
    }
    buf[buf.length - 1] = 0;
  }

  return buf;
}

/**
 * Write 24 kHz 16-bit mono PCM WAV with TPDF dithering.
 */
function writeWav(filePath, samples, rng) {
  const numSamples = samples.length;
  const dataSize = numSamples * (BITS_PER_SAMPLE / 8) * CHANNELS;
  const out = Buffer.alloc(44 + dataSize);

  out.write('RIFF', 0, 4, 'ascii');
  out.writeUInt32LE(36 + dataSize, 4);
  out.write('WAVE', 8, 4, 'ascii');

  out.write('fmt ', 12, 4, 'ascii');
  out.writeUInt32LE(16, 16); // PCM fmt chunk size
  out.writeUInt16LE(1, 20);  // PCM format
  out.writeUInt16LE(CHANNELS, 22);
  out.writeUInt32LE(SAMPLE_RATE, 24);
  out.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), 28);
  out.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32);
  out.writeUInt16LE(BITS_PER_SAMPLE, 34);

  out.write('data', 36, 4, 'ascii');
  out.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const dither = (rng() - rng()) / 32768;
    const scaled = Math.round((samples[i] + dither) * 32767);
    const clamped = scaled < -32767 ? -32767 : scaled > 32767 ? 32767 : scaled;
    out.writeInt16LE(clamped, offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, out);
  return out.length;
}

// Note frequency table (Hz)
const N = {
  D3: 146.83,
  F3: 174.61,
  A3: 220.00,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  Fs5: 739.99,
  G5: 783.99,
  A5: 880.00,
  B5: 987.77,
  C6: 1046.50,
  D6: 1174.66,
  E6: 1318.51,
  Fs6: 1479.98,
};

function buildSounds(rng) {
  const specs = [];

  // 1. ring-in.wav (~2.4s): warm melodic marimba/Rhodes Fmaj9 arpeggio loop
  specs.push({
    name: 'ring-in.wav',
    build: () => {
      const b = makeBuffer(2.40);
      // Warm bass anchor
      addWarmPad(b, 0.02, N.F3, 0.72, 0.22, { attackSec: 0.025, decayRate: 2.2 });
      addWarmPad(b, 0.58, N.C4, 0.85, 0.20, { attackSec: 0.03, decayRate: 2.0 });

      // Motif A (F4 - A4 - C5 - G5)
      addMarimba(b, 0.02, N.F4, 0.45, 0.48);
      addRhodes(b, 0.02, N.F4, 0.52, 0.26);
      addMarimba(b, 0.14, N.A4, 0.45, 0.50);
      addRhodes(b, 0.14, N.A4, 0.52, 0.28);
      addMarimba(b, 0.26, N.C5, 0.48, 0.52);
      addRhodes(b, 0.26, N.C5, 0.56, 0.30);
      addMarimba(b, 0.38, N.G5, 0.62, 0.48);
      addRhodes(b, 0.38, N.G5, 0.75, 0.30);

      // Motif B (A4 - C5 - E5 - F5)
      addMarimba(b, 0.58, N.A4, 0.45, 0.46);
      addRhodes(b, 0.58, N.A4, 0.55, 0.28);
      addMarimba(b, 0.70, N.C5, 0.45, 0.50);
      addRhodes(b, 0.70, N.C5, 0.55, 0.30);
      addMarimba(b, 0.82, N.E5, 0.52, 0.52);
      addRhodes(b, 0.82, N.E5, 0.65, 0.32);
      addMarimba(b, 0.95, N.F5, 0.85, 0.54);
      addRhodes(b, 0.95, N.F5, 1.05, 0.36, { decayRate: 2.6 });

      applyBiquad(b, 'highpass', 45);
      applyBiquad(b, 'lowpass', 6200);
      applyReverb(b, { wet: 0.28, decay: 0.46, damp: 0.52, tailFadeSec: 0.06 });
      return finalizeBuffer(b, 0.78, 0.002, 0.05);
    },
  });

  // 2. ring-video.wav (~2.4s): crystalline bright dual-chime loop distinct for direct video call
  specs.push({
    name: 'ring-video.wav',
    build: () => {
      const b = makeBuffer(2.40);
      // Warm harmonic bed in D Lydian/Major
      addWarmPad(b, 0.02, N.D4, 0.75, 0.22, { attackSec: 0.025, decayRate: 2.3 });
      addWarmPad(b, 0.62, N.A4, 0.85, 0.20, { attackSec: 0.025, decayRate: 2.1 });

      // Chime pair 1
      addGlassBell(b, 0.02, N.A5, 0.58, 0.46);
      addGlassBell(b, 0.04, N.D6, 0.62, 0.36);
      addGlassBell(b, 0.16, N.Fs5, 0.55, 0.42);
      addGlassBell(b, 0.18, N.E6, 0.65, 0.34);

      // Chime pair 2
      addGlassBell(b, 0.62, N.B5, 0.65, 0.46);
      addGlassBell(b, 0.64, N.Fs6, 0.72, 0.34);
      addGlassBell(b, 0.78, N.A5, 0.85, 0.44);
      addGlassBell(b, 0.80, N.D6, 0.98, 0.40, { decayRate: 3.1 });

      applyBiquad(b, 'highpass', 55);
      applyBiquad(b, 'lowpass', 7600);
      applyReverb(b, { wet: 0.34, decay: 0.52, damp: 0.42, tailFadeSec: 0.06 });
      return finalizeBuffer(b, 0.76, 0.002, 0.05);
    },
  });

  // 3. ring-out.wav (~2.6s): soft warm dual-note pulse for outgoing ring
  specs.push({
    name: 'ring-out.wav',
    build: () => {
      const b = makeBuffer(2.60);
      // Gentle comforting C major pulse 1
      addRhodes(b, 0.04, N.C4, 0.62, 0.40, { decayRate: 3.2, tineAmp: 0.04 });
      addRhodes(b, 0.04, N.G4, 0.62, 0.34, { decayRate: 3.4, tineAmp: 0.04 });
      addWarmPad(b, 0.04, N.D5, 0.56, 0.14, { attackSec: 0.04, decayRate: 3.0 });

      // Pulse 2 (answering fifth)
      addRhodes(b, 0.56, N.G4, 0.80, 0.42, { decayRate: 2.8, tineAmp: 0.045 });
      addRhodes(b, 0.56, N.C5, 0.88, 0.36, { decayRate: 2.9, tineAmp: 0.045 });

      applyBiquad(b, 'highpass', 45);
      applyBiquad(b, 'lowpass', 4400);
      applyReverb(b, { wet: 0.26, decay: 0.44, damp: 0.58, tailFadeSec: 0.06 });
      return finalizeBuffer(b, 0.66, 0.003, 0.05);
    },
  });

  // 4. voice-join.wav (~0.35s): ascending warm wooden chime
  specs.push({
    name: 'voice-join.wav',
    build: () => {
      const b = makeBuffer(0.35);
      addMarimba(b, 0.005, N.C5, 0.22, 0.60);
      addRhodes(b, 0.005, N.C5, 0.24, 0.24);
      addMarimba(b, 0.085, N.G5, 0.25, 0.66, { decayRate: 5.8 });
      addRhodes(b, 0.085, N.G5, 0.25, 0.28, { decayRate: 5.0 });
      addGlassBell(b, 0.095, N.C6, 0.23, 0.16, { decayRate: 7.5 });

      applyBiquad(b, 'highpass', 50);
      applyBiquad(b, 'lowpass', 6400);
      applyReverb(b, { wet: 0.20, decay: 0.34, damp: 0.50, tailFadeSec: 0.03 });
      return finalizeBuffer(b, 0.68, 0.0015, 0.025);
    },
  });

  // 5. voice-leave.wav (~0.35s): descending soft chime
  specs.push({
    name: 'voice-leave.wav',
    build: () => {
      const b = makeBuffer(0.35);
      addMarimba(b, 0.005, N.G4, 0.22, 0.56);
      addRhodes(b, 0.005, N.G4, 0.24, 0.24);
      addMarimba(b, 0.090, N.C4, 0.25, 0.62, { decayRate: 5.5 });
      addRhodes(b, 0.090, N.C4, 0.25, 0.28, { decayRate: 4.8 });

      applyBiquad(b, 'highpass', 45);
      applyBiquad(b, 'lowpass', 4600);
      applyReverb(b, { wet: 0.18, decay: 0.32, damp: 0.58, tailFadeSec: 0.03 });
      return finalizeBuffer(b, 0.64, 0.0015, 0.025);
    },
  });

  // 6. mute.wav (~0.18s): subtle soft muted low thump/click
  specs.push({
    name: 'mute.wav',
    build: () => {
      const b = makeBuffer(0.18);
      addSoftPop(b, 0.003, 250, 112, 0.085, 0.72, { decayRate: 24, secondHarm: 0.18 });
      addSoftPop(b, 0.004, 420, 210, 0.045, 0.26, { decayRate: 36, secondHarm: 0.08 });

      applyBiquad(b, 'highpass', 45);
      applyBiquad(b, 'lowpass', 2200);
      applyReverb(b, { wet: 0.08, decay: 0.22, damp: 0.65, tailFadeSec: 0.02 });
      return finalizeBuffer(b, 0.54, 0.001, 0.018);
    },
  });

  // 7. unmute.wav (~0.20s): subtle crisp ascending pop
  specs.push({
    name: 'unmute.wav',
    build: () => {
      const b = makeBuffer(0.20);
      addSoftPop(b, 0.003, 270, 440, 0.070, 0.56, { decayRate: 22, secondHarm: 0.16 });
      addGlassBell(b, 0.040, N.A5, 0.145, 0.36, { decayRate: 12.0, tineAmp: 0.04 });

      applyBiquad(b, 'highpass', 55);
      applyBiquad(b, 'lowpass', 5400);
      applyReverb(b, { wet: 0.12, decay: 0.24, damp: 0.48, tailFadeSec: 0.02 });
      return finalizeBuffer(b, 0.56, 0.001, 0.018);
    },
  });

  // 8. deafen.wav (~0.24s): muted dual-step down
  specs.push({
    name: 'deafen.wav',
    build: () => {
      const b = makeBuffer(0.24);
      addMarimba(b, 0.004, N.D4, 0.12, 0.54, { decayRate: 13.0, tineAmp: 0.04 });
      addSoftPop(b, 0.004, 300, 220, 0.06, 0.24, { decayRate: 25 });
      addMarimba(b, 0.072, N.A3, 0.155, 0.64, { decayRate: 10.5, tineAmp: 0.03 });
      addSoftPop(b, 0.072, 220, 145, 0.075, 0.28, { decayRate: 22 });

      applyBiquad(b, 'highpass', 45);
      applyBiquad(b, 'lowpass', 2600);
      applyReverb(b, { wet: 0.10, decay: 0.24, damp: 0.62, tailFadeSec: 0.02 });
      return finalizeBuffer(b, 0.58, 0.001, 0.02);
    },
  });

  // 9. undeafen.wav (~0.24s): bright dual-step up
  specs.push({
    name: 'undeafen.wav',
    build: () => {
      const b = makeBuffer(0.24);
      addMarimba(b, 0.004, N.A4, 0.13, 0.54, { decayRate: 10.5 });
      addGlassBell(b, 0.070, N.E5, 0.16, 0.56, { decayRate: 8.5 });
      addGlassBell(b, 0.078, N.A5, 0.15, 0.24, { decayRate: 9.5 });

      applyBiquad(b, 'highpass', 55);
      applyBiquad(b, 'lowpass', 6200);
      applyReverb(b, { wet: 0.16, decay: 0.28, damp: 0.45, tailFadeSec: 0.02 });
      return finalizeBuffer(b, 0.60, 0.001, 0.02);
    },
  });

  // 10. user-moved.wav (~0.32s): whoosh + airy chime
  specs.push({
    name: 'user-moved.wav',
    build: () => {
      const b = makeBuffer(0.32);
      addAiryWhoosh(b, 0.002, 0.19, 0.28, 420, 1850, 820, rng);
      addGlassBell(b, 0.045, N.E5, 0.22, 0.46, { decayRate: 6.8 });
      addGlassBell(b, 0.105, N.B5, 0.20, 0.50, { decayRate: 6.4 });

      applyBiquad(b, 'highpass', 55);
      applyBiquad(b, 'lowpass', 6400);
      applyReverb(b, { wet: 0.24, decay: 0.36, damp: 0.48, tailFadeSec: 0.03 });
      return finalizeBuffer(b, 0.66, 0.0015, 0.025);
    },
  });

  // 11. dm-notify.wav (~0.38s): gentle glass bell notification
  specs.push({
    name: 'dm-notify.wav',
    build: () => {
      const b = makeBuffer(0.38);
      addGlassBell(b, 0.005, N.F5, 0.26, 0.52, { decayRate: 5.5 });
      addRhodes(b, 0.005, N.F5, 0.26, 0.20, { decayRate: 5.5 });
      addGlassBell(b, 0.088, N.C6, 0.28, 0.58, { decayRate: 4.8 });
      addRhodes(b, 0.088, N.C6, 0.28, 0.18, { decayRate: 5.0 });

      applyBiquad(b, 'highpass', 55);
      applyBiquad(b, 'lowpass', 6800);
      applyReverb(b, { wet: 0.30, decay: 0.42, damp: 0.46, tailFadeSec: 0.035 });
      return finalizeBuffer(b, 0.70, 0.0015, 0.03);
    },
  });

  // 12. msg-send.wav (~0.14s): ultra-subtle soft bubble pop
  specs.push({
    name: 'msg-send.wav',
    build: () => {
      const b = makeBuffer(0.14);
      addSoftPop(b, 0.002, 330, 680, 0.055, 0.72, { decayRate: 30, secondHarm: 0.10 });

      applyBiquad(b, 'highpass', 75);
      applyBiquad(b, 'lowpass', 3600);
      applyReverb(b, { wet: 0.08, decay: 0.20, damp: 0.55, tailFadeSec: 0.015 });
      return finalizeBuffer(b, 0.40, 0.001, 0.014);
    },
  });

  // 13. stream-start.wav (~0.42s): energetic clean rising chord
  specs.push({
    name: 'stream-start.wav',
    build: () => {
      const b = makeBuffer(0.42);
      addWarmPad(b, 0.06, N.C4, 0.34, 0.20, { attackSec: 0.04, decayRate: 3.0 });
      addWarmPad(b, 0.08, N.G4, 0.32, 0.20, { attackSec: 0.04, decayRate: 3.0 });
      addRhodes(b, 0.005, N.C5, 0.26, 0.46, { decayRate: 5.2 });
      addRhodes(b, 0.055, N.E5, 0.26, 0.48, { decayRate: 5.0 });
      addRhodes(b, 0.105, N.G5, 0.28, 0.52, { decayRate: 4.5 });
      addGlassBell(b, 0.155, N.D6, 0.25, 0.48, { decayRate: 4.8 });

      applyBiquad(b, 'highpass', 50);
      applyBiquad(b, 'lowpass', 6800);
      applyReverb(b, { wet: 0.25, decay: 0.38, damp: 0.46, tailFadeSec: 0.03 });
      return finalizeBuffer(b, 0.72, 0.0015, 0.03);
    },
  });

  // 14. stream-stop.wav (~0.34s): soft descending resolution
  specs.push({
    name: 'stream-stop.wav',
    build: () => {
      const b = makeBuffer(0.34);
      addRhodes(b, 0.005, N.G5, 0.18, 0.42, { decayRate: 6.2 });
      addRhodes(b, 0.010, N.D5, 0.18, 0.36, { decayRate: 6.2 });
      addRhodes(b, 0.085, N.C5, 0.24, 0.52, { decayRate: 4.8 });
      addRhodes(b, 0.090, N.E4, 0.24, 0.34, { decayRate: 4.8 });

      applyBiquad(b, 'highpass', 45);
      applyBiquad(b, 'lowpass', 4800);
      applyReverb(b, { wet: 0.20, decay: 0.32, damp: 0.56, tailFadeSec: 0.03 });
      return finalizeBuffer(b, 0.66, 0.0015, 0.028);
    },
  });

  // 15. chest-open.wav (~0.65s): sparkling mystery shimmer
  specs.push({
    name: 'chest-open.wav',
    build: () => {
      const b = makeBuffer(0.65);
      addAiryWhoosh(b, 0.005, 0.34, 0.22, 500, 2600, 1400, rng);
      addWarmPad(b, 0.10, N.F4, 0.52, 0.26, { attackSec: 0.07, decayRate: 2.4 });
      addWarmPad(b, 0.14, N.C5, 0.48, 0.24, { attackSec: 0.07, decayRate: 2.5 });

      const notes = [N.F4, N.A4, N.C5, N.E5, N.G5, N.B5, N.C6];
      notes.forEach((freq, idx) => {
        const t = 0.015 + idx * 0.056;
        const dur = Math.max(0.18, 0.62 - t);
        addGlassBell(b, t, freq, dur, 0.34 + idx * 0.025, { decayRate: 4.4 });
      });

      applyBiquad(b, 'highpass', 50);
      applyBiquad(b, 'lowpass', 7600);
      applyReverb(b, { wet: 0.36, decay: 0.54, damp: 0.42, tailFadeSec: 0.045 });
      return finalizeBuffer(b, 0.78, 0.002, 0.04);
    },
  });

  // 16. legendary-win.wav (~0.95s): triumphant warm harmonic chord fanfare
  specs.push({
    name: 'legendary-win.wav',
    build: () => {
      const b = makeBuffer(0.95);
      // Heroic pickup into D major 9 chord fanfare
      addRhodes(b, 0.01, N.D4, 0.22, 0.42, { decayRate: 5.5 });
      addRhodes(b, 0.01, N.A4, 0.22, 0.36, { decayRate: 5.5 });
      addRhodes(b, 0.11, N.A4, 0.22, 0.44, { decayRate: 5.0 });
      addRhodes(b, 0.11, N.D5, 0.22, 0.44, { decayRate: 5.0 });

      // Main triumphant chord at 0.22s
      addWarmPad(b, 0.21, N.D3, 0.70, 0.28, { attackSec: 0.025, decayRate: 2.1 });
      addWarmPad(b, 0.21, N.A3, 0.70, 0.26, { attackSec: 0.025, decayRate: 2.1 });
      addRhodes(b, 0.22, N.D4, 0.68, 0.40, { decayRate: 2.4 });
      addRhodes(b, 0.22, N.Fs5 / 2, 0.68, 0.36, { decayRate: 2.4 }); // F#4
      addRhodes(b, 0.22, N.A4, 0.68, 0.38, { decayRate: 2.3 });
      addRhodes(b, 0.22, N.E5, 0.68, 0.34, { decayRate: 2.4 });

      // Sparkle crown cascade on top
      addGlassBell(b, 0.24, N.Fs5, 0.64, 0.34, { decayRate: 3.0 });
      addGlassBell(b, 0.30, N.A5, 0.60, 0.36, { decayRate: 2.9 });
      addGlassBell(b, 0.36, N.D6, 0.56, 0.40, { decayRate: 2.6 });
      addGlassBell(b, 0.43, N.E6, 0.50, 0.32, { decayRate: 2.8 });

      applyBiquad(b, 'highpass', 42);
      applyBiquad(b, 'lowpass', 7200);
      applyReverb(b, { wet: 0.36, decay: 0.58, damp: 0.45, tailFadeSec: 0.055 });
      return finalizeBuffer(b, 0.85, 0.002, 0.05);
    },
  });

  return specs;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rng = createRng(0xE91C4A57);
  const specs = buildSounds(rng);

  let totalBytes = 0;
  for (const spec of specs) {
    const samples = spec.build();
    const outPath = path.join(OUT_DIR, spec.name);
    const bytes = writeWav(outPath, samples, rng);
    totalBytes += bytes;
    const durMs = Math.round((samples.length / SAMPLE_RATE) * 1000);
    console.log(`Generated ${spec.name.padEnd(20)} ${String(durMs).padStart(4)} ms   ${String(bytes).padStart(7)} bytes`);
  }

  console.log(`\nTotal: ${specs.length} files, ${totalBytes} bytes (${(totalBytes / 1024).toFixed(1)} KB) in ${OUT_DIR}`);
}

main();
