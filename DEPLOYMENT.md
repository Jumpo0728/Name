# Production Deployment Guide

## Table of Contents

- [Deployment Architecture](#deployment-architecture)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Docker Build and Deployment](#docker-build-and-deployment)
- [AWS Deployment](#aws-deployment)
- [Alternative Platforms](#alternative-platforms)
- [Database Setup](#database-setup)
- [SSL/TLS Certificates](#ssltls-certificates)
- [Environment Configuration](#environment-configuration)
- [Running Migrations](#running-migrations)
- [Health Checks & Monitoring](#health-checks--monitoring)
- [Backup & Recovery](#backup--recovery)
- [Scaling Considerations](#scaling-considerations)
- [CI/CD Pipeline Setup](#cicd-pipeline-setup)
- [Rollback Procedures](#rollback-procedures)
- [Post-Deployment Checklist](#post-deployment-checklist)

## Deployment Architecture

```
+-------------+    HTTPS     +--------------------+
|  End Users  | -----------> |  ALB / API Gateway |
+-------------+              +---------+----------+
                                      |
                                      v
                          +---------------------+
                          |  ECS / EC2 (API)    |
                          +-----+--------+------+
                                |        |
                                v        v
                      +------------+  +---------+
                      | PostgreSQL |  |  Redis  |
                      +------------+  +---------+
```

## Prerequisites

- Docker & Docker Compose
- AWS account (for AWS deployment)
- Domain name with DNS access
- GitHub repository

## Environment Variables

See `.env.example` for the full list. Required production values:

- `NODE_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `LOG_LEVEL=info`

## Docker Build and Deployment

### Manual Docker Commands

```bash
docker build -t syncnote-api:latest .

docker run -d \
  --name syncnote-api \
  -p 4000:4000 \
  --env-file .env.production \
  syncnote-api:latest
```

### Deployment Script

```bash
bash scripts/deploy.sh .env.production syncnote-api:latest
```

## AWS Deployment

### EC2 + RDS + ElastiCache + ALB

1. **EC2**: Provision an EC2 instance with Docker installed.
2. **RDS**: Create a PostgreSQL instance and configure security groups.
3. **ElastiCache**: Create a Redis cluster.
4. **ALB**: Configure HTTPS listener and target group for the API.
5. **Deploy**: Pull container image and run `docker run`.

### Example

```bash
ssh ec2-user@<ec2-host>
docker pull ghcr.io/syncnote/api:latest
docker run -d --restart=always \
  -p 4000:4000 \
  --env-file /etc/syncnote/.env \
  ghcr.io/syncnote/api:latest
```

## Alternative Platforms

### Heroku

```bash
heroku create syncnote-api
heroku addons:create heroku-postgresql
heroku addons:create heroku-redis
heroku config:set NODE_ENV=production
heroku container:push web
heroku container:release web
```

### DigitalOcean App Platform

- Connect GitHub repository
- Set environment variables
- Enable automatic deploys
- Provision managed PostgreSQL and Redis

### Azure App Service

- Create App Service for Node.js
- Configure environment variables in Azure portal
- Use Azure Database for PostgreSQL and Azure Cache for Redis

## Database Setup

- Create database and user
- Apply migrations: `npm run db:migrate`
- Seed data if required: `npm run db:seed`

## SSL/TLS Certificates

- Use AWS Certificate Manager (ACM) with ALB
- For self-managed servers, use Certbot:
  ```bash
  sudo certbot --nginx -d api.syncnote.example.com
  ```

## Environment Configuration

- Maintain `.env.production` and `.env.staging` files
- Use separate Redis DB indexes for staging
- Enable stricter CORS rules in production

## Running Migrations

```bash
NODE_ENV=production npm run db:migrate
```

## Health Checks & Monitoring

- `/health` endpoint for uptime monitoring
- `/metrics` endpoint for Prometheus
- Configure alerts in Grafana

## Backup & Recovery

- Automated RDS snapshots daily
- Store backups in S3 with lifecycle policies
- Test restores monthly

## Scaling Considerations

- Horizontal scaling via multiple API instances
- Sticky sessions for WebSocket if needed
- Use Redis for distributed presence

## CI/CD Pipeline Setup

- GitHub Actions builds, tests, and deploys
- Use environment protection rules
- Store secrets in GitHub Actions secrets

## Rollback Procedures

1. Revert to previous container image tag
2. Redeploy via CI/CD
3. Verify health checks and metrics

## Post-Deployment Checklist

- [ ] Health check passes
- [ ] WebSocket connections succeed
- [ ] Database migrations applied
- [ ] Metrics scraping enabled
- [ ] Alerts configured
- [ ] Backup jobs verified
