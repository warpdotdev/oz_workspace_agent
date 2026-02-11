import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Validation schema for creating an agent
const createAgentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  type: z.enum(['CODING', 'RESEARCH', 'ANALYSIS', 'GENERAL', 'CUSTOM']),
  systemPrompt: z.string().optional(),
  tools: z.array(z.string()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  projectId: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agents = await db.agent.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        description: true,
        tools: true,
        createdAt: true,
        updatedAt: true,
        confidenceScore: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createAgentSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, type, systemPrompt, tools, config, projectId } = validationResult.data

    const agent = await db.agent.create({
      data: {
        name,
        description: description || null,
        type,
        systemPrompt: systemPrompt || null,
        tools: tools || [],
        config: config ? (config as Prisma.InputJsonValue) : Prisma.JsonNull,
        projectId: projectId || null,
        userId: session.user.id,
      },
    })

    // Create audit log for agent creation
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        agentId: agent.id,
        action: 'CREATE',
        resource: 'AGENT',
        resourceId: agent.id,
        metadata: { name, type },
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
