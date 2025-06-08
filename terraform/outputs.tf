output "aws_vpc_id" {
  description = "AWS VPC ID"
  value       = local.aws_vpc_id
}

output "aws_region" {
  description = "AWS Region Name"
  value       = local.aws_region
}

output "aws_account_id" {
  description = "AWS Account ID"
  value       = local.aws_account_id
}

output "aws_availability_zones" {
  description = "AWS Region Availability Zone Names"
  value       = local.aws_availability_zones
}