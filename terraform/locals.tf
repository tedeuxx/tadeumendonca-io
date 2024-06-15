# Data source to get the current AWS region
data "aws_region" "current" {}

# Data source to get the current AWS account ID
data "aws_caller_identity" "current" {}

# Local variables
locals {
  aws_region  = data.aws_region.current.name
  aws_account_id = data.aws_caller_identity.current.account_id
}