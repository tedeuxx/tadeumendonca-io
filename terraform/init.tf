terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
  }
  cloud { 
    organization = "tadeumendonca" 
    workspaces { 
      name = "tadeumendonca-io" 
    } 
  } 
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      App = var.app_name 
    }
  }
}