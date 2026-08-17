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
 *                families, the skill library, the un-namespaced commands, and the `SessionStart` hooks,
 *                which print context at session start and cannot refuse anything.
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
  // `SubagentStart`/`SubagentStop` (#209, `-skills` dispatch-metrics-{start,stop}.sh): same shape as
  // `SessionStart` above, not `PreToolUse` — read both scripts in full before assuming otherwise. Start
  // is a near-no-op (a dependency probe that posts nothing); Stop posts a structured metrics comment to
  // the dispatch's Issue, but it never inspects, blocks, or denies a tool call, and every exit path in
  // both scripts is `exit 0`. Neither hook has a tool call in front of it to refuse — a subagent's start
  // or stop is not a gated act the way a `Bash` invocation is — so `denies` would assert a mechanism
  // neither script has. They report/log; that is `documents`.
  'hook:SubagentStart': 'documents',
  'hook:SubagentStop': 'documents',
  persona: 'advises',
  'skill-library': 'documents',
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

// ── THE TWO LAYOUTS (`-skills`#164) ──────────────────────────────────────────────────────────────
//
// The plugin is moving its knowledge library out of `commands/` and into a flat `skills/`, and this
// module has to read BOTH — not as a courtesy, but because it has no way to tell them apart in advance.
// `.github/workflows/app.yml` checks the plugin out with NO `ref:`, so `harness-drift` always compares
// against the plugin's `main` HEAD; there is no version to gate on, and the tree changes shape under
// this repo the moment a PR merges over there. A switch keyed on anything but the tree itself would be
// a switch that is wrong for the window between the two merges.
//
// WHAT EACH LAYOUT IS:
//   · `command-families` — today. `commands/<family>/<name>.md`, five families, plus un-namespaced
//     commands at the root of `commands/`. No `skills/`.
//   · `skill-library` — after `-skills`#164. A `skills/` tree, no command families; `commands/` keeps
//     only the typed commands (`autonomy-on`, `new-issue`, and later `autonomy-off`).
//
//     THIS VALUE WAS `flat-skills` AND THE NAME WAS A CLAIM THAT TURNED OUT FALSE. #428 named it for a
//     shape the plugin had announced and did not ship: it shipped `skills/<family>/<name>/SKILL.md`, two
//     levels. The label is renamed rather than left alone because it is PRINTED — `check-harness-drift`
//     puts it in the green `::notice::` line, so the one run that records which tree was compared would
//     have recorded it as flat while comparing a nested one. The depth is no longer in the name because
//     the depth is no longer the point; see the block above `declaredSkillPaths`.
//
// `commands/` is read the SAME WAY in both, which is why there is no mode switch in `collectCommands`:
// under the new layout that directory simply has no subdirectories, so the family loop yields nothing
// and the orphan reader yields the typed commands. The layout is a fact this reports, not a branch the
// readers take.

/**
 * Which layout this tree is in — and the one state that is NEITHER, refused rather than reported.
 *
 * THIS IS WHAT REPLACES THE NESTED-DIRECTORY THROW, and the two guard the same property one layout
 * apart. `collectCommands` throws on `commands/<family>/<nested>/` because a family holding a
 * subdirectory publishes a count that no longer means what it says — the family would read 1 while
 * holding 2. That invariant is about a number being honest, and it goes dormant when families stop
 * existing, because there is no family count left to be dishonest.
 *
 * The property that survives the flattening is the one underneath it: **every skill is counted exactly
 * once, in exactly one place.** A tree with `skills/` AND surviving families under `commands/` breaks
 * that in the worst available way — it is not an undercount but a DOUBLE count, and it is the state a
 * half-finished migration, an interrupted rebase or a bad merge in the plugin actually produces. So it
 * is refused here, loudly, naming the families still standing.
 *
 * The nested throw stays where it is rather than being replaced in place: it is still correct while
 * families exist, and it costs nothing once they do not.
 */
