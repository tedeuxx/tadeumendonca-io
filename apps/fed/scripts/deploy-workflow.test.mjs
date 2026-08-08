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
const terraformApply = workflow.jobs['terraform-apply'];

const step = (job, namePart) => {
  const found = job.steps.filter((s) => s.name?.includes(namePart));
  expect(found, `no step named like "${namePart}"`).toHaveLength(1);
  return found[0];
};

describe('deploy.yml — the deliberate version path', () => {
  it('offers every SemVer part on the dispatch, so 1.0.0 can be produced at all', () => {
    // The defect this repo shipped for every tag cut before this input existed: there was no input, and
    // `1.0.0` was unreachable — which is why every one of those tags is a `v0.1.N` (`git tag --list`). No
    // count is written here; it moves on every merge, and a literal in a comment is stale before the next
    // PR opens.
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

// A `workflow_dispatch` runs against a ref the CALLER names, `gate` checks out that ref's sha, and
// `terraform-apply` applies `iac/` from the tree it is handed under AWS_INFRA_OIDC_ROLE_ARN — the role
// this workflow calls "strictly more powerful than the deploy role". So anything able to push a branch
// was able to apply its own infrastructure. The `apply_infra` input defaulted to `false`, which reads
// like a control and is not one: the caller fills in the form.
//
// The main-only refusal in `release` did not cover it. That job's `if:` requires `inputs.part != 'none'`,
// so a `part: none` dispatch skips the job and never evaluates its guard — the guard was correct and
// unreachable on exactly the dispatch that mattered.
//
// These assertions are the regression test for that removal. They are structural on purpose: each one names a
// condition whose REMOVAL re-opens the hole, so deleting the condition reddens the suite rather than
// quietly restoring the capability.
describe('deploy.yml — infrastructure applies on a merge, never on a dispatch', () => {
  it('offers no input that could ask a dispatch to apply infrastructure', () => {
    // The input is gone, not defaulted-off. Asserted on the parsed inputs AND on the raw source, because
    // re-adding it under any default at all is the regression, and a plumbed-but-unused input would still
    // parse away cleanly here while sitting in the file ready to be wired back up.
    expect(Object.keys(triggers.workflow_dispatch.inputs)).toEqual(['part', 'deploy_app']);
    expect(triggers.workflow_dispatch.inputs.apply_infra).toBeUndefined();
    // A bare `not.toContain('apply_infra')` is what this started as, and it was wrong: the file's comments
    // NAME the removed input to explain why it is gone, and a rule that forbids describing its own history
    // would be paid for by deleting the explanation. So the two spellings that would restore the
    // capability are forbidden, and prose is left alone — the declaration, and any read of it.
    expect(source).not.toMatch(/^\s*apply_infra:/m);
    expect(source).not.toContain('inputs.apply_infra');
  });

  it('refuses to apply on anything but a push, as a property of the job itself', () => {
    // The second of two independent refusals, and the one that survives a wrong gate output.
    const condition = terraformApply.if.replace(/\s+/g, ' ');
    expect(condition).toContain("github.event_name == 'push'");
    expect(condition).toContain("needs.gate.outputs.iac == 'true'");
  });

  it('hardcodes iac=false on the dispatch branch of the surface filter', () => {
    // The first refusal. The dispatch branch must emit a literal false — not an input, not a variable —
    // and must not carry a DISPATCH_IAC env to read one from.
    const changes = step(gate, 'What did this release touch?');
    expect(changes.env.DISPATCH_IAC).toBeUndefined();
    expect(changes.run).toContain('echo "iac=false" >> "$GITHUB_OUTPUT"');
    // And `iac` may not be written from a dispatch-supplied value in either shape the input could take:
    // an expression interpolated straight into the script, or a job env var carrying one. `iac=$iac` on
    // the push branch is lowercase and stays legal — that one is computed from the surface diff, which is
    // the whole point of the filter. (The first draft of this line forbade `echo "iac=$` outright and
    // reddened on the push branch, which would have been a test demanding the filter stop filtering.)
    expect(changes.run).not.toMatch(/iac=\$\{\{/);
    expect(changes.run).not.toMatch(/iac=\$[A-Z_]+/);
  });

  it('still lets a dispatch publish the site, which is the rollback path that remains', () => {
    // The cost is bounded deliberately: the SITE rollback survives, only the INFRA one goes. If
    // this ever fails, the change removed more than it was scoped to remove.
    expect(triggers.workflow_dispatch.inputs.deploy_app.default).toBe(true);
    const changes = step(gate, 'What did this release touch?');
    expect(changes.env.DISPATCH_APP).toBe('${{ inputs.deploy_app }}');
  });
});
