# Troubleshooting Guide

## Table of Contents

- [Environment Setup Issues](#environment-setup-issues)
- [Development Issues](#development-issues)
- [Runtime Issues](#runtime-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)
- [WebSocket/Real-Time Issues](#websocketreal-time-issues)

## Environment Setup Issues

### Database connection errors

**Problem**: API fails to start with `ECONNREFUSED`.

**Root cause**: `DATABASE_URL` points to a non-running Postgres instance.

**Troubleshooting**
1. Verify Postgres is running (`docker ps` or `systemctl status postgresql`).
2. Confirm `DATABASE_URL` in `.env` is correct.
3. Test connectivity: `psql $DATABASE_URL`.

**Solution**
```bash
export DATABASE_URL=postgres://syncnote_user:password@localhost:5432/syncnote
npm run db:migrate
```

**Prevention**: Use Docker Compose to keep services aligned with expected ports.

### Node.js version mismatches

**Problem**: Dependencies fail to install.

**Root cause**: Node.js version lower than 18.

**Troubleshooting**
1. Run `node -v`.
2. Use `nvm install 18 && nvm use 18`.

**Solution**
```bash
nvm install 18
nvm use 18
```

**Prevention**: Add `.nvmrc` with version `18`.

### Missing environment variables

**Problem**: API crashes on boot.

**Root cause**: Required env variables missing.

**Troubleshooting**
1. Compare `.env` with `.env.example`.
2. Ensure secrets are present.

**Solution**
```bash
cp .env.example .env
```

**Prevention**: Validate env with a startup check.

### Redis connection issues

**Problem**: Cache errors logged.

**Root cause**: Redis not running.

**Troubleshooting**
1. `docker ps` and confirm Redis is active.
2. Check `REDIS_URL`.

**Solution**
```bash
docker-compose up -d redis
```

**Prevention**: Add Redis health check to docker-compose.

## Development Issues

### Hot reload not working

**Problem**: UI changes don't refresh.

**Root cause**: Vite dev server not running.

**Troubleshooting**
1. Ensure `npm run dev` in `client`.
2. Check browser console for HMR errors.

**Solution**
```bash
cd client && npm run dev
```

**Prevention**: Use separate terminals for backend and frontend.

### WebSocket connection fails

**Problem**: Collaboration not updating.

**Root cause**: WebSocket URL misconfigured.

**Troubleshooting**
1. Confirm `VITE_SOCKET_URL` matches API host.
2. Inspect browser network tab.

**Solution**
```bash
VITE_SOCKET_URL=http://localhost:4000
```

**Prevention**: Ensure env config is consistent across environments.

### Tests failing locally

**Problem**: Unit tests fail with database errors.

**Root cause**: Test database not migrated.

**Troubleshooting**
1. Set `DATABASE_URL` for test DB.
2. Run migrations.

**Solution**
```bash
NODE_ENV=test npm run db:migrate
npm run test
```

**Prevention**: Provide test setup scripts.

### Port already in use

**Problem**: `EADDRINUSE` error.

**Root cause**: Another process uses the same port.

**Troubleshooting**
1. Run `lsof -i :4000`.
2. Stop the process.

**Solution**
```bash
kill -9 <PID>
```

**Prevention**: Configure unique ports in `.env`.

## Runtime Issues

### 401 Unauthorized errors

**Problem**: API returns 401.

**Root cause**: Missing or expired access token.

**Troubleshooting**
1. Ensure `Authorization` header present.
2. Refresh access token.

**Solution**
```bash
curl -X POST /api/auth/refresh -d '{"refreshToken":"..."}'
```

**Prevention**: Implement auto-refresh in client.

### Notes not saving

**Problem**: UI shows errors on save.

**Root cause**: Validation failure or network errors.

**Troubleshooting**
1. Check response in network tab.
2. Verify schema validation logs.

**Solution**
```bash
Ensure title/content fields are not empty.
```

**Prevention**: Frontend input validation.

### Real-time sync not working

**Problem**: Updates do not propagate.

**Root cause**: Socket.IO server down.

**Troubleshooting**
1. Check API logs.
2. Confirm Socket.IO namespace.

**Solution**
```bash
Restart API server.
```

**Prevention**: Monitor WebSocket health.

### Offline mode not syncing

**Problem**: Offline edits never merge.

**Root cause**: Sync endpoint returns conflict.

**Troubleshooting**
1. Review `/api/notes/:id/sync` response.
2. Compare version numbers.

**Solution**
```bash
Resolve conflicts and retry sync.
```

**Prevention**: Provide clear conflict UI.

## Database Issues

### Migration failures

**Problem**: `npm run db:migrate` fails.

**Root cause**: Schema drift or migration conflicts.

**Troubleshooting**
1. Check migration order.
2. Verify migration table state.

**Solution**
```bash
npm run db:reset
```

**Prevention**: Squash migrations periodically.

### Connection pool exhaustion

**Problem**: API returns 500 errors under load.

**Root cause**: Too many concurrent DB connections.

**Troubleshooting**
1. Inspect connection pool limits.
2. Check for unclosed connections.

**Solution**
```bash
Increase pool size to 20.
```

**Prevention**: Use connection pooling and reuse.

### Slow queries

**Problem**: API endpoints slow.

**Root cause**: Missing indexes.

**Troubleshooting**
1. Run `EXPLAIN ANALYZE`.
2. Identify missing indexes.

**Solution**
```sql
CREATE INDEX idx_notes_owner_updated ON notes(owner_id, updated_at);
```

**Prevention**: Add indexes for frequent queries.

### Data consistency issues

**Problem**: Conflicting updates.

**Root cause**: Missing transaction boundaries.

**Troubleshooting**
1. Review API logs.
2. Check transaction usage.

**Solution**
```bash
Wrap note updates in DB transactions.
```

**Prevention**: Use optimistic concurrency control.

## Performance Issues

### App loading slowly

**Problem**: Initial load time > 3s.

**Root cause**: Large bundle or slow network.

**Troubleshooting**
1. Analyze bundle size.
2. Enable code splitting.

**Solution**
```bash
npm run build -- --analyze
```

**Prevention**: Lazy-load heavy components.

### API responses slow

**Problem**: p95 > 500ms.

**Root cause**: DB or cache latency.

**Troubleshooting**
1. Check Prometheus metrics.
2. Inspect DB query timings.

**Solution**
```bash
Add Redis caching for hot endpoints.
```

**Prevention**: Monitor p95/p99 latency.

### High memory usage

**Problem**: API memory spikes.

**Root cause**: Large payloads or leaks.

**Troubleshooting**
1. Review heap snapshots.
2. Check for unbounded caches.

**Solution**
```bash
Limit payload sizes and enable GC profiling.
```

**Prevention**: Add memory alerts.

### CPU spikes

**Problem**: CPU usage > 80%.

**Root cause**: Heavy synchronous workloads.

**Troubleshooting**
1. Inspect Node.js profiling output.
2. Move heavy work to workers.

**Solution**
```bash
Use worker threads for heavy tasks.
```

**Prevention**: Use async and batching.

## Deployment Issues

### Docker build failures

**Problem**: Build fails due to missing files.

**Root cause**: Incorrect build context.

**Troubleshooting**
1. Verify Dockerfile paths.
2. Check `.dockerignore`.

**Solution**
```bash
Update Dockerfile to copy required files.
```

**Prevention**: Use multi-stage builds.

### Database migration in production

**Problem**: Migration fails on deploy.

**Root cause**: Missing privileges.

**Troubleshooting**
1. Validate DB user permissions.
2. Apply migration manually.

**Solution**
```bash
GRANT ALL PRIVILEGES ON DATABASE syncnote TO syncnote_user;
```

**Prevention**: Use migration role with required grants.

### SSL certificate errors

**Problem**: Browser warns about SSL.

**Root cause**: Wrong certificate chain.

**Troubleshooting**
1. Verify certificate in ACM/Certbot.
2. Confirm DNS records.

**Solution**
```bash
Re-issue certificate with correct domain.
```

**Prevention**: Automate renewal.

### CORS issues

**Problem**: Browser blocks requests.

**Root cause**: Missing CORS origin in API config.

**Troubleshooting**
1. Check `CORS_ORIGIN`.
2. Ensure frontend URL is whitelisted.

**Solution**
```bash
CORS_ORIGIN=https://app.syncnote.example.com
```

**Prevention**: Support multiple origins in config.

## WebSocket/Real-Time Issues

### Socket disconnection

**Problem**: Users drop from collaboration.

**Root cause**: Network instability or heartbeat timeouts.

**Troubleshooting**
1. Inspect client reconnect logs.
2. Check load balancer timeout settings.

**Solution**
```bash
Set ALB idle timeout to 120s.
```

**Prevention**: Use ping/pong heartbeat.

### Messages not delivered

**Problem**: Changes not received.

**Root cause**: Redis adapter not configured.

**Troubleshooting**
1. Check Redis connection.
2. Validate socket namespaces.

**Solution**
```bash
Configure Socket.IO Redis adapter.
```

**Prevention**: Use integration tests for real-time flows.

### Rooms not working

**Problem**: Users are not joining rooms.

**Root cause**: Incorrect room naming or auth failure.

**Troubleshooting**
1. Log room join payloads.
2. Validate auth token.

**Solution**
```bash
Ensure room names use note IDs.
```

**Prevention**: Add server-side validation.
