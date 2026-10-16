// Site-level constants for canonical URLs + OG/SEO. Origin is overridable via VITE_SITE_URL (e.g. for
// staging), defaulting to the production apex.
const rawSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://tadeumendonca.io';
export const SITE_URL = rawSiteUrl.replace(/\/$/, '');
export const SITE_NAME = 'tadeumendonca.io';
// The card's intrinsic size, declared so an unfurler knows the aspect ratio BEFORE it fetches the
// image. Without these, WhatsApp and LinkedIn have to guess, and they guess small — the wide banner
// renders as a cropped thumbnail. True of EVERY card this build generates: the two default cards and
// every per-article card (ADR-0041) are screenshotted at exactly 1200×630 by the same Playwright
// viewport, which is why `isGeneratedCard` below can claim the size for all of them.
export const OG_IMAGE_WIDTH = '1200';
export const OG_IMAGE_HEIGHT = '630';
export const OG_IMAGE_TYPE = 'image/png';
// Per-locale OG/meta description (ADR-0036 — per-locale prerender + hreflang). English is the canonical /
// x-default edition (ADR-0024); pt-BR is an authored peer, not a mechanical translation. The name and
// job title are deliberately absent: the description states the mission, and the site's own pages carry
// the person.
//
// RECENTERED AT #688. The previous pair led with "a portfolio of automations" — the proof-of-engineering
// proposition the site no longer leads with. The mission now comes first, and the one market term kept
// here is `agentic development`, so a search reader still meets the practice by name. `apps/fed/index.html`
// carries the English string as its pre-load description and `src/lib/mission.test.ts` asserts the two
// agree, and that the retired proposition does not return to either.
import type { Locale } from '../i18n/config';

export const DEFAULT_DESCRIPTION_EN =
  'A personal, independent commitment to learn in public with the people and machines of this era — agentic development is the workshop; the writing, an ongoing book.';
export const DEFAULT_DESCRIPTION_PT =
  'Um compromisso pessoal e independente de aprender em público com as pessoas e as máquinas desta era — agentic development é a oficina; a escrita, um livro em andamento.';

/** The default OG/meta description in the active locale. */
export const defaultDescription = (locale: Locale): string =>
  locale === 'pt' ? DEFAULT_DESCRIPTION_PT : DEFAULT_DESCRIPTION_EN;

/** Back-compat alias — the English (canonical / x-default) baseline. */
export const DEFAULT_DESCRIPTION = DEFAULT_DESCRIPTION_EN;

/**
 * The site-wide default card, in the reader's own language (#167).
 *
 * English keeps the unsuffixed name: the suffix is ADDITIVE, not a rename. `/og-default.png` is pinned
 * by every link shared since launch, and renaming it would 404 the image on posts already out — the
 * failure ADR-0041 is organised around avoiding. Mirrors `defaultCardFile` in scripts/og-copy.mjs; a
 * mismatch is caught by the E2E, which reads the SERVED HTML rather than this constant.
 */
export const defaultOgImage = (locale: Locale): string => {
  const file = locale === 'en' ? 'og-default.png' : `og-default.${locale}.png`;
  return `${SITE_URL}/${file}`;
};

/**
 * Alt text for the default card, per locale — it describes a PICTURE WITH WORDS IN IT, so an English
 * sentence over the Portuguese card would misdescribe it to exactly the reader who cannot see it.
 * Deliberately not derived from the hero tagline: this is prose about an image, not the image's copy.
 */
// Rewritten with the card at #688: the alt has to describe the words actually on the regenerated card.
export const ogImageAlt = (locale: Locale): string =>
  locale === 'pt'
    ? `${SITE_NAME} — vamos aprender em público, com as pessoas e as máquinas desta era`
    : `${SITE_NAME} — let’s learn in public, with the people and machines of this era`;

/**
 * Is this a card THIS BUILD generated, and therefore one whose 1200×630 we can honestly declare?
 *
 * The condition it replaces was `img === DEFAULT_OG_IMAGE`, written when "a custom image" meant "some
 * size we do not know". #269 made that premise false: every article now carries a card, all of them
 * rendered at 1200×630 by our own generator. The stale condition stripped the dimension block from
 * every article — so the card became distinctive and, on WhatsApp and LinkedIn, simultaneously started
 * rendering as the small square thumbnail. Distinct at a size where distinctness is invisible.
 */
export const isGeneratedCard = (absoluteImageUrl: string): boolean => {
  const path = absoluteImageUrl.startsWith(SITE_URL) ? absoluteImageUrl.slice(SITE_URL.length) : absoluteImageUrl;
  return /^\/og-default(\.[a-z-]+)?\.png$/.test(path) || /^\/og\/[^/]+\.png$/.test(path);
};

/** Resolve a path (or an already-absolute URL) to an absolute URL under the site origin. */
export const absoluteUrl = (pathOrUrl: string): string =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
