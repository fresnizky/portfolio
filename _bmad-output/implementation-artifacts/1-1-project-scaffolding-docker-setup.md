# Story 1.1: Project Scaffolding & Docker Setup

Status: review

## Story

**As a** developer,
**I want** the project structure initialized with Docker Compose orchestration,
**So that** I can run the full stack locally with a single command.

## Acceptance Criteria

1. **AC1: Docker Compose launches all services**
   - **Given** a fresh clone of the repository
   - **When** I run `docker compose up`
   - **Then** three services start: frontend (React+Vite), backend (Express), and db (PostgreSQL 18)
   - **And** frontend is accessible on PORT_FRONTEND
   - **And** backend responds to health check on PORT_API/api/health
   - **And** PostgreSQL accepts connections on PORT_DB

2. **AC2: Frontend hot reload works**
   - **Given** the development environment is running
   - **When** I modify frontend source files
   - **Then** changes are reflected immediately via Vite HMR (hot module replacement)

3. **AC3: Backend hot reload works**
   - **Given** the development environment is running
   - **When** I modify backend source files
   - **Then** the server restarts automatically via nodemon

## Tasks / Subtasks

- [x] Task 1: Create root project structure (AC: 1)
  - [x] Create `.gitignore` with node_modules, .env, .env.ports, dist, build
  - [x] Create `.env.example` with required environment variables template
  - [x] Create `README.md` with project overview and setup instructions

- [x] Task 2: Initialize Frontend with Vite (AC: 1, 2)
  - [x] Run `npm create vite@latest frontend -- --template react-ts`
  - [x] Create `frontend/Dockerfile` for production build
  - [x] Create `frontend/Dockerfile.dev` for development with HMR
  - [x] Configure `vite.config.ts` for Docker networking (host: true)
  - [x] Add basic `frontend/.env.example`

- [x] Task 3: Initialize Backend with Express + TypeScript (AC: 1, 3)
  - [x] Create `backend/` directory structure
  - [x] Initialize with `npm init -y`
  - [x] Install dependencies: express, cors, dotenv
  - [x] Install dev dependencies: typescript, @types/express, @types/node, @types/cors, ts-node, nodemon
  - [x] Create `tsconfig.json` with strict TypeScript config
  - [x] Create `nodemon.json` for development hot reload
  - [x] Create `backend/Dockerfile` for production
  - [x] Create `backend/Dockerfile.dev` for development with nodemon
  - [x] Create basic Express app with `/api/health` endpoint
  - [x] Add `backend/.env.example`

- [x] Task 4: Create Docker Compose configuration (AC: 1, 2, 3)
  - [x] Create `docker-compose.yml` with all three services
  - [x] Create `docker-compose.dev.yml` override with volume mounts for hot reload
  - [x] Configure environment variables with PORT_* placeholders
  - [x] Configure postgres_data volume for persistence
  - [x] Set up service dependencies (frontend → backend → db)

- [x] Task 5: Integrate with dev-tunnel (AC: 1)
  - [x] Run `dev-tunnel register portfolio --path $(pwd)`
  - [x] Generate `.env.ports` with `dev-tunnel env portfolio > .env.ports`
  - [x] Update `.gitignore` to exclude `.env.ports`
  - [x] Document the dev-tunnel workflow in README

- [x] Task 6: Verify complete setup (AC: 1, 2, 3)
  - [x] Run `docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.ports up`
  - [x] Verify frontend accessible at PORT_FRONTEND
  - [x] Verify backend health check at PORT_API/api/health returns 200
  - [x] Verify PostgreSQL accepts connections at PORT_DB
  - [x] Test frontend HMR by modifying a component
  - [x] Test backend hot reload by modifying a route

### Review Follow-ups (AI)

