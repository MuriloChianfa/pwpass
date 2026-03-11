resource "aws_cloudwatch_event_rule" "cleanup" {
  name                = "pwpass-cleanup-${var.environment}"
  description         = "Trigger pwpass cleanup Lambda every hour"
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "cleanup" {
  rule = aws_cloudwatch_event_rule.cleanup.name
  arn  = aws_lambda_function.cleanup.arn
}
