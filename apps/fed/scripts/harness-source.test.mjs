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
  it('says personas ADVISE and PreToolUse hooks DENY, and never the other way round', () => {
    const personas = manifest.filter((c) => c.kind === 'persona');
    expect(personas.length).toBeGreaterThan(0);
    expect([...new Set(personas.map((c) => c.enforcement))]).toEqual(['advises']);
    expect(personas.map((c) => c.id)).toEqual(expect.arrayContaining(['quality-assurance', 'security']));

    const preToolUse = manifest.filter((c) => c.kind === 'hook' && c.event === 'PreToolUse');
    expect(preToolUse.length).toBeGreaterThan(0);
    expect([...new Set(preToolUse.map((c) => c.enforcement))]).toEqual(['denies']);
  });

  // The orphan, asserted as a POSITIVE. A generator that walks only the directories drops
  // `commands/autonomy-on.md` without a word; the plugin's own suite asserts `root_cmds -eq 1` for
  // exactly this reason. This is the assertion that fails if the orphan is ever filtered away again.
  it('carries the un-namespaced command instead of silently dropping it', () => {
    expect(manifest.filter((c) => c.kind === 'command').map((c) => c.id)).toEqual(['autonomy-on']);
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
