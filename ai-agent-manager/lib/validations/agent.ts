import { z } from 'zod'

export const agentTypeSchema = z.enum([
  'CODING',
  'RESEARCH',
  'ANALYSIS',
  'GENERAL',
  'CUSTOM',
])

export const agentStatusSchema = z.enum([
  'IDLE',
  'RUNNING',
  'PAUSED',
  'ERROR',
  'TERMINATED',
])

// Basic info schema (Step 1 - always shown)
export const agentBasicInfoSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
})

// Framework selection schema (Step 2 - shown on demand)
export const agentFrameworkSchema = z.object({
  type: agentTypeSchema,
  systemPrompt: z
    .string()
    .max(10000, 'System prompt must be less than 10000 characters')
    .optional(),
})

// Advanced config schema (Step 3 - hidden until needed)
export const agentAdvancedConfigSchema = z.object({
  tools: z.array(z.string()),
  config: z
    .object({
      maxTokens: z.number().int().positive().optional(),
      temperature: z.number().min(0).max(2).optional(),
      model: z.string().optional(),
      timeout: z.number().int().positive().optional(),
      retryAttempts: z.number().int().min(0).max(10).optional(),
      confidenceThreshold: z.number().min(0).max(1).optional(),
    })
    .optional(),
  projectId: z.string().optional(),
})

// Complete agent creation schema
export const createAgentSchema = agentBasicInfoSchema
  .merge(agentFrameworkSchema)
  .merge(agentAdvancedConfigSchema)

// Update agent schema (all fields optional except id)
export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  type: agentTypeSchema.optional(),
  status: agentStatusSchema.optional(),
  systemPrompt: z.string().max(10000).optional().nullable(),
  tools: z.array(z.string()).optional(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
  projectId: z.string().optional().nullable(),
})

export type AgentBasicInfo = z.infer<typeof agentBasicInfoSchema>
export type AgentFramework = z.infer<typeof agentFrameworkSchema>
export type AgentAdvancedConfig = z.infer<typeof agentAdvancedConfigSchema>
export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>
export type AgentType = z.infer<typeof agentTypeSchema>
export type AgentStatus = z.infer<typeof agentStatusSchema>
