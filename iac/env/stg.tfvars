# Staging — paired with TF_WORKSPACE=tadeumendonca-pwa-staging.
# Differences from prd are driven by var.environment, not extra vars. (BFF is non-VPC — no NAT.)
# admin_emails lives in the SHARED infra repo (tadeumendonca-iac) — it's a Cognito-only var.
project     = "tadeumendonca"
environment = "staging"
aws_region  = "us-east-1"
