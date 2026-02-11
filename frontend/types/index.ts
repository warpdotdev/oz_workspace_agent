export type AgentStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR' | 'TERMINATED';
export type AgentType = 'CUSTOM' | 'ASSISTANT' | 'WORKER' | 'ORCHESTRATOR' | 'SPECIALIST';

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: AgentType;
  status: AgentStatus;
  framework?: string | null;
  version?: string | null;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  successRate?: number | null;
  avgLatency?: number | null;
  totalRuns: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string | null;
  capabilities?: AgentCapability[];
  _count?: { tasks: number; events: number };
}

export interface AgentCapability {
  id: string;
  name: string;
  description?: string | null;
  config: Record<string, unknown>;
  enabled: boolean;
}

export type TaskStatus = 'PENDING' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PAUSED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  config: Record<string, unknown>;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  maxRetries: number;
  parentTaskId?: string | null;
  agentId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  agent?: { id: string; name: string; status: string } | null;
  createdBy?: { id: string; name: string | null; email: string };
  _count?: { subtasks: number; events: number };
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  type?: AgentType;
  framework?: string;
  version?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  capabilities?: {
    name: string;
    description?: string;
    config?: Record<string, unknown>;
    enabled?: boolean;
  }[];
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  type?: AgentType;
  status?: AgentStatus;
  framework?: string;
  version?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  agentId?: string;
  parentTaskId?: string;
  input?: Record<string, unknown>;
  config?: Record<string, unknown>;
  maxRetries?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  agentId?: string | null;
  input?: Record<string, unknown>;
  config?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorMessage?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationInfo;
  error?: string;
}

export interface TaskStats {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}
