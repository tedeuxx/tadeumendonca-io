// The pure half of the harness inventory, against FIXTURES (#318, ADR-0043).
//
// Fixtures rather than the real sibling repo, and that is the decision rather than convenience: `npm
// test` must not require a contributor to have `tadeumendonca-skills` cloned beside this one. A gate that
// fails for a missing sibling is a gate everyone learns to ignore, and then it guards nothing. The LIVE
// comparison — manifest versus the real plugin tree — is check-harness-drift.mjs, run as its own job in
// the `app` workflow with a second tokenless checkout.
//
// What this file therefore CAN and CANNOT prove, said plainly. It proves the parsing, the closed
// enforcement set and the three-way diff behave; and, against the committed manifest, that the manifest
// is well-formed and non-empty. It does NOT prove the manifest matches the plugin — nothing runnable
// here can, and pretending otherwise is the failure this whole mechanism exists to remove.
import { describe, it, expect } from 'vitest';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import {
  WORKSPACE_ROOT,
  resolvePluginDir,
  assertEnforcement,
  assertPluginVersion,
  readPluginVersion,
  collectCommands,
  collectComponents,
  collectHooks,
  collectPersonas,
  componentKey,
  diffAgainstManifest,
  driftReport,
  enforcementFor,
  pluginPresent,
} from './harness-source.mjs';

const root = resolve(import.meta.dirname, '..');
const fixture = (name) => join(import.meta.dirname, '__fixtures__', name);
const manifest = JSON.parse(
  readFileSync(join(root, 'src', 'content', 'generated', 'harness.json'), 'utf8'),
);

describe('the committed manifest is a manifest at all', () => {
  // The vacuous-pass guard, and it is the reason this describe block exists separately from the diff
  // tests. An EMPTY manifest agrees perfectly with an empty plugin read, so every comparison downstream
  // would be green while asserting nothing — the exact shape that has bitten this repo more than once.
  it('is non-empty and carries every kind the diagram draws', () => {
    expect(manifest.length).toBeGreaterThan(10);
    expect([...new Set(manifest.map((c) => c.kind))].sort()).toEqual([
      'command',
      'command-family',
      'hook',
      'persona',
    ]);
  });

  it('carries only enforcement classes the closed set knows', () => {
    expect(() => manifest.forEach((c) => assertEnforcement(c.enforcement))).not.toThrow();
  });

  // THE CLAIM THE DIAGRAM MAKES, pinned on the manifest rather than on the drawing. Personas advise —
  // including quality-assurance, whose SEAT on the merge path is mechanical (permission-guard rule 7b
  // refuses `gh pr merge` from every agent_type but that one) while the JUDGEMENT it makes there is
  // enforced by nothing. `advises` is about the judgement. If this ever flips to `denies`, the page
  // starts asserting a safety property nothing implements, which is the one thing ADR-0043 forbids.
  //
  // THE TWO NAMED PERSONAS ARE THE TWO HARD CASES, not a sample — each is a different way the drawing
  // could start over-claiming, which is why they are pinned by name and the other three are not:
  //   · `quality-assurance` has a mechanically enforced SEAT and an unchecked judgement;
  //   · `product-lead` is the mirror — its truth findings BLOCK a merge, but by convention, and no
  //     hook refuses the merge command on its behalf.
  // If either ever reads `denies`, the page claims a floor that does not exist.
  //
  // ~~`security`~~ held the second slot until 2026-08-05 and was retired from the roster in the
  // plugin's own merge, which is what turned this assertion red here — the cross-repo drift this
  // whole manifest exists to make visible, behaving exactly as designed. It is replaced rather than
  // dropped: a single-name assertion pins the easy case and leaves the mirror case unguarded.
  it('says personas ADVISE and PreToolUse hooks DENY, and never the other way round', () => {
    const personas = manifest.filter((c) => c.kind === 'persona');
    expect(personas.length).toBeGreaterThan(0);
    expect([...new Set(personas.map((c) => c.enforcement))]).toEqual(['advises']);
    expect(personas.map((c) => c.id)).toEqual(
      expect.arrayContaining(['quality-assurance', 'product-lead']),
    );

    const preToolUse = manifest.filter((c) => c.kind === 'hook' && c.event === 'PreToolUse');
    expect(preToolUse.length).toBeGreaterThan(0);
    expect([...new Set(preToolUse.map((c) => c.enforcement))]).toEqual(['denies']);
  });

  // The orphans, asserted as a POSITIVE. A generator that walks only the directories drops
  // `commands/autonomy-on.md` and `commands/new-issue.md` without a word; the plugin's own suite asserts
  // `root_cmds -eq 2` for exactly this reason. This is the assertion that fails if an orphan is ever
  // filtered away again — and it is an exact list rather than a count, so a SUBSTITUTED orphan (one
  // dropped, another added) cannot pass it.
  it('carries the un-namespaced commands instead of silently dropping them', () => {
    expect(manifest.filter((c) => c.kind === 'command').map((c) => c.id)).toEqual([
      'autonomy-on',
      'new-issue',
    ]);
  });
});

