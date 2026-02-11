# Task Management API Documentation

This document defines the API contract for the Task Management Backend API, built for worker-2 to integrate with the Kanban Board Frontend UI.

## Base URL

All endpoints are prefixed with `/api/tasks`

## Authentication

All endpoints require authentication via Next Auth session. Include your session token in requests.

## Response Format

All responses follow this standard format:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Endpoints

### 1. List Tasks

**GET** `/api/tasks`

Retrieve a paginated list of tasks with optional filtering.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number for pagination |
| limit | number | 20 | Number of items per page |
| status | TaskStatus | - | Filter by status (TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED) |
| priority | TaskPriority | - | Filter by priority (LOW, MEDIUM, HIGH, URGENT) |
| projectId | string | - | Filter by project ID |
| assigneeId | string | - | Filter by assignee user ID |
| agentId | string | - | Filter by agent ID |
| search | string | - | Search in title and description |
| sortBy | string | createdAt | Sort field (title, createdAt, updatedAt, dueDate, priority) |
| sortOrder | string | desc | Sort order (asc, desc) |

**Response:**

```typescript
{
  success: true,
  data: Task[],
  pagination: {
    page: 1,
    limit: 20,
    total: 42,
    totalPages: 3
  }
}
```

### 2. Create Task

**POST** `/api/tasks`

Create a new task.

**Request Body:**

```typescript
{
  title: string;              // Required
  description?: string;
  status?: TaskStatus;        // Default: TODO
  priority?: TaskPriority;    // Default: MEDIUM
  projectId?: string;
  assigneeId?: string;
  agentId?: string;
  dueDate?: string;           // ISO 8601 date string
  confidenceScore?: number;   // 0-1 for trust calibration
  reasoningLog?: object;      // JSON object for explainability
}
```

**Response:**

```typescript
{
  success: true,
  data: Task,
  message: "Task created successfully"
}
```

### 3. Get Task by ID

**GET** `/api/tasks/:id`

Retrieve a single task by ID.

**Response:**

```typescript
{
  success: true,
  data: Task
}
```

### 4. Update Task

**PATCH** `/api/tasks/:id`

Update a task's properties. Only provided fields will be updated.

**Request Body:**

```typescript
{
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  agentId?: string;
  dueDate?: string | null;
  confidenceScore?: number;
  reasoningLog?: object;
}
```

**Response:**

```typescript
{
  success: true,
  data: Task,
  message: "Task updated successfully"
}
```

### 5. Delete Task

**DELETE** `/api/tasks/:id`

Delete a task.

**Response:**

```typescript
{
  success: true,
  message: "Task deleted successfully"
}
```

### 6. Get Kanban Board Data

**GET** `/api/tasks/kanban`

Get tasks grouped by status for Kanban board display.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Optional: Filter by project |

**Response:**

```typescript
{
  success: true,
  data: {
    TODO: Task[],
    IN_PROGRESS: Task[],
    REVIEW: Task[],
    DONE: Task[],
    CANCELLED: Task[]
  }
}
```

### 7. Get Task Statistics

**GET** `/api/tasks/stats`

Get task count statistics by status.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | string | Optional: Filter by project |

**Response:**

```typescript
{
  success: true,
  data: {
    TODO: 5,
    IN_PROGRESS: 3,
    REVIEW: 2,
    DONE: 12,
    CANCELLED: 1
  }
}
```

## Data Types

### Task

```typescript
{
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  assigneeId: string | null;
  agentId: string | null;
  createdById: string;
  createdAt: string;           // ISO 8601 date string
  updatedAt: string;           // ISO 8601 date string
  dueDate: string | null;      // ISO 8601 date string
  confidenceScore: number | null;  // 0-1 for trust calibration
  reasoningLog: object | null;     // JSON for explainability
  
  // Relations (when included)
  agent?: {
    id: string;
    name: string;
  } | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}
```

### TaskStatus (Enum)

