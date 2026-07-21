# Root data sources, declared once. account_id prefixes globally-unique S3 bucket names and is
# never hardcoded (/infrastructure/terraform).
data "aws_caller_identity" "current" {}

# Pre-existing hosted zone for the apex domain — frontend + email records land here.
data "aws_route53_zone" "main" {
  name = var.apex_domain
}

# ACM cert pre-created + DNS-validated out-of-band in us-east-1 (covers apex + *.<apex>). us-east-1
# because CloudFront requires its cert there.
data "aws_acm_certificate" "main" {
  provider    = aws.us_east_1
  domain      = var.apex_domain
  statuses    = ["ISSUED"]
  most_recent = true
}
