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
  # CI selects the workspace via TF_WORKSPACE=tadeumendonca-io. One workspace, one environment —
  # there is no tier suffix because there is no second tier.
  # These identifiers resolve to LIVE state (52 resources). Changing the name or tag here WITHOUT
  # renaming the workspace in Terraform Cloud first points Terraform at a new, empty workspace, and
  # `plan` then proposes recreating the whole site. Rename in TFC and here in the same window.
  # This workspace owns everything the static site needs: S3 buckets, CloudFront + the URL-rewrite
  # function, the iCloud email records, and the GitHub OIDC deploy roles. There is no backend.
  cloud {
    organization = "tadeumendonca-io"
    workspaces {
      tags = ["tadeumendonca-io"]
    }
  }
}
