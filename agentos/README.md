# AgentOS - Mission Control for AI Agent Teams

A lightweight, native macOS desktop application for managing autonomous AI agents. Built with Tauri 2.0, React, TypeScript, and Rust.

## Features

- **Three-Panel Layout**: Agent sidebar, main dashboard, and activity feed
- **Real-time Status Monitoring**: Color-coded status badges (running/error/idle/paused)
- **Cmd+K Command Bar**: Quick actions for agent management (Raycast-style)
- **Activity Feed**: Live stream of agent thoughts, actions, and observations
- **Performance Charts**: Token usage and metrics visualization with Recharts
- **Dark Mode**: Native macOS aesthetic with dark mode as primary theme

## Tech Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- Zustand for state management
- Recharts for data visualization

### Backend
- Tauri 2.0 with Rust
- Tokio async runtime
- Serde for serialization
- File-based storage for configuration persistence

## Project Structure

```
agentos/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── StatusBadge.tsx
│   │   ├── AgentCard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MainPanel.tsx
│   │   ├── ActivityPanel.tsx
│   │   └── CommandBar.tsx
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand store
│   │   └── agentStore.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── lib/                # Utilities
│   │   └── mockAgentService.ts
│   └── styles/             # Global styles
│       └── globals.css
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri entry & IPC handlers
│   │   ├── agent.rs        # Agent data types
│   │   └── storage.rs      # Persistence layer
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Keyboard Shortcuts

- `⌘K` - Open command bar
- `↑/↓` - Navigate commands
- `Enter` - Execute command
- `Escape` - Close command bar

## IPC Commands

The Rust backend exposes the following Tauri commands:

- `get_agents` - List all agents
- `get_agent` - Get agent by ID
- `create_agent` - Create new agent
- `update_agent_status` - Update agent status
- `dispatch_task` - Send task to agent
- `pause_agent` - Pause agent execution
- `resume_agent` - Resume agent execution
- `stop_agent` - Stop agent completely
- `delete_agent` - Remove agent
- `get_activities` - Get activity feed
- `clear_activities` - Clear activity history

## Design System

### Colors
- Background Primary: `#0D0D0D`
- Background Secondary: `#1A1A1A`
- Status Running: `#22C55E` (green)
- Status Error: `#EF4444` (red)
- Status Idle: `#6B7280` (gray)
- Status Paused: `#3B82F6` (blue)
- Accent Primary: `#6366F1` (indigo)

### Typography
- Sans: SF Pro Text, system-ui
- Mono: SF Mono, Menlo, Monaco

## License

MIT

---

Built with [Tauri](https://tauri.app) and [Warp](https://www.warp.dev/)
