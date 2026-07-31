# Storage layer — owned by /infrastructure/s3.
# TWO buckets via terraform-aws-modules/s3-bucket/aws ~> 4.0, both sharing one hardened baseline
# (ACLs off, public access fully blocked, SSE-S3 at rest, TLS-only in transit); only versioning,
# lifecycle, and purpose differ. Names are account-id-prefixed for global uniqueness.
#
# Bucket NAMES are created here; the OAC read policies for the private fed + assets buckets are
# wired in frontend.tf (#7) once the CloudFront distribution exists — its SourceArn is the principal.

# force_destroy is FALSE on every bucket, hard-coded, not derived. It used to be
# `local.s3_force_destroy = var.environment != "production"` ("stg can be torn down; prod protected"),
# written for ADR-0028's two environments. That world is gone (ADR-0003: one environment), and the
# survivor is named `staging` while BEING production — it serves the apex. So the predicate was
# literally correct and semantically backwards: it evaluated to TRUE, arming force_destroy on the
# bucket that holds the live site. A guard that is inverted on the only environment it runs in is
# worse than no guard, because it reads as protection.
#
# REJECTED — renaming the environment to `production` so the predicate comes out right. Measured, not
# reasoned: `terraform plan -var environment=production` (inspection only, never applied) proposes
# **19 to add, 4 to change, 19 to destroy**. var.environment is interpolated into every NAME in this
# root — bucket names, SSM parameter paths, the CloudFront Function name, the IAM policy name — and
# all of those are ForceNew. It would replace the fed bucket serving the apex, replace the
# spa-rewrite function, and move /staging/frontend/s3-bucket-name and
# /staging/frontend/cloudfront-distribution-id, which are exactly the two parameters deploy.yml
# resolves at the start of every deploy. Never reach for it; the rename is only safe as a full
# migration, not as a one-line fix to this guard.
#
# The lesson generalises past force_destroy: while there is exactly ONE environment, ANY predicate
# over var.environment is fiction. Its other branch can never be taken, so nothing ever tests it — it
# is a comment that happens to compile, and this one was wrong for months in the dangerous direction.
# State the value you want.
locals {
  bucket_prefix = "${data.aws_caller_identity.current.account_id}-${var.project}"

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

  bucket = "${local.bucket_prefix}-fed-${var.environment}"
  # This bucket IS the live site. force_destroy = true directly CONTRADICTED the
  # `versioning = { enabled = true } # rollback safety for the site` line at the bottom of this same
  # block: force_destroy deletes every object AND every noncurrent version, so the one setting bought
  # the rollback history that the other stood ready to erase without the bucket-not-empty error
  # stopping it. Measured at the time of this change: 80 current objects, ~9,000 versions.
  force_destroy = false

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

  bucket = "${local.bucket_prefix}-assets-${var.environment}"
  # false here too, and it costs nothing: force_destroy only has an effect on a bucket that HAS
  # contents — an empty bucket destroys cleanly without it. So this does not obstruct retiring this
  # bucket the way og-images was retired (#304); it only refuses to silently delete objects that
  # someone has since put here.
  force_destroy = false

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
