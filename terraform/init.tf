terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    bucket      = "tadeumen-terraform-backend"
    key         = "tadeumendonca-terraform-backend"
    region      = "us-east-1"
    profile     = "personal"
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
}