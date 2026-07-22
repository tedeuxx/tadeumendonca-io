// Generates the site-wide default OG image (public/og-default.png, 1200x630) — the fallback og:image
// when a post has no explicit one. Dependency-free: hand-encodes a PNG in the brutalist palette
// (near-black canvas, a safety-orange brand bar on the left, and a hairline rule framing the top and
// bottom edges). Run: `npm run gen-og`. A richer per-post card generator can come later.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const W = 1200;
const H = 630;
const BG = [10, 10, 10]; // #0A0A0A near-black
const BAR = [255, 90, 0]; // #FF5A00 safety orange — the single accent
const RULE = [42, 42, 42]; // #2A2A2A grid hairline
const BAR_W = 32;
const RULE_W = 4; // the heavy top/bottom rule of the brutalist frame

// Raw RGB scanlines, each prefixed by a filter byte (0 = none).
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  const row = y * (1 + W * 3);
  raw[row] = 0;
  for (let x = 0; x < W; x++) {
    const onRule = y < RULE_W || y >= H - RULE_W;
    const [r, g, b] = x < BAR_W ? BAR : onRule ? RULE : BG;
    const p = row + 1 + x * 3;
    raw[p] = r;
    raw[p + 1] = g;
    raw[p + 2] = b;
  }
}

// CRC32 (PNG chunks are CRC-checked).
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type: truecolor RGB
// 10,11,12 = compression/filter/interlace = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = resolve(import.meta.dirname, '..', 'public', 'og-default.png');
mkdirSync(resolve(import.meta.dirname, '..', 'public'), { recursive: true });
writeFileSync(out, png);
console.log(`Wrote ${out} (${png.length} bytes, ${W}x${H})`);
