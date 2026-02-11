# To-Do List App

A simple, full-stack to-do list application built with React, TypeScript, Express, and SQLite.

## Features

- ✅ Create, read, update, and delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Filter todos (All, Active, Completed)
- ✅ Persistent storage with SQLite
- ✅ Full TypeScript support
- ✅ Modern React UI with Vite

## Tech Stack

### Frontend
- React 18 with Vite
- TypeScript
- CSS Modules

### Backend
- Node.js with Express
- TypeScript
- SQLite with better-sqlite3

## Project Structure

```
todo-app/
├── frontend/       # React frontend application
├── backend/        # Express API server
└── shared/         # Shared TypeScript types
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
# Backend (API server on port 3000)
npm run dev:backend

# Frontend (Dev server on port 5173)
npm run dev:frontend
```

### Building for Production

```bash
npm run build
```

This will build both the backend and frontend for production deployment.

## API Endpoints

- `GET /api/todos` - Get all todos (with optional filter)
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo
- `PATCH /api/todos/:id/toggle` - Toggle todo completion

## Development

See [docs/TECH_STACK.md](docs/TECH_STACK.md) for detailed technical documentation.

## License

MIT
