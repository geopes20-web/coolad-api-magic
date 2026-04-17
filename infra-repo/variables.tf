variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "ideavest-production"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ============================================
# Networking
# ============================================
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (2 AZs)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs (2 AZs)"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "database_subnet_cidrs" {
  description = "Database subnet CIDRs (2 AZs)"
  type        = list(string)
  default     = ["10.0.5.0/24", "10.0.6.0/24"]
}

variable "availability_zones" {
  description = "Availability zones (2 AZs)"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ============================================
# EC2 / Compute
# ============================================
variable "ami_id" {
  description = "AMI ID for EC2 (Amazon Linux 2)"
  type        = string
  default     = "ami-02dfbd4ff395f2a1b" # Amazon Linux 2 us-east-1
}

variable "jenkins_instance_type" {
  description = "Jenkins EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "app_instance_type" {
  description = "App EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 access"
  type        = string
}

variable "asg_desired" {
  description = "ASG desired capacity"
  type        = number
  default     = 1
}

variable "asg_min" {
  description = "ASG minimum size"
  type        = number
  default     = 1
}

variable "asg_max" {
  description = "ASG maximum size"
  type        = number
  default     = 2
}

# ============================================
# Database
# ============================================
variable "db_username" {
  description = "RDS master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

# ============================================
# EKS
# ============================================
variable "eks_cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_instance_type" {
  description = "EKS node instance type"
  type        = string
  default     = "t3.medium"
}

variable "node_desired_count" {
  description = "Desired EKS nodes"
  type        = number
  default     = 2
}

variable "node_min_count" {
  description = "Min EKS nodes"
  type        = number
  default     = 1
}

variable "node_max_count" {
  description = "Max EKS nodes"
  type        = number
  default     = 2
}
