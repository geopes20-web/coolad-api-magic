# ============================================
# Root Module - Clean Architecture (2 AZs)
# ============================================

# ============================================
# Networking
# ============================================
module "vpc" {
  source = "./modules/vpc"

  project_name          = var.project_name
  environment           = var.environment
  vpc_cidr              = var.vpc_cidr
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
  availability_zones    = var.availability_zones
}

# ============================================
# IAM
# ============================================
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
}

# ============================================
# Security Groups
# ============================================
module "security_groups" {
  source = "./modules/security-groups"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  vpc_cidr          = module.vpc.vpc_cidr
  allowed_ssh_cidrs = var.allowed_ssh_cidrs
}

# ============================================
# ALB
# ============================================
module "alb" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  alb_sg_id         = module.security_groups.alb_sg_id
}

# ============================================
# EC2 + Jenkins + ASG
# ============================================
module "ec2" {
  source = "./modules/ec2"

  project_name                  = var.project_name
  environment                   = var.environment
  ami_id                        = var.ami_id
  jenkins_instance_type         = var.jenkins_instance_type
  app_instance_type             = var.app_instance_type
  ssh_public_key                = var.ssh_public_key
  public_subnet_ids             = module.vpc.public_subnet_ids
  ec2_sg_id                     = module.security_groups.ec2_sg_id
  jenkins_instance_profile_name = module.iam.jenkins_instance_profile_name
  target_group_arn              = module.alb.target_group_arn
  asg_desired                   = var.asg_desired
  asg_min                       = var.asg_min
  asg_max                       = var.asg_max
}

# ============================================
# RDS (Private Subnet)
# ============================================
module "rds" {
  source = "./modules/rds"

  project_name         = var.project_name
  environment          = var.environment
  db_username          = var.db_username
  db_password          = var.db_password
  db_subnet_group_name = module.vpc.db_subnet_group_name
  database_sg_id       = module.security_groups.database_sg_id
}

# ============================================
# EKS
# ============================================
module "eks" {
  source = "./modules/eks"

  project_name        = var.project_name
  environment         = var.environment
  eks_cluster_version = var.eks_cluster_version
  subnet_ids          = module.vpc.private_subnet_ids
  cluster_sg_id       = module.security_groups.cluster_sg_id
  node_sg_id          = module.security_groups.node_sg_id
  cluster_role_arn    = module.iam.cluster_role_arn
  node_role_arn       = module.iam.node_role_arn
  node_instance_type  = var.node_instance_type
  node_desired_count  = var.node_desired_count
  node_min_count      = var.node_min_count
  node_max_count      = var.node_max_count
}
