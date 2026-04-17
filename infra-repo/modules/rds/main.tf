resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-db"

  engine         = "sqlserver-ex"
  engine_version = var.db_engine_version

  instance_class = var.db_instance_class

  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  port = 1433

  username = var.db_username
  password = var.db_password

  license_model = "license-included"

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.database_sg_id]

  multi_az            = false
  publicly_accessible = false

  skip_final_snapshot = true

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled = true

  # 🔥 مهم جداً لتفادي مشاكل provisioning
  auto_minor_version_upgrade = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-db"
    Environment = var.environment
  }
}
