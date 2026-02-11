import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { CreateTaskSchema, TaskQuerySchema } from '@/lib/validations/task'
import { shouldRequireReview } from '@/lib/trust-metrics'

/**
 * GET /api/tasks
 * List tasks with filtering and pagination
 * Ownership-based access control: users can only see their own tasks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    const parsed = TaskQuerySchema.safeParse(query)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      projectId,
      status,
      priority,
      assigneeId,
      agentId,
      requiresReview,
      page,
      limit,
    } = parsed.data

    // Build where clause with ownership check
    const where: Record<string, unknown> = {
      createdById: session.user.id,
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (agentId) where.agentId = agentId
    if (requiresReview !== undefined) where.requiresReview = requiresReview

    const skip = (page - 1) * limit

    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true, image: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          agent: { select: { id: true, name: true, type: true, status: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      db.task.count({ where }),
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * Create a new task with trust fields as first-class citizens
 * Auto-flags for review if confidence is low
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CreateTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      agentId,
      dueDate,
      confidenceScore,
      reasoningLog,
      executionSteps,
      requiresReview,
    } = parsed.data

    // Validate project belongs to user if provided
    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId: session.user.id },
      })
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Validate agent belongs to user if provided
    if (agentId) {
      const agent = await db.agent.findFirst({
        where: { id: agentId, userId: session.user.id },
      })
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Auto-flag for review based on confidence - trust calibration feature
    const autoRequiresReview = requiresReview || shouldRequireReview(confidenceScore ?? null)

    const task = await db.task.create({
      data: {
        title,
        description: description ?? null,
        status,
        priority,
        projectId: projectId ?? null,
        assigneeId: assigneeId ?? null,
        agentId: agentId ?? null,
        createdById: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        // Trust fields - first-class features
        confidenceScore: confidenceScore ?? null,
        reasoningLog: reasoningLog ?? null,
        executionSteps: executionSteps ?? null,
        requiresReview: autoRequiresReview,
        // Track first attempt for retry velocity metric
        firstAttemptAt: status === 'IN_PROGRESS' ? new Date() : null,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, type: true, status: true } },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
