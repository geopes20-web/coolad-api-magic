output "jenkins_public_ip" {
  value = aws_instance.jenkins.public_ip
}

output "jenkins_instance_id" {
  value = aws_instance.jenkins.id
}

output "asg_name" {
  value = aws_autoscaling_group.app.name
}

output "launch_template_id" {
  value = aws_launch_template.app.id
}