describe('enforcementFor — a closed set that refuses what it does not know', () => {
  it('classes by kind, and a hook by its EVENT rather than by being a hook', () => {
    expect(enforcementFor('persona')).toBe('advises');
    expect(enforcementFor('hook', 'PreToolUse')).toBe('denies');
    // The half of "hooks deny" that is false: a SessionStart hook prints context and has no tool call to
    // refuse. Collapsing the four into one class would publish the stronger claim about two scripts that
    // cannot make it.
    expect(enforcementFor('hook', 'SessionStart')).toBe('documents');
    expect(enforcementFor('command-family')).toBe('documents');
    expect(enforcementFor('command')).toBe('documents');
  });

  it('throws on an unknown kind and on an unknown hook event', () => {
    expect(() => enforcementFor('skill')).toThrow(/unrecognised harness component shape/);
    expect(() => enforcementFor('hook', 'Stop')).toThrow(/unrecognised harness component shape: "hook:Stop"/);
  });

  // The generator's guard cannot protect a COMMITTED file. A hand-edit or a bad merge can put anything
  // in that field, and the page would draw a class nothing defines.
  it('refuses an enforcement value read back from the artifact', () => {
    expect(() => assertEnforcement('prevents')).toThrow(/unrecognised harness enforcement class/);
    expect(assertEnforcement('advises')).toBe('advises');
  });
});

// The validated door every `fs` call in the module goes through. It exists because the check that was
// already there sat in the CALLERS, after their own `resolve()` — beside the sinks rather than on the
// path to them, which is what SonarCloud raised as `jssecurity:S8707`. These assertions pin BOTH halves:
// the containment refuses, and it refuses the escape hatch too (a `..` walk out of a contained path).
describe('resolvePluginDir — resolve and validate as one step', () => {
  it('accepts a tree inside the workspace and hands back a canonical absolute path', () => {
    expect(resolvePluginDir(fixture('plugin'))).toBe(realpathSync(fixture('plugin')));
    // a relative input resolves against cwd, and lands in the same place
    expect(resolvePluginDir(relative(process.cwd(), fixture('plugin')))).toBe(
      realpathSync(fixture('plugin')),
    );
  });

  it('refuses a path outside the workspace root, by name rather than by ENOENT', () => {
    expect(() => resolvePluginDir('/')).toThrow(/not under/);
    expect(() => resolvePluginDir(join(WORKSPACE_ROOT, '..'))).toThrow(/refusing to read a plugin tree/);
  });

  it('refuses a sibling whose NAME merely starts with the root — the classic prefix escape', () => {
    // `/…/git-reps-elsewhere` starts with `/…/git-reps`. A containment test written as a bare
    // `startsWith(root)` lets it through; the separator is what makes it a path test rather than a
    // string test, and it is one character nobody would miss in review.
    expect(() => resolvePluginDir(`${WORKSPACE_ROOT}-elsewhere/tadeumendonca-skills`)).toThrow(
      /refusing to read a plugin tree/,
    );
  });

  it('refuses a `..` walk that starts inside the workspace and lands outside it', () => {
    expect(() => resolvePluginDir(join(fixture('plugin'), '..', '..', '..', '..', '..', '..', '..'))).toThrow(
      /refusing to read a plugin tree/,
    );
  });

  it('names the offending path and the root it had to be under', () => {
    expect(() => resolvePluginDir('/nowhere-at-all')).toThrow(
      new RegExp(`"/nowhere-at-all" is not under ${WORKSPACE_ROOT}`),
    );
  });

  it('refuses a missing argument instead of silently reading the current directory', () => {
    // `resolve('')` is cwd — apps/fed — which IS inside the workspace, so containment alone would let a
    // forgotten argument through and then read this repo as if it were the plugin. `pluginPresent` is the
    // second half of the door and is what stops that; asserting it here keeps the pair visible.
    expect(pluginPresent(resolvePluginDir(undefined))).toBe(false);
  });
});

