# To-Do App Backend

A REST API for managing tasks, built with Express, TypeScript, and SQLite.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Or build and run production:
   ```bash
   npm run build
   npm start
   ```

The server runs on `http://localhost:3001` by default.

## API Endpoints

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks?completed=true` | Get completed tasks |
| GET | `/api/tasks?completed=false` | Get active tasks |
| GET | `/api/tasks/:id` | Get a specific task |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API health |

## Request/Response Examples

### Create Task
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

Response:
```json
{
  "id": "uuid",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Task
```bash
curl -X PUT http://localhost:3001/api/tasks/:id \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete Task
```bash
curl -X DELETE http://localhost:3001/api/tasks/:id
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| DB_PATH | ./data/tasks.db | SQLite database path |

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── database.ts      # SQLite connection & schema
│   │   └── taskRepository.ts # Database operations
│   ├── models/
│   │   └── Task.ts          # Type definitions
│   ├── routes/
│   │   └── tasks.ts         # API routes
│   └── index.ts             # Express app
├── data/                    # SQLite database (auto-created)
├── package.json
└── tsconfig.json
```
