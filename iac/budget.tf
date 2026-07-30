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
  # The ceiling is sized for the worst legitimate month (October, $76), so against $80 a conventional
  # 50%/80% pair would first speak at $40 — many times actual spend, and blind to a new $30/month
  # service for a full year.
  #
  # BASELINE, corrected 2026-07-30 (#278). This block said ~$4.60/month and that number was measured
  # while the retired backend's WAF and idle IPv4 addresses were still billing — it captured the
  # orphaned spend AS IF it were the floor. Read again after both stopped (Cost Explorer, 5 days
  # 07-25→07-29, read-only profile): $0.1642 over five days = $0.0328/day of usage, plus the $0.50
  # hosted zone billed monthly ⇒ **~$1.50/month**, roughly a third of what was recorded.
  #
  # That is why 10% and not 15%. The notch was chosen to fire on "someone added a service", and against
  # the stale baseline 15% ≈ $12 meant ~$8/month of new spend. Against the true floor the SAME notch
  # needs ~$10.50 — less sensitive than it was designed to be, because the baseline moved and the
  # percentage did not. 10% ≈ $8 restores the intended trigger.
  #
  #   10%  ≈ $8   — the one that matters. Quiet at a ~$1.50 run-rate, and fires on any new recurring
  #                 cost of roughly $6.50/month. This is the "someone added a service" alarm, and its
  #                 sensitivity is a decision about what is worth waking up for — not a round number.
  #   50%  ≈ $40  — something substantial is running that nobody decided.
  #   80%  ≈ $64  — approaching the ceiling.
  #   100% FORECASTED — projected to breach. In October it arrives in late September, BEFORE the
  #                 renewal charge, which is what makes an expected spike bearable instead of noise.
  #
  # Note the residue this correction exposes and does NOT cover: ~$0.79/month of Secrets Manager plus
  # smaller EC2-Other and DocumentDB lines are still accruing from the same retired era (#274). They sit
  # inside the $1.50 above — the floor is honest, it is just not as low as it should be yet.
  #
  # October will trip the three ACTUAL thresholds. That is once a year, expected, and confirms the
  # largest single expense actually left the account — not a false positive to tune away.
  dynamic "notification" {
    # for_each cannot depend on a sensitive value (instance keys can't be sensitive). budget_alert_email
    # is sensitive, so nonsensitive() unwraps ONLY the "is it set?" boolean — never the address. The
    # address itself (subscriber_email_addresses below) stays sensitive and is redacted in plan/apply.
    for_each = nonsensitive(var.budget_alert_email == "") ? [] : [
      { type = "ACTUAL", threshold = 10 },
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
