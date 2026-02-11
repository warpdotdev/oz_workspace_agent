// Export Prisma types for use throughout the application
export type {
  User,
  Agent,
  Task,
  AgentExecution,
  Event,
  UserRole,
  AgentType,
  AgentStatus,
  AutonomyLevel,
  TaskStatus,
  Priority,
  ExecutionStatus,
  EventType,
  EventCategory,
} from '@prisma/client';

// Custom types and interfaces
export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  role?: 'ADMIN' | 'USER' | 'VIEWER';
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  type?: string;
  framework?: string;
  modelProvider?: string;
  modelName?: string;
  config?: Record<string, unknown>;
  autonomyLevel?: 'AUTONOMOUS' | 'SUPERVISED' | 'MANUAL';
  maxRetries?: number;
  timeoutSeconds?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  agentId?: string;
  input?: Record<string, unknown>;
  dueDate?: Date;
  estimatedDurationSeconds?: number;
}

export interface CreateExecutionInput {
  agentId: string;
  taskId?: string;
}

export interface CreateEventInput {
  type: string;
  category?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'DEBUG';
  message: string;
  details?: Record<string, unknown>;
  agentId?: string;
  taskId?: string;
  executionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query filter types
export interface QueryFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface AgentFilters extends QueryFilters {
  status?: string;
  type?: string;
  framework?: string;
}

export interface TaskFilters extends QueryFilters {
  status?: string;
  priority?: string;
  agentId?: string;
}

export interface ExecutionFilters extends QueryFilters {
  status?: string;
  agentId?: string;
  taskId?: string;
}

export interface EventFilters extends QueryFilters {
  type?: string;
  category?: string;
  agentId?: string;
  taskId?: string;
  executionId?: string;
  startDate?: Date;
  endDate?: Date;
}
