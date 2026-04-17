variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "db_engine_version" {
  description = "SQL Server engine version (optional - AWS will choose default if null)"
  type        = string
  default     = null
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro" # Express edition supported
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name (SQL Server naming rules)"
  type        = string
  default     = "ideavest" # عدّل الاسم لو حابب
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_subnet_group_name" {
  description = "DB subnet group name"
  type        = string
}

variable "database_sg_id" {
  description = "Security group ID for RDS"
  type        = string
}
