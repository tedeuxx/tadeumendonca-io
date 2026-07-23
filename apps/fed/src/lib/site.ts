// Site-level constants for canonical URLs + OG/SEO. Origin is overridable via VITE_SITE_URL (e.g. for
// staging), defaulting to the production apex.
const rawSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://tadeumendonca.io';
export const SITE_URL = rawSiteUrl.replace(/\/$/, '');
export const SITE_NAME = 'tadeumendonca.io';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
// The card's intrinsic size, declared so an unfurler knows the aspect ratio BEFORE it fetches the
// image. Without these, WhatsApp and LinkedIn have to guess, and they guess small — the wide banner
// renders as a cropped thumbnail. Keep in sync with public/og-default.png (1200×630, the OG standard).
export const OG_IMAGE_WIDTH = '1200';
export const OG_IMAGE_HEIGHT = '630';
export const OG_IMAGE_TYPE = 'image/png';
export const OG_IMAGE_ALT = 'tadeumendonca.io — learn to build with AI, from everyday life to production';
// English — the crawlable/OG baseline is pinned to English (i18n Slice 1; see scripts/prerender.mjs).
// A per-locale OG description is a deferred slice (tied to per-locale prerender + hreflang).
//
// Reader-first: it leads with what the reader gets, not with who wrote it. The name and the job title
// are deliberately absent — the card sells the promise, and the site's own pages carry the person.
export const DEFAULT_DESCRIPTION =
  'A portfolio of automations and technical writing — agentic development and AI-native engineering, with the trade-offs made explicit.';

/** Resolve a path (or an already-absolute URL) to an absolute URL under the site origin. */
export const absoluteUrl = (pathOrUrl: string): string =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
