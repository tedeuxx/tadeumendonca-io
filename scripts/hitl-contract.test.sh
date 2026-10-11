#!/usr/bin/env bash
# Asserts the local carrier of the one-owner-ask contract introduced by skills#538.
#
# `AGENTS.md` is the single root brief since #721 (2026-10-11), so it is the only local carrier. It is
# checked by semantic commitments rather than by byte identity: every owner ask; decisions and actions;
# one activation or message; later asks wait for the answer and do not move into prose; interviews
# remain distinct and optionless.
#
# WHAT WAS REMOVED, AND WHY. Until #721 this suite also pinned the SHA-256 of a canonical
# `hitl-escalation-format` block in the root brief that only one harness reads, byte-shared with the
# sibling repository. That brief is deleted and its five rules are stated once, in `AGENTS.md`'s *How
# to ask* section, so the digest arms had no subject. They are removed rather than left to pass over
# an absent file. The cost: nothing here compares the sibling repository's copy of the block with
# anything; that sibling is to be generated from the workstation repository rather than synced by hand.
#
# MUTATION-CHECKED: reverting the AGENTS.md one-ask heading to its former decision-only wording makes
# the semantic arm red; removing this script's workflow invocation makes the reachability arm red.
# Restore-and-green is part of the calibration. Run: bash scripts/hitl-contract.test.sh

set -uo pipefail

ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  printf 'FAIL  cannot resolve a git root; no assertion ran\n'
  exit 1
fi

AGENTS="$ROOT/AGENTS.md"
WORKFLOW="$ROOT/.github/workflows/brief.yml"

pass=0
fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s\n' "$1"; }

if [ ! -f "$AGENTS" ]; then
  bad "AGENTS.md does not exist; the semantic assertion did NOT run"
else
  missing=""
  while IFS= read -r needle; do
    [ -n "$needle" ] || continue
    grep -Fq "$needle" "$AGENTS" || missing="$missing\n  $needle"
  done <<'EOF'
**Rule 1 governs every ask directed to the owner — decisions and actions, inside or outside work in
1. **One owner ask per activation or message.**
preserve every remaining ask until after he
Never move the remainder into a prose
an interview remains distinct: it elicits without options.
5. **An interview takes NO options; an escalation always does.**
EOF
  if [ -n "$missing" ]; then
    bad "AGENTS.md is missing one-owner-ask commitment(s):$missing"
  else
    ok "AGENTS.md carries the five one-owner-ask commitments"
  fi
fi

if grep -Fq 'run: bash scripts/hitl-contract.test.sh' "$WORKFLOW"; then
  ok "brief workflow executes this contract test"
else
  bad "brief workflow does not execute scripts/hitl-contract.test.sh"
fi

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
