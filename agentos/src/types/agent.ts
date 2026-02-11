// Agent status types
export type AgentStatus = 'running' | 'idle' | 'error' | 'paused';

// Agent model/framework types
export type AgentFramework = 'crewai' | 'langchain' | 'openai' | 'custom';

// Agent configuration
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  framework: AgentFramework;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  tools: string[];
  createdAt: string;
  updatedAt: string;
}

// Agent runtime state
export interface Agent {
  id: string;
  config: AgentConfig;
  status: AgentStatus;
  currentTask?: string;
  runtime: number; // seconds
  tokensUsed: number;
  lastActivity: string;
  errorMessage?: string;
}

// Agent metrics for charts
export interface AgentMetrics {
  agentId: string;
  timestamp: string;
  tokensUsed: number;
  responseTime: number;
  successRate: number;
}

// Task types
export interface Task {
  id: string;
  agentId: string;
  instruction: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Event types for activity feed
export type EventType = 'status_change' | 'thought' | 'action' | 'error' | 'task_complete';

export interface AgentEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: EventType;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
