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
# KNOWN: October WILL exceed this, and by design. The apex renews 2026-10-04 with AutoRenew on, and
# `.io` renewal is **$71.00/yr** (verified via `aws route53domains list-prices --tld io`, not estimated).
# So October lands at roughly $76 against a ~$5 baseline — an ANNUAL charge in one month, and the single
# largest expense of the year. It is not a false positive and it is not filtered out, for two reasons:
#   - It is real money leaving the account, and seeing it confirmed once a year is worth one email.
#   - Filtering it would mean the budget stops watching the registrar line entirely — so a price
#     change, a second domain, or an accidental multi-year renewal would pass silently. The whole
#     lesson behind this file is that the invisible line item is the one that costs you.
# The FORECASTED threshold is what makes this bearable: it warns in late September, before the charge,
# rather than after.

resource "aws_budgets_budget" "monthly" {
  name         = "${var.project}-monthly-ceiling"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # Two ACTUAL thresholds plus one FORECASTED. Actual tells you it happened; forecasted tells you it is
  # going to, which is the only one that arrives while a bad decision is still cheap to undo.
  dynamic "notification" {
    for_each = var.budget_alert_email == "" ? [] : [
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
