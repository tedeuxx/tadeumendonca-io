// Compiles every ```mermaid fence in the long-form bodies to inline SVG, at BUILD time (#170).
// Run: `npm run gen-diagrams`. Output: src/content/generated/diagrams.json, committed.
//
// WHY BUILD TIME AND NOT RUNTIME. The site is fully static with no runtime XHR (ADR-0004), and the
// /architecture page has to be readable by a crawler with JavaScript off — a client-side mermaid would
// ship ~500kB to every reader to draw a picture that never changes. Inline SVG rather than an <img>, so
// the labels are real text: crawlable, selectable, and readable by a screen reader.
//
// WHY PLAYWRIGHT AND NOT @mermaid-js/mermaid-cli. Mermaid has no pure-Node renderer — it needs a DOM
// either way — so the choice is only WHICH browser. mermaid-cli brings Puppeteer, which downloads its
// browser in a POSTINSTALL script, and ADR-0021's amendment mandates `npm ci --ignore-scripts` in CI.
// It would therefore install without a browser here by construction: not a preference, a policy
// collision. Playwright's Chromium is already installed for the prerender, /cv.pdf and the E2E, and
// gen-og-default.mjs is the working precedent for driving it as a build tool.
//
// The site fonts are embedded as data: URIs for the same reason gen-og-default.mjs embeds them, and it
// matters MORE here: mermaid sizes every node box from the browser's MEASURED text width. Against a
// fallback font the boxes are laid out for metrics the page will never use, and every label overflows
// its box — on a machine other than the author's, silently.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { collectFences, spacingFor } from './diagram-source.mjs';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src', 'content');
const outFile = join(root, 'src', 'content', 'generated', 'diagrams.json');
const fontsDir = join(root, 'node_modules', '@fontsource');

const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(join(fontsDir, pkg, 'files', file)).toString('base64')}`;
const grotesk = font('space-grotesk', 'space-grotesk-latin-500-normal.woff2');
const mono = font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2');

// The UMD build, not the ESM one. `addScriptTag({ type: 'module' })` evaluates in module scope, so the
// ESM bundle's exports never reach `window` and `window.mermaid` is undefined — a failure that looks
// like a mermaid bug and is a module-scope one. The UMD bundle assigns the global itself.
const mermaidJs = readFileSync(join(root, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'), 'utf8');

// Brutalist mono (ADR-0008): near-black, off-white, ONE accent, radius 0, no shadow, no gradient. A
// default mermaid theme violates every one of those, which is why nothing here is left to the default.
const THEME = {
  theme: 'base',
  // Set at the TOP LEVEL as well as under `flowchart`. The nested one alone does not take effect in
  // mermaid 11 — labels still render as <foreignObject> HTML, which defeats the reason inline SVG was
  // chosen over an image: text a crawler and a screen reader can actually read.
  htmlLabels: false,
  themeVariables: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '15px',
    // The page is NEAR-BLACK, not off-white — `--background: #0A0A0A`, `--foreground: #F5F4EF`. The first
    // version of this theme had it backwards and set lineColor to the near-black, which drew every arrow
    // in the page's own background colour. The diagram rendered with boxes and no visible edges.
    //
    // Nothing caught it, and that is the useful part: the palette assertion checks MEMBERSHIP, not
    // CONTRAST. Every colour was legal and the picture was unreadable. It took rendering the page and
    // looking at it — which is exactly why the layout decision was reserved to be taken against a draft.
    primaryColor: '#0A0A0A',
    primaryTextColor: '#F5F4EF',
    primaryBorderColor: '#F5F4EF',
    lineColor: '#F5F4EF',
    secondaryColor: '#0A0A0A',
    tertiaryColor: '#0A0A0A',
    background: '#0A0A0A',
    mainBkg: '#0A0A0A',
    clusterBkg: '#0A0A0A',
    clusterBorder: '#F5F4EF',
    edgeLabelBackground: '#0A0A0A',
    textColor: '#F5F4EF',
    nodeTextColor: '#F5F4EF',
    titleColor: '#F5F4EF',
    arrowheadColor: '#F5F4EF',
    // mermaid emits its error styles into every diagram's <style> block whether or not anything failed,
    // and their defaults are off-palette. Pinned so the palette assertion reads the diagram rather than
    // dead CSS — and so a diagram that DOES error still looks like this site.
    errorBkgColor: '#0A0A0A',
    errorTextColor: '#F5F4EF',
  },
  // Real <text>, not <foreignObject> HTML: selectable, translatable, and survives being read as SVG.
  //
  // `rankSpacing`/`nodeSpacing` are NOT set here: they are merged in per fence from `spacingFor()`,
  // because the knob that controls a figure's WIDTH — the only dimension that sets its render scale on a
  // phone — depends on the flow direction the fence declares. See the note on that function (#473).
  flowchart: { htmlLabels: false, curve: 'linear', padding: 12 },
  securityLevel: 'strict',
};

