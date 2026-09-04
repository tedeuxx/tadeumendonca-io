// #597 slice B. `nav_click`'s `from` classifier — and the one assertion that is not about a table
// lookup: `to` (a literal in `AppShell`'s NAV) and `from` (this classifier) are TWO MECHANISMS producing
// ONE vocabulary, and a GA4 dimension cannot be repaired after they drift. The cross-check below is what
// makes that drift a red test rather than a discovery in a report a year later.
import { describe, expect, it } from 'vitest';
import { navArea } from './navArea';
import { NAV } from '../components/AppShell';
import { LOCALES, localePath } from '../i18n/config';
import type { NavArea } from './analytics';

/** The union, at runtime. Restated here deliberately: a test that imported the type could not check
 *  membership at all, and the point of the adversarial block below is that the RETURN IS ALWAYS ONE OF
 *  THESE — a positive property, not the absence of a bad one. */
const AREAS: readonly NavArea[] = [
  'home',
  'articles',
  'contact',
  'portfolio',
  'ramp-up',
  'architecture',
  'library',
  'me',
  'article',
  'other',
];

describe('navArea', () => {
  it.each([
    ['/pt', 'home'],
    ['/en', 'home'],
    ['/pt/', 'home'],
    ['/en/me', 'me'],
    ['/pt/me', 'me'],
    ['/pt/me/', 'me'],
    ['/en/portfolio', 'portfolio'],
    ['/pt/ramp-up', 'ramp-up'],
    ['/en/architecture', 'architecture'],
    ['/pt/library', 'library'],
    ['/en/blog/my-commitment', 'article'],
    ['/pt/blog/meu-compromisso', 'article'],
  ])('classifies %s as %s', (pathname, expected) => {
    expect(navArea(pathname)).toBe(expected);
  });

  // The residual, asserted rather than assumed. `other` is what a route this site does not have yet
  // reports, and it is the value that keeps the classifier total — the whole reason no caller has a
  // fallback of its own to invent.
  it.each([
    ['/en/blog', 'the retired list route'],
    ['/pt/nope', 'an unknown in-locale path'],
    ['/xyz/me', 'an invalid locale segment'],
  ])('classifies %s (%s) as other', (pathname) => {
    expect(navArea(pathname)).toBe('other');
  });

  // AN UNPREFIXED PATH CLASSIFIES AS ITS PAGE TYPE, and this expectation was written the other way
  // round first — it is kept as a case because getting it wrong is instructive. `pathWithoutLocale`
  // returns an already-unprefixed path UNCHANGED, so `/me` matches the table. That is correct rather
  // than accidental: `/me` and `/en/me` are the same page, and it is only ever reachable in the instant
  // before `RootRedirect` runs. Reporting it as `other` would have split one page type in two for no
  // reason a report could explain. `/xyz/me` is different and stays `other` — an invalid segment is not
  // a missing one, and the path really is not a route this site serves.
  it('classifies an unprefixed path as its page type, not as other', () => {
    expect(navArea('/me')).toBe('me');
    expect(navArea('/')).toBe('home');
  });

  // THE CROSS-CHECK. Every ROUTE-typed nav entry must classify back to its own `area`. Anchor entries
  // (`/#artigos`, `/#contato`) are excluded by construction: they are destinations on the landing, so
  // their `from` is `home` and there is nothing to round-trip — see `NavArea` for why two members are
  // destination-only.
  //
  // Mutation-checked against the SOURCE: changing any `area:` literal in `AppShell`'s NAV, or dropping
  // any row from `AREA_BY_LOGICAL_PATH` in `navArea.ts`, reddens this.
  const routeEntries = NAV.filter((entry) => entry.route);
  it('has at least one route entry to check, so the loop below is not vacuous', () => {
    expect(routeEntries.length).toBeGreaterThan(0);
  });
  it.each(
    routeEntries.flatMap((entry) => LOCALES.map((locale) => [entry.href, locale, entry.area] as const)),
  )('round-trips %s in %s back to its own area literal', (href, locale, area) => {
    expect(navArea(localePath(locale, href))).toBe(area);
  });

  // A pathname is all this function accepts, and the emitted value is a member of a closed set whatever
  // arrives. This is the mechanical half of "impossible to grow a query string": even handed a string
  // carrying one, nothing resembling it can come back out.
  it.each([
    '/en/me?utm_source=leak&email=someone%40example.com',
    '/en/me#fragment',
    '/en/blog/x?ref=1',
    '/en/../../etc/passwd',
    '/en/%2F%2Fevil.example',
    '',
    '/',
  ])('returns a member of the closed vocabulary for %s', (pathname) => {
    const area = navArea(pathname);
    expect(AREAS).toContain(area);
    expect(area).not.toMatch(/[?#=&]/);
  });
});
