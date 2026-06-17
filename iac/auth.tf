# Auth layer — Cognito is WORKLOAD-SPECIFIC (a pool dedicated to this app), so it lives with the app
# here, not in shared infra. SOCIAL-ONLY via Google (no native signup); profiles admin + registered
# (public = unauthenticated). MFA OFF (federated → Google 2FA), threat protection ENFORCED, email via
# the verified SES identity (ses.tf). A small trigger (fn-cognito-groups) assigns groups (admin by
# email allowlist) + injects the group claim. The SHARED regional WAF (tadeumendonca-iac) fronts the
# hosted UI — its ARN is read via the SSM config bus (ssm-shared.tf) and associated below.

# Google OAuth client (id + secret) from Secrets Manager — provisioned out-of-band (owner created the
# Google client). Both kept together in the secret; only the secret value is sensitive. Survives pool
# recreation, so the Google OAuth config never has to change.
data "aws_secretsmanager_secret_version" "google_oauth" {
  secret_id = "${var.project}/${var.environment}/google-oauth"
}
locals {
  google_oauth = jsondecode(data.aws_secretsmanager_secret_version.google_oauth.secret_string)
}

# Cognito trigger — assigns federated users to 'registered' (+ 'admin' by allowlist) and injects the
# group claim into the token. NO module.cognito references (would create a cycle): the pool id comes
# from the trigger EVENT, and the IAM policy is scoped to userpool/* in this account. Non-VPC, fail-open.
module "fn_cognito_groups" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "${var.project}-cognito-groups-${var.environment}"
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 10  # headroom over cold start + the capped membership sync (a pre-token timeout breaks login)
  memory_size   = 256 # more memory = more CPU = faster cold start (SDK init) for this on-login-path trigger

  create_package = true
  source_path    = "${path.module}/lambda-src/cognito-groups"

  environment_variables = { ADMIN_EMAILS = join(",", var.admin_emails) }

  attach_policy_statements = true
  policy_statements = {
    groups = {
      effect    = "Allow"
      actions   = ["cognito-idp:AdminAddUserToGroup", "cognito-idp:AdminListGroupsForUser"]
      resources = ["arn:aws:cognito-idp:${var.aws_region}:${local.account}:userpool/*"] # pool id is post-apply; one pool
    }
  }
}

module "cognito" {
  source  = "lgallard/cognito-user-pool/aws"
  version = "~> 0.31"

  # Gate on SES verification (ses.tf) — the pool's email_configuration points at the SES identity, and
  # CreateUserPool fails if SES hasn't verified the domain yet. Critical for greenfield (prod) applies.
  depends_on = [aws_ses_domain_identity_verification.this]

  user_pool_name           = "${var.project}-${var.environment}"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF" # social-only → MFA is the IdP's (Google 2FA)

  # Native deletion protection — ACTIVE in production (guards the real user pool against an accidental
  # destroy), INACTIVE in staging (so it stays freely recreatable). This is the workspace-native
  # safety net; staging recreation is a no-op concern (no real users).
  deletion_protection = var.environment == "production" ? "ACTIVE" : "INACTIVE"

  # Threat protection requires the PLUS tier (the default ESSENTIALS rejects advanced_security ENFORCED
  # with FeatureUnavailableInTierException). PLUS ≈ $0.05/MAU — the owner accepted this for threat prot.
  user_pool_tier    = "PLUS"
  user_pool_add_ons = { advanced_security_mode = "ENFORCED" }

  # No native self-signup — users are provisioned on first Google login (federation).
  admin_create_user_config = { allow_admin_create_user_only = true }

  # Email via the verified SES domain identity (ses.tf) — same account/workspace, no extra SES auth needed.
  email_configuration = {
    email_sending_account = "DEVELOPER"
    from_email_address    = local.ses_from_address
    source_arn            = "arn:aws:ses:${var.aws_region}:${local.account}:identity/${local.frontend_host}"
  }

  user_groups = [
    { name = "admin", precedence = 1 },
    { name = "registered", precedence = 10 },
  ] # public = no group (unauthenticated)

  # Google as the only identity provider — social-only
  identity_providers = [{
    provider_name = "Google"
    provider_type = "Google"
    provider_details = {
      client_id        = local.google_oauth.client_id
      client_secret    = local.google_oauth.client_secret
      authorize_scopes = "openid email profile"
    }
    attribute_mapping = {
      email    = "email"
      name     = "name"
      username = "sub"
    }
  }]

  # Cognito trigger Lambdas (group assignment + claim injection)
  lambda_config = {
    post_authentication  = module.fn_cognito_groups.lambda_function_arn
    pre_token_generation = module.fn_cognito_groups.lambda_function_arn
  }

