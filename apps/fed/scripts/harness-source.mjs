// The pure half of the harness-inventory pipeline (#318, ADR-0043): read the dev-loop plugin's tree,
// turn it into components, and decide whether the committed manifest still matches them.
//
// Split from gen-harness.mjs for the same reason adr-source.mjs is split from gen-adrs.mjs: the
// generator writes a file, which is a side effect; everything that DECIDES what the inventory contains
// is logic and lives here, where it is testable against fixtures.
//
// WHY THIS EXISTS AT ALL, and it is not the usual "generated beats hand-typed" argument. The inventory's
// source of truth is `tadeumendonca-skills`, a DIFFERENT repository — the only generated artifact on this
// site whose source is not in this repo. ADR-0043 records the whole trade. The short version is the
// motivating evidence: the specification for this very slice claimed 19 personas and 3 hooks, copied in
// good faith from the plugin's own README diagram, and the tree said 6 and 4. A hand-typed table with a
// date on it would have recorded the date the wrong numbers were copied.
//
// WHAT THIS MODULE READS AND WHAT IT DOES NOT. It reads IDENTITY — names, files, events, matchers,
// counts. It does not read the `description` frontmatter, and the manifest carries no gloss: the short
// label a diagram node shows is authored in the markdown fence, in each locale, and is NOT checked. That
// is the same honest limit ADR-0040 states about its own guard — the guarantee is "the source exists and
// is unchanged", never "this artifact describes it correctly".
import { readFileSync, readdirSync, existsSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The directory that CONTAINS this repository — the one root a plugin tree may live under.
 *
 * Derived from this module's own location, never from an argument, so it cannot be widened by the same
 * input it is there to constrain. `realpathSync` because the comparison below is a string prefix and a
 * symlinked checkout (`/tmp` → `/private/tmp` on macOS is the everyday case) would otherwise fail a
 * containment it actually satisfies.
 */
export const WORKSPACE_ROOT = realpathSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..'),
);

/**
 * Resolve an operator-supplied plugin path AND validate it, in that order, in ONE place.
 *
 * This is the only door to every `fs` call below, and it is a door rather than a helper deliberately.
 * The validation already existed — `pluginPresent` — but it sat in the CALLERS, after their own
 * `resolve()`, which made it a check the fs calls did not have to pass through. SonarCloud read exactly
 * that shape and raised `jssecurity:S8707` three times (a path canonicalized from CLI-controlled data
 * reaching `readdirSync`/`statSync`/`readFileSync` unvalidated), and it was right about the structure
 * even though the input is a build script's own argument with no untrusted caller.
 *
 * So the fix is placement, not ceremony: the containment test now dominates the sinks instead of sitting
 * beside them. It also buys the thing this repo wants for its own sake — a wrong `SKILLS_REPO` fails by
 * NAME, at the entry point, instead of as an `ENOENT` three frames down inside a collector.
 *
 * WHAT CONTAINMENT MEANS HERE, since it is the part that could be over-tightened without noticing: the
 * plugin tree is either checked out INSIDE this repo (`.skills-checkout`, which is what the CI job does)
 * or sits BESIDE it (the workspace layout the two repos are developed in). Both are strictly under
 * `WORKSPACE_ROOT`, so one prefix covers them. A path anywhere else is refused rather than read.
 */
export function resolvePluginDir(raw) {
  const resolved = resolve(String(raw ?? ''));
  // Canonicalise where the path exists, so a symlink cannot point outside the root through a name that
  // textually sits inside it. Where it does not exist, the resolved form is all there is — and a
  // non-existent path is the caller's `pluginPresent` decision (skip or fail), not this one's.
  const canonical = existsSync(resolved) ? realpathSync(resolved) : resolved;
  if (!canonical.startsWith(WORKSPACE_ROOT + sep)) {
    throw new Error(
      `refusing to read a plugin tree outside the workspace: "${canonical}" is not under ${WORKSPACE_ROOT}. ` +
        'Check tedeuxx/tadeumendonca-skills out beside this repo, or inside it, and pass that path.',
    );
  }
  return canonical;
}

