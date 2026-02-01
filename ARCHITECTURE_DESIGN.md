# REAL-TIME COLLABORATIVE NOTE-TAKING APPLICATION
## COMPREHENSIVE SYSTEM ARCHITECTURE DESIGN DOCUMENT

**Version:** 1.0  
**Date:** 2024  
**Status:** Design Phase  
**Confidence Level:** High (85-90%)

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Frontend Architecture](#1-frontend-architecture)
3. [Backend Architecture](#2-backend-architecture)
4. [Database Schema](#3-database-schema)
5. [Real-Time Sync Strategy](#4-real-time-sync-strategy)
6. [Authentication Flow](#5-authentication-flow)
7. [Deployment Architecture](#6-deployment-architecture)
8. [Scaling Considerations](#7-scaling-considerations)
9. [Security Concerns](#8-security-concerns)
10. [System Architecture Diagram](#system-architecture-diagram)
11. [Risk Assessment](#risk-assessment)
12. [Conclusion](#conclusion)

---

## EXECUTIVE SUMMARY

This document outlines the complete architecture for a production-ready, real-time collaborative note-taking web application. The system is designed to support concurrent editing by multiple users with operational transformation for conflict resolution, JWT-based authentication, and horizontal scaling capabilities.

**Key Technology Stack:**
- **Frontend:** React.js + Zustand + Socket.IO Client + Tailwind CSS + Vite
- **Backend:** Node.js + Express.js + Socket.IO + Bull Queue
- **Database:** PostgreSQL (primary) + Redis (cache/sessions)
- **Deployment:** Docker + AWS (EC2, RDS, ElastiCache, ALB)
- **Real-time:** Operational Transform (OT) with WebSockets

**Core Assumptions:**
1. Target user base: 1,000-10,000 concurrent users (initial scale)
2. Average note size: 5-50 KB
3. Real-time latency requirement: < 200ms for sync operations
4. Availability target: 99.5% uptime
5. Geographic scope: Single region initially, multi-region expansion planned
6. Budget constraint: Moderate ($500-2000/month for initial deployment)

---

## 1. FRONTEND ARCHITECTURE

### 1.1 Framework Choice: **React.js 18+**

**Decision Rationale:**
- **Component Model:** Declarative UI with reusable components ideal for note editor, sidebars, toolbars
- **Ecosystem Maturity:** Extensive library support (Rich Text Editors, Real-time hooks, Testing tools)
- **Community Size:** 220k+ GitHub stars, massive StackOverflow support, abundant talent pool
- **Performance:** Virtual DOM optimization, React 18 concurrent features for smooth UX
- **Developer Experience:** Hot module replacement, excellent DevTools, TypeScript support

**Alternatives Considered:**

| Framework | Pros | Cons | Confidence |
|-----------|------|------|------------|
| **React.js** ✅ | Mature ecosystem, large talent pool, component reusability, rich text editor libraries available | Bundle size can be larger, requires additional libraries for routing/state | **90%** |
| **Vue.js 3** | Simpler learning curve, built-in state management (Pinia), smaller bundle size, excellent documentation | Smaller ecosystem for rich text editors, less enterprise adoption | **75%** |
| **Svelte** | Smallest bundle size, no virtual DOM overhead, reactive by default | Smaller ecosystem, fewer rich text libraries, smaller talent pool | **60%** |

**Why React Wins:**
- Rich text editing libraries like **Slate.js**, **Draft.js**, **TipTap** have better React support
- Real-time collaboration examples (Google Docs clones) predominantly use React
- Easier to find experienced developers
- Better TypeScript integration for type-safe collaborative editing logic

**Confidence Level:** 90% - React is the safest, most battle-tested choice for this use case.

---

### 1.2 State Management: **Zustand**

**Decision Rationale:**
- **Simplicity:** Minimal boilerplate compared to Redux (no actions, reducers, or providers)
- **Performance:** Uses React hooks, selective re-renders, small bundle size (~1KB)
- **Developer Experience:** Simple API, easy debugging, middleware support
- **Scalability:** Can handle global state (user, notes list) and local state (editor state)

**Alternatives Considered:**

| Solution | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Zustand** ✅ | Minimal boilerplate, hooks-based, small bundle, easy to learn | Less structured than Redux (can lead to spaghetti in large teams) | **85%** |
| **Redux Toolkit** | Industry standard, excellent DevTools, time-travel debugging, strict patterns | Verbose setup, steeper learning curve, overkill for small-medium apps | **80%** |
| **Jotai/Recoil** | Atomic state management, great for derived state, minimal boilerplate | Newer (less battle-tested), smaller ecosystem | **70%** |
| **Context API** | Built-in, no dependencies, simple for small state | Performance issues with frequent updates, not ideal for real-time data | **50%** |

**Why Zustand Wins:**
- Real-time apps need frequent state updates; Zustand handles this efficiently
- Less cognitive overhead than Redux for a small-medium team
- Easy to integrate with WebSocket event handlers
- Can easily migrate to Redux Toolkit later if needed

**State Structure:**
```javascript
// stores/noteStore.js
{
  notes: [],              // List of user's notes
  activeNote: null,       // Currently open note
  collaborators: [],      // Active users in current note
  connectionStatus: 'connected',
  setNotes: (notes) => set({ notes }),
  updateNote: (id, content) => ...,
  addCollaborator: (user) => ...
}

// stores/authStore.js
{
  user: null,
  token: null,
  isAuthenticated: false,
  login: (credentials) => ...,
  logout: () => ...
}
```

**Confidence Level:** 85% - Great balance of simplicity and capability.

---

### 1.3 Real-Time Library: **Socket.IO Client**

**Decision Rationale:**
- **Automatic Reconnection:** Built-in reconnection logic with exponential backoff
- **Fallback Support:** WebSocket → Long-polling fallback for restrictive networks
- **Room Support:** Easy to implement note-specific channels
- **Event-Based:** Clean abstraction for real-time events (text-change, cursor-move, user-join)
- **Binary Support:** Can send binary data (images, attachments) efficiently

**Alternatives Considered:**

| Solution | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Socket.IO** ✅ | Automatic reconnection, fallback support, rooms/namespaces, battle-tested | Slightly larger than native WebSocket, opinionated protocol | **90%** |
| **Native WebSocket** | Lightweight, browser standard, no dependencies | Manual reconnection logic, no room abstraction, no fallback | **70%** |
| **Ably/Pusher** | Managed service, auto-scaling, global edge network | Vendor lock-in, monthly costs ($29-99+), less control | **65%** |
| **Server-Sent Events** | Simple, HTTP-based, built-in reconnection | One-way only (server→client), no binary support | **40%** |

**Why Socket.IO Wins:**
- Collaborative editing requires bidirectional communication
- Built-in room support perfect for note-specific channels
- Automatic reconnection critical for mobile users with spotty connections
- Large community means plenty of OT/CRDT integration examples

**Integration Pattern:**
```javascript
// hooks/useRealtimeNote.js
const socket = io('https://api.example.com', {
  auth: { token: authStore.token },
  transports: ['websocket', 'polling']
});

socket.on('note:update', (delta) => {
  applyOperation(delta); // Apply OT operation
});

socket.emit('note:edit', { noteId, delta });
```

**Confidence Level:** 90% - Industry standard for real-time apps.

---

### 1.4 UI Framework: **Tailwind CSS**

**Decision Rationale:**
- **Rapid Development:** Utility-first approach speeds up prototyping
- **Consistency:** Design system constraints prevent style chaos
- **Bundle Size:** PurgeCSS removes unused styles (final CSS ~10-20KB)
- **Responsive Design:** Built-in mobile-first responsive utilities
- **Customization:** Easy to extend with custom themes/colors

**Alternatives Considered:**

| Solution | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Tailwind CSS** ✅ | Fast development, small final bundle, highly customizable, excellent docs | HTML can look cluttered, learning curve for class names | **85%** |
| **Material-UI (MUI)** | Pre-built components, accessibility built-in, professional look | Large bundle size (~300KB), opinionated design, harder to customize | **75%** |
| **Chakra UI** | Great accessibility, TypeScript support, easy theming | Smaller ecosystem than MUI, medium bundle size | **70%** |
| **CSS Modules** | Scoped styles, no naming conflicts, full CSS power | Manual responsive design, no design system, slower development | **60%** |

**Why Tailwind Wins:**
- Need to build custom UI (note editor, toolbar) not covered by component libraries
- Small bundle size critical for fast page loads
- Easy to create custom design system for brand differentiation
- Works well with custom React components

**Confidence Level:** 85% - Best balance of speed, flexibility, and bundle size.

---

### 1.5 Build Tool: **Vite**

**Decision Rationale:**
- **Dev Server Speed:** Native ESM, instant server start (~200ms vs 5-10s for Webpack)
- **Hot Module Replacement:** Lightning-fast updates during development
- **Modern Defaults:** ES2015+ support, tree-shaking, code-splitting out-of-the-box
- **Plugin Ecosystem:** React plugin, TypeScript support, environment variables
- **Production Builds:** Rollup-based optimized builds with preloading

**Alternatives Considered:**

| Solution | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Vite** ✅ | Fastest dev server, modern architecture, simple config, great DX | Newer tool (less battle-tested than Webpack), fewer advanced plugins | **88%** |
| **Webpack 5** | Industry standard, massive plugin ecosystem, advanced optimization | Slow dev server, complex configuration, slower HMR | **80%** |
| **Parcel** | Zero-config, fast builds, simple to use | Less control over build process, smaller community | **70%** |
| **Create React App** | Official React tool, zero config, easy start | Webpack-based (slow), hard to customize, ejecting is messy | **65%** |

**Why Vite Wins:**
- Real-time apps require rapid iteration during development
- Sub-second HMR dramatically improves developer productivity
- Simple configuration reduces maintenance burden
- Production builds are as optimized as Webpack

**Configuration Example:**
```javascript
// vite.config.js
export default {
  plugins: [react()],
  server: { port: 3000 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'socket': ['socket.io-client']
        }
      }
    }
  }
}
```

**Confidence Level:** 88% - Modern choice with excellent DX.

---

### 1.6 Additional Frontend Libraries

| Library | Purpose | Reasoning |
|---------|---------|-----------|
| **Slate.js** | Rich text editor framework | Most flexible for collaborative editing, OT integration examples exist |
| **React Router v6** | Client-side routing | Standard routing solution, data loaders for suspense integration |
| **React Query** | Server state management | Caching, optimistic updates, background refetching for note metadata |
| **date-fns** | Date manipulation | Smaller than Moment.js, tree-shakeable, immutable API |
| **Zod** | Runtime validation | Type-safe validation for API responses, WebSocket events |
| **Vitest** | Unit testing | Vite-native testing framework, Jest-compatible API |
| **Playwright** | E2E testing | Cross-browser testing, real-time collaboration test scenarios |

---

### 1.7 Frontend Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React SPA)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │   Pages      │  │  Components  │     │
│  │              │  │              │  │              │     │
│  │ /login       │─▶│ LoginPage    │  │  NoteEditor  │     │
│  │ /notes       │─▶│ NotesPage    │  │  Toolbar     │     │
│  │ /notes/:id   │─▶│ EditorPage   │  │  Sidebar     │     │
│  │ /settings    │─▶│ SettingsPage │  │  UserAvatar  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           State Management (Zustand)                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ noteStore  │ authStore  │ uiStore  │ syncStore    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Services Layer                         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ API Client (REST)  │  Socket Manager  │  OT Engine │   │
│  │ (React Query)      │  (Socket.IO)     │  (Local)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
           │                          │
           │ HTTPS/REST               │ WSS (WebSocket Secure)
           ▼                          ▼
    ┌──────────────┐          ┌──────────────┐
    │ REST API     │          │ Socket.IO    │
    │ (Express)    │          │ Server       │
    └──────────────┘          └──────────────┘
```

---

## 2. BACKEND ARCHITECTURE

### 2.1 Runtime: **Node.js 18+ (LTS) with Express.js**

**Decision Rationale:**
- **JavaScript Everywhere:** Same language as frontend reduces context switching
- **Event-Driven:** Non-blocking I/O perfect for real-time WebSocket connections
- **NPM Ecosystem:** Largest package registry, excellent Socket.IO/OT libraries
- **Performance:** V8 engine optimization, handles 10k+ concurrent connections with clustering
- **Maturity:** Battle-tested in production (Netflix, LinkedIn, Uber)

**Alternatives Considered:**

| Runtime | Pros | Cons | Confidence |
|---------|------|------|------------|
| **Node.js + Express** ✅ | JavaScript isomorphism, huge ecosystem, excellent WebSocket support, fast development | Single-threaded (need clustering), weaker typing than compiled languages | **90%** |
| **Go + Gorilla** | Superior performance, true concurrency, compiled binary, low memory | Smaller ecosystem, different language (context switching), less flexible for rapid changes | **75%** |
| **Python + FastAPI** | Clean async syntax, great for ML features, excellent typing, easy prototyping | Slower than Node/Go, GIL issues with concurrency, fewer real-time examples | **70%** |
| **Rust + Actix** | Best performance, memory safety, fearless concurrency | Steep learning curve, slower development, smaller ecosystem, harder to find developers | **50%** |

**Why Node.js Wins:**
- Real-time apps are I/O-bound, not CPU-bound (Node's sweet spot)
- Socket.IO (best WebSocket library) is Node-native
- JavaScript isomorphism enables code sharing (validation schemas, utilities)
- Faster development velocity for MVP and iterations
- Can offload CPU-intensive tasks (encryption, compression) to worker threads or microservices

**Framework Choice: Express.js**
- Minimalist, unopinionated framework
- Massive middleware ecosystem (auth, validation, logging)
- Easy to integrate Socket.IO
- Alternative: **NestJS** (more structured, TypeScript-first, but heavier and opinionated)

**Confidence Level:** 90% - Node.js is the optimal choice for real-time collaboration.

---

### 2.2 Architecture Pattern: **Layered Architecture**

**Decision Rationale:**
- **Separation of Concerns:** Clear boundaries between HTTP, business logic, data access
- **Testability:** Each layer can be unit tested independently
- **Maintainability:** Easy to locate and modify code
- **Scalability:** Can extract layers into microservices later if needed

**Layer Structure:**

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                         │
│  ┌────────────────┐  ┌────────────────┐                │
│  │  REST Routes   │  │ WebSocket      │                │
│  │  (Express)     │  │ Handlers       │                │
│  │                │  │ (Socket.IO)    │                │
│  └────────┬───────┘  └────────┬───────┘                │
└───────────┼──────────────────┼─────────────────────────┘
            │                  │
            ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                BUSINESS LOGIC LAYER                     │
│  ┌────────────────┐  ┌────────────────┐                │
│  │  Note Service  │  │  Auth Service  │                │
│  │                │  │                │                │
│  │  User Service  │  │  Sync Service  │                │
│  └────────┬───────┘  └────────┬───────┘                │
└───────────┼──────────────────┼─────────────────────────┘
            │                  │
            ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                 DATA ACCESS LAYER                       │
│  ┌────────────────┐  ┌────────────────┐                │
│  │  Note Repo     │  │  User Repo     │                │
│  │  (PostgreSQL)  │  │  (PostgreSQL)  │                │
│  │                │  │                │                │
│  │  Cache Repo    │  │  Session Repo  │                │
│  │  (Redis)       │  │  (Redis)       │                │
│  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

**Alternatives Considered:**

| Pattern | Pros | Cons | Confidence |
|---------|------|------|------------|
| **Layered** ✅ | Simple to understand, clear separation, easy to test, gradual complexity | Can become rigid, layer coupling, potential for anemic domain model | **85%** |
| **Microservices** | Independent scaling, technology flexibility, fault isolation | Complexity overhead, network latency, distributed transactions, overkill for MVP | **60%** |
| **Clean/Hexagonal** | Highly testable, framework-independent, domain-centric | Over-engineering for simple CRUD, steep learning curve, more boilerplate | **70%** |
| **MVC** | Simple pattern, rapid development | Business logic often leaks into controllers, hard to test | **75%** |

**Why Layered Wins:**
- Right balance of structure and simplicity for a small-medium team
- Easy to migrate to microservices later by extracting services
- Clear boundaries prevent spaghetti code
- Familiar pattern for most Node.js developers

**Directory Structure:**
```
src/
├── routes/           # Express routes (REST endpoints)
├── controllers/      # Request/response handling
├── services/         # Business logic
├── repositories/     # Data access (DB queries)
├── models/           # Data models/schemas
├── middleware/       # Auth, validation, error handling
├── sockets/          # WebSocket event handlers
├── utils/            # Helper functions
├── config/           # Configuration files
└── tests/            # Test files
```

**Confidence Level:** 85% - Proven pattern for this scale.

---

### 2.3 Real-Time Engine: **Socket.IO with Namespace-Based Room Management**

**Decision Rationale:**
- **Rooms:** Built-in room abstraction perfect for note-specific channels
- **Namespaces:** Can separate concern areas (e.g., `/notes`, `/notifications`)
- **Broadcasting:** Easy to broadcast events to all users in a room except sender
- **Middleware:** Auth middleware for socket connections
- **Scalability:** Redis adapter enables scaling across multiple servers

**Architecture:**

```javascript
// sockets/noteSocket.js
const noteNamespace = io.of('/notes');

noteNamespace.use(authenticateSocket); // JWT verification

noteNamespace.on('connection', (socket) => {
  socket.on('note:join', async ({ noteId }) => {
    // Verify user has access to note
    const hasAccess = await noteService.checkAccess(socket.userId, noteId);
    if (!hasAccess) return socket.emit('error', 'Access denied');
    
    // Join room
    socket.join(`note:${noteId}`);
    
    // Broadcast user joined
    socket.to(`note:${noteId}`).emit('user:joined', {
      userId: socket.userId,
      username: socket.username
    });
  });
  
  socket.on('note:operation', async ({ noteId, operation }) => {
    // Apply OT operation
    const transformedOp = await syncService.applyOperation(noteId, operation);
    
    // Broadcast to other users in room
    socket.to(`note:${noteId}`).emit('note:operation', transformedOp);
  });
  
  socket.on('disconnect', () => {
    // Cleanup and broadcast user left
  });
});
```

**Event Types:**
- `note:join` - User joins note editing session
- `note:leave` - User leaves note
- `note:operation` - Text operation (insert, delete, format)
- `note:cursor` - Cursor position update
- `user:joined` - New collaborator joined
- `user:left` - Collaborator left
- `note:saved` - Note persisted to database

**Confidence Level:** 90% - Socket.IO is industry standard for this use case.

---

### 2.4 Queue System: **Bull (Redis-backed)**

**Decision Rationale:**
- **Async Processing:** Offload slow operations (email, export, analytics)
- **Retry Logic:** Built-in job retry with exponential backoff
- **Priority Queues:** Can prioritize critical operations
- **Monitoring:** Bull Board provides web UI for queue monitoring
- **Persistence:** Redis persistence ensures jobs survive server restarts

**Use Cases:**
1. **Note Export** - Generate PDF/DOCX exports asynchronously
2. **Email Notifications** - Send collaboration invites, share links
3. **Analytics Events** - Process user behavior events
4. **Cleanup Jobs** - Delete old versions, cleanup orphaned files
5. **Search Indexing** - Update full-text search index

**Alternatives Considered:**

| Solution | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Bull** ✅ | Redis-based, robust retry logic, great monitoring (Bull Board), battle-tested | Requires Redis, single point of failure without clustering | **88%** |
| **BullMQ** | Bull successor, better TypeScript support, improved performance | Newer (less proven), migration overhead | **82%** |
| **AWS SQS** | Managed service, no infrastructure, auto-scaling | Vendor lock-in, higher latency, costs add up | **75%** |
| **RabbitMQ** | Feature-rich, multiple protocols, exchange types | Complex setup, heavier infrastructure, steeper learning curve | **70%** |

**Why Bull Wins:**
- Already using Redis for sessions/cache (no new dependency)
- Simple API, minimal configuration
- Bull Board provides excellent visibility into job status
- Can easily migrate to BullMQ later if needed

**Queue Configuration:**
```javascript
// queues/emailQueue.js
const emailQueue = new Bull('email', {
  redis: { host: process.env.REDIS_HOST, port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true
  }
});

emailQueue.process(async (job) => {
  const { to, subject, body } = job.data;
  await emailService.send(to, subject, body);
});

// Usage
await emailQueue.add({ to: 'user@example.com', subject: '...', body: '...' });
```

**Confidence Level:** 88% - Perfect fit for async task processing.

---

### 2.5 API Style: **RESTful + WebSockets**

**Decision Rationale:**
- **REST for CRUD:** Standard HTTP verbs for note CRUD operations (idempotent, cacheable)
- **WebSockets for Real-Time:** Bidirectional communication for live collaboration
- **Clear Separation:** REST for state mutations, WS for live updates
- **Client Simplicity:** React Query for REST, Socket.IO for real-time

**REST API Endpoints:**

```
# Authentication
POST   /api/auth/register       - Create new account
POST   /api/auth/login          - Login (returns JWT)
POST   /api/auth/logout         - Logout (invalidate refresh token)
POST   /api/auth/refresh        - Refresh access token

# Notes
GET    /api/notes               - List user's notes
POST   /api/notes               - Create new note
GET    /api/notes/:id           - Get note details
PATCH  /api/notes/:id           - Update note metadata (title, tags)
DELETE /api/notes/:id           - Delete note
POST   /api/notes/:id/share     - Generate share link

# Collaboration
GET    /api/notes/:id/collaborators  - List collaborators
POST   /api/notes/:id/collaborators  - Invite collaborator
DELETE /api/notes/:id/collaborators/:userId  - Remove collaborator

# User
GET    /api/user/profile        - Get user profile
PATCH  /api/user/profile        - Update profile
GET    /api/user/settings       - Get settings
PATCH  /api/user/settings       - Update settings
```

**Alternatives Considered:**

| Approach | Pros | Cons | Confidence |
|----------|------|------|------------|
| **REST + WebSockets** ✅ | Clear separation, use right tool for right job, client libraries excellent | Two protocols to manage, need to coordinate state | **90%** |
| **GraphQL + Subscriptions** | Single endpoint, client-controlled queries, real-time via subscriptions | Complexity overhead, N+1 query problem, caching challenges | **75%** |
| **tRPC** | End-to-end type safety, auto-generated client, simple RPC | TypeScript-only, less flexible for mobile clients, smaller ecosystem | **70%** |
| **WebSockets Only** | Single protocol, simpler architecture | Loses REST benefits (caching, idempotency), non-standard for CRUD | **60%** |

**Why REST + WebSockets Wins:**
- REST is perfect for CRUD operations (caching, retries, HTTP status codes)
- WebSockets excel at low-latency bidirectional communication
- Most developers familiar with both patterns
- Can scale REST and WebSocket servers independently

**API Versioning Strategy:**
- URL versioning: `/api/v1/notes`
- Allows breaking changes without disrupting existing clients
- Deprecation policy: Support N-1 version for 6 months

**Confidence Level:** 90% - Industry best practice for hybrid apps.

---

### 2.6 Backend Trade-offs Summary

**Monolith vs Microservices:**
- **Decision:** Start with modular monolith, extract microservices later if needed
- **Reasoning:** Premature microservices add complexity (service discovery, distributed tracing, network overhead) without proven benefit. Monolith with clear service boundaries allows easy extraction later.
- **Confidence:** 85%

**Synchronous vs Asynchronous Processing:**
- **Decision:** Use Bull queues for non-critical async operations (email, export)
- **Reasoning:** Improves response time, prevents timeouts, enables retry logic
- **Confidence:** 90%

**Code Organization:**
- **Decision:** Feature-based folders (notes/, users/, auth/)
- **Reasoning:** Easier to locate related code, natural module boundaries for future extraction
- **Confidence:** 80%

---

## 3. DATABASE SCHEMA

### 3.1 Primary Database: **PostgreSQL 14+**

**Decision Rationale:**
- **ACID Compliance:** Strong consistency critical for collaborative editing conflicts
- **JSON Support:** `JSONB` columns for flexible note content storage (supports rich text)
- **Full-Text Search:** Built-in `tsvector` for note search without external service
- **Mature Ecosystem:** 30+ years of development, battle-tested reliability
- **Performance:** Excellent indexing, query optimization, handles millions of rows
- **Extensions:** pg_trgm for fuzzy search, uuid-ossp for UUID generation

**Alternatives Considered:**

| Database | Pros | Cons | Confidence |
|----------|------|------|------------|
| **PostgreSQL** ✅ | ACID, JSON support, full-text search, mature, great scaling | More complex than NoSQL, schema migrations required | **92%** |
| **MongoDB** | Flexible schema, easy JSON storage, horizontal scaling built-in | Weaker consistency, no ACID until v4, harder to model relationships | **70%** |
| **MySQL** | Widely adopted, great replication, simpler than Postgres | Weaker JSON support, less advanced features, InnoDB limitations | **75%** |
| **CockroachDB** | Distributed SQL, global scaling, ACID | Higher latency, newer (less proven), more expensive | **60%** |

**Why PostgreSQL Wins:**
- Collaborative editing requires strong consistency (prevent conflicting writes)
- JSONB perfect for storing rich text content (OT operations as JSON)
- Full-text search critical for note search functionality
- Easier to scale vertically initially (AWS RDS read replicas later)
- Can add Elasticsearch later if search becomes bottleneck

**Confidence Level:** 92% - Best SQL database for this use case.

---

### 3.2 Caching Layer: **Redis 7+**

**Decision Rationale:**
- **Session Store:** Fast access to user sessions (JWT refresh tokens, active sessions)
- **Rate Limiting:** Store rate limit counters (per-user, per-IP)
- **WebSocket Adapter:** Socket.IO Redis adapter for cross-instance communication
- **Cache:** Frequently accessed data (user profiles, note metadata)
- **Pub/Sub:** Real-time event broadcasting across server instances

**Use Cases:**
1. Session storage (refresh tokens, active sessions)
2. Rate limiting counters
3. Socket.IO adapter (multi-instance sync)
4. Cache for note metadata (title, tags, updated_at)
5. Pub/Sub for inter-service communication

**Alternatives Considered:**

| Solution | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Redis** ✅ | In-memory speed, pub/sub, Socket.IO adapter, simple API | Data loss risk (use persistence), single-threaded | **90%** |
| **Memcached** | Simple, fast, distributed caching | No persistence, no pub/sub, no complex data structures | **70%** |
| **In-Memory (Node)** | No external dependency, fastest access | Lost on restart, doesn't scale across instances | **50%** |

**Why Redis Wins:**
- Socket.IO Redis adapter requires Redis (syncs events across instances)
- Pub/Sub perfect for cross-instance real-time events
- Persistence modes (RDB + AOF) reduce data loss risk
- Rich data structures (sets, sorted sets) useful for collaboration features

**Persistence Configuration:**
- **RDB:** Snapshot every 5 minutes if ≥100 changes
- **AOF:** Append-only file with fsync every second
- **Hybrid:** Combine RDB (fast restart) + AOF (durability)

**Confidence Level:** 90% - Essential component for real-time scaling.

---

### 3.3 Database Schema Design

**Entity Relationship Diagram (ERD):**

```
┌──────────────────────┐
│       USERS          │
├──────────────────────┤
│ id (UUID, PK)        │───┐
│ email (VARCHAR, UQ)  │   │
│ password_hash (TEXT) │   │
│ username (VARCHAR)   │   │
│ avatar_url (TEXT)    │   │
│ created_at (TS)      │   │
│ updated_at (TS)      │   │
│ last_login_at (TS)   │   │
└──────────────────────┘   │
                           │
          ┌────────────────┘
          │ 1:N
          ▼
┌──────────────────────┐         ┌──────────────────────┐
│       NOTES          │         │   NOTE_COLLABORATORS │
├──────────────────────┤         ├──────────────────────┤
│ id (UUID, PK)        │────────▶│ note_id (UUID, FK)   │
│ owner_id (UUID, FK)  │    1:N  │ user_id (UUID, FK)   │
│ title (VARCHAR)      │         │ permission (ENUM)    │
│ content (JSONB)      │         │ added_at (TS)        │
│ content_text (TEXT)  │         └──────────────────────┘
│ tags (TEXT[])        │                   │
│ is_deleted (BOOL)    │                   │ N:1
│ version (INT)        │                   ▼
│ created_at (TS)      │         ┌──────────────────────┐
│ updated_at (TS)      │         │       (USERS)        │
│ last_edit_by (UUID)  │         └──────────────────────┘
└──────────────────────┘
          │
          │ 1:N
          ▼
┌──────────────────────┐
│   NOTE_VERSIONS      │
├──────────────────────┤
│ id (UUID, PK)        │
│ note_id (UUID, FK)   │
│ content (JSONB)      │
│ version (INT)        │
│ created_by (UUID)    │
│ created_at (TS)      │
└──────────────────────┘

          │
          │ 1:N
          ▼
┌──────────────────────┐
│   OPERATIONS         │  (Optional: Event Sourcing)
├──────────────────────┤
│ id (UUID, PK)        │
│ note_id (UUID, FK)   │
│ user_id (UUID, FK)   │
│ operation (JSONB)    │  - { type, position, text, ... }
│ version (INT)        │
│ timestamp (TS)       │
└──────────────────────┘

┌──────────────────────┐
│   REFRESH_TOKENS     │
├──────────────────────┤
│ id (UUID, PK)        │
│ user_id (UUID, FK)   │
│ token_hash (TEXT)    │
│ expires_at (TS)      │
│ created_at (TS)      │
└──────────────────────┘
```

---

### 3.4 Detailed Schema Definitions

**USERS Table:**
```sql
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
    settings JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**NOTES Table:**
```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Slate.js document structure
    content_text TEXT GENERATED ALWAYS AS (content->>'text') STORED,  -- For full-text search
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_deleted BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_edit_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_notes_owner ON notes(owner_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);  -- Array search
CREATE INDEX idx_notes_fts ON notes USING GIN(to_tsvector('english', title || ' ' || content_text));  -- Full-text search
```

**NOTE_COLLABORATORS Table:**
```sql
CREATE TYPE permission_enum AS ENUM ('view', 'edit', 'admin');

CREATE TABLE note_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission permission_enum DEFAULT 'edit',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    UNIQUE(note_id, user_id)
);

-- Indexes
CREATE INDEX idx_collab_note ON note_collaborators(note_id);
CREATE INDEX idx_collab_user ON note_collaborators(user_id);
```

**NOTE_VERSIONS Table (Snapshot-Based Versioning):**
```sql
CREATE TABLE note_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, version)
);

-- Indexes
CREATE INDEX idx_versions_note ON note_versions(note_id, version DESC);
```

**OPERATIONS Table (Optional: Event Sourcing for OT):**
```sql
CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    operation JSONB NOT NULL,  -- { type: 'insert'/'delete', position: 10, text: '...', attributes: {...} }
    version INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ops_note_version ON operations(note_id, version);
CREATE INDEX idx_ops_timestamp ON operations(timestamp);

-- Partitioning by timestamp (monthly partitions for performance)
-- Implement later if operations table grows large
```

**REFRESH_TOKENS Table:**
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);
```

---

### 3.5 Indexing Strategy

**Primary Indexes (Created Above):**
1. **users.email** - Fast login lookups
2. **notes.owner_id** - List user's notes efficiently
3. **notes.updated_at** - Sort notes by recent activity
4. **notes.tags (GIN)** - Array containment search (`@>` operator)
5. **notes FTS (GIN)** - Full-text search on title + content
6. **note_collaborators.note_id** - List collaborators per note
7. **note_collaborators.user_id** - List notes shared with user
8. **operations.note_id, version** - Replay operations for OT

**Query Performance Expectations:**
- List user's notes: `< 50ms` (indexed on owner_id)
- Full-text search: `< 200ms` (GIN index on tsvector)
- Load note + collaborators: `< 100ms` (2 indexed queries)
- Replay operations: `< 500ms` for 10k operations (indexed by note_id, version)

**Maintenance:**
- **VACUUM:** Auto-vacuum enabled (reclaim space from deleted rows)
- **ANALYZE:** Run weekly to update query planner statistics
- **Index Bloat:** Monitor with `pg_stat_user_indexes`, rebuild if fragmented

---

### 3.6 Data Normalization

**Normalization Level:** 3rd Normal Form (3NF)
- **1NF:** All columns atomic (no multi-valued cells except arrays for tags)
- **2NF:** No partial dependencies (all non-key attributes depend on entire primary key)
- **3NF:** No transitive dependencies (no non-key attribute depends on another non-key attribute)

**Denormalization Decisions:**
1. **content_text (generated column):** Denormalized for full-text search performance
2. **tags (array):** Denormalized for simplicity; could normalize to `note_tags` join table if tags become complex entities
3. **last_edit_by in notes:** Denormalized for quick display; canonical source is operations table

**Trade-offs:**
- **Pro:** Faster reads (fewer joins), simpler queries
- **Con:** Slight data redundancy, update complexity
- **Justification:** Read-heavy workload (users read notes more than edit), performance gain outweighs redundancy

---

### 3.7 Database Trade-offs Summary

**SQL vs NoSQL:**
- **Decision:** PostgreSQL (SQL)
- **Reasoning:** Strong consistency needed for collaborative editing conflicts, relational data (users, notes, collaborators), ACID guarantees
- **Confidence:** 92%

**Snapshot vs Event Sourcing:**
- **Decision:** Hybrid approach (snapshots in `notes`, optional event sourcing in `operations`)
- **Reasoning:** Snapshots for fast reads, event sourcing for audit trail and conflict resolution
- **Confidence:** 85%

**Partitioning:**
- **Decision:** Defer until operations table > 10M rows
- **Reasoning:** Premature optimization; monitor growth and partition by timestamp if needed
- **Confidence:** 80%

---

## 4. REAL-TIME SYNC STRATEGY

### 4.1 Conflict Resolution: **Operational Transform (OT)**

**Decision Rationale:**
- **Deterministic:** Same operations in same order produce same result
- **Proven:** Used by Google Docs, Office 365, Firepad
- **Simpler Than CRDT:** Easier to implement for centralized server architecture
- **Server Authority:** Server maintains single source of truth, transforms client operations
- **Good Libraries:** ot.js, sharedb provide battle-tested implementations

**How OT Works:**

```
Client A: "Hello" (cursor at 5)
Client B: "Hello" (cursor at 0)

Client A: Insert "!" at position 5 → "Hello!"
Client B: Insert "Hi " at position 0 → "Hi Hello"

Without OT:
- Server receives A's operation: "Hello" → "Hello!"
- Server receives B's operation (intended for "Hello"): Insert "Hi " at 0
- Result: "Hi Hello!" ✅ Correct by luck

With Concurrent Edits:
- A and B both start with "Hello"
- A sends: Insert("!", 5)  [local state: "Hello!"]
- B sends: Insert("Hi ", 0)  [local state: "Hi Hello"]

Server receives A's op first:
1. Apply A's op: "Hello" → "Hello!"
2. Receive B's op (designed for "Hello", not "Hello!")
3. Transform B's op against A's op:
   - B wanted position 0 (unchanged, before A's edit)
   - Transformed: Insert("Hi ", 0)  [still position 0]
4. Apply transformed B's op: "Hello!" → "Hi Hello!"
5. Send transformed op to A and B

Both clients converge to: "Hi Hello!" ✅
```

**Transformation Function:**
```javascript
function transform(op1, op2) {
  // If op1 is Insert at pos1 and op2 is Insert at pos2
  if (op1.type === 'insert' && op2.type === 'insert') {
    if (op1.pos < op2.pos) {
      // op2 position shifts right by op1 length
      return { ...op2, pos: op2.pos + op1.text.length };
    } else if (op1.pos > op2.pos) {
      // No change to op2
      return op2;
    } else {
      // Same position - tie-break by user ID
      return op1.userId < op2.userId 
        ? { ...op2, pos: op2.pos + op1.text.length }
        : op2;
    }
  }
  // Handle delete, retain, formatting operations...
  // Use ot.js library for complete implementation
}
```

**Alternatives Considered:**

| Approach | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Operational Transform** ✅ | Proven (Google Docs), server authority, deterministic, libraries exist | Complex to implement correctly, requires server coordination | **88%** |
| **CRDT (Conflict-Free Replicated Data Type)** | No server needed, works offline, eventually consistent | Harder to implement rich text editing, larger data structures, tombstones for deletes | **75%** |
| **Last Write Wins** | Simplest implementation, no conflict logic | Data loss (overwrites concurrent edits), poor UX | **30%** |
| **Manual Merge** | Full control, user decides conflicts | Terrible UX for real-time (interrupts flow), not true real-time | **20%** |

**Why OT Wins:**
- Centralized architecture (we have a server) makes OT simpler than CRDT
- Rich text editing is well-solved with OT (Slate.js has OT plugins)
- Server authority simplifies access control (permissions enforced server-side)
- Battle-tested in production by Google, Microsoft
- Libraries like **ot.js**, **ShareDB** reduce implementation risk

**Confidence Level:** 88% - Industry-proven approach for collaborative text editing.

---

### 4.2 Version-Based Conflict Resolution

**Versioning Strategy:**
- Each note has a `version` counter (integer, increments on every operation)
- Clients send operations with the version they were created against
- Server applies operation to latest version, increments version
- Clients optimistically apply their own operations, wait for server acknowledgment

**Operation Flow:**

```
1. Client A and B both have note at version 10
2. Client A creates operation OP_A (against v10)
3. Client B creates operation OP_B (against v10)
4. Server receives OP_A first:
   - Current version: 10
   - Apply OP_A → version 11
   - Broadcast OP_A to all clients (including B)
5. Server receives OP_B (still marked as v10):
   - Current version: 11 (already advanced)
   - Transform OP_B against OP_A
   - Apply transformed OP_B → version 12
   - Broadcast transformed OP_B to all clients
6. All clients converge to version 12 with identical content
```

**Implementation:**
```javascript
// Server-side operation handling
async function handleOperation(noteId, operation, clientVersion, userId) {
  const note = await noteRepo.findById(noteId);
  
  if (operation.version !== note.version) {
    // Operation is stale, need to transform
    const missedOps = await operationRepo.getRange(
      noteId, 
      operation.version + 1, 
      note.version
    );
    
    // Transform incoming operation against all missed operations
    let transformedOp = operation;
    for (const missedOp of missedOps) {
      transformedOp = OT.transform(transformedOp, missedOp);
    }
    operation = transformedOp;
  }
  
  // Apply operation
  const newContent = OT.apply(note.content, operation);
  const newVersion = note.version + 1;
  
  // Persist
  await noteRepo.update(noteId, { 
    content: newContent, 
    version: newVersion 
  });
  await operationRepo.create({
    noteId,
    operation,
    version: newVersion,
    userId
  });
  
  // Broadcast to other clients
  io.to(`note:${noteId}`).emit('note:operation', {
    operation,
    version: newVersion,
    userId
  });
  
  return { success: true, version: newVersion };
}
```

**Confidence Level:** 90% - Standard approach for OT systems.

---

### 4.3 Event Sourcing Pattern

**Decision:** Store all operations in `operations` table for audit trail and replay capability.

**Benefits:**
1. **Audit Trail:** Complete history of who changed what and when
2. **Undo/Redo:** Replay or reverse operations
3. **Debugging:** Reproduce conflicts by replaying operations
4. **Analytics:** Analyze editing patterns, collaboration metrics
5. **Disaster Recovery:** Rebuild note from operations log

**Storage Trade-off:**
- **Pro:** Complete history, debugging, undo/redo
- **Con:** Storage grows linearly with edits (mitigated by periodic compaction)
- **Solution:** Compact operations into snapshots every 100 operations, delete old operations

**Compaction Strategy:**
```javascript
// Run compaction job every hour
async function compactNoteOperations(noteId) {
  const operations = await operationRepo.getAllForNote(noteId);
  
  if (operations.length < 100) return; // Not enough to compact
  
  // Create snapshot every 100 operations
  const lastSnapshot = await noteVersionRepo.getLatest(noteId);
  const newOps = operations.filter(op => op.version > lastSnapshot.version);
  
  if (newOps.length >= 100) {
    const currentContent = await noteRepo.findById(noteId);
    await noteVersionRepo.create({
      noteId,
      content: currentContent.content,
      version: currentContent.version
    });
    
    // Delete operations older than last snapshot (keep recent 100)
    await operationRepo.deleteOlderThan(
      noteId, 
      currentContent.version - 100
    );
  }
}
```

**Confidence Level:** 85% - Valuable for debugging and audit, manageable storage cost.

---

### 4.4 Delta Compression

**Decision:** Only send changed portions of the document, not entire content.

**Implementation:**
- Client sends operation (insert/delete/format), not full document
- Server broadcasts operation to other clients
- Clients apply operation to local state

**Bandwidth Savings:**

| Approach | Payload Size (per edit) | Notes |
|----------|-------------------------|-------|
| **Full Document** | 5-50 KB | Entire note content sent on every keystroke |
| **Delta (Operation)** | 50-500 bytes | Only operation data (type, position, text) |
| **Savings** | 90-99% | Dramatic reduction in bandwidth |

**Example Operation:**
```json
{
  "type": "insert",
  "position": 42,
  "text": "Hello",
  "attributes": { "bold": true },
  "version": 156,
  "userId": "user-123"
}
```

**Size:** ~150 bytes vs. 10 KB full document = **98% reduction**

**Confidence Level:** 95% - Essential for real-time performance.

---

### 4.5 Offline → Online Reconciliation

**Challenge:** User edits offline, comes back online with stale version.

**Strategy:**

1. **Detect Offline:** Client tracks connection status
2. **Queue Operations:** Store operations locally (IndexedDB/localStorage)
3. **Reconnect:** Send queued operations to server with original version
4. **Server Transform:** Transform each queued operation against all missed server operations
5. **Client Reconcile:** Server sends back transformed operations, client applies them
6. **Conflict UI:** If conflicts are too complex, show merge UI (rare with OT)

**Implementation:**
```javascript
// Client-side offline queue
class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isOnline = navigator.onLine;
  }
  
  addOperation(operation) {
    if (!this.isOnline) {
      this.queue.push(operation);
      localStorage.setItem('pendingOps', JSON.stringify(this.queue));
    } else {
      socket.emit('note:operation', operation);
    }
  }
  
  async syncPendingOperations() {
    const pending = JSON.parse(localStorage.getItem('pendingOps') || '[]');
    
    for (const op of pending) {
      const result = await socket.emitWithAck('note:operation', op);
      if (!result.success) {
        // Server couldn't transform - rare conflict
        this.handleConflict(op, result.serverVersion);
      }
    }
    
    localStorage.removeItem('pendingOps');
    this.queue = [];
  }
}
```

**Confidence Level:** 80% - OT handles most conflicts automatically; manual merge rarely needed.

---

### 4.6 Real-Time Sync Trade-offs Summary

**OT vs CRDT:**
- **Decision:** OT with server authority
- **Reasoning:** Centralized architecture, rich text editing libraries, access control enforcement
- **Confidence:** 88%

**WebSockets vs Server-Sent Events:**
- **Decision:** WebSockets (Socket.IO)
- **Reasoning:** Bidirectional needed (client sends operations, server broadcasts), Socket.IO handles reconnection
- **Confidence:** 95%

**Optimistic Updates:**
- **Decision:** Apply operations locally immediately, rollback on server rejection (rare)
- **Reasoning:** Responsive UX, server rejection almost never happens with OT
- **Confidence:** 90%

---

## 5. AUTHENTICATION FLOW

### 5.1 Strategy: **JWT-based with Refresh Tokens**

**Decision Rationale:**
- **Stateless:** Access tokens (JWT) don't require server-side storage lookup
- **Scalable:** No session store lookup on every request (only on refresh)
- **Secure:** Short-lived access tokens (15 min), long-lived refresh tokens (7 days)
- **Revocable:** Refresh tokens stored in DB, can be revoked (logout, security breach)
- **Standard:** OAuth2 pattern, well-documented, client libraries available

**Token Types:**

| Token | Lifetime | Storage | Purpose | Revocable |
|-------|----------|---------|---------|-----------|
| **Access Token** (JWT) | 15 minutes | Memory (React state) | API authentication | No (short-lived) |
| **Refresh Token** | 7 days | httpOnly cookie | Renew access token | Yes (DB lookup) |

**JWT Payload:**
```json
{
  "userId": "uuid-123",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Alternatives Considered:**

| Approach | Pros | Cons | Confidence |
|----------|------|------|------------|
| **JWT + Refresh** ✅ | Stateless, scalable, revocable refresh, standard | Requires refresh logic, token size larger than session ID | **90%** |
| **Session Cookies** | Simple, revocable, small cookie size | Requires session store lookup (Redis), harder to scale, CSRF protection needed | **80%** |
| **JWT Only (long-lived)** | Simplest implementation, fully stateless | Cannot revoke (security risk), all-or-nothing expiration | **40%** |
| **OAuth2 Provider Only** | Offload auth to Google/GitHub, no password storage | Requires internet, user may not have Google account, less control | **70%** |

**Why JWT + Refresh Wins:**
- Stateless access tokens reduce load on Redis (no session lookup per request)
- Refresh tokens enable revocation (logout, password change)
- Short access token lifetime limits damage if stolen
- Standard pattern used by Auth0, Firebase, AWS Cognito
- Can add OAuth2 providers as optional login method

**Confidence Level:** 90% - Industry best practice.

---

### 5.2 Authentication Flow Diagram

```
┌─────────────┐                                    ┌─────────────┐
│   Client    │                                    │   Server    │
└─────────────┘                                    └─────────────┘
      │                                                   │
      │  1. POST /api/auth/login                         │
      │     { email, password }                          │
      ├─────────────────────────────────────────────────▶│
      │                                                   │
      │                          2. Verify password      │
      │                             (bcrypt compare)     │
      │                                                   │
      │  3. Return tokens                                │
      │     { accessToken: "jwt...",                     │
      │       refreshToken: "random..." }                │
      │◀─────────────────────────────────────────────────┤
      │     Set-Cookie: refreshToken=...; httpOnly;      │
      │                                                   │
      │  4. Store accessToken in memory                  │
      │     Store refreshToken in httpOnly cookie        │
      │                                                   │
      │  5. API Request                                  │
      │     GET /api/notes                               │
      │     Authorization: Bearer {accessToken}          │
      ├─────────────────────────────────────────────────▶│
      │                                                   │
      │                          6. Verify JWT signature │
      │                             Decode payload       │
      │                                                   │
      │  7. Response                                     │
      │     { notes: [...] }                             │
      │◀─────────────────────────────────────────────────┤
      │                                                   │
      │  [15 minutes pass - access token expires]        │
      │                                                   │
      │  8. API Request (with expired token)             │
      ├─────────────────────────────────────────────────▶│
      │                                                   │
      │  9. 401 Unauthorized                             │
      │     { error: "Token expired" }                   │
      │◀─────────────────────────────────────────────────┤
      │                                                   │
      │  10. POST /api/auth/refresh                      │
      │      Cookie: refreshToken=...                    │
      ├─────────────────────────────────────────────────▶│
      │                                                   │
      │                          11. Verify refresh token│
      │                              in DB, check expiry │
      │                                                   │
      │  12. New access token                            │
      │      { accessToken: "new_jwt..." }               │
      │◀─────────────────────────────────────────────────┤
      │                                                   │
      │  13. Retry original request                      │
      │      (with new access token)                     │
      ├─────────────────────────────────────────────────▶│
      │                                                   │
      │  14. Success response                            │
      │◀─────────────────────────────────────────────────┤
      │                                                   │
```

---

### 5.3 Session Management

**Refresh Token Storage:**
- Store hashed refresh token in `refresh_tokens` table
- Associate with user_id, expiry, created_at
- Index by token_hash for fast lookup
- Revoke by deleting row or setting `revoked_at`

**Access Token Storage (Client-Side):**
- **Memory:** Store in React state (Zustand store)
- **Not localStorage:** XSS attacks can steal tokens
- **Not sessionStorage:** XSS attacks can steal tokens
- **Refresh token in httpOnly cookie:** JavaScript cannot access (XSS protection)

**Security Benefits:**
- Access token in memory: Lost on page refresh (minor inconvenience, major security win)
- Refresh token in httpOnly cookie: Cannot be stolen by XSS
- Short access token lifetime: Stolen token expires quickly

**Token Refresh Interceptor:**
```javascript
// api/axiosInstance.js
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        // Refresh token (httpOnly cookie sent automatically)
        const { data } = await axios.post('/api/auth/refresh');
        authStore.setAccessToken(data.accessToken);
        
        // Retry original request with new token
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        authStore.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**Confidence Level:** 92% - Secure, standard approach.

---

### 5.4 Role-Based Access Control (RBAC)

**Permission Levels:**

| Role | Note Permissions |
|------|------------------|
| **Owner** | Full control (edit, delete, share, manage collaborators) |
| **Editor** | Edit content, view collaborators |
| **Viewer** | Read-only access, see collaborators |

**Enforcement:**

1. **REST API:** Middleware checks user's permission before allowing operation
```javascript
// middleware/checkNoteAccess.js
async function checkNoteAccess(req, res, next) {
  const { noteId } = req.params;
  const userId = req.user.id;
  
  const note = await noteRepo.findById(noteId);
  if (note.owner_id === userId) {
    req.userRole = 'owner';
    return next();
  }
  
  const collab = await collabRepo.findByNoteAndUser(noteId, userId);
  if (!collab) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  req.userRole = collab.permission;
  next();
}

// routes/notes.js
router.delete('/notes/:id', checkNoteAccess, async (req, res) => {
  if (req.userRole !== 'owner') {
    return res.status(403).json({ error: 'Only owner can delete' });
  }
  // Delete note...
});
```

2. **WebSocket:** Check permission on `note:join` event, reject unauthorized connections

**Confidence Level:** 88% - Standard RBAC implementation.

---

### 5.5 OAuth2 Integration (Optional)

**Providers:** Google, GitHub (most common for note-taking apps)

**Flow:**
1. User clicks "Login with Google"
2. Redirect to Google OAuth consent screen
3. Google redirects back with authorization code
4. Server exchanges code for Google access token
5. Fetch user profile from Google API
6. Create/link user account in our database
7. Issue our own JWT access + refresh tokens

**Library:** Passport.js with `passport-google-oauth20` strategy

**Trade-off:**
- **Pro:** Easier signup (no password to remember), reduces password storage risk
- **Con:** Requires internet, not all users have Google account, dependency on external service
- **Decision:** Offer as optional login method alongside email/password

**Confidence Level:** 85% - Nice-to-have, not critical for MVP.

---

### 5.6 Security Measures

**Password Hashing:**
- **Algorithm:** bcrypt with salt rounds = 12
- **Why bcrypt:** Intentionally slow (prevents brute force), automatic salt, battle-tested
- **Alternative considered:** Argon2 (newer, better) - bcrypt chosen for wider library support

```javascript
// Register
const passwordHash = await bcrypt.hash(password, 12);
await userRepo.create({ email, passwordHash });

// Login
const user = await userRepo.findByEmail(email);
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**CORS Configuration:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,  // Only allow our frontend
  credentials: true  // Allow cookies (refresh token)
}));
```

**Cookie Security:**
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,      // Cannot access via JavaScript (XSS protection)
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

**Confidence Level:** 95% - Industry-standard security practices.

---

### 5.7 Authentication Trade-offs Summary

**JWT vs Sessions:**
- **Decision:** JWT for access tokens, refresh tokens in DB
- **Reasoning:** Stateless scaling, revocable refresh, best of both worlds
- **Confidence:** 90%

**Token Storage:**
- **Decision:** Access token in memory, refresh token in httpOnly cookie
- **Reasoning:** XSS protection, balance of security and UX
- **Confidence:** 92%

**OAuth2 Providers:**
- **Decision:** Optional (Google, GitHub), not required
- **Reasoning:** Improves signup UX, but not essential for MVP
- **Confidence:** 85%

---

## 6. DEPLOYMENT ARCHITECTURE

### 6.1 Containerization: **Docker + Docker Compose**

**Decision Rationale:**
- **Consistency:** Same environment in dev, staging, production
- **Isolation:** Each service (frontend, backend, postgres, redis) in separate container
- **Portability:** Deploy to any cloud provider (AWS, GCP, Azure, DigitalOcean)
- **Orchestration:** Docker Compose for local dev, Kubernetes/ECS for production (if needed)
- **Reproducibility:** Dockerfile captures exact dependencies, versions

**Docker Architecture:**

```
docker-compose.yml
├── frontend (React SPA)     - Port 3000
├── backend (Node.js API)    - Port 4000
├── postgres (Database)      - Port 5432
├── redis (Cache/Sessions)   - Port 6379
└── nginx (Reverse Proxy)    - Port 80/443
```

**Alternatives Considered:**

| Approach | Pros | Cons | Confidence |
|----------|------|------|------------|
| **Docker** ✅ | Consistency, portability, isolation, ecosystem | Learning curve, slight overhead | **92%** |
| **Virtual Machines** | Strong isolation, full OS control | Heavy (GB per VM), slow startup, resource waste | **60%** |
| **Bare Metal** | Maximum performance, no overhead | Environment drift, hard to reproduce, manual setup | **50%** |
| **Platform-as-a-Service** | Zero config (Heroku, Render), easy deploy | Vendor lock-in, less control, higher cost at scale | **75%** |

**Why Docker Wins:**
- Balance of isolation, performance, and portability
- Industry standard (easy to find DevOps talent)
- Works with any cloud provider
- Docker Compose perfect for local development

**Confidence Level:** 92% - Modern standard for deployment.

---

### 6.2 Docker Configuration

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "src/server.js"]
```

**Docker Compose (Development):**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: notesapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/notesapp
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_change_in_production
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

**Confidence Level:** 90% - Standard Docker setup.

---

### 6.3 Production Deployment: **AWS Architecture**

**Decision Rationale:**
- **Market Leader:** 32% cloud market share, most mature services
- **Service Breadth:** EC2, RDS, ElastiCache, ALB, CloudWatch, S3 all integrated
- **Scalability:** Easy to add instances, read replicas, caching layers
- **Security:** VPC, Security Groups, IAM roles, KMS encryption
- **Cost:** Competitive pricing, free tier for testing

**AWS Services Used:**

| Service | Purpose | Reasoning |
|---------|---------|-----------|
| **EC2** | Host Node.js backend containers | Full control, cost-effective, auto-scaling groups |
| **RDS (PostgreSQL)** | Managed database | Automated backups, point-in-time recovery, read replicas |
| **ElastiCache (Redis)** | Managed cache/sessions | Automated failover, multi-AZ, Redis 7 support |
| **Application Load Balancer** | Distribute traffic, SSL termination | Sticky sessions for WebSockets, health checks |
| **S3 + CloudFront** | Serve static frontend (React SPA) | Global CDN, HTTPS, cache invalidation |
| **Route 53** | DNS management | Low latency, health checks |
| **CloudWatch** | Logging, metrics, alarms | Centralized logs, custom metrics, alerting |
| **Secrets Manager** | Store secrets (DB password, JWT secret) | Automatic rotation, encryption at rest |

**Architecture Diagram:**

```
                    ┌──────────────────────────────────────┐
                    │         Internet Users               │
                    └──────────────┬───────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────┐
                    │       Route 53 (DNS)                 │
                    │   notesapp.com → ALB / CloudFront    │
                    └──────────────┬───────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         │
┌─────────────────┐    ┌─────────────────────┐              │
│  CloudFront CDN │    │   Application LB    │              │
│   (Static SPA)  │    │   (API + WS)        │              │
└─────────────────┘    └──────────┬──────────┘              │
         │                         │                         │
         │                         │                         │
         ▼                         ▼                         │
┌─────────────────┐    ┌─────────────────────┐              │
│   S3 Bucket     │    │  EC2 Auto Scaling   │              │
│   (Frontend)    │    │  Group              │              │
│                 │    │  ┌────┐  ┌────┐     │              │
│  /index.html    │    │  │EC2 │  │EC2 │ ... │              │
│  /assets/*      │    │  │ 1  │  │ 2  │     │              │
└─────────────────┘    │  └────┘  └────┘     │              │
                       │  (Node.js Backend)  │              │
                       └──────────┬──────────┘              │
                                  │                         │
                   ┌──────────────┼──────────────┐          │
                   │              │              │          │
                   ▼              ▼              ▼          │
         ┌─────────────┐  ┌─────────────┐  ┌──────────┐    │
         │  RDS (PG)   │  │ ElastiCache │  │ Secrets  │    │
         │  Primary    │  │  (Redis)    │  │ Manager  │    │
         │             │  │             │  │          │    │
         │  ┌────────┐ │  │  Sessions   │  │ JWT Key  │    │
         │  │Replica │ │  │  Cache      │  │ DB Pass  │    │
         │  └────────┘ │  │  Socket.IO  │  └──────────┘    │
         └─────────────┘  └─────────────┘                   │
                                                            │
         ┌──────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   CloudWatch            │
│   - Logs (app, access)  │
│   - Metrics (CPU, RAM)  │
│   - Alarms (errors)     │
└─────────────────────────┘
```

**Alternatives Considered:**

| Provider | Pros | Cons | Confidence |
|----------|------|------|------------|
| **AWS** ✅ | Most mature, broadest services, excellent docs, large community | Can be expensive, complex pricing, steeper learning curve | **88%** |
| **Google Cloud** | Great Kubernetes (GKE), competitive pricing, BigQuery for analytics | Smaller market share, fewer third-party integrations | **80%** |
| **DigitalOcean** | Simple, affordable ($5/month droplets), great for startups | Limited services, less scalable, no managed Kubernetes | **75%** |
| **Heroku** | Easiest deployment (git push), zero config, great DX | Expensive at scale ($25-50/dyno), less control, vendor lock-in | **70%** |
| **Vercel/Netlify** | Perfect for frontend (React), serverless functions | Limited backend support, cold starts, not ideal for WebSockets | **65%** |

**Why AWS Wins:**
- Most comprehensive service offering (can build entire stack)
- RDS (PostgreSQL) and ElastiCache (Redis) are excellent managed services
- EC2 gives flexibility for WebSocket servers (long-lived connections)
- Can start small, scale to millions of users without re-platforming
- Industry standard (easy to find DevOps engineers)

**Cost Estimation (MVP - Single Region):**
- EC2 (2x t3.medium): ~$60/month
- RDS (db.t3.small): ~$30/month
- ElastiCache (cache.t3.micro): ~$15/month
- ALB: ~$20/month
- S3 + CloudFront: ~$10/month
- **Total:** ~$135/month (before scaling)

**Confidence Level:** 88% - AWS is the safe choice for production.

---

### 6.4 Alternative: **Heroku (Simplicity)**

**When to Choose Heroku:**
- MVP with small team (1-2 developers)
- Want to focus on product, not infrastructure
- Willing to pay premium for simplicity

**Heroku Architecture:**
```
heroku create notesapp
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

**Pros:**
- Deploy in 5 minutes (vs. hours of AWS setup)
- Automatic HTTPS, zero config
- Great for prototyping, demo, early-stage startup

**Cons:**
- Expensive at scale ($50-100/month for basic setup)
- Less control (can't SSH into dynos, limited config)
- Vendor lock-in (harder to migrate off)

**Confidence Level:** 70% - Great for MVP, not for production scale.

---

### 6.5 Alternative: **DigitalOcean (Cost)**

**When to Choose DigitalOcean:**
- Budget-conscious startup
- Moderate traffic (< 10k users)
- Team comfortable with DevOps

**DigitalOcean Architecture:**
- Droplets (VMs): $5-40/month
- Managed PostgreSQL: $15/month
- Managed Redis: $15/month
- Load Balancer: $10/month
- Spaces (S3-like): $5/month
- **Total:** ~$50-85/month

**Pros:**
- 50-70% cheaper than AWS for small scale
- Simpler pricing (flat monthly cost)
- Great documentation, community tutorials

**Cons:**
- Fewer advanced services (no Lambda, no DynamoDB, etc.)
- Less global presence (fewer data centers)
- Manual scaling (no auto-scaling groups)

**Confidence Level:** 75% - Good middle ground for startups.

---

### 6.6 CI/CD Pipeline: **GitHub Actions**

**Decision Rationale:**
- **Integration:** Built into GitHub (no external CI service)
- **Free:** 2,000 minutes/month for private repos
- **Powerful:** Matrix builds, Docker support, secrets management
- **Ecosystem:** Marketplace with 10k+ actions

**Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Build Docker images
      - name: Build Backend
        run: docker build -t notesapp-backend ./backend
      
      - name: Build Frontend
        run: docker build -t notesapp-frontend ./frontend
      
      # Push to ECR (AWS Container Registry)
      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag notesapp-backend:latest $ECR_REGISTRY/notesapp-backend:latest
          docker push $ECR_REGISTRY/notesapp-backend:latest
      
      # Deploy to EC2 (via SSH or CodeDeploy)
      - name: Deploy
        run: |
          aws ecs update-service --cluster notesapp --service backend --force-new-deployment
```

**Alternatives Considered:**

| Tool | Pros | Cons | Confidence |
|------|------|------|------------|
| **GitHub Actions** ✅ | Integrated, free tier, easy setup, YAML config | Limited to 6-hour jobs, 20 concurrent jobs | **90%** |
| **GitLab CI** | Generous free tier, powerful features, self-hosted option | Requires GitLab (not GitHub), steeper learning curve | **80%** |
| **CircleCI** | Fast builds, great Docker support, SSH debugging | Paid for private repos (after 30k credits), external service | **75%** |
| **Jenkins** | Self-hosted (free), infinitely customizable, plugins | Complex setup, maintenance burden, UI outdated | **65%** |

**Why GitHub Actions Wins:**
- Already using GitHub for version control
- Zero setup (just add YAML file)
- Free for small teams
- Excellent Docker and AWS integration

**Confidence Level:** 90% - Best choice for GitHub-hosted projects.

---

### 6.7 Monitoring: **Prometheus + Grafana + CloudWatch**

**Monitoring Stack:**

| Tool | Purpose | Metrics |
|------|---------|---------|
| **Prometheus** | Metrics collection | Request rate, latency, error rate, CPU, memory |
| **Grafana** | Visualization | Custom dashboards, alerts |
| **CloudWatch** | AWS-native logs/metrics | EC2 health, RDS performance, ALB traffic |
| **Sentry** (optional) | Error tracking | JavaScript errors, backend exceptions, stack traces |

**Key Metrics:**

1. **Application Metrics:**
   - Request rate (req/sec)
   - Response time (p50, p95, p99)
   - Error rate (5xx responses)
   - Active WebSocket connections
   - Operations per second (OT transformations)

2. **Infrastructure Metrics:**
   - CPU usage (EC2, RDS)
   - Memory usage
   - Disk I/O (PostgreSQL)
   - Network throughput
   - Cache hit rate (Redis)

3. **Business Metrics:**
   - Active users (DAU/MAU)
   - Notes created per day
   - Average collaboration session length
   - Conversion rate (signup → first note)

**Alerting Rules:**
- Error rate > 1% → Page on-call engineer
- Response time p95 > 1s → Warning
- Database CPU > 80% → Scale up RDS
- Disk usage > 90% → Alert
- Redis memory > 90% → Scale up ElastiCache

**Confidence Level:** 85% - Comprehensive monitoring setup.

---

### 6.8 Deployment Trade-offs Summary

**Cloud Provider:**
- **Decision:** AWS for production, DigitalOcean as budget alternative
- **Reasoning:** AWS most mature, DigitalOcean cheaper for small scale
- **Confidence:** 88%

**Containerization:**
- **Decision:** Docker for consistency, Docker Compose for local dev
- **Reasoning:** Industry standard, portability, reproducibility
- **Confidence:** 92%

**CI/CD:**
- **Decision:** GitHub Actions for automated deploys
- **Reasoning:** Free, integrated, easy to set up
- **Confidence:** 90%

---

## 7. SCALING CONSIDERATIONS

### 7.1 Horizontal Scaling: **Load Balancer + Multiple Instances**

**Architecture:**

```
                   ┌─────────────────┐
                   │  Load Balancer  │
                   │  (AWS ALB)      │
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
    ┌────────┐         ┌────────┐         ┌────────┐
    │ Node 1 │         │ Node 2 │         │ Node 3 │
    │ (EC2)  │         │ (EC2)  │         │ (EC2)  │
    └────────┘         └────────┘         └────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Redis Adapter  │ (Socket.IO cross-instance sync)
                   └─────────────────┘
```

**How It Works:**
1. ALB distributes HTTP requests across N backend instances
2. For WebSockets, ALB uses sticky sessions (route same user to same instance)
3. Socket.IO Redis adapter syncs events across all instances
4. When user A (on Node 1) edits note, event goes to Redis pub/sub
5. Redis broadcasts to all instances, Node 2 forwards to user B

**Sticky Sessions Configuration:**
```javascript
// ALB target group settings
{
  "stickiness": {
    "enabled": true,
    "type": "lb_cookie",
    "duration": 86400  // 24 hours
  }
}
```

**Socket.IO Redis Adapter:**
```javascript
// backend/src/sockets/index.js
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Scaling Triggers:**
- CPU > 70% for 5 minutes → Add instance
- CPU < 30% for 10 minutes → Remove instance
- Manual scaling for traffic spikes (Black Friday, launch day)

**Confidence Level:** 92% - Standard horizontal scaling pattern.

---

### 7.2 Database Scaling

**Strategy 1: Vertical Scaling (Easier)**
- Upgrade RDS instance class (db.t3.small → db.m5.large)
- Increases CPU, RAM, network throughput
- Works until ~50k concurrent users
- **Cost:** $30/month → $150/month

**Strategy 2: Read Replicas (Read-Heavy Workload)**
- Create 1-3 read replicas
- Route read queries (list notes, search) to replicas
- Write queries (create, update, delete) to primary
- **Replication lag:** < 100ms (acceptable for note list)

```javascript
// repositories/noteRepository.js
class NoteRepository {
  async findByOwner(ownerId) {
    // Read from replica
    return replicaDB.query('SELECT * FROM notes WHERE owner_id = $1', [ownerId]);
  }
  
  async create(note) {
    // Write to primary
    return primaryDB.query('INSERT INTO notes ...', [...]);
  }
}
```

**Strategy 3: Connection Pooling**
- Use PgBouncer or RDS Proxy
- Reduces connection overhead (PostgreSQL max connections: 100-500)
- Pools 1000 client connections → 50 DB connections

```javascript
// config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  max: 20,  // Max 20 connections per backend instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**Strategy 4: Sharding (Advanced - Not Needed Until 1M+ Users)**
- Split notes table by user_id (user hash % 4 = shard number)
- Route queries to appropriate shard
- **Complexity:** High (cross-shard queries, rebalancing)
- **Defer:** Only if other strategies exhausted

**Confidence Level:** 88% - Read replicas + connection pooling sufficient for 100k users.

---

### 7.3 Caching Strategy

**Cache Layers:**

1. **CDN (CloudFront):** Cache static assets (CSS, JS, images)
   - TTL: 1 year (cache-busting with hashed filenames)
   - Reduces origin requests by 95%

2. **Redis (Application Cache):** Cache frequently accessed data
   - User profiles: TTL 15 minutes
   - Note metadata (title, tags): TTL 5 minutes
   - Full note content: No cache (real-time data)

3. **Browser Cache:** Cache API responses on client
   - React Query cache: 5 minutes
   - Stale-while-revalidate pattern

**Cache Implementation:**
```javascript
// services/noteService.js
async function getNoteMetadata(noteId) {
  const cacheKey = `note:metadata:${noteId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Cache miss - query database
  const note = await noteRepo.findById(noteId);
  const metadata = { id: note.id, title: note.title, tags: note.tags, updatedAt: note.updated_at };
  
  // Store in cache
  await redis.setex(cacheKey, 300, JSON.stringify(metadata));  // 5 min TTL
  
  return metadata;
}
```

**Cache Invalidation:**
- On note update: Delete cache key for that note
- On note delete: Delete cache key + collaborator cache
- Use cache tags for batch invalidation

**Confidence Level:** 90% - Multi-layer caching is essential for performance.

---

### 7.4 Rate Limiting

**Strategy:** Token bucket algorithm with Redis

**Limits:**
- **Anonymous users:** 10 req/min (signup, login)
- **Authenticated users:** 100 req/min (API)
- **WebSocket operations:** 50 operations/min (prevent spam)

**Implementation:**
```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 60 * 1000,  // 1 minute
  max: 100,  // 100 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});

app.use('/api/', limiter);
```

**WebSocket Rate Limiting:**
```javascript
// Track operations per user per minute
const operationCounts = new Map();

socket.on('note:operation', (data) => {
  const userId = socket.userId;
  const count = operationCounts.get(userId) || 0;
  
  if (count > 50) {
    socket.emit('error', 'Rate limit exceeded');
    return;
  }
  
  operationCounts.set(userId, count + 1);
  setTimeout(() => operationCounts.delete(userId), 60000);  // Reset after 1 min
  
  // Process operation...
});
```

**Confidence Level:** 88% - Essential for preventing abuse.

---

### 7.5 Capacity Planning

**Assumptions:**
- Target: 10,000 concurrent users
- Average note size: 10 KB
- Active editing session: 5 minutes
- Operations per minute: 10 (one keystroke every 6 seconds)

**Backend Capacity:**
- 1 EC2 t3.medium: ~1,000 WebSocket connections
- Need: 10 instances for 10k concurrent users
- Auto-scaling: Min 3, Max 15 instances

**Database Capacity:**
- Notes table: 100k users × 50 notes × 10 KB = 50 GB
- Operations table: 100k notes × 1000 ops × 500 bytes = 50 GB
- Total: 100 GB (db.t3.large handles this easily)

**Redis Capacity:**
- Sessions: 10k users × 200 bytes = 2 MB
- Cache: 10k notes × 1 KB = 10 MB
- Socket.IO adapter: ~10 MB
- Total: 25 MB (cache.t3.micro with 1 GB RAM is overkill)

**Bandwidth:**
- 10k concurrent users × 10 ops/min × 500 bytes = 50 MB/min = 833 KB/s
- AWS data transfer: 1 TB/month free, then $0.09/GB
- Estimated: 2 TB/month = $90/month

**Cost Scaling:**

| Users | EC2 Instances | RDS | ElastiCache | Total/Month |
|-------|---------------|-----|-------------|-------------|
| 1k | 2 | db.t3.small | cache.t3.micro | $105 |
| 10k | 10 | db.m5.large | cache.m5.large | $850 |
| 100k | 100 | db.m5.4xlarge + replicas | cache.m5.2xlarge | $8,000 |

**Confidence Level:** 80% - Estimates based on industry benchmarks.

---

### 7.6 Load Testing

**Tools:**
- **Artillery:** HTTP and WebSocket load testing
- **k6:** Modern load testing (JavaScript-based)
- **Apache JMeter:** Comprehensive, GUI-based

**Test Scenarios:**
1. **API Load Test:** 1000 req/sec to GET /api/notes
2. **WebSocket Load Test:** 10k concurrent connections, 10 ops/min each
3. **Spike Test:** Sudden traffic spike (0 → 5k users in 1 minute)
4. **Soak Test:** Sustained 5k users for 1 hour (detect memory leaks)

**Artillery Example:**
```yaml
# loadtest/websocket.yml
config:
  target: 'wss://api.notesapp.com'
  phases:
    - duration: 60
      arrivalRate: 100  # 100 new connections per second
  engines:
    socketio: {}

scenarios:
  - name: "Collaborative editing"
    engine: socketio
    flow:
      - emit:
          channel: "note:join"
          data:
            noteId: "{{ $randomString() }}"
      - think: 5
      - emit:
          channel: "note:operation"
          data:
            operation: { type: "insert", position: 10, text: "Hello" }
      - think: 10
```

**Success Criteria:**
- p95 latency < 200ms
- Error rate < 0.1%
- No memory leaks (stable memory over 1 hour)
- Graceful degradation under overload

**Confidence Level:** 85% - Load testing validates scaling strategy.

---

### 7.7 Scaling Trade-offs Summary

**Horizontal vs Vertical Scaling:**
- **Decision:** Horizontal for backend, vertical for database (until replicas needed)
- **Reasoning:** Backend is stateless (easy to scale), database is stateful (vertical first)
- **Confidence:** 90%

**Caching:**
- **Decision:** Redis for app cache, CloudFront for CDN
- **Reasoning:** Redis integrates with Socket.IO adapter, CloudFront reduces origin load
- **Confidence:** 92%

**Database Scaling:**
- **Decision:** Read replicas for read-heavy queries, connection pooling
- **Reasoning:** Defer sharding complexity until absolutely necessary (1M+ users)
- **Confidence:** 88%

---

## 8. SECURITY CONCERNS

### 8.1 HTTPS/TLS Enforcement

**Implementation:**
- **ALB:** Terminate SSL at load balancer (ACM certificate)
- **CloudFront:** HTTPS for static assets (free SSL certificate)
- **HSTS Header:** Force HTTPS for 1 year

```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
});

// HSTS header
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

**Confidence Level:** 95% - HTTPS is mandatory for production apps.

---

### 8.2 CSRF Protection

**Strategy:** CSRF tokens for state-changing operations (REST API), SameSite cookies

**Implementation:**
```javascript
const csrf = require('csurf');

// CSRF protection for forms
app.use(csrf({ cookie: true }));

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend sends token in header
axios.post('/api/notes', data, {
  headers: { 'X-CSRF-Token': csrfToken }
});
```

**SameSite Cookies:**
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'  // Prevents CSRF (cookie not sent with cross-site requests)
});
```

**Confidence Level:** 90% - SameSite cookies provide good CSRF protection.

---

### 8.3 XSS Prevention

**Strategies:**

1. **Content Security Policy (CSP):**
```javascript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' cdn.socket.io; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' wss://api.notesapp.com"
  );
  next();
});
```

2. **Input Sanitization:**
```javascript
const sanitizeHtml = require('sanitize-html');