describe('reading a plugin tree', () => {
  it('recognises a tree, and the absence of one', () => {
    expect(pluginPresent(fixture('plugin'))).toBe(true);
    expect(pluginPresent(fixture('plugin-nested'))).toBe(false);
  });

  it('reads personas from the frontmatter name', () => {
    expect(collectPersonas(fixture('plugin'))).toEqual([
      { kind: 'persona', id: 'builder', file: 'agents/builder.md', enforcement: 'advises' },
      { kind: 'persona', id: 'reviewer', file: 'agents/reviewer.md', enforcement: 'advises' },
    ]);
  });

  // Dispatch finds a persona by its frontmatter name; a reader finds it by its path. Those two can
  // disagree, and this is the only place positioned to notice — the same assertion parseRecord makes
  // about an ADR heading versus its filename.
  it('refuses a persona whose frontmatter and filename disagree', () => {
    expect(() => collectPersonas(fixture('plugin-renamed'))).toThrow(
      /frontmatter says "not-the-filename", filename says "builder"/,
    );
  });

  // From the WIRING file, not the scripts directory: `hooks/scripts/` also holds the hooks' own .test.sh
  // suites, so counting the directory would inventory the tests as hooks.
  it('reads hooks from hooks.json, with event and matcher', () => {
    expect(collectHooks(fixture('plugin'))).toEqual([
      {
        kind: 'hook',
        id: 'greet.sh',
        file: 'hooks/scripts/greet.sh',
        event: 'SessionStart',
        matcher: null,
        enforcement: 'documents',
      },
      {
        kind: 'hook',
        id: 'guard.sh',
        file: 'hooks/scripts/guard.sh',
        event: 'PreToolUse',
        matcher: 'Bash',
        enforcement: 'denies',
      },
    ]);
  });

  it('throws rather than inventing a class for an event it does not know', () => {
    expect(() => collectHooks(fixture('plugin-renamed'))).toThrow(/hook:Stop/);
  });

  it('counts each family and keeps the un-namespaced command as its own kind', () => {
    expect(collectCommands(fixture('plugin'))).toEqual([
      { kind: 'command-family', id: 'alpha', file: 'commands/alpha', commands: 2, enforcement: 'documents' },
      { kind: 'command-family', id: 'beta', file: 'commands/beta', commands: 1, enforcement: 'documents' },
      { kind: 'command', id: 'loose', file: 'commands/loose.md', enforcement: 'documents' },
    ]);
  });

  // A nested directory would make the published count silently stop meaning what it says — the family
  // would show 1 while holding 2. Loud instead.
  it('throws on a nested command directory instead of undercounting', () => {
    expect(() => collectCommands(fixture('plugin-nested'))).toThrow(/nested directories/);
  });

  it('orders components by kind for a readable diff', () => {
    expect(collectComponents(fixture('plugin')).map(componentKey)).toEqual([
      'hook:greet.sh',
      'hook:guard.sh',
      'persona:builder',
      'persona:reviewer',
      'command-family:alpha',
      'command-family:beta',
      'command:loose',
    ]);
  });
});