- [x] [AI-Review][MEDIUM] Setup test framework baseline (Vitest) - architecture.md:358-374
- [x] [AI-Review][MEDIUM] Add lint and typecheck scripts to frontend/package.json
- [x] [AI-Review][MEDIUM] Remove weak JWT_SECRET default or enforce env var in docker-compose.yml
- [x] [AI-Review][LOW] Add packageManager field to frontend/package.json
- [x] [AI-Review][LOW] Remove vite.config.ts volume mount from docker-compose.dev.yml
- [x] [AI-Review][LOW] Add centralized error handler middleware to backend
- [x] [AI-Review][LOW] Justify or remove redundant backend/.gitignore
- [x] [AI-Review][LOW] Add .env.ports validation step to README

## Dev Notes

### Technology Stack (from Architecture)

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React + Vite | Vite 7.2.7 |
| Backend | Express + TypeScript | Express 5.x, Node 24.12.0 |
| Database | PostgreSQL | 18 |
| Orchestration | Docker Compose | Latest |

### Critical Architecture Patterns

**Frontend Dockerfile.dev:**
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

**Backend Dockerfile.dev:**
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Backend package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**nodemon.json:**
```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "ts-node src/index.ts"
}
```

### Project Structure Notes

**Root Level Files:**
```
portfolio/
├── .env.example
├── .env.ports          # Generated by dev-tunnel (gitignored)
├── .gitignore
├── docker-compose.yml
├── docker-compose.dev.yml
├── README.md
├── frontend/
└── backend/
```

**This story creates ONLY the scaffolding. Do NOT create:**
- Prisma schema (Story 1.2)
- Authentication (Story 1.3)
- React routing or pages (Story 1.4)
- Any domain models or business logic

### Environment Variables

**.env.example (root):**
```env
# Generated by dev-tunnel - DO NOT EDIT
# Run: dev-tunnel env portfolio > .env.ports

# Application secrets (set these manually)
JWT_SECRET=your-secret-here-change-in-production

# Database credentials
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=portfolio_pass
POSTGRES_DB=portfolio
```

**Frontend .env.example:**
```env
VITE_API_URL=http://localhost:${PORT_API:-10002}/api
```

**Backend .env.example:**
```env
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
JWT_SECRET=${JWT_SECRET}
NODE_ENV=development
PORT=3000
```

### Docker Compose Configuration

**docker-compose.yml:**
```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "${PORT_FRONTEND:-10001}:5173"
    environment:
      - VITE_API_URL=http://localhost:${PORT_API:-10002}/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "${PORT_API:-10002}:3000"
    environment:
      - DATABASE_URL=postgresql://portfolio_user:portfolio_pass@db:5432/portfolio
      - JWT_SECRET=${JWT_SECRET:-dev-secret-change-me}
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:18
    ports:
      - "${PORT_DB:-10003}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=portfolio_user
      - POSTGRES_PASSWORD=portfolio_pass
      - POSTGRES_DB=portfolio

volumes:
  postgres_data:
```

**docker-compose.dev.yml (override):**
```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - ./frontend/index.html:/app/index.html

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend/src:/app/src
    environment:
      - NODE_ENV=development
```

### Backend Health Endpoint

**src/index.ts:**
```typescript
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

### References

- [Source: architecture.md#Starter-Template-Evaluation] - Vite react-ts template selection
- [Source: architecture.md#Infrastructure-Deployment] - Docker Compose configuration
- [Source: architecture.md#Project-Structure-Boundaries] - Complete directory structure
- [Source: architecture.md#Development-Workflow] - dev-tunnel integration steps
- [Source: AGENTS.md] - dev-tunnel port registration requirements

### dev-tunnel Integration

**CRITICAL:** Follow the dev-tunnel workflow from AGENTS.md:

1. Register project BEFORE configuring ports:
   ```bash
   dev-tunnel register portfolio --path $(pwd)
   ```

2. Generate port environment:
   ```bash
   dev-tunnel env portfolio > .env.ports
   ```

3. Start with combined env files:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.ports up
   ```

4. Default port block for 'portfolio' project will be 10000-10099:
   - PORT_MAIN/PORT_FRONTEND: 10000 or 10001
   - PORT_API: 10002
   - PORT_DB: 10003

## Dev Agent Record

### Agent Model Used