// Sanitize user input before storing
const clean = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: { 'a': ['href'] }
});
```

3. **Output Encoding:**
   - React automatically escapes JSX content (protection against XSS)
   - Be careful with `dangerouslySetInnerHTML` (avoid if possible)

**Confidence Level:** 92% - CSP + React's escaping provides strong XSS protection.

---

### 8.4 SQL Injection Prevention

**Strategy:** Use parameterized queries (never string concatenation)

**Bad (Vulnerable):**
```javascript
const query = `SELECT * FROM users WHERE email = '${email}'`;  // ❌ SQL injection
db.query(query);
```

**Good (Safe):**
```javascript
const query = 'SELECT * FROM users WHERE email = $1';  // ✅ Parameterized
db.query(query, [email]);
```

**ORM (Sequelize/TypeORM):**
```javascript
// Sequelize automatically escapes parameters
User.findOne({ where: { email } });  // ✅ Safe
```

**Confidence Level:** 95% - Parameterized queries eliminate SQL injection.

---

### 8.5 Authentication Security

**Password Hashing:**
- **Algorithm:** bcrypt with 12 salt rounds
- **Rationale:** Intentionally slow (prevents brute force), automatic salt

**JWT Security:**
- **Algorithm:** HS256 (HMAC SHA-256)
- **Secret:** 256-bit random string (stored in AWS Secrets Manager)
- **Expiry:** 15 minutes for access tokens
- **Signature Verification:** Always verify signature before trusting payload

**Multi-Factor Authentication (MFA) - Optional:**
- TOTP (Time-Based One-Time Password) using `speakeasy` library
- Backup codes for account recovery
- SMS fallback (via Twilio)

**Confidence Level:** 93% - Industry-standard authentication security.

---

### 8.6 Rate Limiting (Already Covered in Scaling)

**Additional Security-Focused Limits:**

- **Login attempts:** 5 failed attempts → 15-minute lockout (prevent brute force)
- **Signup:** 3 signups per IP per hour (prevent spam accounts)
- **Password reset:** 3 requests per email per hour

```javascript
// Login rate limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts
  keyGenerator: (req) => req.body.email,
  skipSuccessfulRequests: true  // Only count failed attempts
});

