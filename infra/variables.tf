variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "frontend_origin" {
  description = "Origin allowed for CORS (the frontend URL)"
  type        = string
  default     = "https://pwpass.namedzeus.com"
}

variable "table_name" {
  type    = string
  default = "pwpass-secrets"
}
