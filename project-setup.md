# Project Setup Guide — Weenggs Tasks API

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Running Tests](#running-tests)
4. [Code Quality Tools](#code-quality-tools)
5. [Production Setup](#production-setup)
6. [Docker Setup](#docker-setup)
7. [Environment Variables Reference](#environment-variables-reference)
8. [NPM Scripts Reference](#npm-scripts-reference)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Download |
|---|---|---|
| Node.js | 20.x LTS | https://nodejs.org |
| npm | 10.x | Comes with Node.js |
| PostgreSQL | 14.x | https://www.postgresql.org/download |
| Git | Any recent | https://git-scm.com |

### Verify Installations

```bash
node --version      # v20.x.x or higher
npm --version       # 10.x.x or higher
psql --version      # psql (PostgreSQL) 14.x or higher
```

---

## Development Setup

### Step 1 — Get the Code

```bash
git clone <repository-url>
cd weenggs
```

### Step 2 — Install Dependencies

```bash
npm install
```

Installs all runtime and dev dependencies. Also runs `husky` automatically via the `prepare` script to set up git hooks.

### Step 3 — Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/weenggs_db

# Access token — use a long random string in development too
JWT_SECRET=any_long_random_string_you_choose
JWT_EXPIRES_IN=8h

# Refresh token TTL (days)
JWT_REFRESH_EXPIRES_IN=7d

# Comma-separated list of allowed CORS origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=info
```

> **Generate a strong JWT_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Step 4 — Create the PostgreSQL Database

```bash
psql -U postgres -c "CREATE DATABASE weenggs_db;"
```
If no setup that path in System Variables
#"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d weenggs_db 

### Step 5 — Run Migrations

Run both migration files in order:

```bash
# Migration 1: users + tasks tables + seed user
psql postgresql://postgres:your_password@localhost:5432/weenggs_db -f migrations/001_init.sql

# Migration 2: performance indexes + refresh_tokens table
psql postgresql://postgres:your_password@localhost:5432/weenggs_db -f migrations/002_indexes_refresh_tokens.sql
```

Or using the npm script (requires `DATABASE_URL` in `.env`):

```bash
npm run migrate
```

**Seeded dummy user:**
- Email: `admin@test.com`
- Password: `secret123`

### Step 6 — Start the Development Server

```bash
npm run dev
```

Expected output:

```
2026-05-11T15:00:00.000Z info: PostgreSQL connected successfully
2026-05-11T15:00:00.000Z info: Server running on http://localhost:3000
2026-05-11T15:00:00.000Z info: Swagger docs at http://localhost:3000/api-docs
```

### Step 7 — Verify Everything Works

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-05-11T..."}
```

Open **http://localhost:3000/api-docs** for the interactive Swagger UI.

#### Quick API test

```bash
# 1. Login — returns both tokens
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"secret123"}'

# 2. Copy the access token, then create a task:
TOKEN="<paste token here>"

curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","status":"pending"}'

# 3. List tasks:
curl http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN"

# 4. Refresh the access token (when it expires):
REFRESH_TOKEN="<paste refreshToken here>"

curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# 5. Logout (revoke refresh token):
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

---

## Running Tests

Tests use **Jest + Supertest** and mock the database — no real PostgreSQL needed.

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

Expected output:

```
Test Suites: 3 passed, 3 total
Tests:       35 passed, 35 total
```

Coverage report → `coverage/lcov-report/index.html`

---

## Code Quality Tools

### Linting (ESLint)

```bash
# Check for issues
npm run lint

# Auto-fix fixable issues
npm run lint:fix
```

### Formatting (Prettier)

```bash
# Format all source files
npm run format

# Check formatting without changing files (used in CI)
npm run format:check
```

### Pre-commit Hook (Husky + lint-staged)

When you run `git commit`, Husky automatically runs `lint-staged` which:
1. Runs `eslint --fix` on staged `.ts` files
2. Runs `prettier --write` on staged `.ts` files

This ensures no unformatted or lint-failing code reaches the repository.

To skip the hook in an emergency (not recommended):

```bash
git commit --no-verify -m "your message"
```

---

## Production Setup

### Step 1 — Server Requirements

| Resource | Minimum |
|---|---|
| CPU | 1 vCPU |
| RAM | 1 GB |
| Disk | 10 GB |
| OS | Ubuntu 22.04 LTS |

### Step 2 — Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3 — Install PostgreSQL

```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql && sudo systemctl enable postgresql
```

### Step 4 — Create Production Database

```bash
sudo -i -u postgres psql <<EOF
CREATE DATABASE weenggs_prod;
CREATE USER weenggs_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE weenggs_prod TO weenggs_user;
EOF
```

### Step 5 — Deploy the Application

```bash
git clone <repository-url> /var/www/weenggs
cd /var/www/weenggs
npm install --omit=dev
```

### Step 6 — Configure Production Environment

```bash
cp .env.example .env && nano .env
```

```env
PORT=3000
DATABASE_URL=postgresql://weenggs_user:strong_password_here@localhost:5432/weenggs_prod

# Must be 64+ random characters — generate with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-char-minimum-random-string>
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

ALLOWED_ORIGINS=https://your-frontend-domain.com
LOG_LEVEL=warn
```

> **Production security rules:**
> - `JWT_SECRET` min 64 random characters
> - `JWT_EXPIRES_IN` should be `8h` or less
> - `ALLOWED_ORIGINS` should list only your real frontend domain(s)
> - Never commit `.env` — it is in `.gitignore`

### Step 7 — Run Migrations

```bash
psql $DATABASE_URL -f migrations/001_init.sql
psql $DATABASE_URL -f migrations/002_indexes_refresh_tokens.sql
```

> Remove or modify the seed `INSERT` in `001_init.sql` before running in production, or change the seed user's password immediately after first login.

### Step 8 — Build and Start

```bash
npm run build
```

### Step 9 — PM2 Process Manager

```bash
sudo npm install -g pm2
pm2 start dist/server.js --name weenggs-api
pm2 save
pm2 startup   # follow the printed instructions
```

```bash
pm2 status               # show processes
pm2 logs weenggs-api     # tail live logs
pm2 restart weenggs-api  # restart
```

### Step 10 — Nginx Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/weenggs
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/weenggs /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx && sudo systemctl enable nginx
```

### Step 11 — HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run   # test auto-renewal
```

### Step 12 — Firewall

```bash
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

---

## Docker Setup

The project includes a ready-to-use `Dockerfile` and `docker-compose.yml`. No manual configuration needed.

### Quick Start

```bash
# Copy and fill in your secrets
cp .env.example .env
# Edit .env — set JWT_SECRET at minimum

# Start API + PostgreSQL
docker compose up -d

# View logs
docker compose logs -f api

# Stop
docker compose down

# Full reset (deletes DB volume)
docker compose down -v
```

### What docker-compose does

- **api** service: builds the multi-stage Docker image, runs on port 3000
- **db** service: PostgreSQL 16 Alpine, auto-runs both migration files on first start
- Both migrations are mounted into `/docker-entrypoint-initdb.d/` — PostgreSQL executes them in alphabetical order automatically

### Verify Docker Setup

```bash
docker compose ps        # both containers should show "healthy" / "running"
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"secret123"}'
```

### Docker image details

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:20-alpine` | Install all dependencies |
| `builder` | `node:20-alpine` | Compile TypeScript → `dist/` |
| `production` | `node:20-alpine` | Production-only deps + compiled output |

- Runs as non-root `node` user
- Final image ~150 MB (Alpine base)

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP port |
| `DATABASE_URL` | Yes | — | `postgresql://user:pass@host:port/db` |
| `JWT_SECRET` | Yes | — | Access token signing secret (64+ chars in prod) |
| `JWT_EXPIRES_IN` | No | `8h` | Access token TTL (e.g. `8h`, `30m`, `1d`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL in days, format `Nd` |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS whitelist |
| `LOG_LEVEL` | No | `info` | `error` \| `warn` \| `info` \| `debug` |

### DATABASE_URL examples

```env
# Local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/weenggs_db

# Production with SSL
DATABASE_URL=postgresql://weenggs_user:strongpass@localhost:5432/weenggs_prod?sslmode=require

# Remote (Supabase, Neon, Railway, etc.)
DATABASE_URL=postgresql://user:pass@db.host.com:5432/dbname?sslmode=require
```

---

## NPM Scripts Reference

| Script | When to use |
|---|---|
| `npm run dev` | Local development — hot reload on file changes |
| `npm run build` | Compile TypeScript before deploying |
| `npm start` | Run compiled production build (after `build`) |
| `npm test` | Run all unit and integration tests |
| `npm run test:coverage` | Tests + HTML coverage report in `coverage/` |
| `npm run migrate` | Apply all DB migrations (requires `psql` CLI + `DATABASE_URL`) |
| `npm run lint` | Check all `src/**/*.ts` files with ESLint |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Reformat all source files with Prettier |
| `npm run format:check` | Verify formatting (fails if any file would change — used in CI) |

---

## Troubleshooting

### Cannot connect to PostgreSQL

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

```bash
sudo systemctl status postgresql      # Linux
brew services list | grep postgresql  # macOS
```

---

### Database does not exist

**Error:** `database "weenggs_db" does not exist`

```bash
psql -U postgres -c "CREATE DATABASE weenggs_db;"
```

---

### Authentication failed for PostgreSQL

**Error:** `password authentication failed for user "postgres"`

```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"
```

---

### Port 3000 already in use

**Error:** `listen EADDRINUSE :::3000`

```bash
npx kill-port 3000
# Or change PORT in .env to e.g. 3001
```

---

### JWT_SECRET is not defined

```bash
cat .env | grep JWT_SECRET   # verify .env exists and has the variable
```

---

### `npm run migrate` fails on Windows

The script uses `$DATABASE_URL` (bash syntax). On Windows PowerShell run:

```powershell
psql "postgresql://postgres:password@localhost:5432/weenggs_db" -f migrations/001_init.sql
psql "postgresql://postgres:password@localhost:5432/weenggs_db" -f migrations/002_indexes_refresh_tokens.sql
```

---

### refresh_tokens table does not exist

This means only migration `001` has been applied. Run migration `002`:

```bash
psql $DATABASE_URL -f migrations/002_indexes_refresh_tokens.sql
```

Or re-run `npm run migrate` which runs both.

---

### TypeScript build errors

```bash
npx tsc -p tsconfig.build.json --noEmit
```

---

### Tests failing with database errors

Ensure each test file has this at the very top (before any src imports):

```typescript
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));
```

---

### Rate limit 429 errors during development

All endpoints are rate-limited (100 req / 15 min global, 10 req / 15 min on auth). If you hit the limit during testing, wait 15 minutes or restart the server (limits reset in memory).
