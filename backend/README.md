# AI Agent Management Platform - Backend

Backend API for the AI Agent Management Platform, built with Node.js, Express, TypeScript, and Prisma ORM.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Real-time**: WebSocket

## Database Schema

### Overview

The database schema consists of 5 main models with comprehensive relationships:

1. **User** - User accounts and authentication
2. **Agent** - AI agent configuration and metadata
3. **Task** - Task management and assignment
4. **AgentExecution** - Individual agent execution runs
5. **Event** - Audit logs and activity tracking

### Models

#### User
- User authentication and profile information
- Roles: ADMIN, USER, VIEWER
- Relations: agents, tasks, events, executions

#### Agent
- AI agent configuration and settings
- Types: CUSTOM, ASSISTANT, AUTOMATION, ANALYSIS, ORCHESTRATOR
- Status: ACTIVE, INACTIVE, PAUSED, ERROR, ARCHIVED
- Autonomy levels: AUTONOMOUS, SUPERVISED, MANUAL
- Configuration: framework, model provider, model name, custom config JSON
- Control settings: max retries, timeout, autonomy level

#### Task
- Task management for agents
- Status: BACKLOG, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
- Priority: LOW, MEDIUM, HIGH, CRITICAL
- Input/output stored as JSON
- Assignment tracking with timestamps

#### AgentExecution
- Tracks individual agent execution runs
- Status: PENDING, RUNNING, SUCCESS, FAILED, TIMEOUT, CANCELLED
- Metrics: tokens used, cost, confidence score
- Timing: start time, completion time, duration
- Results and error tracking

#### Event
- Comprehensive audit log and activity tracking
- Event types: agent events, task events, execution events, user events, system events
- Categories: INFO, WARNING, ERROR, CRITICAL, DEBUG
- Context linking to agents, tasks, executions, and users

### Relationships

- User → Agents (one-to-many)
- User → Tasks (one-to-many)
- User → Executions (one-to-many)
- User → Events (one-to-many)
- Agent → Tasks (one-to-many)
- Agent → Executions (one-to-many)
- Agent → Events (one-to-many)
- Task → Executions (one-to-many)
- Task → Events (one-to-many)
- Execution → Events (one-to-many)

### Indexes

All models have strategic indexes for query performance:
- Primary keys (id)
- Foreign keys (userId, agentId, taskId, executionId)
- Status fields for filtering
- Timestamp fields for sorting
- Unique constraints (email)

## Setup

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (for local database)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start PostgreSQL with Docker:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Generate Prisma Client:
```bash
npm run db:generate
```

### Development

Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Database Commands

### Migrations

```bash
# Create a new migration
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:prod

# Push schema changes without migrations (development only)
npm run db:push

# Generate Prisma Client
npm run db:generate
```

### Database Management

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database (if seed script exists)
npx prisma db seed
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── src/
│   ├── db/
│   │   └── client.ts          # Prisma client singleton
│   ├── types/
│   │   └── index.ts           # TypeScript type exports
│   ├── routes/
│   │   ├── agents.ts          # Agent CRUD endpoints
│   │   ├── tasks.ts           # Task endpoints
│   │   ├── executions.ts      # Execution endpoints
│   │   └── events.ts          # Event endpoints
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   └── validation.ts      # Request validation
│   └── index.ts               # Express app entry point
├── docker-compose.yml         # PostgreSQL container
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_agent_platform

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

## API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Agents
- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/start` - Start agent
- `POST /api/agents/:id/stop` - Stop agent

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign task to agent

### Executions
- `GET /api/executions` - List executions
- `GET /api/executions/:id` - Get execution details
- `POST /api/executions` - Create execution
- `POST /api/executions/:id/cancel` - Cancel execution

### Events
- `GET /api/events` - List events (audit log)
- `GET /api/events/:id` - Get event details

## Next Steps

1. Implement authentication middleware
2. Create API routes for all models
3. Add request validation
4. Implement WebSocket for real-time updates
5. Add API documentation (Swagger/OpenAPI)
6. Write unit and integration tests
7. Add database seeding for development

## Contributing

This is part of Sprint 1 Foundation work for the AI Agent Management Platform.
