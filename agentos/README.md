# AgentOS

**Mission Control for AI Agent Teams**

A lightweight, native macOS desktop application for managing autonomous AI agents. Built with Tauri 2.0, React, TypeScript, and Rust.

## Overview

AgentOS provides real-time visibility, governance, and control over AI agent networks without enterprise complexity. It's designed for small-to-mid technical teams managing multiple AI agents across different frameworks.

## Features

### v0 (Current)
- **Single-agent dashboard** with status monitoring
- **Real-time activity feed** with thought logs and status changes
- **Task dispatch interface** for sending instructions to agents
- **Framework agnostic** - supports CrewAI, LangChain, OpenAI, and custom agents
- **Local SQLite storage** for agent configuration persistence
- **Native macOS experience** with dark mode design

### Planned (v1)
- Multi-agent orchestration
- Full framework integrations
- Cost tracking and budgets
- Human-in-the-loop governance controls
- Performance analytics

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Zustand
- **Backend**: Rust, Tauri 2.0, SQLite
- **Build**: Vite

## Project Structure

\`\`\`
agentos/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Tauri IPC bindings
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript type definitions
├── src-tauri/              # Rust backend
│   └── src/
│       ├── commands.rs     # Tauri IPC command handlers
│       ├── models.rs       # Data models
│       ├── storage.rs      # SQLite database layer
│       └── mock.rs         # Mock agent service for demos
└── dist/                   # Built frontend assets
\`\`\`

## Requirements

- Node.js 20.19+ or 22.12+
- Rust 1.77.2+ (for Tauri 2.0)
- macOS 10.15+ (for native features)

## Development

### Install dependencies

\`\`\`bash
npm install
\`\`\`

### Run in development mode

\`\`\`bash
npm run tauri dev
\`\`\`

### Build for production

\`\`\`bash
npm run tauri build
\`\`\`

## Architecture

### IPC Commands

The Tauri backend exposes the following IPC commands:

- \`get_agents\` - List all configured agents
- \`get_agent(id)\` - Get a specific agent by ID
- \`create_agent(request)\` - Create a new agent configuration
- \`update_agent(id, request)\` - Update an existing agent
- \`delete_agent(id)\` - Delete an agent
- \`dispatch_task(request)\` - Send a task to an agent
- \`get_task(id)\` - Get task details
- \`get_agent_tasks(agentId)\` - List tasks for an agent
- \`get_events(limit)\` - Get activity feed events
- \`get_agent_events(agentId, limit)\` - Get events for a specific agent
- \`seed_mock_data\` - Seed demo agents for testing

### Database Schema

SQLite database with tables for:
- \`agents\` - Agent configurations
- \`tasks\` - Task history
- \`events\` - Activity feed events

## Design

The UI follows a three-panel layout:
1. **Sidebar (240px)** - Agent list with status indicators
2. **Main Panel (flexible)** - Agent details and task dispatch
3. **Activity Panel (320px)** - Real-time event feed

Color-coded status system:
- 🟢 Green - Running
- ⚪ Gray - Idle  
- 🔴 Red - Error
- 🔵 Blue - Paused

## License

MIT
