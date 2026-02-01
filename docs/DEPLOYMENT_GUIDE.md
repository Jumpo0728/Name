# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the collaborative note-taking application to various environments.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [AWS Production Deployment](#aws-production-deployment)
4. [Heroku Deployment (Alternative)](#heroku-deployment-alternative)
5. [DigitalOcean Deployment (Alternative)](#digitalocean-deployment-alternative)
6. [Environment Variables](#environment-variables)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring Setup](#monitoring-setup)
9. [Backup Strategy](#backup-strategy)
10. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 7+
- Docker (optional, recommended)

### Option 1: Manual Setup

**1. Clone Repository:**
```bash
git clone https://github.com/yourorg/notesapp.git
cd notesapp
```

**2. Install Dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**3. Setup PostgreSQL:**
```bash
# Create database
createdb notesapp

# Run migrations
cd backend
npm run migrate up
```

**4. Setup Redis:**
```bash
# Start Redis server
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:7-alpine
```

**5. Configure Environment Variables:**
```bash
# backend/.env
cp .env.example .env
# Edit .env with your local configuration
```

**6. Start Development Servers:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**7. Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api-docs

### Option 2: Docker Compose (Recommended)

**1. Clone Repository:**
```bash
git clone https://github.com/yourorg/notesapp.git
cd notesapp
```

**2. Start All Services:**
```bash
docker-compose up -d
```

**3. Run Migrations:**
```bash
docker-compose exec backend npm run migrate up
```

**4. Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

**5. View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

**6. Stop Services:**
```bash
docker-compose down

# Stop and remove volumes (data loss!)
docker-compose down -v
```

---

## Docker Deployment

### Build Images

**1. Build Backend Image:**
```bash
cd backend
docker build -t notesapp-backend:latest .
```

**2. Build Frontend Image:**
```bash
cd frontend
docker build -t notesapp-frontend:latest .
```

### Push to Registry

**Option A: Docker Hub**
```bash
# Tag images
docker tag notesapp-backend:latest yourusername/notesapp-backend:latest
docker tag notesapp-frontend:latest yourusername/notesapp-frontend:latest

# Push images
docker push yourusername/notesapp-backend:latest
docker push yourusername/notesapp-frontend:latest
```

**Option B: AWS ECR**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name notesapp-backend
aws ecr create-repository --repository-name notesapp-frontend

# Tag images
docker tag notesapp-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/notesapp-backend:latest
docker tag notesapp-frontend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/notesapp-frontend:latest

# Push images
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/notesapp-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/notesapp-frontend:latest
```

---

## AWS Production Deployment

### Architecture Overview

```
CloudFront (CDN) → S3 (Frontend)
Route 53 (DNS) → ALB → EC2 Auto Scaling Group → RDS + ElastiCache
```

### Step 1: Setup VPC and Networking

**1. Create VPC:**
```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=notesapp-vpc}]'
```

**2. Create Subnets:**
```bash
# Public subnet (ALB, NAT Gateway)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a

# Private subnet (EC2, RDS)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.3.0/24 --availability-zone us-east-1b
```

**3. Create Internet Gateway:**
```bash
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --vpc-id vpc-xxx --internet-gateway-id igw-xxx
```

**4. Configure Route Tables:**
```bash
# Public route table
aws ec2 create-route-table --vpc-id vpc-xxx
aws ec2 create-route --route-table-id rtb-xxx --destination-cidr-block 0.0.0.0/0 --gateway-id igw-xxx
```

### Step 2: Setup RDS (PostgreSQL)

**1. Create DB Subnet Group:**
```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name notesapp-db-subnet \
  --db-subnet-group-description "NotesApp DB Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy
```

**2. Create Security Group:**
```bash
aws ec2 create-security-group \
  --group-name notesapp-db-sg \
  --description "Security group for NotesApp RDS" \
  --vpc-id vpc-xxx

# Allow PostgreSQL from backend security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-backend-xxx
```

**3. Create RDS Instance:**
```bash
aws rds create-db-instance \
  --db-instance-identifier notesapp-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 14.7 \
  --master-username postgres \
  --master-user-password SecurePassword123! \
  --allocated-storage 20 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name notesapp-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false
```

**4. Create Read Replica (Optional):**
```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier notesapp-db-replica \
  --source-db-instance-identifier notesapp-db \
  --db-instance-class db.t3.small
```

### Step 3: Setup ElastiCache (Redis)

**1. Create Cache Subnet Group:**
```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name notesapp-cache-subnet \
  --cache-subnet-group-description "NotesApp Cache Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy
```

**2. Create Security Group:**
```bash
aws ec2 create-security-group \
  --group-name notesapp-redis-sg \
  --description "Security group for NotesApp Redis" \
  --vpc-id vpc-xxx

# Allow Redis from backend security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 6379 \
  --source-group sg-backend-xxx
```

**3. Create ElastiCache Cluster:**
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id notesapp-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name notesapp-cache-subnet \
  --security-group-ids sg-xxx \
  --snapshot-retention-limit 5 \
  --snapshot-window "03:00-05:00"
```

### Step 4: Setup EC2 Auto Scaling

**1. Create Launch Template:**
```bash
aws ec2 create-launch-template \
  --launch-template-name notesapp-backend \
  --version-description "NotesApp Backend v1" \
  --launch-template-data '{
    "ImageId": "ami-0c55b159cbfafe1f0",
    "InstanceType": "t3.medium",
    "KeyName": "notesapp-key",
    "SecurityGroupIds": ["sg-backend-xxx"],
    "UserData": "IyEvYmluL2Jhc2gKY3VybCAtZlNTTCBodHRwczovL2dldC5kb2NrZXIuY29tIC1vIGdldC1kb2NrZXIuc2gKc2ggZ2V0LWRvY2tlci5zaAp...",
    "IamInstanceProfile": {
      "Name": "notesapp-ec2-role"
    }
  }'
```

**User Data Script (Base64 encoded):**
```bash
#!/bin/bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Pull and run backend container
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker pull 123456789.dkr.ecr.us-east-1.amazonaws.com/notesapp-backend:latest
docker run -d \
  -p 4000:4000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e REDIS_URL=$REDIS_URL \
  -e JWT_SECRET=$JWT_SECRET \
  123456789.dkr.ecr.us-east-1.amazonaws.com/notesapp-backend:latest
```

**2. Create Auto Scaling Group:**
```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name notesapp-asg \
  --launch-template LaunchTemplateName=notesapp-backend \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3 \
  --vpc-zone-identifier "subnet-xxx,subnet-yyy" \
  --target-group-arns arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/notesapp-tg/xxx \
  --health-check-type ELB \
  --health-check-grace-period 300
```

**3. Create Scaling Policies:**
```bash
# Scale up policy
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name notesapp-asg \
  --policy-name scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 70.0
  }'
```

### Step 5: Setup Application Load Balancer

**1. Create ALB:**
```bash
aws elbv2 create-load-balancer \
  --name notesapp-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-alb-xxx \
  --scheme internet-facing \
  --type application
```

**2. Create Target Group:**
```bash
aws elbv2 create-target-group \
  --name notesapp-tg \
  --protocol HTTP \
  --port 4000 \
  --vpc-id vpc-xxx \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --stickiness-enabled \
  --stickiness-type lb_cookie \
  --stickiness-lb-cookie-duration 86400
```

**3. Create Listener:**
```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:xxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:xxx:certificate/xxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:xxx
```

**4. Redirect HTTP to HTTPS:**
```bash
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:xxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
```

### Step 6: Setup S3 + CloudFront (Frontend)

**1. Create S3 Bucket:**
```bash
aws s3 mb s3://notesapp-frontend
aws s3 website s3://notesapp-frontend --index-document index.html --error-document index.html
```

**2. Upload Frontend Build:**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://notesapp-frontend --delete
```

**3. Create CloudFront Distribution:**
```bash
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "notesapp-'$(date +%s)'",
  "Comment": "NotesApp Frontend",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-notesapp-frontend",
      "DomainName": "notesapp-frontend.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-notesapp-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }
}'
```

### Step 7: Setup Route 53

**1. Create Hosted Zone:**
```bash
aws route53 create-hosted-zone --name notesapp.com --caller-reference $(date +%s)
```

**2. Create DNS Records:**
```bash
# Frontend (CloudFront)
aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "app.notesapp.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d123456.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}'

# Backend (ALB)
aws route53 change-resource-record-sets --hosted-zone-id Z123456 --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.notesapp.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "notesapp-alb-123456.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }]
}'
```

### Step 8: Setup Secrets Manager

**1. Store Secrets:**
```bash
aws secretsmanager create-secret \
  --name notesapp/prod/database \
  --secret-string '{"username":"postgres","password":"SecurePassword123!","host":"notesapp-db.xxx.us-east-1.rds.amazonaws.com","port":5432,"database":"notesapp"}'

