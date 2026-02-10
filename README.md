# To-Do List App

A lightweight, full-stack to-do list application built with React, TypeScript, Express, and SQLite.

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
├── frontend/          # React + Vite frontend
├── backend/           # Express API server
└── shared/            # Shared TypeScript types
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm

### Installation

```bash
# Install all dependencies
npm install

# Run both frontend and backend in development mode
npm run dev

# Or run them separately:
npm run dev:frontend
npm run dev:backend
```

### Development

- Frontend will run on: http://localhost:5173
- Backend API will run on: http://localhost:3000

## Features

- ✅ Create, read, update, and delete todos
- ✅ Mark todos as completed
- ✅ Filter todos by status (all, active, completed)
- ✅ SQLite database for persistent storage
- ✅ Full TypeScript type safety

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List all todos |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |
| PATCH | `/api/todos/:id/toggle` | Toggle completion status |

## Scripts

```bash
npm run dev            # Run both frontend and backend
npm run dev:frontend   # Run only frontend
npm run dev:backend    # Run only backend
npm run build          # Build both for production
npm test               # Run tests
```

## License

MIT
