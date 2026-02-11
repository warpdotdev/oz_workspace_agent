# To-Do List App

A simple, full-stack to-do list application built with React, TypeScript, Express, and SQLite.

## Features

- ✅ Create, read, update, and delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Filter todos (All, Active, Completed)
- ✅ Edit todo titles (double-click to edit)
- ✅ Persistent storage with SQLite
- ✅ Full TypeScript support
- ✅ Modern React UI with Vite

## Tech Stack

### Frontend
- React 18 with Vite
- TypeScript
- Modern CSS with gradient design

### Backend
- Node.js with Express
- TypeScript
- SQLite with better-sqlite3

## Project Structure

```
├── frontend/           # React frontend application
│   └── src/
│       ├── components/ # React components (TodoList, TodoItem, AddTodo, FilterTabs)
│       └── api/        # API service layer
├── backend/            # Express API server
│   └── src/
│       ├── routes/     # API route handlers
│       └── db/         # Database initialization and schema
└── shared/             # Shared TypeScript types
    └── types/
        └── todo.ts     # Todo interface definitions
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository
2. Install dependencies:

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
# Backend (API server on port 3001)
npm run dev:backend

# Frontend (Dev server on port 5173)
npm run dev:frontend
```

### Building for Production

```bash
npm run build
```

This will build both the backend and frontend for production deployment.

### Running Tests

Run the API test suite:

```bash
node test-api.js
```

This tests all CRUD operations and filtering functionality.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos |
| GET | `/api/todos?filter=active` | Get active todos only |
| GET | `/api/todos?filter=completed` | Get completed todos only |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo (title, completed) |
| DELETE | `/api/todos/:id` | Delete a todo |
| PATCH | `/api/todos/:id/toggle` | Toggle todo completion status |

### Request/Response Examples

**Create Todo:**
```bash
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
```

**Update Todo:**
```bash
curl -X PUT http://localhost:3001/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

## Architecture

- **Frontend**: React SPA that communicates with backend via REST API
- **Backend**: Express server with RESTful endpoints
- **Database**: SQLite file-based database (no external DB server required)
- **Type Safety**: Shared TypeScript types between frontend and backend

## Development Notes

See [docs/TECH_STACK.md](docs/TECH_STACK.md) for detailed technical documentation.

## License

MIT