  # single PUBLIC SPA client — Authorization Code + PKCE, Google-only (no COGNITO native IdP)
  client_name                                 = "spa"
  client_generate_secret                      = false
  client_allowed_oauth_flows                  = ["code"]
  client_allowed_oauth_flows_user_pool_client = true
  client_allowed_oauth_scopes                 = ["openid", "email", "profile"]
  client_callback_urls                        = local.callback_urls
  client_logout_urls                          = local.logout_urls
  client_default_redirect_uri                 = local.callback_urls[0]
  client_supported_identity_providers         = ["Google"]
  client_explicit_auth_flows                  = ["ALLOW_REFRESH_TOKEN_AUTH"]

  # custom hosted-UI domain is the standard — not the Cognito-generated prefix. The auth.* hostname is
  # stable across recreation, so the Google OAuth redirect URI never changes.
  domain                 = local.auth_domain
  domain_certificate_arn = data.aws_acm_certificate.main.arn # ISSUED cert in us-east-1
}

# Allow Cognito to invoke the trigger Lambda.
resource "aws_lambda_permission" "cognito_groups" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.fn_cognito_groups.lambda_function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito.arn
}

# Test-only app client (NON-PROD) — enables USER_PASSWORD_AUTH so CI/E2E can mint a token for a native
# test user WITHOUT Google's interactive login (the SPA client is Google-only and can't be automated).
# Scoped to its own client so the public SPA client stays Google-only; no OAuth/hosted-UI, no secret.
# The test user is provisioned out-of-band (admin-create-user + permanent password + admin group).
resource "aws_cognito_user_pool_client" "test" {
  count        = var.environment == "production" ? 0 : 1
  name         = "${var.project}-test-${var.environment}"
  user_pool_id = module.cognito.id

  generate_secret     = false
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  access_token_validity = 1
  id_token_validity     = 1
  token_validity_units {
    access_token = "hours"
    id_token     = "hours"
  }
}

# Hosted-UI branding (classic, managed_login_version=1) — on-brand with the site's look: dark slate
# background + cyan accent (the palette from the OG cards / SPA). CSS uses only the documented
# customizable classes + safe property combos (Cognito validates strictly). The "Continue with Google"
# idpButton keeps Google's standard styling (brand guidelines) on the dark background.
resource "aws_cognito_user_pool_ui_customization" "this" {
  user_pool_id = module.cognito.id
  image_file   = filebase64("${path.module}/assets/cognito-logo.png")
  css          = <<-CSS
    .background-customizable { background-color: #0f172a; }
    .banner-customizable { background-color: #0f172a; }
    .label-customizable { color: #f8fafc; }
    .textDescription-customizable { color: #94a3b8; }
    .idpDescription-customizable { color: #94a3b8; }
    .legalText-customizable { color: #94a3b8; }
    .submitButton-customizable { background-color: #38bdf8; }
    .submitButton-customizable:hover { background-color: #0ea5e9; }
    .logo-customizable { max-width: 380px; max-height: 72px; }
  CSS
}

# Associate the SHARED REGIONAL WAF (tadeumendonca-iac, read via SSM) with the Cognito hosted UI. Raw
# glue — no native WAF attribute on the user pool. The API GW stage association is in api.tf.
resource "aws_wafv2_web_acl_association" "cognito" {
  resource_arn = module.cognito.arn
  web_acl_arn  = data.aws_ssm_parameter.waf_regional_arn.value
}

# Route53 A-alias for the custom auth domain → the Cognito-managed CloudFront distribution.
resource "aws_route53_record" "auth" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.auth_domain
  type    = "A"
  alias {
    name                   = module.cognito.domain_cloudfront_distribution
    zone_id                = module.cognito.domain_cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

# SSM config bus — this workload PRODUCES these (the fed build + bff deploy read them at deploy time).
resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name  = "/${var.environment}/auth/cognito-user-pool-id"
  type  = "String"
  value = module.cognito.id
}

resource "aws_ssm_parameter" "cognito_client_id" {
  name  = "/${var.environment}/auth/cognito-client-id"
  type  = "String"
  value = module.cognito.client_ids[0] # single SPA client
}

# Test client id (NON-PROD) — read by CI to mint the test user's token (username/password from secrets).
resource "aws_ssm_parameter" "cognito_test_client_id" {
  count = var.environment == "production" ? 0 : 1
  name  = "/${var.environment}/auth/cognito-test-client-id"
  type  = "String"
  value = aws_cognito_user_pool_client.test[0].id
}

resource "aws_ssm_parameter" "cognito_domain" {
  name  = "/${var.environment}/auth/cognito-domain"
  type  = "String"
  value = local.auth_domain
}

resource "aws_ssm_parameter" "cognito_hosted_ui_url" {
  name  = "/${var.environment}/auth/cognito-hosted-ui-url"
  type  = "String"
  value = "https://${local.auth_domain}"
}
