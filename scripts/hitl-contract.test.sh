#!/usr/bin/env bash
# Asserts that `AGENTS.md` points the three method rules at their canonical home and does not restate
# them, and that this project's workstation range admits only releases carrying that home.
#
# WHAT CHANGED, AND WHY (#715, step 3 of the owner ruling of 2026-10-13, "Mover pro mhw"). Until #715
# this suite asserted that `AGENTS.md` CARRIED the five one-owner-ask commitments of its *How to ask*
# section. That section, the review-chain routing rule and the loop-mode contract moved into the
# workstation method's `orchestration` skill (tedeuxx/mhw#176, first released in v5.8.0), and the brief
# now carries a pointer. Asserting the old wording would now assert a second copy of a rule the method
# owns, which is the drift the move was made to end. So the subject of the contract moved, and this
# suite follows it rather than being deleted:
#
#   arm 1 — the brief NAMES the skill and its three section headings, so a reader of the brief, which
#           every harness loads always-on, is sent to where the rules now live;
#   arm 2 — the brief does NOT carry the removed wording or its fence markers, so a second copy that
#           re-enters verbatim reddens;
#   arm 3 — `.workstation-version`'s lower bound is at least 5.8, the first release carrying the skill,
#           so the pointer cannot be satisfied by a range that admits a method without its target;
#   arm 4 — the brief workflow executes this suite (reachability).
#
# WHAT IT CANNOT ASSERT, said here rather than inferred from a green: that the installed method on any
# machine actually carries the skill (CI has no workstation); that a session loads the skill before it
# acts (nothing observes that; it is an instruction); that the skill's content is right; and that the
# rules were not re-entered into the brief in DIFFERENT words. Arm 2 matches the removed text and is
# blind to a paraphrase, which review holds.
#
# MUTATION-CHECKED against the SUBJECTS, not this checker: dropping the skill name from the brief, re-
# inserting one removed commitment, re-inserting a fence marker, and lowering the range floor to 5.6 each
# make one arm red; restoring each makes it green. Run: bash scripts/hitl-contract.test.sh

set -uo pipefail

ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  printf 'FAIL  cannot resolve a git root; no assertion ran\n'
  exit 1
fi

AGENTS="$ROOT/AGENTS.md"
RANGE_FILE="$ROOT/.workstation-version"
WORKFLOW="$ROOT/.github/workflows/brief.yml"
FLOOR_MAJOR=5
FLOOR_MINOR=8

pass=0
fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s\n' "$1"; }

if [ ! -f "$AGENTS" ]; then
  bad "AGENTS.md does not exist; arms 1 and 2 did NOT run"
else
  # ── ARM 1 · THE POINTER ─────────────────────────────────────────────────────────────────────────
  missing=""
  while IFS= read -r needle; do
    [ -n "$needle" ] || continue
    grep -Fq -- "$needle" "$AGENTS" || missing="$missing\n  $needle"
  done <<'EOF'
`orchestration` skill
*Review is routed
*The loop-mode contract*
*How to ask the owner*
EOF
  if [ -n "$missing" ]; then
    bad "arm 1 — AGENTS.md does not point the three method rules at the orchestration skill; missing:$missing"
  else
    ok "arm 1 — AGENTS.md names the orchestration skill and its three section headings"
  fi

  # ── ARM 2 · NO SECOND COPY OF THE REMOVED WORDING ───────────────────────────────────────────────
  # One needle per removed rule family, each taken verbatim from the text #715 removed, plus the two
  # fence markers that delimited the routing and contract blocks.
  present=""
  while IFS= read -r needle; do
    [ -n "$needle" ] || continue
    grep -Fq -- "$needle" "$AGENTS" && present="$present\n  $needle"
  done <<'EOF'
**Rule 1 governs every ask directed to the owner
1. **One owner ask per activation or message.**
5. **An interview takes NO options; an escalation always does.**
**Rule 4 was built as an automatic control and removed
`loop`: one agents-lead lens pass plus the gate.
**A mode selects a predicate and a rite set, never a permission rule**
**Development parallelises; review does not.**
<!-- review-chain-routing -->
<!-- loop-mode-contract -->
EOF
  if [ -n "$present" ]; then
    bad "arm 2 — AGENTS.md restates wording the orchestration skill owns (#715); replace it with the pointer:$present"
  else
    ok "arm 2 — AGENTS.md carries none of the removed routing, loop-mode or ask wording"
  fi
fi

# ── ARM 3 · THE RANGE ADMITS ONLY RELEASES THAT CARRY THE SKILL ─────────────────────────────────────
if [ ! -f "$RANGE_FILE" ]; then
  bad "arm 3 — .workstation-version does not exist; the range assertion did NOT run"
else
  range="$(grep -vE '^[[:space:]]*(#|$)' "$RANGE_FILE" | head -1)"
  lower="$(printf '%s\n' "$range" | grep -oE '>=[[:space:]]*[0-9]+(\.[0-9]+)?' | head -1 | tr -d '>= ')"
  if [ -z "$lower" ]; then
    bad "arm 3 — .workstation-version range '$range' has no '>=' lower bound; a range with none admits a
      method release without the orchestration skill"
  else
    maj="${lower%%.*}"
    min="0"
    case "$lower" in *.*) min="${lower#*.}" ;; esac
    if [ "$maj" -gt "$FLOOR_MAJOR" ] || { [ "$maj" -eq "$FLOOR_MAJOR" ] && [ "$min" -ge "$FLOOR_MINOR" ]; }; then
      ok "arm 3 — .workstation-version lower bound $lower is at or above $FLOOR_MAJOR.$FLOOR_MINOR"
    else
      bad "arm 3 — .workstation-version lower bound $lower is below $FLOOR_MAJOR.$FLOOR_MINOR, the first
      release carrying the orchestration skill the brief points at"
    fi
  fi
fi

# ── ARM 4 · REACHABILITY ────────────────────────────────────────────────────────────────────────────
if grep -Fq 'run: bash scripts/hitl-contract.test.sh' "$WORKFLOW"; then
  ok "arm 4 — brief workflow executes this contract test"
else
  bad "arm 4 — brief workflow does not execute scripts/hitl-contract.test.sh"
fi

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
