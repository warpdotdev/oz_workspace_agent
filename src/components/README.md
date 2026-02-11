# UI Components for AI Agent Management App

This directory contains React components for the MacOS AI Agent Management application built with Tauri 2.0.

## Components

### AgentStatusCard

A card component displaying agent status with color-coded indicators.

**Props:**
- `agent: Agent` - Agent data object
- `onClick?: () => void` - Optional click handler
- `isSelected?: boolean` - Whether the card is selected

**Agent Interface:**
```typescript
interface Agent {
  id: string;
  name: string;
  status: 'running' | 'error' | 'idle' | 'paused';
  lastActivity: string;
  tasksCompleted: number;
  description?: string;
}
```

**Status Colors:**
- 🟢 Green: Running
- 🔴 Red: Error
- ⚪ Gray: Idle
- 🔵 Blue: Paused

**Example:**
```tsx
import { AgentStatusCard } from './components';

<AgentStatusCard
  agent={{
    id: '1',
    name: 'Data Processor',
    status: 'running',
    lastActivity: '2m ago',
    tasksCompleted: 15,
    description: 'Processing customer data'
  }}
  onClick={() => console.log('Agent clicked')}
  isSelected={true}
/>
```

---

### ActivityFeed

A scrollable feed displaying agent activity logs in real-time.

**Props:**
- `activities: ActivityItem[]` - Array of activity items
- `maxHeight?: string` - Optional max height (default: 'max-h-[600px]')

**ActivityItem Interface:**
```typescript
interface ActivityItem {
  id: string;
  timestamp: Date;
  type: 'task_started' | 'task_completed' | 'error' | 'status_change' | 'log';
  agentId: string;
  agentName: string;
  message: string;
  details?: string;
}
```

**Activity Types:**
- ▶ task_started (blue)
- ✓ task_completed (green)
- ✕ error (red)
- ● status_change (yellow)
- — log (gray)

**Example:**
```tsx
import { ActivityFeed } from './components';

<ActivityFeed
  activities={[
    {
      id: '1',
      timestamp: new Date(),
      type: 'task_completed',
      agentId: '1',
      agentName: 'Data Processor',
      message: 'Completed processing 1000 records',
      details: 'Success rate: 98.5%'
    }
  ]}
  maxHeight="max-h-[500px]"
/>
```

---

### CommandBar

A Cmd+K command palette for quick actions and task dispatch.

**Props:**
- `isOpen: boolean` - Whether the command bar is open
- `onClose: () => void` - Close handler
- `commands: Command[]` - Array of available commands
- `placeholder?: string` - Optional placeholder text

**Command Interface:**
```typescript
interface Command {
  id: string;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  action: () => void;
}
```

**Features:**
- Keyboard navigation (↑↓ arrows)
- Search filtering
- Grouped by category
- Cmd+K to toggle (built into useCommandBar hook)

**Example:**
```tsx
import { CommandBar, useCommandBar } from './components';

function App() {
  const commandBar = useCommandBar();

  const commands = [
    {
      id: '1',
      label: 'Start Agent',
      description: 'Start the selected agent',
      category: 'Agent Control',
      icon: '▶',
      action: () => console.log('Starting agent')
    },
    {
      id: '2',
      label: 'Stop Agent',
      description: 'Stop the selected agent',
      category: 'Agent Control',
      icon: '■',
      action: () => console.log('Stopping agent')
    }
  ];

  return (
    <>
      <CommandBar
        isOpen={commandBar.isOpen}
        onClose={commandBar.close}
        commands={commands}
      />
      {/* Rest of your app */}
    </>
  );
}
```

**useCommandBar Hook:**
Returns an object with:
- `isOpen: boolean` - Current open state
- `open: () => void` - Open the command bar
- `close: () => void` - Close the command bar
- `toggle: () => void` - Toggle open/close

---

## Design System

### Colors
All components follow a dark mode color scheme:
- Background: gray-900, gray-950
- Text: white, gray-300, gray-400, gray-500
- Borders: gray-700, gray-800
- Accents: Status-specific colors (green, red, blue, yellow)

### Typography
- System fonts (San Francisco on macOS)
- Monospace for code/logs

### Spacing
- Consistent padding and gaps using Tailwind spacing scale
- Rounded corners (rounded-lg)

### Animations
- Smooth transitions (duration-150, duration-200)
- Pulse animation for active status indicators
- Hover effects for interactive elements

---

## Integration Notes

These components are designed to integrate with the Tauri 2.0 project structure created by @worker-1.

**Required Dependencies:**
- React 18+
- TypeScript
- TailwindCSS

**TailwindCSS Configuration:**
Ensure your tailwind.config.js includes:
```js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Integration with Backend:**
Components accept data via props. Connect them to Tauri IPC handlers (implemented by @worker-3 and @worker-4) to receive real-time updates from the Rust backend.

---

## File Structure

```
src/components/
├── AgentStatusCard.tsx    # Agent status display
├── ActivityFeed.tsx       # Activity log feed
├── CommandBar.tsx         # Cmd+K command palette
├── index.ts               # Component exports
└── README.md             # This file
```
