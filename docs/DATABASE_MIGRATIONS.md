# Database Migration Plan

## Initial Schema Setup

This document provides the SQL migration scripts to set up the database schema described in the architecture design.

## Migration 001: Initial Schema

```sql
-- Migration: 001_initial_schema.sql
-- Description: Create initial database schema for collaborative note-taking app
-- Date: 2024

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Create ENUM types
CREATE TYPE permission_enum AS ENUM ('view', 'edit', 'admin');

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_email_verified BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Table: notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_text TEXT GENERATED ALWAYS AS (
        COALESCE(content->>'text', '')
    ) STORED,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_deleted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_edit_by UUID REFERENCES users(id),
    
    CONSTRAINT positive_version CHECK (version >= 1)
);

-- Table: note_collaborators
CREATE TABLE note_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission permission_enum DEFAULT 'edit',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    
    UNIQUE(note_id, user_id)
);

-- Table: note_versions (for snapshots)
CREATE TABLE note_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(note_id, version),
    CONSTRAINT positive_version CHECK (version >= 1)
);

-- Table: operations (for OT event sourcing)
CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    operation JSONB NOT NULL,
    version INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT positive_version CHECK (version >= 1)
);

-- Table: refresh_tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    
    CONSTRAINT future_expiry CHECK (expires_at > created_at)
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Indexes for notes table
CREATE INDEX idx_notes_owner ON notes(owner_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX idx_notes_fts ON notes USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(content_text, ''))
);

-- Indexes for note_collaborators table
CREATE INDEX idx_collab_note ON note_collaborators(note_id);
CREATE INDEX idx_collab_user ON note_collaborators(user_id);

-- Indexes for note_versions table
CREATE INDEX idx_versions_note ON note_versions(note_id, version DESC);

-- Indexes for operations table
CREATE INDEX idx_ops_note_version ON operations(note_id, version);
CREATE INDEX idx_ops_timestamp ON operations(timestamp);

-- Indexes for refresh_tokens table
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update notes.updated_at
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update users.updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

## Migration 002: Add Indexes for Performance (Optional Future Optimization)

```sql
-- Migration: 002_add_performance_indexes.sql
-- Description: Add additional indexes if performance issues arise
-- Run this if query analysis shows slow queries

BEGIN;

-- Composite index for frequently joined queries
CREATE INDEX idx_notes_owner_updated ON notes(owner_id, updated_at DESC) 
    WHERE is_deleted = FALSE;

-- Index for searching notes by user and tag
CREATE INDEX idx_notes_owner_tags ON notes USING GIN(owner_id, tags)
    WHERE is_deleted = FALSE;

-- Partial index for active refresh tokens
CREATE INDEX idx_refresh_active ON refresh_tokens(user_id, expires_at)
    WHERE revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP;

COMMIT;
```

## Migration 003: Add Partitioning for Operations Table (For High Scale)

```sql
-- Migration: 003_partition_operations.sql
-- Description: Partition operations table by timestamp (monthly partitions)
-- Only run this when operations table exceeds 10M rows

BEGIN;

-- Convert operations table to partitioned table
ALTER TABLE operations RENAME TO operations_old;

-- Create partitioned table
CREATE TABLE operations (
    id UUID DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL,
    user_id UUID NOT NULL,
    operation JSONB NOT NULL,
    version INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id, timestamp),
    CONSTRAINT positive_version CHECK (version >= 1)
) PARTITION BY RANGE (timestamp);

-- Create partitions for the last 6 months
CREATE TABLE operations_2024_01 PARTITION OF operations
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE operations_2024_02 PARTITION OF operations
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- ... (create more partitions as needed)

-- Copy data from old table
INSERT INTO operations SELECT * FROM operations_old;

-- Drop old table
DROP TABLE operations_old;

-- Recreate indexes
CREATE INDEX idx_ops_note_version ON operations(note_id, version);
CREATE INDEX idx_ops_timestamp ON operations(timestamp);

COMMIT;
```

## Rollback Scripts

### Rollback Migration 001

```sql
BEGIN;

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS operations;
DROP TABLE IF EXISTS note_versions;
DROP TABLE IF EXISTS note_collaborators;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS permission_enum;

DROP EXTENSION IF EXISTS pg_trgm;

COMMIT;
```

## Running Migrations

### Using Node.js Migration Tool (node-pg-migrate)

```bash
# Install migration tool
npm install --save-dev node-pg-migrate

# Create migration
npm run migrate create initial_schema

# Run migration
npm run migrate up

# Rollback migration
npm run migrate down
```

### Using Sequelize CLI

```bash
# Install Sequelize
npm install --save sequelize pg pg-hstore
npm install --save-dev sequelize-cli

# Initialize Sequelize
npx sequelize-cli init

# Create migration
npx sequelize-cli migration:generate --name initial-schema

# Run migrations
npx sequelize-cli db:migrate

# Rollback migration
npx sequelize-cli db:migrate:undo
```

### Manual Execution

```bash
# Run migration directly
psql -U postgres -d notesapp -f migrations/001_initial_schema.sql

# Verify tables
psql -U postgres -d notesapp -c "\dt"

# Verify indexes
psql -U postgres -d notesapp -c "\di"
```

## Seed Data for Development

```sql
-- Seed development data
BEGIN;

-- Create test user
INSERT INTO users (email, password_hash, username, is_email_verified)
VALUES 
    ('test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5FKNWX4pKR6Bi', 'testuser', true),
    ('demo@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5FKNWX4pKR6Bi', 'demouser', true);

-- Create test notes
INSERT INTO notes (owner_id, title, content, tags)
SELECT 
    u.id,
    'Welcome to NotesApp',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Start writing your notes here!"}]}]}'::jsonb,
    ARRAY['welcome', 'tutorial']
FROM users u WHERE u.email = 'test@example.com';

INSERT INTO notes (owner_id, title, content, tags)
SELECT 
    u.id,
    'Collaborative Note',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This note can be shared with others."}]}]}'::jsonb,
    ARRAY['collaboration']
FROM users u WHERE u.email = 'test@example.com';

COMMIT;
```

## Database Maintenance

### Regular Maintenance Tasks

```sql
-- Vacuum and analyze (run weekly)
VACUUM ANALYZE users;
VACUUM ANALYZE notes;
VACUUM ANALYZE note_collaborators;
VACUUM ANALYZE operations;

-- Reindex (run monthly or when index bloat detected)
REINDEX TABLE notes;
REINDEX TABLE operations;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Cleanup Old Data

```sql
-- Delete operations older than 90 days (if not using partitioning)
DELETE FROM operations 
WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days'
AND note_id IN (
    SELECT note_id FROM note_versions
    WHERE version > (SELECT MAX(version) - 100 FROM note_versions nv WHERE nv.note_id = note_versions.note_id)
);

-- Delete expired refresh tokens
DELETE FROM refresh_tokens
WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL;

-- Soft-delete old notes (archive instead of hard delete)
UPDATE notes 
SET is_deleted = TRUE
WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '365 days'
AND is_deleted = FALSE;
```

## Performance Monitoring Queries

```sql
-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- queries taking > 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    ROUND(100 * pg_total_relation_size(schemaname||'.'||tablename) / 
        pg_database_size(current_database())) AS percent_of_db
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check cache hit ratio (should be > 90%)
SELECT 
    sum(heap_blks_read) AS heap_read,
    sum(heap_blks_hit) AS heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;
```

---

**Note:** Always test migrations in a staging environment before running in production. Create database backups before running migrations.
