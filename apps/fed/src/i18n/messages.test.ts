import { describe, it, expect } from 'vitest';
import { strings, translate, type Entry, type MessageKey } from './messages';
import { LOCALES } from './config';

/** Every dot-path to an { pt, en } leaf in the nested catalog. */
function entryKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    // An Entry leaf has a string `pt`; anything else is a nested group to recurse into.
    return typeof (v as Entry).pt === 'string' ? [path] : entryKeys(v as object, path);
  });
}

describe('message catalog', () => {
  // Key parity across locales is compile-enforced (each leaf `satisfies Entry`, so a missing pt/en is a
  // type error). Here we assert the runtime values are present and non-empty for every key in both locales.
  it('has a non-empty string for every key in both locales', () => {
    const keys = entryKeys(strings);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      for (const locale of LOCALES) {
        const value = translate(locale, key as MessageKey);
        expect(typeof value).toBe('string');
        expect(value).not.toBe('');
      }
    }
  });

  // ADR-0045 — the document-title convention, asserted rather than reviewed.
  //
  // DERIVED, not listed: the pairs come from the catalog itself (every top-level group that owns a
  // `title` leaf), so a section added later is covered the moment it exists. A hand-written table would
  // have to be remembered, and the failure it is guarding against — a title that stops naming its own
  // section — is exactly the kind nobody remembers to add a row for.
  describe('document titles (ADR-0045)', () => {
    const navLabels = strings.nav as Record<string, Entry>;
    // A group with a `title` leaf is a section route's document title.
    const titled = Object.entries(strings).filter(([, group]) => 'title' in group) as [
      string,
      Record<'title', Entry>,
    ][];

    it('covers the section routes that have a catalog title', () => {
      // Guards the derivation itself: if `title` were renamed catalog-wide, `titled` would silently go
      // empty and every assertion below would vacuously pass. `/` and `/blog/:slug` are deliberate
      // exceptions (see LandingPage/ArticlePage) and `/me` composes its title from data, so five section
      // routes minus /me leaves four.
      expect(titled.map(([name]) => name).sort()).toEqual(['architecture', 'library', 'portfolio', 'rampup']);
    });

    it.each(LOCALES)('leads every section title with its own nav label (%s)', (locale) => {
      for (const [name, group] of titled) {
        const label = navLabels[name]?.[locale];
        expect(label, `nav.${name} must exist — a titled section is one the reader navigates to`).toBeTruthy();
        expect(
          group.title[locale].startsWith(label),
          `${name}.title (${locale}) is "${group.title[locale]}" — it must lead with "${label}", the word the reader clicked`,
        ).toBe(true);
      }
    });

    // The one route the owner reported. Pinned by name because a derived rule can be satisfied by
    // renaming the nav label instead of fixing the title, and "Arquitetura" is the word he clicked.
    it('names the architecture section in its own title, in both locales', () => {
      expect(translate('pt', 'architecture.title')).toContain('Arquitetura');
      expect(translate('en', 'architecture.title')).toContain('Architecture');
    });

    // The seam ADR-0045 refuses to cross: a title is an address, a heading is an argument. If these ever
    // become equal the convention has been "satisfied" by collapsing the two objects, which is the
    // failure mode the record exists to prevent.
    it('keeps the document title distinct from the visible heading', () => {
      for (const locale of LOCALES) {
        for (const [name, group] of titled) {
          const heading = (strings as Record<string, Record<string, Entry>>)[name].heading?.[locale];
          if (!heading) continue;
          // Portfolio is the exception: its heading IS the bare section noun, so the two coincide by
          // content while staying separate keys — the reason `portfolio.title` was split out at all.
          if (name === 'portfolio') continue;
          expect(group.title[locale], `${name}: title and heading must stay different objects`).not.toBe(heading);
        }
      }
    });
  });

  it('resolves a dot-path key to the locale-specific string', () => {
    expect(translate('pt', 'nav.articles')).toBe('Artigos');
    expect(translate('en', 'nav.articles')).toBe('Articles');
    expect(translate('pt', 'cv.present')).toBe('Atual');
    expect(translate('en', 'cv.present')).toBe('Present');
  });
});
