data "aws_route53_zone" "main" {
  name         = var.app_domain_root 
  private_zone = false
}

resource "aws_acm_certificate" "cert" {
  domain_name       = var.app_domain_root
  subject_alternative_names = [ local.wildcard_domain ]

  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

# resource "aws_route53_record" "cert_validation" {
#   depends_on      = [aws_acm_certificate.cert]
#   name            = sort(aws_acm_certificate.cert.domain_validation_options[*].resource_record_name)[0]
#   records         = [sort(aws_acm_certificate.cert.domain_validation_options[*].resource_record_value)[0]]
#   type            = "CNAME"
#   zone_id         = data.aws_route53_zone.main.zone_id
#   ttl             = 300
#   allow_overwrite = true
# }

# resource "aws_acm_certificate_validation" "cert" {
#   certificate_arn         = aws_acm_certificate.cert.arn
#   validation_record_fqdns = [ aws_route53_record.cert_validation.fqdn ]
#   timeouts {
#     create = "60m"
#   }
# }
