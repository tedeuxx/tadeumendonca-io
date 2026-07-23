// Generates the site-wide default OG image (public/og-default.png, 1200x630) — the fallback og:image
// when a page/post has no explicit one. It renders a real brutalist-mono card (name + title + wordmark)
// as HTML and screenshots it with Playwright (already a devDependency — same headless Chromium the
// prerender uses), so no image/canvas library is needed. The site fonts (Space Grotesk + JetBrains Mono)
// are embedded from @fontsource as base64 so the card renders identically everywhere. Run: `npm run gen-og`.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const fontsDir = join(root, 'node_modules', '@fontsource');

// Embed a woff2 as a data: URI so the card doesn't depend on network/system fonts.
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-700-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// Brutalist mono: near-black canvas, one safety-orange accent, radius 0, no shadow/gradient.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Space Grotesk'; font-weight: 700; src: url('${grotesk}') format('woff2'); }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 500; src: url('${mono}') format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    background: #0A0A0A; color: #F5F4EF;
    border-top: 6px solid #2A2A2A; border-bottom: 6px solid #2A2A2A;
    display: flex; align-items: stretch;
  }
  .bar { width: 20px; background: #FF5A00; flex: none; }
  .content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 84px; }
  .wordmark { font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 30px;
    letter-spacing: 0.04em; color: #F5F4EF; margin-bottom: 40px; display: flex; align-items: center; gap: 12px; }
  .wordmark .tick { width: 12px; height: 40px; background: #FF5A00; }
  .wordmark .io { color: #FF5A00; }
  .name { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 104px; line-height: 0.92;
    letter-spacing: -0.03em; text-transform: uppercase; }
  .rule { height: 4px; width: 120px; background: #FF5A00; margin: 34px 0; }
  .title { font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 30px;
    letter-spacing: 0.06em; text-transform: uppercase; color: #B8B6AE; line-height: 1.35; max-width: 900px; }
  .title b { color: #F5F4EF; }
</style></head><body>
  <div class="bar"></div>
  <div class="content">
    <div class="wordmark"><span class="tick"></span>tadeumendonca<span class="io">.io</span></div>
    <div class="name">Luiz Tadeu<br>Mendonça</div>
    <div class="rule"></div>
    <div class="title"><b>AI Engineer</b> · Agentic Development &amp; GenAI Apps<br>Python · TypeScript · AWS · Terraform · 17y SDLC</div>
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
