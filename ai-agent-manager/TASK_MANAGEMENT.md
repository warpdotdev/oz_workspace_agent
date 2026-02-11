# Task Management System

This document describes the Task Management feature with Kanban board functionality.

## Features

### Kanban Board
- **Drag-and-Drop**: Move tasks between columns (TODO, IN_PROGRESS, REVIEW, DONE) using drag-and-drop
- **Real-time Updates**: Automatic polling every 5 seconds to fetch latest task changes
- **Optimistic Updates**: UI updates immediately when moving tasks, with automatic rollback on error
- **Semantic Colors**: Each column has distinct colors for easy visual identification

### Task Cards
- **Priority Indicators**: Color-coded badges (LOW=gray, MEDIUM=blue, HIGH=orange, URGENT=red)
- **Assignee Avatars**: Display user avatar and name when task is assigned
- **Agent Display**: Show which AI agent is handling the task
- **Due Date**: Visual indicator for task deadlines
- **Description Preview**: Truncated description with line clamp

### Task Creation & Editing
- **Inline Creation**: Add tasks directly from each column using the + button
- **Quick Edit**: Click any task card to edit details
- **Form Validation**: Comprehensive validation using Zod schema
- **Status Selection**: Choose initial status when creating tasks

## Components

### Core Components
- `components/tasks/kanban-board.tsx` - Main Kanban board with drag-and-drop
- `components/tasks/kanban-column.tsx` - Individual status columns
- `components/tasks/task-card.tsx` - Task card with drag handle
- `components/tasks/task-dialog.tsx` - Task creation/editing form

### Hooks
- `lib/hooks/use-tasks.ts` - Task management hook with API integration

### Types
- `types/task.ts` - TypeScript types for tasks

### Page
- `app/dashboard/tasks/page.tsx` - Main tasks page

## API Integration

The frontend expects the following API endpoints (to be implemented by backend):

### GET /api/tasks
Fetch all tasks for the current user.

**Response:**
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "status": "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
      "projectId": "string | null",
      "assigneeId": "string | null",
      "agentId": "string | null",
      "createdById": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "dueDate": "string | null",
      "assignee": {
        "id": "string",
        "name": "string | null",
        "email": "string",
        "image": "string | null"
      },
      "agent": {
        "id": "string",
        "name": "string"
      }
    }
  ]
}
```

### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "string",
  "description": "string (optional)",
  "status": "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "projectId": "string (optional)",
  "assigneeId": "string (optional)",
  "agentId": "string (optional)",
  "dueDate": "string (optional)"
}
```

**Response:**
```json
{
  "task": { /* task object */ }
}
```

### PATCH /api/tasks/:id
Update an existing task.

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "assigneeId": "string (optional)",
  "agentId": "string (optional)",
  "dueDate": "string (optional)"
}
```

**Response:**
```json
{
  "task": { /* updated task object */ }
}
```

### DELETE /api/tasks/:id
Delete a task.

**Response:**
```json
{
  "success": true
}
```

## Dependencies

- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable list support
- `@dnd-kit/utilities` - Utility functions for transforms

## Usage

Navigate to `/dashboard/tasks` to access the Task Management page.

### Creating a Task
1. Click the "New Task" button in the top right
2. Or click the + button in any column header
3. Fill in task details
4. Click "Create"

### Editing a Task
1. Click on any task card
2. Update the fields
3. Click "Update"

### Moving Tasks
1. Click and hold the grip icon on a task card
2. Drag to the desired column
3. Release to drop

## Real-time Updates

The system polls for updates every 5 seconds to ensure the board stays in sync. This simulates WebSocket functionality until a proper WebSocket implementation is added by the backend.

To disable polling, pass `pollInterval={0}` to the `useTasks` hook.

## Future Enhancements

- WebSocket support for true real-time updates
- Task filtering and search
- Bulk operations
- Task templates
- Task dependencies
- Time tracking
- Comments and attachments
