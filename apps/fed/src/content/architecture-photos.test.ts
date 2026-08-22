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
// the blockquote, which is now the ONLY place on the page that delivers them. It is also the string the
// alt is asserted NOT to contain — see `never delivers the quotation twice` below.
const KNUTH =
  'Computer programming is an art, because it applies accumulated knowledge to the world, ' +
  'because it requires skill and ingenuity, and especially because it produces objects of beauty.';

/** Collapse the line wrapping a blockquote introduces, so a re-wrap is not a false failure. */
const flat = (s: string) => s.replace(/\s+/g, ' ').trim();

// How many photographs /architecture embeds, per edition. A literal, and deliberately so — read the
// paragraph below before changing it to something derived.
//
// THIS USED TO BE `PHOTOS.length`, AND THAT WAS CORRECT BY COINCIDENCE. The registry in `data/photos.json`
// is GLOBAL: it is every photograph any content body may embed, and nothing in it says which page an
// entry belongs to. While /architecture was the only page with photographs, "how many does this page
// embed" and "how many exist anywhere" were the same number, so the identity held — and it would have
// gone red the first time a photograph was registered for a blog article, with a failure naming this page
// and nothing on this page having changed. A test that fails on an unrelated file is worse than no test:
// the fix that makes it green again is to loosen it, under time pressure, having learned nothing.
//
// So the identity is split into the two separate claims it was conflating. The COVERAGE claim — this page
// still embeds the photographs it is supposed to — is this number, which is about this page and is
// maintained by whoever changes this page. The MEMBERSHIP claim — nothing is embedded that the registry
// has not measured — is `embeds only photographs the registry has measured` below, and that one is the
// direction that actually protects the reader, since an unregistered target renders with no reserved box.
//
// What is deliberately NOT claimed here any more: that every registered photograph is embedded somewhere.
// It never was — the old identity only compared counts, so an embed swapped for an unrelated registered
// file satisfied it — and it cannot be claimed from a file that reads one page. The cost of a registry
// entry embedded nowhere is a file served to nobody; `scripts/photo-assets.test.mjs` still catches the
// expensive direction, a file on disk the registry does not know about.
const ARCHITECTURE_PHOTOGRAPHS = 2;

describe('the photographs are the same set, in the same order, in both editions', () => {
  // Guard against a vacuous suite: a regex that silently matched nothing makes every comparison below a
  // comparison of two empty arrays, which passes.
  it('found the photographs at all', () => {
    expect(en.length).toBe(ARCHITECTURE_PHOTOGRAPHS);
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

  // WHAT REPLACED THE VERBATIM-ALT ASSERTION, and why it is the one that pins something.
  //
  // Until this change the Knuth alt repeated the quotation word for word, and a test required it to. The
  // intent was real — keep the alt and the blockquote from drifting apart — but the ruling it encoded was
  // only ever applied for the SIGHTED reader: they meet the words once, in type, with the photograph as
  // evidence. A screen-reader user met them twice, back to back, the blockquote and then the identical
  // string as the image. In the pt edition it was worse still: an English paragraph delivered by a pt-BR
  // voice, the only English block in that edition.
  //
  // So the alt now DESCRIBES the frame, which is what an alt is for and what ADR-0048's second condition
  // already said, and the assertion is inverted rather than deleted. Deleting it would leave the drift it
  // was aimed at unwatched in the other direction: the realistic regression now is somebody "helpfully"
  // pasting the quotation back into the alt, which is exactly the redundancy this ruling refuses.
  //
  // Checked on a distinctive fragment rather than the whole sentence, for both alt and caption: a PARTIAL
  // restatement is the regression that actually happens, and the full string is the one nobody pastes by
  // accident. The `alt` half is the new claim; the `caption` half is the original assertion, unchanged.
  it('never delivers the quotation twice — not in a caption, not in an alt', () => {
    for (const p of [...en, ...pt]) {
      expect(p.caption, `${p.src}: the caption restates the quotation`).not.toContain(
        'objects of beauty',
      );
      expect(p.alt, `${p.src}: the alt re-delivers the quotation the blockquote already gave`).not.toContain(
        'objects of beauty',
      );
    }
  });

  // The consequence of that inversion, asserted directly so the Knuth photograph is not merely covered by
  // a loop over all four: it now follows the same rule as the other three, and its alt is authored in each
  // edition's own language. Non-identity across editions is the check that catches an alt left in English
  // in the pt file — the precise defect the old rule mandated.
  it('authors the Knuth alt per edition, describing the frame rather than quoting it', () => {
    const knuthEn = en.find((p) => p.src.includes('knuth'));
    const knuthPt = pt.find((p) => p.src.includes('knuth'));
    expect(knuthEn, 'the Knuth photograph is missing from the en edition').toBeDefined();
    expect(knuthPt, 'the Knuth photograph is missing from the pt edition').toBeDefined();
    expect(flat(knuthEn!.alt)).not.toContain(KNUTH);
    expect(flat(knuthPt!.alt)).not.toContain(KNUTH);
    expect(knuthPt!.alt, 'the Knuth alt is the same string in both editions — untranslated').not.toBe(
      knuthEn!.alt,
    );
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
    // mutation run: the alt text USED TO contain the quotation verbatim, so a bare content match found the
    // image line and the comparison degenerated into `n < n` — red for the wrong reason, with a message
    // that named neither element. The alt no longer carries the quotation, which is precisely why the `>`
    // stays: without it this locator would now be correct by accident, and would silently go back to
    // matching two lines the moment anyone pasted the quotation into the alt again. The blockquote is the
    // thing being asserted, so it is what is located.
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
