# AI Agent Management Platform

A framework-agnostic platform for managing and orchestrating AI agents with full visibility and control.

## Project Structure

```
ai-agent-management-platform/
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   └── components/   # React components
│   └── package.json
├── backend/              # Express backend API
│   ├── src/
│   │   └── index.ts     # Express server
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── packages/
│   └── shared/          # Shared TypeScript types
│       └── src/
│           ├── agent.ts
│           └── task.ts
└── package.json         # Root workspace config
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React 18** - UI library

### Backend
- **Node.js** with **Express** - REST API server
- **TypeScript** - Type safety across the stack
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **Zod** - Runtime validation

### Shared
- **TypeScript** - Shared types between frontend and backend
- **npm workspaces** - Monorepo management

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm 9+ (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd oz_desktop_agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit backend/.env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/ai_agent_platform"

# Run database migrations
npm run db:migrate
```

### Development

Run both frontend and backend simultaneously:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend (http://localhost:3001)
npm run dev:backend

# Terminal 2 - Frontend (http://localhost:3000)
npm run dev:frontend
```

### API Endpoints

**Health Check**
```
GET /health
```

**Agents**
```
GET    /api/agents       # List all agents
POST   /api/agents       # Create agent
GET    /api/agents/:id   # Get agent
PUT    /api/agents/:id   # Update agent
DELETE /api/agents/:id   # Delete agent
```

**Tasks**
```
GET    /api/tasks        # List all tasks
POST   /api/tasks        # Create task
GET    /api/tasks/:id    # Get task
PUT    /api/tasks/:id    # Update task
DELETE /api/tasks/:id    # Delete task
```

## Database Management

```bash
# Generate Prisma Client after schema changes
cd backend && npx prisma generate

# Create a new migration
npm run db:migrate

# Open Prisma Studio (GUI for database)
npm run db:studio
```

## Building for Production

```bash
# Build all packages
npm run build

# Or build individually
npm run build:frontend
npm run build:backend
```

## Project Goals

- **Framework-agnostic**: Support agents built with any framework (LangChain, CrewAI, AutoGPT, etc.)
- **Full visibility**: Real-time monitoring and transparent decision-making
- **Human-in-the-loop**: Intervention controls for trust and safety
- **Enterprise-ready**: Governance, audit trails, and compliance features

## Development Roadmap

### Phase 1: Foundation (Current)
- ✅ Monorepo setup
- ✅ Next.js frontend
- ✅ Express backend
- ✅ Prisma + PostgreSQL
- ⏳ Agent CRUD API
- ⏳ Task management system
- ⏳ Basic UI components

### Phase 2: Real-Time Features
- WebSocket support for live updates
- Agent execution monitoring
- Confidence scoring
- Failure handling UI

### Phase 3: Multi-Agent Orchestration
- Visual workflow builder
- Agent coordination patterns
- Transparent handoffs

### Phase 4: Enterprise Features
- RBAC and permissions
- Audit logging
- Compliance reporting
- Analytics dashboard

## Contributing

This project is part of Sprint 1 for building an AI agent management platform.

## License

[To be determined]
