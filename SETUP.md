# Local Development Setup

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone the Repository](#clone-the-repository)
- [Environment Variables](#environment-variables)
- [Database Setup and Migrations](#database-setup-and-migrations)
- [Install Dependencies](#install-dependencies)
- [Running Tests](#running-tests)
- [Running Development Servers](#running-development-servers)
- [Accessing the App](#accessing-the-app)
- [Troubleshooting Setup Issues](#troubleshooting-setup-issues)
- [IDE/Editor Recommendations](#ideeditor-recommendations)

## Prerequisites

- **Node.js**: 18.x or later
- **PostgreSQL**: 14.x or later
- **Redis**: 6.x or later
- **Docker** (optional): for local infrastructure

## Clone the Repository

```bash
git clone <repo-url>
cd syncnote
```

## Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Update values as needed. Key variables are:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CORS_ORIGIN`

## Database Setup and Migrations

### Option A: Docker Compose

```bash
docker-compose up -d postgres redis
```

### Option B: Local Install

Create a database and user:

```bash
psql -U postgres
CREATE DATABASE syncnote;
CREATE USER syncnote_user WITH ENCRYPTED PASSWORD 'local-password';
GRANT ALL PRIVILEGES ON DATABASE syncnote TO syncnote_user;
```

Run migrations:

```bash
npm run db:migrate
```

## Install Dependencies

```bash
npm install
cd client && npm install
```

## Running Tests

```bash
npm run test
npm run test:integration
```

## Running Development Servers

```bash
npm run dev
cd client && npm run dev
```

## Accessing the App

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- WebSocket: `ws://localhost:4000/socket.io`

## Troubleshooting Setup Issues

- **Database connection failures**: verify `DATABASE_URL` and that Postgres is running.
- **Redis connection errors**: ensure Redis is up and `REDIS_URL` matches the host/port.
- **Node version mismatch**: use `nvm install 18` and `nvm use 18`.
- **Port conflicts**: change `PORT` or stop conflicting services.

## IDE/Editor Recommendations

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - PostgreSQL
  - Redis for VS Code
- Enable format on save and use the project ESLint configuration.
