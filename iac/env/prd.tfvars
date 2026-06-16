# Production — paired with TF_WORKSPACE=tadeumendonca-pwa-production.
# Differences from stg are driven by var.environment. (BFF is non-VPC — no NAT.)
# admin_emails lives in the SHARED infra repo (tadeumendonca-iac) — it's a Cognito-only var.
project     = "tadeumendonca"
environment = "production"
aws_region  = "us-east-1"
