/// <reference types="vite/client" />

// The site is static: the only build-time variable left is the origin used for canonical/OG URLs.
interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
