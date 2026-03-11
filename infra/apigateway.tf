resource "aws_apigatewayv2_api" "main" {
  name          = "pwpass-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [var.frontend_origin]
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }

  route_settings {
    route_key              = "POST /secrets"
    throttling_burst_limit = 5
    throttling_rate_limit  = 2
  }

  route_settings {
    route_key              = "POST /secrets/{token}/view"
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      method         = "$context.httpMethod"
      path           = "$context.path"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      latency        = "$context.integrationLatency"
    })
  }

  depends_on = [
    aws_apigatewayv2_route.push,
    aws_apigatewayv2_route.view,
  ]
}

resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/aws/apigateway/pwpass-${var.environment}"
  retention_in_days = 30
}

resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# POST /secrets
resource "aws_apigatewayv2_route" "push" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /secrets"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

# GET /secrets/{token}/meta
resource "aws_apigatewayv2_route" "meta" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /secrets/{token}/meta"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

# POST /secrets/{token}/view
resource "aws_apigatewayv2_route" "view" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /secrets/{token}/view"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

# DELETE /secrets/{token}
resource "aws_apigatewayv2_route" "delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /secrets/{token}"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}
