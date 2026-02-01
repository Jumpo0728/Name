# MegaCollab: Real-Time Collaborative Coding Platform - Architecture Document

## 1. Architecture Overview

MegaCollab is a browser-based real-time collaborative code editor. It follows a client-server architecture with a heavy client (handling CRDT logic and editor UI) and a synchronization server (Node.js/Express/WebSocket).

### Frontend Architecture
- **Framework**: Vanilla JS (ES6+) with Modular structure. No heavy build step required (using native ES modules).
- **Editor**: CodeMirror 5 (via CDN) wrapped in a custom `Editor` class.
- **State Management**: Custom `State` class managing local CRDT state, user presence, and file tree.
- **Communication**: WebSocket client for real-time sync, Fetch API for REST operations.
- **Styling**: CSS Variables for theming (Dark/Light mode).

### Backend Architecture
- **Runtime**: Node.js.
- **Web Server**: Express.js handling REST API (Auth, Files, Projects).
- **Socket Server**: `ws` library handling real-time operations.
- **Database**: SQLite for persistent storage (Users, Projects, Snapshots).
- **Session/Cache**: Redis (or in-memory fallback) for session management and ephemeral state (active users per room).
- **Synchronization**: Centralized relay. The server acts as a message broker for CRDT updates but also persists checkpoints to the database.

### Real-Time Sync Model: Sequence CRDT
We will implement a **Sequence CRDT** (Conflict-free Replicated Data Type) based on LSEQ (LogootSplit) or a simplified character-interleaving algorithm.
- **Structure**: Each character has a unique ID: `[timestamp, siteId, counter]`.
- **Operations**: `insert(char, position_id, prev_id)`, `delete(char_id)`.
- **Convergence**: All peers apply operations. The unique ID ensures total ordering. Commutative operations allow eventual consistency without central locking.
- **Server Role**: The server stores the authoritative operations log and broadcasts new ops to connected peers. It also periodically compacts the log into a "snapshot" of the file content.

### Database Schema (SQLite)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  path TEXT NOT NULL,
  content BLOB, -- Latest snapshot
  version INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, path),
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE operations_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL,
  op_data TEXT NOT NULL, -- JSON string of the CRDT op
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(file_id) REFERENCES files(id)
);
```

### Authentication Flow
1. **Signup/Login**: Client sends credentials to `/api/auth/login`.
2. **Verification**: Server verifies bcrypt hash.
3. **Session**: Server creates a session ID, stores in Redis (key: `sess:<id>`, val: `userId`), and returns it as an HTTP-only cookie + a short-lived JWT for WebSocket auth.
4. **WebSocket Auth**: Client connects to WS with JWT in query param or initial handshake.
5. **Renewal**: Access tokens expire in 15 mins. Refresh tokens (HTTP-only cookie) used to get new Access tokens.

### Deployment & Scaling
- **Containerization**: Dockerfile provided for Node.js app.
- **Horizontal Scaling**: Multiple Node instances behind Nginx. Redis Pub/Sub used to broadcast WS messages across instances so users on different servers can collaborate on the same file.
- **Persistence**: SQLite mounted via volume (for single-instance simplicity in this task) or replaced with PostgreSQL for true production scaling.

### Security
- **XSS**: Inputs sanitized. `helmet` middleware used. Content Security Policy (CSP) headers.
- **Rate Limiting**: `express-rate-limit` on API routes.
- **Auth**: Strong password hashing (bcrypt). Secure cookies (SameSite=Strict, HttpOnly).
- **Injection**: Parameterized SQL queries (sqlite3).

### Performance
- **Debouncing**: Save operations to DB are debounced.
- **Batching**: WS messages batched if high frequency (10ms buffer).
- **Lazy Loading**: File contents loaded only when tab is opened.

---

## 2. CRDT Implementation Detail (Custom)
We implement a `VersionVector` and `Char` object.
`Char { value: string, id: ID, visible: boolean }`
`ID { site: string, clock: number }`

When inserting 'A' between 'B' and 'C':
- Generate ID strictly greater than B.id and less than C.id?
- **Simplified Approach (RGA - Replicated Growable Array)**:
  - List of characters.
  - Insert: `insert(char, after_id)`.
  - Delete: `delete(target_id)` (tombstone).
  - Use `siteId` to break ties.

This is robust and simpler to implement from scratch than LSEQ.