/**
 * The ENFORCEMENT CLASS, against a closed set, exactly as `parseStatus` treats an ADR status.
 *
 * This is the one field on the manifest that is a CLAIM rather than an observation, and it is the claim
 * the diagram exists to make: a hook that refuses a tool call before it runs and a persona somebody has
 * to remember to dispatch are not the same kind of thing. Drawing them alike would assert a mechanism
 * that does not exist, on the one page whose credibility rests on declining to do that.
 *
 * - `denies`   — refuses before the act. The two `PreToolUse` hooks.
 * - `advises`  — the JUDGEMENT it produces is enforced by nothing. EVERY persona, without exception —
 *                said without a count, so the sentence survives the next roster change.
 *
 *                Say precisely what that does and does not cover for `quality-assurance`, because the
 *                first version of this comment got it wrong and the page repeated the error.
 *                `permission-guard.sh` rule 7b DOES refuse `gh pr merge` from every `agent_type` except
 *                `*:quality-assurance` — so WHO may merge is mechanical, and this class is not saying
 *                otherwise. What nothing anywhere checks is whether the review was performed, or
 *                performed well; a merge that the reviewer waves through unread is denied by nothing.
 *                That is what `advises` names. ~~`security` is weaker still…~~ — that persona was
 *                retired on 2026-08-04 (plugin `9cf3436`; this line said 2026-08-05 for one round,
 *                inheriting the date of the EDIT rather than of the event it describes) and the
 *                example now names `harness-reviewer`, which is the same
 *                case and slightly stronger: it runs BEFORE anything is built, gates nothing, and
 *                nothing forces it to be dispatched at all. A lens nobody dispatches fails silently,
 *                and that is the half of `advises` worth keeping distinct from the merge seat above.
 * - `documents`— neither denies nor advises; it removes a re-decision or reports state. The command
 *                families, the un-namespaced commands, and the `SessionStart` hooks, which print
 *                context at session start and cannot refuse anything.
 *
 * NOTE what is NOT in here: the CI gates. ADR-0043 classes them `denies` and they genuinely do refuse a
 * merge — but they live in THIS repo's `.github/workflows/`, not in the plugin, so they are not derived
 * and a manifest row for them would be an authored claim wearing a derived artifact's clothes. They are
 * already drawn, as `Mechanical gates`, in the flow diagram this one complements.
 */
const ENFORCEMENT = ['denies', 'advises', 'documents'];

/**
 * The class of a component, from its kind — and for a hook, from its EVENT.
 *
 * Keyed on the event and not on "hook", deliberately. "Hooks deny" is false for most of them:
 * `SessionStart` runs once at session start and has no tool call to refuse. Collapsing them into one
 * class would publish the stronger claim about scripts that cannot make it, which is the same defect
 * in miniature as drawing personas like hooks.
 *
 * ONE ROW SITS UNCOMFORTABLY HERE AND IT IS RECORDED RATHER THAN SMOOTHED OVER. `session-scratch`
 * DELETES files at session start. It refuses no tool call, so on the axis this map actually measures
 * — can it stop the agent from doing something — `documents` is correct. But "neither denies nor
 * advises; it removes a re-decision or reports state" undersells a script whose whole job is
 * destructive. The axis may need a fourth value; that is a decision for `tech-lead` and the ADR
 * library, not something to settle by widening a map in a derivation script.
 *
 * A closed map that THROWS. A kind or an event this does not know is either a typo or a change to the
 * practice; both are things a person should hear about, and neither should quietly become a diagram node.
 */
const ENFORCEMENT_BY_SHAPE = {
  'hook:PreToolUse': 'denies',
  'hook:SessionStart': 'documents',
  persona: 'advises',
  'command-family': 'documents',
  command: 'documents',
};

export function enforcementFor(kind, event) {
  const key = kind === 'hook' ? `hook:${event}` : kind;
  const cls = ENFORCEMENT_BY_SHAPE[key];
  if (!cls) throw new Error(`unrecognised harness component shape: "${key}"`);
  return cls;
}

/**
 * Validate an enforcement value read back from the COMMITTED manifest.
 *
 * `enforcementFor` guards the generator; this guards the file. The manifest is committed, so a hand-edit
 * or a bad merge can put anything in that field, and the page would then draw a class nothing defines —
 * the same hole `adrRecords` closes by re-sorting an artifact its generator already sorted.
 */
