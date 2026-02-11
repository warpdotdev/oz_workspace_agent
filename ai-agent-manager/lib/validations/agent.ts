import { z } from 'zod'

export const agentTypeEnum = z.enum(['CODING', 'RESEARCH', 'ANALYSIS', 'GENERAL', 'CUSTOM'])
export const agentStatusEnum = z.enum(['IDLE', 'RUNNING', 'PAUSED', 'ERROR', 'TERMINATED'])

export const agentConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'local']).optional(),
}).optional()

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  type: agentTypeEnum,
  systemPrompt: z.string().max(10000, 'System prompt must be less than 10,000 characters').optional(),
  tools: z.array(z.string()).default([]),
  config: agentConfigSchema,
  projectId: z.string().optional(),
})

export const updateAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').nullable().optional(),
  type: agentTypeEnum.optional(),
  status: agentStatusEnum.optional(),
  systemPrompt: z.string().max(10000, 'System prompt must be less than 10,000 characters').nullable().optional(),
  tools: z.array(z.string()).optional(),
  config: agentConfigSchema.nullable(),
  projectId: z.string().nullable().optional(),
})

export const agentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  type: agentTypeEnum.optional(),
  status: agentStatusEnum.optional(),
  projectId: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'status', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>
export type AgentQueryInput = z.infer<typeof agentQuerySchema>
export type AgentType = z.infer<typeof agentTypeEnum>
export type AgentStatus = z.infer<typeof agentStatusEnum>
