variable "aws_region" {
  description = "AWS Region"
  default = "us-east-1"
}

variable "app_name" {
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