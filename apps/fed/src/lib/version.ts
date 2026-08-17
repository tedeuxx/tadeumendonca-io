// The running site's version, read from the ROOT `VERSION` file — the same file `deploy.yml`'s `release`
// job bumps and tags on every push to `main`, and on a deliberate minor/major dispatch.
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

import pluginRelease from '../content/generated/plugin-release.json';

export const SITE_VERSION = raw.trim();

/** The GitHub Release `deploy.yml`'s `release` job published for this exact build. */
export const releaseUrl = (version = SITE_VERSION) =>
  `https://github.com/tedeuxx/tadeumendonca-io/releases/tag/v${version}`;

// ---------------------------------------------------------------------------------------------
// THE PLUGIN'S version (#345, ADR-0043's 2026-08-04 amendment) — a SECOND repository's clock, which is
// why it does not work the way `SITE_VERSION` does.
//
// `SITE_VERSION` is exact because there is one clock: `deploy.yml` never publishes a tree that does not
// already carry its own tag — the `release` job bumps the root VERSION in the same commit the build
// consumes, and the `gate` job ASSERTS the tag resolves to that commit before anything is built. (The
// deliberate minor/major dispatch and the `part: none` republish both stay inside that one clock, which
// is why the cut was made in `deploy.yml` rather than in a second workflow.)
// `tedeuxx/tadeumendonca-skills` has a clock of its own, so THAT value is resolved in TWO LEVELS:
//
//   1. `VITE_PLUGIN_VERSION` — the deploy reads the plugin's VERSION from a tokenless checkout and passes
//      it in. The BUILD reads it as an env var, the same way it reads `VITE_GA_MEASUREMENT_ID`; how the
//      deploy SUPPLIES it is not the same, and the comparison used to claim it was. The GA id is a
//      step-level `env:` on the build step; this one is exported job-wide through `$GITHUB_ENV` by the
//      resolve step, which `deploy.yml` says outright. Production therefore publishes the plugin release
//      this build was DEPLOYED AGAINST, which is the only claim the card is allowed to make.
//   2. `plugin-release.json` — the committed floor, written by `gen-harness`. A local build, a PR build
//      and a fork render this: a real, older tag.
//
// Level 2 is a DEFAULT, not an error handler, and that distinction is what closes #329. That decision
// refused a build-time GitHub API call partly because *"what does the card show when the call fails"* had
// no good answer. Here the question does not arise — nothing is fetched, and the lower level always holds
// a tag that really exists. Nothing degrades; a less fresh source wins.
//
// AS OF ADR-0043's 2026-08-14 amendment, level 1's checkout (deploy.yml's `plugin-checkout` step) is
// PINNED to a specific tag (`ref: v1.1.0`) rather than resolving tadeumendonca-skills' `main` tip — a
// deliberate reversal of the "collapses the gap to the moment of the deploy" property this comment block
// otherwise describes. Both levels are regenerated to agree on that same tag while the pin stands; see
// the amendment for why and for what un-pinning requires. This module's own resolution mechanism
// (`resolvePluginVersion` below) is unchanged by the pin — it still just prefers level 1 over level 2.
//
// The pin moved `v1.0.0` → `v1.1.0` on 2026-08-16, before it had ever deployed: the owner cut `v1.1.0`
// as tadeumendonca-skills' launch milestone, which left the original pin two releases behind. The move
// is exactly the deliberate two-file edit the pin was designed to require, not a mechanism change.

/**
 * Resolve the two levels, and it is a FUNCTION so it can be tested without an env var.
 *
 * `??` is deliberately NOT used for the override. It only catches `null`/`undefined`, and the shapes this
 * actually receives from a shell are `''` (an unset `$(cat VERSION)`) and `'\n'` (a stray newline). Both
 * are present-but-useless and must fall through to the floor rather than be published as a tag. That is a
 * named bug in the amendment, not a hypothetical.
 */
export function resolvePluginVersion(fromEnv: string | undefined, fromFile: string): string {
  const override = (fromEnv ?? '').trim();
  const resolved = override === '' ? String(fromFile).trim() : override;
  // Validated after resolution, not before, and it THROWS at module load — the shape the bilingual
  // content loader already uses. A malformed value would render `/releases/tag/v` + garbage: a link that
  // 404s for a reader while the build stays green. A build that would ship one fails instead.
  if (!/^\d+\.\d+\.\d+$/.test(resolved)) {
    throw new Error(
      `unusable plugin version "${resolved.slice(0, 40)}" — expected bare X.Y.Z with no \`v\` prefix. ` +
        'Sources: VITE_PLUGIN_VERSION (the deploy) and src/content/generated/plugin-release.json ' +
        '(`npm --prefix apps/fed run gen-harness`).',
    );
  }
  return resolved;
}

/** The `tedeuxx/tadeumendonca-skills` release this build was deployed against. */
export const PLUGIN_VERSION = resolvePluginVersion(
  import.meta.env.VITE_PLUGIN_VERSION,
  pluginRelease.version,
);

/**
 * Release notes for a tag on an arbitrary repo.
 *
 * `repoUrl` is a PARAMETER rather than hardcoded, unlike `releaseUrl` above: which repo a card points at
 * is data on the card (`CatalogProject.repoUrl`), and inferring it would be exactly the inference the
 * `releases` field's own comment forbids.
 */
export const pluginReleaseUrl = (repoUrl: string, version = PLUGIN_VERSION) =>
  `${repoUrl}/releases/tag/v${version}`;
