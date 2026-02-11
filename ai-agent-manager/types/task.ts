export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  projectId: string | null
  assigneeId: string | null
  agentId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  dueDate: string | null
  // Trust calibration fields
  confidenceScore?: number | null
  reasoningLog?: Record<string, unknown> | null
  executionSteps?: Record<string, unknown> | null
  requiresReview: boolean
  reviewedAt?: string | null
  reviewedById?: string | null
  // Error tracking
  errorMessage?: string | null
  errorCode?: string | null
  retryCount: number
  lastRetryAt?: string | null
  project: {
    id: string
    name: string
  } | null
  assignee: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  agent: {
    id: string
    name: string
    type: string
    status: string
  } | null
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  reviewedBy?: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  projectId?: string
  assigneeId?: string
  agentId?: string
  dueDate?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  projectId?: string | null
  assigneeId?: string | null
  agentId?: string | null
  dueDate?: string | null
}
