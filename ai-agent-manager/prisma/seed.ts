import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const adminPassword = await hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', admin.email)

  // Create regular user
  const userPassword = await hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Demo User',
      password: userPassword,
      role: 'USER',
    },
  })

  console.log('Created regular user:', user.email)

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'Sample AI Agent Project',
      description: 'A sample project to demonstrate the AI Agent Management Platform',
      userId: admin.id,
      status: 'active',
    },
  })

  console.log('Created project:', project.name)

  // Create sample agents
  const codingAgent = await prisma.agent.create({
    data: {
      name: 'Code Assistant',
      description: 'AI agent specialized in writing and reviewing code',
      type: 'CODING',
      status: 'IDLE',
      userId: admin.id,
      projectId: project.id,
      systemPrompt: 'You are an expert software engineer assistant.',
      tools: ['code_execution', 'file_operations', 'git'],
    },
  })

  const researchAgent = await prisma.agent.create({
    data: {
      name: 'Research Assistant',
      description: 'AI agent for research and information gathering',
      type: 'RESEARCH',
      status: 'IDLE',
      userId: admin.id,
      projectId: project.id,
      systemPrompt: 'You are a research assistant specialized in finding and analyzing information.',
      tools: ['web_search', 'document_analysis'],
    },
  })

  console.log('Created agents:', codingAgent.name, researchAgent.name)

  // Create sample tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Implement user authentication',
        description: 'Set up NextAuth.js with email and OAuth providers',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
        assigneeId: admin.id,
        agentId: codingAgent.id,
        createdById: admin.id,
      },
      {
        title: 'Design database schema',
        description: 'Create comprehensive Prisma schema for the application',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        assigneeId: admin.id,
        agentId: codingAgent.id,
        createdById: admin.id,
      },
      {
        title: 'Research AI frameworks',
        description: 'Research and compare LangChain, LangGraph, and other frameworks',
        status: 'REVIEW',
        priority: 'MEDIUM',
        projectId: project.id,
        agentId: researchAgent.id,
        createdById: admin.id,
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        createdById: admin.id,
      },
    ],
  })

  console.log('Created tasks:', tasks.count)

  // Create a sample conversation
  const conversation = await prisma.conversation.create({
    data: {
      agentId: codingAgent.id,
      userId: admin.id,
      title: 'Help with React components',
      status: 'ACTIVE',
      messages: {
        create: [
          {
            role: 'USER',
            content: 'Can you help me create a reusable button component in React?',
          },
          {
            role: 'ASSISTANT',
            content:
              'Of course! I can help you create a reusable button component. Here\'s a good starting point using TypeScript and Tailwind CSS...',
          },
        ],
      },
    },
  })

  console.log('Created conversation:', conversation.id)

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'USER_LOGIN',
        resource: 'auth',
        metadata: { method: 'credentials' },
      },
      {
        userId: admin.id,
        agentId: codingAgent.id,
        action: 'AGENT_CREATED',
        resource: 'agent',
        resourceId: codingAgent.id,
      },
      {
        userId: admin.id,
        action: 'PROJECT_CREATED',
        resource: 'project',
        resourceId: project.id,
      },
    ],
  })

  console.log('Created audit logs')
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
