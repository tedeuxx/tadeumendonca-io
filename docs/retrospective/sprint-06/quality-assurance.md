# sprint-06 — retrospective · quality-assurance

commit: c94d4be9967140bebe7539cd402761c7c27d9f32
fed-with: Issue #715 quality-assurance dispatch-metrics comment, deduplicated by agent_id; gatekeeper-verdict comments on PRs #727, #766, #743, #747, #751, #731, #734 and #735; Issues #715, #688, #716, #717, #718 and #719

## Finding 1 — Keep merge authority canonical instead of letting a project brief create another hold

I saw fully green delivery on PRs #743, #751 and #766 return `APPROVE-PENDING-HUMAN` solely because this repository's brief says the gate escalates boundary work, while the installed quality-assurance method says the gate merges boundary work unless one of four named holds applies. The verdicts explicitly found none of those method holds on #751 and #766; #743 also exposed ambiguity between the Issue's boundary classification and the repository record's safe classification for reader-facing product work. This costs an owner ratification and turns the verdict vocabulary into a repository-dependent contract that the method does not enumerate. Make merge authority and holds canonical in the installed method, and make repository briefs declare only project-specific boundary triggers by reference; add a consistency check that rejects a project brief which changes the executor or invents a hold. Leaving it as-is means every gate must rediscover which authority wins and may produce the same literal for different reasons.

## Finding 2 — Complete reader-facing lens routing before dispatching the gate

PRs #727 and #747 each reached quality assurance with the code and mechanical gates otherwise green, then received `REQUEST-CHANGES` because the required reader-facing copy artifact was absent. Both later passed at the same head after the lens record arrived; #727 consumed a third gate round, and its second verdict also recorded that the first gate verdict had never reached the PR. This costs repeat review without changing the diff and makes the universal criterion-10 trigger depend on the last gate discovering a routing omission. Before dispatching quality assurance, have orchestration derive reader-facing scope from the actual PR diff and require the head-scoped copy artifact even when the Issue type is `loop` or the surface is preview-only; also require the current-head gate artifact to be posted before a round is treated as complete. Leaving it as-is keeps the gate as the correct backstop, but spends a full serial review round each time routing omits the earlier lens.

## What I would leave alone

Keep the gate's head-scoped, evidence-first refusal to inherit claims. On #731 it distinguished a still-running check from a defect and approved only after the same-head rollup turned green; on #747 it refused to treat an earlier lens over reverted content as review of the current preview; on #751 it reused a byte-identical copy verdict instead of manufacturing another lens round. Those are the right controls: they prevent false approval without forcing rework when identity is demonstrable.
