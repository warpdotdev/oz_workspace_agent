import { z } from 'zod';
import { AgentType, AgentStatus, TaskStatus, TaskPriority } from '@prisma/client';

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Agent schemas
export const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(AgentType).default(AgentType.CUSTOM),
  framework: z.string().max(100).optional(),
  version: z.string().max(50).optional(),
  config: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
  capabilities: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    config: z.record(z.unknown()).default({}),
    enabled: z.boolean().default(true),
  })).optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  type: z.nativeEnum(AgentType).optional(),
  status: z.nativeEnum(AgentStatus).optional(),
  framework: z.string().max(100).optional(),
  version: z.string().max(50).optional(),
  config: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const agentQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(AgentStatus).optional(),
  type: z.nativeEnum(AgentType).optional(),
  framework: z.string().optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Capability schemas
export const createCapabilitySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  config: z.record(z.unknown()).default({}),
  enabled: z.boolean().default(true),
});

export const updateCapabilitySchema = z.object({
  description: z.string().max(500).optional(),
  config: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  agentId: z.string().cuid().optional(),
  parentTaskId: z.string().cuid().optional(),
  input: z.record(z.unknown()).default({}),
  config: z.record(z.unknown()).default({}),
  maxRetries: z.number().int().min(0).max(10).default(3),
  requiresReview: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  agentId: z.string().cuid().nullable().optional(),
  input: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  errorMessage: z.string().max(2000).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  reasoning: z.string().max(10000).optional(),
  requiresReview: z.boolean().optional(),
});

export const taskQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  agentId: z.string().cuid().optional(),
  requiresReview: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const assignTaskSchema = z.object({
  agentId: z.string().cuid().nullable(),
});

export const completeTaskSchema = z.object({
  output: z.record(z.unknown()).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  reasoning: z.string().max(10000).optional(),
});

export const failTaskSchema = z.object({
  errorMessage: z.string().min(1).max(2000),
  reasoning: z.string().max(10000).optional(),
});

// Event query schema
export const eventQuerySchema = paginationSchema.extend({
  agentId: z.string().cuid().optional(),
  taskId: z.string().cuid().optional(),
  type: z.string().optional(),
  level: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255).optional(),
});

// ID param schema
export const idParamSchema = z.object({
  id: z.string().cuid(),
});

// Type exports
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type AgentQueryParams = z.infer<typeof agentQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryParams = z.infer<typeof taskQuerySchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type FailTaskInput = z.infer<typeof failTaskSchema>;
export type EventQueryParams = z.infer<typeof eventQuerySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
