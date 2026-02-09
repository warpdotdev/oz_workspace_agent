# Todo App

A lightweight, full-stack to-do list application built with React, Express, TypeScript, and SQLite.

## Features

- ✅ Create, read, update, and delete todos
- ✅ Toggle completion status
- ✅ Filter by all/active/completed
- ✅ Full-stack TypeScript
- ✅ SQLite database (no external services needed)
- ✅ Responsive design

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript, CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite with better-sqlite3
- **Monorepo:** npm workspaces

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation

```bash
# Install all dependencies
npm install

# Build shared types (required first)
npm run build -w shared
```

### Development

```bash
# Run both frontend and backend in development mode
npm run dev

# Or run them separately:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:3000
```

### Production Build

```bash
# Build all packages
npm run build

# Start the server
npm start
```

## Project Structure

```
todo-app/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api/         # API client
│   │   └── App.tsx      # Main app component
│   └── ...
├── backend/           # Express + SQLite backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── db/          # Database setup
│   │   └── index.ts     # Server entry
│   └── ...
├── shared/            # Shared TypeScript types
│   └── src/types/
└── docs/              # Documentation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List all todos (with optional `?filter=active\|completed`) |
| GET | `/api/todos/:id` | Get a single todo |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| PATCH | `/api/todos/:id/toggle` | Toggle completion status |
| DELETE | `/api/todos/:id` | Delete a todo |
| GET | `/api/health` | Health check endpoint |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run frontend and backend in development mode |
| `npm run dev:frontend` | Run frontend only |
| `npm run dev:backend` | Run backend only |
| `npm run build` | Build all packages for production |
| `npm start` | Start production server |
| `npm run clean` | Remove all node_modules and build artifacts |

## License

MIT
