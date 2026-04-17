output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "ec2_sg_id" {
  value = aws_security_group.ec2_public.id
}

output "cluster_sg_id" {
  value = aws_security_group.eks_cluster.id
}

output "node_sg_id" {
  value = aws_security_group.eks_nodes.id
}

output "database_sg_id" {
  value = aws_security_group.database.id
}