/**
 * `skills/` if it is there and is a DIRECTORY, `null` if it is absent — and a throw for the third case.
 *
 * The third case is why this is a shared helper rather than an `existsSync` at each site. `pluginLayout`
 * asked `existsSync && isDirectory` and `collectSkills` asked `existsSync` alone, so a plain FILE named
 * `skills` at the plugin root made them disagree: the layout reported `command-families` while the
 * collector went on to `readdirSync` a file and died as an `ENOTDIR` with no name in it. One reader,
 * one answer, and the odd case named instead of split between them.
 */
function skillsDirOf(pluginDir) {
  const dir = join(pluginDir, 'skills');
  if (!existsSync(dir)) return null;
  if (!statSync(dir).isDirectory()) {
    throw new Error(
      `${dir} exists and is not a directory. The skill library is a directory of skill directories; ` +
        'a file by that name is neither layout, and guessing which one it meant is how a wrong count ships.',
    );
  }
  return dir;
}

export function pluginLayout(pluginDir) {
  const commandsDir = join(pluginDir, 'commands');
  const hasSkills = skillsDirOf(pluginDir) !== null;
  const families = existsSync(commandsDir) ? dirsIn(commandsDir).sort() : [];
  if (hasSkills && families.length > 0) {
    throw new Error(
      `the plugin tree is in BOTH layouts: skills/ exists and commands/ still holds ${families.length} ` +
        `famil(ies) — ${families.join(', ')}. Every skill must be counted exactly once, and a tree in ` +
        'both layouts counts some of them twice. Finish the move (tedeuxx/tadeumendonca-skills#164) or ' +
        'check out a commit from before it started.',
    );
  }
  return hasSkills ? 'skill-library' : 'command-families';
}

// ── WHAT MAKES A SKILL LOADABLE: DECLARATION, NOT DEPTH (`-skills`#164 step 4) ───────────────────
//
// #428 taught this module ONE level — `skills/<name>/SKILL.md` — because that is the shape the plugin
// had announced. It shipped TWO: `skills/<family>/<name>/SKILL.md`, 69 skills in five families, and this
// collector threw on all five families at once. The tree is read with no `ref:`, so that throw landed on
// every PR in this repo the moment the plugin merged.
//
// THE OBVIOUS FIX IS THE WRONG ONE, and the measurement is what says so. Teaching the walker a second
// level — or teaching it to walk to any depth — encodes DEPTH as the thing that decides whether Claude
// Code can load a skill. It is not. Measured 2026-08-10, treatment against control, one variable, with
// two byte-identical trees differing only in `.claude-plugin/plugin.json`:
//
//   · `skills/fam/nested/SKILL.md`, plugin.json carrying a `skills` array naming it → RESOLVED.
//   · `skills/fam/nested/SKILL.md`, no `skills` array, same tree            → SKILL-NOT-AVAILABLE.
//   · `skills/flatctl/SKILL.md`,    no `skills` array, same tree            → RESOLVED.
//
// So the rule is: with a `skills` array, whatever it DECLARES is loadable, at any depth. Without one,
// only the top level of `skills/` auto-registers. A depth-walking collector would count a nested skill
// that no array declares — publishing a capability the plugin does not have, which is the precise error
// ADR-0043 exists to prevent, arrived at from the opposite direction.
//
// THEREFORE THE DECLARED ARRAY IS THE SOURCE where it exists. It is a manifest the plugin publishes
// about itself, and it answers the question this module is actually asking — what can be loaded — which
// the tree can only ever approximate. The walk survives as the FALLBACK, for a plugin with no array,
// where it is not an approximation but exactly the registration rule.
//
// BOTH DIRECTIONS ARE CHECKED when an array is present, for the same reason `diffAgainstManifest`
// compares three ways rather than two: a declared path with no `SKILL.md` is a broken declaration, and a
// skill in the tree that the array does not name is authored-but-unregistered. Counting the second
// silently would under-report the library; ignoring the first would over-report it. Both are refused,
// and every offender is named in one throw rather than the first one found.

