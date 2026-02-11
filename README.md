# AI Agent Management Platform

A modern platform for creating, monitoring, orchestrating, and governing autonomous AI agents. Built for non-technical teams with visual interfaces, real-time monitoring, and transparent decision-making.

## Project Structure

This is a monorepo managed with npm workspaces:

```
.
├── packages/
│   ├── shared/          # Shared TypeScript types and utilities
│   ├── backend/         # Express API server with PostgreSQL
│   └── frontend/        # React + Vite frontend application
├── .warp/               # Warp agent skills and configurations
└── docs/                # Project documentation
```

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for fast build tooling
- TanStack Query for server state
- React Router for routing
- Zustand for client state management

### Backend
- Node.js + Express + TypeScript
- PostgreSQL with Prisma ORM
- WebSocket for real-time updates
- JWT authentication
- Bull + Redis for job queues
- Winston for logging

### Infrastructure
- Docker + Docker Compose for local development
- npm workspaces for monorepo management

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (for local database)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy example env files (when available)
cp packages/backend/.env.example packages/backend/.env
```

3. Start development servers:
```bash
# Start all services (backend + frontend)
npm run dev

# Or start individually
npm run dev:backend
npm run dev:frontend
```

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:3001.

## Development Workflow

### Available Commands

```bash
# Development
npm run dev              # Start all services in watch mode
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend

# Building
npm run build            # Build all packages
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Type Checking
npm run typecheck        # Type check all packages

# Linting
npm run lint             # Lint all packages

# Testing
npm run test             # Run tests for all packages
```

## Project Roadmap

### Phase 1: Foundation & Single Agent Management (MVP) ✓
- Monorepo setup with TypeScript
- Backend API with Express and Prisma
- Frontend with React and Vite
- Agent CRUD operations
- Task management
- Authentication

### Phase 2: Real-Time Monitoring & Failure Handling
- WebSocket integration for live updates
- Confidence scoring system
- Human intervention controls
- Failure handling UI

### Phase 3: Multi-Agent Orchestration
- Visual workflow builder
- Agent coordination engine
- Sequential/parallel/conditional routing

### Phase 4: Governance & Advanced Features
- Guardrails and compliance
- Analytics dashboard
- Role-based access control

## Contributing

This project is being developed by a team of AI agents coordinated through Warp's agent platform.

## License

[License details to be added]
