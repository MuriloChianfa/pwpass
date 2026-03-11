# PWPass

Generate secure passwords and share them securely.

## Architecture

```mermaid
flowchart TD
    U[User Browser] --> FE["React SPA"]
    FE -->|"POST /secrets"| APIGW[API Gateway HTTP API v2]
    FE -->|"GET /secrets/{token}/meta"| APIGW
    FE -->|"POST /secrets/{token}/view"| APIGW
    FE -->|"DELETE /secrets/{token}"| APIGW

    APIGW --> API[Lambda API - Go]
    API -->|encrypt/decrypt| KMS[KMS Key]
    API -->|read/write| DDB[("DynamoDB")]

    EB["EventBridge Rule<br>(every 1 hour)"] --> CLEAN[Lambda cleanup - Go]
    CLEAN -->|scan + delete expired| DDB
```

## Deploying

### Prerequisites

- AWS account with an S3 bucket for Terraform state
- Required secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `TF_STATE_BUCKET`
