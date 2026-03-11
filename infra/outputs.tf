output "api_url" {
  description = "Base URL for the pwpass API"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "dynamodb_table" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.secrets.name
}

output "kms_key_id" {
  description = "KMS key ID used for secret encryption"
  value       = aws_kms_key.secrets.id
}
