import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { URL } from 'node:url';
import { PNG } from 'pngjs';
import { BinaryBitmap, DecodeHintType, HybridBinarizer, QRCodeReader, RGBLuminanceSource } from '@zxing/library';

import { articleKeysIn, diffCards } from './og-cards.mjs';
import { SITE_URL, neutralArticleRoutes, neutralArticleRouteFor } from './routes.mjs';
import {
  LOCALES,
  OVERLAY_INSET,
  QR_ECL,
  QR_MAX_PX,
  QR_MODULE_PX,
  QR_QUIET_MODULES,
  STORY_HEIGHT,
  STORY_WIDTH,
  TITLE_MAX_LINES,
  TITLE_SIZES,
  fitTitle,
  generatedStoryCardsIn,
  qrGeometry,
  qrMatrix,
  qrSvg,
  requiredStoryCards,
  storyCardPath,
  storyPayload,
  titleFrom,
} from './story-cards.mjs';
import { withShareUtm, STORY_CAMPAIGN } from '../src/lib/utm';
import { HELD_KEY } from '../src/content/heldFixture';

const root = resolve(import.meta.dirname, '..');
const blogDir = join(root, 'src', 'content', 'blog');
const storyDir = join(root, 'public', 'story');

const keys = articleKeysIn(blogDir);
const cards = requiredStoryCards(keys);

// ---------------------------------------------------------------------------------------------------
// Reading the committed PNG. Every assertion below is about the FILE that ships, not about what the
// generator would draw today: a stale card (a slug renamed, the campaign changed, the matrix drawn at the
// wrong offset) is exactly the defect this gate exists for, and only reading the artifact can see it.
// ---------------------------------------------------------------------------------------------------
const pngCache = new Map();
function readCard(path) {
  if (!pngCache.has(path)) pngCache.set(path, PNG.sync.read(readFileSync(join(root, 'public', path))));
  return pngCache.get(path);
}

const rgbAt = (png, x, y) => {
  const i = (y * png.width + x) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
};
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0').toUpperCase()).join('')}`;

/** Full-resolution luminance of a card, computed once per file. */
const lumCache = new Map();
function fullLuminance(png) {
  if (!lumCache.has(png)) {
    const out = new Float32Array(png.width * png.height);
    for (let p = 0, i = 0; p < out.length; p += 1, i += 4) {
      out[p] = 0.299 * png.data[i] + 0.587 * png.data[i + 1] + 0.114 * png.data[i + 2];
    }
    lumCache.set(png, out);
  }
  return lumCache.get(png);
}

/** Luminance of the whole card, box-averaged down by an integer `factor` (1 = full size). */
function luminance(png, factor) {
  const full = fullLuminance(png);
  const w = Math.floor(png.width / factor);
  const h = Math.floor(png.height / factor);
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let sum = 0;
      for (let dy = 0; dy < factor; dy += 1) {
        const row = (y * factor + dy) * png.width + x * factor;
        for (let dx = 0; dx < factor; dx += 1) sum += full[row + dx];
      }
      out[y * w + x] = sum / (factor * factor);
    }
  }
  return { lum: out, w, h };
}

function decode(png, factor) {
  const { lum, w, h } = luminance(png, factor);
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(lum, w, h)));
  return new QRCodeReader().decode(bitmap, new Map([[DecodeHintType.TRY_HARDER, true]])).getText();
}

describe('the Story card set matches the article set (criterion 1)', () => {
  it('has a card for every published article in both locales, and no card without one', () => {
    const { missing, orphaned } = diffCards(cards, generatedStoryCardsIn(storyDir));
    expect(missing.map((c) => c.path), 'run `npm run gen-story-cards`').toEqual([]);
    expect(orphaned, 'stale Story cards — run `npm run gen-story-cards`').toEqual([]);
  });

  // The false-green guard: an empty key list makes both lists above empty, having compared nothing.
  it('found articles at all, and exactly one card per article per locale', () => {
    expect(keys.length).toBeGreaterThan(0);
    expect(generatedStoryCardsIn(storyDir).length).toBe(keys.length * LOCALES.length);
  });

  it('requires and ships no card for a held article', () => {
    expect(keys).not.toContain(HELD_KEY);
    expect(generatedStoryCardsIn(storyDir).filter((p) => p.includes(HELD_KEY))).toEqual([]);
  });
});

