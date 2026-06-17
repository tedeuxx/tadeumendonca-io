# SES (notifications) — bound to THIS workload's domain (staging.tadeumendonca.io / tadeumendonca.io),
# so it is workload-specific and lives with the app. Verifies the sending domain identity + DKIM; the
# BFF + digest Lambda send via the SES API with their exec roles (ses:SendEmail in api.tf) — NO SMTP
# user/credential (ses_user_enabled=false), so nothing to store or rotate.
#
# Per-env DOMAIN identity, NOT a single apex identity: the two environments are independent TF
# workspaces and can't both own the same apex SES identity in one account/region without colliding.
# From-address = no-reply@<frontend_host>. New accounts are SES-sandboxed (verified recipients only) —
# production access is a manual, out-of-band request.
module "ses" {
  source  = "cloudposse/ses/aws"
  version = "~> 0.25"

  domain        = local.frontend_host
  zone_id       = data.aws_route53_zone.main.zone_id # writes the _amazonses TXT + DKIM CNAMEs here
  verify_domain = true
  verify_dkim   = true

  ses_user_enabled  = false # the BFF/digest roles send via the SES API — no SMTP IAM user
  ses_group_enabled = false

  name    = "ses"
  stage   = var.environment
  enabled = true
}

resource "aws_ssm_parameter" "ses_from_address" {
  name  = "/${var.environment}/notifications/ses-from-address"
  type  = "String"
  value = local.ses_from_address
}

# Block the apply until SES has actually VERIFIED the domain identity (an async DNS check — module.ses
# only creates the identity + the _amazonses TXT record, it does not wait for verification). Without
# this gate a greenfield apply races: module.cognito's email_configuration references the SES identity,
# and CreateUserPool fails with "Email address is not verified" if the pool is created before SES
# finishes verifying. module.cognito depends_on this (auth.tf), so Cognito never runs early. Because the
# route53 records live in the same hosted zone, verification typically completes within a couple minutes.
resource "aws_ses_domain_identity_verification" "this" {
  domain     = local.frontend_host
  depends_on = [module.ses]
}
