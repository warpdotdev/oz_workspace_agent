# To-Do List App

A full-stack to-do list application built with a modern TypeScript monorepo architecture.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Backend**: Express, TypeScript
- **Database**: SQLite (via better-sqlite3)
- **Monorepo**: npm workspaces

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

1. **Install dependencies** from the project root:

   ```bash
   npm install
   ```

2. **Start both servers** concurrently:

   ```bash
   npm run dev
   ```

   This starts:
   - Backend API server at `http://localhost:3001`
   - Frontend dev server at `http://localhost:5173` (with API proxy to backend)

   You can also start them individually:

   ```bash
   npm run dev:backend    # Backend only
   npm run dev:frontend   # Frontend only
   ```

## API Endpoints

All endpoints are prefixed with `/api/todos`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | List all todos. Optional query: `?filter=active\|completed` |
| `POST` | `/api/todos` | Create a new todo. Body: `{ "title": "string" }` |
| `PUT` | `/api/todos/:id` | Update a todo. Body: `{ "title?": "string", "completed?": boolean }` |
| `DELETE` | `/api/todos/:id` | Delete a todo |
| `PATCH` | `/api/todos/:id/toggle` | Toggle completion status |
| `GET` | `/api/health` | Health check |

## Project Structure

```
todo-app/
├── package.json          # Root workspace config & shared scripts
├── shared/               # Shared types across frontend & backend
│   └── types/
│       └── todo.ts       # Todo interface
├── backend/              # Express API server
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts      # Server entry point (port 3001)
│       ├── db/
│       │   ├── schema.sql
│       │   └── database.ts
│       └── routes/
│           └── todos.ts  # CRUD route handlers
└── frontend/             # React + Vite client
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts    # Dev server with API proxy
    ├── index.html
    └── src/
        ├── main.tsx      # React entry point
        ├── App.tsx       # Main app component
        ├── App.css       # Styles
        ├── api/
        │   └── todos.ts  # API client functions
        ├── types/
        │   └── todo.ts   # Frontend Todo type
        └── components/
            ├── AddTodo.tsx
            ├── FilterTabs.tsx
            ├── TodoItem.tsx
            └── TodoList.tsx
```
