// Site-level constants for canonical URLs + OG/SEO. Origin is overridable via VITE_SITE_URL (e.g. for
// staging), defaulting to the production apex.
const rawSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://tadeumendonca.io';
export const SITE_URL = rawSiteUrl.replace(/\/$/, '');
export const SITE_NAME = 'tadeumendonca.io';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
// English — the crawlable/OG baseline is pinned to English (i18n Slice 1; see scripts/prerender.mjs).
// A per-locale OG description is a deferred slice (tied to per-locale prerender + hreflang).
export const DEFAULT_DESCRIPTION =
  'Luiz Tadeu Mendonça — AI Engineer. CV, a portfolio of automations, and technical writing.';

/** Resolve a path (or an already-absolute URL) to an absolute URL under the site origin. */
export const absoluteUrl = (pathOrUrl: string): string =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
