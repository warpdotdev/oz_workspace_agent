import { AgentType, AgentStatus, TaskStatus, TaskPriority, UserRole } from '@prisma/client';

// Re-export Prisma enums for convenience
export { AgentType, AgentStatus, TaskStatus, TaskPriority, UserRole };

// User types
export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest {
  user: UserPayload;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Agent types
export interface CreateAgentInput {
  name: string;
  description?: string;
  type?: AgentType;
  framework?: string;
  version?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  capabilities?: CreateCapabilityInput[];
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

export interface CreateCapabilityInput {
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export interface AgentQueryParams {
  page?: number;
  limit?: number;
  status?: AgentStatus;
  type?: AgentType;
  framework?: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Task types
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
  agentId?: string;
  input?: Record<string, unknown>;
  config?: Record<string, unknown>;
  output?: Record<string, unknown>;
  errorMessage?: string;
}

// Event types
export interface EventQueryParams {
  agentId?: string;
  taskId?: string;
  type?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Auth types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  };
}