app.post('/api/auth/login', loginLimiter, loginController);
```

**Confidence Level:** 90% - Essential for preventing brute force attacks.

---

### 8.7 Data Privacy

**Encryption at Rest:**
- **RDS:** Enable encryption at rest (AES-256)
- **S3:** Enable default encryption for buckets
- **Redis:** ElastiCache encryption at rest

**Encryption in Transit:**
- **HTTPS:** All client-server communication over TLS 1.2+
- **WebSocket Secure (WSS):** Encrypted WebSocket connections
- **Database:** Use SSL for database connections

**GDPR Compliance:**
- **Data Export:** Allow users to download all their data (JSON export)
- **Data Deletion:** Hard delete user data on account deletion (GDPR "right to be forgotten")
- **Privacy Policy:** Clearly state what data is collected and how it's used

```javascript
// GDPR data export
app.get('/api/user/export', authenticate, async (req, res) => {
  const userId = req.user.id;
  const user = await userRepo.findById(userId);
  const notes = await noteRepo.findByOwner(userId);
  
  res.json({
    user: { email: user.email, username: user.username, createdAt: user.created_at },
    notes: notes.map(n => ({ title: n.title, content: n.content, createdAt: n.created_at }))
  });
});

// GDPR data deletion
app.delete('/api/user/account', authenticate, async (req, res) => {
  const userId = req.user.id;
  await userRepo.hardDelete(userId);  // Cascade deletes notes, collaborators
  res.json({ success: true });
});
```

**Confidence Level:** 88% - Meets GDPR requirements.

---

### 8.8 Logging and Audit Trails

**What to Log:**
- **Authentication:** Login attempts (success/failure), password changes
- **Authorization:** Permission denials, role changes
- **Data Access:** Note views (for audit trail)
- **Data Modification:** Note edits, deletions (stored in operations table)
- **Errors:** 5xx errors, exceptions, stack traces

**What NOT to Log:**
- Passwords (even hashed)
- JWT secrets
- Credit card numbers
- Personal identifiable information (PII) unless necessary

**Log Levels:**
- **ERROR:** Application errors, exceptions
- **WARN:** Suspicious activity (failed login attempts)
- **INFO:** Important events (user signup, note created)
- **DEBUG:** Development debugging (disable in production)

**Log Aggregation:**
```javascript
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new CloudWatchTransport({
      logGroupName: 'notesapp-backend',
      logStreamName: `${process.env.NODE_ENV}-${process.env.INSTANCE_ID}`
    })
  ]
});

