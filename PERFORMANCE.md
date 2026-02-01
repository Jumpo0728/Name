# Performance Guidelines

## Table of Contents

- [Performance Targets](#performance-targets)
- [Optimization Techniques](#optimization-techniques)
- [Monitoring Performance](#monitoring-performance)
- [Load Testing Procedures](#load-testing-procedures)
- [Scaling Strategy](#scaling-strategy)

## Performance Targets

- **API response times**: p95 < 200ms, p99 < 500ms
- **Frontend load times**: < 2.5s on 4G
- **Real-time sync latency**: < 150ms
- **Database queries**: < 50ms average

## Optimization Techniques

### Backend Optimizations

- Use pagination on list endpoints
- Cache hot reads in Redis
- Add indexes for frequently filtered columns

### Frontend Optimizations

- Code splitting with React.lazy
- Minify and compress assets
- Prefetch critical API data

### Database Query Optimization

- Use `EXPLAIN ANALYZE`
- Avoid N+1 queries
- Use partial indexes for hot data

### Caching Strategies

- Redis for note metadata and tags
- Cache invalidation on write
- TTL for search results

## Monitoring Performance

- Track p50/p95/p99 latency
- Monitor Redis hit rate
- Profile heavy queries weekly

## Load Testing Procedures

### Tools

- k6 for API load tests
- Lighthouse for frontend performance

### Scenario Example

```bash
k6 run load-tests/notes.js
```

### Interpreting Results

- Keep error rate < 1%
- Adjust autoscaling if p95 exceeds target

## Scaling Strategy

- Vertical scaling up to 4 vCPU / 16 GB
- Horizontal scaling for API pods
- Read replicas for PostgreSQL
