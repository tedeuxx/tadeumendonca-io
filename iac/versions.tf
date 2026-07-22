terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Terraform Cloud holds state + locks; execution mode is Local (GitHub Actions runs plan/apply).
  # The cloud{} block is parsed before variables resolve, so org/tags are literal here.
  # CI selects the workspace via TF_WORKSPACE=tadeumendonca-pwa-staging.
  # DO NOT RENAME the workspace name or the tag below to match the current repo name. They identify the
  # LIVE Terraform Cloud workspace holding real state; renaming points Terraform at an empty workspace,
  # which plans a full recreate of the live site infra. The `-pwa-` string is deliberate history.
  # This workspace owns everything the static site needs: S3 buckets, CloudFront + the URL-rewrite
  # function, the iCloud email records, and the GitHub OIDC deploy roles. There is no backend.
  cloud {
    organization = "tadeumendonca-io"
    workspaces {
      tags = ["tadeumendonca-pwa"]
    }
  }
}
