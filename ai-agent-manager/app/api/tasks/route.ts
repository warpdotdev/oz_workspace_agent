import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@prisma/client'

// Validation schema for creating tasks
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  agentId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

// GET /api/tasks - List all tasks with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigneeId = searchParams.get('assigneeId')
    const agentId = searchParams.get('agentId')

    // Build filter conditions
    const where: any = {
      createdById: session.user.id, // Only show tasks created by the user
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (agentId) where.agentId = agentId

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
      },
      orderBy: [
        { status: 'asc' }, // Group by status
        { priority: 'desc' }, // High priority first
        { createdAt: 'desc' }, // Newest first
      ],
    })

    return NextResponse.json({ tasks }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Verify project belongs to user if projectId is provided
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

    // Verify assignee exists if assigneeId is provided
    if (validatedData.assigneeId) {
      const assignee = await db.user.findUnique({
        where: { id: validatedData.assigneeId },
      })

      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found' },
          { status: 404 }
        )
      }
    }

    // Verify agent belongs to user if agentId is provided
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
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : undefined,
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

    // TODO: Broadcast task creation via WebSocket

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
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