export function assertEnforcement(value) {
  if (!ENFORCEMENT.includes(value)) {
    throw new Error(
      `unrecognised harness enforcement class: "${String(value).slice(0, 40)}" — expected one of ${ENFORCEMENT.join(', ')}`,
    );
  }
  return value;
}

/**
 * The plugin's RELEASED version, from its own `VERSION` file (#345, ADR-0043's 2026-08-04 amendment).
 *
 * This is the one value in this module that is not an inventory fact: it is published on `/portfolio`'s
 * `tadeumendonca-skills` card as a tag, linked to that release's notes. It lives HERE, beside the
 * inventory readers, because it is the same act — reading the sibling tree — and because the pure/shell
 * split this file exists for applies to it unchanged: the read and the validation are logic, the write is
 * a side effect and stays in gen-harness.mjs.
 *
 * NO `v` PREFIX, asserted rather than tolerated. `pluginReleaseUrl` in src/lib/version.ts builds
 * `/releases/tag/v${version}`, so a stored `v0.4.41` would produce `/releases/tag/vv0.4.41` — a link that
 * 404s for a reader while every string involved looks plausible in a diff. The generator is the only
 * thing that writes the artifact, so this is where the shape is decided, and `check-harness-drift.mjs`
 * re-validates what was written for the same reason `assertEnforcement` re-validates the manifest: a
 * committed file can be hand-edited.
 */
export function readPluginVersion(pluginDir) {
  const file = join(pluginDir, 'VERSION');
  if (!existsSync(file)) {
    throw new Error(
      `no VERSION file at ${file} — tedeuxx/tadeumendonca-skills carries one at its root, so either the ` +
        'path is not a plugin tree or that repo changed shape.',
    );
  }
  // RETURN THE VALIDATOR'S RETURN, never the binding it was handed. `assertPluginVersion(v); return v`
  // reads as equivalent and is not: the anchored regex then sits BESIDE the dataflow path rather than on
  // it, so raw file content still reaches every consumer. Sonar's taint engine said so before a human
  // did — two CRITICAL `jssecurity:S8689`, tracing `readFileSync` here to the `console` calls in
  // `gen-harness.mjs` and `check-harness-drift.mjs`. The validation was real and the value was not the
  // validated one, which is the same defect shape as an assertion that cannot fail.
  return assertPluginVersion(readFileSync(file, 'utf8').trim(), file);
}

/**
 * Validate a plugin version string, wherever it came from — the sibling tree or the committed artifact.
 *
 * Separate from the read so the drift check can apply it to a value it did NOT read from disk, which is
 * the case that matters: with the deploy-time override present, a malformed committed default is never
 * evaluated in production and would surface only in a fork's build.
 */
export function assertPluginVersion(value, source = 'the plugin version') {
  // REBUILT FROM THE CAPTURE GROUPS, not returned as given, and that is the whole point of this shape.
  //
  // The first version tested with `.test()` and returned `value`. Correct-looking, and it left two
  // defects. Sonar's taint engine refused it twice (`jssecurity:S8689`) and the reason it gives is the
  // real one rather than a scanner quirk: a throw-guard is not a sanitizer, because `RegExp.test`
  // returns a boolean that is discarded and the function hands back the binding it was given. Taint
  // clears on TRANSFORMATION, never on testing — the value that reaches the caller is byte-identical to
  // the one that came off disk, so nothing downstream can tell they are different.
  //
  // The second defect is independent of any scanner and nobody had spotted it: the test ran against
  // `String(value ?? '')` while the RETURN was `value` — the original. A non-string that stringifies to
  // a valid version passed the check and left this function still a non-string.
  //
  // Reconstructing from the groups fixes both at once. What comes back is provably three numeric runs
  // joined by dots, built here, and provably a string.
  const groups = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(value ?? ''));
  if (!groups) {
    throw new Error(
      `unusable plugin version "${String(value).slice(0, 40)}" from ${source} — expected bare X.Y.Z ` +
        'with no `v` prefix (the `v` is added by the URL builder).',
    );
  }
  const [, major, minor, patch] = groups;
  return `${major}.${minor}.${patch}`;
}