- `TODO` - Task is in the backlog
- `IN_PROGRESS` - Task is being worked on
- `REVIEW` - Task is in review
- `DONE` - Task is completed
- `CANCELLED` - Task was cancelled

**Valid Status Transitions:**

- TODO → IN_PROGRESS, CANCELLED
- IN_PROGRESS → REVIEW, CANCELLED
- REVIEW → DONE, IN_PROGRESS, CANCELLED
- DONE → (no transitions)
- CANCELLED → TODO

### TaskPriority (Enum)

- `LOW` - Low priority
- `MEDIUM` - Medium priority (default)
- `HIGH` - High priority
- `URGENT` - Urgent priority

## Semantic Status Colors (Design Specs)

For the Kanban board UI, use these semantic colors:

- **TODO**: Gray (`#6B7280`)
- **IN_PROGRESS**: Blue (`#3B82F6`)
- **REVIEW**: Amber (`#F59E0B`)
- **DONE**: Green (`#10B981`)
- **CANCELLED**: Red (`#EF4444`)

## WebSocket Real-Time Updates

Tasks support real-time updates via WebSocket. The WebSocket infrastructure is in place but requires Socket.IO to be installed and configured.

**Events:**

- `task:created` - Fired when a task is created
- `task:updated` - Fired when a task is updated
- `task:deleted` - Fired when a task is deleted

**Event Payload:**

```typescript
{
  type: 'task:created' | 'task:updated' | 'task:deleted';
  data: Task | { id: string };
  timestamp: string;  // ISO 8601
}
```

**Note:** Full WebSocket support requires installing `socket.io` and `socket.io-client` and setting up a custom Next.js server. See `/lib/websocket.ts` for implementation details.

## Error Responses

**401 Unauthorized:**
```typescript
{
  success: false,
  error: "Unauthorized"
}
```

**404 Not Found:**
```typescript
{
  success: false,
  error: "Task not found"
}
```

**400 Bad Request:**
```typescript
{
  success: false,
  error: "Title is required"
}
```

**500 Internal Server Error:**
```typescript
{
  success: false,
  error: "Failed to fetch tasks"
}
```

## Usage Examples

### Fetch tasks for Kanban board

```typescript
const response = await fetch('/api/tasks/kanban?projectId=abc123');
const { data } = await response.json();

// data.TODO, data.IN_PROGRESS, etc. contain arrays of tasks
```

### Create a new task

```typescript
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Implement user authentication',
    description: 'Add JWT-based auth',
    priority: 'HIGH',
    projectId: 'project-123',
  }),
});

const { data: task } = await response.json();
```

### Update task status (drag-and-drop)

```typescript
const response = await fetch(`/api/tasks/${taskId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'IN_PROGRESS',
  }),
});

const { data: updatedTask } = await response.json();
```

## Notes for Frontend Implementation

1. **Optimistic Updates**: For better UX, update the UI immediately when dragging tasks, then sync with the API. Revert on error.

2. **Real-time Sync**: When WebSocket is enabled, subscribe to task updates to keep the Kanban board in sync across all users.

3. **Confidence Badges**: Display `confidenceScore` as a badge next to task names (if present). Use color coding: 
   - 0-0.3: Red
   - 0.3-0.7: Amber
   - 0.7-1.0: Green

4. **Reasoning Snapshots**: Show `reasoningLog` in a collapsible section or tooltip for explainability.

5. **Priority Indicators**: Use visual indicators (icons, colors, or labels) to show task priority.

6. **Drag-and-Drop**: Use `@dnd-kit/core` or `react-beautiful-dnd` for drag-and-drop functionality. On drop, call PATCH `/api/tasks/:id` with the new status.

## Database Migration Note

Before using these endpoints in production, run:

```bash
npm run db:push
# or
npm run db:migrate
```

This will sync the Prisma schema with the database, adding the `confidenceScore` and `reasoningLog` fields to the Task table.
