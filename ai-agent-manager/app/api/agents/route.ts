import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { createAgentSchema, agentQuerySchema } from '@/lib/validations/agent'
import { Prisma } from '@prisma/client'

// GET /api/agents - List agents with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedQuery = agentQuerySchema.safeParse(queryParams)
    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedQuery.error.flatten() },
        { status: 400 }
      )
    }

    const { page, limit, search, type, status, projectId, sortBy, sortOrder } = validatedQuery.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.AgentWhereInput = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
      ...(status && { status }),
      ...(projectId && { projectId }),
    }

    // Get agents with pagination
    const [agents, total] = await Promise.all([
      db.agent.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              conversations: true,
              tasks: true,
            },
          },
        },
      }),
      db.agent.count({ where }),
    ])

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const validatedData = createAgentSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validatedData.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, type, systemPrompt, tools, config, projectId } = validatedData.data

    // Verify project belongs to user if projectId is provided
    if (projectId) {
      const project = await db.project.findFirst({
        where: {
          id: projectId,
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

    const agent = await db.agent.create({
      data: {
        name,
        description,
        type,
        systemPrompt,
        tools,
        config: config as Prisma.InputJsonValue,
        userId: session.user.id,
        projectId,
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
        action: 'CREATE',
        resource: 'AGENT',
        resourceId: agent.id,
        metadata: { agentName: agent.name },
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
