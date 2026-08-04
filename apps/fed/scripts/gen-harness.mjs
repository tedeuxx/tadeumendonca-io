// Writes the committed harness-inventory manifest. A thin shell around harness-source.mjs, which holds
// every decision this script makes — see the header there for why the inventory is derived at all.
//
// Run: npm run gen-harness (from apps/fed)
//
// THE BUILD NEVER RUNS THIS. `npm run build` reads the committed manifest and nothing else, exactly as
// it reads adrs.json and diagrams.json — ADR-0002 and ADR-0004 hold unchanged, and a clone of this repo
// with no sibling checkout still builds and still ships. The sibling repo is read by this generator and
// by check-harness-drift.mjs, and by nothing else.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectComponents, pluginPresent, readPluginVersion, resolvePluginDir } from './harness-source.mjs';

const FED = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(FED, 'src', 'content', 'generated', 'harness.json');
// The plugin's released version, as its OWN artifact rather than a row in the manifest — ADR-0043's
// 2026-08-04 amendment, Decision 1. The manifest is a flat array of components whose every element is
// enforcement-classed against a closed set; a version is not a component, and giving it a class would
// either throw or force a fourth class into a set that record froze deliberately.
//
// Written by the SAME run, from the SAME resolved pluginDir, so there is no second pipeline to remember.
// It is the FLOOR, not what production renders: the deploy resolves the value fresh into
// VITE_PLUGIN_VERSION and that wins. See src/lib/version.ts for the two-level resolution.
const VERSION_OUT = join(FED, 'src', 'content', 'generated', 'plugin-release.json');

// The sibling checkout, overridable. CI passes it explicitly (the second `actions/checkout` lands the
// plugin somewhere of its choosing); locally the default is the workspace layout — the two repos side by
// side, which is how they are actually developed. `resolvePluginDir` resolves AND validates in one step,
// which is the whole point of it — see its header; the caller must not resolve separately.
export const DEFAULT_PLUGIN_DIR = resolve(FED, '..', '..', '..', 'tadeumendonca-skills');
const pluginDir = resolvePluginDir(process.argv[2] ?? process.env.SKILLS_REPO ?? DEFAULT_PLUGIN_DIR);

if (!pluginPresent(pluginDir)) {
  // Loud and specific. A generator that wrote an EMPTY manifest here would be the worst possible
  // behaviour: the drift check would then agree with it, and the page would publish an inventory of
  // nothing under a green build.
  console.error(
    `No plugin tree at ${pluginDir}.\n` +
      'Clone tedeuxx/tadeumendonca-skills beside this repo, or pass its path:\n' +
      '  npm --prefix apps/fed run gen-harness -- /path/to/tadeumendonca-skills',
  );
  process.exit(1);
}

const components = collectComponents(pluginDir);
// Read BEFORE either write, so a plugin tree that cannot produce a usable version leaves both artifacts
// as they were rather than half-updated.
const pluginVersion = readPluginVersion(pluginDir);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(components, null, 2)}\n`);
writeFileSync(VERSION_OUT, `${JSON.stringify({ version: pluginVersion }, null, 2)}\n`);

const count = (kind) => components.filter((c) => c.kind === kind).length;
console.log(
  `Wrote src/content/generated/harness.json with ${components.length} component(s): ` +
    `${count('hook')} hook(s), ${count('persona')} persona(s), ` +
    `${count('command-family')} command famil(ies), ${count('command')} un-namespaced command(s).`,
);
console.log(`Wrote src/content/generated/plugin-release.json — plugin version ${pluginVersion}.`);
