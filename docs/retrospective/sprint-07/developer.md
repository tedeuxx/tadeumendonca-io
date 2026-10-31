# sprint-07 — retrospective · developer

commit: 347e59e521a1b3cb5520d8fcdbb637eb5537185c
fed-with: my `dispatch-metrics:` record on #712 (one `dedupe_key`, `a3dc383c6f6ac559a`, branch `fix/712-external-links-new-tab`, `duration_seconds: 600`, `tool_calls: 62`, `prs_written:` empty; one record only, so no dedupe was needed) · PR #785 and its one commit `ce68ee51` (`fix(fed): open external article links in a new tab`) · the tool calls in my own dispatch transcript, read for push and PR-create calls only

## Finding 1 — the slice I built had no closed description; its requirement was one owner comment on a `content` Issue

What I saw: #712 carries `content`, `reader-facing`, `ready`, `sp:8`. Its body says nothing about link targets. A line filter for `new tab|target|external|link` over the body returns only social-post and redaction lines and `invocable: none`. The requirement came from the owner's preview-read comment on #712. PR #785 then states two deviations itself. **Lane:** "#712 is a `content` Issue, but this is a renderer code change ... so the developer built it." **Scope:** "The orchestrator decided to apply this to every external link in every markdown body, not only the #712 demo link." The PR says `Refs #712` and its `closingIssuesReferences` is `[]`.

The artifact that shows it: the PR #785 body, *Scope and deviations*. `gh issue view 712 --repo tedeuxx/tadeumendonca-io --json body`.

What it costs: the change is site-wide, and every already-published article got the new attributes on deploy. No Issue description bounds it, so the gate could check the change only against the PR body I and the orchestrator wrote. My brief says I do not start without a closed description and do not build `content` Issues. Both rules were waived in a PR paragraph, and the waiver is not on any Issue. The change was small and reversible, and it merged clean 9 minutes after opening. That makes this the cheap time to decide the rule, before it repeats on a change that is not small.

The change I propose: when a content preview read finds a defect in the renderer, the fix gets its own `product` item, filed by the owner as only he opens work, and goes through the leads' intake. If that is too heavy for a one-line owner remark, write the exception down once instead. Name the case in the `content` lane's routing (a renderer code fix found in that Issue's preview may be built by `developer` under it), and require the orchestrator's scope decision to be posted on the Issue rather than only in the PR. The price of leaving it: my brief has an exception that exists in practice and appears nowhere a reader looks.

## Finding 2 — my dispatch stopped at the commit; the push, the PR and its body were the orchestrator's, so my record cannot point at my own PR

What I saw: my transcript has `git add` and `git commit -F` calls and no `git push` or `gh pr create` tool call. My metrics record was posted at 20:47:16Z with `prs_written:` empty. PR #785 was created at 20:47:41Z, 25 seconds after my dispatch stopped. Its body describes my work in the third person ("Mutation-checked by the builder").

The artifact that shows it: the `dispatch-metrics` record with `dedupe_key: a3dc383c6f6ac559a`, compared with `gh pr view 785 --repo tedeuxx/tadeumendonca-io --json createdAt`.

What it costs: this retrospective found my PR only through the branch name, because my record names none. My completeness evidence (the mutation pass, the gate outputs) reached the gate as a relay. The brief's rule is that "the author checked" is a claim, and here the claim was also passed on second-hand. The handoff also adds one orchestrator turn between my last check and the PR.

The change I propose: I push and open the PR myself with `--body-file`, from my own `/code-review` output. I already hold that capability; nothing in my brief gives it to the orchestrator. Then `prs_written:` attributes the PR and the evidence comes from the context that produced it. If the orchestrator keeps the act on purpose, it should post the PR number on the Issue at creation, so the build and its PR stay linked without matching on branch names.

## What I would leave alone

The test shape on #785: an internal-link control beside the external cases, E2E checks on both the prerendered HTML and the hydrated DOM, and a mutation pass in both directions (logic removed, then `_blank` forced everywhere), each run restored to green. One commit, a conventional subject, no dependency, `iac/` or `.github/` change, and all of that stated in the PR. The slice was one thin piece, and the PR merged at its first and only commit.
