// The running site's version, read from the ROOT `VERSION` file — the same file `version-main` bumps
// and tags on every push to `main`.
//
// Imported with Vite's `?raw` rather than injected through a `define`. The define route means reading
// the file in vite.config.ts AND again in vitest.config.ts (vitest does not read the app's Vite config),
// which needs `node:fs` in both — and this app deliberately has no `@types/node`. tsconfig.json already
// records that trade for playwright.config.ts: "adding a dependency to typecheck one config file is a
// worse trade than leaving that file out". Three files is a worse version of the same trade.
//
// Read from the file rather than restated as a constant, because a version string that can disagree
// with the git tag is worse than no version string at all: it looks authoritative while being wrong.
//
// Resolved at BUILD time and baked into the prerendered HTML (ADR-0002/ADR-0004 — nothing is fetched at
// runtime), so it moves on deploy and only on deploy.
import raw from '../../../../VERSION?raw';

export const SITE_VERSION = raw.trim();

/** The GitHub Release `version-main` published for this exact build. */
export const releaseUrl = (version = SITE_VERSION) =>
  `https://github.com/tedeuxx/tadeumendonca-io/releases/tag/v${version}`;
