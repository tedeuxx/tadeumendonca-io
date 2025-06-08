resource "aws_s3_bucket" "profile" {
  bucket = var.app_domain_profile
  force_destroy = true
  acl    = "public-read"
  policy = data.aws_iam_policy_document.profile_policy.json

  website {
    index_document = "index.html"
    error_document = "error.html"
  }
}

resource "aws_s3_bucket_object" "profile_content" {
  depends_on      = [aws_s3_bucket.profile]
  bucket = var.app_domain_profile
  key    = "index.html"
  content = templatefile("${path.module}/index.tpl",
  {
    AppName   = "LinkedIn"
    AppURL = "https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530"
  })
  content_type  = "text/html"
}

resource "aws_s3_bucket" "wpp" {
  bucket = var.app_domain_wpp
  force_destroy = true
  acl    = "public-read"
  policy = data.aws_iam_policy_document.wpp_policy.json

  website {
    index_document = "index.html"
    error_document = "error.html"
  }
}

resource "aws_s3_bucket_object" "wpp_content" {
  depends_on      = [aws_s3_bucket.wpp]
  bucket = var.app_domain_wpp
  key    = "index.html"
  content = templatefile("${path.module}/index.tpl",
  {
    AppName   = "WhatsApp Web"
    AppURL = "https://wa.me/5521986619954?text=Oi%20Tadeu%2C%20tudo%20bem%3F%20Gostaria%20de%20saber%20mais%20sobre%20a%20Transforma%C3%A7%C3%A3o%20Digital.%20Consegue%20me%20ajudar%3F"
  })
  content_type  = "text/html"
}

resource "aws_s3_bucket" "insta" {
  bucket = var.app_domain_insta
  force_destroy = true
  acl    = "public-read"
  policy = data.aws_iam_policy_document.insta_policy.json

  website {
    index_document = "index.html"
    error_document = "error.html"
  }
}

resource "aws_s3_bucket_object" "insta_content" {
  depends_on      = [aws_s3_bucket.insta]
  bucket = var.app_domain_insta
  key    = "index.html"
  content = templatefile("${path.module}/index.tpl",
  {
    AppName   = "Instagram"
    AppURL = "https://www.instagram.com/tadeumen"
  })
  content_type  = "text/html"
}