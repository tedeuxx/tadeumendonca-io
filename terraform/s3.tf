#data "template_file" "root" {
#  template = file("templates/bucket-policy.tpl")
#  vars = {
#    bucket_name = var.app_domain_root,
#    origin_access_id =  aws_cloudfront_origin_access_identity.oai.id
#  }
#}

data "template_file" "profile" {
  template = file("templates/bucket-policy.tpl")
  vars = {
    bucket_name = var.app_domain_profile,
    origin_access_id =  aws_cloudfront_origin_access_identity.oai.id
  }
}

data "template_file" "wpp" {
  template = file("templates/bucket-policy.tpl")
  vars = {
    bucket_name = var.app_domain_wpp,
    origin_access_id =  aws_cloudfront_origin_access_identity.oai.id
  }
}

data "template_file" "insta" {
  template = file("templates/bucket-policy.tpl")
  vars = {
    bucket_name = var.app_domain_insta,
    origin_access_id =  aws_cloudfront_origin_access_identity.oai.id
  }
}

#resource "aws_s3_bucket" "root" {
#  bucket = var.app_domain_root
#  force_destroy = true
#  acl    = "public-read"
#  policy = data.template_file.root.rendered
#
#  website {
#    index_document = "index.html"
#    error_document = "error.html"
#  }
#  tags = {
#      App         = var.app_name
#      Environment = var.app_env
#  }
#}

#resource "aws_s3_bucket_object" "root_content" {
#  depends_on      = [aws_s3_bucket.root]
#  for_each = fileset("../src/root", "**/*")
#  bucket = var.app_domain_root
#  key    = each.value
#  source = "../src/root/${each.value}"
#  etag   = filemd5("../src/root/${each.value}")
#  content_type  = lookup(local.content_type_map, regex("\\.(?P<extension>[A-Za-z0-9]+)$", each.value).extension, "application/octet-stream")
#  tags = {
#      App         = var.app_name
#      Environment = var.app_env
#  }
#}

resource "aws_s3_bucket" "profile" {
  bucket = var.app_domain_profile
  force_destroy = true
  acl    = "public-read"
  policy = data.template_file.profile.rendered

  website {
    index_document = "index.html"
    error_document = "error.html"
  }
}

resource "aws_s3_bucket_object" "profile_content" {
  depends_on      = [aws_s3_bucket.profile]
  bucket = var.app_domain_profile
  key    = "index.html"
  content = templatefile("${path.module}/../src/index.tpl",
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
  policy = data.template_file.wpp.rendered

  website {
    index_document = "index.html"
    error_document = "error.html"
  }
}

resource "aws_s3_bucket_object" "wpp_content" {
  depends_on      = [aws_s3_bucket.wpp]
  for_each = fileset("../src/wpp", "**/*")
  bucket = var.app_domain_wpp
  key    = each.value
  source = "../src/wpp/${each.value}"
  etag   = filemd5("../src/wpp/${each.value}")
  content_type  = lookup(local.content_type_map, regex("\\.(?P<extension>[A-Za-z0-9]+)$", each.value).extension, "application/octet-stream")
}

resource "aws_s3_bucket" "insta" {
  bucket = var.app_domain_insta
  force_destroy = true
  acl    = "public-read"
  policy = data.template_file.insta.rendered

  website {
    index_document = "index.html"
    error_document = "error.html"
  }
}

resource "aws_s3_bucket_object" "insta_content" {
  depends_on      = [aws_s3_bucket.insta]
  for_each = fileset("../src/insta", "**/*")
  bucket = var.app_domain_insta
  key    = each.value
  source = "../src/insta/${each.value}"
  etag   = filemd5("../src/insta/${each.value}")
  content_type  = lookup(local.content_type_map, regex("\\.(?P<extension>[A-Za-z0-9]+)$", each.value).extension, "application/octet-stream")
}