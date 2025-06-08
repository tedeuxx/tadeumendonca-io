############################
# VPC
############################
module "vpc" {
  #checkov:skip=CKV_TF_1:References Terraform Registry Version
  source                 = "terraform-aws-modules/vpc/aws"
  version                = "5.19.0"
  name                   = var.vpc_name
  cidr                   = var.vpc_cidr
  azs                    = data.aws_availability_zones.azs.names
  private_subnets        = var.vpc_private_subnets
  public_subnets         = var.vpc_public_subnets
  enable_nat_gateway     = true
  single_nat_gateway     = true
  one_nat_gateway_per_az = false
}