/** The plugin's own manifest. `null` where it is absent — that is the fallback path, not an error. */
function pluginManifestOf(pluginDir) {
  const file = join(pluginDir, '.claude-plugin', 'plugin.json');
  if (!existsSync(file)) return null;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(
      `.claude-plugin/plugin.json is not valid JSON (${err.message}). It is the plugin's own manifest ` +
        'and the inventory is derived from it, so a tree that cannot be parsed is refused rather than ' +
        'quietly falling back to walking the directory, which would report a different number.',
    );
  }
  return parsed;
}

/**
 * The IDENTITY of a declared path — what the filesystem resolves it to, where that is knowable.
 *
 * THE BUG THIS EXISTS TO CLOSE, measured rather than reasoned: the dedupe below compared the declared
 * STRING while `verifyDeclaredSkills` resolves a PATH, so two spellings of one directory satisfied both
 * cross-checks and published a count of 2 for a tree holding 1. Three spellings were measured doing it —
 * `skills//<name>`, `skills/<fam>/./<name>` and, on a case-insensitive filesystem, `skills/VPC` beside
 * `skills/vpc`. None is exotic; a hand-edited manifest produces the first two by accident.
 *
 * So the two directions are made to compare the same object. Segment normalisation collapses the empty
 * and `.` segments — that part is platform-independent and is done on the string. CASE is not, and must
 * not be: `skills/VPC` and `skills/vpc` are two different directories on Linux and one on macOS, so
 * lower-casing here would invent a collision on the platform where none exists. The filesystem's own
 * answer is the only correct arbiter, which is what `realpathSync` asks it.
 *
 * WHAT THAT LEAVES, said plainly rather than implied away: the case variant is refused on BOTH platforms
 * but with DIFFERENT sentences — macOS resolves it to the same real path and reports it as declared
 * twice; Linux cannot resolve it at all and `verifyDeclaredSkills` reports it as declared and missing.
 * Two messages, one verdict, and the verdict is the property that matters: no platform reports a green
 * count of 2. A single shared sentence would need a case-insensitive comparison, which is the thing that
 * would be wrong on Linux.
 *
 * A path that does not resolve gets its normalised string as its key. That is deliberate: non-existence
 * is `verifyDeclaredSkills`'s finding and its message is the better one, so this must not pre-empt it —
 * it only has to keep two unresolvable spellings from colliding into one.
 */
function declaredIdentity(pluginDir, segments) {
  const norm = segments.join('/');
  const exact = exactPathOf(pluginDir, segments);
  if (exact === null) return { key: norm, real: null };
  try {
    const real = realpathSync(exact);
    return { key: real, real };
  } catch {
    return { key: exact, real: null };
  }
}

/**
 * Walk a declared path segment by segment, matching each name against its parent's DIRECTORY LISTING —
 * `null` where any segment is not spelled exactly that way.
 *
 * THE LISTING, NOT `existsSync`, and not `realpathSync` either. This is the third site in this module
 * where that distinction decides the answer, and the first two only guarded the `SKILL.md` filename:
 * macOS resolves names case-insensitively and Linux does not, so `skills/…/VPC` beside `skills/…/vpc`
 * EXISTS on a laptop and does not in CI. Measured on this slice, and it is the reason this helper exists
 * rather than a `realpathSync` call: **macOS `realpath` does not canonicalise case** — handed the `VPC`
 * spelling it returns `VPC`, so a resolved-path identity saw two different paths and passed the pair
 * straight through to a count of 2. An exact listing comparison answers the same on both platforms, so
 * the case variant is refused with ONE sentence everywhere: declared, and not in the tree.
 */
function exactPathOf(pluginDir, segments) {
  let cur = pluginDir;
  for (const segment of segments) {
    let entries;
    try {
      entries = readdirSync(cur);
    } catch {
      return null;
    }
    if (!entries.includes(segment)) return null;
    cur = join(cur, segment);
  }
  return cur;
}

/**
 * Is a resolved declared path actually inside the plugin's own `skills/` tree?
 *
 * `resolvePluginDir` canonicalises the plugin ROOT and argues the containment case at length; nothing
 * applied the same argument one level in, so a `skills/<name>` symlink pointing anywhere on the disk was
 * followed and counted. Measured: a symlink out of the tree holding a `SKILL.md` was counted as a skill.
 * The effect is a wrong count rather than a read of anything secret — this module only ever asks whether
 * a directory listing contains `SKILL.md` — but it is the same containment claim, unenforced.
 *
 * Compared as a real path against a real path, with the separator appended so a sibling directory whose
 * name merely STARTS with `skills` cannot pass as a child of it.
 */
