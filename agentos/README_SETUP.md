# AgentOS - AI Agent Manager

A lightweight macOS desktop application for managing autonomous AI agents built with Tauri 2.0.

## Tech Stack

- **Desktop Framework**: Tauri 2.0
- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS (dark mode primary)
- **State Management**: Zustand
- **Charts**: Recharts
- **Build Tool**: Vite

## Project Structure

```
agentos/
├── src/
│   ├── components/     # React UI components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── lib/            # Utility functions
│   ├── store/          # Zustand state management
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles with Tailwind
├── src-tauri/          # Rust backend
│   ├── src/           # Rust source files
│   └── tauri.conf.json # Tauri configuration
├── public/             # Static assets
└── package.json        # Node dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
- System dependencies (macOS):
  ```bash
  xcode-select --install
  ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run tauri dev
   ```

3. Build for production:
   ```bash
   npm run tauri build
   ```

## Configuration

### Tauri Configuration

The app is configured for macOS with the following settings:
- **App Name**: AgentOS
- **Bundle ID**: com.agentos.app
- **Window Size**: 1400x900 (min: 1200x700)
- **macOS Version**: 10.15+

### TailwindCSS

Configured with:
- Dark mode as primary theme
- Custom status colors (running, error, idle, paused)
- Native macOS font stack

## Key Features

### Three-Panel Layout
- **Sidebar** (240px): Agent list and navigation
- **Main Content** (flexible): Dashboard and agent details
- **Activity Panel** (320px): Real-time activity feed

### Design System
- **Status Colors**:
  - Running: `#10B981` (green)
  - Error: `#EF4444` (red)
  - Idle: `#6B7280` (gray)
  - Paused: `#3B82F6` (blue)

## Development

### Adding Components

Place React components in `src/components/`:
```typescript
// src/components/MyComponent.tsx
export function MyComponent() {
  return <div>Hello AgentOS</div>;
}
```

### State Management

Use the Zustand store for global state:
```typescript
import { useAppStore } from './store';

function MyComponent() {
  const agents = useAppStore((state) => state.agents);
  const addAgent = useAppStore((state) => state.addAgent);
  // ...
}
```

### TypeScript Types

Import types from `src/types/`:
```typescript
import { Agent, Activity, AgentStatus } from './types';
```

## Target Specs

- Bundle size: 10-20MB
- App launch time: <500ms
- Memory footprint: <50MB idle

## Next Steps

1. Integrate worker-2's UI components (AgentStatusCard, ActivityFeed, CommandBar)
2. Implement Rust backend with Tauri IPC handlers
3. Add mock data service for demo purposes
4. Implement Cmd+K command bar functionality

## Resources

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
