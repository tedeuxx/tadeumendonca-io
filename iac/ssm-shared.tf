# Cross-repo boundary (acyclic split) — the SHARED infra repo (tadeumendonca-iac) owns only the
# workload-agnostic REGIONAL WAF and publishes its ARN to the SSM config bus; this workload READS it
# here instead of a terraform_remote_state. The shared side never references app resources, so the
# graph stays a DAG: apply order = shared → app; destroy order = app → shared.
#
# Requires the shared repo to have been applied first (its waf.tf writes this param). Cognito is no
# longer read here — it is now OWNED by this workload (auth.tf), which both creates the pool and
# publishes the /{env}/auth/cognito-* params consumed by the fed build + bff deploy.

# REGIONAL WAF web ACL ARN — associated with the API Gateway stage (api.tf) + the Cognito hosted UI
# (auth.tf). The WAF resource lives in the shared repo (tadeumendonca-iac waf.tf).
data "aws_ssm_parameter" "waf_regional_arn" {
  name = "/${var.environment}/auth/waf-regional-arn"
}