function withinSkillsTree(pluginDir, real) {
  const dir = skillsDirOf(pluginDir);
  if (dir === null) return true;
  const root = realpathSync(dir);
  return real === root || real.startsWith(root + sep);
}

/**
 * The skill paths a plugin DECLARES, normalised — or `null` where it declares none.
 *
 * `null` and `[]` are different answers and the caller treats them differently: no array at all means
 * "fall back to the registration rule for an undeclared tree", while an array that is present and empty
 * is a plugin claiming to publish no skills, which is a real and failing state rather than a fallback.
 *
 * The entries in the live tree are `./skills/<family>/<name>` — DIRECTORY paths with a `./` prefix, not
 * paths to `SKILL.md`. Asserted here rather than assumed, because a reader who expects the file form
 * writes a check that never matches and a count that is silently zero.
 */
export function declaredSkillPaths(pluginDir) {
  const manifest = pluginManifestOf(pluginDir);
  if (manifest === null || manifest.skills === undefined) return null;
  if (!Array.isArray(manifest.skills)) {
    throw new TypeError(
      `.claude-plugin/plugin.json has a \`skills\` field that is not an array (got ${typeof manifest.skills}). ` +
        'Claude Code reads it as a list of skill directories; anything else is a malformed manifest.',
    );
  }

  const seen = new Set();
  const bad = [];
  const paths = [];
  for (const raw of manifest.skills) {
    const outcome = classifyDeclaredSkillPath(pluginDir, raw, seen);
    if (outcome.bad !== undefined) {
      bad.push(outcome.bad);
    } else {
      paths.push(outcome.path);
    }
  }

  if (bad.length > 0) {
    throw new Error(
      `.claude-plugin/plugin.json declares ${bad.length} unusable skill path(s):\n  ${bad.join('\n  ')}`,
    );
  }
  return paths.sort((a, b) => a.localeCompare(b));
}

/**
 * Strip a leading `./` and any trailing `/`s without a regex — `/\/+$/` reads as trivial but a
 * quantifier anchored only at the end is exactly the shape static analysis flags for super-linear
 * backtracking risk, and there was no reason to keep it once a manual scan reads just as plainly.
 */
function stripPathAdornments(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('./')) cleaned = cleaned.slice(2);
  let end = cleaned.length;
  while (end > 0 && cleaned[end - 1] === '/') end -= 1;
  return cleaned.slice(0, end);
}

/**
 * Classify ONE entry of `plugin.json`'s `skills` array — pulled out of `declaredSkillPaths` so this
 * branch-heavy per-entry logic counts against its own Cognitive Complexity budget instead of stacking
 * onto the loop that calls it once per manifest entry.
 */
function classifyDeclaredSkillPath(pluginDir, raw, seen) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return { bad: `${JSON.stringify(raw)} is not a non-empty string` };
  }
  // `./skills/x/y` and `skills/x/y` are the same declaration and must not count twice — and so are
  // `skills//x/y` and `skills/x/./y`, which is why the empty and `.` segments are DROPPED rather than
  // merely tolerated. The normalised form is what both directions compare, including the
  // `declared.includes(...)` test in `verifyDeclaredSkills`: leaving `skills//x` in the list there
  // meant the tree's `skills/x` matched a different entry and the undeclared check stayed quiet.
  const cleaned = stripPathAdornments(raw);
  const segments = cleaned.split('/').filter((s) => s !== '' && s !== '.');
  const norm = segments.join('/');
  if (cleaned.startsWith('/') || segments.includes('..')) {
    return { bad: `${raw} escapes the plugin tree` };
  }
  if (segments[0] !== 'skills' || segments.length < 2) {
    // Refused rather than widened. The component this emits claims `file: "skills"`, and a declared
    // skill living somewhere else would make that claim false while the count still looked right.
    // Widening the inventory to cover it is a shape decision for the ADR library, not something to
    // settle by loosening a condition in a derivation script.
    return { bad: `${raw} is not under skills/ — the inventory publishes this library as \`skills\`` };
  }
  const { key, real } = declaredIdentity(pluginDir, segments);
  if (real !== null && !withinSkillsTree(pluginDir, real)) {
    return { bad: `${raw} resolves to ${real}, outside the plugin's skills/ tree` };
  }
  if (seen.has(key)) {
    return { bad: `${raw} is declared more than once — it resolves to the same directory as another entry` };
  }
  seen.add(key);
  return { path: norm };
}

