# App-infra outputs (visibility in TFC).

output "frontend_bucket_name" {
  description = "Private fed SPA origin bucket (CloudFront OAC reads it)."
  value       = module.frontend_bucket.s3_bucket_id
}

output "og_images_bucket_name" {
  description = "Generated OG images cache bucket."
  value       = module.og_images_bucket.s3_bucket_id
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
  description = "OIDC deploy role ARN for the fed deploy job (also in SSM /{env}/iam/*)."
  value = {
    fed = module.oidc_fed.iam_role_arn
  }
}
