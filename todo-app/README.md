# Todo App

A full-stack to-do list application with CRUD operations and filtering.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (via better-sqlite3)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend   # Express on http://localhost:3001
npm run dev:frontend  # Vite on http://localhost:5173
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List all todos (optional `?filter=all\|active\|completed`) |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |
| PATCH | `/api/todos/:id/toggle` | Toggle completion status |

## Project Structure

```
todo-app/
├── frontend/          # React + Vite frontend
│   └── src/
│       ├── components/  # AddTodo, TodoList, TodoItem, FilterTabs
│       ├── api/         # API client
│       └── types/       # TypeScript interfaces
├── backend/           # Express API server
│   └── src/
│       ├── routes/      # CRUD endpoints
│       ├── db/          # SQLite connection & schema
│       └── types/       # TypeScript interfaces
└── shared/            # Shared type definitions
```

## Features

- Create, read, update, delete todos
- Toggle completion status
- Filter by All / Active / Completed
- Inline editing (double-click to edit)
- Responsive design
