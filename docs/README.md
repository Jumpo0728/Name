# Real-Time Collaborative Note-Taking Application - Architecture Documentation

## Overview

This directory contains comprehensive architecture documentation for the real-time collaborative note-taking web application. The system is designed to support concurrent editing by multiple users with operational transformation for conflict resolution, JWT-based authentication, and horizontal scaling capabilities.

---

## Documentation Structure

### Core Documents

1. **[ARCHITECTURE_DESIGN.md](../ARCHITECTURE_DESIGN.md)** ⭐ **START HERE**
   - Complete system architecture design document
   - Technology stack justification (React, Node.js, PostgreSQL, Redis, AWS)
   - Frontend architecture (React, Zustand, Socket.IO, Tailwind, Vite)
   - Backend architecture (Node.js, Express, Layered pattern, Bull queues)
   - Database schema with ERD diagrams
   - Real-time sync strategy (Operational Transform)
   - Authentication flow (JWT + Refresh tokens)
   - Deployment architecture (Docker, AWS, alternatives)
   - Scaling considerations
   - Security concerns
   - Risk assessment
   - **Overall Confidence: 87%**

2. **[DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)**
   - SQL migration scripts for initial schema setup
   - Table definitions (users, notes, note_collaborators, note_versions, operations, refresh_tokens)
   - Index creation for performance optimization
   - Triggers and functions (auto-update timestamps)
   - Partitioning strategy for high-scale operations table
   - Rollback scripts
   - Seed data for development
   - Maintenance tasks (VACUUM, REINDEX, cleanup)
   - Performance monitoring queries

3. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)**
   - Complete REST API documentation
   - Authentication endpoints (register, login, refresh, logout)
   - User endpoints (profile, settings, GDPR export/delete)
   - Notes endpoints (CRUD, search)
   - Collaboration endpoints (share, permissions)
   - WebSocket events specification (join, leave, operations, cursor)
   - Error response formats
   - Rate limits and pagination
   - CORS configuration

4. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
   - Step-by-step deployment instructions
   - Local development setup (manual + Docker Compose)
   - Docker containerization
   - AWS production deployment (VPC, RDS, ElastiCache, EC2, ALB, S3, CloudFront, Route 53)
   - Alternative deployments (Heroku, DigitalOcean)
   - Environment variables reference
   - SSL/TLS configuration
   - Monitoring setup (CloudWatch, Prometheus, Grafana)
   - Backup strategy
   - Troubleshooting guide

---

## Quick Start

### For Product Managers / Stakeholders

1. Read **[ARCHITECTURE_DESIGN.md](../ARCHITECTURE_DESIGN.md)** - Executive Summary and Key Decisions
2. Review the System Architecture Diagram (Section 10)
3. Check Risk Assessment (Section 11) for potential concerns

### For Developers

1. Read **[ARCHITECTURE_DESIGN.md](../ARCHITECTURE_DESIGN.md)** - Full document (technical details)
2. Review **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** for API contract
3. Follow **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for local setup
4. Check **[DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)** for schema details

### For DevOps Engineers

1. Read **[ARCHITECTURE_DESIGN.md](../ARCHITECTURE_DESIGN.md)** - Sections 6-7 (Deployment + Scaling)
2. Follow **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - AWS Production Deployment
3. Setup monitoring using Monitoring Setup section
4. Configure backups using Backup Strategy section

---

## Technology Stack Summary

### Frontend
- **Framework:** React.js 18+ (component model, ecosystem, performance)
- **State Management:** Zustand (lightweight, simple API)
- **Real-time:** Socket.IO Client (reconnection, fallback support)
- **UI Framework:** Tailwind CSS (utility-first, small bundle)
- **Build Tool:** Vite (fast dev server, modern ES modules)
- **Rich Text Editor:** Slate.js (flexible, OT support)
- **Testing:** Vitest (unit), Playwright (E2E)

