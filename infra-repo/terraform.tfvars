aws_region             = "us-east-1"
project_name           = "ideavest-production"
environment            = "dev"

# Networking - 2 AZs
vpc_cidr               = "10.0.0.0/16"
public_subnet_cidrs    = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs   = ["10.0.3.0/24", "10.0.4.0/24"]
database_subnet_cidrs  = ["10.0.5.0/24", "10.0.6.0/24"]
availability_zones     = ["us-east-1a", "us-east-1b"]
allowed_ssh_cidrs      = ["0.0.0.0/0"]

# EC2 - ✅ FIX: t2.micro = 1 vCPU (fits within limit)
ami_id                 = "ami-02dfbd4ff395f2a1b"
jenkins_instance_type  = "t2.micro"   # ✅ was t3.micro (2 vCPU) — now 1 vCPU
app_instance_type      = "t2.micro"   # ✅ was t3.micro (2 vCPU) — now 1 vCPU
ssh_public_key         = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQClIt3HCc/HEsfv/wzpxuZB9JdFS0XaaNb//PxDr7fM0Psh+sow3bjsu+vp/uTqCGjPcttiAhVhpv4V9v1dhF27dbN8u07TeIEUvDkXq0K2aiA2RRrsAvD00nck/gQ7074uCCSkoYOkF+Qt7vmqZlAfvAYNtNgiRiv7RvzjWpHff3LfgEVuUdtggnogueQIRMlJ9PAGQiT/oBvdws/N7UkAxzdVMItOkCJFq2AMMLNPoclZ2kHIeiFqvMX08wDDEaja440TNt50n/208nA0FfQVS/foB2rB/5OKVXrIAFMmb0BoAHXFjur4J8rmry0mFpKK6teEDRF1l6H7dfLCqu+LaMZyiVl+L+mBzv/S9e80n8jl1sU0nAQqNh3233XIayXv7OmQgPNGgj85ZWBuTG7J8VdSUAO1uUM6Hn9Igt4ux9iBHupD/7Z45uB+SJ1XBI0JgbzoNxinef7b7hbHf/jpzDEhlEV0CFGhRZJkQ9WXB0H1c4HQnFDWjamz8Tv0dbw+JnC0ly0CGLzT0SjYYY22tUoJ6hNfhpeqRH5bCHPufyECmydYP7o9UM23KV0sX0TLZiR5IijFQmqEZ2ilgDWD5TuDl6eBKvgObpEq7qWzeNeu11YCYW0pVBJrN1+VbwVGD6uDSPopP5xB10fxTqEGJQvRYKqfZgvLpcTsSFLSUw=="
asg_desired            = 0            # ✅ FIX: set to 0 to avoid vCPU limit during testing
asg_min                = 0            # ✅ FIX: allow scale to zero
asg_max                = 1

# Database - Free Tier
db_username            = "coolad_admin"
db_password            = "CHANGE_ME_SECURE_PASSWORD"

# EKS - ✅ FIX: keep at 1.30, never go below current version
eks_cluster_version    = "1.30"
node_instance_type     = "t3.medium"  # ⚠️ EKS nodes need vCPU limit increase — see note below
node_desired_count     = 1            # ✅ FIX: reduced from 2 to save vCPUs
node_min_count         = 1
node_max_count         = 2            # ✅ FIX: reduced from 4

