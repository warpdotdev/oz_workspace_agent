// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  capabilities: string[];
  configuration: AgentConfiguration;
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

  // Monitoring endpoints
  async getMonitoringStats(): Promise<ApiResponse<MonitoringStats>> {
    return this.request<MonitoringStats>('/api/monitoring/stats');
  }

  async getAgentHealth(id: string): Promise<ApiResponse<AgentHealth>> {
    return this.request<AgentHealth>(`/api/monitoring/agents/${id}/health`);
  }

  async getEvents(params?: EventQueryParams): Promise<ApiResponse<Event[]>> {
    const query = new URLSearchParams();
    if (params?.agentId) query.set('agentId', params.agentId);
    if (params?.type) query.set('type', params.type);
    if (params?.level) query.set('level', params.level);
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    const queryString = query.toString();
    return this.request<Event[]>(`/api/monitoring/events${queryString ? `?${queryString}` : ''}`);
  }

  async getAuditLogs(params?: AuditLogQueryParams): Promise<ApiResponse<AuditLog[]>> {
    const query = new URLSearchParams();
    if (params?.resource) query.set('resource', params.resource);
    if (params?.action) query.set('action', params.action);
    if (params?.startDate) query.set('startDate', params.startDate.toISOString());
    if (params?.endDate) query.set('endDate', params.endDate.toISOString());
    if (params?.limit) query.set('limit', params.limit.toString());
    
    const queryString = query.toString();
    return this.request<AuditLog[]>(`/api/monitoring/audit-logs${queryString ? `?${queryString}` : ''}`);
  }
}

// Monitoring types
export interface MonitoringStats {
  overview: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
  recentEvents: Event[];
  recentAuditLogs: AuditLog[];
  errorSummary: ErrorSummary[];
}

export interface AgentHealth {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  uptime: number | null;
  taskCompletionRate: number;
  errorRate: number;
  lastActivity: string | null;
  confidenceScore: number;
  recentEvents: Event[];
}

export interface Event {
  id: string;
  type: EventType;
  message: string;
  level: EventLevel;
  timestamp: string;
  agentId: string | null;
  taskId: string | null;
  agent?: {
    id: string;
    name: string;
    status: AgentStatus;
  } | null;
  task?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export enum EventType {
  AGENT_STARTED = 'AGENT_STARTED',
  AGENT_STOPPED = 'AGENT_STOPPED',
  AGENT_ERROR = 'AGENT_ERROR',
  AGENT_CONFIG_UPDATED = 'AGENT_CONFIG_UPDATED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_STARTED = 'TASK_STARTED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_CANCELLED = 'TASK_CANCELLED',
  TASK_RETRYING = 'TASK_RETRYING',
  SYSTEM_INFO = 'SYSTEM_INFO',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum EventLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface ErrorSummary {
  agentId: string;
  agentName: string;
  errorCount: number;
  lastError: string;
  lastErrorTime: string;
}

export interface EventQueryParams {
  agentId?: string;
  type?: string;
  level?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AuditLogQueryParams {
  resource?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export const api = new ApiClient();
