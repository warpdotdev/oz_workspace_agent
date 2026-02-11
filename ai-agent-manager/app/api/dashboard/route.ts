import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/auth'

const prisma = new PrismaClient()

type AgentStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR' | 'TERMINATED'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'

interface AgentWithStatus {
  id: string
  name: string
  type: string
  status: AgentStatus
  updatedAt: Date
}

interface TaskWithStatus {
  status: TaskStatus
}

// GET /api/dashboard - Get dashboard stats and recent agents
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id || 'mock-user-id'

    // Get agent counts by status
    const agents = await prisma.agent.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        updatedAt: true,
      },
    })

    // Get task counts
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          { createdById: userId },
        ],
      },
      select: {
        status: true,
      },
    })

    // Calculate stats
    const stats = {
      totalAgents: agents.length,
      runningAgents: agents.filter((a: AgentWithStatus) => a.status === 'RUNNING').length,
      idleAgents: agents.filter((a: AgentWithStatus) => a.status === 'IDLE').length,
      errorAgents: agents.filter((a: AgentWithStatus) => a.status === 'ERROR').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t: TaskWithStatus) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
      completedTasks: tasks.filter((t: TaskWithStatus) => t.status === 'DONE').length,
    }

    // Get recent agents (sorted by most recently updated)
    const recentAgents = agents
      .sort((a: AgentWithStatus, b: AgentWithStatus) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((agent: AgentWithStatus) => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        updatedAt: agent.updatedAt,
      }))

    return NextResponse.json({
      stats,
      recentAgents,
    })
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
