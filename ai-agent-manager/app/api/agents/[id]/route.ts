import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating an agent
const updateAgentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters').optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
  type: z.enum(['CODING', 'RESEARCH', 'ANALYSIS', 'GENERAL', 'CUSTOM']).optional(),
  status: z.enum(['IDLE', 'RUNNING', 'PAUSED', 'ERROR', 'TERMINATED']).optional(),
  systemPrompt: z.string().optional().nullable(),
  tools: z.array(z.string()).optional(),
  config: z.record(z.string(), z.unknown()).optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/agents/[id] - Get a single agent
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const agent = await db.agent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            conversations: true,
          },
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

// PUT /api/agents/[id] - Update an agent
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check agent exists and belongs to user
    const existingAgent = await db.agent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = await request.json()
    const validationResult = updateAgentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Build update data, converting null configs to Prisma's JsonNull
    const prismaUpdateData: Record<string, unknown> = {}
    if (updateData.name !== undefined) prismaUpdateData.name = updateData.name
    if (updateData.description !== undefined) prismaUpdateData.description = updateData.description
    if (updateData.type !== undefined) prismaUpdateData.type = updateData.type
    if (updateData.status !== undefined) prismaUpdateData.status = updateData.status
    if (updateData.systemPrompt !== undefined) prismaUpdateData.systemPrompt = updateData.systemPrompt
    if (updateData.tools !== undefined) prismaUpdateData.tools = updateData.tools
    if (updateData.config !== undefined) {
      prismaUpdateData.config = updateData.config === null ? undefined : updateData.config
    }

    const agent = await db.agent.update({
      where: { id },
      data: prismaUpdateData,
    })

    // Create audit log for agent update
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        agentId: agent.id,
        action: 'UPDATE',
        resource: 'AGENT',
        resourceId: agent.id,
        metadata: { updatedFields: Object.keys(updateData) },
      },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

// DELETE /api/agents/[id] - Delete an agent
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check agent exists and belongs to user
    const existingAgent = await db.agent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Create audit log before deletion
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        resource: 'AGENT',
        resourceId: id,
        metadata: { name: existingAgent.name, type: existingAgent.type },
      },
    })

    await db.agent.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}
