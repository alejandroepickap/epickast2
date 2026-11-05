'use strict';
// Genera todos los recursos visuales de Microsoft Store (AppX/MSIX) en build/appx/
// usando exclusivamente el monograma oficial "EK" de EpicKast (sin dependencias externas).
// Cumple con Microsoft Store Policy 10.1.1.11 (On Device Tiles):
// - Fondo transparente (RGBA 0,0,0,0)
// - Contenido centrado dentro de la zona segura (~76-80% central)
// - Formato ancho 310x150 y SplashScreen 620x300 diseñados en proporción 1:1 real (emblema EK + wordmark EPICKAST, sin estirar)
// - Variantes scale-100/125/150/200/400 y targetsize-16/24/32/48/256 (+ _altform-unplated) compatibles con makepri.exe

const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function sdSeg(x, y, ax, ay, bx, by) {
  const pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay;
  const denom = bax * bax + bay * bay;
  const h = denom > 0 ? clamp((pax * bax + pay * bay) / denom, 0, 1) : 0;
  return Math.hypot(pax - bax * h, pay - bay * h);
}

const inBox = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

const inSlantBar = (u, v, x0, y0, xTopRight, xBotRight, y1) => {
  if (v < y0 || v > y1 || u < x0) return false;
  const t = (v - y0) / (y1 - y0);
  return u <= lerp(xTopRight, xBotRight, t);
};

// Emblema oficial "EK" en espacio canónico [0..128] x [0..128]
// (con squircle completo dentro de [0..128] cuando margin = 0 para controlar la zona segura desde afuera)
function sampleEkEmblem(u, v, unplatedOnlyGlyphs = false) {
  if (u < 0 || u > 128 || v < 0 || v > 128) return [0, 0, 0, 0];

  const r = 28, m = 2;
  const cx = clamp(u, m + r, 128 - m - r);
  const cy = clamp(v, m + r, 128 - m - r);
  const d = Math.hypot(u - cx, v - cy) - r;
  if (d > 0) return [0, 0, 0, 0];

  // Letra E geométrica con cortes angulados
  const isE =
    inBox(u, v, 24, 33, 35, 95) ||
    inSlantBar(u, v, 24, 33, 58, 54, 44) ||
    inSlantBar(u, v, 24, 58.5, 53, 49.5, 68.5) ||
    inSlantBar(u, v, 24, 84, 58, 54, 95);

  // Asta vertical de la K
  const isKStem = inBox(u, v, 64, 33, 75.5, 95);

  // Ala derecha de la K (chevron violeta)
  const isKChevron =
    inBox(u, v, 69, 33, 106, 95) &&
    (sdSeg(u, v, 75, 63.2, 98, 33) <= 5.8 || sdSeg(u, v, 75, 63.2, 98.5, 95) <= 5.8);

  // Punto esmeralda de señal en vivo
  const isDot = Math.hypot(u - 101, v - 64) <= 4.3;

  const t = (u + v) / 256;
  // Fondo obsidiana profundo (#0b0e14 -> #181a28) con brillo superior violeta
  let R = lerp(24, 9, t), G = lerp(26, 10, t), B = lerp(40, 16, t);
  if (v < 64) {
    const g = (1 - v / 64) * 0.16;
    R += 155 * g; G += 130 * g; B += 255 * g;
  }

  // Borde squircle violeta eléctrico
  if (d > -4.0) {
    R = lerp(168, 78, t); G = lerp(139, 46, t); B = lerp(255, 234, t);
  }

  if (isDot) {
    R = 46; G = 213; B = 115;
  } else if (isKChevron) {
    const tk = (v - 33) / 62;
    R = lerp(168, 88, tk); G = lerp(139, 56, tk); B = lerp(255, 242, tk);
  } else if (isE || isKStem) {
    R = 246; G = 247; B = 251;
  } else if (unplatedOnlyGlyphs) {
    // Mantiene el squircle oscuro con borde para máxima legibilidad tanto en barra de tareas clara como oscura
  }

  return [R, G, B, 255];
}

// Sampler para íconos cuadrados: centra el emblema EK en el ~78% central (zona segura < 80%)
// con fondo 100% transparente alrededor.
function sampleSquareTile(nx, ny, safeFraction = 0.78) {
  const margin = (1 - safeFraction) / 2;
  const u = ((nx - margin) / safeFraction) * 128;
  const v = ((ny - margin) / safeFraction) * 128;
  return sampleEkEmblem(u, v, false);
}

