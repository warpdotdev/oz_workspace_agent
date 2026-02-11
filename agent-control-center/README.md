# Agent Control Center

**Mission Control for AI Agent Teams**

A lightweight MacOS desktop application for managing autonomous AI agents, built with Tauri, React, and Rust.

## Overview

Agent Control Center provides real-time visibility, governance, and control over AI agent networks without enterprise complexity. It's designed for small-to-mid technical teams managing 3-20 agents.

### Key Features

- **Real-time Agent Dashboard**: Monitor all agents at a glance with status indicators
- **Task Dispatch**: Send instructions to agents via natural language or Cmd+K quick commands
- **Activity Feed**: View thought logs, decision traces, and API calls in real-time
- **Local Storage**: Persist agent configurations and history locally
- **Framework Agnostic**: Works with CrewAI, LangChain, OpenAI Agents SDK, and more

## Project Structure

```
agent-control-center/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Application entry point
│   │   ├── models.rs       # Data structures (Agent, Task, Event)
│   │   ├── storage.rs      # File-based JSON persistence
│   │   ├── task_dispatch.rs # Task execution & simulation
│   │   └── ipc.rs          # Tauri IPC command handlers
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   └── build.rs            # Build script
└── README.md
```

## Backend Architecture

### Modules

#### `models.rs`
Core data structures:
- `Agent`: AI agent with status, framework, config, and stats
- `Task`: Dispatched task with instruction and result
- `ActivityEvent`: Log entry for thought logs, API calls, status changes
- Enums: `AgentStatus`, `TaskStatus`, `TaskPriority`, `EventType`

#### `storage.rs`
File-based JSON storage with async operations:
- Agent CRUD operations
- Task management
- Activity event logging (capped at 1000 events)
- Data export/import
- Statistics tracking

#### `task_dispatch.rs`
Task execution engine:
- Dispatch tasks to agents
- Simulate execution with mock thought logs
- Event broadcasting via Tokio channels
- Agent lifecycle management (pause, resume, reset)

#### `ipc.rs`
Tauri IPC command handlers exposing 23 commands:
- Agent operations: `create_agent`, `get_agent`, `update_agent`, `delete_agent`
- Task operations: `dispatch_task`, `execute_task`, `cancel_task`
- Agent control: `pause_agent`, `resume_agent`, `reset_agent`
- Events: `get_agent_events`, `get_recent_events`
- Storage: `export_data`, `import_data`, `reset_storage`
- Quick commands: `execute_quick_command` (Cmd+K interface)

### IPC Contract

The frontend can invoke these commands via Tauri's `invoke` API:

```typescript
// Create an agent
const agent = await invoke('create_agent', {
  request: {
    name: 'My Agent',
    framework: 'crewai',
    description: 'A helpful assistant',
    model: 'gpt-4'
  }
});

// Dispatch a task
const response = await invoke('dispatch_task', {
  request: {
    agent_id: agent.id,
    title: 'Analyze code',
    instruction: 'Review the authentication module for security issues',
    priority: 'high'
  }
});

// Execute quick command (Cmd+K)
const result = await invoke('execute_quick_command', {
  request: {
    command: 'run analyze the latest pull request',
    agent_id: agent.id
  }
});
```

## Requirements

- **Rust**: 1.82+ (for edition 2024 support)
- **Node.js**: 18+
- **Tauri CLI**: 1.7+

## Development

### Backend Only

```bash
cd src-tauri
cargo check    # Verify compilation
cargo build    # Build backend
cargo test     # Run tests
```

### Full Application

```bash
npm install
npm run tauri dev     # Development mode
npm run tauri build   # Production build
```

## Tech Stack

- **Backend**: Rust + Tokio async runtime
- **Desktop Framework**: Tauri 1.7
- **Storage**: File-based JSON (local AppData directory)
- **IPC**: Tauri command handlers with serialized JSON

## Design Decisions

1. **File-based storage**: Simple, portable, no database dependencies
2. **In-memory cache**: Fast reads with async persistence
3. **Event broadcasting**: Tokio channels for real-time updates
4. **Mock execution**: v0 simulates agent execution for demo purposes
5. **Quick commands**: Cmd+K interface for rapid task dispatch

## Future Enhancements (v1)

- Real framework integrations (CrewAI, LangChain, OpenAI Agents SDK)
- Multi-agent orchestration
- Cost tracking and budgets
- Human-in-the-loop approval workflows
- Performance charts and analytics

## License

MIT

## Co-Author

Co-Authored-By: Warp <agent@warp.dev>
