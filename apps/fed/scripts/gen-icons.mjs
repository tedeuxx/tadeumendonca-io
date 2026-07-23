// Generate the app icon from the brand mark — the "T-block": a solid safety-orange field with a heavy
// near-black T (Tadeu). Same mark as public/favicon.svg and the badge on the OG card, so the identity is
// one system across every surface. The site is not a PWA, so only the apple-touch-icon (referenced in
// index.html) is produced. Pure Node (zlib only): no native deps, no rasterizer, no network — fully
// reproducible; the glyph is drawn as rects and supersampled for anti-aliasing. Run: `npm run gen-icons`.
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(OUT, { recursive: true });

// Inverted from the site canvas on purpose: the mark's field is the accent so it stays visible on both
// light and dark tab strips / home screens, where a near-black tile disappears.
const BG = [255, 90, 0]; // #FF5A00 safety orange — the field
const FG = [10, 10, 10]; // #0A0A0A near-black — the glyph

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

// ---- The T, in normalized [0,1] icon space. Same geometry as favicon.svg's 512-space rects
// (crossbar 112..400 x 140..212; stem 220..292 x 140..372), so every surface draws one identical mark. ----
const BAR = { x0: 0.21875, x1: 0.78125, y0: 0.2734375, y1: 0.4140625 };
const STEM = { x0: 0.4296875, x1: 0.5703125, y0: 0.2734375, y1: 0.7265625 };
const inRect = (u, v, r) => u >= r.x0 && u <= r.x1 && v >= r.y0 && v <= r.y1;
const isInk = (u, v) => inRect(u, v, BAR) || inRect(u, v, STEM);

const render = (n) => {
  const rgb = Buffer.alloc(n * n * 3);
  const SS = 4; // supersample for clean edges at any size
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
