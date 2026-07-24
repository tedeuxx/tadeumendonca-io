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
}
