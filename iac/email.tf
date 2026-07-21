# Custom-domain email — Apple iCloud+ Custom Email Domain for the apex (dev@ / me@tadeumendonca.io).
# Records are provided by Apple during enrollment. Independent of the site (MX/TXT/CNAME — not the
# A-alias), so this touches nothing in the CloudFront/serving path. Domain-global (not per-env): only
# one environment is applied today and the platform is collapsing to a single environment.
resource "aws_route53_record" "email_mx" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.apex_domain
  type    = "MX"
  ttl     = 3600
  records = [
    "10 mx01.mail.icloud.com",
    "10 mx02.mail.icloud.com",
  ]
}

# Apex TXT holds BOTH the Apple domain-verification token AND the SPF record (one TXT record set per
# name; Route53 stores multiple quoted values). SPF is iCloud-only since SES is being retired.
resource "aws_route53_record" "email_txt" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.apex_domain
  type    = "TXT"
  ttl     = 3600
  records = [
    "apple-domain=pZXsGLD80aMvXGr9",
    "v=spf1 include:icloud.com ~all",
  ]
}

# iCloud DKIM (signing key) — CNAME to Apple's mail admin.
resource "aws_route53_record" "email_dkim" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "sig1._domainkey.${var.apex_domain}"
  type    = "CNAME"
  ttl     = 3600
  records = ["sig1.dkim.tadeumendonca.io.at.icloudmailadmin.com"]
}
