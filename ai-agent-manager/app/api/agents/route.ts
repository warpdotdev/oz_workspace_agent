import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/auth'

const prisma = new PrismaClient()

// GET /api/agents - List all agents for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // For development, use a mock user if no session
    const userId = session?.user?.id || 'mock-user-id'

    const agents = await prisma.agent.findMany({
      where: { userId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Failed to fetch agents:', error)
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
    const userId = session?.user?.id || 'mock-user-id'

    const body = await request.json()
    const { name, description, type, systemPrompt, tools } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    const agent = await prisma.agent.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type,
        systemPrompt: systemPrompt || null,
        tools: tools || [],
        userId,
      },
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
