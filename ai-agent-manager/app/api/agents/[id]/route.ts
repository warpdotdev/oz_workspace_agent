import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { updateAgentSchema } from '@/lib/validations/agent'
import { Prisma } from '@prisma/client'

// GET /api/agents/[id] - Get a single agent by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
            status: true,
          },
        },
        _count: {
          select: {
            conversations: true,
            tasks: true,
          },
        },
      },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    const validatedData = updateAgentSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validatedData.error.flatten() },
        { status: 400 }
      )
    }

    // Check if agent exists and belongs to user
    const existingAgent = await db.agent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    const updateData = validatedData.data

    // Verify project belongs to user if projectId is provided
    if (updateData.projectId !== undefined && updateData.projectId !== null) {
      const project = await db.project.findFirst({
        where: {
          id: updateData.projectId,
          userId: session.user.id,
        },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
    }

    const agent = await db.agent.update({
      where: { id },
      data: {
        ...updateData,
        config: updateData.config as Prisma.InputJsonValue | undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
          agentName: agent.name,
          changes: updateData,
        },
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if agent exists and belongs to user
    const existingAgent = await db.agent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Create audit log before deletion
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        agentId: existingAgent.id,
        action: 'DELETE',
        resource: 'AGENT',
        resourceId: existingAgent.id,
        metadata: { 
          agentName: existingAgent.name,
        },
      },
    })

    // Delete agent (cascades to conversations and tasks)
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
