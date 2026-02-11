// Task types matching Prisma schema
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface TaskAssignee {
  id: string
  name: string | null
  email: string
  image: string | null
}

export interface TaskAgent {
  id: string
  name: string
  status: string
}

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
  assignee?: TaskAssignee | null
  agent?: TaskAgent | null
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
  projectId?: string
  assigneeId?: string
  agentId?: string
  dueDate?: string
}

// Kanban column configuration
export const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'REVIEW', label: 'Review', color: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'DONE', label: 'Done', color: 'bg-green-50 dark:bg-green-900/20' },
]

// Priority configuration with semantic colors
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  HIGH: { label: 'High', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

// Status configuration with semantic colors
export const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  TODO: { label: 'To Do', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  REVIEW: { label: 'Review', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  DONE: { label: 'Done', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}
