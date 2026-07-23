// Generates the site-wide default OG image (public/og-default.png, 1200x630) — the fallback og:image
// when a page/post has no explicit one. Composition is tuned for PRESENCE at the size people actually
// see it: an unfurl preview is ~320px wide (a 1:4 downscale), so the portrait and the name have to carry
// it — a purely typographic card reads as empty at that scale. Carries the same brand mark ("T-block")
// as public/favicon.svg and the app icon, so the identity is one system across every surface.
//
// Rendered as HTML and screenshotted with Playwright (already a devDependency — the same headless
// Chromium the prerender uses), so no image/canvas library is needed. The site fonts and the portrait
// are embedded as data: URIs so the card renders identically everywhere. Run: `npm run gen-og`.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');
const portrait = `data:image/jpeg;base64,${readFileSync(join(root, 'src', 'assets', 'avatar.jpg')).toString('base64')}`;

// The brand mark, inline — same 512-space geometry as favicon.svg / gen-icons.mjs.
const mark = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#FF5A00"/><g fill="#0A0A0A"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

// Brutalist mono: near-black canvas, one safety-orange accent, radius 0, no shadow/gradient.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${grotesk}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; }
  body { background:#0A0A0A; color:#F5F4EF; overflow:hidden;
    border-top:6px solid #2A2A2A; border-bottom:6px solid #2A2A2A; }
  .inner { height:100%; display:flex; align-items:center; gap:52px; padding:0 72px; }
  .photo { width:380px; height:380px; object-fit:cover; border:6px solid #F5F4EF; flex:none; }
  .col { display:flex; flex-direction:column; justify-content:center; min-width:0; }
  .wm { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:26px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:12px; margin-bottom:22px; }
  .wm .badge { width:44px; height:44px; flex:none; display:block; }
  .wm .io { color:#FF5A00; }
  .name { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:98px; line-height:0.9;
    letter-spacing:-0.035em; text-transform:uppercase; }
  .rule { height:5px; width:104px; background:#FF5A00; margin:24px 0 22px; }
  .title { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:25px; letter-spacing:0.06em;
    text-transform:uppercase; color:#F5F4EF; }
  .stack { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:21px; letter-spacing:0.06em;
    text-transform:uppercase; color:#B8B6AE; margin-top:10px; }
</style></head><body>
  <div class="inner">
    <img class="photo" src="${portrait}" alt="">
    <div class="col">
      <div class="wm"><span class="badge">${mark}</span>tadeumendonca<span class="io">.io</span></div>
      <div class="name">Luiz Tadeu<br>Mendonça</div>
      <div class="rule"></div>
      <div class="title">AI Engineer · Agentic Dev &amp; GenAI</div>
      <div class="stack">Python · TypeScript · AWS · 17y SDLC</div>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
// eslint-disable-next-line no-undef -- this callback is serialized and runs in the browser page
await page.evaluate(() => document.fonts.ready);
const out = join(root, 'public', 'og-default.png');
mkdirSync(join(root, 'public'), { recursive: true });
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log(`Wrote ${out} (1200x630)`);
