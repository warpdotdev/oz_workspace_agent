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
  assignee?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  agent?: {
    id: string
    name: string
  }
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
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  agentId?: string
  dueDate?: string
}