// #345. The plugin's released version — the one value read from the sibling tree that a READER sees, as
// a tag on the /portfolio card linking that release's notes. Fixtures, for the reason this whole file
// uses them: `npm test` must not need a second repository on disk.
describe('readPluginVersion — the tag the card publishes', () => {
  it('reads a bare X.Y.Z and trims it', () => {
    expect(readPluginVersion(fixture('plugin'))).toBe('1.2.3');
  });

  // The `v` prefix is the specific malformation worth a fixture rather than a string literal, because it
  // is the one that looks RIGHT in a diff: `pluginReleaseUrl` builds `/releases/tag/v${version}`, so a
  // stored `v9.9.9` ships `/releases/tag/vv9.9.9` — a 404 for the reader, from two plausible strings.
  it('refuses a version carrying the `v` the URL builder adds', () => {
    expect(() => readPluginVersion(fixture('plugin-renamed'))).toThrow(/expected bare X\.Y\.Z/);
  });

  it('names the missing file rather than failing as an ENOENT three frames down', () => {
    expect(() => readPluginVersion(fixture('plugin-nested'))).toThrow(/no VERSION file at .*plugin-nested/);
  });

  // Applied by the drift check to a value it did NOT read from disk — the committed artifact, which a
  // hand-edit or a bad merge can fill with anything. Same discipline as `assertEnforcement`.
  it('validates a value from anywhere, and names where it came from', () => {
    expect(assertPluginVersion('0.4.41')).toBe('0.4.41');
    expect(() => assertPluginVersion('', 'plugin-release.json')).toThrow(/from plugin-release\.json/);
    expect(() => assertPluginVersion(undefined)).toThrow(/expected bare X\.Y\.Z/);
    expect(() => assertPluginVersion('1.2')).toThrow(/unusable plugin version "1\.2"/);
    expect(() => assertPluginVersion('1.2.3-rc1')).toThrow(/unusable plugin version/);
  });

  // THE RETURN IS REBUILT, NOT PASSED THROUGH — and nothing pinned that until now.
  //
  // Three rounds were spent reshaping this function so a taint engine would accept it, and
  // `quality-assurance` then ran the falsifier nobody had: delete the two reconstruction lines, restore
  // `return value`, and lint plus all 555 tests stay green. Every case above passes a string or
  // `undefined`, so not one of them can tell the two implementations apart. The work was real and the
  // guard on it did not exist — this session's recurring defect, inside the fix for it.
  //
  // A non-string that STRINGIFIES to a valid version is the case that separates them: the guard tests
  // `String(value ?? '')` and a pass-through returns the object, so a caller that thinks it holds a
  // version holds something that merely prints like one. `toBe` and not `toEqual`, deliberately —
  // `toEqual` would pass on the object too.
  it('returns a rebuilt string, never the value it was handed', () => {
    expect(assertPluginVersion({ toString: () => '1.2.3' })).toBe('1.2.3');
  });
});

