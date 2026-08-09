// The photographs on /architecture, as AUTHORED — both editions, per line (#415).
//
// WHY A SOURCE-LEVEL PROBE WHEN THERE IS ALSO AN E2E ONE. They fail on different things and neither
// subsumes the other. `e2e/content-photo.spec.ts` measures what a browser lays out — boxes, viewports,
// whether the quotation is on screen at 320px — and it needs a build and a server to say anything. This
// one is about the two FILES: long-form is one file per locale (ADR-0032), so the editions can drift, and
// they drift most easily when a slice adds something to one and translates it into the other by hand,
// which is every slice this page has ever had. A photograph added to `en` and forgotten in `pt` is a pt
// reader who does not get the evidence the en reader is offered — and it costs a browser nothing to catch.
//
// The rule this file encodes, stated once: the STRUCTURE is identical between editions and the WORDS are
// not. Same files, same order, same count; captions and alt in each edition's own language.
import { describe, it, expect } from 'vitest';
import architectureEn from './architecture.en.md?raw';
import architecturePt from './architecture.pt.md?raw';
import { PHOTOS } from '../data/photos';

/**
 * Every markdown image in a body, in document order, with the line it sits on.
 *
 * The line number is carried so a failure names WHERE rather than only WHAT — a bare "the editions
 * differ" on a five-hundred-line file is a diff somebody has to reproduce by hand.
 */
interface AuthoredImage {
  line: number;
  alt: string;
  src: string;
  caption: string;
}

const IMAGE = /^!\[([^\]]*)\]\((\S+)(?:\s+"([^"]*)")?\)$/;

const imagesIn = (markdown: string): AuthoredImage[] =>
  markdown
    .split('\n')
    .map((text, i) => ({ text: text.trim(), line: i + 1 }))
    .flatMap(({ text, line }) => {
      const m = IMAGE.exec(text);
      return m ? [{ line, alt: m[1], src: m[2], caption: m[3] ?? '' }] : [];
    });

const en = imagesIn(architectureEn);
const pt = imagesIn(architecturePt);

// The wall's words, as they appear on the photograph. Authored here as ONE string and compared against
// both the blockquote and both alts, which is the whole point: the accepted cost of putting the
// quotation in prose AND in alt text is that a translator could drift them, and this is the mitigation
// that was promised instead of a promise.
const KNUTH =
  'Computer programming is an art, because it applies accumulated knowledge to the world, ' +
  'because it requires skill and ingenuity, and especially because it produces objects of beauty.';

