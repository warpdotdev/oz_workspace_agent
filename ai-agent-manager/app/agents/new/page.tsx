import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AgentForm } from '@/components/agents/agent-form'

export default function NewAgentPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
          <p className="text-muted-foreground mt-2">
            Configure a new AI agent with custom capabilities and behavior
          </p>
        </div>
        <AgentForm />
      </div>
    </DashboardLayout>
  )
}
