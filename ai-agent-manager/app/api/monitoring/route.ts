import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import type {
  MonitoringData,
  SystemMetrics,
  AgentHealth,
  ActivityEvent,
  FailedTask,
  Alert,
} from '@/types/monitoring'

// Inline types matching prisma schema
interface AgentWithCount {
  id: string
  name: string
  status: string
  createdAt: Date
  updatedAt: Date
  _count: { tasks: number }
}

interface TaskWithAgent {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  agentId: string | null
  createdAt: Date
  updatedAt: Date
  agent: { name: string } | null
}

interface AuditLogWithAgent {
  id: string
  action: string
  resource: string
  resourceId: string | null
  metadata: unknown
  createdAt: Date
  agentId: string | null
  agent: { name: string } | null
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch agent data
    const agents = await db.agent.findMany({
      where: { userId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })

    // Fetch task data
    const tasks = await db.task.findMany({
      where: { createdById: userId },
      include: {
        agent: {
          select: { name: true },
        },
      },
    })

    // Fetch recent audit logs as activity events
    const auditLogs = await db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        agent: {
          select: { name: true },
        },
      },
    })

    // Calculate agent metrics
    const agentMetrics = {
      total: agents.length,
      running: agents.filter((a: AgentWithCount) => a.status === 'RUNNING').length,
      idle: agents.filter((a: AgentWithCount) => a.status === 'IDLE').length,
      paused: agents.filter((a: AgentWithCount) => a.status === 'PAUSED').length,
      error: agents.filter((a: AgentWithCount) => a.status === 'ERROR').length,
      terminated: agents.filter((a: AgentWithCount) => a.status === 'TERMINATED').length,
    }

    // Calculate task metrics
    const taskMetrics = {
      total: tasks.length,
      pending: tasks.filter((t: TaskWithAgent) => t.status === 'TODO').length,
      queued: 0, // Not in this schema
      running: tasks.filter((t: TaskWithAgent) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t: TaskWithAgent) => t.status === 'DONE').length,
      failed: 0, // Not in this schema - map to CANCELLED
      cancelled: tasks.filter((t: TaskWithAgent) => t.status === 'CANCELLED').length,
      paused: tasks.filter((t: TaskWithAgent) => t.status === 'REVIEW').length,
      completionRate:
        tasks.length > 0
          ? Math.round(
              (tasks.filter((t: TaskWithAgent) => t.status === 'DONE').length / tasks.length) *
                100
            )
          : 0,
    }

    const systemMetrics: SystemMetrics = {
      agents: agentMetrics,
      tasks: taskMetrics,
      avgLatency: null,
      avgSuccessRate: null,
    }

    // Build agent health data
    const agentHealth: AgentHealth[] = agents.map((agent: AgentWithCount) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status as AgentHealth['status'],
      successRate: null,
      avgLatency: null,
      totalRuns: agent._count.tasks,
      errorCount: agent.status === 'ERROR' ? 1 : 0,
      lastActiveAt: agent.updatedAt.toISOString(),
      createdAt: agent.createdAt.toISOString(),
    }))

    // Build activity events from audit logs
    const recentEvents: ActivityEvent[] = auditLogs.map((log: AuditLogWithAgent) => ({
      id: log.id,
      type: mapActionToEventType(log.action),
      message: `${log.action} on ${log.resource}${log.resourceId ? ` (${log.resourceId})` : ''}`,
      level: log.action.includes('ERROR') ? 'ERROR' : 'INFO',
      timestamp: log.createdAt.toISOString(),
      agentId: log.agentId,
      agentName: log.agent?.name ?? undefined,
      taskId: log.resourceId ?? null,
      data: (log.metadata as Record<string, unknown>) ?? {},
    }))

    // Build failed tasks list (map CANCELLED to failed for monitoring)
    const failedTasks: FailedTask[] = tasks
      .filter((t: TaskWithAgent) => t.status === 'CANCELLED')
      .map((task: TaskWithAgent) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: 'FAILED' as const,
        priority: task.priority as FailedTask['priority'],
        errorMessage: null,
        retryCount: 0,
        maxRetries: 3,
        agentId: task.agentId,
        agentName: task.agent?.name ?? undefined,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        startedAt: null,
      }))

    // Build alerts from agents in error state and failed tasks
    const alerts: Alert[] = [
      ...agents
        .filter((a: AgentWithCount) => a.status === 'ERROR')
        .map((agent: AgentWithCount) => ({
          id: `agent-error-${agent.id}`,
          type: 'agent_error' as const,
          severity: 'error' as const,
          title: `Agent Error: ${agent.name}`,
          message: `Agent "${agent.name}" is in error state`,
          resourceId: agent.id,
          resourceType: 'agent' as const,
          timestamp: agent.updatedAt.toISOString(),
          dismissed: false,
        })),
      ...failedTasks.slice(0, 5).map((task: FailedTask) => ({
        id: `task-failure-${task.id}`,
        type: 'task_failure' as const,
        severity: 'warning' as const,
        title: `Task Failed: ${task.title}`,
        message: task.errorMessage ?? 'Task was cancelled',
        resourceId: task.id,
        resourceType: 'task' as const,
        timestamp: task.updatedAt,
        dismissed: false,
      })),
    ]

    const data: MonitoringData = {
      systemMetrics,
      agentHealth,
      recentEvents,
      failedTasks,
      alerts,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}

function mapActionToEventType(action: string): ActivityEvent['type'] {
  const actionMap: Record<string, ActivityEvent['type']> = {
    CREATE: 'TASK_CREATED',
    START: 'AGENT_STARTED',
    STOP: 'AGENT_STOPPED',
    UPDATE: 'AGENT_CONFIG_UPDATED',
    DELETE: 'AGENT_STOPPED',
    COMPLETE: 'TASK_COMPLETED',
    FAIL: 'TASK_FAILED',
    CANCEL: 'TASK_CANCELLED',
    RETRY: 'TASK_RETRYING',
  }

  for (const [key, value] of Object.entries(actionMap)) {
    if (action.toUpperCase().includes(key)) {
      return value
    }
  }

  return 'SYSTEM_INFO'
}