logger.info('User logged in', { userId, email, ip: req.ip });
```

**Confidence Level:** 87% - Comprehensive logging for security and debugging.

---

### 8.9 Dependency Scanning

**Strategy:** Automated vulnerability scanning with `npm audit` and Dependabot

**GitHub Dependabot:**
- Automatically creates PRs for dependency updates
- Alerts for known vulnerabilities (CVEs)
- Suggests version upgrades

**CI/CD Integration:**
```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk scan
        run: npx snyk test --severity-threshold=high
```

**Regular Updates:**
- Update dependencies monthly (minor versions)
- Update immediately for security patches
- Test updates in staging before production

**Confidence Level:** 85% - Automated scanning catches most vulnerabilities.

---

### 8.10 Security Trade-offs Summary

**JWT vs Sessions:**
- **Decision:** JWT (stateless) with refresh tokens (stateful, revocable)
- **Reasoning:** Balance of scalability and security
- **Confidence:** 92%

**CSRF Protection:**
- **Decision:** SameSite cookies + CSRF tokens for forms
- **Reasoning:** Defense in depth (two layers of protection)
- **Confidence:** 90%

**Data Encryption:**
- **Decision:** Encryption at rest (database) and in transit (HTTPS)
- **Reasoning:** Protects data if storage or network is compromised
- **Confidence:** 95%

---

## SYSTEM ARCHITECTURE DIAGRAM

**Complete System Overview:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite)                                                │  │
│  │  - Zustand (State)                                               │  │
│  │  - React Router (Routing)                                        │  │
│  │  - Slate.js (Rich Text Editor)                                   │  │
│  │  - Socket.IO Client (Real-time)                                  │  │
│  │  - React Query (REST API)                                        │  │
│  │  - Tailwind CSS (Styling)                                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
          │                                          │
          │ HTTPS (REST API)                         │ WSS (WebSocket)
          ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              CDN / EDGE LAYER                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────────────────────┐  │
│  │  CloudFront     │              │  Application Load Balancer      │  │
│  │  (Static SPA)   │              │  (SSL Termination)              │  │
│  │  - Cache: 1yr   │              │  - Sticky Sessions (WebSocket)  │  │
│  └─────────────────┘              └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     │                      │                      │
                     ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER (EC2)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│  │  Backend 1     │    │  Backend 2     │    │  Backend N     │        │
│  │  (Node.js)     │    │  (Node.js)     │    │  (Node.js)     │        │
│  │                │    │                │    │                │        │
│  │  - Express.js  │    │  - Express.js  │    │  - Express.js  │        │
│  │  - Socket.IO   │    │  - Socket.IO   │    │  - Socket.IO   │        │
│  │  - OT Engine   │    │  - OT Engine   │    │  - OT Engine   │        │
│  │  - Bull Queue  │    │  - Bull Queue  │    │  - Bull Queue  │        │
│  └────────┬───────┘    └────────┬───────┘    └────────┬───────┘        │
│           └─────────────────────┼─────────────────────┘                │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │
                     ┌────────────┼────────────┐
                     │            │            │
                     ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA / CACHE LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────┐       ┌────────────────────────────┐    │
│  │  PostgreSQL (RDS)        │       │  Redis (ElastiCache)       │    │
│  │  ┌────────────────────┐  │       │  ┌──────────────────────┐  │    │
│  │  │  Primary (Write)   │  │       │  │  Sessions            │  │    │
│  │  └────────┬───────────┘  │       │  │  Cache               │  │    │
│  │           │ Replication  │       │  │  Rate Limiting       │  │    │
│  │  ┌────────▼───────────┐  │       │  │  Socket.IO Adapter   │  │    │
│  │  │  Replica (Read)    │  │       │  │  Bull Queue          │  │    │
│  │  └────────────────────┘  │       │  └──────────────────────┘  │    │
│  │                          │       │                            │    │
│  │  Tables:                 │       └────────────────────────────┘    │
│  │  - users                 │                                         │
│  │  - notes                 │                                         │
│  │  - note_collaborators    │                                         │
│  │  - note_versions         │                                         │
│  │  - operations            │                                         │
│  │  - refresh_tokens        │                                         │
│  └──────────────────────────┘                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MONITORING / OBSERVABILITY                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────┐ │
│  │  CloudWatch     │  │  Prometheus +   │  │  Sentry               │ │
│  │  - Logs         │  │  Grafana        │  │  - Error Tracking     │ │
│  │  - Metrics      │  │  - Custom       │  │  - Stack Traces       │ │
│  │  - Alarms       │  │    Dashboards   │  │  - Performance        │ │
│  └─────────────────┘  └─────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## RISK ASSESSMENT

### High-Risk Areas

1. **Operational Transform Complexity:**
   - **Risk:** OT is notoriously difficult to implement correctly
   - **Mitigation:** Use battle-tested library (ShareDB, ot.js), extensive testing
   - **Confidence:** 75%

2. **WebSocket Scaling:**
   - **Risk:** Sticky sessions can cause uneven load distribution
   - **Mitigation:** Monitor per-instance connection counts, use Redis adapter
   - **Confidence:** 82%

3. **Database Bottleneck:**
   - **Risk:** PostgreSQL becomes bottleneck under high write load
   - **Mitigation:** Connection pooling, read replicas, caching, defer sharding
   - **Confidence:** 85%

### Medium-Risk Areas

1. **Cost Overruns:**
   - **Risk:** AWS costs can spiral quickly with auto-scaling
   - **Mitigation:** Set billing alarms, monitor CloudWatch costs, optimize instances
   - **Confidence:** 80%

2. **Security Vulnerabilities:**
   - **Risk:** XSS, CSRF, SQL injection, dependency vulnerabilities
   - **Mitigation:** CSP, parameterized queries, Dependabot, regular audits
   - **Confidence:** 88%

### Low-Risk Areas

1. **Frontend Framework Choice:**
   - **Risk:** React becomes obsolete or unmaintained
   - **Mitigation:** React has 10+ year track record, massive ecosystem
   - **Confidence:** 95%

2. **Cloud Provider Lock-in:**
   - **Risk:** Difficult to migrate off AWS
   - **Mitigation:** Use Docker (portable), avoid AWS-specific services (Lambda, DynamoDB) for now
   - **Confidence:** 85%

---

## CONCLUSION

This architecture design provides a **production-ready, scalable, and secure** foundation for a real-time collaborative note-taking application. Key strengths:

✅ **Battle-Tested Stack:** React, Node.js, PostgreSQL, Redis, AWS - all proven at scale  
✅ **Clear Scaling Path:** Horizontal scaling (backend), read replicas (database), multi-layer caching  
✅ **Security First:** HTTPS, JWT + refresh tokens, CSRF/XSS protection, encryption at rest/transit  
✅ **Real-Time Excellence:** Operational Transform for conflict resolution, WebSocket for low latency  
✅ **Developer Experience:** Vite (fast builds), Docker (consistent environments), GitHub Actions (automated deploys)  
✅ **Monitoring:** CloudWatch, Prometheus, Grafana for observability  

**Overall Confidence:** **87%** - This architecture balances proven technologies with modern best practices, providing a solid foundation for building a competitive collaborative note-taking app.

**Next Steps:**
1. Implement MVP with core features (auth, notes CRUD, basic real-time sync)
2. Load test with 1k concurrent users to validate scaling assumptions
3. Iterate based on user feedback and performance metrics
4. Gradually add advanced features (version history, export, advanced sharing)

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation
