export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  capabilities: string[];
  configuration: AgentConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error'
}

export interface AgentConfiguration {
  framework?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: string[];
  [key: string]: any;
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
