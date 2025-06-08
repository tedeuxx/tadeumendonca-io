############################
# VPC
############################
variable "vpc_name" {
  description = "VPC Name"
  type        = string
  default     = "customer-vpc"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_private_subnets" {
  description = "VPC Private Subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "vpc_public_subnets" {
  description = "VPC Public Subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}
############################
# Customer Resource Tags
############################
variable "customer_workload_name" {
  description = "AWS Resource Tag - Workload Name"
  type        = string
  nullable    = false
}

variable "customer_workload_owner" {
  description = "AWS Resource Tag - Workload Owner"
  type        = string
  nullable    = false
}

variable "customer_workload_sponsor" {
  description = "AWS Resource Tag - Workload Sponsor"
  type        = string
  nullable    = false
}

variable "customer_workload_environment" {
  description = "AWS Resource Tag - Workload Environment"
  type        = string
  nullable    = false
  validation {
    condition     = contains(["main"], var.customer_workload_environment)
    error_message = "valid environments are: main"
  }
}