/** Collapse the line wrapping a blockquote introduces, so a re-wrap is not a false failure. */
const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('the photographs are the same set, in the same order, in both editions', () => {
  // Guard against a vacuous suite: a regex that silently matched nothing makes every comparison below a
  // comparison of two empty arrays, which passes.
  it('found the photographs at all', () => {
    expect(en.length).toBeGreaterThan(0);
    expect(en.length).toBe(PHOTOS.length);
  });

  it('embeds the same files, in the same order', () => {
    expect(pt.map((p) => p.src)).toEqual(en.map((p) => p.src));
  });

  it('embeds only photographs the registry has measured', () => {
    const registered = new Set(PHOTOS.map((p) => p.src));
    const unknown = [...en, ...pt].filter((p) => !registered.has(p.src)).map((p) => p.src);
    // An unregistered target renders as a bare <img>: no caption, no alt requirement, no reserved box —
    // the silent default this whole mechanism replaced.
    expect(unknown).toEqual([]);
  });

  // NO LOCALE SUFFIX. A photograph is not translated, so `knuth-cv-museum.pt.jpg` is a file that would
  // have to exist twice and drift once. Asserted rather than assumed because the CONTENT files around it
  // are per-locale, which is exactly the habit that would produce one.
  it('embeds no per-locale variant of a photograph', () => {
    for (const p of [...en, ...pt]) expect(p.src).not.toMatch(/\.(pt|en)\.jpg$/);
  });

  it('gives every photograph a non-empty alt and a non-empty caption, in both editions', () => {
    for (const p of [...en, ...pt]) {
      expect(p.alt.trim(), `${p.src} has no alt text`).not.toBe('');
      expect(p.caption.trim(), `${p.src} has no caption`).not.toBe('');
    }
  });

  // THE ASSERTION THAT CATCHES A WHOLESALE LOCALE COPY, and it is the reason this is not just a
  // structural diff. Copying `architecture.en.md` over the pt edition and translating only the headings
  // satisfies every check above — same files, same order, both strings present. It does not survive this:
  // a caption is authored prose and the two editions must not ship the same one.
  it('captions differ between the editions — the words are translated, not copied', () => {
    en.forEach((image, i) => {
      expect(pt[i].caption, `${image.src}: both editions ship the same caption`).not.toBe(image.caption);
    });
  });

  // The Knuth photograph is the exception that proves which half is structural: its ALT is the wall's own
  // English words in BOTH editions (the quotation is not translated), while its caption still is.
  it('carries the wall’s words verbatim in the alt, in both editions', () => {
    for (const body of [en, pt]) {
      const knuth = body.find((p) => p.src.includes('knuth'));
      expect(knuth, 'the Knuth photograph is missing from an edition').toBeDefined();
      expect(flat(knuth!.alt)).toContain(KNUTH);
      expect(flat(knuth!.alt)).toContain('Donald Knuth, 1974');
    }
  });

  // THE REDUNDANCY RULING, made mechanical. The caption must not restate the quotation — that is the only
  // place the "told twice" failure can enter once the blockquote sits above the photograph. Checked on a
  // distinctive fragment rather than the whole sentence, because a partial restatement is the realistic
  // regression and the whole string is the one nobody would paste by accident.
  it('never restates the quotation in a caption', () => {
    for (const p of [...en, ...pt]) {
      expect(p.caption, `${p.src}: the caption restates the quotation`).not.toContain(
        'objects of beauty',
      );
    }
  });
});

describe('the Knuth quotation is prose, above its photograph', () => {
  // THE WHOLE POINT OF THE SLICE, and the one property a photograph cannot deliver: legibility inside a
  // raster is not assertable, so the words are a real blockquote. If this fails, the page is publishing a
  // quotation that only exists as pixels.
  it.each([
    ['en', architectureEn],
    ['pt', architecturePt],
  ])('authors the quotation as a blockquote in the %s edition', (_locale, body) => {
    const quoted = body
      .split('\n')
      .filter((l) => l.trimStart().startsWith('>'))
      .map((l) => l.trimStart().slice(1))
      .join(' ');
    expect(flat(quoted)).toContain(KNUTH);
    expect(flat(quoted)).toContain('— Donald Knuth, 1974');
  });

  // ORDER IS THE RULING. A reader who meets the photograph first decodes the sentence out of the raster
  // and then meets it again in type — that is being told twice. Type first, then the wall, and the
  // photograph reads as evidence. The whole redundancy argument rests on this one comparison, so it is
  // asserted rather than left to the author's memory of which paragraph came first.
  it.each([
    ['en', architectureEn],
    ['pt', architecturePt],
  ])('puts the blockquote BEFORE the photograph in the %s edition', (_locale, body) => {
    const lines = body.split('\n');
    // The `>` is load-bearing in this locator, and leaving it out was a real mistake caught by the
    // mutation run: the ALT TEXT also contains the quotation verbatim — deliberately, so a reader who
    // meets the image alone still gets the words — so a bare content match found the image line and the
    // comparison degenerated into `n < n`. It still went red, for the wrong reason and with a message
    // that named neither element. The blockquote is the thing being asserted, so it is what is located.
    const quoteLine = lines.findIndex(
      (l) => l.trimStart().startsWith('>') && l.includes('Computer programming is an art'),
    );
    const photoLine = lines.findIndex((l) => l.includes('](/photos/knuth-cv-museum.jpg'));
    expect(quoteLine, 'the quotation is not authored as a blockquote at all').toBeGreaterThan(-1);
    expect(photoLine).toBeGreaterThan(-1);
    expect(quoteLine, 'the photograph comes before the quotation it is evidence for').toBeLessThan(
      photoLine,
    );
  });
});
