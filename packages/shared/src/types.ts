// Core entity types for AI Agent Management Platform

export type AgentStatus = 'active' | 'paused' | 'archived';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  status: AgentStatus;
  capabilities: string[];
  guardrails: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  agentId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedBy: string;
  assignedAt: Date;
  completedAt?: Date;
  input: Record<string, any>;
  output?: Record<string, any>;
}

export interface ExecutionStep {
  id: string;
  stepNumber: number;
  action: string;
  reasoning: string;
  result?: string;
  timestamp: Date;
}

export interface Execution {
  id: string;
  taskId: string;
  agentId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  steps: ExecutionStep[];
  confidence: number; // 0-100
  errorMessage?: string;
}

export interface AuditLog {
  id: string;
  agentId: string;
  userId: string;
  action: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

// API request/response types

export interface CreateAgentRequest {
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  capabilities?: string[];
  guardrails?: string[];
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  status?: AgentStatus;
  capabilities?: string[];
  guardrails?: string[];
}

export interface CreateTaskRequest {
  agentId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  input: Record<string, any>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

// User authentication types

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
