output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name - access your app here"
  value       = module.alb.alb_dns_name
}

output "jenkins_public_ip" {
  description = "Jenkins server public IP"
  value       = module.ec2.jenkins_public_ip
}

output "jenkins_url" {
  description = "Jenkins web UI URL"
  value       = "http://${module.ec2.jenkins_public_ip}:8080"
}

output "db_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_certificate
  sensitive   = true
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}
