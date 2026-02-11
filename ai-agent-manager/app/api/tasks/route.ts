import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { emitTaskCreated } from '@/lib/task-events'
import { Prisma } from '@prisma/client'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  agentId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'] as const
const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

function isValidStatus(status: string): status is typeof validStatuses[number] {
  return validStatuses.includes(status as typeof validStatuses[number])
}

function isValidPriority(priority: string): priority is typeof validPriorities[number] {
  return validPriorities.includes(priority as typeof validPriorities[number])
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const projectId = searchParams.get('projectId')
    const agentId = searchParams.get('agentId')
    const requiresReview = searchParams.get('requiresReview')
    const hasError = searchParams.get('hasError')

    const where: Prisma.TaskWhereInput = {
      createdById: session.user.id,
    }

    if (status && isValidStatus(status)) {
      where.status = status
    }
    if (priority && isValidPriority(priority)) {
      where.priority = priority
    }
    if (projectId) {
      where.projectId = projectId
    }
    if (agentId) {
      where.agentId = agentId
    }
    // Trust filters
    if (requiresReview === 'true') {
      where.requiresReview = true
    }
    // Error filter
    if (hasError === 'true') {
      where.errorMessage = { not: null }
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { requiresReview: 'desc' }, // Prioritize items needing review
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Include metadata about task states
    const meta = {
      total: tasks.length,
      needsReview: tasks.filter(t => t.requiresReview).length,
      hasErrors: tasks.filter(t => t.errorMessage).length,
    }

    return NextResponse.json({ tasks, meta })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Verify project ownership if projectId is provided
    if (validatedData.projectId) {
      const project = await db.project.findFirst({
        where: {
          id: validatedData.projectId,
          userId: session.user.id,
        },
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Verify agent ownership if agentId is provided
    if (validatedData.agentId) {
      const agent = await db.agent.findFirst({
        where: {
          id: validatedData.agentId,
          userId: session.user.id,
        },
      })
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found or access denied' },
          { status: 404 }
        )
      }
    }

    const task = await db.task.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        createdById: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Emit real-time event for task creation
    emitTaskCreated(session.user.id, task.id, task)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
