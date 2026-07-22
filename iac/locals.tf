locals {
  # Workload boundary in a shared account. Project = workload, Environment = isolation/cost split,
  # ManagedBy = provenance. Activated as cost-allocation tags in Billing. (/infrastructure/terraform)
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Single-environment static site: serve at the apex. (Resource names keep their internal env suffix
  # to avoid a churny recreate; the public host is the apex regardless.)
  frontend_host = var.apex_domain
}
