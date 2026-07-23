// Generates the site-wide default OG image (public/og-default.png, 1200x630) — the fallback og:image
// when a page/post has no explicit one.
//
// It sells the PROMISE, not the person. The site's thesis is reader-first (the reader learning is the
// product; self-promotion is a by-product), so the card carries the hero's promise as a hook — a portrait
// + name card reads as a business card and contradicts that positioning. Composition is tuned for the size
// an unfurl is actually seen (~320px wide, a 1:4 downscale): one dominant line, everything else subordinate.
// Copy is English because the crawlable/OG baseline is pinned to English (ADR-0032).
//
// Carries the same brand mark ("T-block") as public/favicon.svg and the app icon, so the identity is one
// system across every surface. Rendered as HTML and screenshotted with Playwright (already a devDependency
// — the same headless Chromium the prerender uses), so no image/canvas library is needed; the site fonts
// are embedded as data: URIs so it renders identically everywhere. Run: `npm run gen-og`.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// The brand mark, inline — same 512-space geometry as favicon.svg / gen-icons.mjs.
const mark = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="#FF5A00"/><g fill="#0A0A0A"><rect x="112" y="140" width="288" height="72"/><rect x="220" y="140" width="72" height="232"/></g></svg>`;

// Brutalist mono: near-black canvas, one safety-orange accent, radius 0, no shadow/gradient.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family:'Space Grotesk'; font-weight:700; src:url('${grotesk}') format('woff2'); }
  @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1200px; height:630px; }
  body { background:#0A0A0A; color:#F5F4EF; overflow:hidden; padding:56px 76px;
    border-top:6px solid #2A2A2A; border-bottom:6px solid #2A2A2A; }
  .wm { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:26px; letter-spacing:0.04em;
    display:flex; align-items:center; gap:12px; }
  .wm .badge { width:42px; height:42px; flex:none; display:block; }
  .wm .io { color:#FF5A00; }
  .hook { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:118px; line-height:0.92;
    letter-spacing:-0.04em; text-transform:uppercase; margin-top:30px; }
  .hook .ac { color:#FF5A00; }
  .sub { font-family:'JetBrains Mono',monospace; font-weight:500; font-size:31px; letter-spacing:0.03em;
    margin-top:22px; }
  .meta { position:absolute; left:76px; bottom:44px; font-family:'JetBrains Mono',monospace; font-weight:500;
    font-size:20px; letter-spacing:0.1em; text-transform:uppercase; color:#B8B6AE; }
</style></head><body>
  <div class="wm"><span class="badge">${mark}</span>tadeumendonca<span class="io">.io</span></div>
  <div class="hook">Learn to build<br>with <span class="ac">AI</span></div>
  <div class="sub">from everyday life to production</div>
  <div class="meta">Agentic dev · AI-DLC / Loop Engineering · Open source</div>
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
