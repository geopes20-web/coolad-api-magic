# ============================================
# EKS Cluster
# ============================================

resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-${var.environment}-cluster"
  version  = var.eks_cluster_version
  role_arn = var.cluster_role_arn

  vpc_config {
    subnet_ids              = var.subnet_ids
    security_group_ids      = [var.cluster_sg_id]

    endpoint_private_access = true
    endpoint_public_access  = true
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster"
    Environment = var.environment
  }
}

# ============================================
# EKS Node Group (AWS Managed AMI - FIXED)
# ============================================

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-${var.environment}-nodes"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.subnet_ids

  instance_types = [var.node_instance_type]
  capacity_type   = "ON_DEMAND"

  # 🔥 IMPORTANT: let AWS choose compatible AMI automatically
  ami_type = "AL2_x86_64"

  scaling_config {
    desired_size = var.node_desired_count
    min_size     = var.node_min_count
    max_size     = var.node_max_count
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    environment = var.environment
    project     = var.project_name
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-node-group"
    Environment = var.environment
  }

  depends_on = [aws_eks_cluster.main]
}