// Before either write path, not just the happy one. The zero-fence early exit below used to write
// straight to outFile while this sat fifty lines lower, after the render loop — so on a tree where
// `generated/` had been removed it threw ENOENT instead of writing an empty artifact. Loud rather than
// wrong, but wrong for a reason that reads as a mermaid problem.
mkdirSync(join(root, 'src', 'content', 'generated'), { recursive: true });

const fences = collectFences(contentDir);
if (fences.length === 0) {
  console.log('::notice::no mermaid fences found — nothing to compile');
  writeFileSync(outFile, '{}\n');
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.setContent(
  `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family:'Space Grotesk'; font-weight:500; src:url('${grotesk}') format('woff2'); }
    @font-face { font-family:'JetBrains Mono'; font-weight:500; src:url('${mono}') format('woff2'); }
    body { margin:0; background:#F5F4EF; font-family:'JetBrains Mono',monospace; }
  </style></head><body><div id="out"></div></body></html>`,
);
// eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
await page.evaluate(() => document.fonts.ready);
await page.addScriptTag({ content: mermaidJs });
// The UMD bundle assigns the global asynchronously; without this the first render can race it and fail
// with "cannot read properties of undefined", which reads like a mermaid bug and is a timing one.
// eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
await page.waitForFunction(() => typeof window.mermaid?.render === 'function');

const out = {};
let failed = 0;

for (const { source, hash, file } of fences) {
  const where = `${relative(root, file)} (${hash})`;
  try {
    // The element id is derived from the HASH, not generated randomly. Mermaid's default random ids
    // would make every regeneration produce a different SVG for identical input, so the committed
    // artifact would churn on every run and its diff would never be reviewable.
    const svg = await page.evaluate(
      async ({ source, hash, theme }) => {
        // eslint-disable-next-line no-undef -- serialized and evaluated in the browser page, not in Node
        const mermaid = window.mermaid;
        mermaid.initialize({ startOnLoad: false, ...theme });
        const { svg } = await mermaid.render(`d-${hash}`, source);
        return svg;
      },
      {
        source,
        hash,
        theme: { ...THEME, flowchart: { ...THEME.flowchart, ...spacingFor(source) } },
      },
    );
    // Keyed by the NORMALISED SOURCE, not by the hash. The renderer looks a diagram up from the text it
    // finds in the markdown body, and hashing in the browser to do that would ship a sha256 into the
    // bundle and run it on every page load — to detect a mistake only makeable in this repo. The hash
    // survives as the SVG's element id, where determinism is what it is actually for.
    out[source] = svg;
  } catch (err) {
    // Loud, and it names the file — a diagram that fails to parse must not become a blank box on a
    // published page. This is the whole reason the failure mode is build-time (see ADR-0040).
    console.error(`✗ ${where}\n  ${err instanceof Error ? err.message : String(err)}`);
    failed += 1;
  }
}

await browser.close();

if (failed > 0) {
  // No partial artifact. A half-written diagrams.json would make the NEXT run's staleness check pass
  // for the diagrams that happened to compile, quietly shrinking the page instead of failing it.
  console.error(`\n${failed} diagram(s) failed to compile — diagrams.json NOT written.`);
  process.exit(1);
}

writeFileSync(outFile, `${JSON.stringify(out, null, 2)}\n`);
console.log(`Wrote ${relative(root, outFile)} with ${Object.keys(out).length} diagram(s).`);
