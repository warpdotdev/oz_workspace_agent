// Agent status types
export type AgentStatus = 'running' | 'error' | 'idle' | 'paused';

// Agent interface
export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  currentTask?: string;
  runtime: number; // in milliseconds
  tokenUsage: {
    input: number;
    output: number;
  };
  model: string;
  createdAt: Date;
  lastActiveAt: Date;
}

// Activity event types
export type ActivityEventType = 
  | 'status_change'
  | 'thought'
  | 'task_started'
  | 'task_completed'
  | 'error'
  | 'warning'
  | 'info';

// Activity event interface
export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: ActivityEventType;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentId?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Performance metrics
export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  requestsPerMinute: number;
  averageLatency: number;
  errorRate: number;
}
