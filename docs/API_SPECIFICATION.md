# API Specification

## Overview

This document provides the complete REST API specification for the collaborative note-taking application.

**Base URL:** `https://api.notesapp.com/api/v1`  
**Authentication:** Bearer token (JWT) in `Authorization` header  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Endpoints](#user-endpoints)
3. [Notes Endpoints](#notes-endpoints)
4. [Collaboration Endpoints](#collaboration-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Error Responses](#error-responses)

---

## Authentication Endpoints

### Register New User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe"
}
```

**Validation:**
- `email`: Valid email format, unique
- `password`: Min 8 characters, must include uppercase, lowercase, number
- `username`: 3-50 characters, alphanumeric

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "random-token-string"
}
```

**Set-Cookie:** `refreshToken=...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

**Errors:**
- `400 Bad Request` - Invalid input data
- `409 Conflict` - Email already exists

---

### Login

**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "username": "johndoe",
    "avatarUrl": "https://cdn.example.com/avatars/123.jpg",
    "lastLoginAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "random-token-string"
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded (5 attempts per 15 min)

---

### Refresh Access Token

**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Headers:**
```
Cookie: refreshToken=...
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### Logout

**POST** `/auth/logout`

Revoke refresh token and logout user.

**Request Headers:**
```
Authorization: Bearer {accessToken}
Cookie: refreshToken=...
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### Get User Profile

**GET** `/user/profile`

Get authenticated user's profile.

**Request Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-123",
  "email": "user@example.com",
  "username": "johndoe",
  "avatarUrl": "https://cdn.example.com/avatars/123.jpg",
  "settings": {
    "theme": "dark",
    "notifications": true
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### Update User Profile

**PATCH** `/user/profile`

Update user profile information.

**Request Body:**
```json
{
  "username": "newusername",
  "avatarUrl": "https://cdn.example.com/avatars/456.jpg"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-123",
  "email": "user@example.com",
  "username": "newusername",
  "avatarUrl": "https://cdn.example.com/avatars/456.jpg",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid data
- `409 Conflict` - Username already taken

---

### Update User Settings

**PATCH** `/user/settings`

Update user preferences.

**Request Body:**
```json
{
  "theme": "dark",
  "notifications": true,
  "editorFontSize": 14
}
```

**Response:** `200 OK`
```json
{
  "theme": "dark",
  "notifications": true,
  "editorFontSize": 14
}
```

---

### Export User Data (GDPR)

**GET** `/user/export`

Export all user data (GDPR compliance).

**Response:** `200 OK`
```json
{
  "user": {
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "notes": [
    {
      "id": "note-uuid-1",
      "title": "My Note",
      "content": { ... },
      "createdAt": "2024-01-05T10:00:00Z",
      "updatedAt": "2024-01-10T14:30:00Z"
    }
  ],
  "collaborations": [
    {
      "noteId": "note-uuid-2",
      "noteTitle": "Shared Note",
      "permission": "edit",
      "addedAt": "2024-01-08T09:00:00Z"
    }
  ]
}
```

---

### Delete User Account

**DELETE** `/user/account`

Permanently delete user account and all associated data.

**Request Body:**
```json
{
  "password": "SecurePass123!",
  "confirm": "DELETE"
}
```

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

**Errors:**
- `401 Unauthorized` - Incorrect password
- `400 Bad Request` - Confirmation text mismatch

---

## Notes Endpoints

### List User's Notes

**GET** `/notes`

Get all notes owned by or shared with the user.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20, max: 100) - Items per page
- `sort` (optional, default: `updatedAt:desc`) - Sort field and direction
- `tag` (optional) - Filter by tag
- `search` (optional) - Full-text search query

**Request Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "notes": [
    {
      "id": "uuid-456",
      "title": "Meeting Notes",
      "tags": ["work", "important"],
      "isOwner": true,
      "permission": "admin",
      "collaborators": [
        {
          "userId": "uuid-789",
          "username": "alice",
          "avatarUrl": "https://cdn.example.com/avatars/789.jpg"
        }
      ],
      "createdAt": "2024-01-10T09:00:00Z",
      "updatedAt": "2024-01-15T14:30:00Z",
      "lastEditBy": {
        "userId": "uuid-123",
        "username": "johndoe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Example Queries:**
```
GET /notes?search=meeting&tag=work
GET /notes?sort=title:asc&limit=50
GET /notes?page=2
```

---

### Get Single Note

**GET** `/notes/:id`

Get full note details including content.

**Request Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-456",
  "title": "Meeting Notes",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          { "type": "text", "text": "Meeting with team..." }
        ]
      }
    ]
  },
  "tags": ["work", "important"],
  "version": 42,
  "owner": {
    "id": "uuid-123",
    "username": "johndoe",
    "avatarUrl": "https://cdn.example.com/avatars/123.jpg"
  },
  "collaborators": [
    {
      "userId": "uuid-789",
      "username": "alice",
      "permission": "edit",
      "addedAt": "2024-01-10T10:00:00Z"
    }
  ],
  "createdAt": "2024-01-10T09:00:00Z",
  "updatedAt": "2024-01-15T14:30:00Z"
}
```

**Errors:**
- `404 Not Found` - Note doesn't exist
- `403 Forbidden` - No access to note

---

### Create Note

**POST** `/notes`

Create a new note.

**Request Body:**
```json
{
  "title": "New Note",
  "content": {
    "type": "doc",
    "content": []
  },
  "tags": ["personal"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-new",
  "title": "New Note",
  "content": { "type": "doc", "content": [] },
  "tags": ["personal"],
  "version": 1,
  "owner": {
    "id": "uuid-123",
    "username": "johndoe"
  },
  "createdAt": "2024-01-15T15:00:00Z",
  "updatedAt": "2024-01-15T15:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid content structure

---

### Update Note Metadata

**PATCH** `/notes/:id`

Update note title, tags (not content - use WebSocket for real-time editing).

**Request Body:**
```json
{
  "title": "Updated Title",
  "tags": ["work", "important", "urgent"]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-456",
  "title": "Updated Title",
  "tags": ["work", "important", "urgent"],
  "updatedAt": "2024-01-15T15:30:00Z"
}
```

**Errors:**
- `403 Forbidden` - Insufficient permissions (need edit or admin)
- `404 Not Found` - Note doesn't exist

---

### Delete Note

**DELETE** `/notes/:id`

Delete a note (soft delete - sets is_deleted flag).

**Request Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:** `200 OK`
```json
{
  "message": "Note deleted successfully"
}
```

**Errors:**
- `403 Forbidden` - Only owner can delete notes
- `404 Not Found` - Note doesn't exist

---

### Search Notes

**GET** `/notes/search`

Full-text search across notes.

**Query Parameters:**
- `q` (required) - Search query
- `limit` (optional, default: 20)

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "uuid-456",
      "title": "Meeting Notes",
      "excerpt": "...text snippet with <mark>search term</mark> highlighted...",
      "tags": ["work"],
      "updatedAt": "2024-01-15T14:30:00Z",
      "relevance": 0.85
    }
  ],
  "total": 5
}
```

---

## Collaboration Endpoints

### List Collaborators

**GET** `/notes/:id/collaborators`

Get list of users with access to the note.

**Response:** `200 OK`
```json
{
  "collaborators": [
    {
      "userId": "uuid-789",
      "email": "alice@example.com",
      "username": "alice",
      "avatarUrl": "https://cdn.example.com/avatars/789.jpg",
      "permission": "edit",
      "addedAt": "2024-01-10T10:00:00Z",
      "addedBy": {
        "userId": "uuid-123",
        "username": "johndoe"
      }
    }
  ]
}
```

---

### Add Collaborator

**POST** `/notes/:id/collaborators`

Invite a user to collaborate on a note.

**Request Body:**
```json
{
  "email": "bob@example.com",
  "permission": "edit"
}
```

**Validation:**
- `permission`: Must be `view`, `edit`, or `admin`

**Response:** `201 Created`
```json
{
  "userId": "uuid-abc",
  "email": "bob@example.com",
  "username": "bob",
  "permission": "edit",
  "addedAt": "2024-01-15T16:00:00Z"
}
```

**Errors:**
- `403 Forbidden` - Only owner and admins can add collaborators
- `404 Not Found` - User with email doesn't exist
- `409 Conflict` - User already has access to note

---

### Update Collaborator Permission

**PATCH** `/notes/:id/collaborators/:userId`

Change a collaborator's permission level.

**Request Body:**
```json
{
  "permission": "view"
}
```

**Response:** `200 OK`
```json
{
  "userId": "uuid-abc",
  "permission": "view",
  "updatedAt": "2024-01-15T16:30:00Z"
}
```

**Errors:**
- `403 Forbidden` - Only owner can change permissions

---

### Remove Collaborator

**DELETE** `/notes/:id/collaborators/:userId`

Remove user's access to a note.

**Response:** `200 OK`
```json
{
  "message": "Collaborator removed successfully"
}
```

**Errors:**
- `403 Forbidden` - Only owner can remove collaborators

---

### Generate Share Link

**POST** `/notes/:id/share`

Create a public share link for the note.

**Request Body:**
```json
{
  "permission": "view",
  "expiresIn": 86400
}
```

**Response:** `201 Created`
```json
{
  "shareLink": "https://notesapp.com/shared/abc123def456",
  "shareCode": "abc123def456",
  "permission": "view",
  "expiresAt": "2024-01-16T16:00:00Z"
}
```

---

## WebSocket Events

**Namespace:** `/notes`  
**Connection URL:** `wss://api.notesapp.com/notes`

