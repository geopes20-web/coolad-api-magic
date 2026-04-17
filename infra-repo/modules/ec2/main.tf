# ============================================
# EC2 Module - Jenkins + App ASG (FULLY FIXED)
# ============================================

resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = var.ssh_public_key
  tags = {
    Name = "${var.project_name}-${var.environment}-key"
  }
}

# ============================================
# Jenkins EC2
# ============================================
resource "aws_instance" "jenkins" {
  ami                         = var.ami_id
  instance_type               = var.jenkins_instance_type  # ✅ FIX: was hardcoded t3.small
  key_name                    = aws_key_pair.main.key_name
  subnet_id                   = var.public_subnet_ids[0]
  vpc_security_group_ids      = [var.ec2_sg_id]
  iam_instance_profile        = var.jenkins_instance_profile_name
  associate_public_ip_address = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install docker -y
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user
    docker run -d \
      --name jenkins \
      --restart=always \
      -p 8080:8080 \
      jenkins/jenkins:lts
  EOF

  tags = {
    Name = "${var.project_name}-${var.environment}-jenkins"
    Role = "jenkins"
  }
}

# ============================================
# App Launch Template
# ============================================
resource "aws_launch_template" "app" {
  name_prefix            = "${var.project_name}-${var.environment}-app-"
  image_id               = var.ami_id
  instance_type          = var.app_instance_type  # ✅ FIX: was hardcoded t3.micro
  key_name               = aws_key_pair.main.key_name
  vpc_security_group_ids = [var.ec2_sg_id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
  EOF
  )

  tags = {
    Name = "${var.project_name}-${var.environment}-app-lt"
  }
}

# ============================================
# Auto Scaling Group
# ============================================
resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-${var.environment}-app-asg"
  desired_capacity    = var.asg_desired  # ✅ FIX: was hardcoded 1
  min_size            = var.asg_min      # ✅ FIX: was hardcoded 0
  max_size            = var.asg_max      # ✅ FIX: was hardcoded 1
  vpc_zone_identifier = var.public_subnet_ids

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-app"
    propagate_at_launch = true
  }
}