/**
 * Every directory under `skills/` that HOLDS a `SKILL.md`, at any depth, as `skills/…` paths.
 *
 * Used only to cross-check the declared array — never as the count itself, which is the whole argument
 * above. It does NOT descend into a directory that already has a `SKILL.md`: a skill's own supporting
 * files are the capability the directory form buys (`skills/vpc/reference/…`), and treating them as
 * candidate skills is the mistake the flat reader was explicitly written to avoid.
 *
 * `readdirSync(...).includes('SKILL.md')` and NOT `existsSync(join(dir, 'SKILL.md'))`, at this depth as
 * at the last one. macOS resolves names case-insensitively and Linux does not, so the `existsSync`
 * spelling answers TRUE on the author's laptop and FALSE in the `harness-drift` job for a tree shipping
 * `skill.md` — the same tree, two verdicts, and the green one is the one the author sees.
 */
export function skillDirsInTree(dir, prefix = 'skills') {
  const out = [];
  for (const entry of readdirSync(dir).filter((e) => !e.startsWith('.')).sort()) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (readdirSync(full).includes('SKILL.md')) {
      out.push(`${prefix}/${entry}`);
    } else {
      out.push(...skillDirsInTree(full, `${prefix}/${entry}`));
    }
  }
  return out;
}

/**
 * The skills a plugin with NO `skills` array registers: the top level of `skills/`, and nothing below it.
 *
 * THE REFUSAL MESSAGE IS THE MEASURED CLAIM, not the old one. It used to say the offenders were entries
 * "Claude Code cannot load as a skill", which is FALSE of the shape that actually arrived — the plugin's
 * five family directories load perfectly well, because its manifest declares every skill inside them.
 * A refusal whose stated reason is untrue teaches the next reader the wrong rule, and the wrong rule
 * here is exactly the one that would send them off to write a depth-walking collector.
 *
 * So it now says the thing that is true AND checkable in this branch: there is no `skills` array, and
 * without one only the top level registers. The fix it names is the fix that works — declare them.
 */
function autoRegisteredSkills(dir) {
  const names = [];
  const wrong = [];
  for (const entry of readdirSync(dir).filter((e) => !e.startsWith('.')).sort()) {
    if (!statSync(join(dir, entry)).isDirectory()) {
      wrong.push(`skills/${entry} is a file — a skill is a directory holding SKILL.md`);
      // `readdirSync(...).includes('SKILL.md')` and NOT `existsSync(join(..., 'SKILL.md'))`, which is
      // the spelling that reads identically and is not. macOS is case-insensitive by default and Linux
      // is not, so a plugin shipping `skill.md` would resolve here on a laptop and fail in the CI job —
      // the same tree, two verdicts, and the one that is green is the one an author sees. An exact
      // string comparison against the directory listing answers the same question on both.
    } else if (!readdirSync(join(dir, entry)).includes('SKILL.md')) {
      wrong.push(`skills/${entry}/ has no SKILL.md`);
    } else {
      names.push(entry);
    }
  }

  if (wrong.length > 0) {
    throw new Error(
      `.claude-plugin/plugin.json declares no \`skills\` array, and without one Claude Code registers ` +
        `only skills/<name>/SKILL.md — the top level and no deeper. ${wrong.length} entr(ies) are not ` +
        `at that shape, so this plugin does not register them:\n  ${wrong.join('\n  ')}\n` +
        'Either move them to the top level, or declare them in the `skills` array, which makes a skill ' +
        'loadable at any depth (measured: a nested skill resolved when the array named it and did not ' +
        'when the array was absent, in two otherwise byte-identical trees).',
    );
  }
  return names;
}

