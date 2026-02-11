export type AgentStatus = 'running' | 'error' | 'idle' | 'paused';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
  runtime?: string;
  tokenUsage?: number;
  lastActivity?: Date;
}

export type ActivityType = 'thought' | 'status_change' | 'error' | 'task_complete';

export interface Activity {
  id: string;
  agentId: string;
  type: ActivityType;
  message: string;
  timestamp: Date;
  details?: string;
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  category?: string;
  action: () => void | Promise<void>;
  shortcut?: string;
}
