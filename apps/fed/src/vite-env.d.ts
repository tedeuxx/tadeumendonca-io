/// <reference types="vite/client" />

// The site is static: build-time variables are the origin used for canonical/OG URLs, and the
// GA4 measurement id (public — it ships in the client). GA is gated on consent regardless; an
// unset id makes analytics inert (preview, prerender and E2E never emit a hit). See lib/analytics.
interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// gtag.js globals, present only after consent loads the script (lib/analytics.loadAnalytics).
type GtagFn = (...args: unknown[]) => void;
interface Window {
  dataLayer?: unknown[];
  gtag?: GtagFn;
  /**
   * Set by `scripts/prerender.mjs` (via `addInitScript`) in the build-time snapshot browser only —
   * never in a real visitor's page. Anything that renders off the VISITOR rather than the route must
   * check it, because the snapshot is pinned to en-US and its HTML is served to everyone (#172).
   */
  __PRERENDER__?: boolean;
}
