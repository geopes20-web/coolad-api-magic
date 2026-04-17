terraform {
  backend "s3" {
    bucket         = "s3-ideavest"
    key            = "eks/terraform.tfstate"
    region         = "us-east-1"

    dynamodb_table = "terraform-lock"
    encrypt        = true
  }
}
