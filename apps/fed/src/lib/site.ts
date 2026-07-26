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

/** Resolve a path (or an already-absolute URL) to an absolute URL under the site origin. */
export const absoluteUrl = (pathOrUrl: string): string =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
