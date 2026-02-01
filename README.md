# MegaCollab

A production-ready real-time collaborative coding platform running entirely in the browser (client-side logic) with a Node.js backend.

## Features
- **Real-Time Collaboration**: Custom CRDT implementation ensuring consistency without conflicts.
- **Code Editor**: Syntax highlighting, line numbers (via CodeMirror).
- **Project Management**: File tree, multiple files, project creation.
- **Authentication**: JWT-based auth with secure session management.
- **Security**: XSS protection, Rate limiting, Secure headers.
- **Deployment**: Docker-ready.

## Architecture
See `docs/ARCHITECTURE.md` for detailed design.

## Setup
1. `npm install`
2. `npm start` (Runs server on port 3000)
3. Open `http://localhost:3000`

## Testing
`npm test`