aws secretsmanager create-secret \
  --name notesapp/prod/jwt \
  --secret-string '{"secret":"random-256-bit-secret-key-here"}'
```

**2. Grant EC2 IAM Role Access:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "secretsmanager:GetSecretValue"
    ],
    "Resource": [
      "arn:aws:secretsmanager:us-east-1:xxx:secret:notesapp/prod/*"
    ]
  }]
}
```

---

## Heroku Deployment (Alternative)

### Prerequisites

- Heroku CLI installed
- Git repository

### Steps

**1. Create Heroku App:**
```bash
heroku create notesapp-prod
```

**2. Add PostgreSQL and Redis:**
```bash
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
```

**3. Set Environment Variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set FRONTEND_URL=https://notesapp-prod.herokuapp.com
```

**4. Deploy Backend:**
```bash
cd backend
git push heroku main
```

**5. Run Migrations:**
```bash
heroku run npm run migrate up
```

**6. Deploy Frontend (Separate App):**
```bash
heroku create notesapp-frontend
cd frontend
echo '{ "buildpacks": [{ "url": "heroku/nodejs" }] }' > app.json
git push heroku main
```

**7. Scale Dynos:**
```bash
# Production (recommended)
heroku ps:scale web=2:standard-1x

# Free tier (1 dyno, sleeps after 30 min)
heroku ps:scale web=1:free
```

---

## DigitalOcean Deployment (Alternative)

### Steps

**1. Create Droplet:**
```bash
doctl compute droplet create notesapp \
  --size s-2vcpu-4gb \
  --image docker-20-04 \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID
