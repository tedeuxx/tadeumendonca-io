terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
  }
  backend "remote" {
    hostname     = "app.terraform.io"
    organization = "tadeumendonca" 
    workspaces { 
      name = "tadeumendonca-io" 
    } 
  } 
}