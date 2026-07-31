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
// x-default edition (ADR-0024); pt-BR is a faithful translation. Reader-first: each leads with what the
// reader gets, not with who wrote it — the name and job title are deliberately absent, the card sells the
// promise and the site's own pages carry the person.
import type { Locale } from '../i18n/config';

export const DEFAULT_DESCRIPTION_EN =
  'A portfolio of automations and technical writing — agentic development and AI-native engineering, with the trade-offs made explicit.';
export const DEFAULT_DESCRIPTION_PT =
  'Um portfólio de automações e escrita técnica — agentic development e engenharia AI-native, com os trade-offs explícitos.';

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
export const ogImageAlt = (locale: Locale): string =>
  locale === 'pt'
    ? `${SITE_NAME} — aprenda a construir com IA, do dia a dia à produção`
    : `${SITE_NAME} — learn to build with AI, from everyday life to production`;

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