/**
 * The skills a plugin DECLARES, verified against the tree in BOTH directions.
 *
 * Returns the declared paths, which are the inventory. The two refusals are different defects and are
 * reported as different sentences rather than pooled into one count: a declaration with nothing behind
 * it is a manifest that over-claims, and a skill the manifest does not name is one the plugin wrote and
 * cannot load. A reader has to know which they have, because the fixes are opposite.
 */
function verifyDeclaredSkills(dir, declared) {
  const broken = [];
  for (const path of declared) {
    // `path` is `skills/<…>`; `dir` already IS `<plugin>/skills`, so drop the leading segment.
    const segments = path.split('/').slice(1);
    const full = join(dir, ...segments);
    // RESOLVED THROUGH THE LISTING rather than with `existsSync`, which is the same case trap this
    // function already guards one level down for `SKILL.md` and did not guard for the directory path
    // itself. `existsSync` answers TRUE on macOS for a declared `VPC` over a tree holding `vpc` and
    // FALSE in CI — the same manifest, two verdicts, and the green one is the author's. Now both say
    // the same thing.
    if (exactPathOf(dir, segments) === null) {
      broken.push(`${path} is declared and does not exist in the tree`);
    } else if (!statSync(full).isDirectory()) {
      broken.push(`${path} is declared and is a file — a skill is a directory holding SKILL.md`);
    } else if (!readdirSync(full).includes('SKILL.md')) {
      // Same exact-listing comparison as above, and for the same reason, one level deeper.
      broken.push(`${path} is declared and holds no SKILL.md`);
    }
  }
  if (broken.length > 0) {
    throw new Error(
      `.claude-plugin/plugin.json declares ${broken.length} skill(s) that the tree does not back:\n  ` +
        `${broken.join('\n  ')}\n` +
        'A declared path with no SKILL.md behind it is a manifest that over-claims — Claude Code would ' +
        'register nothing for it, while the inventory /architecture publishes counted it.',
    );
  }

  const undeclared = skillDirsInTree(dir).filter((p) => !declared.includes(p));
  if (undeclared.length > 0) {
    throw new Error(
      `skills/ holds ${undeclared.length} skill(s) that .claude-plugin/plugin.json does not declare:\n  ` +
        `${undeclared.join('\n  ')}\n` +
        'Once a plugin declares a `skills` array, that array is what Claude Code registers, so a skill ' +
        'the array omits is authored and NOT loadable. Counting it would publish a capability the ' +
        'plugin does not have; skipping it silently would let the library shrink with no signal.',
    );
  }
  return declared;
}

/**
 * The skill library, as ONE component with a count — not sixty-nine.
 *
 * THE GRANULARITY IS THE DECISION HERE, so it is argued rather than assumed. Today's manifest carries
 * no row per command FILE: it carries five families, each with a `commands` count. The flat analogue at
 * that same granularity is one library with a `skills` count, and that is what this emits. A row per
 * skill would be a NEW granularity the inventory has never had, and it would buy identity at a price
 * this repo pays on someone else's behalf: ADR-0043's accepted cost is that a plugin merge reddens the
 * next PR HERE, from an author who did not cause it, and the plugin's live workstream is deepening and
 * merging those very files. One count moves when the library's SIZE moves; sixty-nine ids move whenever
 * anybody renames one.
 *
 * WHAT THAT COSTS, said plainly rather than left to look free: a skill RENAMED with the count unchanged
 * is invisible to the drift check. That is exactly as invisible as a command renamed inside a family is
 * today, so it is parity rather than a regression — but it is a real limit and the page must not be
 * written as though the inventory pins skill names. It pins how many there are.
 *
 * THE FORM IS ASSERTED, NOT GUESSED. A Claude Code skill is a DIRECTORY holding `SKILL.md`; a loose
 * `skills/vpc.md` is not loadable as one. Both silent options are wrong in the way ADR-0043 exists to
 * prevent: ignoring it under-reports the figure `/architecture` publishes, and counting it publishes a
 * capability the plugin does not have. So anything in `skills/` that is not a skill directory is
 * refused, and EVERY offender is named in one throw rather than the first one found.
 *
 * WHAT THE COUNT MEANS, and it now has two derivations rather than one — see the block above. Where the
 * plugin declares a `skills` array, the count is what it DECLARES, cross-checked against the tree in
 * both directions. Where it declares none, the count is the top level of `skills/`, which is exactly
 * what Claude Code auto-registers for such a tree. Both are "how many skills this plugin can load"; the
 * difference is which rule answers it, and the rule is the plugin's to choose, not this reader's.
 *
 * An `skills/` that exists and holds nothing throws for the vacuous-pass reason this module keeps
 * paying for: zero satisfies every downstream comparison perfectly.
 *
 * Dotted entries are skipped — `.DS_Store` and `.gitkeep` are not failed skills.
 */
