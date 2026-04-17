variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "ami_id" {
  type = string
}

variable "jenkins_instance_type" {
  type    = string
  default = "t2.micro"
}

variable "app_instance_type" {
  type    = string
  default = "t2.micro"
}

variable "ssh_public_key" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "ec2_sg_id" {
  type = string
}

variable "jenkins_instance_profile_name" {
  description = "IAM instance profile for Jenkins EC2"
  type        = string
}

variable "target_group_arn" {
  type = string
}

variable "asg_desired" {
  type    = number
  default = 1
}

variable "asg_min" {
  type    = number
  default = 1
}

variable "asg_max" {
  type    = number
  default = 2
}
