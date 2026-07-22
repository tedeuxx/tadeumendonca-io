// Generate the app icon — a "TM" monogram (Tadeu Mendonça) in the accent orange on near-black.
// The site is not a PWA, so only the apple-touch-icon (referenced in index.html) is produced.
// Pure Node (zlib only): no native deps, no rasterizer, no network — fully reproducible. The glyphs
// are drawn as vector shapes and supersampled for anti-aliasing. These are PLACEHOLDER icons; swap in
// final artwork by replacing the PNG (and favicon.svg). Run: `node scripts/gen-icons.mjs`.
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

const BG = [10, 10, 10]; // #0A0A0A near-black
const FG = [255, 90, 0]; // #FF5A00 — safety orange, the site's single accent (--primary: 21 100% 50%)

// ---- PNG encoding (RGB, 8-bit) ----
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
};
const encodePNG = (n, rgb) => {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0);
  ihdr.writeUInt32BE(n, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const stride = n * 3;
  const raw = Buffer.alloc((stride + 1) * n);
  for (let y = 0; y < n; y++) rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
};

// ---- "TM.io" wordmark on a SINGLE line in normalized [0,1] icon space: caps "TM" + lowercase ".io",
// sharing one baseline. Content stays inside the maskable safe zone. ----
const CAPTOP = 0.38;
const BASE = 0.62; // shared baseline
const XHTOP = 0.47; // lowercase x-height top
const THc = 0.045; // caps stroke
const THl = 0.032; // lowercase stroke
const GT = { x0: 0.2075, x1: 0.3425 }; // T
const GM = { x0: 0.3625, x1: 0.5175 }; // M
const DOTX = 0.5625; // "."
const IX0 = 0.6025; // "i" stem left
const OCX = 0.7175; // "o" center

const distSeg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};
const disc = (u, v, cx, cy, r) => (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
const ring = (u, v, cx, cy, rO, rI) => {
  const d2 = (u - cx) ** 2 + (v - cy) ** 2;
  return d2 <= rO * rO && d2 >= rI * rI;
};

const isInk = (u, v) => {
  // T — top bar + center stem
  const tcx = (GT.x0 + GT.x1) / 2;
  if (u >= GT.x0 && u <= GT.x1 && v >= CAPTOP && v <= CAPTOP + THc) return true;
  if (u >= tcx - THc / 2 && u <= tcx + THc / 2 && v >= CAPTOP && v <= BASE) return true;
  // M — two verticals + two diagonals meeting at a middle valley
  const mcx = (GM.x0 + GM.x1) / 2;
  const midV = CAPTOP + 0.52 * (BASE - CAPTOP);
  if (u >= GM.x0 && u <= GM.x0 + THc && v >= CAPTOP && v <= BASE) return true;
  if (u >= GM.x1 - THc && u <= GM.x1 && v >= CAPTOP && v <= BASE) return true;
  if (v >= CAPTOP && v <= midV + THc) {
    if (distSeg(u, v, GM.x0 + THc / 2, CAPTOP, mcx, midV) <= THc / 2) return true;
    if (distSeg(u, v, GM.x1 - THc / 2, CAPTOP, mcx, midV) <= THc / 2) return true;
  }
  // "." — baseline dot
  if (disc(u, v, DOTX, BASE - 0.026, 0.026)) return true;
  // "i" — stem + tittle
  if (u >= IX0 && u <= IX0 + THl && v >= XHTOP && v <= BASE) return true;
  if (disc(u, v, IX0 + THl / 2, XHTOP - 0.045, 0.024)) return true;
  // "o" — ring
  const rO = (BASE - XHTOP) / 2;
  if (ring(u, v, OCX, (XHTOP + BASE) / 2, rO, rO - THl)) return true;
  return false;
};

const render = (n) => {
  const rgb = Buffer.alloc(n * n * 3);
  const SS = 4;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let cov = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (isInk((x + (sx + 0.5) / SS) / n, (y + (sy + 0.5) / SS) / n)) cov++;
        }
      }
      const a = cov / (SS * SS);
      const i = (y * n + x) * 3;
      rgb[i] = Math.round(BG[0] * (1 - a) + FG[0] * a);
      rgb[i + 1] = Math.round(BG[1] * (1 - a) + FG[1] * a);
      rgb[i + 2] = Math.round(BG[2] * (1 - a) + FG[2] * a);
    }
  }
  return rgb;
};

const icons = [['apple-touch-icon-180x180.png', 180]];
for (const [name, size] of icons) {
  writeFileSync(join(OUT, name), encodePNG(size, render(size)));
  console.log(`wrote public/${name}`);
}