/** Is there a plugin tree at this path? The caller decides whether that is a skip or a failure. */
export function pluginPresent(pluginDir) {
  return existsSync(join(pluginDir, 'agents')) && existsSync(join(pluginDir, 'hooks', 'hooks.json'));
}

const dirsIn = (dir) => readdirSync(dir).filter((e) => statSync(join(dir, e)).isDirectory());
const mdIn = (dir) => readdirSync(dir).filter((f) => f.endsWith('.md')).sort();

/**
 * The personas, from `agents/*.md` frontmatter.
 *
 * The `name:` field is read from the document and compared against the FILENAME, and they must agree —
 * the same assertion `parseRecord` makes about an ADR's heading versus its file. Claude Code dispatches
 * by the frontmatter name while a reader finds the persona by its path; those two can disagree, and this
 * is the only place positioned to notice.
 */
export function collectPersonas(pluginDir) {
  const dir = join(pluginDir, 'agents');
  return mdIn(dir).map((f) => {
    const text = readFileSync(join(dir, f), 'utf8');
    const declared = /^name:\s*(\S+)\s*$/m.exec(text)?.[1];
    if (!declared) throw new Error(`agents/${f}: no \`name:\` in the frontmatter`);
    const fromFile = basename(f, '.md');
    if (declared !== fromFile) {
      throw new Error(`agents/${f}: frontmatter says "${declared}", filename says "${fromFile}"`);
    }
    return {
      kind: 'persona',
      id: declared,
      file: `agents/${f}`,
      enforcement: enforcementFor('persona'),
    };
  });
}

/**
 * The hooks, from `hooks/hooks.json` — the WIRING file, not the scripts directory.
 *
 * The COUNT is deliberately not written here. Naming it in prose is what drifted last time and it would
 * drift again on the next hook; the number belongs in the derived manifest, which is regenerated, and
 * nowhere else. `check-harness-drift` is the thing that keeps it honest.
 *
 * `hooks/scripts/` holds more files than there are hooks, roughly half of them the hooks' own `.test.sh`
 * suites. Counting the directory would inventory the tests as hooks; counting the wiring inventories what
 * is actually registered, which is the thing the diagram claims. It is also the field that drifted:
 * nothing anywhere counted `session-plugin-version`, and when this was written (2026-08-03) the
 * plugin's README drew three. It drew four from `5baea18` (2026-08-03, *"the README drew three hooks,
 * hooks.json registers four"* — the hook itself, `session-plugin-version.sh`, had been added the day
 * before in `e9f96c3`, and nothing redrew the diagram) and five from `-skills`#156 (2026-08-06,
 * `session-scratch`), whose event table now lists all three `SessionStart` hooks. Dated rather than
 * deleted: the drift is why this generator reads the WIRING instead of the README, and a corrected
 * sentence with no trace would leave that reasoning unattached.
 *
 * TWO WRONG HISTORIES WERE WRITTEN HERE BEFORE THIS ONE, and both were wrong the same way — asserted
 * from a PR in hand instead of from the README's own log, which `git log -S 'H4['` answers in one
 * command. The first said it drew three "until #156", collapsing two moves into one. The second, the
 * gate's own prescribed replacement, dated the four-hook move to 2026-08-04 and credited it with
 * ADDING `session-plugin-version` — the commit says it FIXED THE DRAWING for a hook that already
 * existed, which is the same defect this generator exists to remove, one layer up. Measured: the hook
 * lands 08-02, the README catches up 08-03.
 *
 * `matcher` is carried because it is half of what a `PreToolUse` hook IS — a guard re-pointed from `Bash`
 * to something else is present on both sides with a different field, which is exactly the `changed` case
 * a set comparison cannot see.
 */
