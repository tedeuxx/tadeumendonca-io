# App-infra outputs (visibility in TFC). Shared-infra outputs (cognito_user_pool_id, cognito_hosted_ui_url,
# waf_regional_arn) live in the tadeumendonca-iac repo; this app repo consumes them via SSM (ssm-shared.tf).

output "frontend_bucket_name" {
  description = "Private fed SPA origin bucket (CloudFront OAC reads it)."
  value       = module.frontend_bucket.s3_bucket_id
}

output "artifacts_bucket_name" {
  description = "Lambda code artifacts bucket (Pattern B bootstrap + deploy zips)."
  value       = module.artifacts_bucket.s3_bucket_id
}

output "og_images_bucket_name" {
  description = "Generated OG images cache bucket."
  value       = module.og_images_bucket.s3_bucket_id
}

output "dynamodb_table_names" {
  description = "Per-entity DynamoDB table names (also published to SSM /{env}/data/*-table-name)."
  value = {
    profile       = module.profile_table.dynamodb_table_id
    posts         = module.posts_table.dynamodb_table_id
    articles      = module.articles_table.dynamodb_table_id
    subscriptions = module.subscriptions_table.dynamodb_table_id
    audits        = module.audits_table.dynamodb_table_id
  }
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id (also in SSM /{env}/frontend/cloudfront-distribution-id)."
  value       = module.cloudfront.cloudfront_distribution_id
}

output "frontend_url" {
  description = "Public SPA URL (custom domain fronted by CloudFront)."
  value       = "https://${local.frontend_host}"
}

output "github_actions_role_arns" {
  description = "OIDC deploy role ARNs for the bff/fed deploy jobs (also in SSM /{env}/iam/*)."
  value = {
    api = module.oidc_api.iam_role_arn
    fed = module.oidc_fed.iam_role_arn
  }
}