Claude (claude-sonnet-4-20250514)

### Debug Log References

_None - Task 1 files already existed from initial commit_

### Completion Notes List

- **Task 1 (2026-01-06):** Root project structure verified. Files `.gitignore`, `.env.example`, and `README.md` already existed with correct content from initial project setup.
- **Task 2 (2026-01-06):** Frontend initialized with Vite + React 19 + TypeScript. Created Dockerfile (prod with nginx), Dockerfile.dev (dev with HMR), configured vite.config.ts with host:true for Docker networking. Build verified passing.
- **Task 3 (2026-01-06):** Backend initialized with Express 5 + TypeScript. Created Dockerfile (multi-stage prod), Dockerfile.dev (nodemon hot reload), /api/health endpoint. Build and typecheck verified passing.
- **Task 4 (2026-01-06):** Docker Compose configuration created. Refactored to base + override pattern (dev.yml, prod.yml). DB healthcheck configured.
- **Task 5 (2026-01-06):** dev-tunnel integration verified. Project already registered, .env.ports generated with ports 10001-10003. Added allowedHosts to vite.config.ts for subdomain access.
- **Task 6 (2026-01-06):** Complete validation performed:
  - Dev mode: localhost + subdomain (portfolio.resnizky.ar, api.portfolio.resnizky.ar) ✅
  - Prod mode: localhost + subdomain ✅
  - Frontend HMR ✅, Backend hot reload ✅
  - Database connectivity ✅
- **Review Follow-ups (2026-01-07):** Addressed 8 code review findings:
  - Added Vitest test framework to frontend and backend with baseline tests
  - Added lint/typecheck scripts to package.json files
  - Enforced JWT_SECRET as required env var (no weak default)
  - Added packageManager field to frontend/package.json
  - Removed vite.config.ts volume mount from docker-compose.dev.yml
  - Added centralized error handler middleware to backend
  - Removed redundant backend/.gitignore (covered by root)
  - Added .env.ports validation step to README

### File List

- `.gitignore` - Git ignore rules (node_modules, .env, .env.ports, dist, build)
- `.env.example` - Environment variables template
- `README.md` - Project documentation with setup instructions
- `frontend/package.json` - Frontend dependencies (React 19, Vite 7.3)
- `frontend/pnpm-lock.yaml` - Lock file
- `frontend/tsconfig.json` - TypeScript config with strict mode and path aliases
- `frontend/vite.config.ts` - Vite config with React plugin and Docker host settings
- `frontend/index.html` - Entry HTML
- `frontend/Dockerfile` - Production build (multi-stage with nginx)
- `frontend/Dockerfile.dev` - Development with HMR
- `frontend/nginx.conf` - Nginx config for SPA routing
- `frontend/.env.example` - Frontend env template
- `frontend/src/main.tsx` - React entry point
- `frontend/src/App.tsx` - Root component
- `frontend/src/index.css` - Base styles
- `frontend/src/vite-env.d.ts` - Vite type declarations
- `backend/package.json` - Backend dependencies (Express 5, TypeScript)
- `backend/pnpm-lock.yaml` - Lock file
- `backend/tsconfig.json` - TypeScript config with strict mode
- `backend/nodemon.json` - Nodemon config for hot reload
- `backend/Dockerfile` - Production build (multi-stage)
- `backend/Dockerfile.dev` - Development with nodemon
- `backend/.env.example` - Backend env template
- `backend/src/index.ts` - Express app with /api/health endpoint
- `backend/src/middleware/errorHandler.ts` - Centralized error handler
- `backend/src/index.test.ts` - Backend baseline test
- `backend/vitest.config.ts` - Vitest configuration
- `frontend/src/App.test.tsx` - Frontend baseline test
- `frontend/src/test/setup.ts` - Test setup with jest-dom
- `docker-compose.yml` - Base Docker Compose config (no ports for frontend/backend)
- `docker-compose.dev.yml` - Development override (Dockerfile.dev, port 5173)
- `docker-compose.prod.yml` - Production override (Dockerfile, port 80)
