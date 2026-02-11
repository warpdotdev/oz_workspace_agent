import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { UpdateTaskSchema, isValidStatusTransition } from '@/lib/validations/task'
import { shouldRequireReview, recordOverride, recordRetry } from '@/lib/trust-metrics'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/tasks/[id]
 * Get a single task by ID with ownership validation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const task = await db.task.findFirst({
      where: {
        id,
        createdById: session.user.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, type: true, status: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task with status transition validation and trust tracking
 * Tracks overrides and retries for trust metrics
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check task exists and belongs to user
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

    const body = await request.json()
    const parsed = UpdateTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData = parsed.data

    // Validate status transition if status is being changed
    if (updateData.status && updateData.status !== existingTask.status) {
      if (!isValidStatusTransition(existingTask.status, updateData.status)) {
        return NextResponse.json(
          {
            error: 'Invalid status transition',
            details: {
              currentStatus: existingTask.status,
              requestedStatus: updateData.status,
            },
          },
          { status: 400 }
        )
      }

      // Track retry attempts for velocity metric
      if (
        existingTask.status === 'CANCELLED' &&
        updateData.status === 'TODO'
      ) {
        await recordRetry(id)
      }
    }

    // Validate project if being updated
    if (updateData.projectId) {
      const project = await db.project.findFirst({
        where: { id: updateData.projectId, userId: session.user.id },
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Validate agent if being updated
    if (updateData.agentId) {
      const agent = await db.agent.findFirst({
        where: { id: updateData.agentId, userId: session.user.id },
      })
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Handle override tracking - trust calibration feature
    if (updateData.wasOverridden) {
      await recordOverride(
        id,
        session.user.id,
        updateData.reviewNotes ?? undefined
      )
    }

    // Auto-flag for review if confidence changes to low value
    let computedRequiresReview = updateData.requiresReview
    if (updateData.confidenceScore !== undefined) {
      computedRequiresReview =
        updateData.requiresReview ?? shouldRequireReview(updateData.confidenceScore)
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {}
    
    if (updateData.title !== undefined) updatePayload.title = updateData.title
    if (updateData.description !== undefined) updatePayload.description = updateData.description
    if (updateData.status !== undefined) updatePayload.status = updateData.status
    if (updateData.priority !== undefined) updatePayload.priority = updateData.priority
    if (updateData.projectId !== undefined) updatePayload.projectId = updateData.projectId
    if (updateData.assigneeId !== undefined) updatePayload.assigneeId = updateData.assigneeId
    if (updateData.agentId !== undefined) updatePayload.agentId = updateData.agentId
    if (updateData.dueDate !== undefined) {
      updatePayload.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null
    }
    
    // Trust fields
    if (updateData.confidenceScore !== undefined) updatePayload.confidenceScore = updateData.confidenceScore
    if (updateData.reasoningLog !== undefined) updatePayload.reasoningLog = updateData.reasoningLog
    if (updateData.executionSteps !== undefined) updatePayload.executionSteps = updateData.executionSteps
    if (computedRequiresReview !== undefined) updatePayload.requiresReview = computedRequiresReview
    if (updateData.reviewNotes !== undefined) updatePayload.reviewNotes = updateData.reviewNotes

    // Track when task starts for retry velocity
    if (updateData.status === 'IN_PROGRESS' && !existingTask.firstAttemptAt) {
      updatePayload.firstAttemptAt = new Date()
    }

    const task = await db.task.update({
      where: { id },
      data: updatePayload,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, type: true, status: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task with ownership validation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check task exists and belongs to user
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

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
