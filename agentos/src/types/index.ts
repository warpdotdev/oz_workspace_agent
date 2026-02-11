// Agent status types
export type AgentStatus = "running" | "error" | "idle" | "paused" | "pending";

// Agent interface
export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask: string | null;
  framework: "crewai" | "langchain" | "openai" | "custom";
  startedAt: Date | null;
  tokensUsed: number;
  estimatedCost: number;
  lastHeartbeat: Date;
  config: AgentConfig;
}

export interface AgentConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  tools: string[];
}

// Activity/Event types
export type ActivityType =
  | "thought"
  | "action"
  | "observation"
  | "status_change"
  | "error"
  | "task_complete"
  | "user_input";

export interface Activity {
  id: string;
  agentId: string;
  agentName: string;
  type: ActivityType;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Task types
export interface Task {
  id: string;
  agentId: string;
  instruction: string;
  status: "pending" | "running" | "completed" | "failed";
  result: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// Command bar types
export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  category: "agent" | "task" | "system";
}

// Notification types
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  agentId?: string;
}

// Performance metrics
export interface AgentMetrics {
  agentId: string;
  timestamp: Date;
  tokensPerMinute: number;
  tasksCompleted: number;
  errorRate: number;
  averageResponseTime: number;
}

// IPC command types for Tauri backend communication
export interface IPCCommand {
  type: "dispatch_task" | "pause_agent" | "resume_agent" | "stop_agent" | "get_status";
  payload: Record<string, unknown>;
}

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
