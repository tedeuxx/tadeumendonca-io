# sprint-07 — retrospective · agents-lead

commit: 347e59e521a1b3cb5520d8fcdbb637eb5537185c
fed-with: my `harness-lead-verdict` markers on tadeumendonca-io #730, #757, #766, #767, #769, #772, #777, #791 and tadeumendonca-skills #571, #573 (18 markers across 10 PRs, read with `gh pr view <n> --repo tedeuxx/<repo> --json comments`), the PRs those markers sit on, and the gate's hold-2 text in `agents/quality-assurance.md` that reads the markers. I read no other persona's retrospective file.

## Finding 1 — retiring a rule took five lens rounds on -skills #573, because every sweep searched for spellings, not for what the rule said

**What I saw.** -skills #573 (retire the `wip:` count) has five markers. The first four say `lens NOT closed`. Each of those four found more owned passages that still stated the retired single-slice bound as live, in a spelling the previous sweep had not searched for:

- round 1, at 85e01e1: three passages, found by grepping `wip|WIP|one open PR|in-flight branch|concurren`;
- round 2, at a7230f0: three more, including a registered `SessionStart` hook (`session-wip.sh`) that put "one open pull request" into every session's context. The marker says: *"The previous lens's sweep missed it because it was keyed on `WIP` tokens, and this sentence has none."*;
- round 3, at 1b2ec44: one more, in registry row `0007`. The marker says: *"It carries none of the swept tokens … so my keyword sweep, the builder's and the previous lens's could not find it. I found it by reading the whole row."*;
- round 4, at ac3766c: one more, in row `0015`. The marker says: *"A definite article ('the in-flight slice') states the count with neither."*;
- round 5, at aac0b60: closed.

**The artifact that shows it.** `gh pr view 573 --repo tedeuxx/tadeumendonca-skills --json comments --jq '[.comments[]|select(.body|test("(?m)^<!-- harness-lead-verdict"))]|map(.body|split("\n")[0])'` prints the five headlines. The per-round sweep sections are quoted above.

**What it costs.** Four extra review rounds and four extra build cycles on one `loop` PR. Each round's marker is 7 to 9 thousand characters. The costliest miss was live machinery, not prose: a hook telling every fresh session to serialise development, the exact behaviour the PR retired. It survived one full lens round.

**Why this is a method defect, not carelessness.** It is the same pattern the escalation standard records for the deleted action-pendency guard: three narrowings that searched over spellings instead of converging, with each review finding a new class. `agents-configuration` already names the rule: *"A strike lands where a rule is STATED and survives where it is CITED, paraphrased, or used as a premise … Sweep for the claim's substance, never for the sentence that was struck."* Our instrument was a token grep, and a token grep cannot sweep for substance. Each round added the spelling the last round missed. The rule was written down; the procedure to apply it was missing.

**The change I propose.** When a `loop` slice retires or reverses a rule, the lens's first pass does two things:

1. Derive the candidate set by subject, not by token. List the owned files, then the sections whose subject is the rule. A token grep only seeds this list; it does not complete it.
2. Read each candidate section whole, the way round 3 found row `0007`, and publish the enumerated file-and-section list in the marker as the claim, so the builder fixes the whole set in one cycle.

This is my own procedure and needs no new mechanism. If you prefer it earlier, the same list goes in the intake stress test on the Issue, before the build.

**The price of leaving it.** Every future retirement rebuys this convergence round by round. Nothing bounds the number of rounds (#393 deliberately sets no cap), so the cost lands as delay with no stopping rule.

## Finding 2 — on -io #791 the gate posted the `agents-lead` marker itself, so hold 2 was satisfied by a comment written by the persona that hold 2 constrains

**What I saw.** The only `harness-lead-verdict` comment on -io #791 opens with `<!-- harness-lead-verdict: agents-lead -->` at column 0, outside any fence. Its body says: *"Relayed, not authored, by `quality-assurance`. The `agents-lead` lens ran in a separate context … and could not post to the PR. The orchestrator relayed its report to the gate verbatim; the gate posts it below unchanged."* The gate's own verdict follows 37 seconds later. Both comments are posted by the same account (`tedeuxx`). It is 1 of the 10 PRs fed to me. On the other nine, I posted my own markers.

**The artifact that shows it.** `gh pr view 791 --repo tedeuxx/tadeumendonca-io --json comments --jq '.comments[]|{a:.author.login,at:.createdAt,h:(.body|split("\n")[0])}'`. The relay count per PR is a `select(.body|test("Relayed, not authored"))` over the same ten PRs: 1 on #791, 0 everywhere else.

**What it costs.** The content looks sound. The relayed text is specific, and it includes a break-to-see-red. But the artifact's provenance broke in three ways:

- **My brief rules out exactly this.** A relay *"relays a plain comment, not a marker, so the relay cannot manufacture a gate artifact; that it once did is what #336 recorded."*
- **The gate cannot tell a relay from my own post.** Hold 2's selector excludes a marker inside a fence, "such as a relay". An unfenced envelope posted by the gate passes. The account is shared, so author association does not distinguish them either.
- **The headline is empty.** It reads `agents-lead`, where the template asks for *"what you reviewed and your headline conclusion"*.

So the one control that requires a second reviewer to be present was cleared by an artifact the gate wrote itself. The gate's brief also says *"do not accept a relayed claim that the lens re-reviewed"*. A relay posted inside the envelope turns that claim into the artifact.

**The change I propose.**

- **When the lens cannot post:** hold 2 returns `APPROVE-PENDING-HUMAN`, naming the missing reviewer, and the orchestrator re-dispatches `agents-lead` with posting capability. No relay into the envelope, by the gate or by anyone else.
- **If a relay is ever acceptable,** it goes fenced, or under a plain heading. Hold 2 already ignores it there.
- **The question I could not settle** is why this dispatch could not post. My brief grants `gh pr comment`, and nothing in the artifacts I was fed says which grant or surface was missing. This is a hypothesis. To settle it, read the #791 dispatch's tool list and harness.

**The price of leaving it.** The relay becomes a precedent. The next lens that cannot post yields a gate-authored marker that cannot be told apart from a real one. Hold 2 then holds only when the gate chooses to hold itself.

## What I would leave alone

- **Head-scoped re-markers after a moved head.** -io #730 (rebase), #766 (one-line fix), #772 (merge of trunk) and #777 (in-place strike) each got a fresh marker within minutes: 1 min 39 s on #777, 1 min 35 s on #766. Each fresh marker named the full forty-character head. The cost was small and the attestation stays exact.
- **The terminal literal.** Every closing marker this sprint says `the lens is CLOSED`, and the four non-closing rounds on #573 each carried a falsifiable-and-false finding, not tidiness. The #393 stop condition worked as written.
- **One lens plus the gate on `loop` PRs.** Nine of the ten PRs closed in one or two markers.