### Backend
- **Runtime:** Node.js 18+ LTS (event-driven, JavaScript isomorphism)
- **Framework:** Express.js (minimalist, middleware ecosystem)
- **Architecture:** Layered (Controllers → Services → Repositories)
- **Real-time:** Socket.IO (rooms, namespaces, Redis adapter)
- **Queue:** Bull (Redis-backed, retry logic)
- **API Style:** RESTful + WebSockets

### Database
- **Primary:** PostgreSQL 14+ (ACID, JSON support, full-text search)
- **Cache:** Redis 7+ (sessions, rate limiting, Socket.IO adapter, queue)
- **ORM:** Sequelize or raw SQL with pg library

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Cloud Provider:** AWS (EC2, RDS, ElastiCache, ALB, S3, CloudFront, Route 53)
- **Alternatives:** Heroku (simplicity), DigitalOcean (cost)
- **CI/CD:** GitHub Actions
- **Monitoring:** CloudWatch, Prometheus + Grafana, Sentry

---

## Key Architecture Decisions

### 1. Frontend Framework: React.js ✅
**Alternatives Considered:** Vue.js, Svelte  
**Reasoning:** Mature ecosystem, rich text editor libraries (Slate.js, Draft.js), large talent pool  
**Confidence:** 90%

### 2. State Management: Zustand ✅
**Alternatives Considered:** Redux Toolkit, Jotai, Context API  
**Reasoning:** Minimal boilerplate, hooks-based, small bundle, perfect for real-time apps  
**Confidence:** 85%

### 3. Backend Runtime: Node.js + Express ✅
**Alternatives Considered:** Go, Python FastAPI, Rust  
**Reasoning:** JavaScript isomorphism, excellent WebSocket support (Socket.IO), I/O-bound workload  
**Confidence:** 90%

### 4. Database: PostgreSQL ✅
**Alternatives Considered:** MongoDB, MySQL, CockroachDB  
**Reasoning:** ACID compliance (critical for collaborative editing), JSONB support, full-text search  
**Confidence:** 92%

### 5. Real-time Sync: Operational Transform (OT) ✅
**Alternatives Considered:** CRDT, Last Write Wins, Manual Merge  
**Reasoning:** Proven (Google Docs), server authority, deterministic, libraries available (ot.js, ShareDB)  
**Confidence:** 88%

### 6. Authentication: JWT + Refresh Tokens ✅
**Alternatives Considered:** Session Cookies, JWT Only, OAuth2 Only  
**Reasoning:** Stateless access tokens (scalable), revocable refresh tokens (secure), industry standard  
**Confidence:** 90%

### 7. Deployment: AWS ✅
**Alternatives Considered:** Heroku, DigitalOcean, Google Cloud  
**Reasoning:** Most mature services, RDS + ElastiCache are excellent, can scale to millions  
**Confidence:** 88%

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  React SPA (Vite) → Zustand + Socket.IO + Slate.js         │
└─────────────────────────────────────────────────────────────┘
                    │                          │
            HTTPS (REST)              WSS (WebSocket)
                    ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     EDGE LAYER                              │
│  CloudFront (CDN)       Application Load Balancer (SSL)    │
└─────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER (EC2)                     │
│  Backend 1          Backend 2          Backend N           │
│  (Node.js + Express + Socket.IO + OT Engine + Bull)        │
└─────────────────────────────────────────────────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        │
┌─────────────────────┐  ┌─────────────────────────┐       │
│  PostgreSQL (RDS)   │  │  Redis (ElastiCache)    │       │
│  - Primary (Write)  │  │  - Sessions             │       │
│  - Replica (Read)   │  │  - Cache                │       │
│  - Tables:          │  │  - Socket.IO Adapter    │       │
│    * users          │  │  - Bull Queue           │       │
│    * notes          │  │  - Rate Limiting        │       │
│    * collaborators  │  └─────────────────────────┘       │
│    * versions       │                                     │
│    * operations     │                                     │
└─────────────────────┘                                     │
                                                            │
         ┌──────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              OBSERVABILITY LAYER                            │
