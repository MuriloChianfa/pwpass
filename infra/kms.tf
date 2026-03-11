resource "aws_kms_key" "secrets" {
  description             = "Encrypt pwpass secret content at rest"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/pwpass-secrets-${var.environment}"
  target_key_id = aws_kms_key.secrets.key_id
}
