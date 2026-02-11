import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { emitTaskUpdated, emitTaskDeleted } from '@/lib/task-events'

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  // Error tracking fields
  errorMessage: z.string().optional().nullable(),
  errorCode: z.string().optional().nullable(),
  // Action fields
  markAsReviewed: z.boolean().optional(),
  retry: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Verify task ownership
    const existingTask = await db.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Verify project ownership if projectId is being updated
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

    // Verify agent ownership if agentId is being updated
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

    const updateData: Record<string, unknown> = { ...validatedData }
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }

    // Handle review action
    if (validatedData.markAsReviewed) {
      updateData.reviewedAt = new Date()
      updateData.reviewedById = session.user.id
      updateData.requiresReview = false
      delete updateData.markAsReviewed
    }

    // Handle retry action
    if (validatedData.retry) {
      updateData.retryCount = existingTask.retryCount + 1
      updateData.lastRetryAt = new Date()
      // Clear error on retry
      updateData.errorMessage = null
      updateData.errorCode = null
      // Reset to in progress
      updateData.status = 'IN_PROGRESS'
      delete updateData.retry
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
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
    })

    // Emit real-time event for task update
    emitTaskUpdated(session.user.id, task.id, task)

    return NextResponse.json({ task })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify task ownership
    const existingTask = await db.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    await db.task.delete({
      where: { id },
    })

    // Emit real-time event for task deletion
    emitTaskDeleted(session.user.id, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