// Geometría vectorial SDF para las letras "EPICKAST" en el formato ancho (Wide310x150 y SplashScreen 620x300)
// Cada glifo está definido en coordenadas locales [0..10] x [0..14] con grosor de trazo constante
function glyphDist(ch, gx, gy) {
  const seg = (ax, ay, bx, by) => sdSeg(gx, gy, ax, ay, bx, by);
  switch (ch) {
    case 'E':
      return Math.min(seg(1.5, 1, 1.5, 13), seg(1.5, 1, 8.5, 1), seg(1.5, 7, 7.2, 7), seg(1.5, 13, 8.5, 13));
    case 'P':
      return Math.min(
        seg(1.5, 1, 1.5, 13),
        seg(1.5, 1, 6.8, 1),
        seg(6.8, 1, 8.5, 2.8),
        seg(8.5, 2.8, 8.5, 5.2),
        seg(8.5, 5.2, 6.8, 7),
        seg(1.5, 7, 6.8, 7)
      );
    case 'I':
      return Math.min(seg(5, 1, 5, 13), seg(2.2, 1, 7.8, 1), seg(2.2, 13, 7.8, 13));
    case 'C':
      return Math.min(
        seg(8.2, 2.8, 6.5, 1),
        seg(6.5, 1, 3.2, 1),
        seg(3.2, 1, 1.5, 3),
        seg(1.5, 3, 1.5, 11),
        seg(1.5, 11, 3.2, 13),
        seg(3.2, 13, 6.5, 13),
        seg(6.5, 13, 8.2, 11.2)
      );
    case 'K':
      return Math.min(seg(1.5, 1, 1.5, 13), seg(2.0, 7.2, 8.3, 1), seg(2.8, 6.4, 8.5, 13));
    case 'A':
      return Math.min(seg(1.2, 13, 5.0, 1), seg(5.0, 1, 8.8, 13), seg(2.6, 8.8, 7.4, 8.8));
    case 'S':
      return Math.min(
        seg(8.0, 2.5, 6.2, 1),
        seg(6.2, 1, 3.0, 1),
        seg(3.0, 1, 1.5, 2.6),
        seg(1.5, 2.6, 1.5, 5.2),
        seg(1.5, 5.2, 3.2, 6.8),
        seg(3.2, 6.8, 6.8, 7.2),
        seg(6.8, 7.2, 8.5, 8.8),
        seg(8.5, 8.8, 8.5, 11.4),
        seg(8.5, 11.4, 6.8, 13),
        seg(6.8, 13, 3.0, 13),
        seg(3.0, 13, 1.5, 11.4)
      );
    case 'T':
      return Math.min(seg(1.0, 1, 9.0, 1), seg(5.0, 1, 5.0, 13));
    default:
      return 999;
  }
}

