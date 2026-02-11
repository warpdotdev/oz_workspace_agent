import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { AgentCreateForm } from '@/components/agents/agent-create-form'

export default async function NewAgentPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Agent</h1>
            <p className="text-muted-foreground">
              Set up a new AI agent to help with your tasks
            </p>
          </div>
        </div>

        {/* Form */}
        <AgentCreateForm />
      </div>
    </DashboardLayout>
  )
}
