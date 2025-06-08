# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      customer_workload_name        = var.customer_workload_name
      customer_workload_owner       = var.customer_workload_owner
      customer_workload_sponsor     = var.customer_workload_sponsor
      customer_workload_environment = var.customer_workload_environment
    }
  }
}