### Authentication

**Client → Server:**
```javascript
const socket = io('wss://api.notesapp.com/notes', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

**Server → Client (on auth failure):**
```javascript
socket.on('error', (error) => {
  // error = { message: 'Authentication failed' }
});
```

---

### Join Note Room

**Client → Server:**
```javascript
socket.emit('note:join', {
  noteId: 'uuid-456'
});
```

**Server → Client (acknowledgment):**
```javascript
socket.on('note:joined', (data) => {
  // data = {
  //   noteId: 'uuid-456',
  //   currentVersion: 42,
  //   activeUsers: [
  //     { userId: 'uuid-123', username: 'johndoe', cursor: { line: 5, ch: 10 } }
  //   ]
  // }
});
```

**Server → All Others in Room:**
```javascript
socket.on('user:joined', (data) => {
  // data = {
  //   userId: 'uuid-789',
  //   username: 'alice',
  //   avatarUrl: 'https://...'
  // }
});
```

---

### Leave Note Room

**Client → Server:**
```javascript
socket.emit('note:leave', {
  noteId: 'uuid-456'
});
```

**Server → All Others in Room:**
```javascript
socket.on('user:left', (data) => {
  // data = { userId: 'uuid-789', username: 'alice' }
});
```

---

### Send Operation (Edit)

**Client → Server:**
```javascript
socket.emit('note:operation', {
  noteId: 'uuid-456',
  operation: {
    type: 'insert',
    position: 42,
    text: 'Hello World',
    attributes: { bold: true },
    version: 42
  }
});
```

**Operation Types:**
- `insert`: Insert text at position
- `delete`: Delete text from position to position+length
- `retain`: Keep text (used in OT composition)
- `format`: Apply formatting (bold, italic, etc.)

**Server → All Others in Room:**
```javascript
socket.on('note:operation', (data) => {
  // data = {
  //   operation: { ... },
  //   userId: 'uuid-789',
  //   username: 'alice',
  //   version: 43  // Server-assigned new version
  // }
});
```

**Server → Originating Client (acknowledgment):**
```javascript
socket.on('note:operation:ack', (data) => {
  // data = { success: true, version: 43 }
  // OR
  // data = { success: false, error: 'Conflict detected', serverVersion: 44 }
});
```

---

### Cursor Position Update

**Client → Server:**
```javascript
socket.emit('note:cursor', {
  noteId: 'uuid-456',
  cursor: {
    line: 5,
    ch: 10,
    selection: { from: { line: 5, ch: 10 }, to: { line: 5, ch: 20 } }
  }
});
```

**Server → All Others in Room:**
```javascript
socket.on('user:cursor', (data) => {
  // data = {
  //   userId: 'uuid-789',
  //   username: 'alice',
  //   cursor: { line: 5, ch: 10, selection: {...} }
  // }
});
```

---

### Note Saved Event

**Server → All in Room (after auto-save):**
```javascript
socket.on('note:saved', (data) => {
  // data = {
  //   noteId: 'uuid-456',
  //   version: 43,
  //   savedAt: '2024-01-15T16:45:00Z'
  // }
});
```

---

### Error Events

**Server → Client:**
```javascript
socket.on('error', (error) => {
  // error = {
  //   message: 'Access denied',
  //   code: 'FORBIDDEN',
  //   noteId: 'uuid-456'
  // }
});
```

**Common Error Codes:**
- `AUTHENTICATION_FAILED` - Invalid token
- `FORBIDDEN` - No access to note
- `NOT_FOUND` - Note doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many operations
- `CONFLICT` - Operation conflict (rare with OT)

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input data, validation errors |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email already exists, username taken |
| 422 | Unprocessable Entity | Valid JSON but semantic errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Maintenance mode, database down |

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `AUTHENTICATION_FAILED` | 401 | Invalid credentials |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `USERNAME_TAKEN` | 409 | Username already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Responses

**Validation Error:**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

**Authentication Error:**
```json
{
  "error": {
    "message": "Invalid credentials",
    "code": "AUTHENTICATION_FAILED"
  }
}
```

**Rate Limit Error:**
```json
{
  "error": {
    "message": "Too many requests. Please try again in 15 minutes.",
    "code": "RATE_LIMIT_EXCEEDED",
    "details": {
      "retryAfter": 900
    }
  }
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/login` | 5 requests | 15 minutes |
| `POST /auth/register` | 3 requests | 1 hour |
| `GET /notes` | 100 requests | 1 minute |
| `POST /notes` | 20 requests | 1 minute |
| WebSocket operations | 50 operations | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642259400
```

---

## Pagination

List endpoints support pagination with the following query parameters:

- `page` (default: 1) - Page number (1-indexed)
- `limit` (default: 20, max: 100) - Items per page

**Response includes pagination metadata:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Versioning

API is versioned via URL path: `/api/v1/`

**Deprecation Policy:**
- Support N-1 version for 6 months
- Announce deprecation 3 months in advance
- Include `Sunset` header with deprecation date

**Example Sunset Header:**
```
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Deprecation: version=v1, sunset-date="2024-12-31"
```

---

## CORS

**Allowed Origins:**
- `https://notesapp.com` (production)
- `https://app.notesapp.com` (production)
- `http://localhost:3000` (development)

**Allowed Methods:** GET, POST, PATCH, DELETE, OPTIONS

**Allowed Headers:** Authorization, Content-Type, X-CSRF-Token

**Credentials:** Allowed (cookies for refresh tokens)

---

**API Version:** 1.0  
**Last Updated:** 2024  
**Changelog:** See `/docs/CHANGELOG.md`
