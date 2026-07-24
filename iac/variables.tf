# Canonical input variables for the frontend infra. Every variable is typed and domain-validated so a
# bad value fails at `plan`, never at `apply`.

variable "project" {
  type        = string
  description = "Workload name — used in every resource name, SSM path, and the Project tag."
  default     = "tadeumendonca"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}[a-z0-9]$", var.project))
    error_message = "project must be lowercase kebab-case (a-z, 0-9, -), 3–32 chars."
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment. Drives per-env conditionals (retention, deletion protection)."
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "aws_region" {
  type        = string
  description = "Primary AWS region for the default provider."
  default     = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "aws_region must be a valid AWS region id (e.g. us-east-1)."
  }
}

variable "apex_domain" {
  type        = string
  description = "Registrable apex domain. Hosted zone name + base for per-env hosts (api/frontend)."
  default     = "tadeumendonca.io"
  validation {
    condition     = can(regex("^([a-z0-9-]+\\.)+[a-z]{2,}$", var.apex_domain))
    error_message = "apex_domain must be a valid domain name (e.g. example.com)."
  }
}

variable "monthly_budget_usd" {
  type        = number
  description = <<-EOT
    Ceiling for the whole initiative's AWS spend, in USD/month. Not a forecast — an alarm.
    Set to absorb the one month that legitimately spikes: the annual `.io` renewal is $71.00 and lands
    in October on top of a ~$5 baseline, so $80 keeps the ceiling meaningful in the month it would
    otherwise breach for a reason that is neither a surprise nor a mistake.
    Measured 2026-07-23: the site itself costs ~$0.53/mo (S3 + Route 53); account run-rate ~$4.60/mo,
    the rest being residue from the retired backend.
    NOTE the consequence, handled by the thresholds in budget.tf rather than by the ceiling: at $80 the
    run-rate is under 6%, so a percentage alarm anchored at 50% would sit ~9x above reality and miss a
    new recurring cost entirely. The ceiling bounds the worst month; the LOW threshold is what actually
    detects a decision.
  EOT
  default     = 80
  validation {
    condition     = var.monthly_budget_usd > 0 && var.monthly_budget_usd <= 1000
    error_message = "monthly_budget_usd must be between 1 and 1000 — a ceiling outside that range is a typo, not a decision."
  }
}

variable "budget_alert_email" {
  type        = string
  description = <<-EOT
    Where budget alerts go. Empty disables notifications — the budget still tracks, silently, which is
    the safe default rather than a useful one.
    SET IT AS A TERRAFORM CLOUD WORKSPACE VARIABLE, never in env/*.tfvars: those files are committed to
    a PUBLIC repo, and a personal address in one is a permanent harvestable artifact. This is the same
    reason role ARNs live in environment secrets rather than here.
  EOT
  default     = ""
  validation {
    condition     = var.budget_alert_email == "" || can(regex("^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$", var.budget_alert_email))
    error_message = "budget_alert_email must be a valid address or empty."
  }
}

variable "github_org" {
  type        = string
  description = "GitHub org owning this repo. OIDC trust pins the immutable subject repo:<org>@<org_id>/<repo>@<repo_id>:* (see iam.tf)."
  default     = "tedeuxx"
  validation {
    condition     = can(regex("^[a-zA-Z0-9](-?[a-zA-Z0-9]){0,38}$", var.github_org))
    error_message = "github_org must be a valid GitHub org/user handle."
  }
}
