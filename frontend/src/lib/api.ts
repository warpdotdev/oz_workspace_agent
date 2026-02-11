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
}

export const api = new ApiClient();