// Sampler para formato ancho 310x150 (y SplashScreen 620x300):
// - Fondo exterior 100% transparente (RGBA 0,0,0,0)
// - Insignia ancha redondeada centrada dentro de la zona segura (~78.7% ancho [33..277] x ~72% alto [21..129]):
//   * Izquierda: Monograma "EK" en proporción 1:1 real (sin deformar ni estirar)
//   * Divisor vertical sutil
//   * Derecha: Wordmark geométrico "EPICKAST" + indicador esmeralda y barra violeta
function sampleWideTile(nx, ny) {
  const wx = nx * 310;
  const wy = ny * 150;

  // Caja segura central: x en [33..277] (244px = 78.7%), y en [21..129] (108px = 72.0%)
  const x0 = 33, x1 = 277, y0 = 21, y1 = 129, r = 22;
  const cx = clamp(wx, x0 + r, x1 - r);
  const cy = clamp(wy, y0 + r, y1 - r);
  const d = Math.hypot(wx - cx, wy - cy) - r;
  if (d > 0) return [0, 0, 0, 0];

  const t = ((wx - x0) / (x1 - x0) + (wy - y0) / (y1 - y0)) * 0.5;
  // Fondo obsidiana profundo (#0b0e14 -> #181a28) con brillo superior violeta
  let R = lerp(24, 9, t), G = lerp(26, 10, t), B = lerp(40, 16, t);
  if (wy < 75) {
    const g = clamp((75 - wy) / 54, 0, 1) * 0.16;
    R += 155 * g; G += 130 * g; B += 255 * g;
  }

  // Borde squircle violeta eléctrico de la insignia ancha
  if (d > -3.2) {
    R = lerp(168, 78, t); G = lerp(139, 46, t); B = lerp(255, 234, t);
    return [R, G, B, 255];
  }

  // 1. Monograma "EK" en proporción 1:1 real a la izquierda ([46..126] x [35..115], 80x80 ud)
  if (wx >= 44 && wx <= 128 && wy >= 33 && wy <= 117) {
    const u = ((wx - 44) / 84) * 128;
    const v = ((wy - 33) / 84) * 128;
    const isE =
      inBox(u, v, 24, 33, 35, 95) ||
      inSlantBar(u, v, 24, 33, 58, 54, 44) ||
      inSlantBar(u, v, 24, 58.5, 53, 49.5, 68.5) ||
      inSlantBar(u, v, 24, 84, 58, 54, 95);
    const isKStem = inBox(u, v, 64, 33, 75.5, 95);
    const isKChevron =
      inBox(u, v, 69, 33, 106, 95) &&
      (sdSeg(u, v, 75, 63.2, 98, 33) <= 5.8 || sdSeg(u, v, 75, 63.2, 98.5, 95) <= 5.8);
    const isDot = Math.hypot(u - 101, v - 64) <= 4.3;

    if (isDot) return [46, 213, 115, 255];
    if (isKChevron) {
      const tk = clamp((v - 33) / 62, 0, 1);
      return [lerp(168, 88, tk), lerp(139, 56, tk), lerp(255, 242, tk), 255];
    }
    if (isE || isKStem) return [246, 247, 251, 255];
  }

  // Divisor vertical sutil en x = 133, y = [42..108]
  if (wx >= 132.2 && wx <= 133.8 && wy >= 42 && wy <= 108) {
    return [92, 82, 165, 255];
  }

  // 2. Wordmark "EPICKAST" en [146..262] x [50..76]
  const word = 'EPICKAST';
  const startX = 146;
  const startY = 50;
  const glyphW = 11.8;
  const glyphStep = 14.2;
  const scale = glyphW / 10.0;

  if (wx >= startX - 3 && wx <= startX + word.length * glyphStep + 3 && wy >= startY - 3 && wy <= startY + 22) {
    const idx = clamp(Math.floor((wx - startX) / glyphStep), 0, word.length - 1);
    const gx = (wx - (startX + idx * glyphStep)) / scale;
    const gy = (wy - startY) / scale;
    const gd = glyphDist(word[idx], gx, gy);
    if (gd <= 1.2) {
      if (idx < 4) {
        return [246, 247, 251, 255];
      } else {
        const tv = clamp(gy / 14, 0, 1);
        return [lerp(168, 108, tv), lerp(139, 76, tv), 255, 255];
      }
    }
  }

  // 3. Indicador esmeralda + barra de acento violeta bajo EPICKAST (y = 88)
  if (Math.hypot(wx - 150.5, wy - 88) <= 3.4) {
    return [46, 213, 115, 255];
  }
  if (wx >= 160 && wx <= 252 && wy >= 85.8 && wy <= 90.2) {
    const bcx = clamp(wx, 162.2, 249.8);
    if (Math.hypot(wx - bcx, wy - 88) <= 2.2) {
      const tb = (wx - 160) / (252 - 160);
      return [lerp(168, 78, tb), lerp(139, 46, tb), lerp(255, 234, tb), 255];
    }
  }

  return [R, G, B, 255];
}

// Renderizador con supersampling 4x4 (16 muestras por píxel) para bordes perfectamente antialiasados
function renderBitmap(W, H, samplerFn) {
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          const nx = (x + (sx + 0.5) / 4) / W;
          const ny = (y + (sy + 0.5) / 4) / H;
          const s = samplerFn(nx, ny);
          r += s[0] * s[3];
          g += s[1] * s[3];
          b += s[2] * s[3];
          a += s[3];
        }
      }
      const i = (y * W + x) * 4;
      if (a > 0) {
        px[i + 0] = Math.min(255, Math.round(r / a));
        px[i + 1] = Math.min(255, Math.round(g / a));
        px[i + 2] = Math.min(255, Math.round(b / a));
        px[i + 3] = Math.min(255, Math.round(a / 16));
      }
    }
  }
  return px;
}

