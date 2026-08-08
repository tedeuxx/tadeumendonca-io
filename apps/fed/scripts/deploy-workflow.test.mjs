// Guards the version→footer contract that `.github/workflows/deploy.yml` implements.
//
// WHY A TEST AND NOT A COMMENT. The properties below are not style; each one is the difference between
// a Release the footer links and a Release describing a different tree. None of them is visible to
// eslint, tsc, actionlint or the Terraform gates — actionlint validates SYNTAX and expression contexts,
// and every regression this file catches is perfectly valid YAML.
//
// It reads the workflow from disk, like `spa-rewrite.test.mjs` reads the CloudFront function it tests
// (#205): the artifact under test is the committed file, not a copy of it restated here.
//
// ⚠️ IT ONLY RUNS BECAUSE `.github/workflows/deploy.yml` IS IN `app.yml`'s `code` FILTER. A guard whose
// own trigger is missing from the gate's filter is correct and never runs — see the note beside that
// entry, which is the fourth time this repo has paid for it.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

// `import.meta.dirname`, not `new URL(..., import.meta.url)` — the same spelling spa-rewrite.test.mjs
// uses. Vite rewrites `import.meta.url` to a non-`file:` URL under vitest, and `readFileSync` rejects it.
const WORKFLOW_PATH = resolve(import.meta.dirname, '../../../.github/workflows/deploy.yml');
const source = readFileSync(WORKFLOW_PATH, 'utf8');
const workflow = yaml.load(source);

// `on:` is YAML 1.1's boolean `true`, which js-yaml honours. Reading both spellings means this test does
// not silently pass on `undefined` if the parser's behaviour ever changes.
const triggers = workflow.on ?? workflow[true];
const release = workflow.jobs.release;
const gate = workflow.jobs.gate;

const step = (job, namePart) => {
  const found = job.steps.filter((s) => s.name?.includes(namePart));
  expect(found, `no step named like "${namePart}"`).toHaveLength(1);
  return found[0];
};

describe('deploy.yml — the deliberate version path', () => {
  it('offers every SemVer part on the dispatch, so 1.0.0 can be produced at all', () => {
    // The defect this repo shipped for 203 patches: there was no input, and `1.0.0` was unreachable.
    const part = triggers.workflow_dispatch.inputs.part;
    expect(part.type).toBe('choice');
    expect(part.options).toEqual(['none', 'patch', 'minor', 'major']);
  });

  it('defaults the dispatch to cutting nothing, so a rollback republish never moves the version', () => {
    expect(triggers.workflow_dispatch.inputs.part.default).toBe('none');
  });

  it('bumps the part it was given rather than a hardcoded one', () => {
    const bump = step(release, 'Bump the version');
    // The literal `bump-my-version bump patch` is the exact string that made a minor impossible. Assert
    // the parameterised form is present AND that no hardcoded part survives anywhere in the step.
    expect(bump.run).toContain('bump-my-version bump "$PART"');
    expect(bump.run).not.toMatch(/bump-my-version (bump|show new_version --increment) (patch|minor|major)\b/);
  });

  it('resolves PART to patch on a push and to the chosen input on a dispatch', () => {
    // A push carries a null `inputs` context, so the `||` fallback is what keeps every merge on patch.
    expect(release.env.PART).toBe(
      "${{ github.event_name == 'workflow_dispatch' && inputs.part || 'patch' }}",
    );
  });

  it('runs the release job on a bumping dispatch as well as on a merge', () => {
    const condition = release.if.replace(/\s+/g, ' ');
    expect(condition).toContain("github.event_name == 'push'");
    expect(condition).toContain("!startsWith(github.event.head_commit.message, 'bump:')");
    expect(condition).toContain("github.event_name == 'workflow_dispatch' && inputs.part != 'none'");
  });

  it('refuses to cut a version from any ref but main', () => {
    // The checkout below it is hardcoded to `main`; without this the run would tag main's tree while
    // reporting the dispatched branch.
    const guard = step(release, 'Refuse to cut a version');
    expect(guard.if).toContain("github.ref != 'refs/heads/main'");
    expect(release.steps.indexOf(guard)).toBeLessThan(release.steps.indexOf(step(release, 'Checkout')));
  });
});

describe('deploy.yml — a version that never reaches the footer is not a release', () => {
  it('asserts the tree carries its own tag whenever the run bumped, dispatch included', () => {
    // `github.event_name != 'workflow_dispatch'` was the same question only while a push was the sole
    // bumping path. It is not any more, and that spelling would skip the assert on the one deliberate
    // release of the year. `needs.release.result` is what the old expression meant.
    const assertTag = step(gate, 'Assert this tree carries its own tag');
    expect(assertTag.if).toBe("needs.release.result == 'success'");
    expect(assertTag.if).not.toContain('event_name');
    // And it must still be a strict equality — not "the tag is an ancestor of HEAD", which would pass
    // for a build whose footer links a Release describing an earlier tree.
    expect(assertTag.run).toContain('!= "$(git rev-parse HEAD)"');
  });

  it('publishes the site on a dispatch that cut a version, whatever deploy_app said', () => {
    const changes = step(gate, 'What did this release touch?');
    expect(changes.env.BUMPED).toBe('${{ needs.release.result }}');
    expect(changes.run).toContain('if [ "$BUMPED" = "success" ] && [ "$app" != "true" ]; then');
  });

  it('identifies the tree to build by sha and never by a moving ref name', () => {
    // github.ref is resolved by actions/checkout when the step runs, so main can move underneath a
    // republish. Every downstream job already takes a sha; this is the fallback that did not.
    const checkout = step(gate, 'Checkout the commit that carries the version');
    expect(checkout.with.ref).toBe('${{ needs.release.outputs.sha || github.sha }}');
    expect(source).not.toContain('|| github.ref }}');
  });
});
