import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { updateAgentSchema } from '@/lib/validations/agent'

type RouteParams = {
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
        tasks: {
          take: 10,
          orderBy: {
            updatedAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            updatedAt: true,
          },
        },
        conversations: {
          take: 5,
          orderBy: {
            updatedAt: 'desc',
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            conversations: true,
            auditLogs: true,
          },
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent })
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

    // Verify ownership
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
    const validatedData = updateAgentSchema.parse(body)

    // Build update data object
    const updateData: Parameters<typeof db.agent.update>[0]['data'] = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.type) updateData.type = validatedData.type
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.systemPrompt !== undefined) updateData.systemPrompt = validatedData.systemPrompt
    if (validatedData.tools) updateData.tools = validatedData.tools
    if (validatedData.config !== undefined) updateData.config = validatedData.config as any
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId

    const agent = await db.agent.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        agentId: agent.id,
        action: 'UPDATE',
        resource: 'AGENT',
        resourceId: agent.id,
        metadata: {
          changes: Object.keys(validatedData),
        },
      },
    })

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error('Error updating agent:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

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

    // Verify ownership
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
        metadata: {
          agentName: existingAgent.name,
          agentType: existingAgent.type,
        },
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
