variable "aws_region" {
  type = string
}

variable "aws_profile" {
  type = string
}

variable "app_name" {
  type = string
}

variable "app_env" {
  type = string
}

variable "app_domain_www" {
  type = string
}

variable "app_domain_root" {
  type = string
}

variable "app_domain_is_wilcard" {
  type = bool
}

variable "app_domain_code" {
  type = string
}

variable "app_domain_profile" {
  type = string
}

variable "app_domain_wpp" {
  type = string
}

variable "app_domain_insta" {
  type = string
}

variable "github_domain" {
  type = string
}

variable "github_profile" {
  type = string
}

variable "app_blog_medium_ips" {
  type = list
}

locals {
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