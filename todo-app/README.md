# To-Do List App

A simple to-do list application built with React + TypeScript (frontend) and Express + SQLite (backend).

## Project Structure

```
todo-app/
├── client/          # React + Vite frontend
├── server/          # Express + SQLite backend
└── package.json     # Root package with scripts
```

## Getting Started

### Install Dependencies

```bash
npm run install:all
```

### Development

Run both client and server in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server  # Backend on http://localhost:3001
npm run dev:client  # Frontend on http://localhost:5173
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Express, TypeScript, SQLite (better-sqlite3)
