resource "aws_route53_record" "root" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.app_domain_root
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.root.domain_name
    zone_id                = aws_cloudfront_distribution.root.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.app_domain_www
  type    = "A"
  records = var.app_blog_medium_ips
  ttl     = 300
}

resource "aws_route53_record" "code" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.app_domain_code
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.code.domain_name
    zone_id                = aws_cloudfront_distribution.code.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "profile" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.app_domain_profile
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.profile.domain_name
    zone_id                = aws_cloudfront_distribution.profile.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "wpp" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.app_domain_wpp
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.wpp.domain_name
    zone_id                = aws_cloudfront_distribution.wpp.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "insta" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.app_domain_insta
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.insta.domain_name
    zone_id                = aws_cloudfront_distribution.insta.hosted_zone_id
    evaluate_target_health = false
  }
}