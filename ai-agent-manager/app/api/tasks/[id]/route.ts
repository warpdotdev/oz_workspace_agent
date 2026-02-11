import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@prisma/client'

// Validation schema for updating tasks
const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  agentId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

// GET /api/tasks/[id] - Get a single task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await db.task.findFirst({
      where: {
        id: params.id,
        createdById: session.user.id, // Only allow access to own tasks
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
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
            description: true,
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

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ task }, { status: 200 })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if task exists and user has access
    const existingTask = await db.task.findFirst({
      where: {
        id: params.id,
        createdById: session.user.id,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

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

    // Validate status transitions
    if (validatedData.status) {
      const validTransitions: Record<TaskStatus, TaskStatus[]> = {
        TODO: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['REVIEW', 'TODO', 'CANCELLED'],
        REVIEW: ['DONE', 'IN_PROGRESS', 'CANCELLED'],
        DONE: ['REVIEW'], // Can reopen from done to review
        CANCELLED: ['TODO'], // Can reactivate cancelled tasks
      }

      const allowedStatuses = validTransitions[existingTask.status]
      if (!allowedStatuses.includes(validatedData.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${existingTask.status} to ${validatedData.status}`,
          },
          { status: 400 }
        )
      }
    }

    const task = await db.task.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : undefined,
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

    // TODO: Broadcast task update via WebSocket

    return NextResponse.json({ task }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if task exists and user has access
    const task = await db.task.findFirst({
      where: {
        id: params.id,
        createdById: session.user.id,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    await db.task.delete({
      where: { id: params.id },
    })

    // TODO: Broadcast task deletion via WebSocket

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
