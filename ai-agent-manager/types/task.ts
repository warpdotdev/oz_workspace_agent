// Task types matching the Prisma schema
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
  } | null
  agent?: {
    id: string
    name: string
  } | null
  project?: {
    id: string
    name: string
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

// Kanban column configuration
export const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
]

// Status colors (semantic: gray=backlog/todo, blue=in_progress, yellow=review, green=done, red=cancelled)
export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  TODO: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
  IN_PROGRESS: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
  REVIEW: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700' },
  DONE: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
  CANCELLED: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
}

// Priority colors
export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  LOW: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  MEDIUM: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400' },
  HIGH: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-600 dark:text-orange-400' },
  URGENT: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-600 dark:text-red-400' },
}