export function collectSkills(pluginDir) {
  // The one early return in this module, and it is an ALLOW path, so say where it lands: absent
  // `skills/` is the pre-split tree, and the two refusals below have nothing to refuse when the
  // directory is not there. It is also the only fail-OPEN direction here — everything else throws.
  //
  // AND IT USED TO RETURN BEFORE THE ARRAY WAS EVER READ, which made it fail open in the one direction
  // this module is proudest of closing. Measured: a manifest declaring skills over a tree with no
  // `skills/` directory returned `[]` and `pluginLayout` reported the OLD layout — a manifest
  // over-claiming in its most extreme form, answered with silence. Downstream it does go red, as the
  // library row orphaned, but with the wrong sentence: "no longer in the plugin" instead of "you
  // declared N skills and there is no skills/ directory". The declaration is read FIRST now, so the
  // refusal names the actual defect. That is a diagnosis fix, not an exposure fix, and it is written
  // here rather than left to the diff to imply.
  const dir = skillsDirOf(pluginDir);
  const declaredOrNull = declaredSkillPaths(pluginDir);
  if (dir === null) {
    if (declaredOrNull !== null) {
      throw new Error(
        `.claude-plugin/plugin.json declares ${declaredOrNull.length} skill(s) and the plugin has no ` +
          'skills/ directory at all. Claude Code registers nothing for any of them, so the manifest ' +
          'claims a library that does not exist. Either ship the tree or remove the `skills` array.',
      );
    }
    return [];
  }

  const declared = declaredOrNull;
  const names = declared === null ? autoRegisteredSkills(dir) : verifyDeclaredSkills(dir, declared);

  if (names.length === 0) {
    throw new Error(
      'skills/ exists and holds no skill at all. A zero count agrees with every comparison downstream, ' +
        'so an empty library would publish an inventory of nothing under a green build.',
    );
  }

  return [
    {
      kind: 'skill-library',
      id: 'skills',
      file: 'skills',
      skills: names.length,
      enforcement: enforcementFor('skill-library'),
    },
  ];
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
 * publishes silently stops meaning what it says. Once the plugin's families are gone (`-skills`#164)
 * this loop iterates nothing and the throw is dormant rather than removed — see `pluginLayout` for the
 * invariant that carries the same property into the flat layout.
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
const KIND_ORDER = ['hook', 'persona', 'skill-library', 'command-family', 'command'];

export function collectComponents(pluginDir) {
  // FIRST, before anything is counted. A tree in both layouts must fail as a tree, not as a manifest
  // that happens to hold two overlapping rows — by the time the rows exist the double count is already
  // the artifact, and `gen-harness` would have written it.
  pluginLayout(pluginDir);
  const all = [
    ...collectHooks(pluginDir),
    ...collectPersonas(pluginDir),
    ...collectSkills(pluginDir),
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
  // `localeCompare`, not a bare `.sort()`. Default sort coerces to string and orders by UTF-16 code
  // unit, which is a latent defect on any other input and merely arbitrary on paths — SonarCloud flags
  // it CRITICAL (javascript:S2871) either way, and it turned the quality gate red the moment this line
  // landed. Explicit here matches `rosterDispatchReport` directly above, which already sorts this way.
  const missing = [...new Set(targets)].filter((p) => !exists(p)).sort((a, b) => a.localeCompare(b));
  if (missing.length === 0) return '';
  return [
    '/architecture links to paths that do not exist in tedeuxx/tadeumendonca-skills:',
    ...missing.map((p) => `  - ${p}`),
    '',
    'This is almost certainly NOT your change — the target lives in a separate repository.',
    'Fix the link in apps/fed/src/content/architecture.{pt,en}.md, in BOTH editions:',
    '`pluginLinkParityReport` compares them, so a one-sided fix trades this failure for that one.',
  ].join('\n');
}

/**
 * CROSS-EDITION PARITY for those same plugin links: same targets, in the same order, in both editions.
 *
 * WHY THIS FUNCTION EXISTS AT ALL, stated as the defect it closes rather than as a feature. The caller
 * POOLS the two editions before calling `pluginLinkReport`, and the comment justifying that pooling used
 * to cite a parity test that did not exist: `architecture-links.test.ts`'s `BLOB_URL` matches
 * `tadeumendonca-io` only, so a plugin link was invisible to it and its parity assertion compared `[]`
 * to `[]`. Measured before this was written — a plugin link present in `en` and absent in `pt` satisfied
 * that assertion AND the pooled existence report, because pooling makes one edition's citation stand in
 * for both. A pt reader silently lost evidence an en reader was offered, in a green build.
 *
 * Pooling is still right for EXISTENCE — a path either exists over there or it does not, and asking twice
 * would double the same question. Parity is the question pooling erases, so it is asked here, first.
 *
 * IT TAKES TARGETS, NOT MARKDOWN, and needs no plugin checkout: the rule is a property of the two files
 * in THIS repository. That is what lets the caller run it above the plugin-present skip, so a local run
 * with no sibling repo still checks it.
 *
 * ORDER IS PART OF THE RULE, matching the in-repo parity assertion in `architecture-links.test.ts`
 * (#153). The two editions are hand-translated section by section, so a link inserted into the wrong
 * section of one of them is the realistic drift, and it has the same targets.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: it does not fail on zero. Two editions that both cite nothing are in
 * parity, truthfully. `pluginLinkReport` above owns the non-vacuity floor and is the single place that
 * rule lives; duplicating it here would be a second implementation of a rule that already has one — the
 * exact mistake the false comment above was trying to avoid, made for real.
 */
export function pluginLinkParityReport(ptTargets, enTargets) {
  if (ptTargets.length === enTargets.length && ptTargets.every((p, i) => p === enTargets[i])) return '';
  const onlyIn = (a, b) => [...new Set(a)].filter((p) => !b.includes(p)).sort((x, y) => x.localeCompare(y));
  const missingFromPt = onlyIn(enTargets, ptTargets);
  const missingFromEn = onlyIn(ptTargets, enTargets);
  return [
    '/architecture cites tedeuxx/tadeumendonca-skills differently in its two editions.',
    ...missingFromPt.map((p) => `  - ${p} is cited in en and NOT in pt`),
    ...missingFromEn.map((p) => `  + ${p} is cited in pt and NOT in en`),
    // Reached when neither list names a path and the arrays still differ. TWO shapes land here, and the
    // line covers both rather than naming the likelier one: the same targets in a different order, and
    // the same targets cited a different NUMBER of times (`pluginLinkReport` de-duplicates, so a repeated
    // citation is a real shape in these files). Said explicitly because a report that names no path at
    // all reads like a bug in the report.
    ...(missingFromPt.length === 0 && missingFromEn.length === 0
      ? ['  (the same targets, in a different order or cited a different number of times)']
      : []),
    '',
    'Both editions must cite the same targets in the same order: a link added to one and forgotten in',
    'the other is a reader of that locale who cannot reach the evidence the other locale is offered.',
    'Fix apps/fed/src/content/architecture.{pt,en}.md — this one IS your change; the page is in this repo.',
  ].join('\n');
}
