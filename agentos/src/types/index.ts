// Agent status types
export type AgentStatus = "running" | "error" | "idle" | "paused";

// Agent framework types
export type AgentFramework = "crewai" | "langchain" | "openai" | "custom";

// Agent configuration
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  framework: AgentFramework;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string | null;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

// Full agent state
export interface Agent {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  currentTask: string | null;
  runtime: number;
  tokensUsed: number;
  lastActivity: string;
  errorMessage: string | null;
}

// Activity/Event types
export type EventType =
  | "thought"
  | "action"
  | "observation"
  | "status_change"
  | "error"
  | "task_complete";

export type ActivityType = EventType;

export interface AgentEvent {
  id: string;
  agentId: string;
  agentName: string;
  eventType: EventType;
  message: string;
  timestamp: string;
}

export interface Activity extends AgentEvent {
  type: ActivityType;
  content: string;
}

export interface ActivityEvent extends AgentEvent {
  type: ActivityType;
  content: string;
}

// Task types
export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface Task {
  id: string;
  agentId: string;
  instruction: string;
  status: TaskStatus;
  result: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
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
