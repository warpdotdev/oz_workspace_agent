import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/auth'

// Validation schema for creating a task
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional().default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  agentId: z.string().optional(),
  dueDate: z.string().optional(),
})

// GET /api/tasks - List all tasks for the current user
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

    // Build where clause
    const where: any = {
      createdById: session.user.id,
    }

    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }
    if (projectId) {
      where.projectId = projectId
    }

    const tasks = await db.task.findMany({
      where,
      include: {
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
            status: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ tasks })
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

    // Convert dueDate string to Date if provided
    const taskData: any = {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      priority: validatedData.priority,
      createdById: session.user.id,
    }

    if (validatedData.projectId) {
      taskData.projectId = validatedData.projectId
    }
    if (validatedData.assigneeId) {
      taskData.assigneeId = validatedData.assigneeId
    }
    if (validatedData.agentId) {
      taskData.agentId = validatedData.agentId
    }
    if (validatedData.dueDate) {
      taskData.dueDate = new Date(validatedData.dueDate)
    }

    const task = await db.task.create({
      data: taskData,
      include: {
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
            status: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
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
