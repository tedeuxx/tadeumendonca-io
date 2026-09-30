#!/usr/bin/env bash
# Asserts the local carriers of the one-owner-ask contract introduced by skills#538.
#
# The canonical `hitl-escalation-format` block is byte-shared with the sibling repository, but this
# repository's pipeline cannot read a sibling checkout. Its local guard is therefore the SHA-256 of the
# merged canonical block plus an exact delimiter count. The digest detects any local byte drift; the
# cross-repository comparison remains a published build-time measurement, not a CI claim.
#
# `AGENTS.md` is independently authored, so it is checked by semantic commitments rather than by byte
# identity: every owner ask; decisions and actions; one activation or message; later asks wait for the
# answer and do not move into prose; interviews remain distinct and optionless.
#
# MUTATION-CHECKED: changing one byte inside the CLAUDE.md block makes the digest assertion red;
# reverting the AGENTS.md one-ask heading to its former decision-only wording makes the semantic arm
# red; removing this script's workflow invocation makes the reachability arm red. Restore-and-green is
# part of the calibration. Run: bash scripts/hitl-contract.test.sh

set -uo pipefail

ROOT="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  printf 'FAIL  cannot resolve a git root; no assertion ran\n'
  exit 1
fi

CLAUDE="$ROOT/CLAUDE.md"
AGENTS="$ROOT/AGENTS.md"
WORKFLOW="$ROOT/.github/workflows/brief.yml"
EXPECTED_BLOCK_SHA="39e2636fa2daa59945ace09d6539a7da675c0b4b7a70ba6044596b7cd7f61c9a"

pass=0
fail=0
ok()  { pass=$((pass + 1)); printf 'PASS  %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf 'FAIL  %s\n' "$1"; }

open_count="$(grep -c '^<!-- hitl-escalation-format -->$' "$CLAUDE" || true)"
close_count="$(grep -c '^<!-- /hitl-escalation-format -->$' "$CLAUDE" || true)"
if [ "$open_count" != "1" ] || [ "$close_count" != "1" ]; then
  bad "canonical block has one opening and one closing delimiter (found ${open_count}/${close_count})"
else
  ok "canonical block has one opening and one closing delimiter"
fi

block_sha="$(sed -n '/^<!-- hitl-escalation-format -->$/,/^<!-- \/hitl-escalation-format -->$/p' "$CLAUDE" \
  | shasum -a 256 | awk '{print $1}')"
if [ "$block_sha" = "$EXPECTED_BLOCK_SHA" ]; then
  ok "canonical block matches the merged skills#538 bytes"
else
  bad "canonical block SHA is $block_sha; expected $EXPECTED_BLOCK_SHA"
fi

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

if grep -Fq 'run: bash scripts/hitl-contract.test.sh' "$WORKFLOW"; then
  ok "brief workflow executes this contract test"
else
  bad "brief workflow does not execute scripts/hitl-contract.test.sh"
fi

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
