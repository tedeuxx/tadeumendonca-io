# Data source to get the current AWS region
data "aws_region" "current" {}

# Data source to get the current AWS account ID
data "aws_caller_identity" "current" {}

# Local variables
locals {
  aws_region  = data.aws_region.current.name
  aws_account_id = data.aws_caller_identity.current.account_id
  wildcard_domain = var.app_domain_is_wilcard == true ? "*.${var.app_domain_root}" : var.app_domain_root
  origin_id_root = var.app_domain_www
  origin_id_github = "WWW-github.com"
  origin_id_linkedin = "WWW-linkedin.com"

  origin_id_insta = "WWW-instagram.com"
  origin_id_wpp = "WWW-wa.me"
  content_type_map = {
    html        = "text/html",
    js          = "application/javascript",
    css         = "text/css",
    svg         = "image/svg+xml",
    jpg         = "image/jpeg",
    ico         = "image/x-icon",
    png         = "image/png",
    gif         = "image/gif",
    pdf         = "application/pdf"
  }
}