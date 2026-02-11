// API Client for Agent Management
// Type-safe backend communication layer

export type AgentStatus = "IDLE" | "RUNNING" | "PAUSED" | "ERROR" | "TERMINATED";
export type AgentType = "CODING" | "RESEARCH" | "ANALYSIS" | "GENERAL" | "CUSTOM";
export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";
export type EventType = "STARTED" | "STOPPED" | "PAUSED" | "RESUMED" | "TASK_COMPLETED" | "TASK_FAILED" | "ERROR" | "WARNING" | "HEALTH_CHECK" | "CONFIG_CHANGED";
export type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: AgentType;
  status: AgentStatus;
  config: Record<string, unknown> | null;
  systemPrompt: string | null;
  tools: string[];
  userId: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  confidenceScore?: number;
  reasoningLog?: Record<string, unknown>[];
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  type: AgentType;
  systemPrompt?: string;
  tools?: string[];
  config?: Record<string, unknown>;
  projectId?: string;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  type?: AgentType;
  status?: AgentStatus;
  systemPrompt?: string;
  tools?: string[];
  config?: Record<string, unknown>;
}

export interface AgentMetrics {
  id: string;
  agentId: string;
  tasksCompleted: number;
  tasksFailed: number;
  avgResponseTime: number | null;
  uptime: number | null;
  lastHealthCheck: string | null;
  healthStatus: HealthStatus;
  errorCount: number;
  lastError: string | null;
  lastErrorAt: string | null;
  cpuUsage: number | null;
  memoryUsage: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  eventType: EventType;
  message: string;
  severity: Severity;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AgentWithMetrics extends Agent {
  metrics: AgentMetrics | null;
}

export interface MonitoringOverview {
  totalAgents: number;
  activeAgents: number;
  healthyAgents: number;
  degradedAgents: number;
  unhealthyAgents: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  avgResponseTime: number | null;
  recentEvents: AgentEvent[];
}

// Framework options for agent creation
export const AGENT_FRAMEWORKS = [
  { id: "langchain", name: "LangChain", description: "Build context-aware reasoning applications" },
  { id: "crewai", name: "CrewAI", description: "Multi-agent orchestration framework" },
  { id: "autogpt", name: "AutoGPT", description: "Autonomous AI agent framework" },
  { id: "openai", name: "OpenAI Assistants", description: "OpenAI's native assistant API" },
  { id: "anthropic", name: "Anthropic Claude", description: "Claude-based agents" },
  { id: "custom", name: "Custom", description: "Build your own agent logic" },
] as const;

export type FrameworkId = (typeof AGENT_FRAMEWORKS)[number]["id"];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `API error: ${response.status}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// Agent API functions
// Monitoring API functions
export const monitoringApi = {
  // Get monitoring overview
  async getOverview(): Promise<MonitoringOverview> {
    return fetchApi<MonitoringOverview>("/monitoring/overview");
  },

  // Get all agents with their metrics
  async getAgentsWithMetrics(): Promise<AgentWithMetrics[]> {
    return fetchApi<AgentWithMetrics[]>("/monitoring/agents");
  },

  // Get metrics for a specific agent
  async getAgentMetrics(agentId: string): Promise<AgentMetrics> {
    return fetchApi<AgentMetrics>(`/monitoring/agents/${agentId}/metrics`);
  },

  // Get events for a specific agent
  async getAgentEvents(agentId: string, limit?: number): Promise<AgentEvent[]> {
    const params = limit ? `?limit=${limit}` : "";
    return fetchApi<AgentEvent[]>(`/monitoring/agents/${agentId}/events${params}`);
  },

  // Get recent events across all agents
  async getRecentEvents(limit?: number): Promise<AgentEvent[]> {
    const params = limit ? `?limit=${limit}` : "";
    return fetchApi<AgentEvent[]>(`/monitoring/events${params}`);
  },

  // Trigger health check for an agent
  async triggerHealthCheck(agentId: string): Promise<AgentMetrics> {
    return fetchApi<AgentMetrics>(`/monitoring/agents/${agentId}/health-check`, {
      method: "POST",
    });
  },
};

export const agentApi = {
  // List all agents
  async list(): Promise<Agent[]> {
    return fetchApi<Agent[]>("/agents");
  },

  // Get single agent by ID
  async get(id: string): Promise<Agent> {
    return fetchApi<Agent>(`/agents/${id}`);
  },

  // Create new agent
  async create(data: CreateAgentInput): Promise<Agent> {
    return fetchApi<Agent>("/agents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update existing agent
  async update(id: string, data: UpdateAgentInput): Promise<Agent> {
    return fetchApi<Agent>(`/agents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete agent
  async delete(id: string): Promise<void> {
    await fetchApi(`/agents/${id}`, {
      method: "DELETE",
    });
  },

  // Agent lifecycle controls
  async start(id: string): Promise<Agent> {
    return fetchApi<Agent>(`/agents/${id}/start`, {
      method: "POST",
    });
  },

  async stop(id: string): Promise<Agent> {
    return fetchApi<Agent>(`/agents/${id}/stop`, {
      method: "POST",
    });
  },

  async pause(id: string): Promise<Agent> {
    return fetchApi<Agent>(`/agents/${id}/pause`, {
      method: "POST",
    });
  },

  async resume(id: string): Promise<Agent> {
    return fetchApi<Agent>(`/agents/${id}/resume`, {
      method: "POST",
    });
  },
};

export { ApiError };
