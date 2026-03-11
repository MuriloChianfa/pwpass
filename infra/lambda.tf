resource "aws_lambda_function" "api" {
  function_name = "pwpass-api-${var.environment}"
  role          = aws_iam_role.api_lambda.arn
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["arm64"]
  timeout       = 10
  memory_size   = 128

  filename         = "${path.module}/../backend/dist/api.zip"
  source_code_hash = filebase64sha256("${path.module}/../backend/dist/api.zip")

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.secrets.name
      KMS_KEY_ID = aws_kms_key.secrets.id
    }
  }
}

resource "aws_lambda_function" "cleanup" {
  function_name = "pwpass-cleanup-${var.environment}"
  role          = aws_iam_role.cleanup_lambda.arn
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["arm64"]
  timeout       = 60
  memory_size   = 128

  filename         = "${path.module}/../backend/dist/cleanup.zip"
  source_code_hash = filebase64sha256("${path.module}/../backend/dist/cleanup.zip")

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.secrets.name
    }
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cleanup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cleanup.arn
}
