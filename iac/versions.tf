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
  # CI selects the workspace via TF_WORKSPACE=tadeumendonca-pwa-{staging|production}.
  # Split from tadeumendonca-iac (shared infra): this workspace owns the APP infra (DynamoDB, Lambda,
  # API GW, CloudFront, buckets, app IAM/OIDC roles); shared infra (Cognito/auth, SES, WAF regional)
  # stays in tadeumendonca-iac and is read here via the SSM config bus (ssm-shared.tf). Acyclic.
  cloud {
    organization = "tadeumendonca-io"
    workspaces {
      tags = ["tadeumendonca-pwa"]
    }
  }
}
