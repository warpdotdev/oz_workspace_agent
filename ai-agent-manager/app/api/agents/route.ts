import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { createAgentSchema } from '@/lib/validations/agent'

// GET /api/agents - List all agents for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const projectId = searchParams.get('projectId')

    const agents = await db.agent.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status: status as any }),
        ...(type && { type: type as any }),
        ...(projectId && { projectId }),
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
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAgentSchema.parse(body)

    const agent = await db.agent.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        systemPrompt: validatedData.systemPrompt,
        tools: validatedData.tools,
        config: validatedData.config ?? {},
        userId: session.user.id,
        projectId: validatedData.projectId,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        agentId: agent.id,
        action: 'CREATE',
        resource: 'AGENT',
        resourceId: agent.id,
        metadata: {
          agentName: agent.name,
          agentType: agent.type,
        },
      },
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating agent:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