describe('diffAgainstManifest — three ways, because two would miss the likeliest one', () => {
  const base = [
    { kind: 'persona', id: 'builder', file: 'agents/builder.md', enforcement: 'advises' },
  ];

  it('reports a component the manifest does not have', () => {
    expect(diffAgainstManifest(base, []).missing.map(componentKey)).toEqual(['persona:builder']);
  });

  it('reports a manifest row with no component behind it', () => {
    expect(diffAgainstManifest([], base).orphaned.map(componentKey)).toEqual(['persona:builder']);
  });

  // The case a set comparison cannot see, and the likeliest drift here: a persona RENAMED shows up as a
  // pair of missing/orphaned, but a hook RE-POINTED to another event is the same key with a moved field.
  it('reports a hook re-pointed to a different event, under the same key', () => {
    const before = [{ kind: 'hook', id: 'g.sh', file: 'hooks/scripts/g.sh', event: 'PreToolUse', matcher: 'Bash', enforcement: 'denies' }];
    const after = [{ ...before[0], event: 'SessionStart', enforcement: 'documents' }];
    const diff = diffAgainstManifest(after, before);
    expect(diff.changed.map(componentKey)).toEqual(['hook:g.sh']);
    expect(diff.missing).toEqual([]);
    expect(diff.orphaned).toEqual([]);
  });

  it('reports a matcher that was removed, not only one that was changed', () => {
    const before = [{ kind: 'hook', id: 'g.sh', file: 'hooks/scripts/g.sh', event: 'PreToolUse', matcher: 'Bash', enforcement: 'denies' }];
    const after = [{ ...before[0], matcher: null }];
    expect(diffAgainstManifest(after, before).changed.map(componentKey)).toEqual(['hook:g.sh']);
  });

  it('reports a family whose command count moved', () => {
    const before = [{ kind: 'command-family', id: 'alpha', file: 'commands/alpha', commands: 2, enforcement: 'documents' }];
    const after = [{ ...before[0], commands: 3 }];
    expect(diffAgainstManifest(after, before).changed.map(componentKey)).toEqual(['command-family:alpha']);
  });

  // The comparison is a UNION OF KEYS, not a hand-written field list — the direct lesson from the ADR
  // index, where a "field by field" comparison skipped `file`, the one field a reader clicks. A field
  // added later by someone who never reads that comment is still compared.
  it('compares a field nobody listed, including one added after this was written', () => {
    const before = [{ kind: 'persona', id: 'x', file: 'agents/x.md', enforcement: 'advises' }];
    const after = [{ ...before[0], somethingNew: 'value' }];
    expect(diffAgainstManifest(after, before).changed.map(componentKey)).toEqual(['persona:x']);
  });

  // Two components can share a name across kinds — `architecture` is a command family today, and nothing
  // stops a persona taking that name tomorrow. Keying on id alone would compare them to each other.
  it('does not confuse a family with a persona of the same name', () => {
    const live = [{ kind: 'persona', id: 'architecture', file: 'agents/architecture.md', enforcement: 'advises' }];
    const committed = [{ kind: 'command-family', id: 'architecture', file: 'commands/architecture', commands: 1, enforcement: 'documents' }];
    const diff = diffAgainstManifest(live, committed);
    expect(diff.missing.map(componentKey)).toEqual(['persona:architecture']);
    expect(diff.orphaned.map(componentKey)).toEqual(['command-family:architecture']);
    expect(diff.changed).toEqual([]);
  });

  it('says nothing when the two agree', () => {
    expect(driftReport(diffAgainstManifest(base, base))).toBe('');
  });
});

describe('driftReport — aimed at the author who did not cause the failure', () => {
  // ADR-0043's accepted cost: the red lands on the next `app` run in THIS repo, which is usually an
  // unrelated PR. Nothing here can trigger on a merge in another repository, so the mitigation is
  // attribution — name the other repo, say it is not their change, give the one command that fixes it.
  const report = driftReport(
    diffAgainstManifest(
      [{ kind: 'persona', id: 'new-one', file: 'agents/new-one.md', enforcement: 'advises' }],
      [{ kind: 'persona', id: 'gone', file: 'agents/gone.md', enforcement: 'advises' }],
    ),
  );

  it('names the other repository and tells the reader it is not their change', () => {
    expect(report).toContain('tedeuxx/tadeumendonca-skills');
    expect(report).toMatch(/NOT your change/);
  });

  it('gives the command that fixes it, and names both editions of the page', () => {
    expect(report).toContain('npm --prefix apps/fed run gen-harness');
    expect(report).toContain('architecture.{en,pt}.md');
  });

  it('names the components that drifted, in both directions', () => {
    expect(report).toContain('persona new-one');
    expect(report).toContain('persona gone');
  });
});
