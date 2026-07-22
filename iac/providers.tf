# Default provider (var.aws_region) + us_east_1 alias for CloudFront and its ACM cert (both must
# live in us-east-1). Tags applied once via default_tags on BOTH providers — never per resource.
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = local.tags
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = local.tags
  }
}
