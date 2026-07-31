# Storage layer — owned by /infrastructure/s3.
# TWO buckets via terraform-aws-modules/s3-bucket/aws ~> 4.0, both sharing one hardened baseline
# (ACLs off, public access fully blocked, SSE-S3 at rest, TLS-only in transit); only versioning,
# lifecycle, and purpose differ. Names are account-id-prefixed for global uniqueness.
#
# Bucket NAMES are created here; the OAC read policies for the private fed + assets buckets are
# wired in frontend.tf (#7) once the CloudFront distribution exists — its SourceArn is the principal.

locals {
  bucket_prefix = "${data.aws_caller_identity.current.account_id}-${var.project}"

  # Shared hardened baseline applied to every bucket.
  s3_force_destroy = var.environment != "production" # stg can be torn down; prod protected

  # CloudFront-served public buckets (fed, assets) use SSE-S3 (AES256): CloudFront OAC can't
  # decrypt objects under the AWS-managed aws/s3 KMS key (its key policy can't grant the CloudFront
  # service principal kms:Decrypt), which 403s the SPA. The content is public, so AES256 at rest is
  # the right stance here (/infrastructure/s3, /infrastructure/kms). A CMK would be the KMS alternative.
  s3_encryption_public = {
    rule = {
      apply_server_side_encryption_by_default = { sse_algorithm = "AES256" }
    }
  }
}

# 1. Frontend (fed) SPA origin — private, reached only via CloudFront OAC (policy wired in #7).
module "frontend_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket        = "${local.bucket_prefix}-fed-${var.environment}"
  force_destroy = local.s3_force_destroy

  control_object_ownership = true
  object_ownership         = "BucketOwnerEnforced"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  server_side_encryption_configuration = local.s3_encryption_public # AES256 — CloudFront OAC can't decrypt aws/s3 KMS
  # TLS-deny is folded into the combined OAC bucket policy in frontend.tf (a single policy per
  # bucket; the OAC allow needs the CloudFront ARN, so the policy can't live in this module call —
  # that would create a storage↔frontend cycle).
  attach_deny_insecure_transport_policy = false

  versioning = { enabled = true } # rollback safety for the site
}

# 2. (was the generated OG images cache — DELETED, owner decision, follow-up to #302.)
# It backed the Lambda@Edge OG renderer (ADR-0026, superseded by ADR-0004) and nothing had written to
# it since that retirement; #302 then removed the CloudFront origin and /og/* behavior that were its
# only reader, because they were misrouting every per-article og:image. That left a bucket with zero
# objects and zero readers, and its 90-day lifecycle rule had been expiring nothing for just as long.
# The per-article cards of ADR-0041 are committed static objects served from the fed bucket.
# Deleting it is irreversible, so it was taken as its own decision rather than folded into #302.
# The numbering gap (1, 3-as-comment, 4) is left ALONE on purpose: renumbering would silently rewrite
# what every older commit message and review comment points at.

# 4. Assets — ONE generic object store for any feature that needs one (Phase 3: user avatars under
# avatars/), with per-feature isolation via root subfolders. Private, read publicly via the main
# CloudFront /assets/avatars/* behavior (OAC in frontend.tf). AES256 like the fed bucket (CloudFront
# OAC can't decrypt the aws/s3 KMS key). No lifecycle expiry — avatars persist; versioning off (each key is
# overwritten in place by the uploader).
module "assets_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket        = "${local.bucket_prefix}-assets-${var.environment}"
  force_destroy = local.s3_force_destroy

  control_object_ownership = true
  object_ownership         = "BucketOwnerEnforced"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  server_side_encryption_configuration  = local.s3_encryption_public # AES256 — CloudFront OAC can't decrypt aws/s3 KMS
  attach_deny_insecure_transport_policy = false                      # folded into the combined OAC policy in frontend.tf

  versioning = { enabled = false }
}

# SSM config bus (/infrastructure/ssm) — IaC writes, app repos read at deploy. Non-sensitive names.
resource "aws_ssm_parameter" "frontend_bucket_name" {
  name  = "/${var.environment}/frontend/s3-bucket-name"
  type  = "String"
  value = module.frontend_bucket.s3_bucket_id
}

resource "aws_ssm_parameter" "assets_bucket_name" {
  name  = "/${var.environment}/storage/assets-bucket-name"
  type  = "String"
  value = module.assets_bucket.s3_bucket_id
}
