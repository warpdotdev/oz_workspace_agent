# To-Do App Frontend

A React + TypeScript frontend for the To-Do application.

## Features

- **Task Management**: Create, edit, complete, and delete tasks
- **Filter Views**: View all tasks, active tasks only, or completed tasks only
- **Responsive Design**: Works on desktop and mobile devices
- **API Integration**: Connects to the backend API for persistent storage

## Prerequisites

- Node.js 18+
- Backend API running on port 3001

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── FilterTabs.tsx    # Filter tab buttons
│   │   ├── TaskForm.tsx      # New task form
│   │   ├── TaskItem.tsx      # Individual task display/edit
│   │   └── TaskList.tsx      # Task list container
│   ├── services/
│   │   └── api.ts            # API client
│   ├── types/
│   │   └── Task.ts           # TypeScript interfaces
│   ├── App.tsx               # Main application component
│   ├── App.css               # Application styles
│   └── main.tsx              # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Endpoints

The frontend connects to the following backend endpoints:

- `GET /api/tasks` - List all tasks
- `GET /api/tasks?completed=true|false` - Filter tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