```

**2. Create Managed PostgreSQL:**
```bash
doctl databases create notesapp-db \
  --engine pg \
  --region nyc1 \
  --size db-s-1vcpu-1gb \
  --num-nodes 1
```

**3. Create Managed Redis:**
```bash
doctl databases create notesapp-redis \
  --engine redis \
  --region nyc1 \
  --size db-s-1vcpu-1gb
```

**4. SSH into Droplet:**
```bash
doctl compute ssh notesapp
```

**5. Deploy with Docker Compose:**
```bash
# On droplet
git clone https://github.com/yourorg/notesapp.git
cd notesapp
cp .env.example .env
# Edit .env with database URLs

docker-compose -f docker-compose.prod.yml up -d
```

**6. Setup Nginx Reverse Proxy:**
```nginx
# /etc/nginx/sites-available/notesapp
server {
    listen 80;
    server_name api.notesapp.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**7. Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.notesapp.com
```

---

## Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=optional-password

# JWT
JWT_SECRET=your-256-bit-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
FRONTEND_URL=https://app.notesapp.com
ALLOWED_ORIGINS=https://app.notesapp.com,https://notesapp.com

# Email (Optional - for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@notesapp.com

# AWS (if using S3 for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=notesapp-uploads

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Frontend (.env)

```bash
VITE_API_URL=https://api.notesapp.com/api/v1
VITE_WS_URL=wss://api.notesapp.com/notes
VITE_ENVIRONMENT=production
```

---

## SSL/TLS Configuration

### AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name notesapp.com \
  --subject-alternative-names *.notesapp.com \
  --validation-method DNS

# Add validation CNAME records to Route 53
# Certificate will be auto-approved once DNS is verified
```

### Let's Encrypt (Self-Hosted)

```bash
sudo certbot certonly --standalone -d api.notesapp.com -d app.notesapp.com
```

---

## Monitoring Setup

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name notesapp-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:xxx:notesapp-alerts
```

### Prometheus + Grafana (Self-Hosted)

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  grafana-data:
```

---

## Backup Strategy

### RDS Automated Backups

- Daily automated backups (7-day retention)
- Backup window: 03:00-04:00 UTC
- Point-in-time recovery enabled

### Manual Snapshots

```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier notesapp-db \
  --db-snapshot-identifier notesapp-db-snapshot-$(date +%Y%m%d)

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier notesapp-db-restored \
  --db-snapshot-identifier notesapp-db-snapshot-20240115
```

### Database Backup Script

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="notesapp_$DATE.sql.gz"

pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/$FILENAME

# Upload to S3
aws s3 cp $BACKUP_DIR/$FILENAME s3://notesapp-backups/

# Delete backups older than 30 days
find $BACKUP_DIR -name "notesapp_*.sql.gz" -mtime +30 -delete
```

---

## Troubleshooting

### Common Issues

**Issue: Database Connection Timeout**
```bash
# Check security group allows connections
aws ec2 describe-security-groups --group-ids sg-xxx

# Test connection from EC2
psql $DATABASE_URL -c "SELECT 1"
```

**Issue: High Memory Usage**
```bash
# Check Node.js memory usage
docker stats

# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" node server.js
```

**Issue: WebSocket Connection Fails**
```bash
# Check ALB sticky sessions enabled
aws elbv2 describe-target-group-attributes --target-group-arn arn:xxx

# Verify Socket.IO Redis adapter
redis-cli monitor | grep socket.io
```

**Issue: Frontend 404 on Refresh**
```bash
# Configure S3 error document
aws s3 website s3://notesapp-frontend --error-document index.html

# Update CloudFront error pages
# 404 → 200 /index.html (SPA routing)
```

---

**Last Updated:** 2024  
**Questions?** Contact DevOps team
