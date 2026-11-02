'use strict';
// Genera build/icon.png, app/icon.png y build/icon.ico (multi-resolución 16,32,48,64,128,256)
// con el monograma minimalista "EK" para que tanto EpicKast.exe como el instalador NSIS
// muestren el icono personalizado en Escritorio, Barra de tareas e Instalador.
const zlib = require('node:zlib'), fs = require('node:fs'), path = require('node:path');
const lerp = (a, b, t) => a + (b - a) * t;

function sdSeg(x, y, ax, ay, bx, by) {
  const pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h);
}
const inBox = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

// Corte diagonal derecho para las barras de la E
const inSlantBar = (u, v, x0, y0, xTopRight, xBotRight, y1) => {
  if (v < y0 || v > y1 || u < x0) return false;
  const t = (v - y0) / (y1 - y0);
  return u <= lerp(xTopRight, xBotRight, t);
};

function sample(u, v) {
  const r = 30, m = 4;
  const cx = Math.min(Math.max(u, m + r), 128 - m - r);
  const cy = Math.min(Math.max(v, m + r), 128 - m - r);
  const d = Math.hypot(u - cx, v - cy) - r;
  if (d > 0) return [0, 0, 0, 0];

  const t = (u + v) / 256;
  // Fondo obsidiana profundo con sutil brillo superior violeta
  let R = lerp(24, 9, t), G = lerp(26, 10, t), B = lerp(40, 16, t);
  if (v < 64) {
    const g = (1 - v / 64) * 0.16;
    R += 155 * g; G += 130 * g; B += 255 * g;
  }

  // Borde squircle violeta eléctrico
  if (d > -3.5) {
    R = lerp(168, 78, t); G = lerp(139, 46, t); B = lerp(255, 234, t);
  }

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

  if (isDot) {
    R = 46; G = 213; B = 115;
  } else if (isKChevron) {
    const tk = (v - 33) / 62;
    R = lerp(168, 88, tk); G = lerp(139, 56, tk); B = lerp(255, 242, tk);
  } else if (isE || isKStem) {
    R = 246; G = 247; B = 251;
  }

  return [R, G, B, 255];
}

function renderSize(N) {
  const px = Buffer.alloc(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          const u = ((x + (sx + 0.5) / 4) / N) * 128;
          const v = ((y + (sy + 0.5) / 4) / N) * 128;
          const s = sample(u, v);
          r += s[0] * s[3]; g += s[1] * s[3]; b += s[2] * s[3]; a += s[3];
        }
      }
      const i = (y * N + x) * 4;
      if (a > 0) {
        px[i] = Math.min(255, Math.round(r / a));
        px[i + 1] = Math.min(255, Math.round(g / a));
        px[i + 2] = Math.min(255, Math.round(b / a));
        px[i + 3] = Math.min(255, Math.round(a / 16));
      }
    }
  }
  return px;
}

const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };

function encodePng(N, px) {
  const raw = Buffer.alloc((N * 4 + 1) * N);
  for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; px.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Convierte RGBA a bloque DIB/BMP (BITMAPINFOHEADER + BGRA bottom-up + máscara AND) requerido por NSIS makensis y rcedit
function encodeDib(N, px) {
  const maskRowBytes = Math.ceil(N / 32) * 4;
  const xorSize = N * N * 4;
  const andSize = maskRowBytes * N;
  const buf = Buffer.alloc(40 + xorSize + andSize);
  buf.writeUInt32LE(40, 0);        // biSize
  buf.writeInt32LE(N, 4);          // biWidth
  buf.writeInt32LE(N * 2, 8);      // biHeight (2x por incluir máscara AND)
  buf.writeUInt16LE(1, 12);        // biPlanes
  buf.writeUInt16LE(32, 14);       // biBitCount
  buf.writeUInt32LE(0, 16);        // biCompression (BI_RGB)
  buf.writeUInt32LE(xorSize + andSize, 20);
  for (let y = 0; y < N; y++) {
    const srcY = N - 1 - y; // bottom-up
    for (let x = 0; x < N; x++) {
      const si = (srcY * N + x) * 4;
      const di = 40 + (y * N + x) * 4;
      buf[di + 0] = px[si + 2]; // B
      buf[di + 1] = px[si + 1]; // G
      buf[di + 2] = px[si + 0]; // R
      buf[di + 3] = px[si + 3]; // A
      if (px[si + 3] < 128) {
        const byteIdx = 40 + xorSize + y * maskRowBytes + (x >> 3);
        buf[byteIdx] |= 0x80 >> (x & 7);
      }
    }
  }
  return buf;
}

const sizes = [16, 32, 48, 64, 128, 256];
const frames = sizes.map((s) => {
  const px = renderSize(s);
  return { size: s, px, data: encodeDib(s, px) };
});
const png256 = encodePng(256, frames[frames.length - 1].px);

const icoHeader = Buffer.alloc(6 + frames.length * 16);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(frames.length, 4);

let offset = icoHeader.length;
frames.forEach((f, idx) => {
  const base = 6 + idx * 16;
  icoHeader[base + 0] = f.size === 256 ? 0 : f.size;
  icoHeader[base + 1] = f.size === 256 ? 0 : f.size;
  icoHeader[base + 2] = 0;
  icoHeader[base + 3] = 0;
  icoHeader.writeUInt16LE(1, base + 4);
  icoHeader.writeUInt16LE(32, base + 6);
  icoHeader.writeUInt32LE(f.data.length, base + 8);
  icoHeader.writeUInt32LE(offset, base + 12);
  offset += f.data.length;
});

const icoBuf = Buffer.concat([icoHeader, ...frames.map((f) => f.data)]);
const out = path.join(__dirname, '..', 'build');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon.png'), png256);
fs.writeFileSync(path.join(out, 'icon.ico'), icoBuf);
fs.writeFileSync(path.join(__dirname, '..', 'app', 'icon.png'), png256);
console.log(`Logo EK multi-resolución generado -> PNG: ${png256.length} B, ICO (${sizes.join(',')}px): ${icoBuf.length} B`);
