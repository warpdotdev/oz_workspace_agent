// Monitoring dashboard types

export type AgentStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR' | 'TERMINATED'

export type TaskStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PAUSED'

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type EventLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export type EventType =
  | 'AGENT_STARTED'
  | 'AGENT_STOPPED'
  | 'AGENT_ERROR'
  | 'AGENT_CONFIG_UPDATED'
  | 'TASK_CREATED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'TASK_CANCELLED'
  | 'TASK_RETRYING'
  | 'SYSTEM_INFO'
  | 'SYSTEM_WARNING'
  | 'SYSTEM_ERROR'

export interface AgentHealth {
  id: string
  name: string
  status: AgentStatus
  successRate: number | null
  avgLatency: number | null
  totalRuns: number
  errorCount: number
  lastActiveAt: string | null
  createdAt: string
}

export interface TaskMetrics {
  total: number
  pending: number
  queued: number
  running: number
  completed: number
  failed: number
  cancelled: number
  paused: number
  completionRate: number
}

export interface AgentMetrics {
  total: number
  running: number
  idle: number
  paused: number
  error: number
  terminated: number
}

export interface SystemMetrics {
  agents: AgentMetrics
  tasks: TaskMetrics
  avgLatency: number | null
  avgSuccessRate: number | null
}

export interface ActivityEvent {
  id: string
  type: EventType
  message: string
  level: EventLevel
  timestamp: string
  agentId: string | null
  agentName?: string
  taskId: string | null
  taskTitle?: string
  data: Record<string, unknown>
}

export interface FailedTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  errorMessage: string | null
  retryCount: number
  maxRetries: number
  agentId: string | null
  agentName?: string
  createdAt: string
  updatedAt: string
  startedAt: string | null
}

export interface Alert {
  id: string
  type: 'agent_error' | 'task_failure' | 'system_warning'
  severity: 'warning' | 'error' | 'critical'
  title: string
  message: string
  resourceId: string
  resourceType: 'agent' | 'task'
  timestamp: string
  dismissed: boolean
}

export interface MonitoringData {
  systemMetrics: SystemMetrics
  agentHealth: AgentHealth[]
  recentEvents: ActivityEvent[]
  failedTasks: FailedTask[]
  alerts: Alert[]
}
