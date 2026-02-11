// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  capabilities: string[];
  configuration: AgentConfiguration;
  framework?: string; // Legacy property for backward compatibility
  lastActivity?: string; // Legacy property
  createdAt: string;
  updatedAt: string;
}

export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error',
  COMPLETED = 'completed'
}

// Task types
export enum TaskStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  agentId?: string;
  agent?: { id: string; name: string; status: string } | null;
  createdBy?: { id: string; name: string | null; email: string };
  subtasks?: { id: string; title: string; status: TaskStatus }[];
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  config?: Record<string, unknown>;
  errorMessage?: string;
  confidenceScore?: number;
  requiresReview?: boolean;
  startedAt?: string;
  completedAt?: string;
  retryCount?: number;
  maxRetries?: number;
  createdAt: string;
  updatedAt: string;
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

export interface AgentConfiguration {
  framework?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[];
  confidenceThreshold?: number;
  [key: string]: unknown;
}

export interface CreateAgentInput {
  name: string;
  description: string;
  capabilities?: string[];
  configuration?: AgentConfiguration;
  framework?: string; // Legacy property
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  status?: AgentStatus;
  capabilities?: string[];
  configuration?: AgentConfiguration;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || `Error: ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Agent endpoints
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.request<Agent[]>('/api/agents');
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}`);
  }

  async createAgent(input: CreateAgentInput): Promise<ApiResponse<Agent>> {
    return this.request<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateAgent(id: string, input: UpdateAgentInput): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteAgent(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Agent actions
  async startAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}/start`, {
      method: 'POST',
    });
  }

  async stopAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}/stop`, {
      method: 'POST',
    });
  }

  async pauseAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${id}/pause`, {
      method: 'POST',
    });
  }

  // Task endpoints
  async getTasks(params?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    agentId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Task[]>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return this.request<Task[]>(`/api/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}`);
  }

  async createTask(input: CreateTaskInput): Promise<ApiResponse<Task>> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async startTask(id: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}/start`, {
      method: 'POST',
    });
  }

  async completeTask(
    id: string,
    data?: { output?: Record<string, unknown>; confidenceScore?: number }
  ): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async failTask(id: string, errorMessage: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}/fail`, {
      method: 'POST',
      body: JSON.stringify({ errorMessage }),
    });
  }

  async cancelTask(id: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}/cancel`, {
      method: 'POST',
    });
  }

  async pauseTask(id: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}/pause`, {
      method: 'POST',
    });
  }

  async resumeTask(id: string): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}/resume`, {
      method: 'POST',
    });
  }

  async assignTask(id: string, agentId: string | null): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/api/tasks/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  }

  async getTaskStats(): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }>> {
    return this.request('/api/tasks/stats');
  }
}

export const api = new ApiClient();

// Backward compatibility exports for legacy code
export const agentApi = {
  list: () => api.getAgents(),
  get: (id: string) => api.getAgent(id),
  create: (input: CreateAgentInput) => api.createAgent(input),
  update: (id: string, updates: UpdateAgentInput) => api.updateAgent(id, updates),
  delete: (id: string) => api.deleteAgent(id),
};
