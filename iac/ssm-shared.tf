# Cross-repo boundary (acyclic split) — the SHARED infra repo (tadeumendonca-iac) owns Cognito + the
# REGIONAL WAF and publishes them to the SSM config bus; this APP infra repo READS them here instead of
# a terraform_remote_state. The shared side never references app resources, so the graph stays a DAG:
# apply order = shared → app; destroy order = app → shared.
#
# Requires the shared repo to have been applied first (its auth.tf writes these params). On a clean/
# greenfield env, apply tadeumendonca-iac before this workspace.

# REGIONAL WAF web ACL ARN — associated with the API Gateway stage (api.tf). The WAF resource + its
# Cognito association live in the shared repo (auth.tf).
data "aws_ssm_parameter" "waf_regional_arn" {
  name = "/${var.environment}/auth/waf-regional-arn"
}

# Cognito user pool id — the digest Lambda resolves opted-in users' emails via cognito-idp:ListUsers
# (api.tf). The pool ARN is derived from this id + region + account (see api.tf), avoiding a second param.
data "aws_ssm_parameter" "cognito_user_pool_id" {
  name = "/${var.environment}/auth/cognito-user-pool-id"
}
