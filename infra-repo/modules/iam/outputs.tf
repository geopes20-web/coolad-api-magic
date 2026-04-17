output "cluster_role_arn" {
  value = aws_iam_role.eks_cluster.arn
}

output "node_role_arn" {
  value = aws_iam_role.eks_nodes.arn
}

output "jenkins_instance_profile_name" {
  value = aws_iam_instance_profile.jenkins.name
}

output "jenkins_role_arn" {
  value = aws_iam_role.ec2_jenkins.arn
}

output "vpc_flow_logs_role_arn" {
  value = aws_iam_role.vpc_flow_logs.arn
}