export function collectHooks(pluginDir) {
  const wiring = JSON.parse(readFileSync(join(pluginDir, 'hooks', 'hooks.json'), 'utf8'));
  const out = [];
  for (const [event, groups] of Object.entries(wiring.hooks ?? {})) {
    for (const group of groups) {
      for (const hook of group.hooks ?? []) {
        const script = basename(String(hook.command).replace(/"$/, ''));
        out.push({
          kind: 'hook',
          id: script,
          file: `hooks/scripts/${script}`,
          event,
          // `null` rather than absent: an event with no matcher (SessionStart) and an event whose
          // matcher was DELETED must not serialise identically, or the deletion is invisible to `changed`.
          matcher: group.matcher ?? null,
          enforcement: enforcementFor('hook', event),
        });
      }
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * The command families, and the commands that are in no family.
 *
 * An un-namespaced command is handled EXPLICITLY rather than filtered away. A generator that walks only
 * the directories drops it without a word, and the plugin's own suite asserts the root count for exactly
 * this reason — a change to the number of un-namespaced commands is a real change to the shape and must
 * go red, not vanish. It did: `commands/new-issue.md` joined `commands/autonomy-on.md`, and every count
 * on the page moved because nothing filtered it. Promoting an orphan to a family would be the opposite
 * error — it makes a category out of an orphan, which is how the "seven command families" figure was
 * produced.
 *
 * A nested directory throws. Today the families are flat; if that stops being true, the count this
 * publishes silently stops meaning what it says.
 */
export function collectCommands(pluginDir) {
  const dir = join(pluginDir, 'commands');
  const families = dirsIn(dir)
    .sort()
    .map((name) => {
      const familyDir = join(dir, name);
      if (dirsIn(familyDir).length > 0) {
        throw new Error(`commands/${name}: nested directories — the family count no longer means what it says`);
      }
      return {
        kind: 'command-family',
        id: name,
        file: `commands/${name}`,
        commands: mdIn(familyDir).length,
        enforcement: enforcementFor('command-family'),
      };
    });

  const orphans = mdIn(dir).map((f) => ({
    kind: 'command',
    id: basename(f, '.md'),
    file: `commands/${f}`,
    enforcement: enforcementFor('command'),
  }));

  return [...families, ...orphans];
}

/** Fixed rather than alphabetical: the manifest is reviewed as a diff, and kind-grouped reads. */
const KIND_ORDER = ['hook', 'persona', 'command-family', 'command'];

export function collectComponents(pluginDir) {
  const all = [
    ...collectHooks(pluginDir),
    ...collectPersonas(pluginDir),
    ...collectCommands(pluginDir),
  ];
  return all.sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.id.localeCompare(b.id),
  );
}

/** A component's identity across the two sides of the comparison. `id` alone collides: a persona and a
 *  command family could share a name, and today `architecture` is a family while nothing stops a persona
 *  taking that name tomorrow. */
export const componentKey = (c) => `${c.kind}:${c.id}`;

/**
 * Compare the plugin tree against the committed manifest, THREE ways.
 *
 * Not negotiable, and the reason is in adr-source.mjs's equivalent: a set comparison alone misses the
 * likeliest drift. Here that is a persona RENAMED or a hook RE-POINTED to a different event — present on
 * both sides, different in a field. Both gatekeepers independently found the equivalent field omission
 * on the ADR index, so it is not hypothetical.
 *
 * The field comparison is a UNION OF KEYS rather than a hand-written list, and that is the direct lesson
 * from that finding: the ADR version called itself "field by field" while skipping `file`, the one field
 * a reader clicks. A list of fields is a place to forget one; a union cannot omit a field that exists on
 * either side, including one added later by someone who never reads this comment.
 */
export function diffAgainstManifest(components, manifest) {
  const committed = new Map(manifest.map((c) => [componentKey(c), c]));
  const live = new Set(components.map(componentKey));

  const differs = (a, b) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].some((k) => a[k] !== b[k]);
  };

  return {
    missing: components.filter((c) => !committed.has(componentKey(c))),
    orphaned: manifest.filter((c) => !live.has(componentKey(c))),
    changed: components.filter((c) => {
      const c2 = committed.get(componentKey(c));
      return c2 && differs(c, c2);
    }),
  };
}

/**
 * The failure message, and it is aimed at ATTRIBUTION rather than at timing.
 *
 * ADR-0043's accepted cost: this check is asymmetric. A plugin PR that retires a persona is green over
 * there and knows nothing about this page; the red surfaces at the next `app` run HERE, which will
 * usually be an unrelated PR landing on an author who did not cause it. Nothing in this repo can trigger
 * on an event in another one. So the least this can do is tell that author it is not their change and
 * hand them the one command that fixes it.
 */
export function driftReport(diff) {
  const lines = [];
  const name = (c) => `${c.kind} ${c.id}`;
  for (const c of diff.missing) lines.push(`  + ${name(c)} exists in the plugin and is NOT in the manifest`);
  for (const c of diff.orphaned) lines.push(`  - ${name(c)} is in the manifest and NO LONGER in the plugin`);
  for (const c of diff.changed) lines.push(`  ~ ${name(c)} changed shape (event, matcher, file or command count)`);
  if (lines.length === 0) return '';
  return [
    'The /architecture harness inventory no longer matches tedeuxx/tadeumendonca-skills:',
    ...lines,
    '',
    'This is almost certainly NOT your change — the plugin is a separate repository and a merge there',
    'cannot turn this repo red until the next run here. To fix it:',
    '  npm --prefix apps/fed run gen-harness',
    'then update the components diagram in apps/fed/src/content/architecture.{en,pt}.md, both editions.',
  ].join('\n');
}

// ── THE DISPATCH ROSTER IN `CLAUDE.md` (#353) ────────────────────────────────────────────────────
//
// `CLAUDE.md` tells the agent which subagent OWNS a given decision. For one day it routed the
// permission floor to a persona the plugin had retired, so the guide's most actionable sentence was
// the one instruction in the file that FAILED WHEN FOLLOWED. Nothing could have caught it: the
// manifest under `generated/` is derived and checked; prose is neither.
//
// WHY A FENCE RATHER THAN A SCAN OF THE WHOLE FILE, which is the design decision here. The same file
// deliberately keeps retired names in its history — `brand-guardian`, `editor`, `marketing-lead`,
// `plan-reviewer` — under a *supersede, never rewrite* convention. A guard reading the whole document
// would redden on that history, and a guard that reddens on correct content is one somebody disables
// inside a week. The markers make the claim exact: everything between them is presented as
// INVOCABLE; everything outside is narrative and out of scope.
//
// The comparison runs BOTH ways on purpose. A name inside the fence with no file is the defect that
// prompted this. A live persona missing from the fence is the same defect with the opposite sign:
// `harness-reviewer` existed for a day and the guide named it nowhere, so nothing dispatched it.
//
// WHAT THIS DOES NOT SEE, and it is sharper than a caveat: a routing sentence in PROSE, outside the
// markers, is invisible. **So this guard would not have caught #353 in the form #353 actually took** —
// the dead persona sat in an ordinary sentence, and the fence did not exist yet. The fence is what buys
// exactness over the file's deliberate history; the price is that it guards a SHAPE, and the shape has
// to be adopted before the guard can see the claim. Measured, not reasoned: routing the permission
// floor to a retired name in the line directly below the closing marker exits 0.
//
// Second silent pass, same class: a SECOND `roster:dispatch` fence is ignored. The regex is lazy and
// non-global, so only the first pair of markers is read. Neither is worth closing today — both are
// authoring mistakes a reader of this comment can avoid, and widening the match is how a guard starts
// reddening on the history it was scoped away from.
const ROSTER_FENCE = /<!--\s*roster:dispatch\s*-->([\s\S]*?)<!--\s*\/roster:dispatch\s*-->/;

/**
 * The persona names presented as invocable in a guide's dispatch fence.
 *
 * Returns `null` when the fence is ABSENT, and the caller must treat that as an error rather than as
 * an empty roster — an empty set compares equal to "nothing missing", which is the vacuous-pass shape
 * this repo keeps paying for. A fence that is present and empty returns `[]`, a real and failing answer.
 */
export function rosterDispatchNames(markdown) {
  const fenced = ROSTER_FENCE.exec(markdown);
  if (!fenced) return null;
  return [...fenced[1].matchAll(/`([a-z][a-z0-9-]*)`/g)]
    .map((m) => m[1])
    .sort((a, b) => a.localeCompare(b));
}

/** Compare a guide's dispatch fence against the live persona ids. Empty string means they agree. */
export function rosterDispatchReport(fenceNames, livePersonaIds) {
  if (fenceNames === null) {
    return [
      'CLAUDE.md has no `roster:dispatch` fence, so the dispatch roster is unchecked.',
      'Restore the <!-- roster:dispatch --> … <!-- /roster:dispatch --> markers around the list.',
    ].join('\n');
  }
  const live = [...livePersonaIds].sort((a, b) => a.localeCompare(b));
  const dead = fenceNames.filter((n) => !live.includes(n));
  const unnamed = live.filter((n) => !fenceNames.includes(n));
  if (dead.length === 0 && unnamed.length === 0) return '';
  return [
    "CLAUDE.md's dispatch roster no longer matches tedeuxx/tadeumendonca-skills:",
    ...dead.map((n) => `  - ${n} is dispatched in CLAUDE.md and has NO file in the plugin's agents/`),
    ...unnamed.map((n) => `  + ${n} exists in the plugin and is dispatched NOWHERE in CLAUDE.md`),
    '',
    'This is almost certainly NOT your change — the roster lives in a separate repository.',
    'Fix the list between the <!-- roster:dispatch --> markers. Say what ABSORBED a retired persona',
    "rather than only deleting the name; the file's convention is supersede, never rewrite.",
  ].join('\n');
}

// ---------------------------------------------------------------------------------------------
// CROSS-REPO LINKS ON /architecture.
//
// The page links into the plugin repository by hard-coded GitHub URL — the agents directory, the hook
// scripts, hooks.json, the command families, the methodology ADRs, the design document. Those are exactly
// the claims a reader is invited to check, and `architecture-links.test.ts` cannot see them: it resolves
// paths in THIS repository, offline, and skips every cross-repo URL by design.
//
// So the guard rides here, where a tokenless checkout of the plugin has already been paid for by the
// drift check. Same argument the roster check makes directly above: the expensive part is the checkout,
// and a second reader of that tree costs nothing.
//
// WHAT IT CANNOT DO, said plainly rather than left to look stronger: it resolves paths against a checkout
// of `main`, so it proves the path EXISTS — not that a `#anchor` on such a URL resolves, and not that the
// file still says what the page claims. The same limit ADR-0043 already records for the inventory.

/** Every `tadeumendonca-skills` blob/tree URL in a markdown body, as repo-relative paths. */
export function pluginLinkTargets(markdown) {
  const re = /https:\/\/github\.com\/tedeuxx\/tadeumendonca-skills\/(?:blob|tree)\/main\/([^)\s#]+)/g;
  return [...markdown.matchAll(re)].map((m) => m[1]);
}

/**
 * Compare those paths against a plugin checkout. Empty string means every one resolves.
 *
 * `exists` is injected rather than imported, so the deciding half stays testable without a second
 * repository on disk — the same split `collectComponents` and its fixtures already use.
 *
 * ZERO TARGETS IS A FAILURE, not a pass. An empty list satisfies "nothing missing" perfectly, and that
 * vacuous shape is the one this repo keeps paying for; it means either the page stopped pointing at the
 * plugin or the regex stopped matching, and both are worth a red build.
 */
export function pluginLinkReport(targets, exists) {
  if (targets.length === 0) {
    return [
      '/architecture cites no files in tedeuxx/tadeumendonca-skills at all.',
      'Either the page stopped pointing at the plugin, or the URL pattern stopped matching.',
      'This check would now pass on anything, which is why it fails instead.',
    ].join('\n');
  }
  const missing = [...new Set(targets)].filter((p) => !exists(p)).sort();
  if (missing.length === 0) return '';
  return [
    '/architecture links to paths that do not exist in tedeuxx/tadeumendonca-skills:',
    ...missing.map((p) => `  - ${p}`),
    '',
    'This is almost certainly NOT your change — the target lives in a separate repository.',
    'Fix the link in apps/fed/src/content/architecture.{pt,en}.md, in BOTH editions: the link-parity',
    'test compares the two, so a one-sided fix trades this failure for that one.',
  ].join('\n');
}
