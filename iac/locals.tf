locals {
  # Workload boundary in a shared account. Project = workload, Environment = isolation/cost split,
  # ManagedBy = provenance. Activated as cost-allocation tags in Billing. (/infrastructure/terraform)
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Per-env domain model (/infrastructure/route53): production sits on the apex; staging on a
  # `staging.` subdomain. (Static site — only the frontend host remains.)
  frontend_host = var.environment == "production" ? var.apex_domain : "staging.${var.apex_domain}"
}
