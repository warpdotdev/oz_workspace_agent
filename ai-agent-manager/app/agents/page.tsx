import Link from 'next/link'
import { Plus, Bot } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { AgentCard } from '@/components/agents/agent-card'

async function getAgents(userId: string) {
  return db.agent.findMany({
    where: { userId },
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
}

export default async function AgentsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const agents = await getAgents(session.user.id)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
            <p className="text-muted-foreground">
              Create and manage your AI agents
            </p>
          </div>
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Link>
          </Button>
        </div>

        {/* Agent Grid */}
        {agents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={{
                  ...agent,
                  type: agent.type as any,
                  status: agent.status as any,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No agents yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Get started by creating your first AI agent. Choose from templates
              or build a custom agent from scratch.
            </p>
            <Button asChild className="mt-6">
              <Link href="/agents/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
