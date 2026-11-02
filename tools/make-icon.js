'use strict';
// Genera build/icon.png y build/icon.ico (256x256 con 4x4 supersampling anti-aliasing):
// Monograma minimalista elegante "EK" sobre squircle obsidiana con borde violeta.
const zlib = require('node:zlib'), fs = require('node:fs'), path = require('node:path');
const N = 256, px = Buffer.alloc(N * N * 4);
const lerp = (a, b, t) => a + (b - a) * t;

// Distancia firmada a un segmento (ax,ay)-(bx,by)
function sdSeg(x, y, ax, ay, bx, by) {
  const pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h);
}
// Punto dentro de caja [x0,x1]x[y0,y1]
const inBox = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

function sample(u, v) {
  // u,v en coordenadas 0..128 (igual que app/logo.svg)
  const r = 28, m = 4;
  const cx = Math.min(Math.max(u, m + r), 128 - m - r);
  const cy = Math.min(Math.max(v, m + r), 128 - m - r);
  const d = Math.hypot(u - cx, v - cy) - r;
  if (d > 0) return [0, 0, 0, 0];

  const t = (u + v) / 256;
  // Fondo obsidiana oscuro (#191b26 -> #0d0e14)
  let R = lerp(25, 13, t), G = lerp(27, 14, t), B = lerp(38, 20, t);

  // Borde elegante violeta de 3.2 unidades
  if (d > -3.2) {
    R = lerp(155, 100, t); G = lerp(130, 65, t); B = lerp(255, 240, t);
  }

  // Letra E minimalista (blanca #F4F5F8)
  const isE =
    inBox(u, v, 26, 34, 37, 94) ||
    inBox(u, v, 26, 34, 58, 44) ||
    inBox(u, v, 26, 59, 54, 69) ||
    inBox(u, v, 26, 84, 58, 94);

  // Asta vertical de la K (blanca #F4F5F8)
  const isKStem = inBox(u, v, 66, 34, 77, 94);

  // Chevron de la K (degradado violeta #9b82ff -> #6441f0)
  const isKChevron =
    inBox(u, v, 70, 34, 105, 94) &&
    (sdSeg(u, v, 76, 63, 97, 34) <= 5.6 || sdSeg(u, v, 76, 63, 98, 94) <= 5.6);

  if (isKChevron) {
    const tk = (v - 34) / 60;
    R = lerp(165, 108, tk); G = lerp(138, 75, tk); B = lerp(255, 248, tk);
  } else if (isE || isKStem) {
    R = 244; G = 245; B = 248;
  }

  return [R, G, B, 255];
}

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
      px[i] = Math.round(r / a);
      px[i + 1] = Math.round(g / a);
      px[i + 2] = Math.round(b / a);
      px[i + 3] = Math.round(a / 16);
    }
  }
}

const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const raw = Buffer.alloc((N * 4 + 1) * N);
for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; px.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
const hdr = Buffer.alloc(22); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4); hdr[6] = 0; hdr[7] = 0; hdr.writeUInt16LE(1, 10); hdr.writeUInt16LE(32, 12); hdr.writeUInt32LE(png.length, 14); hdr.writeUInt32LE(22, 18);
const out = path.join(__dirname, '..', 'build'); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon.png'), png);
fs.writeFileSync(path.join(out, 'icon.ico'), Buffer.concat([hdr, png]));
fs.writeFileSync(path.join(__dirname, '..', 'app', 'icon.png'), png);
console.log('Logo minimalista EK generado:', png.length, 'bytes');
