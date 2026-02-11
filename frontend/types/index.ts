export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'paused' | 'error';
  framework?: string;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
}

export interface Task {
  id: string;
  agentId: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentInput {
  name: string;
  description: string;
  framework?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
