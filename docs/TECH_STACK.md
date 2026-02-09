# To-Do List App - Tech Stack & Project Structure

## Overview
A lightweight, full-stack to-do list application with CRUD operations and filtering capabilities.

## Tech Stack

### Frontend
- **React 18** with Vite - Fast build tooling, modern React features
- **TypeScript** - Type safety and better developer experience
- **CSS Modules** or **Vanilla CSS** - Simple styling without dependencies

### Backend
- **Node.js** with **Express** - Lightweight, fast API server
- **TypeScript** - Consistent type safety across stack
- **SQLite** with **better-sqlite3** - Simple file-based database, no setup required

### Why This Stack?
1. **Simplicity** - Minimal dependencies, easy to understand
2. **Full-stack TypeScript** - Single language across frontend and backend
3. **Zero external services** - SQLite runs locally, no database server needed
4. **Fast development** - Vite provides instant HMR
5. **Production ready** - Can be deployed anywhere Node.js runs

## Project Structure

```
todo-app/
├── README.md
├── package.json              # Root workspace config
├── .gitignore
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── components/
│       │   ├── TodoList.tsx
│       │   ├── TodoItem.tsx
│       │   ├── AddTodo.tsx
│       │   └── FilterTabs.tsx
│       ├── types/
│       │   └── todo.ts
│       └── api/
│           └── todos.ts
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts          # Express server entry
│       ├── routes/
│       │   └── todos.ts      # CRUD endpoints
│       ├── db/
│       │   ├── database.ts   # SQLite connection
│       │   └── schema.sql    # Table definitions
│       └── types/
│           └── todo.ts       # Shared types
│
└── shared/
    └── types/
        └── todo.ts           # Shared TypeScript interfaces
```

## API Design

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List all todos (with optional filter) |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |
| PATCH | `/api/todos/:id/toggle` | Toggle completion status |

### Todo Data Model
```typescript
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Development Scripts

```bash
# Install dependencies
npm install

# Run backend (dev mode)
npm run dev:backend

# Run frontend (dev mode)
npm run dev:frontend

# Run both concurrently
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Key Dependencies

### Frontend
- `react`, `react-dom` - UI library
- `typescript` - Type checking
- `vite` - Build tool

### Backend
- `express` - Web framework
- `better-sqlite3` - SQLite database
- `cors` - Cross-origin requests
- `typescript`, `tsx` - Type checking and running TS

## Next Steps
1. ✅ Define tech stack and project structure (this document)
2. Set up project foundation with initial files
3. Build backend API with SQLite
4. Create frontend UI components
5. Add styling and polish
6. Testing and documentation
