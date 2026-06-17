locals {
  # Workload boundary in a shared account. Project = workload, Environment = isolation/cost split,
  # ManagedBy = provenance. Activated as cost-allocation tags in Billing. (/infrastructure/terraform)
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Per-env domain model (/infrastructure/route53): production sits on the apex; staging on a
  # `staging.` subdomain. The api host derives from the frontend host. (auth_domain lives in the shared
  # infra repo — Cognito owns it there.)
  frontend_host = var.environment == "production" ? var.apex_domain : "staging.${var.apex_domain}"
  api_domain    = "api.${local.frontend_host}"
  auth_domain   = "auth.${local.frontend_host}"
  callback_urls = ["https://${local.frontend_host}/callback"]
  logout_urls   = ["https://${local.frontend_host}/"]

  # Notifications sender — per-env, on the verified SES domain identity (owned by the shared infra repo's
  # ses.tf). The app only constructs the from-address string + the identity ARN for the BFF/digest IAM
  # policy; it does NOT manage the SES identity resource.
  ses_from_address = "no-reply@${local.frontend_host}"
}