describe('card naming — the path helper slice B consumes', () => {
  it('is keyed by the article key and the locale, in its own directory', () => {
    expect(storyCardPath('my-commitment', 'pt')).toBe('/story/my-commitment.pt.png');
    expect(storyCardPath('my-commitment', 'en')).toBe('/story/my-commitment.en.png');
  });

  // Keyed by KEY, never slug: this article's English slug is not its key, so a slug-named card would be a
  // different file. Asserted against the real content so the discriminating case is not hypothetical.
  it('does not follow the slug — the-problem-stopped-changing keeps its key', () => {
    expect(neutralArticleRouteFor('the-problem-stopped-changing')).toBe('/blog/from-cloud-to-ai-same-badge');
    expect(storyCardPath('the-problem-stopped-changing', 'en')).toBe('/story/the-problem-stopped-changing.en.png');
  });

  it('reads a missing directory as no cards', () => {
    expect(generatedStoryCardsIn(join(storyDir, 'does-not-exist'))).toEqual([]);
  });
});

describe('the QR payload is derived, never typed (criterion 4)', () => {
  // The value, pinned as a literal: everything below compares the generator against derivations, and a
  // derivation that drifted would agree with itself. This is the one place a wrong string goes red.
  it('is the neutral English-slug URL with the three Story parameters', () => {
    expect(storyPayload('my-commitment')).toBe(
      'https://tadeumendonca.io/blog/my-commitment?utm_source=instagram&utm_medium=social&utm_campaign=story-card',
    );
    expect(storyPayload('the-problem-stopped-changing')).toBe(
      'https://tadeumendonca.io/blog/from-cloud-to-ai-same-badge?utm_source=instagram&utm_medium=social&utm_campaign=story-card',
    );
  });

  // The coupling, for every article: each payload is one of the routes the prerender snapshots and the
  // sitemap advertises (ADR-0052), tagged through utm.ts — never a locale-prefixed URL.
  it('is, for every article, a prerendered neutral route tagged through withShareUtm', () => {
    const neutral = new Set(neutralArticleRoutes().map((r) => `${SITE_URL}${r.url}`));
    for (const key of keys) {
      const payload = storyPayload(key);
      const u = new URL(payload);
      const bare = `${u.origin}${u.pathname}`;
      expect(neutral.has(bare), `${key}: ${bare}`).toBe(true);
      expect(payload).toBe(withShareUtm(bare, 'instagram', STORY_CAMPAIGN));
      expect(u.pathname).not.toMatch(/^\/(pt|en)\//);
    }
  });

  it('refuses a held or unknown key rather than printing /blog/undefined', () => {
    expect(() => storyPayload(HELD_KEY)).toThrow(/held/);
    expect(() => storyPayload('no-such-article')).toThrow(/no-such-article/);
  });
});

describe('the committed QR decodes to the derived payload (criteria 2 and 3)', () => {
  // THE DETERMINISM GATE. Decoded from the committed PNG with an independent decoder, so a card left
  // stale by a slug rename or a campaign change is red here even though the file still exists.
  for (const { key, locale, path } of cards) {
    it(`${path} decodes at 100%, 50% and 33%`, { timeout: 30_000 }, () => {
      const png = readCard(path);
      const expected = storyPayload(key);
      expect(decode(png, 1), `${key}.${locale} at 100%`).toBe(expected);
      expect(decode(png, 2), `${key}.${locale} at 50%`).toBe(expected);
      expect(decode(png, 3), `${key}.${locale} at 33%`).toBe(expected);
    });
  }
});

describe('the QR matrix is deterministic (criterion 4)', () => {
  it('encodes one payload to equal matrices, and different payloads to different ones', () => {
    const p = storyPayload('my-commitment');
    expect(qrMatrix(p)).toEqual(qrMatrix(p));
    // The control: without it, a function returning a constant matrix would satisfy the line above.
    expect(qrMatrix(p)).not.toEqual(qrMatrix(storyPayload('blast-radius-supernova')));
  });

  it('uses error correction M or higher (criterion 6)', () => {
    expect(['M', 'Q', 'H']).toContain(QR_ECL);
  });
});

describe('the QR physical targets, read off the committed PNG (criteria 6 to 9)', () => {
  for (const { key, path } of cards) {
    it(`${path}: whole-pixel modules ≥ ${QR_MODULE_PX}px, a ≥4-module quiet zone, two colours, the matrix drawn exactly`, () => {
      const png = readCard(path);
      expect([png.width, png.height]).toEqual([STORY_WIDTH, STORY_HEIGHT]);
      const matrix = qrMatrix(storyPayload(key));
      const g = qrGeometry(matrix.length);
      expect(g.moduleSize).toBeGreaterThanOrEqual(QR_MODULE_PX);
      expect(QR_QUIET_MODULES).toBeGreaterThanOrEqual(4);

      // Every pixel of the panel is exactly one of the two colours — no anti-aliased module edge, no
      // accent, nothing overlaid. Light field, dark modules, never inverted.
      const seen = new Set();
      for (let y = g.top; y < g.top + g.size; y += 1) {
        for (let x = g.left; x < g.left + g.size; x += 1) seen.add(hex(rgbAt(png, x, y)));
      }
      expect([...seen].sort((a, b) => a.localeCompare(b))).toEqual(['#0A0A0A', '#F5F4EF']);

      // Each module is uniform and agrees with the matrix; the quiet zone ring is uniformly light.
      const quiet = QR_QUIET_MODULES * g.moduleSize;
      const n = matrix.length;
      for (let r = -QR_QUIET_MODULES; r < n + QR_QUIET_MODULES; r += 1) {
        for (let c = -QR_QUIET_MODULES; c < n + QR_QUIET_MODULES; c += 1) {
          const dark = r >= 0 && c >= 0 && r < n && c < n && matrix[r][c];
          const want = dark ? '#0A0A0A' : '#F5F4EF';
          const x0 = g.left + quiet + c * g.moduleSize;
          const y0 = g.top + quiet + r * g.moduleSize;
          for (const [dx, dy] of [[0, 0], [g.moduleSize - 1, 0], [0, g.moduleSize - 1], [g.moduleSize - 1, g.moduleSize - 1]]) {
            expect(hex(rgbAt(png, x0 + dx, y0 + dy)), `${key} module ${r},${c}`).toBe(want);
          }
        }
      }
    });

    // Criterion 9 (and the wordmark with it): nothing is drawn where Instagram overlays its interface.
    it(`${path}: the top and bottom ${OVERLAY_INSET}px are empty background`, () => {
      const png = readCard(path);
      const bands = [
        [0, OVERLAY_INSET],
        [STORY_HEIGHT - OVERLAY_INSET, STORY_HEIGHT],
      ];
      for (const [from, to] of bands) {
        const seen = new Set();
        for (let y = from; y < to; y += 1) for (let x = 0; x < STORY_WIDTH; x += 1) seen.add(hex(rgbAt(png, x, y)));
        expect([...seen], `rows ${from}–${to}`).toEqual(['#0A0A0A']);
      }
    });
  }
});

describe('qrGeometry', () => {
  it('places the panel in whole pixels, centred, above the lower overlay inset', () => {
    const g = qrGeometry(53);
    expect(g).toEqual({ moduleSize: 12, size: 732, left: 174, top: STORY_HEIGHT - OVERLAY_INSET - 30 - 732 });
    expect(g.size).toBeLessThanOrEqual(QR_MAX_PX);
  });

  it('refuses a QR it could only fit by shrinking the modules', () => {
    expect(qrGeometry(57).size).toBe(780);
    expect(() => qrGeometry(61)).toThrow(/too long to print safely/);
  });
});

describe('qrSvg', () => {
  it('draws one rect per run of dark modules, offset by the quiet zone, on the light field', () => {
    const svg = qrSvg(
      [
        [true, true, false],
        [false, false, true],
        [false, false, false],
      ],
      10,
    );
    expect(svg).toContain('width="110" height="110"');
    expect(svg).toContain('fill="#F5F4EF"');
    expect(svg).toContain('<g fill="#0A0A0A"><rect x="40" y="40" width="20" height="10"/><rect x="60" y="50" width="10" height="10"/></g>');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });
});

describe('fitTitle (criterion 5)', () => {
  const fits = (from) => (size) => ({ lines: 3, overflowX: size > from, overflowY: false });

  it('picks the largest size on the ladder that fits', () => {
    expect(fitTitle(fits(88))).toBe(88);
    expect(fitTitle(fits(1000))).toBe(TITLE_SIZES[0]);
  });

  it('rejects a size that overflows vertically, or takes too many lines', () => {
    expect(fitTitle((s) => ({ lines: 2, overflowX: false, overflowY: s > 64 }))).toBe(64);
    expect(fitTitle((s) => ({ lines: s > 76 ? TITLE_MAX_LINES + 1 : TITLE_MAX_LINES, overflowX: false, overflowY: false }))).toBe(76);
  });

  it('returns null when even the smallest size does not fit, which the generator turns into a throw', () => {
    expect(fitTitle(() => ({ lines: 1, overflowX: true, overflowY: false }))).toBeNull();
  });
});

describe('titleFrom', () => {
  it('reads the frontmatter title, quoted or not', () => {
    expect(titleFrom('---\ntitle: "A: b"\nslug: x\n---\nbody', 'a.en.md')).toBe('A: b');
    expect(titleFrom('---\ntitle: Plain\n---\n', 'a.en.md')).toBe('Plain');
  });

  it('throws, naming the file, when there is no title', () => {
    expect(() => titleFrom('---\nslug: x\n---\n', 'a.pt.md')).toThrow(/a\.pt\.md/);
    expect(() => titleFrom('no frontmatter', 'b.en.md')).toThrow(/b\.en\.md/);
  });

  it('reads every real article title in both locales', () => {
    for (const key of keys) {
      for (const locale of LOCALES) {
        expect(titleFrom(readFileSync(join(blogDir, `${key}.${locale}.md`), 'utf8'), key).length).toBeGreaterThan(0);
      }
    }
  });
});