│  CloudWatch + Prometheus + Grafana + Sentry                │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Simplified ERD)

```
┌─────────────┐
│    USERS    │
├─────────────┤
│ id (PK)     │───┐
│ email (UQ)  │   │ 1:N
│ password    │   │
└─────────────┘   │
                  ▼
         ┌─────────────────┐         ┌──────────────────────┐
         │     NOTES       │────────▶│  NOTE_COLLABORATORS  │
         ├─────────────────┤   1:N   ├──────────────────────┤
         │ id (PK)         │         │ note_id (FK)         │
         │ owner_id (FK)   │         │ user_id (FK)         │
         │ title           │         │ permission (ENUM)    │
         │ content (JSONB) │         └──────────────────────┘
         │ version         │
         └─────────────────┘
                  │
                  │ 1:N
                  ▼
         ┌─────────────────┐         ┌──────────────────────┐
         │  NOTE_VERSIONS  │         │    OPERATIONS        │
         ├─────────────────┤         ├──────────────────────┤
         │ id (PK)         │         │ id (PK)              │
         │ note_id (FK)    │         │ note_id (FK)         │
         │ content (JSONB) │         │ operation (JSONB)    │
         │ version         │         │ version              │
         └─────────────────┘         │ timestamp            │
                                     └──────────────────────┘
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Notes
- `GET /api/notes` - List notes (paginated, searchable)
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get note details
- `PATCH /api/notes/:id` - Update metadata
- `DELETE /api/notes/:id` - Delete note

### Collaboration
- `GET /api/notes/:id/collaborators` - List collaborators
- `POST /api/notes/:id/collaborators` - Add collaborator
- `DELETE /api/notes/:id/collaborators/:userId` - Remove

### WebSocket Events
- `note:join` - Join note editing session
- `note:operation` - Send/receive OT operations
- `note:cursor` - Send/receive cursor positions
- `user:joined` / `user:left` - Collaborator presence

---

## Security Features

✅ **HTTPS/TLS Enforcement** - All traffic encrypted  
✅ **JWT + Refresh Tokens** - Secure, revocable auth  
✅ **CSRF Protection** - SameSite cookies + CSRF tokens  
✅ **XSS Prevention** - CSP headers + React escaping  
✅ **SQL Injection Prevention** - Parameterized queries  
✅ **Password Hashing** - bcrypt with 12 salt rounds  
✅ **Rate Limiting** - Prevent brute force and abuse  
✅ **Encryption at Rest** - RDS + S3 encryption  
✅ **GDPR Compliance** - Data export + right to be forgotten  
✅ **Audit Trails** - Complete operation history  

---

## Scaling Strategy

### Horizontal Scaling
- **Backend:** Auto-scaling EC2 instances (2-10 instances)
- **Load Balancer:** ALB with sticky sessions for WebSockets
- **Cross-Instance Sync:** Socket.IO Redis adapter

### Database Scaling
- **Vertical:** Scale RDS instance class (db.t3.small → db.m5.large)
- **Read Replicas:** Route read queries to replicas (1-3 replicas)
- **Connection Pooling:** PgBouncer or RDS Proxy (1000 clients → 50 DB connections)
- **Sharding:** Defer until 1M+ users (high complexity)

### Caching
- **CDN:** CloudFront for static assets (95% request reduction)
- **Redis:** User profiles (15m TTL), note metadata (5m TTL)
- **Browser:** React Query cache (stale-while-revalidate)

### Capacity Planning
- **10k concurrent users:** 10 EC2 instances, db.m5.large, cache.m5.large (~$850/month)
- **100k concurrent users:** 100 EC2 instances, db.m5.4xlarge, cache.m5.2xlarge (~$8,000/month)

---

## Development Workflow

### Local Development
1. Clone repository: `git clone https://github.com/yourorg/notesapp.git`
2. Start services: `docker-compose up -d`
3. Run migrations: `npm run migrate up`
4. Access: Frontend (http://localhost:3000), Backend (http://localhost:4000)

### Testing
- **Unit Tests:** `npm run test` (Vitest for frontend + backend)
- **E2E Tests:** `npm run test:e2e` (Playwright)
- **Load Tests:** `npm run test:load` (Artillery for WebSocket stress testing)

### CI/CD Pipeline
1. **Push to main** → GitHub Actions triggered
2. **Run tests** → Unit + E2E + Linting
3. **Build Docker images** → Backend + Frontend
4. **Push to ECR** → AWS Container Registry
5. **Deploy to EC2** → ECS update-service with new images
6. **Run smoke tests** → Verify deployment health

---

## Monitoring & Observability

### Metrics
- **Application:** Request rate, latency (p50/p95/p99), error rate, WebSocket connections
- **Infrastructure:** CPU, memory, disk I/O, network throughput
- **Business:** DAU/MAU, notes created, collaboration sessions

### Alerts
- Error rate > 1% → Page on-call
- Response time p95 > 1s → Warning
- Database CPU > 80% → Scale up
- Disk usage > 90% → Alert

### Logging
- **Centralized:** CloudWatch Logs (structured JSON logs)
- **Error Tracking:** Sentry (JavaScript errors, stack traces)
- **Audit Trail:** operations table (complete edit history)

---

## Cost Estimation

### MVP (1k users)
- EC2 (2x t3.medium): $60/month
- RDS (db.t3.small): $30/month
- ElastiCache (cache.t3.micro): $15/month
- ALB: $20/month
- S3 + CloudFront: $10/month
- **Total:** ~$135/month

### Production (10k users)
- EC2 (10x t3.medium): $300/month
- RDS (db.m5.large): $150/month
- ElastiCache (cache.m5.large): $150/month
- ALB: $20/month
- S3 + CloudFront: $30/month
- Data transfer: $100/month
- **Total:** ~$750/month

---

## Risk Assessment

### High-Risk Areas
1. **Operational Transform Complexity** (75% confidence)
   - Mitigation: Use battle-tested library (ShareDB, ot.js)
2. **WebSocket Scaling** (82% confidence)
   - Mitigation: Redis adapter, monitor load distribution
3. **Database Bottleneck** (85% confidence)
   - Mitigation: Read replicas, connection pooling, caching

### Medium-Risk Areas
1. **Cost Overruns** (80% confidence) - Set billing alarms
2. **Security Vulnerabilities** (88% confidence) - Regular audits, Dependabot

---

## Next Steps

### MVP Implementation (Weeks 1-8)
1. **Week 1-2:** Setup infrastructure (AWS, Docker, CI/CD)
2. **Week 3-4:** Backend API (auth, notes CRUD, basic real-time)
3. **Week 5-6:** Frontend (React components, editor, basic sync)
4. **Week 7:** Operational Transform integration
5. **Week 8:** Testing, bug fixes, deployment

### Post-MVP Features
- Note version history (undo/redo beyond OT)
- Export to PDF/DOCX
- Advanced sharing (public links, expiry)
- Rich media (images, attachments)
- Mobile apps (React Native)
- Offline mode (service workers, IndexedDB)

---

## Contributing

See main repository README for contribution guidelines.

---

## Questions?

- **Architecture Questions:** Review ARCHITECTURE_DESIGN.md or contact tech lead
- **API Questions:** Check API_SPECIFICATION.md or review Swagger docs
- **Deployment Issues:** See DEPLOYMENT_GUIDE.md troubleshooting section
- **Database Questions:** Review DATABASE_MIGRATIONS.md schema definitions

---

**Documentation Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Engineering Team
