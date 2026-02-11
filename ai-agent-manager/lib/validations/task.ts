import { z } from 'zod'

// Task status values with validation
export const TaskStatusSchema = z.enum([
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'CANCELLED',
])

export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

// Valid status transitions - manual assignment first per product-lead guidance
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  TODO: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['REVIEW', 'TODO', 'CANCELLED'],
  REVIEW: ['DONE', 'IN_PROGRESS', 'CANCELLED'],
  DONE: ['TODO'], // Allow reopening
  CANCELLED: ['TODO'], // Allow reopening
}

// Reasoning log entry schema - for transparency
export const ReasoningLogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  action: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Execution step schema - for transparency
export const ExecutionStepSchema = z.object({
  step: z.number(),
  action: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  result: z.unknown().optional(),
  error: z.string().optional(),
})

// Create task schema
export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(10000).optional(),
  status: TaskStatusSchema.optional().default('TODO'),
  priority: TaskPrioritySchema.optional().default('MEDIUM'),
  projectId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  agentId: z.string().cuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  // Trust fields - first-class features
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  reasoningLog: z.array(ReasoningLogEntrySchema).optional().nullable(),
  executionSteps: z.array(ExecutionStepSchema).optional().nullable(),
  requiresReview: z.boolean().optional().default(false),
})

// Update task schema
export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  projectId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  agentId: z.string().cuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  // Trust fields
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  reasoningLog: z.array(ReasoningLogEntrySchema).optional().nullable(),
  executionSteps: z.array(ExecutionStepSchema).optional().nullable(),
  requiresReview: z.boolean().optional(),
  // Review fields
  reviewNotes: z.string().max(10000).optional().nullable(),
  wasOverridden: z.boolean().optional(),
})

// Query params schema for listing tasks
export const TaskQuerySchema = z.object({
  projectId: z.string().cuid().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  assigneeId: z.string().cuid().optional(),
  agentId: z.string().cuid().optional(),
  requiresReview: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
})

// Helper to validate status transition
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
  return validTransitions?.includes(newStatus) ?? false
}

// Types
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
export type TaskQuery = z.infer<typeof TaskQuerySchema>
