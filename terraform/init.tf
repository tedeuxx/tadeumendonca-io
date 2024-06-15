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
  }
}

# Configure the AWS Provider
provider "aws" {
  default_tags {
    tags = {
      App = var.app_name 
    }
  }
}