const crcT = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (b) => {
  let c = 0xffffffff;
  for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (t, d) => {
  const l = Buffer.alloc(4);
  l.writeUInt32BE(d.length);
  const td = Buffer.concat([Buffer.from(t), d]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([l, td, c]);
};

function encodePngRect(W, H, px) {
  const rowStride = W * 4 + 1;
  const raw = Buffer.alloc(rowStride * H);
  for (let y = 0; y < H; y++) {
    raw[y * rowStride] = 0;
    px.copy(raw, y * rowStride + 1, y * W * 4, (y + 1) * W * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const appxDir = path.join(__dirname, '..', 'build', 'appx');
fs.mkdirSync(appxDir, { recursive: true });

// Limpia cualquier archivo previo en build/appx
for (const existing of fs.readdirSync(appxDir)) {
  fs.unlinkSync(path.join(appxDir, existing));
}

// Caché por (W, H, mode) para no recalcular resoluciones idénticas
const renderCache = new Map();
function writeAsset(filename, W, H, mode) {
  const key = `${W}x${H}:${mode}`;
  let pngBuf = renderCache.get(key);
  if (!pngBuf) {
    const sampler =
      mode === 'wide'
        ? sampleWideTile
        : mode === 'unplated'
        ? (nx, ny) => sampleSquareTile(nx, ny, 0.82)
        : (nx, ny) => sampleSquareTile(nx, ny, 0.78);
    const px = renderBitmap(W, H, sampler);
    pngBuf = encodePngRect(W, H, px);
    renderCache.set(key, pngBuf);
  }
  const outPath = path.join(appxDir, filename);
  fs.writeFileSync(outPath, pngBuf);
  return { filename, W, H, bytes: pngBuf.length };
}

const scales = [100, 125, 150, 200, 400];
const scaledDim = (base, s) => Math.round((base * s) / 100);

const generated = [];

// 1. StoreLogo.png (50x50 base + scales)
generated.push(writeAsset('StoreLogo.png', 50, 50, 'square'));
for (const s of scales) {
  const d = scaledDim(50, s);
  generated.push(writeAsset(`StoreLogo.scale-${s}.png`, d, d, 'square'));
}

// 2. Square44x44Logo.png (44x44 base + scales + targetsize-16/24/32/48/256 + _altform-unplated)
generated.push(writeAsset('Square44x44Logo.png', 44, 44, 'square'));
for (const s of scales) {
  const d = scaledDim(44, s);
  generated.push(writeAsset(`Square44x44Logo.scale-${s}.png`, d, d, 'square'));
}
const targetSizes = [16, 24, 32, 48, 256];
for (const ts of targetSizes) {
  generated.push(writeAsset(`Square44x44Logo.targetsize-${ts}.png`, ts, ts, 'square'));
  generated.push(writeAsset(`Square44x44Logo.targetsize-${ts}_altform-unplated.png`, ts, ts, 'unplated'));
}

// 3. Square150x150Logo.png (150x150 base + scales 100/125/150/200/400)
generated.push(writeAsset('Square150x150Logo.png', 150, 150, 'square'));
for (const s of scales) {
  const d = scaledDim(150, s);
  generated.push(writeAsset(`Square150x150Logo.scale-${s}.png`, d, d, 'square'));
}

// 4. Wide310x150Logo.png (310x150 base + scales 100/125/150/200/400)
generated.push(writeAsset('Wide310x150Logo.png', 310, 150, 'wide'));
for (const s of scales) {
  generated.push(writeAsset(`Wide310x150Logo.scale-${s}.png`, scaledDim(310, s), scaledDim(150, s), 'wide'));
}

// 5. SmallTile.png (71x71 base + scales 100/125/150/200/400)
generated.push(writeAsset('SmallTile.png', 71, 71, 'square'));
for (const s of scales) {
  const d = scaledDim(71, s);
  generated.push(writeAsset(`SmallTile.scale-${s}.png`, d, d, 'square'));
}

// 6. LargeTile.png (310x310 base + scales 100/125/150/200/400)
generated.push(writeAsset('LargeTile.png', 310, 310, 'square'));
for (const s of scales) {
  const d = scaledDim(310, s);
  generated.push(writeAsset(`LargeTile.scale-${s}.png`, d, d, 'square'));
}

// 7. SplashScreen.png (620x300 base + scales 100/125/150/200)
generated.push(writeAsset('SplashScreen.png', 620, 300, 'wide'));
for (const s of [100, 125, 150, 200]) {
  generated.push(writeAsset(`SplashScreen.scale-${s}.png`, scaledDim(620, s), scaledDim(300, s), 'wide'));
}

console.log(`Generados ${generated.length} archivos PNG en build/appx/:`);
for (const item of generated) {
  console.log(`  - ${item.filename.padEnd(48)} ${String(item.W).padStart(4)}x${String(item.H).padEnd(4)} (${item.bytes} B)`);
}
