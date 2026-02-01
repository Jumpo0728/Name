# Infrastructure & Operations

## Table of Contents

- [Infrastructure as Code](#infrastructure-as-code)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Logging](#monitoring-and-logging)
- [Alerting](#alerting)
- [Backup and Disaster Recovery](#backup-and-disaster-recovery)
- [Security Operations](#security-operations)

## Infrastructure as Code

### Docker Compose (Local)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: syncnote_user
      POSTGRES_PASSWORD: local-password
      POSTGRES_DB: syncnote
    ports:
      - "5432:5432"
  redis:
    image: redis:6
    ports:
      - "6379:6379"
```

### Docker (Production)

- Multi-stage build for API
- Frontend served via CDN or static hosting

### Kubernetes (Optional)

- `Deployment` for API pods
- `Service` for internal networking
- `Ingress` for TLS termination

## CI/CD Pipeline

- **GitHub Actions** for build/test/deploy
- **Steps**:
  1. Install dependencies
  2. Run lint + tests
  3. Build Docker image
  4. Push to registry
  5. Deploy to environment

## Monitoring and Logging

- **Application Logs**: Winston JSON format
- **Log aggregation**: ELK or CloudWatch
- **Metrics**: Prometheus + Grafana dashboards

Example log format:

```json
{
  "timestamp": "2024-01-01T10:00:00Z",
  "level": "info",
  "message": "Note created",
  "context": {"noteId": "note_123"}
}
```

## Alerting

- Latency threshold alerts (p95 > 300ms)
- Error rate alerts (> 2%)
- Redis or Postgres down notifications

## Backup and Disaster Recovery

- Daily Postgres snapshots
- Weekly full exports
- RTO: 2 hours
- RPO: 15 minutes
- Quarterly recovery drills

## Security Operations

- Secrets stored in AWS Secrets Manager
- Rotate JWT secrets quarterly
- Restrict DB access to VPC
- Enable audit logging on PostgreSQL
