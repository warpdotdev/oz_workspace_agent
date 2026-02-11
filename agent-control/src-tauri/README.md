# Agent Control Backend - Tauri IPC Implementation

## Overview

This is the Rust backend for the Agent Control desktop application, built with Tauri 2.0. It provides:

- SQLite database for persistent storage
- IPC command handlers for frontend communication
- Mock data seeding for demonstration
- Complete agent, activity, and task management

## Architecture

### Modules

- **models.rs** - Data structures (Agent, Activity, Task, etc.)
- **database.rs** - SQLite database layer with CRUD operations
- **commands.rs** - Tauri IPC command handlers
- **seed.rs** - Mock data generator for demo purposes
- **lib.rs** - Application initialization and setup

### Database Schema

**agents** table:
- id (TEXT PRIMARY KEY)
- name (TEXT)
- status (TEXT: running|idle|error|paused)
- current_task (TEXT, nullable)
- runtime_seconds (INTEGER)
- tokens_used (INTEGER)
- created_at (TEXT, ISO 8601)
- updated_at (TEXT, ISO 8601)

**activities** table:
- id (TEXT PRIMARY KEY)
- agent_id (TEXT, foreign key)
- activity_type (TEXT: thought|status|error|task)
- message (TEXT)
- details (TEXT, nullable)
- timestamp (TEXT, ISO 8601)

**tasks** table:
- id (TEXT PRIMARY KEY)
- agent_id (TEXT, foreign key)
- description (TEXT)
- status (TEXT)
- created_at (TEXT, ISO 8601)
- completed_at (TEXT, ISO 8601, nullable)

## IPC Commands

All commands can be invoked from the frontend using Tauri's `invoke` API.

### get_agents()
Returns list of all agents.

**Returns:** `Vec<Agent>`

**Example:**
```typescript
const agents = await invoke('get_agents');
```

### get_agent(id: string)
Returns a specific agent by ID.

**Parameters:**
- `id` - Agent UUID

**Returns:** `Option<Agent>`

**Example:**
```typescript
const agent = await invoke('get_agent', { id: 'agent-id-here' });
```

### get_activities(agent_id?: string, limit?: number)
Returns activity log, optionally filtered by agent.

**Parameters:**
- `agent_id` (optional) - Filter by agent UUID
- `limit` (optional) - Max activities to return (default: 50)

**Returns:** `Vec<Activity>`

**Example:**
```typescript
// Get all recent activities
const activities = await invoke('get_activities', { limit: 20 });

// Get activities for specific agent
const agentActivities = await invoke('get_activities', { 
  agent_id: 'agent-id-here',
  limit: 100 
});
```

### get_tasks(agent_id: string)
Returns all tasks for a specific agent.

**Parameters:**
- `agent_id` - Agent UUID

**Returns:** `Vec<Task>`

**Example:**
```typescript
const tasks = await invoke('get_tasks', { agent_id: 'agent-id-here' });
```

### dispatch_task(request: DispatchTaskRequest)
Creates a new task and assigns it to an agent.

**Parameters:**
- `request.agent_id` - Target agent UUID
- `request.description` - Task description

**Returns:** `Task`

**Example:**
```typescript
const task = await invoke('dispatch_task', {
  request: {
    agent_id: 'agent-id-here',
    description: 'Analyze customer sentiment data'
  }
});
```

### update_agent_status(request: UpdateAgentStatusRequest)
Changes an agent's status.

**Parameters:**
- `request.agent_id` - Agent UUID
- `request.status` - New status (running|idle|error|paused)

**Returns:** `void`

**Example:**
```typescript
await invoke('update_agent_status', {
  request: {
    agent_id: 'agent-id-here',
    status: 'running'
  }
});
```

### get_agent_stats()
Returns aggregate statistics across all agents.

**Returns:** `AgentStats`

**Example:**
```typescript
const stats = await invoke('get_agent_stats');
// { total_agents: 4, running: 2, idle: 1, error: 1 }
```

## Mock Data

On first run, the database is automatically seeded with 4 demo agents:

1. **Data Analyzer** (Running) - Processing customer data feed
2. **Code Reviewer** (Idle) - Awaiting tasks
3. **Test Runner** (Running) - Running integration tests
4. **Documentation Bot** (Error) - Failed to generate docs

Along with sample activities showing thoughts, status changes, and errors.

## Database Location

The SQLite database is created at: `agent_control.db` in the app's working directory.

## Dependencies

- **rusqlite** - SQLite database access
- **tokio** - Async runtime
- **chrono** - Date/time handling
- **uuid** - UUID generation
- **serde** - Serialization/deserialization
- **tauri** - Desktop app framework

## Integration with Frontend

The frontend should:

1. Use Tauri's `invoke()` to call IPC commands
2. Handle errors returned as `Result<T, String>`
3. Poll `get_activities()` or `get_agents()` for real-time updates
4. Display status badges based on AgentStatus enum values

## Error Handling

All commands return `Result<T, String>`. Frontend should handle both success and error cases:

```typescript
try {
  const agents = await invoke('get_agents');
  // Handle success
} catch (error) {
  console.error('Failed to get agents:', error);
  // Show error to user
}
```

## Future Enhancements

For production, consider:

- WebSocket connections for real-time updates instead of polling
- Authentication and authorization
- Persistent background task execution
- Integration with actual agent frameworks (CrewAI, LangChain, etc.)
- Export/import agent configurations
- Cost tracking and token usage analytics
