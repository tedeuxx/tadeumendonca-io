resource "aws_cloudfront_origin_access_identity" "oai"{
    comment = "Token for restricted access"
}

resource "aws_cloudfront_distribution" "root" {
   enabled                 = true
   is_ipv6_enabled         = false
   aliases                 = [var.app_domain_root]
   price_class             = "PriceClass_200"
   
   restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    viewer_certificate {
        acm_certificate_arn = aws_acm_certificate.cert.arn
        ssl_support_method  = "sni-only"
    }
    origin {
        domain_name = var.app_domain_www
        origin_id   = local.origin_id_root

        custom_origin_config {
          http_port = 80
          https_port = 443
          origin_protocol_policy = "https-only"
          origin_ssl_protocols = ["TLSv1.2"]
        }
    }
    default_cache_behavior {
        allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        cached_methods   = ["GET", "HEAD"]
        target_origin_id = local.origin_id_root

        forwarded_values {
            query_string = true
            # headers = [ "*" ]
            cookies {
                forward = "none"
            }
        }

        viewer_protocol_policy = "redirect-to-https"
        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
    }
    tags = {
        App         = var.app_name
        Environment = var.app_env
    }
}

resource "aws_cloudfront_distribution" "code" {
    enabled                 = true
    is_ipv6_enabled         = false
    aliases                 = [var.app_domain_code ]
    price_class             = "PriceClass_200"
    
    restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    viewer_certificate {
        acm_certificate_arn = aws_acm_certificate.cert.arn
        ssl_support_method  = "sni-only"
    }
    origin {
        domain_name = var.github_domain
        origin_id   = local.origin_id_github
        origin_path = var.github_profile

        custom_origin_config {
          http_port = 80
          https_port = 443
          origin_protocol_policy = "https-only"
          origin_ssl_protocols = ["SSLv3","TLSv1.2", "TLSv1.1", "TLSv1"]
        }
    }
    default_cache_behavior {
        allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        cached_methods   = ["GET", "HEAD"]
        target_origin_id = local.origin_id_github

        forwarded_values {
            query_string = true
            # headers = [ "*" ]
            cookies {
                forward = "none"
            }
        }

        viewer_protocol_policy = "redirect-to-https"
        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
    }
    tags = {
        App         = var.app_name
        Environment = var.app_env
    }
}

resource "aws_cloudfront_distribution" "profile" {
    enabled                 = true
    is_ipv6_enabled         = false
    default_root_object     = "index.html"
    aliases                 = [var.app_domain_profile ]
    price_class             = "PriceClass_200"
    
    restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    viewer_certificate {
        acm_certificate_arn = aws_acm_certificate.cert.arn
        ssl_support_method  = "sni-only"
    }

    origin {
        origin_id   = local.origin_id_linkedin
        domain_name = aws_s3_bucket.profile.bucket_regional_domain_name
    
        s3_origin_config {
            origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
        }
    }
    default_cache_behavior {
        allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        cached_methods   = ["GET", "HEAD"]
        target_origin_id = local.origin_id_linkedin

        forwarded_values {
            query_string = false
            cookies {
                forward = "none"
            }
        }

        viewer_protocol_policy = "allow-all"
        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
    }
    tags = {
        App         = var.app_name
        Environment = var.app_env
    }
}

resource "aws_cloudfront_distribution" "wpp" {
    enabled                 = true
    is_ipv6_enabled         = false
    default_root_object     = "index.html"
    aliases                 = [var.app_domain_wpp ]
    price_class             = "PriceClass_200"
    
    restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    viewer_certificate {
        acm_certificate_arn = aws_acm_certificate.cert.arn
        ssl_support_method  = "sni-only"
    }

    origin {
        origin_id   = local.origin_id_wpp
        domain_name = aws_s3_bucket.wpp.bucket_regional_domain_name
    
        s3_origin_config {
            origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
        }
    }
    default_cache_behavior {
        allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        cached_methods   = ["GET", "HEAD"]
        target_origin_id = local.origin_id_wpp

        forwarded_values {
            query_string = false
            cookies {
                forward = "none"
            }
        }

        viewer_protocol_policy = "allow-all"
        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
    }
    tags = {
        App         = var.app_name
        Environment = var.app_env
    }
}

resource "aws_cloudfront_distribution" "insta" {
    enabled                 = true
    is_ipv6_enabled         = false
    default_root_object     = "index.html"
    aliases                 = [var.app_domain_insta ]
    price_class             = "PriceClass_200"
    
    restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    viewer_certificate {
        acm_certificate_arn = aws_acm_certificate.cert.arn
        ssl_support_method  = "sni-only"
    }

    origin {
        origin_id   = local.origin_id_insta
        domain_name = aws_s3_bucket.insta.bucket_regional_domain_name
    
        s3_origin_config {
            origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
        }
    }
    default_cache_behavior {
        allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        cached_methods   = ["GET", "HEAD"]
        target_origin_id = local.origin_id_insta

        forwarded_values {
            query_string = false
            cookies {
                forward = "none"
            }
        }

        viewer_protocol_policy = "allow-all"
        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
    }
    tags = {
        App         = var.app_name
        Environment = var.app_env
    }
}