# Task Management API Documentation

This document describes the Task Management API endpoints and WebSocket integration for real-time updates.

## API Endpoints

### Authentication

All endpoints require authentication via NextAuth session. Unauthenticated requests will receive a 401 response.

### Base URL

```
http://localhost:3000/api/tasks
```

---

## REST API Endpoints

### 1. List Tasks

**GET** `/api/tasks`

List all tasks created by the authenticated user with optional filtering.

**Query Parameters:**
- `projectId` (optional) - Filter by project ID
- `status` (optional) - Filter by status: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`, `CANCELLED`
- `priority` (optional) - Filter by priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `assigneeId` (optional) - Filter by assignee user ID
- `agentId` (optional) - Filter by agent ID

**Example Request:**
```bash
curl http://localhost:3000/api/tasks?status=IN_PROGRESS&priority=HIGH \
  -H "Cookie: next-auth.session-token=..."
```

**Example Response:**
```json
{
  "tasks": [
    {
      "id": "clxyz123",
      "title": "Implement authentication",
      "description": "Add JWT-based authentication",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "projectId": "clproj456",
      "assigneeId": "cluser789",
      "agentId": null,
      "createdById": "cluser789",
      "createdAt": "2024-02-11T10:00:00.000Z",
      "updatedAt": "2024-02-11T12:30:00.000Z",
      "dueDate": "2024-02-15T23:59:59.000Z",
      "project": {
        "id": "clproj456",
        "name": "Authentication System"
      },
      "assignee": {
        "id": "cluser789",
        "name": "John Doe",
        "email": "john@example.com",
        "image": null
      },
      "agent": null,
      "createdBy": {
        "id": "cluser789",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

---

### 2. Create Task

**POST** `/api/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based authentication",
  "status": "TODO",
  "priority": "HIGH",
  "projectId": "clproj456",
  "assigneeId": "cluser789",
  "agentId": "clagent101",
  "dueDate": "2024-02-15T23:59:59.000Z"
}
```

**Required Fields:**
- `title` (string, 1-200 characters)

**Optional Fields:**
- `description` (string)
- `status` (enum: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`, `CANCELLED`, default: `TODO`)
- `priority` (enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`, default: `MEDIUM`)
- `projectId` (string)
- `assigneeId` (string)
- `agentId` (string)
- `dueDate` (ISO 8601 datetime string)

**Example Response:**
```json
{
  "task": {
    "id": "clxyz123",
    "title": "Implement authentication",
    ...
  }
}
```

---

### 3. Get Task by ID

**GET** `/api/tasks/:id`

Get a single task by ID.

**Example Request:**
```bash
curl http://localhost:3000/api/tasks/clxyz123 \
  -H "Cookie: next-auth.session-token=..."
```

**Example Response:**
```json
{
  "task": {
    "id": "clxyz123",
    "title": "Implement authentication",
    ...
  }
}
```

---

### 4. Update Task

**PATCH** `/api/tasks/:id`

Update a task. All fields are optional.

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

**Status Transition Rules:**

The API enforces valid status transitions:

- `TODO` → `IN_PROGRESS`, `CANCELLED`
- `IN_PROGRESS` → `REVIEW`, `TODO`, `CANCELLED`
- `REVIEW` → `DONE`, `IN_PROGRESS`, `CANCELLED`
- `DONE` → `REVIEW` (reopening)
- `CANCELLED` → `TODO` (reactivation)

Invalid transitions will return a 400 error.

**Example Response:**
```json
{
  "task": {
    "id": "clxyz123",
    "status": "IN_PROGRESS",
    ...
  }
}
```

---

### 5. Delete Task

**DELETE** `/api/tasks/:id`

Delete a task permanently.

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/tasks/clxyz123 \
  -H "Cookie: next-auth.session-token=..."
```

**Example Response:**
```json
{
  "message": "Task deleted successfully"
}
```

---

## Real-Time Updates via WebSocket

### Current Implementation

The Task API includes WebSocket infrastructure for broadcasting real-time task events. However, Next.js App Router doesn't support WebSocket upgrades natively.

### WebSocket Event Types

```typescript
enum TaskEventType {
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_STATUS_CHANGED = 'task:status_changed',
}
```

### Integration Options

#### Option 1: Separate WebSocket Server (Recommended)

Create a standalone WebSocket server using `ws` or `socket.io`:

```bash
npm install ws socket.io
```

Example server (separate from Next.js):

```typescript
// websocket-server.ts
import { WebSocketServer } from 'ws'
import { taskEventBroadcaster } from './lib/websocket'

const wss = new WebSocketServer({ port: 3001 })

wss.on('connection', (ws) => {
  console.log('Client connected')
  taskEventBroadcaster.addClient(ws)

  ws.on('close', () => {
    console.log('Client disconnected')
    taskEventBroadcaster.removeClient(ws)
  })
})

console.log('WebSocket server running on ws://localhost:3001')
```

Run alongside Next.js:
```bash
# Terminal 1
npm run dev

# Terminal 2
node websocket-server.js
```

#### Option 2: Server-Sent Events (SSE)

Use SSE for one-way server-to-client updates:

```typescript
// app/api/events/route.ts
export async function GET(request: Request) {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Send events
  setInterval(() => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`))
  }, 30000)

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

#### Option 3: Polling with Optimistic Updates

Use React Query or SWR for periodic polling:

```typescript
// Frontend
import { useQuery } from '@tanstack/react-query'

function TaskList() {
  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetch('/api/tasks').then(r => r.json()),
    refetchInterval: 3000, // Poll every 3 seconds
  })

  return <div>{/* Render tasks */}</div>
}
```

#### Option 4: Managed Services

Use services like Pusher, Ably, or Supabase Realtime for production-grade WebSocket handling without managing infrastructure.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [] // Optional validation details
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Model

### Task Schema

```typescript
interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  projectId?: string
  assigneeId?: string
  agentId?: string
  createdById: string
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
}

enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
```

---

## Testing the API

### Using curl

```bash
# List tasks
curl http://localhost:3000/api/tasks

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "priority": "HIGH"}'

# Update task
curl -X PATCH http://localhost:3000/api/tasks/clxyz123 \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'

# Delete task
curl -X DELETE http://localhost:3000/api/tasks/clxyz123
```

### Using Postman or Insomnia

Import the following collection:

```json
{
  "name": "Task API",
  "requests": [
    {
      "name": "List Tasks",
      "method": "GET",
      "url": "http://localhost:3000/api/tasks"
    },
    {
      "name": "Create Task",
      "method": "POST",
      "url": "http://localhost:3000/api/tasks",
      "body": {
        "title": "Test task",
        "priority": "HIGH"
      }
    }
  ]
}
```

---

## Next Steps

1. **Frontend Integration**: Build the Kanban board UI with drag-and-drop
2. **WebSocket Implementation**: Choose and implement one of the real-time update options
3. **Testing**: Add unit and integration tests for all endpoints
4. **Documentation**: Add API documentation with Swagger/OpenAPI

---

## API Response Shape

The API returns consistent response shapes for worker-2 to build against:

### Task Object Structure
```typescript
{
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  projectId: string | null
  assigneeId: string | null
  agentId: string | null
  createdById: string
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
  dueDate: string | null (ISO 8601)
  project: { id: string, name: string } | null
  assignee: { id: string, name: string, email: string, image: string | null } | null
  agent: { id: string, name: string, type: string, status: string } | null
  createdBy: { id: string, name: string, email: string }
}
```

### List Response
```typescript
{
  tasks: Task[]
}
```

### Single Task Response
```typescript
{
  task: Task
}
```

### Delete Response
```typescript
{
  message: string
}
```

### Error Response
```typescript
{
  error: string
  details?: any[]
}
```
