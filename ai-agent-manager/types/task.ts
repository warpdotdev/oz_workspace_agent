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
  project?: {
    id: string
    name: string
  } | null
  assignee?: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  agent?: {
    id: string
    name: string
    type: string
    status: string
  } | null
  createdBy?: {
    id: string
    name: string | null
    email: string
  }
}

export interface CreateTaskInput {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  projectId?: string | null
  assigneeId?: string | null
  agentId?: string | null
  dueDate?: string | null
}

export type UpdateTaskInput = Partial<CreateTaskInput>

// Column configuration for Kanban
export const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
]
