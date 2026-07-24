# Cost guardrail. The owner set a ceiling for the whole initiative (var.monthly_budget_usd) and the
# point of putting it here is that a ceiling nobody measures is a wish — this makes it mechanical.
#
# WHY THIS EXISTS, from a real miss: the architecture said "static site, near-zero cost", and the
# actual bill was $33–38/month. The gap was entirely residue from the retired backend era — a WAF
# billing until 2026-07-21, an orphaned Elastic IP, leftover secrets — none of it in this Terraform,
# so reading the code told you nothing about it. A budget watches the ACCOUNT, which is the only thing
# that sees resources the repo has forgotten.
#
# Deliberately account-wide, not filtered to this project's tags: the orphans that caused the overrun
# were untagged precisely because nothing here manages them. A tag filter would have hidden every
# dollar that actually mattered.
#
# THE DOMAIN RENEWAL is why the ceiling is $80 rather than the initiative's $50 target. The apex renews
# 2026-10-04 with AutoRenew on, and `.io` renewal is **$71.00/yr** — verified via
# `aws route53domains list-prices --tld io`, not estimated. That is an ANNUAL charge landing in one
# month, so October reaches ~$76 against a ~$5 baseline: the single largest expense of the year, and
# neither a surprise nor a mistake. The ceiling absorbs it so the month does not read as a breach.
#
# It is NOT filtered out of the budget, and that distinction matters: absorbing a known charge in the
# ceiling still leaves it visible, while filtering it would stop the budget watching the registrar line
# at all — so a price change, a second domain, or an accidental multi-year renewal would pass in
# silence. The lesson behind this whole file is that the invisible line item is the one that costs you.

resource "aws_budgets_budget" "monthly" {
  name         = "${var.project}-monthly-ceiling"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # The thresholds carry the sensitivity, NOT the ceiling — and that separation is the whole design.
  # The ceiling is sized for the worst legitimate month (October, $76). Against $80, the ~$4.60 run-rate
  # is under 6%, so a conventional 50%/80% pair would first speak at $40 — roughly 9x actual spend, and
  # blind to a new $30/month service for a full year.
  #
  #   15%  ≈ $12  — the one that matters. Above the current baseline with headroom, so it stays quiet
  #                 normally, and fires on any new recurring cost of roughly $8/month or more. This is
  #                 the "someone added a service" alarm.
  #   50%  ≈ $40  — something substantial is running that nobody decided.
  #   80%  ≈ $64  — approaching the ceiling.
  #   100% FORECASTED — projected to breach. In October it arrives in late September, BEFORE the
  #                 renewal charge, which is what makes an expected spike bearable instead of noise.
  #
  # October will trip the three ACTUAL thresholds. That is once a year, expected, and confirms the
  # largest single expense actually left the account — not a false positive to tune away.
  dynamic "notification" {
    for_each = var.budget_alert_email == "" ? [] : [
      { type = "ACTUAL", threshold = 15 },
      { type = "ACTUAL", threshold = 50 },
      { type = "ACTUAL", threshold = 80 },
      { type = "FORECASTED", threshold = 100 },
    ]
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value.threshold
      threshold_type             = "PERCENTAGE"
      notification_type          = notification.value.type
      subscriber_email_addresses = [var.budget_alert_email]
    }
  }
}
