# API Documentation

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Format](#error-format)
- [Rate Limiting](#rate-limiting)
- [Authentication Endpoints](#authentication-endpoints)
- [User Endpoints](#user-endpoints)
- [Note Endpoints](#note-endpoints)
- [Collaboration Endpoints](#collaboration-endpoints)
- [Tag Endpoints](#tag-endpoints)
- [Search Endpoints](#search-endpoints)
- [Health/Metrics Endpoints](#healthmetrics-endpoints)

## Base URL

```
https://api.syncnote.example.com
```

## Authentication

SyncNote uses JWT access and refresh tokens.

- **Authorization header**: `Authorization: Bearer <access_token>`
- **Refresh token**: `HttpOnly` cookie or response field, depending on client.

## Error Format

```json
{
  "error": {
    "code": "AUTH_INVALID",
    "message": "Access token is invalid or expired",
    "details": {}
  }
}
```

## Rate Limiting

- 100 requests per minute per user
- Returns `429 Too Many Requests`
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

---

## Authentication Endpoints

### POST /api/auth/signup

**Headers**
- `Content-Type: application/json`

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "name": "Ada Lovelace"
}
```

**Response 201**
```json
{
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "Ada Lovelace"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

**Status Codes**
- `201 Created`
- `400 Bad Request`
- `409 Conflict`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPassword123!","name":"Ada Lovelace"}'
```

### POST /api/auth/login

**Headers**
- `Content-Type: application/json`

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response 200**
```json
{
  "user": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "Ada Lovelace"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"StrongPassword123!"}'
```

### POST /api/auth/refresh

**Headers**
- `Content-Type: application/json`

**Request Body**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response 200**
```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token"
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"jwt-refresh-token"}'
```

### POST /api/auth/logout

**Headers**
- `Authorization: Bearer <access_token>`

**Response 204**

**Status Codes**
- `204 No Content`
- `401 Unauthorized`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

---

## User Endpoints

### GET /api/users/:id

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "name": "Ada Lovelace",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/users/usr_123 \
  -H "Authorization: Bearer <access_token>"
```

### PUT /api/users/:id

**Headers**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Request Body**
```json
{
  "name": "Grace Hopper",
  "timezone": "UTC"
}
```

**Response 200**
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "name": "Grace Hopper",
  "timezone": "UTC",
  "updatedAt": "2024-01-02T10:00:00Z"
}
```

**Status Codes**
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`

**Curl Example**
```bash
curl -X PUT https://api.syncnote.example.com/api/users/usr_123 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Grace Hopper","timezone":"UTC"}'
```

### GET /api/users/:id/profile

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "id": "usr_123",
  "name": "Ada Lovelace",
  "bio": "Mathematician and software pioneer",
  "avatarUrl": "https://cdn.syncnote.example.com/avatars/usr_123.png"
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/users/usr_123/profile \
  -H "Authorization: Bearer <access_token>"
```

---

## Note Endpoints

### POST /api/notes (create)

**Headers**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Request Body**
```json
{
  "title": "Project Launch",
  "content": "Kickoff notes...",
  "tags": ["launch", "planning"]
}
```

**Response 201**
```json
{
  "id": "note_123",
  "title": "Project Launch",
  "content": "Kickoff notes...",
  "tags": ["launch", "planning"],
  "createdAt": "2024-01-01T12:00:00Z"
}
```

**Status Codes**
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/notes \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Project Launch","content":"Kickoff notes...","tags":["launch","planning"]}'
```

### GET /api/notes (list)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "data": [
    {
      "id": "note_123",
      "title": "Project Launch",
      "updatedAt": "2024-01-01T12:00:00Z",
      "tags": ["launch", "planning"]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/notes?page=1&pageSize=20 \
  -H "Authorization: Bearer <access_token>"
```

### GET /api/notes/:id (get single)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "id": "note_123",
  "title": "Project Launch",
  "content": "Kickoff notes...",
  "tags": ["launch", "planning"],
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/notes/note_123 \
  -H "Authorization: Bearer <access_token>"
```

### PUT /api/notes/:id (update)

**Headers**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Request Body**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["update"]
}
```

**Response 200**
```json
{
  "id": "note_123",
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["update"],
  "updatedAt": "2024-01-02T12:00:00Z"
}
```

**Status Codes**
- `200 OK`
- `400 Bad Request`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl -X PUT https://api.syncnote.example.com/api/notes/note_123 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title","content":"Updated content","tags":["update"]}'
```

### DELETE /api/notes/:id (delete)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 204**

**Status Codes**
- `204 No Content`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl -X DELETE https://api.syncnote.example.com/api/notes/note_123 \
  -H "Authorization: Bearer <access_token>"
```

### GET /api/notes/:id/history (edit history)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "noteId": "note_123",
  "history": [
    {
      "version": 1,
      "content": "Original content",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/notes/note_123/history \
  -H "Authorization: Bearer <access_token>"
```

### POST /api/notes/:id/sync (offline sync)

**Headers**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Request Body**
```json
{
  "clientVersion": 3,
  "changes": [
    {
      "op": "replace",
      "path": "/content",
      "value": "Offline changes"
    }
  ]
}
```

**Response 200**
```json
{
  "noteId": "note_123",
  "serverVersion": 4,
  "merged": true
}
```

**Status Codes**
- `200 OK`
- `409 Conflict`
- `401 Unauthorized`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/notes/note_123/sync \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"clientVersion":3,"changes":[{"op":"replace","path":"/content","value":"Offline changes"}]}'
```

---

## Collaboration Endpoints

### POST /api/notes/:id/collaborators (add)

**Headers**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Request Body**
```json
{
  "userId": "usr_456",
  "role": "editor"
}
```

**Response 201**
```json
{
  "noteId": "note_123",
  "userId": "usr_456",
  "role": "editor"
}
```

**Status Codes**
- `201 Created`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/notes/note_123/collaborators \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"usr_456","role":"editor"}'
```

### DELETE /api/notes/:id/collaborators/:userId (remove)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 204**

**Status Codes**
- `204 No Content`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl -X DELETE https://api.syncnote.example.com/api/notes/note_123/collaborators/usr_456 \
  -H "Authorization: Bearer <access_token>"
```

### GET /api/notes/:id/collaborators (list)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "noteId": "note_123",
  "collaborators": [
    {
      "id": "usr_456",
      "name": "Alan Turing",
      "role": "editor"
    }
  ]
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/notes/note_123/collaborators \
  -H "Authorization: Bearer <access_token>"
```

### GET /api/notes/:id/active-users (live collaborators)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "noteId": "note_123",
  "activeUsers": [
    {
      "id": "usr_456",
      "name": "Alan Turing",
      "lastSeen": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/notes/note_123/active-users \
  -H "Authorization: Bearer <access_token>"
```

---

## Tag Endpoints

### POST /api/tags (create)

**Headers**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Request Body**
```json
{
  "name": "planning"
}
```

**Response 201**
```json
{
  "id": "tag_123",
  "name": "planning"
}
```

**Status Codes**
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/tags \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"planning"}'
```

### GET /api/tags (list)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "data": [
    {
      "id": "tag_123",
      "name": "planning"
    }
  ]
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/tags \
  -H "Authorization: Bearer <access_token>"
```

### GET /api/tags/suggestions (autocomplete)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "data": [
    "planning",
    "project"
  ]
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/tags/suggestions?q=pla \
  -H "Authorization: Bearer <access_token>"
```

### POST /api/notes/:id/tags (add to note)

**Headers**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Request Body**
```json
{
  "tagId": "tag_123"
}
```

**Response 201**
```json
{
  "noteId": "note_123",
  "tagId": "tag_123"
}
```

**Status Codes**
- `201 Created`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl -X POST https://api.syncnote.example.com/api/notes/note_123/tags \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"tagId":"tag_123"}'
```

### DELETE /api/notes/:id/tags/:tagId (remove from note)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 204**

**Status Codes**
- `204 No Content`
- `401 Unauthorized`
- `404 Not Found`

**Curl Example**
```bash
curl -X DELETE https://api.syncnote.example.com/api/notes/note_123/tags/tag_123 \
  -H "Authorization: Bearer <access_token>"
```

---

## Search Endpoints

### GET /api/search (full-text search)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "query": "launch",
  "results": [
    {
      "id": "note_123",
      "title": "Project Launch",
      "snippet": "Kickoff notes..."
    }
  ]
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/search?q=launch \
  -H "Authorization: Bearer <access_token>"
```

### GET /api/search/notes (search notes)

**Headers**
- `Authorization: Bearer <access_token>`

**Response 200**
```json
{
  "query": "planning",
  "results": [
    {
      "id": "note_123",
      "title": "Project Planning",
      "snippet": "Planning notes..."
    }
  ]
}
```

**Status Codes**
- `200 OK`
- `401 Unauthorized`

**Curl Example**
```bash
curl https://api.syncnote.example.com/api/search/notes?q=planning \
  -H "Authorization: Bearer <access_token>"
```

---

## Health/Metrics Endpoints

### GET /health

**Response 200**
```json
{
  "status": "ok",
  "uptime": 12345
}
```

**Curl Example**
```bash
curl https://api.syncnote.example.com/health
```

### GET /metrics

**Response 200**
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/health"} 1024
```

**Curl Example**
```bash
curl https://api.syncnote.example.com/metrics
```
